# Bloco CMS-2C - Seed/diff controlado de empreendimentos

Data do bloco: 2026-07-07

## Escopo

Este bloco criou uma rotina local para normalizar os dados estaticos de empreendimentos/locais para o contrato `cms_establishments`, definido no CMS-2A e usado pelo CRUD interno do CMS-2B.

O bloco nao altera a leitura publica do site, nao remove dados estaticos, nao publica empreendimentos, nao aplica solicitacoes aprovadas e nao grava no Firestore por padrao.

## Worktree inicial

`git status --short` foi executado antes das alteracoes. O comando retornou apenas avisos de permissao do Git para `C:\Users\jacob/.config/git/ignore`, sem arquivos modificados listados. Portanto, o worktree estava limpo no inicio.

## Arquivos inspecionados

- `docs/bloco-cms-1-diagnostico-admin-cms.md`
- `docs/bloco-cms-2a-contrato-empreendimentos.md`
- `docs/schemas/cms-establishments.schema.md`
- `docs/bloco-cms-2b-crud-empreendimentos.md`
- `js/admin/modules/empreendimentos.js`
- `admin-firebase.html`
- `firestore.rules`
- `storage.rules`
- `js/locais-data.js`
- `js/establishment-catalog.js`
- `js/mapa-turistico.js`
- `js/rotas-data.js`
- `js/data/restaurantes.js`
- `js/data/hospedagens.js`
- `js/data/pontos-turisticos.js`
- `js/data/rotas.js`
- `js/data/informacoes-essenciais.js`
- `js/data/eventos.js`
- `config.js`
- `js/site-meta.js`
- `sw.js`

## Arquivos criados

- `scripts/cms-establishments-seed.mjs`
- `docs/cms-establishments-seed-preview.json`
- `docs/bloco-cms-2c-seed-diff-empreendimentos.md`

## Fontes estaticas mapeadas

| Fonte | Estrutura | Registros | Decisao |
| --- | --- | ---: | --- |
| `js/locais-data.js` | `locaisData` | 15 | candidato a seed |
| `js/data/restaurantes.js` | `TURISMO_RESTAURANTES` | 4 | candidato a seed |
| `js/data/hospedagens.js` | `TURISMO_HOSPEDAGENS` | 5 | candidato a seed |
| `js/data/pontos-turisticos.js` | `TURISMO_PONTOS` | 8 | candidato a seed |
| `js/rotas-data.js` | `ROTAS_LEGADO_ESTABLISHMENTS` | 47 | candidato a seed |
| `js/data/rotas.js` | `TURISMO_ROTAS` | 6 | ignorado neste seed, pois rotas tematicas pertencem a modulo proprio |
| `js/data/informacoes-essenciais.js` | `TURISMO_INFORMACOES` | 5 | ignorado neste seed, pois sao cards informativos/servicos |
| `js/data/eventos.js` | `TURISMO_EVENTOS` | 8 | ignorado neste seed, pois eventos usam fluxo proprio |

Resumo do inventario:

- registros brutos lidos: 98;
- candidatos a seed: 79;
- registros ignorados por escopo: 19;
- documentos normalizados: 67;
- documentos que seriam criados em um apply futuro: 67;
- documentos que seriam atualizados: 0, porque o bloco nao le Firestore;
- conflitos/duplicidades para revisao: 17;
- grupos de campos ausentes: 44;
- avisos de tipo: 0;
- problemas de imagem local detectados: 0;
- campos nao mapeados pelo normalizador: 0.

## Normalizacao criada

O script `scripts/cms-establishments-seed.mjs` roda em Node e carrega os arquivos estaticos em um contexto VM local. Ele nao importa Firebase e nao executa importacao bruta.

Comandos disponiveis:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node scripts/cms-establishments-seed.mjs --dry-run
node scripts/cms-establishments-seed.mjs --export-json docs/cms-establishments-seed-preview.json
node scripts/cms-establishments-seed.mjs --apply --confirm-cms-establishments-seed
```

O `--dry-run` e o comportamento principal. Ele imprime contagens, fontes, conflitos e os primeiros documentos normalizados.

O `--export-json` grava o payload de revisao em `docs/cms-establishments-seed-preview.json`, com metadata, totais, diff local, registros normalizados e alertas.

O `--apply --confirm-cms-establishments-seed` foi deixado como comando documentado, mas recusa gravacao neste bloco. O motivo e manter o CMS-2C como preparacao/diff e evitar escrita real sem uma etapa posterior com diff live contra Firestore, credenciais adequadas e revisao dos conflitos.

## Collection alvo

```text
cms_establishments
```

Cada documento usa ID estavel derivado de `id`/`slug` existente. Quando nao houver ID, o script gera slug a partir do nome, mas a revisao deve confirmar esses casos antes de qualquer apply.

Todos os documentos normalizados usam:

```js
status: "draft"
source.origin: "static_seed"
source.seededAt: "<ISO gerado no momento do preview>"
createdBy: "cms-2c-seed-script"
updatedBy: "cms-2c-seed-script"
```

Nenhum documento e publicado automaticamente.

## Campos mapeados

| Origem estatica | Destino CMS |
| --- | --- |
| `id`, `slug`, `url` | `id`, `slug`, `seo.canonicalPath` |
| `nome`, `name`, `title` | `name`, `seo.title` |
| `categoria`, `route`, `routes`, `rota` | `categoryId`, `categoryLabel`, `relationships.routeIds`, `relationships.legacyRoute` |
| `descricao`, `desc`, `descricaoLonga`, `historia`, `subtitle` | `content.summary`, `content.description`, `content.longDescription` |
| `telefone`, `phone` | `contact.phone`, `contact.whatsapp` quando aplicavel |
| `site`, `website`, `url` externa | `contact.website` |
| `instagram`, `facebook`, `social` | `contact.instagram`, `contact.facebook` |
| `horario`, `hours` | `content.openingHours` |
| `endereco`, `localizacao`, `location` | `location.address` |
| `lat`, `lng`, `coordenadas` | `location.coordinates.lat`, `location.coordinates.lng` |
| `mapsUrl` | `location.mapsUrl` |
| `coordStatus`, `coordNote` | `location.coordStatus`, `location.coordNote` |
| `imagem`, `galeria` | `media.mainImage`, `media.gallery` |
| `videoUrl` | `media.videoUrl` |
| `tags` | `content.tags` |
| fonte/ID original | `source.sourceFile`, `source.originalId`, `source.legacyIds` |

## Campos nao migrados diretamente

Os seguintes dados foram mantidos fora do seed de `cms_establishments` por pertencerem a outros fluxos:

- `TURISMO_ROTAS`: rotas tematicas devem ter modulo proprio ou relacao com `relationships.routeIds`;
- `TURISMO_INFORMACOES`: cards de servico/navegacao nao sao empreendimentos;
- `TURISMO_EVENTOS`: eventos devem continuar em fluxo/collection propria;
- campos visuais de rotas, como `cor` e `icone`, nao pertencem ao documento de empreendimento;
- campos de evento, como `periodo`, `recorrencia`, `localId` e `localUrl`, nao entram no catalogo de empreendimentos.

## Conflitos encontrados

Foram encontrados 17 conflitos/duplicidades para revisao antes de qualquer apply.

Duplicidades por ID foram mescladas no preview preservando a fonte primaria e acumulando `source.legacyIds`:

- `igreja-matriz`
- `igreja-agua-branca`
- `ponte-rio-iguacu`
- `praca-rio-iguacu`
- `rua-do-mathe`
- `casa-da-memoria`
- `chimarrodromo`
- `ancestral-gastronomia`
- `marina-barra-iguacu`
- `parada-pinoli`
- `hotel-moro`

Conflitos que exigem revisao humana:

- `restaurante-dallas` e `churrascaria-dallas` parecem representar o mesmo local;
- coordenadas repetidas entre `miss-sao-mateus`, `natal-ouro-verde` e `prefeitura-municipal`;
- coordenadas repetidas em grupos de propriedades rurais e viveiros que podem ser aproximacoes por regiao;
- coordenadas repetidas em itens da rota da terra, tambem provavelmente aproximacoes.

O preview completo esta em `docs/cms-establishments-seed-preview.json`.

## Campos ausentes

O script registrou 44 grupos de campos ausentes. Os principais casos sao:

- `media.mainImage.url` ausente em varios itens de `js/rotas-data.js`;
- `location.coordinates` ausente em parte das hospedagens;
- endereco detalhado ausente em parte dos registros legados;
- dados de contato incompletos em pontos turisticos e propriedades rurais.

Como todos os documentos ficam em `draft`, essas ausencias nao bloqueiam o preview. Elas devem bloquear publicacao futura quando o Admin passar a validar `published`.

## Protecao contra sobrescrita

O script define a lista de campos protegidos que nao devem ser sobrescritos por seed futuro sem diff live e regra explicita:

- `content.description`;
- `media.gallery`;
- `display.featured`;
- `display.priority`;
- `status`;
- `publishing.publishedAt`;
- `publishing.publishedBy`;
- `publishing.archivedAt`;
- `publishing.archivedBy`;
- `review.lastAppliedRequestId`;
- `review.lastAppliedAt`;
- `review.lastAppliedBy`.

Como o CMS-2C nao acessa Firestore, todos os registros aparecem como `wouldCreate`. O CMS-2D deve buscar documentos atuais da collection e comparar campo a campo antes de gravar.

## Rules e Storage

Nenhuma rule foi alterada neste bloco.

`firestore.rules` ja possui bloco para `cms_establishments`, com create/update validados e delete bloqueado.

`storage.rules` mantem:

- `submissions/establishments/{uid}/{submissionId}/{fileName}`;
- `submissions/events/{uid}/{submissionId}/{fileName}`;
- `submissions/establishment-updates/{uid}/{submissionId}/{fileName}`;
- `cms-media/{uid}/{allFiles=**}`.

O seed nao faz upload e nao grava imagens. Referencias estaticas sao apenas normalizadas como metadata.

## Datas publicas

Este bloco nao altera pagina publica nem troca origem de dados do site. Portanto, nao houve atualizacao de:

- `sitemap.xml`;
- `js/site-meta.js`;
- `config.js`;
- `sw.js`.

`source.seededAt` e `metadata.generatedAt` aparecem apenas no preview/seed e nao significam mudanca publica. O `lastmod` do sitemap so deve mudar quando uma pagina publica mudar de fato.

## Relacao com Portal do Usuario

O bloco nao le nem aplica `establishment_update_requests`.

O fluxo continua separado:

1. empreendedor solicita alteracao no Portal;
2. admin revisa a solicitacao;
3. solicitacao aprovada nao altera o catalogo automaticamente;
4. em bloco futuro, o Admin podera aplicar a solicitacao a `cms_establishments`;
5. site publico so deve ler `published` quando a migracao publica for aberta.

## Modo apply

O modo apply real nao foi implementado neste bloco.

Decisao:

- manter CMS-2C como diff/preparacao;
- evitar dependencia de credenciais locais ou Firebase Admin;
- evitar escrita sem leitura live da collection;
- evitar sobrescrita de campos editoriais criados no CRUD CMS-2B;
- deixar o comando com dupla confirmacao recusando gravacao, para documentar o fluxo esperado sem risco operacional.

O CMS-2D deve implementar ou executar apply em ambiente controlado, com diff real contra Firestore e revisao dos conflitos listados.

## Riscos pendentes

- Duplicidades entre `locaisData`, `TURISMO_PONTOS` e `ROTAS_LEGADO_ESTABLISHMENTS` precisam de curadoria.
- Algumas coordenadas parecem reaproveitadas como aproximacao regional.
- Parte dos itens de rota legado nao tem imagem principal.
- O contrato de `published` deve exigir validacoes mais fortes que `draft`.
- Um apply futuro precisa preservar campos editoriais ja alterados no Admin.
- A leitura publica Firestore com fallback estatico ainda nao foi implementada e deve permanecer fora deste bloco.

## Proximo bloco recomendado

Recomendacao principal: **CMS-2D - executar seed real em ambiente controlado e validar CRUD com dados reais**.

Escopo sugerido do CMS-2D:

- ler documentos existentes em `cms_establishments`;
- comparar campo a campo com o preview normalizado;
- gravar apenas documentos novos ou campos seguros;
- recusar sobrescrita de campos protegidos;
- registrar relatorio pos-apply;
- validar no Admin que os documentos aparecem como `draft`;
- manter o site publico consumindo dados estaticos.

Alternativas depois do CMS-2D:

- **CMS-3**: aplicar solicitacoes aprovadas ao catalogo interno;
- **CMS-4**: midia/galeria;
- **CMS-5**: leitura publica Firestore com fallback estatico.
