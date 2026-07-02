# Bloco P3 - Fechamento do Portal do Empreendedor

**Data:** 2026-07-02
**Escopo:** fechamento de entendimento e comunicação do fluxo do Portal do Empreendedor antes da divulgação do guia/PDF.
**Sem commit.** Nao foram alterados: hero/video, mapa 3D, URLs limpas/slugs, dados publicos do mapa, Firestore Rules, Storage Rules, `sitemap.xml`, `js/site-meta.js` ou `config.js`.

## 1. Worktree

`git status --short` estava limpo antes de iniciar. O Git exibiu apenas aviso de permissao no ignore global do usuario (`C:\Users\jacob/.config/git/ignore`), sem arquivos modificados no repositorio.

## 2. Arquivos inspecionados

- `portal-usuario.html`
- `admin-firebase.html`
- `js/firebase-auth.js`
- `js/establishment-catalog.js`
- `js/locais-data.js`
- `js/mapa-turistico.js`
- `firestore.rules`
- `storage.rules`
- `config.js`
- `js/site-meta.js`
- `sitemap.xml`
- `docs/bloco-p2-validacao-portal-empreendedor.md`
- `docs/bloco-vinculos-admin-portal-usuario.md`
- `docs/bloco-s9-atualizacao-contatos-cultura-turismo.md`

Nao foi encontrado guia/PDF/DOCX final dos empreendedores no repositorio. O material mais proximo no repo e a documentacao tecnica em `docs/`.

## 3. Fluxo pos-aprovacao encontrado

O fluxo atual continua sendo **solicitacao + revisao administrativa**, nao edicao direta pelo empreendedor.

1. O empreendedor acessa `portal-usuario.html` com conta comum.
2. O vinculo com empreendimento nasce por solicitacao em `establishment_claims` ou por cadastro manual do admin.
3. O vinculo efetivo fica em `establishment_managers` com `userId` do empreendedor e `active: true`.
4. Com vinculo ativo, o portal mostra o empreendimento em "Meus empreendimentos".
5. Ao solicitar alteracao, o portal monta `currentSnapshot` a partir do catalogo publico (`js/establishment-catalog.js`) e grava somente a proposta em `establishment_update_requests`.
6. O admin ve a fila em `admin-firebase.html`, na area "Alteracoes de empreendimentos".
7. As acoes existentes sao `approved`, `rejected` e `changes_requested`.
8. Aprovar chama `FirebaseSystem.reviewEstablishmentUpdateRequest` e atualiza apenas o documento da solicitacao.

Conclusao: **aprovar uma solicitacao de alteracao nao publica automaticamente no site publico**. Nao ha, neste bloco, acao admin implementada que aplique o patch em `TURISMO_DATA`, `js/locais-data.js`, dados estaticos, mapa turistico ou catalogo publico.

## 4. Dado publico/catalogo atual

- `js/mapa-turistico.js` monta o mapa a partir de `window.TURISMO_DATA` e tambem carrega eventos aprovados em fluxo separado.
- `js/establishment-catalog.js` monta o catalogo reivindicavel a partir de fontes publicas/estaticas como `window.TURISMO_RESTAURANTES`, `window.TURISMO_HOSPEDAGENS` e rotas legadas.
- `establishment_update_requests` nao e lida pelo mapa publico.

Portanto, a solicitacao aprovada fica como registro administrativo para aplicacao/publicacao controlada posterior.

## 5. Mensagens e labels ajustados

Foram ajustadas mensagens para evitar promessa de edicao em tempo real:

- Portal, historico de alteracoes: explica que nada e publicado automaticamente e que mesmo solicitacao aprovada pode depender de validacao/aplicacao pela equipe responsavel.
- Portal, status `pending`: "Enviada para analise".
- Portal, status `approved`: "Aprovada pela equipe".
- Portal, item aprovado: aviso "Solicitacao aprovada pela equipe. A publicacao/atualizacao no site pode depender de validacao/aplicacao pela equipe responsavel."
- Admin, fila de alteracoes: reforca que aprovar nao publica no mapa nem nos dados estaticos.
- Admin, botao de aprovacao: "Aprovar para revisao".
- Admin/FirebaseSystem, retorno de aprovacao: mesma linguagem de publicacao/atualizacao controlada.

## 6. Datas, horarios e campos verificados

### Campos da solicitacao de alteracao

Na criacao em `establishment_update_requests`:

- `createdAt`, `updatedAt` e `submittedAt` recebem `serverTimestamp()`.
- `reviewedAt` e `reviewedBy` nascem `null`.
- `reviewNotes`, `rejectionReason` e `changesRequestedNotes` nascem vazios.

Na revisao admin:

- `status` muda para `approved`, `rejected` ou `changes_requested`.
- `updatedAt` recebe `serverTimestamp()`.
- `reviewedAt` recebe `serverTimestamp()`.
- `reviewedBy` recebe o UID do admin/moderador.

Nao existem hoje, para `establishment_update_requests`, campos especificos `approvedAt`/`approvedBy` ou `publishedAt`/`publishedBy`. A aprovacao usa os campos genericos de revisao (`reviewedAt`/`reviewedBy`). Como nao ha publicacao automatica/aplicacao no dado publico, nao ha campo de publicacao a preencher neste fluxo.

### Site-meta, config e sitemap

- `js/site-meta.js` tem `updatedAt`, mas e usado nas paginas publicas principais, nao em `portal-usuario.html` ou `admin-firebase.html`.
- `sitemap.xml` ja declara que o Portal do Usuario foi removido do sitemap por ser pagina autenticada/bloqueada no `robots.txt`.
- `config.js` nao contem campo de ultima atualizacao aplicavel a este fluxo.

Decisao: **nao atualizar `js/site-meta.js` nem `sitemap.xml`**, porque este bloco mexeu em comunicacao de paginas autenticadas/admin e criou documentacao tecnica, sem alteracao significativa em paginas publicas indexadas.

## 7. Guia/PDF dos empreendedores

Nao foi encontrado guia/PDF/DOCX final no repositorio. Texto recomendado para o guia:

> O Portal do Empreendedor permite solicitar vinculo com um empreendimento e enviar pedidos de correcao ou atualizacao de informacoes. O empreendedor nao edita o site diretamente. Cada solicitacao enviada fica em analise pela equipe responsavel. Quando uma solicitacao aparece como aprovada, isso significa que ela foi aprovada pela equipe para continuidade do processo; a publicacao ou atualizacao no site pode depender de validacao e aplicacao controlada pela equipe responsavel.

Itens que o guia deve explicar:

- diferenca entre conta de usuario, vinculo com empreendimento e permissao administrativa;
- como solicitar vinculo;
- como enviar solicitacao de alteracao;
- quais campos podem ser sugeridos;
- limite de imagens: ate 6 imagens, JPG/PNG/WebP, ate 5 MB cada;
- status possiveis: enviada para analise, aprovada pela equipe, rejeitada, ajustes necessarios;
- aprovacao nao equivale necessariamente a publicacao imediata no site.

## 8. Rules

### Firestore

`firestore.rules` ja separa corretamente:

- dono autenticado pode criar a propria solicitacao em `establishment_update_requests` somente com `status: pending`, `source: establishment_manager`, vinculo ativo real e schema controlado;
- dono pode ler a propria solicitacao;
- `update/delete` ficam restritos a moderador/admin;
- usuario comum nao escreve diretamente em dados publicos.

### Storage

`storage.rules` ja cobre `submissions/establishment-updates/{uid}/{submissionId}/{fileName}` com:

- upload apenas pelo proprio `uid`;
- leitura/delete pelo dono ou staff;
- tipo de imagem permitido;
- limite de 5 MB por arquivo.

Nao houve alteracao em rules neste bloco. Portanto, nao ha nova publicacao de rules exigida por esta sprint. Permanece a pendencia operacional herdada: conferir se as rules publicadas no Firebase Console correspondem aos arquivos do repositorio.

## 9. Arquivos alterados

- `portal-usuario.html`
- `admin-firebase.html`
- `js/firebase-auth.js`
- `docs/bloco-p3-fechamento-portal-empreendedor.md`
- `docs/auditoria-output/links-report.json`
- `docs/auditoria-output/links-report.md`
- `docs/auditoria-output/assets-report.json`
- `docs/auditoria-output/assets-report.md`
- `docs/auditoria-output/project-report.json`
- `docs/auditoria-output/project-report.md`

Os arquivos em `docs/auditoria-output/` foram regenerados pelos scripts de auditoria executados neste bloco.

## 10. O que nao foi atualizado e por que

- `firestore.rules` e `storage.rules`: ja suportam o fluxo; alterar abriria risco desnecessario.
- `sitemap.xml`: portal autenticado nao esta no sitemap; admin tambem nao deve entrar.
- `js/site-meta.js`: usado como metadado de paginas publicas; nao houve alteracao significativa nessas paginas.
- `config.js`: sem campo aplicavel ao fluxo.
- `js/locais-data.js`, `js/mapa-turistico.js` e dados publicos: aprovacao nao aplica publicacao automatica; nao houve dado publico novo a publicar.
- Guia/PDF/DOCX final: nao localizado no repositorio; deixado texto recomendado.

## 11. Riscos

- Se a equipe interpretar `approved` como publicacao final fora do sistema, pode haver desalinhamento operacional. A UI agora reduz esse risco, mas o guia precisa repetir a mesma linguagem.
- Se as rules publicadas no Firebase Console estiverem desatualizadas, o fluxo real pode falhar com `permission-denied`, mesmo com os arquivos locais corretos.
- Nao foi feito teste autenticado real neste bloco; validacao local cobre sintaxe/audits, nao sessao Firebase com App Check.

## 12. Rollback

Como nao houve commit, o rollback e reverter os quatro arquivos alterados neste bloco:

- `portal-usuario.html`
- `admin-firebase.html`
- `js/firebase-auth.js`
- `docs/bloco-p3-fechamento-portal-empreendedor.md`

Nao ha dado, regra ou migracao para desfazer.

## 13. Validacoes executadas

- `node --check js/firebase-auth.js` -> OK
- `node --check config.js` -> OK
- `node --check sw.js` -> OK
- Extracao e `node --check` dos scripts inline de `portal-usuario.html` -> OK
- Extracao e `node --check` dos scripts inline de `admin-firebase.html` -> OK
- `node scripts/audit-links.mjs` -> 662 links, 0 broken, 1 known false positive, 20 legacy/redundant candidates
- `node scripts/audit-assets.mjs` -> 226 media, 0 duplicate groups, 0 missing references
- `node scripts/audit-project.mjs` -> 419 files, 36 html, 23 css, 46 js

## 14. Proxima etapa recomendada

1. Atualizar o guia/PDF/DOCX final dos empreendedores com o texto recomendado acima.
2. Fazer teste manual autenticado: empreendedor cria solicitacao, admin aprova, empreendedor ve "Aprovada pela equipe" e o site publico continua inalterado ate aplicacao controlada.
3. Definir, em sprint separada, se havera ferramenta de aplicacao/publicacao controlada ou se a aplicacao continuara manual em dados estaticos.
