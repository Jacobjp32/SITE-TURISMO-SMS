# CMS-4C-TESTE - aplicacao real de imagens aceitas

Data do teste: 08/07/2026

## Escopo

Validar em ambiente real o fluxo do CMS-4C: imagem enviada pelo Portal do Usuario, revisada no Admin, marcada como `accepted`, copiada/reupada para `cms-media` e aplicada em `cms_establishments.media`, sem alterar o site publico.

Nao foram feitas alteracoes de codigo, dados estaticos, `config.js`, `js/site-meta.js`, `sw.js` ou `sitemap.xml`. Nao houve commit.

## Pre-condicoes

- Worktree inicial: limpo em `main...origin/main`.
- Commit CMS-4C confirmado: `79624fc Aplica imagens aceitas ao catalogo interno`.
- Publicacao de `firestore.rules`: confirmada manualmente no Firebase Console pelo responsavel do projeto.
- Firebase CLI local: nao disponivel no ambiente (`firebase` nao reconhecido), portanto a publicacao de rules foi validada por confirmacao manual.

## Solicitacao testada

- Empreendimento: Marina Barra do Iguacu.
- `establishmentId`: `marina-barra-iguacu`.
- Vinculo temporario de teste aprovado para o usuario logado.
- `managerId`: `mgr_4EMo0psXyyetEzMhEcWLdxGvbAz2__marina-barra-iguacu`.
- Solicitacao criada no Portal do Usuario: `upd_1783512165653`.
- Observacao enviada: teste operacional CMS-4C para validar `accepted`/`rejected`, copia para `cms-media` e aplicacao ao catalogo interno sem alterar site publico.

## Imagens enviadas

Foram anexadas 2 imagens pequenas no Portal:

| Imagem | Arquivo na UI | Tipo/tamanho | Path original |
| --- | --- | --- | --- |
| 1 | `image-01.png` | `image/png`, 69 B | `submissions/establishment-updates/4EMo0psXyyetEzMhEcWLdxGvbAz2/upd_1783512165653/image-01.png` |
| 2 | `image-02.png` | `image/png`, 67 B | `submissions/establishment-updates/4EMo0psXyyetEzMhEcWLdxGvbAz2/upd_1783512165653/image-02.png` |

As duas imagens apareceram na UI Admin de revisao.

## Revisao no Admin

Resultado salvo em `mediaReview`:

| Imagem | Decisao | Observacao |
| --- | --- | --- |
| `image-01.png` | `accepted` | Aceita para teste CMS-4C. |
| `image-02.png` | `rejected` | Rejeitada para validar que nao e aplicada. |

Apos recarregar a solicitacao, a UI confirmou persistencia da revisao:

- ultima revisao de midia em 08/07/2026;
- revisao feita por `4EMo0psXyyetEzMhEcWLdxGvbAz2`;
- `image-01.png`: status `Aceita`, badge `Aceita, ainda nao aplicada`;
- `image-02.png`: status `Rejeitada`, badge `Nao aplicavel ao catalogo`.

A solicitacao foi aprovada no Admin e passou a mostrar o status `Aprovada, aguardando aplicacao`.

## Aplicacao de midia ao catalogo

Foi acionado o botao especifico `Aplicar midia ao catalogo`, com confirmacao da acao.

Resultado: **falhou antes de gravar no catalogo interno**.

Mensagem/erro observado:

```text
TypeError: Failed to fetch
    at copyReviewedImageToCmsMedia (https://turismo.saomateusdosul.pr.gov.br/js/firebase-auth.js?v=admin-stability-20260608:387:26)
    at Object.applyAcceptedEstablishmentUpdateMedia (https://turismo.saomateusdosul.pr.gov.br/js/firebase-auth.js?v=admin-stability-20260608:1409:38)
    at async applyAcceptedEstablishmentUpdateMedia (https://turismo.saomateusdosul.pr.gov.br/admin-firebase.html:2871:28)
```

Diagnostico:

- camada provavel: Storage/download da URL original antes do reupload;
- ponto exato: `fetch(sourceUrl)` em `copyReviewedImageToCmsMedia`;
- o erro ocorreu antes de `destinationRef.put(...)` e antes do `batch.commit()`;
- nao ha evidencia de criacao em `cms-media`;
- nao ha evidencia de atualizacao em `cms_establishments.media`;
- a solicitacao continuou exibindo `Aceita, ainda nao aplicada`.

## Firestore

Validacao direta dos documentos Firestore pelo navegador automatizado nao ficou disponivel, pois o escopo isolado da automacao retornou `firebase unavailable`. A validacao abaixo foi feita pela UI Admin e pelo fluxo observado.

Estado observado na solicitacao:

- `establishment_update_requests/upd_1783512165653` continuou aprovado e aguardando aplicacao;
- `mediaReview.images` persistiu com 1 imagem `accepted` e 1 imagem `rejected`;
- `appliedMedia` nao foi exibido como registrado;
- `mediaAppliedAt`, `mediaAppliedBy` e `mediaAppliedTo` nao foram confirmados na UI;
- a UI manteve o botao `Aplicar midia ao catalogo`, indicando que a midia aceita nao foi aplicada.

Estado observado do catalogo:

- antes da aplicacao, a UI da solicitacao indicava `Imagens atuais: 8`;
- apos a falha, nao houve indicacao de incremento de galeria ou troca de imagem principal;
- nenhum item com `sourceRequestId: upd_1783512165653` foi confirmado no catalogo pela UI.

Observacao de contrato: a implementacao do CMS-4C grava `mediaAppliedAt`, `mediaAppliedBy`, `mediaAppliedTo` e `appliedMedia`. Nao foi identificado no codigo um campo booleano literal `mediaApplied`.

## Storage

Originais preservados:

- `submissions/establishment-updates/4EMo0psXyyetEzMhEcWLdxGvbAz2/upd_1783512165653/image-01.png`;
- `submissions/establishment-updates/4EMo0psXyyetEzMhEcWLdxGvbAz2/upd_1783512165653/image-02.png`.

Evidencia:

- as duas imagens continuaram visiveis como previews na UI Admin;
- as URLs exibidas permaneciam em `firebasestorage.googleapis.com/.../submissions%2Festablishment-updates...`;
- nenhum arquivo foi apagado pelo teste.

Destino `cms-media`:

- nao foi criado/confirmado path novo em `cms-media`;
- nenhuma URL de `cms-media` apareceu na UI apos a tentativa;
- a imagem `rejected` nao foi copiada;
- a imagem `accepted` tambem nao foi copiada por causa da falha no `fetch(sourceUrl)`.

## Site publico

Validacoes:

- `/local.html?id=marina-barra-iguacu`: ficha publica nao existe; pagina retornou `Local nao encontrado`.
- Home publica: Marina Barra do Iguacu continuou aparecendo com imagem estatica:
  `images/empreendimentos/marina-barra-do-iguacu/marina-barra-do-iguacu-01.jpeg`.
- Nao foi encontrado uso de `cms-media` ou `submissions` na pagina publica validada.

Conclusao: o site publico nao mudou e continuou usando dados/imagens estaticas.

## Resultado por criterio

| Criterio | Resultado |
| --- | --- |
| Solicitacao com imagens criada | OK |
| `mediaReview` persistiu | OK |
| Botao `Aplicar midia ao catalogo` exibido | OK |
| Confirmacao antes de aplicar | OK |
| Imagens `accepted` aplicadas | Falhou: 0 aplicadas |
| Imagens `rejected` ignoradas | OK: 1 ignorada |
| Imagens `pending` ignoradas | Nao havia imagens pendentes |
| Original em `submissions` preservado | OK |
| Novo path em `cms-media` criado | Nao criado |
| `cms_establishments.media` atualizado | Nao atualizado |
| `establishment_update_requests.appliedMedia` atualizado | Nao confirmado/nao exibido |
| Site publico inalterado | OK |

## Erro encontrado

Falha operacional real no momento de copiar a imagem aceita:

```text
TypeError: Failed to fetch
```

Classificacao provavel: falha de download/CORS/Storage URL no browser ao executar `fetch(sourceUrl)` sobre a URL original do Firebase Storage. A imagem pode ser exibida como `<img>`, mas a tentativa de baixar como `Blob` para reupload falhou.

Nao foi feita correcao cega neste bloco.

## Proximos passos recomendados

1. Investigar se o bucket Firebase Storage permite CORS para `GET` a partir de `https://turismo.saomateusdosul.pr.gov.br`.
2. Ajustar a implementacao para usar uma estrategia compativel com Firebase Storage no browser, por exemplo `storage.ref(sourcePath).getDownloadURL()` combinado com configuracao CORS valida, ou outra abordagem controlada que evite `fetch` bloqueado.
3. Reexecutar o CMS-4C-TESTE com a mesma matriz: 1 imagem `accepted`, 1 `rejected`, original preservado, novo destino em `cms-media`, e site publico inalterado.

