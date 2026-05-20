export type ProfTipo = 'pt' | 'nutri' | 'ambos'
export type Plano = 'starter' | 'pro' | 'combo'
export type ClienteTipo = 'pt' | 'nutri' | 'ambos'

export interface Profile {
  id: string
  nome?: string
  email?: string
  tipo: ProfTipo
  plano: Plano
  stripe_customer_id?: string
  stripe_subscription_id?: string
  trial_ends_at?: string
  created_at: string
}

export interface Cliente {
  id: string
  prof_id: string
  nome: string
  email?: string
  whatsapp?: string
  sexo?: string
  data_nasc?: string
  objetivo?: string
  tipo: ClienteTipo
  ativo: boolean
  obs?: string
  created_at: string
}

export interface Avaliacao {
  id: string
  prof_id: string
  cliente_id: string
  data_aval: string
  peso?: number
  altura?: number
  imc?: number
  perc_gordura?: number
  massa_magra?: number
  massa_gorda?: number
  circ_torax?: number
  circ_cintura?: number
  circ_quadril?: number
  circ_braco_d?: number
  circ_coxa_d?: number
  circ_panturrilha?: number
  resist_cardio?: string
  flexibilidade?: string
  forca_abdominal?: number
  pressao_arterial?: string
  objetivo?: string
  nivel?: string
  observacoes?: string
  link_token?: string
  created_at: string
  cliente?: Cliente
}

export interface PlanoTreino {
  id: string
  prof_id: string
  cliente_id: string
  nome: string
  objetivo?: string
  frequencia?: string
  duracao_min?: number
  ativo: boolean
  link_token?: string
  created_at: string
  cliente?: Cliente
  dias?: DiaTreino[]
}

export interface DiaTreino {
  id: string
  plano_id: string
  prof_id: string
  label: string
  nome: string
  ordem: number
  created_at: string
  exercicios?: Exercicio[]
}

export interface Exercicio {
  id: string
  dia_id: string
  prof_id: string
  nome: string
  grupo?: string
  series?: number
  repeticoes?: string
  descanso_s?: number
  obs?: string
  ordem: number
  created_at: string
}

export interface Anamnese {
  id: string
  prof_id: string
  cliente_id: string
  data_anam: string
  patologias?: string
  medicamentos?: string
  alergias?: string
  cirurgias?: string
  refeicoes_dia?: number
  ingesta_hidrica?: string
  consome_alcool?: string
  suplementos?: string
  queixas?: string
  link_token?: string
  created_at: string
  cliente?: Cliente
}

export interface PlanoAlimentar {
  id: string
  prof_id: string
  cliente_id: string
  nome: string
  objetivo?: string
  kcal_total?: number
  prot_g?: number
  carb_g?: number
  gord_g?: number
  ativo: boolean
  link_token?: string
  created_at: string
  cliente?: Cliente
  refeicoes?: Refeicao[]
}

export interface Refeicao {
  id: string
  plano_id: string
  prof_id: string
  nome: string
  horario?: string
  ordem: number
  created_at: string
  alimentos?: Alimento[]
}

export interface Alimento {
  id: string
  refeicao_id: string
  prof_id: string
  nome: string
  quantidade_g?: number
  kcal?: number
  prot_g?: number
  carb_g?: number
  gord_g?: number
  ordem: number
  created_at: string
}

export interface Recordatorio {
  id: string
  prof_id: string
  cliente_id: string
  data_ref: string
  kcal_meta?: number
  kcal_total?: number
  obs?: string
  link_token?: string
  created_at: string
  cliente?: Cliente
}

// ─── Helpers ──────────────────────────────────────────────────────

export function formatarData(data?: string): string {
  if (!data) return '—'
  const d = data.split('T')[0]
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export function diasDesde(data?: string): number {
  if (!data) return 9999
  return Math.floor((Date.now() - new Date(data).getTime()) / 86400000)
}

export type RiscoNivel = 'ok' | 'atencao' | 'urgente' | 'nunca'

export function calcularRisco(dataUltimaAval?: string): RiscoNivel {
  if (!dataUltimaAval) return 'nunca'
  const d = diasDesde(dataUltimaAval)
  if (d < 45) return 'ok'
  if (d < 65) return 'atencao'
  return 'urgente'
}

export function calcIMC(peso: number, altura: number): number {
  return parseFloat((peso / ((altura / 100) ** 2)).toFixed(1))
}

// Mifflin-St Jeor
export function calcTMB(peso: number, altura: number, idade: number, sexo: 'M' | 'F'): number {
  return sexo === 'F'
    ? 10 * peso + 6.25 * altura - 5 * idade - 161
    : 10 * peso + 6.25 * altura - 5 * idade + 5
}

export const GRUPOS_MUSCULARES = [
  'Peito','Costas','Ombros','Bíceps','Tríceps',
  'Quadríceps','Posterior','Glúteos','Panturrilha',
  'Abdômen','Antebraço','Trapézio','Cardio',
]

export const LABELS_DIA = ['DIA A','DIA B','DIA C','DIA D','DIA E','DIA F','DIA G']
