# Bloco CMS-4C-FIX3 - download por path autenticado do Storage

Data: 08/07/2026

## Escopo

Corrigir o fluxo **Aplicar midia ao catalogo** para baixar a imagem original de
`submissions/establishment-updates/...` usando referencia autenticada do
Firebase Storage pelo path, sem depender de `fetch(downloadURL)` ou XHR sobre
URL publica/tokenizada.

Nao foram alterados site publico, dados estaticos, `config.js`, `sw.js`,
`js/site-meta.js`, `sitemap.xml`, Firestore Rules ou Storage Rules.

## Pre-check

- Worktree inicial limpo em `main...origin/main`.
- FIX2 confirmado em `HEAD` e `origin/main`:
  `cd50a1f Corrige CSP do admin para Firebase Storage`.
- O Admin usa Firebase Web SDK compat `10.7.1`:
  `firebase-app-compat.js`, `firebase-auth-compat.js`,
  `firebase-firestore-compat.js`, `firebase-storage-compat.js` e
  `firebase-app-check-compat.js`.
- A inicializacao real acontece em `js/firebase-auth.js` com
  `firebase.initializeApp(firebaseConfig)`, `firebase.auth()`,
  `firebase.firestore()` e, no fluxo de midia, `firebase.storage()`.

## Causa do FIX2 ainda falhar

O FIX2 removeu o bloqueio de CSP para Firebase Storage, mas o navegador passou a
chegar na etapa real de download. Nesse ponto ainda existiam dois problemas:

1. O fallback final baixava a URL publica/tokenizada da imagem com
   `XMLHttpRequest`, o que continuava sujeito a CORS do bucket.
2. A tentativa modular criava `ref(storage, sourcePath)` a partir de um storage
   modular possivelmente invalido ou desacoplado do app compat autenticado. Isso
   explicava o erro:

```text
TypeError: can't access property "path", e._location is undefined
```

Esse erro indica referencia modular invalida: a funcao esperava um
`StorageReference` real, mas recebeu um objeto sem `_location`.

## Estrategia nova

O fluxo agora normaliza o path de origem e usa `storage.ref(sourcePath)` do SDK
compat autenticado como base unica.

Path esperado:

```text
submissions/establishment-updates/{uid}/{requestId}/{fileName}
```

Normalizacoes aceitas:

- remove `/` inicial;
- remove prefixo `gs://{bucket}/`;
- remove prefixo `{bucket}/`;
- decodifica path vindo de URL do Firebase Storage quando `image.path` nao esta
  utilizavel.

`image.url` nao e mais usado para baixar a imagem. Ele serve apenas como ultima
fonte para extrair o path codificado quando necessario.

## Download

Ordem atual:

1. Criar referencia compat autenticada com `firebase.storage().ref(sourcePath)`.
2. Se existir, tentar `sourceRef.getBlob()`.
3. Se existir, tentar `sourceRef.getBytes()` e converter para `Blob`.
4. Se o compat nao expuser esses metodos, importar
   `https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js` e chamar
   `getBlob()`/`getBytes()` sobre `sourceRef._delegate`.

O ponto importante e que o modular nao recria a referencia a partir de um storage
incerto. Ele reaproveita o `_delegate` da propria referencia compat, que ja foi
criada pelo app autenticado.

## CORS

O caminho principal nao depende mais de `fetch(downloadURL)` nem de XHR sobre URL
publica/tokenizada.

Ainda assim, `getBlob()`/`getBytes()` sao chamadas de navegador para Firebase
Storage. Se o bucket bloquear a resposta por CORS mesmo nesse caminho do SDK, a
UI retorna erro claro e a pendencia passa a ser operacional:

- configurar CORS do bucket em bloco proprio; ou
- criar copia server-side futura com Cloud Functions/Admin SDK.

Nenhuma configuracao CORS do bucket foi alterada neste bloco.

## Diagnostico no console

O console registra sem tokens:

- `sourcePath` normalizado;
- origem do path (`image.path` ou path derivado de `image.url`);
- SDK usado: `compat` ou `modular-from-compat-delegate`;
- metodo usado: `sourceRef.getBlob`, `sourceRef.getBytes`, `getBlob`,
  `getBytes` ou `compat.put`;
- tipo de erro: `ref-invalida`, `permission`, `cors`, `not-found`,
  `sdk-unsupported`, `download`, `upload` ou `batch`.

URLs longas com `token=` ou `alt=media` nao sao logadas.

## Preservacoes

Permanece:

- apenas imagens `accepted` sao aplicadas;
- imagens `rejected` e `pending` sao ignoradas;
- arquivos originais em `submissions/...` nao sao movidos nem apagados;
- destino continua em `cms-media/{adminUid}/establishments/.../reviewed/...`;
- batch Firestore so acontece depois do upload para `cms-media` concluir;
- site publico continua sem Firestore e sem mudanca automatica.

## Arquivos alterados

- `js/firebase-auth.js`;
- `admin-firebase.html` apenas para cache-bust do script `js/firebase-auth.js`;
- `docs/bloco-cms-4c-fix3-storage-download-path.md`.

## Rules e CSP

Nao houve alteracao em:

- `firestore.rules`;
- `storage.rules`;
- `_headers`;
- meta CSP do `admin-firebase.html`.

O FIX3 corrigiu referencia/download no codigo, nao permissao nem CSP.

## Teste manual recomendado

Depois de deploy:

1. Abrir o Admin em cache limpo ou janela anonima.
2. Usar uma solicitacao com 1 imagem `accepted` e 1 imagem `rejected`.
3. Clicar em **Aplicar midia ao catalogo**.
4. Conferir o console:
   - `source:path`;
   - `download:start`;
   - metodo usado (`getBlob` ou `getBytes`);
   - `upload:start`.
5. Se sucesso:
   - a imagem `accepted` foi copiada para `cms-media`;
   - a imagem `rejected` foi ignorada;
   - `cms_establishments.media` foi atualizado;
   - `establishment_update_requests.appliedMedia`, `mediaAppliedAt`,
     `mediaAppliedBy` e `mediaAppliedTo` foram atualizados;
   - o original em `submissions/...` permaneceu.
6. Se falhar:
   - `ref-invalida`: revisar `image.path` salvo na solicitacao;
   - `permission`: revisar sessao admin/moderador e Storage Rules publicadas;
   - `cors`: abrir bloco operacional para CORS do bucket ou copia server-side;
   - `upload`: revisar permissao/tamanho/content-type em `cms-media`;
   - `batch`: houve upload, mas o Firestore nao atualizou; pode haver midia orfa.

## Riscos

- Se o Storage compat nao expuser `_delegate`, o fluxo falha com
  `sdk-unsupported` em vez de tentar URL publica.
- Se o bucket bloquear `getBlob()`/`getBytes()` por CORS, a solucao definitiva
  passa por configuracao operacional do bucket ou Cloud Function/Admin SDK.
- Se o batch Firestore falhar depois do upload, pode haver midia orfa em
  `cms-media`; o bloco nao apaga Storage por decisao de escopo.

## Proximo bloco recomendado

Reexecutar o teste real do CMS-4C no Admin publicado. Se aparecer `cors` mesmo
com `getBlob()`/`getBytes()` por referencia autenticada, abrir bloco especifico
para uma das duas alternativas:

1. configurar CORS do bucket Firebase Storage com escopo minimo; ou
2. implementar copia server-side controlada via Cloud Functions/Admin SDK.
