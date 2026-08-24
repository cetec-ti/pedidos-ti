-- ═══════════════════════════════════════════════════════════════
-- Setup: notificações push (lembretes de solicitações pendentes)
-- Rode este script inteiro no SQL Editor do Supabase
-- (https://supabase.com/dashboard/project/lkivpaalalcqxctqhpip/sql/new)
-- ═══════════════════════════════════════════════════════════════

-- Inscrições push de quem ativou notificações (Neuzely, Andresson etc.)
create table if not exists push_subscriptions (
  id bigserial primary key,
  usuario text not null,
  pagina text not null default 'gerente.html', -- qual painel abrir ao clicar (gerente.html ou tecnico.html)
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_usuario on push_subscriptions (usuario);

alter table push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select" on push_subscriptions;
create policy "push_subscriptions_select" on push_subscriptions for select using (true);
drop policy if exists "push_subscriptions_insert" on push_subscriptions;
create policy "push_subscriptions_insert" on push_subscriptions for insert with check (true);
drop policy if exists "push_subscriptions_delete" on push_subscriptions;
create policy "push_subscriptions_delete" on push_subscriptions for delete using (true);
