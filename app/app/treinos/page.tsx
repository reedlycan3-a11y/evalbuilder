'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Cliente, PlanoTreino, DiaTreino, Exercicio } from '@/types'
import { GRUPOS_MUSCULARES, LABELS_DIA, formatarData } from '@/types'
import { PageHeader, Avatar, EmptyState, Modal, showToast } from '@/components/ui'
import { Plus, ChevronDown, ChevronUp, Trash2, Download, Link2, Edit2, Save } from 'lucide-react'
import { gerarPDFTreino } from '@/lib/pdf'

export default function TreinosPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'montar' | 'historico'>('montar')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [historico, setHistorico] = useState<PlanoTreino[]>([])
  const [diasAbertos, setDiasAbertos] = useState<Record<string, boolean>>({})
  const [salvando, setSalvando] = useState(false)
  const [exModal, setExModal] = useState<string | null>(null) // dia_id
  const [plano, setPlano] = useState({ cliente_id: '', nome: 'Plano A', objetivo: 'Hipertrofia', frequencia: '3x por semana', duracao_min: '60' })
  const [dias, setDias] = useState<(DiaTreino & { exercicios: Exercicio[] })[]>([])
  const [exForm, setExForm] = useState({ nome: '', grupo: '', series: '4', repeticoes: '8-12', descanso_s: '60', obs: '' })

  const loadClientes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('clientes').select('id, nome').eq('prof_id', user.id).eq('ativo', true).order('nome')
    setClientes(data ?? [])
  }

  const loadHistorico = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('planos_treino').select('*, cliente:clientes(nome, id)').eq('prof_id', user.id).order('created_at', { ascending: false })
    setHistorico(data ?? [])
  }

  useEffect(() => { loadClientes(); loadHistorico() }, [])

  const addDia = () => {
    const label = LABELS_DIA[dias.length] ?? `DIA ${dias.length + 1}`
    const novo: any = { id: `local-${Date.now()}`, label, nome: '', ordem: dias.length, exercicios: [] }
    setDias(d => [...d, novo])
    setDiasAbertos(o => ({ ...o, [novo.id]: true }))
  }

  const removeDia = (id: string) => setDias(d => d.filter(x => x.id !== id))

  const updateDia = (id: string, key: string, val: string) =>
    setDias(d => d.map(x => x.id === id ? { ...x, [key]: val } : x))

  const addExercicio = (diaId: string) => {
    if (!exForm.nome.trim()) return
    const ex: any = {
      id: `ex-${Date.now()}`, dia_id: diaId,
      nome: exForm.nome, grupo: exForm.grupo,
      series: parseInt(exForm.series) || 4,
      repeticoes: exForm.repeticoes,
      descanso_s: parseInt(exForm.descanso_s) || 60,
      obs: exForm.obs, ordem: 0,
    }
    setDias(d => d.map(x => x.id === diaId ? { ...x, exercicios: [...x.exercicios, ex] } : x))
    setExForm({ nome: '', grupo: '', series: '4', repeticoes: '8-12', descanso_s: '60', obs: '' })
    setExModal(null)
    showToast('Exercício adicionado')
  }

  const removeExercicio = (diaId: string, exId: string) =>
    setDias(d => d.map(x => x.id === diaId ? { ...x, exercicios: x.exercicios.filter(e => e.id !== exId) } : x))

  const salvarPlano = async () => {
    if (!plano.cliente_id) { showToast('Selecione um cliente'); return }
    if (!dias.length) { showToast('Adicione ao menos um dia de treino'); return }
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: pt, error: ptErr } = await supabase.from('planos_treino').insert({
      prof_id: user.id, cliente_id: plano.cliente_id,
      nome: plano.nome, objetivo: plano.objetivo,
      frequencia: plano.frequencia, duracao_min: parseInt(plano.duracao_min) || 60,
    }).select().single()
    if (ptErr || !pt) { showToast('Erro ao salvar plano'); setSalvando(false); return }

    for (const dia of dias) {
      const { data: dt } = await supabase.from('dias_treino').insert({
        plano_id: pt.id, prof_id: user.id, label: dia.label, nome: dia.nome, ordem: dia.ordem,
      }).select().single()
      if (!dt) continue
      for (const ex of dia.exercicios) {
        await supabase.from('exercicios').insert({
          dia_id: dt.id, prof_id: user.id, nome: ex.nome, grupo: ex.grupo,
          series: ex.series, repeticoes: ex.repeticoes, descanso_s: ex.descanso_s, obs: ex.obs, ordem: ex.ordem,
        })
      }
    }
    setSalvando(false)
    showToast('Plano salvo!')
    loadHistorico()
    setTab('historico')
    setDias([])
  }

  const baixarPDFHistorico = async (pt: PlanoTreino) => {
    const { data: dias_ } = await supabase.from('dias_treino').select('*, exercicios(*)').eq('plano_id', pt.id).order('ordem')
    const cl = clientes.find(c => c.id === pt.cliente_id) || (pt.cliente as any)
    await gerarPDFTreino({ ...pt, dias: dias_ ?? [] }, cl)
  }

  const copiarLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/treino/${token}`)
    showToast('Link copiado!')
  }

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" rel="stylesheet" />
      <PageHeader title="Prescrição de treino" subtitle="Monte e gerencie os planos de treino dos seus alunos"
        action={<div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setTab('historico')}>Histórico</button>
          <button className="btn-primary" onClick={() => { setTab('montar'); setDias([]) }}><Plus size={14} /> Novo plano</button>
        </div>}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-5 w-fit">
        {(['montar', 'historico'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm transition-all ${tab === t ? 'bg-white font-medium shadow-sm' : 'text-gray-500'}`}>
            {t === 'montar' ? 'Montar treino' : 'Histórico de treinos'}
          </button>
        ))}
      </div>

      {tab === 'montar' && (
        <>
          <div className="card mb-4">
            <div className="form-grid-2 mb-3">
              <div><label className="label">Aluno *</label>
                <select className="input" value={plano.cliente_id} onChange={e => setPlano(p => ({ ...p, cliente_id: e.target.value }))}>
                  <option value="">— Selecione —</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div><label className="label">Nome do plano</label>
                <input className="input" value={plano.nome} onChange={e => setPlano(p => ({ ...p, nome: e.target.value }))} />
              </div>
            </div>
            <div className="form-grid-3">
              <div><label className="label">Objetivo</label>
                <select className="input" value={plano.objetivo} onChange={e => setPlano(p => ({ ...p, objetivo: e.target.value }))}>
                  <option>Hipertrofia</option><option>Emagrecimento</option><option>Força</option><option>Condicionamento</option><option>Resistência</option>
                </select>
              </div>
              <div><label className="label">Frequência</label>
                <select className="input" value={plano.frequencia} onChange={e => setPlano(p => ({ ...p, frequencia: e.target.value }))}>
                  <option>2x por semana</option><option>3x por semana</option><option>4x por semana</option><option>5x por semana</option><option>6x por semana</option>
                </select>
              </div>
              <div><label className="label">Duração estimada (min)</label>
                <input className="input" type="number" value={plano.duracao_min} onChange={e => setPlano(p => ({ ...p, duracao_min: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Dias de treino */}
          <div className="space-y-0">
            {dias.map((dia, idx) => (
              <div key={dia.id} className="day-card">
                <div className="day-header" onClick={() => setDiasAbertos(o => ({ ...o, [dia.id]: !o[dia.id] }))}>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${['bg-green-100 text-green-800','bg-teal-100 text-teal-800','bg-amber-100 text-amber-800','bg-purple-100 text-purple-800','bg-blue-100 text-blue-800'][idx % 5]}`}>
                      {dia.label}
                    </span>
                    <input
                      className="text-sm font-medium bg-transparent border-none outline-none w-52 placeholder:text-gray-400"
                      placeholder="Nome do treino (ex: Peito + Tríceps)"
                      value={dia.nome}
                      onClick={e => e.stopPropagation()}
                      onChange={e => updateDia(dia.id, 'nome', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{dia.exercicios.length} exercício{dia.exercicios.length !== 1 ? 's' : ''}</span>
                    <button onClick={e => { e.stopPropagation(); removeDia(dia.id) }} className="text-red-400 hover:text-red-600 p-0.5"><Trash2 size={13} /></button>
                    {diasAbertos[dia.id] ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </div>

                {diasAbertos[dia.id] && (
                  <div className="px-4 pb-3 pt-1">
                    {dia.exercicios.map((ex, ei) => (
                      <div key={ex.id} className="ex-row">
                        <div className="w-5 h-5 rounded-full bg-brand-50 text-brand-800 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{ei + 1}</div>
                        <div className="flex-1 font-medium text-sm">{ex.nome}</div>
                        {ex.grupo && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${['bg-green-50 text-green-800','bg-teal-50 text-teal-800','bg-amber-50 text-amber-800','bg-purple-50 text-purple-800'][ei % 4]}`}>{ex.grupo}</span>}
                        <div className="text-xs text-gray-400 min-w-[110px] text-right">
                          {ex.series && `${ex.series}×`}{ex.repeticoes && ex.repeticoes}{ex.descanso_s && ` · ${ex.descanso_s}s`}
                        </div>
                        <button onClick={() => removeExercicio(dia.id, ex.id)} className="text-red-300 hover:text-red-500 ml-1"><Trash2 size={12} /></button>
                      </div>
                    ))}
                    <button onClick={() => setExModal(dia.id)}
                      className="flex items-center gap-2 mt-3 px-3 py-1.5 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors w-full">
                      <Plus size={12} /> Adicionar exercício
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={addDia}
            className="flex items-center gap-2 w-full py-3 border border-dashed border-brand-200 rounded-xl text-sm text-brand-600 hover:bg-brand-50 transition-colors justify-center mt-2 mb-5">
            <Plus size={14} /> Adicionar dia de treino
          </button>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button className="btn-secondary">Cancelar</button>
            <button className="btn-primary" onClick={salvarPlano} disabled={salvando}>
              <Save size={14} /> {salvando ? 'Salvando...' : 'Salvar plano de treino'}
            </button>
          </div>
        </>
      )}

      {tab === 'historico' && (
        <div className="card">
          {!historico.length
            ? <EmptyState icon="ti-barbell" title="Nenhum plano criado ainda" sub='Clique em "Novo plano" para começar' />
            : historico.map(pt => (
              <div key={pt.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <Avatar nome={(pt.cliente as any)?.nome ?? '?'} size="sm" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{(pt.cliente as any)?.nome} — {pt.nome}</div>
                  <div className="text-xs text-gray-400">{pt.frequencia} · {formatarData(pt.created_at)}</div>
                </div>
                <span className={`badge-ok text-[10px]`}>{pt.ativo ? 'Ativo' : 'Inativo'}</span>
                <button className="btn-ghost text-xs" onClick={() => copiarLink(pt.link_token!)}><Link2 size={12} /></button>
                <button className="btn-secondary btn-sm" onClick={() => baixarPDFHistorico(pt)}><Download size={12} /> PDF</button>
              </div>
            ))
          }
        </div>
      )}

      {/* Modal adicionar exercício */}
      <Modal open={!!exModal} onClose={() => setExModal(null)} title="Adicionar exercício">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Nome do exercício *</label>
            <input className="input" placeholder="Ex: Supino reto com barra" value={exForm.nome} onChange={e => setExForm(f => ({ ...f, nome: e.target.value }))} autoFocus />
          </div>
          <div><label className="label">Grupo muscular</label>
            <select className="input" value={exForm.grupo} onChange={e => setExForm(f => ({ ...f, grupo: e.target.value }))}>
              <option value="">—</option>
              {GRUPOS_MUSCULARES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div><label className="label">Séries</label>
            <input className="input" type="number" placeholder="4" value={exForm.series} onChange={e => setExForm(f => ({ ...f, series: e.target.value }))} />
          </div>
          <div><label className="label">Repetições</label>
            <input className="input" placeholder="8-12" value={exForm.repeticoes} onChange={e => setExForm(f => ({ ...f, repeticoes: e.target.value }))} />
          </div>
          <div><label className="label">Descanso (segundos)</label>
            <input className="input" type="number" placeholder="60" value={exForm.descanso_s} onChange={e => setExForm(f => ({ ...f, descanso_s: e.target.value }))} />
          </div>
          <div className="col-span-2"><label className="label">Observação (opcional)</label>
            <input className="input" placeholder="Ex: Manter escápulas retraídas" value={exForm.obs} onChange={e => setExForm(f => ({ ...f, obs: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-secondary" onClick={() => setExModal(null)}>Cancelar</button>
          <button className="btn-primary" onClick={() => addExercicio(exModal!)}><Plus size={13} /> Adicionar</button>
        </div>
      </Modal>
    </>
  )
}
