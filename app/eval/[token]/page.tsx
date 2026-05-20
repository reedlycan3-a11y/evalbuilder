import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { formatarData } from '@/types'

export default async function EvalPublicPage({ params }: { params: { token: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: av } = await supabase
    .from('avaliacoes')
    .select('*, cliente:clientes(nome, sexo, data_nasc, objetivo, whatsapp, email)')
    .eq('link_token', params.token)
    .single()

  if (!av) return notFound()
  const cl = av.cliente as any

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-brand-600 rounded-t-2xl p-6 text-white text-center">
          <div className="text-xl font-bold mb-1">AVALIAÇÃO FÍSICA</div>
          <div className="text-sm opacity-90">{cl?.nome} · {formatarData(av.data_aval)}</div>
        </div>
        <div className="bg-white rounded-b-2xl p-6 shadow-sm">
          <Section title="Dados do aluno">
            <Row label="Nome" value={cl?.nome} />
            <Row label="Sexo" value={cl?.sexo} />
            <Row label="Objetivo" value={av.objetivo} />
            <Row label="Nível" value={av.nivel} />
          </Section>
          <Section title="Composição corporal">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[['Peso', av.peso, 'kg'],['Altura', av.altura, 'cm'],['IMC', av.imc, ''],
                ['% Gordura', av.perc_gordura, '%'],['Massa magra', av.massa_magra, 'kg'],['Massa gorda', av.massa_gorda, 'kg'],
              ].map(([l, v, u]) => v != null && (
                <div key={String(l)} className="bg-brand-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-brand-600">{String(v)}{u}</div>
                  <div className="text-xs text-brand-800 mt-0.5">{String(l)}</div>
                </div>
              ))}
            </div>
          </Section>
          {(av.circ_cintura || av.circ_torax) && (
            <Section title="Circunferências">
              <div className="grid grid-cols-2 gap-2">
                <Row label="Tórax" value={av.circ_torax ? `${av.circ_torax} cm` : undefined} />
                <Row label="Cintura" value={av.circ_cintura ? `${av.circ_cintura} cm` : undefined} />
                <Row label="Quadril" value={av.circ_quadril ? `${av.circ_quadril} cm` : undefined} />
                <Row label="Braço D" value={av.circ_braco_d ? `${av.circ_braco_d} cm` : undefined} />
                <Row label="Coxa D" value={av.circ_coxa_d ? `${av.circ_coxa_d} cm` : undefined} />
                <Row label="Panturrilha D" value={av.circ_panturrilha ? `${av.circ_panturrilha} cm` : undefined} />
              </div>
            </Section>
          )}
          {(av.resist_cardio || av.flexibilidade) && (
            <Section title="Testes físicos">
              <Row label="Resistência cardiovascular" value={av.resist_cardio} />
              <Row label="Flexibilidade" value={av.flexibilidade} />
              <Row label="Força abdominal" value={av.forca_abdominal ? `${av.forca_abdominal} reps` : undefined} />
              <Row label="Pressão arterial" value={av.pressao_arterial} />
            </Section>
          )}
          {av.observacoes && (
            <Section title="Observações">
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{av.observacoes}</p>
            </Section>
          )}
          <p className="text-center text-xs text-gray-300 mt-6">Gerado por EvalBuilder · evalbuilder.com.br</p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-bold text-brand-600 tracking-widest uppercase border-b-2 border-brand-50 pb-1.5 mb-3">{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value?: any }) {
  if (value == null || value === '') return null
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium">{String(value)}</span>
    </div>
  )
}
