'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Cliente, PlanoAlimentar, Refeicao, Alimento } from '@/types'
import { formatarData } from '@/types'
import { PageHeader, Avatar, EmptyState, Modal, showToast } from '@/components/ui'
import { Plus, Trash2, Download, Link2, Save } from 'lucide-react'
import { gerarPDFPlanoAlimentar } from '@/lib/pdf'

type RefeicaoLocal = { id: string; nome: string; horario: string; ordem: number; alimentos: AlimentoLocal[] }
type AlimentoLocal = { id: string; nome: string; quantidade_g: string; kcal: string; prot_g: string; carb_g: string; gord_g: string }

export default function PlanoPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'montar' | 'historico'>('montar')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [historico, setHistorico] = useState<PlanoAlimentar[]>([])
  const [refeicoes, setRefeicoes] = useState<RefeicaoLocal[]>([])
  const [alModal, setAlModal] = useState<string | null>(null)
  const [alForm, setAlForm] = useState({ nome: '', quantidade_g: '', kcal: '', prot_g: '', carb_g: '', gord_g: '' })
  const [plano, setPlano] = useState({ cliente_id: '', nome: 'Plano alimentar', objetivo: 'Emagrecimento' })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: cls }, { data: hist }] = await Promise.all([
        supabase.from('clientes').select('id, nome').eq('prof_id', user.id).eq('ativo', true).order('nome'),
        supabase.from('planos_alimentares').select('*, cliente:clientes(nome)').eq('prof_id', user.id).order('created_at', { ascending: false }),
      ])
      setClientes(cls ?? [])
      setHistorico(hist ?? [])
    }
    load()
  }, [])

  const addRefeicao = () => {
    const nomes = ['Café da manhã','Lanche da manhã','Almoço','Lanche da tarde','Jantar','Ceia']
    const nome = nomes[refeicoes.length] ?? `Refeição ${refeicoes.length + 1}`
    setRefeicoes(r => [...r, { id: `r-${Date.now()}`, nome, horario: '', ordem: r.length, alimentos: [] }])
  }

  const removeRefeicao = (id: string) => setRefeicoes(r => r.filter(x => x.id !== id))
  const updateRefeicao = (id: string, k: string, v: string) => setRefeicoes(r => r.map(x => x.id === id ? { ...x, [k]: v } : x))

  const addAlimento = (refId: string) => {
    if (!alForm.nome.trim()) return
    const al: AlimentoLocal = { id: `al-${Date.now()}`, ...alForm }
    setRefeicoes(r => r.map(x => x.id === refId ? { ...x, alimentos: [...x.alimentos, al] } : x))
    setAlForm({ nome: '', quantidade_g: '', kcal: '', prot_g: '', carb_g: '', gord_g: '' })
    setAlModal(null)
    showToast('Alimento adicionado')
  }

  const removeAlimento = (refId: string, alId: string) =>
    setRefeicoes(r => r.map(x => x.id === refId ? { ...x, alimentos: x.alimentos.filter(a => a.id !== alId) } : x))

  const totais = refeicoes.flatMap(r => r.alimentos).reduce((acc, a) => ({
    kcal: acc.kcal + (parseFloat(a.kcal) || 0),
    prot: acc.prot + (parseFloat(a.prot_g) || 0),
    carb: acc.carb + (parseFloat(a.carb_g) || 0),
    gord: acc.gord + (parseFloat(a.gord_g) || 0),
  }), { kcal: 0, prot: 0, carb: 0, gord: 0 })

  const salvar = async () => {
    if (!plano.cliente_id) { showToast('Selecione um cliente'); return }
    if (!refeicoes.length) { showToast('Adicione ao menos uma refeição'); return }
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: pa } = await supabase.from('planos_alimentares').insert({
      prof_id: user.id, cliente_id: plano.cliente_id, nome: plano.nome,
      objetivo: plano.objetivo, kcal_total: totais.kcal,
      prot_g: totais.prot, carb_g: totais.carb, gord_g: totais.gord,
    }).select().single()
    if (!pa) { showToast('Erro ao salvar'); setSalvando(false); return }
    for (const ref of refeicoes) {
      const { data: rd } = await supabase.from('refeicoes').insert({
        plano_id: pa.id, prof_id: user.id, nome: ref.nome, horario: ref.horario, ordem: ref.ordem,
      }).select().single()
      if (!rd) continue
      for (const al of ref.alimentos) {
        await supabase.from('alimentos').insert({
          refeicao_id: rd.id, prof_id: user.id, nome: al.nome,
          quantidade_g: parseFloat(al.quantidade_g) || null,
          kcal: parseFloat(al.kcal) || null,
          prot_g: parseFloat(al.prot_g) || null,
          carb_g: parseFloat(al.carb_g) || null,
          gord_g: parseFloat(al.gord_g) || null,
          ordem: 0,
        })
      }
    }
    setSalvando(false)
    showToast('Plano salvo!')
    setTab('historico')
    setRefeicoes([])
    const { data: hist } = await supabase.from('planos_alimentares').select('*, cliente:clientes(nome)').eq('prof_id', user.id).order('created_at', { ascending: false })
    setHistorico(hist ?? [])
  }

  const baixarPDF = async (pa: PlanoAlimentar) => {
    const { data: refs } = await supabase.from('refeicoes').select('*, alimentos(*)').eq('plano_id', pa.id).order('ordem')
    const cl = clientes.find(c => c.id === pa.cliente_id) || (pa.cliente as any)
    await gerarPDFPlanoAlimentar({ ...pa, refeicoes: refs ?? [] }, cl)
  }

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" rel="stylesheet" />
      <PageHeader title="Plano alimentar" subtitle="Monte refeições com cálculo automático de macros"
        action={<button className="btn-nutri" onClick={() => { setTab('montar'); setRefeicoes([]) }}><Plus size={14} /> Novo plano</button>}
      />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-5 w-fit">
        {(['montar','historico'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm transition-all ${tab === t ? 'bg-white font-medium shadow-sm' : 'text-gray-500'}`}>
            {t === 'montar' ? 'Montar plano' : 'Histórico'}
          </button>
        ))}
      </div>

      {tab === 'montar' && (
        <>
          <div className="card mb-4">
            <div className="form-grid-2 mb-3">
              <div><label className="label">Paciente *</label>
                <select className="input" value={plano.cliente_id} onChange={e => setPlano(p => ({ ...p, cliente_id: e.target.value }))}>
                  <option value="">— Selecione —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div><label className="label">Nome do plano</label>
                <input className="input" value={plano.nome} onChange={e => setPlano(p => ({ ...p, nome: e.target.value }))} />
              </div>
            </div>
            <div><label className="label">Objetivo</label>
              <select className="input" value={plano.objetivo} onChange={e => setPlano(p => ({ ...p, objetivo: e.target.value }))}>
                <option>Emagrecimento</option><option>Ganho de massa</option><option>Manutenção</option><option>Saúde e bem-estar</option><option>Performance esportiva</option>
              </select>
            </div>
            {totais.kcal > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-4 pt-3 border-t border-gray-100">
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-brand-600">{Math.round(totais.kcal)}</div>
                  <div className="text-[10px] text-gray-400">kcal total</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-green-600">{Math.round(totais.prot)}g</div>
                  <div className="text-[10px] text-gray-400">proteína</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-nutri-600">{Math.round(totais.carb)}g</div>
                  <div className="text-[10px] text-gray-400">carboidrato</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-purple-600">{Math.round(totais.gord)}g</div>
                  <div className="text-[10px] text-gray-400">gordura</div>
                </div>
              </div>
            )}
          </div>

          {refeicoes.map((ref) => (
            <div key={ref.id} className="meal-card">
              <div className="meal-header">
                <div className="flex items-center gap-3">
                  <i className="ti ti-bowl-spoon text-nutri-600 text-sm" />
                  <input className="text-sm font-medium bg-transparent border-none outline-none w-44 placeholder:text-gray-400"
                    value={ref.nome} onChange={e => updateRefeicao(ref.id, 'nome', e.target.value)} />
                  <input className="text-xs text-gray-400 bg-transparent border-none outline-none w-16 placeholder:text-gray-300"
                    placeholder="07:30" value={ref.horario} onChange={e => updateRefeicao(ref.id, 'horario', e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  {ref.alimentos.length > 0 && (
                    <span className="text-xs text-nutri-600 font-medium">
                      {Math.round(ref.alimentos.reduce((s, a) => s + (parseFloat(a.kcal)||0), 0))} kcal
                    </span>
                  )}
                  <button onClick={() => removeRefeicao(ref.id)} className="text-red-300 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="px-4 py-2">
                {ref.alimentos.map(al => (
                  <div key={al.id} className="food-row">
                    <i className="ti ti-circle-dot text-[10px] text-gray-300" />
                    <span className="flex-1 text-sm">{al.nome}</span>
                    {al.quantidade_g && <span className="text-xs text-gray-400 w-12 text-right">{al.quantidade_g}g</span>}
                    <span className="text-xs text-gray-400 w-28 text-right">
                      {[al.prot_g && `P:${al.prot_g}g`, al.carb_g && `C:${al.carb_g}g`, al.gord_g && `G:${al.gord_g}g`].filter(Boolean).join(' ')}
                    </span>
                    <button onClick={() => removeAlimento(ref.id, al.id)} className="text-red-200 hover:text-red-400 ml-1"><Trash2 size={11} /></button>
                  </div>
                ))}
                <button onClick={() => setAlModal(ref.id)}
                  className="flex items-center gap-2 mt-2 px-3 py-1.5 border border-dashed border-teal-200 rounded-lg text-xs text-nutri-600 hover:bg-teal-50 transition-colors w-full">
                  <Plus size={11} /> Adicionar alimento
                </button>
              </div>
            </div>
          ))}

          <button onClick={addRefeicao}
            className="flex items-center gap-2 w-full py-3 border border-dashed border-teal-200 rounded-xl text-sm text-nutri-600 hover:bg-teal-50 transition-colors justify-center mt-1 mb-5">
            <Plus size={14} /> Adicionar refeição
          </button>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button className="btn-secondary">Cancelar</button>
            <button className="btn-nutri" onClick={salvar} disabled={salvando}>
              <Save size={14} /> {salvando ? 'Salvando...' : 'Salvar plano alimentar'}
            </button>
          </div>
        </>
      )}

      {tab === 'historico' && (
        <div className="card">
          {!historico.length
            ? <EmptyState icon="ti-salad" title="Nenhum plano criado ainda" />
            : historico.map(pa => (
              <div key={pa.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <Avatar nome={(pa.cliente as any)?.nome ?? '?'} size="sm" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{(pa.cliente as any)?.nome} — {pa.nome}</div>
                  <div className="text-xs text-gray-400">
                    {pa.kcal_total && `${Math.round(pa.kcal_total)} kcal`}{pa.prot_g && ` · P:${Math.round(pa.prot_g)}g`}{pa.carb_g && ` · C:${Math.round(pa.carb_g)}g`}{pa.gord_g && ` · G:${Math.round(pa.gord_g)}g`} · {formatarData(pa.created_at)}
                  </div>
                </div>
                <span className="badge-teal text-[10px]">Ativo</span>
                <button className="btn-secondary btn-sm" onClick={() => baixarPDF(pa)}><Download size={12} /> PDF</button>
              </div>
            ))
          }
        </div>
      )}

      <Modal open={!!alModal} onClose={() => setAlModal(null)} title="Adicionar alimento">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Nome do alimento *</label>
            <input className="input" placeholder="Ex: Frango grelhado" value={alForm.nome} onChange={e => setAlForm(f => ({ ...f, nome: e.target.value }))} autoFocus />
          </div>
          <div><label className="label">Quantidade (g / ml)</label>
            <input className="input" type="number" placeholder="200" value={alForm.quantidade_g} onChange={e => setAlForm(f => ({ ...f, quantidade_g: e.target.value }))} />
          </div>
          <div><label className="label">Calorias (kcal)</label>
            <input className="input" type="number" placeholder="220" value={alForm.kcal} onChange={e => setAlForm(f => ({ ...f, kcal: e.target.value }))} />
          </div>
          <div><label className="label">Proteína (g)</label>
            <input className="input" type="number" placeholder="30" value={alForm.prot_g} onChange={e => setAlForm(f => ({ ...f, prot_g: e.target.value }))} />
          </div>
          <div><label className="label">Carboidrato (g)</label>
            <input className="input" type="number" placeholder="0" value={alForm.carb_g} onChange={e => setAlForm(f => ({ ...f, carb_g: e.target.value }))} />
          </div>
          <div className="col-span-2"><label className="label">Gordura (g)</label>
            <input className="input" type="number" placeholder="5" value={alForm.gord_g} onChange={e => setAlForm(f => ({ ...f, gord_g: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-secondary" onClick={() => setAlModal(null)}>Cancelar</button>
          <button className="btn-nutri" onClick={() => addAlimento(alModal!)}><Plus size={13} /> Adicionar</button>
        </div>
      </Modal>
    </>
  )
}
