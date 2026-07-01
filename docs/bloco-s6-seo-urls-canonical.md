# Bloco S6 — SEO, URLs limpas, canonical e sitemap

Data: 2026-07-01
Branch: `main`
Escopo: auditoria de SEO/URLs/canonical/sitemap + correções seguras e documentação de decisões pendentes. **Não commitado.** Sem redesign, sem migração ampla de URLs, sem tocar hero/vídeo, mapa 3D ou admin.

## 1. Pré-condições

- `git status` inicial: **worktree limpo** (S5 já commitado em `4d24aa6`).
- Inspecionados: sitemap.xml, robots.txt, index.html, mapa-turistico.html, sabores.html, eventos.html, noticias.html, o-que-fazer.html, local.html, rotas-completas.html, mapa-3d.html, mapa-completo.html, roteiro-ia.html, galeria.html, js/nav-shared.js, js/site-meta.js, js/breadcrumbs.js, sw.js, translations.js, scripts/audit-links.mjs, docs/auditoria-output/links-report.json, docs S5.

## 2. Arquitetura de URLs descoberta

O site usa **hosting estático com dois artefatos por rota**:

- `pagina.html` — página real de conteúdo.
- `pagina/index.html` — stub que atende a URL limpa `/pagina`.

Existem **dois tipos de stub** `dir/index.html`:

**Tipo A — passthrough de compatibilidade** (`/x` → `window.location.replace("/x.html" + search + hash)`, preservando query e hash):
`eventos/`, `galeria/`, `noticias/`, `noticia/`, `privacidade/`, `portal-usuario/`, `transparencia/`, `local/`, `rotas-completas/`, `mapa-completo/`, `mapa-3d/`, `o-que-fazer/`.

**Tipo B — página-ponte para o mapa** (`noindex,follow` + `meta refresh` + `location.replace("/mapa-turistico.html?categoria=...")`, **sem preservar hash**):
`sabores/` → `?categoria=Gastronomia`; `onde-ficar/` → `?categoria=Hospedagem`.

## 3. Mapa de URLs

### Páginas `.html` reais (conteúdo)
index, mapa-turistico, sabores, eventos, noticias, noticia, galeria, o-que-fazer, onde-ficar, rotas-completas, mapa-completo, mapa-3d, roteiro-ia, local, reservas, para-o-trade, transparencia, privacidade, portal-usuario, admin-firebase, offline, 404.

### URLs limpas no sitemap (11)
`/`, `/eventos`, `/mapa-turistico`, `/galeria`, `/noticias`, `/sabores`, `/onde-ficar`, `/reservas`, `/para-o-trade`, `/transparencia`, `/local` + 5 legadas (`/o-que-fazer`, `/rotas-completas`, `/mapa-completo`, `/mapa-3d`, `/roteiro-ia`). Todo o sitemap usa **URLs limpas** de forma consistente.

### Pares equivalentes `/x` ⇄ `/x.html`
Todas as páginas acima têm par limpo/`.html`. Os links internos usam **mix**: nav-shared usa limpo para navegação simples (`/sabores`, `/galeria`, `/eventos/`, `/noticias`, `/transparencia`, `/portal-usuario`) e `.html` para o mapa com filtros (`/mapa-turistico.html?grupo=roteiros`, `?categoria=...`).

## 4. Padrão canônico identificado

- **Sitemap:** 100% URLs limpas.
- **Canonical das páginas:** predominantemente **URL limpa self-referencing** (`/eventos`, `/noticias`, `/sabores`, `/o-que-fazer`, `/onde-ficar`, `/transparencia`, `/reservas`, `/para-o-trade`, `/privacidade`, `/roteiro-ia`, `/mapa-3d`, `/`).
- **Exceções (canonical com `.html` + query, apontando para o mapa):** `rotas-completas.html`, `sabores/index.html`, `onde-ficar/index.html` → `/mapa-turistico.html?...`. São páginas de consolidação no mapa (as duas últimas são `noindex`).

**Padrão recomendado (mantido):** canonical = URL limpa self-referencing para páginas de conteúdo; sitemap em URLs limpas.

## 5. Canonical antes/depois

| Página | Canonical antes | Depois |
| --- | --- | --- |
| mapa-turistico.html | (ausente) | `/mapa-turistico` ✅ adicionado |
| galeria.html | (ausente) | `/galeria` ✅ adicionado |
| local.html | (ausente) | (mantido ausente — ver §8) |
| mapa-completo.html | (ausente) | (mantido ausente — ver §9) |

Ambos os canonical adicionados seguem o padrão do site (URL limpa self-referencing) e coincidem com o sitemap. São páginas reais, públicas e indexáveis. Correção segura e de baixo risco.

## 6. Alterações feitas

- [mapa-turistico.html](../mapa-turistico.html) — `+<link rel="canonical" href=".../mapa-turistico">` após o `<title>`.
- [galeria.html](../galeria.html) — `+<link rel="canonical" href=".../galeria">` após o `<title>`.
- [docs/bloco-s6-seo-urls-canonical.md](bloco-s6-seo-urls-canonical.md) — este documento.

**Não alterados:** sitemap.xml, robots.txt, sw.js, translations.js, nav-shared.js, site-meta.js, breadcrumbs.js, nenhuma página-ponte/stub, nenhum canonical existente, nenhum link interno.

## 7. Sitemap, robots e Service Worker

- **Sitemap:** consistente (URLs limpas). **Nenhuma alteração** — nenhum erro pequeno/evidente justificaria mexer neste bloco. As 5 legadas já estão em `priority 0.3 / changefreq yearly`. (Observação: o comentário "redirecionam para /mapa-turistico" não é 100% preciso — mapa-completo/mapa-3d/roteiro-ia são páginas reais, não redirects; rotas-completas.html canonicaliza para o mapa. Corrigir o comentário fica para o bloco futuro para evitar edição especulativa agora.)
- **robots.txt:** OK. `Allow: /`, bloqueia apenas admin/portal-usuario/backend/database. Não bloqueia páginas públicas e não é usado como canonicalização. **Nenhuma alteração.**
- **Service Worker (`sw.js`):** HTML e navegações **nunca são cacheados** (`NEVER_CACHE_EXT` inclui `.html`; `mode==='navigate'` retorna cedo). Portanto o SW **não prejudica URLs limpas nem redirects**. Sem bug → **nenhuma alteração**.

## 8. Situação do `/local?id=...`

- `local.html` inicia com `<title>Carregando...</title>` e é populado dinamicamente pelo `?id=`.
- A URL limpa `/local` é atendida por `local/index.html` (passthrough Tipo A, preserva `?id=` e `#`).
- `breadcrumbs.js` lê `?id` e gera o rótulo do breadcrumb (title-case do slug).
- Links para local são gerados em: `index.html`, `js/data/pontos-turisticos.js`, `js/data/restaurantes.js`, `js/data/turismo-data-adapter.js` (padrão `/local?id=<slug>`).
- **Canonical:** propositalmente **não adicionado**. Um canonical estático `/local` colapsaria todas as fichas (`?id=a`, `?id=b`, ...) numa só URL — prejudicial. O correto é um **canonical dinâmico** por id (como `noticia.html`, que usa `<link rel="canonical" id="meta-canonical">` atualizado por JS). Isso exige JS e testes → **fase futura**, não "correção pequena".
- **Plano futuro de slugs bonitos** (`/local/vapor-pery` ou `/atrativos/vapor-pery`): exige roteamento/fallback no hosting + atualização de todos os geradores de link + redirect de `/local?id=` → slug. Fora do escopo deste bloco.

## 9. Classificação de páginas suspensas/legadas

| Página | Existe `.html`? | No sitemap? | Canonical | Classificação | Recomendação futura |
| --- | --- | --- | --- | --- | --- |
| mapa-3d | Sim | Sim (0.3) | `/mapa-3d` (self) | **Suspensa** (decisão de projeto) | Decisão humana: manter (retorna 200) ou remover de sitemap+breadcrumbs quando confirmado suspenso em definitivo. **Não removida agora.** |
| mapa-completo | Sim (Leaflet real) | Sim (0.3) | (ausente) | **Legado compatível** | Decidir: consolidar (canonical → `/mapa-turistico`) ou manter. Não adicionar self-canonical agora para não reforçar indexação de página legada. |
| roteiro-ia | Sim | Sim (0.3) | `/roteiro-ia` (self) | **Decisão humana** (verificar se funcional/ativa) | Confirmar status; se legada, rebaixar/consolidar. |
| o-que-fazer | Sim | Sim (0.3) | `/o-que-fazer` (self) | **Legado compatível** (ativo, ponte editorial) | Manter por compatibilidade. |
| rotas-completas | Sim | Sim (0.3) | `/mapa-turistico.html?grupo=roteiros` | **Legado → consolidado no mapa** | Manter; padronizar canonical p/ URL limpa em bloco futuro. |
| onde-ficar | `.html` + ponte | Sim (0.8) | conflito (ver §10) | **Conflito ativo** | Resolver precedência (ver §10). |
| sabores | `.html` + ponte | Sim (0.8) | conflito (ver §10) | **Conflito ativo** | Resolver precedência (ver §10). |

## 10. ⚠️ Conflito crítico — `/sabores` e `/onde-ficar` (decisão humana)

Cada uma tem **duas definições divergentes**:

- `sabores.html` — página real, ativa (filtros traduzidos no S4C: `#polonesa`, `#erva-mate`, `#feiras`, `#restaurantes`), canonical **self** `/sabores`.
- `sabores/index.html` — página-ponte `noindex` que **redireciona `/sabores` para o mapa** (`?categoria=Gastronomia`), **sem preservar hash**.

Se o hosting servir o **diretório** em `/sabores`, os filtros preservados `/sabores#polonesa` **quebram** (o redirect descarta o hash). Se servir o **arquivo** `sabores.html`, a ponte fica morta/inútil. **Qual dos dois responde em `/sabores` depende da precedência de rewrite do ambiente publicado** (ex.: `cleanUrls`/`rewrites` do Firebase Hosting) — **não é determinável só pelo repositório**.

**Ação:** nenhuma alteração neste bloco. Requer **validação no ambiente publicado** + decisão: (a) manter `sabores.html` como página real (remover/neutralizar a ponte), ou (b) assumir a consolidação no mapa (remover `sabores.html` do fluxo e ajustar nav/filtros). Mesmo raciocínio para `onde-ficar`.

## 11. site-meta.js / breadcrumbs.js

- `site-meta.js`: apenas rodapé de versão/atualização; não gera URLs de navegação. Sem inconsistência. **Nenhuma alteração.**
- `breadcrumbs.js`: mapeia paths limpos → rótulos e monta Schema.org com `base + path` limpo (normaliza removendo `.html`). Coerente com o padrão canônico. **Nenhuma alteração.**

## 12. Validações executadas

- `node --check js/nav-shared.js` — OK
- `node --check js/site-meta.js` — OK
- `node --check translations.js` — OK
- `node --check sw.js` — OK
- `node scripts/audit-links.mjs` — **665 links, 0 broken**, 1 falso positivo conhecido, 20 legados.
- `node scripts/audit-assets.mjs` — 226 media, 0 duplicadas, 0 refs faltando.
- `node scripts/audit-project.mjs` — 411 files, 36 html, 23 css, 46 js.

(Links 663 → 665 = os dois novos `<link rel="canonical">`; ambos resolvem para rotas reais, 0 quebrados.)

Não foi alterado nenhum JS além dos validados; os dois HTML editados receberam apenas uma tag `<link>` (sem script inline).

## 13. Validação manual recomendada

Testar no ambiente publicado (não verificável só pelo repo):
1. `/`, `/eventos` e `/eventos.html`, `/mapa-turistico` e `/mapa-turistico.html`, `/noticias` e `/noticias.html` → 200.
2. **`/sabores` vs `/sabores.html`** e **`/onde-ficar` vs `/onde-ficar.html`** → verificar QUAL responde no diretório (ver §10) e se os filtros `/sabores#polonesa|#erva-mate|#feiras|#restaurantes` ainda funcionam.
3. `/local` e `/local.html?id=...` → conteúdo carrega via `?id`.
4. `/mapa-3d`, `/mapa-completo`, `/roteiro-ia` → status atual.
5. Conferir canonical (View Source) em `/mapa-turistico` e `/galeria` → devem apontar para a URL limpa.
6. Conferir sitemap e filtros preservados.
7. Confirmar hero/vídeo intacta, mapa 3D não reintroduzido, admin não alterado.

## 14. O que ficou para bloco futuro

- Resolver o **conflito `/sabores` e `/onde-ficar`** (precedência de hosting) — §10.
- **Canonical dinâmico em `local.html`** (por `?id`) e eventual migração para **slugs** `/local/<slug>` — §8.
- Padronizar canonicais que ainda usam `.html?query` (`rotas-completas.html`, pontes) para URL limpa, após confirmar que URLs limpas com query respondem.
- Decidir destino de **mapa-3d / mapa-completo / roteiro-ia** no sitemap/menus (manter, rebaixar ou remover) — §9.
- Corrigir o **comentário** do sitemap sobre páginas legadas.

## 15. Riscos

- **Baixo.** As duas únicas mudanças são tags `<link rel="canonical">` self-referencing em páginas que já constam no sitemap com a mesma URL limpa — reforçam consistência, não alteram runtime, layout ou navegação.
- Risco residual: se, no ambiente publicado, `/mapa-turistico` ou `/galeria` (limpas) **não** responderem 200 (improvável — o sitemap já as usa), o canonical apontaria para URL não servida. Mitigável pela validação manual do §13.

## 16. Rollback

- Reverter as duas linhas adicionadas em `mapa-turistico.html` e `galeria.html` (remover os `<link rel="canonical">`), ou
- Nada foi commitado: `git checkout -- mapa-turistico.html galeria.html` restaura o estado anterior (evitar comandos destrutivos amplos).

## 17. Próxima etapa recomendada

Bloco **S7 — resolução do conflito de rotas de hosting**: validar no ambiente publicado a precedência real de `/sabores` e `/onde-ficar` (arquivo vs diretório-ponte), decidir a fonte única de verdade de cada seção e, na sequência, tratar canonical dinâmico de `local.html` e o destino das páginas suspensas. Requer acesso ao ambiente publicado / config de hosting.
