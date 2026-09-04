# SITE V2 Admin Finalization — Gates Resolution

## Status

- Baseline auditada: `main` em `ef31a5a051e2ed587df31cb187bd79f1f0292fdf`, igual a `origin/main`.
- Auditoria remota: somente leitura, sem escrita Firestore/Storage/Auth e sem deploy.
- Fonte detalhada sanitizada: `gates-resolution-report.json`.
- Manifesto determinístico: `gallery-migration-manifest.json`.
- O `SITE-V2-ADMIN-FINALIZATION-EXEC` não foi executado.

## Schema remoto observado

| Collection | Documentos | Compatibilidade | Observação sanitizada |
| --- | ---: | --- | --- |
| `usuarios` | 11 | `COMPATIBLE_SUPERSET` | `role` e `ativo` existem; foram observados `admin` e `user`, todos os valores de `ativo` observados eram boolean `true` |
| `eventos_pendentes` | 0 | `UNKNOWN` | collection não observada; ausência é compatível com fila vazia, mas não prova shape remoto |
| `estabelecimentos_pendentes` | 0 | `UNKNOWN` | collection não observada; ausência é compatível com fila vazia, mas não prova shape remoto |
| `eventos_aprovados` | 10 | `COMPATIBLE_SUPERSET` | status observado `aprovado`; `publicado=true`; timestamps e campos de revisão presentes |
| `estabelecimentos_aprovados` | 1 | `COMPATIBLE_SUPERSET` | status observado `aprovado`; contrato legacy preservado |
| `establishment_claims` | 3 | `COMPATIBLE_SUPERSET` | status observado `approved`; campos de revisão presentes |
| `establishment_managers` | 12 | `COMPATIBLE_LEGACY` | roles observadas incluem forma canônica e forma legacy normalizada pelo source |
| `establishment_update_requests` | 1 | `COMPATIBLE_SUPERSET` | status observado `approved`; aplicação/revisão registradas estruturalmente |
| `cms_establishments` | 67 | `COMPATIBLE_LEGACY` | amostra publicada sem envelope `schemaVersion=2`; leitura legacy é aceita, mas edição completa exige bootstrap C1 V2 |
| `rotas` | 6 | `MATCH` | shape observado coincide com o contrato atual de Rotas; `schemaVersion` não faz parte desse contrato |
| `noticias` | 9 | `COMPATIBLE_SUPERSET` | `status=publicado`, `publicado=true`, timestamps e `updatedBy` presentes |
| `media_library` | 0 | `UNKNOWN` | collection não observada; nenhum match remoto da Galeria é possível |
| `banners` | 4 | `MATCH` | status observados `draft`, `published`, `archived`; tipos `banner` e `popup` |
| `gallery_items` | 0 | `MIGRATION_REQUIRED` | ausente |
| `site_config` | 0 | `MIGRATION_REQUIRED` | ausente; `seasonal` e `mascot` serão creates planejados |
| `audit_logs` | 0 | `MIGRATION_REQUIRED` | ausente |

Nenhum conteúdo pessoal bruto foi persistido no relatório. Os shapes contêm apenas nomes de campos, tipos, enums e contagens.

## Galeria

### Inventário e matching

- Itens públicos encontrados: 33.
- Imagens elegíveis para V1: 28.
- Vídeos preservados exclusivamente no fallback estático: 5.
- Match exato com `media_library`: 0.
- Itens estáticos sem match: 33.
- Ambiguidades: 0.
- Assets inválidos: 0.
- Creates planejados: 28.
- Updates planejados: 0.
- Deletes planejados: 0.

Como `media_library` não existe em produção, as 28 imagens usam as URLs estáticas já publicadas. O contrato não cria upload, não copia objetos e não cria um segundo pipeline Storage.

### IDs e fingerprint

Algoritmo de ID:

```text
slug(basename sem extensão, máximo 48 caracteres)
+ "-"
+ 12 primeiros hex de SHA-256(category + "\n" + mediaType + "\n" + canonicalPublicUrl)
```

O índice/ordem não entra na identidade. Reordenar não troca o ID. A ordem pública permanece em `displayOrder`.

Fingerprint do manifesto:

```text
0bd0057e7a4d240f1025a05e4344028ca658687d881b2a39dba71dd3cbefe68d
```

### Cutover obrigatório

1. A — executar migration autorizada em modo `CREATE_IF_ABSENT`, por runner confiável/IAM e com o manifesto congelado; o catch-all atual mantém os dados inacessíveis aos clientes.
2. B — fazer read-back dos documentos criados.
3. C — validar IDs, fingerprints, contagem 28 e zero documentos inesperados.
4. D — publicar as Rules de `gallery_items`, já comprovadas no Emulator, em ato separado/autorizado.
5. E — publicar o adapter `js/public-gallery.js` e a integração de `galeria.html` em outro ato autorizado.
6. F — manter o conteúdo estático como fallback integral, inclusive os cinco vídeos.
7. G — executar smoke público, console/network e regressão responsiva.
8. H — somente depois considerar o fallback legacy removível; não removê-lo no primeiro cutover.

## Backend de auditoria

### Tecnologia e trigger

- Cloud Functions for Firebase 2nd gen.
- Runtime alvo: Node.js 22; o Node local 24 é apenas a ferramenta local e não deve virar runtime de deploy.
- Região: `southamerica-east1`, igual à região Firestore.
- Um `onDocumentWrittenWithAuthContext` para `{collectionId}/{documentId}`.
- Allowlist interna de collections administrativas.
- Retorno imediato para `audit_logs`, evitando loop.
- Retorno sem log para navegação, leitura e no-op sem mudança de dados.

Allowlist inicial:

```text
usuarios
eventos_pendentes
estabelecimentos_pendentes
eventos_aprovados
estabelecimentos_aprovados
establishment_claims
establishment_managers
establishment_update_requests
cms_establishments
rotas
noticias
media_library
banners
gallery_items
site_config
```

### Identidade do ator

- Persistir `event.authId` como `actorPrincipalId`, sem renomeá-lo para UID.
- Persistir `event.authType` como `actorAuthType`.
- Resolver `actorRoleSnapshot` somente quando `usuarios/{actorPrincipalId}` existir, estiver ativo e a identidade puder ser correlacionada deterministicamente.
- Para `service_account`, `api_key`, `system`, `unauthenticated` ou `unknown`, não inventar role.
- Não persistir e-mail, token ou claims brutas.

### Idempotência

- Identidade primária: CloudEvent `event.id`.
- Se `event.id` for compatível com ID Firestore, usar `audit_logs/{event.id}`.
- Se contiver `/` ou exceder o limite aceito, usar `audit_logs/{sha256(event.id)}` e manter o `eventId` original no documento.
- Gravar com operação backend `create`, nunca `set` com overwrite.
- `ALREADY_EXISTS` significa reentrega já registrada e deve encerrar com sucesso.
- Não assumir ordenação global; ordenar consultas por `timestamp` e usar `eventId` como desempate.

Resultado exigido:

```text
duplicateDeliveryCreatesDuplicateLog=false
```

### Schema

```text
audit_logs/{eventIdOrHash} = {
  eventId: string,
  actorPrincipalId?: string,
  actorAuthType: string,
  actorRoleSnapshot?: "moderator" | "admin",
  action: string,
  entityType: string,
  entityId: string,
  timestamp: timestamp,
  summary: string,
  metadata: map,
  source: "firestore-auth-context-v2"
}
```

`summary` será gerado deterministicamente no backend. `metadata` aceita somente:

```text
changedFields
fromStatus
toStatus
publicationFrom
publicationTo
roleFrom
roleTo
activeFrom
activeTo
requestStatusFrom
requestStatusTo
```

É proibido armazenar snapshot completo, conteúdo editorial integral, senha, token, credencial, perfil pessoal bruto, e-mail, telefone ou endereço.

### Derivação de ações

| Ação | Estratégia | Evidência |
| --- | --- | --- |
| `create` | A — inferida | before ausente, after presente |
| `update` | A — inferida | before e after presentes com diff real |
| `delete` | A — inferida | before presente, after ausente |
| `publish` | A — inferida | `status` entra em `published/publicado` ou `publicado` muda para `true` |
| `unpublish` | A — inferida | saída do estado publicado ou `publicado` muda para `false` |
| `archive` | A — inferida | `status` entra em `archived/arquivado` |
| `reject` | A — inferida | `status` entra em `rejected/rejeitado` |
| `request_changes` | A — inferida | `status` entra em `changes_requested` |
| `change_user_role` | A — inferida | diff exato de `usuarios.role` |
| `change_user_status` | A — inferida | diff exato de `usuarios.ativo` |
| `approve` em claim/update request | A — inferida | transição para `approved` |
| `approve` de evento/estabelecimento pendente | B — campos existentes | create do aprovado com `status=aprovado` e campos `reviewedAt/reviewedBy`; a deleção separada da fila continua sendo outro evento |
| revisão de mídia | B — campos existentes | diff em `mediaReview` e `reviewedAt/reviewedBy` |

Texto livre do cliente não define `action`. Notas/reasons não entram no log; apenas a existência da transição é registrada.

## Rules finais

### `audit_logs/{auditId}`

```text
read: active admin
create/update/delete pelo client: false
write backend: Admin SDK fora das Rules
```

### `gallery_items/{itemId}`

```text
public get/list: somente published == true
admin get/list: true
admin create/update: schema exato, timestamps request.time e actor request.auth.uid
delete: false
mediaType: somente image
schemaVersion: 1
```

### `site_config/{configId}`

```text
IDs permitidos: seasonal, mascot
public get: true para os dois documentos public-safe
public list: false
admin create/update: schema exato por ID
delete: false
config genérica: inexistente e negada
```

`seasonal` aceita somente `enabled`, `mode`, `seasonOverride?`, `updatedAt`, `updatedBy`.
`mascot` aceita somente `enabled`, `updatedAt`, `updatedBy`.

O writer backend elimina a necessidade de `getAfter()` ou segundo write client em cada mutação. Isso evita aumentar a complexidade por request nas Rules C1 V2 e preserva o gate de 1.000 expressões.

## Readiness de Cloud Functions

```text
firebaseProjectId=turismo-sms
firestoreRegion=southamerica-east1
functionsRegionRecommended=southamerica-east1
firebaseBillingPlan=BLAZE_COMPATIBLE_BILLING_ENABLED
firebaseCliVersion=15.24.0
localNodeVersion=24.13.0
targetFunctionsRuntime=nodejs22
functionsDirectory=ABSENT
functionsConfig=ABSENT
functionsEmulatorConfig=ABSENT
firebase-functions dependency=ABSENT
firebase-admin dependency=ABSENT
```

APIs observadas habilitadas:

```text
firestore.googleapis.com
logging.googleapis.com
pubsub.googleapis.com
```

Pré-requisitos não observados habilitados:

```text
cloudfunctions.googleapis.com
eventarc.googleapis.com
run.googleapis.com
cloudbuild.googleapis.com
artifactregistry.googleapis.com
```

A leitura direta da API Cloud Functions respondeu `HTTP 403`. Billing não é o blocker. O deploy permanece bloqueado até autorização específica para habilitar/verificar as APIs e até criação autorizada do workspace `functions/` com dependências próprias.

## Retenção

```text
auditAutomaticDeletion=false
retentionPolicyTechnical=RETAIN_UNTIL_FORMAL_RECORDS_POLICY
```

Não criar TTL, botão delete ou cleanup automático. Isso não substitui futura política institucional de temporalidade.

## Decisões preservadas

```text
settingsFinalizationMethod=REMOVE_NAV_AND_PLACEHOLDER
genericSettingsPublicConsumers=0
seasonalRemoteState=ABSENT_PLANNED_CREATE
mascotRemoteState=ABSENT_PLANNED_CREATE
masterRoleCreated=false
authorityEquivalent=ACTIVE_ADMIN
removeCosmeticMasterChecks=true
removeCosmeticMasterBadges=true
```

## Gate restante

O próximo blocker preciso é:

```text
CLOUD_FUNCTIONS_PREREQUISITE_APIS_ENABLEMENT_AND_FUNCTIONS_WORKSPACE_AUTHORIZATION
```

Esse gate autoriza separadamente, quando desejado:

1. habilitar somente as APIs necessárias;
2. criar `functions/` e instalar dependências justificadas;
3. implementar e testar no Emulator;
4. ainda não fazer deploy sem uma autorização posterior e literal.
