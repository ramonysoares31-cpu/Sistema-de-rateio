import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { logout } from '../../services/auth'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Building2, Users, Upload,
  FileText, AlertTriangle, LogOut, ChevronRight,
} from 'lucide-react'

const navItems = [
  { to: '/admin',                    label: 'Dashboard',       icon: LayoutDashboard, end: true },
  { to: '/admin/unidades',           label: 'Unidades',        icon: Building2 },
  { to: '/admin/usuarios',           label: 'Usuários',        icon: Users },
  { to: '/admin/encargos',           label: 'Encargos',        icon: FileText },
  { to: '/admin/encargos/importar',  label: 'Importar',        icon: Upload },
  { to: '/admin/relatorios',         label: 'Relatórios',      icon: FileText },
  { to: '/admin/inconsistencias',    label: 'Inconsistências', icon: AlertTriangle },
]

export function AdminLayout({ children }) {
  const { perfil } = useAuth()
  const navigate   = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
    toast.success('Sessão encerrada')
  }

  return (
    <div className="flex min-h-screen bg-surface-50 font-body">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-surface-950 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/10">
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-medium mb-1">Arquidiocese de Maceió</p>
          <h1 className="text-white font-display font-bold text-lg leading-tight">
            Rateio de<br />Encargos
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-100
                ${isActive
                  ? 'bg-brand-600 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/8'}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/8 cursor-pointer group">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {perfil?.nome?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{perfil?.nome || 'Admin'}</p>
              <p className="text-white/40 text-[10px] truncate">{perfil?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/30 hover:text-red-400 transition-colors"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
