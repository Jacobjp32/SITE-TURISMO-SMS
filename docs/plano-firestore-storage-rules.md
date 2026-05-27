# Plano de Firestore e Storage Rules

## Status da Fase 1.4 - rules locais para alteracoes de empreendimento

Arquivos ajustados nesta fase:

- `firestore.rules`
- `storage.rules`

Objetivo da mudanca local:

- permitir que usuario autenticado com vinculo ativo crie somente a propria solicitacao em `establishment_update_requests`;
- limitar leitura do usuario comum apenas aos seus pedidos;
- manter revisao, aprovacao, rejeicao e `changes_requested` somente para `admin` e `moderator`;
- reaproveitar upload privado para `submissions/establishment-updates/{uid}/{requestId}/{fileName}`;
- impedir que este fluxo escreva diretamente nos dados publicos do site.

Politica local adicionada:

- o create exige `managerId` valido em `establishment_managers`;
- `ownerUid` e `ownerEmail` precisam bater com o usuario autenticado;
- `status` inicial e sempre `pending`;
- `currentSnapshot` e `requestedChanges` ficam restritos ao schema esperado desta fase;
- `reviewedAt`, `reviewedBy`, `reviewNotes`, `rejectionReason` e `changesRequestedNotes` nascem vazios;
- upload continua limitado a JPG/JPEG/PNG/WebP com maximo de 5 MB por arquivo.

Passo manual obrigatorio antes de ambiente real:

1. revisar `firestore.rules`;
2. revisar `storage.rules`;
3. publicar ambas no projeto Firebase correto via Console ou CLI oficial;
4. testar com:
   - usuario comum com vinculo ativo;
   - usuario comum sem vinculo;
   - conta admin/moderator;
   - aprovacao, rejeicao e pedido de ajustes.

Importante:

- nada foi publicado automaticamente pelo repositorio;
- a aprovacao da solicitacao continua sem publicar nada no mapa publico;
- o uso de `getDownloadURL()` para anexos segue o padrao atual do portal e deve continuar sendo revisado em fase futura se a politica de arquivos pendentes ficar mais rigida.

## Status da Fase 1.3 - gestao administrativa de vinculos

Arquivo ajustado nesta fase:

- `firestore.rules`

Objetivo da mudanca local:

- manter `establishment_managers` com escrita apenas para staff;
- permitir leitura total de `establishment_managers` por `admin` e `moderator`;
- limitar usuario comum a leitura apenas dos proprios vinculos ativos;
- preservar o fluxo de criacao/edicao/desativacao/reativacao manual no admin sem abrir permissao para usuario comum.

Importante:

- a regra revisada continua apenas local no repositorio;
- ainda existe passo manual para publicar a versao revisada no Firebase Console ou pela CLI oficial;
- `storage.rules` nao precisou mudar nesta rodada.

## Status da Fase 1.2 - eventos vinculados ao empreendimento

Arquivo ajustado nesta fase:

- `firestore.rules`

Objetivo da mudanca local:

- permitir `eventos_pendentes` comuns com `source = portal_usuario`;
- permitir `eventos_pendentes` vinculados com `source = establishment_manager`;
- exigir que evento vinculado aponte para um `linkedManagerId` real em `establishment_managers`;
- exigir que o manager esteja ativo e que os campos `linkedEstablishmentId`, `linkedEstablishmentName` e `linkedEstablishmentRole` batam com o documento do manager;
- manter `eventos_aprovados` como leitura publica e escrita apenas staff.

Importante:

- a rule nova continua apenas local no repositorio;
- ainda existe passo manual para publicar a versao revisada no Firebase Console ou pela CLI oficial;
- `storage.rules` nao precisou mudar, porque o upload continua usando o mesmo path de `submissions/events/{uid}/{submissionId}`.

## Status da Fase 1.1 - vinculo com empreendimento existente

Arquivos versionados nesta fase:

- `firestore.rules`
- `portal-usuario.html`
- `admin-firebase.html`
- `js/firebase-auth.js`

Collections novas previstas no Firestore:

- `establishment_claims`
- `establishment_managers`

Politica adicionada localmente:

- usuario autenticado cria apenas o proprio claim com `status = pending`;
- usuario le apenas os proprios claims;
- usuario nao aprova, nao rejeita e nao cria manager;
- admin/moderator le todos os claims;
- admin/moderator aprova/rejeita claims;
- usuario le apenas os proprios managers;
- admin/moderator cria e atualiza managers.

Importante:

- essa mudanca ficou apenas no arquivo local `firestore.rules`;
- continua necessario publicar manualmente a versao revisada no Firebase Console ou pela CLI oficial;
- nenhuma Storage Rule nova foi necessaria para o fluxo de vinculo.

Documento detalhado:

- `docs/plano-vinculo-empreendimentos.md`

## Status da Fase 1

O repositorio agora tem um arquivo local `storage.rules`, mas ele ainda e apenas rascunho versionado.

Implementado no app:

- upload de ate 6 imagens no portal;
- validacao cliente de tipo e tamanho;
- paths privados por `uid` e `submissionId`;
- gravacao dos metadados das imagens em `eventos_pendentes` e `estabelecimentos_pendentes`.

Ainda depende de acao manual antes de producao:

- revisar o conteudo de `storage.rules`;
- publicar as Storage Rules no Firebase Console ou via CLI do projeto;
- testar upload real com usuario comum e conta administrativa.

## 1. Objetivo

Fechar a proposta tecnica de rules para suportar, em fase futura:

- upload de ate 6 imagens por envio;
- eventos e estabelecimentos com fluxo de aprovacao;
- leitura privada do proprio envio;
- revisao por admin/moderador;
- preservacao do fluxo atual com menor risco.

## 2. Diagnostico atual

### Firestore

As rules atuais:

- sao restritivas;
- protegem bem o fluxo vigente;
- usam `submittedBy`;
- nao permitem edicao pelo dono apos create;
- nao conhecem `changes_requested`;
- nao conhecem collections unificadas.

### Storage

Estado atual:

- `storageBucket` existe em `config.js`;
- existe `storage.rules` local, ainda nao publicado;
- o portal agora usa Firebase Storage para anexos de cadastros pendentes;
- a path policy atual usa `submissions/events/{uid}/{submissionId}` e `submissions/establishments/{uid}/{submissionId}`.

## 3. Decisao recomendada de arquitetura

### Curto prazo

Manter collections atuais:

- `eventos_pendentes`
- `eventos_aprovados`
- `estabelecimentos_pendentes`
- `estabelecimentos_aprovados`

Motivo:

- menor impacto no codigo atual;
- menor risco de regressao;
- melhor para uma fase 1 cirurgica com upload.

### Medio prazo

Preparar modelo de campos compativel com futura migracao para:

- `event_submissions`
- `establishment_submissions`
- `establishment_update_requests`

Motivo:

- evita retrabalho de schema;
- simplifica migracao posterior;
- reduz lock-in no modelo legado.

## 4. Modelo final recomendado

### Evento

Campos recomendados:

- `id`
- `ownerUid`
- `ownerEmail`
- `ownerName`
- `status`
- `title`
- `date`
- `time`
- `location`
- `description`
- `organizer`
- `phone`
- `whatsapp`
- `instagram`
- `website`
- `images`
- `mainImage`
- `createdAt`
- `updatedAt`
- `submittedAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`
- `rejectionReason`
- `source`

### Estabelecimento

Campos recomendados:

- `id`
- `ownerUid`
- `ownerEmail`
- `ownerName`
- `status`
- `name`
- `category`
- `address`
- `description`
- `phone`
- `whatsapp`
- `instagram`
- `website`
- `openingHours`
- `images`
- `mainImage`
- `createdAt`
- `updatedAt`
- `submittedAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`
- `rejectionReason`
- `source`

### Pedido de alteracao

Campos recomendados:

- `id`
- `establishmentId`
- `ownerUid`
- `ownerEmail`
- `status`
- `requestedChanges`
- `images`
- `mainImage`
- `createdAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`

### Images

Cada item do array `images`:

- `path`
- `url`
- `fileName`
- `contentType`
- `sizeBytes`
- `position`
- `uploadedAt`

## 5. Proposta de Firestore Rules

### Politica geral

- usuario autenticado cria apenas documentos proprios;
- usuario autenticado le apenas documentos proprios;
- usuario autenticado edita apenas documentos proprios enquanto `status` for `pendente` ou `changes_requested`;
- usuario comum nunca aprova nem rejeita;
- moderador/admin le todos os pendentes;
- moderador/admin revisa status e observacoes;
- colecoes aprovadas publicas so se forem realmente usadas na area publica;
- escrita anonima proibida.

### Status recomendados

- `pendente`
- `changes_requested`
- `aprovado`
- `rejeitado`

### Regras recomendadas para collections atuais

#### `eventos_pendentes`

- `create`
  - autenticado;
  - `ownerUid` e `submittedBy` igual ao uid logado;
  - `status == 'pendente'`;
  - para evento comum:
    - `source = portal_usuario`;
    - campos `linked*` nulos.
  - para evento vinculado:
    - `source = establishment_manager`;
    - `linkedManagerId` precisa existir em `establishment_managers`;
    - `linkedEstablishmentId`, `linkedEstablishmentName` e `linkedEstablishmentRole` precisam bater com o manager;
    - o manager precisa estar `active == true`;
    - `userId` do manager precisa ser o mesmo usuario autenticado.
- `read`
  - owner;
  - moderador/admin.
- `update` pelo owner
  - somente se status atual for `pendente` ou `changes_requested`;
  - sem alterar `status`, `reviewedAt`, `reviewedBy`, `reviewNotes`, `rejectionReason`;
  - sem trocar owner.
- `update` pelo moderador/admin
  - pode mudar `status`;
  - pode preencher campos de revisao.
- `delete`
  - preferencialmente apenas admin/moderador, se necessario.

#### `estabelecimentos_pendentes`

- mesmo desenho de `eventos_pendentes`.

#### `eventos_aprovados`

- `read`
  - publico se continuar servindo a area publica.
- `write`
  - somente moderador/admin.

#### `estabelecimentos_aprovados`

- `read`
  - publico se continuar servindo a area publica.
- `write`
  - somente moderador/admin.

### Regras recomendadas para collections unificadas

Se houver migracao futura:

- `event_submissions`
- `establishment_submissions`
- `establishment_update_requests`

Aplicar a mesma logica:

- owner cria;
- owner le os seus;
- owner atualiza so quando permitido;
- moderador/admin le todos e revisa;
- publico nao le bruto.

## 6. Proposta de Storage Rules

### Paths

- `submissions/establishments/{uid}/{submissionId}/{fileName}`
- `submissions/events/{uid}/{submissionId}/{fileName}`

### Politica

- `write`
  - somente autenticado;
  - apenas no proprio `uid`;
  - somente MIME:
    - `image/jpeg`
    - `image/png`
    - `image/webp`
  - tamanho maximo de `5 MB`.
- `read`
  - owner do path;
  - admin/moderador;
  - sem leitura publica dos brutos pendentes.
- `list`
  - evitar publico;
  - limitar a owner e admin se realmente necessario.

### O que as Storage Rules nao resolvem sozinhas

- contar exatamente 6 arquivos por submissao;
- impedir duplicatas de conteudo;
- validar coerencia entre Firestore e Storage;
- validar ordem editorial das imagens.
- limpar arquivos ja enviados quando o `set` no Firestore falhar.

Esses pontos devem ser tratados no app e, quando possivel, cruzados com o documento Firestore.

## 7. Regras complementares de seguranca

- escapar dados ao renderizar no portal/admin;
- nao confiar em extensao do arquivo sozinha;
- validar MIME e tamanho no cliente;
- nao aceitar SVG;
- nao aceitar HEIC, DNG, ZIP;
- nao usar `localStorage` para privilegio admin;
- revisar se `moderator` continua com poder de aprovacao;
- nao tornar imagens pendentes publicas por URL aberta sem decisao explicita.

## 8. Plano de publicacao seguro

1. Revisar rules propostas com validacao humana.
2. Publicar `storage.rules` no Firebase.
3. Revisar se as `firestore.rules` atuais vao continuar aceitando os novos campos na collection de pendentes.
4. Testar com usuario comum, moderador e admin.
5. Confirmar mensagens de erro de upload bloqueado no portal.
6. So depois considerar aprovacoes visuais mais completas no admin.

## 9. O que nao fazer agora

- nao publicar rules automaticamente;
- nao supor que o upload funcione em producao antes de publicar as rules reais;
- nao migrar collections agora;
- nao abrir leitura publica de pendentes;
- nao acoplar mapa diretamente a colecoes brutas.
