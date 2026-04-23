import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card, Button, Select, Table, Badge, Modal, SectionTitle, Spinner } from '../../components/ui'
import { getEncargosDoMes, getUnidades, updateEncargo, setEncargoUnidade } from '../../services/firestore'
import { uploadPDF } from '../../services/storage'
import { downloadDemonstrativo, getDemonstrativoBlob } from '../../utils/pdfGenerator'
import { formatCurrency, getMesLabel, MESES, getAnos, STATUS_CONFIG, CAMPOS_ENCARGO } from '../../utils/formatters'
import { Pencil, FileDown, Upload, CheckCircle, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

// Valores zerados para um novo encargo
const ENCARGO_VAZIO = {
  salarioBase: 0, nFuncionarios: 0,
  empregado: 0, empresa: 0, terceiros: 0, ratAjustado: 0,
  salarioFamilia: 0, salarioMaternidade: 0,
  pis8301: 0, irrf0561: 0, irrfCongruas: 0, irrf1708: 0,
  cofins5960: 0, pis5979: 0, csll5987: 0, inss1162: 0,
  fgts: 0, consignado: 0,
  sst: 0, odonto: 0, seguroVida: 0,
  totalGPS: 0, totalDARF: 0, totalFGTS: 0, totalGeral: 0,
  status: 'pendente',
}

// Calcula totais automaticamente
function calcularTotais(f) {
  const totalGPS  = (f.empregado||0) + (f.empresa||0) + (f.terceiros||0) + (f.ratAjustado||0)
                  - (f.salarioFamilia||0) - (f.salarioMaternidade||0)
  const totalDARF = (f.pis8301||0) + (f.irrf0561||0) + (f.irrfCongruas||0) + (f.irrf1708||0)
                  + (f.cofins5960||0) + (f.pis5979||0) + (f.csll5987||0) + (f.inss1162||0)
  const totalFGTS = (f.fgts||0) + (f.consignado||0)
  const totalGeral = totalGPS + totalDARF + totalFGTS + (f.sst||0) + (f.odonto||0) + (f.seguroVida||0)
  return { ...f, totalGPS, totalDARF, totalFGTS, totalGeral }
}

export default function Encargos() {
  const [ano,         setAno]         = useState(String(new Date().getFullYear()))
  const [mes,         setMes]         = useState(MESES[new Date().getMonth()].value)
  const [encargos,    setEncargos]    = useState([])
  const [unidades,    setUnidades]    = useState([])
  const [loading,     setLoading]     = useState(false)
  const [modal,       setModal]       = useState(false)
  const [modalNovo,   setModalNovo]   = useState(false)
  const [selecionado, setSelecionado] = useState(null)
  const [formEdit,    setFormEdit]    = useState({})
  const [formNovo,    setFormNovo]    = useState({ ...ENCARGO_VAZIO })
  const [unidadeNova, setUnidadeNova] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [uploading,   setUploading]   = useState(null)

  async function carregar() {
    setLoading(true)
    const [enc, uni] = await Promise.all([getEncargosDoMes(ano, mes), getUnidades()])
    const mapa = Object.fromEntries(uni.map(u => [u.id, u]))
    setEncargos(enc.map(e => ({ ...e, nomeUnidade: mapa[e.id]?.nome || e.id })))
    setUnidades(uni)
    setLoading(false)
  }

  useEffect(() => { carregar() }, [ano, mes])

  // ── Abrir modal de edição ──────────────────────────────────────────────────
  function abrirEditar(enc) {
    setSelecionado(enc)
    setFormEdit({ ...enc })
    setModal(true)
  }

  // ── Salvar edição ──────────────────────────────────────────────────────────
  async function salvarEdicao() {
    setSaving(true)
    try {
      const comTotais = calcularTotais(formEdit)
      await updateEncargo(ano, mes, selecionado.id, comTotais)
      toast.success('Encargo atualizado!')
      setModal(false)
      carregar()
    } catch (e) {
      toast.error('Erro: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Abrir modal de novo encargo ────────────────────────────────────────────
  function abrirNovo() {
    setFormNovo({ ...ENCARGO_VAZIO })
    setUnidadeNova(unidades[0]?.id || '')
    setModalNovo(true)
  }

  // ── Salvar novo encargo ────────────────────────────────────────────────────
  async function salvarNovo() {
    if (!unidadeNova) return toast.error('Selecione uma unidade!')

    // Verificar se já existe encargo para essa unidade neste mês/ano
    const jaExiste = encargos.find(e => e.id === unidadeNova)
    if (jaExiste) {
      toast.error('Já existe um encargo para essa unidade neste mês!')
      return
    }

    setSaving(true)
    try {
      const comTotais = calcularTotais(formNovo)
      await setEncargoUnidade(ano, mes, unidadeNova, {
        ...comTotais,
        status: 'pendente',
        pdfUrl: '',
        pdfGerado: false,
      })
      toast.success('Encargo criado com sucesso!')
      setModalNovo(false)
      carregar()
    } catch (e) {
      toast.error('Erro: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Atualizar campo do novo encargo ───────────────────────────────────────
  function atualizarCampoNovo(key, value) {
    setFormNovo(f => calcularTotais({ ...f, [key]: parseFloat(value) || 0 }))
  }

  // ── Atualizar campo da edição ──────────────────────────────────────────────
  function atualizarCampoEdit(key, value) {
    setFormEdit(f => calcularTotais({ ...f, [key]: parseFloat(value) || 0 }))
  }

  // ── Marcar como pago ───────────────────────────────────────────────────────
  async function marcarPago(enc) {
    await updateEncargo(ano, mes, enc.id, { status: 'pago' })
    toast.success('Marcado como pago')
    carregar()
  }

  // ── Gerar e fazer upload de PDF ───────────────────────────────────────────
  async function gerarEFazerUploadPDF(enc) {
    const unidade = unidades.find(u => u.id === enc.id)
    if (!unidade) return toast.error('Unidade não encontrada')
    setUploading(enc.id)
    try {
      const blob = getDemonstrativoBlob(enc, unidade, mes, ano)
      const file = new File([blob], `demonstrativo.pdf`, { type: 'application/pdf' })
      const url  = await uploadPDF(ano, mes, enc.id, file)
      await updateEncargo(ano, mes, enc.id, { pdfUrl: url, pdfGerado: true })
      toast.success('PDF gerado e salvo!')
      carregar()
    } catch (e) {
      toast.error('Erro: ' + e.message)
    } finally {
      setUploading(null)
    }
  }

  async function handleUploadManual(enc, file) {
    setUploading(enc.id)
    try {
      const url = await uploadPDF(ano, mes, enc.id, file)
      await updateEncargo(ano, mes, enc.id, { pdfUrl: url, pdfGerado: false })
      toast.success('PDF enviado!')
      carregar()
    } catch (e) {
      toast.error('Erro: ' + e.message)
    } finally {
      setUploading(null)
    }
  }

  // ── Colunas da tabela ──────────────────────────────────────────────────────
  const columns = [
    { key: 'nomeUnidade', label: 'Unidade' },
    { key: 'nFuncionarios', label: 'Func.', align: 'right' },
    { key: 'totalGPS',   label: 'GPS',     align: 'right', render: r => formatCurrency(r.totalGPS) },
    { key: 'totalDARF',  label: 'DARF',    align: 'right', render: r => formatCurrency(r.totalDARF) },
    { key: 'totalFGTS',  label: 'FGTS',    align: 'right', render: r => formatCurrency(r.totalFGTS) },
    { key: 'totalGeral', label: 'Total',   align: 'right', render: r => (
      <span className="font-semibold">{formatCurrency(r.totalGeral)}</span>
    )},
    { key: 'status', label: 'Status', render: r => {
      const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.pendente
      return <Badge label={st.label} color={st.color} />
    }},
    { key: 'pdf', label: 'PDF', render: r => r.pdfUrl ? (
      <a href={r.pdfUrl} target="_blank" rel="noreferrer"
        className="text-brand-600 hover:underline text-xs flex items-center gap-1">
        <FileDown size={12} /> Ver PDF
      </a>
    ) : <span className="text-xs text-surface-200">—</span>},
    { key: 'acoes', label: '', render: r => (
      <div className="flex items-center gap-1 justify-end">
        <Button size="sm" variant="ghost" onClick={() => abrirEditar(r)}>
          <Pencil size={12} />
        </Button>
        {r.status !== 'pago' && (
          <Button size="sm" variant="ghost" onClick={() => marcarPago(r)} title="Marcar como pago">
            <CheckCircle size={12} className="text-emerald-600" />
          </Button>
        )}
        <Button
          size="sm" variant="ghost"
          loading={uploading === r.id}
          onClick={() => gerarEFazerUploadPDF(r)}
          title="Gerar PDF"
        >
          <Upload size={12} />
        </Button>
        <label className="cursor-pointer">
          <input type="file" accept=".pdf" className="hidden"
            onChange={e => e.target.files[0] && handleUploadManual(r, e.target.files[0])} />
          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs hover:bg-surface-100 text-surface-800 gap-1 cursor-pointer">
            <FileDown size={12} /> Upload
          </span>
        </label>
      </div>
    )},
  ]

  const grupos = ['GPS', 'DARF', 'FGTS', 'Benefícios']

  // ── Componente do formulário de campos ─────────────────────────────────────
  function CamposEncargo({ form, onChange }) {
    return (
      <div className="space-y-6">
        {grupos.map(grupo => {
          const campos = CAMPOS_ENCARGO.filter(c => c.grupo === grupo && !c.readonly)
          return (
            <div key={grupo}>
              <h4 className="text-xs font-semibold text-surface-200 uppercase tracking-wider mb-3 pb-1 border-b border-surface-100">
                {grupo}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {campos.map(c => (
                  <div key={c.key} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-surface-800">{c.label}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form[c.key] ?? 0}
                      onChange={e => onChange(c.key, e.target.value)}
                      className="px-3 py-2 text-sm rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-300 focus:outline-none font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Totais (somente leitura) */}
        <div>
          <h4 className="text-xs font-semibold text-surface-200 uppercase tracking-wider mb-3 pb-1 border-b border-surface-100">
            Totais (calculados automaticamente)
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'totalGPS',   label: 'Total GPS' },
              { key: 'totalDARF',  label: 'Total DARF' },
              { key: 'totalFGTS',  label: 'Total FGTS' },
              { key: 'totalGeral', label: 'Total Geral' },
            ].map(c => (
              <div key={c.key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-surface-800">{c.label}</label>
                <input
                  type="text"
                  readOnly
                  value={formatCurrency(form[c.key] ?? 0)}
                  className="px-3 py-2 text-sm rounded-xl border bg-surface-50 text-surface-400 border-surface-100 font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <SectionTitle
        title="Encargos"
        subtitle="Visualize, edite e adicione encargos por período"
      />

      {/* Filtros + botão novo */}
      <div className="flex gap-3 mb-6 items-center justify-between">
        <div className="flex gap-3">
          <Select value={ano} onChange={e => setAno(e.target.value)} className="w-28">
            {getAnos().map(a => <option key={a}>{a}</option>)}
          </Select>
          <Select value={mes} onChange={e => setMes(e.target.value)} className="w-40">
            {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </div>

        {/* Botão Novo Encargo */}
        <Button onClick={abrirNovo} className="flex items-center gap-2">
          <Plus size={16} />
          Novo Encargo
        </Button>
      </div>

      {/* Totalizador */}
      {encargos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { l: 'Total GPS',   v: encargos.reduce((s,e) => s+(e.totalGPS||0),0) },
            { l: 'Total DARF',  v: encargos.reduce((s,e) => s+(e.totalDARF||0),0) },
            { l: 'Total Geral', v: encargos.reduce((s,e) => s+(e.totalGeral||0),0) },
          ].map(({ l, v }) => (
            <Card key={l} className="px-4 py-3">
              <p className="text-xs text-surface-200">{l}</p>
              <p className="font-mono font-bold text-surface-900 text-lg">{formatCurrency(v)}</p>
            </Card>
          ))}
        </div>
      )}

      {loading ? <Spinner /> : (
        <Card>
          <Table columns={columns} data={encargos} emptyMessage={`Nenhum encargo lançado para ${getMesLabel(mes)} / ${ano}. Clique em "Novo Encargo" para adicionar.`} />
        </Card>
      )}

      {/* ── Modal: NOVO ENCARGO ──────────────────────────────────────────────── */}
      <Modal open={modalNovo} onClose={() => setModalNovo(false)} title="Novo Encargo" size="lg">
        <div className="space-y-5">

          {/* Seleção de Unidade e Período */}
          <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
            <h4 className="text-xs font-semibold text-surface-200 uppercase tracking-wider mb-3">
              Unidade e Período
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-xs font-medium text-surface-800">Ano</label>
                <select
                  value={ano}
                  disabled
                  className="px-3 py-2 text-sm rounded-xl border border-surface-200 bg-surface-50 text-surface-400"
                >
                  <option>{ano}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-xs font-medium text-surface-800">Mês</label>
                <select
                  value={mes}
                  disabled
                  className="px-3 py-2 text-sm rounded-xl border border-surface-200 bg-surface-50 text-surface-400"
                >
                  <option value={mes}>{getMesLabel(mes)}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-xs font-medium text-surface-800">Unidade *</label>
                <select
                  value={unidadeNova}
                  onChange={e => setUnidadeNova(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-300 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {unidades
                    .filter(u => !encargos.find(e => e.id === u.id)) // Só unidades sem encargo no mês
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))
                  }
                </select>
              </div>
            </div>
          </div>

          {/* Campos do encargo */}
          <CamposEncargo
            form={formNovo}
            onChange={atualizarCampoNovo}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalNovo(false)}>Cancelar</Button>
            <Button loading={saving} onClick={salvarNovo} disabled={!unidadeNova}>
              Salvar Encargo
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: EDITAR ENCARGO ────────────────────────────────────────────── */}
      <Modal open={modal} onClose={() => setModal(false)} title={`Editar — ${selecionado?.nomeUnidade}`} size="lg">
        {selecionado && (
          <div className="space-y-6">
            <CamposEncargo
              form={formEdit}
              onChange={atualizarCampoEdit}
            />

            {/* Status e observação */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-surface-800">Status</label>
                <select
                  value={formEdit.status || 'pendente'}
                  onChange={e => setFormEdit(f => ({ ...f, status: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-300 focus:outline-none"
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="inconsistencia">Inconsistência</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-surface-800">Observação</label>
                <input
                  type="text"
                  value={formEdit.observacao || ''}
                  onChange={e => setFormEdit(f => ({ ...f, observacao: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-300 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
              <Button loading={saving} onClick={salvarEdicao}>Salvar Alterações</Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}
