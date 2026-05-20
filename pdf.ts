'use client'
import type { Avaliacao, Cliente, PlanoTreino, PlanoAlimentar, Anamnese } from '@/types'
import { formatarData } from '@/types'

const VERDE: [number,number,number] = [59, 109, 17]
const VERDE_C: [number,number,number] = [234, 243, 222]
const CINZA: [number,number,number] = [100, 100, 100]
const PRETO: [number,number,number] = [30, 30, 30]
const TEAL: [number,number,number] = [15, 110, 86]

async function getDoc() {
  const { jsPDF } = await import('jspdf')
  return jsPDF
}

function header(doc: any, titulo: string, subtitulo: string, cor = VERDE) {
  doc.setFillColor(...cor)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18); doc.setFont('helvetica', 'bold')
  doc.text(titulo, 105, 13, { align: 'center' })
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text(subtitulo, 105, 22, { align: 'center' })
  doc.setTextColor(...PRETO)
}

function secao(doc: any, titulo: string, y: number): number {
  doc.setFillColor(...VERDE_C)
  doc.rect(12, y - 4, 186, 7, 'F')
  doc.setFontSize(8); doc.setFont('helvetica', 'bold')
  doc.setTextColor(...VERDE)
  doc.text(titulo, 15, y)
  doc.setTextColor(...PRETO)
  return y + 7
}

function duplo(doc: any, l1: string, v1: any, l2: string, v2: any, y: number): number {
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...CINZA)
  doc.text(l1, 15, y)
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...PRETO)
  if (v1 != null && v1 !== '') doc.text(String(v1), 95, y, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...CINZA)
  doc.text(l2, 110, y)
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...PRETO)
  if (v2 != null && v2 !== '') doc.text(String(v2), 196, y, { align: 'right' })
  return y + 7
}

function rodape(doc: any) {
  doc.setFontSize(7); doc.setTextColor(180, 180, 180)
  doc.text('Gerado por EvalBuilder · evalbuilder.com.br', 105, 287, { align: 'center' })
}

// ─── PDF: Avaliação Física ──────────────────────────────────────
export async function gerarPDFAvaliacao(av: Avaliacao, cl: Cliente) {
  const jsPDF = await getDoc()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  header(doc, 'AVALIAÇÃO FÍSICA', `${cl.nome}  ·  ${formatarData(av.data_aval)}`)
  let y = 42
  y = secao(doc, 'DADOS DO ALUNO', y)
  y = duplo(doc, 'Nome', cl.nome, 'Sexo', cl.sexo || '—', y)
  y = duplo(doc, 'Objetivo', av.objetivo || '—', 'Nível', av.nivel || '—', y)
  y = duplo(doc, 'Contato', cl.whatsapp || cl.email || '—', '', '', y)
  y += 2
  y = secao(doc, 'COMPOSIÇÃO CORPORAL', y)
  y = duplo(doc, 'Peso', av.peso ? `${av.peso} kg` : undefined, 'Altura', av.altura ? `${av.altura} cm` : undefined, y)
  y = duplo(doc, 'IMC', av.imc, '% Gordura', av.perc_gordura ? `${av.perc_gordura}%` : undefined, y)
  y = duplo(doc, 'Massa magra', av.massa_magra ? `${av.massa_magra} kg` : undefined, 'Massa gorda', av.massa_gorda ? `${av.massa_gorda} kg` : undefined, y)
  y += 2
  if (av.circ_cintura || av.circ_torax) {
    y = secao(doc, 'CIRCUNFERÊNCIAS', y)
    y = duplo(doc, 'Tórax', av.circ_torax ? `${av.circ_torax} cm` : undefined, 'Cintura', av.circ_cintura ? `${av.circ_cintura} cm` : undefined, y)
    y = duplo(doc, 'Quadril', av.circ_quadril ? `${av.circ_quadril} cm` : undefined, 'Braço D', av.circ_braco_d ? `${av.circ_braco_d} cm` : undefined, y)
    y = duplo(doc, 'Coxa D', av.circ_coxa_d ? `${av.circ_coxa_d} cm` : undefined, 'Panturrilha D', av.circ_panturrilha ? `${av.circ_panturrilha} cm` : undefined, y)
    y += 2
  }
  if (av.resist_cardio || av.flexibilidade) {
    y = secao(doc, 'TESTES FÍSICOS', y)
    y = duplo(doc, 'Resistência cardiovascular', av.resist_cardio, 'Flexibilidade', av.flexibilidade, y)
    y = duplo(doc, 'Força abdominal', av.forca_abdominal ? `${av.forca_abdominal} reps` : undefined, 'Pressão arterial', av.pressao_arterial, y)
    y += 2
  }
  if (av.observacoes) {
    y = secao(doc, 'OBSERVAÇÕES', y)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...PRETO)
    const linhas = doc.splitTextToSize(av.observacoes, 180)
    doc.text(linhas, 15, y)
  }
  rodape(doc)
  doc.save(`avaliacao_${cl.nome.replace(/\s+/g, '_')}_${av.data_aval}.pdf`)
}

// ─── PDF: Plano de Treino ───────────────────────────────────────
export async function gerarPDFTreino(plano: PlanoTreino, cl: Cliente) {
  const jsPDF = await getDoc()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  header(doc, 'PLANO DE TREINO', `${cl.nome}  ·  ${plano.nome}  ·  ${plano.frequencia || ''}`)
  let y = 42
  y = secao(doc, 'INFORMAÇÕES DO PLANO', y)
  y = duplo(doc, 'Objetivo', plano.objetivo, 'Frequência', plano.frequencia, y)
  y = duplo(doc, 'Duração estimada', plano.duracao_min ? `${plano.duracao_min} min` : undefined, 'Criado em', formatarData(plano.created_at), y)
  y += 3

  for (const dia of plano.dias || []) {
    if (y > 250) { doc.addPage(); y = 20 }
    doc.setFillColor(...VERDE)
    doc.rect(12, y - 4, 186, 7, 'F')
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
    doc.text(`${dia.label}  —  ${dia.nome}`, 15, y)
    doc.setTextColor(...PRETO)
    y += 8

    for (const ex of dia.exercicios || []) {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...PRETO)
      doc.text(`• ${ex.nome}`, 18, y)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...CINZA)
      const det = [
        ex.series ? `${ex.series} séries` : '',
        ex.repeticoes ? `${ex.repeticoes} reps` : '',
        ex.descanso_s ? `${ex.descanso_s}s descanso` : '',
        ex.grupo || '',
      ].filter(Boolean).join('  ·  ')
      doc.text(det, 196, y, { align: 'right' })
      doc.setTextColor(...PRETO)
      y += 6
      if (ex.obs) {
        doc.setFontSize(8); doc.setTextColor(...CINZA)
        doc.text(`  ${ex.obs}`, 18, y)
        y += 5
      }
    }
    y += 3
  }
  rodape(doc)
  doc.save(`treino_${cl.nome.replace(/\s+/g, '_')}_${plano.nome.replace(/\s+/g, '_')}.pdf`)
}

// ─── PDF: Plano Alimentar ───────────────────────────────────────
export async function gerarPDFPlanoAlimentar(plano: PlanoAlimentar, cl: Cliente) {
  const jsPDF = await getDoc()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  header(doc, 'PLANO ALIMENTAR', `${cl.nome}  ·  ${plano.nome}`, TEAL)
  let y = 42
  y = secao(doc, 'RESUMO NUTRICIONAL', y)
  y = duplo(doc, 'Calorias totais', plano.kcal_total ? `${plano.kcal_total} kcal` : undefined, 'Objetivo', plano.objetivo, y)
  y = duplo(doc, 'Proteína', plano.prot_g ? `${plano.prot_g}g` : undefined, 'Carboidrato', plano.carb_g ? `${plano.carb_g}g` : undefined, y)
  y = duplo(doc, 'Gordura', plano.gord_g ? `${plano.gord_g}g` : undefined, '', '', y)
  y += 3

  for (const ref of plano.refeicoes || []) {
    if (y > 250) { doc.addPage(); y = 20 }
    doc.setFillColor(15, 110, 86)
    doc.rect(12, y - 4, 186, 7, 'F')
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
    doc.text(`${ref.nome}${ref.horario ? `  —  ${ref.horario}` : ''}`, 15, y)
    doc.setTextColor(...PRETO)
    y += 8

    for (const al of ref.alimentos || []) {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...PRETO)
      doc.text(`• ${al.nome}`, 18, y)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...CINZA)
      const det = [
        al.quantidade_g ? `${al.quantidade_g}g` : '',
        al.kcal ? `${al.kcal} kcal` : '',
        al.prot_g ? `P:${al.prot_g}g` : '',
        al.carb_g ? `C:${al.carb_g}g` : '',
        al.gord_g ? `G:${al.gord_g}g` : '',
      ].filter(Boolean).join('  ')
      doc.text(det, 196, y, { align: 'right' })
      doc.setTextColor(...PRETO)
      y += 6
    }
    y += 3
  }
  rodape(doc)
  doc.save(`plano_alimentar_${cl.nome.replace(/\s+/g, '_')}.pdf`)
}

// ─── PDF: Anamnese ──────────────────────────────────────────────
export async function gerarPDFAnamnese(an: Anamnese, cl: Cliente) {
  const jsPDF = await getDoc()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  header(doc, 'ANAMNESE NUTRICIONAL', `${cl.nome}  ·  ${formatarData(an.data_anam)}`, [83, 55, 122])
  let y = 42
  y = secao(doc, 'HISTÓRICO CLÍNICO', y)
  y = duplo(doc, 'Patologias', an.patologias || '—', 'Medicamentos', an.medicamentos || '—', y)
  y = duplo(doc, 'Alergias / intolerâncias', an.alergias || '—', 'Cirurgias', an.cirurgias || '—', y)
  y += 2
  y = secao(doc, 'HÁBITOS ALIMENTARES', y)
  y = duplo(doc, 'Refeições por dia', an.refeicoes_dia, 'Ingesta hídrica', an.ingesta_hidrica || '—', y)
  y = duplo(doc, 'Consome álcool', an.consome_alcool || '—', 'Suplementos', an.suplementos || '—', y)
  y += 2
  if (an.queixas) {
    y = secao(doc, 'QUEIXAS E OBJETIVOS', y)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...PRETO)
    const linhas = doc.splitTextToSize(an.queixas, 180)
    doc.text(linhas, 15, y)
  }
  rodape(doc)
  doc.save(`anamnese_${cl.nome.replace(/\s+/g, '_')}_${an.data_anam}.pdf`)
}
