# Assets sazonais

## Onde colocar

Use a pasta `images/seasonal/`, separada por estacao:

- `images/seasonal/summer/`
- `images/seasonal/autumn/`
- `images/seasonal/winter/`
- `images/seasonal/spring/`

## Arquivos previstos

Por estacao, o tema esta preparado para estes roles:

| Uso | Arquivo |
| --- | --- |
| Mascote principal | `mascot.webp` |
| Badge pequeno de header | `header-badge.svg` |
| Acento do hero | `hero-accent.webp` |
| Sticker pequeno | `sticker.svg` |
| Icone de clima/estacao | `weather-icon.svg` |

Enquanto um arquivo ainda nao existir, mantenha o respectivo role como `null` no manifest interno de `js/season-theme.js`. O site usa fallback visual CSS/emoji e nao deve fazer request para `images/seasonal/{season}/...` inexistente.

## Formatos e tamanhos

- `SVG`: preferido para icones, badges e stickers simples.
- `WebP`: preferido para mascotes e acentos com transparencia.
- `PNG`: aceitavel quando houver transparencia complexa.

Tamanhos recomendados:

- `header-badge.svg`: ate 64 x 64 px.
- `weather-icon.svg`: ate 48 x 48 px.
- `sticker.svg`: ate 64 x 64 px.
- `mascot.webp`: entre 160 e 320 px de largura.
- `hero-accent.webp`: entre 240 e 480 px de largura.

Mantenha cada arquivo abaixo de 80 KB quando possivel. Evite imagens grandes, sombras pesadas ou composicoes infantis demais.

## Como o sistema escolhe

`js/season-theme.js` resolve a estacao ativa:

1. preferencia manual salva em `localStorage`;
2. modo `Automático`, calculado por data no fuso `America/Sao_Paulo`.

Depois ele busca o manifest interno da estacao e carrega apenas assets explicitamente preenchidos. Se o role estiver `null` ou vazio, o slot continua com fallback CSS sem request externo.

Roles disponiveis:

- `mascot`
- `headerBadge`
- `heroAccent`
- `sticker`
- `weatherIcon`

## Override manual

Se for necessario trocar nomes ou usar uma arte pontual sem alterar o manifest padrao, defina `window.SMS_SEASON_ASSETS` antes de carregar `js/season-theme.js`:

```html
<script>
window.SMS_SEASON_ASSETS = {
  winter: {
    mascot: "winter/capivara-inverno.webp",
    heroAccent: "winter/vapor-pery-inverno.webp",
    sticker: "winter/mate-xisto-agua.svg"
  }
};
</script>
```

Os caminhos relativos partem de `images/seasonal/`.

Ative overrides apenas para arquivos que ja existam fisicamente. Exemplo: `winter/mascot.webp` so deve ser informado depois que `images/seasonal/winter/mascot.webp` estiver no projeto.

## Ideias previstas

O manifest aceita diferentes linhas de identidade por estacao, sem prender o site a um mascote unico:

- capivara sazonal;
- menino polones sazonal;
- Vapor Pery tematico;
- trio Mate/Xisto/Agua tematico.
