'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Cliente } from '@/types'
import { formatarData } from '@/types'
import { PageHeader, EmptyState, Avatar, showToast } from '@/components/ui'
import { Plus, Trash2, Save } from 'lucide-react'

type AlimR = { id: string; nome: string; quantidade_g: string; kcal: string; prot_g: string; carb_g: string; gord_g: string }
type RefR = { id: string; nome: string; horario: string; alimentos: AlimR[] }

export default function RecordatorioPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'novo' | 'historico'>('novo')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [historico, setHistorico] = useState<any[]>([])
  const [refeicoes, setRefeicoes] = useState<RefR[]>([])
  const [alModal, setAlModal] = useState<string | null>(null)
  const [alForm, setAlForm] = useState({ nome: '', quantidade_g: '', kcal: '', prot_g: '', carb_g: '', gord_g: '' })
  const [form, setForm] = useState({ cliente_id: '', data_ref: new Date(Date.now() - 86400000).toISOString().split('T')[0], kcal_meta: '', obs: '' })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: cls }, { data: hist }] = await Promise.all([
        supabase.from('clientes').select('id, nome').eq('prof_id', user.id).eq('ativo', true).order('nome'),
        supabase.from('recordatorios').select('*, cliente:clientes(nome)').eq('prof_id', user.id).order('data_ref', { ascending: false }),
      ])
      setClientes(cls ?? [])
      setHistorico(hist ?? [])
    }
    load()
  }, [])

  const addRefeicao = () => {
    const nomes = ['Café da manhã','Lanche da manhã','Almoço','Lanche da tarde','Jantar','Ceia']
    setRefeicoes(r => [...r, { id: `r-${Date.now()}`, nome: nomes[r.length] ?? `Refeição ${r.length + 1}`, horario: '', alimentos: [] }])
  }

  const addAlimento = (refId: string) => {
    if (!alForm.nome.trim()) return
    setRefeicoes(r => r.map(x => x.id === refId ? { ...x, alimentos: [...x.alimentos, { id: `a-${Date.now()}`, ...alForm }] } : x))
    setAlForm({ nome: '', quantidade_g: '', kcal: '', prot_g: '', carb_g: '', gord_g: '' })
    setAlModal(null)
  }

  const totais = refeicoes.flatMap(r => r.alimentos).reduce((a, x) => ({
    kcal: a.kcal + (parseFloat(x.kcal) || 0),
    prot: a.prot + (parseFloat(x.prot_g) || 0),
    carb: a.carb + (parseFloat(x.carb_g) || 0),
    gord: a.gord + (parseFloat(x.gord_g) || 0),
  }), { kcal: 0, prot: 0, carb: 0, gord: 0 })

  const meta = parseFloat(form.kcal_meta) || 0
  const pct = meta > 0 ? Math.round(totais.kcal / meta * 100) : null

  const salvar = async () => {
    if (!form.cliente_id) { showToast('Selecione um paciente'); return }
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: rec } = await supabase.from('recordatorios').insert({
      prof_id: user.id, cliente_id: form.cliente_id, data_ref: form.data_ref,
      kcal_meta: meta || null, kcal_total: totais.kcal || null, obs: form.obs,
    }).select().single()
    if (!rec) { showToast('Erro ao salvar'); setSalvando(false); return }
    for (const ref of refeicoes) {
      const { data: rd } = await supabase.from('record_refeicoes').insert({ recordatorio_id: rec.id, prof_id: user.id, nome: ref.nome, horario: ref.horario, ordem: 0 }).select().single()
      if (!rd) continue
      for (const al of ref.alimentos) {
        await supabase.from('record_alimentos').insert({
          refeicao_id: rd.id, prof_id: user.id, nome: al.nome,
          quantidade_g: parseFloat(al.quantidade_g) || null,
          kcal: parseFloat(al.kcal) || null, prot_g: parseFloat(al.prot_g) || null,
          carb_g: parseFloat(al.carb_g) || null, gord_g: parseFloat(al.gord_g) || null,
        })
      }
    }
    setSalvando(false)
    showToast('Recordatório salvo!')
    setTab('historico')
    setRefeicoes([])
  }

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" rel="stylesheet" />
      <PageHeader title="Recordatório alimentar 24h" subtitle="Registro do consumo alimentar do dia anterior"
        action={<button className="btn-nutri" onClick={() => setTab('novo')}><Plus size={14} /> Novo recordatório</button>}
      />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-5 w-fit">
        {(['novo','historico'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm transition-all ${tab === t ? 'bg-white font-medium shadow-sm' : 'text-gray-500'}`}>
            {t === 'novo' ? 'Novo recordatório' : 'Histórico'}
          </button>
        ))}
      </div>

      {tab === 'novo' && (
        <>
          <div className="card mb-4 max-w-2xl">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1"><label className="label">Paciente *</label>
                <select className="input" value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
                  <option value="">— Selecione —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div><label className="label">Data de referência</label>
                <input type="date" className="input" value={form.data_ref} onChange={e => setForm(f => ({ ...f, data_ref: e.target.value }))} />
              </div>
              <div><label className="label">Meta calórica do paciente</label>
                <input type="number" className="input" placeholder="2100 kcal" value={form.kcal_meta} onChange={e => setForm(f => ({ ...f, kcal_meta: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="max-w-2xl">
            {refeicoes.map(ref => (
              <div key={ref.id} className="meal-card">
                <div className="meal-header">
                  <div className="flex items-center gap-2">
                    <input className="text-sm font-medium bg-transparent border-none outline-none w-44" value={ref.nome} onChange={e => setRefeicoes(r => r.map(x => x.id === ref.id ? { ...x, nome: e.target.value } : x))} />
                    <input className="text-xs text-gray-400 bg-transparent border-none outline-none w-14" placeholder="07:30" value={ref.horario} onChange={e => setRefeicoes(r => r.map(x => x.id === ref.id ? { ...x, horario: e.target.value } : x))} />
                  </div>
                  <div className="flex items-center gap-2">
                    {ref.alimentos.length > 0 && <span className="text-xs text-nutri-600">~{Math.round(ref.alimentos.reduce((s, a) => s + (parseFloat(a.kcal) || 0), 0))} kcal</span>}
                    <button onClick={() => setRefeicoes(r => r.filter(x => x.id !== ref.id))} className="text-red-300 hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="px-4 py-2">
                  {ref.alimentos.map(al => (
                    <div key={al.id} className="food-row">
                      <span className="flex-1 text-sm">{al.nome}</span>
                      {al.quantidade_g && <span className="text-xs text-gray-400">{al.quantidade_g}g</span>}
                      {al.kcal && <span className="text-xs text-gray-400">{al.kcal}kcal</span>}
                      <button onClick={() => setRefeicoes(r => r.map(x => x.id === ref.id ? { ...x, alimentos: x.alimentos.filter(a => a.id !== al.id) } : x))} className="text-red-200 hover:text-red-400"><Trash2 size={11} /></button>
                    </div>
                  ))}
                  <button onClick={() => setAlModal(ref.id)} className="flex items-center gap-2 mt-2 px-3 py-1.5 border border-dashed border-teal-200 rounded-lg text-xs text-nutri-600 hover:bg-teal-50 transition-colors w-full">
                    <Plus size={11} /> Adicionar item consumido
                  </button>
                </div>
              </div>
            ))}

            <button onClick={addRefeicao} className="flex items-center gap-2 w-full py-3 border border-dashed border-teal-200 rounded-xl text-sm text-nutri-600 hover:bg-teal-50 transition-colors justify-center mb-4">
              <Plus size={14} /> Adicionar refeição
            </button>

            {totais.kcal > 0 && (
              <div className="card mb-4">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div><div className="text-xl font-bold">{Math.round(totais.kcal)}</div><div className="text-xs text-gray-400">kcal consumidas</div></div>
                  {meta > 0 && <div><div className="text-xl font-bold text-nutri-600">{Math.round(meta)}</div><div className="text-xs text-gray-400">kcal meta</div></div>}
                  {meta > 0 && <div><div className={`text-xl font-bold ${totais.kcal < meta ? 'text-red-500' : 'text-green-600'}`}>{totais.kcal < meta ? `−${Math.round(meta - totais.kcal)}` : `+${Math.round(totais.kcal - meta)}`}</div><div className="text-xs text-gray-400">diferença</div></div>}
                  {pct !== null && <div><div className={`text-xl font-bold ${pct < 80 ? 'text-amber-500' : 'text-green-600'}`}>{pct}%</div><div className="text-xs text-gray-400">da meta</div></div>}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button className="btn-nutri" onClick={salvar} disabled={salvando}><Save size={14} /> {salvando ? 'Salvando...' : 'Salvar recordatório'}</button>
            </div>
          </div>
        </>
      )}

      {tab === 'historico' && (
        <div className="card">
          {!historico.length
            ? <EmptyState icon="ti-clock-hour-4" title="Nenhum recordatório registrado ainda" />
            : historico.map(r => (
              <div key={r.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <Avatar nome={(r.cliente as any)?.nome ?? '?'} size="sm" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{(r.cliente as any)?.nome}</div>
                  <div className="text-xs text-gray-400">
                    {formatarData(r.data_ref)}{r.kcal_total ? ` · ${Math.round(r.kcal_total)} kcal consumidas` : ''}{r.kcal_meta ? ` / meta: ${Math.round(r.kcal_meta)} kcal` : ''}
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Modal alimento */}
      {alModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-4">Adicionar item</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Nome *</label><input className="input" value={alForm.nome} onChange={e => setAlForm(f => ({ ...f, nome: e.target.value }))} autoFocus /></div>
              <div><label className="label">Quantidade (g/ml)</label><input className="input" type="number" value={alForm.quantidade_g} onChange={e => setAlForm(f => ({ ...f, quantidade_g: e.target.value }))} /></div>
              <div><label className="label">Kcal</label><input className="input" type="number" value={alForm.kcal} onChange={e => setAlForm(f => ({ ...f, kcal: e.target.value }))} /></div>
              <div><label className="label">Proteína (g)</label><input className="input" type="number" value={alForm.prot_g} onChange={e => setAlForm(f => ({ ...f, prot_g: e.target.value }))} /></div>
              <div><label className="label">Carb (g)</label><input className="input" type="number" value={alForm.carb_g} onChange={e => setAlForm(f => ({ ...f, carb_g: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn-secondary" onClick={() => setAlModal(null)}>Cancelar</button>
              <button className="btn-nutri" onClick={() => addAlimento(alModal)}><Plus size={13} /> Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
