# Bloco 4F — Exibição pública de banners publicados no site

> **Pré-requisitos:** Blocos 4B (rules publicadas), 4C (CRUD), 4D (upload) e 4E
> (publicação/despublicação) já implementados e **commitados** (4E = commit `72e7724`).
> Worktree estava **limpo** no início. **Nada foi commitado** nesta rodada. **Nenhuma
> escrita** no Firestore/Storage (este bloco só **lê** banners publicados).
>
> **Escopo:** apenas **exibição pública de banners** (`type == 'banner'`). Pop-up público
> (`type == 'popup'`) é **ignorado de propósito** → fica para o **Bloco 4G**.

---

## 1. O que foi implementado

Um carregador público que lê a collection `banners` (somente `status == 'published'`) e
renderiza os banners ativos da página atual dentro de um slot discreto.

- script público novo: `js/public-banners.js` (IIFE, `window.PublicBanners`);
- CSS novo: `css/public-banners.css` (injetado pelo próprio script — sem editar `<head>`);
- slot `<div id="public-banners-slot" hidden>` + tag `<script>` adicionados a 4 páginas;
- inicialização espelha `js/cms.js`: `import()` do SDK modular Firebase 10.7.1 + app
  nomeado próprio (`public-banners-app`) + App Check (`initModularAppCheck`);
- falha **silenciosa**: nunca quebra a página; sem banners válidos → slot oculto.

### Arquivos criados

| Arquivo | Conteúdo |
|---|---|
| `js/public-banners.js` | Carregador público (leitura, filtro, ordenação, render). |
| `css/public-banners.css` | Estilo discreto e responsivo (tokens do site com fallback). |
| `scripts/smoke-public-banners.mjs` | Smoke test (vm) dos contratos de exibição. |
| `docs/bloco-4f-exibicao-publica-banners.md` | **Novo.** Este documento. |

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `index.html` | Slot após o banner AgroSamas + `<script>` antes de `</body>`. |
| `eventos.html` | Slot após o hero + `<script>` antes de `</body>`. |
| `mapa-turistico.html` | Slot **antes** do `<main>` (sem tocar no mapa) + `<script>` antes de `</body>`. |
| `sabores.html` | Slot após o hero + `<script>` antes de `</body>`. |

> **Firestore Rules e Storage Rules NÃO foram alteradas.**

---

## 2. Como o script carrega os banners

```
DOMContentLoaded → loadBanners()
  ├─ acha #public-banners-slot? (não → encerra silenciosamente)
  ├─ window.CONFIG.firebase existe? (não → encerra)
  ├─ ensureCss()  → injeta <link css/public-banners.css> uma vez
  ├─ import() de firebase-app.js + firebase-firestore.js (gstatic 10.7.1)
  ├─ import('./firebase-app-check.js')  (best-effort)
  ├─ app = getApps('public-banners-app') ?? initializeApp(CONFIG.firebase, 'public-banners-app')
  ├─ initModularAppCheck(app)  (idempotente por nome de app)
  ├─ getDocs( query(collection('banners'), where('status','==','published')) )
  └─ renderInto(slot, selectBanners(docs))
```

- Padrão idêntico ao `js/cms.js` (que lê `noticias`). Não depende do SDK **compat** estar
  carregado, então funciona em qualquer página-alvo (index/sabores não carregam compat).
- Toda a cadeia está em `Promise … .catch()`: qualquer falha vira **log discreto** no
  console e o slot fica oculto — **sem erro visual** para o visitante.

---

## 3. Como filtra `status == 'published'`

- **Na query** (`where('status','==','published')`): obrigatório, pois as Firestore Rules
  do Bloco 4B só liberam leitura pública de documentos `published`. Uma `list` sem esse
  filtro seria negada pela rule.
- **No client** (reforço/defesa em profundidade): `selectBanners()` descarta qualquer doc
  cujo `status` não seja exatamente `published`. `draft` e `archived` nunca aparecem.

---

## 4. Como filtra página / placement / targetPages

A página atual é derivada de `location.pathname` (`currentFile()`), normalizando raiz para
`index.html`. O mapa `FILE_TO_PLACEMENT` converte o arquivo na chave de `placement`:

| Arquivo | Chave de placement |
|---|---|
| `index.html` (ou raiz `/`) | `home` |
| `eventos.html` | `eventos` |
| `mapa-turistico.html` | `mapa` |
| `sabores.html` | `sabores` |
| `noticias.html` | `noticias` (mapeado, mas a página ainda não tem slot) |

`pageMatches(item, file)` aceita o banner quando:

1. `placement == 'all'`; **ou**
2. `placement == 'custom'` e `targetPages` contém o arquivo atual; **ou**
3. `placement` nomeado == chave da página atual; **ou**
4. `targetPages` contém o arquivo atual (compatibilidade extra).

---

## 5. Como filtra período (`startAt` / `endAt`)

`withinWindow(item, now)`:

- se `startAt` existe e `now < startAt` → **não** exibe (ainda não começou);
- se `endAt` existe e `now > endAt` → **não** exibe (já encerrou);
- datas ausentes não restringem. `toMillis()` aceita `Timestamp` do Firestore
  (`toMillis()`/`seconds`) e strings ISO.

> A janela é aplicada **no client** (decisão do Bloco 4B §3.2): a rule garante apenas a
> coerência `endAt > startAt`, não a janela em tempo de `list`.

---

## 6. Como ordena por prioridade

`selectBanners()` ordena por:

1. `priority` **desc** (maior primeiro; não-numérico vira 0);
2. desempate por `updatedAt` **desc** (mais recente primeiro).

Depois aplica `slice(0, MAX_BANNERS)` (**MAX_BANNERS = 3**) para não poluir o layout.

---

## 7. Como renderiza o banner

`renderBanner(item)` monta um `<article class="public-banner">` com:

- **imagem** (`<img loading="lazy" decoding="async">`) — obrigatória; sem `imageUrl`
  válido o card é pulado;
- **título** (`item.title`), se houver;
- **descrição** (`item.description`), se houver;
- **CTA** (`<a>`), se `ctaUrl` válido **e** `ctaLabel` presentes;
- `alt` a partir de `imageAlt` (fallback para `title`).

`renderInto()` envolve os cards em `<div class="public-banners">` e mostra o slot; se não
houver nenhum card, limpa e mantém o slot **oculto** (`hidden`).

---

## 8. Como trata o CTA

- `ctaUrl` passa por `safeUrl()` (usa `window.SMSecurity.url` quando disponível, senão
  fallback equivalente): aceita **http(s)** e caminhos internos (`images/…`, `/…`,
  `*.html`); rejeita `javascript:`, aspas, parênteses e afins → retorna vazio.
- CTA só é renderizado se `safeUrl` retornar uma URL não-vazia **e** houver `ctaLabel`.
- `ctaTarget == '_blank'` → adiciona `rel="noopener noreferrer"`.
- Textos (`title`, `description`, `ctaLabel`) são escapados (`esc`) antes de ir ao DOM.

---

## 9. Como trata erro de imagem

- `<img … onerror="…">`: se a imagem falhar, o handler **oculta o card inteiro**
  (`.public-banner { display:none }`), evitando “imagem quebrada” no layout.
- CSS limita altura (`max-height`) e usa `object-fit: cover` para não distorcer.

---

## 10. Segurança

- Sem `innerHTML` com dado cru: todo texto passa por `esc`/`escAttr`; URLs por `safeUrl`.
- `SMSecurity` (de `js/security-utils.js`) **não** é carregado nas páginas-alvo — por isso
  o script traz **fallback interno equivalente** (escape HTML/atributo + validação de URL).
- Nenhum dado administrativo é exposto: só `title`, `description`, `imageUrl`, `imageAlt`,
  `ctaLabel`, `ctaUrl`, `ctaTarget` são usados no render. Campos como `createdBy`,
  `updatedBy`, `imagePath` não vão ao DOM.

---

## 11. Performance / cache

- Scripts/CSS carregados de forma leve; `<script defer>` não bloqueia o render principal.
- Firebase SDK e Firestore vêm de `gstatic`/`firestore.googleapis.com`, que estão em
  `NEVER_CACHE` no `sw.js` — não são cacheados pelo Service Worker (igual ao `cms.js`).
- `?v=public-banners-4f-20260629` nas tags força atualização ao versionar (cache-bust).
- Uma única query `where('status','==','published')` por página; ordenação/limite no client.
- `sw.js` **não** foi alterado: os arquivos novos são cacheados naturalmente no 1º fetch e
  versionados via `?v=`.

---

## 12. Compatibilidade / robustez

- Firestore indisponível, App Check falho ou rules negando → `catch` → log discreto, slot oculto.
- Página sem `#public-banners-slot` → script encerra sem efeito (seguro incluir em qualquer página).
- Sem banners publicados → slot permanece `hidden`.
- Não altera o CRUD admin nem o site além dos pontos de montagem.

---

## 13. Rules — precisa publicar de novo?

| Rules | Precisa republicar? | Motivo |
|---|---|---|
| **Firestore Rules** | **Não** | Leitura pública de `published` já está no Bloco 4B (`allow read: if isAdmin() || resource.data.status == 'published'`). |
| **Storage Rules** | **Não** | Imagens de banner já são de leitura pública (`cms-media`); nada alterado. |

> **Possível índice:** a query atual usa só `where('status','==','published')` (sem
> `orderBy`), então **não exige índice composto**. Se um dia a ordenação for movida para o
> servidor (`orderBy('priority')`), o Firestore poderá pedir um índice.

---

## 14. Validações executadas

- `node --check js/public-banners.js` → OK; `config.js` → OK; `sw.js` → OK.
- `node scripts/smoke-public-banners.mjs` → **25/25 checks ✅**.
- `node scripts/smoke-banners.mjs` (admin, regressão) → **65/65 ✅** (sem regressão).
- `node scripts/audit-links.mjs` → 663 links, **1 broken pré-existente** (não relacionado),
  18 candidatos *legacy*. Os 4 novos candidatos são **falsos positivos**: o audit sinaliza
  os literais `eventos.html`/`sabores.html`/`noticias.html` do mapa `FILE_TO_PLACEMENT`
  dentro de `public-banners.js` (não são links reais, são chaves de roteamento).
- `node scripts/audit-assets.mjs` → 225 mídias, **0 referências faltantes**.
- `node scripts/audit-project.mjs` → 396 arquivos (36 html, 23 css, 46 js).

> Nenhum **script inline** foi adicionado às páginas (apenas `<script src>` + `<div>` +
> comentário), então não houve necessidade de extrair/`node --check` de inline.

---

## 15. Como testar manualmente

1. No admin, **publicar** um banner com imagem e `placement = home`.
2. Abrir a **home** pública → o banner aparece no slot (abaixo do banner AgroSamas).
3. No admin, mudar `placement` para `eventos` (despublicar → editar → publicar) → o banner
   aparece em **eventos.html** e **some** da home.
4. **Despublicar** (status `draft`) → o banner **desaparece** do site.
5. **Arquivar** → continua **fora** do site.
6. Testar **CTA**: definir `ctaUrl`/`ctaLabel` → clicar abre o link (nova aba se `_blank`).
7. Testar **período**: `startAt` no futuro → não aparece; `endAt` no passado → não aparece.
8. Testar **mobile/responsivo**: layout em coluna única; em ≥768px, grade.
9. Quebrar a URL da imagem (URL inválida) → o card some, sem layout quebrado.
10. Console **sem erro crítico** (mensagens de App Check/ReCAPTCHA em localhost são esperadas).

---

## 16. Limitações (deliberadas)

- **Pop-up público** (`type == 'popup'`) **não** é exibido — fica para o **Bloco 4G**.
- `frequency`, `dismissible`, `showDelayMs`, `maxWidth` (campos de pop-up) **não** são
  aplicados nesta etapa (são relevantes para pop-up).
- Páginas integradas: `index`, `eventos`, `mapa-turistico`, `sabores`. `noticias.html`
  está mapeada mas **sem slot** (pode receber um slot numa próxima rodada se desejado).
- Sem carrossel/rotação: até `MAX_BANNERS` (3) são exibidos lado a lado.

---

## 17. Riscos

| Risco | Mitigação |
|---|---|
| Falha de Firestore/rede para o visitante | `catch` silencioso + slot oculto; nunca quebra a página. |
| XSS via campos do banner | `esc`/`escAttr`/`safeUrl`; CTA perigoso descartado. |
| Imagem quebrada | `onerror` oculta o card. |
| SW servindo versão antiga do script/CSS | `?v=public-banners-4f-20260629` nas tags. |
| Banner publicado fora da janela aparecer | Filtro `withinWindow` no client. |
| Layout poluído com muitos banners | `MAX_BANNERS = 3` + slot discreto. |
| Falsos positivos no audit de links | Documentado (§14): são chaves de roteamento, não links. |

---

## 18. Rollback

Sem `git reset`/`git restore` (conforme restrições). Como nada foi commitado, basta desfazer:

1. Remover o `<div id="public-banners-slot">` e a `<script src="js/public-banners.js…">`
   das 4 páginas (`index.html`, `eventos.html`, `mapa-turistico.html`, `sabores.html`).
2. Apagar `js/public-banners.js`, `css/public-banners.css` e
   `scripts/smoke-public-banners.mjs`.
3. Apagar este documento (opcional).

> Como o script falha em silêncio e o slot nasce `hidden`, mesmo sem rollback nada quebra
> caso os arquivos sejam removidos parcialmente.

---

## 19. Próxima etapa recomendada

**Bloco 4G — Pop-up público**: exibir `type == 'popup'` como modal, respeitando
`frequency` (controle por `sessionStorage`/`localStorage`), `showDelayMs`, `dismissible` e
`maxWidth`, reaproveitando o filtro de página/período/placement já implementado aqui.
Depois, opcionalmente, adicionar slot em `noticias.html` e/ou rotação/carrossel de banners.
