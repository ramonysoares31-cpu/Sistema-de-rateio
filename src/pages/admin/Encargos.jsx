import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card, Button, Select, Table, Badge, Modal, SectionTitle, Spinner } from '../../components/ui'
import { getEncargosDoMes, getUnidades, updateEncargo, setEncargoUnidade, deleteEncargo } from '../../services/firestore'
import { uploadPDF } from '../../services/storage'
import { getDemonstrativoBlob } from '../../utils/pdfGenerator'
import { formatCurrency, getMesLabel, MESES, getAnos, STATUS_CONFIG, CAMPOS_ENCARGO } from '../../utils/formatters'
import { Pencil, FileDown, Upload, CheckCircle, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Valores zerados ────────────────────────────────────────────────────────────
const ENCARGO_VAZIO = {
  salarioBase: '', nFuncionarios: '',
  empregado: '', empresa: '', terceiros: '', ratAjustado: '',
  salarioFamilia: '', salarioMaternidade: '',
  pis8301: '', irrf0561: '', irrfCongruas: '', irrf1708: '',
  cofins5960: '', pis5979: '', csll5987: '', inss1162: '',
  fgts: '', consignado: '',
  sst: '', odonto: '', seguroVida: '',
  totalGPS: 0, totalDARF: 0, totalFGTS: 0, totalGeral: 0,
  status: 'pendente',
}

// ── Calcula totais automaticamente ────────────────────────────────────────────
function calcularTotais(f) {
  const n = v => parseFloat(v) || 0
  const totalGPS   = n(f.empregado) + n(f.empresa) + n(f.terceiros) + n(f.ratAjustado)
                   - n(f.salarioFamilia) - n(f.salarioMaternidade)
  const totalDARF  = n(f.pis8301) + n(f.irrf0561) + n(f.irrfCongruas) + n(f.irrf1708)
                   + n(f.cofins5960) + n(f.pis5979) + n(f.csll5987) + n(f.inss1162)
  const totalFGTS  = n(f.fgts) + n(f.consignado)
  const totalGeral = totalGPS + totalDARF + totalFGTS + n(f.sst) + n(f.odonto) + n(f.seguroVida)
  return { ...f, totalGPS, totalDARF, totalFGTS, totalGeral }
}

const GRUPOS = ['GPS', 'DARF', 'FGTS', 'Benefícios']

// ── Componente de campos FORA do Encargos (evita perda de foco) ───────────────
function CamposEncargo({ form, onChange }) {
  return (
    <div className="space-y-6">
      {GRUPOS.map(grupo => {
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
                    min="0"
                    value={form[c.key] ?? ''}
                    onChange={e => onChange(c.key, e.target.value)}
                    placeholder="0,00"
                    className="px-3 py-2 text-sm rounded-xl border border-surface-200
                      focus:ring-2 focus:ring-brand-300 focus:outline-none font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Totais somente leitura */}
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

// ── Componente principal ───────────────────────────────────────────────────────
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

  function abrirEditar(enc) {
    setSelecionado(enc)
    setFormEdit({ ...enc })
    setModal(true)
  }

  async function salvarEdicao() {
    setSaving(true)
    try {
      await updateEncargo(ano, mes, selecionado.id, calcularTotais(formEdit))
      toast.success('Encargo atualizado!')
      setModal(false)
      carregar()
    } catch (e) {
      toast.error('Erro: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  function abrirNovo() {
    setFormNovo({ ...ENCARGO_VAZIO })
    setUnidadeNova('')
    setModalNovo(true)
  }

  async function salvarNovo() {
    if (!unidadeNova) return toast.error('Selecione uma unidade!')
    if (encargos.find(e => e.id === unidadeNova)) {
      return toast.error('Já existe um encargo para essa unidade neste mês!')
    }
    setSaving(true)
    try {
      const dados = calcularTotais(formNovo)
      await setEncargoUnidade(ano, mes, unidadeNova, {
        ...dados,
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

  function atualizarNovo(key, value) {
    setFormNovo(f => calcularTotais({ ...f, [key]: value }))
  }

  function atualizarEdit(key, value) {
    setFormEdit(f => calcularTotais({ ...f, [key]: value }))
  }

  async function marcarPago(enc) {
    await updateEncargo(ano, mes, enc.id, { status: 'pago' })
    toast.success('Marcado como pago')
    carregar()
  }

  async function excluirEncargo(enc) {
    const confirmado = window.confirm(
      `Tem certeza que deseja excluir o encargo de "${enc.nomeUnidade}"?\n\nEssa ação não pode ser desfeita!`
    )
    if (!confirmado) return
    try {
      await deleteEncargo(ano, mes, enc.id)
      toast.success('Encargo excluído!')
      carregar()
    } catch (e) {
      toast.error('Erro ao excluir: ' + e.message)
    }
  }

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

  const columns = [
    { key: 'nomeUnidade',  label: 'Unidade' },
    { key: 'nFuncionarios',label: 'Func.',  align: 'right' },
    { key: 'totalGPS',     label: 'GPS',    align: 'right', render: r => formatCurrency(r.totalGPS) },
    { key: 'totalDARF',    label: 'DARF',   align: 'right', render: r => formatCurrency(r.totalDARF) },
    { key: 'totalFGTS',    label: 'FGTS',   align: 'right', render: r => formatCurrency(r.totalFGTS) },
    { key: 'totalGeral',   label: 'Total',  align: 'right', render: r => (
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
        <Button size="sm" variant="ghost" onClick={() => abrirEditar(r)} title="Editar">
          <Pencil size={12} />
        </Button>
        {r.status !== 'pago' && (
          <Button size="sm" variant="ghost" onClick={() => marcarPago(r)} title="Marcar como pago">
            <CheckCircle size={12} className="text-emerald-600" />
          </Button>
        )}
        <Button size="sm" variant="ghost" loading={uploading === r.id}
          onClick={() => gerarEFazerUploadPDF(r)} title="Gerar PDF">
          <Upload size={12} />
        </Button>
        <label className="cursor-pointer">
          <input type="file" accept=".pdf" className="hidden"
            onChange={e => e.target.files[0] && handleUploadManual(r, e.target.files[0])} />
          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs hover:bg-surface-100 text-surface-800 gap-1 cursor-pointer">
            <FileDown size={12} /> Upload
          </span>
        </label>
        <Button size="sm" variant="ghost" onClick={() => excluirEncargo(r)} title="Excluir encargo">
          <Trash2 size={12} className="text-red-500" />
        </Button>
      </div>
    )},
  ]

  return (
    <AdminLayout>
      <SectionTitle title="Encargos" subtitle="Visualize, edite e adicione encargos por período" />

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
        <Button onClick={abrirNovo} className="flex items-center gap-2">
          <Plus size={16} /> Novo Encargo
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
          <Table
            columns={columns}
            data={encargos}
            emptyMessage={`Nenhum encargo lançado para ${getMesLabel(mes)} / ${ano}. Clique em "Novo Encargo" para adicionar.`}
          />
        </Card>
      )}

      {/* Modal: NOVO ENCARGO */}
      <Modal open={modalNovo} onClose={() => setModalNovo(false)} title="Novo Encargo" size="lg">
        <div className="space-y-5">
          <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
            <h4 className="text-xs font-semibold text-surface-200 uppercase tracking-wider mb-3">
              Unidade e Período
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-surface-800">Ano</label>
                <input readOnly value={ano}
                  className="px-3 py-2 text-sm rounded-xl border border-surface-100 bg-surface-50 text-surface-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-surface-800">Mês</label>
                <input readOnly value={getMesLabel(mes)}
                  className="px-3 py-2 text-sm rounded-xl border border-surface-100 bg-surface-50 text-surface-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-surface-800">Unidade *</label>
                <select value={unidadeNova} onChange={e => setUnidadeNova(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-300 focus:outline-none">
                  <option value="">Selecione...</option>
                  {unidades
                    .filter(u => !encargos.find(e => e.id === u.id))
                    .map(u => <option key={u.id} value={u.id}>{u.nome}</option>)
                  }
                </select>
              </div>
            </div>
          </div>

          <CamposEncargo form={formNovo} onChange={atualizarNovo} />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalNovo(false)}>Cancelar</Button>
            <Button loading={saving} onClick={salvarNovo} disabled={!unidadeNova}>
              Salvar Encargo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: EDITAR ENCARGO */}
      <Modal open={modal} onClose={() => setModal(false)} title={`Editar — ${selecionado?.nomeUnidade}`} size="lg">
        {selecionado && (
          <div className="space-y-6">
            <CamposEncargo form={formEdit} onChange={atualizarEdit} />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-surface-800">Status</label>
                <select value={formEdit.status || 'pendente'}
                  onChange={e => setFormEdit(f => ({ ...f, status: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-300 focus:outline-none">
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="inconsistencia">Inconsistência</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-surface-800">Observação</label>
                <input type="text" value={formEdit.observacao || ''}
                  onChange={e => setFormEdit(f => ({ ...f, observacao: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-300 focus:outline-none" />
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
