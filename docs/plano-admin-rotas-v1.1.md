# Plano executável — Admin Rotas V1.1

**Bloco atual:** `POST-V1-ROTAS-V1.1-DATA-MODEL-RULES-AND-EMULATOR`

**Handoff de origem:** `POST-V1-ROTAS-V1.1-DISCOVERY-AND-DESIGN`

**Data operacional:** 2026-08-13

**Fuso:** `America/Sao_Paulo`

**Natureza:** schema, Rules, normalização, seed e Emulator exclusivamente locais; nenhuma migração, leitura remota, publicação ou deploy

**Baseline deste bloco:** `main` em `06828cd88f5f63abd03688d9b3e8949ab0b1ba5d` (`docs: definir arquitetura de rotas do Admin V1.1`)

## 1. Decisão executiva

**Classificação:** **A. ROTAS V1.1 DISCOVERY COMPLETE — CURRENT MODEL MAPPED, CANONICAL SOURCE IDENTIFIED, SAFE ADMIN ARCHITECTURE DEFINED, IMPLEMENTATION READY.**

**Decisão de escopo V1.1:** **C. PRECISA DE ETAPA DE NORMALIZAÇÃO ANTES DO CRUD.** A normalização é pequena, determinística e cabe no primeiro bloco de implementação; não exige uma fase longa separada.

O sistema atual é híbrido e não possui uma única fonte de verdade para todos os aspectos:

```text
CURRENT_ROUTE_SOURCE_OF_TRUTH = MULTIPLE
currentSourceType = HYBRID / STATIC_JS / DERIVED_FROM_LOCALS / DUPLICATED_ACROSS_FILES
currentRoutesCount = 6
duplicatedRouteDefinitions = true
```

- A lista editorial corrente das seis rotas, com descrição, imagem, cor e ícone, está em `js/data/rotas.js` e é a fonte canônica atual dos cards de rota do portal principal.
- A identidade visual está duplicada em `routeInfo`, dentro de `js/rotas-data.js`, usando seis chaves legadas diferentes dos IDs canônicos.
- A comparação local dos seis nomes, seis cores e seis ícones encontrou 18/18 valores iguais entre as duas definições; a dívida é duplicação e risco de drift, não divergência editorial corrente.
- As associações de 47 empreendimentos/pontos estão em `js/rotas-data.js`, por `route` e, em nove casos, por `routes[]`.
- Quinze fichas de `js/locais-data.js` usam `rota` como texto de exibição. Esse campo mistura rotas temáticas com agrupamentos como Centro, Centro Histórico, Eventos Anuais e Turismo de Fé; portanto não pode ser convertido genericamente em ID de rota.
- O CMS de empreendimentos já possui `relationships.routeIds[]`; não deve ser criada uma relation collection nem duplicada a associação dentro do documento de rota.

Uma collection `rotas` passa a ser recomendada **depois** da investigação porque o CRUD precisa de identidade imutável, ciclo editorial por rota, validação por documento, auditoria e leitura pública somente de itens publicados. O desenho não decorre de uma suposição prévia.

## 2. Estado atual e fonte de verdade

### 2.1 Fluxo público principal

```text
js/data/rotas.js -> window.TURISMO_ROTAS
                            |
js/rotas-data.js -> adapter | -> window.TURISMO_DATA
js/locais-data.js ----------|            |
                                         +-> HOME: contagem e busca
                                         +-> mapa-turistico: cards/filtros/modal
```

`js/data/turismo-data.js` declara `js/data/rotas.js` como fonte primária e `js/rotas-data.js` como legado. `js/data/turismo-data-adapter.js` mescla locais e empreendimentos legados nas coleções de pontos, hospedagens e restaurantes, mas preserva em cada item legado somente a rota primária em `rota`/`legacyRouteName`; o array secundário `routes[]` não chega ao snapshot público principal.

No mapa principal, as seis rotas são itens temáticos sem coordenadas e ficam no grupo `routes`. Os empreendimentos associados entram como pontos, gastronomia, hospedagem ou serviços e não são exibidos automaticamente como pontos de uma rota específica.

### 2.2 Fluxo público legado

`mapa-completo.html` lê diretamente `js/rotas-data.js`. Ele:

- cria a legenda pelas seis chaves de `routeInfo`;
- desenha markers para os 47 empreendimentos;
- usa `route` como rota primária;
- reconhece `routes[]` para nove associações múltiplas;
- não desenha linhas, trajetos ou polígonos.

Esse fluxo está fora do sitemap e é `noindex,follow`, mas ainda é uma URL pública funcional. Ele é uma segunda integração real e deve ser tratado como compatibilidade legada no rollout.

### 2.3 Fluxo de local

`local.html` lê somente `js/locais-data.js`. O campo `local.rota` é dividido pelo separador `·` e renderizado como tags textuais. Não há lookup contra as seis rotas, não há ID estável e as tags não criam filtro nem relação navegável.

### 2.4 Roteiro ordenado separado

`js/roteiro-ia.js` possui seis `roteirosPredefinidos` com arrays ordenados de IDs numéricos de dez pontos próprios. Essa página é `noindex,follow`, está fora do sitemap e não consome `TURISMO_ROTAS`, `routeInfo` nem `relationships.routeIds`.

Ela comprova a existência de **roteiros ordenados separados**, mas não comprova que as seis rotas temáticas tenham sequência de visita. O CRUD de Rotas V1.1 não deve absorver esse módulo nem ganhar drag-and-drop de pontos por causa dele.

## 3. Inventário de arquivos

Legenda de dependência: `SIM`, `NÃO`, `LEGADO`, `INDIRETA` ou `DOCUMENTAL`.

| FILE | ROLE | ROUTE_DATA_PRESENT | ROUTE_DATA_TYPE | READS | WRITES | PUBLIC_DEPENDENCY | ADMIN_DEPENDENCY |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `js/data/rotas.js` | lista editorial canônica atual | SIM | array JS com 6 objetos | — | `window.TURISMO_ROTAS` em memória | SIM | NÃO |
| `js/rotas-data.js` | identidade legada e 47 empreendimentos associados | SIM | `routeInfo`, `route`, `routes[]`, lat/lng | — | globals em memória | SIM/LEGADO | INDIRETA via seed |
| `js/locais-data.js` | 15 fichas de locais | SIM | `rota` textual | — | `window.locaisData` em memória | SIM | INDIRETA via seed |
| `js/data/turismo-data-adapter.js` | normalização e merge de fontes estáticas | SIM | adapter JS | globals estáticos | snapshot em memória | SIM | NÃO |
| `js/data/turismo-data.js` | snapshot público agregado | SIM | datasource JS | `TURISMO_ROTAS` e adapter | `window.TURISMO_DATA` | SIM | NÃO |
| `js/mapa-turistico.js` | mapa público principal | SIM | cards, grupo/filtro e modal | `TURISMO_DATA.rotas` e itens | somente estado de UI | SIM | NÃO |
| `mapa-turistico.html` | shell do mapa principal | SIM | ordem de carregamento | scripts estáticos | — | SIM | NÃO |
| `mapa-completo.html` | mapa Leaflet legado | SIM | lookup direto + markers | `routeInfo`, `establishments` | somente estado de UI | LEGADO | NÃO |
| `index.html` | HOME | SIM | contagem, CTAs e carregamento | `TURISMO_DATA` | DOM | SIM | NÃO |
| `js/site-stats.js` | estatística da HOME | SIM | contagem derivada + fallback 6 | stats do snapshot | DOM | SIM | NÃO |
| `js/search-index.js` | busca global | SIM | uma entrada por rota | `TURISMO_DATA.rotas` | índice em memória | SIM | NÃO |
| `js/nav-shared.js` | navegação | SIM | links para grupo roteiros | — | DOM | SIM | NÃO |
| `local.html` | detalhe de local | SIM | tags de `local.rota` | `locaisData` | DOM | SIM | NÃO |
| `galeria.html` | galeria estática | SIM | conteúdo específico de Fluviópolis e card rural genérico | HTML estático | — | SIM | NÃO |
| `rotas-completas.html` | ponte legada | SIM | links/redirect | — | navegação | LEGADO | NÃO |
| `rotas-completas/index.html` | alias limpo | SIM | redirect | query/hash | navegação | LEGADO | NÃO |
| `js/roteiro-ia.js` | roteiros personalizados separados | SIM | pontos e sequências próprias | dados internos | estado de UI/local | LEGADO/SUSPENSO | NÃO |
| `roteiro-ia.html` | shell noindex do roteiro IA | SIM | carregamento | `js/roteiro-ia.js` | — | LEGADO/SUSPENSO | NÃO |
| `js/admin/modules/placeholder.js` | placeholder Rotas | SIM | configuração estática | registry/context | HTML estático | NÃO | SIM |
| `admin-firebase.html` | shell Admin | SIM | nav e container vazio | placeholder | DOM | NÃO | SIM |
| `js/admin/modules/empreendimentos.js` | CRUD do catálogo | SIM | `relationships.routeIds[]` e legado | `cms_establishments` | `cms_establishments` | NÃO | SIM |
| `docs/schemas/cms-establishments.schema.md` | contrato do catálogo | SIM | schema documental | — | — | NÃO | DOCUMENTAL |
| `scripts/cms-establishments-seed.mjs` | seed/diff controlado | SIM | allowlist de chaves para IDs | fontes estáticas | Firestore somente sob `--apply` explícito | NÃO | FERRAMENTA |
| `docs/cms-establishments-seed-preview.json` | preview local histórico | SIM | 67 docs normalizados | — | — | NÃO | EVIDÊNCIA LOCAL |
| `js/cms-public-establishments-adapter.js` | adapter público isolado/debug | PARCIAL | omite `relationships` | `cms_establishments` published | memória | NÃO no portal principal | NÃO |
| `firestore.rules` | autorização local atual | PARCIAL | valida `routeIds[]` em empreendimentos; não possui `rotas` | Firestore request | gates | INDIRETA | SIM |
| `storage.rules` | mídia CMS | PARCIAL | path reutilizável | Storage request + perfil | gates | INDIRETA | SIM |
| `js/admin-content-cms.js` | biblioteca de mídia | INDIRETA | picker/upload reutilizável, ainda sem modo Rotas | `media_library` | `media_library` e `cms-media` | NÃO | SIM |

### 3.1 Onde cada atributo existe hoje

| Atributo | Fonte atual |
| --- | --- |
| nomes, categorias, descrições, imagens, galerias de uma imagem, URLs, cores, ícones e tags | `js/data/rotas.js` |
| nomes, cores e ícones duplicados | `js/rotas-data.js` em `routeInfo` |
| ordem de exibição das rotas | posição implícita no array de `js/data/rotas.js`; sem campo explícito |
| IDs editoriais atuais | `id` em `js/data/rotas.js` |
| slugs | **ABSENT**; os IDs têm forma de slug, mas não existe campo `slug` |
| chaves legadas de relação | `sabores`, `mate`, `polonesa`, `aguas`, `fluviop`, `terra` em `js/rotas-data.js` |
| pontos/locais relacionados | `route`/`routes[]` em `js/rotas-data.js`; textos `rota` em `js/locais-data.js`; `relationships.routeIds[]` no contrato CMS |
| coordenadas | somente nos locais/empreendimentos; 47/47 registros de `js/rotas-data.js`, sendo 35 `ok` e 12 `aproximada` |
| linhas/polylines/GeoJSON | **ABSENT** |
| páginas individuais por rota | **ABSENT** |

## 4. Lista canônica atual

Os `placesCount` abaixo são derivados de `route`/`routes[]` em `js/rotas-data.js`; não são campos dos objetos de rota. Há 47 locais únicos e 56 relações porque nove locais pertencem a duas rotas.

| currentId | legacyKey | currentSlug | currentName | currentShortName | descriptionPresent | colorPresent | iconPresent | coverImagePresent | galleryPresent | pointsCount | placesCount | orderedPlacesPresent | polylinePresent | coordinatesPresent | publicPagePresent | mapFilterPresent | homepageReferencePresent | galleryReferencePresent | sourceFiles |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| `sabores-memorias` | `sabores` | ABSENT | Sabores & Memórias | ABSENT | SIM | SIM | SIM | SIM | SIM, 1 imagem igual à capa | ABSENT | 4 | ABSENT | ABSENT | ABSENT na rota; SIM nos locais | página individual ABSENT | grupo `roteiros`, sem filtro específico | contagem + busca; sem card nominal | ABSENT | `js/data/rotas.js`; `js/rotas-data.js` |
| `rota-erva-mate` | `mate` | ABSENT | Rota da Erva-Mate | ABSENT | SIM | SIM | SIM | SIM | SIM, 1 imagem igual à capa | ABSENT | 7 | ABSENT | ABSENT | ABSENT na rota; SIM nos locais | página individual ABSENT | grupo `roteiros`, sem filtro específico | contagem + busca; sem card nominal | ABSENT | `js/data/rotas.js`; `js/rotas-data.js` |
| `rota-polonesa` | `polonesa` | ABSENT | Rota Polonesa | ABSENT | SIM | SIM | SIM | SIM | SIM, 1 imagem igual à capa | ABSENT | 7 | ABSENT | ABSENT | ABSENT na rota; SIM nos locais | página individual ABSENT | grupo `roteiros`, sem filtro específico | contagem + busca; sem card nominal | ABSENT | `js/data/rotas.js`; `js/rotas-data.js` |
| `rota-das-aguas` | `aguas` | ABSENT | Rota das Águas | ABSENT | SIM | SIM | SIM | SIM | SIM, 1 imagem igual à capa | ABSENT | 10 | ABSENT | ABSENT | ABSENT na rota; SIM nos locais | página individual ABSENT | grupo `roteiros`, sem filtro específico | contagem + busca; sem card nominal | ABSENT | `js/data/rotas.js`; `js/rotas-data.js` |
| `caminhos-de-fluviopolis` | `fluviop` | ABSENT | Caminhos de Fluviópolis | ABSENT | SIM | SIM | SIM | SIM | SIM, 1 imagem igual à capa | ABSENT | 18 | ABSENT | ABSENT | ABSENT na rota; SIM nos locais | página individual ABSENT | grupo `roteiros`, sem filtro específico | contagem + busca; sem card nominal | SIM, conteúdo HTML independente | `js/data/rotas.js`; `js/rotas-data.js`; `galeria.html` |
| `rota-da-terra` | `terra` | ABSENT | Rota da Terra | ABSENT | SIM | SIM | SIM | SIM | SIM, 1 imagem igual à capa | ABSENT | 10 | ABSENT | ABSENT | ABSENT na rota; SIM nos locais | página individual ABSENT | grupo `roteiros`, sem filtro específico | contagem + busca; sem card nominal | ABSENT | `js/data/rotas.js`; `js/rotas-data.js` |

Mapeamento canônico necessário para compatibilidade:

```text
sabores  -> sabores-memorias
mate     -> rota-erva-mate
polonesa -> rota-polonesa
aguas    -> rota-das-aguas
fluviop  -> caminhos-de-fluviopolis
terra    -> rota-da-terra
```

## 5. Relação Rotas ↔ locais

```text
ROUTE_PLACE_RELATION_MODEL = HYBRID
routePlaceCardinality = MANY_TO_MANY_SUPPORTED_AND_USED
```

### 5.1 Modelo efetivo

- Em `js/rotas-data.js`, cada estabelecimento possui `route` e pode possuir `routes[]`.
- `route` é a rota primária e sempre está presente nos 47 itens.
- Nove itens possuem `routes[]` com duas rotas; logo múltiplas rotas são suportadas e usadas.
- As 56 relações se distribuem em 4, 7, 7, 10, 18 e 10 pelas seis rotas.
- O mapa legado respeita `routes[]`; o adapter do mapa principal perde as relações secundárias.
- Em `js/locais-data.js`, `rota` é texto livre e mistura conceitos. Há 15 valores distribuídos entre Turismo de Fé, Rota Polonesa · Turismo de Fé, Rota da Erva-Mate, Rota das Águas, Centro Histórico, Cultura Polonesa · Centro Histórico, Centro e Eventos Anuais.
- No contrato CMS, a estratégia já escolhida é `cms_establishments.relationships.routeIds[]`, acompanhada por `legacyRoute` e `legacyRouteName`.

### 5.2 Inconsistência do preview local

O preview local de 67 documentos contém 71 ocorrências em `routeIds[]`:

- 58 ocorrências já usam exatamente um dos seis IDs canônicos, em 49 documentos;
- 2 ocorrências usam `rota-da-erva-mate`, alias não canônico gerado de texto, nos documentos `chimarrodromo` e `rua-do-mathe`;
- 11 ocorrências restantes representam Centro, Centro Histórico, Eventos Anuais, Turismo de Fé ou combinações textuais e não devem virar rotas automaticamente.

Após normalização allowlist, a estimativa é de **60 relações canônicas em 51 documentos**, preservando os demais textos em `legacyRoute`/`legacyRouteName`.

## 6. Ordem e geometria

```text
CURRENT_ROUTE_HAS_ORDERING = mixed
CURRENT_ROUTE_GEOMETRY_MODEL = MARKERS_ONLY_FOR_RELATED_PLACES; NO_ROUTE_GEOMETRY
```

`mixed` significa:

- seis rotas temáticas: sem ordem explícita de pontos, sem sequência de visita e sem `placeIds` ordenados;
- ordem dos seis cards: apenas posição implícita no array;
- `js/roteiro-ia.js`: possui roteiros ordenados separados e não relacionados às seis rotas canônicas.

Não existe arquivo GeoJSON, LineString, polyline, GPX ou KML de rota. As coordenadas são de markers de locais. A geometria Three.js de `js/mapa3d.js` é visual/decorativa e não representa traçado das rotas temáticas.

**Recomendação V1.1:** criar apenas `displayOrder` para ordenar cards de rota. Não criar `orderedPlaceIds`, drag-and-drop de pontos, editor cartográfico ou geometria.

```text
orderingStrategyRecommended = displayOrder for route cards only
geometryStrategyRecommended = no route geometry in V1.1; preserve related-place markers
```

## 7. Integrações públicas

| SOURCE | CURRENT_BEHAVIOR | DATA_DEPENDENCY | FAILURE_RISK_IF_MODEL_CHANGES |
| --- | --- | --- | --- |
| HOME (`index.html`, `js/site-stats.js`) | mostra `6 Rotas Temáticas`; CTAs abrem o grupo roteiros | contagem de `TURISMO_DATA.rotas`, fallback hardcoded 6 | contagem obsoleta ou rotas publicadas não refletidas |
| busca (`js/search-index.js`) | cria uma entrada por rota, todas no mesmo URL genérico | `TURISMO_DATA.rotas` no carregamento | índice não atualizar após leitura Firestore assíncrona |
| mapa principal | lista seis cards sem coordenadas no grupo Rotas | `TURISMO_DATA.rotas` | cards sumirem, filtros quebrarem ou IDs mudarem |
| mapa principal — locais | markers vêm de outras coleções; rota primária vira texto | adapter legado | relações secundárias perdidas; associação Admin não refletida |
| mapa legado | legenda por rota e 47 markers, inclusive relações múltiplas | `routeInfo` + `establishments` | drift em relação ao Admin ou nomes/cores inconsistentes |
| detalhe de local | mostra tags textuais separadas por `·` | `locaisData.rota` | renome/associação Admin não refletidos; agrupamentos não canônicos podem sumir |
| galeria | Fluviópolis tem seção HTML própria; há card genérico Rotas Rurais | HTML e imagens estáticas | mudança no Admin não atualiza a galeria |
| página ponte | redireciona para o grupo roteiros | URL estática | baixo; depende de manter query alias |
| nav/footer | links genéricos para grupo roteiros | URL estática | baixo se URL principal for preservada |
| roteiro IA | roteiros próprios ordenados, noindex | dados internos separados | confusão conceitual se for acoplado ao CRUD temático |

### 7.1 URLs públicas atuais relacionadas

```text
ROUTE_PUBLIC_URLS =
  /mapa-turistico
  /mapa-turistico?grupo=roteiros
  /mapa-turistico?categoria=Roteiros   (alias aceito pelo JS)
  /mapa-turistico?categoria=Rotas      (alias aceito pelo JS)
  /rotas-completas
  /rotas-completas.html
  /mapa-completo
  /mapa-completo.html
  /local?id=<id>
  /roteiro-ia
  /roteiro-ia.html
```

- Indexável/canônica: `/mapa-turistico`; os query params compartilham a canonical da página.
- `/rotas-completas*`: `noindex,follow`, ponte para o mapa.
- `/mapa-completo*`: `noindex,follow`, mapa legado; fora do sitemap.
- `/roteiro-ia*`: `noindex,follow`; fora do sitemap.
- `/local?id=<id>`: indexável quando o ID existe e recebe canonical dinâmica própria; o alias `/local` é `noindex` e redireciona para `local.html`.
- Não existe URL individual de rota.

## 8. Admin, Firestore e Storage atuais

### 8.1 Admin Rotas

```text
adminRoutePlaceholderPresent = true
currentRouteAdminCodePresent = placeholder_only
currentRouteAdminHandlersPresent = false
currentRouteAdminPersistencePresent = false
currentRouteAdminFakeActionsPresent = false (only a generic disabled placeholder button)
dormantAdminRouteCode = false
```

O shell possui link e `<section id="section-rotas">`. `js/admin/modules/placeholder.js` registra um módulo `isPlaceholder`, renderiza texto estático, retorna `false` em `load()` e não possui ações. A configuração do placeholder antecipa rascunho/publicado e organização de empreendimentos, mas não é implementação parcial.

### 8.2 Firestore Rules

```text
currentFirestoreRouteCollection = ABSENT
currentFirestoreRulesSupport = PARTIAL_ONLY_THROUGH_cms_establishments.relationships.routeIds
```

- Não existe `match /rotas/{routeId}`.
- `cms_establishments` aceita `relationships.routeIds` como lista e restringe CRUD a admin ativo.
- A leitura pública de `cms_establishments` é somente `status == published`.
- `media_library` é admin-only.
- O fallback final nega toda leitura/escrita não declarada.
- `moderator` não tem acesso ao CRUD de `cms_establishments`; Rotas deve manter esse padrão e não ampliar privilégios.

### 8.3 Storage e mídia

```text
currentStorageSupport = REUSABLE_cms-media
currentMediaReusePossibility = true_with_usage_tracking_extension
```

`storage.rules` já permite leitura pública de `cms-media/{uid}/{allFiles=**}` e upload de imagem por admin ativo no próprio UID, com limite de 5 MB e MIME JPEG/JPG/PNG/WEBP. O fallback nega demais paths.

Não é necessário novo bucket nem novo path raiz. A capa pode reutilizar `media_library` e arquivos em `cms-media`. O código atual da biblioteca já carrega, cadastra e envia mídia, mas não oferece um picker genérico para Rotas. O módulo futuro deve criar apenas um modo de seleção reutilizável sobre a biblioteca existente.

Antes de permitir capa de rota, o detector de uso e a proteção de exclusão da biblioteca precisam incluir referências de `rotas`; hoje ele considera eventos e notícias, portanto poderia apagar arquivo usado por uma rota.

## 9. Modelo recomendado

### 9.1 Modelo A — mínimo recomendado

```text
rotas/{routeId}
```

```js
{
  id: "rota-erva-mate",          // igual ao docId; imutável
  slug: "rota-erva-mate",        // estável; bloqueado após primeira publicação
  name: "Rota da Erva-Mate",     // editável
  category: "Rota Cultural",
  description: "...",
  color: "#27ae60",
  icon: "🌿",
  status: "draft",               // draft | published | archived
  displayOrder: 20,               // ordem de cards, não de pontos
  tags: ["erva-mate", "cultura"],
  cover: {
    mediaId: "",
    url: "",
    path: "",
    alt: ""
  },
  createdAt: timestamp,
  createdBy: "uid",
  updatedAt: timestamp,
  updatedBy: "uid",
  publishedAt: timestamp | null,
  publishedBy: "",
  archivedAt: timestamp | null,
  archivedBy: ""
}
```

Campos deliberadamente fora da V1.1:

- `shortName` e `shortDescription`: ausentes no modelo atual;
- `gallery`: o array atual só repete a capa; o adapter pode derivar `galeria: [cover.url]`;
- `placeIds`: a relação já pertence ao empreendimento;
- `orderedPlaceIds`: não existe sequência comprovada;
- `coordinates`, `polyline`, `geometry`: não existe geometria de rota;
- SEO individual: não haverá página individual na V1.1.

### 9.2 Modelo B — alternativa não recomendada

Um único documento, por exemplo `site_content/rotas`, contendo um array de seis rotas, economizaria poucas leituras. Em troca, toda edição regravaria o documento inteiro, regras por item seriam mais complexas, status/auditoria por rota seriam frágeis e concorrência seria pior. O trade-off não compensa para o Admin atual.

### 9.3 Identidade e slug

```text
stableIdentityRecommended = immutable document id
slugStrategy = current id as initial slug; editable only in draft; locked after first publish
```

- O relacionamento usa `routeId`, nunca nome ou slug.
- Os seis documentos preservam os IDs de `js/data/rotas.js`.
- O nome pode mudar sem quebrar relações.
- O slug não é usado como chave relacional.
- Unicidade de slug deve ser validada pelo Admin e por teste; Firestore Rules não garantem unicidade entre documentos.

### 9.4 Estratégia de relacionamento

**Escolha principal: B. o local/empreendimento contém `routeIds[]`.**

Justificativas:

- já existe no schema, Rules, seed e Admin de empreendimentos;
- suporta cardinalidade N:N comprovada;
- evita duplicar 60 relações em documentos de rota;
- permite edição tanto pelo módulo Rotas quanto pelo módulo Empreendimentos;
- para o volume atual, o Admin pode carregar os empreendimentos e agrupar no cliente;
- não exige subcollection, relation collection nem transação distribuída complexa.

O editor de rota deve salvar apenas os documentos de `cms_establishments` cujo `routeIds[]` mudou. A operação deve usar batch e falhar atomicamente. A V1.1 não deve tentar validar integridade referencial completa pelas Rules; o Admin, a migração allowlist e os testes fazem essa validação.

### 9.5 Publicação

```text
ROUTE_PUBLICATION_MODEL = draft / published / archived
```

Esse padrão já existe em Banners e Empreendimentos e impede que rota incompleta apareça. `published` exige nome, slug, descrição, capa, cor, ícone e auditoria válidos. `archived` substitui exclusão física.

### 9.6 Exclusão

```text
deleteStrategyRecommended = NO_HARD_DELETE_IN_V1_1; ARCHIVE_OR_UNPUBLISH
```

Não haverá cascade automático. Como Firestore Rules não consultam de forma simples todos os empreendimentos que referenciam uma rota, `allow delete: if false` é proporcional e seguro. O Admin mostra a quantidade de relações e exige confirmação normal para arquivar/despublicar; confirmação digitada é desnecessária sem delete físico.

## 10. Migração e compatibilidade

```text
IS_ROUTE_DATA_MIGRATION_REQUIRED = partial
migrationEstimatedRouteCount = 6
migrationEstimatedRelations = 60 canonical relationships in 51 documents (local estimate)
```

### 10.1 Fonte e alvo

| Item | source | target |
| --- | --- | --- |
| seis rotas | `js/data/rotas.js` | `rotas/{currentId}` |
| chaves legadas | `js/rotas-data.js` + allowlist de 6 mapeamentos | IDs canônicos |
| relações | `cms_establishments.relationships.routeIds[]`, comparadas com `route`/`routes[]` e preview local | o mesmo campo, normalizado |
| textos não canônicos | `legacyRoute`/`legacyRouteName` e `js/locais-data.js` | preservados como legado; não viram rota automaticamente |

### 10.2 Algoritmo controlado futuro

1. Gerar os seis documentos localmente a partir de `js/data/rotas.js` sem criar nada remoto.
2. Validar IDs, nomes, cores, ícones, capas e ordem contra o source.
3. Normalizar relações somente por allowlist fechada.
4. Converter `rota-da-erva-mate` em `rota-erva-mate` para os dois casos comprovados.
5. Preservar e retirar da lista canônica os 11 agrupamentos não pertencentes às seis rotas; nunca gerar novas rotas por slugificação textual.
6. Produzir dry-run com `wouldCreate`, `wouldUpdate`, `unchanged`, `invalidRouteIds`, `orphanRouteIds` e contagens por rota.
7. Comprovar idempotência executando o transformador duas vezes sobre fixture local.
8. Somente em bloco remoto futuro e autorizado, exportar estado anterior, aplicar batch limitado e repetir diff até zero.

### 10.3 Rollback e verificação

- Não remover `js/data/rotas.js`, `js/rotas-data.js` ou `js/locais-data.js` na V1.1.
- Manter datasource estático como fallback durante o rollout.
- Guardar snapshot sanitizado pré-migração e lista de documentos alterados.
- Rollback de dados restaura apenas os campos `routeIds[]` alterados e despublica/arquiva os seis documentos criados, sob autorização própria; não depende de hard delete.
- Verificar 6/6 rotas, 60 relações esperadas, zero ID desconhecido, nove casos multirrota originais e dois aliases corrigidos.

### 10.4 Adapter/backward compatibility

```text
backwardCompatibilityStrategy = DYNAMIC_DATASOURCE_WITH_STATIC_ERROR_FALLBACK
```

- Primeiro, executar leitura dinâmica em shadow mode e comparar com os seis objetos estáticos.
- Após 6/6 documentos válidos e publicados, ativar o datasource dinâmico.
- Sucesso com zero documentos é estado autoritativo; fallback ocorre somente em erro/timeout/permissão, não em resultado vazio.
- O adapter converte o documento dinâmico para a forma atual (`nome`, `categoria`, `descricao`, `imagem`, `galeria`, `cor`, `icone`, `tags`) para reduzir alterações no mapa.
- O adapter de empreendimentos deve passar `relationships.routeIds`; hoje ele os omite.
- As fontes estáticas permanecem como fallback até uma rodada posterior de retirada explicitamente aprovada.

## 11. Contrato futuro de Rules

Nenhuma Rule foi alterada neste discovery. O delta futuro mínimo é:

```text
match /rotas/{routeId}
  public/anonymous: get/list somente quando resource.data.status == "published"
  active admin: get/list/create/update
  moderator: sem write e sem leitura de drafts
  user: sem write e sem leitura de drafts
  inactive/malformed profile: deny
  delete: deny
  unknown paths: fallback deny existente
```

Validações:

- allowlist exata de campos;
- `id == routeId` e imutável;
- `createdAt`/`createdBy` imutáveis;
- `updatedAt` timestamp e `updatedBy == request.auth.uid`;
- status somente `draft`, `published`, `archived`;
- tipos e limites de strings/lista;
- `displayOrder` inteiro em faixa limitada;
- cover com allowlist `mediaId`, `url`, `path`, `alt`;
- para `published`: slug, nome, categoria, descrição, capa, cor e ícone não vazios; `publishedAt` timestamp e `publishedBy` igual ao admin;
- mudança de slug negada após a primeira publicação;
- documentos malformados falham fechados;
- queries públicas usam `where("status", "==", "published")`.

Storage não precisa de Rule nova: reutilizar `cms-media`. A implementação deve estender proteção de referência antes de qualquer exclusão pela biblioteca.

## 12. Admin V1.1 e UX

### 12.1 Lista

- nome e identidade visual;
- status;
- número total de empreendimentos associados e, opcionalmente, quantos estão publicados;
- `displayOrder`;
- ações: editar, preview, publicar/despublicar, arquivar;
- loading, vazio e erro pelos padrões atuais do Admin.

### 12.2 Editor

- nome;
- slug, editável somente em draft anterior à primeira publicação;
- categoria;
- descrição;
- cor e ícone porque ambos já existem no portal;
- capa escolhida da biblioteca de mídia;
- status/publicação;
- `displayOrder` dos cards;
- associação de locais;
- preview antes de publicar.

Não incluir galeria de rota, geometria, coordenadas, ordem de visita, SEO individual ou novo framework.

### 12.3 Associação de locais

UX mínima recomendada:

- campo de busca por nome/endereço/categoria;
- checkboxes multi-select;
- chips de categoria e status para contexto;
- contador selecionados/total;
- aviso quando o empreendimento é draft/archived;
- sem mapa e sem drag-and-drop;
- salvar somente diferenças de `routeIds[]` em batch.

Casos com múltiplas rotas devem continuar permitidos. O editor de uma rota não remove associações a outras rotas.

### 12.4 Mídia

- botão “Selecionar da biblioteca” usando `media_library`;
- preview com alt text;
- upload continua pelo fluxo existente para `cms-media` quando necessário;
- salvar `mediaId`, URL, path e alt no documento da rota;
- incluir rotas no mapa de uso antes de habilitar exclusão de mídia referenciada.

### 12.5 Acessibilidade

- labels explícitos e mensagens de erro associadas;
- navegação completa por teclado;
- foco inicial, trap e devolução de foco no modal atual;
- cor nunca como único indicador;
- estados de loading, vazio e erro anunciáveis;
- tabela/cards responsivos no mobile;
- sem nova biblioteca.

## 13. Mudanças necessárias no portal público

Escopo mínimo da integração:

1. datasource de rotas published com adapter para a forma estática atual;
2. `routeIds[]` preservados no adapter de empreendimentos;
3. filtro por rota usando ID/slug estável, sem nome como chave;
4. rota selecionada mostra apenas locais associados e preserva casos multirrota;
5. HOME usa contagem published e mantém fallback apenas em erro;
6. busca é atualizada depois da carga dinâmica e aponta para o filtro específico;
7. detalhe de local pode sobrepor nomes canônicos das rotas, preservando tags legadas não canônicas;
8. `rotas-completas` continua ponte;
9. `mapa-completo` deve ser adaptado ou convertido em ponte após o cutover para não manter uma segunda fonte ativa;
10. galeria de Fluviópolis permanece estática e fora do módulo Rotas V1.1.

Não haverá página pública individual de rota na V1.1. O filtro permanece sob `/mapa-turistico`, com query param estável, por exemplo `?grupo=roteiros&rota=<slug>`. A canonical continua sendo `/mapa-turistico`; não adicionar JSON-LD, canonical individual, Open Graph por rota ou entradas de sitemap.

## 14. Matriz de testes futura

| Área | Cobertura mínima |
| --- | --- |
| Rules anônimo | published get/list com query permitidos; draft/archived e query ampla negados |
| Rules admin | create/update/publish/archive válidos; ID/createdAt/createdBy imutáveis; delete negado |
| Rules moderator/user | writes negados; drafts negados |
| Rules perfil | `ativo != true`, role ausente/inválida e documento de usuário malformado negados |
| Rules schema | campos extras, tipos errados, status inválido, cover malformada e publicação incompleta negados |
| fallback | collection desconhecida continua deny |
| CRUD | criar draft, editar, validar, publicar, despublicar, arquivar e preview |
| slug | geração, normalização, colisão e bloqueio após primeira publicação |
| associação | pesquisa, multi-select, adição/remoção diferencial, nove multirrota e batch atômico |
| integridade | unknown/orphan IDs detectados; textos legados não viram rota |
| ordem | `displayOrder` dos cards; nenhum teste de sequência de pontos |
| delete | hard delete indisponível em UI e negado por Rules |
| mídia | picker, alt, preview, upload existente e bloqueio/aviso de mídia em uso |
| migração | 6 rotas, 58 relações exatas, 2 aliases corrigidos, 11 valores excluídos da allowlist, resultado estimado 60, idempotência |
| adapter | Firestore success/empty/error/timeout; fallback somente em erro; shape compatível |
| portal | HOME, busca, mapa, filtro de rota, multirrota, modal, local, nav e bridges |
| regressão | mapa sem markers perdidos, local canonical, galeria estática e páginas noindex |
| acessibilidade | labels, teclado, foco, modal, contraste, mobile e mensagens de estado |

## 15. Risk register

### P0

- Rule futura permitir write público ou de user/moderator em `rotas` ou `cms_establishments`. Mitigação: allowlist fail-closed, `isAdmin()` atual e Emulator por papel/estado.

### P1

- trocar nomes/chaves implícitas sem adapter e sumir com markers/associações;
- perder as nove relações secundárias porque o adapter atual ignora `routes[]`;
- migrar por slugificação genérica e criar “rotas” falsas para Centro, Eventos Anuais ou Turismo de Fé;
- cutover parcial entre `rotas`, empreendimentos e portal produzir rotas vazias ou pontos ausentes;
- hard delete/cascade romper referências;
- fallback estático mascarar resultado vazio autoritativo ou conteúdo despublicado.

### P2

- slug duplicado, que Rules não conseguem garantir globalmente;
- excluir mídia da biblioteca sem detectar uso por rota;
- HOME e busca ficarem com contagem/índice anterior por carga assíncrona;
- `mapa-completo.html`, `local.html` e galeria divergirem do datasource dinâmico;
- coordenadas aproximadas serem interpretadas como traçado preciso de rota.

### P3

- confusão editorial entre rota temática e os seis roteiros ordenados do módulo IA suspenso;
- ordem implícita dos cards mudar se `displayOrder` empatar;
- ausência de página individual limitar compartilhamento rico, decisão consciente da V1.1;
- emojis de ícone variarem entre plataformas; nunca devem ser o único indicador.

## 16. Escopo exato recomendado para V1.1

Incluído:

- seis rotas atuais e criação futura em draft;
- documento por rota com identidade, conteúdo, visual, capa, status e ordem dos cards;
- relacionamento por `cms_establishments.relationships.routeIds[]`;
- lista/editor/preview/publicação/arquivamento;
- seleção simples de locais;
- media library/cms-media existentes;
- Rules e testes Emulator;
- migração local allowlist e dry-run;
- adapter público com fallback de erro;
- filtro público por rota e regressão do portal.

Excluído:

- hard delete;
- geometry/polyline/GeoJSON;
- ordem de visita e drag-and-drop de pontos;
- página pública individual e SEO próprio;
- galeria de rota além da capa;
- reescrita React/Vue ou nova biblioteca;
- incorporação do roteiro IA;
- mudança de privilégio de moderator;
- retirada imediata das fontes estáticas.

## 17. Blocos de implementação

### BLOCO 1 — `POST-V1-ROTAS-V1.1-DATA-MODEL-RULES-AND-EMULATOR`

- implementar schema mínimo de `rotas`;
- implementar Rules localmente e testes no Emulator;
- implementar transformador/dry-run allowlist para 6 rotas e relações;
- fixtures com 58 relações exatas, 2 aliases e 11 agrupamentos não canônicos;
- validar idempotência;
- zero produção, zero deploy e zero migração real.

### BLOCO 2 — `POST-V1-ROTAS-V1.1-ADMIN-CRUD`

- substituir somente o placeholder por módulo real;
- lista, editor, preview, status e archive;
- associação checkbox/search em `cms_establishments.routeIds[]`;
- picker da biblioteca e proteção de mídia em uso;
- testes locais/Admin.

### BLOCO 3 — `POST-V1-ROTAS-V1.1-PUBLIC-ADAPTER-MIGRATION-AND-QA`

- adapter published + fallback por erro;
- HOME, busca, mapa, filtro por rota e detalhe de local;
- tratamento do mapa legado e bridges;
- dry-run final, migração e deploy somente sob autorizações remotas explícitas próprias;
- regressão pública e rollback verificado.

## 18. Gates de encerramento do discovery (histórico)

```text
zero source funcional modificado = true
zero Firestore Rules modificadas = true
zero Storage Rules modificadas = true
zero dados reais = true
zero credenciais = true
zero Firestore remoto = true
zero Storage remoto = true
zero deploy = true
zero rotas inventadas = true
NEXT_BLOCK_READY = true
NEXT_BLOCK = POST-V1-ROTAS-V1.1-DATA-MODEL-RULES-AND-EMULATOR
```

O texto das seções 1 a 18 preserva o discovery histórico e suas fronteiras originais. O resultado vigente do bloco local autorizado está registrado a seguir; migração, acesso a produção, deploy e início automático do próximo bloco continuam proibidos.

## 18.1 Resultado final do Bloco 2 — Admin CRUD

Em `2026-08-20`, o CRUD de Rotas foi implementado somente na branch `feature/rotas-v1.1-admin-crud`, derivada de `cc170862d4378229a7485f788b31308174032a6d`; `main` não foi alterada. O módulo reutiliza o registro, UI e modal existentes do Admin e inclui lista/filtros, criação em rascunho, edição, preview, publicação, despublicação, arquivamento, validação local e ausência de hard delete.

As relações permanecem exclusivamente em `cms_establishments.relationships.routeIds[]`. O save calcula diff e usa `runTransaction` apenas para os documentos adicionados/removidos, preservando IDs secundários. A capa reutiliza `media_library` no shape mínimo `mediaId`, `url`, `path`, `alt`; a detecção de mídia em uso inclui `rotas.cover` por ID, path ou URL e bloqueia exclusão quando houver referência.

O alias `edit: openForm` corrigiu o Editar; guards estruturais e o caminho relacional estreito nas Rules corrigiram os blockers N:N mantendo autorização de admin ativo e malformed fail-closed. A regressão final aprovou testes Admin `8/8`, modelo/normalizador `29/29`, dry-run sanitizado e Rules `265/265` (Firestore `212`, Storage `24`), sem failures/skips, somente no projeto demo dos Emulators. O QA humano posterior confirmou `QA_LOCAL_ROTAS_PASS`, inclusive associação N:N, mídia e responsividade. **Classificação vigente: A — implementação local concluída; nenhuma produção, deploy, migração ou integração em `main`. O rollout permanece pendente.**

## 19. Resultado implementado do Bloco 1

### 19.1 Classificação e limites

**Classificação:** **A. ROTAS V1.1 DATA MODEL + RULES READY — SCHEMA FROZEN, NORMALIZATION DETERMINISTIC, N:N PRESERVED, FIRESTORE RULES TESTED LOCALLY, ZERO PRODUCTION ACCESS, ADMIN CRUD READY TO IMPLEMENT.**

O bloco alterou somente modelo/helper local, dry-run, testes, `firestore.rules`, integração npm e documentação. Não houve Firestore, Storage ou Auth de produção; não houve login Firebase, `gcloud`, IAM, ADC, deploy, migração, criação de documentos reais, alteração de source público ou substituição do placeholder Admin.

### 19.2 Schema final congelado

`rotas/{routeId}` usa todos os campos abaixo como obrigatórios; não há campos opcionais na V1.1:

```text
id, slug, name, category, description, color, icon,
status, displayOrder, cover, tags,
createdAt, createdBy, updatedAt, updatedBy,
publishedAt, publishedBy, archivedAt, archivedBy
```

- `id == document ID` e é imutável.
- `slug` começa igual ao ID, pode mudar enquanto `publishedAt == null` e torna-se imutável após a primeira publicação.
- `status`: `draft | published | archived`.
- Transições: `draft -> draft|published|archived`; `published -> published|draft|archived`; `archived -> archived`.
- `displayOrder` ordena somente cards; não existe ordem de pontos.
- `tags` foi mantido porque existe nas seis rotas editoriais e alimenta busca/classificação; a lista é limitada nas Rules e os elementos são validados no modelo local, respeitando a limitação da linguagem de Rules.
- `cover` contém exatamente `mediaId`, `url`, `path` e `alt`. O seed estático usa `url` local, `mediaId/path` vazios e `alt` igual ao nome; não duplica o objeto de `media_library`.
- Não existem `placeIds`, `geometry`, `coordinates` ou `orderedPlaceIds`.

### 19.3 Auditoria e publicação

- Create somente em `draft`, com `createdAt == updatedAt == request.time` e `createdBy == updatedBy == request.auth.uid`.
- Update preserva `createdAt/createdBy`, exige `updatedAt == request.time` e `updatedBy == request.auth.uid`.
- Primeira publicação materializa `publishedAt == request.time` e `publishedBy == request.auth.uid`; depois ambos são históricos e imutáveis, inclusive ao voltar para `draft`.
- Archive materializa `archivedAt/archivedBy`; `archived` é terminal.
- Hard delete é negado para todos.
- Leitura pública permite apenas `published`; query pública precisa incluir `where("status", "==", "published")`.
- Admin exige `role == admin && ativo == true`; moderator, user e anonymous não recebem write.

### 19.4 Normalização, aliases e seed

Implementação: `scripts/lib/rotas-v1.1-model.mjs` e `scripts/rotas-v1.1-normalize-dry-run.mjs`.

IDs canônicos, na ordem:

```text
sabores-memorias
rota-erva-mate
rota-polonesa
rota-das-aguas
caminhos-de-fluviopolis
rota-da-terra
```

Allowlist de aliases comprovados:

```text
sabores -> sabores-memorias
mate -> rota-erva-mate
polonesa -> rota-polonesa
aguas -> rota-das-aguas
fluviop -> caminhos-de-fluviopolis
terra -> rota-da-terra
rota-da-erva-mate -> rota-erva-mate
```

O dry-run deriva novamente do source e do preview local: 67 documentos inspecionados; 58 relações canônicas antes; 2 aliases normalizados; 60 relações canônicas depois; 51 documentos com rota canônica; 9 documentos multirrota; 11 agrupamentos não canônicos preservados; 0 duplicatas no preview corrente. A segunda passagem registra zero aliases e zero duplicatas adicionais, comprovando idempotência.

O seed gera deterministicamente seis payloads `draft` a partir de `js/data/rotas.js`, preservando nomes, categorias, descrições, cores, ícones, imagens, tags e ordem. O gerador recebe ator e timestamp como parâmetros; não executa write.

### 19.5 Contrato N:N de empreendimentos

`cms_establishments.relationships.routeIds[]` continua sendo a única relação. Não foi criado lookup dinâmico para `/rotas/{id}` nem hardcode dos seis IDs nas Rules.

Foi adicionado um caminho estreito de update para batches do módulo Rotas: somente `relationships`, `updatedAt` e `updatedBy` podem mudar; ID e auditoria de criação permanecem imutáveis; admin ativo e `request.time` são obrigatórios; o shape completo de `relationships` continua validado. Isso evita reavaliar o schema integral legado quando apenas a relação N:N muda.

As Rules garantem presença, tipo list e limite de 50, mas não iteram genericamente o tipo/unicidade de cada elemento e não comprovam existência referencial. Duplicatas são removidas pelo normalizador; IDs desconhecidos são tratados pelo modelo, Admin e migração allowlist.

### 19.6 Testes finais locais

```text
baseline legado = 169/169 PASS (145 Firestore + 24 Storage)
modelo/normalizador = 29/29 PASS
Rules Firestore final = 203/203 PASS
  legado = 145/145 PASS
  Rotas = 50/50 PASS
  relationships.routeIds = 8/8 PASS no Emulator
Storage final = 24/24 PASS
total final = 256/256 PASS
failures = 0
skipped = 0
```

Os oito casos de relacionamento também possuem espelho local puro, cobrindo array vazio, uma rota, duas rotas, duplicatas, não-list, null, ausente e unknown routeId. Storage Rules permaneceram byte a byte sem alteração.

### 19.7 Próximo bloco

```text
NEXT_BLOCK_READY = true
NEXT_BLOCK = POST-V1-ROTAS-V1.1-ADMIN-CRUD
```

O próximo bloco não foi iniciado. Antes de habilitar seleção/remoção de capa, ele deve incluir Rotas na detecção de mídia em uso.
