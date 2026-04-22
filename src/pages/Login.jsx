import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/auth'
import { Button, Input } from '../components/ui'
import toast from 'react-hot-toast'
import { Lock, Mail } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [senha, setSenha]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [erro, setErro]         = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const { perfil } = await login(email, senha)
      toast.success(`Bem-vindo, ${perfil.nome?.split(' ')[0] || 'usuário'}!`)
      navigate(perfil.perfil === 'admin' ? '/admin' : '/colaborador', { replace: true })
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'E-mail ou senha incorretos.'
        : err.message || 'Erro ao fazer login.'
      setErro(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 font-body">
      {/* Fundo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-800/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl shadow-lg mb-5">
            <Lock size={24} className="text-white" />
          </div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Arquidiocese de Maceió</p>
          <h1 className="text-white font-display font-bold text-2xl">Rateio de Encargos</h1>
          <p className="text-white/40 text-sm mt-1">Sistema de Apuração Previdenciária</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl3 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="flex flex-col gap-1">
              <label className="text-white/70 text-xs font-medium">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white/8 border border-white/15
                    rounded-xl text-white placeholder:text-white/25
                    focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-white/70 text-xs font-medium">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white/8 border border-white/15
                    rounded-xl text-white placeholder:text-white/25
                    focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {erro && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{erro}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm
                rounded-xl transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Entrando...
                </>
              ) : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Acesso restrito · Caso não tenha acesso, contate o administrador
        </p>
      </div>
    </div>
  )
}
