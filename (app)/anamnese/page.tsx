'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Cliente, Anamnese } from '@/types'
import { formatarData } from '@/types'
import { PageHeader, Avatar, EmptyState, showToast } from '@/components/ui'
import { Plus, Download, Save, ArrowLeft } from 'lucide-react'
import { gerarPDFAnamnese } from '@/lib/pdf'

export default function AnamnesePage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'nova' | 'historico'>('nova')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [historico, setHistorico] = useState<Anamnese[]>([])
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({
    cliente_id: '', data_anam: new Date().toISOString().split('T')[0],
    patologias: '', medicamentos: '', alergias: '', cirurgias: '',
    refeicoes_dia: '4', ingesta_hidrica: '1–2L', consome_alcool: 'Não', suplementos: '', queixas: '',
  })

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: cls }, { data: hist }] = await Promise.all([
      supabase.from('clientes').select('id, nome').eq('prof_id', user.id).eq('ativo', true).order('nome'),
      supabase.from('anamneses').select('*, cliente:clientes(nome)').eq('prof_id', user.id).order('data_anam', { ascending: false }),
    ])
    setClientes(cls ?? [])
    setHistorico(hist ?? [])
  }

  useEffect(() => { load() }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const salvar = async () => {
    if (!form.cliente_id) { showToast('Selecione um paciente'); return }
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('anamneses').insert({ ...form, prof_id: user.id, refeicoes_dia: parseInt(form.refeicoes_dia) || null })
    setSalvando(false)
    if (error) { showToast('Erro: ' + error.message); return }
    showToast('Anamnese salva!')
    setTab('historico')
    load()
  }

  const baixarPDF = async (an: Anamnese) => {
    const cl = clientes.find(c => c.id === an.cliente_id) || (an.cliente as any)
    await gerarPDFAnamnese(an, cl)
  }

  const F = ({ label, id, type = 'text', placeholder = '' }: any) => (
    <div>
      <label className="label">{label}</label>
      <input type={type} className="input" placeholder={placeholder} value={(form as any)[id]} onChange={e => set(id, e.target.value)} />
    </div>
  )

  const S = ({ label, id, opts }: any) => (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={(form as any)[id]} onChange={e => set(id, e.target.value)}>
        {opts.map((o: string) => <option key={o}>{o}</option>)}
      </select>
    </div>
  )

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" rel="stylesheet" />
      <PageHeader title="Anamnese nutricional" subtitle="Histórico alimentar e clínico do paciente"
        action={<button className="btn-nutri" onClick={() => setTab('nova')}><Plus size={14} /> Nova anamnese</button>}
      />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-5 w-fit">
        {(['nova','historico'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm transition-all ${tab === t ? 'bg-white font-medium shadow-sm' : 'text-gray-500'}`}>
            {t === 'nova' ? 'Nova anamnese' : 'Histórico'}
          </button>
        ))}
      </div>

      {tab === 'nova' && (
        <div className="card max-w-2xl">
          <div className="form-grid-2">
            <div><label className="label">Paciente *</label>
              <select className="input" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}>
                <option value="">— Selecione —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div><label className="label">Data</label>
              <input type="date" className="input" value={form.data_anam} onChange={e => set('data_anam', e.target.value)} />
            </div>
          </div>

          <div className="section-title-nutri">Histórico clínico</div>
          <div className="form-grid-2">
            <F label="Patologias" id="patologias" placeholder="Hipertensão, diabetes, hipotireoidismo..." />
            <F label="Medicamentos em uso" id="medicamentos" placeholder="Losartana, metformina..." />
            <F label="Alergias e intolerâncias" id="alergias" placeholder="Glúten, lactose, amendoim..." />
            <F label="Cirurgias anteriores" id="cirurgias" placeholder="Bariátrica, apendicite..." />
          </div>

          <div className="section-title-nutri">Hábitos alimentares</div>
          <div className="form-grid-3">
            <S label="Refeições por dia" id="refeicoes_dia" opts={['2','3','4','5','6','7+']} />
            <S label="Ingesta hídrica" id="ingesta_hidrica" opts={['Menos de 1L','1–2L','2–3L','Mais de 3L']} />
            <S label="Consome álcool?" id="consome_alcool" opts={['Não','Raramente','1–2x/semana','3–4x/semana','Diariamente']} />
          </div>
          <F label="Suplementos em uso" id="suplementos" placeholder="Whey protein, creatina, vitamina D, ômega-3..." />

          <div className="mt-4">
            <label className="label">Queixas e objetivos nutricionais</label>
            <textarea className="input min-h-[90px] resize-y mt-1" placeholder="Descreva o motivo da consulta, principais dificuldades e expectativas do paciente..." value={form.queixas} onChange={e => set('queixas', e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-5 mt-2 border-t border-gray-100">
            <button className="btn-secondary" onClick={() => setTab('historico')}>Cancelar</button>
            <button className="btn-nutri" onClick={salvar} disabled={salvando}>
              <Save size={14} /> {salvando ? 'Salvando...' : 'Salvar anamnese'}
            </button>
          </div>
        </div>
      )}

      {tab === 'historico' && (
        <div className="card">
          {!historico.length
            ? <EmptyState icon="ti-notes-medical" title="Nenhuma anamnese registrada ainda" />
            : historico.map(an => (
              <div key={an.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <Avatar nome={(an.cliente as any)?.nome ?? '?'} size="sm" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{(an.cliente as any)?.nome}</div>
                  <div className="text-xs text-gray-400">
                    {formatarData(an.data_anam)}{an.alergias ? ` · ${an.alergias}` : ''}
                  </div>
                </div>
                <button className="btn-secondary btn-sm" onClick={() => baixarPDF(an)}><Download size={12} /> PDF</button>
              </div>
            ))
          }
        </div>
      )}
    </>
  )
}
