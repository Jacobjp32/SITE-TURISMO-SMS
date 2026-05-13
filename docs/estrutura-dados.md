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
- `js/data/turismo-data-adapter.js`
- `js/data/turismo-data.js`

## Papel de `js/data/turismo-data.js`

`js/data/turismo-data.js` é a camada centralizadora atual do portal.

Ele:

- reúne os arrays globais principais em `window.TURISMO_DATA`
- incorpora dados legados de `js/locais-data.js` e `js/rotas-data.js` por meio de um adaptador dedicado
- mantém compatibilidade com JavaScript puro, sem `import`/`export`
- expõe helpers simples em `window.TURISMO_DATA_HELPERS`
- permite que busca, mapa, chatbot, roteiros e páginas futuras passem a consumir uma fonte comum

Estrutura atual:

```js
window.TURISMO_DATA = {
  pontos: window.TURISMO_PONTOS || [],
  rotas: window.TURISMO_ROTAS || [],
  hospedagens: window.TURISMO_HOSPEDAGENS || [],
  restaurantes: window.TURISMO_RESTAURANTES || [],
  eventos: window.TURISMO_EVENTOS || [],
  informacoesEssenciais: window.TURISMO_INFORMACOES_ESSENCIAIS || []
};
```

Na versão atual, esse snapshot base ainda passa por `js/data/turismo-data-adapter.js`, que:

- lê `window.locaisData`
- lê `window.ROTAS_LEGADO_ESTABLISHMENTS`
- classifica itens legados em categorias padronizadas
- deduplica contra a base nova
- enriquece o snapshot final sem apagar as bases antigas

## Como o mapa consome `TURISMO_DATA`

A primeira versão do mapa 2D usa `window.TURISMO_DATA` como fonte principal.

Consumo atual:

- `TURISMO_DATA.pontos`
- `TURISMO_DATA.rotas`
- `TURISMO_DATA.hospedagens`
- `TURISMO_DATA.restaurantes`
- `TURISMO_DATA.eventos`
- `TURISMO_DATA.informacoesEssenciais`

Itens de `informacoesEssenciais` continuam entrando mesmo sem coordenadas, para apoiar busca, painel e atalhos de planejamento.

Contagem consolidada atual:

- `83` itens totais em `window.TURISMO_DATA`
- `66` itens com coordenadas
- `17` itens sem coordenadas
- legado lido pelo adaptador: `15` registros de `js/locais-data.js` e `48` registros de `js/rotas-data.js`
- efeito líquido da integração: `46` novos itens e `17` fusões por deduplicação

## Pagina principal de exploracao

`mapa-turistico.html` virou a pagina principal/oficial para exploracao turistica.

Consequencias atuais:

- `js/data/rotas.js` deve apontar para o mapa principal quando o destino for explorar roteiros
- `rotas-completas` permanece como URL legada
- links internos podem usar `?grupo=` e `?categoria=` para abrir o mapa em um recorte especifico

Exemplos:

- `/mapa-turistico.html?grupo=roteiros`
- `/mapa-turistico.html?categoria=Hospedagem`
- `/mapa-turistico.html?categoria=Gastronomia`

## Campos necessários para um item aparecer no mapa

Campos mínimos:

- `id`
- `nome`
- `categoria`
- `descricao`
- `url` ou destino relacionado
- `tags`
- `coordenadas.lat`
- `coordenadas.lng`

Se `lat` ou `lng` forem `null`, o item continua válido para busca e listagem, mas não gera marcador no mapa.

## Como cadastrar coordenadas

Padrão recomendado:

```js
coordenadas: {
  lat: -25.8775,
  lng: -50.3822
}
```

Use coordenadas apenas quando houver fonte interna confiável. Se não houver, mantenha:

```js
coordenadas: {
  lat: null,
  lng: null
}
```

## Como cadastrar categoria, URL e imagem

- `categoria`: ajuda filtros e agrupamento visual
- `url`: alimenta o botão "Ver detalhes"
- `imagem`: alimenta cards e painel lateral do mapa

Categorias preferenciais nesta fase:

- `História`
- `Cultura`
- `Natureza`
- `Gastronomia`
- `Hospedagem`
- `Eventos`
- `Serviços`
- `Roteiros`
- `Institucional`

Exemplo:

```js
  {
  id: "igreja-matriz",
  nome: "Igreja Matriz São Mateus",
  categoria: "História",
  descricao: "Arquitetura neogótica preservada e um dos marcos históricos do centro da cidade.",
  imagem: "images/IGREJA_MATRIZ_FRONTAL.jpg",
  url: "/local?id=igreja-matriz",
  coordenadas: {
    lat: -25.8769,
    lng: -50.3838
  },
  tags: ["igreja matriz", "história", "patrimônio histórico"]
}
```

## Como revisar dados do mapa

Use esta sequência curta:

1. confirme se a categoria está dentro do conjunto preferencial
2. confirme se a descrição funciona bem em card curto
3. confirme se a URL leva a página ou âncora segura
4. confirme se a imagem existe no projeto
5. confirme se `lat/lng` estão como número ou `null`

Se houver lacuna, registre em `docs/pendencias-mapa.md`.

## Onde os dados ainda estão hoje

Nem tudo foi migrado nesta rodada. Ainda existem dados relevantes nestes pontos:

- `index.html`: cards e textos renderizados diretamente na HOME
- `js/locais-data.js`: base mais rica para páginas de locais
- `js/rotas-data.js`: base mais rica para rotas e empreendimentos
- `js/roteiro-ia.js`: base própria para sugestões automáticas de roteiro
- `js/reservas.js`: base própria para experiências reserváveis
- `js/chatbot.js`: respostas prontas com conteúdo turístico
- `js/mapa3d.js`: pontos próprios para o mapa 3D experimental

## Como os novos arquivos devem ser usados

Os arquivos de `js/data/` são as fontes primárias resumidas desta fase, agora combinados com a camada adaptadora legada. Eles podem alimentar:

- busca estática
- cards de listagem
- filtros por categoria
- mapa interativo futuro
- páginas temáticas

Nesta rodada, a busca já passou a ler a camada central `window.TURISMO_DATA`.

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
5. O `window.TURISMO_DATA` será montado automaticamente a partir desse arquivo.

## Como adicionar uma nova rota

1. Abra `js/data/rotas.js`.
2. Adicione um novo objeto em `window.TURISMO_ROTAS`.
3. Informe `id`, `nome`, `categoria`, `descricao`, `url` e `tags`.
4. Se a rota tiver cor ou ícone próprios, mantenha esses campos.
5. Para manter a experiencia unificada, prefira URL ligada ao mapa principal, como `/mapa-turistico.html?grupo=roteiros`.

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

- consolidar parte de `js/locais-data.js` direto nas bases novas quando as páginas de local estiverem estáveis
- migrar `js/rotas-data.js` para uma fonte editorial mais organizada, sem perder a camada adaptadora
- renderizar cards da HOME a partir dos arrays
- alimentar mapa interativo com `coordenadas`
- unificar chatbot, busca e roteiros sobre a mesma base
- reduzir duplicação entre HTML, busca e scripts auxiliares

## Arquivos antigos que ainda precisam de migração

- `js/locais-data.js`: manter até páginas de locais passarem a usar a camada central
- `js/rotas-data.js`: manter até rotas completas, hospedagens e restaurantes consumirem uma fonte única
- `js/roteiro-ia.js`: ainda usa uma base própria simplificada
- `js/chatbot.js`: ainda usa respostas fixas por texto
- `js/mapa3d.js`: ainda usa coordenadas próprias

## Observação importante

Nesta rodada a HOME não foi convertida para renderização dinâmica. O objetivo foi preparar a arquitetura, não trocar a forma como a página principal desenha seus blocos.
