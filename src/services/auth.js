import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

// Login
export async function login(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const perfil = await getUserProfile(credential.user.uid)
  if (!perfil?.ativo) throw new Error('Usuário desativado. Contate o administrador.')
  return { user: credential.user, perfil }
}

// Logout
export async function logout() {
  await signOut(auth)
}

// Busca perfil do usuário no Firestore
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'usuarios', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Criar usuário (somente admin)
export async function createUser({ nome, email, senha, perfil, unidadeId }) {
  const credential = await createUserWithEmailAndPassword(auth, email, senha)
  const uid = credential.user.uid

  await setDoc(doc(db, 'usuarios', uid), {
    nome,
    email,
    perfil,           // 'admin' | 'colaborador'
    unidadeId: unidadeId || null,
    ativo: true,
    criadoEm: new Date(),
  })

  return uid
}

// Atualizar perfil
export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, 'usuarios', uid), data)
}

// Reset de senha
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email)
}

// Trocar senha
export async function changePassword(newPassword) {
  await updatePassword(auth.currentUser, newPassword)
}
