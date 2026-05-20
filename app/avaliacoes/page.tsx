'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Avaliacao } from '@/types'
import { formatarData } from '@/types'
import { Avatar, EmptyState, PageHeader, showToast } from '@/components/ui'
import Link from 'next/link'
import { Plus, Download, Trash2, Link2 } from 'lucide-react'
import { gerarPDFAvaliacao } from '@/lib/pdf'

export default function AvaliacoesPage() {
  const supabase = createClient()
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('avaliacoes').select('*, cliente:clientes(*)').eq('prof_id', user.id).order('data_aval', { ascending: false })
    setAvaliacoes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const excluir = async (id: string) => {
    if (!confirm('Excluir esta avaliação?')) return
    await supabase.from('avaliacoes').delete().eq('id', id)
    load()
    showToast('Avaliação removida')
  }

  const baixar = async (av: Avaliacao) => {
    await gerarPDFAvaliacao(av, av.cliente as any)
  }

  const copiarLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/eval/${token}`)
    showToast('Link copiado!')
  }

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" rel="stylesheet" />
      <PageHeader title="Avaliações físicas" subtitle="Histórico completo de avaliações antropométricas"
        action={<Link href="/nova-avaliacao" className="btn-primary"><Plus size={14} /> Nova avaliação</Link>}
      />
      <div className="card">
        {loading ? <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
          : !avaliacoes.length ? <EmptyState icon="ti-clipboard-list" title="Nenhuma avaliação ainda" sub='Clique em "Nova avaliação" para começar' />
          : avaliacoes.map(av => (
            <div key={av.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
              <Avatar nome={(av.cliente as any)?.nome ?? '?'} size="sm" />
              <div className="flex-1">
                <div className="font-medium text-sm">{(av.cliente as any)?.nome}</div>
                <div className="text-xs text-gray-400">
                  {formatarData(av.data_aval)}
                  {av.peso ? ` · ${av.peso}kg` : ''}
                  {av.perc_gordura ? ` · ${av.perc_gordura}% gordura` : ''}
                  {av.imc ? ` · IMC ${av.imc}` : ''}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button className="btn-ghost btn-sm text-xs" onClick={() => copiarLink(av.link_token!)}><Link2 size={12} /></button>
                <button className="btn-secondary btn-sm text-xs" onClick={() => baixar(av)}><Download size={12} /> PDF</button>
                <button className="btn-danger btn-sm text-xs" onClick={() => excluir(av.id)}><Trash2 size={12} /></button>
              </div>
            </div>
          ))
        }
      </div>
    </>
  )
}
