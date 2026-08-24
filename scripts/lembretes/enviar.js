// Lembretes de solicitações pendentes — roda 4x ao dia via GitHub Actions.
// Consulta o Supabase por solicitações Pendente/Em análise, calcula o
// vencimento (data de retirada, ou data reservada do Auditório) e dispara
// uma notificação push pra cada inscrito (Neuzely, Andresson etc.), até que
// a solicitação seja aprovada ou reprovada — mesmo que o prazo já tenha
// passado.

const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lkivpaalalcqxctqhpip.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:andressonmouzinho@sistemafieto.com.br';
const SITE_BASE = 'https://cetec-ti.github.io/pedidos-ti';

if (!SUPABASE_ANON_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Faltam variáveis de ambiente obrigatórias (SUPABASE_ANON_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY).');
  process.exit(1);
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function calcularVencimento(item) {
  if (Array.isArray(item.auditorio_dias) && item.auditorio_dias.length) {
    const datas = item.auditorio_dias.map(d => d.data).filter(Boolean).sort();
    return datas[0] || null;
  }
  if (item.data_retirada) {
    return item.data_retirada.split(' ')[0];
  }
  return null;
}

function formatarData(isoDate) {
  if (!isoDate) return null;
  const [ano, mes, dia] = isoDate.split('-');
  return `${dia}/${mes}/${ano}`;
}

function diasEmAtraso(isoDate) {
  if (!isoDate) return 0;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(isoDate + 'T00:00:00');
  const diffMs = hoje - venc;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

async function main() {
  const { data: pendentes, error: errPend } = await sb
    .from('solicitacoes')
    .select('numero,nome,equipamento,status,data_retirada,auditorio_dias')
    .in('status', ['Pendente', 'Em análise']);
  if (errPend) { console.error('Erro ao buscar solicitações:', errPend.message); process.exit(1); }

  if (!pendentes || !pendentes.length) {
    console.log('Nenhuma solicitação pendente. Nada a lembrar.');
    return;
  }

  const { data: subs, error: errSubs } = await sb.from('push_subscriptions').select('*');
  if (errSubs) { console.error('Erro ao buscar inscrições:', errSubs.message); process.exit(1); }

  if (!subs || !subs.length) {
    console.log('Ninguém ativou notificações ainda. Nada a enviar.');
    return;
  }

  console.log(`${pendentes.length} solicitação(ões) pendente(s), ${subs.length} inscrição(ões) ativa(s).`);

  const idsParaRemover = [];

  for (const item of pendentes) {
    const vencIso = calcularVencimento(item);
    const vencTxt = vencIso ? formatarData(vencIso) : 'sem data definida';
    const atraso = vencIso ? diasEmAtraso(vencIso) : 0;
    const atrasoTxt = atraso > 0 ? ` ⚠️ Vencido há ${atraso} dia(s)!` : '';

    const base = {
      title: `📋 Solicitação ${item.numero} pendente`,
      body: `${item.nome} — ${item.equipamento}\nVencimento: ${vencTxt}.${atrasoTxt}`,
      tag: `pendente-${item.numero}`
    };

    for (const sub of subs) {
      const payload = JSON.stringify({ ...base, url: `${SITE_BASE}/${sub.pagina || 'gerente.html'}` });
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`Inscrição expirada (${sub.usuario}), removendo.`);
          idsParaRemover.push(sub.id);
        } else {
          console.error(`Falha ao enviar pra ${sub.usuario}:`, err.statusCode, err.message);
        }
      }
    }
  }

  if (idsParaRemover.length) {
    await sb.from('push_subscriptions').delete().in('id', idsParaRemover);
  }

  console.log('Lembretes enviados.');
}

main().catch(err => { console.error('Erro inesperado:', err); process.exit(1); });
