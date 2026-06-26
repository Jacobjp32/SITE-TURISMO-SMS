# Bloco 1 — Fundação modular do Admin CMS

> Rodada de **especificação técnica**. Nenhum código de produção foi alterado, nada
> commitado, e não toquei em Firestore/Storage Rules, auth, roles, claims ou permissões.
> Gerado em 2026-06-25. Publicação: arquivos estáticos no repositório GitHub.

Pré-requisito desta rodada: `git status` → **working tree clean** (confirmado).

Referência: [docs/plano-admin-cms-completo.md](plano-admin-cms-completo.md),
`admin-firebase.html`, `js/firebase-auth.js`, `js/admin-content-cms.js`, `config.js`,
`firestore.rules`, `storage.rules`.

**Objetivo do Bloco 1:** preparar o admin para crescer como CMS, reduzindo acoplamento e
criando arquitetura modular — **sem** implementar os módulos novos (banners,
empreendimentos, rotas, galeria, configurações, sazonal, mascote, logs). Só fundação.

---

## 1. Diagnóstico técnico do admin atual

### 1.1 Carga de scripts (`admin-firebase.html`, ordem real, linhas 1395–1408)

```
js/security-utils.js
js/data/restaurantes.js
js/data/hospedagens.js
js/establishment-catalog.js
config.js?v=admin-stability-20260608
firebase-app-compat / auth-compat / firestore-compat / storage-compat / app-check-compat (10.7.1)
js/firebase-auth.js?v=admin-stability-20260608
js/admin-content-cms.js?v=admin-stability-20260608
<script> … 1408–3041 (shell inline) …
```

### 1.2 O shell inline (linhas 1408–3041)

- É **um único `<script>` SEM IIFE** → **todas as funções e variáveis estão no escopo
  global** (`window`). Isso é o que faz os `onclick="approveEvent(...)"` funcionarem.
  **Esta é a principal restrição de migração.**
- Estado em variáveis de módulo: `adminLoginIntent`, `adminSessionMonitorId`,
  `adminActivityListenersBound`, `adminSessionLogoutInProgress`, `adminLastActivityPersistAt`.
- Constantes de sessão: `ADMIN_SESSION_TIMEOUT_MS` (2h), `ADMIN_SESSION_LAST_ACTIVITY_KEY`,
  `ADMIN_SESSION_START_KEY` (localStorage).

### 1.3 Boot e ciclo de auth

- `window.addEventListener('firebaseReady')` (1427): liga submit do `adminLoginForm`,
  toggle de senha, submit do `managerForm`, e os cliques da sidebar
  (`.sidebar-menu a[data-section]` → `showSection`). Chama `updateDate()`.
- `window.addEventListener('authStateChanged')` (1438): chama `checkAdminAuth()`.
- `checkAdminAuth()` (1636): trata `!user`, `_profilePending`, `_profileError`,
  `role !== 'admin'`, validade de sessão; alterna `showAdminLogin()`/`showAdminDashboard()`.
- Monitor de sessão: `bindAdminActivityListeners()` (click/keydown/scroll/focus/
  visibilitychange) + `startAdminSessionMonitor()` (intervalo de 60s). Expira por
  inatividade via `expireAdminSession()` → `forceAdminLogout()`.

### 1.4 Navegação (o "router" atual)

`showSection(section)` (1691):
1. `touchAdminSession(false)`;
2. tira `.active` de todas `.admin-section`, adiciona na `#section-<section>`;
3. atualiza destaque na sidebar;
4. **if-chain hardcoded** dispara o load da seção:
   - `aprovacoes` → `loadPendingData()`
   - `vinculos` → `loadEstablishmentClaims()`
   - `gerenciar-vinculos` → `loadEstablishmentManagers()`
   - `usuarios` → `loadUsers()`
   - `eventos` → `loadApprovedEvents()` (inline, 2405)
   - `noticias` → `AdminContentCMS.loadNews()`
   - `midia` → `AdminContentCMS.loadMedia()`

Seções no DOM (sidebar 1098–1107 / `#section-*` 1118+): `home`, `aprovacoes`, `vinculos`,
`gerenciar-vinculos`, `usuarios`, `eventos`, `noticias`, `midia`.

### 1.5 Onde vive cada função

**Inline em `admin-firebase.html`** (escopo global):
- Shell/auth: `setLoginFeedback`, `clearLoginFeedback`, `toggleLoginPasswordVisibility`,
  `handleLogin`, `checkAdminAuth`, `handleLogout`, `showAdminLogin`, `showAdminDashboard`,
  `forceAdminLogout`, `expireAdminSession`, sessão (`*AdminSession*`, `*Monitor*`).
- Router/UI: `showSection`, `updateDate`, `loadDashboardData`.
- Aprovações: `loadPendingData`, `approveEvent`, `rejectEvent`, `viewEvent`,
  `approveEstablishment`, `rejectEstablishment`.
- Vínculos (claims): `loadEstablishmentClaims`, `approveClaim`, `rejectClaimReview`.
- Update-requests: `loadEstablishmentUpdateRequests`, `approveEstablishmentUpdateRequest`,
  `rejectEstablishmentUpdateRequest`, `requestChangesForEstablishmentUpdate`.
- Managers: `loadEstablishmentManagers`, `ensureManagerFormSources`, `populateManager*`,
  `openAddManagerModal`, `openEditManagerModal`, `handleManagerFormSubmit`,
  `closeManagerModal`, `deactivateManager`, `reactivateManager`.
- Usuários: `loadUsers`, `changeUserRole`, `toggleUserStatus`, `copyUserEmail`,
  `focusUserManagers`/`focusUserClaims` (+ clear), `renderUserEstablishments`.
- Eventos aprovados (inline): `loadApprovedEvents`, mais ~25 helpers de render/format
  (`getPendingEventImages`, `renderPendingEvent*`, `formatDate`, `formatFirestoreDate`,
  `getEventDisplay*`, `getUpdateRequest*`, `getManagerRole*`, etc.).

**Em `js/firebase-auth.js`** (`window.FirebaseSystem`): toda a camada de dados/negócio —
auth (`login/logout/register/sendPasswordReset`), roles (`isAdmin/isModerator`), eventos
(`submitEvent/getPendingEventsReport/approveEvent/rejectEvent`), estabelecimentos, claims,
managers (`create/update/deactivate/reactivate/approveEstablishmentClaim`),
update-requests, `getAdminStats`, `updateUI`, `showNotification`.

**Em `js/admin-content-cms.js`** (`window.AdminContentCMS`): CMS de **eventos aprovados**,
**notícias**, **mídia** (`media_library`) — CRUD, upload p/ `cms-media/{uid}/`, modal
próprio (`#contentModal`/`#contentModalBody`), `buildMediaUsageMap`, importador de
notícias estáticas. Onclicks namespaced (`AdminContentCMS.x(...)`) — mais seguros.

### 1.6 Dois sistemas de modal e duplicações (riscos)

- **Modal A** `#managerModal` (inline) — usado por vínculos/managers.
- **Modal B** `#contentModal` + `#contentModalBody` (AdminContentCMS) — eventos/notícias/
  mídia. **Não há helper de modal compartilhado.**
- **`loadApprovedEvents` duplicado**: existe inline (2405) **e** `window.loadApprovedEvents`
  exposto por `admin-content-cms.js`. Como o inline é declaração de função global, ele
  **sobrescreve** o do CMS; `showSection('eventos')` usa o inline. Fonte de confusão.
- **`normalizeUpdateRequestStatus`** existe em dois lugares (inline 2937 e firebase-auth.js).

### 1.7 O que pode quebrar se modularizar sem cuidado

1. **`onclick="fn(...)"` globais** (≈25 nomes): `approveClaim`, `approveEstablishment`,
   `approveEstablishmentUpdateRequest`, `approveEvent`, `closeManagerModal`, `copyUserEmail`,
   `deactivateManager`, `focusUserClaims`, `focusUserManagers`, `handleLogout`,
   `loadEstablishmentClaims`, `loadEstablishmentManagers`, `loadPendingData`, `loadUsers`,
   `openAddManagerModal`, `openEditManagerModal`, `reactivateManager`, `rejectClaimReview`,
   `rejectEstablishment`, `rejectEstablishmentUpdateRequest`, `rejectEvent`, `showSection`,
   `toggleUserStatus`, `viewEvent`. Mover para IIFE/módulo **sem reexpor** quebra a UI.
2. **Ordem de eventos** `firebaseReady`/`authStateChanged` — qualquer router novo deve
   manter o mesmo handshake (não inicializar antes do Firebase).
3. **IDs do DOM** (`#dashboard`, `#loginScreen`, `#section-*`, `#managerModal`,
   `#contentModal`, `stat-*`, `*-container`) são contratos implícitos — renomear quebra.
4. **Listeners de atividade duplicados** se o monitor for religado por módulo.
5. **`window.currentUser`** é populado de forma assíncrona (perfil carrega depois do auth);
   módulos não podem assumir `role` no primeiro tick.

---

## 2. Arquitetura modular recomendada

Padrão **strangler-fig**: introduzir uma fina camada (context + ui + router) que
**convive** com o shell inline; migrar seção por seção; cada função global migrada ganha um
**shim** em `window` para os `onclick` continuarem válidos até a UI usar delegação.

### 2.1 Estrutura de arquivos proposta

```
js/admin/
  admin-context.js     # contexto compartilhado (db/storage/auth/currentUser/role/helpers)
  admin-ui.js          # modal único, toast, tabela, badges, loading/empty/error
  admin-registry.js    # registro de módulos + montagem da sidebar/nav
  admin-router.js      # troca de seção + ciclo de vida (load/dispose), substitui showSection
  admin-shell.js       # boot: auth gate + monitor de sessão (extrai o inline gradualmente)
  modules/
    dashboard.js       # migra loadDashboardData
    approvals.js       # eventos_pendentes + estabelecimentos + update-requests
    claims.js          # establishment_claims
    managers.js        # establishment_managers (seção "gerenciar-vinculos")
    users.js           # usuarios
    events.js          # wrapper fino sobre AdminContentCMS (eventos aprovados)
    news.js            # wrapper fino sobre AdminContentCMS (noticias)
    media.js           # wrapper fino sobre AdminContentCMS (media_library)
    banners.js         # PLACEHOLDER (Bloco 2)
    establishments.js  # PLACEHOLDER (Bloco 4)
    settings.js        # PLACEHOLDER (Bloco 6/plano)
    seasonal.js        # PLACEHOLDER (Bloco 6)
    mascot.js          # PLACEHOLDER (Bloco 6)
    audit-logs.js      # PLACEHOLDER (Bloco 7)
```

Sem build step: arquivos IIFE clássicos que se registram em `window.AdminRegistry`,
carregados por `<script>` no `admin-firebase.html` (mantém o modelo estático atual).

### 2.2 Responsabilidade / dependências / API / risco / quando criar

| Arquivo | Responsabilidade | Depende de | API pública | Risco | Criar no Bloco 1? |
| --- | --- | --- | --- | --- | --- |
| `admin-context.js` | Refs Firebase, user/role, helpers, logger | firebase-auth.js, CONFIG, SMSecurity | `window.AdminContext` | Baixo | **Sim** (vazio→preenchido) |
| `admin-ui.js` | Modal único, toast, render de tabela, estados | AdminContext | `AdminUI.modal/toast/table/states` | Médio (unificar 2 modais) | **Sim** |
| `admin-registry.js` | Registrar módulos, montar sidebar | AdminContext | `AdminRegistry.register/list` | Baixo | **Sim** |
| `admin-router.js` | Trocar seção + lifecycle | Registry, UI | `AdminRouter.go(id)` | Médio (substitui showSection) | **Sim** (modo passthrough) |
| `admin-shell.js` | Auth gate + sessão | FirebaseSystem, Router | `AdminShell.boot()` | **Alto** (mexe no gate) | Parcial (só após paridade) |
| `modules/dashboard.js` | Cards de stats | FirebaseSystem.getAdminStats | contrato de módulo | Baixo | **Sim** (1º a migrar) |
| `modules/approvals.js` | Aprovações | FirebaseSystem | contrato | Médio | Etapa 3 |
| `modules/claims.js` | Claims | FirebaseSystem | contrato | Médio | Etapa 3 |
| `modules/managers.js` | Managers + modal | FirebaseSystem | contrato | **Alto** (modal/form) | Etapa 3 |
| `modules/users.js` | Usuários | FirebaseSystem | contrato | Médio | Etapa 3 |
| `modules/events.js` | Wrapper AdminContentCMS | AdminContentCMS | contrato | Baixo | Etapa 3 |
| `modules/news.js` | Wrapper AdminContentCMS | AdminContentCMS | contrato | Baixo | Etapa 3 |
| `modules/media.js` | Wrapper AdminContentCMS | AdminContentCMS | contrato | Baixo | Etapa 3 |
| `modules/banners.js` | — | — | placeholder | Nenhum | **Sim** (placeholder Etapa 4) |
| `modules/establishments.js` | — | — | placeholder | Nenhum | **Sim** (placeholder Etapa 4) |
| `modules/settings.js` | — | — | placeholder | Nenhum | Opcional |
| `modules/seasonal.js` | — | — | placeholder | Nenhum | Opcional |
| `modules/mascot.js` | — | — | placeholder | Nenhum | Opcional |
| `modules/audit-logs.js` | — | — | placeholder | Nenhum | Opcional |

> `admin-shell.js` é o de maior risco (toca o gate de auth/sessão). Recomendação: **não**
> reescrever o gate no Bloco 1; o shell novo apenas **monta o router** e delega o gate ao
> código inline existente até haver paridade comprovada.

---

## 3. Contrato de módulo

```js
// Cada módulo se registra assim (IIFE):
window.AdminRegistry.register({
  id: 'dashboard',              // string única; casa com #section-<id> e data-section
  label: 'Dashboard',          // rótulo da sidebar
  icon: '📊',                  // emoji/ícone
  requiredRole: 'admin',       // 'admin' | 'moderator' (cosmético no client; rules depois)
  master: false,               // true = visível só para admin master (Bloco 1: cosmético)
  navGroup: 'Operação',        // agrupador da sidebar ('Operação'|'Conteúdo'|'Sistema')
  order: 10,                   // ordenação dentro do grupo

  // ciclo de vida — todos opcionais exceto render:
  render(container, ctx) {},   // monta a UI da seção (idempotente)
  load(ctx) {},                // busca dados (pode ser async); chamado ao entrar na seção
  dispose() {},                // remove listeners/timers ao SAIR da seção
  actions: {                   // ações nomeadas (substituem onclick globais)
    approve(id, ctx) {}, reject(id, ctx) {}
  },
  emptyState: 'Nenhum item.',  // texto/template para lista vazia
  errorState: 'Erro ao carregar.' // texto/template para falha
});
```

### 3.1 Como o shell chama os módulos

1. No boot, todos os `modules/*.js` chamam `AdminRegistry.register(def)`.
2. `AdminRegistry` ordena por `navGroup`/`order`, filtra por `requiredRole`/`master`
   (cosmético) e monta a sidebar.
3. Clique na sidebar → `AdminRouter.go(id)`:
   - chama `dispose()` do módulo anterior (limpa listeners/timers);
   - alterna `.admin-section.active` (mesmo mecanismo do `showSection`);
   - chama `render(container, ctx)` (uma vez) e depois `load(ctx)`;
   - registra a seção atual em `AdminState.currentModuleId`.
4. `onclick` migram para **delegação**: `data-action="approve" data-id="..."`, capturada
   por um listener único no container; o router resolve `module.actions[action]`.

### 3.2 Estado global, loading/erro, listeners

- **Estado**: `AdminContext.state` (objeto simples) guarda caches por módulo
  (`state.events`, `state.media`, …) e `currentModuleId`. Sem framework.
- **Loading/erro**: `AdminUI.states.loading(container)`, `.empty(container, msg)`,
  `.error(container, msg, retryFn)` — padroniza os três estados que hoje são strings ad-hoc.
- **Evitar listeners duplicados**: módulos **não** ligam listeners no `document`/`window`;
  usam **delegação** num único listener por container, removido no `dispose()`. O monitor
  de sessão (global) permanece único no shell (não é responsabilidade de módulo).
- **Limpeza ao trocar de tela**: `AdminRouter` sempre chama `dispose()` do módulo que sai
  antes de entrar no novo.
- **Compatibilidade**: enquanto um módulo não foi migrado, o `AdminRouter` faz
  **passthrough** chamando a função inline correspondente (ex.: `loadUsers()`), e os
  `onclick` globais continuam válidos. Migração é incremental, módulo a módulo.

---

## 4. Contexto compartilhado (`AdminContext`)

```js
window.AdminContext = {
  // Firebase
  get db()      { return window.firebaseDB && window.firebaseDB.db || firebase.firestore(); },
  get storage() { return firebase.storage(); },
  get auth()    { return firebase.auth(); },
  fb: firebase,                         // FieldValue.serverTimestamp etc.

  // Sessão/usuário
  get currentUser() { return window.currentUser || null; },
  get currentRole() { return (window.currentUser && window.currentUser.role) || null; },
  isAdmin()     { return FirebaseSystem.isAdmin(); },
  isModerator() { return FirebaseSystem.isModerator(); },
  isMaster()    { return !!(window.currentUser && window.currentUser.master === true); }, // cosmético

  // Domínio (reuso, sem duplicar)
  api: window.FirebaseSystem,           // toda a camada de dados existente
  cms: window.AdminContentCMS,          // eventos/noticias/midia já prontos

  // UI / utilidades
  ui: window.AdminUI,                   // modal/toast/tabela/estados
  toast(msg, type) { return FirebaseSystem.showNotification(msg, type); },
  sec: window.SMSecurity,               // escape/sanitize já usado no projeto

  // Helpers
  logger: { info, warn, error },        // wrapper de console com prefixo [admin]
  date:   { format, fromFirestore },    // unifica formatDate/formatFirestoreDate inline
  upload: { image },                    // reusa uploadImageToCms (extrair p/ helper comum)

  // Config
  config:   window.CONFIG,
  siteMeta: window.SITE_META || null,   // se/quando existir

  state: { currentModuleId: null }      // estado leve compartilhado
};
```

Princípio: o contexto **não reimplementa** nada — ele **expõe** o que já existe
(`FirebaseSystem`, `AdminContentCMS`, `SMSecurity`, `CONFIG`) de forma uniforme, e
centraliza os helpers que hoje estão duplicados (datas, upload, modal, toast).

---

## 5. Plano de migração em etapas

### Etapa 1 — Documentar + introduzir camada (sem mudar comportamento)
- **Arquivos**: criar `admin-context.js`, `admin-ui.js`, `admin-registry.js`,
  `admin-router.js` (modo **passthrough**: delega às funções inline). Incluir `<script>`s
  no `admin-firebase.html` **após** `admin-content-cms.js`. **Não** remover nada do inline.
- **Risco**: Baixo (camada nova, inativa por padrão). **Validação**: painel idêntico;
  `showSection` continua funcionando; nenhum erro de console.
- **Rollback**: remover os `<script>` novos (nada do inline foi tocado).

### Etapa 2 — Migrar Dashboard
- **Arquivos**: `modules/dashboard.js`; `AdminRouter.go('home')` passa a usar o módulo;
  `loadDashboardData` inline vira shim (`window.loadDashboardData = () => AdminModules.dashboard.load()`).
- **Risco**: Baixo. **Validação**: cards de stats idênticos. **Rollback**: reverter o
  registro do módulo; shim volta a apontar para o inline.

### Etapa 3 — Migrar Mídia / Notícias / Eventos (e depois Aprovações/Vínculos/Usuários)
- **Arquivos**: `modules/media.js`, `news.js`, `events.js` (wrappers finos sobre
  `AdminContentCMS`), depois `approvals.js`, `claims.js`, `managers.js`, `users.js`.
- **Onclick**: converter por seção para `data-action`/delegação; manter shims globais até a
  conversão total. Unificar `#managerModal` e `#contentModal` via `AdminUI.modal`.
- **Risco**: Médio/Alto nos formulários de manager. **Validação**: cada CRUD/aprovação
  testado isolado. **Rollback**: reverter módulo a módulo (shims preservam o inline).

### Etapa 4 — Placeholders de Banners/Pop-ups e Empreendimentos
- **Arquivos**: `modules/banners.js`, `establishments.js` (e opcionalmente settings/
  seasonal/mascot/audit) — **só UI de "em breve"**, sem persistência.
- **Risco**: Nenhum (sem escrita). **Validação**: aparecem na sidebar, mostram estado
  vazio. **Rollback**: remover registro.

### Etapa 5 — Só então iniciar CRUDs novos (fora do Bloco 1)
- Depende da rodada de **rules**. Bloco 1 **não** implementa CRUD novo.

---

## 6. Admin comum vs Admin master

- **Modelo de dado sugerido** (sem implementar): campo booleano `master: true` no doc
  `usuarios/{uid}` **ou** custom claim `master`. Claim é mais seguro (não exige leitura de
  doc), mas exige Cloud Function/admin SDK para setar — decisão da fase de rules.
- **UI**: `AdminContext.isMaster()` controla visibilidade. Módulos `master:true` na
  sidebar só aparecem para master. Itens sensíveis dentro de módulos (ex.: trocar role de
  usuário, publicar configurações) ficam atrás do mesmo gate cosmético.
- **Master-only sugeridos**: `settings` (config do site), `audit-logs`, `seasonal`,
  `mascot`, e ações destrutivas de `users` (mudança de role). `banners`/`establishments`/
  conteúdo podem ser admin comum.
- **Risco de validar só no client**: esconder no client é **cosmético** — qualquer um com
  credencial de admin poderia chamar a API direto. **A separação master só é real quando
  as Firestore Rules a exigirem** (ex.: `allow write: if isMaster()`), em rodada futura.
- **A proteger em rules depois**: escrita em `site_config`, `audit_logs`, mudança de role
  em `usuarios`, e qualquer collection master-only.

---

## 7. Design/UX estrutural (especificação, sem implementar)

- **Sidebar agrupada** por `navGroup`: *Operação* (Dashboard, Aprovações, Vínculos,
  Gerenciar Vínculos, Usuários) · *Conteúdo* (Eventos, Notícias, Mídia, Banners,
  Empreendimentos, Rotas, Galeria) · *Sistema* (Configurações, Sazonal/Clima, Mascote,
  Logs) — itens futuros entram desabilitados/"em breve".
- **Dashboard com cards de pendências**: eventos pendentes, claims pendentes,
  update-requests pendentes, mídia sem uso, banners ativos hoje — cada card linka para a
  seção filtrada.
- **Módulos em cards**: home com atalhos visuais para cada módulo.
- **Busca global**: campo no topo que filtra por nome em eventos/notícias/mídia/usuários
  (client-side sobre os caches do `AdminContext.state`).
- **Estado vazio/erro padronizados** via `AdminUI.states`.
- **Breadcrumbs internos**: `Admin / <Grupo> / <Módulo>` no topo do conteúdo.
- **Alertas de conteúdo pendente**: badge numérico na sidebar (reaproveita as contagens do
  dashboard).
- **Logs de ação**: painel `audit-logs` (placeholder agora) listando ações recentes.

Tudo acima é **aditivo** — sem redesign do layout/visual atual.

---

## 8. Dependência de Firestore/Storage Rules

### Pode ser feito **sem** rules (Bloco 1 inteiro)
- `admin-context.js`, `admin-ui.js`, `admin-registry.js`, `admin-router.js`,
  `admin-shell.js` (camada estrutural).
- Migração de Dashboard, Eventos, Notícias, Mídia, Aprovações, Vínculos, Usuários — usam
  **collections já permitidas** hoje (`eventos_*`, `noticias`, `media_library`,
  `establishment_*`, `usuarios`, `estabelecimentos_*`).
- Placeholders de Banners/Empreendimentos/Settings/Seasonal/Mascot/Audit **sem
  persistência**.
- Gate cosmético de admin master (esconder/exibir na UI).
- Storage: nada novo (continua só `cms-media/{uid}/` de imagem ≤5 MB).

### Precisa de **rodada futura de rules** (fora do Bloco 1)
- Qualquer **escrita real** em collection nova: `empreendimentos`, `banners`, `rotas`,
  `galeria`, `site_config`, `audit_logs` (hoje caem no catch-all `allow … if false`).
- Enforcement real de **admin master** (`isMaster()` nas rules).
- Escrita de **vídeo**/novos `contentType` ou novos paths no Storage.
- Escrita de `audit_logs` pelo app no momento da ação.

> Regra do Bloco 1: **não criar CRUD que dependa de collection bloqueada**. Estrutura e
> placeholders sim; persistência nova, não.

---

## 9. Riscos

| # | Risco | Mitigação |
| --- | --- | --- |
| 1 | Quebrar `onclick` globais ao modularizar | Shims em `window` + migrar para `data-action` por seção |
| 2 | Reescrever o gate de auth/sessão e travar o login | Não tocar o gate no Bloco 1; shell novo só monta o router |
| 3 | Dois modais divergirem ao unificar | `AdminUI.modal` cobrir os dois casos antes de migrar managers |
| 4 | Listeners duplicados (atividade/seção) | Monitor único no shell; módulos usam delegação + `dispose()` |
| 5 | `loadApprovedEvents` duplicado | Escolher 1 fonte (CMS) e remover a inline ao migrar Eventos |
| 6 | `window.currentUser.role` assíncrono | Módulos checam role via `AdminContext` e tratam `_profilePending` |
| 7 | IDs do DOM como contrato implícito | Não renomear `#section-*`/`#dashboard`/`stat-*`/`*-container` |
| 8 | Service Worker servindo admin antigo | Versionar `?v=` dos novos `<script>` (padrão já usado) |
| 9 | Regressão silenciosa entre etapas | Checklist da seção 10 a cada etapa; rollback por arquivo |

---

## 10. Checklist de validação (para quando o Bloco 1 for implementado)

- [ ] Login admin (sucesso, senha errada, conta sem permissão, perfil pendente/erro).
- [ ] Dashboard: 4 cards de stats com valores corretos (e estado "Erro" tolerado).
- [ ] Navegação entre **todas** as seções via sidebar (sem erro de console).
- [ ] Eventos: listar/editar/publicar/destacar/duplicar/excluir/prévia/capa/galeria.
- [ ] Notícias: CRUD + publicar/despublicar + importar estáticas.
- [ ] Mídia: listar/filtrar/editar/copiar URL/usar em evento|notícia/excluir com proteção.
- [ ] Aprovações: aprovar/rejeitar evento e estabelecimento; ver evento (modal).
- [ ] Vínculos: aprovar/rejeitar claim; update-requests (aprovar/rejeitar/pedir ajustes).
- [ ] Gerenciar vínculos: criar/editar/desativar/reativar manager; selects populados.
- [ ] Usuários: trocar role, ativar/desativar, copiar e-mail, filtros de manager/claim.
- [ ] Logout manual + expiração por inatividade (monitor de sessão de 2h).
- [ ] Responsivo: mobile/tablet (sidebar colapsada, modais).
- [ ] Console limpo (sem erros/avisos novos).
- [ ] Cache/SW: `?v=` atualizado; sem servir versão antiga.
- [ ] **Site público sem regressão** (admin é página isolada, mas validar que scripts
      compartilhados — `security-utils`, `config`, `establishment-catalog` — não mudaram).

---

## 11. Implementação: Claude Code ou Codex?

**Recomendação: Claude Code** para o Bloco 1.

Motivo: é um **refator transversal e sensível** — escopo global das funções inline, gate de
auth/sessão, unificação de modais, conversão de `onclick`→delegação e shims de
compatibilidade. Erros aqui derrubam o painel inteiro. Exige raciocínio sobre acoplamento e
ordem de migração, não CRUD repetitivo.

Codex pode entrar **depois**, dentro do contrato já definido, para tarefas isoladas:
preencher um `modules/*.js` de placeholder, escrever um render de tabela padrão, ou montar
a UI de um card de dashboard — sempre com revisão do Claude.

---

## 12. Próximo prompt sugerido (implementação da Etapa 1)

> Implementar **somente a Etapa 1** do Bloco 1 (`docs/bloco-1-fundacao-admin-cms.md`):
> camada estrutural em modo passthrough, sem mudar comportamento visual.
>
> Restrições: não mexer em rules/auth/roles; não remover funções inline; não commitar sem
> revisão; manter `?v=` versionado; publicação via GitHub (estático).
>
> Entregáveis:
> 1. `js/admin/admin-context.js` — expõe `window.AdminContext` (db/storage/auth, currentUser/
>    role, `api=FirebaseSystem`, `cms=AdminContentCMS`, `sec=SMSecurity`, helpers de
>    data/upload/toast, `config=CONFIG`). Sem reimplementar lógica existente.
> 2. `js/admin/admin-ui.js` — `AdminUI.modal` (cobrindo os casos de `#managerModal` e
>    `#contentModal`), `AdminUI.toast`, `AdminUI.states.{loading,empty,error}`,
>    `AdminUI.table`. Sem trocar os modais atuais ainda.
> 3. `js/admin/admin-registry.js` — `register/list`, agrupamento por `navGroup`/`order`,
>    filtro cosmético por `requiredRole`/`master`.
> 4. `js/admin/admin-router.js` — `AdminRouter.go(id)` em **modo passthrough**: replica o
>    `showSection` atual (toggle de `.admin-section`/sidebar) e, para seções ainda não
>    migradas, chama a função inline existente. Ciclo `dispose()`→`render()`→`load()`.
> 5. Incluir os 4 `<script>` no `admin-firebase.html` **após** `admin-content-cms.js`, com
>    `?v=`, **sem** remover o shell inline.
> 6. Não registrar módulos reais ainda (só a infraestrutura) — Dashboard fica para a Etapa 2.
>
> Validar com o checklist da seção 10 (foco: paridade total e console limpo) antes de
> qualquer commit.
```

---

## 13. Etapa 1 — Implementação realizada (2026-06-25)

Camada modular base criada em **modo passthrough**, aditiva e inerte. Comportamento do
painel **inalterado**.

### Arquivos criados
- `js/admin/admin-context.js` → `window.AdminContext` (getters lazy/seguros para
  firebase/auth/db/storage, `api=FirebaseSystem`, `cms=AdminContentCMS`, `sec=SMSecurity`,
  `config=CONFIG`, `siteMeta=SITE_META`, `currentUser`/`currentRole`, `isAdmin/isModerator`,
  `isMaster` (cosmético), `serverTimestamp`, `toast`, `state`).
- `js/admin/admin-ui.js` → `window.AdminUI` (`escapeHtml`, `formatDate`,
  `states.{loading,empty,error}`, `showToast`). **Não** toca `#managerModal`/`#contentModal`.
- `js/admin/admin-registry.js` → `window.AdminRegistry` (`register/has/get/list/listSorted/
  count`, valida id e duplicidade). Nenhum módulo registrado nesta etapa.
- `js/admin/admin-router.js` → `window.AdminRouter` (`init/navigate/getCurrentSection/
  disposeCurrent/registerLegacyBridge`). `navigate()` **delega** ao `showSection` legado.
- `js/admin/admin-shell.js` → `window.AdminShell` (boot tardio em `firebaseReady`/
  `DOMContentLoaded`; só inicializa o router e loga em modo debug). Idempotente.

### Arquivo alterado
- `admin-firebase.html`: +6 linhas — 5 `<script src="js/admin/*.js?v=admin-modular-20260625">`
  inseridos **após** `admin-content-cms.js` e **antes** do `<script>` inline. Nada removido.

### Modo passthrough
Os scripts carregam antes do inline, mas o `AdminShell` só inicializa em
`firebaseReady`/`DOMContentLoaded`, quando o `showSection` legado já existe. Nenhum botão
chama `AdminRouter.navigate` ainda — a sidebar continua usando o `showSection` inline
inalterado. `window.showSection` **preservado**; nenhum `onclick` alterado.

### O que continua legado / não migrado
Todo o shell inline (auth gate, monitor de sessão, `showSection`, loaders), os modais
`#managerModal`/`#contentModal`, e todos os módulos (dashboard, aprovações, vínculos,
usuários, eventos, notícias, mídia). Nenhum CRUD novo, nenhuma collection nova.

### Rollback
Remover as 5 linhas `<script src="js/admin/...">` de `admin-firebase.html` e a pasta
`js/admin/`. Nenhum outro arquivo de produção foi tocado.

### Próxima etapa
Etapa 2 — migrar **Dashboard** para `modules/dashboard.js` com shim global de
`loadDashboardData`, sem mexer em rules.

---

## 14. Etapa 2 — Dashboard migrado (2026-06-25)

Migrado **somente** o Dashboard (seção `home`) para o sistema modular, preservando visual,
cards, ações rápidas e o admin legado. Nenhum CRUD/collection novo; rules intocadas.

### Seção real
- **id da seção:** `section-home` · **nome no `showSection`:** `home`.
- **Cards:** `#stat-usuarios`, `#stat-pendentes`, `#stat-aprovados`, `#stat-estabelecimentos`.
- **Loader legado:** `loadDashboardData()` (inline) via `FirebaseSystem.getAdminStats()`.

### Arquivo criado
- `js/admin/modules/dashboard.js` → `window.AdminDashboardModule` (contrato:
  `id:'home', label:'Dashboard', icon:'📊', requiredRole:'admin', navGroup:'Operação',
  order:10, render, load, dispose`). `render()` **reaproveita** o markup de `#section-home`
  (não recria visual) e atualiza a data via `updateDate` se existir; `load()` replica o
  comportamento legado com guardas extras (null/NaN → mantém `-`, erro de contagem → `Erro`).
  Auto-registra no `AdminRegistry` e registra a ponte legada no `AdminRouter`.

### Arquivos alterados
- `js/admin/admin-router.js`: `navigate()` agora, além do passthrough visual, **renderiza
  e carrega** o módulo registrado da seção (Etapa 2: só o Dashboard). Sem recursão — a ponte
  legada é o `showSection` **original**.
- `admin-firebase.html`: (a) +1 `<script>` para `modules/dashboard.js?v=admin-modular-20260625`;
  (b) `loadDashboardData()` inline passou a **delegar** ao `AdminDashboardModule.load()` com
  **fallback legado** completo se o módulo não existir ou falhar.

### Como o Dashboard usa o módulo
- **Integração viva:** no login, `showAdminDashboard()` → `loadDashboardData()` (inline) →
  delega a `AdminDashboardModule.load()`. Os cards passam a vir do módulo.
- **Router:** `AdminRouter.navigate('home')` renderiza+carrega o módulo (disponível para uso
  programático/futuro). Seções não-Dashboard continuam 100% legadas.

### `showSection` e shims
- `showSection` **preservado e NÃO envolvido** (sem wrapper). A sidebar e as quick-actions
  continuam chamando a `showSection` inline inalterada.
- `loadDashboardData` **preservado** com delegação + fallback legado (não removido).
- Quick actions (`onclick="showSection(...)"` + link `/portal-usuario`) **inalteradas**.

### O que continua legado / não migrado
Aprovações, Solicitações de vínculo, Gerenciar Vínculos, Usuários, Eventos, Notícias, Mídia
— todas no fluxo inline. Modais `#managerModal`/`#contentModal` inalterados.

### Rollback
1. Remover o `<script src="js/admin/modules/dashboard.js...">` de `admin-firebase.html`;
2. Reverter o `loadDashboardData()` inline para o corpo legado (sem o bloco de delegação);
3. Reverter o `navigate()` em `admin-router.js` para o passthrough da Etapa 1;
4. (Opcional) apagar `js/admin/modules/dashboard.js`.
Nenhum outro arquivo de produção foi tocado.

### Próxima etapa recomendada
Etapa 3 — migrar **Mídia/Notícias/Eventos** (wrappers finos sobre `AdminContentCMS`),
convertendo `onclick`→`data-action` por seção com shims, sem mexer em rules.

---

## 15. Etapa 3A — Placeholders de módulos futuros (2026-06-26)

Criados **placeholders visuais e estruturais** para os próximos módulos do Admin CMS —
**sem CRUD real**, **sem collection nova**, **sem escrita em Firestore/Storage** e **sem
tocar em Rules, auth, roles ou claims**. O admin legado e o Dashboard modular permanecem
inalterados.

### Arquivo criado
- `js/admin/modules/placeholder.js` → `window.AdminPlaceholderModule` (factory genérica de
  placeholders). API: `create(config)`, `register(config)`, `renderAll()`, `list()`,
  `isMasterCosmetic()`, `DEFAULT_NOTICE`.
  - `create(config)` devolve uma definição compatível com o contrato do `AdminRegistry`
    (`render/load/dispose`). Campos aceitos: `id, label, icon, description, requiredRole,
    master, navGroup, order, statusLabel, requiredNextStep, plannedFeatures[], warnings[],
    docHref`.
  - `render()` injeta **HTML estático** (título + badge "Em preparação" + descrição +
    "Recursos planejados" + bloco "Status de implementação" com o aviso padrão + botão
    **desabilitado**). É **idempotente**.
  - `load()` retorna `false` e **não toca Firebase**. `dispose()` é no-op.
  - O próprio arquivo registra os **8 placeholders** e, em `firebaseReady`/`DOMContentLoaded`,
    chama `renderAll()` para preencher os containers `#section-<id>`.

### Namespace criado
- `window.AdminPlaceholderModule` (factory + utilitários de placeholder).

### Placeholders registrados (id · navGroup · master cosmético)
| id | Módulo | Grupo | Master-only (cosmético) |
| --- | --- | --- | --- |
| `banners` | Banners / Pop-ups | Conteúdo | Não |
| `empreendimentos` | Empreendimentos | Conteúdo | Não |
| `rotas` | Rotas | Conteúdo | Não |
| `galeria` | Galeria | Conteúdo | Não |
| `configuracoes` | Configurações | Sistema | **Sim** |
| `sazonal` | Sazonal / Clima | Sistema | **Sim** |
| `mascote` | Mascote | Sistema | **Sim** |
| `audit-logs` | Logs / Auditoria | Sistema | **Sim** |

### Arquivos alterados (`admin-firebase.html`)
1. **Sidebar** (`.sidebar-menu`): +1 rótulo de grupo "Em preparação"
   (`<li class="sidebar-group-label">`) e +8 itens `data-section` (banners, empreendimentos,
   rotas, galeria, configuracoes, sazonal, mascote, audit-logs). Os 4 master recebem um selo
   visual `Master` (`<em class="sidebar-master-tag">`). Nenhum item existente foi removido ou
   alterado; "Ver Site" continua por último.
2. **Containers de seção**: +8 `<section class="admin-section" id="section-<id>">` **vazios**
   (preenchidos pelo módulo placeholder), inseridos após `#section-midia`.
3. **CSS**: +classes cosméticas (`.sidebar-group-label`, `.sidebar-master-tag`,
   `.admin-placeholder-notice`, `.admin-placeholder-list`, `.admin-placeholder-next`). Sem
   redesign do layout atual.
4. **Script**: +1 `<script src="js/admin/modules/placeholder.js?v=admin-modular-20260626">`
   após `modules/dashboard.js`.

### Itens que aparecem para admin comum vs. master-only
- **Admin comum:** Banners, Empreendimentos, Rotas, Galeria (grupo *Conteúdo*).
- **Master-only (cosmético):** Configurações, Sazonal/Clima, Mascote, Logs/Auditoria
  (grupo *Sistema*) — exibidos com selo **Master** na sidebar e aviso no conteúdo.

### Decisão sobre "master-only" (documentada)
Como **ainda não existe admin master real** (`AdminContext.isMaster()` é cosmético e hoje
retorna `false` para todos), **esconder** os itens master ocultaria-os de todos. Optou-se
por **exibir** os 4 itens master para o admin atual, com:
- selo **Master** na sidebar (puramente visual);
- aviso no placeholder: *"Master-only (cosmético): … a proteção real dependerá das Firestore
  Rules em rodada futura — esconder no client não é segurança."*

> **Importante:** esconder/exibir item no client é **apenas visual**, nunca segurança real.
> A separação master só passa a valer quando as **Firestore Rules** a exigirem.

### Como o CRUD real foi evitado
- O placeholder só renderiza **HTML estático**; o único "botão" é `disabled` (ou um link de
  documentação quando `docHref` for definido). Não há `<form>` funcional, nem handlers de
  salvar/editar/excluir.
- `load()` retorna `false` e nunca chama API/Firebase; `dispose()` é no-op.

### Como a escrita em Firestore/Storage foi evitada
- O módulo **não referencia** `firebase`, `firestore`, `storage`, `FirebaseSystem` nem
  `AdminContentCMS`. O smoke test inclui um *tripwire* que falha se `window.firebase` for
  acessado durante o carregamento/render do placeholder (passou). Nenhuma collection nova,
  nenhum upload novo.

### `showSection` preservado / Dashboard modular / seções legadas
- **`showSection` preservado** e **não envolvido** (sem wrapper). Os novos itens da sidebar
  usam a **mesma** delegação já existente (`firebaseReady` → bind de
  `.sidebar-menu a[data-section]` → `showSection`), sem novos listeners e sem duplicação. O
  conteúdo do placeholder é pré-renderizado nos containers, então o clique via `showSection`
  apenas alterna a seção visível — sem loop com `AdminRouter.navigate`.
- **`AdminRouter` inalterado:** `navigate('banners')`/`navigate('empreendimentos')` já
  funcionam (passthrough visual + render do módulo registrado); `navigate('home')` mantém o
  Dashboard; `navigate('usuarios')` continua **delegando ao legado**. Nenhum ajuste foi
  necessário no router (Tarefa 6 dispensada).
- **Dashboard continua modular** (Etapa 2) e **todas as seções legadas** (Aprovações,
  Vínculos, Gerenciar Vínculos, Usuários, Eventos, Notícias, Mídia) seguem 100% no fluxo
  inline.

### Validações executadas
- `node --check` em todos os arquivos exigidos (admin-context, admin-ui, admin-registry,
  admin-router, admin-shell, modules/dashboard, **modules/placeholder**, firebase-auth,
  admin-content-cms, config, sw) → **OK**.
- **Smoke test** (Node + shim de DOM, sem rede): namespace existe; registry aceita 8
  placeholders; master-only correto (4/4); render injeta "Em preparação" + aviso + botão
  `disabled` e **não** cria `<form>`; `load()` = `false`; **nenhum acesso a Firebase**;
  `navigate()` abre placeholders, mantém Dashboard e delega `usuarios` ao legado → **OK**.
- Audits: `audit-links` (646 links, **0 broken**), `audit-assets` (225 mídias, **0 missing**),
  `audit-project` (386 arquivos) → todos **exit 0**.

### Validação visual
- **Servidor local** (`python -m http.server`) + painel de preview. A página `admin-firebase.html`
  carregou; mesmo na tela de login (placeholders renderizam em `DOMContentLoaded`, sem auth):
  - `AdminPlaceholderModule` presente; `AdminRegistry.count()` = 9 (8 placeholders + Dashboard);
  - os 8 containers `#section-*` existem e foram renderizados;
  - sidebar lista os 16 `data-section`; 4 selos **Master** + rótulo de grupo presentes;
  - `showSection('banners')` ativa a seção e destaca o item; `navigate()` abre placeholders,
    Dashboard e delega `usuarios`;
  - **screenshot** do placeholder de Banners confirmou o layout (badges, recursos, aviso,
    botão desabilitado).
- **Browser/Playwright:** não foi necessário insistir — o preview estático cobriu a validação
  estrutural. **Teste final de ponta a ponta com login real** (Firebase + reCAPTCHA/AppCheck)
  deve ser feito manualmente no navegador real, pois o AppCheck não autoriza `localhost`.
- Console: os únicos erros são de **AppCheck/reCAPTCHA** (esperados em `localhost`, alheios a
  esta etapa). Nenhum erro novo originado por `placeholder.js`/registry/router.

### Riscos
- Baixo. Placeholders são inertes (sem persistência). O risco residual é **cosmético**
  (esconder master no client não é segurança — já documentado).
- Containers `#section-*` e ids são contrato implícito; não renomear sem ajustar a sidebar e o
  placeholder.

### Rollback
1. Remover o `<script src="js/admin/modules/placeholder.js...">` de `admin-firebase.html`.
2. Remover os 8 itens novos da sidebar (+ rótulo de grupo) e os 8 `<section id="section-*">`
   vazios; remover as classes CSS adicionadas.
3. (Opcional) apagar `js/admin/modules/placeholder.js`.
Nenhum arquivo de produção além de `admin-firebase.html` foi tocado; rules/auth intactas.

### Precisa publicar Firestore Rules? **Não.**
Nada foi alterado em `firestore.rules` e nenhum placeholder grava/lê collection nova.

### Precisa publicar Storage Rules? **Não.**
Nada foi alterado em `storage.rules`; nenhum upload novo.

### Precisa configurar algo no GitHub/publicação? **Não além do deploy estático habitual.**
Publicação continua via repositório (arquivos estáticos). Apenas garantir que os novos
`?v=` (`placeholder.js?v=admin-modular-20260626`) sejam servidos (cache/Service Worker).

### Módulos que exigem rules futuras (antes do CRUD real)
- `banners`, `empreendimentos`, `rotas`, `galeria`, `configuracoes`, `sazonal`, `mascote`,
  `audit-logs` — todas dependem de **definir/permitir a collection** correspondente (e, para
  galeria, novos `contentType`/paths de vídeo no Storage; para os master, enforcement real de
  `isMaster()`). Hoje caem no catch-all `allow … if false` — por isso **nenhum** grava dados.

### Próxima etapa recomendada
Etapa 3 (migração funcional de Mídia/Notícias/Eventos e depois Aprovações/Vínculos/Usuários)
**ou** iniciar a **rodada de Firestore/Storage Rules** que habilita o primeiro CRUD real de
um placeholder (sugestão: `banners`, por ser o mais isolado), seguida da Etapa 5 do plano.
