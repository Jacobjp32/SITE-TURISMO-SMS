# Mapa Turístico Interativo

## Arquivos envolvidos

- `mapa-turistico.html`
- `css/mapa-turistico.css`
- `js/mapa-turistico.js`
- `rotas-completas.html`
- `rotas-completas/index.html`
- `js/data/pontos-turisticos.js`
- `js/data/rotas.js`
- `js/data/hospedagens.js`
- `js/data/restaurantes.js`
- `js/data/eventos.js`
- `js/data/turismo-data-adapter.js`
- `js/data/turismo-data.js`
- `js/nav-shared.js`
- `js/locais-data.js`
- `js/rotas-data.js`

## Pagina principal

`mapa-turistico.html` passou a ser a pagina principal de exploracao turistica do portal.

Uso recomendado:

- mapa oficial: `/mapa-turistico.html`
- roteiros no mapa: `/mapa-turistico.html?grupo=roteiros`
- hospedagem no mapa: `/mapa-turistico.html?categoria=Hospedagem`
- gastronomia no mapa: `/mapa-turistico.html?categoria=Gastronomia`

A URL antiga `/rotas-completas` foi mantida como camada legada com redirecionamento suave para o mapa.

## Contagem atual

Contagem consolidada apos a integracao da base legada:

- `83` itens em `window.TURISMO_DATA`
- `66` itens com coordenadas validas
- `66` markers renderizaveis no mapa
- `17` itens sem coordenadas

Origem da ampliacao:

- `15` registros de `js/locais-data.js`
- `48` registros de `js/rotas-data.js`
- `46` entradas legadas foram incorporadas como novos itens
- `17` entradas legadas foram fundidas por deduplicacao com itens ja existentes

## Como o mapa funciona

O mapa usa:

- Leaflet via CDN
- OpenStreetMap como base
- `window.TURISMO_DATA` como fonte principal

Na versao atual, `window.TURISMO_DATA` tambem aproveita a base legada via `js/data/turismo-data-adapter.js`, sem apagar `js/locais-data.js` nem `js/rotas-data.js`.

O script `js/mapa-turistico.js` normaliza os dados e cria:

- markers no mapa para itens com coordenadas válidas
- filtros por categoria
- grupos de cards na grade principal abaixo do mapa
- busca local por nome, categoria e palavras-chave
- painel lateral compacto com resumo e destaque do item selecionado
- grade responsiva de cards com itens sem coordenadas identificados por badge

## Melhorias visuais implementadas

- hero premium com apresentação institucional, texto de apoio e indicadores rápidos
- busca com placeholder mais amigável, botão para limpar e mensagem dinâmica de resultado
- filtros em chips com contagem, estado ativo mais claro e leitura melhor no mobile
- layout principal reorganizado em mapa de destaque + painel lateral compacto de resumo e destaque
- a lista lateral foi substituída por uma grade de exploração abaixo do mapa, distribuída por toda a largura útil da página
- os grupos `Todos`, `Pontos Turísticos`, `Roteiros`, `Gastronomia`, `Hospedagem`, `Eventos` e `Serviços` passaram a controlar a grade de cards
- os cards ganharam leitura mais próxima da antiga lógica de `rotas-completas`, com miniatura, descrição curta, tags e ações rápidas consistentes
- markers customizados por categoria com destaque visual para o item selecionado
- seção de itens sem coordenadas mantida ao final da grade em formato recolhível, sem aumentar a altura do painel lateral
- header do mapa alinhado ao mesmo padrão visual recente da HOME por meio do `nav-shared`

## Seleção marker, card e painel

- clicar em um marker destaca o card correspondente, atualiza o painel de destaque e mantém o popup do Leaflet disponível
- clicar em um card com coordenadas centraliza o mapa no local e abre o popup do marker
- clicar em um card sem coordenadas atualiza apenas o painel de destaque, sem tentar centralizar o mapa
- clicar em `Ver detalhes` abre um modal/drawer responsivo com as informações do item, sem recarregar a página
- o marker selecionado recebe destaque visual sem depender de animação pesada
- o card selecionado recebe realce visual na grade
- se o marker clicado estiver fora do grupo visível atual, a grade troca automaticamente para o grupo correto

## Modal de detalhes

O botão `Ver detalhes` é renderizado como `button` com `data-map-details-id`, não como link de navegação. O handler em `js/mapa-turistico.js` seleciona o item, preserva o destaque do mapa/card e abre um modal central no desktop. Em telas menores, o mesmo componente se comporta como drawer/bottom sheet rolável.

O modal consome apenas campos já presentes no item consolidado em `window.TURISMO_DATA`:

- `nome`
- `categoria`
- `descricao`
- `descricaoLonga` ou `historia`, quando existir
- `imagem`
- `galeria`, `imagens`, `fotos` ou `images`
- `localizacao` ou `endereco`
- `telefone`
- `horario`, `hours` ou `periodo`
- `tags`
- `rota`, `route` ou nome de rota herdado
- `site`, `instagram`, `social`, `facebook` ou URL externa
- `coordenadas` e `mapsUrl`

Campos ausentes são omitidos. O modal não imprime `undefined`, não cria informação nova e não tenta resolver páginas individuais.

### Imagem principal e galeria

A imagem principal vem de `imagem`. Para adicionar galeria futura, use um array no próprio item:

```js
galeria: [
  "images/empreendimentos/exemplo/exemplo-01.jpeg",
  "images/empreendimentos/exemplo/exemplo-02.jpeg"
]
```

O modal ignora arquivos `.HEIC` e `.DNG`; use apenas versões web já disponíveis (`.jpg`, `.jpeg`, `.png`, `.webp`). Se `galeria` existir, a primeira imagem continua como destaque e as demais aparecem em mini galeria. Se não houver imagem, aparece um fallback visual por categoria.

### Itens sem coordenadas

Itens sem coordenadas continuam visíveis na grade e podem abrir o modal. O botão `Como chegar` fica oculto quando `coordenadas.lat` e `coordenadas.lng` não são números válidos.

### Roteiros

Roteiros aparecem no modal como `Roteiro temático`, com descrição e tags. Quando não possuem coordenada única, não exibem `Como chegar`. Relações futuras entre roteiro e pontos podem ser criadas depois, mas a implementação atual não inventa vínculo automático.

## Como funcionam filtros e busca

- os filtros continuam trabalhando sobre as categorias amplas do mapa: `Todos`, `História`, `Cultura`, `Natureza`, `Gastronomia`, `Hospedagem`, `Eventos` e `Serviços`
- os grupos da grade foram organizados em `Todos`, `Pontos Turísticos`, `Roteiros`, `Gastronomia`, `Hospedagem`, `Eventos` e `Serviços`
- a base `TURISMO_DATA.rotas` agora tambem entra no mapa como grupo `Roteiros`
- a base legada de `js/rotas-data.js` passa a alimentar o mapa com empreendimentos rurais, gastronomia, hospedagens e experiencias antes ausentes
- a base legada de `js/locais-data.js` continua enriquecendo pontos turisticos e ajustando coordenadas quando a fonte antiga e mais confiavel
- itens originalmente marcados como `Roteiros` e `Institucional` continuam sem filtro proprio no topo para evitar excesso visual; na grade, `Roteiros` ganhou grupo dedicado
- a busca combina nome, categoria, descrição, localização, período, telefone e tags normalizadas
- quando não há resultado dentro de um filtro específico, a interface orienta o usuário a tentar `Todos`
- a busca e os filtros atualizam ao mesmo tempo markers, grade e painel de destaque
- itens sem coordenadas continuam aparecendo na grade e na busca, mesmo sem marker no mapa

## Deduplicacao

A integracao legada usa uma camada adaptadora com deduplicacao segura por:

- `id` quando coincide
- nome normalizado
- URL quando coincide
- coordenadas proximas apenas como apoio, junto com nome inicial e categoria

Quando um item legado bate com um item atual, o mapa nao cria duplicata; ele funde tags, telefones, localizacao e, quando necessario, pode priorizar coordenadas da base antiga mais confiavel.

## Query string e hash

O mapa aceita atalho simples por URL:

- `?grupo=roteiros`
- `?grupo=pontos-turisticos`
- `?categoria=Gastronomia`
- `?categoria=Hospedagem`

Tambem ha suporte a hash simples para grupos, como `#roteiros`, quando isso fizer sentido em links internos.

## Como revisar os dados do mapa

1. Abra os arquivos em `js/data/`.
2. Confirme `categoria`, `descricao`, `imagem`, `url`, `tags` e `coordenadas`.
3. Use `docs/pendencias-mapa.md` como fila de correção manual.
4. Sempre prefira dados já existentes no projeto antes de completar um campo.

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

## Como adicionar um novo ponto no mapa

1. Abra `js/data/pontos-turisticos.js`.
2. Adicione o item com `id`, `nome`, `categoria`, `descricao`, `url`, `tags` e `coordenadas`.
3. Se existir `imagem`, ela entra no card de detalhe e na lista.
4. Se `coordenadas.lat` e `coordenadas.lng` forem numéricos, o item aparecerá no mapa como marker.

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

Se o item estiver na lista, mas não no mapa, quase sempre o motivo é um destes:

- `lat` ou `lng` estão `null`
- `lat` ou `lng` vieram como texto e não como número
- a busca atual removeu o item da visão
- o filtro ativo não corresponde à categoria normalizada

## Campos mínimos por item

Campos mínimos recomendados para boa qualidade no mapa:

- `id`
- `nome`
- `categoria`
- `descricao`
- `url`
- `tags`
- `coordenadas`

Campos opcionais, mas desejáveis:

- `imagem`
- `telefone`
- `localizacao`
- `periodo`
- `local`

## Itens sem coordenadas

Itens sem coordenadas não geram marker, mas continuam:

- disponíveis para evolução futura
- visíveis nos cards quando filtrados, com badge discreta
- válidos para busca em outras camadas do portal
- recolhidos no fim da grade em um bloco auxiliar para não aumentar a sensação de página longa

## Como cadastrar coordenadas depois

Use este padrão:

```js
coordenadas: {
  lat: -25.8769,
  lng: -50.3838
}
```

Se a coordenada ainda não for confiável, mantenha:

```js
coordenadas: {
  lat: null,
  lng: null
}
```

## Como testar o mapa após editar dados

1. Rode:

```powershell
node --check js/data/pontos-turisticos.js
node --check js/data/hospedagens.js
node --check js/data/restaurantes.js
node --check js/data/eventos.js
node --check js/data/informacoes-essenciais.js
node --check js/data/turismo-data.js
node --check js/mapa-turistico.js
```

2. Abra `mapa-turistico.html` em servidor local.
3. Confirme:
   - markers visíveis
   - grupos da grade funcionando
   - painel lateral mostrando resumo e destaque
   - cards distribuídos em grade, sem sidebar infinita
   - itens sem coordenadas acessíveis
   - busca funcionando
   - filtros atualizando contagem e cards
   - mobile sem `overflow` horizontal

## Legado de rotas

- `/rotas-completas` e `rotas-completas.html` foram mantidos como camada legada
- o destino principal agora e `/mapa-turistico.html?grupo=roteiros`
- a pagina legada informa a mudanca e redireciona automaticamente para o mapa

## Próximos passos para versão premium / 3D

- ampliar coordenadas faltantes
- transformar categorias em camadas opcionais
- integrar rotas e linhas no mapa
- conectar páginas de local com fotos adicionais
- explorar molduras, camadas e microinterações mais ricas sem perder desempenho
- usar o mapa 2D como base de navegação para futura experiência visual 3D
