# Bloco CMS-4B - UI Admin para revisar imagens de solicitacoes

**Data:** 2026-07-07  
**Projeto:** SITE-TURISMO-SMS-mainv2  
**Escopo:** implementar revisao editorial de imagens anexadas em `establishment_update_requests`, sem mover, copiar, apagar ou publicar arquivos de Storage e sem aplicar midia ao catalogo.

## 1. Pre-check

- `git status --short` e `git status --porcelain=v1` foram executados antes das alteracoes.
- O worktree estava limpo; o Git exibiu apenas aviso de permissao ao acessar `C:\Users\jacob/.config/git/ignore`.
- Nenhum commit foi feito.
- Nenhum `git reset` ou `git restore` foi executado.
- Nenhum seed, apply, deploy, publicacao de rules ou operacao real de Storage foi executado.

## 2. Arquivos inspecionados

- `docs/bloco-cms-4a-contrato-midia-empreendimentos.md`
- `docs/bloco-cms-3-aplicar-solicitacoes-catalogo.md`
- `docs/bloco-cms-2a-contrato-empreendimentos.md`
- `docs/schemas/cms-establishments.schema.md`
- `admin-firebase.html`
- `portal-usuario.html`
- `js/firebase-auth.js`
- `js/admin/modules/empreendimentos.js`
- `firestore.rules`
- `storage.rules`
- `config.js`
- `js/site-meta.js`
- `sw.js`

Tambem foram buscados os termos do bloco relacionados a `establishment_update_requests`, `requestedChanges`, `images`, `submissions/establishment-updates`, `reviewEstablishmentUpdateRequest`, `applyEstablishmentUpdateRequest`, `appliedFields`, `approved`, `pending`, `changes_requested`, `rejected`, `storage`, `url`, `path`, `contentType`, `size`, `position`, `gallery` e `media`.

## 3. Fluxo anterior

O Portal ja enviava imagens em solicitacoes de alteracao de empreendimento.

Os arquivos fisicos ficam em:

```text
submissions/establishment-updates/{uid}/{requestId}/{fileName}
```

Os metadados ficam no documento:

```text
establishment_update_requests/{requestId}
```

Campos confirmados por imagem:

```js
{
  url,
  path,
  name,
  contentType,
  size,
  uploadedAt,
  position
}
```

As imagens ficam no campo top-level `images`. Elas nao ficam em `requestedChanges.images`.

Antes deste bloco, o Admin renderizava apenas:

- miniatura;
- link para abrir a imagem;
- legenda simples com `name` ou `path`.

Nao havia status editorial por imagem.

## 4. Fluxo novo

Na tela de solicitacoes de alteracao de empreendimentos, quando a solicitacao possui imagens, o Admin agora mostra:

- miniatura com link;
- nome do arquivo;
- tipo e tamanho;
- posicao;
- status textual e visual;
- seletor de decisao editorial por imagem;
- observacao curta por imagem;
- botao **Salvar revisao das imagens**.

Status permitidos:

```text
pending
accepted
rejected
```

A UI tambem informa que imagens aceitas nesta etapa ainda precisam de aplicacao/publicacao de midia em bloco futuro.

## 5. Campo salvo

O bloco grava somente na propria solicitacao:

```js
mediaReview: {
  reviewedAt,
  reviewedBy,
  images: [
    {
      path,
      url,
      status: "pending" | "accepted" | "rejected",
      note,
      decidedAt,
      decidedBy
    }
  ]
}
```

Detalhes da implementacao:

- `reviewedAt` usa `serverTimestamp()`;
- `reviewedBy` usa o UID do admin/moderador logado;
- cada `decidedAt` e salvo como string ISO;
- cada `decidedBy` usa o UID do admin/moderador logado;
- `note` e limitada a 240 caracteres;
- a gravacao recarrega a solicitacao e usa apenas imagens ja existentes em `request.images`;
- a UI nao cria path novo nem aplica imagem no catalogo.

## 6. Compatibilidade com CMS-3

O fluxo de CMS-3 foi preservado.

Quando a solicitacao tem texto + imagem:

- o botao **Aplicar ao catalogo** continua aplicando somente campos textuais permitidos;
- imagens continuam fora de `cms_establishments.media`;
- a revisao de imagem fica registrada apenas em `mediaReview`.

Quando a solicitacao tem apenas imagens:

- o Admin pode revisar e salvar `mediaReview`;
- a aplicacao textual continua indisponivel por nao haver campos aplicaveis;
- nenhuma aplicacao automatica de midia e forçada.

## 7. Rules

`firestore.rules` foi verificado e nao precisou de alteracao.

Estado local relevante:

- `establishment_update_requests` permite `update` somente para `isModerator()`;
- `isModerator()` cobre `admin` e `moderator`;
- empreendedor pode criar e ler solicitacoes proprias, mas nao pode atualizar `mediaReview`;
- `cms_establishments` segue sem escrita para empreendedor.

Como `firestore.rules` nao foi alterado neste bloco, nao ha nova publicacao de rules causada pelo CMS-4B. Continua valendo a pendencia operacional geral: confirmar que as rules locais ja estao publicadas no Firebase.

`storage.rules` foi verificado e nao foi alterado.

## 8. Confirmacoes de escopo

Confirmado:

- nenhuma imagem foi movida no Storage;
- nenhuma imagem foi copiada no Storage;
- nenhuma imagem foi apagada no Storage;
- nenhuma imagem foi gravada em `cms_establishments.media`;
- nenhuma imagem virou `media.mainImage`;
- nenhuma imagem entrou em `media.gallery`;
- o site publico nao foi alterado;
- o site publico nao foi ligado ao Firestore;
- `sitemap.xml` nao foi alterado;
- `js/site-meta.js` nao foi alterado;
- `config.js` nao foi alterado;
- `sw.js` nao foi alterado;
- `storage.rules` nao foi alterado.

## 9. Arquivos alterados

- `admin-firebase.html`
- `js/firebase-auth.js`
- `docs/bloco-cms-4b-ui-revisao-imagens-solicitacoes.md`
- `docs/auditoria-output/assets-report.json`
- `docs/auditoria-output/assets-report.md`
- `docs/auditoria-output/links-report.json`
- `docs/auditoria-output/links-report.md`
- `docs/auditoria-output/project-report.json`
- `docs/auditoria-output/project-report.md`

Os arquivos em `docs/auditoria-output/` foram regenerados pelos scripts de auditoria.

## 10. Validacoes

Comandos executados:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node --check js/firebase-auth.js
node --check js/admin/modules/empreendimentos.js
node --check config.js
node --check sw.js
```

Tambem foi extraido o script inline de `admin-firebase.html` para arquivo temporario e validado com `node --check`.

Resultado:

- `node --check js/firebase-auth.js`: OK;
- `node --check js/admin/modules/empreendimentos.js`: OK;
- `node --check config.js`: OK;
- `node --check sw.js`: OK;
- script inline de `admin-firebase.html`: OK.

Audits executados:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
```

Resultado dos audits:

- `audit-links.mjs`: 735 links, 0 quebrados, 1 falso positivo conhecido, 33 candidatos legados/redundantes;
- `audit-assets.mjs`: 226 midias, 0 grupos duplicados, 0 referencias ausentes;
- `audit-project.mjs`: 446 arquivos, 36 HTML, 24 CSS, 48 JS.

Nao foi executado `npm run build`, `npm run lint` ou `npm run test` porque nao ha `package.json` no repositorio.

## 11. Teste manual recomendado

Depois de confirmar que as rules locais estao publicadas:

1. Criar solicitacao pelo Portal com imagem.
2. Abrir a solicitacao no Admin.
3. Visualizar miniatura, nome, tipo, tamanho e posicao.
4. Marcar uma imagem como `accepted`.
5. Marcar outra imagem como `rejected`.
6. Adicionar observacao curta.
7. Salvar revisao das imagens.
8. Recarregar a fila.
9. Confirmar que `mediaReview` persistiu em `establishment_update_requests/{id}`.
10. Confirmar que `cms_establishments.media` nao mudou.
11. Confirmar que Storage nao mudou.
12. Confirmar que o site publico nao mudou.

## 12. Riscos

- Validacao local nao prova sessao Firebase real, App Check nem rules publicadas.
- Se as Firestore Rules publicadas estiverem divergentes do arquivo local, a gravacao de `mediaReview` pode falhar com `permission-denied`.
- A URL de download ja existente na solicitacao continua sendo exibida ao admin; o bloco nao altera politica de token/retencao.
- `mediaReview` e decisao editorial, nao publicacao de midia. Operadores ainda precisam de bloco futuro para aplicar imagens aceitas ao catalogo.

## 13. Proximo bloco recomendado

**CMS-4C - Aplicar imagem aceita ao catalogo interno**

Objetivo recomendado:

1. listar imagens com `mediaReview.status == "accepted"`;
2. copiar/reupar imagem aceita para `cms-media/{adminUid}/establishments/{establishmentId}/...`;
3. gravar referencia em `cms_establishments.media.mainImage` ou `cms_establishments.media.gallery`;
4. registrar origem (`sourceRequestId`/`sourceSubmissionPath`);
5. manter politica de nao apagar `submissions/...` automaticamente.
