# Bloco CMS-4C-FIX - download e reupload de imagens aceitas

Data: 08/07/2026

## Escopo

Corrigir a falha operacional do fluxo **Aplicar midia ao catalogo**, sem alterar site publico, dados estaticos, `config.js`, `js/site-meta.js`, `sw.js`, `sitemap.xml`, seeds ou regras amplas de permissao.

Nao apagar, mover ou substituir arquivos originais em `submissions/...`.

## Causa encontrada

O CMS-4C-TESTE registrou falha real ao aplicar uma imagem `accepted`:

```text
TypeError: Failed to fetch
at copyReviewedImageToCmsMedia (.../js/firebase-auth.js:387:26)
```

A implementacao antiga usava `fetch(sourceUrl)` para baixar a URL de download da imagem original. No browser, esse caminho pode falhar por CORS, App Check, URL temporaria/tokenizada ou permissao de Storage, mesmo quando a imagem aparece como preview em `<img>`.

## Estrategia antiga

1. Ler `image.path` e `image.url`.
2. Se nao houvesse `url`, obter `storage.ref(sourcePath).getDownloadURL()`.
3. Baixar com `fetch(sourceUrl)`.
4. Converter a resposta em `Blob`.
5. Fazer `destinationRef.put(blob)` em `cms-media/...`.

Ponto fragil: o download dependia diretamente de `fetch(sourceUrl)`.

## Estrategia nova

O fluxo passou a priorizar a origem por referencia de Storage (`image.path`):

1. Se `sourcePath` existir, tentar baixar via metodo do proprio `StorageReference`, quando disponivel:
   - `sourceRef.getBlob()`;
   - `sourceRef.getBytes()`.
2. Se o compat SDK nao expuser esses metodos, carregar sob demanda o modulo oficial `firebase-storage.js` v10.7.1 e tentar:
   - `getStorage(firebase.app()._delegate)`;
   - `ref(storage, sourcePath)`;
   - `getBlob(sourceRef)`;
   - fallback para `getBytes(sourceRef)`.
3. Se os caminhos por referencia falharem, usar fallback controlado por `XMLHttpRequest` com `responseType = "blob"`.
4. Manter upload via compat SDK:
   - `storage.ref(destinationPath).put(blob, metadata)`;
   - `destinationRef.getDownloadURL()`.

O destino foi preservado:

```text
cms-media/{adminUid}/establishments/{establishmentId}/reviewed/{requestId}/{timestamp}-{index}-{safeFileName}
```

## Tratamento de erro

A UI Admin agora recebe mensagens mais especificas:

- falha de download:
  `Nao foi possivel baixar a imagem original para copia. Verifique Storage/CORS/permissoes da imagem.`
- falha de upload:
  `Nao foi possivel enviar a imagem para cms-media.`
- falha no batch Firestore depois do upload:
  `Imagem enviada, mas catalogo nao foi atualizado. Pode haver midia orfa.`

O console continua recebendo o erro tecnico para diagnostico, mas a mensagem final ao usuario nao expoe token, URL sensivel ou stack.

## Atomicidade possivel

O fluxo mantem a ordem:

1. baixar original;
2. enviar copia para `cms-media`;
3. obter URL final do destino;
4. montar metadados de catalogo;
5. executar batch Firestore.

Se o download falhar, nao ha upload nem batch.

Se o upload falhar, nao ha batch.

Se o batch falhar depois do upload, a mensagem explicita o risco de midia orfa. O bloco nao apaga Storage automaticamente.

## Duplicidade

A regra existente foi preservada:

- apenas imagens com `mediaReview.status == "accepted"` entram no fluxo;
- `rejected` e `pending` continuam ignoradas;
- a reaplicacao e evitada por `sourceImagePath` e `sourceImageUrl` em `appliedMedia`, `media.mainImage` e `media.gallery`.

## Rules

Nao houve alteracao em `firestore.rules` nem `storage.rules`.

Estado verificado:

- `storage.rules` permite staff/admin ler `submissions/establishment-updates/{uid}/{submissionId}/{fileName}`;
- `storage.rules` permite admin escrever em `cms-media/{uid}/{allFiles=**}` quando `request.auth.uid == uid`, tamanho <= 5 MB e content type `jpeg/jpg/png/webp`;
- `firestore.rules` permite admin atualizar `cms_establishments` por `isValidEstablishmentUpdate()`;
- `firestore.rules` permite moderador/admin atualizar `establishment_update_requests`;
- o validador de imagem de `cms_establishments.media` aceita os metadados opcionais `sourceRequestId`, `sourceImagePath`, `uploadedBy`, `uploadedAt`, `reviewedBy` e `reviewedAt`.

Como as rules nao foram alteradas, nao ha nova publicacao de rules causada por este bloco.

## CORS

Este bloco nao configura CORS do bucket porque nao ha Firebase CLI/gsutil disponivel no projeto e a tarefa nao autoriza alteracao operacional fora do codigo.

Se o teste real ainda falhar na etapa de download, a pendencia provavel passa a ser configuracao CORS do bucket ou uma copia server-side futura via Cloud Functions/Admin SDK.

Exemplo de caminho operacional futuro, sem credenciais no repositorio:

```text
gsutil cors set cors.json gs://turismo-sms.firebasestorage.app
```

## Arquivos alterados

- `js/firebase-auth.js`;
- `docs/bloco-cms-4c-fix-download-reupload-imagens.md`.

## Teste manual recomendado

Depois de publicar/deployar o JS:

1. Usar solicitacao com 1 imagem `accepted` e 1 imagem `rejected`.
2. Clicar em **Aplicar midia ao catalogo**.
3. Confirmar a acao.
4. Verificar se somente a imagem `accepted` foi copiada para `cms-media`.
5. Confirmar que a imagem `rejected` nao foi copiada.
6. Confirmar que o original em `submissions/establishment-updates/...` permanece.
7. Confirmar `cms_establishments.media.mainImage` ou `media.gallery`.
8. Confirmar `establishment_update_requests.appliedMedia`, `mediaAppliedAt`, `mediaAppliedBy` e `mediaAppliedTo`.
9. Confirmar que o site publico nao mudou e continua usando dados estaticos.

## Riscos

- Se CORS do bucket bloquear tambem `getBlob`/`getBytes`/XHR, a correcao ainda retornara erro controlado de download.
- Se o upload para `cms-media` funcionar e o batch Firestore falhar, pode existir midia orfa em Storage.
- O bloco continua client-side; copia server-side com Admin SDK pode ser mais robusta em bloco futuro.

## Proximo bloco recomendado

Reexecutar o **CMS-4C-TESTE** em ambiente real apos deploy do JS corrigido. Se a falha persistir na etapa de download, abrir bloco operacional especifico para CORS do Firebase Storage ou copia server-side controlada.

