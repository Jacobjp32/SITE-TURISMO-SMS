# CMS Empreendimentos — Save Contract C1 V2

## Propósito

Registrar os invariantes estáveis do fluxo de persistência do Admin sem copiar a
suíte. A autoridade executável permanece no source, nas Rules e nos testes.

## Modelo de gravação

- Um novo documento começa como strict draft shell; o payload completo não é
  criado em uma única escrita.
- O orquestrador aplica até 13 grupos C1, um patch por grupo selecionado.
- Cada patch usa `revision` otimista e avança exatamente uma revisão.
- `validatedGroups` contém markers que as Rules só aceitam quando o validator do
  grupo correspondente aprovou os campos afetados.
- Callbacks de transaction devem ser puros: sem upload, DOM, toast, analytics ou
  mutação de progresso. O SDK pode reexecutar o callback internamente.
- Storage ocorre fora de transactions.
- Retry manual automático não equivale ao retry interno da transaction e não
  deve ser improvisado.

## Relações e limites

O grupo de relações é dividido para manter validação barata e isolada:

- `relationshipsRouteIds` -> `relationships.routeIds`, `legacyRoute` e
  `legacyRouteName`;
- `relationshipsRelatedPlaceIds` -> `relationships.relatedPlaceIds`;
- `relationshipsRelatedEventIds` -> `relationships.relatedEventIds`.

Cada lista de strings governada pelo contrato aceita no máximo 50 itens. Não
junte as três listas em uma única escrita.

## Published, reload e reconciliação

- Edição completa de published segue P2: `published -> draft -> patches ->
  republish`; edição parcial genérica in-place não é o contrato.
- `editSession` persistida registra que o draft veio de edição publicada.
- Reload/resume reconstrói o progresso pelo documento remoto, não pelo estado JS.
- O writer estreito de Rotas preserva `editSession` e só altera seu subgrupo.
- Reconciliação usa `SEMANTIC_IDEMPOTENT_EQUIVALENCE` e falha fechado diante de
  tipo inválido, marker errado, gap de revisão ou autoria não comprovável.
- `Date` nativo e Firestore `Timestamp` são comparados semanticamente por
  milissegundos; datas inválidas e números não finitos são rejeitados.
- Delete é bloqueado pela presença remota de `editSession`, inclusive malformada;
  a leitura remota falha fechado antes de efeitos colaterais.
- Leitura pública de documentos legacy `published` permanece preservada.

## UploadPlan

- Cada arquivo recebe identidade/path por `UploadPlan` usando Web Crypto.
- O mesmo descritor em retry reutiliza `uploadId` e path, inclusive após falha de
  URL ou resultado ambíguo do upload.
- Arquivos distintos não devem colidir apenas por terem metadados iguais.
- Ausência de fonte criptográfica segura falha fechado.

## Limite da plataforma

O limite Firestore de 1.000 expressões continua existindo. O fluxo C1 V2 foi
particionado para permanecer abaixo dele. Um DENY causado por esse limite não
prova que a Rule negou pelo motivo esperado.

## Prova executável

- Orquestrador/Admin: `js/admin/modules/empreendimentos.js`
- Autorização: `firestore.rules`
- Casos canônicos C1 V2: `tests/firestore.rules.test.mjs`
- Storage: `storage.rules` e `tests/storage.rules.test.mjs`
- Schema documental: `docs/schemas/cms-establishments.schema.md`

Execute `npm.cmd run test:rules` quando Rules/runtime cobertos mudarem. Alterações
somente documentais não justificam repetir a suíte completa.

## STOP CONDITIONS

- Tentativa de full-save, múltiplos grupos no mesmo patch ou bypass de marker.
- Upload/efeito de UI dentro de callback de transaction.
- Retry automático externo após resultado ambíguo.
- Reconciliação permissiva diante de tipo, revisão, marker ou sessão inválidos.
- Fluxo published que exponha estado intermediário inválido ao público.
- DENY cujo motivo real seja o limite de 1.000 expressões.
