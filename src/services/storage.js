import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

// Upload de PDF para uma unidade/mês
export async function uploadPDF(ano, mes, unidadeId, file) {
  const path = `pdfs/${ano}/${mes}/${unidadeId}.pdf`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file, { contentType: 'application/pdf' })
  const url = await getDownloadURL(storageRef)
  return url
}

// Obter URL de download de um PDF
export async function getPDFUrl(ano, mes, unidadeId) {
  try {
    const path = `pdfs/${ano}/${mes}/${unidadeId}.pdf`
    const storageRef = ref(storage, path)
    return await getDownloadURL(storageRef)
  } catch {
    return null
  }
}

// Deletar PDF
export async function deletePDF(ano, mes, unidadeId) {
  const path = `pdfs/${ano}/${mes}/${unidadeId}.pdf`
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}
