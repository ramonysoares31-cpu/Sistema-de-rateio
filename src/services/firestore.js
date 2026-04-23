import {
  collection, doc, getDocs, getDoc, addDoc,
  setDoc, updateDoc, deleteDoc, query, where,
  orderBy, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── UNIDADES ─────────────────────────────────────────────────────────────────

export async function getUnidades() {
  const snap = await getDocs(query(collection(db, 'unidades'), orderBy('nome')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getUnidade(id) {
  const snap = await getDoc(doc(db, 'unidades', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createUnidade(data) {
  return addDoc(collection(db, 'unidades'), {
    ...data,
    ativa: true,
    criadoEm: serverTimestamp(),
  })
}

export async function updateUnidade(id, data) {
  await updateDoc(doc(db, 'unidades', id), data)
}

// ─── USUÁRIOS ─────────────────────────────────────────────────────────────────

export async function getUsuarios() {
  const snap = await getDocs(query(collection(db, 'usuarios'), orderBy('nome')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateUsuario(uid, data) {
  await updateDoc(doc(db, 'usuarios', uid), data)
}

// ─── ENCARGOS ─────────────────────────────────────────────────────────────────

function encargosPath(ano, mes) {
  return `encargos/${ano}/meses/${mes}/unidades`
}

export async function getEncargosDoMes(ano, mes) {
  const snap = await getDocs(collection(db, encargosPath(ano, mes)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getEncargoUnidade(ano, mes, unidadeId) {
  const snap = await getDoc(doc(db, encargosPath(ano, mes), unidadeId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function setEncargoUnidade(ano, mes, unidadeId, data) {
  await setDoc(doc(db, encargosPath(ano, mes), unidadeId), {
    ...data,
    atualizadoEm: serverTimestamp(),
  }, { merge: true })
}

// Importação em lote (batch write)
export async function importarEncargosEmLote(ano, mes, registros) {
  const batch = writeBatch(db)
  const erros = []
  let importados = 0

  for (const reg of registros) {
    try {
      const ref = doc(db, encargosPath(ano, mes), reg.unidadeId)
      batch.set(ref, {
        ...reg,
        status: 'pendente',
        pdfUrl: '',
        pdfGerado: false,
        atualizadoEm: serverTimestamp(),
      }, { merge: true })
      importados++
    } catch (e) {
      erros.push({ linha: reg._linha, erro: e.message })
    }
  }

  await batch.commit()
  return { importados, erros }
}

export async function updateEncargo(ano, mes, unidadeId, data) {
  await updateDoc(doc(db, encargosPath(ano, mes), unidadeId), {
    ...data,
    atualizadoEm: serverTimestamp(),
  })
}

export async function deleteEncargo(ano, mes, unidadeId) {
  await deleteDoc(doc(db, encargosPath(ano, mes), unidadeId))
}

// Busca encargos de uma unidade em todos os meses de um ano
export async function getHistoricoUnidade(ano, unidadeId) {
  const meses = [
    'janeiro','fevereiro','marco','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro'
  ]
  const resultado = []
  for (const mes of meses) {
    const enc = await getEncargoUnidade(ano, mes, unidadeId)
    if (enc) resultado.push({ mes, ano, ...enc })
  }
  return resultado
}

// ─── IMPORTAÇÕES (log) ────────────────────────────────────────────────────────

export async function registrarImportacao(data) {
  return addDoc(collection(db, 'importacoes'), {
    ...data,
    criadoEm: serverTimestamp(),
  })
}

export async function getImportacoes() {
  const snap = await getDocs(
    query(collection(db, 'importacoes'), orderBy('criadoEm', 'desc'))
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
