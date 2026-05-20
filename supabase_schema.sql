-- ================================================================
-- EVALBUILDER PRO — Schema completo
-- Execute no Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ================================================================

create extension if not exists "uuid-ossp";

-- ─── PERFIS ──────────────────────────────────────────────────────
create table public.profiles (
  id                     uuid references auth.users on delete cascade primary key,
  nome                   text,
  email                  text,
  tipo                   text default 'pt' check (tipo in ('pt','nutri','ambos')),
  plano                  text default 'starter' check (plano in ('starter','pro','combo')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  trial_ends_at          timestamptz default (now() + interval '14 days'),
  created_at             timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "perfil_proprio" on public.profiles for all using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nome)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── CLIENTES ────────────────────────────────────────────────────
create table public.clientes (
  id          uuid default uuid_generate_v4() primary key,
  prof_id     uuid references public.profiles(id) on delete cascade not null,
  nome        text not null,
  email       text,
  whatsapp    text,
  sexo        text check (sexo in ('Masculino','Feminino','Outro')),
  data_nasc   date,
  objetivo    text,
  tipo        text default 'pt' check (tipo in ('pt','nutri','ambos')),
  ativo       boolean default true,
  obs         text,
  created_at  timestamptz default now()
);
alter table public.clientes enable row level security;
create policy "clientes_do_prof" on public.clientes for all using (auth.uid() = prof_id);
create index idx_clientes_prof on public.clientes(prof_id);

-- ─── AVALIAÇÕES FÍSICAS ──────────────────────────────────────────
create table public.avaliacoes (
  id               uuid default uuid_generate_v4() primary key,
  prof_id          uuid references public.profiles(id) on delete cascade not null,
  cliente_id       uuid references public.clientes(id) on delete cascade not null,
  data_aval        date not null default current_date,
  peso             numeric(5,2),
  altura           numeric(5,1),
  imc              numeric(4,2),
  perc_gordura     numeric(4,2),
  massa_magra      numeric(5,2),
  massa_gorda      numeric(5,2),
  circ_torax       numeric(5,1),
  circ_cintura     numeric(5,1),
  circ_quadril     numeric(5,1),
  circ_braco_d     numeric(5,1),
  circ_coxa_d      numeric(5,1),
  circ_panturrilha numeric(5,1),
  resist_cardio    text,
  flexibilidade    text,
  forca_abdominal  int,
  pressao_arterial text,
  objetivo         text,
  nivel            text,
  observacoes      text,
  link_token       uuid default uuid_generate_v4() unique,
  created_at       timestamptz default now()
);
alter table public.avaliacoes enable row level security;
create policy "avals_do_prof" on public.avaliacoes for all using (auth.uid() = prof_id);
create policy "aval_link_publico" on public.avaliacoes for select using (true);
create index idx_avals_prof on public.avaliacoes(prof_id);
create index idx_avals_cliente on public.avaliacoes(cliente_id);
create index idx_avals_token on public.avaliacoes(link_token);

-- ─── PLANOS DE TREINO ────────────────────────────────────────────
create table public.planos_treino (
  id          uuid default uuid_generate_v4() primary key,
  prof_id     uuid references public.profiles(id) on delete cascade not null,
  cliente_id  uuid references public.clientes(id) on delete cascade not null,
  nome        text not null,
  objetivo    text,
  frequencia  text,
  duracao_min int,
  ativo       boolean default true,
  link_token  uuid default uuid_generate_v4() unique,
  created_at  timestamptz default now()
);
alter table public.planos_treino enable row level security;
create policy "treinos_do_prof" on public.planos_treino for all using (auth.uid() = prof_id);
create policy "treino_link_publico" on public.planos_treino for select using (true);
create index idx_treinos_prof on public.planos_treino(prof_id);
create index idx_treinos_cliente on public.planos_treino(cliente_id);

-- ─── DIAS DE TREINO ──────────────────────────────────────────────
create table public.dias_treino (
  id             uuid default uuid_generate_v4() primary key,
  plano_id       uuid references public.planos_treino(id) on delete cascade not null,
  prof_id        uuid references public.profiles(id) on delete cascade not null,
  label          text not null,  -- "DIA A", "DIA B" etc
  nome           text not null,  -- "Peito + Tríceps"
  ordem          int default 0,
  created_at     timestamptz default now()
);
alter table public.dias_treino enable row level security;
create policy "dias_do_prof" on public.dias_treino for all using (auth.uid() = prof_id);
create index idx_dias_plano on public.dias_treino(plano_id);

-- ─── EXERCÍCIOS ──────────────────────────────────────────────────
create table public.exercicios (
  id          uuid default uuid_generate_v4() primary key,
  dia_id      uuid references public.dias_treino(id) on delete cascade not null,
  prof_id     uuid references public.profiles(id) on delete cascade not null,
  nome        text not null,
  grupo       text,  -- "Peito", "Costas", "Bíceps" etc
  series      int,
  repeticoes  text,  -- "8-12" ou "15"
  descanso_s  int,   -- descanso em segundos
  obs         text,
  ordem       int default 0,
  created_at  timestamptz default now()
);
alter table public.exercicios enable row level security;
create policy "exercicios_do_prof" on public.exercicios for all using (auth.uid() = prof_id);
create index idx_exercicios_dia on public.exercicios(dia_id);

-- ─── ANAMNESES NUTRICIONAIS ──────────────────────────────────────
create table public.anamneses (
  id              uuid default uuid_generate_v4() primary key,
  prof_id         uuid references public.profiles(id) on delete cascade not null,
  cliente_id      uuid references public.clientes(id) on delete cascade not null,
  data_anam       date not null default current_date,
  patologias      text,
  medicamentos    text,
  alergias        text,
  cirurgias       text,
  refeicoes_dia   int,
  ingesta_hidrica text,
  consome_alcool  text,
  suplementos     text,
  queixas         text,
  link_token      uuid default uuid_generate_v4() unique,
  created_at      timestamptz default now()
);
alter table public.anamneses enable row level security;
create policy "anam_do_prof" on public.anamneses for all using (auth.uid() = prof_id);
create policy "anam_link_publico" on public.anamneses for select using (true);
create index idx_anam_prof on public.anamneses(prof_id);
create index idx_anam_cliente on public.anamneses(cliente_id);

-- ─── PLANOS ALIMENTARES ──────────────────────────────────────────
create table public.planos_alimentares (
  id             uuid default uuid_generate_v4() primary key,
  prof_id        uuid references public.profiles(id) on delete cascade not null,
  cliente_id     uuid references public.clientes(id) on delete cascade not null,
  nome           text not null,
  objetivo       text,
  kcal_total     numeric(6,1),
  prot_g         numeric(5,1),
  carb_g         numeric(5,1),
  gord_g         numeric(5,1),
  ativo          boolean default true,
  link_token     uuid default uuid_generate_v4() unique,
  created_at     timestamptz default now()
);
alter table public.planos_alimentares enable row level security;
create policy "planos_do_prof" on public.planos_alimentares for all using (auth.uid() = prof_id);
create policy "plano_link_publico" on public.planos_alimentares for select using (true);
create index idx_planos_prof on public.planos_alimentares(prof_id);

-- ─── REFEIÇÕES ───────────────────────────────────────────────────
create table public.refeicoes (
  id         uuid default uuid_generate_v4() primary key,
  plano_id   uuid references public.planos_alimentares(id) on delete cascade not null,
  prof_id    uuid references public.profiles(id) on delete cascade not null,
  nome       text not null,
  horario    text,
  ordem      int default 0,
  created_at timestamptz default now()
);
alter table public.refeicoes enable row level security;
create policy "refeicoes_do_prof" on public.refeicoes for all using (auth.uid() = prof_id);
create index idx_refeicoes_plano on public.refeicoes(plano_id);

-- ─── ALIMENTOS ───────────────────────────────────────────────────
create table public.alimentos (
  id           uuid default uuid_generate_v4() primary key,
  refeicao_id  uuid references public.refeicoes(id) on delete cascade not null,
  prof_id      uuid references public.profiles(id) on delete cascade not null,
  nome         text not null,
  quantidade_g numeric(6,1),
  kcal         numeric(6,1),
  prot_g       numeric(5,1),
  carb_g       numeric(5,1),
  gord_g       numeric(5,1),
  ordem        int default 0,
  created_at   timestamptz default now()
);
alter table public.alimentos enable row level security;
create policy "alimentos_do_prof" on public.alimentos for all using (auth.uid() = prof_id);
create index idx_alimentos_refeicao on public.alimentos(refeicao_id);

-- ─── RECORDATÓRIOS 24H ───────────────────────────────────────────
create table public.recordatorios (
  id          uuid default uuid_generate_v4() primary key,
  prof_id     uuid references public.profiles(id) on delete cascade not null,
  cliente_id  uuid references public.clientes(id) on delete cascade not null,
  data_ref    date not null,
  kcal_meta   numeric(6,1),
  kcal_total  numeric(6,1),
  obs         text,
  link_token  uuid default uuid_generate_v4() unique,
  created_at  timestamptz default now()
);
alter table public.recordatorios enable row level security;
create policy "records_do_prof" on public.recordatorios for all using (auth.uid() = prof_id);
create index idx_records_prof on public.recordatorios(prof_id);

create table public.record_refeicoes (
  id             uuid default uuid_generate_v4() primary key,
  recordatorio_id uuid references public.recordatorios(id) on delete cascade not null,
  prof_id        uuid references public.profiles(id) on delete cascade not null,
  nome           text not null,
  horario        text,
  ordem          int default 0
);
alter table public.record_refeicoes enable row level security;
create policy "rec_ref_do_prof" on public.record_refeicoes for all using (auth.uid() = prof_id);

create table public.record_alimentos (
  id              uuid default uuid_generate_v4() primary key,
  refeicao_id     uuid references public.record_refeicoes(id) on delete cascade not null,
  prof_id         uuid references public.profiles(id) on delete cascade not null,
  nome            text not null,
  quantidade_g    numeric(6,1),
  kcal            numeric(6,1),
  prot_g          numeric(5,1),
  carb_g          numeric(5,1),
  gord_g          numeric(5,1)
);
alter table public.record_alimentos enable row level security;
create policy "rec_alim_do_prof" on public.record_alimentos for all using (auth.uid() = prof_id);
