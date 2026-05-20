'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Cliente, ClienteTipo } from '@/types'
import { formatarData, calcularRisco, diasDesde } from '@/types'
import { Avatar, RiskBadge, TipoBadge, Modal, PageHeader, EmptyState, showToast } from '@/components/ui'
import Link from 'next/link'
import { Plus, Search, Trash2, ClipboardPlus, ChevronDown } from 'lucide-react'

export default function ClientesPage() {
  const supabase = createClient()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [ultimaAval, setUltimaAval] = useState<Record<string, string>>({})
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | ClienteTipo>('todos')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', whatsapp: '', sexo: '', objetivo: '', data_nasc: '', tipo: 'pt' as ClienteTipo, obs: '' })

  const carregar = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: cls }, { data: avs }] = await Promise.all([
      supabase.from('clientes').select('*').eq('prof_id', user.id).eq('ativo', true).order('nome'),
      supabase.from('avaliacoes').select('cliente_id, data_aval').eq('prof_id', user.id).order('data_aval', { ascending: false }),
    ])
    const mapa: Record<string, string> = {}
    avs?.forEach(ev => { if (!mapa[ev.cliente_id]) mapa[ev.cliente_id] = ev.data_aval })
    setClientes(cls ?? [])
    setUltimaAval(mapa)
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  const salvar = async () => {
    if (!form.nome.trim()) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('clientes').insert({ ...form, prof_id: user.id })
    setSalvando(false)
    if (error) { showToast('Erro ao salvar'); return }
    setModal(false)
    setForm({ nome: '', email: '', whatsapp: '', sexo: '', objetivo: '', data_nasc: '', tipo: 'pt', obs: '' })
    carregar()
    showToast('Cliente cadastrado!')
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir este cliente? Todos os dados serão removidos.')) return
    await supabase.from('clientes').update({ ativo: false }).eq('id', id)
    carregar()
    showToast('Cliente removido')
  }

  const filtrados = clientes
    .filter(cl => filtroTipo === 'todos' || cl.tipo === filtroTipo)
    .filter(cl => cl.nome.toLowerCase().includes(busca.toLowerCase()))

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" rel="stylesheet" />
      <PageHeader
        title="Clientes"
        subtitle="Gerencie sua base de clientes"
        action={<button className="btn-primary" onClick={() => setModal(true)}><Plus size={15} /> Novo cliente</button>}
      />

      <div className="card">
        {/* Filtros */}
        <div className="flex gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <Search size={14} className="text-gray-400" />
            <input className="bg-transparent text-sm flex-1 outline-none placeholder:text-gray-400" placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <div className="flex gap-1">
            {[['todos', 'Todos'], ['pt', 'PT'], ['nutri', 'Nutri'], ['ambos', 'PT+Nutri']].map(([val, lab]) => (
              <button key={val} onClick={() => setFiltroTipo(val as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroTipo === val ? 'bg-brand-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {lab}
              </button>
            ))}
          </div>
        </div>

        {loading ? <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
          : !filtrados.length ? <EmptyState icon="ti-users" title="Nenhum cliente encontrado" sub='Clique em "Novo cliente" para começar' />
          : (
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b border-gray-100">
                <th className="pb-2 text-xs text-gray-400 font-medium">CLIENTE</th>
                <th className="pb-2 text-xs text-gray-400 font-medium">TIPO</th>
                <th className="pb-2 text-xs text-gray-400 font-medium">OBJETIVO</th>
                <th className="pb-2 text-xs text-gray-400 font-medium">ÚLTIMA AVAL.</th>
                <th className="pb-2 text-xs text-gray-400 font-medium">STATUS</th>
                <th className="pb-2"></th>
              </tr></thead>
              <tbody>
                {filtrados.map(cl => (
                  <tr key={cl.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar nome={cl.nome} size="sm" />
                        <div>
                          <div className="font-medium">{cl.nome}</div>
                          <div className="text-xs text-gray-400">{cl.email || cl.whatsapp || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5"><TipoBadge tipo={cl.tipo} /></td>
                    <td className="py-2.5 text-gray-500">{cl.objetivo || '—'}</td>
                    <td className="py-2.5 text-gray-500">{ultimaAval[cl.id] ? formatarData(ultimaAval[cl.id]) : 'Nunca'}</td>
                    <td className="py-2.5"><RiskBadge data={ultimaAval[cl.id]} /></td>
                    <td className="py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/nova-avaliacao?cliente=${cl.id}`} className="btn-ghost text-xs"><i className="ti ti-clipboard-plus text-xs" /> Avaliar</Link>
                        <button onClick={() => excluir(cl.id)} className="btn-ghost text-xs text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Novo cliente">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Nome completo *</label><input className="input" placeholder="João Silva" value={form.nome} onChange={e => set('nome', e.target.value)} /></div>
          <div><label className="label">WhatsApp</label><input className="input" placeholder="(11) 99999-9999" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></div>
          <div><label className="label">E-mail</label><input className="input" type="email" placeholder="joao@email.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div><label className="label">Sexo</label><select className="input" value={form.sexo} onChange={e => set('sexo', e.target.value)}><option value="">—</option><option>Masculino</option><option>Feminino</option><option>Outro</option></select></div>
          <div><label className="label">Data de nascimento</label><input className="input" type="date" value={form.data_nasc} onChange={e => set('data_nasc', e.target.value)} /></div>
          <div><label className="label">Objetivo</label>
            <select className="input" value={form.objetivo} onChange={e => set('objetivo', e.target.value)}>
              <option value="">—</option><option>Emagrecimento</option><option>Hipertrofia</option><option>Condicionamento físico</option><option>Saúde e qualidade de vida</option><option>Performance esportiva</option><option>Reabilitação</option>
            </select>
          </div>
          <div><label className="label">Tipo de atendimento</label>
            <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value as ClienteTipo)}>
              <option value="pt">Personal Trainer</option><option value="nutri">Nutrição</option><option value="ambos">PT + Nutrição</option>
            </select>
          </div>
          <div className="col-span-2"><label className="label">Observações</label><textarea className="input min-h-[60px] resize-none" placeholder="Notas internas..." value={form.obs} onChange={e => set('obs', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar cliente'}</button>
        </div>
      </Modal>
    </>
  )
}
