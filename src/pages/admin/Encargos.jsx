import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card, Button, Select, Table, Badge, Modal, SectionTitle, Spinner } from '../../components/ui'
import { getEncargosDoMes, getUnidades, updateEncargo } from '../../services/firestore'
import { uploadPDF } from '../../services/storage'
import { downloadDemonstrativo, getDemonstrativoBlob } from '../../utils/pdfGenerator'
import { formatCurrency, getMesLabel, MESES, getAnos, STATUS_CONFIG, CAMPOS_ENCARGO } from '../../utils/formatters'
import { Pencil, FileDown, Upload, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Encargos() {
  const [ano,       setAno]       = useState(String(new Date().getFullYear()))
  const [mes,       setMes]       = useState(MESES[new Date().getMonth()].value)
  const [encargos,  setEncargos]  = useState([])
  const [unidades,  setUnidades]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [modal,     setModal]     = useState(false)
  const [selecionado, setSelecionado] = useState(null)
  const [formEdit,  setFormEdit]  = useState({})
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(null)

  async function carregar() {
    setLoading(true)
    const [enc, uni] = await Promise.all([getEncargosDoMes(ano, mes), getUnidades()])
    // Enriquecer com nome da unidade
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
      await updateEncargo(ano, mes, selecionado.id, formEdit)
      toast.success('Encargo atualizado!')
      setModal(false)
      carregar()
    } catch (e) {
      toast.error('Erro: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function marcarPago(enc) {
    await updateEncargo(ano, mes, enc.id, { status: 'pago' })
    toast.success('Marcado como pago')
    carregar()
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

  const grupos = ['GPS', 'DARF', 'FGTS', 'Benefícios', 'Total']

  return (
    <AdminLayout>
      <SectionTitle
        title="Encargos"
        subtitle="Visualize e edite os encargos por período"
      />

      <div className="flex gap-3 mb-6">
        <Select value={ano} onChange={e => setAno(e.target.value)} className="w-28">
          {getAnos().map(a => <option key={a}>{a}</option>)}
        </Select>
        <Select value={mes} onChange={e => setMes(e.target.value)} className="w-40">
          {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
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
          <Table columns={columns} data={encargos} emptyMessage={`Nenhum encargo lançado para ${getMesLabel(mes)} / ${ano}.`} />
        </Card>
      )}

      {/* Modal edição */}
      <Modal open={modal} onClose={() => setModal(false)} title={`Editar — ${selecionado?.nomeUnidade}`} size="lg">
        {selecionado && (
          <div className="space-y-6">
            {grupos.map(grupo => {
              const campos = CAMPOS_ENCARGO.filter(c => c.grupo === grupo)
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
                          readOnly={c.readonly}
                          value={formEdit[c.key] ?? 0}
                          onChange={e => setFormEdit(f => ({ ...f, [c.key]: parseFloat(e.target.value) || 0 }))}
                          className={`px-3 py-2 text-sm rounded-xl border font-mono
                            ${c.readonly ? 'bg-surface-50 text-surface-200 border-surface-100' : 'border-surface-200 focus:ring-2 focus:ring-brand-300 focus:outline-none'}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

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
