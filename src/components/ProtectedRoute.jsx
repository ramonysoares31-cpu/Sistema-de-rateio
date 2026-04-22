import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './ui'

export function ProtectedRoute({ children, role }) {
  const { user, perfil, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user || !perfil) return <Navigate to="/login" replace />

  if (!perfil.ativo) return <Navigate to="/login" replace />

  if (role && perfil.perfil !== role) {
    return <Navigate to={perfil.perfil === 'admin' ? '/admin' : '/colaborador'} replace />
  }

  return children
}
