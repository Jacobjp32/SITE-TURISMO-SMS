# Plano de Firestore e Storage Rules

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
- nao existe `storage.rules`;
- nao existe uso real do Firebase Storage no portal/admin;
- nao existe path policy definida para uploads.

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
  - `ownerUid` e/ou `submittedBy` igual ao uid logado;
  - `status == 'pendente'`;
  - apenas campos permitidos.
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
  - tamanho maximo de `3 MB`.
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
2. Definir schema final da fase 1.
3. Ajustar Firestore rules primeiro.
4. Criar Storage rules.
5. Testar com usuario comum, moderador e admin.
6. So depois implementar upload na UI.

## 9. O que nao fazer agora

- nao publicar rules automaticamente;
- nao ligar Storage na UI antes das rules;
- nao migrar collections agora;
- nao abrir leitura publica de pendentes;
- nao acoplar mapa diretamente a colecoes brutas.
