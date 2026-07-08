# Bloco CMS-5B - adapter publico isolado para cms_establishments

**Data:** 2026-07-08  
**Projeto:** SITE-TURISMO-SMS-mainv2  
**Escopo:** criar infraestrutura isolada/dev para testar leitura publica futura de `cms_establishments`, sem ligar paginas publicas principais ao Firestore.

## 1. Pre-check

- `git status --short --branch --untracked-files=all`: worktree limpo antes de iniciar.
- O Git exibiu apenas aviso de permissao ao acessar `C:\Users\jacob/.config/git/ignore`.
- CMS-5A confirmado como commitado em `924aebb Documenta diagnostico de leitura publica Firestore`, alinhado com `origin/main`.
- Nenhum commit foi feito neste bloco.
- Nenhum `git reset` ou `git restore` foi executado.
- Nenhum deploy, seed, apply, publicacao/despublicacao ou alteracao real no Firestore/Storage foi executado.

## 2. Arquivos inspecionados

- `docs/bloco-cms-5a-diagnostico-leitura-publica-firestore.md`
- `docs/schemas/cms-establishments.schema.md`
- `js/locais-data.js`
- `js/establishment-catalog.js`
- `js/mapa-turistico.js`
- `js/search-index.js`
- `firestore.rules`
- `storage.rules`
- `config.js`
- `sw.js`
- `js/site-meta.js`

Tambem foram consultados exemplos existentes de leitura publica Firestore, especialmente `js/public-banners.js` e o carregamento de `eventos_aprovados` em `js/mapa-turistico.js`.

## 3. Arquivos criados

- `js/cms-public-establishments-adapter.js`
- `js/cms-public-debug.js`
- `cms-public-debug.html`
- `docs/bloco-cms-5b-adapter-publico-isolado.md`

Nenhuma pagina publica principal foi alterada.

## 4. Adapter criado

Arquivo:

```text
js/cms-public-establishments-adapter.js
```

Objeto global exposto:

```js
window.CMSPublicEstablishmentsAdapter
```

Funcoes principais:

- `readPublished(options)` / `load(options)`: tenta ler `cms_establishments` com `where("status", "==", "published")`.
- `normalizeDocument(data, docId)`: normaliza um documento CMS publicado.
- `makeFallback(error)`: retorna fallback controlado.
- `getLastResult()`: retorna o ultimo resultado em memoria.
- `isDebugEnabled()`: verifica `?cmsDebug=1` ou `localStorage.sms-cms-debug=true`.

O adapter:

- nao e importado por `index.html`, `mapa-turistico.html`, `local.html`, `sabores.html`, `onde-ficar.html`, `o-que-fazer.html` ou busca;
- nao altera `window.TURISMO_DATA`;
- nao altera `window.locaisData`;
- nao renderiza conteudo publico por conta propria;
- nao exige login para a pagina continuar funcionando;
- nao lanca erro fatal: qualquer falha vira fallback.

## 5. Modo diagnostico/dev

O adapter so executa automaticamente quando o arquivo for carregado e houver uma flag explicita:

- query string: `?cmsDebug=1`;
- ou `localStorage.setItem("sms-cms-debug", "true")`;
- ou chamada manual via console.

Sem flag, carregar o arquivo apenas registra o objeto global.

Chamada manual no console:

```js
CMSPublicEstablishmentsAdapter.readPublished({ debug: true, force: true })
```

## 6. Pagina debug

Foi criada a pagina:

```text
cms-public-debug.html
```

Ela:

- carrega `config.js`;
- carrega `js/cms-public-establishments-adapter.js`;
- carrega `js/cms-public-debug.js`;
- mostra botao **Testar leitura CMS**;
- mostra fonte, total, erro sanitizado e amostra dos primeiros itens;
- tem `meta robots="noindex,nofollow"`;
- nao foi linkada no menu;
- nao foi adicionada ao sitemap.

Como testar localmente ou em ambiente publicado:

```text
/cms-public-debug.html
```

Opcionalmente:

```text
/cms-public-debug.html?cmsDebug=1
```

Observacao: a pagina e uma ferramenta de diagnostico. Ela nao deve ser tratada como superficie publica editorial.

## 7. Query Firestore

A consulta implementada e:

```js
query(
  collection(db, "cms_establishments"),
  where("status", "==", "published")
)
```

Isso preserva o requisito de leitura futura: somente documentos `published` podem ser retornados. O adapter ainda filtra defensivamente qualquer documento cujo `status` nao seja `published`.

## 8. Fallback

Em qualquer falha, o retorno segue este formato:

```js
{
  items: [],
  count: 0,
  source: "fallback",
  collection: "cms_establishments",
  queriedStatus: "published",
  error: {
    code: "permission-denied",
    message: "Leitura publica de cms_establishments ainda nao autorizada pelas rules."
  },
  generatedAt: "..."
}
```

Falhas tratadas:

- `permission-denied`;
- timeout;
- App Check/recaptcha indisponivel;
- rede/offline/Firestore indisponivel;
- `CONFIG.firebase` ausente;
- collection vazia;
- erro inesperado sanitizado.

Logs aparecem apenas quando o modo debug esta ativo ou quando `debug: true` e passado na chamada.

## 9. Formato normalizado

Cada item normalizado exposto no retorno usa somente campos publicaveis:

```js
{
  id: "marina-barra-iguacu",
  slug: "marina-barra-iguacu",
  name: "Marina Barra do Iguacu",
  nome: "Marina Barra do Iguacu",
  category: {
    id: "gastronomia",
    label: "Gastronomia",
    original: "Gastronomia"
  },
  categoria: "Gastronomia",
  description: "Resumo publico",
  descricao: "Resumo publico",
  address: "Endereco",
  endereco: "Endereco",
  localizacao: "Endereco",
  coordinates: { lat: -25.0, lng: -50.0 },
  coordenadas: { lat: -25.0, lng: -50.0 },
  contact: {
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    instagram: "",
    facebook: ""
  },
  media: {
    mainImage: {
      url: "",
      alt: "",
      caption: "",
      credit: "",
      source: "cms-media"
    },
    gallery: []
  },
  imagem: "",
  galeria: [],
  tags: [],
  status: "published",
  source: "cms_establishments"
}
```

Compatibilidade planejada:

- campos em ingles para o adapter intermediario;
- aliases `nome`, `categoria`, `descricao`, `coordenadas`, `imagem` e `galeria` para aproximar do formato usado pelo mapa atual;
- nenhuma mutacao automatica em `TURISMO_DATA`.

## 10. Campos excluidos

O adapter nao expõe:

- `draft`;
- `archived`;
- itens de galeria com `status` diferente de `active`;
- imagens com `source: "submission"`;
- imagens cujo `path` comece com `submissions/`;
- `createdBy`, `updatedBy`, `publishedBy`, `archivedBy`;
- `review.*`;
- `source.seededAt`, `source.sourceUpdatedAt`;
- `publishing.*`;
- `display.*`;
- campos de auditoria ou operacao interna.

## 11. Rules

`firestore.rules` foi verificado e nao foi alterado.

Estado local atual:

```js
match /cms_establishments/{establishmentId} {
  allow read: if isAdmin();
  allow create: if isValidEstablishmentCreate(establishmentId);
  allow update: if isValidEstablishmentUpdate();
  allow delete: if isAdmin() && isDeletableEstablishmentStatus(resource.data.status);
}
```

Conclusao:

- leitura publica anonima de `cms_establishments` ainda nao existe nas rules locais;
- a pagina debug deve cair em fallback `permission-denied` para usuario publico enquanto as rules nao forem abertas;
- isso e esperado neste bloco;
- nenhuma abertura de rules foi aplicada.

Patch futuro conceitual, nao aplicado:

```js
allow read: if isAdmin() || resource.data.status == 'published';
```

Mesmo com essa rule futura, a query publica precisa continuar usando:

```js
where("status", "==", "published")
```

Firestore Rules nao filtram resultados: a query precisa respeitar a regra.

## 12. Datas publicas e cache

Nao foram alterados:

- `sitemap.xml`;
- `js/site-meta.js`;
- `config.js`;
- `sw.js`.

Motivo:

- este bloco nao muda conteudo publico indexavel;
- a pagina debug tem `noindex,nofollow`;
- o adapter nao foi ligado as paginas principais;
- `sw.js` ja evita cache de Firebase/APIs externas e nao precisou de alteracao.

## 13. Confirmacoes de escopo

Confirmado:

- mapa turistico nao foi ligado ao Firestore para empreendimentos;
- `local.html` nao foi ligado ao Firestore;
- busca nao foi ligada ao adapter;
- `sabores.html`, `onde-ficar.html` e `o-que-fazer.html` nao foram ligados ao Firestore;
- home nao foi ligada ao adapter;
- dados estaticos nao foram removidos;
- rotas publicas nao foram alteradas;
- `sitemap.xml` nao foi alterado;
- `js/site-meta.js` nao foi alterado;
- `config.js` nao foi alterado;
- `sw.js` nao foi alterado;
- `firestore.rules` nao foi alterado;
- `storage.rules` nao foi alterado;
- dados reais do Firestore nao foram alterados;
- documentos nao foram publicados/despublicados;
- nenhuma dependencia foi instalada.

## 14. Leitura Firestore neste bloco

Leitura real em browser autenticado/publicado nao foi executada neste bloco.

Com as rules locais atuais, a expectativa para visitante anonimo e fallback por `permission-denied`. A validacao feita neste bloco e estrutural/local: sintaxe JS, pagina debug isolada, query correta no codigo e audits do projeto.

## 15. Riscos

- Se as rules publicadas estiverem diferentes do arquivo local, o comportamento real pode divergir.
- Se a leitura publica for aberta no futuro sem `where("status", "==", "published")`, a query deve falhar ou expor risco operacional.
- Firestore direto no browser pode gerar custo e latencia; o adapter tem timeout e fallback, mas CMS-5C precisara QA de UX.
- App Check pode falhar em ambiente local/publicado; o adapter deve retornar fallback.
- A pagina debug nao e indexavel, mas ainda existe por URL direta. Ela deve permanecer sem menu e fora do sitemap.
- O formato normalizado e intermediario; a integracao com mapa/local ainda precisa bloco proprio.

## 16. Validacoes planejadas

Executar apos este documento:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node --check js/cms-public-establishments-adapter.js
node --check js/cms-public-debug.js
node --check js/locais-data.js
node --check js/mapa-turistico.js
node --check js/search-index.js
node --check config.js
node --check sw.js
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
git diff --check
```

Nao executar `npm run build`, `npm run lint` ou `npm run test` porque nao ha `package.json` no repositorio.

## 17. Proximo bloco recomendado

**CMS-5C - integrar mapa turistico com Firestore + fallback estatico**, somente depois de decisao explicita sobre rules/publicacao.

Pre-condicoes recomendadas:

1. decidir se abrir rules para leitura publica de `published`;
2. confirmar rules publicadas;
3. testar `/cms-public-debug.html` em ambiente publicado;
4. confirmar se retorna itens ou fallback esperado;
5. comparar snapshot CMS com `window.TURISMO_DATA`;
6. manter fallback estatico como fonte de seguranca no mapa.
