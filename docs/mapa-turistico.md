# Mapa Turístico Interativo

## Arquivos envolvidos

- `mapa-turistico.html`
- `css/mapa-turistico.css`
- `js/mapa-turistico.js`
- `js/data/pontos-turisticos.js`
- `js/data/hospedagens.js`
- `js/data/restaurantes.js`
- `js/data/eventos.js`
- `js/data/turismo-data.js`
- `js/nav-shared.js`

## Como o mapa funciona

O mapa usa:

- Leaflet via CDN
- OpenStreetMap como base
- `window.TURISMO_DATA` como fonte principal

O script `js/mapa-turistico.js` normaliza os dados e cria:

- markers no mapa para itens com coordenadas válidas
- filtros por categoria
- busca local por nome, categoria e palavras-chave
- painel lateral com detalhes
- lista de itens sem coordenadas

## Como adicionar um novo ponto no mapa

1. Abra `js/data/pontos-turisticos.js`.
2. Adicione o item com `id`, `nome`, `categoria`, `descricao`, `url` e `coordenadas`.
3. Se `coordenadas.lat` e `coordenadas.lng` forem numéricos, o item aparecerá no mapa.

## Como adicionar uma nova hospedagem

1. Abra `js/data/hospedagens.js`.
2. Preencha `nome`, `descricao`, `telefone`, `localizacao` e `coordenadas`.
3. O item entra no filtro `Hospedagem`.

## Como adicionar um novo restaurante

1. Abra `js/data/restaurantes.js`.
2. Preencha `categoria`, `descricao`, `localizacao`, `telefone` e `coordenadas`.
3. O item entra no filtro `Gastronomia`.

## Como depurar item que não aparece no mapa

Checklist:

1. Verifique se o item existe em `window.TURISMO_DATA`.
2. Verifique se `coordenadas.lat` e `coordenadas.lng` são números.
3. Verifique se a categoria não foi filtrada.
4. Verifique se a busca não está escondendo o item.
5. Rode `window.TURISMO_DATA_HELPERS.refresh()` no console após alterar dados em ambiente local.

## Itens sem coordenadas

Itens sem coordenadas não geram marker, mas continuam:

- disponíveis para evolução futura
- listados no painel quando filtrados
- válidos para busca em outras camadas do portal

## Próximos passos para versão premium / 3D

- ampliar coordenadas faltantes
- transformar categorias em camadas opcionais
- integrar rotas e linhas no mapa
- conectar páginas de local com fotos adicionais
- usar o mapa 2D como base de navegação para futura experiência 3D
