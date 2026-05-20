import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { formatarData, calcularRisco, diasDesde } from '@/types'
import { Avatar, RiskBadge, TipoBadge, StatCard, EmptyState } from '@/components/ui'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: clientes },
    { data: avaliacoes },
    { data: treinos },
    { data: planos },
    { data: anamneses },
  ] = await Promise.all([
    supabase.from('clientes').select('*').eq('prof_id', user.id).eq('ativo', true).order('nome'),
    supabase.from('avaliacoes').select('*, cliente:clientes(nome)').eq('prof_id', user.id).order('data_aval', { ascending: false }).limit(6),
    supabase.from('planos_treino').select('*, cliente:clientes(nome)').eq('prof_id', user.id).order('created_at', { ascending: false }).limit(4),
    supabase.from('planos_alimentares').select('*, cliente:clientes(nome)').eq('prof_id', user.id).order('created_at', { ascending: false }).limit(4),
    supabase.from('anamneses').select('cliente_id, data_anam').eq('prof_id', user.id),
  ])

  const ultimaAval: Record<string, string> = {}
  avaliacoes?.forEach(ev => { if (!ultimaAval[ev.cliente_id]) ultimaAval[ev.cliente_id] = ev.data_aval })

  const emRisco = clientes?.filter(cl => {
    const r = calcularRisco(ultimaAval[cl.id])
    return r === 'urgente' || r === 'nunca'
  }).length ?? 0

  const atividades = [
    ...(avaliacoes?.slice(0, 3).map(ev => ({ tipo: 'aval', nome: `Avaliação física — ${(ev.cliente as any)?.nome}`, data: formatarData(ev.data_aval), icon: 'ti-clipboard-check', cor: 'text-brand-600' })) ?? []),
    ...(treinos?.slice(0, 2).map(t => ({ tipo: 'treino', nome: `Treino prescrito — ${(t.cliente as any)?.nome}`, data: formatarData(t.created_at), icon: 'ti-barbell', cor: 'text-brand-400' })) ?? []),
    ...(planos?.slice(0, 2).map(p => ({ tipo: 'plano', nome: `Plano alimentar — ${(p.cliente as any)?.nome}`, data: formatarData(p.created_at), icon: 'ti-salad', cor: 'text-nutri-400' })) ?? []),
  ].sort(() => Math.random() - 0.5).slice(0, 6)

  return (
    <div>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" rel="stylesheet" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Visão geral dos seus clientes e atendimentos</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Clientes ativos" value={clientes?.length ?? 0} />
        <StatCard label="Avaliações geradas" value={avaliacoes?.length ?? 0} />
        <StatCard label="Planos alimentares" value={planos?.length ?? 0} />
        <StatCard label="Alertas pendentes" value={emRisco} danger={emRisco > 0} />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Clientes recentes</h2>
            <Link href="/clientes" className="btn-ghost text-xs">Ver todos</Link>
          </div>
          {!clientes?.length ? <EmptyState icon="ti-users" title="Nenhum cliente ainda" sub="Cadastre o primeiro cliente" /> : (
            clientes.slice(0, 5).map(cl => (
              <div key={cl.id} className="table-row">
                <Avatar nome={cl.nome} size="sm" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{cl.nome}</div>
                  <div className="text-xs text-gray-400">{cl.objetivo || '—'}</div>
                </div>
                <TipoBadge tipo={cl.tipo} />
                <RiskBadge data={ultimaAval[cl.id]} />
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Atividade recente</h2>
          </div>
          {!atividades.length ? <EmptyState icon="ti-timeline" title="Nenhuma atividade ainda" /> : (
            atividades.map((at, i) => (
              <div key={i} className="table-row">
                <i className={`ti ${at.icon} text-sm flex-shrink-0 ${at.cor}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{at.nome}</div>
                  <div className="text-xs text-gray-400">{at.data}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card mb-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Avaliações físicas recentes</h2>
          <Link href="/nova-avaliacao" className="btn-primary text-xs">
            <Plus size={13} /> Nova avaliação
          </Link>
        </div>
        {!avaliacoes?.length ? <EmptyState icon="ti-clipboard-list" title="Nenhuma avaliação ainda" sub="Crie a primeira avaliação de um cliente" /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b border-gray-100">
              <th className="pb-2 text-xs text-gray-400 font-medium">CLIENTE</th>
              <th className="pb-2 text-xs text-gray-400 font-medium">DATA</th>
              <th className="pb-2 text-xs text-gray-400 font-medium">PESO</th>
              <th className="pb-2 text-xs text-gray-400 font-medium">% GORDURA</th>
              <th className="pb-2 text-xs text-gray-400 font-medium">IMC</th>
              <th className="pb-2"></th>
            </tr></thead>
            <tbody>
              {avaliacoes.map(ev => (
                <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <Avatar nome={(ev.cliente as any)?.nome ?? '?'} size="sm" />
                      <span className="font-medium">{(ev.cliente as any)?.nome}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-gray-500">{formatarData(ev.data_aval)}</td>
                  <td className="py-2.5">{ev.peso ? `${ev.peso}kg` : '—'}</td>
                  <td className="py-2.5">{ev.perc_gordura ? `${ev.perc_gordura}%` : '—'}</td>
                  <td className="py-2.5">{ev.imc ?? '—'}</td>
                  <td className="py-2.5">
                    <Link href={`/avaliacoes/${ev.id}`} className="btn-ghost text-xs">
                      <FileText size={12} /> Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {emRisco > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Clientes em risco de churn</h2>
            <span className="badge-danger">{emRisco} urgentes</span>
          </div>
          {clientes?.filter(cl => {
            const r = calcularRisco(ultimaAval[cl.id])
            return r === 'urgente' || r === 'nunca'
          }).map(cl => (
            <div key={cl.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl mb-2 last:mb-0">
              <Avatar nome={cl.nome} size="sm" />
              <div className="flex-1">
                <div className="font-medium text-sm">{cl.nome}</div>
                <div className="text-xs text-gray-400">
                  {ultimaAval[cl.id]
                    ? `Última avaliação: ${formatarData(ultimaAval[cl.id])} (${diasDesde(ultimaAval[cl.id])} dias)`
                    : 'Nunca avaliado'}
                </div>
              </div>
              <RiskBadge data={ultimaAval[cl.id]} />
              <Link href={`/nova-avaliacao?cliente=${cl.id}`} className="btn-primary text-xs">
                <Plus size={12} /> Avaliar
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}