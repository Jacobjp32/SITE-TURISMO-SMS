# Bloco CMS-5A - Diagnostico para leitura publica Firestore com fallback estatico

**Data:** 2026-07-08  
**Projeto:** SITE-TURISMO-SMS-mainv2  
**Escopo:** diagnostico e plano para futura leitura publica de `cms_establishments`, sem implementar a troca, sem alterar o site publico e sem alterar rules/cache/config.

## 1. Pre-check

- `git status --short --untracked-files=all`: worktree limpo antes de iniciar.
- O Git exibiu apenas aviso de permissao ao acessar `C:\Users\jacob/.config/git/ignore`.
- Nenhum commit foi feito.
- Nenhum `git reset` ou `git restore` foi executado.
- Nenhum seed, apply, live-diff remoto, inventario remoto, deploy ou alteracao real no Firestore/Storage foi executado.

## 2. Arquivos inspecionados

- `docs/bloco-cms-1-diagnostico-admin-cms.md`
- `docs/bloco-cms-2a-contrato-empreendimentos.md`
- `docs/schemas/cms-establishments.schema.md`
- `docs/bloco-cms-2f-seed-real-empreendimentos.md`
- `docs/bloco-cms-3-aplicar-solicitacoes-catalogo.md`
- `docs/bloco-cms-4a-contrato-midia-empreendimentos.md`
- `docs/bloco-cms-4d-gestao-galeria-catalogo.md`
- `docs/bloco-cms-4e-inventario-midias-orfas.md`
- `js/locais-data.js`
- `js/establishment-catalog.js`
- `js/mapa-turistico.js`
- `js/rotas-data.js`
- `js/data/eventos.js`
- `js/data/hospedagens.js`
- `js/data/informacoes-essenciais.js`
- `js/data/pontos-turisticos.js`
- `js/data/restaurantes.js`
- `js/data/rotas.js`
- `js/data/turismo-data-adapter.js`
- `js/data/turismo-data.js`
- `local.html`
- `mapa-turistico.html`
- `sabores.html`
- `onde-ficar.html`
- `o-que-fazer.html`
- `eventos.html`
- `index.html`
- `js/search-index.js`
- `firestore.rules`
- `storage.rules`
- `config.js`
- `js/site-meta.js`
- `sw.js`
- `sitemap.xml`

Tambem foram buscados os termos: `locaisData`, `TURISMO_DATA`, `TURISMO_PONTOS`, `restaurantes`, `hospedagens`, `rotas`, `establishment-catalog`, `cms_establishments`, `mapa-turistico`, `local?id`, `search-index`, `categoria`, `grupo`, `media.mainImage`, `media.gallery`, `status`, `published`, `draft`, `archived`, `Firestore`, `fallback`, `cache`, `service worker`, `indexedDB`, `localStorage`, `dynamic` e `static`.

## 3. Arquitetura publica atual

O site publico ainda usa dados estaticos para empreendimentos, pontos, hospedagens, gastronomia e rotas. A collection `cms_establishments` ja existe e foi populada com 67 registros, mas permanece como catalogo interno/admin. O publico nao le `cms_establishments`.

O snapshot publico principal e montado assim:

1. `js/locais-data.js` define `window.locaisData` para fichas em `/local?id=...`.
2. `js/rotas-data.js` define `window.ROTAS_LEGADO_ROUTE_INFO` e `window.ROTAS_LEGADO_ESTABLISHMENTS`.
3. `js/data/*.js` define listas por dominio: pontos, rotas, hospedagens, restaurantes, eventos e informacoes essenciais.
4. `js/data/turismo-data-adapter.js` mescla `locaisData` e `rotas-data.js` no snapshot.
5. `js/data/turismo-data.js` publica `window.TURISMO_DATA`.
6. `js/mapa-turistico.js` renderiza o mapa a partir de `window.TURISMO_DATA`.
7. `js/search-index.js` cria `window.TURISMO_SEARCH_INDEX` a partir de `window.TURISMO_DATA` ou, se ele nao existir, das colecoes individuais.

Contagem local avaliada:

| Fonte | Total | Observacao |
| --- | ---: | --- |
| `window.locaisData` | 15 | Fichas dedicadas em `/local?id=slug`. |
| `window.ROTAS_LEGADO_ESTABLISHMENTS` | 47 | Empreendimentos/pontos legados de rotas. |
| `window.TURISMO_PONTOS` | 8 | Pontos turisticos principais. |
| `window.TURISMO_ROTAS` | 6 | Rotas tematicas, nao empreendimentos individuais. |
| `window.TURISMO_HOSPEDAGENS` | 5 | Hospedagem publica. |
| `window.TURISMO_RESTAURANTES` | 4 | Gastronomia publica. |
| `window.TURISMO_EVENTOS` | 8 | Eventos estaticos para mapa/busca. |
| `window.TURISMO_INFORMACOES_ESSENCIAIS` | 5 | Servicos/informacoes de apoio. |
| `window.TURISMO_DATA` final | 81 | Snapshot apos merge do adapter. |

O adapter registrou 45 itens legados adicionados e 17 itens mesclados.

## 4. Consumo publico atual por area

| Area | Arquivos | Fonte usada | Formato | Campos obrigatorios na pratica | Fallback atual | Riscos |
| --- | --- | --- | --- | --- | --- | --- |
| Mapa turistico | `mapa-turistico.html`, `js/mapa-turistico.js`, `js/data/*.js`, `js/locais-data.js`, `js/rotas-data.js` | `window.TURISMO_DATA` | arrays `pontos`, `rotas`, `hospedagens`, `restaurantes`, `eventos`, `informacoesEssenciais` | `id`, `nome`, `categoria`, `descricao`; coordenadas para marcador; `imagem` opcional | dados estaticos carregados por script; imagem fallback visual quando `imagem` falta | Se Firestore substituir o snapshot sem normalizacao, filtros `categoria/grupo`, links e marcadores podem quebrar. |
| Ficha local | `local.html`, `js/locais-data.js` | `window.locaisData[id]` | objeto keyed por slug | `id`, `nome`, `descricao`; idealmente `imagem`, `categoria`; `lat/lng` opcionais | estado `noindex` se id ausente/inexistente; imagem fallback `FOTO_GERAL` | Fichas existem so para slugs em `locaisData`; migrar sem preservar `/local?id=slug` quebra SEO e links de eventos/home. |
| Busca interna | `index.html`, `js/search-index.js`, `js/search.js` | `window.TURISMO_DATA` ou colecoes individuais | lista `TURISMO_SEARCH_INDEX` | `nome`, `descricao`, `url`, `tags`, `categoria` | entradas fixas + dados estaticos | Duplicidade se CMS e estaticos entrarem juntos sem dedupe por id/url/nome. |
| Sabores | `sabores.html` | HTML estatico + `produtoresData` inline; atalhos para secoes | cards e dados inline | texto HTML, `data-categoria`, nome/endereco/telefone/horario em produtores | nao depende de `TURISMO_RESTAURANTES` hoje | Ha divergencia possivel entre pagina editorial estatica e dados CMS de restaurantes. |
| Onde ficar | `onde-ficar.html` | HTML estatico | cards `.hotel-card` com `data-category` | nome, descricao, links/maps, categoria visual | filtro local por DOM | Nao consome `TURISMO_HOSPEDAGENS`; migracao deve evitar duas listas paralelas conflitantes. |
| O que fazer | `o-que-fazer.html` | HTML estatico/ponte | cards de atalhos para mapa | links para `/mapa-turistico` com `categoria/grupo` | sem dependencia de catalogo | Deve continuar como pagina de compatibilidade; nao precisa migrar cedo. |
| Rotas | `js/data/rotas.js`, `js/rotas-data.js`, `mapa-turistico.html` | rotas tematicas + estabelecimentos legados | rotas em `TURISMO_ROTAS`; empreendimentos em `ROTAS_LEGADO_ESTABLISHMENTS` | rota: `id`, `nome`, `categoria`; legado: `id`, `name`, `desc`, `route`, `lat/lng` | scripts estaticos | Rotas nao sao equivalentes 1:1 a `cms_establishments`; migrar junto aumentaria risco. |
| Eventos relacionados | `eventos.html`, `index.html`, `js/mapa-turistico.js`, `js/data/eventos.js` | estatico + `eventos_aprovados` Firestore | eventos normalizados | `nome/titulo`, `data`, `categoria`, `status/publicado`, `localId/localUrl` | JSON/JS estatico primeiro; Firestore enriquece quando disponivel | Ja ha padrao hibrido, mas ele e para `eventos_aprovados`, nao para empreendimentos. |
| Cards de home | `index.html`, `js/site-stats.js`, `js/search-index.js` | HTML estatico + `window.TURISMO_DATA` para stats/search; eventos hibridos | cards hardcoded e stats do snapshot | links atuais, inclusive `/local?id=...` e `/mapa-turistico?categoria/grupo` | home continua utilizavel sem Firestore | Se o CMS alimentar cards destacados no futuro, precisa regra propria de featured/priority e fallback. |

## 5. Campos estaticos atuais

### `js/locais-data.js`

Campos encontrados:

- `id`, `nome`, `categoria`, `subtitulo`, `badge`;
- `descricao`, `historia`, `acessibilidade`;
- `imagem`, `galeria`;
- `endereco`, `lat`, `lng`, `mapsUrl`;
- `telefone`, `horario`, `site`, `instagram`, `facebook`;
- `rota`.

Uso critico: `/local?id=slug`, SEO dinamico, OG image, mapa Leaflet local, galeria, relacionados.

### `js/data/restaurantes.js`

Campos encontrados:

- `id`, `nome`, `categoria`, `descricao`, `descricaoLonga`;
- `imagem`, `galeria`, `url`;
- `telefone`, `localizacao`, `horario`, `instagram`;
- `coordenadas`, `tags`.

### `js/data/hospedagens.js`

Campos encontrados:

- `id`, `nome`, `categoria`, `descricao`;
- `imagem`, `galeria`, `url`;
- `telefone`, `localizacao`, `coordenadas`, `tags`.

### `js/data/pontos-turisticos.js`

Campos encontrados:

- `id`, `nome`, `categoria`, `descricao`;
- `imagem`, `galeria`, `url`;
- `localizacao`, `endereco`, `mapsUrl`, `coordenadas`, `tags`.

### `js/data/rotas.js`

Campos encontrados:

- `id`, `nome`, `categoria`, `descricao`;
- `imagem`, `galeria`, `url`;
- `icone`, `cor`, `tags`.

### `js/rotas-data.js`

Campos encontrados:

- `id`, `name`, `subtitle`, `desc`;
- `phone`, `social`, `site`, `location`, `hours`;
- `mapsUrl`, `lat`, `lng`, `coordStatus`, `coordNote`;
- `route`, `routes`, `imagem`, `galeria`, `videoUrl`.

## 6. Correspondencia com `cms_establishments`

O schema documentado de `cms_establishments` organiza o dado em grupos: raiz, `content`, `contact`, `location`, `media`, `relationships`, `display`, `seo`, `publishing`, `review` e `source`.

| Estatico atual | `cms_establishments` | Observacao |
| --- | --- | --- |
| `id` | `id`, `slug` | Deve preservar slug/doc id atual. |
| `nome` / `name` | `name` | Nome exibido. |
| `categoria` | `categoryId`, `categoryLabel`, `source.originalCategory` | Exige mapeamento controlado, porque hoje ha labels livres. |
| `descricao` / `desc` | `content.summary` ou `content.description` | Cards usam resumo; ficha usa descricao principal. |
| `descricaoLonga` / `historia` | `content.longDescription` ou campo editorial futuro | Nem todo conteudo estatico tem equivalente direto. |
| `subtitulo`, `badge` | sem campo dedicado atual | Pode virar `content.summary`, `display` ou permanecer estatico ate decisao editorial. |
| `imagem` | `media.mainImage.url` | Precisa `path/source/alt/caption/credit` quando vier do CMS. |
| `galeria` | `media.gallery[]` | CMS aceita metadados editoriais; publico deve filtrar `status == active` e ignorar `removed`. |
| `telefone` / `phone` | `contact.phone` | Equivalente direto. |
| `whatsapp` | `contact.whatsapp` | Nao aparece em todas as fontes estaticas. |
| `instagram` / `social` | `contact.instagram` | `social` legado precisa normalizacao. |
| `site` | `contact.website` | Equivalente. |
| `endereco` / `localizacao` / `location` | `location.address` | Labels e granularidade variam. |
| `coordenadas.lat/lng` ou `lat/lng` | `location.coordinates.lat/lng` | Precisa preservar null e status de coordenada. |
| `mapsUrl` | `location.mapsUrl` | Equivalente. |
| `horario` / `hours` | `content.openingHours` | Equivalente. |
| `rota`, `route`, `routes` | `relationships.routeIds`, `relationships.legacyRoute`, `legacyRouteName` | Requer mapeamento de ids de rota, nao apenas label. |
| `tags` | `content.tags` | Equivalente. |
| `url`, `localUrl` | `seo.canonicalPath` ou URL derivada | No primeiro release, nao criar URL nova. |
| nenhum | `status` | Novo campo editorial: `draft`, `published`, `archived`. |
| nenhum | `display.featured`, `priority`, `mapVisible`, `claimable` | Campo CMS sem equivalente publico direto. |
| nenhum | `publishing.*`, `review.*`, `source.*` | Auditoria interna, nao deve vazar como UI publica. |

## 7. Diferencas relevantes

### Categoria

O publico usa labels como `Gastronomia`, `Hospedagem`, `História`, `Cultura`, `Natureza`, `Patrimônio Histórico`, rotas tematicas e aliases de URL. O CMS usa `categoryId` controlado e `categoryLabel` exibivel. A leitura futura precisa mapear `categoryId/categoryLabel` para os filtros atuais (`history`, `culture`, `nature`, `gastronomy`, `lodging`, `events`, `services`) sem mudar os links `?categoria=` existentes.

### Midia

Estatico: `imagem` e `galeria[]` sao strings simples.  
CMS: `media.mainImage` e `media.gallery[]` sao objetos com `url`, `path`, `alt`, `caption`, `credit`, `source`, `status`, `position` e metadados editoriais ate CMS-4D.

Leitura publica futura deve:

- usar `media.mainImage.url` apenas se existir;
- usar `media.gallery[]` apenas com `status` ausente ou `active`;
- ignorar `removed`;
- cair para imagem estatica quando URL CMS faltar;
- usar `alt` quando houver e fallback para `name`.

### Coordenadas

Estatico mistura `coordenadas: { lat, lng }` e `lat/lng` soltos. O CMS usa `location.coordinates`. A camada publica futura deve converter para o formato esperado pelo mapa e manter itens sem coordenadas como lista, sem marcador.

### Status

Estatico nao tem status de publicacao por empreendimento. O CMS usa `draft`, `published`, `archived`.

Regra planejada:

- `published`: pode aparecer publicamente.
- `draft`: nunca aparece publicamente.
- `archived`: nunca aparece publicamente.
- empreendedor nao publica diretamente.
- Admin deve ter acao explicita de publicar/despublicar em bloco futuro.

### Slug/id

O publico depende de `id` estavel para `/local?id=slug`, aliases em `locaisAliases`, filtros do mapa e links da home/eventos. O CMS deve preservar `id/slug` atual e nao criar slugs novos no primeiro ciclo publico.

## 8. Rules atuais e rules futuras

Estado local atual em `firestore.rules`:

```js
match /cms_establishments/{establishmentId} {
  allow read: if isAdmin();
  allow create: if isValidEstablishmentCreate(establishmentId);
  allow update: if isValidEstablishmentUpdate();
  allow delete: if isAdmin() && isDeletableEstablishmentStatus(resource.data.status);
}
```

Conclusao: hoje a leitura publica de `cms_establishments` **nao esta liberada**, nem para `status == "published"`. Isso esta correto para o estado atual, porque o site publico ainda nao usa essa collection.

Regra futura segura, conceitual:

```js
match /cms_establishments/{establishmentId} {
  allow read: if isAdmin() || resource.data.status == 'published';
  allow create: if isValidEstablishmentCreate(establishmentId);
  allow update: if isValidEstablishmentUpdate();
  allow delete: if false;
}
```

Observacoes obrigatorias para implementacao futura:

- Firestore Rules nao filtram resultados; elas autorizam ou negam a query.
- Query publica precisa incluir `where("status", "==", "published")`.
- Se a query publica tentar ler todos os documentos, ela deve falhar quando houver `draft` ou `archived`.
- Admin pode ler todos.
- Empreendedor nao deve escrever em `cms_establishments`.
- Se delete definitivo continuar permitido para `draft/archived` no Admin, isso deve ser decisao separada; para leitura publica, arquivamento e mais seguro.
- As rules publicadas no Firebase podem divergir do arquivo local; bloco futuro precisa confirmar publicacao real.

Estado local atual em `storage.rules`:

- `cms-media/{uid}/{allFiles=**}` tem leitura publica.
- Escrita em `cms-media` exige admin do proprio `{uid}` e imagem valida.
- `submissions/establishment-updates/...` e legivel por dono/staff e deve continuar como evidencia, nao como midia publica final.

## 9. Modelo de leitura publica futura

Opcao recomendada para primeiro release publico: **adapter publico somente leitura com fallback estatico, carregando estatico primeiro e tentando Firestore depois**.

Fluxo recomendado:

1. Renderizar com dados estaticos atuais.
2. Inicializar adapter publico de `cms_establishments`.
3. Consultar `cms_establishments where status == "published"`.
4. Normalizar documentos CMS para o formato `TURISMO_DATA` atual.
5. Validar se o resultado tem quantidade minima e campos essenciais.
6. Se Firestore falhar, vier vazio, demorar demais ou retornar payload invalido, manter dados estaticos.
7. Se Firestore vier valido, atualizar somente a area integrada no bloco correspondente.
8. Nunca deixar pagina publica vazia por falha de Firestore.

### Alternativas avaliadas

| Opcao | Vantagens | Riscos | Recomendacao |
| --- | --- | --- | --- |
| Firestore direto no browser | Conteudo atualiza sem build; aproveita rules; menos pipeline. | Custo por leitura, latencia, App Check/CSP, queries precisam respeitar rules, risco de tela vazia se mal implementado. | Usar so com fallback forte e rollout por pagina. |
| JSON estatico gerado a partir do CMS | Performance, SEO previsivel, menor custo de leitura, melhor cache/CDN. | Exige pipeline/rotina de geracao; publicacao deixa de ser imediata; precisa controle de deploy/cache. | Melhor alvo de maturidade apos validar o CMS. |
| Hibrido com snapshot/cache local | Render estatico imediato, atualiza com CMS e guarda ultimo payload valido. | Complexidade de TTL, invalidacao e risco de dados obsoletos. | Bom para CMS-5B/5C se limitado e auditavel. |

Recomendacao pratica: CMS-5B deve criar o adapter e uma pagina/dev mode de teste. CMS-5C pode integrar mapa com Firestore + fallback. Um snapshot JSON gerado pode ser planejado depois, quando o fluxo editorial estiver estavel.

## 10. Fallback por pagina

| Area | Migrar em | Fallback estatico | Falha Firestore | Duplicidade |
| --- | --- | --- | --- | --- |
| Mapa turistico | CMS-5C | `window.TURISMO_DATA` atual | manter snapshot estatico ja renderizado; logar aviso; nao bloquear mapa | Dedupe por `id/slug`, depois por nome normalizado + coordenadas/mapsUrl. |
| `local.html` | CMS-5D | `window.locaisData[id]` | manter ficha estatica; se id nao existir, manter erro/noindex atual | Nao renderizar CMS e estatico juntos; resolver por slug exato. |
| Busca | CMS-5E | `TURISMO_SEARCH_INDEX` atual | manter indice estatico | Gerar indice de uma unica fonte ativa; nao concatenar sem dedupe. |
| Sabores | CMS-5E ou depois | HTML estatico atual e mapa por `?categoria=Gastronomia` | manter secoes atuais | Separar pagina editorial de lista dinamica; evitar duplicar restaurantes. |
| Onde ficar | CMS-5E ou depois | HTML estatico atual e mapa por `?categoria=Hospedagem` | manter cards atuais | Migrar so depois de validar hospedagens no mapa. |
| O que fazer | Depois | HTML ponte atual | sem acao | Manter como compatibilidade; depende mais do mapa do que do CMS. |
| Rotas | Depois de CMS-5E | `TURISMO_ROTAS` + `ROTAS_LEGADO_ESTABLISHMENTS` | manter rotas estaticas | Nao misturar rota tematica com empreendimento sem `relationships.routeIds`. |
| Home cards/stats | Depois do mapa/local | HTML estatico + `site-stats` atual | manter home atual | Cards destacados exigem `display.featured/priority` curados. |

## 11. Cache e performance

Plano recomendado:

- Cache em memoria por carregamento de pagina para evitar consultas repetidas.
- Timeout curto para Firestore publico; se exceder, manter estatico.
- Render estatico primeiro, atualizar depois quando seguro.
- `localStorage` pode guardar o ultimo snapshot valido, mas so em CMS-5B/5C se houver:
  - chave versionada;
  - TTL curto, por exemplo 6h a 24h;
  - validacao de schema antes de usar;
  - fallback para estatico se parse falhar.
- IndexedDB nao e necessario no primeiro ciclo; aumenta complexidade.
- Service worker nao deve precachear resposta Firestore.
- `sw.js` hoje evita cachear APIs externas/Firebase, navegacoes, JSON e HTML; manter isso ate haver estrategia explicita.
- Evitar travar renderizacao: adapter publico deve ser assicrono e nao bloquear o primeiro paint.
- Evitar tela vazia: nenhum container deve depender exclusivamente da promessa Firestore.

Riscos:

- Leitura direta por visitante pode gerar custo e latencia.
- Query sem `where("status", "==", "published")` deve falhar pelas rules futuras.
- Se App Check falhar, a pagina deve continuar estatica.
- Cache local pode exibir conteudo despublicado se TTL for longo demais.
- Atualizar `sw.js` sem necessidade pode prender bundle antigo; nao fazer neste bloco.

## 12. SEO e URLs

Plano:

- Manter URLs atuais.
- Manter `/local?id=slug`.
- Nao criar slugs novos agora.
- Nao mudar canonical neste bloco.
- Nao mudar `sitemap.xml` neste bloco.
- `sitemap.xml` so deve mudar quando o conteudo publico realmente passar a depender do CMS e houver politica de indexacao.
- `local.html` ja define canonical dinamico por id estatico; CMS-5D deve preservar esse comportamento.
- Imagens do CMS nao devem entrar em OG/SEO antes da publicacao real e QA visual.
- `draft` e `archived` nunca devem gerar canonical, sitemap ou cards publicos.

Riscos:

- Trocar slug/id quebra links antigos, home, eventos vinculados e busca.
- Conteudo CMS parcial pode causar paginas com meta vazia.
- URLs limpas novas exigiriam bloco separado de roteamento/sitemap/canonical.

## 13. Midia publica futura

Campos previstos:

- `media.mainImage.url`
- `media.mainImage.alt`
- `media.mainImage.caption`
- `media.mainImage.credit`
- `media.gallery[].url`
- `media.gallery[].alt`
- `media.gallery[].caption`
- `media.gallery[].credit`
- `media.gallery[].status`
- `media.gallery[].position`

Regras de uso publico:

- Usar `media.mainImage.url` apenas quando status do empreendimento for `published` e a URL existir.
- Fallback para `imagem` estatica quando `media.mainImage.url` faltar ou falhar.
- Usar `alt` do CMS quando preenchido; fallback para nome do local.
- Usar galeria somente com itens `active` ou sem status legado.
- Ignorar itens `removed`.
- Ordenar galeria por `position`.
- Nao usar imagens de `submissions/...` diretamente como asset publico final.
- Preferir `cms-media/...` para midia publicada, porque a leitura publica ja e prevista por Storage Rules.
- Nao quebrar se URL faltar: card/mapa deve mostrar placeholder/fallback.
- Credito/caption podem aparecer em ficha/galeria futura, mas nao devem ser obrigatorios para renderizar o mapa.

Pendencia mantida: **CMS-4E-EXEC remoto de midias** ainda precisa executar inventario remoto somente leitura para confirmar objetos reais em Storage, referencias quebradas e possiveis orfaos antes de qualquer limpeza ou publicacao visual baseada no CMS.

## 14. Sequencia recomendada CMS-5B em diante

### CMS-5B - adapter publico somente leitura

- Criar adapter publico para `cms_establishments`.
- Normalizar CMS para o formato atual de `TURISMO_DATA`.
- Exigir `where("status", "==", "published")`.
- Testar em pagina/dev mode ou modo debug.
- Nao ligar ainda as paginas principais.
- Validar fallback vazio/falha/permission-denied.

### CMS-5C - mapa turistico

- Integrar `mapa-turistico` com Firestore + fallback estatico.
- Renderizar estatico primeiro.
- Atualizar mapa/lista apenas quando payload CMS for valido.
- Preservar `?categoria=` e `?grupo=`.
- Comparar contagens, coordenadas e links.

### CMS-5D - `local.html`

- Resolver `/local?id=slug` primeiro no CMS publicado.
- Se CMS falhar ou slug nao existir, usar `window.locaisData`.
- Preservar canonical atual.
- Nao indexar slug inexistente.

### CMS-5E - busca, sabores, onde ficar, o que fazer

- Atualizar busca para usar uma unica fonte ativa.
- Avaliar sabores e onde-ficar depois de mapa/local.
- Manter o que-fazer como ponte, salvo decisao editorial posterior.

### CMS-5F - publicar/despublicar via Admin

- Criar controle explicito de `draft/published/archived`.
- Registrar `publishing.publishedAt`, `publishedBy`, `archivedAt`, `archivedBy`.
- Nenhum empreendedor publica diretamente.
- Validar rules publicadas e UI autenticada.

Ajuste recomendado: manter rotas como bloco posterior, porque `TURISMO_ROTAS` representa roteiros/experiencias, enquanto `cms_establishments` representa locais/empreendimentos. A ligacao deve passar por `relationships.routeIds`.

## 15. Datas publicas e arquivos verificados

Verificados e nao alterados:

- `sitemap.xml`: contem `lastmod` por URL publica.
- `js/site-meta.js`: `updatedAt` atual `2026-07-06T15:22:50-03:00`.
- `config.js`: contem configuracoes globais e datas de campanha/evento, como `dataInicio` e `dataFim`.
- `sw.js`: `CACHE_NAME` atual `turismo-sms-v21`; ja evita cachear Firebase/APIs externas, navegacoes, JSON e HTML.
- `firestore.rules`: verificado; nao alterado.
- `storage.rules`: verificado; nao alterado.

Motivo: CMS-5A e diagnostico/plano. Nao houve mudanca publica indexavel, nao houve troca de fonte de dados, nao houve mudanca de cache e nao houve publicacao de conteudo.

## 16. Riscos principais

1. **Rules/custo:** leitura direta por browser precisa rules publicadas, query com `status == "published"` e controle de volume.
2. **Tela vazia:** Firestore indisponivel nao pode impedir mapa, ficha ou busca de renderizar dados estaticos.
3. **Duplicidade:** CMS + estaticos podem duplicar itens se nao houver dedupe por id/slug.
4. **Slug/SEO:** criar ou trocar slugs agora quebraria `/local?id=...`, canonical e links de eventos/home.
5. **Midia:** imagens `removed` ou de `submissions` nao devem aparecer publicamente.
6. **Cache:** TTL local longo pode manter conteudo despublicado.
7. **Rotas:** rotas tematicas nao equivalem diretamente a empreendimento.
8. **Divergencia de producao:** arquivos locais de rules podem nao refletir Firebase publicado.
9. **Dados incompletos:** registros CMS podem estar `draft` ou sem campos editoriais suficientes para substituir estaticos.
10. **App Check/CSP:** falhas de App Check ou carregamento Firebase devem degradar para estatico.

## 17. Pendencias mantidas

- Publicacao/despublicacao explicita de `cms_establishments` pelo Admin.
- Confirmar rules publicadas antes de qualquer leitura publica real.
- CMS-4E-EXEC remoto de midias: inventario real de Storage/Firestore somente leitura.
- QA visual e funcional por pagina quando CMS-5C/5D/5E forem implementados.
- Definir se o alvo final sera Firestore direto, JSON estatico gerado ou hibrido.
- Definir politica de TTL e invalidacao antes de usar `localStorage`.
- Revisar schema/rules da galeria item a item antes de depender publicamente de midia CMS.
- Definir mapeamento final de categorias e `relationships.routeIds`.

## 18. Validacoes planejadas

Comandos para executar apos a criacao deste documento:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node --check js/firebase-auth.js
node --check js/admin/modules/empreendimentos.js
node --check js/mapa-turistico.js
node --check js/locais-data.js
node --check js/search-index.js
node --check config.js
node --check sw.js
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
git diff --check
```

Nao executar `npm run build`, `npm run lint` ou `npm run test` porque nao ha `package.json` no repositorio.

## 19. Confirmacoes de escopo

Confirmado neste bloco:

- site publico nao foi alterado;
- leitura publica Firestore nao foi implementada;
- dados estaticos nao foram removidos;
- rotas publicas nao foram alteradas;
- `sitemap.xml` nao foi alterado;
- `js/site-meta.js` nao foi alterado;
- `config.js` nao foi alterado;
- `sw.js` nao foi alterado;
- `firestore.rules` nao foi alterado;
- `storage.rules` nao foi alterado;
- dados reais do Firestore nao foram alterados;
- dados reais do Storage nao foram alterados;
- seed/apply nao foi executado;
- solicitacoes nao foram aplicadas;
- nenhuma dependencia foi instalada;
- nenhum deploy foi executado.

## 20. Proximo bloco recomendado

**CMS-5B - adapter publico somente leitura para `cms_establishments` em modo isolado/dev.**

Objetivo recomendado:

1. criar camada de leitura/normalizacao sem ligar paginas principais;
2. exigir `where("status", "==", "published")`;
3. manter fallback estatico total;
4. simular falhas de Firestore, vazio e permissao negada;
5. gerar comparativo entre snapshot CMS e snapshot estatico;
6. so depois integrar o mapa em CMS-5C.
