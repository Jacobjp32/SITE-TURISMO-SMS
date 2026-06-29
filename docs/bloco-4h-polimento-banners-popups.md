# Bloco 4H — Polimento dos banners / pop-ups + integração com notícias

> **Pré-requisitos:** Blocos 4B (rules publicadas), 4C (CRUD), 4D (upload), 4E
> (publicação), 4F (banners públicos) e 4G (pop-ups públicos) já implementados.
> Worktree estava **limpo** no início. **Nada foi commitado** nesta rodada. **Nenhuma
> escrita** no Firestore/Storage e **nenhuma alteração de rules** (Firestore ou Storage).
>
> **Escopo:** polimento e integração controlada — **não** há nova arquitetura, métricas,
> escrita pública, dashboard ou mudança de auth/roles/claims.

---

## 1. O que foi feito (resumo)

1. **Integração de `noticias.html`** ao sistema público de banners/pop-ups (slot + script).
2. **Mapeamento de páginas revisado**: `targetMatches` agora aceita **nome de arquivo**
   (`noticias.html`) **e** **nome amigável** (`noticias`), mantendo retrocompatibilidade.
3. **UX discreta**: proteção contra texto longo (quebra de palavra), conforto do pop-up no
   mobile, slot continua oculto sem banners (sem "salto" de layout).
4. **Cache**: cache-bust de `…4g-20260629` → `…4h-20260629` em todas as páginas e no CSS.
   `sw.js` **não** precisou de mudança (query string já basta como chave de cache).
5. **Admin**: labels mais claros (banner = faixa pública; pop-up = janela/modal; explicação
   de cada frequência) e correção de texto auxiliar **desatualizado** (dizia que publicar
   "chega em etapa futura" — publicar existe desde o 4E).
6. **Smoke test** ampliado para cobrir notícias (banner, pop-up, targetPages, nome amigável)
   e regressão das demais páginas.

---

## 2. Arquivos

### Criados

| Arquivo | Conteúdo |
|---|---|
| `docs/bloco-4h-polimento-banners-popups.md` | **Novo.** Este documento. |

### Alterados

| Arquivo | Mudança |
|---|---|
| `noticias.html` | **Slot** `<div id="public-banners-slot" hidden>` após o hero + `<script src="js/public-banners.js?v=public-banners-4h-20260629" defer>` antes de `js/cookies.js`. |
| `index.html`, `eventos.html`, `mapa-turistico.html`, `sabores.html` | Apenas cache-bust do `<script>`: `…4g-20260629` → `…4h-20260629`. |
| `js/public-banners.js` | Novo helper `targetMatches` (nome de arquivo **ou** amigável); cache-bust do CSS para `…4h-20260629`; expõe `_targetMatches`. |
| `css/public-banners.css` | `overflow-wrap`/`word-break` em títulos, descrições e CTAs (banner + pop-up); pop-up mobile mais confortável (padding do corpo, `max-height`, alvo de toque do ×). |
| `js/admin/modules/banners.js` | Labels (tipo, frequência) e textos auxiliares mais claros; correção de texto desatualizado sobre publicação. |
| `scripts/smoke-public-banners.mjs` | Bloco 4H: notícias como página suportada, targetPages compatível, nome amigável e regressão das demais páginas. |

> **Firestore Rules e Storage Rules NÃO foram alteradas.**

---

## 3. Como `noticias.html` foi integrada

- O slot ficou **entre o `<section class="hero">` e o `<main class="main-content">`**.
  Foi colocado **fora** do `#postsGrid`, que é **reescrito** pelo script de CMS de notícias
  (`grid.innerHTML = …`). Assim a integração **não interfere** no fluxo de notícias/CMS.
- O `<script src="js/public-banners.js?v=…">` foi adicionado no fim do `<body>`,
  reaproveitando `js/security-utils.js` (SMSecurity) e `config.js` já presentes na página.
- A página já carregava o **mesmo** SDK Firebase via `js/cms.js` (lê a collection
  `noticias`), então a **CSP** existente já permite o `import()` do Firebase, a leitura do
  Firestore e o App Check best-effort — nada novo precisou ser liberado.
- Como `loadBanners()` exige `#public-banners-slot`, banners **e** pop-ups passam a poder
  aparecer em notícias quando `placement`/`targetPages` apontarem para a página.

---

## 4. Mapeamento final de páginas

`FILE_TO_PLACEMENT` (em `js/public-banners.js`) converte o arquivo da página na chave de
`placement`:

| Arquivo (página) | Chave de placement | Slot integrado? |
|---|---|---|
| `index.html` (ou raiz `/`) | `home` | ✅ |
| `eventos.html` | `eventos` | ✅ |
| `mapa-turistico.html` | `mapa` | ✅ |
| `sabores.html` | `sabores` | ✅ |
| `noticias.html` | `noticias` | ✅ **(novo no 4H)** |

`pageMatches(item, file)` aceita o item quando:

1. `placement == 'all'`; **ou**
2. `placement == 'custom'` e `targetPages` aponta para a página; **ou**
3. `placement` nomeado == chave da página atual; **ou**
4. `targetPages` aponta para a página (compatibilidade extra).

**`targetMatches(targetPages, file, placementKey)`** (novo) considera "aponta para a
página" quando algum item do array bate, sem distinção de maiúsc./minúsc., com:

- o **nome de arquivo** — `"noticias.html"` (formato gravado pelo admin em `TARGET_PAGES`); **ou**
- o **nome amigável** — `"noticias"` (chave de placement).

Isso é **retrocompatível**: o comportamento anterior (`targetPages.indexOf(file)`) continua
valendo; o nome amigável é apenas um casamento **adicional**.

> O admin (`js/admin/modules/banners.js`) continua gravando **nomes de arquivo** em
> `targetPages` (enum `TARGET_PAGES` = `index.html`, `eventos.html`, `mapa-turistico.html`,
> `sabores.html`, `noticias.html`). O nome amigável é tolerado na **leitura pública** por
> robustez, não é um novo formato de gravação.

---

## 5. Comportamento final esperado

- **Banner** (`type == 'banner'`, `status == 'published'`, página/período compatíveis):
  renderizado como **faixa** no slot `#public-banners-slot` (até `MAX_BANNERS = 3`, ordenado
  por `priority` desc). Sem itens → slot permanece `hidden` (sem salto de layout).
- **Pop-up** (`type == 'popup'`): no máximo **1** por carregamento, respeitando `frequency`,
  `showDelayMs`, `dismissible`, `maxWidth`. Acessível (role=dialog, ESC, trap de Tab, foco
  restaurado). Botão × **sempre** presente.
- **Notícias**: banners e pop-ups aparecem quando `placement = noticias`, `placement = all`,
  ou `targetPages` contém `noticias.html`/`noticias` — sem afetar a lista de notícias.
- **Texto longo**: títulos/descrições/CTAs quebram palavra em vez de estourar o card/modal.
- **Falha** (Firestore/rede/rules) → `catch` silencioso, slot oculto, sem modal: a página
  **nunca quebra**.

---

## 6. Cache

- Cache-bust atualizado para **`public-banners-4h-20260629`** em:
  - o `<script>` das 5 páginas (`index`, `eventos`, `mapa-turistico`, `sabores`, `noticias`);
  - o `CSS_HREF` em `js/public-banners.js` (link injetado para `css/public-banners.css`).
- **`sw.js` não foi alterado.** O Service Worker cacheia `.js`/`.css` por **URL completa**
  (incluindo a query string). Um novo `?v=` é uma **chave de cache diferente**, então o
  arquivo novo é buscado da rede no primeiro acesso — não há necessidade de subir
  `CACHE_NAME`. Firebase/Firestore/gstatic seguem em `NEVER_CACHE` (nunca cacheados).

---

## 7. Ajustes no admin

| Item | Antes | Depois |
|---|---|---|
| Badge do cabeçalho | "Rascunhos com upload de imagem" | "Faixas e janelas do site" |
| Texto auxiliar | "…Publicar chega em etapa futura." (**desatualizado**) | Explica banner = **faixa pública**, pop-up = **janela/modal**, e o fluxo rascunho → Publicar. |
| Tipo | "Banner (faixa)" / "Pop-up (modal)" | "Banner (faixa pública na página)" / "Pop-up (janela/modal sobre a página)" |
| Frequência | "Sempre / 1x por sessão / 1x por dia / 1x por campanha" | "Sempre (a cada carregamento)", "1× por sessão (até fechar o navegador)", "1× por dia (volta no dia seguinte)", "1× por campanha (não repete)" |
| Rótulo do campo | "Frequência" | "Frequência (somente pop-up)" |

Nenhum comportamento, validação, payload ou regra do admin foi alterado — **somente texto
de interface**. O fluxo (rascunho → publicar → despublicar → arquivar) permanece idêntico.

---

## 8. Rules

- **Firestore Rules:** **não** alteradas. **Não** precisa republicar — a leitura pública de
  `status == 'published'` (Bloco 4B) já cobre banners e pop-ups em qualquer página.
- **Storage Rules:** **não** alteradas. **Não** precisa republicar — imagens seguem em
  `cms-media` (leitura pública já existente).
- A query continua só `where('status','==','published')` (sem `orderBy`) → **não** exige
  índice composto.

---

## 9. Validações executadas

- `node --check js/public-banners.js` → **OK**
- `node --check js/admin/modules/banners.js` → **OK**
- `node --check config.js` → **OK**
- `node --check sw.js` → **OK**
- `node scripts/smoke-public-banners.mjs` → **66/66 checks ✅** (53 do 4F/4G + 13 do 4H)
- `node scripts/smoke-banners.mjs` → **todos os checks ✅** (admin, sem regressão)

### Audits

| Audit | Baseline (antes) | Depois | Observação |
|---|---|---|---|
| `audit-links` | 663 links, 1 broken, 18 legacy | 664 links, 1 broken, 18 legacy | +1 link = o novo `<script>` em `noticias.html`. O **1 broken é pré-existente** (não relacionado). |
| `audit-assets` | 225 media, 0 missing | 225 media, 0 missing | Sem mudança. |
| `audit-project` | 398 arquivos (36 html, 23 css, 46 js) | 399 arquivos | +1 = este documento (`.md`). |

---

## 10. Validação visual/manual sugerida

1. No admin, criar/publicar um **banner** com `placement = noticias` → abrir
   `noticias.html` → faixa aparece **entre o hero e a lista de notícias**, sem afetar os posts.
2. Criar/publicar um **pop-up** com `placement = noticias` → o modal aparece sobre a página
   (após `showDelayMs`); fechar por × / ESC / clique fora.
3. `placement = all` → confere que aparece em notícias **e** nas demais páginas.
4. `placement = custom` + `targetPages = noticias.html` → aparece só em notícias.
5. Texto **muito longo** no título/descrição → confere que quebra a palavra sem estourar.
6. Mobile (≤480px) → pop-up confortável (margens, rolagem interna, botão × tocável).
7. Sem banners/pop-ups publicados → o slot permanece **oculto** (sem salto de layout).
8. Console **sem erro crítico** (mensagens de App Check/ReCAPTCHA em localhost são esperadas).

---

## 11. Limitações (mantidas, deliberadas)

- Sem **métricas/impressões/cliques** (fora de escopo — exigiria escrita e novas rules).
- Sem **rotação/carrossel** de banners; até 3 lado a lado.
- **1** pop-up por carregamento (`MAX_POPUPS = 1`).
- O nome amigável em `targetPages` é tolerado na **leitura**; o admin segue gravando nomes
  de arquivo.

---

## 12. Riscos

| Risco | Mitigação |
|---|---|
| Slot em notícias interferir no CMS de posts | Slot **fora** do `#postsGrid` (que é reescrito); CMS intacto. |
| CSP de `noticias.html` bloquear Firebase | `cms.js` já usa o mesmo Firebase na página → CSP já cobre. |
| SW servir JS/CSS antigos | Cache-bust `…4h-20260629` em script e CSS (nova chave de cache). |
| Texto longo estourar o card/modal | `overflow-wrap`/`word-break` + `max-width:100%` no CTA. |
| Falha de Firestore/rede para o visitante | `catch` silencioso; slot oculto; página nunca quebra. |
| Regressão de páginas existentes | Smoke cobre home/eventos/mapa/sabores + notícias (66 checks ✅). |

---

## 13. Rollback

Sem `git reset`/`git restore` (nada foi commitado). Para desfazer manualmente:

1. Em `noticias.html`: remover o `<div id="public-banners-slot">` e a `<script src="js/public-banners.js…">`.
2. Reverter o cache-bust de `…4h-20260629` para `…4g-20260629` nas 5 páginas e no
   `CSS_HREF` de `js/public-banners.js`.
3. Em `js/public-banners.js`: voltar `pageMatches` ao `targetPages.indexOf(file)` e remover
   `targetMatches`/`_targetMatches`.
4. Em `css/public-banners.css`: remover as linhas `overflow-wrap`/`word-break`/`max-width`
   e os ajustes mobile do pop-up adicionados no 4H.
5. Em `js/admin/modules/banners.js`: reverter os textos de label.
6. Em `scripts/smoke-public-banners.mjs`: remover o bloco "Bloco 4H".
7. Apagar este documento (opcional).

> Mesmo com rollback parcial, o sistema falha em silêncio: sem documento publicado
> compatível, nada aparece.

---

## 14. Próxima etapa recomendada

- **Validação visual real** no site publicado (GitHub) após o deploy: confirmar banner e
  pop-up em notícias com itens reais.
- Opcional: **rotação/carrossel** de banners ou **fila** de múltiplos pop-ups.
- Opcional (exigiria escrita + novas rules, fora do escopo atual): **métrica** de
  impressão/fechamento.
