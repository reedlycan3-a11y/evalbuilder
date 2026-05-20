'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatarData } from '@/types'
import { PageHeader, Avatar, EmptyState } from '@/components/ui'
import { Download, Link2 } from 'lucide-react'
import { gerarPDFAvaliacao, gerarPDFTreino, gerarPDFPlanoAlimentar, gerarPDFAnamnese } from '@/lib/pdf'

export default function PDFsPage() {
  const supabase = createClient()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'aval' | 'treino' | 'plano' | 'anam'>('todos')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: avs }, { data: trs }, { data: pls }, { data: ans }] = await Promise.all([
        supabase.from('avaliacoes').select('id, data_aval, link_token, cliente_id, cliente:clientes(nome, whatsapp, email, sexo, data_nasc, objetivo, tipo)').eq('prof_id', user.id).order('data_aval', { ascending: false }).limit(20),
        supabase.from('planos_treino').select('id, nome, created_at, link_token, cliente_id, frequencia, objetivo, duracao_min, cliente:clientes(nome)').eq('prof_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('planos_alimentares').select('id, nome, created_at, link_token, cliente_id, kcal_total, prot_g, carb_g, gord_g, objetivo, cliente:clientes(nome)').eq('prof_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('anamneses').select('id, data_anam, link_token, cliente_id, alergias, patologias, medicamentos, cirurgias, refeicoes_dia, ingesta_hidrica, consome_alcool, suplementos, queixas, cliente:clientes(nome)').eq('prof_id', user.id).order('data_anam', { ascending: false }).limit(20),
      ])

      const lista = [
        ...(avs?.map(a => ({ ...a, _tipo: 'aval', _nome: `Avaliação física — ${(a.cliente as any)?.nome}`, _data: a.data_aval, _sub: `${a.data_aval}`, _icon: 'ti-clipboard-list', _cor: 'text-brand-600' })) ?? []),
        ...(trs?.map(t => ({ ...t, _tipo: 'treino', _nome: `Plano de treino — ${(t.cliente as any)?.nome}`, _data: t.created_at, _sub: `${t.nome} · ${t.frequencia ?? ''}`, _icon: 'ti-barbell', _cor: 'text-brand-400' })) ?? []),
        ...(pls?.map(p => ({ ...p, _tipo: 'plano', _nome: `Plano alimentar — ${(p.cliente as any)?.nome}`, _data: p.created_at, _sub: `${p.nome}${p.kcal_total ? ` · ${Math.round(p.kcal_total)} kcal` : ''}`, _icon: 'ti-salad', _cor: 'text-nutri-400' })) ?? []),
        ...(ans?.map(a => ({ ...a, _tipo: 'anam', _nome: `Anamnese nutricional — ${(a.cliente as any)?.nome}`, _data: a.data_anam, _sub: a.data_anam, _icon: 'ti-notes-medical', _cor: 'text-purple-500' })) ?? []),
      ].sort((a, b) => new Date(b._data).getTime() - new Date(a._data).getTime())
      setItems(lista)
      setLoading(false)
    }
    load()
  }, [])

  const baixar = async (item: any) => {
    const cl = item.cliente as any
    if (item._tipo === 'aval') { await gerarPDFAvaliacao(item, cl); return }
    if (item._tipo === 'treino') {
      const { data: dias } = await supabase.from('dias_treino').select('*, exercicios(*)').eq('plano_id', item.id).order('ordem')
      await gerarPDFTreino({ ...item, dias: dias ?? [] }, cl)
      return
    }
    if (item._tipo === 'plano') {
      const { data: refs } = await supabase.from('refeicoes').select('*, alimentos(*)').eq('plano_id', item.id).order('ordem')
      await gerarPDFPlanoAlimentar({ ...item, refeicoes: refs ?? [] }, cl)
      return
    }
    if (item._tipo === 'anam') { await gerarPDFAnamnese(item, cl); return }
  }

  const copiarLink = (token: string, tipo: string) => {
    const paths: Record<string, string> = { aval: 'eval', treino: 'treino', plano: 'plano' }
    if (!paths[tipo]) return
    navigator.clipboard.writeText(`${window.location.origin}/${paths[tipo]}/${token}`)
  }

  const filtrados = filtro === 'todos' ? items : items.filter(x => x._tipo === filtro)

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" rel="stylesheet" />
      <PageHeader title="PDFs gerados" subtitle="Avaliações, treinos, planos e anamneses prontos para download" />

      <div className="flex gap-2 mb-5">
        {[['todos','Todos'],['aval','Avaliações'],['treino','Treinos'],['plano','Planos nutricionais'],['anam','Anamneses']].map(([v, l]) => (
          <button key={v} onClick={() => setFiltro(v as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtro === v ? 'bg-brand-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? <div className="text-center py-10 text-gray-400 text-sm">Carregando...</div>
          : !filtrados.length ? <EmptyState icon="ti-file-text" title="Nenhum documento ainda" sub="Crie avaliações, treinos ou planos para ver aqui" />
          : filtrados.map(item => (
            <div key={`${item._tipo}-${item.id}`} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
              <i className={`ti ${item._icon} text-base flex-shrink-0 ${item._cor}`} />
              <div className="flex-1">
                <div className="font-medium text-sm">{item._nome}</div>
                <div className="text-xs text-gray-400">{item._sub} · {formatarData(item._data)}</div>
              </div>
              <div className="flex gap-1.5">
                {item.link_token && item._tipo !== 'anam' && (
                  <button className="btn-ghost btn-sm text-xs" onClick={() => copiarLink(item.link_token, item._tipo)}><Link2 size={12} /></button>
                )}
                <button className="btn-secondary btn-sm text-xs" onClick={() => baixar(item)}><Download size={12} /> Baixar</button>
              </div>
            </div>
          ))
        }
      </div>
    </>
  )
}
