'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Cliente } from '@/types'
import { calcIMC } from '@/types'
import { ArrowLeft, Save, Download, Link2 } from 'lucide-react'
import Link from 'next/link'
import { showToast } from '@/components/ui'
import { gerarPDFAvaliacao } from '@/lib/pdf'

const SEC = 'section-title'

export default function NovaAvaliacaoPage() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [salvando, setSalvando] = useState(false)
  const [saved, setSaved] = useState<any>(null)
  const [form, setForm] = useState({
    cliente_id: params.get('cliente') ?? '',
    data_aval: new Date().toISOString().split('T')[0],
    peso: '', altura: '', perc_gordura: '', massa_magra: '', massa_gorda: '',
    circ_torax: '', circ_cintura: '', circ_quadril: '', circ_braco_d: '', circ_coxa_d: '', circ_panturrilha: '',
    resist_cardio: '', flexibilidade: '', forca_abdominal: '', pressao_arterial: '',
    objetivo: '', nivel: '', observacoes: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('clientes').select('id, nome').eq('prof_id', user.id).eq('ativo', true).order('nome')
      setClientes(data ?? [])
    }
    load()
  }, [])

  const imc = form.peso && form.altura ? calcIMC(parseFloat(form.peso), parseFloat(form.altura)) : null
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const salvar = async () => {
    if (!form.cliente_id) { showToast('Selecione um cliente'); return }
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const payload: Record<string, any> = { prof_id: user.id, cliente_id: form.cliente_id, data_aval: form.data_aval }
    if (imc) payload.imc = imc
    const nums = ['peso','altura','perc_gordura','massa_magra','massa_gorda','circ_torax','circ_cintura','circ_quadril','circ_braco_d','circ_coxa_d','circ_panturrilha','forca_abdominal']
    nums.forEach(k => { if ((form as any)[k]) payload[k] = parseFloat((form as any)[k]) })
    const strs = ['resist_cardio','flexibilidade','pressao_arterial','objetivo','nivel','observacoes']
    strs.forEach(k => { if ((form as any)[k]) payload[k] = (form as any)[k] })
    const { data, error } = await supabase.from('avaliacoes').insert(payload).select('*, cliente:clientes(*)').single()
    setSalvando(false)
    if (error) { showToast('Erro: ' + error.message); return }
    setSaved(data)
    showToast('Avaliação salva!')
  }

  const baixarPDF = async () => {
    if (!saved) return
    const cl = clientes.find(c => c.id === saved.cliente_id) || saved.cliente
    await gerarPDFAvaliacao(saved, cl)
  }

  const copiarLink = () => {
    if (!saved?.link_token) return
    navigator.clipboard.writeText(`${window.location.origin}/eval/${saved.link_token}`)
    showToast('Link copiado!')
  }

  const F = ({ label, id, type = 'number', placeholder = '', readOnly = false }: any) => (
    <div>
      <label className="label">{label}</label>
      <input type={type} placeholder={placeholder} readOnly={readOnly}
        className={`input ${readOnly ? 'bg-gray-50 cursor-default' : ''}`}
        value={id === 'imc' ? (imc ?? '') : (form as any)[id] ?? ''}
        onChange={e => !readOnly && set(id, e.target.value)}
      />
    </div>
  )

  const S = ({ label, id, opts }: any) => (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={(form as any)[id]} onChange={e => set(id, e.target.value)}>
        <option value="">— Selecione —</option>
        {opts.map((o: string) => <option key={o}>{o}</option>)}
      </select>
    </div>
  )

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" rel="stylesheet" />
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/avaliacoes" className="btn-ghost p-2"><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nova avaliação física</h1>
            <p className="text-sm text-gray-400 mt-0.5">Preencha os dados e gere o PDF em 1 clique</p>
          </div>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
              <i className="ti ti-check text-base" /> Avaliação salva com sucesso!
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm" onClick={copiarLink}><Link2 size={12} /> Copiar link</button>
              <button className="btn-primary btn-sm" onClick={baixarPDF}><Download size={12} /> Baixar PDF</button>
            </div>
          </div>
        )}

        <div className="card">
          <div className={SEC}>Dados do cliente</div>
          <div className="form-grid-2">
            <div><label className="label">Cliente *</label>
              <select className="input" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}>
                <option value="">— Selecione —</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div><label className="label">Data da avaliação *</label>
              <input type="date" className="input" value={form.data_aval} onChange={e => set('data_aval', e.target.value)} />
            </div>
          </div>

          <div className={SEC}>Composição corporal</div>
          <div className="form-grid-3">
            <F label="Peso (kg)" id="peso" placeholder="75.5" />
            <F label="Altura (cm)" id="altura" placeholder="175" />
            <F label="IMC (calculado)" id="imc" readOnly />
            <F label="% Gordura" id="perc_gordura" placeholder="18.5" />
            <F label="Massa magra (kg)" id="massa_magra" placeholder="61.5" />
            <F label="Massa gorda (kg)" id="massa_gorda" placeholder="14.0" />
          </div>

          <div className={SEC}>Circunferências (cm)</div>
          <div className="form-grid-3">
            <F label="Tórax" id="circ_torax" placeholder="95" />
            <F label="Cintura" id="circ_cintura" placeholder="78" />
            <F label="Quadril" id="circ_quadril" placeholder="96" />
            <F label="Braço D (contraído)" id="circ_braco_d" placeholder="35" />
            <F label="Coxa D" id="circ_coxa_d" placeholder="55" />
            <F label="Panturrilha D" id="circ_panturrilha" placeholder="37" />
          </div>

          <div className={SEC}>Testes físicos</div>
          <div className="form-grid-2">
            <S label="Resistência cardiovascular" id="resist_cardio" opts={['Excelente','Muito boa','Boa','Regular','Fraca']} />
            <S label="Flexibilidade" id="flexibilidade" opts={['Excelente','Boa','Regular','Limitada']} />
            <F label="Força abdominal (reps/min)" id="forca_abdominal" placeholder="35" />
            <F label="Pressão arterial" id="pressao_arterial" type="text" placeholder="120/80 mmHg" />
          </div>

          <div className={SEC}>Objetivo e nível</div>
          <div className="form-grid-2">
            <S label="Objetivo principal" id="objetivo" opts={['Emagrecimento','Hipertrofia','Condicionamento físico','Saúde e qualidade de vida','Performance esportiva','Reabilitação']} />
            <S label="Nível de condicionamento" id="nivel" opts={['Iniciante','Intermediário','Avançado']} />
          </div>
          <div className="mt-4">
            <label className="label">Observações do avaliador</label>
            <textarea className="input min-h-[90px] resize-y" placeholder="Pontos relevantes observados, histórico de lesões, recomendações iniciais..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-5 mt-2 border-t border-gray-100">
            <Link href="/avaliacoes" className="btn-secondary">Cancelar</Link>
            <button className="btn-primary" onClick={salvar} disabled={salvando}>
              <Save size={14} /> {salvando ? 'Salvando...' : 'Salvar e gerar PDF'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
