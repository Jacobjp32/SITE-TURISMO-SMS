# Bloco S4C - i18n e acessibilidade dos filtros de Sabores

Data: 2026-07-01

## Escopo

Fechar a pagina `/sabores` do ponto de vista de i18n e acessibilidade dos
**botoes/filtros internos** (`filter-nav`), mantendo a navegacao simplificada dos
blocos [S4](bloco-s4-menus-explore-sabores.md) e
[S4B](bloco-s4b-menu-sobre-atalhos-sabores.md).

Nao houve alteracao de hero/video, mapa 3D, painel admin, Firestore/Storage
Rules, `sitemap.xml`, URLs limpas, `public-banners.js` nem do menu principal.

## Worktree inicial

`git status --short` estava **limpo**. O Bloco S4B havia sido commitado pelo
usuario em `fa25dd4 Ajusta menu sobre e atalhos de sabores`.

## 1. Textos fixos encontrados (auditoria)

Na pagina `sabores.html`, os botoes do `filter-nav` estavam **fixos em PT-BR**,
sem `data-lang-key` e sem estado acessivel:

| Elemento | Texto fixo | Problema |
| --- | --- | --- |
| `<nav class="filter-nav">` | `aria-label="Filtrar seção"` | aria-label so em PT |
| Botao `data-filter=""` | `Tudo` | sem `data-lang-key`, sem `aria-pressed` |
| Botao `data-filter="polonesa"` | `🥟 Culinária Polonesa` | idem |
| Botao `data-filter="feiras"` | `🛒 Feiras e Produtores` | idem |
| Botao `data-filter="restaurantes"` | `🍴 Restaurantes` | idem |

Os cards/atalhos internos adicionados no S4B (`sab-atalho-*`) **ja estavam
traduzidos** em PT/EN/ES/PL - nenhum texto fixo remanescente neles.

Os hashes `#polonesa`, `#erva-mate`, `#feiras`, `#restaurantes` continuavam
funcionando (logica `handleHash` do S4B intacta).

## 2. i18n aplicado

### Chaves criadas em `translations.js` (PT-BR, EN, ES, PL)

| Chave | PT | EN | ES | PL |
| --- | --- | --- | --- | --- |
| `sab-filtro-aria` | Filtrar seção | Filter section | Filtrar sección | Filtruj sekcję |
| `sab-filtro-tudo` | Tudo | All | Todo | Wszystko |
| `sab-filtro-polonesa` | 🥟 Culinária Polonesa | 🥟 Polish Cuisine | 🥟 Cocina Polaca | 🥟 Kuchnia Polska |
| `sab-filtro-feiras` | 🛒 Feiras e Produtores | 🛒 Fairs & Producers | 🛒 Ferias y Productores | 🛒 Targi i Producenci |
| `sab-filtro-restaurantes` | 🍴 Restaurantes | 🍴 Restaurants | 🍴 Restaurantes | 🍴 Restauracje |

Total: 5 chaves x 4 idiomas = 20 entradas. Os textos (sem emoji) sao
consistentes com as chaves `sab-atalho-*` do S4B.

### Mecanismo de traducao

- Botoes receberam `data-lang-key="sab-filtro-*"` - aplicados via
  `applyTranslations()` (path 1, `innerHTML`). O emoji ficou dentro do valor
  traduzido, seguindo a convencao ja usada na pagina (`sab-pratos-h` etc.).
- O `<nav class="filter-nav">` recebeu `data-lang-key-aria-label="sab-filtro-aria"`.
- **Novo handler aditivo em `translations.js`**: bloco `4. data-lang-key-aria-label`
  dentro de `applyTranslations()`, que aplica a traducao ao atributo `aria-label`
  (nao existia handler para aria-label; os handlers 1-3 cobriam innerHTML,
  placeholder e title). Mudanca puramente aditiva, reutilizavel por todo o site.

## 3. Acessibilidade

- Botoes de filtro agora expoem `aria-pressed` (`true` no ativo, `false` nos
  demais). O estado inicial esta no HTML (`Tudo` = `true`) e e sincronizado em
  `activateFilter()` junto com a classe `fnav-btn--active`.
- Adicionado `type="button"` aos botoes de filtro (evita submit acidental e
  deixa o papel explicito).
- Foco visivel: ja garantido globalmente por `css/shared.css`
  (`button:focus-visible { outline: 2px solid var(--gold-polish); }`) - nenhuma
  mudanca de CSS necessaria.
- aria-label do grupo de filtros agora traduz junto com o idioma.
- Botoes **continuam sendo `<button>`** (nao viraram links), preservando o
  comportamento de filtro (mostrar/ocultar secoes) sem quebrar a navegacao.

## 4. Comportamento dos filtros e hashes preservados

- `activateFilter(filterId, scroll)` inalterado em logica de exibicao; apenas
  passou a atualizar `aria-pressed`.
- `handleHash()` do S4B intacto (`sections = ['polonesa','feiras','restaurantes']`
  + caso especial `erva-mate`).
- Hashes preservados e testaveis por URL direta:
  - `/sabores#polonesa`
  - `/sabores#erva-mate`
  - `/sabores#feiras`
  - `/sabores#restaurantes`
- Trocar de idioma reescreve o `innerHTML` dos botoes mas **nao** afeta a classe
  `fnav-btn--active` nem `aria-pressed` (sao atributos/classe do proprio
  `<button>`, nao filhos), entao o estado do filtro sobrevive a troca de idioma.

## 5. Arquivos alterados

- `sabores.html` - botoes do `filter-nav` com `data-lang-key`, `aria-pressed`,
  `type="button"`, `data-lang-key-aria-label`; `activateFilter()` sincroniza
  `aria-pressed`.
- `translations.js` - 20 entradas `sab-filtro-*` (PT/EN/ES/PL) + handler
  `data-lang-key-aria-label` em `applyTranslations()`.
- `docs/bloco-s4c-i18n-filtros-sabores.md` - este registro.

(Relatorios em `docs/auditoria-output/*` sao artefatos regenerados pelos audits.)

## 6. Validacoes executadas

- `node --check translations.js` - OK
- `node --check js/nav-shared.js` - OK
- `node --check js/site-meta.js` - OK
- Scripts inline de `sabores.html` extraidos e validados com `node --check` - OK (3 blocos)
- `node scripts/audit-links.mjs` - 663 links, 1 quebrado, 20 legado/redundante
- `node scripts/audit-assets.mjs` - 226 midias, 0 duplicados, 0 refs faltando
- `node scripts/audit-project.mjs` - 409 arquivos, 36 html, 23 css, 46 js

Sem regressao. O unico link quebrado (`js/admin/modules/banners.js -> /banners/`)
e pre-existente, do painel admin, sem relacao com este bloco.

## 7. Validacao visual / manual recomendada

1. Abrir `/sabores` em PT-BR.
2. Trocar idioma para EN, ES e PL pelo seletor do header.
3. Confirmar que os 4 botoes de filtro e o titulo "Explore os sabores" + cards
   traduzem.
4. Clicar cada filtro (Tudo/Polonesa/Feiras/Restaurantes) e confirmar
   mostrar/ocultar de secoes + rolagem.
5. Testar `#polonesa`, `#erva-mate`, `#feiras`, `#restaurantes` por URL direta.
6. Com leitor de tela / DevTools, confirmar `aria-pressed` alternando e
   `aria-label` traduzido no grupo de filtros.
7. Confirmar menu principal (Explore / Sabores locais / Sobre) inalterado.
8. Confirmar hero/video inalterada e mapa 3D nao reintroduzido.

## 8. Riscos

- O emoji faz parte do valor traduzido do botao; se algum idioma precisar de
  emoji diferente, editar a chave correspondente.
- A traducao do `aria-label` depende de `applyTranslations()` (translations.js),
  carregado em `sabores.html`; se a pagina fosse servida sem esse script, o
  aria-label ficaria no PT do HTML (fallback seguro).
- Textos ainda fixos **fora do escopo** deste bloco: rodape ("Voltar ao Portal",
  "Ver Eventos") e alguns valores de conteudo dos cards de pratos/feiras
  ("Onde provar: ...") permanecem em PT - candidatos a um bloco futuro.

## 9. Rollback

Reverter apenas `sabores.html` e as adicoes em `translations.js`
(chaves `sab-filtro-*` + handler `data-lang-key-aria-label`) e remover este
documento. Nenhuma migracao de dados, rules, sitemap ou dependencia envolvida.

## 10. Proxima etapa recomendada

- Internacionalizar o rodape de `sabores.html` e demais textos de conteudo ainda
  fixos (ex.: linhas "Onde provar: ...").
- Avaliar aplicar o mesmo padrao `data-lang-key-aria-label` a aria-labels ainda
  em PT no `nav-shared.js` (ex.: "Abrir menu Explore", "Buscar no turismo").
- Revisar os 20 links legados/redundantes apontados pelo audit em um bloco
  proprio de limpeza de links.
