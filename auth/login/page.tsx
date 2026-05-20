'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const login = async () => {
    setLoading(true); setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) { setErro('E-mail ou senha incorretos.'); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-400 rounded-xl flex items-center justify-center">
            <i className="ti ti-activity-heartbeat text-white text-lg" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight">EvalBuilder</div>
            <div className="text-xs text-gray-400">PRO</div>
          </div>
        </div>

        <h1 className="text-xl font-bold mb-6">Entrar na conta</h1>

        {erro && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4 border border-red-100">{erro}</div>}

        <div className="space-y-3">
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="password" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
          </div>
        </div>

        <button className="btn-primary w-full mt-5 justify-center" onClick={login} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          Não tem conta?{' '}
          <a href="/cadastro" className="text-brand-400 font-medium hover:underline">Criar conta grátis</a>
        </p>
      </div>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css" rel="stylesheet" />
    </div>
  )
}
