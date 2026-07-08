# Bloco CMS-4C-FIX4 - CORS minimo do Firebase Storage

Data: 08/07/2026

## Escopo

Preparar a configuracao CORS minima do bucket Firebase Storage usado pelo Admin
para permitir que o Web SDK baixe imagens aceitas de
`submissions/establishment-updates/...` via `getBlob()`/`getBytes()` e reupe em
`cms-media`.

Este bloco e operacional/configuracao. Nao altera site publico, dados estaticos,
Firestore Rules, Storage Rules, CSP, fluxo de catalogo ou arquivos em Storage.

## Pre-check

- Worktree inicial limpo em `main...origin/main`.
- CMS-4C-FIX3 confirmado em `HEAD` e `origin/main`:
  `a235e91 Corrige download de imagens por path do Storage`.
- Arquivos revisados:
  - `docs/bloco-cms-4c-fix3-storage-download-path.md`;
  - `docs/bloco-cms-4c-fix2-csp-storage-admin.md`;
  - `js/firebase-auth.js`;
  - `admin-firebase.html`;
  - `_headers`;
  - `firebase.json`;
  - `storage.rules`;
  - `firestore.rules`.

## Diagnostico confirmado

O bloqueio principal nao e mais CSP.

Evidencias:

- `admin-firebase.html` e `_headers` ja permitem Firebase Storage em
  `connect-src`/`img-src`;
- o teste publicado chegou aos logs do FIX3:
  - `[cms-media-copy] source:path`;
  - `[cms-media-copy] download:start`;
  - `[cms-media-copy] download:method`;
  - metodo `getBlob`;
- o erro atual do navegador e CORS:
  falta de `Access-Control-Allow-Origin` na resposta do endpoint
  `https://firebasestorage.googleapis.com/v0/b/turismo-sms.firebasestorage.app/o/...`.

Conclusao: o codigo chegou ao Web SDK por referencia autenticada, mas o bucket
nao esta expondo resposta cross-origin para o dominio do Admin.

## Bucket e dominio

Bucket alvo:

```text
gs://turismo-sms.firebasestorage.app
```

Dominio permitido:

```text
https://turismo.saomateusdosul.pr.gov.br
```

## Arquivo CORS criado

Arquivo:

```text
storage-cors.json
```

Conteudo:

```json
[
  {
    "origin": [
      "https://turismo.saomateusdosul.pr.gov.br"
    ],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

Justificativa:

- `GET` cobre o download do objeto feito por `getBlob()`/`getBytes()`;
- `HEAD` cobre verificacoes leves/metadados que possam ocorrer no caminho de
  leitura;
- `PUT`, `POST` e `OPTIONS` nao foram adicionados porque o erro observado e de
  download/leitura. Uploads diretos existentes devem ser avaliados em bloco
  separado se falharem depois que o download passar.

Nao foi usado wildcard (`*`).

## Ferramentas locais

Foram verificadas:

```powershell
gcloud --version
gsutil version
firebase --version
```

Resultado local:

- `gcloud`: ausente no PATH;
- `gsutil`: ausente no PATH;
- `firebase`: ausente no PATH.

Por isso, a aplicacao remota do CORS ficou pendente. Nao houve tentativa de
mutacao remota sem CLI/autenticacao adequada.

## Comandos para aplicar

Executar em uma maquina com Google Cloud SDK autenticado ou no Google Cloud
Shell do projeto correto.

### Opcao gsutil

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
gsutil cors set storage-cors.json gs://turismo-sms.firebasestorage.app
gsutil cors get gs://turismo-sms.firebasestorage.app
```

### Opcao gcloud storage

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
gcloud storage buckets update gs://turismo-sms.firebasestorage.app --cors-file=storage-cors.json
gcloud storage buckets describe gs://turismo-sms.firebasestorage.app --format="default(cors_config)"
```

Resultado esperado no `cors get`/`describe`: origem
`https://turismo.saomateusdosul.pr.gov.br`, metodos `GET` e `HEAD`,
`maxAgeSeconds` igual a `3600`.

## Seguranca

- CORS nao muda Storage Rules.
- CORS nao torna arquivos privados publicos.
- CORS apenas permite que navegadores no dominio autorizado leiam a resposta do
  bucket quando as regras/autenticacao ja permitirem a leitura.
- Permissoes continuam controladas por Firebase Auth e `storage.rules`.
- `storage.rules` continua exigindo usuario autenticado e staff/admin para ler
  `submissions/establishment-updates/...`.
- Originais em `submissions/...` continuam preservados.

## Validacoes locais

Executar apos a criacao deste arquivo:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node --check js/firebase-auth.js
node --check config.js
node --check sw.js
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
git diff --check
```

## Teste manual apos aplicar CORS

Aguardar alguns minutos de propagacao e entao:

1. Abrir o Admin em janela anonima ou cache limpo.
2. Abrir solicitacao com 1 imagem `accepted` e 1 `rejected`.
3. Clicar em **Aplicar midia ao catalogo**.
4. Confirmar que o erro CORS desapareceu.
5. Confirmar que a imagem `accepted` foi copiada para `cms-media`.
6. Confirmar que a imagem `rejected` nao foi copiada.
7. Confirmar `cms_establishments.media`.
8. Confirmar `establishment_update_requests.appliedMedia`.
9. Confirmar que o original em `submissions/...` permanece.
10. Confirmar que o site publico segue inalterado.

## Riscos

- Se o comando for executado no projeto/bucket errado, o Admin continuara
  bloqueado por CORS.
- Se houver outra origem administrativa futura, ela precisara ser adicionada
  explicitamente; nao foi usado wildcard.
- Se o download passar e o upload para `cms-media` falhar por CORS ou permissao,
  abrir bloco separado para avaliar metodos adicionais (`PUT`/`POST`) ou rules,
  sem ampliar este bloco.

## Proximo bloco recomendado

Aplicar o CORS no bucket com Google Cloud SDK/Cloud Shell e reexecutar o teste
manual do CMS-4C. Se `getBlob()` passar mas o upload falhar, abrir bloco
especifico para diagnosticar upload direto do SDK e decidir se os metodos CORS
de escrita sao necessarios.
