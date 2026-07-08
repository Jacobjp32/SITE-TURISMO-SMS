# Bloco CMS-4E - inventario e limpeza segura de midias orfas

Data: 08/07/2026

## Escopo

Mapear referencias oficiais de midia do CMS de empreendimentos, criar uma base
segura para inventario somente leitura e definir politica futura de limpeza sem
apagar arquivos, sem alterar Firestore remoto, sem alterar Storage remoto e sem
alterar o site publico.

Este bloco e diagnostico interno. Nao publica midias, nao liga o site publico ao
Firestore, nao executa seed/apply, nao move arquivos e nao executa limpeza
automatica.

## Pre-check

- `git status --short --branch` foi executado antes das alteracoes.
- O worktree estava limpo; o Git exibiu apenas aviso de permissao ao acessar
  `C:\Users\jacob/.config/git/ignore`.
- CMS-4D confirmado em `HEAD`, `origin/main` e `origin/HEAD`:
  `8bbdaf4 Adiciona gestao editorial da galeria no CMS`.
- Confirmacao de publicacao considerada neste bloco: o commit local coincide
  com `origin/main`. Deploy/Netlify nao foi executado nem verificado neste
  bloco.
- Nenhum commit, deploy, seed, apply, `git reset` ou `git restore` foi
  executado.

## Arquivos inspecionados

- `docs/bloco-cms-4a-contrato-midia-empreendimentos.md`;
- `docs/bloco-cms-4b-ui-revisao-imagens-solicitacoes.md`;
- `docs/bloco-cms-4c-aplicar-imagens-aceitas-catalogo.md`;
- `docs/bloco-cms-4c-fix4-cors-storage.md`;
- `docs/bloco-cms-4d-gestao-galeria-catalogo.md`;
- `docs/schemas/cms-establishments.schema.md`;
- `js/admin/modules/empreendimentos.js`;
- `js/firebase-auth.js`;
- `firestore.rules`;
- `storage.rules`;
- `storage-cors.json`;
- `config.js`;
- `sw.js`;
- `js/site-meta.js`.

Tambem foram buscados termos relacionados a `cms-media`, `submissions`,
`media.mainImage`, `media.gallery`, `appliedMedia`, `sourceImagePath`,
`sourceRequestId`, `path`, `url`, `status: "removed"`, `archived`,
`removedAt`, `removedBy`, `Storage`, `deleteObject`, `listAll`,
`getMetadata`, `cms_establishments` e `establishment_update_requests`.

## Estado atual

O site publico continua usando dados estaticos. A collection
`cms_establishments` permanece interna/admin-only para empreendimentos. As
imagens aceitas de solicitacoes podem ser copiadas para `cms-media/...` e
registradas em `cms_establishments.media`, mas os originais em `submissions/...`
permanecem como evidencia da solicitacao.

O CMS-4D adicionou gestao editorial da galeria com remocao logica: imagem
removida sai da galeria ativa, mas continua referenciada em `media.gallery[]`
com `status: "removed"`, `removedAt` e `removedBy`. O arquivo fisico no Storage
nao e apagado.

## Referencias oficiais no Firestore

### `cms_establishments.media.mainImage.path`

Referencia a imagem principal do catalogo interno. Pode apontar para:

- upload direto do Admin em
  `cms-media/{uid}/establishments/{establishmentId}/main/{timestamp}-{fileName}`;
- imagem aceita de solicitacao copiada para
  `cms-media/{adminUid}/establishments/{establishmentId}/reviewed/{requestId}/{timestamp}-{index}-{safeFileName}`;
- legado/static/external quando `source` indicar origem nao Storage.

Campos correlatos preservados pelo codigo:

- `url`;
- `path`;
- `alt`;
- `caption`;
- `credit`;
- `source`;
- `status`;
- `sourceRequestId`;
- `sourceImagePath`;
- `uploadedBy`;
- `uploadedAt`;
- `reviewedBy`;
- `reviewedAt`;
- `updatedAt`;
- `updatedBy`.

### `cms_establishments.media.gallery[].path`

Referencia imagens da galeria do catalogo interno. Itens sem `status` ou com
`status: "active"` sao considerados ativos para inventario. Itens com
`status: "removed"` ou `removedAt` preenchido sao removidos logicamente, mas
continuam sendo referencia Firestore valida e nao devem ser tratados como
orfaos automaticamente.

O codigo normaliza cada item de galeria com `path`, metadados editoriais,
origem, auditoria e campos de remocao logica.

### `establishment_update_requests.images[].path`

Referencia os arquivos originais enviados pelo Portal. Para solicitacoes de
alteracao de empreendimento, o path esperado e:

```text
submissions/establishment-updates/{uid}/{requestId}/{fileName}
```

Esses arquivos sao anexos/evidencias da solicitacao. Eles nao sao midia final
do catalogo e nao devem ser considerados orfaos automaticamente.

### `establishment_update_requests.appliedMedia[].path`

Referencia o destino em `cms-media/...` criado quando uma imagem aceita e
aplicada ao catalogo interno. O campo liga a solicitacao ao arquivo final
copiado/reupado.

Campos relevantes:

- `sourceRequestId`;
- `sourceImagePath`;
- `sourceImageUrl`;
- `destination`;
- `url`;
- `path`;
- `appliedAt`;
- `appliedBy`;
- `establishmentId`.

### `establishment_update_requests.appliedMedia[].sourceImagePath`

Referencia o original em `submissions/establishment-updates/...` usado como
fonte da copia para `cms-media/...`. Deve ser preservado como trilha de
auditoria e evidencia.

## Categorias de inventario

### A) Referenciadas no catalogo ativo

Inclui:

- `cms_establishments.media.mainImage.path` quando houver path e a imagem nao
  estiver removida logicamente;
- `cms_establishments.media.gallery[].path` quando `status` estiver vazio,
  ausente ou igual a `active`, e `removedAt` estiver vazio.

Politica: nunca apagar.

### B) Removidas logicamente

Inclui:

- `cms_establishments.media.gallery[].path` com `status: "removed"`;
- `cms_establishments.media.gallery[].path` com `removedAt` preenchido.

Politica: nao apagar automaticamente. Podem virar candidatas futuras de limpeza
somente apos prazo minimo e nova confirmacao.

### C) Aplicadas a partir de solicitacoes

Inclui:

- `establishment_update_requests.appliedMedia[].path`.

Politica: tratar como referencia oficial adicional. Se o mesmo path nao estiver
mais em `cms_establishments.media`, ainda assim nao apagar sem revisar o
historico da solicitacao e o motivo da divergencia.

### D) Originais de submissions

Inclui:

- `establishment_update_requests.images[].path`;
- `establishment_update_requests.appliedMedia[].sourceImagePath`;
- paths sob `submissions/establishment-updates/...`.

Politica: preservar como evidencia de solicitacao. Nao tratar como orfao
automaticamente. Limpeza de `submissions` precisa politica propria de retencao,
base legal/administrativa e confirmacao explicita.

### E) Possiveis orfas em `cms-media`

Inclui arquivos existentes em `cms-media/...` que nao estejam referenciados em:

- `cms_establishments.media.mainImage.path`;
- `cms_establishments.media.gallery[].path`, incluindo removidas logicamente;
- `establishment_update_requests.appliedMedia[].path`.

Politica: candidato, nao conclusao. Antes de qualquer delete, revisar tambem
outros usos de `cms-media`, como banners/pop-ups e `media_library`, porque a
arvore `cms-media/{uid}/{allFiles=**}` e compartilhada por mais de um modulo do
CMS.

### F) Possiveis referencias quebradas

Inclui paths apontados por Firestore que nao existirem no Storage durante
inventario remoto:

- catalogo ativo;
- removidas logicamente;
- `appliedMedia`;
- originais de `submissions`.

Politica: corrigir referencia ou restaurar arquivo antes de publicar qualquer
leitura publica baseada em Firestore. Nao apagar nem sobrescrever sem
diagnostico.

## Script criado

Arquivo:

```text
scripts/cms-media-inventory.mjs
```

Caracteristicas:

- somente leitura;
- dry-run por padrao;
- nao apaga arquivos;
- nao grava Firestore;
- nao altera Storage;
- nao escreve arquivos locais;
- nao imprime token;
- aceita modo local sem credencial;
- aceita modo remoto somente com variavel de ambiente.

Uso local:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node scripts/cms-media-inventory.mjs
```

Uso remoto futuro:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
$env:FIREBASE_AUTH_TOKEN="<token-temporario>"
node scripts/cms-media-inventory.mjs --remote
Remove-Item Env:\FIREBASE_AUTH_TOKEN
```

Observacoes:

- o token deve ser temporario e nunca deve ser salvo no repositorio;
- o script tambem aceita `GOOGLE_OAUTH_ACCESS_TOKEN`;
- se `--remote` for usado sem token, o script aborta de forma controlada;
- a execucao remota depende de permissao real para ler Firestore e listar o
  bucket via API;
- o resultado sai no terminal em JSON e nao e salvo automaticamente.

## Arquivos criados/alterados

Criados:

- `scripts/cms-media-inventory.mjs`;
- `docs/bloco-cms-4e-inventario-midias-orfas.md`.

Alterados por validacao/auditoria:

- `docs/auditoria-output/assets-report.json`;
- `docs/auditoria-output/assets-report.md`;
- `docs/auditoria-output/links-report.json`;
- `docs/auditoria-output/links-report.md`;
- `docs/auditoria-output/project-report.json`;
- `docs/auditoria-output/project-report.md`.

Nao foram alterados arquivos de runtime publico, rules, cache ou config.

## Execucao do inventario

Inventario local/contratual: criado pelo script e disponivel sem credencial.

Inventario real remoto: nao executado neste bloco. Motivo: nao havia credencial
temporaria fornecida e o escopo proibe alteracoes remotas. O bloco deixa a
ferramenta pronta para uma execucao futura autorizada, somente leitura.

Possiveis orfaos encontrados: nenhum confirmado localmente. Sem listagem real do
Storage nao e possivel afirmar quais objetos em `cms-media/...` estao sem
referencia.

Possiveis referencias quebradas encontradas: nenhuma confirmada localmente. Sem
listagem real do Storage nao e possivel afirmar quais paths do Firestore nao
existem no bucket.

## Politica segura para limpeza futura

Recomendacao:

1. Nunca apagar midia ativa em `cms_establishments.media`.
2. Nunca apagar original em `submissions/...` sem politica propria de retencao.
3. Tratar `submissions/...` como evidencia administrativa da solicitacao.
4. Tratar `cms-media/...` sem referencia como candidato, nao como orfao
   definitivo.
5. Considerar midia removida logicamente em `cms-media` como candidata somente
   apos prazo minimo sugerido de 90 dias desde `removedAt`.
6. Antes de qualquer delete, gerar relatorio com path, origem, tamanho,
   referencias Firestore e ultima atualizacao no Storage.
7. Exigir confirmacao explicita por lote de paths.
8. Preferir quarentena logica antes do delete definitivo, por exemplo marcar em
   relatorio/lista de exclusao aprovada e aguardar nova janela operacional.
9. Conferir outras referencias fora do escopo de empreendimentos, especialmente
   `media_library` e `banners`.
10. Delete definitivo somente em bloco futuro especifico, com comando separado,
    revisao humana e rollback/backup documentado.

## Datas publicas e cache

Nao foram alterados:

- `sitemap.xml`;
- `js/site-meta.js`;
- `config.js`;
- `sw.js`.

Motivo: este bloco e diagnostico interno, sem mudanca em pagina publica
indexavel, sem alteracao de dados estaticos e sem mudanca de cache publico.

## Rules

Nao foram alterados:

- `firestore.rules`;
- `storage.rules`.

Observacoes:

- `storage.rules` permite delete em `cms-media` para admin, mas o app nao deve
  usar esse poder sem inventario e confirmacao;
- `storage.rules` permite delete em `submissions` por dono/staff, mas originais
  de solicitacao devem ser preservados ate existir politica de retencao;
- `firestore.rules` aceita os campos editoriais de imagem definidos ate
  CMS-4D, mas `validEstablishmentMedia()` ainda nao valida item a item da
  galeria.

## Validacoes

Comandos executados neste bloco:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node --check js/firebase-auth.js
node --check js/admin/modules/empreendimentos.js
node --check config.js
node --check sw.js
node --check scripts/cms-media-inventory.mjs
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
- `node --check scripts/cms-media-inventory.mjs`: OK;
- `node scripts/cms-media-inventory.mjs`: OK, modo local/contratual, sem
  credencial e sem inventario remoto;
- `node scripts/audit-links.mjs`: 735 links, 0 quebrados, 1 falso positivo
  conhecido, 33 candidatos legados/redundantes;
- `node scripts/audit-assets.mjs`: 226 midias, 0 grupos duplicados, 0
  referencias ausentes;
- `node scripts/audit-project.mjs`: 456 arquivos, 36 HTML, 24 CSS, 48 JS;
- `git diff --check`: OK, com avisos esperados de conversao LF/CRLF nos
  relatorios de `docs/auditoria-output/`.

Nao executar `npm run build`, `npm run lint` ou `npm run test` porque nao ha
`package.json` no repositorio.

## Confirmacoes de escopo

Confirmado neste bloco:

- nenhum arquivo foi apagado do Storage;
- nenhum arquivo foi movido no Storage;
- nenhum arquivo foi copiado no Storage;
- nenhuma alteracao remota foi feita no Firestore;
- nenhuma alteracao remota foi feita no Storage;
- nenhuma limpeza automatica foi criada;
- site publico nao mudou;
- dados estaticos nao mudaram;
- `firestore.rules` nao mudou;
- `storage.rules` nao mudou;
- `sitemap.xml` nao mudou;
- `js/site-meta.js` nao mudou;
- `config.js` nao mudou;
- `sw.js` nao mudou;
- seed/apply nao foi executado;
- deploy nao foi executado.

## Riscos

- A execucao local nao prova dados reais do Firestore ou do Storage.
- As rules publicadas no Firebase podem divergir dos arquivos locais.
- Um objeto em `cms-media` pode ser usado por outro modulo do CMS fora do
  recorte de empreendimentos.
- Um path em `appliedMedia` pode existir como historico mesmo que nao esteja
  mais ativo na galeria.
- `submissions` pode conter evidencias sujeitas a retencao administrativa; nao
  deve ser limpo por heuristica tecnica.
- O script remoto depende de credencial com permissao adequada e deve ser
  executado somente com token temporario.

## Proximo bloco recomendado

**CMS-4E-EXEC - executar inventario remoto somente leitura**

Objetivo recomendado:

1. fornecer token temporario somente em variavel de ambiente;
2. executar `node scripts/cms-media-inventory.mjs --remote`;
3. salvar manualmente o JSON de saida como evidencia do bloco, se autorizado;
4. revisar categorias A-F;
5. abrir bloco separado para quarentena logica, sem delete fisico;
6. deixar delete definitivo para outro bloco futuro com confirmacao explicita.
