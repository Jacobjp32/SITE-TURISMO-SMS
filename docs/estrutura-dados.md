# Estrutura de dados do portal de turismo

## Visão geral

O projeto continua estático, com HTML, CSS e JavaScript puro. A pasta `js/data/` concentra dados resumidos e reaproveitáveis para o portal crescer sem depender só de blocos fixos no HTML.

Arquivos atuais:

- `js/data/pontos-turisticos.js`
- `js/data/rotas.js`
- `js/data/hospedagens.js`
- `js/data/restaurantes.js`
- `js/data/eventos.js`
- `js/data/informacoes-essenciais.js`

## Onde os dados ainda estão hoje

Nem tudo foi migrado nesta rodada. Ainda existem dados relevantes nestes pontos:

- `index.html`: cards e textos renderizados diretamente na HOME
- `js/locais-data.js`: base mais rica para páginas de locais
- `js/rotas-data.js`: base mais rica para rotas e empreendimentos
- `js/roteiro-ia.js`: base própria para sugestões automáticas de roteiro
- `js/reservas.js`: base própria para experiências reserváveis
- `js/chatbot.js`: respostas prontas com conteúdo turístico

## Como os novos arquivos devem ser usados

Os arquivos de `js/data/` foram criados como camada simples de catálogo. Eles podem alimentar:

- busca estática
- cards de listagem
- filtros por categoria
- mapa interativo futuro
- páginas temáticas

Nesta rodada, a busca já passou a ler esses arquivos.

## Formato padrão

Cada arquivo expõe um array global em `window`.

Exemplo de ponto turístico:

```js
window.TURISMO_PONTOS = [
  {
    id: "vapor-pery",
    nome: "Vapor Pery",
    categoria: "História",
    descricao: "Símbolo histórico da navegação no Rio Iguaçu.",
    imagem: "",
    url: "/#sobre",
    coordenadas: {
      lat: null,
      lng: null
    },
    tags: ["história", "rio iguaçu", "navegação"]
  }
];
```

## Como adicionar um novo ponto turístico

1. Abra `js/data/pontos-turisticos.js`.
2. Adicione um novo objeto ao array `window.TURISMO_PONTOS`.
3. Preencha `id`, `nome`, `categoria`, `descricao`, `url` e `tags`.
4. Se houver coordenadas confiáveis, preencha `lat` e `lng`.

## Como adicionar uma nova hospedagem

1. Abra `js/data/hospedagens.js`.
2. Adicione o item em `window.TURISMO_HOSPEDAGENS`.
3. Informe pelo menos `id`, `nome`, `descricao`, `url`, `telefone`, `localizacao` e `tags`.

## Como adicionar um novo restaurante

1. Abra `js/data/restaurantes.js`.
2. Adicione o item em `window.TURISMO_RESTAURANTES`.
3. Informe categoria, localização e tags que ajudem a busca.

## Como adicionar um novo evento

1. Abra `js/data/eventos.js`.
2. Adicione o item em `window.TURISMO_EVENTOS`.
3. Preencha `periodo`, `local`, `recorrencia` e `tags`.
4. Se o evento tiver âncora ou página própria, use a URL correspondente.

## Como isso poderá evoluir

Rodadas futuras podem:

- fazer `js/locais-data.js` e `js/rotas-data.js` virarem fontes principais
- renderizar cards da HOME a partir dos arrays
- alimentar mapa interativo com `coordenadas`
- unificar chatbot, busca e roteiros sobre a mesma base
- reduzir duplicação entre HTML, busca e scripts auxiliares

## Observação importante

Nesta rodada a HOME não foi convertida para renderização dinâmica. O objetivo foi preparar a arquitetura, não trocar a forma como a página principal desenha seus blocos.
