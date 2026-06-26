# Bloco 4 — Banners / Pop-ups (Especificação + Plano de Rules)

> **Rodada de ESPECIFICAÇÃO.** Nenhuma collection, rule, upload, CRUD ou commit
> foi criado/alterado nesta rodada. Este documento define o desenho técnico para
> as próximas microetapas (4B em diante). Worktree estava **limpo** no início.

---

## 1. Diagnóstico (estado atual)

### 1.1 Arquivos lidos/analisados

| Arquivo | Papel | Achados relevantes |
|---|---|---|
| `js/admin/modules/placeholder.js` | Placeholder genérico | Placeholder `banners` já registrado (id `banners`, navGroup `Conteúdo`, order 40, master `false`). Renderiza em `#section-banners`. |
| `js/admin/admin-registry.js` | Registro de módulos | Contrato: `{ id, label, icon, requiredRole, master, navGroup, order, render, load, dispose, actions, emptyState, errorState }`. `register()`, `get()`, `listSorted()`. |
| `js/admin/admin-context.js` | Contexto compartilhado | `AdminContext.db`, `.storage`, `.api` (FirebaseSystem), `.cms` (AdminContentCMS), `.isAdmin()`, `.isMaster()` (cosmético), `.serverTimestamp()`, `.toast()`. |
| `js/admin-content-cms.js` | CMS legado (eventos/notícias/mídia) | `media_library` CRUD + upload reutilizável. Helpers: `uploadImageToCms`, `validateImageFile`, `validateImageUrl`, `safeFileName`, `currentAdminId`, `IMAGE_TYPE_REGEX`, `MAX_IMAGE_BYTES`. |
| `firestore.rules` | Rules Firestore | Helpers `signedIn()`, `userDoc()`, `hasRole()`, `isAdmin()`, `isModerator()`. Padrão `keys().hasOnly([...])`. `media_library`: read público / write `isAdmin()`. Default deny final. |
| `storage.rules` | Rules Storage | `cms-media/{uid}/{fileName}`: read público, write `validCmsImageUpload(uid)` (isAdmin + uid próprio + ≤5MB + jpeg/jpg/png/webp), delete `isAdmin()`. |
| `config.js` | Config global | Existe **banner estático AgroSamas** (`CONFIG.agrosamas.bannerAtivo`) controlado por `localStorage('agrosamas-banner-closed')`. É o precedente estático que o módulo dinâmico vai generalizar. |
| `index.html` | Home pública | `<section class="agrosamas-banner agrosamas-hidden" id="agrosamas-banner">` + botão fechar. Home já faz **import modular** de `firebase-app`/`firebase-firestore` (v10.7.1) para enriquecer eventos — padrão reutilizável para banners públicos. |
| `_headers` | Cabeçalhos/CSP | CSP `connect-src` já permite Firestore + `firebasestorage.googleapis.com`; `img-src *`. **Nenhuma mudança de CSP necessária** para banners. |
| `sw.js` | Service Worker | `.html` e `.json` nunca cacheados; domínios Firebase em `NEVER_CACHE`. **Arquivos `.js` SÃO cacheados** (cache-first + atualização em background) → exige `?v=` nos novos scripts e bump de `CACHE_NAME` quando necessário. |
| `admin-firebase.html` | Shell do admin | Containers `#section-banners … #section-audit-logs` já existem. Ordem de scripts: firebase-auth → admin-content-cms → admin/* → modules/*. Página é `no-store`. |

### 1.2 O que pode ser **reutilizado**

- **Upload + Storage**: `uploadImageToCms()` e o path `cms-media/{uid}/...` já têm rules
  válidas (isAdmin, ≤5MB, jpeg/png/webp). Banner pode reaproveitar 100% na Fase 1.
- **Validações de imagem**: `validateImageFile`, `validateImageUrl`, `IMAGE_TYPE_REGEX`,
  `MAX_IMAGE_BYTES`, `safeFileName` — prontos.
- **Biblioteca de mídia**: `media_library` já é a fonte de imagens reutilizáveis.
- **Infra do admin**: `AdminRegistry` + `AdminContext` + `#section-banners`.
- **Padrão público**: import modular de Firestore na home (eventos) serve de molde.
- **Rules helpers**: `isAdmin()`, `signedIn()`, `keys().hasOnly()`.

### 1.3 O que precisa ser **novo**

- Collection `banners` (não existe).
- Bloco de Firestore Rules para `banners`.
- (Opcional) sub-path de Storage `cms-media/{uid}/banners/...` — ver Tarefa 3.
- Módulo admin `js/admin/modules/banners.js` (CRUD real).
- Script público `js/site-banners.js` (renderização + frequência + acessibilidade).

### 1.4 Riscos de reaproveitamento

- O CMS legado usa status em português (`aprovado`/`publicado`). O módulo novo usará
  `status` em inglês (`draft|published|archived`) — **não misturar** com a convenção legada.
- `media_library` não marca "em uso" por banners hoje (`buildMediaUsageMap` só varre
  eventos/notícias). Excluir mídia usada por banner passaria despercebido → tratar na Fase 2.
- SW cacheia `.js`: sem `?v=` o script público pode ficar preso em versão antiga.

---

## 2. Schema Firestore — collection `banners`

Documento `banners/{bannerId}`. `bannerId` = id legível, ex. `popup_2026_miss_parana`
(gerado pelo admin, padrão `slug` + sufixo único).

| Campo | Tipo | Obrigatório | Observações / Exemplo |
|---|---|---|---|
| `id` | string | sim | == `bannerId`. Ex.: `popup_caminhada_tropeiros_2026` |
| `title` | string | sim (rascunho) | Título interno/exibido. ≤ 120 chars. Ex.: `Caminhada dos Tropeiros` |
| `slug` | string | sim | kebab-case único. ≤ 80 chars. Ex.: `caminhada-tropeiros-2026` |
| `description` | string | não | Texto do banner/pop-up. ≤ 500 chars. |
| `type` | string (enum) | sim | `banner` \| `popup` |
| `status` | string (enum) | sim | `draft` \| `published` \| `archived` |
| `placement` | string (enum) | sim | `home` \| `mapa` \| `eventos` \| `noticias` \| `sabores` \| `all` \| `custom` |
| `targetPages` | array<string> | condicional | Obrigatório e não-vazio quando `placement == 'custom'`. Ex.: `['eventos.html','index.html']` |
| `imageUrl` | string | sim p/ publicar | URL pública (download URL ou caminho local permitido). |
| `imagePath` | string | não | Storage path da imagem (se upload). Ex.: `cms-media/<uid>/banners/<id>/<file>` |
| `imageAlt` | string | recomendado | Texto alternativo. ≤ 160 chars. |
| `mediaId` | string\|null | não | Vínculo com `media_library/{mediaId}` quando escolhido da biblioteca. |
| `ctaLabel` | string | não | Rótulo do botão. ≤ 40 chars. Ex.: `Saiba mais` |
| `ctaUrl` | string | condicional | Obrigatório se `ctaLabel` preenchido. http(s) ou caminho interno. |
| `ctaTarget` | string (enum) | não | `_self` \| `_blank` (default `_self`). |
| `startAt` | timestamp\|null | não | Início da janela. |
| `endAt` | timestamp\|null | não | Fim da janela. Deve ser `> startAt` quando ambos definidos. |
| `priority` | number (int) | sim | 0–100. Maior = exibido primeiro. Default 50. |
| `frequency` | string (enum) | sim | `always` \| `oncePerSession` \| `oncePerDay` \| `oncePerCampaign` |
| `dismissible` | boolean | sim | Default `true`. `false` reservado a avisos críticos. |
| `showDelayMs` | number (int) | não | Atraso antes de exibir pop-up. 0–60000. Default 0. |
| `maxWidth` | number (int)\|null | não | Largura máx. do pop-up em px. 240–960. |
| `createdAt` | timestamp | sim | `serverTimestamp()` na criação. |
| `updatedAt` | timestamp | sim | `serverTimestamp()` em cada escrita. |
| `createdBy` | string (uid) | sim | == `request.auth.uid` na criação. |
| `updatedBy` | string (uid) | sim | == `request.auth.uid` na atualização. |
| `publishedAt` | timestamp\|null | não | Setado ao publicar. |
| `archivedAt` | timestamp\|null | não | Setado ao arquivar. |

### 2.1 Campos mínimos para **criar rascunho** (`status='draft'`)

`id`, `title`, `slug`, `type`, `status='draft'`, `placement`, `priority`, `frequency`,
`dismissible`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`.
(imagem, datas e CTA podem ficar vazios no rascunho.)

### 2.2 Campos obrigatórios para **publicar** (`status='published'`)

Além dos do rascunho: `imageUrl` não-vazio, `imageAlt` recomendado, `publishedAt` setado,
e se `placement=='custom'` então `targetPages` não-vazio. Se `ctaLabel` preenchido, exige `ctaUrl`.

### 2.3 Validações

- **Datas**: `endAt > startAt` quando ambos definidos. Janela só filtra exibição (não bloqueia escrita).
- **URL** (`ctaUrl`, `imageUrl`): `^https?://` ou caminho interno permitido (regex no estilo de
  `isAllowedImageUrl`); rejeitar caracteres `'"()\<>`.
- **Imagem**: tipo em `jpeg|jpg|png|webp`, ≤ 5 MB (validado no upload, ver Tarefa 3).
- **Status**: somente `draft|published|archived`. **Type**: somente `banner|popup`.
- **Texto**: `title` ≤120, `slug` ≤80, `description` ≤500, `ctaLabel` ≤40, `imageAlt` ≤160.
- **Prioridade**: inteiro 0–100. **showDelayMs**: 0–60000. **maxWidth**: 240–960.

---

## 3. Storage paths

**Recomendado (Fase 1):** reutilizar o path/rules já existentes, com subpasta lógica:

```
cms-media/{uid}/banners/{bannerId}/{filename}
```

Motivo: as rules de `cms-media/{uid}/{fileName}` usam wildcard de **um segmento**
(`{fileName}`), então um path mais profundo **não casa** com a rule atual e cairia no
default-deny. Duas opções para o Bloco 4B:

- **Opção A (preferida):** generalizar a rule de `cms-media/{uid}` para `{allFiles=**}`
  (recursivo), mantendo `validCmsImageUpload`. Cobre banners sem nova árvore.
- **Opção B:** criar match dedicado `cms-media/{uid}/banners/{bannerId}/{file}`.

> Comparação `cms-media/{uid}/banners/...` **vs** `cms-banners/{uid}/...`:
> escolher **`cms-media/...`** — mantém uma única árvore de mídia do CMS, alinhada à
> `media_library` e à rule já testada. `cms-banners` criaria silo paralelo desnecessário.

| Definição | Valor |
|---|---|
| Path recomendado | `cms-media/{uid}/banners/{bannerId}/{filename}` |
| Content types | `image/jpeg`, `image/png`, `image/webp` |
| GIF (`image/gif`) | **Não** na Fase 1 (peso/animação não controlada). Reavaliar depois. |
| Vídeo | **Não** agora. Fica para etapa futura (exige novo contentType + CSP `media-src`). |
| Tamanho máx. | 5 MB (igual ao CMS atual). |
| Nomenclatura | `safeFileName()` (NFD, ascii, `-`), prefixo `Date.now()`. |
| Metadados | `contentType` no `put()`; opcional `customMetadata.bannerId`, `customMetadata.uploadedBy`. |
| Relação com `media_library` | Fase 1: upload direto grava só em `banners.imagePath/imageUrl`. Fase 2: opção "escolher da biblioteca" lê `media_library`. |

---

## 4. Plano de Firestore Rules (proposta — **não aplicar**)

Estratégia: **rules protegem status/owner/forma; o filtro de janela (`startAt/endAt`)
acontece no client.** A leitura pública é limitada a `status == 'published'`; a query
pública usa `where('status','==','published')` e o script filtra datas localmente
(janela em rules é frágil porque `request.time` em `list` não permite comparar com cada doc).

```
// Helper (reutiliza isAdmin() já existente)
function bannerType(d)   { return d.type in ['banner','popup']; }
function bannerStatus(d) { return d.status in ['draft','published','archived']; }
function bannerOwnerOnCreate(d) {
  return d.createdBy == request.auth.uid && d.updatedBy == request.auth.uid;
}
function bannerDatesOk(d) {
  return !(d.startAt != null && d.endAt != null) || d.endAt > d.startAt;
}
function bannerPublishReady(d) {
  return d.status != 'published' ||
    (d.imageUrl is string && d.imageUrl.size() > 0 &&
     d.title is string && d.title.size() > 0);
}

match /banners/{bannerId} {
  // Leitura pública: apenas publicados (janela filtrada no client).
  // Admin lê todos.
  allow read: if isAdmin() || resource.data.status == 'published';

  allow create: if isAdmin() &&
    request.resource.data.id == bannerId &&
    bannerType(request.resource.data) &&
    bannerStatus(request.resource.data) &&
    bannerOwnerOnCreate(request.resource.data) &&
    bannerDatesOk(request.resource.data) &&
    bannerPublishReady(request.resource.data) &&
    request.resource.data.keys().hasOnly([
      'id','title','slug','description','type','status','placement',
      'targetPages','imageUrl','imagePath','imageAlt','mediaId',
      'ctaLabel','ctaUrl','ctaTarget','startAt','endAt','priority',
      'frequency','dismissible','showDelayMs','maxWidth',
      'createdAt','updatedAt','createdBy','updatedBy',
      'publishedAt','archivedAt'
    ]);

  allow update: if isAdmin() &&
    request.resource.data.id == resource.data.id &&
    bannerType(request.resource.data) &&
    bannerStatus(request.resource.data) &&
    bannerDatesOk(request.resource.data) &&
    bannerPublishReady(request.resource.data) &&
    request.resource.data.updatedBy == request.auth.uid &&
    request.resource.data.createdBy == resource.data.createdBy &&  // imutável
    request.resource.data.keys().hasOnly([ /* mesma lista do create */ ]);

  // Exclusão definitiva: ver decisão master abaixo.
  allow delete: if isAdmin();
}
```

- **Leitura pública**: somente `status == 'published'`. Filtro de janela no client.
- **Leitura admin**: todos (`isAdmin()`).
- **Create/Update/Delete**: somente `isAdmin()`. Usuário comum cai no default-deny.
- **createdBy/updatedBy**: forçados a `request.auth.uid`; `createdBy` imutável no update.
- **`hasOnly([...])`**: bloqueia campos extras perigosos (padrão já usado no projeto).
- **Publish guard**: `bannerPublishReady` impede `published` sem `imageUrl`+`title`.

### 4.1 Decisão "admin master" para exclusão

O projeto **ainda não tem claim/role `master` enforced em rules** (`isMaster()` é cosmético).
**Recomendação:** Fase 1 usa **arquivamento** (`status='archived'`) como "remoção" padrão e
mantém `allow delete: if isAdmin()`. Exclusão definitiva master-only fica para quando o
enforcement de master existir (alinha com placeholders master de `configuracoes`/`audit-logs`).

### 4.2 Limitações / riscos / como testar

- **Limitação**: janela `startAt/endAt` não é aplicada em rules (filtro client). Banner
  publicado mas "fora da janela" é **legível** publicamente — aceitável (não vaza dado sensível).
- **Risco**: query pública sem índice composto pode exigir índice (`status` + `priority`).
  Validar no console se o Firestore pedir índice.
- **Testar**: emulador/`@firebase/rules-unit-testing` — casos: usuário anônimo lê published (ok)
  / lê draft (negado) / escreve (negado); admin cria draft (ok) / publica sem imagem (negado);
  campo extra (negado); `endAt < startAt` (negado).

---

## 5. Plano de Storage Rules (proposta — **não aplicar**)

```
// Reaproveita validCmsImageUpload(uid) já existente.
// Opção A (preferida): tornar a rule de cms-media recursiva.
match /cms-media/{uid}/{allFiles=**} {
  allow read:   if true;                       // imagens públicas
  allow write:  if validCmsImageUpload(uid);   // isAdmin + uid próprio + ≤5MB + jpeg/png/webp
  allow delete: if isAdmin();
}
```

| Definição | Decisão |
|---|---|
| Quem faz upload | `isAdmin()` e somente no **próprio uid** (`request.auth.uid == uid`). |
| Quem lê | Público (`read: if true`) — banners são públicos. |
| Tipos | `jpeg`/`jpg`/`png`/`webp` (regex atual). GIF/vídeo fora da Fase 1. |
| Tamanho | ≤ 5 MB. |
| Path por uid | Sim, isola arquivos por admin (`cms-media/{uid}/...`). |
| Overwrite | Evitar: nome com `Date.now()` previne colisão; overwrite continua só p/ admin. |
| Delete | `isAdmin()`. |
| Arquivo órfão | Banner arquivado mantém imagem; ao **excluir definitivamente**, o módulo deve
  apagar o Storage object (`imagePath`) antes/depois do doc. Sem cascade automático — tratar no client. |

> **Atenção:** se for adotada a Opção B (match dedicado) em vez de tornar `cms-media`
> recursiva, o match específico de banners deve vir **antes** do `cms-media/{uid}/{fileName}`
> atual para não conflitar. A Opção A é mais simples e já cobre `media_library`.

---

## 6. Arquitetura do módulo admin — `js/admin/modules/banners.js`

Segue o contrato do `AdminRegistry` (substitui o placeholder `banners`). IIFE, sem build.

### 6.1 Funcionalidades

Listar · filtrar (status/type/placement) · criar rascunho · editar · preview · publicar ·
arquivar · duplicar · excluir (se permitido) · upload **ou** escolher da biblioteca · validar antes de publicar.

### 6.2 UI / estados

- **Lista**: cards (consistente com `media-admin-grid`) com thumb, título, badges
  (status / type / "ativo agora?" pela janela) e indicador de prioridade.
- Botão **"Novo banner/pop-up"**.
- **Modal de edição** (reusa `AdminContentCMS.openModal`/`closeModal` ou modal próprio do shell).
- Estados: **vazio** ("Nenhum banner cadastrado") · **loading** · **erro** (com retry).
- **Preview** distinto para `banner` (faixa) e `popup` (modal sobre overlay).
- Indicação visual de período **ativo/inativo** (compara `startAt/endAt` com agora).

### 6.3 Ações (API do módulo)

`saveDraft` · `publish` · `unpublish`/`archive` · `duplicate` · `remove` · `preview`
· `uploadImage` · `pickFromMediaLibrary`.

- `publish` roda validação de "campos obrigatórios para publicar" (§2.2) **antes** de gravar.
- `uploadImage` reusa `uploadImageToCms` (adaptado para subpasta `banners/<id>`).
- `pickFromMediaLibrary` lê `media_library` (Fase 2) e grava `mediaId` + `imageUrl`.

---

## 7. Arquitetura do script público — `js/site-banners.js`

Arquivo recomendado: **`js/site-banners.js`** (nome explícito; evita conflito com a
`agrosamas-banner` estática). Carregado com `?v=` para driblar o SW.

### 7.1 Comportamento

1. **Não bloquear a página**: carregar `defer`, executar após `DOMContentLoaded`/idle.
2. **Firestore com timeout curto** (ex. 4s) e **fallback silencioso** (sem erro visível).
   Reusar o import modular de `firebase-app`/`firebase-firestore` (como a home faz nos eventos);
   **não** carregar `firebase-auth` no site público.
3. Query: `where('status','==','published')` → ordenar por `priority` desc.
4. **Filtrar no client**: página atual (`placement`/`targetPages`) **e** janela (`startAt/endAt`).
5. **Frequência**:
   - `always`: sempre.
   - `oncePerSession`: `sessionStorage['banner_<id>_seen']`.
   - `oncePerDay`: `localStorage['banner_<id>_day']` = data atual.
   - `oncePerCampaign`: `localStorage['banner_<id>_campaign']` (limpa só ao trocar `slug`/id).
6. **Um pop-up por vez**: pega o de maior prioridade elegível; banners (faixa) podem coexistir.
7. **Acessibilidade**: fechar com `Esc`; botão fechar com `aria-label`; `role="dialog"`
   `aria-modal="true"`; foco preso no modal e devolvido ao fechar; nunca prender o usuário
   (sempre há saída se `dismissible`).
8. **Reduced motion**: respeitar `prefers-reduced-motion` se houver animação de entrada.
9. **Sem CLS**: pop-up em overlay `position:fixed` (não empurra layout); banner com altura reservada.
10. **Não exibir no admin/portal**: abortar se a URL for `admin-firebase.html`/`portal-usuario.html`.
11. **Responsivo**: respeitar `maxWidth`; full-width em mobile.

### 7.2 Onde entra primeiro

Começar **apenas pela home** (`index.html`) para reduzir risco (Bloco 4F).
Depois expandir (Bloco 4G) para `eventos.html`, `mapa-turistico.html`, `sabores.html`, `noticias.html`.

---

## 8. Estratégia para biblioteca de mídia

| Decisão | Recomendação |
|---|---|
| Reutilizar `media_library` | Sim, como **fonte opcional** de imagens (Fase 2). |
| Upload próprio | Sim na **Fase 1**: upload direto no banner via `uploadImageToCms` (subpasta `banners/`). |
| Criar mídia tipo `banner` | Não obrigatório. Opcional: ao subir, registrar também em `media_library` com `category:'Banner'`. |
| Escolher imagem existente | Sim na **Fase 2** (`pickFromMediaLibrary`). |
| Vínculo banner↔mídia | Campo `mediaId` no banner. |
| Impedir exclusão de mídia em uso | Fase 2: estender `buildMediaUsageMap` para varrer `banners` também. |

**Recomendação final:**
- **Fase 1 (Bloco 4D):** upload direto no banner. Simples, já coberto pelas rules atuais.
- **Fase 2 (pós-4):** integração completa com `media_library` (escolher existente + proteção de uso).

---

## 9. Microetapas de execução

| Bloco | Objetivo | Arquivos prováveis | Mexe em rules? | Risco | Validações | Executor |
|---|---|---|---|---|---|---|
| **4B** | Aplicar Firestore Rules + Storage Rules de `banners` | `firestore.rules`, `storage.rules` | **Sim** | Médio (default-deny pode quebrar leitura) | Testes de rules (emulador) | Claude |
| **4C** | CRUD admin: lista + criar/editar rascunho | `js/admin/modules/banners.js`, `admin-firebase.html` | Não | Médio | `node --check`; criar/editar rascunho real | Claude |
| **4D** | Upload / seleção de imagem | `banners.js` (+ helpers do CMS) | Não (usa rules do 4B) | Médio | Upload ≤5MB jpeg/png/webp | Claude |
| **4E** | Preview + publicação/arquivamento | `banners.js` | Não | Baixo | Publish bloqueado sem imagem/título | Claude |
| **4F** | Script público na **home** | `js/site-banners.js`, `index.html`, `sw.js` (bump cache) | Não | Médio (perf/CLS) | Lighthouse; fallback offline; sem CLS | Claude |
| **4G** | Expandir para páginas específicas | `eventos.html`, `mapa-turistico.html`, `sabores.html`, `noticias.html` | Não | Baixo | Filtro por página correto | Codex/Claude |
| **4H** | Auditoria, cache, acessibilidade, docs | `sw.js`, `docs/*`, `banners.js`, `site-banners.js` | Não | Baixo | Axe/teclado; revisão de cache | Claude |

> **Ordem recomendada:** 4B → 4C → 4D → 4E → 4F → 4G → 4H. Rules **primeiro** (4B), pois
> CRUD e script público dependem delas.

---

## 10. Riscos consolidados

- **R1 — Rules + default-deny:** erro na rule de leitura pública esconde todos os banners.
  Mitigar com testes antes de publicar.
- **R2 — SW cacheando `.js`:** script público preso em versão antiga. Mitigar com `?v=` +
  bump de `CACHE_NAME` no 4F.
- **R3 — Índice Firestore:** `status==published` + `orderBy priority` pode exigir índice composto.
- **R4 — CLS/perf no público:** pop-up/banner deslocando layout. Mitigar com overlay fixo + altura reservada.
- **R5 — Mídia órfã:** excluir banner sem apagar imagem do Storage. Mitigar com delete em cascata no client.
- **R6 — Convenção de status divergente** do CMS legado (pt vs en). Documentar e não misturar.
- **R7 — Master não enforced:** exclusão "master-only" é cosmética hoje. Usar arquivamento.

---

## 11. Validações recomendadas (por bloco)

- **4B:** `firebase emulators` + `@firebase/rules-unit-testing` (anônimo, user, admin).
- **4C–4E:** `node --check js/admin/modules/banners.js`; teste manual no admin.
- **4F:** Lighthouse (CLS/LCP), teste offline (fallback silencioso), teclado/`Esc`/foco.
- **Geral:** `git status` / `git diff --stat` antes de cada commit.

---

## 12. Respostas diretas

- **Precisa publicar Firestore Rules agora?** **Não.** Só no Bloco 4B, antes do CRUD real.
- **Precisa publicar Storage Rules agora?** **Não.** Só no Bloco 4B (Opção A: tornar
  `cms-media/{uid}` recursiva).
- **Collection criada nesta rodada?** Não. Apenas especificada.

---

## 13. Próximo prompt recomendado

> **Bloco 4B — Aplicar Firestore Rules e Storage Rules para `banners`.**
> Objetivo: implementar em `firestore.rules` o match `/banners/{bannerId}` (read público só
> `published`; create/update/delete `isAdmin()`; `hasOnly` da lista de campos; guards de
> status/type/datas/owner/publish) e, em `storage.rules`, tornar `cms-media/{uid}` recursiva
> (`{allFiles=**}`) reusando `validCmsImageUpload`. Escrever testes de rules (emulador) cobrindo
> anônimo/user/admin. **Não** criar CRUD nem documentos ainda. Rodar testes antes de publicar.
> Começar por `git status` e seguir com worktree limpo.
