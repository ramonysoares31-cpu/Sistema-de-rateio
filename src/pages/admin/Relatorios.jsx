// ─── Relatórios ───────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card, Button, Select, Table, SectionTitle, Spinner } from '../../components/ui'
import { getEncargosDoMes, getUnidades, updateEncargo } from '../../services/firestore'
import { formatCurrency, getMesLabel, MESES, getAnos } from '../../utils/formatters'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { FileDown, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Cabeçalho padrão do PDF ───────────────────────────────────────────────────
function cabecalhoPDF(doc, titulo, mes, ano) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('ARQUIDIOCESE DE MACEIÓ — ' + titulo, 14, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Período: ${getMesLabel(mes)} / ${ano}`, 14, 23)
}

// ── Somar campo ────────────────────────────────────────────────────────────────
const soma = (dados, campo) => dados.reduce((s, e) => s + (parseFloat(e[campo]) || 0), 0)

export function Relatorios() {
  const [ano,     setAno]     = useState(String(new Date().getFullYear()))
  const [mes,     setMes]     = useState(MESES[new Date().getMonth()].value)
  const [dados,   setDados]   = useState([])
  const [loading, setLoading] = useState(false)
  const [aba,     setAba]     = useState('basico') // 'basico' | 'completo'

  async function carregar() {
    setLoading(true)
    const [enc, uni] = await Promise.all([getEncargosDoMes(ano, mes), getUnidades()])
    const mapa = Object.fromEntries(uni.map(u => [u.id, u]))
    setDados(enc.map(e => ({
      ...e,
      nomeUnidade: mapa[e.id]?.nome || e.id,
      cnpj: mapa[e.id]?.cnpj || '',
    })))
    setLoading(false)
  }

  useEffect(() => { carregar() }, [ano, mes])

  // ── EXCEL BÁSICO ─────────────────────────────────────────────────────────────
  function exportarExcelBasico() {
    const rows = dados.map(e => ({
      'CNPJ':          e.cnpj,
      'Unidade':       e.nomeUnidade,
      'Nº Func.':      e.nFuncionarios,
      'GPS (INSS)':    e.totalGPS,
      'DARF':          e.totalDARF,
      'FGTS':          e.totalFGTS,
      'SST':           e.sst,
      'Odonto':        e.odonto,
      'Seguro Vida':   e.seguroVida,
      'Total Geral':   e.totalGeral,
      'Status':        e.status,
    }))
    // Linha de totais
    rows.push({
      'CNPJ': '', 'Unidade': 'TOTAL',
      'Nº Func.':    soma(dados, 'nFuncionarios'),
      'GPS (INSS)':  soma(dados, 'totalGPS'),
      'DARF':        soma(dados, 'totalDARF'),
      'FGTS':        soma(dados, 'totalFGTS'),
      'SST':         soma(dados, 'sst'),
      'Odonto':      soma(dados, 'odonto'),
      'Seguro Vida': soma(dados, 'seguroVida'),
      'Total Geral': soma(dados, 'totalGeral'),
      'Status': '',
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `${getMesLabel(mes)} ${ano}`)
    XLSX.writeFile(wb, `relatorio_basico_${mes}_${ano}.xlsx`)
    toast.success('Excel Básico gerado!')
  }

  // ── EXCEL COMPLETO ───────────────────────────────────────────────────────────
  function exportarExcelCompleto() {
    const rows = dados.map(e => ({
      'CNPJ':                    e.cnpj,
      'Unidade':                 e.nomeUnidade,
      'Nº Func.':                e.nFuncionarios,
      'Salário Base':            e.salarioBase,
      // GPS
      'Empregado':               e.empregado,
      'Empresa':                 e.empresa,
      'Terceiros':               e.terceiros,
      'RAT Ajustado':            e.ratAjustado,
      'Salário Família':         e.salarioFamilia,
      'Salário Maternidade':     e.salarioMaternidade,
      'Total GPS (INSS)':        e.totalGPS,
      // DARF
      'PIS 8301':                e.pis8301,
      'IRRF 0561':               e.irrf0561,
      'IRRF Congruas 0588':      e.irrfCongruas,
      'IRRF 1708':               e.irrf1708,
      'COFINS 5960':             e.cofins5960,
      'PIS 5979':                e.pis5979,
      'CSLL 5987':               e.csll5987,
      'INSS 1162':               e.inss1162,
      'Total DARF':              e.totalDARF,
      // FGTS
      'FGTS':                    e.fgts,
      'Consignado':              e.consignado,
      'Total FGTS':              e.totalFGTS,
      // Benefícios
      'SST':                     e.sst,
      'Odonto':                  e.odonto,
      'Seguro Vida':             e.seguroVida,
      // Total
      'Total Geral':             e.totalGeral,
      'Status':                  e.status,
    }))
    // Linha de totais
    rows.push({
      'CNPJ': '', 'Unidade': 'TOTAL', 'Nº Func.': soma(dados, 'nFuncionarios'),
      'Salário Base':        soma(dados, 'salarioBase'),
      'Empregado':           soma(dados, 'empregado'),
      'Empresa':             soma(dados, 'empresa'),
      'Terceiros':           soma(dados, 'terceiros'),
      'RAT Ajustado':        soma(dados, 'ratAjustado'),
      'Salário Família':     soma(dados, 'salarioFamilia'),
      'Salário Maternidade': soma(dados, 'salarioMaternidade'),
      'Total GPS (INSS)':    soma(dados, 'totalGPS'),
      'PIS 8301':            soma(dados, 'pis8301'),
      'IRRF 0561':           soma(dados, 'irrf0561'),
      'IRRF Congruas 0588':  soma(dados, 'irrfCongruas'),
      'IRRF 1708':           soma(dados, 'irrf1708'),
      'COFINS 5960':         soma(dados, 'cofins5960'),
      'PIS 5979':            soma(dados, 'pis5979'),
      'CSLL 5987':           soma(dados, 'csll5987'),
      'INSS 1162':           soma(dados, 'inss1162'),
      'Total DARF':          soma(dados, 'totalDARF'),
      'FGTS':                soma(dados, 'fgts'),
      'Consignado':          soma(dados, 'consignado'),
      'Total FGTS':          soma(dados, 'totalFGTS'),
      'SST':                 soma(dados, 'sst'),
      'Odonto':              soma(dados, 'odonto'),
      'Seguro Vida':         soma(dados, 'seguroVida'),
      'Total Geral':         soma(dados, 'totalGeral'),
      'Status': '',
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `${getMesLabel(mes)} ${ano}`)
    XLSX.writeFile(wb, `relatorio_completo_${mes}_${ano}.xlsx`)
    toast.success('Excel Completo gerado!')
  }

  // ── PDF BÁSICO ───────────────────────────────────────────────────────────────
  function exportarPDFBasico() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    cabecalhoPDF(doc, 'Relatório de Encargos — Resumo', mes, ano)

    autoTable(doc, {
      startY: 28,
      styles: { fontSize: 7, font: 'helvetica' },
      headStyles: { fillColor: [20, 23, 39] },
      head: [['CNPJ', 'Unidade', 'Func.', 'GPS (INSS)', 'DARF', 'FGTS', 'SST', 'Odonto', 'Seg. Vida', 'Total Geral', 'Status']],
      body: dados.map(e => [
        e.cnpj,
        e.nomeUnidade,
        e.nFuncionarios,
        formatCurrency(e.totalGPS),
        formatCurrency(e.totalDARF),
        formatCurrency(e.totalFGTS),
        formatCurrency(e.sst),
        formatCurrency(e.odonto),
        formatCurrency(e.seguroVida),
        formatCurrency(e.totalGeral),
        e.status,
      ]),
      foot: [[
        '', 'TOTAL',
        soma(dados, 'nFuncionarios'),
        formatCurrency(soma(dados, 'totalGPS')),
        formatCurrency(soma(dados, 'totalDARF')),
        formatCurrency(soma(dados, 'totalFGTS')),
        formatCurrency(soma(dados, 'sst')),
        formatCurrency(soma(dados, 'odonto')),
        formatCurrency(soma(dados, 'seguroVida')),
        formatCurrency(soma(dados, 'totalGeral')),
        '',
      ]],
      footStyles: { fillColor: [232,236,248], textColor: [20,23,39], fontStyle: 'bold' },
    })

    doc.save(`relatorio_basico_${mes}_${ano}.pdf`)
    toast.success('PDF Básico gerado!')
  }

  // ── PDF COMPLETO ─────────────────────────────────────────────────────────────
  function exportarPDFCompleto() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    cabecalhoPDF(doc, 'Relatório de Encargos — Completo', mes, ano)

    // Tabela GPS / INSS
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('GPS — Contribuição Previdenciária (INSS)', 14, 30)
    autoTable(doc, {
      startY: 34,
      styles: { fontSize: 6.5, font: 'helvetica' },
      headStyles: { fillColor: [30, 37, 80] },
      head: [['Unidade', 'Func.', 'Sal. Base', 'Empregado', 'Empresa', 'Terceiros', 'RAT Aj.', 'Sal. Família', 'Sal. Matern.', 'Total GPS (INSS)']],
      body: dados.map(e => [
        e.nomeUnidade, e.nFuncionarios,
        formatCurrency(e.salarioBase),
        formatCurrency(e.empregado),
        formatCurrency(e.empresa),
        formatCurrency(e.terceiros),
        formatCurrency(e.ratAjustado),
        formatCurrency(e.salarioFamilia),
        formatCurrency(e.salarioMaternidade),
        formatCurrency(e.totalGPS),
      ]),
      foot: [[ 'TOTAL', soma(dados,'nFuncionarios'),
        formatCurrency(soma(dados,'salarioBase')),
        formatCurrency(soma(dados,'empregado')),
        formatCurrency(soma(dados,'empresa')),
        formatCurrency(soma(dados,'terceiros')),
        formatCurrency(soma(dados,'ratAjustado')),
        formatCurrency(soma(dados,'salarioFamilia')),
        formatCurrency(soma(dados,'salarioMaternidade')),
        formatCurrency(soma(dados,'totalGPS')),
      ]],
      footStyles: { fillColor: [232,236,248], textColor: [20,23,39], fontStyle: 'bold' },
    })

    // Tabela DARF
    const y1 = doc.lastAutoTable.finalY + 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('DARF', 14, y1)
    autoTable(doc, {
      startY: y1 + 4,
      styles: { fontSize: 6.5, font: 'helvetica' },
      headStyles: { fillColor: [80, 30, 30] },
      head: [['Unidade', 'PIS 8301', 'IRRF 0561', 'IRRF Cong. 0588', 'IRRF 1708', 'COFINS 5960', 'PIS 5979', 'CSLL 5987', 'INSS 1162', 'Total DARF']],
      body: dados.map(e => [
        e.nomeUnidade,
        formatCurrency(e.pis8301),
        formatCurrency(e.irrf0561),
        formatCurrency(e.irrfCongruas),
        formatCurrency(e.irrf1708),
        formatCurrency(e.cofins5960),
        formatCurrency(e.pis5979),
        formatCurrency(e.csll5987),
        formatCurrency(e.inss1162),
        formatCurrency(e.totalDARF),
      ]),
      foot: [[ 'TOTAL',
        formatCurrency(soma(dados,'pis8301')),
        formatCurrency(soma(dados,'irrf0561')),
        formatCurrency(soma(dados,'irrfCongruas')),
        formatCurrency(soma(dados,'irrf1708')),
        formatCurrency(soma(dados,'cofins5960')),
        formatCurrency(soma(dados,'pis5979')),
        formatCurrency(soma(dados,'csll5987')),
        formatCurrency(soma(dados,'inss1162')),
        formatCurrency(soma(dados,'totalDARF')),
      ]],
      footStyles: { fillColor: [232,236,248], textColor: [20,23,39], fontStyle: 'bold' },
    })

    // Tabela FGTS + Benefícios + Total
    const y2 = doc.lastAutoTable.finalY + 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('FGTS, Benefícios e Total Geral', 14, y2)
    autoTable(doc, {
      startY: y2 + 4,
      styles: { fontSize: 6.5, font: 'helvetica' },
      headStyles: { fillColor: [20, 80, 40] },
      head: [['Unidade', 'FGTS', 'Consignado', 'Total FGTS', 'SST', 'Odonto', 'Seg. Vida', 'Total Geral', 'Status']],
      body: dados.map(e => [
        e.nomeUnidade,
        formatCurrency(e.fgts),
        formatCurrency(e.consignado),
        formatCurrency(e.totalFGTS),
        formatCurrency(e.sst),
        formatCurrency(e.odonto),
        formatCurrency(e.seguroVida),
        formatCurrency(e.totalGeral),
        e.status,
      ]),
      foot: [[ 'TOTAL',
        formatCurrency(soma(dados,'fgts')),
        formatCurrency(soma(dados,'consignado')),
        formatCurrency(soma(dados,'totalFGTS')),
        formatCurrency(soma(dados,'sst')),
        formatCurrency(soma(dados,'odonto')),
        formatCurrency(soma(dados,'seguroVida')),
        formatCurrency(soma(dados,'totalGeral')),
        '',
      ]],
      footStyles: { fillColor: [232,236,248], textColor: [20,23,39], fontStyle: 'bold' },
    })

    doc.save(`relatorio_completo_${mes}_${ano}.pdf`)
    toast.success('PDF Completo gerado!')
  }

  // ── Colunas da tabela BÁSICA ─────────────────────────────────────────────────
  const colunasBasico = [
    { key: 'cnpj',          label: 'CNPJ',         render: r => <span className="font-mono text-xs">{r.cnpj}</span> },
    { key: 'nomeUnidade',   label: 'Unidade' },
    { key: 'nFuncionarios', label: 'Func.',         align: 'right' },
    { key: 'totalGPS',      label: 'GPS (INSS)',    align: 'right', render: r => formatCurrency(r.totalGPS) },
    { key: 'totalDARF',     label: 'DARF',          align: 'right', render: r => formatCurrency(r.totalDARF) },
    { key: 'totalFGTS',     label: 'FGTS',          align: 'right', render: r => formatCurrency(r.totalFGTS) },
    { key: 'sst',           label: 'SST',           align: 'right', render: r => formatCurrency(r.sst) },
    { key: 'odonto',        label: 'Odonto',        align: 'right', render: r => formatCurrency(r.odonto) },
    { key: 'totalGeral',    label: 'Total Geral',   align: 'right', render: r => (
      <span className="font-semibold">{formatCurrency(r.totalGeral)}</span>
    )},
  ]

  // ── Colunas da tabela COMPLETA ────────────────────────────────────────────────
  const colunasCompleto = [
    { key: 'nomeUnidade',   label: 'Unidade' },
    { key: 'nFuncionarios', label: 'Func.',      align: 'right' },
    { key: 'totalGPS',      label: 'GPS (INSS)', align: 'right', render: r => formatCurrency(r.totalGPS) },
    { key: 'inss1162',      label: 'INSS 1162',  align: 'right', render: r => formatCurrency(r.inss1162) },
    { key: 'totalDARF',     label: 'DARF',       align: 'right', render: r => formatCurrency(r.totalDARF) },
    { key: 'fgts',          label: 'FGTS',       align: 'right', render: r => formatCurrency(r.fgts) },
    { key: 'consignado',    label: 'Consignado', align: 'right', render: r => formatCurrency(r.consignado) },
    { key: 'totalFGTS',     label: 'Total FGTS', align: 'right', render: r => (
      <span className="font-semibold">{formatCurrency(r.totalFGTS)}</span>
    )},
    { key: 'sst',           label: 'SST',        align: 'right', render: r => formatCurrency(r.sst) },
    { key: 'odonto',        label: 'Odonto',     align: 'right', render: r => formatCurrency(r.odonto) },
    { key: 'totalGeral',    label: 'Total Geral',align: 'right', render: r => (
      <span className="font-semibold">{formatCurrency(r.totalGeral)}</span>
    )},
  ]

  const isBasico = aba === 'basico'

  return (
    <AdminLayout>
      <SectionTitle
        title="Relatórios"
        subtitle="Exporte os dados de encargos por período"
      />

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <Select value={ano} onChange={e => setAno(e.target.value)} className="w-28">
          {getAnos().map(a => <option key={a}>{a}</option>)}
        </Select>
        <Select value={mes} onChange={e => setMes(e.target.value)} className="w-40">
          {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
      </div>

      {/* Abas: Básico / Completo */}
      <div className="flex gap-2 mb-5 border-b border-surface-100">
        <button
          onClick={() => setAba('basico')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
            isBasico
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-surface-200 hover:text-surface-800'
          }`}
        >
          📋 Relatório Básico
        </button>
        <button
          onClick={() => setAba('completo')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
            !isBasico
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-surface-200 hover:text-surface-800'
          }`}
        >
          📊 Relatório Completo
        </button>
      </div>

      {/* Botões de exportação */}
      <div className="flex gap-2 mb-5 justify-end">
        <Button variant="secondary" onClick={isBasico ? exportarExcelBasico : exportarExcelCompleto}>
          <FileDown size={15} className="mr-1" />
          Excel {isBasico ? 'Básico' : 'Completo'}
        </Button>
        <Button onClick={isBasico ? exportarPDFBasico : exportarPDFCompleto}>
          <FileText size={15} className="mr-1" />
          PDF {isBasico ? 'Básico' : 'Completo'}
        </Button>
      </div>

      {/* Cards de totais */}
      {dados.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { l: 'Total GPS (INSS)', v: soma(dados, 'totalGPS') },
            { l: 'Total DARF',       v: soma(dados, 'totalDARF') },
            { l: 'Total FGTS',       v: soma(dados, 'totalFGTS') },
            { l: 'Total Geral',      v: soma(dados, 'totalGeral') },
          ].map(({ l, v }) => (
            <Card key={l} className="px-4 py-3">
              <p className="text-xs text-surface-200">{l}</p>
              <p className="font-mono font-bold text-surface-900 text-lg">{formatCurrency(v)}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Tabela */}
      {loading ? <Spinner /> : (
        <Card>
          <Table
            columns={isBasico ? colunasBasico : colunasCompleto}
            data={dados}
            emptyMessage="Nenhum dado para este período."
          />
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
    { key: 'mesLabel',    label: 'Mês/Ano',    render: r => `${r.mesLabel} / ${r.ano}` },
    { key: 'nomeUnidade', label: 'Unidade' },
    { key: 'totalGeral',  label: 'Total',       align: 'right', render: r => formatCurrency(r.totalGeral) },
    { key: 'observacao',  label: 'Observação',  render: r => <span className="text-xs text-surface-200">{r.observacao || '—'}</span> },
    { key: 'acoes',       label: '', render: r => (
      <Button size="sm" loading={saving === r.id + r.ano + r.mes} onClick={() => resolver(r)}>
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
