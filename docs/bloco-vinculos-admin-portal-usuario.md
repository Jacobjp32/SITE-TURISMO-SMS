# Bloco — Vínculos entre Painel Admin e Portal do Usuário

Diagnóstico e correção do fluxo em que um vínculo criado/aprovado no Painel Admin
não aparece no Portal do Usuário. Caso de referência: usuária **Alle Musial** ×
empreendimento **Marina Barra do Iguaçu**.

## 1. Worktree

`git status` estava **limpo** antes de iniciar. Nenhum commit foi feito.

## 2. Arquivos inspecionados

- `firestore.rules`
- `portal-usuario.html`
- `admin-firebase.html`
- `js/firebase-auth.js` (núcleo `FirebaseSystem`)
- `docs/plano-vinculo-empreendimentos.md` (contrato de dados da feature)
- `storage.rules`, `config.js` (contexto, sem alteração)

## 3. Diferença entre os dois ambientes

- **Painel Admin** (`admin-firebase.html`): uso interno. Exige `role` global
  `admin`/`moderator` em `usuarios/{uid}`. Cria/aprova vínculos.
- **Portal do Usuário** (`portal-usuario.html`): uso externo do empreendedor.
  Conta comum (`role = user`). Solicita vínculo e vê apenas os próprios vínculos
  aprovados. O acesso a um empreendimento **não** vem de `usuarios.role`, e sim
  de um documento ativo em `establishment_managers`.

## 4. Collections usadas

| Collection | Papel |
| --- | --- |
| `establishment_claims` | Solicitações de vínculo criadas pelo usuário. Status: `pending` / `approved` / `rejected`. |
| `establishment_managers` | Vínculos aprovados. É esta que o Portal lê em "Meus empreendimentos". |

## 5. Campos do vínculo (`establishment_managers`)

`userId` (= Firebase Auth UID, igual ao id do doc em `usuarios`), `userEmail`,
`userName`, `establishmentId`, `establishmentName`, `role`, **`active`** (boolean),
`approvedAt`, `approvedBy`, `claimId`, `notes`, `updatedAt`, `updatedBy`,
`revokedAt`, `revokedBy`, `revokeReason`, `replacedBy`.

Id do documento: `buildEstablishmentManagerDocId(userId, establishmentId)`.

## 6. Status considerado "aprovado"

O vínculo é considerado válido quando **`active === true`** (boolean). Não há
status textual em PT/EN aqui — o campo é o boolean `active`. O `establishment_claims`
usa `status: 'approved'` (string), mas isso é só o histórico da solicitação; quem
libera o Portal é o `establishment_managers` com `active === true`.

## 7. Fluxo do Painel Admin (grava)

- Criação manual: `FirebaseSystem.createEstablishmentManager()` — grava
  `active: true`, `userId` = uid selecionado, `establishmentId` do catálogo.
- Aprovação de solicitação: `FirebaseSystem.approveEstablishmentClaim()` — atualiza
  o claim para `approved` e faz `set` do manager com `active: true`.

**Ambos gravam no formato correto** (`userId` = UID, `active: true` boolean). O
lado da escrita **não** tem defeito.

## 8. Fluxo do Portal do Usuário (lê)

- "Minhas solicitações de vínculo": `getUserEstablishmentClaims()` →
  `establishment_claims where userId == uid`.
- "Meus empreendimentos": `getUserManagedEstablishments()` →
  `establishment_managers where userId == uid`.
- Envio de nova solicitação: `createEstablishmentClaim()` faz uma pré-checagem de
  duplicidade lendo `establishment_managers where userId == uid`.

## 9. Diferença entre o que o admin grava e o que o portal lê

O **dado gravado estava correto**. O desalinhamento estava na **query de leitura
do Portal contra as Firestore Rules**, não nos campos.

Regra de leitura de `establishment_managers`:

```
allow read: if isModerator() || (ownsUserId(resource.data) && resource.data.active == true);
```

Para um usuário comum, a regra exige `resource.data.active == true`. No Firestore,
**"rules não são filtros"**: uma *query* só é permitida se as cláusulas `where`
garantirem que todo documento retornado é legível. As queries do Portal eram:

```js
db.collection('establishment_managers').where('userId', '==', uid).get()
```

Sem `.where('active', '==', true)`, o Firestore **não consegue garantir** que a
query só traz docs com `active == true` → **rejeita a query inteira com
`permission-denied`** (mesmo que o vínculo exista e esteja ativo).

O Admin não sofria disso porque `isModerator()` faz curto-circuito na regra, então
`listAllEstablishmentManagers()` (query sem filtro) é permitida.

## 10. Causa provável do problema da Alle

A conta da Alle é `role = user`. Ao abrir o Portal:

1. `getUserManagedEstablishments()` disparava `permission-denied` → capturado →
   retornava `[]` → **"Você ainda não possui vínculos aprovados."** (apesar do
   vínculo com a Marina existir e estar `active: true`).
2. Ao tentar solicitar/validar, `createEstablishmentClaim()` falhava já na etapa
   `query_managers` com `permission-denied` → mensagem **"Sua sessão não tem
   permissão para concluir a solicitação. Saia e entre novamente."**

Ou seja, **ambos os sintomas vinham da mesma causa**: query de leitura sem o filtro
`active == true` que as rules exigem. **Não era dado gravado errado** e **não era
sessão/token expirado** — a mensagem de sessão era um efeito colateral do
tratamento genérico de `permission-denied`.

## 11. Correção feita

`js/firebase-auth.js` — adicionado `.where('active', '==', true)` em duas queries
de contexto de usuário:

- `getUserManagedEstablishments()` (lista "Meus empreendimentos").
- `createEstablishmentClaim()` na etapa `query_managers` (pré-checagem de duplicidade).

Isso **alinha a query à regra existente**, sem afrouxar nenhuma rule. As queries
moderador-gated (`listAllEstablishmentManagers`, `checkExistingManager`,
`approveEstablishmentClaim`) não foram tocadas — passam pelo ramo `isModerator()`.
O `get()` de documento único (`getManagedEstablishmentForCurrentUser`) também não
precisou mudar (regra avalia por documento, não por query).

## 12. Alteração de rules

**Nenhuma.** `firestore.rules` não foi modificado. A correção foi no cliente para
respeitar a rule que já existe. Empreendedor continua sem acesso ao admin; usuário
continua vendo só o próprio vínculo ativo.

## 13. Precisa publicar Firestore Rules?

**Não.** As rules já estão corretas e mais restritivas que a query antiga. Basta
publicar/deploy do site (o `js/firebase-auth.js` corrigido). Se as rules do Console
ainda não incluírem o bloco `establishment_managers` deste arquivo, aí sim é preciso
publicá-las — mas isso é pré-requisito da feature, não desta correção.

## 14. Validações executadas

- `node --check js/firebase-auth.js` → OK
- `node --check config.js` → OK
- `node --check sw.js` → OK
- `node scripts/audit-links.mjs` → 662 links, 0 quebrados (exit 0)
- `node scripts/audit-assets.mjs` → 226 mídias, 0 faltando (exit 0)
- `node scripts/audit-project.mjs` → 415 arquivos (exit 0)

## 15. Teste manual recomendado

1. Publicar o `js/firebase-auth.js` corrigido (deploy do hosting).
2. Confirmar que as rules em produção contêm o bloco `establishment_managers`
   (`active == true` para leitura do próprio vínculo).
3. Admin: confirmar o vínculo Alle × Marina em "Gerenciar Vínculos"
   (`active = true`).
4. Sair do admin. Entrar no Portal com a conta da Alle (fazer logout/login limpo
   para renovar o token).
5. Confirmar que a Marina aparece em "Meus empreendimentos".
6. Confirmar que a Alle acessa a edição/solicitação de alteração do empreendimento
   vinculado.
7. Confirmar que ela **não** vê nem edita empreendimento de terceiros.
8. Confirmar que uma conta sem vínculo continua vendo "Você ainda não possui
   vínculos aprovados." (mensagem legítima, sem `permission-denied`).
9. Confirmar que solicitar novo vínculo funciona (sem o erro de sessão).

## 16. Riscos

- **Índice composto**: a query passa a ter duas cláusulas de igualdade
  (`userId` + `active`). Firestore atende múltiplas igualdades com merge de índices
  de campo único — **não requer índice composto**. Sem risco esperado.
- Comportamento de "sem vínculo" continua idêntico (lista vazia), agora sem erro.
- A filtragem client-side `active !== false` foi mantida como defesa redundante.

## 17. Rollback

Reverter as duas edições em `js/firebase-auth.js` (remover as linhas
`.where('active', '==', true)`). Como nada foi commitado, `git checkout --
js/firebase-auth.js` restaura o estado anterior. Nenhuma rule/dado a reverter.

## 18. Próxima etapa recomendada

- Deploy do `js/firebase-auth.js` e teste real com a conta da Alle.
- Confirmar no Console que a versão publicada das rules bate com `firestore.rules`.
- (Opcional) diferenciar melhor as mensagens de erro do Portal: hoje qualquer
  `permission-denied` na solicitação vira "sua sessão não tem permissão". Após esta
  correção o caso comum some, mas vale distinguir "sessão expirada" de "regra
  negada" para futuros diagnósticos.
