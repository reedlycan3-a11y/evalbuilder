import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { calcularRisco, diasDesde, formatarData } from '@/types'
import { Avatar, RiskBadge } from '@/components/ui'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function AlertasPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: clientes }, { data: avaliacoes }, { data: treinos }, { data: planos }] = await Promise.all([
    supabase.from('clientes').select('*').eq('prof_id', user.id).eq('ativo', true).order('nome'),
    supabase.from('avaliacoes').select('cliente_id, data_aval').eq('prof_id', user.id).order('data_aval', { ascending: false }),
    supabase.from('planos_treino').select('cliente_id, created_at').eq('prof_id', user.id).order('created_at', { ascending: false }),
    supabase.from('planos_alimentares').select('cliente_id, created_at').eq('prof_id', user.id).order('created_at', { ascending: false }),
  ])

  const ultimaAval: Record<string, string> = {}
  avaliacoes?.forEach(ev => { if (!ultimaAval[ev.cliente_id]) ultimaAval[ev.cliente_id] = ev.data_aval })

  const ultimoTreino: Record<string, string> = {}
  treinos?.forEach(t => { if (!ultimoTreino[t.cliente_id]) ultimoTreino[t.cliente_id] = t.created_at })

  const ultimoPlano: Record<string, string> = {}
  planos?.forEach(p => { if (!ultimoPlano[p.cliente_id]) ultimoPlano[p.cliente_id] = p.created_at })

  const com_alerta = clientes?.map(cl => {
    const diasAval = diasDesde(ultimaAval[cl.id])
    const diasTreino = diasDesde(ultimoTreino[cl.id])
    const diasPlano = diasDesde(ultimoPlano[cl.id])
    const risco = calcularRisco(ultimaAval[cl.id])
    const alertas: string[] = []
    if (diasAval >= 45) alertas.push(diasAval >= 9000 ? 'Nunca avaliado' : `Avaliação: ${diasAval} dias`)
    if (cl.tipo !== 'nutri' && diasTreino >= 60) alertas.push(diasTreino >= 9000 ? 'Sem treino prescrito' : `Treino: ${diasTreino} dias sem atualizar`)
    if (cl.tipo !== 'pt' && diasPlano >= 60) alertas.push(diasPlano >= 9000 ? 'Sem plano alimentar' : `Plano nutricional: ${diasPlano} dias sem atualizar`)
    return { cl, risco, alertas, diasAval }
  }).filter(x => x.alertas.length > 0)
    .sort((a, b) => {
      const ord: any = { urgente: 0, nunca: 1, atencao: 2 }
      return (ord[a.risco] ?? 3) - (ord[b.risco] ?? 3)
    }) ?? []

  const urgentes = com_alerta.filter(x => x.risco === 'urgente' || x.risco === 'nunca')
  const atencao = com_alerta.filter(x => x.risco === 'atencao')
  const ok = clientes?.filter(cl => !com_alerta.find(x => x.cl.id === cl.id)) ?? []

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" rel="stylesheet" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Alertas de retenção</h1>
        <p className="text-sm text-gray-400 mt-1">Clientes que precisam de atenção para não cancelarem</p>
      </div>

      {urgentes.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3 mb-4 text-sm text-red-700">
          <i className="ti ti-alert-circle text-base flex-shrink-0" />
          {urgentes.length} cliente{urgentes.length > 1 ? 's' : ''} sem atualização há mais de 65 dias — risco alto de cancelamento
        </div>
      )}

      {urgentes.length > 0 && (
        <div className="card mb-4">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><span className="badge-danger">Urgente</span></h2>
          {urgentes.map(({ cl, alertas }) => (
            <div key={cl.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
              <Avatar nome={cl.nome} size="sm" />
              <div className="flex-1">
                <div className="font-medium text-sm">{cl.nome}</div>
                <div className="text-xs text-gray-400">{alertas.join(' · ')}</div>
              </div>
              <RiskBadge data={ultimaAval[cl.id]} />
              <div className="flex gap-1.5">
                {(cl.tipo === 'pt' || cl.tipo === 'ambos') && (
                  <Link href={`/nova-avaliacao?cliente=${cl.id}`} className="btn-primary btn-sm text-xs"><Plus size={11} /> Avaliar</Link>
                )}
                {(cl.tipo === 'nutri' || cl.tipo === 'ambos') && (
                  <Link href={`/plano?cliente=${cl.id}`} className="btn-nutri btn-sm text-xs"><i className="ti ti-salad text-xs" /> Plano</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {atencao.length > 0 && (
        <div className="card mb-4">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><span className="badge-warn">Atenção (45–64 dias)</span></h2>
          {atencao.map(({ cl, alertas }) => (
            <div key={cl.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
              <Avatar nome={cl.nome} size="sm" />
              <div className="flex-1">
                <div className="font-medium text-sm">{cl.nome}</div>
                <div className="text-xs text-gray-400">{alertas.join(' · ')}</div>
              </div>
              <RiskBadge data={ultimaAval[cl.id]} />
              <Link href={`/nova-avaliacao?cliente=${cl.id}`} className="btn-secondary btn-sm text-xs"><Plus size={11} /> Avaliar</Link>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold text-sm mb-3 flex items-center gap-2"><span className="badge-ok">Em dia ({ok.length})</span></h2>
        {ok.slice(0, 5).map(cl => (
          <div key={cl.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
            <Avatar nome={cl.nome} size="sm" />
            <div className="flex-1"><div className="font-medium text-sm">{cl.nome}</div></div>
            <RiskBadge data={ultimaAval[cl.id]} />
          </div>
        ))}
        {ok.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Todos os clientes precisam de atenção.</p>}
      </div>
    </>
  )
}
