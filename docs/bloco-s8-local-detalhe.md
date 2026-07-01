# Bloco S8 — Página individual de local (`local.html`)

Data: 2026-07-01
Branch: `main`
Escopo: tornar a página individual de locais/atrativos (`local.html?id=...` / `/local?id=...`) **robusta, acessível e com SEO dinâmico por id**, mantendo total compatibilidade com o fluxo `?id=` atual. **Não commitado.** Sem redesign, sem slugs definitivos, sem History API/pushState, sem tocar hero/vídeo, mapa 3D, admin ou rules.

## 1. Pré-condições

- `git status` inicial: **worktree limpo** (S7 já commitado em `40fdb75`).
- Inspecionados: local.html, local/index.html, js/locais-data.js, js/mapa-turistico.js, js/site-meta.js, js/nav-shared.js, js/security-utils.js, js/data/pontos-turisticos.js, js/data/turismo-data-adapter.js, translations.js, noticia.html (padrão de canonical dinâmico), sitemap.xml, robots.txt, docs S6, docs S7, scripts/audit-*.mjs.

## 2. Comportamento anterior (baseline)

`local.html` é uma página **client-side**: `<title>Carregando...</title>` + um `<div id="page-root">` populado por um `<script>` inline.

- **Leitura do `id`:** `new URLSearchParams(window.location.search).get('id')`.
- **Busca do local:** `window.locaisData[id]` (dataset global em `js/locais-data.js`).
- **URL limpa `/local`:** atendida por `local/index.html` (passthrough Tipo A — `location.replace('/local.html' + search + hash)`, preserva `?id=` e `#`).
- **Fallback de "não encontrado":** único estado (`.not-found`) para id ausente **ou** inexistente, com link só para `/`.
- **SEO:** atualizava `document.title` e `meta[description]`; **sem** canonical/robots/OG dinâmicos.

### Fragilidades identificadas (corrigidas neste bloco)

| Ponto | Risco anterior |
| --- | --- |
| `local.descricao.substring(0,160)` | **TypeError** se `descricao` ausente. |
| `local.rota.split('·')` | **TypeError** se `rota` ausente. |
| `<img src="${local.imagem}">` (hero/galeria/relacionados) | Imagem quebrada visível, sem fallback. |
| `if (local.lat)` | `lat = 0` seria falso-negativo; `lng` ausente não tratado. |
| Estado de erro único | Não diferenciava "sem id" de "id inexistente"; sem CTA para o mapa. |
| Sem escape | Renderização direta de dados via template string (dataset é confiável, mas frágil). |

## 3. Campos disponíveis no dataset (`js/locais-data.js`)

`id, nome, subtitulo, badge, descricao, historia, imagem, galeria[], endereco, horario, telefone, site, instagram, facebook, lat, lng, mapsUrl, categoria, rota, acessibilidade`.

- **Não há campo `slug`** — os ids já são slugs kebab-case usados como chave e em `?id=`.
- `facebook` existe no dataset mas está `null` em todos os registros e **não é exibido** (nem antes nem agora).

## 4. Campos exibidos (depois)

- **Hero:** imagem (com `alt` = nome, `onerror` → fallback), badge (se houver), nome (`<h1>`), subtítulo (se houver).
- **Coluna esquerda:** rótulo "Sobre o Local", título, descrição (ou "Informação não disponível"), **bloco de ações**, história (se houver), galeria (se houver), mapa (se houver coordenadas).
- **Relacionados:** até 3 outros locais (imagem com fallback + nome + subtítulo).
- **Card de informações (direita):** categoria, e só as linhas presentes — Endereço, Horário, Telefone (link `tel:`), Acessibilidade, Rota (tags). Rodapé social: Telefone, Instagram, Site oficial (só o que existir).
- `facebook` permanece não exibido (sempre `null`).

## 5. Fallbacks implementados

- **`id` ausente:** estado amigável "Nenhum local selecionado" + botões "Ver no mapa turístico" e "Portal"; `robots=noindex,follow`.
- **`id` inexistente:** estado amigável "Local não encontrado" + mesmos botões; `robots=noindex,follow`. (Ambos os textos são i18n PT/EN/ES/PL.)
- **Imagem ausente/quebrada:** `onerror="imgFallback(this)"` troca para `images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg` (com guarda anti-loop via `data-fallbackApplied`). Se `imagem` vier vazio, já entra com o fallback.
- **Coordenadas ausentes/ inválidas:** `hasCoords` exige `lat`/`lng` numéricos e finitos → não renderiza a seção do mapa nem instancia o Leaflet; a inicialização do mapa está em `try/catch` (esconde o `#local-map` se falhar).
- **`mapsUrl` ausente mas com coordenadas:** mantém o fallback por coordenadas — "Abrir no Google Maps" usa `?api=1&query=lat,lng` e "Traçar rota" usa `dir/?api=1&destination=lat,lng`.
- **`rota`/`descricao`/contato/horário/localidade ausentes:** seção/linha oculta; quando faz sentido mostrar algo, exibe **"Informação não disponível"** (discreto, `.info-unavailable`) — **sem inventar dados**.

## 6. SEO / meta dinâmico

Reaproveita o padrão de `noticia.html` (canonical com `id` atualizado por JS), agora aplicado a `local.html`:

- `document.title` = `<nome> | Turismo São Mateus do Sul`.
- `meta[name=description]` = primeiros 160 chars da descrição (ou subtítulo/nome como fallback).
- **`<link rel="canonical" id="local-canonical">`** atualizado para `https://turismo.saomateusdosul.pr.gov.br/local?id=<id>` — **dinâmico por id**, evitando o colapso de todas as fichas numa só URL (a razão pela qual o S6 deixou o canonical de fora).
- **`<meta name="robots" id="local-robots">`** = `index,follow` em ficha válida; **`noindex,follow`** nos estados de erro.
- **Open Graph** (`og:type=place`, `og:site_name`, `og:title`, `og:description`, `og:image`, `og:url`) atualizados por id para melhorar compartilhamento. `og:image` é absolutizado a partir de `local.imagem`.

## 7. Compatibilidade com `?id=`

**Mantida integralmente.** A leitura continua via `?id=`; nenhum link gerador foi alterado. Geradores atuais permanecem apontando para `/local?id=<slug>`:
`index.html`, `js/data/pontos-turisticos.js`, `js/data/restaurantes.js`, `js/data/turismo-data-adapter.js` (`buildLegacyLocalItem` monta `/local?id=` + a chave real de `locais-data`).

## 8. Preparação / plano futuro para slugs

- Os ids **já são slugs** (kebab-case). Não foi gerado campo `slug` novo (desnecessário agora).
- **Não** foi implementado History API/pushState (fora do escopo — apenas diagnóstico).
- **Proposta futura** (bloco dedicado): rota bonita `/local/<slug>` ou `/atrativos/<slug>`, exigindo:
  1. rewrite/fallback no hosting (`/local/*` → `local.html`) lendo o slug do path em vez de `?id=`;
  2. atualização de todos os geradores de link;
  3. redirect `301`/canonical de `/local?id=<slug>` → `/local/<slug>`;
  4. canonical dinâmico já pronto (este bloco) só troca a forma da URL.

## 9. Integração com o mapa turístico

- Os botões **"Ver detalhes"** do mapa **abrem um modal interno** (`openDetailsModal`) — **não** navegam para `local.html`; nenhuma alteração foi feita no mapa. Filtros do mapa **intocados**.
- Os links de navegação para a ficha (`/local?id=`) vêm de `index.html` e `js/data/*` e continuam válidos.
- "Ver no mapa turístico" e "Voltar ao mapa" (novos CTAs) apontam para `/mapa-turistico.html` (o mapa não lê id/busca por URL — só `categoria`/`grupo`/hash —, então o deep-link por item não é possível hoje sem alterar o mapa; ficou de fora).

## 10. Acessibilidade

- Imagens com `alt` útil (nome do local / "nome — foto N").
- Miniaturas da galeria com `tabindex="0"` + handler de teclado (Enter/Espaço) além do clique.
- **Foco visível** (`:focus-visible` com contorno dourado) em links, botões, CTAs, cards e miniaturas.
- Estados de erro claros e textuais; sem botões vazios ou links sem destino.
- Botões/CTAs com texto explícito ("Traçar rota", "Ver no mapa turístico", "Voltar ao mapa").

## 11. i18n

- O **chrome** da página (rótulos de seção, rótulos do card, botões, estados de erro, rodapé) é traduzido em **PT/EN/ES/PL** via dicionário inline, detectando o idioma por `localStorage['sms-lang']` (mesma convenção de `translations.js`) com fallback para `navigator.language` e depois `pt`.
- **Limitação documentada:** o **conteúdo turístico** (nome, subtítulo, descrição, história, endereço, horário) permanece em **PT-BR**, porque o dataset `js/locais-data.js` é monolíngue. Traduzir o conteúdo exige estrutura multilíngue no dataset — fora do escopo (não "resolver o sistema inteiro de idioma neste bloco").

## 12. Arquivos alterados

- [local.html](../local.html) — head: canonical/robots/OG dinâmicos + `<script src="js/security-utils.js">`; `<style>`: `.local-actions`/`.btn-acao`/`.info-unavailable`/`:focus-visible`; script inline reescrito (robustez, fallbacks, i18n do chrome, SEO dinâmico, acessibilidade).
- [docs/bloco-s8-local-detalhe.md](bloco-s8-local-detalhe.md) — este documento.

**Não alterados:** `js/locais-data.js`, `js/mapa-turistico.js`, `js/site-meta.js`, `js/nav-shared.js`, `translations.js`, `sitemap.xml`, `robots.txt`, `local/index.html`, geradores de link, nenhum dado turístico, nenhuma rule.

## 13. Validações executadas

- `node --check js/locais-data.js` — OK
- `node --check js/mapa-turistico.js` — OK
- `node --check js/site-meta.js` — OK
- `node --check js/nav-shared.js` — OK
- `node --check translations.js` — OK
- Script inline de `local.html` extraído e validado com `node --check` — **OK**.
- `node scripts/audit-links.mjs` — **662 links, 0 broken**, 1 falso positivo conhecido, 20 legados/redundantes. (Baseline era 665; a queda de 3 é só menos *string-literals* de URL após trocar template-literals por concatenação — nenhuma rota removida, 0 quebrados.)
- `node scripts/audit-assets.mjs` — 226 media, 0 duplicadas, 0 refs faltando.
- `node scripts/audit-project.mjs` — 413 files, 36 html, 23 css, 46 js.

## 14. Validação manual (executada no preview local, porta 8899)

1. `/local.html?id=igreja-matriz` → renderiza; title/canonical/OG dinâmicos; `robots=index,follow`; 3 CTAs; 5 linhas de info; mapa; 3 relacionados. ✅
2. `/local?id=igreja-matriz` → passthrough serve o stub (200) e redireciona preservando `?id=`. ✅
3. `/local.html` (sem id) → "Nenhum local selecionado" + CTAs mapa/portal; `noindex,follow`. ✅
4. `/local.html?id=nao-existe-xyz` → "Local não encontrado"; `noindex,follow`. ✅
5. Local **com** `mapsUrl` (`igreja-agua-branca`) → "Abrir no Google Maps" usa `maps.app.goo.gl/...`; "Traçar rota" usa `dir/?...&destination=lat,lng`. ✅
6. Local **sem** `mapsUrl` mas com coordenadas (`igreja-matriz`) → "Abrir no Google Maps" cai no `search?...&query=lat,lng`. ✅
7. "Traçar rota" / "Ver no mapa turístico" / "Voltar ao mapa" → hrefs corretos. ✅
8. Console: apenas erros pré-existentes de Firebase AppCheck/reCAPTCHA (ambiente localhost) — **nenhum erro do script de `local.html`**. ✅
9. Mobile (375px): grid de 1 coluna, CTAs com `flex-wrap`. ✅
10. Hero/vídeo **inalterada**; mapa 3D **não reintroduzido**; admin **intocado**. ✅

## 15. Riscos

- **Baixo.** Mudanças concentradas em `local.html` (1 arquivo público) + 1 doc.
- O `og:image` absoluto assume o domínio de produção fixo; correto em produção, apenas cosmético em preview.
- A detecção de idioma do chrome depende de `localStorage['sms-lang']`; sem escolha salva, usa `navigator.language`. O conteúdo permanece PT-BR (limitação §11).
- Dependência nova de `js/security-utils.js` (já usado por `noticia.html`); se ausente, há **fallback** interno `SEC` que degrada sem quebrar.

## 16. Rollback

- Nada foi commitado. `git checkout -- local.html` restaura o estado anterior (evitar comandos destrutivos amplos); apagar `docs/bloco-s8-local-detalhe.md` se desejado.

## 17. Discrepância de dados observada (não corrigida — decisão futura)

- `js/data/pontos-turisticos.js` tem o item `casa-da-memoria` com `url: "/local?id=casa-da-memoria"`, mas a chave real em `js/locais-data.js` é **`casa-memoria-padre-bauer`**. Um link direto para `?id=casa-da-memoria` cairia no estado "Local não encontrado".
- **Não alterado** neste bloco: (a) é dado do mapa (fora do foco), e (b) no mapa o item abre **modal**, não navega para a ficha — a URL pode ser legado não navegável, o que exige verificação humana antes de mexer. A página agora **degrada com segurança** nesse caso. **Recomendação:** alinhar o id em um bloco futuro (ou de dados).

## 18. Próxima etapa recomendada

Bloco **S9 — slugs bonitos para locais**: implementar `/local/<slug>` (ou `/atrativos/<slug>`) com rewrite no hosting + leitura do slug pelo path, atualizar geradores de link e adicionar redirect `?id=` → slug (o canonical dinâmico já está pronto). Em paralelo, alinhar o id `casa-da-memoria` (§17).
