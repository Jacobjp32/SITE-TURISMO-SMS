# Bloco CMS-2B-FIX - Arquivar, restaurar e excluir empreendimentos

**Data:** 2026-07-07  
**Projeto:** SITE-TURISMO-SMS-mainv2  
**Escopo:** corrigir arquivar/restaurar no CRUD interno de `cms_establishments` e adicionar exclusao controlada de registros internos, sem seed real, sem apply, sem leitura publica Firestore e sem aplicar solicitacoes aprovadas.

## 1. Estado inicial

- `git status --short` foi executado antes das alteracoes.
- O worktree estava limpo; o Git exibiu apenas aviso de permissao ao acessar `C:\Users\jacob/.config/git/ignore`.
- Nenhum commit foi feito.
- Nenhum seed, apply ou live write por script foi executado.
- Nenhum dado real foi excluido durante o bloco.

## 2. Arquivos inspecionados

- `js/admin/modules/empreendimentos.js`
- `firestore.rules`
- `storage.rules`
- `admin-firebase.html`
- `docs/bloco-cms-2b-crud-empreendimentos.md`
- `docs/bloco-cms-2a-contrato-empreendimentos.md`
- `docs/schemas/cms-establishments.schema.md`
- `scripts/cms-establishments-seed.mjs`

## 3. Causa da permissao negada ao arquivar

A funcao `normalizeDoc(data, docId)` cria um campo local `__id` para a UI conseguir guardar o id real do documento Firestore.

Antes da correcao, `archive()` e `restore()` faziam:

```js
var payload = normalizeDoc(item, item.__id);
db.collection(COLLECTION).doc(item.__id).set(payload)
```

Esse `payload` incluia `__id`, que nao faz parte do contrato de `cms_establishments`.

As rules atuais validam o documento final com:

```js
establishmentFieldsAllowed(data)
```

e aceitam somente os campos top-level contratados. Portanto, a gravacao era negada por campo extra, nao por falta de status `archived`, nem por `archivedAt`, `archivedBy`, `updatedAt` ou `updatedBy`.

## 4. Payload antes e depois

### Antes - arquivar

- path: `cms_establishments/{item.__id}`
- metodo: `set(payload)`
- origem do payload: `normalizeDoc(item, item.__id)`
- problema: `payload.__id`
- campos alterados pretendidos:
  - `status = "archived"`
  - `publishing.archivedAt = serverTimestamp()`
  - `publishing.archivedBy = uid`
  - `publishing.archiveReason = reason`
  - `updatedAt = serverTimestamp()`
  - `updatedBy = uid`

### Depois - arquivar

```js
db.collection(COLLECTION).doc(item.__id).update({
  status: "archived",
  "publishing.archivedAt": serverTimestamp(),
  "publishing.archivedBy": uid,
  "publishing.archiveReason": limit(reason, 500),
  updatedAt: serverTimestamp(),
  updatedBy: uid
})
```

### Depois - restaurar

```js
db.collection(COLLECTION).doc(item.__id).update({
  status: "draft",
  "publishing.archivedAt": null,
  "publishing.archivedBy": "",
  "publishing.archiveReason": "",
  updatedAt: serverTimestamp(),
  updatedBy: uid
})
```

O formulario de edicao tambem passou a remover `__id` antes de salvar com `set()`, para evitar o mesmo bloqueio em updates completos.

## 5. Exclusao controlada no Admin

Foi adicionada a acao `Excluir` no modulo de Empreendimentos.

Comportamento:

- visivel e acionavel para registros `draft` e `archived`;
- para `published`, o botao aparece desabilitado com indicacao de arquivar antes;
- exige digitacao do slug ou nome do empreendimento;
- exige uma segunda confirmacao com `confirm()`;
- executa apenas `db.collection(COLLECTION).doc(item.__id).delete()`;
- atualiza a lista apos sucesso.

Mensagem de confirmacao forte:

```text
Esta ação é definitiva e remove o registro interno do CMS. O site público ainda usa dados estáticos neste momento.
```

## 6. Firestore Rules

`firestore.rules` passou a permitir delete somente nestas condicoes:

```js
allow delete: if isAdmin() && isDeletableEstablishmentStatus(resource.data.status);
```

Com:

```js
function isDeletableEstablishmentStatus(value) {
  return value in ['draft', 'archived'];
}
```

Permanece bloqueado:

- usuario nao autenticado;
- empreendedor;
- moderator que nao seja admin;
- qualquer documento `published`;
- qualquer outra collection fora das regras existentes.

Leitura publica de `cms_establishments` continua nao habilitada:

```js
allow read: if isAdmin();
```

## 7. Storage

`storage.rules` nao foi alterado.

Ao excluir o documento Firestore, imagens em Storage nao sao apagadas neste bloco. Elas podem ficar orfas ate um bloco futuro de limpeza controlada de midia.

Motivo: apagar Firestore e Storage juntos exige fluxo com compensacao para evitar inconsistencias caso uma das operacoes falhe.

## 8. Seguranca preservada

- Empreendedor continua sem escrever em `cms_establishments`.
- Empreendedor nao exclui empreendimentos.
- `published` nao exclui direto; precisa arquivar antes.
- Delete continua bloqueado fora de `draft` e `archived`.
- Site publico nao passou a ler Firestore.
- Solicitacoes aprovadas continuam sem aplicacao automatica.
- Seed/apply nao foi executado.

## 9. Arquivos alterados

- `js/admin/modules/empreendimentos.js`
- `firestore.rules`
- `admin-firebase.html`
- `docs/bloco-cms-2b-fix-arquivar-excluir-empreendimentos.md`

## 10. Validacoes

Comandos planejados/executados neste bloco:

```powershell
node --check js/admin/modules/empreendimentos.js
node --check js/firebase-auth.js
node --check config.js
node --check sw.js
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
git diff --check
```

Como `firestore.rules` foi alterado, as rules precisam ser publicadas novamente no Firebase Console ou CLI antes do teste real.

## 11. Teste manual recomendado apos publicar rules

1. Criar item `draft`.
2. Editar item `draft`.
3. Arquivar item `draft`.
4. Restaurar item `archived`.
5. Arquivar novamente.
6. Excluir item `archived` ou `draft`.
7. Confirmar que item `published`, se existir, nao exclui direto.
8. Confirmar que a lista atualiza sem erro.

## 12. Riscos e rollback

Riscos:

- Rules locais precisam ser publicadas para o ambiente real refletir a permissao de delete controlado.
- Exclusao remove o documento Firestore definitivamente.
- Midias relacionadas podem ficar orfas no Storage.
- Se houver documentos antigos fora do schema, updates ainda podem falhar porque as rules validam o documento final completo.

Rollback:

- Reverter o botao/funcao `remove()` no modulo Admin.
- Voltar `allow delete: if false` em `firestore.rules`.
- Republicar as Firestore Rules.

## 13. Proximo bloco recomendado

Depois de validar o CRUD interno com rules publicadas: seguir para **CMS-2E live-diff real sem apply** ou retomar o live-diff antes de qualquer seed real, mantendo o site publico nos dados estaticos.
