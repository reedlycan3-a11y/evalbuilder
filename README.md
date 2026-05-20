# EvalBuilder Pro

SaaS para Personal Trainers e Nutricionistas — avaliações físicas, prescrição de treino e planos alimentares em PDF profissional.

---

## Stack

- **Next.js 14** App Router + TypeScript
- **Supabase** — banco de dados, autenticação, RLS
- **Stripe** — assinaturas (Starter $27, Pro $47, Combo $67)
- **jsPDF** — geração de PDFs no browser
- **Tailwind CSS** — estilização
- **Vercel** — deploy

---

## Deploy passo a passo

### 1. Supabase

1. Acesse https://supabase.com e crie um novo projeto
2. Vá em **SQL Editor → New query**
3. Cole o conteúdo de `supabase_schema.sql` e execute
4. Vá em **Settings → API** e copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Stripe

1. Acesse https://dashboard.stripe.com
2. Crie 3 produtos recorrentes mensais:
   - **Starter** — R$27/mês (PT ou Nutri, até 30 clientes)
   - **Pro** — R$47/mês (PT ou Nutri, ilimitado)
   - **Combo** — R$67/mês (PT + Nutri, ilimitado)
3. Copie os Price IDs de cada produto para as variáveis `STRIPE_PRICE_*`
4. Em **Developers → API keys**, copie a Secret Key e Publishable Key
5. Em **Developers → Webhooks**, adicione o endpoint:
   - URL: `https://seu-dominio.vercel.app/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.deleted`
6. Copie o **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 3. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha todos os valores.

### 4. Instalar dependências e rodar local

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

### 5. Deploy na Vercel

1. Suba o projeto para o GitHub
2. Acesse https://vercel.com e importe o repositório
3. Em **Settings → Environment Variables**, adicione todas as variáveis do `.env.local`
4. Faça o deploy

---

## Estrutura do projeto

```
evalbuilder/
├── app/
│   ├── (auth)/           # Login e cadastro
│   ├── (app)/            # Área autenticada
│   │   ├── dashboard/
│   │   ├── clientes/
│   │   ├── avaliacoes/
│   │   ├── nova-avaliacao/
│   │   ├── treinos/      ← Prescrição de treino (PT)
│   │   ├── anamnese/     ← Anamnese nutricional (Nutri)
│   │   ├── plano/        ← Plano alimentar (Nutri)
│   │   ├── recordatorio/ ← Recordatório 24h (Nutri)
│   │   ├── macros/       ← Calculadora TMB/GET (Nutri)
│   │   ├── alertas/      ← Alertas de retenção
│   │   └── pdfs/         ← Todos os PDFs gerados
│   ├── api/stripe/webhook/
│   └── eval/[token]/     ← Link público de avaliação
├── components/
│   ├── Sidebar.tsx
│   └── ui.tsx
├── lib/
│   ├── supabase.ts
│   ├── supabase-server.ts
│   └── pdf.ts            ← Geração de PDFs (jsPDF)
├── types/index.ts
├── middleware.ts
└── supabase_schema.sql
```

---

## Funcionalidades

### Personal Trainer
- ✅ Avaliações físicas (composição corporal, circunferências, testes)
- ✅ Prescrição de treino — planos multi-dia (DIA A/B/C/D/E) com exercícios, séries, repetições e descanso
- ✅ PDF do treino para enviar ao aluno
- ✅ Link público da avaliação

### Nutricionista
- ✅ Anamnese nutricional (histórico clínico + hábitos alimentares)
- ✅ Plano alimentar com refeições, alimentos e macros calculados automaticamente
- ✅ Recordatório alimentar 24h com comparativo da meta
- ✅ Calculadora de macros (TMB/GET via Mifflin-St Jeor)
- ✅ PDF do plano e da anamnese

### Gestão
- ✅ Dashboard com stats e alertas de churn
- ✅ Gerenciamento de clientes (PT / Nutri / PT+Nutri)
- ✅ Sistema de alertas por dias sem atualização
- ✅ Página de PDFs gerados com filtros

---

## Planos de preço

| Plano | Preço | Perfil | Limite |
|-------|-------|--------|--------|
| Starter | $27/mês | PT ou Nutri | 30 clientes |
| Pro | $47/mês | PT ou Nutri | Ilimitado |
| Combo | $67/mês | PT + Nutri | Ilimitado |

Trial gratuito de 14 dias, sem cartão de crédito.
