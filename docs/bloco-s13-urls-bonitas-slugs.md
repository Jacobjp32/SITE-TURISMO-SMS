# Bloco S13 — URLs bonitas e preparação de slugs

Data: 2026-07-06
Escopo: padronização segura de links internos para URLs limpas e preparação documental para slugs de locais. **Não commitado.** Sem deploy, sem alteração de admin/portal, sem rules, sem remover páginas `.html`, sem mapa 3D e sem migração definitiva para `/local/<slug>`.

## 1. Pré-condições

- `git status --short` inicial: **worktree limpo**. O Git exibiu apenas aviso de permissão ao ler o ignore global em `C:\Users\jacob/.config/git/ignore`.
- Inspecionados: `sitemap.xml`, `robots.txt`, `index.html`, `eventos.html`, `mapa-turistico.html`, `sabores.html`, `noticias.html`, `o-que-fazer.html`, `onde-ficar.html`, `galeria.html`, `local.html`, `rotas-completas.html`, `mapa-completo.html`, `mapa-3d.html`, `roteiro-ia.html`, `js/nav-shared.js`, `js/site-meta.js`, `js/breadcrumbs.js`, `js/search-index.js`, `js/locais-data.js`, `js/mapa-turistico.js`, `js/data/*.js`, `sw.js`, `config.js`, `translations.js`, `docs/bloco-s6-seo-urls-canonical.md`, `docs/bloco-s7-validacao-rotas-sabores-onde-ficar.md`, `docs/bloco-s10-saneamento-dados-locais.md`, `scripts/audit-links.mjs` e `scripts/audit-project.mjs`.

## 2. Estado anterior mapeado

### Páginas `.html` reais

`404.html`, `admin-firebase.html`, `eventos.html`, `galeria.html`, `index.html`, `local.html`, `mapa-3d.html`, `mapa-completo.html`, `mapa-turistico.html`, `noticia.html`, `noticias.html`, `o-que-fazer.html`, `offline.html`, `onde-ficar.html`, `para-o-trade.html`, `portal-usuario.html`, `privacidade.html`, `reservas.html`, `rotas-completas.html`, `roteiro-ia.html`, `sabores.html`, `transparencia.html`.

### Stubs `pagina/index.html`

`eventos/index.html`, `galeria/index.html`, `local/index.html`, `mapa-3d/index.html`, `mapa-completo/index.html`, `noticia/index.html`, `noticias/index.html`, `o-que-fazer/index.html`, `onde-ficar/index.html`, `portal-usuario/index.html`, `privacidade/index.html`, `rotas-completas/index.html`, `sabores/index.html`, `transparencia/index.html`.

### Links internos com `.html`

O inventário inicial encontrou links internos para `/mapa-turistico.html` e variações com query em:

- `index.html`
- `mapa-turistico.html`
- `noticias.html`
- `o-que-fazer.html`
- `local.html`
- `rotas-completas.html`
- `js/nav-shared.js`
- `js/search-index.js`
- `js/mapa-turistico.js`
- `js/data/hospedagens.js`
- `js/data/informacoes-essenciais.js`
- `js/data/restaurantes.js`
- `js/data/rotas.js`

Também havia comentário antigo em `js/locais-data.js` citando `local.html?id=<slug>`.

### Links internos limpos já existentes

Antes do S13 já existiam links limpos para `/eventos`, `/eventos/`, `/sabores`, `/noticias`, `/galeria`, `/transparencia`, `/portal-usuario`, `/reservas` e fichas em `/local?id=<id>`.

### Links com query preservados

- `/local?id=...`
- `/mapa-turistico?grupo=roteiros`
- `/mapa-turistico?grupo=pontos-turisticos`
- `/mapa-turistico?categoria=Gastronomia`
- `/mapa-turistico?categoria=Hospedagem`
- `/mapa-turistico?categoria=Cultura`
- `/mapa-turistico?categoria=Natureza`
- `/mapa-turistico?categoria=Eventos`

O padrão legado `/mapa-turistico.html?grupo=...` e `/mapa-turistico.html?categoria=...` foi substituído internamente por `/mapa-turistico?grupo=...` e `/mapa-turistico?categoria=...`.

## 3. Canonical e sitemap

Canonicals atuais das páginas principais após o S13:

| Página | Canonical |
| --- | --- |
| `index.html` | `/` |
| `eventos.html` | `/eventos` |
| `mapa-turistico.html` | `/mapa-turistico` |
| `sabores.html` | `/sabores` |
| `noticias.html` | `/noticias` |
| `o-que-fazer.html` | `/o-que-fazer` |
| `onde-ficar.html` | `/onde-ficar` |
| `galeria.html` | `/galeria` |
| `local.html` | `/local` inicial, atualizado dinamicamente para `/local?id=<id>` quando a ficha carrega |
| `rotas-completas.html` | `/mapa-turistico?grupo=roteiros` |
| `mapa-completo.html` | ausente |
| `mapa-3d.html` | `/mapa-3d` |
| `roteiro-ia.html` | `/roteiro-ia` |

O sitemap continua usando URLs limpas:

`/`, `/eventos`, `/mapa-turistico`, `/galeria`, `/noticias`, `/sabores`, `/onde-ficar`, `/reservas`, `/para-o-trade`, `/transparencia`, `/local`, `/o-que-fazer`, `/rotas-completas`, `/mapa-completo`, `/mapa-3d`, `/roteiro-ia`.

Alteração feita no sitemap:

- Comentário das páginas legadas ajustado para "legadas/compatibilidade", sem afirmar que todas redirecionam.
- `lastmod` de `/rotas-completas` atualizado para `2026-07-06`, porque a página teve canonical e redirect/refresh alterados.

Não houve alteração em massa de sitemap.

## 4. Padrão canônico definido no S13

- Navegação pública deve preferir URLs limpas sem barra final quando já coerentes com canonical/sitemap e validadas em blocos anteriores:
  `/eventos`, `/mapa-turistico`, `/sabores`, `/noticias`, `/onde-ficar`, `/galeria`, `/o-que-fazer`.
- Queries/filtros são preservados quando fazem parte do fluxo atual:
  `/mapa-turistico?grupo=...`, `/mapa-turistico?categoria=...`, `/sabores#...`.
- Fichas de locais continuam em `/local?id=<id>`.
- `local.html?id=<id>` continua aceito por compatibilidade por causa do arquivo real e do stub `/local`.
- `/local/<slug>` ou `/atrativos/<slug>` **não foi implementado** neste bloco.

## 5. Links corrigidos

Arquivos ajustados:

- `index.html`: menus, atalhos mobile, hero, chips, cards, CTAs, blocos de experiência e rodapé.
- `mapa-turistico.html`: CTAs do topo do mapa.
- `noticias.html`: links de categorias para gastronomia e mapa.
- `o-que-fazer.html`: cards e rodapé da página ponte.
- `local.html`: erro amigável, CTAs "ver/voltar ao mapa", rodapé e fallback de `voltarAoMapa`.
- `rotas-completas.html`: canonical, meta refresh, cards, rodapé e `window.location.replace`.
- `js/nav-shared.js`: navegação compartilhada e atalhos mobile.
- `js/search-index.js`: resultados de busca e fallbacks.
- `js/mapa-turistico.js`: URLs estruturais do mapa.
- `js/data/hospedagens.js`, `js/data/informacoes-essenciais.js`, `js/data/restaurantes.js`, `js/data/rotas.js`: URLs de dados auxiliares.
- `js/locais-data.js`: comentário técnico atualizado para `/local?id=<slug>`.

Resultado pós-ajuste no conjunto inspecionado:

- Links internos com `.html`: `0`.
- Links internos limpos mapeados: `189`.
- Links internos com query preservada: `86`.

## 6. Tratamento de `/local?id=`

- Padrão interno mantido: `/local?id=<id>`.
- `local.html?id=<id>` não foi removido nem bloqueado.
- Alias da Casa da Memória preservado:
  - `/local?id=casa-da-memoria` continua sendo o id canônico.
  - `/local?id=casa-memoria-padre-bauer` continua resolvendo via `window.locaisAliases` e canonicaliza para `casa-da-memoria`.
- O S13 não altera dados turísticos nem ids.

## 7. Plano futuro para slugs

Próximo bloco específico deve tratar, com validação de hosting:

- Escolher padrão público: `/local/<slug>` ou `/atrativos/<slug>`.
- Definir fallback/rewrite no hosting para reload e compartilhamento direto.
- Criar redirect seguro de `/local?id=<id>` para slug, preservando compatibilidade.
- Implementar canonical dinâmico por ficha já no formato final.
- Atualizar geradores de link, busca, mapa e dados.
- Manter tabela de aliases para slugs legados.
- Validar comportamento publicado antes de trocar sitemap de fichas individuais.

## 8. Páginas suspensas/legadas

| Página | Classificação S13 | Ação |
| --- | --- | --- |
| `/mapa-3d` | Suspensa por decisão de projeto | Não reintroduzida, não removida, não alterada |
| `/mapa-completo` | Legado compatível com mapa 2D próprio | Não removido, link existente em `mapa-3d.html` preservado |
| `/roteiro-ia` | Legado/decisão humana pendente | Não alterado |
| `/rotas-completas` | Página legada consolidada no mapa | Mantida; canonical/refresh ajustados para `/mapa-turistico?grupo=roteiros` |

## 9. Datas e horários verificados

Verificados:

- `sitemap.xml`: `lastmod` das URLs.
- `js/site-meta.js`: `updatedAt: "2026-07-02T10:30:00-03:00"`.
- `config.js`: datas de campanha `dataInicio: '2026-09-17'` e `dataFim: '2026-09-21'`.
- Textos visíveis de atualização: rodapé via `data-site-meta-updated` em `index.html`.
- Docs anteriores: S6, S7 e S10.
- Páginas públicas alteradas: `index.html`, `mapa-turistico.html`, `noticias.html`, `o-que-fazer.html`, `local.html`, `rotas-completas.html`.

Atualizados:

- `docs/bloco-s13-urls-bonitas-slugs.md`: criado com data `2026-07-06`.
- `sitemap.xml`: `lastmod` de `/rotas-completas` para `2026-07-06`.

Não atualizados:

- `js/site-meta.js`: não atualizado para evitar anunciar atualização global do portal inteiro por uma padronização técnica de links.
- `config.js`: não relacionado ao bloco.
- `lastmod` de `/`, `/mapa-turistico`, `/noticias`, `/o-que-fazer`, `/local` e demais URLs alteradas só por links internos: não atualizado porque não houve mudança de conteúdo público principal ou canonical próprio dessas páginas.
- `sw.js`/`CACHE_NAME`: não atualizado porque HTML e navegação não são cacheados pelo service worker; a mudança não exige troca de cache.

## 10. Service Worker

`sw.js` não força `.html` e não interfere em clean URLs:

- navegações (`event.request.mode === 'navigate'`) retornam sem cache;
- `.html` está em `NEVER_CACHE_EXT`;
- caminhos sensíveis seguem excluídos.

Sem bug claro, `sw.js` não foi alterado.

## 11. Validações executadas

### Sintaxe

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node --check js/nav-shared.js
node --check js/site-meta.js
node --check js/search-index.js
node --check js/locais-data.js
node --check js/mapa-turistico.js
node --check translations.js
node --check sw.js
node --check js/data/hospedagens.js
node --check js/data/informacoes-essenciais.js
node --check js/data/restaurantes.js
node --check js/data/rotas.js
```

Resultado: **OK** em todos.

Scripts inline extraídos temporariamente de `index.html`, `mapa-turistico.html`, `noticias.html`, `o-que-fazer.html`, `local.html` e `rotas-completas.html`: **16 scripts OK** com `node --check`.

### Audits

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
```

Resultados:

- `audit-links`: 734 links, 0 quebrados, 1 falso positivo conhecido, 33 candidatos legado/redundante.
- `audit-assets`: 226 mídias, 0 grupos duplicados, 0 referências ausentes.
- `audit-project`: 429 arquivos, 36 HTML, 24 CSS, 47 JS.

### Validação publicada

`Invoke-WebRequest -Method Head` no domínio publicado confirmou HTTP 200 para:

- `/`
- `/eventos` e `/eventos.html`
- `/mapa-turistico` e `/mapa-turistico.html`
- `/mapa-turistico?grupo=roteiros` e `/mapa-turistico.html?grupo=roteiros`
- `/mapa-turistico?grupo=pontos-turisticos`
- `/mapa-turistico?categoria=Gastronomia`, `/mapa-turistico?categoria=Hospedagem`, `/mapa-turistico?categoria=Cultura`, `/mapa-turistico?categoria=Natureza`, `/mapa-turistico?categoria=Eventos`
- `/mapa-turistico.html?categoria=Gastronomia`
- `/sabores`, `/sabores.html`, `/sabores#polonesa`, `/sabores#erva-mate`, `/sabores#feiras`, `/sabores#restaurantes`
- `/noticias` e `/noticias.html`
- `/onde-ficar` e `/onde-ficar.html`
- `/galeria` e `/galeria.html`
- `/local?id=casa-da-memoria`
- `/local?id=casa-memoria-padre-bauer`

Observação: a validação publicada confirma suporte das rotas atuais do hosting. O deploy deste diff ainda não foi feito.

## 12. Riscos

- A clean URL `/mapa-turistico?grupo=...` depende do mesmo comportamento de hosting que já serve `/mapa-turistico`.
- Servidor local estático simples pode se comportar diferente do hosting publicado, como já documentado no S7.
- URLs antigas `.html` continuam existindo, mas links internos agora deixam de divulgá-las.
- Slugs definitivos de locais ainda dependem de rewrite/redirect publicado e não devem ser simulados só com JS.

## 13. Rollback

Rollback restrito:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git diff -- docs/bloco-s13-urls-bonitas-slugs.md sitemap.xml index.html mapa-turistico.html noticias.html o-que-fazer.html local.html rotas-completas.html js/nav-shared.js js/search-index.js js/locais-data.js js/mapa-turistico.js js/data/hospedagens.js js/data/informacoes-essenciais.js js/data/restaurantes.js js/data/rotas.js
```

Para reverter manualmente, desfazer somente as trocas `/mapa-turistico` ⇄ `/mapa-turistico.html` nos arquivos listados e remover este documento. Não usar `git reset` amplo.

## 14. Próxima etapa recomendada

Bloco futuro S14: validar e desenhar a migração de fichas individuais para `/local/<slug>` ou `/atrativos/<slug>` com fallback real de hosting, redirects, canonical dinâmico final e plano de compatibilidade para `/local?id=`.
