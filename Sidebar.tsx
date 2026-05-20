'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard, Users, ClipboardList,
  NotesHealth, Salad, ClockHour4, ChartPie,
  Bell, FileText, Activity, LogOut,
} from 'lucide-react'

const NAV = [
  { section: 'GERAL' },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { section: 'PERSONAL TRAINER' },
  { href: '/avaliacoes', label: 'Avaliações físicas', icon: ClipboardList, cor: 'pt' },
  { href: '/treinos', label: 'Prescrição de treino', icon: 'barbell', cor: 'pt' },
  { section: 'NUTRICIONISTA' },
  { href: '/anamnese', label: 'Anamnese nutricional', icon: 'notes', cor: 'nutri' },
  { href: '/plano', label: 'Plano alimentar', icon: 'salad', cor: 'nutri' },
  { href: '/recordatorio', label: 'Recordatório 24h', icon: 'clock', cor: 'nutri' },
  { href: '/macros', label: 'Calculadora de macros', icon: 'chart', cor: 'nutri' },
  { section: 'GESTÃO' },
  { href: '/alertas', label: 'Alertas', icon: Bell, badge: true },
  { href: '/pdfs', label: 'PDFs gerados', icon: FileText },
]

const ICON_MAP: Record<string, string> = {
  barbell: 'ti ti-barbell',
  notes: 'ti ti-notes-medical',
  salad: 'ti ti-salad',
  clock: 'ti ti-clock-hour-4',
  chart: 'ti ti-chart-pie',
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 flex flex-col z-20" style={{ background: '#1a2e1a' }}>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" rel="stylesheet" />

      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #2d4a2d' }}>
        <div className="w-8 h-8 bg-brand-400 rounded-lg flex items-center justify-center flex-shrink-0">
          <i className="ti ti-activity-heartbeat text-white text-sm" />
        </div>
        <div>
          <div className="text-sm font-bold text-green-100 tracking-tight">EvalBuilder</div>
          <div className="text-[9px] tracking-widest" style={{ color: '#4a6a3a' }}>PRO</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {NAV.map((item, i) => {
          if ('section' in item) {
            return (
              <div key={i} className="text-[9px] tracking-widest px-2 pt-3 pb-1" style={{ color: '#3a5a2a' }}>
                {item.section}
              </div>
            )
          }
          const active = pathname.startsWith(item.href!)
          const iconStr = typeof item.icon === 'string' ? ICON_MAP[item.icon] : null

          return (
            <Link
              key={item.href}
              href={item.href!}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-0.5 transition-all"
              style={{
                color: active ? '#e8f5d8' : '#7a9a60',
                background: active ? '#2d4a2d' : 'transparent',
                fontWeight: active ? 500 : 400,
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#243824' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {iconStr
                ? <i className={`${iconStr} text-[13px]`} />
                : item.icon && <item.icon size={13} />
              }
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">!</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: '1px solid #2d4a2d' }}>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px]" style={{ color: '#4a6a3a' }}>Plano Combo</span>
          <span className="text-[10px] font-medium text-brand-400">$67/mês</span>
        </div>
        <div className="rounded-full h-1 mb-1" style={{ background: '#2d4a2d' }}>
          <div className="h-1 rounded-full bg-brand-400" style={{ width: '40%' }} />
        </div>
        <div className="text-[10px] mb-2" style={{ color: '#3a5a2a' }}>0 / 30 clientes</div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-[11px] transition-colors"
          style={{ color: '#7a9a60' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#243824'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <LogOut size={12} /> Sair
        </button>
      </div>
    </aside>
  )
}
