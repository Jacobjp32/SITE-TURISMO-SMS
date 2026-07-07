# Bloco CMS-2A - Contrato de dados de empreendimentos

**Data:** 2026-07-06  
**Projeto:** SITE-TURISMO-SMS-mainv2  
**Escopo:** contrato de dados para empreendimentos/estabelecimentos no CMS, sem CRUD visual, sem migracao real e sem trocar o consumo publico para Firestore.

## 1. Pre-check

- `git status --short`: worktree limpo antes de iniciar.
- O Git exibiu apenas aviso de permissao ao acessar `C:\Users\jacob/.config/git/ignore`.
- Nenhum commit foi feito.
- Nenhum CRUD visual foi implementado.
- `admin-firebase.html`, `portal-usuario.html`, site publico, slugs, hero/video, mapa 3D, PDF/guia, dados estaticos, `sitemap.xml`, `js/site-meta.js`, `config.js`, `firestore.rules` e `storage.rules` nao foram alterados.

## 2. Arquivos inspecionados

- `docs/bloco-cms-1-diagnostico-admin-cms.md`
- `admin-firebase.html`
- `portal-usuario.html`
- `js/firebase-auth.js`
- `js/establishment-catalog.js`
- `js/locais-data.js`
- `js/mapa-turistico.js`
- `js/data/eventos.js`
- `js/data/hospedagens.js`
- `js/data/informacoes-essenciais.js`
- `js/data/pontos-turisticos.js`
- `js/data/restaurantes.js`
- `js/data/rotas.js`
- `js/data/turismo-data-adapter.js`
- `js/data/turismo-data.js`
- `firestore.rules`
- `storage.rules`
- `config.js`
- `js/site-meta.js`
- `sw.js`
- `docs/bloco-p2-validacao-portal-empreendedor.md`
- `docs/bloco-p3-fechamento-portal-empreendedor.md`
- `docs/bloco-p4-aplicacao-publicacao-solicitacoes.md`

Tambem foi consultado `js/rotas-data.js`, porque `js/establishment-catalog.js` carrega esse arquivo para montar parte do catalogo reivindicavel do Portal.

## 3. Diagnostico dos campos atuais

### 3.1 Fontes publicas/estaticas

| Fonte | Total lido | Papel atual | Campos encontrados |
| --- | ---: | --- | --- |
| `js/locais-data.js` / `window.locaisData` | 15 | fichas de locais/pontos e informacoes institucionais | `id`, `nome`, `categoria`, `subtitulo`, `badge`, `descricao`, `historia`, `imagem`, `galeria`, `endereco`, `lat`, `lng`, `mapsUrl`, `telefone`, `horario`, `site`, `instagram`, `facebook`, `rota`, `acessibilidade` |
| `js/data/restaurantes.js` / `window.TURISMO_RESTAURANTES` | 4 | gastronomia publica | `id`, `nome`, `categoria`, `descricao`, `descricaoLonga`, `imagem`, `galeria`, `url`, `telefone`, `localizacao`, `horario`, `instagram`, `coordenadas`, `tags` |
| `js/data/hospedagens.js` / `window.TURISMO_HOSPEDAGENS` | 5 | hospedagem publica | `id`, `nome`, `categoria`, `descricao`, `imagem`, `galeria`, `url`, `telefone`, `localizacao`, `coordenadas`, `tags` |
| `js/data/pontos-turisticos.js` / `window.TURISMO_PONTOS` | 8 | pontos turisticos publicos | `id`, `nome`, `categoria`, `descricao`, `imagem`, `galeria`, `url`, `localizacao`, `endereco`, `mapsUrl`, `coordenadas`, `tags` |
| `js/data/rotas.js` / `window.TURISMO_ROTAS` | 6 | rotas tematicas, nao empreendimento individual | `id`, `nome`, `categoria`, `descricao`, `imagem`, `galeria`, `url`, `icone`, `cor`, `tags` |
| `js/rotas-data.js` / `window.ROTAS_LEGADO_ESTABLISHMENTS` | 47 | estabelecimentos e pontos legados das rotas | `id`, `name`, `subtitle`, `desc`, `phone`, `social`, `site`, `location`, `hours`, `mapsUrl`, `lat`, `lng`, `coordStatus`, `coordNote`, `route`, `routes`, `imagem`, `galeria`, `videoUrl` |

### 3.2 Normalizacao publica existente

`js/data/turismo-data-adapter.js` transforma fontes legadas em campos comuns:

- identificacao: `id`, `nome`, `categoria`;
- texto: `descricao`, `descricaoLonga`;
- midia: `imagem`, `galeria`, `videoUrl`;
- URL interna: `url`;
- contato/localizacao: `telefone`, `localizacao`, `endereco`, `horario`, `site`, `instagram`, `facebook`, `mapsUrl`;
- geolocalizacao: `coordenadas` com `lat`/`lng`;
- relacionamento: `rota`, `legacyRoute`, `legacyRouteName`, `tags`;
- acessibilidade: `acessibilidade`.

`js/mapa-turistico.js` consome `window.TURISMO_DATA`, normaliza esses mesmos campos para cards/mapa e carrega Firestore somente para `eventos_aprovados`. Ele nao le uma collection dinamica de empreendimentos.

### 3.3 Catalogo reivindicavel do Portal

`js/establishment-catalog.js` monta o catalogo do Portal a partir de:

- `window.TURISMO_RESTAURANTES`;
- `window.TURISMO_HOSPEDAGENS`;
- `js/rotas-data.js` carregado por `fetch`.

Cada entrada do catalogo possui:

- `establishmentId`;
- `establishmentName`;
- `category`;
- `source`;
- `originalId`;
- `slug`;
- `currentSnapshot`.

O `currentSnapshot` atual inclui:

- `name`;
- `category`;
- `source`;
- `originalId`;
- `description`;
- `phone`;
- `whatsapp`;
- `instagram`;
- `website`;
- `address`;
- `openingHours`;
- `images`;
- `mainImage`;
- `imageCount`.

Esse snapshot e suficiente para criar uma solicitacao de alteracao, mas nao e um modelo publico completo de CMS: ele nao guarda status de publicacao, auditoria, geolocalizacao detalhada, SEO, prioridade, relacionamentos completos, direitos de midia nem historico de aplicacao.

## 4. Campos enviados pelo Portal

### 4.1 Solicitacao de alteracao

O Portal grava alteracoes em `establishment_update_requests`. O empreendedor precisa ter vinculo ativo em `establishment_managers` para o mesmo `establishmentId`.

Campos principais gravados:

| Campo | Papel |
| --- | --- |
| `id` | id da solicitacao, geralmente `upd_{timestamp}` |
| `managerId` | doc de `establishment_managers` usado para validar vinculo |
| `ownerUid`, `ownerEmail`, `ownerName` | dono da solicitacao |
| `establishmentId`, `establishmentName`, `establishmentCategory`, `establishmentSource` | identificacao do empreendimento solicitado |
| `currentSnapshot` | retrato conhecido do catalogo no momento do pedido |
| `requestedChanges` | campos alterados propostos |
| `images`, `mainImage`, `imageCount` | anexos enviados pelo empreendedor |
| `status` | `pending`, `approved`, `rejected` ou `changes_requested` |
| `source` | `establishment_manager` |
| `createdAt`, `updatedAt`, `submittedAt` | timestamps de criacao/submissao |
| `reviewedAt`, `reviewedBy`, `reviewNotes`, `rejectionReason`, `changesRequestedNotes` | revisao administrativa |

### 4.2 Campos editaveis pelo empreendedor

`requestedChanges` aceita somente:

- `description`;
- `phone`;
- `whatsapp`;
- `instagram`;
- `website`;
- `address`;
- `openingHours`;
- `additionalNotes`.

Limites do app:

- `description`: ate 4000 caracteres;
- `additionalNotes`: ate 1500 caracteres;
- `phone`, `whatsapp`: ate 120 caracteres;
- `instagram`: ate 160 caracteres;
- `website`, `address`, `openingHours`: ate 240 caracteres.

Upload do Portal:

- limite de app: ate 6 imagens por solicitacao;
- limite de Storage Rules: ate 5 MB por arquivo;
- tipos: JPG, PNG ou WebP;
- path atual: `submissions/establishment-updates/{uid}/{requestId}/{fileName}`;
- metadados por imagem: `url`, `path`, `name`, `contentType`, `size`, `uploadedAt`, `position`.

### 4.3 Diferenca entre solicitacao e dado publico

`establishment_update_requests` e uma fila de propostas. Aprovar uma solicitacao:

- altera apenas `status`, `updatedAt`, `reviewedAt`, `reviewedBy` e campos de revisao;
- nao altera `js/locais-data.js`;
- nao altera `js/data/*.js`;
- nao altera `window.TURISMO_DATA`;
- nao altera o mapa;
- nao publica imagem;
- nao grava em catalogo publico.

Essa separacao deve continuar no CMS-2A: empreendedor solicita; admin revisa; admin aplica/publica em etapa separada.

## 5. Collection recomendada

Recomendacao: **`cms_establishments`**.

Motivos:

- deixa claro que e uma collection de CMS, nao o legado `estabelecimentos_aprovados`;
- evita colisao semantica com `establishment_managers`, `establishment_claims` e `establishment_update_requests`;
- pode guardar rascunhos, arquivados e publicados no mesmo destino;
- permite leitura publica futura limitada a `status == 'published'`;
- mantem `establishment_update_requests` separado do catalogo publico.

Alternativas avaliadas:

- `establishments_catalog`: nome bom para leitura publica, mas menos claro como area editorial de CMS.
- `estabelecimentos_aprovados`: ja existe, mas e legado/parcial e nao tem contrato suficiente para o CMS novo.

### ID do documento

Usar id estavel baseado no `establishmentId` canonico ja usado pelo Portal, preferencialmente igual ao slug atual quando existir.

Regras propostas:

- nao mudar o doc id depois de criado;
- preservar ids atuais de `js/data/*.js`, `js/locais-data.js` e `js/rotas-data.js` quando forem seedados;
- quando houver origem duplicada, manter um doc canonico e registrar aliases em `source.legacyIds`;
- nao usar timestamp como id de empreendimento;
- nao usar nome puro sem normalizacao, porque o nome pode mudar.

Exemplos:

- `marina-barra-iguacu`;
- `ancestral-gastronomia`;
- `hotel-sao-mateus`;
- `igreja-matriz`.

## 6. Schema proposto

Ver tambem `docs/schemas/cms-establishments.schema.md`.

### 6.1 Campos obrigatorios

| Campo | Tipo | Observacao |
| --- | --- | --- |
| `id` | string | igual ao doc id |
| `slug` | string | slug publico/canonico; no primeiro ciclo deve ser igual ao id quando possivel |
| `name` | string | nome exibido |
| `categoryId` | string | categoria controlada |
| `categoryLabel` | string | label PT-BR exibivel |
| `status` | string | `draft`, `published` ou `archived` |
| `content.summary` | string | descricao curta |
| `location.address` | string | endereco/localizacao textual; pode ser vazio em rascunho importado |
| `media.mainImage.url` | string | URL/local path da imagem principal; pode ser vazio em rascunho |
| `createdAt`, `createdBy` | timestamp/string | auditoria de criacao |
| `updatedAt`, `updatedBy` | timestamp/string | auditoria de ultima edicao |

Para publicar (`status == 'published'`), exigir no minimo:

- `name`;
- `slug`;
- `categoryId`;
- `categoryLabel`;
- `content.summary`;
- `location.address` ou `location.coordinates`;
- `updatedAt`;
- `updatedBy`.

Imagem principal deve ser recomendada para qualidade editorial, mas nao deve bloquear todos os casos: hoje ha dados publicos sem imagem.

### 6.2 Campos opcionais

| Grupo | Campos |
| --- | --- |
| `content` | `description`, `longDescription`, `accessibility`, `openingHours`, `tags`, `notesInternal` |
| `contact` | `phone`, `whatsapp`, `email`, `website`, `instagram`, `facebook` |
| `location` | `address`, `neighborhood`, `city`, `state`, `postalCode`, `coordinates.lat`, `coordinates.lng`, `mapsUrl`, `coordStatus`, `coordNote` |
| `media` | `mainImage`, `gallery[]`, `videoUrl`, `sourceCredits` |
| `relationships` | `routeIds[]`, `relatedPlaceIds[]`, `relatedEventIds[]`, `legacyRoute`, `legacyRouteName` |
| `publishing` | `publishedAt`, `publishedBy`, `archivedAt`, `archivedBy`, `archiveReason` |
| `review` | `lastAppliedRequestId`, `lastAppliedAt`, `lastAppliedBy`, `lastReviewNotes` |
| `source` | `origin`, `sourceFile`, `originalId`, `legacyIds[]`, `seededAt`, `sourceUpdatedAt` |
| `display` | `featured`, `priority`, `mapVisible`, `claimable` |
| `seo` | `title`, `description`, `canonicalPath` |

### 6.3 Categorias sugeridas

Primeiro ciclo deve mapear as categorias existentes sem inventar taxonomia grande:

- `gastronomia`;
- `hospedagem`;
- `ponto_turistico`;
- `experiencia_turistica`;
- `experiencia_cultural`;
- `natureza_lazer`;
- `turismo_rural`;
- `institucional`;
- `servico`.

O valor antigo deve ficar em `categoryLabel` ou `source.originalCategory` para auditoria.

## 7. Status e fluxo

### 7.1 Status do catalogo

| Status | Uso |
| --- | --- |
| `draft` | registro interno em preparo/importado; nao deve aparecer no site publico futuro |
| `published` | registro aprovado para exibicao publica futura |
| `archived` | registro removido da exibicao sem delete definitivo |

`pending_review` nao e recomendado no primeiro contrato do catalogo. A fila de revisao ja existe em `establishment_update_requests`; duplicar esse status dentro de `cms_establishments` pode confundir operadores. Se futuramente houver revisao interna de edicoes admin, esse status pode ser adicionado em bloco proprio.

### 7.2 Status das solicitacoes

`establishment_update_requests` deve continuar com:

- `pending`;
- `approved`;
- `rejected`;
- `changes_requested`.

Para fechar a aplicacao futura, adicionar em bloco posterior campos de aplicacao, sem mudar o significado do `status` de revisao:

- `applicationStatus`: `not_applied`, `applied`, `skipped`, `superseded`;
- `appliedToEstablishmentId`;
- `appliedAt`;
- `appliedBy`;
- `applicationNotes`.

### 7.3 Fluxo alvo

1. Empreendedor solicita vinculo.
2. Admin aprova vinculo em `establishment_managers`.
3. Empreendedor envia `establishment_update_requests`.
4. Admin revisa: aprova, rejeita ou pede ajustes.
5. Solicitacao aprovada fica aguardando aplicacao controlada.
6. Admin aplica campos permitidos no doc `cms_establishments/{establishmentId}`.
7. Admin publica ou mantem rascunho.
8. Site publico, em bloco futuro, le somente docs `status == 'published'` e mantem fallback estatico ate a migracao ser validada.

Empreendedor nao publica, nao altera `status`, nao edita `slug`, nao altera categoria final, nao mexe em SEO, nao gerencia mapa/featured/prioridade e nao escreve em `cms_establishments`.

## 8. Timestamps propostos

| Campo | Quando preencher |
| --- | --- |
| `createdAt` | criacao do doc no CMS |
| `createdBy` | UID do admin/criador ou `system:seed` em seed controlado |
| `updatedAt` | toda edicao admin no doc |
| `updatedBy` | UID do admin/editor |
| `publishedAt` | primeira publicacao ou republicacao apos arquivamento |
| `publishedBy` | UID de quem publicou |
| `archivedAt` | arquivamento |
| `archivedBy` | UID de quem arquivou |
| `lastAppliedRequestId` | ultima solicitacao aplicada ao catalogo |
| `lastAppliedAt` | data/hora de aplicacao da solicitacao |
| `lastAppliedBy` | UID de quem aplicou |
| `sourceUpdatedAt` | data conhecida da fonte importada, se houver |
| `seededAt` | data/hora em que seed futuro criou/atualizou o doc |

Nao preencher `publishedAt` quando uma solicitacao for apenas aprovada. Aprovacao e revisao; publicacao/aplicacao e etapa separada.

## 9. Rules propostas para CMS-2B

Nenhuma rule foi alterada neste bloco. Abaixo esta o contrato recomendado para implementacao futura.

### 9.1 Firestore

Requisitos:

- leitura publica futura somente para `status == 'published'`;
- admin pode criar, editar, publicar e arquivar;
- se "master" virar papel real, ele precisa existir em `usuarios.role` ou outro campo validado em rules; hoje os arquivos locais validam `admin` e `moderator`, nao `master`;
- empreendedor nao escreve em `cms_establishments`;
- empreendedor continua usando apenas `establishment_update_requests`;
- validacao por `hasOnly()`;
- validacao de status permitidos;
- validacao de campos obrigatorios e tipos basicos;
- delete definitivo bloqueado no primeiro ciclo.

Rascunho conceitual para bloco futuro:

```js
function isEstablishmentStatus(value) {
  return value in ['draft', 'published', 'archived'];
}

function establishmentFieldsAllowed(data) {
  return data.keys().hasOnly([
    'id', 'slug', 'name', 'categoryId', 'categoryLabel', 'status',
    'content', 'contact', 'location', 'media', 'relationships',
    'publishing', 'review', 'source', 'display', 'seo',
    'createdAt', 'createdBy', 'updatedAt', 'updatedBy'
  ]);
}

match /cms_establishments/{establishmentId} {
  allow read: if resource.data.status == 'published' || isAdmin();
  allow create: if isAdmin() &&
    request.resource.data.id == establishmentId &&
    isEstablishmentStatus(request.resource.data.status) &&
    establishmentFieldsAllowed(request.resource.data);
  allow update: if isAdmin() &&
    request.resource.data.id == resource.data.id &&
    isEstablishmentStatus(request.resource.data.status) &&
    establishmentFieldsAllowed(request.resource.data);
  allow delete: if false;
}
```

Esse rascunho ainda precisa ser endurecido no CMS-2B com validacoes de mapas/listas (`content`, `contact`, `location`, `media`) e campos imutaveis.

### 9.2 Portal

Rules existentes que devem continuar separadas:

- `establishment_claims`: solicitacao de vinculo;
- `establishment_managers`: vinculo aprovado;
- `establishment_update_requests`: proposta de alteracao;
- `estabelecimentos_pendentes`: cadastro novo legado/parcial;
- `estabelecimentos_aprovados`: legado/parcial, nao consumido pelo site publico atual.

Nao abrir `cms_establishments` para `ownerUid`, `userId` ou `managerId`.

## 10. Storage paths propostos

### 10.1 Paths atuais

| Path | Quem escreve hoje | Quem le hoje | Uso |
| --- | --- | --- | --- |
| `submissions/establishments/{uid}/{submissionId}/{fileName}` | dono autenticado | dono ou staff | cadastro novo pendente |
| `submissions/events/{uid}/{submissionId}/{fileName}` | dono autenticado | dono ou staff | evento pendente |
| `submissions/establishment-updates/{uid}/{requestId}/{fileName}` | dono autenticado | dono ou staff | solicitacao de alteracao |
| `cms-media/{uid}/{allFiles=**}` | admin do proprio uid | publico | midia CMS e banners |

### 10.2 Path recomendado para imagens de catalogo

Usar o path ja coberto por `cms-media`:

```text
cms-media/{adminUid}/establishments/{establishmentId}/{timestamp}-{fileName}
```

Vantagens:

- segue o padrao de banners (`cms-media/{uid}/banners/...`);
- nao exige nova arvore de Storage no primeiro CRUD;
- leitura publica ja e permitida;
- escrita continua restrita a admin;
- limite atual de 5 MB e JPG/PNG/WebP segue consistente.

Imagens vindas de solicitacao do empreendedor devem permanecer em:

```text
submissions/establishment-updates/{uid}/{requestId}/{fileName}
```

Na aplicacao futura, o admin pode:

- referenciar a imagem de submissao como evidencia, sem publicar direto; ou
- copiar/reupar para `cms-media/{adminUid}/establishments/...` antes de publicar; ou
- selecionar uma imagem existente da biblioteca CMS.

Videos nao devem entrar neste contrato inicial de upload. Se necessario, tratar video em CMS-4/midia com decisao de tipo, limite, custo, transcodificacao e origem externa.

## 11. Estrategia de migracao

Nao migrar dados reais neste bloco.

Plano seguro para bloco futuro:

1. Criar script de seed somente em branch/bloco especifico.
2. Ler `js/locais-data.js`, `js/data/restaurantes.js`, `js/data/hospedagens.js`, `js/data/pontos-turisticos.js` e `js/rotas-data.js`.
3. Normalizar para o schema `cms_establishments`.
4. Gerar relatorio de diff antes de gravar.
5. Preservar ids existentes como doc id.
6. Registrar `source.origin`, `source.sourceFile`, `source.originalId`, `source.legacyIds`.
7. Criar docs como `draft` ou `published` apenas apos decisao de QA. Recomendacao inicial: seed em `draft/imported` e publicar lote validado depois.
8. Manter `js/locais-data.js` e `js/data/*.js` como fallback.
9. Nao ligar o site publico ao Firestore ate o dataset dinamico ser comparado com o estatico.
10. Quando o site publico for ligado, ler `cms_establishments where status == 'published'` com fallback para dados estaticos.
11. Evitar duplicidade por `id`, nome normalizado, `mapsUrl` e coordenadas proximas, como o adapter atual ja faz para legados.

## 12. Relacao com solicitacoes aprovadas

Uma `establishment_update_request` aprovada pode ser aplicada ao catalogo assim:

1. Admin abre fila de solicitacoes `approved` ainda nao aplicadas.
2. Sistema carrega `cms_establishments/{establishmentId}`.
3. Sistema mostra diff entre dado atual, `currentSnapshot` original e `requestedChanges`.
4. Admin seleciona campos a aplicar.
5. Sistema grava update no doc do catalogo com `updatedAt`, `updatedBy`, `lastAppliedRequestId`, `lastAppliedAt`, `lastAppliedBy`.
6. Sistema marca a solicitacao com `applicationStatus: 'applied'`, `appliedAt`, `appliedBy`, `appliedToEstablishmentId`.
7. Historico fica preservado no doc da solicitacao e, em bloco futuro, em `audit_logs`.

Campos que podem ser aplicados com menor risco apos revisao:

- `content.description` a partir de `requestedChanges.description`;
- `contact.phone`;
- `contact.whatsapp`;
- `contact.instagram`;
- `contact.website`;
- `content.openingHours`;
- `content.notesInternal` a partir de `additionalNotes`, se a equipe quiser guardar observacao sem publicar.

Campos que exigem revisao humana e nao devem ser autoaplicados:

- `name`;
- `slug`;
- `categoryId` / `categoryLabel`;
- `location.coordinates`;
- `location.mapsUrl`;
- `media.mainImage`;
- ordem de `media.gallery`;
- `status`;
- `display.featured`;
- `display.priority`;
- `seo`;
- qualquer campo de auditoria.

## 13. Datas e horarios

Este bloco e contrato/diagnostico. Nao atualizar:

- `sitemap.xml`;
- `js/site-meta.js`;
- `config.js`;
- `sw.js`.

Campos existentes verificados:

- `js/site-meta.js`: `updatedAt`;
- `sitemap.xml`: `lastmod` por URL publica;
- `sw.js`: `CACHE_NAME`;
- `config.js`: datas de campanha/evento (`dataInicio`, `dataFim`);
- Firestore atual: `createdAt`, `updatedAt`, `submittedAt`, `reviewedAt`, `reviewedBy` em solicitacoes; `approvedAt`, `approvedBy`, `revokedAt`, `revokedBy` em vinculos; `publishedAt` em banners/noticias.

Regra para blocos futuros:

- `lastmod` do sitemap so deve mudar quando uma pagina publica indexavel mudar de forma real;
- `js/site-meta.js.updatedAt` so deve mudar quando a atualizacao for publica/global;
- `config.js` so deve mudar quando houver alteracao real de configuracao;
- aprovar solicitacao no Portal nao muda datas publicas;
- aplicar/publicar alteracao em `cms_establishments` deve preencher timestamps do CMS, mas so deve mudar sitemap/site-meta quando o site publico passar a consumir esse dado e a pagina publica for afetada.

## 14. Riscos

- Criar `cms_establishments` sem rules estritas pode permitir edicao direta indevida por usuario comum.
- Ligar o mapa ao Firestore antes de seed/QA/fallback pode quebrar mapa, sabores, hospedagens, busca e SEO.
- Usar `estabelecimentos_aprovados` como destino novo pode confundir legado com CMS e perpetuar schema aberto.
- Publicar imagens diretamente de `submissions/...` pode expor arquivo ainda nao revisado ou preso ao contexto privado da solicitacao.
- Trocar doc id/slug depois de vinculos existentes pode quebrar `establishment_managers` e historico de solicitacoes.
- `master` hoje nao aparece como papel efetivo nas rules locais; qualquer acesso master precisa ser modelado no servidor/rules antes de ser considerado seguranca.
- Rules publicadas no Firebase Console podem divergir dos arquivos locais.

## 15. Proximos blocos recomendados

| Bloco | Objetivo | Arquivos provaveis | Collections | Rules | Risco | Validacoes |
| --- | --- | --- | --- | --- | --- | --- |
| CMS-2B-Rules | Implementar rules minimas de `cms_establishments` sem UI publica | `firestore.rules`, talvez `storage.rules`, docs | `cms_establishments` | schema restrito, leitura publica so `published`, write admin, delete bloqueado | alto | revisar sintaxe/rules, teste manual no Console/emulator se disponivel |
| CMS-2B-CRUD interno | Criar modulo admin interno de empreendimentos, sem trocar site publico | `js/admin/modules/empreendimentos.js`, `admin-firebase.html`, `js/admin/*`, docs | `cms_establishments`, `media_library` opcional | usar rules do CMS-2B-Rules | alto | `node --check`, smoke admin autenticado, upload imagem |
| CMS-2C-Seed | Gerar seed/diff a partir dos dados estaticos, sem publicar automaticamente | script novo em `scripts/`, docs | `cms_establishments` | write admin/seed controlado | medio/alto | diff contra fontes estaticas, amostragem por categoria |
| CMS-3 | Aplicar solicitacoes aprovadas ao catalogo | `admin-firebase.html`, `js/firebase-auth.js`, modulo de empreendimentos | `establishment_update_requests`, `cms_establishments` | admin aplica; empreendedor segue sem write no catalogo | alto | diff de solicitacao, timestamps de aplicacao, sem publicacao automatica |
| CMS-4 | Evoluir midia/DAM | `js/admin-content-cms.js` ou modulo `midia`, `storage.rules`, `firestore.rules` | `media_library` | destinos, status, limites, video se aprovado | medio/alto | upload, referencias, custos/limites |
| CMS-5 | Ligar site publico ao catalogo com fallback | `js/mapa-turistico.js`, `js/establishment-catalog.js`, talvez `js/data/turismo-data-adapter.js` | `cms_establishments` | leitura publica so `published` | alto | mapa/sabores/hospedagem/busca/mobile/SEO |

Proximo bloco recomendado: **CMS-2B-Rules**, antes do CRUD visual. Motivo: o CRUD interno so deve existir depois que a collection tiver permissao minima segura, leitura publica controlada e delete bloqueado.

## 16. Artefatos criados

- `docs/bloco-cms-2a-contrato-empreendimentos.md`
- `docs/schemas/cms-establishments.schema.md`

## 17. Validacoes planejadas neste bloco

Executar apos a documentacao:

- `node --check js/firebase-auth.js`
- `node --check config.js`
- `node --check sw.js`
- `node scripts/audit-links.mjs`
- `node scripts/audit-assets.mjs`
- `node scripts/audit-project.mjs`
- `git diff --check`

Nao ha validacao de rules porque `firestore.rules` e `storage.rules` nao foram alterados.
