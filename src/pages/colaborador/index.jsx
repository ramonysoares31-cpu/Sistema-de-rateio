// ─── Dashboard Colaborador ────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { ColaboradorLayout } from '../../components/layout/ColaboradorLayout'
import { Card, Badge, Button, Spinner } from '../../components/ui'
import { getEncargoUnidade, getUnidade } from '../../services/firestore'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, getMesLabel, MESES, STATUS_CONFIG } from '../../utils/formatters'
import { downloadDemonstrativo } from '../../utils/pdfGenerator'
import { FileDown, TrendingUp } from 'lucide-react'

export function ColaboradorDashboard() {
  const { perfil }   = useAuth()
  const mesAtual     = MESES[new Date().getMonth()].value
  const ano          = String(new Date().getFullYear())
  const [enc,    setEnc]    = useState(null)
  const [uni,    setUni]    = useState(null)
  const [loading,setLoading]= useState(true)

  useEffect(() => {
    if (!perfil?.unidadeId) { setLoading(false); return }
    Promise.all([
      getEncargoUnidade(ano, mesAtual, perfil.unidadeId),
      getUnidade(perfil.unidadeId),
    ]).then(([e, u]) => { setEnc(e); setUni(u) }).finally(() => setLoading(false))
  }, [perfil])

  if (loading) return <ColaboradorLayout><Spinner size="lg" /></ColaboradorLayout>

  const st = enc ? (STATUS_CONFIG[enc.status] || STATUS_CONFIG.pendente) : null

  function handleDownload() {
    if (!enc || !uni) return
    downloadDemonstrativo(enc, uni, mesAtual, ano)
  }

  return (
    <ColaboradorLayout>
      <div className="mb-8">
        <p className="text-surface-200 text-sm">Bem-vindo,</p>
        <h2 className="font-display font-bold text-surface-900 text-3xl mt-0.5">{perfil?.nome}</h2>
      </div>

      {!perfil?.unidadeId ? (
        <Card className="p-8 text-center">
          <p className="text-surface-200 text-sm">Sua conta não está vinculada a nenhuma unidade. Contate o administrador.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Card principal */}
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs text-surface-200 uppercase tracking-wider">Mês atual</p>
                <h3 className="font-display font-bold text-surface-900 text-2xl mt-0.5">
                  {getMesLabel(mesAtual)} / {ano}
                </h3>
              </div>
              {st && <Badge label={st.label} color={st.color} />}
            </div>

            {enc ? (
              <>
                {/* Total em destaque */}
                <div className="bg-surface-950 rounded-xl2 px-6 py-5 text-center mb-6">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Total de Encargos</p>
                  <p className="text-white font-display font-bold text-4xl">{formatCurrency(enc.totalGeral)}</p>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { l: 'GPS',  v: enc.totalGPS },
                    { l: 'DARF', v: enc.totalDARF },
                    { l: 'FGTS', v: enc.totalFGTS },
                  ].map(({ l, v }) => (
                    <div key={l} className="bg-surface-50 rounded-xl px-4 py-3 text-center">
                      <p className="text-xs text-surface-200 mb-1">{l}</p>
                      <p className="font-mono font-semibold text-surface-900 text-sm">{formatCurrency(v)}</p>
                    </div>
                  ))}
                </div>

                {/* Download */}
                {enc.pdfUrl ? (
                  <a href={enc.pdfUrl} target="_blank" rel="noreferrer">
                    <Button className="w-full" size="lg">
                      <FileDown size={16} /> Baixar Demonstrativo (PDF)
                    </Button>
                  </a>
                ) : (
                  <Button className="w-full" size="lg" variant="secondary" onClick={handleDownload}>
                    <FileDown size={16} /> Gerar Demonstrativo
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <TrendingUp size={32} className="text-surface-200 mx-auto mb-3" />
                <p className="text-surface-200 text-sm">
                  Nenhum encargo lançado para {getMesLabel(mesAtual)} ainda.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </ColaboradorLayout>
  )
}

// ─── Histórico Colaborador ────────────────────────────────────────────────────
import { useHistoricoUnidade } from '../../hooks/useEncargos'
import { Table } from '../../components/ui'

export function ColaboradorHistorico() {
  const { perfil }   = useAuth()
  const ano          = String(new Date().getFullYear())
  const [uni, setUni]= useState(null)
  const { historico, loading } = useHistoricoUnidade(ano, perfil?.unidadeId)

  useEffect(() => {
    if (perfil?.unidadeId) getUnidade(perfil.unidadeId).then(setUni)
  }, [perfil])

  function baixar(item) {
    if (!uni) return
    if (item.pdfUrl) { window.open(item.pdfUrl, '_blank'); return }
    downloadDemonstrativo(item, uni, item.mes, item.ano)
  }

  const columns = [
    { key: 'mes',       label: 'Mês',          render: r => getMesLabel(r.mes) },
    { key: 'ano',       label: 'Ano' },
    { key: 'totalGeral',label: 'Total Geral',   align: 'right', render: r => formatCurrency(r.totalGeral) },
    { key: 'status',    label: 'Status', render: r => {
      const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.pendente
      return <Badge label={st.label} color={st.color} />
    }},
    { key: 'pdf', label: '', render: r => (
      <Button size="sm" variant="ghost" onClick={() => baixar(r)}>
        <FileDown size={13} /> Baixar PDF
      </Button>
    )},
  ]

  return (
    <ColaboradorLayout>
      <div className="mb-6">
        <h2 className="font-display font-bold text-surface-900 text-2xl">Histórico {ano}</h2>
        <p className="text-sm text-surface-200 mt-1">Todos os meses lançados para sua unidade</p>
      </div>
      {loading ? <Spinner /> : (
        <Card>
          <Table columns={columns} data={historico} emptyMessage="Nenhum lançamento encontrado." />
        </Card>
      )}
    </ColaboradorLayout>
  )
}

// ─── Demonstrativo Colaborador ────────────────────────────────────────────────
export function ColaboradorDemonstrativo() {
  const { perfil }   = useAuth()
  const [ano, setAno]= useState(String(new Date().getFullYear()))
  const [mes, setMes]= useState(MESES[new Date().getMonth()].value)
  const [enc, setEnc]= useState(null)
  const [uni, setUni]= useState(null)
  const [loading, setLoading] = useState(false)

  async function buscar() {
    if (!perfil?.unidadeId) return
    setLoading(true)
    const [e, u] = await Promise.all([
      getEncargoUnidade(ano, mes, perfil.unidadeId),
      getUnidade(perfil.unidadeId),
    ])
    setEnc(e); setUni(u)
    setLoading(false)
  }

  useEffect(() => { buscar() }, [ano, mes, perfil])

  function baixar() {
    if (!enc || !uni) return
    if (enc.pdfUrl) { window.open(enc.pdfUrl, '_blank'); return }
    downloadDemonstrativo(enc, uni, mes, ano)
  }

  const grupos = [
    { label: 'GPS', campos: [
      ['Salário Base', 'salarioBase'], ['Nº Funcionários', 'nFuncionarios'],
      ['Empregado', 'empregado'], ['Empresa', 'empresa'], ['Terceiros', 'terceiros'],
      ['RAT Ajustado', 'ratAjustado'], ['Salário Família', 'salarioFamilia'],
      ['Salário Maternidade', 'salarioMaternidade'], ['Total GPS', 'totalGPS'],
    ]},
    { label: 'DARF', campos: [
      ['PIS 8301', 'pis8301'], ['IRRF 0561', 'irrf0561'], ['IRRF Congruas 0588', 'irrfCongruas'],
      ['IRRF 1708', 'irrf1708'], ['COFINS 5960', 'cofins5960'], ['PIS 5979', 'pis5979'],
      ['CSLL 5987', 'csll5987'], ['INSS 1162', 'inss1162'], ['Total DARF', 'totalDARF'],
    ]},
    { label: 'FGTS', campos: [
      ['FGTS', 'fgts'], ['Consignado', 'consignado'], ['Total FGTS', 'totalFGTS'],
    ]},
    { label: 'Benefícios', campos: [
      ['SST', 'sst'], ['Odonto', 'odonto'], ['Seguro de Vida', 'seguroVida'],
    ]},
  ]

  return (
    <ColaboradorLayout>
      <div className="mb-6">
        <h2 className="font-display font-bold text-surface-900 text-2xl">Demonstrativo</h2>
      </div>

      <div className="flex gap-3 mb-6">
        <Select value={ano} onChange={e => setAno(e.target.value)} className="w-28">
          {getAnos().map(a => <option key={a}>{a}</option>)}
        </Select>
        <Select value={mes} onChange={e => setMes(e.target.value)} className="w-40">
          {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
      </div>

      {loading ? <Spinner /> : enc ? (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={baixar}><FileDown size={15} /> Baixar PDF</Button>
          </div>
          <Card className="divide-y divide-surface-100">
            {grupos.map(g => (
              <div key={g.label} className="p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-200 mb-3">{g.label}</h4>
                <div className="space-y-2">
                  {g.campos.map(([label, key]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-surface-800">{label}</span>
                      <span className="font-mono text-sm font-medium text-surface-900">
                        {key === 'nFuncionarios' ? enc[key] ?? 0 : formatCurrency(enc[key])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="px-5 py-4 bg-surface-950 rounded-b-xl2">
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">TOTAL GERAL</span>
                <span className="font-mono text-white font-bold text-xl">{formatCurrency(enc.totalGeral)}</span>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-surface-200 text-sm">
            Nenhum dado encontrado para {getMesLabel(mes)} / {ano}.
          </p>
        </Card>
      )}
    </ColaboradorLayout>
  )
}
