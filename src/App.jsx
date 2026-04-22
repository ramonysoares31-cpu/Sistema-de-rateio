import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

// Páginas públicas
import Login from './pages/Login'

// Páginas Admin
import AdminDashboard      from './pages/admin/Dashboard'
import Unidades            from './pages/admin/Unidades'
import Usuarios            from './pages/admin/Usuarios'
import ImportarEncargos    from './pages/admin/ImportarEncargos'
import Encargos            from './pages/admin/Encargos'
import { Relatorios, Inconsistencias } from './pages/admin/Relatorios'

// Páginas Colaborador
import {
  ColaboradorDashboard,
  ColaboradorHistorico,
  ColaboradorDemonstrativo,
} from './pages/colaborador'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<Login />} />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/unidades" element={
            <ProtectedRoute role="admin"><Unidades /></ProtectedRoute>
          } />
          <Route path="/admin/usuarios" element={
            <ProtectedRoute role="admin"><Usuarios /></ProtectedRoute>
          } />
          <Route path="/admin/encargos" element={
            <ProtectedRoute role="admin"><Encargos /></ProtectedRoute>
          } />
          <Route path="/admin/encargos/importar" element={
            <ProtectedRoute role="admin"><ImportarEncargos /></ProtectedRoute>
          } />
          <Route path="/admin/relatorios" element={
            <ProtectedRoute role="admin"><Relatorios /></ProtectedRoute>
          } />
          <Route path="/admin/inconsistencias" element={
            <ProtectedRoute role="admin"><Inconsistencias /></ProtectedRoute>
          } />

          {/* Colaborador */}
          <Route path="/colaborador" element={
            <ProtectedRoute role="colaborador"><ColaboradorDashboard /></ProtectedRoute>
          } />
          <Route path="/colaborador/historico" element={
            <ProtectedRoute role="colaborador"><ColaboradorHistorico /></ProtectedRoute>
          } />
          <Route path="/colaborador/demonstrativo" element={
            <ProtectedRoute role="colaborador"><ColaboradorDemonstrativo /></ProtectedRoute>
          } />

          {/* Redirect padrão */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#2d4bff', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
