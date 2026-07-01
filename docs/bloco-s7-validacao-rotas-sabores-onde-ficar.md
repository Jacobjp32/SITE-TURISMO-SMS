# Bloco S7 — Validação das rotas `/sabores` e `/onde-ficar`

Data: 2026-07-01
Branch: `main`
Escopo: validar no ambiente publicado a precedência real de `/sabores` e `/onde-ficar` (página editorial vs página-ponte) e aplicar correção **mínima** apenas se o conflito se confirmasse. **Não commitado.**

## 1. Pré-condições

- `git status` inicial: **worktree limpo** (S6 já commitado em `7f90043`).
- Inspecionados: docs S6, sabores.html, sabores/index.html, onde-ficar/index.html, mapa-turistico.html, index.html, js/nav-shared.js, translations.js, sitemap.xml, robots.txt, sw.js, js/site-meta.js, scripts/audit-links.mjs, firebase.json, .firebaserc.

## 2. Testes no ambiente publicado (autoritativo)

`Invoke-WebRequest` contra `https://turismo.saomateusdosul.pr.gov.br`:

### `/sabores`

| URL | HTTP | Redirect servidor | title | canonical | ponte? | conteúdo |
| --- | --- | --- | --- | --- | --- | --- |
| `/sabores` | 200 | não | **Sabores de São Mateus \| Gastronomia Polonesa** | `/sabores` | não | **Editorial** (32.985 B) |
| `/sabores/` | 200 | não | Sabores \| São Mateus do Sul | `/mapa-turistico.html?categoria=Gastronomia` | **sim** | Ponte→mapa, `noindex`, meta-refresh + `location.replace` (3.166 B) |
| `/sabores.html` | 200 | não | Sabores de São Mateus \| Gastronomia Polonesa | `/sabores` | não | **Editorial** (32.985 B) |

### `/onde-ficar`

| URL | HTTP | title | canonical | ponte? | conteúdo |
| --- | --- | --- | --- | --- | --- |
| `/onde-ficar` | 200 | **Onde Ficar \| Hospedagem em São Mateus do Sul** | `/onde-ficar` | não | **Editorial** (17.297 B) |
| `/onde-ficar/` | 200 | Onde Ficar \| São Mateus do Sul | `/mapa-turistico.html?categoria=Hospedagem` | **sim** | Ponte→mapa, `noindex` (3.150 B) |
| `/onde-ficar.html` | 200 | Onde Ficar \| Hospedagem em São Mateus do Sul | `/onde-ficar` | não | **Editorial** (17.297 B) |

**Conclusão:** em produção, o host aplica **arquivo-antes-de-diretório (clean URLs)** — `/sabores` serve `sabores.html` e `/onde-ficar` serve `onde-ficar.html`. As páginas-ponte só respondem na variante **com barra final** (`/sabores/`, `/onde-ficar/`), que são `noindex` e canonicalizam para o mapa.

## 3. Teste local (contraste)

`python -m http.server` (servidor estático simples), na raiz do projeto:

| URL | Local (plain server) | Produção |
| --- | --- | --- |
| `/sabores` | **301 → `/sabores/`** → ponte | 200 → **editorial** |
| `/sabores/` | 200 → ponte | 200 → ponte |
| `/sabores.html` | 200 → editorial | 200 → editorial |
| `/onde-ficar` | **301 → `/onde-ficar/`** → ponte | 200 → **editorial** |
| `/onde-ficar/` | 200 → ponte | 200 → ponte |

**Observação:** um servidor estático genérico usa **diretório-primeiro** (redireciona `/sabores` → `/sabores/`), comportamento **oposto** ao de produção. Portanto o teste local **não replica** o hosting real e daria um resultado enganoso ("ponte vence"). O comportamento publicado é a fonte da verdade.

`firebase.json` **não possui seção `hosting`** — o domínio gov.br é servido por outro hosting, cuja regra de clean URLs não está versionada no repositório. Por isso a validação foi feita por HTTP direto contra produção.

## 4. Verificações de suporte

- **Nenhum link interno usa barra final** para essas rotas: `grep` por `/sabores/` e `/onde-ficar/` como link → 0 ocorrências. O menu (`js/nav-shared.js`) usa `/sabores` (sem barra) → editorial. Ninguém é roteado às pontes pela navegação.
- **Hashes preservados:** `sabores.html` contém todos os alvos — `#polonesa` (`<section id="polonesa">`), `#erva-mate` (`<div id="erva-mate">`), `#feiras` (`<section id="feiras">`), `#restaurantes` (`<section id="restaurantes">`), botões `data-filter` (S4C) e JS de tratamento de hash (linha ~595). Como `/sabores` serve a editorial, `/sabores#polonesa|#erva-mate|#feiras|#restaurantes` funcionam (o hash é resolvido no cliente sobre a página editorial).

## 5. Classificação do conflito

- **`/sabores`: ATIVO E CORRETO — falso alarme confirmado.** A URL canônica/menu (`/sabores`, sem barra) serve a página editorial, coerente com canonical (`/sabores`) e sitemap (`/sabores`). A ponte é apenas um fallback `noindex` na variante com barra.
- **`/onde-ficar`: PONTE INTENCIONAL + PÁGINA EDITORIAL REAL EXISTENTE.** Existe `onde-ficar.html` editorial real, servida em `/onde-ficar` (coerente com canonical e sitemap). A ponte `onde-ficar/index.html` só responde em `/onde-ficar/` (`noindex` → mapa/hospedagem). Sem conflito na URL canônica.

## 6. Alterações feitas

**Nenhuma alteração de código.** Conforme a Tarefa 4 ("Se `/sabores` já abrir corretamente a página editorial, NÃO alterar") e Tarefa 5 (ponte intencional pode permanecer, documentar). O único diff são os relatórios auto-gerados em `docs/auditoria-output/*` (regenerados pela suíte de audits) e este documento novo.

- `sabores.html` — **não alterado**.
- `sabores/index.html` — **não alterado** (ponte `noindex` permanece como fallback de compatibilidade com barra).
- `onde-ficar.html` / `onde-ficar/index.html` — **não alterados**.
- `sitemap.xml`, `robots.txt`, `sw.js`, canonicais — **não alterados**.

## 7. Hashes preservados

`/sabores#polonesa`, `/sabores#erva-mate`, `/sabores#feiras`, `/sabores#restaurantes` — **preservados e funcionais** (âncoras presentes em `sabores.html`, servida em `/sabores`). Filtros de gastronomia no mapa continuam via `/mapa-turistico.html?categoria=Gastronomia` (usados pela ponte e por links do site).

## 8. Canonical / sitemap / robots / SW

- **Canonical:** coerente. `/sabores`→`/sabores`, `/onde-ficar`→`/onde-ficar` (self, editorial). Pontes canonicalizam para o mapa e são `noindex`. **Nenhuma alteração necessária.**
- **Sitemap:** já usa URLs limpas corretas (`/sabores`, `/onde-ficar`) que servem as editoriais. **Nenhuma alteração.**
- **robots.txt:** **não alterado**; não foi usado como canonicalização.
- **sw.js:** HTML e navegações nunca são cacheados (retorno antecipado em `mode==='navigate'` e `.html` em `NEVER_CACHE_EXT`) — não interferiu nos testes nem nas rotas. **Nenhuma alteração.**

## 9. Validações executadas

- `node --check js/nav-shared.js` — OK
- `node --check js/site-meta.js` — OK
- `node --check translations.js` — OK
- `node --check sw.js` — OK
- `node scripts/audit-links.mjs` — **665 links, 0 broken**, 1 falso positivo conhecido, 20 legados.
- `node scripts/audit-assets.mjs` — 226 media, 0 duplicadas, 0 refs faltando.
- `node scripts/audit-project.mjs` — 412 files, 36 html, 23 css, 46 js.

## 10. Validação manual recomendada

1. `/sabores`, `/sabores/`, `/sabores.html` → confirmar editorial em `/sabores` e `/sabores.html`; ponte em `/sabores/`.
2. `/sabores#polonesa|#erva-mate|#feiras|#restaurantes` → rolar até a seção correta / filtro ativo.
3. `/onde-ficar`, `/onde-ficar/` → editorial vs ponte.
4. Menu principal → "Sabores locais" leva à editorial.
5. Canonical via view-source em `/sabores` e `/onde-ficar`.
6. Confirmar hero/vídeo intacta, mapa 3D não reintroduzido, admin não alterado.

## 11. Riscos

- **Nenhum risco introduzido** — não houve mudança de código-fonte. O estado validado já é o correto em produção.
- Risco residual (pré-existente, baixo): se alguém compartilhar a URL **com barra** (`/sabores/`), cai na ponte→mapa em vez da editorial. Como é `noindex` e não é linkada internamente, o impacto é marginal. Mitigação opcional (fase futura, ver §13).

## 12. Rollback

- Não aplicável a código (nenhuma alteração). Para reverter a regeneração dos relatórios de auditoria: `git checkout -- docs/auditoria-output/`.

## 13. Próxima etapa recomendada

- **Opcional/baixa prioridade:** uniformizar as pontes com barra. Como `/sabores` e `/onde-ficar` já servem editorial, converter `sabores/index.html` e `onde-ficar/index.html` em **passthrough Tipo A** (redirect para `../sabores.html`/`../onde-ficar.html` preservando query+hash) eliminaria a divergência da variante com barra e preservaria os hashes. Só fazer com decisão explícita — não é necessário para corretude atual.
- Retomar itens pendentes do S6: canonical dinâmico em `local.html` (por `?id`) e destino das páginas suspensas `mapa-3d`/`mapa-completo`/`roteiro-ia` no sitemap/menus.
