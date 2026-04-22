// ─── Relatórios ───────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card, Button, Select, Table, SectionTitle, Spinner } from '../../components/ui'
import { getEncargosDoMes, getUnidades, updateEncargo } from '../../services/firestore'
import { formatCurrency, getMesLabel, MESES, getAnos } from '../../utils/formatters'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { FileDown } from 'lucide-react'
import toast from 'react-hot-toast'

export function Relatorios() {
  const [ano,      setAno]      = useState(String(new Date().getFullYear()))
  const [mes,      setMes]      = useState(MESES[new Date().getMonth()].value)
  const [dados,    setDados]    = useState([])
  const [loading,  setLoading]  = useState(false)

  async function carregar() {
    setLoading(true)
    const [enc, uni] = await Promise.all([getEncargosDoMes(ano, mes), getUnidades()])
    const mapa = Object.fromEntries(uni.map(u => [u.id, u]))
    setDados(enc.map(e => ({ ...e, nomeUnidade: mapa[e.id]?.nome || e.id, cnpj: mapa[e.id]?.cnpj || '' })))
    setLoading(false)
  }

  useEffect(() => { carregar() }, [ano, mes])

  function exportarExcel() {
    const rows = dados.map(e => ({
      'CNPJ': e.cnpj,
      'Unidade': e.nomeUnidade,
      'Nº Func.': e.nFuncionarios,
      'Salário Base': e.salarioBase,
      'GPS Total': e.totalGPS,
      'DARF Total': e.totalDARF,
      'FGTS Total': e.totalFGTS,
      'SST': e.sst,
      'Odonto': e.odonto,
      'Seguro Vida': e.seguroVida,
      'Total Geral': e.totalGeral,
      'Status': e.status,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `${getMesLabel(mes)} ${ano}`)
    XLSX.writeFile(wb, `relatorio_encargos_${mes}_${ano}.xlsx`)
    toast.success('Excel gerado!')
  }

  function exportarPDF() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('ARQUIDIOCESE DE MACEIÓ — Relatório de Encargos', 14, 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Período: ${getMesLabel(mes)} / ${ano}`, 14, 23)

    autoTable(doc, {
      startY: 28,
      styles: { fontSize: 7, font: 'helvetica' },
      headStyles: { fillColor: [20, 23, 39] },
      head: [['CNPJ', 'Unidade', 'Func.', 'GPS', 'DARF', 'FGTS', 'SST', 'Odonto', 'Total Geral', 'Status']],
      body: dados.map(e => [
        e.cnpj, e.nomeUnidade, e.nFuncionarios,
        formatCurrency(e.totalGPS), formatCurrency(e.totalDARF),
        formatCurrency(e.totalFGTS), formatCurrency(e.sst),
        formatCurrency(e.odonto), formatCurrency(e.totalGeral),
        e.status,
      ]),
      foot: [['', 'TOTAL', dados.reduce((s,e)=>s+(e.nFuncionarios||0),0),
        formatCurrency(dados.reduce((s,e)=>s+(e.totalGPS||0),0)),
        formatCurrency(dados.reduce((s,e)=>s+(e.totalDARF||0),0)),
        formatCurrency(dados.reduce((s,e)=>s+(e.totalFGTS||0),0)),
        formatCurrency(dados.reduce((s,e)=>s+(e.sst||0),0)),
        formatCurrency(dados.reduce((s,e)=>s+(e.odonto||0),0)),
        formatCurrency(dados.reduce((s,e)=>s+(e.totalGeral||0),0)),
        '',
      ]],
      footStyles: { fillColor: [232,236,248], textColor: [20,23,39], fontStyle: 'bold' },
    })

    doc.save(`relatorio_encargos_${mes}_${ano}.pdf`)
    toast.success('PDF gerado!')
  }

  const columns = [
    { key: 'cnpj',         label: 'CNPJ',       render: r => <span className="font-mono text-xs">{r.cnpj}</span> },
    { key: 'nomeUnidade',  label: 'Unidade' },
    { key: 'nFuncionarios',label: 'Func.',       align: 'right' },
    { key: 'totalGPS',     label: 'GPS',         align: 'right', render: r => formatCurrency(r.totalGPS) },
    { key: 'totalDARF',    label: 'DARF',        align: 'right', render: r => formatCurrency(r.totalDARF) },
    { key: 'totalFGTS',    label: 'FGTS',        align: 'right', render: r => formatCurrency(r.totalFGTS) },
    { key: 'totalGeral',   label: 'Total Geral', align: 'right', render: r => (
      <span className="font-semibold">{formatCurrency(r.totalGeral)}</span>
    )},
  ]

  return (
    <AdminLayout>
      <SectionTitle
        title="Relatórios"
        subtitle="Exporte os dados de encargos por período"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportarExcel}><FileDown size={15} /> Excel</Button>
            <Button onClick={exportarPDF}><FileDown size={15} /> PDF</Button>
          </div>
        }
      />

      <div className="flex gap-3 mb-6">
        <Select value={ano} onChange={e => setAno(e.target.value)} className="w-28">
          {getAnos().map(a => <option key={a}>{a}</option>)}
        </Select>
        <Select value={mes} onChange={e => setMes(e.target.value)} className="w-40">
          {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
      </div>

      {dados.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { l: 'Total Geral', v: dados.reduce((s,e)=>s+(e.totalGeral||0),0) },
            { l: 'Total GPS',   v: dados.reduce((s,e)=>s+(e.totalGPS||0),0) },
            { l: 'Total DARF',  v: dados.reduce((s,e)=>s+(e.totalDARF||0),0) },
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
          <Table columns={columns} data={dados} emptyMessage="Nenhum dado para este período." />
        </Card>
      )}
    </AdminLayout>
  )
}

// ─── Inconsistências ──────────────────────────────────────────────────────────
export function Inconsistencias() {
  const [itens,   setItens]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(null)

  async function carregar() {
    setLoading(true)
    const anos = getAnos()
    const todos = []
    for (const ano of anos) {
      for (const m of MESES) {
        try {
          const enc = await getEncargosDoMes(String(ano), m.value)
          enc.filter(e => e.status === 'inconsistencia').forEach(e => {
            todos.push({ ...e, ano, mes: m.value, mesLabel: m.label })
          })
        } catch {}
      }
    }
    setItens(todos)
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function resolver(item) {
    setSaving(item.id + item.ano + item.mes)
    await updateEncargo(String(item.ano), item.mes, item.id, { status: 'pendente', observacao: '' })
    toast.success('Inconsistência resolvida')
    carregar()
    setSaving(null)
  }

  const columns = [
    { key: 'mesLabel',    label: 'Mês/Ano',   render: r => `${r.mesLabel} / ${r.ano}` },
    { key: 'nomeUnidade', label: 'Unidade' },
    { key: 'totalGeral',  label: 'Total',      align: 'right', render: r => formatCurrency(r.totalGeral) },
    { key: 'observacao',  label: 'Observação', render: r => <span className="text-xs text-surface-200">{r.observacao || '—'}</span> },
    { key: 'acoes',       label: '', render: r => (
      <Button
        size="sm"
        loading={saving === r.id + r.ano + r.mes}
        onClick={() => resolver(r)}
      >
        Resolver
      </Button>
    )},
  ]

  return (
    <AdminLayout>
      <SectionTitle title="Inconsistências" subtitle="Itens pendentes de resolução" />
      {loading ? <Spinner /> : (
        <Card>
          <Table columns={columns} data={itens} emptyMessage="Nenhuma inconsistência encontrada. ✓" />
        </Card>
      )}
    </AdminLayout>
  )
}
