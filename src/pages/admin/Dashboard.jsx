import { useState, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { StatCard, Card, Badge, Spinner } from '../../components/ui'
import { getEncargosDoMes, getUnidades } from '../../services/firestore'
import { formatCurrency, getMesLabel, MESES, STATUS_CONFIG } from '../../utils/formatters'
import { DollarSign, Building2, AlertTriangle, Users, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const ano  = new Date().getFullYear()
  const mesAtual = MESES[new Date().getMonth()].value

  const [encargos,  setEncargos]  = useState([])
  const [unidades,  setUnidades]  = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      getEncargosDoMes(ano, mesAtual),
      getUnidades(),
    ]).then(([enc, uni]) => {
      setEncargos(enc)
      setUnidades(uni)
    }).finally(() => setLoading(false))
  }, [])

  const totalMes         = encargos.reduce((s, e) => s + (e.totalGeral || 0), 0)
  const inconsistencias  = encargos.filter(e => e.status === 'inconsistencia').length
  const unidadesAtivas   = unidades.filter(u => u.ativa).length
  const semLancamento    = unidadesAtivas - encargos.length

  // Top 10 por valor
  const top10 = [...encargos]
    .sort((a, b) => (b.totalGeral || 0) - (a.totalGeral || 0))
    .slice(0, 10)

  if (loading) return <AdminLayout><Spinner size="lg" /></AdminLayout>

  return (
    <AdminLayout>
      <div className="mb-8">
        <p className="text-surface-200 text-sm font-body">Visão Geral</p>
        <h2 className="font-display font-bold text-surface-900 text-3xl mt-0.5">
          {getMesLabel(mesAtual)} {ano}
        </h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total do Mês"
          value={formatCurrency(totalMes)}
          icon={<DollarSign size={20} />}
          color="brand"
          sub={`${encargos.length} unidades lançadas`}
        />
        <StatCard
          label="Unidades Ativas"
          value={unidadesAtivas}
          icon={<Building2 size={20} />}
          color="green"
          sub={semLancamento > 0 ? `${semLancamento} sem lançamento` : 'Todas lançadas'}
        />
        <StatCard
          label="Inconsistências"
          value={inconsistencias}
          icon={<AlertTriangle size={20} />}
          color={inconsistencias > 0 ? 'red' : 'green'}
          sub="Pendentes de resolução"
        />
        <StatCard
          label="Funcionários"
          value={encargos.reduce((s, e) => s + (e.nFuncionarios || 0), 0)}
          icon={<Users size={20} />}
          color="gold"
          sub="Total no período"
        />
      </div>

      {/* Top 10 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-brand-600" />
          <h3 className="font-display font-semibold text-surface-900 text-lg">
            Maiores Encargos — {getMesLabel(mesAtual)}
          </h3>
        </div>

        {top10.length === 0 ? (
          <p className="text-surface-200 text-sm py-8 text-center">
            Nenhum encargo lançado para este mês ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {top10.map((enc, i) => {
              const st = STATUS_CONFIG[enc.status] || STATUS_CONFIG.pendente
              const pct = totalMes > 0 ? ((enc.totalGeral / totalMes) * 100).toFixed(1) : 0
              return (
                <div key={enc.id} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs text-surface-200 font-mono shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-surface-800 truncate">{enc.nomeUnidade || enc.id}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge label={st.label} color={st.color} />
                        <span className="font-mono text-sm font-semibold text-surface-900">
                          {formatCurrency(enc.totalGeral)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </AdminLayout>
  )
}
