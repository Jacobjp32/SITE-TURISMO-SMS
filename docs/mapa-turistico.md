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

## Melhorias visuais implementadas

- hero premium com apresentação institucional, texto de apoio e indicadores rápidos
- busca com placeholder mais amigável, botão para limpar e mensagem dinâmica de resultado
- filtros em chips com contagem, estado ativo mais claro e leitura melhor no mobile
- layout principal reorganizado em mapa de destaque + painel lateral de exploração
- cards com visual mais turístico, fallback elegante sem imagem e ações rápidas consistentes
- markers customizados por categoria com destaque visual para o item selecionado
- seção de itens sem coordenadas com texto explicativo e lista compacta

## Seleção marker e card

- clicar em um marker destaca o card correspondente e atualiza o painel de detalhes
- clicar em um card com coordenadas centraliza o mapa no local e abre o popup do marker
- o marker selecionado recebe destaque visual sem depender de animação pesada
- o popup do Leaflet continua ativo para consulta rápida e link externo de rota

## Como funcionam filtros e busca

- os filtros continuam trabalhando sobre as categorias amplas do mapa: `Todos`, `História`, `Cultura`, `Natureza`, `Gastronomia`, `Hospedagem`, `Eventos` e `Serviços`
- itens originalmente marcados como `Roteiros` e `Institucional` permanecem cadastrados, mas entram visualmente no grupo `Serviços` para evitar excesso de filtros
- a busca combina nome, categoria, descrição, localização, período, telefone e tags normalizadas
- quando não há resultado dentro de um filtro específico, a interface orienta o usuário a tentar `Todos`
- itens sem coordenadas continuam aparecendo na lista e na busca, mesmo sem marker no mapa

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
- listados no painel quando filtrados
- válidos para busca em outras camadas do portal

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
   - itens sem coordenadas listados
   - busca funcionando
   - filtros atualizando contagem e cards
   - mobile sem `overflow` horizontal

## Próximos passos para versão premium / 3D

- ampliar coordenadas faltantes
- transformar categorias em camadas opcionais
- integrar rotas e linhas no mapa
- conectar páginas de local com fotos adicionais
- explorar molduras, camadas e microinterações mais ricas sem perder desempenho
- usar o mapa 2D como base de navegação para futura experiência visual 3D
