// Formatação de moeda BRL
export function formatCurrency(value) {
  if (value == null || value === '') return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value))
}

// Formatar número para exibição
export function formatNumber(value, decimals = 2) {
  if (value == null || value === '') return '0,00'
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

// Formatar data
export function formatDate(date) {
  if (!date) return ''
  const d = date?.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('pt-BR')
}

export function formatDateTime(date) {
  if (!date) return ''
  const d = date?.toDate ? date.toDate() : new Date(date)
  return d.toLocaleString('pt-BR')
}

// Lista de meses
export const MESES = [
  { value: 'janeiro',   label: 'Janeiro' },
  { value: 'fevereiro', label: 'Fevereiro' },
  { value: 'marco',     label: 'Março' },
  { value: 'abril',     label: 'Abril' },
  { value: 'maio',      label: 'Maio' },
  { value: 'junho',     label: 'Junho' },
  { value: 'julho',     label: 'Julho' },
  { value: 'agosto',    label: 'Agosto' },
  { value: 'setembro',  label: 'Setembro' },
  { value: 'outubro',   label: 'Outubro' },
  { value: 'novembro',  label: 'Novembro' },
  { value: 'dezembro',  label: 'Dezembro' },
]

export function getMesLabel(value) {
  return MESES.find(m => m.value === value)?.label || value
}

// Anos disponíveis (do atual para trás 3 anos)
export function getAnos() {
  const atual = new Date().getFullYear()
  return [atual, atual - 1, atual - 2]
}

// Parse de número brasileiro (1.234,56 → 1234.56)
export function parseBRL(str) {
  if (typeof str === 'number') return str
  if (!str) return 0
  return parseFloat(
    String(str)
      .replace(/\./g, '')
      .replace(',', '.')
  ) || 0
}

// Status chip
export const STATUS_CONFIG = {
  pendente:      { label: 'Pendente',      color: 'bg-amber-100 text-amber-800' },
  pago:          { label: 'Pago',          color: 'bg-emerald-100 text-emerald-800' },
  inconsistencia:{ label: 'Inconsistência',color: 'bg-red-100 text-red-800' },
}

// Campos de encargos para formulário/tabela
export const CAMPOS_ENCARGO = [
  // GPS
  { key: 'salarioBase',       label: 'Salário Base',        grupo: 'GPS' },
  { key: 'nFuncionarios',     label: 'Nº Funcionários',     grupo: 'GPS', isInt: true },
  { key: 'empregado',         label: 'Empregado',           grupo: 'GPS' },
  { key: 'empresa',           label: 'Empresa',             grupo: 'GPS' },
  { key: 'terceiros',         label: 'Terceiros',           grupo: 'GPS' },
  { key: 'ratAjustado',       label: 'RAT Ajustado',        grupo: 'GPS' },
  { key: 'salarioFamilia',    label: 'Salário Família',     grupo: 'GPS' },
  { key: 'salarioMaternidade',label: 'Salário Maternidade', grupo: 'GPS' },
  { key: 'totalGPS',          label: 'Total GPS',           grupo: 'GPS', readonly: true },
  // DARF
  { key: 'pis8301',           label: 'PIS 8301',            grupo: 'DARF' },
  { key: 'irrf0561',          label: 'IRRF 0561',           grupo: 'DARF' },
  { key: 'irrfCongruas',      label: 'IRRF Congruas 0588',  grupo: 'DARF' },
  { key: 'irrf1708',          label: 'IRRF 1708',           grupo: 'DARF' },
  { key: 'cofins5960',        label: 'COFINS 5960',         grupo: 'DARF' },
  { key: 'pis5979',           label: 'PIS 5979',            grupo: 'DARF' },
  { key: 'csll5987',          label: 'CSLL 5987',           grupo: 'DARF' },
  { key: 'inss1162',          label: 'INSS 1162',           grupo: 'DARF' },
  { key: 'totalDARF',         label: 'Total DARF',          grupo: 'DARF', readonly: true },
  // FGTS
  { key: 'fgts',              label: 'FGTS',                grupo: 'FGTS' },
  { key: 'consignado',        label: 'Consignado',          grupo: 'FGTS' },
  { key: 'totalFGTS',         label: 'Total FGTS',          grupo: 'FGTS', readonly: true },
  // Benefícios
  { key: 'sst',               label: 'SST',                 grupo: 'Benefícios' },
  { key: 'odonto',            label: 'Odonto',              grupo: 'Benefícios' },
  { key: 'seguroVida',        label: 'Seguro de Vida',      grupo: 'Benefícios' },
  // Total
  { key: 'totalGeral',        label: 'Total Geral',         grupo: 'Total', readonly: true },
]

// Colunas do CSV/Excel esperadas na importação
export const COLUNAS_IMPORTACAO = [
  'cnpj', 'nome', 'salarioBase', 'nFuncionarios',
  'empregado', 'empresa', 'terceiros', 'ratAjustado',
  'salarioFamilia', 'salarioMaternidade',
  'pis8301', 'irrf0561', 'irrfCongruas', 'irrf1708',
  'cofins5960', 'pis5979', 'csll5987', 'inss1162',
  'fgts', 'consignado', 'sst', 'odonto', 'seguroVida', 'totalGeral',
]
