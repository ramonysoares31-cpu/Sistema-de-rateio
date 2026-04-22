import { useState, useRef } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card, Button, Select, SectionTitle, Table, Badge } from '../../components/ui'
import { getUnidades } from '../../services/firestore'
import { importarEncargosEmLote, registrarImportacao } from '../../services/firestore'
import { parseImportacao, gerarPlanilhaModelo } from '../../utils/importParser'
import { formatCurrency, getMesLabel, MESES, getAnos } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'
import { Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ImportarEncargos() {
  const { user } = useAuth()
  const fileRef  = useRef(null)

  const [ano,       setAno]       = useState(String(new Date().getFullYear()))
  const [mes,       setMes]       = useState(MESES[new Date().getMonth()].value)
  const [arquivo,   setArquivo]   = useState(null)
  const [preview,   setPreview]   = useState(null)   // { registros, erros }
  const [loading,   setLoading]   = useState(false)
  const [importing, setImporting] = useState(false)
  const [resultado, setResultado] = useState(null)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setArquivo(file)
    setPreview(null)
    setResultado(null)
    setLoading(true)
    try {
      const unidades = await getUnidades()
      const parsed   = await parseImportacao(file, unidades)
      setPreview(parsed)
    } catch (err) {
      toast.error('Erro ao ler arquivo: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function confirmarImportacao() {
    if (!preview?.registros?.length) return
    setImporting(true)
    try {
      const result = await importarEncargosEmLote(ano, mes, preview.registros)
      await registrarImportacao({
        arquivo: arquivo.name,
        ano: Number(ano),
        mes,
        totalLinhas: preview.registros.length + preview.erros.length,
        linhasImportadas: result.importados,
        erros: result.erros,
        criadoPor: user.uid,
      })
      setResultado(result)
      setPreview(null)
      setArquivo(null)
      fileRef.current.value = ''
      toast.success(`${result.importados} registros importados com sucesso!`)
    } catch (err) {
      toast.error('Erro na importação: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  const colsPreview = [
    { key: 'cnpj',        label: 'CNPJ',       render: r => <span className="font-mono text-xs">{r.cnpj}</span> },
    { key: 'nomeUnidade', label: 'Unidade' },
    { key: 'nFuncionarios', label: 'Func.',     align: 'right' },
    { key: 'salarioBase', label: 'Sal. Base',   align: 'right', render: r => formatCurrency(r.salarioBase) },
    { key: 'totalGPS',    label: 'GPS',         align: 'right', render: r => formatCurrency(r.totalGPS) },
    { key: 'totalDARF',   label: 'DARF',        align: 'right', render: r => formatCurrency(r.totalDARF) },
    { key: 'totalFGTS',   label: 'FGTS',        align: 'right', render: r => formatCurrency(r.totalFGTS) },
    { key: 'totalGeral',  label: 'Total Geral', align: 'right', render: r => (
      <span className="font-semibold">{formatCurrency(r.totalGeral)}</span>
    )},
  ]

  return (
    <AdminLayout>
      <SectionTitle
        title="Importar Encargos"
        subtitle="Faça upload da planilha Excel ou CSV com os dados do mês"
        action={
          <Button variant="secondary" onClick={gerarPlanilhaModelo}>
            <Download size={15} /> Baixar Modelo
          </Button>
        }
      />

      {/* Config */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Select label="Ano" value={ano} onChange={e => setAno(e.target.value)}>
            {getAnos().map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Select label="Mês" value={mes} onChange={e => setMes(e.target.value)}>
            {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-surface-800 font-body">Arquivo (.xlsx ou .csv)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              className="text-sm font-body file:mr-3 file:py-1.5 file:px-3 file:rounded-lg
                file:border-0 file:text-xs file:font-medium file:bg-brand-50 file:text-brand-700
                hover:file:bg-brand-100 cursor-pointer"
            />
          </div>
        </div>

        {arquivo && (
          <div className="flex items-center gap-2 text-sm text-surface-800 bg-surface-50 rounded-xl px-4 py-2">
            <Upload size={14} className="text-brand-600" />
            <span>{arquivo.name}</span>
            <span className="text-surface-200 ml-auto">{(arquivo.size / 1024).toFixed(1)} KB</span>
          </div>
        )}
      </Card>

      {/* Loading */}
      {loading && (
        <Card className="p-8 text-center">
          <div className="flex items-center justify-center gap-3 text-brand-600">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm font-medium">Lendo e validando planilha...</span>
          </div>
        </Card>
      )}

      {/* Preview */}
      {preview && (
        <>
          {/* Erros */}
          {preview.erros.length > 0 && (
            <Card className="p-4 mb-4 border-red-200 bg-red-50">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={16} className="text-red-500" />
                <span className="text-sm font-medium text-red-800">{preview.erros.length} linhas com erro — não serão importadas</span>
              </div>
              <ul className="space-y-1">
                {preview.erros.map((e, i) => (
                  <li key={i} className="text-xs text-red-700">
                    Linha {e.linha}: <span className="font-medium">{e.cnpj || e.nome}</span> — {e.erro}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Resumo */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Badge label={`${preview.registros.length} registros válidos`} color="bg-emerald-100 text-emerald-800" />
              <span className="text-sm text-surface-200">
                Período: <strong>{getMesLabel(mes)} / {ano}</strong>
              </span>
              <span className="text-sm font-semibold text-surface-900">
                Total: {formatCurrency(preview.registros.reduce((s, r) => s + (r.totalGeral || 0), 0))}
              </span>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { setPreview(null); fileRef.current.value = '' }}>
                Cancelar
              </Button>
              <Button loading={importing} onClick={confirmarImportacao}>
                <CheckCircle size={15} /> Confirmar Importação
              </Button>
            </div>
          </div>

          <Card>
            <Table columns={colsPreview} data={preview.registros} emptyMessage="Nenhum registro válido." />
          </Card>
        </>
      )}

      {/* Resultado */}
      {resultado && (
        <Card className="p-6 border-emerald-200 bg-emerald-50">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={20} className="text-emerald-600" />
            <h3 className="font-semibold text-emerald-900">Importação concluída!</h3>
          </div>
          <p className="text-sm text-emerald-800">
            <strong>{resultado.importados}</strong> registros importados para <strong>{getMesLabel(mes)} / {ano}</strong>.
          </p>
          {resultado.erros?.length > 0 && (
            <p className="text-sm text-amber-700 mt-1">
              <AlertCircle size={13} className="inline mr-1" />
              {resultado.erros.length} registros não puderam ser importados.
            </p>
          )}
          <Button className="mt-4" variant="secondary" onClick={() => setResultado(null)}>
            Nova Importação
          </Button>
        </Card>
      )}
    </AdminLayout>
  )
}
