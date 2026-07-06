# Bloco S14 — Reforço do tema sazonal e ambientação de clima (site público)

**Data:** 2026-07-06
**Escopo:** ambientação visual leve de estação/clima na home, concentrada na faixa de previsão do tempo.
**Status:** aplicado localmente, **não commitado**.

> Observação de numeração: já existe `docs/bloco-s14-auditoria-dados-turisticos-publicos.md`
> (outro trabalho rotulado S14). Este documento cobre a ambientação sazonal/clima e usa nome
> de arquivo distinto para não colidir.

---

## 1. Sistema anterior encontrado

O site **já possuía** um sistema sazonal/clima funcional:

- **`js/season-theme.js`**
  - Define `html[data-season]` (`summer`/`autumn`/`winter`/`spring`) automaticamente por data.
  - Cálculo de estação usa fuso `America/Sao_Paulo` e limiares do **hemisfério sul**
    (dez/21–mar/20 = verão; mar/21–jun/20 = outono; jun/21–set/22 = inverno; senão primavera).
  - Também define `data-season-mode` (`auto`/manual) e `data-day-period` (manhã/dia/tarde/noite).
  - Seletor de estação (UI), badge de clima, camada `.season-ambient`, slots de mascote.
  - Preferência manual persistida em `localStorage` (`sms-season-preference`).
- **`css/season-theme.css`**
  - Tokens CSS por estação (cores, glow, sombra, tints de card) e ambientação flutuante
    (sol, folhas, vapor de mate, broto).
- **`js/weather.js`**
  - Busca **Open-Meteo** (API já existente — nenhuma API nova foi adicionada), cache de 1h,
    fallback para cache expirado (stale) e estado "indisponível".
  - Dispara `sms:weatherchange` com `code` (WMO), `temp`, `condition`, `available`.

### Por que estava visualmente tímido
1. **A home desliga a ambientação flutuante.** `body.home-page` zera `body::before/::after`,
   esconde `.season-ambient` e o mascote sazonal (decisão da "Home refinada", já aprovada).
2. **A condição climática nunca virava visual.** `onWeatherChange` lia apenas `temp`/`condition`
   (texto); o `code` WMO era ignorado — não existia `data-weather` nem acento por condição.
3. **A `weather-strip` da home era neutra** (`#f2ede4`, cartões brancos), sem relação com estação/clima.
4. Pastas `images/seasonal/*` estão **vazias** (só fallback CSS) — nenhum asset foi inventado.

---

## 2. Decisão de escopo (confirmada com o responsável)

- **Ambientação concentrada na faixa de clima** (não reativar ornamentos flutuantes da home).
  Preserva integralmente a decisão da "Home refinada".
- **Etiqueta contextual com texto visível traduzido** (PT/EN/ES/PL), curta e discreta.

---

## 3. Alterações visuais feitas

Todas contidas na `.weather-strip` da home + tokens globais de condição:

1. **Fita de estação** no topo da faixa de clima (`.weather-strip::before`): linha de 3px com
   gradiente que assume a cor da condição do dia (ou da estação, como fallback).
2. **Container tingido** (`.weather-container`): fundo/again borda/sombra sutis conforme a estação.
3. **Acento por condição** nos cartões (`.weather-card` ganha `border-top` colorido pela condição).
4. **Etiqueta contextual** (`.weather-etiqueta`): chip com o texto da estação + um ponto colorido
   pela condição climática. Ex.: "Outono · clima ameno", "Inverno · frio".

---

## 4. Estações e condições suportadas

### Estações (texto da etiqueta)
| Estação | PT | EN | ES | PL |
|---|---|---|---|---|
| summer | Verão · calor | Summer · warm | Verano · calor | Lato · upalnie |
| autumn | Outono · clima ameno | Autumn · mild weather | Otoño · clima templado | Jesień · łagodna pogoda |
| winter | Inverno · frio | Winter · cold | Invierno · frío | Zima · zimno |
| spring | Primavera · clima agradável | Spring · pleasant weather | Primavera · clima agradable | Wiosna · przyjemna pogoda |

### Condições climáticas (acento de cor — `html[data-weather]`)
Derivadas do `code` WMO já entregue por `js/weather.js`:

| Categoria | Códigos WMO | Cor de acento |
|---|---|---|
| sunny | 0, 1 | dourado |
| cloudy | 2, 3, 45, 48 | cinza-azulado |
| rain | 51–65, 80–82 | azul |
| storm | 95, 96, 99 | ardósia |
| snow | 71–77, 85, 86 | azul-claro |
| **frio** (`data-weather-cold="true"`) | temp ≤ 13 °C | azul frio (prevalece) |

Quando o clima está indisponível, `data-weather`/`data-weather-cold` são removidos e o acento
recai no token da estação (`--season-accent`) — visual permanece bonito e neutro.

---

## 5. Lógica de estação (hemisfério sul)

Mantida a lógica pré-existente em `getAutomaticSeason()` (sem alteração de regra):
São Mateus do Sul/PR (hemisfério sul), fuso `America/Sao_Paulo`. Sem `localStorage`, o site usa
a estação automática por data. Preferência manual continua respeitada.

---

## 6. Fallback de clima

- Reaproveita `js/weather.js` (Open-Meteo + cache 1h + stale). **Nenhuma API nova.**
- Se o clima falhar/indisponível: `data-weather` removido → acento neutro pela estação; a
  etiqueta continua exibindo a estação corrente. A faixa permanece elegante.

---

## 7. Acessibilidade

- Efeitos são **decorativos** (pseudo-elementos, sem conteúdo semântico) e não são anunciados.
- A **etiqueta** é texto real (informativo), sem `aria-live` — não gera anúncios repetidos ao
  trocar de estação/idioma.
- `prefers-reduced-motion` respeitado: transições desativadas via media query e via
  `html.season-reduced-motion` (sem novas animações em loop).
- Sem redução de contraste, sem cobrir botões, sem bloquear layout. Mobile ajustado (≤640px).

---

## 8. Performance

- **Zero** novos assets, imagens, fontes ou bibliotecas.
- Apenas CSS (pseudo-elementos/tokens) + lógica JS aditiva leve.
- Não afeta LCP da hero (vídeo/hero intocados); a faixa de clima fica abaixo da dobra.

---

## 9. Datas/horários verificados

| Campo/arquivo | Verificado | Atualizado? | Motivo |
|---|---|---|---|
| `sitemap.xml` (`lastmod`) | Sim (2026-06-29) | **Não** | Ambientação visual não muda conteúdo indexável. |
| `js/site-meta.js` (`updatedAt`) | Sim (2026-07-02T10:30) | **Não** | Mudança é decorativa/visual global, não editorial. |
| `config.js` (datas de evento) | Sim | **Não** | Fora de escopo; não tocado. |
| Textos "Última atualização" visíveis | Sim (`data-weather-updated`) | **Não** | Gerado por `weather.js`; não alterado. |
| Cache-busting `?v=` (CSS/JS sazonal) | — | **Sim** | `season-s14-clima-20260706` para forçar refresh. |
| Doc do bloco | — | **Sim** | Este arquivo, data 2026-07-06. |

**Decisão sobre `site-meta.updatedAt`:** não atualizado. O bloco altera apenas ambientação
visual (sem novo conteúdo turístico/editorial), então não se qualifica como mudança significativa
para o carimbo "Portal atualizado em".

---

## 10. Arquivos alterados

- `js/season-theme.js` — categoria de clima por `code` WMO + `data-weather`/`data-weather-cold`;
  etiqueta sazonal traduzida (render em troca de estação e de idioma). **Aditivo.**
- `css/season-theme.css` — bloco S14: tokens de condição, ambientação da faixa de clima, etiqueta.
- `translations.js` — 4 chaves `season-etiqueta-*` em PT/EN/ES/PL.
- `index.html` — `<p class="weather-etiqueta" data-season-etiqueta>` na área de clima + bump `?v=`.
- `docs/bloco-s14-tema-sazonal-clima.md` — este documento.

**Regenerados por audits (NÃO commitar / reverter antes de commit):**
`docs/auditoria-output/*` (snapshots ruidosos, conforme CLAUDE.md).

---

## 11. Validações executadas

- `node --check` OK em: `season-theme.js`, `nav-shared.js`, `site-meta.js`, `translations.js`,
  `config.js`, `sw.js`, `weather.js`.
- `node scripts/audit-links.mjs` → 734 links, 0 quebrados.
- `node scripts/audit-assets.mjs` → 226 mídias, 0 faltando.
- `node scripts/audit-project.mjs` → 429 arquivos, sem erros.

---

## 12. Riscos

- Baixo. Alterações contidas na faixa de clima + tokens; nada removido.
- `data-weather` depende de `weather.js` responder; se indisponível, degrada para acento de estação.
- `docs/auditoria-output/*` ficaram modificados (regeneráveis) — reverter antes de commit.

---

## 13. Rollback

- Reverter `js/season-theme.js`, `css/season-theme.css`, `translations.js`, `index.html`.
- Ou remover apenas o bloco "Bloco S14" no fim de `css/season-theme.css` e a `<p class="weather-etiqueta">`
  do `index.html` para desligar a ambientação sem afetar o resto do sistema sazonal.

---

## 14. Próxima etapa recomendada

- Validação manual em produção-like (desktop + mobile), simulando estações via seletor e
  condições de clima (forçando `code` no cache ou aguardando dados reais).
- Se desejado no futuro: pequenos ícones SVG por estação nas pastas `images/seasonal/*`
  (hoje vazias) — fora do escopo deste bloco.
