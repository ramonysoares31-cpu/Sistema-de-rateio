import * as XLSX from 'xlsx'
import { parseBRL, COLUNAS_IMPORTACAO } from './formatters'

/**
 * Lê um arquivo .xlsx ou .csv e retorna array de registros validados
 * @param {File} file
 * @param {Array} unidades - lista de unidades do Firestore para lookup por CNPJ
 * @returns {{ registros: Array, erros: Array }}
 */
export async function parseImportacao(file, unidades) {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  const registros = []
  const erros = []

  rows.forEach((row, idx) => {
    const linha = idx + 2 // linha 1 = cabeçalho
    const cnpj = String(row['cnpj'] || row['CNPJ'] || '').trim()
    const nome = String(row['nome'] || row['Nome'] || '').trim()

    if (!cnpj && !nome) {
      // Linha vazia — ignorar silenciosamente
      return
    }

    // Localizar unidade pelo CNPJ ou nome
    let unidade = unidades.find(u => u.cnpj === cnpj)
    if (!unidade && nome) {
      unidade = unidades.find(u =>
        u.nome.toLowerCase().includes(nome.toLowerCase().slice(0, 15))
      )
    }

    if (!unidade) {
      erros.push({ linha, cnpj, nome, erro: 'Unidade não encontrada no cadastro' })
      return
    }

    // Mapear campos numéricos
    const reg = {
      _linha: linha,
      unidadeId: unidade.id,
      nomeUnidade: unidade.nome,
      cnpj: unidade.cnpj,
    }

    let camposFaltando = []
    for (const col of COLUNAS_IMPORTACAO.slice(2)) { // pula cnpj e nome
      const rawKey = Object.keys(row).find(
        k => k.toLowerCase().replace(/[^a-z0-9]/g, '') ===
             col.toLowerCase().replace(/[^a-z0-9]/g, '')
      )
      const raw = rawKey ? row[rawKey] : ''
      if (raw === '' || raw == null) {
        reg[col] = 0
      } else {
        reg[col] = parseBRL(raw)
      }
    }

    // Calcular totais derivados se não vieram preenchidos
    if (!reg.totalGPS) {
      reg.totalGPS = reg.empregado + reg.empresa + reg.terceiros +
                     reg.ratAjustado + reg.salarioFamilia + reg.salarioMaternidade
    }
    if (!reg.totalDARF) {
      reg.totalDARF = reg.pis8301 + reg.irrf0561 + reg.irrfCongruas +
                      reg.irrf1708 + reg.cofins5960 + reg.pis5979 +
                      reg.csll5987 + reg.inss1162
    }
    if (!reg.totalFGTS) {
      reg.totalFGTS = reg.fgts + reg.consignado
    }
    if (!reg.totalGeral) {
      reg.totalGeral = reg.totalGPS + reg.totalDARF + reg.totalFGTS +
                       reg.sst + reg.odonto + reg.seguroVida
    }

    registros.push(reg)
  })

  return { registros, erros }
}

/**
 * Gera planilha modelo para download
 */
export function gerarPlanilhaModelo() {
  const cabecalho = [
    'cnpj', 'nome', 'salarioBase', 'nFuncionarios',
    'empregado', 'empresa', 'terceiros', 'ratAjustado',
    'salarioFamilia', 'salarioMaternidade',
    'pis8301', 'irrf0561', 'irrfCongruas', 'irrf1708',
    'cofins5960', 'pis5979', 'csll5987', 'inss1162',
    'fgts', 'consignado', 'sst', 'odonto', 'seguroVida', 'totalGeral',
  ]

  const exemplo = [
    '0002-60', 'N Sra do Livramento - Centro', 8714.18, 5,
    662.64, 1742.84, 505.41, 87.14,
    0, 0,
    87.14, 0, 0, 0,
    0, 0, 0, 697.13,
    697.13, 0, 0, 72.00, 0, 3854.31,
  ]

  const ws = XLSX.utils.aoa_to_sheet([cabecalho, exemplo])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Encargos')
  XLSX.writeFile(wb, 'modelo_importacao_encargos.xlsx')
}
