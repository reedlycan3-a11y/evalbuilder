'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { ProfTipo } from '@/types'

export default function CadastroPage() {
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState({ nome: '', email: '', senha: '', tipo: 'pt' as ProfTipo })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const cadastrar = async () => {
    if (!form.nome || !form.email || !form.senha) { setErro('Preencha todos os campos.'); return }
    setLoading(true); setErro('')
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha,
      options: { data: { nome: form.nome, tipo: form.tipo } },
    })
    if (error) { setErro(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  const TIPOS = [
    { value: 'pt', label: 'Personal Trainer', sub: 'Avaliações e treinos', icon: 'ti-barbell' },
    { value: 'nutri', label: 'Nutricionista', sub: 'Anamnese e planos alimentares', icon: 'ti-salad' },
    { value: 'ambos', label: 'PT + Nutricionista', sub: 'Tudo incluído', icon: 'ti-adjustments-alt', destaque: true },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10">
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" rel="stylesheet" />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-400 rounded-xl flex items-center justify-center">
            <i className="ti ti-activity-heartbeat text-white text-lg" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight">EvalBuilder</div>
            <div className="text-xs text-gray-400">14 dias grátis</div>
          </div>
        </div>

        <h1 className="text-xl font-bold mb-5">Criar sua conta</h1>

        {erro && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4 border border-red-100">{erro}</div>}

        <div className="space-y-3 mb-5">
          <div>
            <label className="label">Nome completo</label>
            <input className="input" placeholder="Seu nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label className="label">E-mail profissional</label>
            <input className="input" type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="password" placeholder="Mínimo 6 caracteres" value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} />
          </div>
        </div>

        <div className="mb-6">
          <label className="label mb-2">Você é:</label>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map(t => (
              <button
                key={t.value}
                onClick={() => setForm({ ...form, tipo: t.value as ProfTipo })}
                className={`p-3 rounded-xl border text-center transition-all ${
                  form.tipo === t.value
                    ? t.value === 'ambos'
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-brand-400 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <i className={`ti ${t.icon} text-xl block mb-1 ${form.tipo === t.value ? (t.value === 'ambos' ? 'text-purple-600' : 'text-brand-600') : 'text-gray-400'}`} />
                <div className="text-xs font-medium text-gray-700">{t.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{t.sub}</div>
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary w-full justify-center mb-4" onClick={cadastrar} disabled={loading}>
          {loading ? 'Criando conta...' : 'Criar conta grátis — 14 dias'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Sem cartão de crédito para começar.
        </p>
        <p className="text-center text-sm text-gray-400 mt-3">
          Já tem conta?{' '}
          <a href="/login" className="text-brand-400 font-medium hover:underline">Entrar</a>
        </p>
      </div>
    </div>
  )
}
