# Auditoria 1 — Painel Admin/CMS: inventário de arquitetura e bugs funcionais

- **Escopo:** somente leitura, worktree `.worktrees/auditoria-admin` (detached em `origin/main` `f0bf549`). Nenhum arquivo do repositório foi alterado, nenhum comando Git que muda estado foi executado e o Firebase de produção não foi acessado.
- **Método:** leitura integral de `admin-firebase.html` (script inline 1717–4026), `js/admin/*.js`, `js/admin/modules/*.js`, `js/admin-content-cms.js`, das partes administrativas de `js/firebase-auth.js`, de `functions/*.js`, de `firestore.rules` (matches) e dos consumidores públicos (`js/cms.js`, adapters, `eventos.html`, `mapa-turistico.js`, `home-eventos.js`, `reservas.js`).
- **Verificação mecânica:** um script Node no scratchpad compilou os handlers inline gerados por `admin-content-cms.js` e comprovou `SyntaxError` em 6 deles (FUNC-01).
- **Convenção:** **CONFIRMADO** significa que o comportamento decorre diretamente do código. **SUSPEITO** significa que depende dos dados reais ou de validação em runtime.

---

## 1. Arquitetura geral

### 1.1 Ordem de carga (admin-firebase.html:1674–4027)

1. `security-utils`, `publication-contracts`, `establishment-submission-bridge`, `data/restaurantes.js`, `data/hospedagens.js`, os adapters públicos, `establishment-catalog`, `config.js`.
2. Firebase compat 10.7.1: app, auth, firestore, storage, app-check, functions.
3. `firebase-auth.js` (FirebaseSystem), depois `admin-feedback`, `admin-content-preview`, `admin-content-cms` (AdminContentCMS), `prefeitura-news` e `prefeitura-news-importer`.
4. A "fundação modular": `admin-context`, `admin-ui`, `admin-registry`, `admin-router` e `admin-shell`.
5. Os módulos: `dashboard`, `banners`, `admin-geo-picker`, `image-attribution`, `empreendimentos`, `rotas-helpers`, `rotas`, `gallery`, `site-config` (sazonal + mascote), `audit-logs` e `placeholder`.
6. O **script inline legado** (login, sessão, `showSection`, moderação, usuários e vínculos).
7. `admin-nav.js`, que envolve `window.showSection` (breadcrumb, deep-link, gaveta mobile, badges e conversão de tabelas em cartões).

### 1.2 Dois sistemas convivem

- **Legado (inline):** login, sessão de 2 h, `showSection` (o roteador real) e as seções Aprovações, Pedidos de vínculo, Vínculos ativos e Usuários. Eventos, notícias e mídia ficam na camada `AdminContentCMS`.
- **Modular:** os módulos expõem `activate()` e são chamados **diretamente** por `showSection` (admin-firebase.html:2106–2126).
  - `AdminRouter.navigate()` **nunca é chamado** (grep: zero chamadores). O registry só registra.
  - Por isso `dispose()` nunca roda e as listas `requiredRole`/`navGroup` não têm efeito.
  - O menu lateral é HTML estático (1310–1336).

### 1.3 Gate de acesso

- `checkAdminAuth()` (2038–2084) exige `role==='admin' && ativo===true`. Os demais perfis são deslogados.
- A sessão expira por inatividade de 2 h (`localStorage sms-admin-last-activity`, 1726–1961).
- O perfil `usuarios/{uid}` é lido **uma única vez** no `onAuthStateChanged` (firebase-auth.js:1175–1201) e não é revalidado depois disso.

---

## 2. Inventário de módulos e telas

| # | Tela / hash | Como se chega | Coleções lidas | Coleções escritas | Storage | Status | Evidência |
|---|---|---|---|---|---|---|---|
| 1 | Painel `#home` | Menu, login | `eventos_pendentes` (API), `estabelecimentos_pendentes` (API), `establishment_claims`, `establishment_update_requests`, `cms_establishments`, `eventos_aprovados`, `noticias`, `media_library`, `usuarios` (todos sem limit) | — | — | Funcional | dashboard.js:369–401, 435–462 |
| 2 | Aprovações `#aprovacoes` | Menu, badge, atalhos do painel | `eventos_pendentes`, `estabelecimentos_pendentes` (`status==pendente`), `establishment_update_requests` (`pending`/`approved` filtrados em memória) | `eventos_pendentes` (status), `eventos_aprovados` (create via batch), `cms_establishments` e `cms_establishment_submission_locks` (draft via saga), `establishment_update_requests` (review/apply) | Cópia das mídias da submissão (`preparePublicSubmissionMedia`) e das imagens aceitas (`copyReviewedImageToCmsMedia`) | Funcional | admin-firebase.html:2159–2290, 2967–3265; firebase-auth.js:1448–1505, 1591–1770, 2068–2780 |
| 3 | Pedidos de vínculo `#vinculos` | Menu | `establishment_claims` (`status==pending`) | `establishment_claims`, `establishment_managers` | — | Funcional | 2384–2440, 3097–3133; firebase-auth 3102–3216 |
| 4 | Vínculos ativos `#gerenciar-vinculos` | Menu, "Ver vínculos" em Usuários | `establishment_managers` (tudo), `EstablishmentCatalog` | `establishment_managers` (create/update/batch "replace") | — | Funcional | 2508–2919; firebase-auth 2804–3100 |
| 5 | Usuários `#usuarios` | Menu | `usuarios` (tudo), managers, claims | `usuarios.role`, `usuarios.ativo` | — | Funcional; a opção `moderator` ainda é oferecida | 2292–2382, 3267–3309 |
| 6 | Empreendimentos `#empreendimentos` | Menu, atalhos do painel com filtro | `cms_establishments` (tudo; o duplicate-check relê tudo a cada save) | `cms_establishments` (saga por grupos com `revision`), `cms_establishment_submission_locks`, delete | `cms-media/{uid}/establishments/{id}/(main|gallery)/…` | Funcional e complexo (concorrência otimista) | empreendimentos.js:812–845, 1975–2119, 2510–2700 |
| 7 | Eventos `#eventos` | Menu | `eventos_aprovados` (tudo), `media_library` | `eventos_aprovados` (set merge, delete) | `cms-media/{uid}/{ts}-arquivo` | Funcional com bugs FUNC-01/02/04/05/07 | admin-content-cms.js:63–363 |
| 8 | Notícias `#noticias` | Menu | `noticias` (tudo); `fetch('noticias.html')`; callable `prefeituraFeed`; `data/noticias-prefeitura.json` | `noticias` (set merge, batch, delete) | — | Parcial (FUNC-02/08/09/23) | admin-content-cms.js:478–833; prefeitura-news-importer.js |
| 9 | Rotas `#rotas` | Menu | `rotas`, `cms_establishments`, `media_library` | `rotas` (transação), `cms_establishments.relationships.routeIds` | — (só referencia `media_library`) | Funcional; arquivamento irreversível | rotas.js:258–303 |
| 10 | Biblioteca de mídia `#midia` | Menu | `media_library` + `eventos_aprovados` + `noticias` + `rotas` + `cms_establishments` (uso) | `media_library` (set merge, delete) | `cms-media/{uid}/{ts}-arquivo` | Funcional (FUNC-06) | admin-content-cms.js:835–1052 |
| 11 | Galeria pública `#galeria` | Menu | `gallery_items` (onSnapshot ordenado por `displayOrder`) | `gallery_items` (somente update) | — (sem upload) | **Parcial:** não cria nem exclui; depende de migração (o gates report de 2026-09 registrou `gallery_items` com 0 documentos, `MIGRATION_REQUIRED`) | gallery.js:1–86; docs/admin-finalization/gates-resolution-plan.md |
| 12 | Banners e pop-ups `#banners` | Menu | `banners` (tudo) | `banners` (set completo; sem delete) | `cms-media/{uid}/banners/{id}/…` | Funcional (FUNC-02/14) | banners.js |
| 13 | Sazonal `#sazonal` | Menu | `site_config/seasonal` | idem | — | Funcional e simples | site-config.js:1–50 |
| 14 | Mascote `#mascote` | Menu | `site_config/mascot` | idem | — | Funcional e simples | site-config.js:51–86 |
| 15 | Registro de atividades `#audit-logs` | Menu | `audit_logs` (`orderBy timestamp desc`, `limit 25`, paginação) | — (somente leitura; escrito pela Cloud Function) | — | Parcial: não mostra o autor (FUNC-19) | audit-logs.js; functions/index.js:14–51 |
| — | **Reservas** | **Nenhuma tela** | — | — | — | **Inexistente.** A coleção `reservas` recebe pedidos públicos com PII e ninguém lê no painel (FUNC-03) | js/reservas.js:176; firestore.rules:1662–1665; `/reservas` está no sitemap.xml:94 |
| — | `placeholder.js` | — | — | — | — | Stub inerte | placeholder.js:1–16 |
| — | `estabelecimentos_aprovados` | — | Lido apenas no duplicate-check | — | — | Legado | firebase-auth.js:1628 |

**Modais compartilhados:** `#contentModal` serve eventos, notícias, mídia, rotas, banners e o importador da Prefeitura; `#managerModal` serve os vínculos. O AdminFeedback usa `<dialog>` em fila para confirm, prompt, form e toast.

---

## 3. Modelo de dados e sincronização admin → portal

| Coleção | Campos principais (como o admin escreve) | Publicação | Timestamps / autoria | Leitor público |
|---|---|---|---|---|
| `eventos_aprovados` | `id`, `title`/`nome`, `description`/`descricao`, `date`/`data` (YYYY-MM-DD), `time`/`hora`, `location`/`local`, `organizer`, `category`/`categoria`, `destaque`, `mainImage`/`image`/`coverImage`, `images[]`, `imageCount`. Portal e aprovação acrescentam `dataFim`, `horaFim`, `linked*` e `owner*` | `publicado` (bool) **e** `status` (`aprovado`/`rascunho`), sempre gravados juntos pelo admin | `createdAt`, `updatedAt` (server), `updatedBy`, `reviewedAt`, `reviewedBy` | `home-eventos.js:207` (adapter, `publication===true`); `eventos.html:795` (`publicado!==false && status ∈ {vazio, aprovado, approved}`); `mapa-turistico.js:1004/637` (**somente status**, ignora `publicado`). Regra: `read: if true` (firestore.rules:1469) |
| `eventos_pendentes` | O payload do portal mais `submittedBy`, `owner*`, `source`, `linked*` e `status: pendente` | `status`: `pendente` → `aprovado`/`rejeitado` | `createdAt`, `submittedAt`, `reviewedAt`, `reviewedBy`, `reviewNotes` | — |
| `noticias` | `titulo`, `slug`, `resumo`, `conteudo`, `categoria`, `imagem`, `galeria[]`, `videoUrl`, `linkOrigem`, `destaque`, `autor`, `data`, `publishedAt` (string ISO). Importadas: `origemTipo`, `origemId`, `origemHash`, `origemCategorias`, `origemClassificacao`, `origemImportadoEm` | `publicado` (bool) **e** `status` (`publicado`/`rascunho`). O portal e a regra usam **só** `publicado==true` | `createdAt`, `updatedAt`, `updatedBy` | `js/cms.js:46` com `where('publicado','==',true)` |
| `media_library` | `title`, `url`, `category`, `alt`, `storagePath`, `contentType`, `size` | — | `createdAt`, `updatedAt`, `updatedBy` | Nenhum (o portal usa as URLs copiadas) |
| `cms_establishments` | Grupos `core` (`slug`, `name`, `categoryId`/`Label`), `content`, `contact`, `location` (coordinates, `coordStatus`, `mapsUrl`), `media` (`mainImage`, `gallery[]` com status `active`/`removed`, `publicPaths`), `relationships`, `display`, `seo`, `review`, `source` e `lifecycle` (`status`, `publishing`); `editSession`, `schemaVersion=2`, `validatedGroups`, `revision` | `status`: `draft`/`published`/`archived` | `createdAt`/`By`, `updatedAt`/`By`, `publishing.publishedAt`/`By`/`archivedAt`/`By`/`archiveReason` | `cms-public-establishments-adapter.js:435` com `where status==published` (index, local, mapa, portal-usuario) |
| `rotas` | `id`, `slug`, `name`, `category`, `description`, `color`, `icon`, `displayOrder`, `tags`, `cover{mediaId,url,path,alt}` | `status`: `draft`/`published`/`archived` | `createdAt`/`By`, `updatedAt`/`By`, `publishedAt`/`By`, `archivedAt`/`By` | `cms-public-routes-adapter.js:214` com `status==published` |
| `banners` | `title`, `slug`, `description`, `type`, `placement`, `targetPages`, `imageUrl`/`imagePath`/`mediaId`, `ctaLabel`/`Url`/`Target`, `startAt`/`endAt` (Timestamp), `priority`, `frequency`, `dismissible`, `showDelayMs`, `maxWidth` | `status`: `draft`/`published`/`archived` (sem delete) | `createdAt`/`By`, `updatedAt`/`By`, `publishedAt`, `archivedAt`, `imageUpdatedAt`/`By` | `public-banners.js:574` com `status==published` |
| `gallery_items` | `url`, `alt`, `caption`, `category`, `displayOrder` | `published` (bool) | `updatedAt`, `updatedBy` | `public-gallery.js:121` com `published==true` |
| `site_config/{seasonal,mascot}` | `enabled`, `mode`, `seasonOverride`, `schemaVersion` | — | `updatedAt`, `updatedBy` | `season-theme.js:103`, `tourism-mascot.js:62` |
| `establishment_claims` / `establishment_managers` / `establishment_update_requests` | Vínculos e pedidos (`status`: `pending`/`approved`/`rejected`/`changes_requested`; managers usam `active` bool e id determinístico `userId+establishmentId`) | — | `reviewedAt`/`By`, `approvedAt`/`By`, `revokedAt`/`By`, `appliedAt`/`By` | Portal do Usuário |
| `usuarios` | `nome`, `email`, `telefone`, `tipo`, `organizacao`, `role`, `ativo`, `criadoEm`, `verificado` | — | `criadoEm` | — |
| `audit_logs` | `eventId`, `action`, `entityType`, `entityId`, `actorPrincipalId`, `actorAuthType`, `timestamp`, `summary`, `metadata` | — | Gravado pela função `writeAdminAuditLog` | — |
| `reservas` | `pessoas`, `nome`, `email`, `telefone`, `observacoes`, `valorTotal`, `status: pendente`, `criadaEm`/`criadoEm` | — | — | Escrito pelo portal; **sem leitor no admin** |

**Vocabulário de publicação heterogêneo** (fonte de bugs): `publicado`+`status` em português (eventos e notícias), `status` em inglês (empreendimentos, rotas e banners) e `published` bool (galeria). Cada tela reimplementa o próprio `isPublished` (admin-content-cms.js:1120, :500; dashboard.js:150, :175; eventos.html; mapa-turistico.js:637).

---

## 4. Bugs funcionais

### FUNC-01: handlers inline com escape quebrado (SyntaxError) no editor de eventos e na mídia (P1, CONFIRMADO)

- **Local:** `js/admin-content-cms.js:1334` (`oninput` da "URL manual"), `:1377` (`onchange` do select "Biblioteca de mídia"), `:91`, `:877`, `:1258`, `:1271` (`onerror` das imagens).
- **Descrição:** a fonte usa `\\\'` dentro de literais JS com aspas simples. Isso gera `\'` no atributo HTML, e `this.closest(\'.x\')` é um JS inválido. Compilei os 6 handlers com `new Function` e todos lançaram `SyntaxError: Invalid or unexpected token`. O padrão correto, usado na linha 1404, é `\'`.
- **Esperado:** ao escolher uma mídia, o preview é atualizado, o campo URL é sincronizado e o flag "remover capa" é zerado; imagem quebrada usa o fallback visual.
- **Observado:**
  - (a) O select da biblioteca não dispara `handleEventMediaSelection`: o preview fica velho e o campo URL mantém a URL anterior.
  - (b) Digitar uma URL não limpa a mídia selecionada nem `eventRemoveCover`.
  - (c) Os fallbacks de imagem nunca rodam e geram erro no console.
- **Consequência no save** (`saveEvent`, 156–186, 229–244):
  - Clicar "Remover capa" e depois escolher uma mídia leva a `removeCover==="true"`, e o evento é salvo **sem capa**.
  - Num evento com capa, escolher outra mídia faz `mainImage` virar a mídia nova, mas `newCoverEntry` é sobrescrito pela "Capa manual" antiga (182–186). Assim `images[0]` fica com a capa antiga e há divergência entre capa e galeria.
- **Reprodução:** Eventos → Editar (evento com capa) → trocar no select "Biblioteca de mídia" → o preview não muda → Salvar → conferir `images[0]` ≠ `mainImage`.
- **Impacto:** capa errada ou ausente no portal; erro silencioso.
- **Causa raiz:** escape triplo copiado entre contextos de string.
- **Correção:** trocar `\\\'` por `\'` nesses 6 pontos ou, melhor, abandonar handlers inline e usar `addEventListener` após `openModal`. No `saveEvent`, dar precedência explícita a mídia ou upload sobre `removeCover`.

### FUNC-02: `type="url"` bloqueia valores relativos que os validadores aceitam; formulários ficam impossíveis de salvar (P1, CONFIRMADO no código; P1 em produção se os dados existirem)

- **Local:**
  - Notícia `imagem`: admin-content-cms.js:1480; legado importado com `imagem: 'images/…'` em :1544 (a fonte `noticias.html` usa `url('images/…')`).
  - Evento `mainImage`: :1334; mídia `url`: :1502.
  - Banner `ctaUrl`: banners.js:811; banner `imageUrl`: banners.js:753.
- **Descrição:** `isAllowedImageUrl`/`isAllowedUrl` aceitam `/…`, `images/…` e `pagina.html` (admin-content-cms.js:1155; banners.js:210–211). Já o `<input type="url">` exige URL absoluta, e a validação nativa do form bloqueia o submit antes do handler.
- **Observado:**
  - Abrir e salvar uma notícia importada por "Importar notícias estáticas" falha com tooltip "Insira um URL".
  - No fluxo de publicação (aba Prévia, depois "Confirmar e publicar", que chama `requestSubmit()`), o campo inválido está **oculto**: o navegador não consegue focá-lo e o clique **não faz nada**.
  - Banners com CTA interno (`eventos.html`, `/mapa-turistico`) não podem ser criados nem editados.
- **Reprodução:** Notícias → Importar notícias estáticas → Editar uma notícia "Legado" → Salvar.
- **Impacto:** edição de conteúdo legado e de banners com link interno bloqueada.
- **Correção:** usar `type="text"` com `inputmode="url"` e manter a validação JS existente, ou `novalidate` no form com validação própria.

### FUNC-03: pedidos de reserva públicos sem tela no admin (P1, CONFIRMADO como gap funcional)

- **Local:** js/reservas.js:176 (`addDoc(collection(db,'reservas'))`), firestore.rules:1662–1665 (leitura só admin); nenhuma referência a `reservas` em `admin-firebase.html` ou `js/admin/**`. A página `/reservas` está no sitemap.xml:94.
- **Descrição:** o portal grava pedidos com nome, e-mail, telefone e valor, mas o painel não lista, não notifica e não muda status.
- **Impacto:** pedidos de cidadãos ficam sem atendimento, e PII é retida indefinidamente sem gestão. Também é risco LGPD.
- **Correção:** criar o módulo "Reservas" (lista, status e retenção) ou retirar o fluxo público. Requer decisão de produto.

### FUNC-04: o formulário de evento fica travado em "Salvando…" (P2, CONFIRMADO)

- **Local:** admin-content-cms.js:144 (`setBusy(form,true)`) e :168 (`if (!this.storage) return notify(...)` sem `setBusy(false)`).
- **Reprodução:** com Storage indisponível (SDK não carregou), salvar um evento com upload. Os botões ficam desabilitados até fechar o modal.
- **Correção:** chamar `setBusy(form,false)` antes do `return`.

### FUNC-05: upload antes da validação gera arquivos órfãos (P2, CONFIRMADO)

- **Local:** `saveEvent` faz o upload em 167–179 e só valida título e data em 217–221 (a validação 140 só ocorre no ramo de publicação). Uma falha do `set` (249–255) também deixa o arquivo enviado. Em `saveMedia` (924–931) o mesmo vale: falha no Firestore deixa o arquivo, e repetir sobe outro.
- **Impacto:** lixo em `cms-media/` e custo de Storage.
- **Correção:** validar antes do upload e registrar ou limpar uploads órfãos.

### FUNC-06: biblioteca de mídia sem proteção contra duplo envio (P2, CONFIRMADO)

- **Local:** `saveMedia` (909–960) não desabilita o botão; o id é `"media_"+Date.now()`.
- **Observado:** um duplo clique ou Enter repetido cria 2 documentos e 2 uploads.
- **Correção:** aplicar `setBusy` (já existe) e um id gerado antes do upload.

### FUNC-07: ações de publicar e destacar baseadas em cache recriam documentos excluídos (P2, CONFIRMADO)

- **Local:** `toggleEventPublish` (311–316), `toggleEventFeatured` (329–333) e `toggleNewsPublish` (663–669) usam `set({...}, {merge:true})` a partir de `this.events`/`this.news` em memória.
- **Observado:** se outro admin ou aba excluiu o evento, `set merge` **recria** um documento-fantasma só com `publicado`, `status` e `updatedAt`, que aparece na listagem "Sem título". O destaque é invertido com base no valor em cache, num modelo last-write-wins.
- **Correção:** usar `update()` (falha se não existir) ou uma transação com precondição em `updatedAt`.

### FUNC-08: notícia "Publicado" no admin que não está no portal; o editor despublica silenciosamente (P2, CONFIRMADO)

- **Local:** a listagem considera `publicado===true || status==='publicado'` (admin-content-cms.js:500), o dashboard faz o mesmo (dashboard.js:175), mas o editor seleciona com `item.publicado===true` (1483). O portal e a regra usam apenas `publicado==true` (js/cms.js:46).
- **Observado:** um documento com `status:'publicado'` e `publicado` ausente ou false aparece como "Publicado" e com o botão "Despublicar", embora esteja **fora** do portal. Abrir e salvar sem mudar nada grava `rascunho`.
- **Correção:** unificar num único `isNewsPublished(item){ return item.publicado===true; }`.

### FUNC-09: o importador da Prefeitura atualiza notícia já publicada direto no ar e anuncia "como rascunho" (P2, CONFIRMADO)

- **Local:** `prefeitura-news.js:540–544` (`buildUpdatePatch` preserva `publicado`) e `prefeitura-news-importer.js:333` (set merge), :351 (toast "…atualizada(s) como rascunho").
- **Observado:** no estado `atualizada`/`conflito`, a matéria publicada é sobrescrita com o conteúdo novo da origem, sem prévia nem revisão. O usuário é informado de que virou rascunho.
- **Correção:** ao atualizar uma notícia publicada, despublicar (ou manter o conteúdo publicado e gravar o rascunho em campos separados) e corrigir a mensagem.

### FUNC-10: perda de alterações não salvas na navegação, na expiração de sessão e no Preview de rotas (P2, CONFIRMADO)

1. **Empreendimentos:** o editor fica dentro da seção. `showSection('empreendimentos')` chama `activate()` e depois `render()`, que faz `innerHTML = buildShell()` (empreendimentos.js:744–750, 3012–3015). Clicar no menu ou num atalho do painel (`presetFilters`, 2976–2985) **apaga o editor aberto** sem aviso.
2. **Rotas:** o botão "Preview" dentro do formulário substitui o modal pelo preview (rotas.js:304); "Fechar" descarta todas as edições. Erro de validação ou slug duplicado reabre o form a partir do item salvo (287–288, `openForm(state.selectedId, errors)` com `getRoute`) e **apaga o que foi digitado**; em criação, devolve o form vazio.
3. **Sessão:** `forceAdminLogout` e `showAdminLogin` (1963–2004) não fecham `#contentModal`, `#managerModal` nem os `<dialog>` do AdminFeedback. O editor continua visível sobre a tela de login e as listas (com e-mails de usuários) permanecem no DOM.
4. Não existe dirty-check nem `beforeunload` em nenhum editor.

- **Correção:** guardar estado de "dirty" e pedir confirmação; renderizar o editor fora do container que é re-renderizado; fazer o Preview de rotas como aba (como em eventos e notícias); fechar modais e limpar seções no logout.

### FUNC-11: galeria apaga edições alheias a cada snapshot e mantém listener eterno (P2, CONFIRMADO)

- **Local:** gallery.js:19–40 e 72. `onSnapshot` re-renderiza todos os `<form>`. Salvar o item A dispara um snapshot e descarta edições não salvas do item B. Como `dispose()` nunca é chamado (o router não é usado), o listener continua ativo fora da seção e após o logout (e passa a renderizar o erro de permissão).
- **Correção:** renderizar de forma incremental ou com `get()` sob demanda; chamar `dispose` na troca de seção e no logout.

### FUNC-12: lost update na galeria de empreendimentos (P2, CONFIRMADO)

- **Local:** `editGalleryImage`, `move`, `remove` e `restoreGalleryImage` (2816–2950) montam o array `media.gallery` **inteiro** a partir de `state.items` (cache da listagem). `writeMediaUpdate` chama `applyCanonicalFields` **sem `expectedRevision`** (2799), e a checagem de revisão compara com a leitura fresca (2742).
- **Observado:** se, depois de carregar a lista, outra pessoa aplicou imagens (`applyAcceptedEstablishmentUpdateMedia`) ou editou a galeria, a ação local regrava o array antigo e as imagens novas somem.
- **Correção:** passar `expectedRevision: item.revision` ou recalcular a galeria a partir do snapshot dentro do fluxo.

### FUNC-13: editar empreendimento publicado retira-o do portal durante a saga, e uma falha parcial o mantém fora (P2, risco de design CONFIRMADO)

- **Local:** submitForm 2060–2066 e applyCanonicalFields 2763–2767. A sequência é lifecycle→draft com `editSession`, depois grupos, depois republicação. Uma falha intermediária deixa o registro como rascunho ("Concluir e republicar", 935) e ele **some do mapa** até alguém concluir. Inclui ações simples como reordenar uma foto.
- **Relação:** é o mesmo mecanismo do incidente "Artur Biergarten" (ADMIN-END-TO-END-PUBLICATION-CLOSURE.md §3).
- **Correção:** avaliar escrita atômica numa única transação para mudanças que não alteram a identidade, ou manter a versão publicada até concluir; alertar no painel sobre `editSession` pendente.

### FUNC-14: banners usam `set()` completo a partir do cache (last-write-wins) (P2, CONFIRMADO)

- **Local:** banners.js:1044 (save), 1123 (archive), 1250 (publish), 1279 (unpublish) e `buildTransitionPayload` (1172) a partir de `findItem` (cache).
- **Observado:** a edição de outro admin entre o load e a ação é sobrescrita; não há precondição de `updatedAt`. Campos futuros não listados em `buildTransitionPayload` seriam apagados.
- **Correção:** usar transação com comparação de `updatedAt`, ou `update` parcial nas transições.

### FUNC-15: catch silencioso converte erro em "lista vazia" e, num caso, permite sobrescrever um vínculo (P2/P3, CONFIRMADO)

- **Local** (firebase-auth.js): `getUsers` 1316, `getPendingEstablishmentClaims` 2798, `listAllEstablishmentManagers` 2820, `listAllEstablishmentUpdateRequests` 2080 e `checkExistingManager` 2847 (retorna `null` em erro).
- **Observado:** falha de rede ou de permissão aparece como "Nenhum usuário encontrado" ou "Nenhuma solicitação pendente". No pior caso, `createEstablishmentManager` (2872) trata erro de leitura como "não existe" e faz `set()` no id determinístico (2886–2888), **sobrescrevendo** um vínculo existente (perde `approvedAt`, `claimId` e `notes`). `loadUsers` (2292) não tem try/catch.
- **Correção:** retornar `{success:false,error}` e renderizar o estado de erro; em create, usar `create()` ou transação.

### FUNC-16: duplo clique em ações de moderação e duplicação (P3, CONFIRMADO)

- **Local:** os botões delegados de aprovar e rejeitar (admin-firebase.html:2222–2224, 2278, 2430, 3870–3902) não são desabilitados durante a ação. O AdminFeedback **enfileira** diálogos (admin-feedback.js `enqueue`), então um duplo clique abre duas confirmações.
- **Agravantes:**
  - `approveEvent` faz check-then-batch fora de transação (firebase-auth.js:1460–1479). Confirmações rápidas podem copiar mídia duas vezes.
  - `banners.duplicate` (1287) não tem confirmação nem trava: um duplo clique cria 2 cópias.
- **Correção:** desabilitar o botão no clique, usar transação em `approveEvent` e deduplicar diálogos por ação.

### FUNC-17: "Nova rota" depois de editar abre com o ID técnico readonly e vazio (P3, CONFIRMADO)

- **Local:** rotas.js:271–276 e 284. `closeModal` não zera `state.selectedId`, então `buildForm({})` calcula `isEdit = !!state.selectedId` = true, o input ID fica `readonly` e vazio, e a validação falha. Funciona na segunda tentativa.
- **Correção:** zerar `selectedId`, `selectedEstablishmentIds` e `pendingForm` em `openForm()` sem id e em `closeForm`.

### FUNC-18: badges e fila de Aprovações inconsistentes; a fila nunca esvazia (P3, CONFIRMADO)

- `dashboard.js:105–108/393` conta `changes_requested` como pendente, mas a fila carrega só `['pending','approved']` (admin-firebase.html:2446), e `changes_requested` aguarda o empreendedor, não o admin.
- Solicitações `approved` já aplicadas continuam na fila para sempre (3881–3893).
- **Correção:** alinhar o critério e esconder ou arquivar as já aplicadas.

### FUNC-19: o log de auditoria não mostra quem fez a ação (P3, CONFIRMADO)

- **Local:** `HUMAN_FIRESTORE_AUTH_TYPES = new Set()` (functions/audit-core.js:138), então `actorRoleSnapshot` nunca é gravado e a coluna "Papel" sai sempre "—". `audit-logs.js:187` não exibe `actorPrincipalId`.
- `deriveAction` classifica a publicação de evento (`rascunho`→`aprovado`) como `approve_event_or_establishment` (linha 81 vem antes da regra de publish).
- A função é disparada em **todo** write de qualquer coleção (`{collectionId}/{documentId}`, index.js:15) e filtra depois, o que aumenta o custo.
- **Correção:** exibir o ator (resolvendo o nome via `usuarios`), preencher o set de authTypes humanos e restringir os triggers às coleções auditadas.

### FUNC-20: sazonal e mascote com rejeição não tratada (P3, CONFIRMADO)

- `site-config.js:132` e `:156` fazem `await ref.get()` **fora** do try: uma falha de rede vira unhandled rejection sem toast.
- Não há estado busy.
- O `get` antes do `update`/`set` é desnecessário (bastaria `set merge`).

### FUNC-21: perfil não é revalidado durante a sessão (P3, SUSPEITO / já reconhecido no B2A5)

- `onAuthStateChanged` lê `usuarios/{uid}` uma vez (firebase-auth.js:1182–1201). Um admin rebaixado ou desativado continua com a UI ativa até recarregar. As Rules negam as escritas, mas as mensagens são genéricas.
- O UI de Usuários ainda oferece `moderator` (admin-firebase.html:2341), contrariando a decisão B2A5.

### FUNC-22: leituras sem limite e repetidas (P3, CONFIRMADO)

- Todas as listas usam `collection(...).get()` sem `limit` nem paginação: eventos, notícias, mídia, usuários, cms_establishments, managers, update_requests e rotas.
- O Painel lê **9 coleções inteiras** a cada visita a `#home` (dashboard.js:372–382; admin-nav.js:112–115), incluindo `usuarios` inteiro só para um contador **oculto** (1423–1428, dashboard.js:404).
- `loadMedia` lê 5 coleções; cada save de empreendimento relê `cms_establishments` inteiro (`assertNoManualSemanticDuplicate`); `approveEstablishment` lê 3 coleções inteiras.
- Na escala atual (cerca de 67 empreendimentos e 11 usuários) não há truncamento nem erro, mas o custo e a latência crescem linearmente.

### FUNC-23: notícias — slug sem unicidade, autor sobrescrito, data implícita (P3, CONFIRMADO)

- `saveNews` (607–632) não verifica slug duplicado (colisão em `noticia.html?slug=`).
- Editar o slug muda a URL pública sem redirecionamento.
- Força `autor: "Departamento de Turismo"`, inclusive em matérias importadas da Prefeitura, cujo autor original se perde.
- Com `publishedAt` vazio, grava `new Date()`.

### FUNC-24: descrição de rota perde parágrafos (P3, CONFIRMADO)

`rotas-helpers.js:30`: `description: clean(raw.description)`, e `clean` colapsa espaços e quebras de linha.

### FUNC-25: editor de eventos incompleto (P3, CONFIRMADO; perda de dado SUSPEITA)

- `buildEventForm` (1306–1365) não expõe `dataFim`, `horaFim`, link, preço e outros campos do portal. Eventos de vários dias criados no admin não têm fim, e o painel calcula "encerrados" por `dataFim`.
- `<input type="time">` com valor não `HH:MM` aparece vazio e o save grava `time=""`, apagando o horário. A perda depende dos dados reais.

### FUNC-26: banner "personalizado" publicável sem páginas válidas (P3, CONFIRMADO)

`readForm` descarta em silêncio as páginas fora da allowlist (banners.js:872–876); `getPublishBlockers` aceita `placement:'custom'` com `targetPages:[]` (1149–1151). O banner é publicado e não aparece em lugar nenhum.

### FUNC-27: textos contraditórios na aplicação de solicitações (P3, CONFIRMADO)

O resumo diz que as imagens "não serão … aplicadas automaticamente" (admin-firebase.html:3802–3804), mas no mesmo card há o botão "Aplicar mídia ao catálogo" (3809–3857).

### FUNC-28: rascunhos de eventos legíveis publicamente; o mapa ignora `publicado` (P3, SUSPEITO)

`eventos_aprovados` tem `allow read: if true` (firestore.rules:1470). Eventos despublicados (`rascunho`) continuam acessíveis por query direta, e o mapa filtra só por `status` (mapa-turistico.js:1015/637). O admin grava os dois campos em par, mas um documento com `publicado:false` e `status:'aprovado'` (dado legado ou manual) apareceria no mapa e não em `eventos.html`.

---

## 5. Código morto, legado e features abandonadas

| Item | Local | Situação |
|---|---|---|
| `AdminRouter.navigate`, `disposeCurrent` | js/admin/admin-router.js | Sem chamadores; só `registerLegacyBridge` é usado (dashboard.js:480). Os `dispose()` dos módulos nunca rodam |
| `AdminRegistry.listSorted`, `requiredRole`, `navGroup`, `order` | admin-registry.js | O registro é populado mas nunca consultado; o menu é estático |
| `AdminShell.boot` | admin-shell.js | Só inicializa o router (inerte) |
| `placeholder.js` | js/admin/modules/placeholder.js | Stub de compatibilidade sem efeito |
| Fallback legado `loadApprovedEvents` (tabela simples) | admin-firebase.html:2925–2963 | Inalcançável (AdminContentCMS sempre presente) |
| `window.loadApprovedEvents` em admin-content-cms | admin-content-cms.js:1815 | Sobrescrito pela declaração inline posterior |
| Fallback `getAdminStats` mais `.stats-grid` oculto | admin-firebase.html:2150–2156, 1422–1428; firebase-auth.js:3222 | Só alimenta contadores ocultos; força a leitura de `usuarios` inteiro no dashboard |
| Dois sistemas de toast | `AdminFeedback.toast` (legado e CMS) vs `FirebaseSystem.showNotification` (via AdminUI/AdminContext: banners, rotas, galeria, site-config, audit) | Visual e posição inconsistentes |
| Comentário de cabeçalho desatualizado | banners.js:19–21 ("NÃO faz exibição pública…") | O módulo já publica e o site já exibe |
| Role `moderator` atribuível | admin-firebase.html:2341 | Contraria a decisão B2A5 (moderator não é função ativa) |
| `estabelecimentos_aprovados` | firebase-auth.js:1628 | Coleção legada, só para detecção de duplicidade |
| Galeria pública admin | gallery.js | Edita somente; sem create/delete/upload; depende de migração de `gallery_items` |
| `cms-public-debug.html` na raiz | raiz | Página de depuração publicada junto do site (verificar se deveria existir em produção) |

---

## 6. Prioridades sugeridas

1. **P1:** FUNC-01 (escapes, correção trivial), FUNC-02 (`type=url`) e FUNC-03 (decidir o destino de `reservas`).
2. **P2:** perda de dados e consistência: FUNC-07, FUNC-08, FUNC-09, FUNC-10, FUNC-11, FUNC-12, FUNC-14 e o FUNC-04/05/06 de UX de salvamento; avaliar FUNC-13.
3. **P3:** FUNC-15 (estados de erro reais), FUNC-16 (travas de duplo clique), FUNC-17 a FUNC-28 e limpeza do código morto, unificando o vocabulário de publicação.

Validação runtime recomendada (Emulator): reproduzir FUNC-01, FUNC-02 (notícia legada e banner com CTA interno), FUNC-07 (ghost doc), FUNC-10 (navegação com o editor aberto) e FUNC-12 (duas abas).
