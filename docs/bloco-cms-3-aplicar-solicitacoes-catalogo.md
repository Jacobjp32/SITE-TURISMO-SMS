# Bloco CMS-3 - Aplicar solicitacoes aprovadas ao catalogo interno

**Data:** 2026-07-07  
**Projeto:** SITE-TURISMO-SMS-mainv2  
**Escopo:** adicionar no Painel Admin uma acao controlada para aplicar solicitacoes aprovadas de alteracao de empreendimento em `cms_establishments`, sem ligar o site publico ao Firestore e sem publicacao automatica.

## 1. Pre-check

- `git status --short` foi executado antes das alteracoes.
- O worktree estava limpo; o Git exibiu apenas aviso de permissao ao acessar `C:\Users\jacob/.config/git/ignore`.
- Nenhum commit foi feito.
- Nenhum `git reset` ou `git restore` foi executado.
- Nenhum seed, live-diff remoto ou apply do seed foi executado.

## 2. Arquivos inspecionados

- `docs/bloco-cms-2a-contrato-empreendimentos.md`
- `docs/schemas/cms-establishments.schema.md`
- `docs/bloco-cms-2b-crud-empreendimentos.md`
- `docs/bloco-cms-2b-fix-arquivar-excluir-empreendimentos.md`
- `docs/bloco-cms-2f-seed-real-empreendimentos.md`
- `docs/bloco-p2-validacao-portal-empreendedor.md`
- `docs/bloco-p3-fechamento-portal-empreendedor.md`
- `docs/bloco-p4-aplicacao-publicacao-solicitacoes.md`
- `admin-firebase.html`
- `portal-usuario.html`
- `js/firebase-auth.js`
- `js/admin/modules/empreendimentos.js`
- `firestore.rules`
- `storage.rules`
- `config.js`
- `js/site-meta.js`
- `sw.js`

## 3. Fluxo anterior

O Admin listava `establishment_update_requests` na area "Alteracoes de empreendimentos", mas carregava somente solicitacoes `pending`.

As acoes existentes eram:

- aprovar para revisao: mudava `status` para `approved`;
- rejeitar: mudava `status` para `rejected`;
- pedir ajustes: mudava `status` para `changes_requested`.

A revisao atualizava `updatedAt`, `reviewedAt`, `reviewedBy`, `reviewNotes`, `rejectionReason` e `changesRequestedNotes`, mas nao aplicava nada em `cms_establishments`, nao alterava dados estaticos e nao publicava no site.

O Portal do Usuario cria solicitacoes em `establishment_update_requests` com:

- `currentSnapshot`: `name`, `category`, `source`, `originalId`, `description`, `phone`, `whatsapp`, `instagram`, `website`, `address`, `openingHours`, `images`, `mainImage`, `imageCount`;
- `requestedChanges`: `description`, `phone`, `whatsapp`, `instagram`, `website`, `address`, `openingHours`, `additionalNotes`;
- `images`, `mainImage`, `imageCount`: metadados de anexos enviados em `submissions/establishment-updates/{uid}/{requestId}/{fileName}`;
- `status`: `pending`, `approved`, `rejected` ou `changes_requested`.

## 4. Fluxo novo

O Admin passa a carregar solicitacoes `pending` e `approved`.

Para `pending`, o fluxo antigo permanece:

- aprovar para revisao;
- rejeitar;
- pedir ajustes.

Para `approved` ainda sem marcador de aplicacao e com ao menos um campo textual aplicavel, aparece a acao separada **Aplicar ao catalogo**. Solicitacoes aprovadas somente com imagens ficam como pendencia de revisao manual.

Regras implementadas:

- o botao aparece apenas para solicitacoes `approved` com campos textuais aplicaveis;
- o botao nao aparece para solicitacoes ja aplicadas;
- `pending`, `rejected` e `changes_requested` nao recebem acao de aplicacao;
- aprovar nao aplica automaticamente;
- a aplicacao exige `confirm()`;
- a UI mostra o resumo dos campos e seus destinos no schema;
- a UI mostra o aviso: "Isso atualiza o catalogo interno do CMS. O site publico ainda usa dados estaticos.";
- solicitacoes ja aplicadas exibem estado visual com `appliedAt`, `appliedBy`, `appliedTo` e `appliedFields`.

## 5. Documento de destino

A aplicacao usa:

```text
cms_establishments/{establishmentId}
```

Regras:

- se `establishmentId` nao existir na solicitacao, a aplicacao aborta com erro claro;
- se `cms_establishments/{establishmentId}` nao existir, a aplicacao aborta com erro claro;
- o bloco nao cria novo empreendimento;
- o bloco nao muda `status` do empreendimento para `published`;
- o bloco nao publica no site.

## 6. Campos aplicados

Somente campos presentes em `requestedChanges` e permitidos pelo contrato sao aplicados:

| Campo em `requestedChanges` | Destino em `cms_establishments` |
| --- | --- |
| `description` | `content.description` |
| `phone` | `contact.phone` |
| `whatsapp` | `contact.whatsapp` |
| `instagram` | `contact.instagram` |
| `website` | `contact.website` |
| `address` | `location.address` |
| `openingHours` | `content.openingHours` |
| `additionalNotes` | `review.lastReviewNotes` |

Tambem sao atualizados no documento de destino:

- `updatedAt`;
- `updatedBy`;
- `review.lastAppliedRequestId`;
- `review.lastAppliedAt`;
- `review.lastAppliedBy`.

## 7. Campos nao aplicados

Nao sao aplicados automaticamente:

- `status`;
- `featured`;
- `priority`;
- `publishedAt`;
- `publishedBy`;
- `archivedAt`;
- `archivedBy`;
- `createdAt`;
- `createdBy`;
- `slug`;
- `id`;
- nome;
- categoria principal;
- coordenadas;
- `mapsUrl`;
- SEO;
- relacionamentos;
- qualquer campo fora de `requestedChanges`;
- qualquer imagem como `media.mainImage` ou `media.gallery`.

## 8. Imagens e anexos

Imagens anexadas continuam como material de revisao.

O bloco:

- nao move arquivos no Storage;
- nao apaga arquivos;
- nao copia de `submissions/...` para `cms-media/...`;
- nao aplica imagem automaticamente em `media.mainImage` ou `media.gallery`;
- mostra aviso no Admin quando a solicitacao possui imagens.

Motivo: o contrato seguro para usar anexos como midia publicada exige revisao manual e, idealmente, copia/selecionamento controlado para `cms-media/{adminUid}/establishments/{establishmentId}/...`.

## 9. Atualizacao da solicitacao

Apos aplicacao com sucesso, `establishment_update_requests/{id}` recebe:

- `appliedAt`;
- `appliedBy`;
- `appliedTo`;
- `appliedFields`;
- `updatedAt`.

Decisao de status:

- nao foi criado status `applied`;
- a solicitacao permanece com `status: approved`;
- `appliedAt` e campos correlatos viram o marcador de aplicacao.

Motivo: `portal-usuario.html`, `admin-firebase.html`, `js/firebase-auth.js` e `firestore.rules` ja trabalham com `pending`, `approved`, `rejected` e `changes_requested`. Criar `applied` neste bloco exigiria ampliar normalizadores e UI do Portal sem ganho operacional imediato.

## 10. Atomicidade

A aplicacao usa `db.batch()` / `writeBatch`:

1. `batch.update(cms_establishments/{establishmentId}, ...)`;
2. `batch.update(establishment_update_requests/{requestId}, ...)`;
3. `batch.commit()`.

Assim, catalogo e solicitacao sao atualizados juntos ou falham juntos.

## 11. Firestore Rules

`firestore.rules` foi verificado e nao precisou de alteracao.

Estado local relevante:

- `cms_establishments` tem `allow update: if isValidEstablishmentUpdate()`;
- `isValidEstablishmentUpdate()` exige `isAdmin()`, preserva `id`, `createdAt` e `createdBy`, e exige `updatedBy == request.auth.uid`;
- `review.lastAppliedRequestId`, `review.lastAppliedAt` e `review.lastAppliedBy` ja fazem parte do schema permitido;
- empreendedor nao tem permissao de escrita em `cms_establishments`;
- `establishment_update_requests` permite update apenas para `isModerator()`;
- empreendedor nao altera `appliedAt`, `appliedBy`, `appliedTo` ou `appliedFields`, porque nao tem permissao de update nessa collection.

Como nenhuma rule foi alterada neste bloco, nao ha nova publicacao de rules causada pelo CMS-3. Permanece a pendencia operacional herdada: garantir que as rules ja existentes estejam publicadas no Firebase Console/CLI.

## 12. Storage Rules

`storage.rules` foi verificado e nao precisou de alteracao.

O bloco nao move, copia nem apaga imagens no Storage.

## 13. Datas publicas

Verificados e nao alterados:

- `sitemap.xml`;
- `js/site-meta.js`;
- `config.js`;
- `sw.js`.

Motivo: a mudanca e restrita ao Admin/Firebase interno. O site publico nao mudou, nao passou a ler Firestore para empreendimentos e os dados estaticos seguem como fonte publica.

## 14. Arquivos alterados

- `admin-firebase.html`
- `js/firebase-auth.js`
- `docs/bloco-cms-3-aplicar-solicitacoes-catalogo.md`
- `docs/auditoria-output/assets-report.json`
- `docs/auditoria-output/assets-report.md`
- `docs/auditoria-output/links-report.json`
- `docs/auditoria-output/links-report.md`
- `docs/auditoria-output/project-report.json`
- `docs/auditoria-output/project-report.md`

Os arquivos em `docs/auditoria-output/` foram regenerados pelos scripts de auditoria.

## 15. Validacoes

Comandos executados:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node --check js/firebase-auth.js
node --check js/admin/modules/empreendimentos.js
node --check config.js
node --check sw.js
```

Tambem foi extraido e validado o script inline de `admin-firebase.html` com `node --check`.

Resultado:

- `node --check js/firebase-auth.js`: OK;
- `node --check js/admin/modules/empreendimentos.js`: OK;
- `node --check config.js`: OK;
- `node --check sw.js`: OK;
- script inline de `admin-firebase.html`: OK, 1 script validado.

Audits executados:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
git diff --check
```

Nao foi executado `npm run build`, `npm run lint` ou `npm run test` porque nao ha `package.json` no repositorio.

Resultado dos audits:

- `audit-links.mjs`: 735 links, 0 quebrados, 1 falso positivo conhecido, 33 candidatos legados/redundantes;
- `audit-assets.mjs`: 226 midias, 0 grupos duplicados, 0 referencias ausentes;
- `audit-project.mjs`: 444 arquivos, 36 HTML, 24 CSS, 48 JS;
- `git diff --check`: OK, apenas avisos LF/CRLF.

## 16. Teste manual recomendado

Depois de confirmar que as rules locais ja estao publicadas:

1. Entrar no Admin com usuario `admin`.
2. Criar uma solicitacao pelo Portal ou usar uma solicitacao aprovada existente.
3. Confirmar que solicitacoes `pending` ainda mostram aprovar/rejeitar/pedir ajustes.
4. Aprovar a solicitacao.
5. Confirmar que ela aparece como `Aprovada, aguardando aplicacao`.
6. Conferir o resumo dos campos e o aviso sobre site publico estatico.
7. Clicar **Aplicar ao catalogo** e confirmar.
8. Abrir `cms_establishments/{establishmentId}` no Console/Firebase.
9. Conferir os campos aplicados e `review.lastAppliedRequestId`, `review.lastAppliedAt`, `review.lastAppliedBy`.
10. Conferir `establishment_update_requests/{id}` com `appliedAt`, `appliedBy`, `appliedTo` e `appliedFields`.
11. Confirmar que uma solicitacao aplicada mostra estado "Ja aplicada".
12. Confirmar que o site publico nao mudou.
13. Confirmar que o Portal continua exibindo status aprovado de forma coerente, sem depender de status novo.

## 17. Confirmacoes de escopo

Confirmado:

- site publico nao foi ligado ao Firestore;
- leitura publica nao foi alterada;
- dados estaticos nao foram removidos;
- seed/apply do seed nao foi executado;
- nenhuma publicacao automatica foi criada;
- empreendedor nao ganhou escrita em `cms_establishments`;
- imagens do Storage nao foram apagadas;
- `sitemap.xml`, `js/site-meta.js`, `config.js` e `sw.js` nao foram alterados.

## 18. Riscos

- O teste local valida sintaxe e estrutura, mas nao prova sessao Firebase real, App Check nem rules publicadas.
- Se as rules publicadas no Firebase Console estiverem desatualizadas, a aplicacao pode falhar com `permission-denied`.
- Se algum documento existente em `cms_establishments` estiver fora do schema atual, o update pode falhar porque as rules validam o documento final.
- Imagens anexadas continuam exigindo decisao editorial/manual antes de virar midia do CMS.
- `status: approved + appliedAt` preserva compatibilidade, mas operadores precisam entender que aprovado e aplicado ao CMS ainda nao significa publicado no site.

## 19. Proximo bloco recomendado

**CMS-4 - Midia e publicacao editorial controlada**, antes de ligar o site publico ao Firestore:

1. definir como imagens de solicitacoes viram midia CMS segura;
2. copiar/selecionar midia para `cms-media`;
3. decidir fluxo de publicacao editorial;
4. manter fallback estatico ate o bloco especifico de leitura publica com QA.
