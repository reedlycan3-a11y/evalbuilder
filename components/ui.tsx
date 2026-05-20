'use client'
import { calcularRisco, diasDesde } from '@/types'
import { CheckCircle, AlertTriangle, AlertCircle, Clock } from 'lucide-react'

// ─── Avatar ──────────────────────────────────────────────────────
const CORES = ['bg-green-50 text-green-800','bg-teal-50 text-teal-700','bg-amber-50 text-amber-700','bg-purple-50 text-purple-700','bg-blue-50 text-blue-700']
export function Avatar({ nome, size = 'md' }: { nome: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const cor = CORES[nome.charCodeAt(0) % CORES.length]
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-9 h-9 text-xs'
  return <div className={`${sz} ${cor} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>{initials}</div>
}

// ─── RiskBadge ───────────────────────────────────────────────────
export function RiskBadge({ data }: { data?: string }) {
  const risco = calcularRisco(data)
  const dias = diasDesde(data)
  if (risco === 'ok') return <span className="badge-ok"><CheckCircle size={10} />Em dia</span>
  if (risco === 'atencao') return <span className="badge-warn"><AlertTriangle size={10} />{dias}d</span>
  if (risco === 'urgente') return <span className="badge-danger"><AlertCircle size={10} />{dias}d</span>
  return <span className="badge-gray"><Clock size={10} />Nunca</span>
}

// ─── ClienteTipoBadge ────────────────────────────────────────────
export function TipoBadge({ tipo }: { tipo: string }) {
  if (tipo === 'pt') return <span className="badge-ok"><i className="ti ti-barbell text-[9px]" />PT</span>
  if (tipo === 'nutri') return <span className="badge-teal"><i className="ti ti-salad text-[9px]" />Nutri</span>
  return <span className="badge-purple"><i className="ti ti-adjustments-alt text-[9px]" />PT + Nutri</span>
}

// ─── PageHeader ──────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── StatCard ────────────────────────────────────────────────────
export function StatCard({ label, value, badge, danger }: { label: string; value: number | string; badge?: string; danger?: boolean }) {
  return (
    <div className="stat-card">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-3xl font-bold tracking-tight ${danger ? 'text-red-500' : ''}`}>{value}</div>
      {badge && <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{badge}</span>}
    </div>
  )
}

// ─── EmptyState ──────────────────────────────────────────────────
export function EmptyState({ icon, title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="text-center py-14">
      {icon && <i className={`ti ${icon} text-4xl text-gray-200 mb-3 block`} />}
      <p className="font-medium text-gray-500">{title}</p>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Toast ───────────────────────────────────────────────────────
let _setToast: ((msg: string) => void) | null = null
export function showToast(msg: string) { _setToast?.(msg) }

export function ToastContainer() {
  const [msg, setMsg] = React.useState('')
  const [vis, setVis] = React.useState(false)
  React.useEffect(() => {
    _setToast = (m) => { setMsg(m); setVis(true); setTimeout(() => setVis(false), 3000) }
  }, [])
  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <div className="text-sm px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg" style={{ background: '#1a2e1a', color: '#c8ddb0' }}>
        <CheckCircle size={14} />{msg}
      </div>
    </div>
  )
}

import React from 'react'
