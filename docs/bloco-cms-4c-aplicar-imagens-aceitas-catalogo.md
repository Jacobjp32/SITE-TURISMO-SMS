# Bloco CMS-4C - Aplicar imagens aceitas ao catalogo interno

**Data:** 2026-07-07  
**Projeto:** SITE-TURISMO-SMS-mainv2  
**Escopo:** permitir que administradores apliquem imagens marcadas como `accepted` em `mediaReview` de `establishment_update_requests` ao catalogo interno `cms_establishments.media`, sem alterar site publico, dados estaticos ou arquivos originais em `submissions`.

## 1. Pre-check

- `git status --short --branch` foi executado antes das alteracoes.
- O worktree estava limpo; o Git exibiu apenas aviso de permissao ao acessar `C:\Users\jacob/.config/git/ignore`.
- O HEAD estava em `90ab0f8 Adiciona revisao de imagens em solicitacoes`, confirmando o CMS-4B commitado.
- Nenhum commit, deploy, seed, apply de seed, `git reset` ou `git restore` foi executado.

## 2. Contrato confirmado

- `establishment_update_requests.images` guarda anexos do Portal com `url`, `path`, `name`, `contentType`, `size`, `uploadedAt` e `position`.
- `mediaReview.images` guarda a decisao editorial por imagem com `path`, `url`, `status`, `note`, `decidedAt` e `decidedBy`.
- `cms_establishments.media.mainImage` e `media.gallery[]` continuam usando `url`, `path`, `alt`, `caption`, `credit` e `source`.
- O CMS-4C adiciona metadados opcionais de rastreabilidade: `sourceRequestId`, `sourceImagePath`, `uploadedBy`, `uploadedAt`, `reviewedBy` e `reviewedAt`.
- `storage.rules` ja permite admin escrever em `cms-media/{uid}/{allFiles=**}` e staff ler `submissions/establishment-updates/...`.

## 3. Fluxo implementado

Na tela Admin de solicitacoes de alteracao:

- imagens `accepted` aparecem como aceitas e ainda nao aplicadas;
- imagens ja aplicadas aparecem com destino `imagem principal` ou `galeria`;
- o botao **Aplicar midia ao catalogo** aparece somente para admin, solicitacao `approved` e imagens aceitas ainda nao aplicadas;
- a acao exige `confirm()` com aviso de que copia para `cms-media`, atualiza o catalogo interno e nao muda o site publico.

Regra simples deste bloco:

- se o catalogo nao tiver `media.mainImage.url`, a primeira imagem aceita vira imagem principal;
- as demais imagens aceitas entram em `media.gallery`;
- se ja houver imagem principal, todas as imagens aceitas entram em `media.gallery`;
- `media.mainImage` existente nunca e sobrescrita neste bloco.

## 4. Storage e catalogo

Cada imagem aplicada e baixada da origem e reupada em:

```text
cms-media/{adminUid}/establishments/{establishmentId}/reviewed/{requestId}/{timestamp}-{safeFileName}
```

O arquivo original em:

```text
submissions/establishment-updates/{uid}/{requestId}/{fileName}
```

permanece preservado. O bloco nao move nem apaga arquivos.

## 5. Campos gravados

No catalogo, a imagem aplicada usa:

```js
{
  url,
  path,
  alt,
  caption,
  credit,
  source: "portal_request",
  sourceRequestId,
  sourceImagePath,
  uploadedBy,
  uploadedAt,
  reviewedBy,
  reviewedAt
}
```

Na solicitacao, o bloco registra:

- `mediaAppliedAt`;
- `mediaAppliedBy`;
- `mediaAppliedTo`;
- `appliedMedia[]` com origem, destino, URL/path final e auditoria.

Esse marcador impede reaplicar a mesma imagem pela UI.

## 6. Rules

`firestore.rules` foi atualizado apenas para aceitar os metadados opcionais de rastreabilidade em imagens de `cms_establishments.media`.

Permanece:

- empreendedor sem escrita em `cms_establishments`;
- aplicacao de catalogo restrita a `isAdmin()`;
- updates em `establishment_update_requests` restritos a moderador/admin;
- leitura publica do site sem Firestore para empreendimentos.

`storage.rules` nao precisou de alteracao.

## 7. Arquivos alterados

- `admin-firebase.html`;
- `js/firebase-auth.js`;
- `js/admin/modules/empreendimentos.js`;
- `firestore.rules`;
- `docs/schemas/cms-establishments.schema.md`;
- `docs/bloco-cms-4c-aplicar-imagens-aceitas-catalogo.md`.

## 8. Confirmacoes de escopo

Confirmado:

- site publico nao foi ligado ao Firestore;
- renderizacao publica nao foi alterada;
- dados estaticos nao foram alterados;
- `config.js`, `js/site-meta.js`, `sw.js` e `sitemap.xml` nao foram alterados;
- imagens `pending` e `rejected` nao sao aplicadas;
- aplicar midia nao acontece automaticamente ao aprovar solicitacao;
- galeria existente e preservada e novas imagens entram ao final;
- arquivo original em `submissions/...` nao e removido.

## 9. Limitacoes e riscos

- Este bloco nao oferece escolha manual por imagem entre principal e galeria; aplica a regra simples documentada acima.
- Validacao local nao prova sessao Firebase real, App Check, Storage CORS, rules publicadas nem permissao admin em producao.
- Se o reupload para `cms-media` funcionar e a gravacao no Firestore falhar, o arquivo recem-enviado pode ficar orfao; o bloco nao apaga Storage por decisao de escopo.
- Se as Firestore Rules publicadas estiverem desatualizadas, a aplicacao pode falhar com `permission-denied`.
