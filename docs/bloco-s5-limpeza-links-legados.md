# Bloco S5 — Limpeza de links legados/redundantes

Data: 2026-07-01
Branch: `main`
Escopo: limpeza técnica de links legados/redundantes/quebrados apontados pelos audits, **sem alteração de escopo visual** do site. Não commitado.

## 1. Pré-condições

- `git status` no início: **worktree limpo**.
- Audits rodados e inspecionados antes de qualquer alteração:
  - `node scripts/audit-links.mjs`
  - `docs/auditoria-output/links-report.json`
  - `docs/auditoria-output/links-report.md`

## 2. Totais de links (antes / depois)

| Métrica | Antes | Depois |
| --- | --- | --- |
| Links coletados | 663 | 663 |
| Links quebrados | 1 | 0 |
| Falsos positivos conhecidos | — (inexistente) | 1 |
| Legados/concorrentes | 20 | 20 |
| Redundantes com `.html` | 21 | 21 |
| Decisões humanas | 17 | 17 |

Nenhum link foi adicionado ou removido do site. A queda de "quebrados" de 1→0 vem da reclassificação do único achado como falso positivo conhecido (ver §3), não de remoção de link real.

## 3. Link quebrado analisado

- **Achado:** `js/admin/modules/banners.js → /banners/` — "rota interna inexistente".
- **Investigação:**
  - Ocorrência única em [js/admin/modules/banners.js:281](../js/admin/modules/banners.js): `var path = "cms-media/" + uid + "/banners/" + bannerId + "/" + filename;`.
  - O extrator do audit (`stringPattern`) captura o literal `"/banners/"` como se fosse uma URL interna iniciada por `/`. Na verdade é um **fragmento do caminho de upload do Firebase Storage** (`cms-media/{uid}/banners/{bannerId}/{arquivo}`, rules 4B), montado por concatenação de strings.
  - Não é link de UI, não é placeholder navegável, não é rota futura pública. É **falso positivo** do audit.
- **Decisão:** **não** mexer no código do admin (painel pausado; correção não exige arquitetura do admin). Em vez disso, o falso positivo foi tratado no próprio audit para não poluir a categoria "quebrados".
- Referência cruzada: já estava listado como C4 em [docs/auditoria-site-publico-pos-4h.md](auditoria-site-publico-pos-4h.md). Agora esclarecido como falso positivo, não bug real.

## 4. Correções feitas

- **`scripts/audit-links.mjs`** — introduzida lista `knownFalsePositives` (com `source`, `url`, `reason`) e helper `isKnownFalsePositive()`. Achados que batem com a lista saem de `broken` e vão para uma nova coleção `falsePositives`, exposta em:
  - resumo do `.md` ("Falsos positivos conhecidos");
  - nova seção de tabela no `.md` (com a razão);
  - campos `falsePositives` e `knownFalsePositives` no `.json`;
  - `console.log` do script.

  Isso **não mascara problemas reais**: apenas o par exato `js/admin/modules/banners.js|/banners/` é excluído de "quebrados"; qualquer link genuinamente quebrado novo continua aparecendo normalmente.

Nenhuma correção de link em HTML/JS do site foi necessária: todos os demais achados são legado intencional, fora de escopo (URLs limpas) ou dependem de decisão humana (ver §5–§7).

## 5. Falsos positivos

| source | url | motivo |
| --- | --- | --- |
| js/admin/modules/banners.js | /banners/ | Fragmento de path do Storage montado por concatenação; não é rota. |

## 6. Links legados mantidos de propósito

Os 20 achados "legados/concorrentes" são, na prática, **URLs limpas intencionais** (decisões dos blocos S4/S4B/S4C) que resolvem para rotas reais, ou auto-referências de páginas. Foram mantidos:

- `/sabores`, `/o-que-fazer`, `/onde-ficar`, `/rotas-completas` em `index.html`, `js/nav-shared.js`, `js/breadcrumbs.js` e nas próprias páginas: URLs limpas que existem no mapa de rotas (`/sabores` → `sabores.html`, etc.). Remover quebraria navegação.
- Filtros/atalhos preservados por compatibilidade (S4/S4B/S4C): `/sabores#polonesa`, `#erva-mate`, `#feiras`, `#restaurantes`, `mapa-turistico.html?grupo=roteiros`, `mapa-turistico.html?categoria=...`. **Não removidos.**

## 7. Redundância `.html` vs URL limpa (fora de escopo)

Os 21 achados "redundantes com .html" são coexistência de variantes `.html` e limpa (ex.: `eventos/index.html → /eventos.html` enquanto o nav usa `/eventos/`). A **estratégia definitiva de URLs limpas, canonical e redirects é um bloco futuro** — nada foi migrado agora. `sw.js`, `manifest.json` e módulos admin/CMS mantidos como estão.

## 8. Itens que dependem de decisão futura

- **Fluxo `/local?id=...`** (17 achados "decisão humana"): manter página individual `local.html` ou migrar para modal/mapa. Não decidido neste bloco.
- **Páginas suspensas** `mapa-3d`, `mapa-completo`, `roteiro-ia`: existem como arquivo (`mapa-3d.html`, `mapa-completo.html`, `roteiro-ia.html`), estão no `sitemap.xml` (linhas 115/122/129) e em `js/breadcrumbs.js` (labels). **Não removidas** do sitemap nem dos menus — reservado para o bloco de SEO/URLs, requer confirmação explícita.

## 9. Arquivos alterados

- `scripts/audit-links.mjs` — classificação de falso positivo conhecido.
- `docs/auditoria-output/links-report.json` — regenerado (agora `broken: 0`, `falsePositives: 1`).
- `docs/auditoria-output/links-report.md` — regenerado (nova seção).
- `docs/bloco-s5-limpeza-links-legados.md` — este documento.

Não alterados: hero/vídeo, mapa 3D, painel admin, Firestore Rules, Storage Rules, sitemap, robots.txt, service worker, canonical/redirects, `local.html`, mídia pesada, nenhum HTML/JS público.

## 10. Validações

- `node --check js/nav-shared.js` — OK
- `node --check translations.js` — OK
- `node --check js/site-meta.js` — OK
- `node --check scripts/audit-links.mjs` — OK
- `node scripts/audit-links.mjs` — 663 links, **0 broken**, 1 known false positive, 20 legacy/redundant.
- `node scripts/audit-assets.mjs` — 226 media, 0 duplicate groups, 0 missing references.
- `node scripts/audit-project.mjs` — 410 files, 36 html, 23 css, 46 js.

## 11. Validação manual recomendada

1. Abrir home; testar menu principal, Explore, Sabores, Sobre.
2. Confirmar filtros preservados: `/sabores#polonesa`, `#erva-mate`, `#feiras`, `#restaurantes`, `mapa-turistico.html?grupo=roteiros`, `mapa-turistico.html?categoria=Gastronomia`.
3. Confirmar que hero/vídeo não mudou.
4. Confirmar que mapa 3D não foi reintroduzido.
5. Confirmar que o admin não foi reaberto como novo módulo.

## 12. Riscos

- **Baixo.** Nenhuma mudança em código público ou de runtime; a única alteração de comportamento é no script de auditoria.
- Risco residual: a lista `knownFalsePositives` poderia, se mal mantida, esconder um link realmente quebrado. Mitigado por casar o par exato `source|url` e por listar o item numa seção própria do relatório (visível, não silencioso).

## 13. Rollback

- Reverter `scripts/audit-links.mjs` para a versão anterior e rodar `node scripts/audit-links.mjs` para regenerar os relatórios; ou
- Como nada foi commitado, `git checkout -- scripts/audit-links.mjs docs/auditoria-output/links-report.*` restaura o estado anterior (evitar comandos destrutivos amplos; não usado por instrução do bloco).

## 14. Próxima etapa recomendada

Bloco de **SEO / URLs limpas**: decidir a estratégia definitiva (limpa vs `.html`), canonical, redirects e ajuste de `sw.js`/sitemap, resolvendo de uma vez os 21 redundantes, o fluxo `/local?id=` (17) e o destino das páginas suspensas `mapa-3d`/`mapa-completo`/`roteiro-ia`.
