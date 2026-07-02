# Bloco P4 - Aplicacao/publicacao das solicitacoes aprovadas

**Data:** 2026-07-02
**Escopo:** diagnostico do fluxo pos-aprovacao das solicitacoes do Portal do Usuario e ajuste minimo de comunicacao.
**Sem commit.** Nao foram alterados: hero/video, mapa 3D, URLs/slugs, dados turisticos estaticos, Firestore Rules, Storage Rules, `sitemap.xml`, `js/site-meta.js` ou `config.js`.

## 1. Worktree

`git status --short` estava limpo antes de iniciar. O Git exibiu apenas aviso de permissao no ignore global do usuario (`C:\Users\jacob/.config/git/ignore`), sem arquivos modificados no repositorio.

## 2. Arquivos inspecionados

- `portal-usuario.html`
- `admin-firebase.html`
- `js/firebase-auth.js`
- `js/establishment-catalog.js`
- `js/locais-data.js`
- `js/mapa-turistico.js`
- `js/data/turismo-data.js`
- `js/data/turismo-data-adapter.js`
- `firestore.rules`
- `storage.rules`
- `config.js`
- `js/site-meta.js`
- `sitemap.xml`
- `js/admin/admin-router.js`
- `js/admin/admin-ui.js`
- `js/admin/admin-shell.js`
- `js/admin/admin-context.js`
- `js/admin/admin-registry.js`
- `js/admin/modules/dashboard.js`
- `js/admin/modules/placeholder.js`
- `js/admin/modules/banners.js`
- `docs/bloco-p2-validacao-portal-empreendedor.md`
- `docs/bloco-p3-fechamento-portal-empreendedor.md`

## 3. Fluxo atual de revisao admin

O admin ve `establishment_update_requests` em `admin-firebase.html`, na fila "Alteracoes de empreendimentos".

Hoje a UI carrega apenas solicitacoes `pending`:

```js
FirebaseSystem.listAllEstablishmentUpdateRequests(['pending'])
```

Acoes existentes:

- **Aprovar para revisao**: chama `FirebaseSystem.reviewEstablishmentUpdateRequest` com `status: 'approved'`.
- **Rejeitar**: chama a mesma rotina com `status: 'rejected'`, exigindo motivo.
- **Pedir ajustes**: chama a mesma rotina com `status: 'changes_requested'`, exigindo orientacao.

Campos atualizados na revisao:

- `status`
- `updatedAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`
- `rejectionReason`, quando rejeitada
- `changesRequestedNotes`, quando ajustes sao solicitados

A aprovacao nao grava em dados publicos, nao altera `TURISMO_DATA`, nao altera `js/locais-data.js`, nao escreve em catalogo publico e nao cria publicacao automatica.

## 4. Onde as solicitacoes sao salvas

O empreendedor cria documentos em:

- `establishment_update_requests`

Principais campos:

- `currentSnapshot`: retrato conhecido do empreendimento no momento da solicitacao.
- `requestedChanges`: somente campos propostos para alteracao.
- `images`, `mainImage`, `imageCount`: anexos enviados.
- `status`: `pending`, `approved`, `rejected` ou `changes_requested`.

O empreendedor continua como solicitante. Ele nao publica, nao aplica e nao ganha permissao administrativa.

## 5. Dado publico/catalogo atual

O site publico usa base estatica para estabelecimentos:

- `js/data/hospedagens.js` -> `window.TURISMO_HOSPEDAGENS`
- `js/data/restaurantes.js` -> `window.TURISMO_RESTAURANTES`
- `js/locais-data.js` -> `window.locaisData`
- `js/rotas-data.js` -> `window.ROTAS_LEGADO_ESTABLISHMENTS`
- `js/data/turismo-data-adapter.js` mescla fontes legadas/estaticas.
- `js/data/turismo-data.js` cria `window.TURISMO_DATA`.
- `js/mapa-turistico.js` monta os itens do mapa a partir de `window.TURISMO_DATA`.

O `js/establishment-catalog.js` tambem deriva o catalogo reivindicavel dessas fontes estaticas/legadas. Ele nao le Firestore.

Existe `estabelecimentos_aprovados` em `firestore.rules` e em funcoes antigas de aprovacao de novo estabelecimento, mas o site publico nao le essa collection para alimentar mapa, sabores, hospedagens ou catalogo reivindicavel. O mapa publico le Firestore apenas para `eventos_aprovados`.

## 6. Lacuna encontrada

A lacuna e operacional/arquitetural:

- aprovar uma solicitacao de alteracao muda apenas o status da solicitacao;
- nao existe botao separado "Aplicar ao catalogo";
- nao existe collection publica dinamica de estabelecimentos ja consumida pelo site;
- aplicar hoje exigiria editar arquivos estaticos ou criar uma nova camada publica de dados;
- criar essa camada agora seria arquitetura nova e tocaria mapa/catalogo/publicacao, fora do escopo seguro deste bloco.

## 7. Decisao tecnica

Nao foi implementada aplicacao/publicacao automatica.

A arquitetura mais segura para uma etapa futura e:

1. empreendedor solicita;
2. admin revisa;
3. solicitacao aprovada fica como "aguardando publicacao/atualizacao";
4. somente admin/equipe aplica a alteracao em fluxo separado;
5. a aplicacao deve registrar `publishedAt`/`publishedBy` ou campos equivalentes;
6. o site publico so deve ler um destino dinamico depois que esse destino existir, tiver rules restritas e fallback para dados estaticos.

## 8. Alteracoes feitas

Foram feitos apenas ajustes de comunicacao:

- Portal: texto do historico de solicitacoes agora informa que uma solicitacao aprovada fica aguardando publicacao/atualizacao controlada.
- Portal: status `approved` virou "Aprovada, aguardando publicacao".
- Portal: item aprovado mostra aviso de que aguarda publicacao/atualizacao controlada.
- Admin: texto da fila explica que aprovar nao publica e que a solicitacao fica aguardando publicacao/atualizacao controlada.
- Admin: confirmacao de aprovacao explicita que nao publica automaticamente.
- `FirebaseSystem.reviewEstablishmentUpdateRequest`: mensagem de sucesso da aprovacao alinhada ao mesmo entendimento.

## 9. Rules

Nenhuma rule foi alterada.

Estado atual verificado:

- `establishment_update_requests`: dono cria/le a propria solicitacao; admin/moderador atualiza/revisa.
- `estabelecimentos_aprovados`: leitura publica e escrita por moderador, mas nao e lida pelo site publico atual para o catalogo/mapa.
- `eventos_aprovados`: leitura publica e escrita por moderador; esta sim e lida pelo mapa/home para eventos.
- `storage.rules`: caminho `submissions/establishment-updates/{uid}/{submissionId}/{fileName}` ja cobre anexos de solicitacoes.

Nao ha nova publicacao de rules exigida por este bloco. Permanece a pendencia operacional de confirmar se as rules publicadas no Firebase Console batem com os arquivos locais.

## 10. Datas, horarios e campos verificados

Verificados:

- `updatedAt` / `updatedBy`
- `reviewedAt` / `reviewedBy`
- `approvedAt` / `approvedBy`
- `publishedAt` / `publishedBy`
- `lastUpdated` / `lastModified`
- `sitemap.xml` / `lastmod`
- `js/site-meta.js`
- `config.js`
- textos visiveis de ultima atualizacao

Atualizados neste bloco:

- nenhum campo de data/hora de dado publico;
- nenhum `lastmod`;
- nenhum `js/site-meta.js`;
- nenhum `config.js`.

Motivo: a alteracao foi em paginas autenticadas/admin e documentacao tecnica. Nao houve publicacao de dado turistico novo nem alteracao significativa em pagina publica indexada.

Observacao de modelo:

- `establishment_update_requests` nao tem `approvedAt`/`approvedBy`; usa `reviewedAt`/`reviewedBy` para qualquer decisao de revisao.
- nao existe `publishedAt`/`publishedBy` neste fluxo porque nao existe aplicacao/publicacao implementada.
- modulo de banners tem `publishedAt`, mas e outro dominio (`banners`) e nao deve ser reaproveitado para estabelecimentos.

## 11. O que nao foi atualizado e por que

- Dados estaticos (`js/data/*.js`, `js/locais-data.js`, `js/rotas-data.js`): nao havia solicitacao real aprovada a aplicar e alteracao manual de dados turisticos ficaria sem trilha.
- `js/mapa-turistico.js`: criar leitura dinamica de estabelecimentos seria arquitetura nova.
- `js/establishment-catalog.js`: passar a ler Firestore mudaria o contrato do portal/catalogo e exigiria rules/fallback/QA maior.
- `firestore.rules` e `storage.rules`: ja protegem o fluxo atual; nao havia destino novo seguro a liberar.
- `sitemap.xml`: portal/admin nao sao paginas publicas indexadas.
- `js/site-meta.js`: nao houve atualizacao de pagina publica.

## 12. Riscos

- Empreendedor ainda pode esperar publicacao imediata se o guia/PDF usar linguagem antiga. O texto do guia deve dizer "aprovada, aguardando publicacao/atualizacao".
- Sem fluxo de aplicacao, a equipe precisa controlar manualmente quais solicitacoes aprovadas foram publicadas.
- Criar leitura dinamica de estabelecimentos sem planejamento pode quebrar mapa, sabores, hospedagens, busca e SEO.
- Teste autenticado real nao foi executado neste bloco; validacao local cobre sintaxe/audits.

## 13. Rollback

Como nao houve commit, reverter os arquivos alterados neste bloco:

- `portal-usuario.html`
- `admin-firebase.html`
- `js/firebase-auth.js`
- `docs/bloco-p4-aplicacao-publicacao-solicitacoes.md`
- relatorios regenerados em `docs/auditoria-output/`, se quiser descartar apenas o churn dos audits

Nao ha rules, dados publicos ou migracao para desfazer.

## 14. Validacoes executadas

- `node --check js/firebase-auth.js` -> OK
- `node --check config.js` -> OK
- `node --check sw.js` -> OK
- Extracao e `node --check` dos scripts inline de `portal-usuario.html` -> OK
- Extracao e `node --check` dos scripts inline de `admin-firebase.html` -> OK
- `node --check` em `js/admin/*.js` e `js/admin/modules/*.js` -> OK
- `node scripts/audit-links.mjs` -> 662 links, 0 broken, 1 known false positive, 20 legacy/redundant candidates
- `node scripts/audit-assets.mjs` -> 226 media, 0 duplicate groups, 0 missing references
- `node scripts/audit-project.mjs` -> 420 files, 36 html, 23 css, 46 js
- `git diff --check` -> OK, apenas avisos de LF/CRLF

Nao ha `package.json` no repositorio, portanto nao existem scripts `npm run build`, `npm run lint` ou `npm run test` para executar.

Os arquivos abaixo foram regenerados pelos audits:

- `docs/auditoria-output/links-report.json`
- `docs/auditoria-output/links-report.md`
- `docs/auditoria-output/assets-report.json`
- `docs/auditoria-output/assets-report.md`
- `docs/auditoria-output/project-report.json`
- `docs/auditoria-output/project-report.md`

## 15. Proxima etapa recomendada

Criar uma sprint separada para "Publicacao controlada de alteracoes de empreendimentos", com decisao previa entre:

1. fluxo manual documentado: equipe aplica em arquivos estaticos e registra no doc/planilha de controle; ou
2. fluxo dinamico: nova collection publica de estabelecimentos, botao admin "Aplicar ao catalogo", `publishedAt`/`publishedBy`, rules restritas, fallback para dados estaticos e leitura publica testada em mapa/sabores/hospedagens/busca.
