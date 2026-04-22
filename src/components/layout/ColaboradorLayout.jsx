import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { logout } from '../../services/auth'
import toast from 'react-hot-toast'
import { LayoutDashboard, History, FileDown, LogOut } from 'lucide-react'

const navItems = [
  { to: '/colaborador',              label: 'Início',        icon: LayoutDashboard, end: true },
  { to: '/colaborador/historico',    label: 'Histórico',     icon: History },
  { to: '/colaborador/demonstrativo',label: 'Demonstrativo', icon: FileDown },
]

export function ColaboradorLayout({ children }) {
  const { perfil } = useAuth()
  const navigate   = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
    toast.success('Sessão encerrada')
  }

  return (
    <div className="min-h-screen bg-surface-50 font-body">
      {/* Topbar */}
      <header className="bg-surface-950 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-[10px] uppercase tracking-widest hidden sm:block">Arquidiocese de Maceió</span>
            <span className="text-white/20 hidden sm:block">·</span>
            <span className="text-white font-display font-semibold text-base">Rateio de Encargos</span>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all
                  ${isActive ? 'bg-brand-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/8'}`
                }
              >
                <Icon size={14} />
                <span className="hidden sm:block">{label}</span>
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-white/8 transition-all"
            >
              <LogOut size={14} />
            </button>
          </nav>
        </div>
      </header>

      {/* Unidade banner */}
      {perfil?.unidadeNome && (
        <div className="bg-brand-600 text-white py-2">
          <div className="max-w-5xl mx-auto px-4 flex items-center gap-2 text-sm">
            <span className="opacity-70">Unidade:</span>
            <span className="font-medium">{perfil.unidadeNome}</span>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
