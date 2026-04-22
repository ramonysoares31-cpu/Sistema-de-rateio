import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import { getUserProfile } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [perfil, setPerfil]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const p = await getUserProfile(firebaseUser.uid)
          setUser(firebaseUser)
          setPerfil(p)
        } catch {
          setUser(null)
          setPerfil(null)
        }
      } else {
        setUser(null)
        setPerfil(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const isAdmin        = perfil?.perfil === 'admin'
  const isColaborador  = perfil?.perfil === 'colaborador'

  return (
    <AuthContext.Provider value={{ user, perfil, loading, isAdmin, isColaborador }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
