# 🖥️ Pedidos — Cetec Palmas
### Sistema de Gestão de Equipamentos e Espaços

Sistema web para solicitação e gestão de equipamentos de TI e reserva de espaços, desenvolvido para uso interno da **Cetec Palmas**. Colaboradores solicitam equipamentos ou reservam o auditório através de um formulário online, enquanto o técnico e os aprovadores gerenciam os pedidos por interfaces dedicadas.

---

## ✨ Funcionalidades

### 👤 Portal do Colaborador (`index.html`)
- Auto preenchimento de dados pelo nome do colaborador (integrado ao Supabase)
- Formulário em 3 etapas com validação em tempo real
- Seleção múltipla de equipamentos com carrinho dinâmico
- Equipamentos: Notebook, Computador, Monitor, Projetor, Mouse, Teclado, Óculos de Realidade Aumentada, Fone de Ouvido, Outros
- **Auditório** — campos exclusivos: datas de uso (múltiplos dias), horário início/término, aviso de regras do espaço
- Quando Auditório selecionado: oculta campos de Urgência, Tempo de Uso e Agendar Retirada
- Campo de agendamento de retirada (data + horário) para demais equipamentos
- Termo de compromisso de devolução (exibido apenas com prazo em dias)
- Geração automática de número de protocolo (`SOLI-YYYYMMDD-XXXX`)
- Registro no Supabase + envio de e-mail ao aprovador e confirmação ao solicitante
- **Roteamento de e-mail por setor:** Docentes → Wilmar + Andresson / Demais → Neuzely + Andresson
- Sanitização XSS em todos os dados renderizados

### 🛠️ Área do Técnico (`tecnico.html`)
- Login com rate limiting (bloqueio após 5 tentativas por 15 min)
- Expiração de sessão por inatividade (8 horas)
- Dashboard com contadores por status
- Todos os pedidos visíveis sem distinção de setor
- Todos os status: Aprovado, Em Análise, Reprovado
- Pedidos finalizados bloqueados para novas ações
- Notificações do navegador + auto-refresh 30s
- Troca de senha e recuperação por código via e-mail

### 🔐 Central de Aprovações (`gerente.html`)
- Dois perfis de aprovação:
  - **Neuzely Santos** → vê pedidos de todos os setores exceto Docentes
  - **Wilmar Correia** → vê apenas pedidos do setor Docentes
- Login com rate limiting e expiração de sessão (8 horas)
- Aviso personalizado conforme perfil logado
- Somente Autorizar ou Reprovar (sem "Em Análise")
- Pedidos finalizados bloqueados para novas ações
- Troca de senha e recuperação por código via e-mail

---

## 🔄 Fluxo do Sistema

```
Colaborador preenche o formulário
        ↓
Protocolo gerado automaticamente
        ↓
Dados salvos no Supabase
        ↓
┌─────────────────────────────────────┐
│ Setor Docentes?                     │
│  SIM → E-mail: Wilmar + Andresson   │
│  NÃO → E-mail: Neuzely + Andresson  │
└─────────────────────────────────────┘
        ↓
Aprovador analisa e decide
        ↓
Status atualizado no Supabase
E-mail com decisão enviado ao colaborador
        ↓
Técnico acompanha tudo no dashboard
```

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 / CSS3 / JavaScript | Interface |
| [Supabase](https://supabase.com) | Banco PostgreSQL + API REST |
| [EmailJS](https://www.emailjs.com) | Envio de e-mails |
| GitHub Pages | Hospedagem |

---

## 📁 Estrutura

```
pedidos-ti/
├── index.html      # Portal do colaborador
├── tecnico.html    # Área do técnico
├── gerente.html    # Central de aprovações
└── README.md
```

---

## ⚙️ Tabelas Supabase

| Tabela | Descrição |
|---|---|
| `colaboradores` | Cadastro de colaboradores para auto preenchimento |
| `solicitacoes` | Pedidos realizados |
| `usuarios` | Usuários do sistema (técnico e aprovadores) |
| `codigos_reset` | Códigos temporários para recuperação de senha |

---

## 👥 Perfis de Acesso

| Perfil | Usuário | Ver pedidos | Aprovar | Em Análise | Reprovar | Recuperar senha |
|---|---|---|---|---|---|---|
| **Técnico** | `andressonmouzinho` | Todos | ✅ | ✅ | ✅ | ✅ |
| **Gerente** | `neuzelysantos` | Exceto Docentes | ✅ | ❌ | ✅ | ✅ |
| **Coordenadora** | `wilmarcorreia` | Só Docentes | ✅ | ❌ | ✅ | ✅ |

---

## 📊 SLA — Prazo de Resposta

| Prioridade | Prazo |
|---|---|
| 🔴 Alta | 1 dia útil |
| 🟡 Média | 3 dias úteis |
| 🟢 Baixa | 5 dias úteis |

---

## 🔒 Segurança Implementada

| Camada | Medida |
|---|---|
| **Brute Force** | Bloqueio após 5 tentativas por 15 minutos |
| **XSS** | Sanitização de todos os dados externos via `sanitize()` |
| **Sessão** | Expiração automática após 8h de inatividade |
| **RLS** | Row Level Security ativo no Supabase com políticas por operação |
| **Recuperação de senha** | Código de 6 dígitos por e-mail, expira em 10 min, uso único |
| **Senhas** | Armazenadas no Supabase, nunca hardcoded no frontend |

---

## 🔗 Acesso

| Página | URL |
|---|---|
| Portal do Colaborador | `https://cetec-ti.github.io/pedidos-ti` |
| Área do Técnico | `https://cetec-ti.github.io/pedidos-ti/tecnico.html` |
| Central de Aprovações | `https://cetec-ti.github.io/pedidos-ti/gerente.html` |

---

## 👨‍💻 Desenvolvido por

**Andresson Mouzinho de Sousa**
Suporte TI — Cetec Palmas
Sistema desenvolvido com auxílio de IA — Claude (Anthropic)
