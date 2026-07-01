# Bloco S4B - Menu "Sobre" e atalhos internos de Sabores

Data: 2026-07-01

## Escopo

Continuacao do Bloco S4. Revisar o menu "Sobre" (que mantinha itens redundantes
apontando para `/#sobre`) e transformar os antigos atalhos gastronomicos em
cards/atalhos internos dentro da propria pagina `/sabores`, sem devolve-los ao
menu principal.

Nao houve alteracao de hero/video, mapa 3D, painel admin, Firestore Rules,
Storage Rules, `sitemap.xml`, `sw.js`, `public-banners.js` nem URLs limpas.

## Worktree inicial

`git status --short` estava limpo no inicio do bloco (apenas na branch `main`).

> Nota de processo: durante as validacoes foi usado `git stash` para medir a
> baseline dos audits. O `git stash pop` conflitou com os relatorios
> auto-gerados em `docs/auditoria-output/` e foi recuperado descartando os
> relatorios gerados e refazendo o `pop`. Todas as edicoes do bloco foram
> preservadas. Licao registrada: nao usar `git stash` para baseline quando
> scripts reescrevem artefatos versionados.

## 1. Menu "Sobre" - estrutura anterior

Presente em dois lugares: `index.html` (nav estatico da home) e
`js/nav-shared.js` (nav injetado nas paginas secundarias).

| Item | Destino | Observacao |
| --- | --- | --- |
| Sao Mateus do Sul | `/#sobre` | Secao "Sobre" da home |
| Historia | `/#sobre` | **Redundante** (mesmo destino) |
| Capital Polonesa do Parana | `/mapa-turistico.html?categoria=Cultura` | Destino real distinto |
| Terra da Erva-mate | `/mapa-turistico.html?grupo=roteiros` | Duplicava `Explore > Rotas` |
| Xisto | `/#sobre` | **Redundante** (mesmo destino) |
| Institucional | `/transparencia` | Destino real distinto |

A secao `#sobre` da home (`index.html`, `<div id="sobre">`) e um bloco unico de
"Sobre a cidade" que ja cobre Sao Mateus, historia, erva-mate e xisto no mesmo
texto. Nao existem sub-ancoras `#historia` nem `#xisto`. Portanto os 3 itens que
apontavam para `/#sobre` eram genuinamente redundantes.

## 2. Menu "Sobre" - decisao e estrutura nova

**Decisao: manter dropdown reduzido (nao virou link direto).**
Motivo: nem todos os itens apontam para o mesmo destino - ha 3 destinos reais
distintos (`#sobre`, `?categoria=Cultura`, `/transparencia`). A regra do bloco
manda transformar em link direto apenas quando todos os itens tem o mesmo
destino. Como havia destinos distintos, colapsamos apenas a redundancia.

| Item | Destino |
| --- | --- |
| Sobre a Cidade | `/#sobre` (consolida Sao Mateus + Historia + Xisto) |
| Capital Polonesa do Parana | `/mapa-turistico.html?categoria=Cultura` |
| Institucional | `/transparencia` |

Removidos do menu visual:
- `Historia` e `Xisto` -> fundidos em "Sobre a Cidade" (mesmo destino `#sobre`).
- `Terra da Erva-mate` -> saiu do menu "Sobre" por duplicar `Explore > Rotas`
  (`?grupo=roteiros`); o tema erva-mate agora tem lugar proprio em
  `/sabores#erva-mate`.

Nenhuma URL de destino foi apagada da logica do site:
- `/#sobre`, `/mapa-turistico.html?categoria=Cultura`,
  `/mapa-turistico.html?grupo=roteiros` e `/transparencia` continuam validos por
  acesso direto.

## 3. Pagina `sabores.html` - atalhos internos

### Ancoras existentes antes do bloco

| Tema | Ancora | Estado |
| --- | --- | --- |
| Gastronomia polonesa | `#polonesa` | Ja existia (secao filtavel) |
| Feiras / produtos locais | `#feiras` | Ja existia (secao filtavel) |
| Restaurantes | `#restaurantes` | Ja existia (secao filtavel) |
| Erva-mate | (nenhuma) | Conteudo espalhado: card Chimarrao em `#polonesa` + item "Erva-mate" na secao `#produtor` |

### O que foi adicionado

- **Grid de atalhos "Explore os sabores"** no topo do `<main>` (antes do
  `filter-nav`), com 4 cards navegaveis por teclado:
  - 🥟 Culinaria Polonesa -> `#polonesa`
  - 🧉 Erva-mate -> `#erva-mate`
  - 🛒 Feiras e Produtores -> `#feiras`
  - 🍴 Restaurantes -> `#restaurantes`
- **Ancora `#erva-mate`**: novo elemento `<div id="erva-mate" class="sabores-anchor">`
  posicionado imediatamente antes da secao `#produtor` (que exibe as
  "Ervateiras IG Sao Matheus"), destino coerente para o tema erva-mate.
- O `filter-nav` original (Tudo / Polonesa / Feiras / Restaurantes) foi
  **preservado intacto** - continua sendo o filtro funcional que mostra/oculta
  secoes. Os cards sao a entrada visual mais rica e cobrem tambem a erva-mate,
  que o filtro nao contempla.

### Comportamento dos hashes

O script inline de filtro foi ampliado com uma funcao `handleHash(h, scroll)`:
- `#polonesa`, `#feiras`, `#restaurantes`: comportamento antigo preservado
  (ativa o filtro correspondente e rola ate a secao).
- `#erva-mate`: limpa o filtro (mantem a pagina inteira visivel) e rola
  suavemente ate a ancora `#erva-mate`.
- Qualquer outro hash: limpa o filtro (mostra tudo), como antes.

CSS `scroll-margin-top` foi adicionado a `#polonesa`, `#feiras`,
`#restaurantes` e `#erva-mate` para que o salto por ancora nao fique escondido
sob o nav fixo (130px desktop / 96px mobile).

## 4. Links / hash preservados

- `/sabores#polonesa` - OK
- `/sabores#feiras` - OK
- `/sabores#restaurantes` - OK
- `/sabores#erva-mate` - **novo**, aponta para os produtores de erva-mate
- `/mapa-turistico.html?categoria=Cultura` - OK (menu "Sobre")
- `/mapa-turistico.html?grupo=roteiros` - OK (menu "Explore > Rotas")
- `/#sobre` e `/transparencia` - OK

Menu "Explore" e link direto "Sabores locais" do S4 permanecem inalterados.

## 5. Acessibilidade

- Dropdown "Sobre" do `nav-shared.js` recebeu `aria-controls="navSobreMenu"` e
  `aria-label="Abrir menu Sobre"`, alinhando ao padrao ja usado no botao
  "Explore". A logica existente de `aria-expanded`, `Escape`, clique externo,
  overlay e menu mobile continua valendo (nenhuma mudanca de JS de nav).
- Os cards de atalho sao `<a href="#...">` reais: navegaveis por teclado (Tab),
  com foco visivel via `:focus-visible` (contorno dourado). O grid usa `<nav>`
  com `aria-labelledby` apontando para o titulo da secao.
- Icones dos cards marcados como `aria-hidden="true"`.

## 6. i18n

Chaves novas adicionadas em PT-BR, EN, ES e PL (`translations.js`):

- `nav-sobre-cidade` (PT "Sobre a Cidade", EN "About the City",
  ES "Sobre la Ciudad", PL "Poznaj Miasto").
- Atalhos de sabores: `sab-atalhos-titulo`, `sab-atalho-polonesa`(+`-desc`),
  `sab-atalho-ervamate`(+`-desc`), `sab-atalho-feiras`(+`-desc`),
  `sab-atalho-restaurantes`(+`-desc`).

Chaves antigas do menu "Sobre" (`nav-sao-mateus`, `nav-historia`,
`nav-terra-erva-mate`, `nav-xisto`) foram **mantidas** em todos os idiomas para
compatibilidade, mesmo sem uso atual no menu (mesmo criterio do S4).

Nao foram resolvidas URLs por idioma neste bloco.

## 7. Arquivos alterados

- `index.html` - menu "Sobre" reduzido (6 -> 3 itens).
- `js/nav-shared.js` - menu "Sobre" reduzido + `aria-controls`/`aria-label`.
- `sabores.html` - grid de atalhos, ancora `#erva-mate`, `handleHash` no filtro.
- `css/sabores.css` - estilos `.sabores-atalhos*`, `.sabores-anchor`,
  `scroll-margin-top` das ancoras.
- `translations.js` - chaves novas em PT/EN/ES/PL.
- `docs/bloco-s4b-menu-sobre-atalhos-sabores.md` - este registro.

(Os relatorios em `docs/auditoria-output/*` sao artefatos regenerados pelos
scripts de audit.)

## 8. Sitemap

Nao houve alteracao de `sitemap.xml`. Nenhuma pagina foi criada ou apagada;
`#erva-mate` e uma ancora interna de `/sabores`, que ja consta no sitemap.

## 9. Validacoes executadas

- `node --check js/nav-shared.js` - OK
- `node --check js/site-meta.js` - OK
- `node --check translations.js` - OK
- Scripts inline de `sabores.html` extraidos e validados com `node --check` - OK (3 blocos)
- `node scripts/audit-links.mjs` - 663 links, 1 quebrado, 20 legado/redundante
- `node scripts/audit-assets.mjs` - 226 midias, 0 duplicados, 0 refs faltando
- `node scripts/audit-project.mjs` - 408 arquivos, 36 html, 23 css, 46 js

Baseline (antes do bloco) media exatamente os mesmos numeros: **sem regressao**.
O unico link quebrado (`js/admin/modules/banners.js -> /banners/`) e
pre-existente, do painel admin, sem relacao com este bloco.

## 10. Validacao visual / manual recomendada

1. Home desktop: abrir menu "Sobre" -> confirmar 3 itens sem redundancia.
2. Menu mobile: "Sobre" abre/fecha e navega corretamente.
3. `/sabores`: grid "Explore os sabores" aparece no topo.
4. Clicar cada card e testar `#polonesa`, `#feiras`, `#restaurantes`,
   `#erva-mate` (inclusive por URL direta e recarregando).
5. Confirmar que `Explore` e `Sabores locais` do S4 seguem iguais.
6. Confirmar hero/video inalterada e mapa 3D nao reintroduzido.

## 11. Riscos

- `#erva-mate` aponta para a secao de produtores (`#produtor`), nao para uma
  secao editorial dedicada a erva-mate; e coerente (Ervateiras IG) mas indireto.
- Cards + `filter-nav` ficam proximos no topo; papeis diferentes (navegacao vs
  filtro), porem visualmente pode parecer duas barras de navegacao.
- Usuarios que usavam "Terra da Erva-mate" no menu "Sobre" nao o veem mais ali;
  a URL `?grupo=roteiros` segue ativa em `Explore > Rotas` e o tema tem lugar
  em `/sabores#erva-mate`.
- Validacao final depende de teste em navegador (especialmente mobile).

## 12. Rollback

Reverter apenas: `index.html`, `js/nav-shared.js`, `sabores.html`,
`css/sabores.css`, `translations.js` e remover este documento. Nenhuma migracao
de dados, rules, sitemap, `sw.js` ou dependencias envolvida.

## 13. Proxima etapa recomendada

- Avaliar se `#erva-mate` merece uma secao editorial propria em `/sabores`
  (historia da IG, chimarrao, chimarrodromo) em vez de reaproveitar `#produtor`.
- Considerar traduzir os botoes do `filter-nav` (hoje fixos em PT) com
  `data-lang-key`, reaproveitando as chaves `sab-atalho-*` recem-criadas.
- Revisar os 20 links legados/redundantes e os 21 redundantes com `.html`
  apontados pelo audit, em um bloco proprio de limpeza de links.
