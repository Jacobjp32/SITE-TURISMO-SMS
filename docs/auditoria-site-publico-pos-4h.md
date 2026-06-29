# Auditoria do Site Público — Pós-Bloco 4H
**Bloco S1 · Gerado em: 2026-06-29**

---

## Resumo Executivo

Auditoria técnica e visual do site público de turismo de São Mateus do Sul após a conclusão dos módulos de Banners e Pop-ups (Blocos 4F/4G/4H). O worktree estava limpo ao início. Foram inspecionados 22 HTMLs na raiz, 14 diretórios com `index.html`, 46 scripts JS, 23 arquivos CSS e 225 mídias. Os scripts de auditoria varreram 664 links, identificaram 1 link quebrado, 18 legados, 21 redundantes com `.html` e 17 pontos de decisão humana. Os banners e pop-ups públicos não quebraram layout em nenhuma página. Os principais pontos de atenção estão nos dados incompletos de locais (mapsUrl), no menu com itens duplicados, em arquivos pesados sem uso e na ausência do mapa turístico no sitemap.

---

## 1. Problemas Críticos

| ID | Problema | Arquivo | Impacto |
|----|----------|---------|---------|
| C1 | `mapa-turistico.html` ausente do `sitemap.xml` | sitemap.xml | SEO — página mais importante do site não indexada |
| C2 | `mapsUrl: 'https://maps.app.goo.gl/exemplo'` na Igreja Matriz | js/locais-data.js:25 | Botão "Ver no Google Maps" abre URL inválida |
| C3 | 13 locais com `mapsUrl: null` | js/locais-data.js:71,94,117... | Botão de maps exibido mas sem destino |
| C4 | Link quebrado `/banners/` no módulo admin | js/admin/modules/banners.js | Rota inexistente no admin (painel) |

---

## 2. Problemas Médios

| ID | Problema | Arquivo/Local | Impacto |
|----|----------|---------------|---------|
| M1 | Menu: "Roteiros" e "Experiências" apontam para o mesmo URL | js/nav-shared.js:51,53 | Confusão de navegação; link redundante visível |
| M2 | Menu: "Gastronomia Polonesa", "Restaurantes" e "Produtos Locais" = mesmo URL | js/nav-shared.js:60–63 | 3 itens sem distinção real no dropdown |
| M3 | Menu: "São Mateus do Sul", "História" e "Xisto" = `/#sobre` | js/nav-shared.js:89,90,93 | 3 itens de menu colapsados no mesmo anchor |
| M4 | Menu: "Como Chegar" aponta para `/mapa-turistico.html` sem filtro | js/nav-shared.js:79 | Não comunica rotas de acesso |
| M5 | 17 links `/local?id=…` sem decisão: manter página ou migrar para modal | index.html, js/data/pontos-turisticos.js, js/data/restaurantes.js | Fluxo legado incerto; duplica com mapa |
| M6 | 21 links redundantes com `.html` (sw.js, manifest.json, dir-indexes) | sw.js:143, manifest.json, index dirs | URLs inconsistentes; manifesto PWA com link .html |
| M7 | 79 imagens órfãs sem referência no código | images/ | Peso desnecessário no repositório |
| M8 | 4 PNGs órfãos críticos acima de 3 MB: EU_AMO_SMS.png (4,9 MB), CASA_DA_MEMORIA.png (4,8 MB), CHALE_DO_PRODUTOR_SEC_CULTURA.png (4,2 MB), IGREJA_COLONIA_IGUACU.png (3,7 MB) | images/ | Esses arquivos não são referenciados em nenhum lugar |
| M9 | 3 vídeos muito pesados no repositório: VIDEO_ABERTURA_4K.mp4 (93 MB), INSTITUCIONAL_POLONES.mp4 (92 MB), ROTA_DO_TURISMO.mp4 (87 MB) | videos/ | 280 MB de vídeo; sem lazy-load ou streaming |
| M10 | `sitemap.xml` com `lastmod: 2026-03-24` para todas as URLs | sitemap.xml | Data desatualizada em 3+ meses |
| M11 | `galeria.html` ausente do sitemap | sitemap.xml | Página pública de alto valor sem indexação direta |
| M12 | Imagens PNG de empreendimentos sem otimização: agrosamas-01.jpg (4,1 MB), nova-esperanca-01.jpg (3,2 MB), dona-bernardina-06.jpg (3,1 MB) | images/empreendimentos/ | Carregamento lento no mapa e na página local |
| M13 | `IGREJA_MATRIZ_1.png` (3,4 MB) no `PRECACHE_ASSETS` do Service Worker | sw.js:27 | Imagem enorme pré-cacheada em todas as instalações PWA |
| M14 | `translations.js` (193 KB) no `PRECACHE_ASSETS` | sw.js:21 | Arquivo grande cacheado na instalação; muda com frequência |
| M15 | Galeria duplicada: `praca-rio-iguacu` referencia `PRACA_DO_RIO_IGUACU.jpg` duas vezes | js/locais-data.js:85 | Imagem duplicada no carrossel da página local |

---

## 3. Problemas Baixos

| ID | Problema | Arquivo/Local | Impacto |
|----|----------|---------------|---------|
| B1 | Emojis em `<h1>` sem `aria-hidden` | sabores.html:91, noticias.html:56, o-que-fazer.html:29, rotas-completas.html:22 | Leitores de tela lêem o emoji literal |
| B2 | `robots.txt` bloqueia `/admin-firebase` (sem `.html`) mas o arquivo real é `admin-firebase.html` | robots.txt:7 | Divergência; .html na raiz pode ser indexada |
| B3 | Mascotes webp: audit-assets reporta dimensões absurdas (306945×4997377 px) | images/mascotes/*.webp | Bug no leitor VP8X do script; arquivos são válidos (152–92 KB) |
| B4 | 18 links legados/concorrentes apontando para páginas bridge (`/sabores`, `/o-que-fazer`, `/onde-ficar`, `/rotas-completas`, `/mapa-completo`, `/mapa-3d`) | js/breadcrumbs.js, mapa-3d.html | Rotas bridge persistem no índice de breadcrumbs |
| B5 | `mapa-turistico.html` sem CSP inline (só via arquivo `_headers`) | mapa-turistico.html | Proteção depende exclusivamente do servidor |
| B6 | `local.html` sem `<link rel="canonical">` nem `<meta name="description">` dinâmicos | local.html | SEO fraco para páginas de locais individuais |
| B7 | `images/diorama_sao_mateus.png` (1,4 MB) e `.webp` ambos existem; PNG ainda referenciado | index.html, galeria.html | Deveria usar só o webp |
| B8 | `IMIGRANTES_IA_*.png` (1,2–1,4 MB) sem versão webp em uso | galeria.html | Sem formato moderno nas versões de produção |
| B9 | Search Action no schema.org aponta para parâmetro `?q=` mas a busca usa modal JS | index.html:119 | Schema inconsistente com o comportamento real |

---

## 4. Páginas Auditadas

| Página | Arquivo | Status | Banners Slot | Notas |
|--------|---------|--------|--------------|-------|
| Home | index.html | ✅ OK | ✅ Sim | 144 KB; completo com SEO, schema, skip links |
| Eventos | eventos.html | ✅ OK | ✅ Sim | 50 KB; CSP inline ✓ |
| Mapa Turístico | mapa-turistico.html | ✅ OK | ✅ Sim | Sem CSP inline; ausente do sitemap |
| Sabores | sabores.html | ✅ OK | ✅ Sim | 30 KB; emoji em h1 sem aria-hidden |
| Notícias | noticias.html | ✅ OK | ✅ Sim | Emoji em h1 sem aria-hidden |
| O Que Fazer | o-que-fazer.html | ⚠️ Bridge | ❌ Não | Página legada mantida por compat. |
| Local | local.html | ⚠️ Pendente | ❌ Não | Fluxo ?id= sem decisão definida |
| Rotas Completas | rotas-completas.html | ⚠️ Redirect | ❌ Não | Redireciona p/ mapa em 4s |
| Galeria | galeria.html | ✅ OK | ❌ Não | 37 KB; 3 vídeos pesados |
| Onde Ficar | onde-ficar.html | ⚠️ Legada | ❌ Não | Deveria ser bridge ou redirecionar |
| Transparência | transparencia.html | ✅ OK | ❌ Não | Conteúdo institucional |
| Privacidade | privacidade.html | ✅ OK | ❌ Não | |
| Para o Trade | para-o-trade.html | ✅ OK | ❌ Não | |
| Portal Usuário | portal-usuario.html | ✅ OK | ❌ Não | Auth; bloqueado no robots.txt |
| Mapa 3D | mapa-3d.html | ⚠️ Legado | ❌ Não | Redireciona para mapa-turistico |
| Mapa Completo | mapa-completo.html | ⚠️ Legado | ❌ Não | Redireciona para mapa-turistico |
| Roteiro IA | roteiro-ia.html | ⚠️ Legado | ❌ Não | Funcionalidade não ativa |
| Reservas | reservas.html | ⚠️ Legado | ❌ Não | Funcionalidade não ativa |
| 404 | 404.html | ✅ OK | ❌ Não | |
| Offline | offline.html | ✅ OK | ❌ Não | |

---

## 5. Mapa de Menus Atuais (nav-shared.js)

```
Início → /

Explore ▼
  Mapa Turístico        → /mapa-turistico.html
  Pontos Turísticos     → /mapa-turistico.html?grupo=pontos-turisticos
  Roteiros              → /mapa-turistico.html?grupo=roteiros
  Galeria               → /galeria
  Experiências          → /mapa-turistico.html?grupo=roteiros  ← DUPLICADO de "Roteiros"

Sabores ▼
  Gastronomia Polonesa  → /mapa-turistico.html?categoria=Gastronomia
  Erva-mate             → /mapa-turistico.html?grupo=roteiros
  Restaurantes          → /mapa-turistico.html?categoria=Gastronomia  ← DUPLICADO
  Produtos Locais       → /mapa-turistico.html?categoria=Gastronomia  ← DUPLICADO

Agenda ▼
  Eventos               → /eventos/
  Notícias              → /noticias

Planeje sua Visita ▼
  Onde Ficar            → /mapa-turistico.html?categoria=Hospedagem
  Como Chegar           → /mapa-turistico.html  ← sem filtro; não orienta rotas de acesso
  Informações Essenciais → /#visitor-guide-title
  Previsão do Tempo     → /#weather-title
  Contato               → /#contato

Sobre ▼
  São Mateus do Sul     → /#sobre  ← TODOS no mesmo anchor
  História              → /#sobre  ← DUPLICADO
  Capital Polonesa      → /mapa-turistico.html?categoria=Cultura
  Terra da Erva-mate    → /mapa-turistico.html?grupo=roteiros
  Xisto                 → /#sobre  ← DUPLICADO
  Institucional         → /transparencia

[Busca] [Área Restrita] [PT/EN/ES/PL]
```

### Duplicações no menu (3 grupos)

| Grupo | Itens duplicados | URL compartilhada |
|-------|-----------------|-------------------|
| Explore | Roteiros + Experiências | `/mapa-turistico.html?grupo=roteiros` |
| Sabores | Gastronomia Polonesa + Restaurantes + Produtos Locais | `/mapa-turistico.html?categoria=Gastronomia` |
| Sobre | São Mateus do Sul + História + Xisto | `/#sobre` |

---

## 6. URLs com `.html` em Links Internos

| Fonte | URL com .html | Observação |
|-------|---------------|------------|
| manifest.json | `/eventos.html?utm_source=pwa-shortcut` | PWA shortcut usa .html |
| sw.js:143 | `/portal-usuario.html` | Lista de rotas sensíveis |
| eventos/index.html | `/eventos.html` | Dir-index auto-gerado |
| galeria/index.html | `/galeria.html` | Dir-index auto-gerado |
| local/index.html | `/local.html` | Dir-index auto-gerado |
| mapa-3d/index.html | `/mapa-3d.html` | Dir-index auto-gerado |
| mapa-completo/index.html | `/mapa-completo.html` | Dir-index auto-gerado |
| noticia/index.html | `/noticia.html` | Dir-index auto-gerado |
| noticias/index.html | `/noticias.html` | Dir-index auto-gerado |
| o-que-fazer/index.html | `/o-que-fazer.html` | Dir-index auto-gerado |
| portal-usuario/index.html | `/portal-usuario.html` | Dir-index auto-gerado |
| privacidade/index.html | `/privacidade.html` | Dir-index auto-gerado |
| rotas-completas/index.html | `/rotas-completas.html` | Dir-index auto-gerado |
| transparencia/index.html | `/transparencia.html` | Dir-index auto-gerado |

> **Nota:** Links `.html` nos `FILE_TO_PLACEMENT` do `public-banners.js` são corretos — fazem match com `pathname.split("/").pop()` na detecção de página, não são URLs de navegação.

---

## 7. Links Redundantes e Legados

**Legados/Concorrentes (18):** páginas bridge `o-que-fazer`, `sabores`, `onde-ficar`, `rotas-completas`, `mapa-completo`, `mapa-3d` ainda referenciadas em `js/breadcrumbs.js`.

**Fluxo `/local?id=...` (17 ocorrências):** Presente em `index.html` (6 locais), `js/data/pontos-turisticos.js` (6), `js/data/restaurantes.js` (1), `js/data/turismo-data-adapter.js` (template). Requer decisão: manter a página `local.html` individual ou substituir por painel lateral no mapa.

---

## 8. Arquivos Pesados

### Vídeos
| Arquivo | Tamanho | Usado em |
|---------|---------|----------|
| videos/VIDEO_ABERTURA_4K.mp4 | 93,5 MB | galeria.html |
| videos/INSTITUCIONAL_POLONES.mp4 | 92,5 MB | galeria.html |
| videos/ROTA_DO_TURISMO.mp4 | 87,7 MB | index.html |

> Total de vídeos: **~274 MB** no repositório. Sem compressão adaptativa ou CDN.

### Imagens pesadas em uso
| Arquivo | Tamanho | Usado em |
|---------|---------|----------|
| images/IGREJA_MATRIZ_1.png | 3,4 MB | index.html, galeria.html, sw.js PRECACHE |
| images/empreendimentos/nova-esperanca-equoterapia/nova-esperanca-equoterapia-01.jpg | 3,2 MB | js/rotas-data.js |
| images/empreendimentos/dona-bernardina/dona-bernardina-06.jpg | 3,1 MB | js/rotas-data.js |
| images/empreendimentos/agrosamas/agrosamas-02.jpg | 4,6 MB | js/data/eventos.js |
| images/empreendimentos/agrosamas/agrosamas-01.jpg | 4,1 MB | js/data/eventos.js |

### Imagens pesadas SEM USO (órfãs)
| Arquivo | Tamanho |
|---------|---------|
| images/EU_AMO_SMS.png | 4,9 MB |
| images/CASA_DA_MEMORIA.png | 4,8 MB |
| images/CHALE_DO_PRODUTOR_SEC_CULTURA.png | 4,2 MB |
| images/IGREJA_COLONIA_IGUACU.png | 3,7 MB |

> Total de imagens órfãs: **79 arquivos**. As 4 PNGs acima sozinhas somam 17,6 MB.

---

## 9. Dados Incompletos em Locais/Empreendimentos

### locais-data.js (14 locais cadastrados)

| Local | mapsUrl | Coordenadas | Problema |
|-------|---------|-------------|----------|
| Igreja Matriz São Mateus | `https://maps.app.goo.gl/exemplo` | ✅ ok | **Placeholder — URL inválida** |
| Igreja São José - Água Branca | ✅ ok | ✅ ok | — |
| Rua do Mathe | `null` | ✅ ok | Sem link de mapa |
| Praça do Rio Iguaçu | `null` | ✅ ok | Galeria duplica PRACA_DO_RIO_IGUACU.jpg |
| Prefeitura Municipal | `null` | ✅ ok | — |
| (outros 9 locais) | `null` | verificar | — |

> **13 de 14 locais** têm `mapsUrl` ausente ou placeholder.

### Dados de empreendimentos (js/data/*.js)
Não foi possível auditar completamente nesta rodada — avaliação completa de coordenadas, imagens e contatos dos empreendimentos nos arquivos de dados (`hospedagens.js`, `restaurantes.js`, `rotas-data.js`) deve ser executada no Bloco S2.

---

## 10. Banners e Pop-ups Públicos

**Status:** Implementação não quebrou nenhum layout. ✅

**Páginas com slot `#public-banners-slot`:**
- `index.html` ✅
- `eventos.html` ✅
- `mapa-turistico.html` ✅
- `noticias.html` ✅
- `sabores.html` ✅

**Cobertura do `FILE_TO_PLACEMENT`:** home, eventos, mapa, sabores, noticias — consistente com as 5 páginas que têm slot.

**Comportamento correto verificado:**
- Falha silenciosa se Firebase indisponível
- Sanitização XSS com `esc()` / `escAttr()` / `safeUrl()`
- Pop-up: foco no botão fechar, trap de Tab, ESC, `aria-modal`
- Frequência via sessionStorage/localStorage com fallback seguro

---

## 11. Acessibilidade Básica

| Aspecto | Status | Detalhes |
|---------|--------|----------|
| Skip links | ✅ | `#main-content`, `#navLinks`, `#footer` em todas as páginas via nav-shared.js |
| Barra eMAG | ✅ | Presente; atalhos de teclado Alt+1/2/4 |
| `aria-label` nos botões nav | ✅ | Toggle, busca, contraste, fonte, idioma |
| `aria-expanded` dropdowns | ✅ | Controlado por JS em nav-shared.js |
| `role="menu"` nos dropdowns | ✅ | |
| Emojis em `<h1>` sem `aria-hidden` | ⚠️ | sabores.html, noticias.html, o-que-fazer.html, rotas-completas.html |
| Imagens mascote no hero | ✅ | `alt=""` + `aria-hidden="true"` em sabores.html:93 |
| Busca modal | ✅ | `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-live` |
| Foco/teclado no menu mobile | ✅ | Escape fecha; overlay clicável; Esc global |
| `lang="pt-BR"` em todos os htmls | ✅ | |
| `id="main-content"` em todas as páginas | ⚠️ | Ausente ou não verificado em: `mapa-3d.html`, `mapa-completo.html`, `galeria.html`, `onde-ficar.html` |

---

## 12. Mobile/Responsivo por Código

| Aspecto | Status | Notas |
|---------|--------|-------|
| `<meta name="viewport">` | ✅ | Todas as páginas |
| Breakpoints no nav | ✅ | `@media (max-width: 968px)` → hambúrguer; `768px` → ajuste acessibilidade |
| `overflow-x: hidden` no body mobile | ✅ | nav-shared.js:303 |
| `safe-area-inset-bottom` para notch | ✅ | Botão voltar ao topo e nav-links |
| `max-width: 100vw` no nav mobile | ✅ | |
| Imagens com `loading="lazy"` | ⚠️ | Aplicado nos banners; não auditado sistematicamente nos HTMLs |

---

## 13. Service Worker / Cache

| Aspecto | Status | Notas |
|---------|--------|-------|
| Versão atual | `turismo-sms-v17` | |
| Estratégia HTML/JSON | ✅ | Excluídos do cache (`NEVER_CACHE_EXT`) |
| Firebase excluído do cache | ✅ | |
| Google Analytics excluído | ✅ | |
| Stale-while-revalidate | ✅ | `fetchAndCache` atualiza em background |
| `PRECACHE_ASSETS` com imagem grande | ⚠️ | `IGREJA_MATRIZ_1.png` (3,4 MB) pré-cacheada na instalação |
| `translations.js` no precache | ⚠️ | 193 KB pré-cacheado; muda frequentemente |
| `nav-shared.js` corretamente excluído | ✅ | Está na lista `NEVER_CACHE` |
| `/admin-firebase.html` e `/portal-usuario.html` | ✅ | Nas rotas sensíveis; nunca cacheados |

---

## 14. Verificação de Banners — Não Quebraram Layout

Confirmado por inspeção do código:
- `#public-banners-slot` inicia com `hidden` — se Firebase falha ou não há banners, o slot permanece oculto
- `renderInto()` seta `mount.hidden = true` quando não há conteúdo
- CSS injetado dinamicamente via `<link data-public-banners-css>` — carrega após DOMContentLoaded
- Posicionamento como elemento de fluxo normal (não fixed/absolute) — não interfere com nav ou outros elementos

---

## 15. Demandas por Bloco de Correção

### Bloco S2 — Dados e Mapas (Alta Prioridade)
1. Corrigir `mapsUrl: 'https://maps.app.goo.gl/exemplo'` na Igreja Matriz (substituir pela URL real)
2. Preencher os 13 `mapsUrl: null` com URLs reais do Google Maps
3. Remover duplicata na galeria de `praca-rio-iguacu`
4. Auditar completamente `js/data/hospedagens.js`, `restaurantes.js`, `rotas-data.js` para coords, images e contatos

### Bloco S3 — Sitemap e SEO (Alta Prioridade)
5. Adicionar `/mapa-turistico` ao `sitemap.xml`
6. Adicionar `/galeria` ao `sitemap.xml` (já está — confirmar)
7. Atualizar `lastmod` de todas as URLs no sitemap
8. Corrigir `robots.txt`: adicionar `/admin-firebase.html` (com .html) ao Disallow
9. Corrigir `manifest.json`: trocar `/eventos.html?utm_source=pwa-shortcut` por `/eventos?utm_source=pwa-shortcut`
10. Corrigir Schema.org `SearchAction`: parâmetro `?q=` não corresponde à busca modal JS

### Bloco S4 — Menu (Média Prioridade)
11. Remover "Experiências" do menu (duplica "Roteiros")
12. Diferenciar "Erva-mate", "Restaurantes" e "Produtos Locais" no menu Sabores — ou reduzir para 1–2 itens distintos
13. Diferenciar "São Mateus do Sul", "História" e "Xisto" no menu Sobre — criar anchors específicos ou páginas
14. "Como Chegar": adicionar filtro ou criar seção específica

### Bloco S5 — Otimização de Assets (Baixa/Média Prioridade)
15. Remover `IGREJA_MATRIZ_1.png` do `PRECACHE_ASSETS`; manter versão webp ou JPEG menor
16. Avaliar remover `translations.js` do precache (ou cachear com versão hash)
17. Converter imagens de empreendimentos PNG para WebP: EU_AMO_SMS, CASA_DA_MEMORIA, CHALE_DO_PRODUTOR, IGREJA_COLONIA_IGUACU (só se houver uso futuro)
18. Deletar ou arquivar as 4 PNGs órfãs acima de 3 MB
19. Converter IGREJA_MATRIZ_1.png (em uso) para versão JPEG/webp < 300 KB
20. Converter imagens de empreendimentos JPEG em uso acima de 1 MB para WebP

### Bloco S6 — Acessibilidade (Baixa Prioridade)
21. Adicionar `aria-hidden="true"` nos emojis de `<h1>` nas páginas: sabores.html, noticias.html, o-que-fazer.html, rotas-completas.html
22. Verificar `id="main-content"` em galeria.html, onde-ficar.html, mapa-3d.html, mapa-completo.html

### Bloco S7 — Fluxo `/local` (Decisão Humana)
23. Definir estratégia: manter `/local.html?id=...` como página individual OU migrar "Ver detalhes" para painel lateral no mapa turístico
24. Se mantido: adicionar canonical, description dinâmica e banners slot
25. Se descontinuado: converter 17 links `/local?id=...` para links de mapa com filtro

---

## 16. Ordem de Execução Recomendada

```
Prioridade 1 (crítico — antes de nova campanha de marketing):
  S2: mapsUrl placeholder + nulos (Igreja Matriz primeiro)
  S3: mapa-turistico no sitemap + lastmod + manifest.json

Prioridade 2 (qualidade — próximo bloco):
  S4: Limpeza de duplicações no menu
  S7: Decisão definitiva sobre /local

Prioridade 3 (performance — bloco de otimização):
  S5: PRECACHE sem PNG grande; WebP para empreendimentos

Prioridade 4 (polimento):
  S6: aria-hidden nos emojis de h1
```

---

## Apêndice A — Scripts Executados

```
node scripts/audit-links.mjs   → 664 links, 1 quebrado, 18 legados, 21 redundantes
node scripts/audit-assets.mjs  → 225 mídias, 0 duplicatas reais, 79 órfãs, 35 pesadas
node scripts/audit-project.mjs → 399 arquivos, 36 HTML, 23 CSS, 46 JS
```

Relatórios completos em JSON:
- [docs/auditoria-output/links-report.json](auditoria-output/links-report.json)
- [docs/auditoria-output/assets-report.json](auditoria-output/assets-report.json)
- [docs/auditoria-output/project-report.json](auditoria-output/project-report.json)

---

## Apêndice B — Arquivos Inspecionados Manualmente

- `index.html` (144 KB)
- `eventos.html` (50 KB)
- `mapa-turistico.html` (11 KB)
- `sabores.html` (30 KB)
- `noticias.html` (23 KB)
- `o-que-fazer.html` (5,9 KB)
- `local.html` (20 KB)
- `rotas-completas.html` (4,2 KB)
- `js/nav-shared.js` (773 linhas)
- `js/public-banners.js` (633 linhas)
- `js/locais-data.js` (360 linhas lidas)
- `js/site-meta.js`
- `sw.js`
- `sitemap.xml`
- `robots.txt`
