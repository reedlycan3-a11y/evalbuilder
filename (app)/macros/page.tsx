'use client'
import { useState } from 'react'
import { calcTMB } from '@/types'
import { PageHeader } from '@/components/ui'

export default function MacrosPage() {
  const [form, setForm] = useState({ peso: '70', altura: '170', idade: '30', sexo: 'F' as 'M' | 'F', atividade: '1.55', objetivo: '0', prot_pct: '30', carb_pct: '45', gord_pct: '25' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const tmb = calcTMB(parseFloat(form.peso)||70, parseFloat(form.altura)||170, parseInt(form.idade)||30, form.sexo)
  const get_ = tmb * parseFloat(form.atividade)
  const meta = get_ * (1 + parseFloat(form.objetivo))
  const dif = meta - get_

  const pp = parseInt(form.prot_pct), cp = parseInt(form.carb_pct), gp = parseInt(form.gord_pct)
  const total_pct = pp + cp + gp
  const prot_g = Math.round(meta * pp / 100 / 4)
  const carb_g = Math.round(meta * cp / 100 / 4)
  const gord_g = Math.round(meta * gp / 100 / 9)

  const ATIV = [
    { v: '1.2', l: 'Sedentário (sem exercício)' },
    { v: '1.375', l: 'Levemente ativo (1–3x/sem)' },
    { v: '1.55', l: 'Moderadamente ativo (3–5x/sem)' },
    { v: '1.725', l: 'Muito ativo (6–7x/sem)' },
    { v: '1.9', l: 'Extremamente ativo (2x/dia)' },
  ]

  return (
    <>
      <PageHeader title="Calculadora de macros" subtitle="TMB, GET e distribuição de macronutrientes (Mifflin-St Jeor)" />
      <div className="grid grid-cols-3 gap-5 max-w-5xl">
        <div className="col-span-2 space-y-4">
          <div className="card">
            <div className="section-title-nutri">Dados do paciente</div>
            <div className="form-grid-3 mb-3">
              <div><label className="label">Peso (kg)</label><input className="input" type="number" value={form.peso} onChange={e => set('peso', e.target.value)} /></div>
              <div><label className="label">Altura (cm)</label><input className="input" type="number" value={form.altura} onChange={e => set('altura', e.target.value)} /></div>
              <div><label className="label">Idade</label><input className="input" type="number" value={form.idade} onChange={e => set('idade', e.target.value)} /></div>
            </div>
            <div className="form-grid-2 mb-3">
              <div><label className="label">Sexo</label>
                <select className="input" value={form.sexo} onChange={e => set('sexo', e.target.value)}>
                  <option value="F">Feminino</option><option value="M">Masculino</option>
                </select>
              </div>
              <div><label className="label">Objetivo</label>
                <select className="input" value={form.objetivo} onChange={e => set('objetivo', e.target.value)}>
                  <option value="-0.3">Emagrecimento intenso (−30%)</option>
                  <option value="-0.2">Emagrecimento (−20%)</option>
                  <option value="-0.1">Emagrecimento leve (−10%)</option>
                  <option value="0">Manutenção</option>
                  <option value="0.1">Ganho leve (+10%)</option>
                  <option value="0.2">Ganho de massa (+20%)</option>
                </select>
              </div>
            </div>
            <div><label className="label">Nível de atividade física</label>
              <select className="input" value={form.atividade} onChange={e => set('atividade', e.target.value)}>
                {ATIV.map(a => <option key={a.v} value={a.v}>{a.l}</option>)}
              </select>
            </div>
          </div>

          <div className="card">
            <div className="section-title-nutri">Distribuição de macros</div>
            <p className="text-xs text-gray-400 mb-4">Ajuste os percentuais abaixo. A soma deve ser 100%.</p>
            <div className="space-y-4">
              {[
                { key: 'prot_pct', label: 'Proteína', color: 'brand', hint: '4 kcal/g' },
                { key: 'carb_pct', label: 'Carboidrato', color: 'nutri', hint: '4 kcal/g' },
                { key: 'gord_pct', label: 'Gordura', color: 'purple', hint: '9 kcal/g' },
              ].map(({ key, label, color, hint }) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="label mb-0">{label} <span className="text-gray-300">({hint})</span></label>
                    <span className="text-sm font-medium">{(form as any)[key]}%</span>
                  </div>
                  <input type="range" min="5" max="70" step="5" value={(form as any)[key]}
                    className="w-full" onChange={e => set(key, e.target.value)} />
                </div>
              ))}
              {total_pct !== 100 && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  Soma atual: {total_pct}% (deve ser 100%)
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="card text-center">
            <div className="text-xs text-gray-400 mb-1">TMB (Taxa Metabólica Basal)</div>
            <div className="text-3xl font-bold tracking-tight">{Math.round(tmb).toLocaleString('pt-BR')}</div>
            <div className="text-xs text-gray-400">kcal/dia</div>
          </div>
          <div className="card text-center">
            <div className="text-xs text-gray-400 mb-1">GET (Gasto Total)</div>
            <div className="text-3xl font-bold tracking-tight text-brand-600">{Math.round(get_).toLocaleString('pt-BR')}</div>
            <div className="text-xs text-gray-400">kcal/dia</div>
          </div>
          <div className="card text-center">
            <div className="text-xs text-gray-400 mb-1">Meta calórica</div>
            <div className="text-3xl font-bold tracking-tight text-nutri-600">{Math.round(meta).toLocaleString('pt-BR')}</div>
            <div className="text-xs text-gray-400">kcal/dia</div>
            <div className={`text-xs mt-1 font-medium ${dif < 0 ? 'text-red-500' : dif > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {dif < 0 ? `Déficit de ${Math.abs(Math.round(dif))} kcal` : dif > 0 ? `Superávit de ${Math.round(dif)} kcal` : 'Manutenção'}
            </div>
          </div>

          <div className="card">
            <div className="text-xs font-semibold text-gray-500 mb-3">Macros por dia</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-brand-600 font-medium">Proteína</span>
                  <span className="font-bold">{prot_g}g</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-1.5 bg-brand-400 rounded-full" style={{ width: `${pp}%` }} />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{Math.round(prot_g * 4)} kcal · {pp}%</div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-nutri-600 font-medium">Carboidrato</span>
                  <span className="font-bold">{carb_g}g</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-1.5 bg-nutri-400 rounded-full" style={{ width: `${cp}%` }} />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{Math.round(carb_g * 4)} kcal · {cp}%</div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-purple-600 font-medium">Gordura</span>
                  <span className="font-bold">{gord_g}g</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-1.5 bg-purple-400 rounded-full" style={{ width: `${gp}%` }} />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{Math.round(gord_g * 9)} kcal · {gp}%</div>
              </div>
            </div>
          </div>

          <div className="card text-xs text-gray-400">
            <p className="font-medium text-gray-600 mb-1">Referências por peso corporal</p>
            <p>Proteína: {(prot_g / (parseFloat(form.peso)||70)).toFixed(1)}g/kg</p>
            <p>Carb: {(carb_g / (parseFloat(form.peso)||70)).toFixed(1)}g/kg</p>
            <p className="mt-2 text-[10px]">Fórmula: Mifflin-St Jeor</p>
          </div>
        </div>
      </div>
    </>
  )
}
