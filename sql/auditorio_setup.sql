-- ═══════════════════════════════════════════════════════════════
-- Setup: controle de disponibilidade do Auditório
-- Rode este script inteiro no SQL Editor do Supabase
-- (https://supabase.com/dashboard/project/lkivpaalalcqxctqhpip/sql/new)
-- ═══════════════════════════════════════════════════════════════

-- 1) Toggle geral (linha única) — liga/desliga o Auditório pra novas solicitações
create table if not exists auditorio_config (
  id int primary key default 1,
  disponivel boolean not null default true,
  atualizado_por text,
  atualizado_em timestamptz default now(),
  constraint auditorio_config_single_row check (id = 1)
);

insert into auditorio_config (id, disponivel)
values (1, true)
on conflict (id) do nothing;

-- 2) Períodos específicos bloqueados pela gerência
create table if not exists auditorio_bloqueios (
  id bigserial primary key,
  data_inicio date not null,
  data_fim date not null,
  motivo text,
  criado_por text,
  criado_em timestamptz not null default now(),
  constraint auditorio_bloqueios_datas_validas check (data_fim >= data_inicio)
);

create index if not exists idx_auditorio_bloqueios_datas
  on auditorio_bloqueios (data_inicio, data_fim);

-- 3) Colunas novas em `solicitacoes` para guardar os dias/horários e extras do
--    Auditório de forma estruturada (hoje só iam no texto do e-mail — sem isso
--    não dá pra checar conflito de horário entre pedidos).
alter table solicitacoes add column if not exists auditorio_dias jsonb;
alter table solicitacoes add column if not exists auditorio_extras jsonb;
alter table solicitacoes add column if not exists auditorio_participantes int;

-- 4) RLS (Row Level Security) — segue o mesmo padrão do restante do projeto:
--    leitura pública (o formulário precisa consultar disponibilidade/conflitos
--    sem estar logado) e escrita liberada pela anon key (a mesma abordagem já
--    usada em `solicitacoes`, `colaboradores`, `usuarios` etc. — a validação de
--    quem pode editar fica no frontend, não no banco).
alter table auditorio_config enable row level security;
alter table auditorio_bloqueios enable row level security;

drop policy if exists "auditorio_config_select" on auditorio_config;
create policy "auditorio_config_select" on auditorio_config for select using (true);
drop policy if exists "auditorio_config_update" on auditorio_config;
create policy "auditorio_config_update" on auditorio_config for update using (true);

drop policy if exists "auditorio_bloqueios_select" on auditorio_bloqueios;
create policy "auditorio_bloqueios_select" on auditorio_bloqueios for select using (true);
drop policy if exists "auditorio_bloqueios_insert" on auditorio_bloqueios;
create policy "auditorio_bloqueios_insert" on auditorio_bloqueios for insert with check (true);
drop policy if exists "auditorio_bloqueios_delete" on auditorio_bloqueios;
create policy "auditorio_bloqueios_delete" on auditorio_bloqueios for delete using (true);
