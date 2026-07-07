# Bloco CMS-2B - CRUD interno de empreendimentos

**Data:** 2026-07-07  
**Projeto:** SITE-TURISMO-SMS-mainv2  
**Escopo:** implementar CRUD interno de empreendimentos no Painel Admin usando o contrato CMS-2A, sem ligar site publico ao Firestore, sem migrar dados e sem aplicar solicitacoes automaticamente.

## 1. Estado inicial

- `git status --short` ja estava sujo com artefatos do CMS-2A e relatorios de auditoria regenerados.
- Foram preservadas as alteracoes existentes; nada foi revertido.
- Nenhum commit foi feito.
- Nenhum dado publico estatico foi removido ou migrado.

## 2. Arquivos alterados neste bloco

- `admin-firebase.html`
- `js/admin/modules/empreendimentos.js`
- `firestore.rules`
- `docs/bloco-cms-2b-crud-empreendimentos.md`

Arquivos de auditoria podem ser regenerados novamente pelos scripts:

- `docs/auditoria-output/assets-report.json`
- `docs/auditoria-output/assets-report.md`
- `docs/auditoria-output/links-report.json`
- `docs/auditoria-output/links-report.md`
- `docs/auditoria-output/project-report.json`
- `docs/auditoria-output/project-report.md`

## 3. Modulo Admin criado

Arquivo: `js/admin/modules/empreendimentos.js`

Namespace global:

- `window.AdminEstablishmentsModule`

Registro:

- id: `empreendimentos`;
- collection: `cms_establishments`;
- carregado antes de `js/admin/modules/placeholder.js`;
- o placeholder de `empreendimentos` deixa de ser registrado porque `AdminRegistry.has('empreendimentos')` passa a retornar verdadeiro.

Integração no admin:

- o item `Empreendimentos` foi movido do grupo "Em preparação" para "Conteudo";
- `admin-firebase.html` carrega `js/admin/modules/empreendimentos.js`;
- `showSection('empreendimentos')` chama `AdminEstablishmentsModule.activate()`.

## 4. Funcionalidades implementadas

| Recurso | Status |
| --- | --- |
| Listagem | implementado |
| Pesquisa | implementado por nome, slug, categoria, resumo, descricao, endereco, contato, rota e tags |
| Filtro por status | implementado |
| Filtro por categoria | implementado |
| Criar | implementado como rascunho interno |
| Editar | implementado |
| Visualizar | implementado |
| Arquivar | implementado, com motivo |
| Restaurar | implementado, volta para `draft` |
| Upload de imagem principal | implementado |
| Upload de galeria | implementado |
| Timestamps | `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `archivedAt`, `archivedBy` |
| Auditoria basica | campos de responsavel e timestamps do proprio doc |
| Delete definitivo | nao implementado e bloqueado nas rules |
| Publicacao publica | nao implementada |
| Consumo publico | nao alterado |
| Migracao/seed | nao implementado |
| Aplicacao automatica de solicitacoes | nao implementada |

## 5. Schema usado

O modulo grava documentos em `cms_establishments/{establishmentId}` seguindo o contrato do CMS-2A.

Grupos principais:

- `id`;
- `slug`;
- `name`;
- `categoryId`;
- `categoryLabel`;
- `status`;
- `content`;
- `contact`;
- `location`;
- `media`;
- `relationships`;
- `display`;
- `seo`;
- `publishing`;
- `review`;
- `source`;
- `createdAt`;
- `createdBy`;
- `updatedAt`;
- `updatedBy`.

O formulario cobre os principais campos do schema:

- nome, slug, categoria e status interno;
- resumo, descricao, descricao longa, horario, acessibilidade, tags e notas;
- telefone, WhatsApp, email, site, Instagram e Facebook;
- endereco, bairro, cidade, estado, CEP, coordenadas, Maps URL e observacao de coordenada;
- imagem principal, galeria, video URL futuro e creditos;
- rotas relacionadas, rota legada e nome da rota legada;
- destaque, prioridade, visibilidade futura no mapa e reivindicavel no Portal;
- SEO futuro;
- origem, arquivo de origem, id original, categoria original e aliases legados.

## 6. Status e publicacao

O schema aceita:

- `draft`;
- `published`;
- `archived`.

Neste bloco, a UI trabalha apenas com:

- `draft`;
- `archived`.

Nao ha botao de publicar, nao ha acao de publicacao e nao ha leitura publica da collection nas rules. Se um doc legado/manual aparecer como `published`, ele pode ser visto internamente, mas o modulo nao cria fluxo publico para esse status.

## 7. Upload e Storage

Path usado:

```text
cms-media/{uid}/establishments/{establishmentId}/main/{timestamp}-{fileName}
cms-media/{uid}/establishments/{establishmentId}/gallery/{timestamp}-{fileName}
```

Limites:

- JPG, PNG ou WebP;
- ate 5 MB por arquivo;
- escrita apenas pelo admin autenticado do proprio `{uid}`, conforme `storage.rules` existente;
- leitura publica do arquivo segue o comportamento atual de `cms-media`, mas o site publico nao consome `cms_establishments` neste bloco.

`storage.rules` nao foi alterado porque `cms-media/{uid}/{allFiles=**}` ja cobre esse path com `validCmsImageUpload(uid)`.

## 8. Firestore Rules

`firestore.rules` recebeu apenas o bloco necessario para `cms_establishments`.

Decisoes:

- `allow read: if isAdmin()`;
- `allow create: if isAdmin()` e schema valido;
- `allow update: if isAdmin()` e schema valido;
- `allow delete: if false`;
- sem leitura publica, inclusive para `status == 'published'`;
- sem permissao por `ownerUid`, `managerId` ou vinculo de empreendedor;
- validacao de top-level keys por `hasOnly()`;
- validacao dos mapas principais (`content`, `contact`, `location`, `media`, `relationships`, `display`, `seo`, `publishing`, `review`, `source`);
- `createdAt` e `createdBy` preservados no update;
- `updatedBy` precisa ser o UID do admin autenticado.

Observacao: a Firebase CLI nao esta disponivel no PATH local, portanto nao houve validacao via CLI/emulator. As rules precisam ser publicadas no Firebase Console/CLI antes do uso real autenticado.

## 9. Relacao com Portal do Usuario

Nada foi alterado no Portal.

Fluxos existentes continuam separados:

- `establishment_claims`: solicitacao de vinculo;
- `establishment_managers`: vinculo aprovado;
- `establishment_update_requests`: solicitacao de alteracao;
- `cms_establishments`: catalogo interno do admin.

O CRUD interno nao aplica `establishment_update_requests` aprovadas. Essa ponte fica para CMS-3.

## 10. Relacao com site publico

Nada foi ligado ao site publico.

Continuam como fontes publicas de empreendimentos:

- `js/locais-data.js`;
- `js/data/*.js`;
- `js/establishment-catalog.js`;
- `js/mapa-turistico.js`;
- `js/data/turismo-data-adapter.js`;
- `js/data/turismo-data.js`.

`cms_establishments` nao e lido pelo mapa, sabores, hospedagem, busca, local.html ou catalogo reivindicavel neste bloco.

## 11. Datas e horarios

Verificados:

- `sitemap.xml`: `lastmod` por URL publica;
- `js/site-meta.js`: `updatedAt`;
- `config.js`: datas de campanha/evento;
- `sw.js`: `CACHE_NAME`.

Decisao:

- nao atualizar `sitemap.xml`;
- nao atualizar `js/site-meta.js`;
- nao atualizar `config.js`;
- nao atualizar `sw.js`.

Motivo: a mudanca e restrita ao Painel Admin autenticado e a `firestore.rules`. Nao houve alteracao publica/indexavel nem troca de cache/public asset que justifique bump de `lastmod`, `site-meta` ou service worker.

## 12. Riscos

- As rules locais precisam ser publicadas para o CRUD funcionar no Firebase real.
- Sem Firebase CLI no PATH, nao houve teste de rules em emulator.
- O teste local com `node --check` valida sintaxe JS, mas nao prova sessao admin real, App Check, Storage ou Firestore autenticados.
- `cms-media` tem leitura publica de arquivos por regra existente; o dado do catalogo continua admin-only, mas URLs de imagem carregadas em Storage podem ser publicas se alguem tiver a URL.
- O modulo nao resolve ainda duplicidade com dados estaticos, porque migracao/seed ficou fora do bloco.

## 13. Proximo bloco recomendado

**CMS-2C - Seed/diff controlado de empreendimentos**, sem trocar o site publico:

1. gerar script de seed a partir de `js/locais-data.js`, `js/data/*.js` e `js/rotas-data.js`;
2. produzir relatorio de diff e duplicidades;
3. gravar somente em ambiente/controlado apos revisao;
4. manter fallback estatico;
5. so depois planejar CMS-3, que aplica solicitacoes aprovadas ao catalogo.

Alternativa: seguir direto para **CMS-3** apenas se ja houver registros manuais suficientes em `cms_establishments`.
