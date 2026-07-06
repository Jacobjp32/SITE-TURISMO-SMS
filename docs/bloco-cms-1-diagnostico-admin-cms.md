# Bloco CMS-1 - Diagnostico do Painel Admin/CMS

**Data:** 2026-07-06  
**Projeto:** SITE-TURISMO-SMS-mainv2  
**Escopo:** diagnostico completo do Painel Admin/CMS, sem implementacao de novos modulos.

## 1. Pre-check

- `git status --short`: worktree limpo antes de iniciar.
- O Git exibiu apenas aviso de permissao ao acessar `C:\Users\jacob/.config/git/ignore`.
- Nenhum commit foi feito.
- Nenhuma Firestore Rule ou Storage Rule foi alterada.
- Nenhum dado publico, slug, URL, hero/video, mapa 3D, PDF/guia, `sitemap.xml`, `js/site-meta.js` ou `config.js` foi atualizado.

## 2. Arquivos inspecionados

- `admin-firebase.html`
- `portal-usuario.html`
- `js/firebase-auth.js`
- `firestore.rules`
- `storage.rules`
- `config.js`
- `sw.js`
- `js/admin/admin-context.js`
- `js/admin/admin-ui.js`
- `js/admin/admin-registry.js`
- `js/admin/admin-router.js`
- `js/admin/admin-shell.js`
- `js/admin/modules/dashboard.js`
- `js/admin/modules/banners.js`
- `js/admin/modules/placeholder.js`
- `js/admin-content-cms.js`
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
- `js/public-banners.js`
- `js/cms.js`
- `css/portal-usuario.css`
- `css/public-banners.css`
- `css/galeria.css`
- CSS inline de `admin-firebase.html`
- Docs recentes: `bloco-vinculos-admin-portal-usuario.md`, `bloco-p2-validacao-portal-empreendedor.md`, `bloco-p3-fechamento-portal-empreendedor.md`, `bloco-p4-aplicacao-publicacao-solicitacoes.md`, `bloco-s13-urls-bonitas-slugs.md`, `bloco-s15-validacao-geral-pos-blocos.md`, `bloco-s16-unificacao-mathe-mascote.md`.

## 3. Arquitetura atual do admin

O admin atual e hibrido:

| Camada | Arquivo | Estado | Papel |
| --- | --- | --- | --- |
| HTML/admin legado | `admin-firebase.html` | real | Login, sidebar, secoes, modais, fluxos de usuarios, aprovacoes, vinculos e chamadas ao CMS parcial. |
| API Firebase client | `js/firebase-auth.js` | real | Inicializacao Firebase/Auth, `FirebaseSystem`, roles, usuarios, eventos, estabelecimentos pendentes, vinculos e solicitacoes. |
| CMS parcial legado | `js/admin-content-cms.js` | real/parcial | CRUD de eventos aprovados, noticias e biblioteca de midia. Nao usa `AdminRegistry`. |
| Fundacao modular | `js/admin/*` | parcial | `AdminContext`, `AdminUI`, `AdminRegistry`, `AdminRouter`, `AdminShell`. Ainda em modo aditivo/passthrough. |
| Modulos novos | `js/admin/modules/*` | misto | Dashboard modular, Banners real, placeholders de modulos futuros. |
| CSS do admin | `admin-firebase.html` | real | Estilos inline do painel, tabelas, modais, update requests, midia e placeholders. Nao ha CSS admin externo dedicado. |

### Como `admin-firebase.html` carrega os modulos

A ordem de carga relevante e:

1. `js/security-utils.js`
2. `js/data/restaurantes.js`
3. `js/data/hospedagens.js`
4. `js/establishment-catalog.js`
5. `config.js`
6. Firebase compat: app/auth/firestore/storage/app-check
7. `js/firebase-auth.js`
8. `js/admin-content-cms.js`
9. `js/admin/admin-context.js`
10. `js/admin/admin-ui.js`
11. `js/admin/admin-registry.js`
12. `js/admin/admin-router.js`
13. `js/admin/admin-shell.js`
14. `js/admin/modules/dashboard.js`
15. `js/admin/modules/banners.js`
16. `js/admin/modules/placeholder.js`
17. Script inline legado do admin.

`banners.js` carrega antes de `placeholder.js`, entao registra `banners` como modulo real e impede que o placeholder com mesmo id substitua o modulo.

### Como `AdminRegistry` funciona

`AdminRegistry` mantem um mapa privado de modulos por `id` e uma lista de ordem de registro. O contrato minimo e:

`{ id, label, icon, requiredRole, master, navGroup, order, render(container, context), load(context), dispose() }`

Funcoes disponiveis:

- `register(def)`: valida `id` e `render`, normaliza defaults, rejeita ids duplicados.
- `has(id)`: verifica se um modulo existe.
- `get(id)`: retorna a definicao normalizada.
- `list()`: retorna modulos na ordem de registro.
- `listSorted()`: ordena por `navGroup` e `order`.
- `count()`: total registrado.

O registry ainda nao monta a sidebar. O menu continua hardcoded em `admin-firebase.html`.

### Como `AdminRouter` funciona

`AdminRouter` esta em modo passthrough:

- delega navegacao visual ao `showSection` legado;
- chama `dispose()` do modulo atual, quando houver;
- renderiza/carrega modulo registrado para a secao, quando houver;
- nao substitui o menu legado;
- nao e chamado diretamente pelos links da sidebar atual. Os links chamam `showSection`.

Na pratica, `showSection` ainda e a fonte operacional. Para `banners`, ele chama explicitamente `AdminBannersModule.activate()`.

## 4. Menu atual do admin

| Secao no menu | ID | Implementacao | Status |
| --- | --- | --- | --- |
| Dashboard | `home` | `admin-firebase.html` + `dashboard.js` | real/parcial |
| Aprovacoes | `aprovacoes` | inline + `FirebaseSystem` | real |
| Solicitacoes de vinculo | `vinculos` | inline + `FirebaseSystem` | real |
| Gerenciar Vinculos | `gerenciar-vinculos` | inline + `FirebaseSystem` | real |
| Usuarios | `usuarios` | inline + `FirebaseSystem` | real |
| Eventos | `eventos` | `AdminContentCMS` | real/parcial |
| Noticias | `noticias` | `AdminContentCMS` | real/parcial |
| Midia | `midia` | `AdminContentCMS` | parcial |
| Banners / Pop-ups | `banners` | `AdminBannersModule` | real |
| Empreendimentos | `empreendimentos` | placeholder | placeholder |
| Rotas | `rotas` | placeholder | placeholder |
| Galeria | `galeria` | placeholder | placeholder |
| Configuracoes | `configuracoes` | placeholder master cosmetico | placeholder |
| Sazonal / Clima | `sazonal` | placeholder master cosmetico | placeholder |
| Mascote | `mascote` | placeholder master cosmetico | placeholder |
| Logs / Auditoria | `audit-logs` | placeholder master cosmetico | placeholder |

## 5. Matriz dos modulos e secoes do admin

| Modulo/secao | Arquivo | Status | Collection | Le Firestore | Escreve Firestore | Storage/upload | Publicacao | Delete/arquivar | Auditoria/timestamps | Relacao com Portal | Riscos |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | `js/admin/modules/dashboard.js`, `admin-firebase.html` | real/parcial | `usuarios`, `eventos_pendentes`, `eventos_aprovados`, `estabelecimentos_pendentes` via stats | sim | nao | nao | nao | nao | apenas leitura | indireta | Depende de `FirebaseSystem.getAdminStats()` e sessao admin. |
| Aprovacoes - eventos pendentes | `admin-firebase.html`, `js/firebase-auth.js` | real | `eventos_pendentes`, `eventos_aprovados` | sim | sim | mostra imagens ja enviadas pelo Portal | aprovar move para `eventos_aprovados` com `publicado:true` | rejeitar atualiza status; aprovar deleta pendente | `createdAt`, `updatedAt`, `submittedAt`, `reviewedAt`, `reviewedBy`, `updatedBy` | sim, eventos do Portal | Fluxo aprova e publica evento; delete do pendente apos aprovar. |
| Aprovacoes - estabelecimentos pendentes | `admin-firebase.html`, `js/firebase-auth.js` | legado/parcial | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | sim | sim | mostra contagem de imagens | aprova para `estabelecimentos_aprovados` | rejeitar atualiza status; aprovar deleta pendente | `submittedAt`, `reviewedAt`, `reviewedBy`, `reviewNotes` | sim, cadastro novo pelo Portal | Site publico nao consome `estabelecimentos_aprovados`; aprovar nao coloca no mapa. |
| Alteracoes de empreendimentos | `admin-firebase.html`, `js/firebase-auth.js` | real/parcial | `establishment_update_requests` | sim | sim | le anexos do Portal | aprovacao nao publica | rejeitar/pedir ajustes; sem aplicar ao catalogo | `createdAt`, `updatedAt`, `submittedAt`, `reviewedAt`, `reviewedBy` | sim, fluxo principal do empreendedor | Lacuna central: falta aplicar solicitacao aprovada ao catalogo publico. |
| Solicitacoes de vinculo | `admin-firebase.html`, `js/firebase-auth.js` | real | `establishment_claims`, `establishment_managers` | sim | sim | nao | nao | rejeitar claim; aprovar cria/reactiva manager | `createdAt`, `updatedAt`, `reviewedAt`, `reviewedBy`, `approvedAt`, `approvedBy` | sim | Depende de consistencia do `EstablishmentCatalog`. |
| Gerenciar Vinculos | `admin-firebase.html`, `js/firebase-auth.js` | real | `establishment_managers` | sim | sim | nao | nao | desativa/reativa por `active` | `approvedAt`, `approvedBy`, `updatedAt`, `updatedBy`, `revokedAt`, `revokedBy` | sim | Nao deve virar permissao global; vinculo e separado de `usuarios.role`. |
| Usuarios | `admin-firebase.html`, `js/firebase-auth.js` | real | `usuarios`, `establishment_managers`, `establishment_claims` | sim | sim | nao | nao | ativa/desativa usuario | `criadoEm`; role/status sem `updatedAt` consistente | indireta | Mudanca de role e global; empreendedor nao deve receber admin para gerir empreendimento. |
| Eventos aprovados | `js/admin-content-cms.js` | real/parcial | `eventos_aprovados`, `media_library` | sim | sim | upload de capa em `cms-media/{uid}/...` | `publicado` + `status: aprovado/rascunho` | delete definitivo | `createdAt`, `updatedAt`, `updatedBy`, `reviewedAt`, `reviewedBy`; sem `publishedAt` | recebe eventos aprovados do Portal | Delete definitivo permitido por rules; publicacao mistura PT e boolean. |
| Noticias | `js/admin-content-cms.js` | real/parcial | `noticias` | sim | sim | sem upload direto no form; usa URL/galeria URL | `publicado`, `status`, `publishedAt` | delete definitivo | `createdAt`, `updatedAt`, `updatedBy`, `publishedAt` | nao | Rules permitem write admin amplo; sem schema estrito. |
| Midia | `js/admin-content-cms.js` | parcial | `media_library` | sim | sim | imagem JPG/PNG/WebP ate 5 MB em `cms-media/{uid}/...` | nao | delete doc e tenta delete Storage | `createdAt`, `updatedAt`, `updatedBy`; sem `createdBy` | nao | So imagem; sem video; sem destinos formais; delete pode quebrar referencias. |
| Banners / Pop-ups | `js/admin/modules/banners.js` | real | `banners` | sim | sim | imagem em `cms-media/{uid}/banners/{bannerId}/...` ou URL manual | `draft/published/archived`; `publishedAt` | arquiva; delete bloqueado nas rules | `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `publishedAt`, `archivedAt`; sem `publishedBy` | nao | Mais bem modelado, mas sem apagar arquivo antigo e sem `publishedBy` por regra atual. |
| Empreendimentos | `js/admin/modules/placeholder.js` | placeholder | nenhuma | nao | nao | nao | nao | nao | nao | previsto | Principal lacuna do CMS. |
| Rotas | `js/admin/modules/placeholder.js` | placeholder | nenhuma | nao | nao | nao | nao | nao | nao | nao | Dados seguem estaticos/legados. |
| Galeria | `js/admin/modules/placeholder.js` | placeholder | nenhuma | nao | nao | nao | nao | nao | nao | nao | Galeria publica e estatica; sem CMS. |
| Configuracoes | `js/admin/modules/placeholder.js` | placeholder | nenhuma | nao | nao | nao | nao | nao | nao | nao | Master-only e apenas cosmetico; sem enforcement real. |
| Sazonal / Clima | `js/admin/modules/placeholder.js` | placeholder | nenhuma | nao | nao | nao | nao | nao | nao | nao | Tema/clima atual e por JS/config estatica/API, nao CMS. |
| Mascote | `js/admin/modules/placeholder.js` | placeholder | nenhuma | nao | nao | nao | nao | nao | nao | nao | Conteudo do mascote esta em JS/i18n, nao CMS. |
| Logs / Auditoria | `js/admin/modules/placeholder.js` | placeholder | nenhuma | nao | nao | nao | nao | nao | nao | nao | Nao ha trilha central de auditoria. |

## 6. Banners e pop-ups

Status atual: modulo real e mais completo do admin modular.

| Item | Estado |
| --- | --- |
| Collection | `banners` |
| Tipos | `banner`, `popup` |
| Status | `draft`, `published`, `archived` |
| Destino | `placement`: `home`, `mapa`, `eventos`, `noticias`, `sabores`, `all`, `custom`; `targetPages` para custom/compatibilidade |
| Fields principais | `id`, `title`, `slug`, `description`, `type`, `status`, `placement`, `targetPages`, `imageUrl`, `imagePath`, `imageAlt`, `mediaId`, `ctaLabel`, `ctaUrl`, `ctaTarget`, `startAt`, `endAt`, `priority`, `frequency`, `dismissible`, `showDelayMs`, `maxWidth`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `publishedAt`, `archivedAt` |
| Upload | JPG/PNG/WebP ate 5 MB |
| Storage | `cms-media/{uid}/banners/{bannerId}/{timestamp}-{filename}` |
| Publicacao | publicar rascunho apto grava `status: published` e `publishedAt`; despublicar volta a `draft` |
| Arquivamento | `status: archived`, `archivedAt`; delete definitivo bloqueado |
| Exibicao publica | `js/public-banners.js` le `banners where status == published` e renderiza em paginas com `#public-banners-slot` |
| Paginas publicas com slot encontrado | `index.html`, `eventos.html`, `noticias.html`, `sabores.html` |
| Pendencias | sem `publishedBy`; nao apaga arquivo antigo ao trocar imagem; `mediaId` existe no schema mas o modulo trabalha principalmente com upload/URL; publicacao depende de rules publicadas no Firebase real. |

## 7. Midias

Existe biblioteca real, mas ainda parcial.

| Item | Estado |
| --- | --- |
| Modulo | `AdminContentCMS` em `js/admin-content-cms.js` |
| Collection | `media_library` |
| Storage | `cms-media/{uid}/{timestamp}-{filename}` |
| Tipos aceitos para upload | `image/jpeg`, `image/jpg`, `image/png`, `image/webp` |
| Video | nao ha upload de video; noticias aceitam `videoUrl` manual; galeria publica usa videos estaticos e YouTube hardcoded |
| Metadados | `id`, `title`, `url`, `category`, `alt`, `storagePath`, `contentType`, `size`, `createdAt`, `updatedAt`, `updatedBy` |
| Destinos de uso atuais | "Usar em evento" e "Usar em noticia" |
| Destinos ausentes | galeria publica, galeria de videos, empreendimento, banner, evento existente com workflow rico, pagina/landing especifica |
| Consumo publico direto | nao. Publico ve a midia se ela for referenciada por noticia/evento/banner, mas `media_library` nao e lida diretamente por pagina publica. |
| Delete | remove doc e tenta remover arquivo no Storage; so avisa se parece estar em uso por eventos/noticias. |

Lacuna: a biblioteca e um repositorio simples de imagens, nao um DAM/CMS de midia. Nao ha status, owner formal, tags robustas, licenca, autoria, destino, crop, galeria, video, YouTube/Vimeo modelado, nem controle de uso por modulo.

## 8. Empreendimentos e estabelecimentos

### Onde ficam os dados publicos atuais

| Fonte | Papel |
| --- | --- |
| `js/locais-data.js` | fichas de locais/pontos turisticos em `window.locaisData`; inclui galerias estaticas. |
| `js/data/restaurantes.js` | gastronomia publica em `window.TURISMO_RESTAURANTES`. |
| `js/data/hospedagens.js` | hospedagem publica em `window.TURISMO_HOSPEDAGENS`. |
| `js/data/pontos-turisticos.js` | pontos turisticos em `window.TURISMO_PONTOS`. |
| `js/data/rotas.js` | rotas em `window.TURISMO_ROTAS`. |
| `js/rotas-data.js` | estabelecimentos legados das rotas, carregados por `establishment-catalog.js` via fetch/sandbox. |
| `js/data/turismo-data-adapter.js` | mescla dados estaticos/legados em snapshot unico. |
| `js/data/turismo-data.js` | cria `window.TURISMO_DATA` para mapa, busca e estatisticas. |
| `js/establishment-catalog.js` | catalogo reivindicavel do Portal; deriva de restaurantes, hospedagens e rotas legadas. |
| Firestore `estabelecimentos_aprovados` | existe nas rules/funcoes antigas, mas nao alimenta mapa/catalogo publico atual. |

### Estado do CRUD admin

- Nao existe CRUD admin real para empreendimentos publicos.
- Existe placeholder `empreendimentos`.
- Existe fluxo legado/parcial de aprovar novo estabelecimento de `estabelecimentos_pendentes` para `estabelecimentos_aprovados`.
- O site publico nao le `estabelecimentos_aprovados`.
- O Portal nao edita dado publico; ele grava solicitacoes em `establishment_update_requests`.

### Por que aprovar solicitacao nao publica

Aprovacao de `establishment_update_requests` chama `reviewEstablishmentUpdateRequest` e altera somente o documento da solicitacao:

- `status`
- `updatedAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`
- `rejectionReason` ou `changesRequestedNotes`, conforme o caso

Nao existe hoje:

- botao "Aplicar ao catalogo";
- collection publica dinamica de empreendimentos consumida pelo mapa;
- patch automatico em `js/locais-data.js` ou `js/data/*.js`;
- `publishedAt`/`publishedBy` para solicitacoes aplicadas;
- log central de aplicacao.

### Necessario para aplicar uma solicitacao aprovada ao catalogo

1. Definir destino publico canonico: arquivos estaticos ou collection dinamica.
2. Criar modelo de empreendimento publico com schema estavel.
3. Mapear `currentSnapshot` + `requestedChanges` + `images` para esse modelo.
4. Adicionar botao admin separado "Aplicar/Publicar" para solicitacoes `approved`.
5. Gravar `publishedAt`, `publishedBy`, `appliedFromRequestId` e trilha de auditoria.
6. Ajustar rules e Storage conforme o destino.
7. Fazer o site publico consumir o destino com fallback para dados estaticos.
8. Revalidar mapa, sabores, hospedagens, busca, SEO/canonical e Portal.

## 9. Eventos

| Item | Estado |
| --- | --- |
| Eventos publicos estaticos | `js/data/eventos.js` define `window.TURISMO_EVENTOS`. |
| Eventos pendentes | Portal grava em `eventos_pendentes`. |
| Eventos aprovados | Admin aprova para `eventos_aprovados`. |
| Admin gerencia aprovados | sim, via `AdminContentCMS`: criar, editar, duplicar, destacar, publicar/despublicar, excluir. |
| Site publico le Firestore | sim. `eventos.html` e `js/mapa-turistico.js` carregam `eventos_aprovados` e mesclam/filtram. |
| Status publico | aceita status ausente/aprovado/approved em partes do mapa; admin usa `aprovado`/`rascunho` + `publicado`. |
| Upload | Portal envia imagens para `submissions/events/{uid}/{submissionId}/...`; AdminContentCMS pode fazer upload de capa em `cms-media/{uid}/...`. |
| Pendencias | padronizar status/timestamps, evitar delete definitivo sem arquivar, definir `publishedAt/publishedBy`, revisar schema estrito nas rules. |

## 10. Noticias

| Item | Estado |
| --- | --- |
| Admin gerencia | sim, via `AdminContentCMS`. |
| Collection | `noticias` |
| Publico consome | sim, `js/cms.js` le Firestore primeiro e usa localStorage/fallback se indisponivel. `noticias.html` renderiza posts do CMS quando `CMS.source === 'firebase'`. |
| Upload | nao ha upload direto; form usa URL de imagem, galeria por URLs e `videoUrl`. Midia pode abrir form de nova noticia com imagem preenchida. |
| Publicacao | `publicado: true/false`, `status: publicado/rascunho`, `publishedAt`. |
| Delete | delete definitivo pelo admin. |
| Importacao | importa cards estaticos de `noticias.html` para Firestore, evitando duplicidade por slug/origem/titulo+data. |
| Pendencias | schema de rules e bem aberto (`allow write: if isAdmin()`), sem workflow editorial, sem arquivar, sem `publishedBy`, sem upload integrado no form, sem i18n de conteudo. |

## 11. Galeria

| Item | Estado |
| --- | --- |
| Galeria publica | existe em `galeria.html`. |
| Origem dos dados | HTML estatico com imagens locais, videos locais MP4 e iframes YouTube. |
| Admin gerencia | nao. `galeria` no admin e placeholder. |
| Imagens | hardcoded no HTML e em fontes estaticas como `js/locais-data.js`/`js/data/*.js`. |
| Videos | dois videos locais (`videos/INSTITUCIONAL_POLONES.mp4`, `videos/VIDEO_ABERTURA_4K.mp4`) e embeds YouTube. Vimeo nao foi encontrado como fluxo atual. |
| Relacao com `media_library` | nenhuma direta. |
| Pendencias | criar collection/modelo da galeria, rules, suporte a imagem/video/link externo, metadados, ordenacao, status, destino e consumo publico. |

## 12. Relacao Admin x Portal do Usuario

| Fluxo | Portal | Admin | Resultado atual |
| --- | --- | --- | --- |
| Conta | cria/login via Firebase Auth e doc `usuarios` | lista/role/status em `usuarios` | role global define acesso ao admin; empreendedor deve seguir como `user`. |
| Solicitacao de vinculo | cria `establishment_claims` | aprova/rejeita em `vinculos` | aprovado cria `establishment_managers` ativo. |
| Vínculo manual | nao cria | admin cria em `gerenciar-vinculos` | usuario passa a ver empreendimento no Portal se `userId` e `active:true` batem. |
| Meus empreendimentos | le `establishment_managers where userId == uid AND active == true` | gerencia `establishment_managers` | separado de `usuarios.role`. |
| Evento vinculado | cria `eventos_pendentes` com `source: establishment_manager` | aprova para `eventos_aprovados` | evento aprovado aparece no publico. |
| Novo estabelecimento | cria `estabelecimentos_pendentes` | aprova para `estabelecimentos_aprovados` | nao aparece automaticamente no site publico atual. |
| Alteracao de empreendimento | cria `establishment_update_requests` com `currentSnapshot`, `requestedChanges`, anexos | aprova/rejeita/pede ajustes | aprovado nao publica; fica aguardando aplicacao controlada futura. |

Pendencias para fechar o fluxo:

- Tela/filtro para solicitacoes aprovadas aguardando aplicacao.
- Acao separada de aplicacao/publicacao.
- Destino publico de empreendimentos consumido pelo site.
- Timestamps de publicacao/aplicacao.
- Auditoria central.
- Mensagens operacionais no guia do empreendedor e no admin.

## 13. Rules mapeadas

### Firestore

| Collection/path | Rules atuais | Modulos cobertos |
| --- | --- | --- |
| `usuarios/{userId}` | admin le/escreve; usuario le proprio e atualiza campos limitados | login, usuarios, dashboard |
| `eventos_pendentes/{eventId}` | moderador ou dono le; usuario cria evento comum/vinculado; moderador atualiza/deleta | Portal eventos, Aprovacoes |
| `estabelecimentos_pendentes/{estId}` | moderador ou dono le; usuario cria; moderador atualiza/deleta | Portal novo estabelecimento, Aprovacoes |
| `eventos_aprovados/{eventId}` | leitura publica; write moderador | eventos admin e publico |
| `estabelecimentos_aprovados/{estId}` | leitura publica; write moderador | fluxo legado/parcial; publico atual nao consome |
| `establishment_claims/{claimId}` | dono/moderador le; usuario cria schema restrito; moderador update/delete | vinculos Portal/Admin |
| `establishment_managers/{managerId}` | moderador le; dono le se `active == true`; moderador create/update/delete | Meus empreendimentos e Admin vinculos |
| `establishment_update_requests/{requestId}` | dono/moderador le; dono cria com vinculo ativo e schema restrito; moderador update/delete | solicitacoes de alteracao |
| `noticias/{noticiaId}` | leitura publica; write admin | noticias CMS |
| `media_library/{mediaId}` | leitura publica; write admin | biblioteca de midia |
| `reservas/{reservaId}` | create publico com schema; admin le/update/delete | fora do bloco CMS admin atual |
| `banners/{bannerId}` | publico le apenas `published`; admin le todos; create/update com schema; delete bloqueado | banners/pop-ups |
| fallback | read/write false | tudo nao previsto |

### Storage

| Path | Rules atuais | Usado por |
| --- | --- | --- |
| `submissions/establishments/{uid}/{submissionId}/{fileName}` | dono faz upload imagem ate 5 MB; dono/staff le/deleta | cadastro novo de estabelecimento |
| `submissions/events/{uid}/{submissionId}/{fileName}` | dono faz upload imagem ate 5 MB; dono/staff le/deleta | eventos do Portal |
| `submissions/establishment-updates/{uid}/{submissionId}/{fileName}` | dono faz upload imagem ate 5 MB; dono/staff le/deleta | solicitacoes de alteracao |
| `cms-media/{uid}/{allFiles=**}` | leitura publica; admin do proprio uid faz upload imagem ate 5 MB; admin deleta | midia CMS e banners |
| fallback | read/write false | tudo nao previsto |

### Modulos sem rules prontas

- `empreendimentos` como collection publica dinamica.
- `galeria` como collection.
- `rotas` como collection.
- `site_config`/configuracoes.
- `seasonal`/sazonal/clima via CMS.
- `mascote` via CMS.
- `audit_logs`.
- Upload de video em `cms-media` ou outro path.

Qualquer bloco futuro que criar esses destinos precisa publicar rules antes do uso real.

## 14. Dados, timestamps e datas

### Padroes encontrados

| Dominio | Campos usados |
| --- | --- |
| Usuarios | `criadoEm`, `role`, `ativo`; mudancas de role/status sem timestamp consistente. |
| Eventos pendentes | `createdAt`, `updatedAt`, `submittedAt`, `reviewedAt`, `reviewedBy`, `reviewNotes`. |
| Eventos aprovados | `createdAt`, `updatedAt`, `updatedBy`, `reviewedAt`, `reviewedBy`, `publicado`, `status`; sem `publishedAt/publishedBy` padronizado. |
| Estabelecimentos pendentes/aprovados | `submittedAt`, `reviewedAt`, `reviewedBy`, `reviewNotes`; aprovados nao alimentam publico. |
| Claims | `createdAt`, `updatedAt`, `reviewedAt`, `reviewedBy`, `reviewNotes`, `rejectionReason`. |
| Managers | `approvedAt`, `approvedBy`, `updatedAt`, `updatedBy`, `revokedAt`, `revokedBy`, `revokeReason`, `active`. |
| Update requests | `createdAt`, `updatedAt`, `submittedAt`, `reviewedAt`, `reviewedBy`; sem `approvedAt/approvedBy`; sem `publishedAt/publishedBy`. |
| Noticias | `createdAt`, `updatedAt`, `updatedBy`, `publishedAt`, `data`, `publicado`, `status`; sem `publishedBy`. |
| Media library | `createdAt`, `updatedAt`, `updatedBy`; sem status/publicacao. |
| Banners | `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `publishedAt`, `archivedAt`; sem `publishedBy`. |
| Site/meta | `js/site-meta.js` tem `updatedAt`; `sitemap.xml` tem `lastmod`; `sw.js` tem `CACHE_NAME`; `config.js` tem datas de campanha. |

### Inconsistencias

- Mistura de status em PT e EN: `pendente/aprovado/rejeitado`, `pending/approved/rejected/changes_requested`, `draft/published/archived`, `publicado/rascunho`.
- Alguns dominios usam `publicado` boolean + `status`; outros usam apenas `status`.
- `publishedAt` existe em banners/noticias, mas nao em eventos aprovados nem update requests.
- `publishedBy` quase nao existe; banners explicitamente nao grava por nao estar permitido nas rules atuais.
- `delete` definitivo existe para eventos aprovados, noticias e midia; banners usa arquivamento.
- `createdBy` existe em banners, mas nao e uniforme nos outros CMS.
- `lastUpdated`/`lastmod` sao separados do CMS e nao sao atualizados por essas acoes.

### Regra obrigatoria de datas

Este bloco nao atualizou:

- `sitemap.xml`
- `js/site-meta.js`
- `config.js`

Onde ha datas de atualizacao:

- `sitemap.xml`: `lastmod` por URL publica.
- `js/site-meta.js`: `window.SITE_META.updatedAt`.
- `config.js`: datas de campanha/evento configurado (`dataInicio`, `dataFim`) e configuracoes globais.
- `sw.js`: `CACHE_NAME`, hoje `turismo-sms-v21`.
- Collections Firestore conforme matriz acima.

Em blocos futuros, atualizar datas somente quando houver mudanca publica/indexavel ou componente global relevante. Fluxos autenticados/admin por si so nao justificam `lastmod` publico.

## 15. O que o site publico realmente consome hoje

| Area publica | Fonte atual |
| --- | --- |
| Mapa turistico | `window.TURISMO_DATA` derivado de `js/data/*.js`, `js/locais-data.js` e adapter; tambem carrega `eventos_aprovados` do Firestore. |
| Eventos | baseline estatico + `eventos_aprovados` do Firestore. |
| Noticias | `js/cms.js` le `noticias`; fallback local/static se Firebase indisponivel. |
| Banners/pop-ups | `js/public-banners.js` le `banners where status == published` em paginas com slot. |
| Galeria | `galeria.html` estatico, imagens locais, MP4 locais e YouTube. |
| Empreendimentos/sabores/hospedagem | dados estaticos em `js/data/*.js`, `js/locais-data.js` e rotas legadas; nao le `estabelecimentos_aprovados` nem `establishment_update_requests`. |
| Midia | nao le `media_library` diretamente. |
| Mascote/sazonal/clima | JS/CSS/config/API, nao CMS. |

## 16. O que o Portal do Usuario consome hoje

| Area do Portal | Fonte |
| --- | --- |
| Auth/perfil | Firebase Auth + `usuarios/{uid}` |
| Catalogo reivindicavel | `js/establishment-catalog.js` derivado de dados estaticos/legados |
| Minhas solicitacoes de vinculo | `establishment_claims where userId == uid` |
| Meus empreendimentos | `establishment_managers where userId == uid AND active == true` |
| Minhas solicitacoes de alteracao | `establishment_update_requests where ownerUid == uid` |
| Meus eventos | `eventos_pendentes` + `eventos_aprovados` por `submittedBy` |
| Uploads | `submissions/events`, `submissions/establishments`, `submissions/establishment-updates` |

## 17. Lacunas principais do CMS

1. Admin ainda nao e CMS completo: ha modulos reais, mas dados centrais de turismo seguem estaticos.
2. `AdminRegistry` existe, mas a sidebar e o roteamento operacional ainda sao legados.
3. Empreendimentos nao tem CRUD real nem destino publico dinamico.
4. Solicitacoes aprovadas nao tem aplicacao/publicacao.
5. Midia nao e DAM completo; nao cobre videos nem destinos formais.
6. Galeria publica nao e administravel.
7. Rotas nao sao administraveis.
8. Configuracoes, sazonal/clima e mascote sao placeholders sem rules.
9. Auditoria central nao existe.
10. Status/timestamps nao sao padronizados.
11. Algumas rules de CMS (`noticias`, `media_library`, `eventos_aprovados`) sao amplas comparadas ao schema de banners.
12. Delete definitivo ainda existe em modulos onde arquivar seria mais seguro.

## 18. Riscos

- Criar CRUD de empreendimentos sem definir fonte publica pode gerar dois catalogos divergentes.
- Fazer o mapa ler Firestore sem fallback e QA pode quebrar mapa, sabores, hospedagem, busca e SEO.
- Aprovar solicitacao de alteracao pode continuar sendo interpretado como publicacao se o operador nao tiver uma fila de "aguardando aplicacao".
- Upload de video em Storage exige decisao de limite, custo, transcodificacao, cache e rules; nao cabe como extensao trivial de imagem.
- Master-only atual e cosmetico nos placeholders; esconder no client nao substitui enforcement por rules.
- Rules publicadas no Console podem estar diferentes dos arquivos locais; validacao local nao prova producao.
- Fluxos admin/portal exigem teste autenticado real com App Check e usuario adequado.

## 19. Matriz de priorizacao

| Bloco | Objetivo | Arquivos provaveis | Collections | Rules necessarias | Risco | Validacoes |
| --- | --- | --- | --- | --- | --- | --- |
| CMS-2: CRUD de empreendimentos | Definir modelo publico administravel e CRUD admin para empreendimentos, sem ligar publico antes do contrato estar estavel. | `admin-firebase.html`, `js/admin/modules/empreendimentos.js`, `js/admin/admin-*`, talvez `js/admin-content-cms.js` | `empreendimentos` ou destino definido | Firestore schema restrito; Storage subpath de imagens | alto | `node --check`, smoke admin autenticado, rules emulator/manual, auditoria de dados |
| CMS-3: aplicacao de solicitacoes aprovadas | Botao/fila para aplicar `establishment_update_requests` aprovadas ao destino definido. | `admin-firebase.html`, `js/firebase-auth.js`, modulo de empreendimentos | `establishment_update_requests`, destino publico | update restrito por admin/mod; `publishedAt/publishedBy/appliedFromRequestId` | alto | teste com solicitacao real, diff de dados, mapa sem regressao |
| CMS-4: midias/imagens/videos | Evoluir `media_library` para biblioteca com destinos, status e suporte planejado a video/link externo. | `js/admin-content-cms.js` ou modulo `midia`, `storage.rules`, `firestore.rules` | `media_library` | schema, paths de video se aprovado | medio/alto | upload imagem, rejeicao video ate rules novas, custos/limites documentados |
| CMS-5: galeria publica integrada | Tornar `galeria.html` consumidora de dados CMS com fallback estatico. | `galeria.html`, `css/galeria.css`, `js/public-gallery.js`, modulo `galeria` | `gallery_items` ou equivalente | leitura publica somente publicados; write admin | medio | visual desktop/mobile, videos locais/YouTube, audit assets/links |
| CMS-6: noticias/eventos | Padronizar workflow editorial, timestamps, arquivamento e schema de noticias/eventos. | `js/admin-content-cms.js`, `js/cms.js`, `eventos.html`, `js/mapa-turistico.js`, rules | `noticias`, `eventos_aprovados` | schema mais restrito, arquivamento, publishedBy | medio | eventos/noticias publicos, importacao, mapa, audit-links |
| CMS-7: auditoria/logs | Criar trilha central de acoes administrativas. | novo modulo `audit-logs`, chamadas nos modulos reais | `audit_logs` | write por funcoes/client admin restrito; read master/admin | medio | acoes geram log; sem vazamento publico |
| CMS-8: configuracoes/sazonal/mascote | Migrar configuracoes globais com cuidado, mantendo fallback estatico. | `config.js`, `js/season-theme.js`, `js/tourism-mascot.js`, modulo config | `site_config`, `seasonal_config`, `mascot_config` | master/admin restrito; leitura publica seletiva | alto | i18n, cache, site-meta/sitemap conforme mudanca |

## 20. Proximo bloco recomendado

Recomendacao: **CMS-2 - modelo e CRUD de empreendimentos**, mas dividido em duas etapas curtas:

1. **CMS-2A: contrato de dados e rules de empreendimentos**  
   Definir schema, campos, status, timestamps, imagens e relacao com `establishment_update_requests`, sem ainda trocar o consumo publico.

2. **CMS-2B: CRUD admin de empreendimentos em modo interno**  
   Implementar listar/criar/editar/arquivar no admin, ainda com aviso claro de que o site publico so sera conectado em bloco posterior.

Motivo: sem um destino publico/administravel de empreendimentos, CMS-3 (aplicar solicitacoes) nao tem onde publicar com seguranca.

## 21. Validacoes executadas neste bloco

| Comando | Resultado |
| --- | --- |
| `node --check js/firebase-auth.js` | OK |
| `node --check config.js` | OK |
| `node --check sw.js` | OK |
| `node --check js/admin/admin-registry.js` | OK |
| `node --check js/admin/admin-router.js` | OK |
| `node --check js/admin/admin-shell.js` | OK |
| `node scripts/audit-links.mjs` | 734 links, 0 broken, 1 known false positive, 33 legacy/redundant candidates |
| `node scripts/audit-assets.mjs` | 226 media, 0 duplicate groups, 0 missing references |
| `node scripts/audit-project.mjs` | 434 files, 36 html, 24 css, 47 js |

Nao ha `package.json` no repositorio; portanto nao existem scripts locais `npm run build`, `npm run lint` ou `npm run test` para executar.

Os audits regeneraram:

- `docs/auditoria-output/assets-report.json`
- `docs/auditoria-output/assets-report.md`
- `docs/auditoria-output/links-report.json`
- `docs/auditoria-output/links-report.md`
- `docs/auditoria-output/project-report.json`
- `docs/auditoria-output/project-report.md`
