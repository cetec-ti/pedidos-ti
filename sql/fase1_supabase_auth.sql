-- ═══════════════════════════════════════════════════════════════
-- FASE 1 — Migração para Supabase Auth
--
-- ORDEM DE EXECUÇÃO (importante!):
--   PASSO 1: criar os 3 usuários no Dashboard (Authentication > Users)
--   PASSO 2: rodar a PARTE A deste script (define papel e nome)
--   PASSO 3: subir o código novo dos painéis e TESTAR o login
--   PASSO 4: só então rodar a PARTE B (fecha o acesso anônimo)
--
-- Rodar em: https://supabase.com/dashboard/project/lkivpaalalcqxctqhpip/sql/new
-- ═══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- PARTE A — Define papel (role) e nome de cada usuário
--
-- Usamos raw_app_meta_data (e NÃO raw_user_meta_data) porque o
-- app_metadata só pode ser alterado por admin. O user_metadata é
-- editável pelo próprio usuário — usá-lo para "role" permitiria que
-- qualquer um se autopromovesse a gerente.
-- ─────────────────────────────────────────────────────────────

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role":"gerente","nome":"Neuzely Santos","usuario":"neuzelysantos"}'::jsonb
where email = 'neuzelysantos@sistemafieto.com.br';

-- Wilmar Correia foi deixado de fora: não atua mais como aprovador neste
-- escopo, então não recebe conta de acesso.

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role":"tecnico","nome":"Andresson Mouzinho","usuario":"andressonmouzinho"}'::jsonb
where email = 'andressonmouzinho@sistemafieto.com.br';

-- Conferência: as 3 linhas devem aparecer com role/nome/usuario preenchidos
select email,
       raw_app_meta_data->>'role'    as papel,
       raw_app_meta_data->>'nome'    as nome,
       raw_app_meta_data->>'usuario' as usuario,
       email_confirmed_at is not null as email_confirmado
from auth.users
order by email;


-- ═══════════════════════════════════════════════════════════════
-- PARTE B — Fecha o acesso anônimo (RODAR SÓ APÓS TESTAR O LOGIN NOVO!)
--
-- Enquanto isso não roda, as senhas continuam legíveis publicamente.
-- Depois que rodar, o login antigo para de funcionar de vez.
-- ═══════════════════════════════════════════════════════════════

-- ── usuarios: continha as senhas em texto puro. Ninguém mais lê. ──
drop policy if exists "usuarios_select" on usuarios;
drop policy if exists "usuarios_update" on usuarios;
drop policy if exists "usuarios_insert" on usuarios;
drop policy if exists "Enable read access for all users" on usuarios;
drop policy if exists "Enable update for all users" on usuarios;
drop policy if exists "Enable insert for all users" on usuarios;

alter table usuarios enable row level security;
-- Sem nenhuma policy criada = ninguém acessa via API pública.
-- O Supabase Auth agora é a fonte da verdade de autenticação.

-- Apaga as senhas antigas em texto puro (já comprometidas de qualquer forma)
update usuarios set senha = null;
-- Se a coluna for NOT NULL, use a linha abaixo no lugar da de cima:
--   alter table usuarios alter column senha drop not null;
--   update usuarios set senha = null;


-- ── codigos_reset: códigos de 6 dígitos estavam legíveis por qualquer um ──
drop policy if exists "codigos_reset_select" on codigos_reset;
drop policy if exists "codigos_reset_insert" on codigos_reset;
drop policy if exists "codigos_reset_update" on codigos_reset;
drop policy if exists "Enable read access for all users" on codigos_reset;
drop policy if exists "Enable insert for all users" on codigos_reset;
drop policy if exists "Enable update for all users" on codigos_reset;

alter table codigos_reset enable row level security;
-- Idem: sem policy = sem acesso anônimo. A Fase 3 troca este fluxo por
-- uma Edge Function. Até lá, o reset por e-mail fica indisponível e as
-- senhas são redefinidas pelo Dashboard.

-- Limpa códigos antigos que ficaram expostos
delete from codigos_reset;
