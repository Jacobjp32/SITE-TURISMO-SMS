# CMS-5C - leitura publica segura de published e validacao da pagina debug

## Objetivo

Abrir uma leitura publica minima para `cms_establishments` apenas quando `status == "published"` e validar o fluxo isolado de debug criado no CMS-5B, sem ligar mapa, ficha local, busca, sabores, onde ficar, o que fazer ou home ao Firestore.

## Pre-check

- Worktree verificado antes das alteracoes com `git status --short --branch --untracked-files=all`.
- Estado inicial limpo em `main...origin/main`.
- CMS-5B confirmado como commitado no historico recente: `b590512 Cria adapter publico isolado do CMS`.

## Arquivos inspecionados

- `docs/bloco-cms-5a-diagnostico-leitura-publica-firestore.md`
- `docs/bloco-cms-5b-adapter-publico-isolado.md`
- `docs/schemas/cms-establishments.schema.md`
- `js/cms-public-establishments-adapter.js`
- `js/cms-public-debug.js`
- `cms-public-debug.html`
- `firestore.rules`
- `storage.rules`
- `config.js`
- `sw.js`
- `js/site-meta.js`

## Estado anterior das rules

Antes do CMS-5C, o bloco `match /cms_establishments/{establishmentId}` permitia leitura apenas para admin:

```js
allow read: if isAdmin();
```

Com isso, visitante anonimo deveria cair em fallback no adapter, mesmo quando a pagina debug chamasse a query com `where("status", "==", "published")`.

## Alteracao em Firestore Rules

O bloco `cms_establishments` foi ajustado de forma minima:

```js
allow get: if isAdmin() || resource.data.status == 'published';
allow list: if isAdmin() || resource.data.status == 'published';
allow create: if isValidEstablishmentCreate(establishmentId);
allow update: if isValidEstablishmentUpdate();
allow delete: if isAdmin() && isDeletableEstablishmentStatus(resource.data.status);
```

Efeito planejado:

- admin continua podendo ler todos os documentos;
- visitante anonimo pode ler somente documentos cujo `resource.data.status` seja `published`;
- `draft` e `archived` nao podem ser lidos publicamente;
- escrita publica continua bloqueada;
- empreendedor continua sem permissao para escrever diretamente em `cms_establishments`;
- `storage.rules` nao foi alterado.

Importante: Firestore Rules nao filtram resultados. A query publica precisa ser compativel com a regra, usando `where("status", "==", "published")`. Uma query publica ampla contra a colecao deve falhar quando as rules nao conseguirem provar que todos os documentos retornados sao `published`.

## Adapter publico isolado

O arquivo `js/cms-public-establishments-adapter.js` segue isolado e exposto em `window.CMSPublicEstablishmentsAdapter`.

Confirmacoes do CMS-5C:

- consulta a colecao `cms_establishments`;
- usa `where("status", "==", "published")`;
- descarta defensivamente qualquer documento com `status` diferente de `published`;
- nao inclui `draft` ou `archived`;
- remove da galeria itens com `status` diferente de `active`;
- evita imagens de evidencia/submissao em `media.gallery`;
- retorna fallback controlado em erro, sem quebrar a pagina;
- nao exige login para a pagina sobreviver;
- registra logs apenas quando debug esta ativo.

Formato normalizado principal:

```js
{
  id,
  slug,
  name,
  category,
  description,
  address,
  coordinates,
  contact,
  media: {
    mainImage,
    gallery
  },
  tags,
  status: "published",
  source: "cms_establishments"
}
```

## Estado vazio de published

O adapter foi ajustado para tratar colecao sem documentos publicados como leitura permitida com estado vazio, nao como erro de fallback:

```js
{
  items: [],
  count: 0,
  source: "cms_establishments",
  collection: "cms_establishments",
  queriedStatus: "published",
  state: "empty-published",
  message: "Leitura permitida, mas nao ha empreendimentos published.",
  error: null
}
```

Isso evita confundir um ambiente corretamente autorizado, mas ainda sem conteudo publicado, com falha de permissao ou rede.

## Pagina debug

`cms-public-debug.html` foi mantida como pagina isolada:

- contem `noindex,nofollow`;
- nao foi adicionada ao menu;
- nao foi adicionada ao sitemap;
- carrega o adapter isolado;
- possui botao manual para testar a leitura;
- exibe origem, total, status, erro sanitizado e amostra dos primeiros itens.

O script `js/cms-public-debug.js` passou a mostrar o estado `Sem published` quando o adapter retornar `state: "empty-published"`.

## Teste real de leitura Firestore

Nao houve alteracao em dados reais do Firestore e nenhum documento foi publicado/despublicado neste bloco.

A leitura real anonima depende da publicacao das novas `firestore.rules` no Firebase. Enquanto as rules locais nao forem publicadas, o ambiente remoto pode continuar retornando `permission-denied`, e o adapter deve cair em fallback controlado.

Nao foi verificado neste bloco se existem documentos `published` no Firestore remoto. O contexto indica que os 67 documentos podem estar majoritariamente ou totalmente em `draft`. Se nao houver `published`, o resultado esperado apos publicar as rules e executar a pagina debug e uma leitura permitida com `count: 0` e `state: "empty-published"`.

## Necessidade de indice

A query inicial usa somente igualdade em `status`, entao nao deve exigir indice composto.

Se o teste real retornar erro de indice, registrar o link/erro gerado pelo Firebase e criar indice apenas em bloco autorizado. Nenhum indice foi criado neste bloco.

## Datas publicas e arquivos nao alterados

Foram verificados e nao alterados:

- `sitemap.xml`
- `js/site-meta.js`
- `config.js`
- `sw.js`

Este bloco altera rules e infraestrutura debug isolada, mas nao altera conteudo publico indexavel nem canonical/SEO das paginas principais.

## Confirmacao de nao integracao publica

Nao houve ligacao do adapter com:

- mapa turistico;
- `local.html`;
- busca interna;
- sabores;
- onde ficar;
- o que fazer;
- home;
- rotas publicas principais.

Os dados estaticos atuais permanecem preservados e continuam sendo a fonte das paginas publicas principais.

## Como testar apos publicar as rules

1. Publicar `firestore.rules` no Firebase.
2. Abrir `/cms-public-debug.html` em janela anonima.
3. Clicar em `Testar leitura CMS`.
4. Confirmar:
   - sem `permission-denied`;
   - se nao houver `published`, estado vazio claro;
   - se houver `published`, retorno somente de documentos publicados;
   - `draft` e `archived` nao aparecem;
   - login nao e obrigatorio;
   - mapa, ficha local, busca e home seguem estaticos.

## Riscos e pontos de atencao

- As rules locais precisam ser publicadas no Firebase para que a leitura anonima funcione no ambiente real.
- Firestore Rules nao sao filtro de dados; remover o `where("status", "==", "published")` do adapter deve causar falha de permissao.
- Uma query futura com ordenacao/filtros adicionais pode exigir indice composto.
- O uso direto de Firestore no browser pode gerar custo por leitura; a integracao publica principal ainda deve preservar fallback estatico.
- O debug nao deve entrar em sitemap, menu ou campanhas publicas.
- Imagens em `media.mainImage` e `media.gallery` dependem de URLs publicamente serviveis; este bloco nao abre regras de Storage nem valida inventario remoto de midias.

## Validacoes do bloco

Comandos previstos/executados:

- `node --check js/cms-public-establishments-adapter.js`
- `node --check js/cms-public-debug.js`
- `node --check js/locais-data.js`
- `node --check js/mapa-turistico.js`
- `node --check js/search-index.js`
- `node --check config.js`
- `node --check sw.js`
- `node scripts/audit-links.mjs`
- `node scripts/audit-assets.mjs`
- `node scripts/audit-project.mjs`
- `git diff --check`

`npm build/lint/test` nao deve ser executado se o projeto continuar sem `package.json`.

## Proximo bloco recomendado

CMS-5D: integrar `local.html` ou mapa turistico com Firestore + fallback estatico somente apos publicar e validar as rules do CMS-5C em ambiente real. A recomendacao operacional e validar primeiro a pagina debug anonima com pelo menos um documento `published` controlado, sem publicacao em massa.
