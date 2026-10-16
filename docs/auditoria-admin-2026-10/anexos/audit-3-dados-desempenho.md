# Auditoria 3 — Modelo de dados, uso do banco, desempenho e estabilidade do Admin/CMS

- **Base:** worktree `.worktrees/auditoria-admin`, `origin/main` `f0bf549` (2026-10-15).
- **Natureza:** somente leitura e análise estática. Nada foi editado, nenhum estado git foi alterado e o Firebase de produção não foi acessado.
- **Convenção:** **[MEDIDO]** = contado ou lido diretamente no código ou nos dados do repositório; **[HIPÓTESE]** = inferência que depende do estado real do Firestore/Storage ou do comportamento em runtime, ainda não verificado.
- **Ressalva sobre Rules:** o `firestore.rules` local pode estar à frente da produção (o B2A6 e outros blocos ainda aguardam publicação). Os achados sobre Rules referem-se ao **arquivo local**.

---

## 0. Mapa do modelo atual (resumo medido)

| Coleção | Escritor (admin) | Leitor público | Campo de publicação | Campo(s) de imagem | Data de referência | ID |
|---|---|---|---|---|---|---|
| `noticias` | `admin-content-cms.js` `saveNews`, importadores | `js/cms.js` (`where publicado==true`) | `publicado` (bool) **e** `status` (`publicado`/`rascunho`) | `imagem` (string), `galeria` (string[]) | `publishedAt`/`data` = **string ISO do relógio do cliente** | `noticia_<Date.now()>`, `noticia_legacy_<slug>`, `noticia_prefeitura_<sourceId>` |
| `eventos_aprovados` | `saveEvent` + `firebase-auth.js` (aprovação) | `home-eventos.js`, `eventos.html`, `mapa-turistico.js` (coleção inteira) | `publicado` (bool) **e** `status` (`aprovado`/`rascunho`) | `mainImage`, `image`, `coverImage` (mesma URL ×3) + `images[]{url,path,name,…}` | `date`/`data` (string `AAAA-MM-DD`) | `evt_<Date.now()>` ou o ID da submissão |
| `banners` | `banners.js` | `public-banners.js` (`status=='published'`) | `status` (`draft`/`published`/`archived`) | `imageUrl`, `imagePath`, `mediaId` | `startAt`/`endAt` = Timestamp | `<slug>-<base36>` |
| `gallery_items` | `gallery.js` (só update) | `public-gallery.js` (`published==true`) | `published` (bool) | `url` | — | migração |
| `cms_establishments` | `empreendimentos.js` (saga, revision, locks) | `cms-public-establishments-adapter.js` (`status=='published'`) | `status` (`draft`/`published`/`archived`) | `media.mainImage{url,path,alt,caption,credit,source,…}`, `media.gallery[]` | `uploadedAt` etc. = **string** (Rules exigem `optionalString`) | slug/ID |
| `rotas` | `rotas.js` | `cms-public-routes-adapter.js` | `status` | `cover{url,path,mediaId}` | — | — |
| `media_library` | `saveMedia` | nenhum (Rule local: admin-only) | — | `url`, `storagePath` | — | `media_<Date.now()>` |

**[MEDIDO]** Existem quatro vocabulários de publicação diferentes (`publicado` bool + `status` PT, `status` EN, `published` bool, `status` com 3 estados). A própria Cloud Function de auditoria precisa de uma tabela de 20 aliases de status para normalizá-los (`functions/audit-core.js:33-60`).

---

## 1. Consistência do modelo e relacionamentos

### DATA-01 — Três leitores públicos aplicam regras diferentes para "evento publicado" · **P1**
- **Arquivos:** `js/event-occurrence-adapter.js:63-72` (home); `eventos.html:479-485` + `:799` (agenda); `js/mapa-turistico.js:637-640` + `:1019` (mapa); `js/admin-content-cms.js:1120-1124` (badge do admin).
- **[MEDIDO] Divergências concretas:**
  - Documento **sem `status` e sem `publicado`**: home = oculto; agenda = **visível**; mapa = **visível**; admin = mostra "Publicado".
  - Documento `{status:"aprovado", publicado:false}` (estado inconsistente, possível por escrita parcial ou pela aprovação legada): home = oculto; agenda = oculto; **mapa = visível**, porque o mapa ignora `publicado`.
- **Impacto:** o mesmo evento aparece em uma página e some de outra; o editor vê "Publicado" para um item que a home não mostra.
- **Recomendação:** um único predicado compartilhado (por exemplo `PublicationContracts.isPublicEvent`) usado pelos três leitores e pelo admin; e um campo canônico único (`publicado === true`) gravado em todas as transições.

### DATA-02 — Rascunhos de eventos ficam legíveis publicamente · **P1** (segurança/dados)
- **Arquivo:** `firestore.rules:1469-1471` (`eventos_aprovados`: `allow read: if true`).
- **[MEDIDO]** O admin grava rascunhos (`publicado:false, status:"rascunho"`) **na mesma coleção** `eventos_aprovados` (`admin-content-cms.js:211-212`, `:311-313`). A filtragem é feita somente no cliente.
- **Impacto:** qualquer pessoa pode listar rascunhos, eventos despublicados, `reviewNotes`, `updatedBy` (UID) e `organizer`. É o mesmo padrão corrigido em `noticias` no B2A3, mas ainda não aplicado a eventos.
- **Recomendação:** replicar o contrato de `noticias` (`allow read: if isAdmin() || resource.data.publicado == true`) e passar os três leitores para uma consulta `where('publicado','==',true)`. Isso exige bloco próprio de Rules, porque as leituras atuais sem filtro passariam a falhar.

### DATA-03 — Notícias: o admin considera publicado o que o público não mostra · **P2**
- **Arquivos:** `admin-content-cms.js:500`, `:560`, `:651`, `:713` (`publicado === true || status === "publicado"`); `firestore.rules:1653` e `js/cms.js:44-47` (somente `publicado == true`).
- **[MEDIDO]** Um documento legado com `status:"publicado"` e sem `publicado:true` aparece como **Publicado** no painel, mas é negado pela Rule e pela consulta pública. Esse caso foi explicitamente documentado no B2A3.
- **Recomendação:** o painel deve usar o mesmo predicado da Rule e sinalizar "inconsistente — sem `publicado:true`"; acrescentar uma checagem de dados no dashboard.

### DATA-04 — Campos de imagem com nomes e formas diferentes em cada entidade · **P2**
- **[MEDIDO]**
  - Evento grava a mesma URL **três vezes** (`mainImage`, `image`, `coverImage`) mais `images[]` (`admin-content-cms.js:235-238`).
  - Notícia usa `imagem` e `galeria` (strings).
  - Banner usa `imageUrl` e `imagePath`.
  - Galeria usa `url`.
  - Empreendimento usa um objeto `media.mainImage.url`.
  - `media_library` usa `url` e `storagePath`.
  - Em eventos, o caminho do arquivo é `path`; na biblioteca é `storagePath`.
  - `publication-contracts.js:171` ainda aceita `url || src || downloadURL`.
- **Impacto:** cada leitor reimplementa um fallback diferente; os campos triplicados podem divergir em edições parciais (`toggle*` não os toca, mas importadores e scripts podem); a detecção de uso de mídia precisa conhecer todas as formas.
- **Recomendação:** um tipo canônico `ImageRef {url, path, mediaId, alt, caption, credit}` e um adaptador de leitura único; manter os aliases legados somente na leitura, durante a migração.

### DATA-05 — Datas em formatos mistos e com relógio do cliente · **P2**
- **[MEDIDO]**
  - `noticias.publishedAt`/`data` = `new Date().toISOString()` gerado no navegador (`admin-content-cms.js:625-626`, `:653`).
  - `eventos.date` = string `AAAA-MM-DD`.
  - `images[].uploadedAt` = string ISO (`:178`).
  - `banners.startAt/endAt` = Timestamp.
  - Os campos `uploadedAt/reviewedAt/updatedAt` das imagens de empreendimentos são **obrigatoriamente string** pelas Rules (`firestore.rules:479-484`).
  - `updatedAt` do documento = `serverTimestamp()`.
- **Impacto:** a ordenação "mais recente" depende do relógio de cada máquina admin; o fuso aparece só em parte dos campos; não é possível fazer `orderBy` consistente entre coleções; `compareAdminDateDesc` precisa adivinhar o tipo.
- **Recomendação:** Timestamp para todos os instantes (`publishedAt`, `createdAt`, `reviewedAt`) e string `AAAA-MM-DD` apenas para datas de calendário de evento. Migrar com dry-run.

### DATA-06 — Mídia referenciada por cópia de URL; a "detecção de uso" é incompleta · **P2**
- **Arquivos:** `admin-content-cms.js:1639-1673` (`buildMediaUsageMap`), `:1030-1067` (`deleteMedia`).
- **[MEDIDO]** O mapa de uso cobre eventos, notícias, rotas e empreendimentos. **Não cobre** `banners` (que têm `imageUrl`/`mediaId`), `gallery_items` nem `site_config`. Um banner usando a imagem gera "Sem uso detectado". Eventos e notícias não guardam `mediaId`, apenas a URL copiada (exceção: o `path` em `images[]`).
- **Mitigação existente [MEDIDO]:** `deleteMedia` remove só o item do catálogo e preserva o arquivo físico, e bloqueia a remoção quando a mídia é capa de rota. Portanto hoje **não** surgem URLs quebradas por exclusão.
- **Risco remanescente:** se algum dia o arquivo do Storage for apagado (limpeza manual ou futuro ADMIN-B2B), referências não rastreadas quebram em silêncio; editar o `alt` ou o título na biblioteca não se propaga.
- **Recomendação:** incluir banners, galeria e site_config no mapa de uso; gravar `mediaId` junto da URL em todos os editores; qualquer limpeza física deve exigir a verificação de uso completa.

### DATA-07 — Arquivos órfãos no Storage por falha entre upload e gravação · **P2**
- **Arquivos:** `admin-content-cms.js:167-179` → `:249` (evento); `:946-951` → `:956` (mídia); `banners.js:1059` → `doSave` (`:1044`).
- **[MEDIDO]** O upload para `cms-media/...` acontece **antes** do `set()` no Firestore. Se o `set()` falhar (Rule, rede, validação), o arquivo fica no bucket sem nenhum documento apontando para ele. Também não há limpeza quando o usuário fecha o modal depois de um upload com falha de gravação. Só `empreendimentos.js` tem uma saga com `pendingUploadedMedia` e reconciliação (`:2014-2049`).
- **Impacto:** acúmulo de arquivos públicos não catalogados em `cms-media` (cuja leitura pública é ampla — P1 já registrado). Hoje não existe inventário para detectá-los, exceto `scripts/cms-media-inventory.mjs`.
- **Recomendação:** registrar o upload pendente e reconciliá-lo (padrão já usado na saga de empreendimentos), ou gravar primeiro o documento como `uploading` e o arquivo depois; incluir um relatório de órfãos no inventário de mídia.

### DATA-08 — `currentAdminId()` tem fallback para a string literal `"admin"` · **P3**
- **Arquivo:** `admin-content-cms.js:1098-1100`.
- **[MEDIDO]** Sem `window.currentUser`, o código grava `updatedBy:"admin"` e faz upload para `cms-media/admin/...`. As Rules de `noticias`, `media_library` e `eventos_aprovados` não validam `updatedBy == request.auth.uid`.
- **Impacto:** perda de rastreabilidade de autoria; a trilha confiável fica apenas na Cloud Function de auditoria.
- **Recomendação:** usar `firebase.auth().currentUser.uid` e falhar se ausente; validar `updatedBy` nas Rules em bloco próprio.

### DATA-09 — Correção de conteúdo embutida no código · **P3**
- **Arquivo:** `js/cms.js:83-93` (`normalizarAvisoAgroSamas`).
- **[MEDIDO]** O código reescreve título e texto de um post específico, identificado por regex, ao ler do Firestore.
- **Impacto:** o dado no banco continua errado, e o painel mostra uma versão diferente da pública.
- **Recomendação:** corrigir o documento e remover o patch.

---

## 2. Risco de duplicidade

### DATA-10 — Slug de notícia sem verificação de unicidade · **P2**
- **Arquivos:** `admin-content-cms.js:617` (`slug = form.slug || makeSlug(title)`); `js/cms.js:167-168` (`getPostPorSlug` devolve o **primeiro** encontrado); `prefeitura-news.js:530`.
- **[MEDIDO]** O `saveNews` não verifica se o slug já existe; o importador estático (`:757-781`) e o da Prefeitura (IDs determinísticos `noticia_prefeitura_<sourceId>`) deduplicam apenas dentro do próprio fluxo. Uma notícia manual e uma importada com o mesmo título geram slug igual, e `noticia?slug=` passa a abrir uma delas de forma arbitrária (ordem por data).
- **Recomendação:** checar a unicidade antes de salvar (consulta `where('slug','==',s)` ou documento-lock `noticia_slugs/{slug}` em transação, como `cms_establishment_submission_locks`).

### DATA-11 — Eventos, notícias e mídia sem ID determinístico nem checagem semântica · **P3**
- **[MEDIDO]** IDs gerados como `evt_`/`noticia_`/`media_` + `Date.now()`. O botão "Duplicar" e um duplo envio rápido (há `setBusy`, que mitiga) criam cópias. Não existe verificação título + data para eventos.
- **Comparação:** `cms_establishments` tem detecção semântica de duplicata e locks transacionais (`empreendimentos.js:2241-2330`), mas lê a coleção inteira a cada salvamento (ver PERF-03), e a checagem fora de transação (`assertNoManualSemanticDuplicate`) tem janela TOCTOU, parcialmente coberta pelo lock de identidade.
- **Recomendação:** chave de identidade `titulo+data` para eventos, aviso no formulário e uso de `randomUUID` em vez de `Date.now`.

---

## 3. Eficiência de consultas

### PERF-01 — 31 leituras de coleção inteira sem `limit`/`where`; apenas 1 consulta paginada · **P2**
- **[MEDIDO]** Contagem de `collection(x).get()` / `readCollection` sem filtro:

| Arquivo | Leituras |
|---|---|
| `dashboard.js` | 9 (todas a cada ativação, `:373-381`) |
| `firebase-auth.js` | 9 |
| `admin-content-cms.js` | 7 |
| `empreendimentos.js` | 2 |
| `rotas.js` | 1 (com outras duas coleções) |
| `banners.js` | 1 |
| `prefeitura-news-importer.js` | 1 |
| `admin-firebase.html` | 1 |

  Só `audit-logs.js:22` usa `limit(25)`.
- **Exemplos:**
  - Abrir **Mídia** lê 5 coleções inteiras (`media_library`, `eventos_aprovados`, `noticias`, `rotas`, `cms_establishments`, em `admin-content-cms.js:846-852`).
  - Abrir o **Dashboard** lê 7 coleções e 2 relatórios, incluindo `usuarios` e `media_library` inteiras.
  - `getAdminStats` (`firebase-auth.js:3227-3231`) lê `usuarios` e `eventos_aprovados` inteiras **só para obter `.size`**.
- **Impacto:** com o volume atual (dezenas a centenas de documentos) o efeito é baixo. **[HIPÓTESE]** O custo e a latência crescem linearmente; o dashboard é o primeiro a degradar.
- **Recomendação:** `count()` (agregação, SDK ≥ 9.x / compat 10.7.1 suporta) para os contadores; cache em memória por sessão com invalidação após gravação; carregar o mapa de uso de mídia sob demanda.

### PERF-02 — Leituras públicas de `eventos_aprovados` sem filtro em 3 páginas · **P2**
- **Arquivos:** `home-eventos.js:207`, `eventos.html:795`, `mapa-turistico.js:1004`.
- **[MEDIDO]** Cada visitante baixa **todos** os eventos, inclusive rascunhos e eventos passados (ver DATA-02).
- **Impacto:** custo por visita proporcional ao histórico acumulado; vazamento de rascunhos.
- **Recomendação:** `where('publicado','==',true)` e, opcionalmente, `where('date','>=',hoje)`. Hoje bastam os índices simples; combinações de igualdade com intervalo exigem índice composto.

### PERF-03 — Detecção de duplicata lê coleções inteiras a cada salvamento ou aprovação · **P3**
- **Arquivos:** `empreendimentos.js:2333-2335` (todo salvamento manual); `firebase-auth.js:1626-1628` (aprovação lê `cms_establishments`, `estabelecimentos_pendentes` e `estabelecimentos_aprovados` inteiras).
- **Recomendação:** chaves normalizadas indexadas (`identityKey`) com consulta por igualdade.

### PERF-04 — Sem paginação nem virtualização nas tabelas do admin · **P3**
- **[MEDIDO]** Eventos, notícias, mídia (grade com `<img>` para cada item), usuários e empreendimentos renderizam tudo via `innerHTML` em uma única string. Nenhuma ocorrência de `pageSize`, `startAfter` ou `loading="lazy"` nas grades de mídia.
- **Impacto [HIPÓTESE]:** com centenas de mídias, o painel baixa todas as imagens em resolução cheia ao abrir a biblioteca.
- **Recomendação:** `loading="lazy"` imediato (custo baixo); paginação por cursor depois.

### PERF-05 — Listener `onSnapshot` da galeria re-renderiza formulários em edição · **P2** (estabilidade/UX)
- **Arquivo:** `gallery.js:68-74`, `render` em `:19-38`.
- **[MEDIDO]** O `dispose` cancela corretamente a inscrição (o router chama `disposeCurrent`, `admin-router.js:54-77`), então **não há vazamento**. Porém cada snapshot (inclusive o do próprio `save`, ou de outro admin) **recria todos os `<form>`**, descartando o que estiver sendo digitado em outros itens.
- **Recomendação:** trocar por `get()` com recarga manual ("Atualizar" já existe) ou fazer diff por item.

### PERF-06 — Índices não versionados · **P3**
- **[MEDIDO]** Não existe `firestore.indexes.json`, e o `firebase.json` não tem a chave `indexes`. As consultas atuais usam apenas igualdade (inclusive múltiplas igualdades, `firebase-auth.js:1812-1813`, `1911-1912`) ou `orderBy` em um único campo, então hoje **não** dependem de índice composto.
- **Risco:** o primeiro `where` + `orderBy` (provável em PERF-01/02) exigirá um índice criado no console, fora do Git.
- **Recomendação:** versionar `firestore.indexes.json` (mesmo vazio) antes de introduzir consultas compostas.

### PERF-07 — Trigger de auditoria em todas as coleções · **P3**
- **Arquivo:** `functions/index.js:14-20`.
- **[MEDIDO]** O documento `{collectionId}/{documentId}` dispara para **toda** escrita no banco, inclusive `reservas` e o próprio `audit_logs`, saindo cedo para coleções fora da lista. Cada gravação de log reinvoca a função.
- **Impacto:** invocações cobradas em dobro; sem risco de loop, porque `audit_logs` não está em `AUDITED_COLLECTIONS`.
- **Recomendação:** um trigger por coleção auditada. Além disso, o log registra só campos de status/role (`AUDITABLE_CHANGED_FIELDS`), não alterações de conteúdo.

---

## 4. Gravações e concorrência

### DATA-12 — Last-write-wins em eventos, notícias, mídia, banners e galeria · **P1**
- **[MEDIDO]**
  - Eventos e notícias usam `set(payload, {merge:true})` sem verificação de versão (`admin-content-cms.js:249`, `:635`); o payload contém **todos** os campos do formulário, então dois admins editando o mesmo item apagam a edição um do outro.
  - **Banners** usam `set()` **sem merge**, reconstruindo o documento a partir do objeto `base`/`item` **em memória** (`banners.js:1044`, `:1123`, `:1250`, `:1279`). Um "Salvar rascunho" com dados antigos pode desfazer em silêncio uma publicação feita por outro admin, porque `status` é recalculado a partir de `base.status` (`:946`), e o mesmo vale para `publish`/`archive` com um `item` desatualizado.
  - Os toggles de publicação usam o estado da lista carregada (`toggleEventPublish` inverte `isPublished(item)` local): se outro admin já publicou, o clique **despublica**.
- **Contraste:** `cms_establishments` tem `revision`, conferência `current.revision !== base.revision` → conflito, e transações (`empreendimentos.js:2028`, `:1791`, `:2249`, `:2411`) — é o modelo a replicar.
- **Recomendação:** campo `revision`/`updatedAt` conferido em `runTransaction`; toggles idempotentes ("publicar" grava `true`, e não "inverter"); banners com `update()` de campos alterados.

### DATA-13 — `serverTimestamp` e `updatedBy`: cobertura boa, com lacunas · **P3**
- **[MEDIDO]** Todos os escritores do admin gravam `updatedAt: serverTimestamp()` e `updatedBy`. Lacunas: datas de negócio geradas no cliente (DATA-05), `currentAdminId` com fallback (DATA-08) e o `createdAt` de mídia copiado do item em memória (`:961`).

### DATA-14 — Uso de lote e transação · **P3**
- **[MEDIDO]** O importador da Prefeitura e o importador estático usam `batch()` sem dividir em blocos de 500 operações (`prefeitura-news-importer.js:324`, `admin-content-cms.js:769`). Hoje o volume é pequeno.
- **[HIPÓTESE]** Uma importação acima de 500 itens falha por inteiro (o comportamento é atômico, então não há corrupção).
- **Recomendação:** dividir em blocos de 450.

---

## 5. Cache

### PERF-08 — Service Worker: admin protegido; código do admin vai para o CacheStorage · **P3**
- **Arquivo:** `sw.js:101-135`, `:209-214`, `:286-295`.
- **[MEDIDO]**
  - A navegação `/admin-firebase` é ignorada pelo SW (`isSensitivePath`).
  - O Firestore, o Storage e o SDK (`www.gstatic.com/firebasejs/`) nunca são cacheados.
  - Todo `.js`/`.css` de mesma origem usa network-first com `no-cache`, portanto **não há risco de admin servido desatualizado** com a rede disponível.
  - Contudo os módulos do admin (`js/admin/**`) são gravados no CacheStorage em cada carregamento, inclusive em máquinas compartilhadas, e servidos offline.
- **Recomendação:** acrescentar `/js/admin/` e `admin-content-cms.js` à lista de bypass (o último já está em `NEVER_CACHE`).

### PERF-09 — Sem cache de dados no navegador; dado obsoleto só via fallback local de notícias · **P3**
- **[MEDIDO]** `public-banners.js` usa storage apenas para a frequência dos pop-ups; não há cache de dados de 4h no código atual. `js/cms.js:76-79` usa `localStorage` (`storageKey`) ou posts fixos quando o Firestore falha, o que pode exibir notícias antigas ou removidas sem indicação.
- **Recomendação:** marcar visualmente a fonte de fallback, ou remover o fallback via `localStorage`, que não é mais escrito pelo CMS.

---

## 6. Erros, offline e recuperação

### PERF-10 — Sem persistência offline, sem detecção de rede e sem retry · **P2**
- **[MEDIDO]**
  - Nenhuma ocorrência de `enablePersistence`, `persistentLocalCache`, `navigator.onLine` ou listener de `offline` no admin.
  - O SDK compat enfileira gravações em memória, mas sem persistência: um `set()` feito sem rede pode ficar pendente, e o modal **não** fecha até o `await` resolver (bom), sem timeout visível (ruim).
  - Upload no Storage sem retomada.
  - O padrão de mensagens de erro é bom ("Suas alterações continuam no formulário").
- **Recomendação:** timeout com mensagem nas gravações; indicador online/offline no shell; **não** ativar persistência multi-aba no painel administrativo (risco de dados sensíveis em IndexedDB).

---

## 7. Créditos de imagem — duas fontes de verdade

### Como funciona hoje [MEDIDO]
1. **Fonte A — CMS (Firestore):** somente `cms_establishments.media.mainImage.credit` e `media.gallery[].credit`, mais `caption`. Texto livre, até 160 caracteres no painel (`empreendimentos.js:429`, `:1463`, `:2860`), e as Rules aceitam apenas `credit`/`caption`/`source` como string (`firestore.rules:461-475`). **Não existem** campos de licença, fonte, link ou modificações. Também não há crédito em `noticias`, `eventos_aprovados` (o `buildEventImageEntry` não grava `credit`, embora `publication-contracts.js:180` aceite `credit` com até **240**), `banners`, `gallery_items` ou `media_library`.
2. **Fonte B — `js/image-attribution.js` (`REGISTRY`, versionado):** autor, fonte, link, licença, link da licença e modificações, indexados pelo **caminho relativo do arquivo** (`normalizeKey`, `:125-132`). Contém **6 entradas** (4 Ervateira Baldo/AEN, 2 Ervateira Taquaral/Commons).

### Quem vence na resolução pública [MEDIDO]
`resolve()` (`image-attribution.js:167-190`) e `forItemImage()` (`:193-207`):
- Se a URL está no registro, **o autor do registro substitui o crédito do CMS** (`author = entry ? entry.author : cmsCredit`). O crédito digitado no painel é **ignorado silenciosamente**; somente a `caption` do CMS é mantida.
- Se a URL não está no registro, vale o texto livre do CMS, sem fonte, licença ou links.
- A chave é o caminho relativo no domínio do portal: uma imagem enviada ao Storage (`firebasestorage...`) **nunca** casa com o registro, mesmo sendo o mesmo arquivo.
- Consumidores: `local.html`, `public-establishments-renderer.js:84-95`, `mapa-turistico.js:1617-1635` e o painel (`empreendimentos.js:1061-1073`, apenas leitura).

### Divergências concretas encontradas no repositório [MEDIDO]
- **DATA-15a — cobertura do registro de 4,6%:** `images/empreendimentos/` contém **130 arquivos em 18 pastas**; o registro cobre **6** (apenas `ervateira-baldo` e `ervateira-taquaral`).
- **DATA-15b — fotos novas sem registro:** o commit `97c62dc` ("fotos do acervo próprio e institucional") adicionou **9 arquivos** de Rei Verde, Ancestral, Ginásio Polacão, Paço Municipal, Vapor Pery e Miss São Mateus, declarando origem "acervo do Departamento, portal da Prefeitura e **Wikimedia Commons (domínio público)**". **Nenhum** desses arquivos está no `REGISTRY`; a atribuição deles, se existir, está apenas no Firestore e não é verificável no repositório **[HIPÓTESE]**. Imagens do Commons exibidas sem link de fonte ou licença contrariam o padrão adotado para a Taquaral.
- **DATA-15c — limites diferentes:** 160 caracteres no painel × 240 em `publication-contracts.js` × sem limite nas Rules.
- **DATA-15d — seeds sem crédito:** `scripts/cms-establishments-seed.mjs:407` e o seed de E2E gravam `credit: ''`; os cadastros semeados nascem sem crédito.
- **DATA-15e — o teste não pega o gap:** `tests/image-attribution.test.mjs:33` verifica que cada entrada do registro existe em disco, mas **não** o inverso (arquivos sem atribuição).
- **DATA-15f — painel ambíguo:** a gestão da galeria mostra lado a lado "Crédito: \<CMS\>" (`:1110`, `:1130`) e "Licença registrada no portal: Autor: \<registro\>" (`:1072`). Se os valores divergirem, o editor não sabe que o público verá o do registro.

### Riscos
- **Jurídico (P1):** imagens de terceiros, como o portal da Prefeitura e o Commons, podem ser publicadas sem a atribuição exigida pela licença (CC BY-SA exige autor, licença e link), e o sistema não sinaliza a falta.
- **Operacional (P2):** a edição de crédito no painel não tem efeito para URLs registradas; o mesmo arquivo usado em dois cadastros pode receber créditos diferentes no CMS; trocar o domínio ou passar a servir o arquivo pelo Storage desliga a licença.
- **Fallback (P3) [HIPÓTESE]:** quando o catálogo cai para os dados estáticos (`js/data/*`, que não têm `credit`), só as 6 imagens registradas mantêm crédito.

### Recomendação (sem migrar agora)
1. **Curto prazo, sem Rules:** teste inverso que lista os arquivos de `images/empreendimentos/**` sem entrada no registro (com allowlist explícita de "acervo próprio, crédito = Departamento"); preencher o registro dos 9 arquivos do `97c62dc` após conferir a fonte (não inventar autoria); no painel, quando a URL estiver registrada, mostrar "o crédito público vem do registro" e desabilitar o campo ou destacar a divergência.
2. **Médio prazo, bloco próprio com publicação de Rules:** fonte única por **ativo**, não por uso. Ampliar `media_library` com `credit`, `license{code,url}`, `source{name,url}`, `modifications`, e fazer as imagens referenciarem `mediaId`. O registro estático passa a ser seed ou migração idempotente para esses documentos e é aposentado; a resolução pública lê `mediaId` → ativo e mantém a URL apenas como fallback. Exige migração com dry-run, a mesma governança de Rules (ADMIN-B3) e consideração do P1 de leitura pública de `media_library`, possivelmente projetando os créditos para um campo público no documento consumidor.
3. **Precedência explícita durante a transição:** registro > CMS para autor e licença, mas com um aviso no painel e um log de divergência no teste, em vez de descarte silencioso.

---

## 8. Dependências

### PERF-11 — Firebase JS SDK 10.7.1 via CDN em todo o site; 12.16.0 no `package.json` · **P2**
- **[MEDIDO]**
  - 37 referências a `gstatic.com/firebasejs/10.7.1` (compat no admin, portal, eventos, mapa e galeria; modular em `cms.js`, `home-eventos.js`, `public-banners.js`, `reservas.js`, `season-theme.js`, `tourism-mascot.js` e adaptadores).
  - `package.json` usa `firebase` **12.16.0** (somente testes).
  - `functions` usa `firebase-admin` 14.3.0 e `firebase-functions` 7.3.2.
  - O admin carrega 6 bundles compat; não há atributo `integrity` (SRI) em nenhum `<script>` do Firebase (0 ocorrências em `admin-firebase.html`).
- **Impacto:** a versão 10.7.1 (dezembro de 2023) está duas versões major atrás. Os testes de integração rodam contra a 12.x enquanto a produção roda 10.7.1, então o comportamento testado ≠ comportamento implantado. As páginas públicas instanciam **apps compat e modular em paralelo** (já registrado no B5), baixando o SDK duas vezes. A API compat está em manutenção.
- **Recomendação:** fixar uma única versão (alinhar testes e runtime), migrar o admin para o modular em bloco próprio e avaliar SRI ou self-hosting dos bundles.

---

## 9. Priorização

| ID | Sev. | Classificação (CLAUDE.md) |
|---|---|---|
| DATA-02 rascunhos de eventos públicos | P1 | Precisa de confirmação (Rules + leitores) |
| DATA-12 last-write-wins / toggles invertem estado | P1 | Precisa de confirmação |
| DATA-15 créditos / licenças (jurídico) | P1 | Follow-up: teste inverso seguro agora; registro só com fonte conferida |
| DATA-01 predicados divergentes de evento | P1 | Seguro aplicar (código cliente), com testes |
| DATA-03, 04, 05, 06, 07, 10 · PERF-01, 02, 05, 10, 11 | P2 | Blocos próprios |
| DATA-08, 09, 11, 13, 14 · PERF-03, 04, 06, 07, 08, 09 | P3 | Follow-up/documentar |

**Melhor relação custo-benefício imediata (somente código cliente, sem Rules):** predicado único de publicação de eventos (DATA-01); toggles idempotentes e verificação de `updatedAt` antes de gravar (DATA-12 parcial); `count()` no dashboard (PERF-01); `loading="lazy"` na grade de mídia (PERF-04); teste inverso de atribuição (DATA-15).
