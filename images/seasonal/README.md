# Assets sazonais

Estrutura preparada para imagens leves usadas pelo tema sazonal do site.

Pastas:

- `summer/`
- `autumn/`
- `winter/`
- `spring/`

Roles previstos por pasta:

- `mascot.webp`: mascote principal da estacao.
- `header-badge.svg`: selo pequeno para topo/header.
- `hero-accent.webp`: destaque discreto para hero.
- `sticker.svg`: adesivo pequeno complementar.
- `weather-icon.svg`: icone de clima/estacao para badge contextual.

O site nao deve tentar carregar estes arquivos ate que existam fisicamente e estejam explicitamente registrados no manifest de `js/season-theme.js` ou em `window.SMS_SEASON_ASSETS`. Enquanto estiverem ausentes, os slots usam fallback CSS.

Use SVG para icones simples e WebP/PNG transparente para mascotes ou acentos mais ilustrados.
