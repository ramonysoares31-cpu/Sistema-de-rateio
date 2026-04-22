import { useState, useEffect } from 'react'
import { getEncargosDoMes, getHistoricoUnidade } from '../services/firestore'

export function useEncargosDoMes(ano, mes) {
  const [encargos, setEncargos] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (!ano || !mes) return
    setLoading(true)
    getEncargosDoMes(ano, mes)
      .then(setEncargos)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [ano, mes])

  return { encargos, loading, error, refetch: () => getEncargosDoMes(ano, mes).then(setEncargos) }
}

export function useHistoricoUnidade(ano, unidadeId) {
  const [historico, setHistorico] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!ano || !unidadeId) return
    setLoading(true)
    getHistoricoUnidade(ano, unidadeId)
      .then(setHistorico)
      .finally(() => setLoading(false))
  }, [ano, unidadeId])

  return { historico, loading }
}
