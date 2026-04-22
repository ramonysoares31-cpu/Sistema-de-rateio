import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, getMesLabel } from './formatters'

/**
 * Gera o demonstrativo de encargos em PDF para uma unidade
 */
export function gerarDemonstrativoPDF(encargo, unidade, mes, ano) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  doc.setFillColor(20, 23, 39)
  doc.rect(0, 0, pageW, 38, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('ARQUIDIOCESE DE MACEIÓ', margin, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Apuração Previdenciária — Demonstrativo de Encargos', margin, 21)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`${getMesLabel(mes).toUpperCase()} / ${ano}`, margin, 30)

  // Unidade
  doc.setFillColor(240, 242, 248)
  doc.rect(0, 38, pageW, 18, 'F')
  doc.setTextColor(20, 23, 39)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(unidade.nome, margin, 47)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(`CNPJ: ${unidade.cnpj}`, margin, 53)

  let y = 64

  // ── Seção GPS ──────────────────────────────────────────────────────────────
  y = renderSecao(doc, 'GPS — Guia da Previdência Social', [
    ['Salário Base',        formatCurrency(encargo.salarioBase)],
    ['Nº Funcionários',     encargo.nFuncionarios ?? 0],
    ['Empregado',           formatCurrency(encargo.empregado)],
    ['Empresa',             formatCurrency(encargo.empresa)],
    ['Terceiros',           formatCurrency(encargo.terceiros)],
    ['RAT Ajustado',        formatCurrency(encargo.ratAjustado)],
    ['Salário Família',     formatCurrency(encargo.salarioFamilia)],
    ['Salário Maternidade', formatCurrency(encargo.salarioMaternidade)],
  ], formatCurrency(encargo.totalGPS), y, doc, margin, pageW)

  y += 6

  // ── Seção DARF ─────────────────────────────────────────────────────────────
  y = renderSecao(doc, 'DARF — Documento de Arrecadação de Receitas Federais', [
    ['PIS 8301',           formatCurrency(encargo.pis8301)],
    ['IRRF 0561',          formatCurrency(encargo.irrf0561)],
    ['IRRF Congruas 0588', formatCurrency(encargo.irrfCongruas)],
    ['IRRF 1708',          formatCurrency(encargo.irrf1708)],
    ['COFINS 5960',        formatCurrency(encargo.cofins5960)],
    ['PIS 5979',           formatCurrency(encargo.pis5979)],
    ['CSLL 5987',          formatCurrency(encargo.csll5987)],
    ['INSS 1162',          formatCurrency(encargo.inss1162)],
  ], formatCurrency(encargo.totalDARF), y, doc, margin, pageW)

  y += 6

  // ── Seção FGTS ─────────────────────────────────────────────────────────────
  y = renderSecao(doc, 'FGTS — Fundo de Garantia do Tempo de Serviço', [
    ['FGTS',        formatCurrency(encargo.fgts)],
    ['Consignado',  formatCurrency(encargo.consignado)],
  ], formatCurrency(encargo.totalFGTS), y, doc, margin, pageW)

  y += 6

  // ── Seção Benefícios ───────────────────────────────────────────────────────
  y = renderSecao(doc, 'Benefícios', [
    ['SST',           formatCurrency(encargo.sst)],
    ['Odonto',        formatCurrency(encargo.odonto)],
    ['Seguro de Vida',formatCurrency(encargo.seguroVida)],
  ], null, y, doc, margin, pageW)

  y += 8

  // ── Total Geral ────────────────────────────────────────────────────────────
  doc.setFillColor(20, 23, 39)
  doc.roundedRect(margin, y, pageW - margin * 2, 14, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL GERAL', margin + 4, y + 9)
  doc.text(formatCurrency(encargo.totalGeral), pageW - margin - 4, y + 9, { align: 'right' })

  // ── Rodapé ─────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(
    `Gerado em ${new Date().toLocaleString('pt-BR')} — Sistema de Rateio — Arquidiocese de Maceió`,
    pageW / 2, pageH - 8, { align: 'center' }
  )

  return doc
}

function renderSecao(doc, titulo, linhas, total, y, margin, pageW) {
  // Título da seção
  doc.setFillColor(232, 236, 248)
  doc.rect(margin, y, pageW - margin * 2, 7, 'F')
  doc.setTextColor(20, 23, 39)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(titulo, margin + 3, y + 5)
  y += 9

  // Linhas
  for (const [label, valor] of linhas) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(60, 60, 60)
    doc.text(label, margin + 3, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(20, 23, 39)
    doc.text(String(valor), pageW - margin - 3, y, { align: 'right' })

    // Linha divisória leve
    doc.setDrawColor(220, 220, 230)
    doc.setLineWidth(0.2)
    doc.line(margin, y + 1.5, pageW - margin, y + 1.5)
    y += 7
  }

  // Total da seção
  if (total) {
    doc.setFillColor(245, 246, 250)
    doc.rect(margin, y, pageW - margin * 2, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(20, 23, 39)
    doc.text('Subtotal', margin + 3, y + 5)
    doc.text(total, pageW - margin - 3, y + 5, { align: 'right' })
    y += 9
  }

  return y
}

/**
 * Exporta o demonstrativo e dispara o download
 */
export function downloadDemonstrativo(encargo, unidade, mes, ano) {
  const doc = gerarDemonstrativoPDF(encargo, unidade, mes, ano)
  const nomeArquivo = `demonstrativo_${unidade.cnpj}_${mes}_${ano}.pdf`
  doc.save(nomeArquivo)
}

/**
 * Retorna o PDF como Blob (para upload no Storage)
 */
export function getDemonstrativoBlob(encargo, unidade, mes, ano) {
  const doc = gerarDemonstrativoPDF(encargo, unidade, mes, ano)
  return doc.output('blob')
}
