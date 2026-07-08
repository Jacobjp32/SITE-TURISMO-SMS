# Bloco CMS-4D - gestao editorial da galeria no catalogo interno

Data: 08/07/2026

## Escopo

Implementar ferramentas editoriais no Painel Admin para gerenciar `cms_establishments.media`, sem alterar a renderizacao publica, sem ligar o site publico ao Firestore, sem alterar dados estaticos e sem apagar arquivos do Storage.

## Pre-check

- `git status --short` foi executado antes das alteracoes.
- O worktree estava limpo; o Git exibiu apenas aviso de permissao ao acessar `C:\Users\jacob/.config/git/ignore`.
- O historico confirmou os commits:
  - `79624fc Aplica imagens aceitas ao catalogo interno`;
  - `3734cee Corrige reupload de imagens aceitas no CMS`;
  - `cd50a1f Corrige CSP do admin para Firebase Storage`;
  - `a235e91 Corrige download de imagens por path do Storage`;
  - `54a87e8 Prepara CORS do Firebase Storage para midia do CMS`;
  - `d433178 Documenta teste de aplicacao de imagens do CMS`.
- Nenhum commit, deploy, seed, apply, `git reset` ou `git restore` foi executado.

## Arquivos inspecionados

- `docs/bloco-cms-4a-contrato-midia-empreendimentos.md`;
- `docs/bloco-cms-4b-ui-revisao-imagens-solicitacoes.md`;
- `docs/bloco-cms-4c-aplicar-imagens-aceitas-catalogo.md`;
- `docs/bloco-cms-4c-fix-download-reupload-imagens.md`;
- `docs/bloco-cms-4c-fix2-csp-storage-admin.md`;
- `docs/bloco-cms-4c-fix3-storage-download-path.md`;
- `docs/bloco-cms-4c-fix4-cors-storage.md`;
- `docs/schemas/cms-establishments.schema.md`;
- `admin-firebase.html`;
- `js/firebase-auth.js`;
- `js/admin/modules/empreendimentos.js`;
- `firestore.rules`;
- `storage.rules`;
- `config.js`;
- `sw.js`;
- `js/site-meta.js`.

Tambem foram buscados termos relacionados a `cms_establishments`, `media.mainImage`, `media.gallery`, `mainImage`, `gallery`, `alt`, `caption`, `credit`, `position`, `source`, `portal_request`, `static`, `cms-media`, `appliedMedia`, `update`, `archive`, `remove`, `reorder`, `setMain`, `editar`, `galeria` e `imagem principal`.

## Arquivos alterados

- `admin-firebase.html`;
- `js/admin/modules/empreendimentos.js`;
- `firestore.rules`;
- `docs/schemas/cms-establishments.schema.md`;
- `docs/bloco-cms-4d-gestao-galeria-catalogo.md`;
- `docs/auditoria-output/assets-report.json`;
- `docs/auditoria-output/assets-report.md`;
- `docs/auditoria-output/links-report.json`;
- `docs/auditoria-output/links-report.md`;
- `docs/auditoria-output/project-report.json`;
- `docs/auditoria-output/project-report.md`.

## Fluxo anterior

O modulo `Empreendimentos` ja exibia uma miniatura de `media.mainImage` na lista e a imagem principal no detalhe. A galeria era exibida no detalhe apenas como contagem de itens.

Na edicao, a imagem principal tinha campos de URL, alt, legenda, credito e upload. A galeria era gerenciada por um textarea de URLs e uploads novos. Esse fluxo preservava parte dos metadados por URL existente, mas nao oferecia uma area editorial por card para ordenar, editar alt/caption/credit, definir capa ou remover logicamente uma imagem.

As imagens vindas do Portal ja podiam aparecer com `source: "portal_request"` e metadados `sourceRequestId`, `sourceImagePath`, `uploadedBy`, `uploadedAt`, `reviewedBy` e `reviewedAt`. Imagens antigas/seedadas podiam aparecer como `source: "static"`. O site publico ainda nao le `cms_establishments`.

## Fluxo novo

No detalhe do empreendimento, o Admin agora tem a area **Gestao editorial da galeria**.

Ela mostra:

- imagem principal atual, quando existir;
- galeria ativa em cards;
- imagens removidas dentro de uma area expansivel;
- miniatura;
- origem/source;
- status;
- posicao;
- alt;
- caption;
- credit;
- path;
- id da solicitacao quando existir.

A area informa explicitamente:

```text
Isso altera apenas o catalogo interno do CMS. O site publico ainda usa dados estaticos.
```

## Acoes implementadas

- Editar metadados da imagem da galeria:
  - `alt`;
  - `caption`;
  - `credit`.
- Definir imagem da galeria como imagem principal.
- Mover imagem ativa para cima.
- Mover imagem ativa para baixo.
- Remover imagem da galeria ativa por remocao logica.
- Visualizar imagens removidas.
- Restaurar imagem removida para a galeria ativa.

## Imagem principal

A decisao adotada foi copiar os metadados da imagem escolhida da galeria para `media.mainImage` e manter a imagem tambem na galeria.

A acao exige confirmacao:

```text
Esta imagem sera definida como imagem principal do catalogo interno. O site publico ainda nao sera alterado.
```

Campos copiados para `media.mainImage`:

- `url`;
- `path`;
- `alt`;
- `caption`;
- `credit`;
- `source`;
- `status: "active"`;
- `sourceRequestId`;
- `sourceImagePath`;
- `uploadedBy`;
- `uploadedAt`;
- `reviewedBy`;
- `reviewedAt`;
- `updatedAt`;
- `updatedBy`.

O bloco nao apaga nem remove a imagem da galeria ao definir a capa.

## Ordenacao da galeria

Mover para cima/baixo reorganiza somente imagens ativas. As posicoes sao normalizadas a partir de 1 antes de gravar.

O fluxo preserva todos os itens e todos os metadados. Imagens removidas ficam depois das ativas e continuam disponiveis para restauracao.

## Remocao da galeria

Foi adotada a opcao A: remocao logica.

Ao remover uma imagem:

- o arquivo no Storage nao e apagado;
- a imagem permanece em `media.gallery`;
- `status` passa a ser `"removed"`;
- `removedAt` e `removedBy` sao preenchidos;
- `updatedAt` e `updatedBy` sao preenchidos;
- a imagem sai da galeria ativa e aparece na area expansivel de removidas.

Ao restaurar:

- `status` volta para `"active"`;
- `removedAt` e `removedBy` ficam vazios;
- a imagem volta para o fim da galeria ativa;
- as posicoes sao normalizadas novamente.

## Campos gravados em Firestore

Em `media.gallery[]`, o CMS-4D pode gravar:

- `status`;
- `position`;
- `alt`;
- `caption`;
- `credit`;
- `updatedAt`;
- `updatedBy`;
- `removedAt`;
- `removedBy`.

Metadados ja existentes sao preservados:

- `url`;
- `path`;
- `source`;
- `sourceRequestId`;
- `sourceImagePath`;
- `uploadedBy`;
- `uploadedAt`;
- `reviewedBy`;
- `reviewedAt`.

No documento do empreendimento, cada acao atualiza:

- `updatedAt`;
- `updatedBy`;
- `review.lastMediaEditedAt`;
- `review.lastMediaEditedBy`;
- `review.mediaEditReason`.

Nao foi criado historico longo de eventos.

## Rules

`firestore.rules` precisou de patch minimo para aceitar os campos editoriais de imagem e os novos campos de auditoria em `review`.

Alteracoes:

- `validEstablishmentImage()` aceita `status`, `position`, `updatedAt`, `updatedBy`, `removedAt` e `removedBy`;
- `status` e limitado a `active` ou `removed`;
- `position` deve ser inteiro quando presente;
- `validEstablishmentReview()` aceita `lastMediaEditedAt`, `lastMediaEditedBy` e `mediaEditReason`.

Permissoes preservadas:

- `cms_establishments` continua com leitura/escrita restrita a admin;
- empreendedor continua sem escrita em `cms_establishments.media`;
- site publico continua sem leitura Firestore para empreendimentos.

Como `firestore.rules` foi alterado, sera necessario publicar as Firestore Rules para que o Admin publicado aceite esses novos campos.

`storage.rules` foi verificado e nao foi alterado, porque este bloco nao faz upload nem delete.

## Datas publicas e cache

Nao foram alterados:

- `sitemap.xml`;
- `js/site-meta.js`;
- `config.js`;
- `sw.js`.

Motivo: o bloco altera apenas o Admin/Firebase interno; nenhuma pagina publica indexavel mudou e o site publico ainda usa dados estaticos.

`admin-firebase.html` foi alterado apenas para atualizar o cache-bust do script `js/admin/modules/empreendimentos.js`.

## Storage

Nenhum arquivo de Storage foi apagado, movido ou substituido por este bloco.

Remover imagem da galeria e apenas uma alteracao de metadado em Firestore. Arquivos em `cms-media` e originais em `submissions` permanecem preservados.

## Validacoes

Comandos executados:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node --check js/firebase-auth.js
node --check js/admin/modules/empreendimentos.js
node --check config.js
node --check sw.js
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
git diff --check
```

Resultado:

- `node --check js/firebase-auth.js`: OK;
- `node --check js/admin/modules/empreendimentos.js`: OK;
- `node --check config.js`: OK;
- `node --check sw.js`: OK;
- `node scripts/audit-links.mjs`: 735 links, 0 quebrados, 1 falso positivo conhecido, 33 candidatos legados/redundantes;
- `node scripts/audit-assets.mjs`: 226 midias, 0 grupos duplicados, 0 referencias ausentes;
- `node scripts/audit-project.mjs`: 454 arquivos, 36 HTML, 24 CSS, 48 JS;
- `git diff --check`: OK, apenas avisos de conversao LF/CRLF do Windows.

Nao executar `npm run build`, `npm run lint` ou `npm run test` porque nao ha `package.json` no repositorio.

## Teste manual recomendado

Depois de deploy e publicacao das Firestore Rules:

1. Abrir Admin > Empreendimentos.
2. Abrir `marina-barra-iguacu` ou outro item com galeria.
3. Conferir imagem principal e galeria.
4. Editar alt/caption/credit de uma imagem.
5. Salvar e recarregar.
6. Mover uma imagem para cima/baixo.
7. Definir uma imagem como principal e confirmar.
8. Remover uma imagem da galeria ativa.
9. Abrir a area de removidas e restaurar a imagem.
10. Confirmar que nenhum arquivo foi apagado do Storage.
11. Confirmar que o site publico nao mudou.
12. Confirmar que dados estaticos nao mudaram.
13. Confirmar que Firestore registra os metadados corretamente.

## Riscos

- Validacao local nao prova sessao admin real, App Check, Rules publicadas nem dados reais no Firestore.
- Se as Firestore Rules publicadas nao forem atualizadas, as acoes de galeria podem falhar com `permission-denied`.
- A UI usa `prompt()` para metadados neste bloco; e simples e auditavel, mas menos confortavel que um modal dedicado.
- Imagens removidas continuam referenciadas em Firestore e os arquivos seguem no Storage; limpeza fisica deve ficar para bloco especifico.
- O formulario antigo de edicao ainda contem o textarea de URLs da galeria para compatibilidade com o CRUD existente; a gestao editorial fina deve ser feita pelo detalhe do empreendimento.

## Proximo bloco recomendado

**CMS-4E - inventario e limpeza segura de midias orfas**

Objetivo recomendado:

1. listar referencias em `cms_establishments.media`;
2. listar objetos em `cms-media`;
3. classificar midias referenciadas, removidas logicamente e candidatas a orfas;
4. gerar relatorio;
5. apagar fisicamente somente com confirmacao explicita e checagem de referencias.
