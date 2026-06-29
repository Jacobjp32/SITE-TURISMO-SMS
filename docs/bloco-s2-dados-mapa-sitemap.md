# Bloco S2 — Dados Críticos do Mapa e Sitemap

**Data:** 2026-06-29
**Status:** Concluído

---

## O que foi feito

### 1. `js/locais-data.js` — 2 correções seguras

**Correção 1 — placeholder neutralizado (`igreja-matriz`):**
```js
// ANTES
mapsUrl: 'https://maps.app.goo.gl/exemplo',

// DEPOIS
mapsUrl: null,
```
Com `null`, o fallback por coordenadas já existente em `local.html` e `mapa-turistico.js` entra em ação automaticamente, gerando `https://www.google.com/maps/search/?api=1&query=-25.8769,-50.3838`.

**Correção 2 — galeria duplicada removida (`praca-rio-iguacu`):**
```js
// ANTES
galeria: ['images/WEBP/PRACA-DO-IGUACU_1.webp', 'images/PRACA_DO_RIO_IGUACU.jpg', 'images/PRACA_DO_RIO_IGUACU.jpg'],

// DEPOIS
galeria: ['images/WEBP/PRACA-DO-IGUACU_1.webp', 'images/PRACA_DO_RIO_IGUACU.jpg'],
```

### 2. `sitemap.xml` — atualização completa

Mudanças aplicadas:
- **Adicionado:** `/mapa-turistico` com `priority=0.95`, `changefreq=weekly`, `lastmod=2026-06-29` (estava ausente — lacuna crítica de SEO)
- **Atualizado:** todos os `lastmod` de 2026-03-24 / 2026-04-01 → **2026-06-29**
- **Rebaixado:** 5 páginas legadas (redirect-only) de `0.7–0.9` para `0.3 / yearly`:
  - `/o-que-fazer` → redireciona para `/mapa-turistico.html`
  - `/rotas-completas` → redireciona para `/mapa-turistico.html?grupo=roteiros`
  - `/mapa-completo` → redireciona para `/mapa-turistico.html`
  - `/mapa-3d` → redirect (3D suspenso por decisão de projeto)
  - `/roteiro-ia` → redirect (IA suspenso)
- **Mantidos:** `/local`, todas as páginas funcionais com prioridades revisadas

### 3. Fallback de coordenadas — nenhuma mudança de código necessária

Inspeção em `local.html` (linha 344) e `mapa-turistico.js` (função `createGoogleMapsLink`, linhas 1064–1072) confirmou que **o fallback já estava implementado corretamente** em ambos os arquivos. Ambos usam `https://www.google.com/maps/search/?api=1&query=LAT,LNG` quando `mapsUrl` é null.

### 4. `scripts/audit-tourism-data.mjs` — novo script de auditoria

Criado parser manual de `locais-data.js` que verifica:
- Status do `mapsUrl`: válido / placeholder / null-com-fallback / null-sem-fallback
- Presença e validade de coordenadas lat/lng
- Duplicatas na galeria
- Campos com notas de pendência `(confirmar ...)`

---

## Resultados da auditoria pós-S2

Executado via `node scripts/audit-tourism-data.mjs`.

| Métrica | Valor |
| --- | --- |
| Total de locais | 15 |
| mapsUrl válido (link real) | 1 (`igreja-agua-branca`) |
| mapsUrl null + fallback coord ativo | 14 |
| mapsUrl null SEM fallback (bloqueado) | **0** |
| mapsUrl placeholder restante | **0** |
| Locais sem coordenadas | **0** |
| Galerias com duplicatas | **0** |
| Issues 🔴 alta | **0** |
| Issues 🟡 média | 2 (endereços pendentes) |
| Issues 🟢 baixa | **0** |

---

## Pendências humanas (não automatizáveis neste bloco)

Estes campos requerem verificação factual antes de serem preenchidos — **não inventar dados**:

| Local | Campo | Nota atual |
| --- | --- | --- |
| Casa da Memória Padre Bauer | `endereco` | "Centro — São Mateus do Sul, PR (confirmar endereço)" |
| Parque de Exposições | `endereco` | "São Mateus do Sul, PR (confirmar endereço)" |
| 13 locais | `mapsUrl` | null — `https://maps.app.goo.gl/REAL-LINK` pendente para cada local; fallback funcional enquanto isso |

---

## Arquivos gerados

| Arquivo | Descrição |
| --- | --- |
| `docs/auditoria-dados-turisticos.md` | Relatório principal de qualidade dos dados |
| `docs/auditoria-output/tourism-data-report.md` | Cópia em auditoria-output |
| `docs/auditoria-output/tourism-data-report.json` | Relatório estruturado (JSON) |
| `scripts/audit-tourism-data.mjs` | Script de auditoria reutilizável |

---

## Arquivos modificados

| Arquivo | Mudança |
| --- | --- |
| `js/locais-data.js` | Placeholder neutralizado (linha 25); duplicata de galeria removida (linha 85) |
| `sitemap.xml` | `/mapa-turistico` adicionado; lastmod atualizado; legados rebaixados |

---

## Fora do escopo S2 (próximos blocos)

- **S3:** SEO / meta tags nas páginas, robots.txt (falta `/admin-firebase.html` com .html), manifest.json
- **S4:** Duplicações nos menus de navegação (nav-shared.js)
- **S5:** Otimização de imagens/vídeos pesados
- **S6:** `aria-hidden` em emojis de h1/h2
- **S7:** Decisão sobre fluxo `/local?id=...` (manter página individual ou modal no mapa)
