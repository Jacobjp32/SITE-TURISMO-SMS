# Bloco S10 — Saneamento de dados de locais turísticos

Data: 2026-07-02
Escopo: pequeno saneamento de dados turísticos. Corrigir a divergência de id
`casa-da-memoria` × `casa-memoria-padre-bauer` sem alterar arquitetura de URL,
sem slugs definitivos, sem tocar em admin/rules/sitemap/hero/mapa 3D.

## Estado inicial

- Worktree **limpo** (`git status` sem alterações) antes de começar.

## Inconsistência encontrada

A "Casa da Memória Padre Bauer" existia com **dois ids diferentes** em bases distintas:

| Base | Papel | Id / slug | Consequência |
| --- | --- | --- | --- |
| `js/data/pontos-turisticos.js` | Fonte **primária** (mapa, busca) — ver `TURISMO_DATA_META.primarySources` | `casa-da-memoria`, `url: "/local?id=casa-da-memoria"` | Todos os links públicos apontavam para `casa-da-memoria` |
| `js/locais-data.js` | Fonte **legada** que alimenta a ficha `local.html` | chave/`id` = `casa-memoria-padre-bauer` | `local.html` só resolvia `casa-memoria-padre-bauer` |

Efeito: `local.html?id=casa-da-memoria` (o link que o mapa e a busca geram) caía no
estado **"Local não encontrado"**, pois `local.html` faz lookup direto
`window.locaisData[id]` e a chave `casa-da-memoria` não existia.

### Onde a divergência aparecia

- `js/data/pontos-turisticos.js:53,58` — `id` e `url` com `casa-da-memoria`.
- `js/locais-data.js:146-147` — chave e `id` com `casa-memoria-padre-bauer`.
- `js/search-index.js:52` — o índice de busca usa `item.url` de `TURISMO_PONTOS`,
  ou seja, gerava resultado apontando para `/local?id=casa-da-memoria` (quebrado).
- `js/data/turismo-data-adapter.js` — a ficha legada de `locais-data` é deduplicada
  por **nome idêntico** contra o item primário de `pontos-turisticos.js`
  (`findDuplicate` → `getComparableName`), então o item que sobrevive no mapa é o
  primário (`casa-da-memoria`), reforçando esse id como o público de fato.
- Documentado em `docs/bloco-s8-local-detalhe.md:146` como pendência conhecida.

Nenhuma referência a qualquer dos ids no `sitemap.xml` ou em arquivos `.html`
(apenas caminhos de imagem `images/empreendimentos/casa-da-memoria/`).

## Fonte canônica escolhida

**`casa-da-memoria`** passou a ser o id canônico, porque:

1. É o id da fonte **primária** (`pontos-turisticos.js`), classificada como primária em
   `TURISMO_DATA_META`; `locais-data.js` é fonte legada.
2. É o id que **todos os links públicos** (mapa, busca) já emitem.
3. Coincide com a pasta de imagens `images/empreendimentos/casa-da-memoria/`.
4. Nada estava publicado sob `casa-memoria-padre-bauer` (ausente de sitemap e HTML),
   então não há prejuízo de SEO em alinhar para `casa-da-memoria`.

## Correção feita

Nenhum dado turístico foi inventado ou alterado (endereço, telefone, horário,
descrição, coordenada permanecem exatamente como estavam).

1. **`js/locais-data.js`**
   - Renomeada a chave e o campo `id` da ficha: `casa-memoria-padre-bauer` → `casa-da-memoria`.
   - Adicionado mapa `locaisAliases` (exportado como `window.locaisAliases`) com o
     alias de compatibilidade `'casa-memoria-padre-bauer' → 'casa-da-memoria'`.
   - O alias fica **fora** de `locaisData` de propósito: não polui
     `Object.keys(locaisData)`, que é iterado pela seção "Relacionados" de `local.html`
     e por `turismo-data-adapter.js` (evita ficha duplicada/auto-referência).

2. **`local.html`**
   - Antes do lookup, resolve o parâmetro `?id=` via `window.locaisAliases`:
     `rawId` → `id` canônico. O `id` canônico é usado tanto no lookup
     `window.locaisData[id]` quanto na URL canônica/OG (`/local?id=` + id) e no filtro
     de relacionados. Assim um acesso pelo slug legado é servido e **canonicaliza**
     para o id definitivo (redirect interno de SEO, sem mudar a arquitetura de URL).

3. **`scripts/audit-tourism-data.mjs`**
   - Nova verificação cruzada entre bases: lê os links `/local?id=<slug>` de
     `js/data/pontos-turisticos.js` e confirma que cada um resolve para uma chave de
     `locaisData` ou para um alias válido. Também sinaliza aliases órfãos.
   - Seção "Consistência entre bases" adicionada ao relatório (JSON + Markdown) e aviso
     no console. Hoje: 7 links verificados, 1 alias, **0 divergências**.

## Compatibilidade preservada

- `local.html?id=casa-da-memoria` → **funciona** (id canônico; é o link do mapa/busca).
- `local.html?id=casa-memoria-padre-bauer` → **funciona** via alias e canonicaliza para
  `casa-da-memoria` (compat com o id do Bloco S8).
- Card/detalhe no mapa: o "Ver detalhes" do mapa é modal interno (Bloco S8), não afetado;
  os links `/local?id=` gerados pela busca agora resolvem.
- Filtros do mapa e fluxo `/local?id=` inalterados além da resolução de alias.

## Houve alias?

Sim — `locaisAliases` em `js/locais-data.js`, documentado acima, apenas para
compatibilidade retroativa do slug do S8. Não é slug "bonito" nem mudança de URL.

## Houve alteração em auditoria?

Sim — `scripts/audit-tourism-data.mjs` ganhou a verificação cruzada de ids entre
`locais-data.js` e `pontos-turisticos.js` (com aliases). Relatórios regenerados em
`docs/auditoria-output/tourism-data-report.{json,md}` e `docs/auditoria-dados-turisticos.md`.

## Validações executadas

```
node --check js/locais-data.js            → OK
node --check js/mapa-turistico.js         → OK
node --check js/site-meta.js              → OK
node --check js/nav-shared.js             → OK
node --check translations.js             → OK
node --check scripts/audit-tourism-data.mjs → OK

node scripts/audit-tourism-data.mjs  → 15 locais; Consistência entre bases: OK (0 divergências)
node scripts/audit-links.mjs         → 662 links, 0 broken, 1 falso positivo conhecido, 20 legado/redundante
node scripts/audit-assets.mjs        → 226 mídias, 0 duplicatas, 0 referências ausentes
node scripts/audit-project.mjs       → 416 arquivos, 36 html, 23 css, 46 js
```

(As 2 issues 🟡 média do audit-tourism-data são pendências humanas pré-existentes de
"confirmar endereço/horário", fora do escopo deste bloco.)

## Validação manual recomendada

1. Abrir `local.html?id=casa-da-memoria` → ficha "Casa da Memória Padre Bauer" abre.
2. Abrir `local.html?id=casa-memoria-padre-bauer` → mesma ficha abre; canonical aponta
   para `/local?id=casa-da-memoria`.
3. Abrir `mapa-turistico.html`, localizar Casa da Memória, abrir card/detalhes → ficha correta.
4. Buscar "casa da memória" na busca do site → resultado leva à ficha (não mais ao erro).
5. Confirmar que nenhum dado turístico foi inventado.
6. Confirmar que hero/vídeo, mapa 3D, admin e rules não foram tocados.

## Riscos

- **Baixo.** Mudança concentrada em id + alias + auditoria; sem alteração de conteúdo
  factual, URL pública, rules, admin ou sitemap.
- Se algum link externo tiver sido publicado como `?id=casa-memoria-padre-bauer`
  (não encontrado no repositório), continua funcionando via alias.

## Rollback

Reverter os 3 arquivos para o estado anterior:

```
git checkout -- js/locais-data.js local.html scripts/audit-tourism-data.mjs
```

E, se desejado, regenerar os relatórios: `node scripts/audit-tourism-data.mjs`.
(Nada foi commitado.)

## Próxima etapa recomendada

- Rodar a validação manual acima em navegador.
- Bloco futuro (opcional, fora do S10): unificar de vez as fichas em uma única fonte
  ou avançar para slugs bonitos `/local/<slug>` com redirect `?id=` → slug, conforme
  esboçado em `docs/bloco-s8-local-detalhe.md` (§ "próxima etapa"). Só então o alias
  `locaisAliases` poderia ser aposentado.
```
