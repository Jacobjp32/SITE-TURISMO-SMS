# Bloco CMS-4C-FIX2 - CSP do Admin para Firebase Storage

Data: 08/07/2026

## Escopo

Corrigir o bloqueio de Content-Security-Policy que impedia o Admin de baixar imagens do Firebase Storage durante a acao **Aplicar midia ao catalogo**.

Nao foram alterados site publico, dados estaticos, `config.js`, `js/site-meta.js`, `sw.js`, `sitemap.xml`, Firestore Rules ou Storage Rules.

## Erro observado

No Admin publicado, ao aplicar midia aceita, o navegador bloqueou o download da imagem original:

```text
Content-Security-Policy: As configuracoes da pagina bloquearam o carregamento de um recurso (connect-src)
https://firebasestorage.googleapis.com/v0/b/turismo-sms.firebasestorage.app/o/submissions%2Festablishment-updates%2F...
```

A diretiva bloqueada foi `connect-src`.

Tambem houve aviso de imagem corrompida/truncada para imagens pequenas de teste, mas o bloqueio principal confirmado foi CSP.

## CSP efetiva

Foram identificadas duas camadas de CSP:

1. Meta tag em `admin-firebase.html`.
2. Header global em `_headers` para `/*.html`.

Como navegadores aplicam as politicas em conjunto, a meta CSP do Admin continuava bloqueando mesmo com `_headers` ja permitindo `https://firebasestorage.googleapis.com`.

## Causa confirmada

Antes do ajuste, a meta CSP de `admin-firebase.html` tinha `connect-src` sem:

- `https://firebasestorage.googleapis.com`;
- `https://storage.googleapis.com`;
- `https://*.firebasestorage.app`.

O fluxo CMS-4C-FIX passou a baixar a imagem via referencia/SDK/Blob, mas essas chamadas continuam usando conexoes de rede para Firebase Storage. Sem os hosts em `connect-src`, o browser bloqueia antes do download.

## Alteracoes realizadas

### `admin-firebase.html`

`connect-src` passou a permitir explicitamente:

- `https://firebasestorage.googleapis.com`;
- `https://storage.googleapis.com`;
- `https://*.firebasestorage.app`.

`img-src` passou a listar explicitamente:

- `https://firebasestorage.googleapis.com`;
- `https://storage.googleapis.com`;
- `https://*.firebasestorage.app`;
- `data:`;
- `blob:`.

O Admin ja possuia `https://www.gstatic.com` em `script-src`, entao nao foi necessario alterar `script-src` para o import dinamico de:

```text
https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js
```

### `_headers`

`connect-src` do header global ja tinha `https://firebasestorage.googleapis.com`, mas foi alinhado para tambem permitir:

- `https://storage.googleapis.com`;
- `https://*.firebasestorage.app`.

`img-src` do `_headers` ja era permissivo para imagens e nao foi ampliado neste bloco.

## Mensagem de erro

Em `js/firebase-auth.js`, a mensagem de falha de download passou a citar o diagnostico real:

```text
Falha ao acessar Firebase Storage. Verifique a politica de seguranca (CSP/connect-src), CORS ou permissoes da imagem.
```

A stack tecnica continua restrita ao console.

## Sem wildcard amplo novo

Nao foi adicionado `*` em `connect-src`.

Os hosts novos foram adicionados de forma especifica para Firebase Storage:

- host de API de download;
- host `storage.googleapis.com`, usado por fluxos do SDK/Google Storage;
- subdominios `*.firebasestorage.app`, coerentes com o bucket configurado em `config.js`.

## Rules

Nao houve alteracao em:

- `firestore.rules`;
- `storage.rules`.

O bloco corrigiu CSP/download no navegador, nao permissao de banco ou Storage.

## Cache e deploy

Nao houve alteracao em `sw.js`.

`admin-firebase.html` ja esta em path sensivel no service worker e `_headers` define:

```text
/admin-firebase.html
  Cache-Control: no-store, max-age=0
```

Ainda assim, apos deploy, recomenda-se abrir em janela anonima ou limpar cache para confirmar a nova CSP.

## Teste manual recomendado

Depois de publicar/deployar:

1. Abrir o Admin em janela anonima ou limpar cache.
2. Abrir a solicitacao com 1 imagem `accepted` e 1 imagem `rejected`.
3. Clicar em **Aplicar midia ao catalogo**.
4. Confirmar que nao aparece erro CSP de `connect-src` no console.
5. Confirmar que a imagem `accepted` foi copiada para `cms-media`.
6. Confirmar que a imagem `rejected` nao foi copiada.
7. Confirmar `cms_establishments.media.mainImage` ou `media.gallery`.
8. Confirmar `establishment_update_requests.appliedMedia`, `mediaAppliedAt`, `mediaAppliedBy` e `mediaAppliedTo`.
9. Confirmar que o original em `submissions/...` continua existindo.
10. Confirmar que o site publico nao mudou.

## Riscos

- Se o bucket ainda tiver CORS restritivo, o download pode falhar depois que a CSP deixar de bloquear.
- Se o arquivo de teste estiver realmente corrompido/truncado, a copia pode falhar por conteudo invalido mesmo sem CSP.
- Se houver outra camada de hosting/proxy fora do repositorio aplicando CSP adicional, ela tambem precisara ser alinhada.

## Proximo bloco recomendado

Reexecutar o CMS-4C-TESTE no Admin publicado. Se o erro CSP desaparecer mas o download ainda falhar, investigar CORS do bucket ou validar a integridade das imagens de teste antes de considerar copia server-side.

