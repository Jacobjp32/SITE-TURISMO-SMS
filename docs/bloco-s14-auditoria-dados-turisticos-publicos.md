# Bloco S14 — Auditoria de dados turísticos públicos

Data: 2026-07-03
Escopo: dados públicos de atrativos, empreendimentos, gastronomia, hospedagem, rotas, experiências em destaque, mapa turístico e fichas `local.html`. Sem deploy, sem commit, sem instalação de dependências, sem admin/Firebase.

## 1. Fontes de dados encontradas

| Fonte | Papel no site | Consumidores principais |
| --- | --- | --- |
| `js/locais-data.js` | Fonte das fichas dinâmicas `local.html?id=...`; contém 15 locais com descrição longa, imagem, galeria, endereço, horário, telefone, coordenadas e aliases. | `local.html`, `js/data/turismo-data-adapter.js`, busca/mapa após integração. |
| `js/rotas-data.js` | Fonte legada dos 47 empreendimentos das rotas rurais; contém `routeInfo`, `establishments`, coordenadas, contatos e status de coordenada. | `js/data/turismo-data-adapter.js`, `mapa-turistico.html`, home por links de filtro. |
| `js/data/pontos-turisticos.js` | Pontos públicos destacados e links para fichas. | `js/data/turismo-data.js`, mapa, busca, atalhos públicos. |
| `js/data/rotas.js` | Seis rotas temáticas sem ponto único. | Mapa turístico, busca, filtros `grupo=roteiros`. |
| `js/data/hospedagens.js` | Lista pública de hospedagem. | Mapa turístico, busca, filtro `categoria=Hospedagem`, home. |
| `js/data/restaurantes.js` | Lista pública de gastronomia/restaurantes. | Mapa turístico, busca, filtro `categoria=Gastronomia`, home. |
| `js/data/eventos.js` | Eventos públicos estáticos para mapa/busca/home. | Mapa turístico e blocos públicos de agenda. |
| `js/data/informacoes-essenciais.js` | Serviços e atalhos informativos. | Mapa turístico e busca. |
| `js/data/turismo-data-adapter.js` | Integra fontes antigas e novas, classifica categorias amplas e deduplica entradas legadas. | `js/data/turismo-data.js`, `mapa-turistico.js`. |
| `js/data/turismo-data.js` | Snapshot final público: pontos, rotas, hospedagens, restaurantes, eventos e serviços. | `mapa-turistico.js`, busca e integrações públicas. |
| `index.html` | Cards estáticos de "Experiências em destaque" e links para filtros/fichas. | Home pública. |
| `sabores.html` | Página editorial estática de gastronomia, feiras, restaurantes e produtores. | Público; não consome `js/data/restaurantes.js`. |
| `onde-ficar.html` | Página editorial estática de hospedagem. | Público; não consome `js/data/hospedagens.js`. |

## 2. Snapshot consolidado do mapa

Após carregar as fontes públicas e o adaptador:

- Total consolidado: 81 itens.
- Com coordenadas: 65.
- Sem coordenadas: 16.
- Coleções: 32 pontos, 6 rotas, 7 hospedagens, 17 restaurantes, 8 eventos, 11 serviços.
- Categorias amplas disponíveis no mapa: História, Cultura, Natureza, Gastronomia, Hospedagem, Eventos, Serviços.
- Integração legada: 15 locais de `locais-data.js`, 47 empreendimentos de `rotas-data.js`, 45 itens adicionados e 17 mesclados pelo adaptador.

## 3. IDs, links e imagens

- IDs duplicados no snapshot consolidado após correção: nenhum.
- Imagens referenciadas inexistentes: nenhuma.
- Links internos `local.html?id=...` quebrados: nenhum.
- Coordenadas inválidas: nenhuma.
- Fichas válidas testadas por base de dados: `igreja-matriz`, `igreja-agua-branca`, `ponte-rio-iguacu`, `praca-rio-iguacu`, `rua-do-mathe`, `casa-da-memoria`, `chimarrodromo`, `predio-historico`, `arena-cultural`, `ginasio-polacao`, `parque-exposicoes`, `prefeitura-municipal`, `paco-municipal`.
- Alias legado encontrado: `casa-memoria-padre-bauer` → `casa-da-memoria`.

## 4. Experiências em destaque da home

| Card | Destino | Base existente | Resultado |
| --- | --- | --- | --- |
| Delícias da Bernardina | `/mapa-turistico.html?categoria=Gastronomia` | `js/rotas-data.js` (`delicias-da-bernardina`) | OK; imagem existe. |
| Marina Barra do Iguaçu | `/mapa-turistico.html?grupo=roteiros` | `js/rotas-data.js` e `js/data/restaurantes.js` | OK; imagem existe. |
| Ancestral Gastronomia | `/mapa-turistico.html?categoria=Gastronomia` | `js/rotas-data.js` e `js/data/restaurantes.js` | OK; imagem existe. |
| Hotel São Mateus | `/mapa-turistico.html?categoria=Hospedagem` | `js/data/hospedagens.js` | OK; imagem existe. |
| Ribeiro Pesca e Turismo | `/mapa-turistico.html?categoria=Natureza` | `js/rotas-data.js` | OK; imagem existe. |
| Sawe Parque Aquático | `/mapa-turistico.html?grupo=roteiros` | `js/rotas-data.js` | OK; imagem existe. |
| Rua do Mathe | `/local?id=rua-do-mathe` | `js/locais-data.js` | OK; ficha existe. |
| Casa da Memória Padre Bauer | `/local?id=casa-da-memoria` | `js/locais-data.js` | OK; ficha existe. |

Observação: os seis primeiros cards são intencionalmente "map-first", pois os empreendimentos das rotas não têm ficha `local.html`. Os dois últimos usam ficha dinâmica porque têm base em `locais-data.js`.

## 5. Inconsistências encontradas

### Corrigível com segurança

- `Rua do Mathe` aparecia duas vezes no snapshot final do mapa:
  - como ponto/ficha (`js/data/pontos-turisticos.js` + `js/locais-data.js`);
  - como restaurante genérico em `js/data/restaurantes.js`.
- Além da duplicidade de ID, havia conflito de telefone:
  - `js/data/restaurantes.js`: `(42) 3532-0000`;
  - `js/locais-data.js` e contatos institucionais: `(42) 3532-4163`.

### Requer confirmação humana

| Item | Campo | Motivo |
| --- | --- | --- |
| Hotel São Mateus | telefone | `onde-ficar.html` e home usam `(42) 3282-2000`; `js/data/hospedagens.js` usa `(42) 3532-1802`. Não há fonte interna suficiente para decidir. |
| Hotel São Mateus | coordenadas | `js/data/hospedagens.js` está sem lat/lng; página editorial usa link de busca genérico. Precisa confirmar ponto exato. |
| Hotel Nora | coordenadas/imagem | Sem coordenadas e sem imagem no dataset; página editorial tem telefone e busca genérica. |
| Hotel Dom Leopoldo | coordenadas/imagem | Sem coordenadas e sem imagem no dataset; página editorial tem telefone e busca genérica. |
| Pousadas Rurais | telefone/coordenadas/imagem | Registro agregador, não estabelecimento único. Não deve receber dados sem definição editorial. |
| Feira da Lua | coordenadas | Evento sem coordenadas no snapshot; precisa confirmar se deve apontar para Vila Pinheirinho ou permanecer evento sem marcador. |
| Cabana Campo de Telha, Ervateiras, Viveiros, Pesqueiros e propriedades potenciais | imagem | Muitos itens físicos de `rotas-data.js` têm coordenadas, mas não imagem própria. O site usa fallback; imagem real precisa confirmação/acervo. |
| Itens com `coordStatus: "aproximada"` | coordenadas | O próprio dataset marca posição aproximada ou "em validação"; não deve ser promovida a coordenada definitiva sem checagem. |
| `sabores.html` seção "Onde Comer" | nomes/horários | Conteúdo editorial genérico ("Porto Gastronômico", "Restaurante Polonês", etc.) não corresponde diretamente ao dataset atual. Exige decisão de conteúdo antes de trocar por dados reais. |
| `sabores.html` produtores | telefone/endereço/coordenadas | Há exemplos com telefone `(42) 3532-0000` e nomes que não aparecem nos datasets públicos principais. Precisa validação humana antes de publicar como dado factual. |

## 6. Correção segura aplicada

| Arquivo | Antes | Depois | Por que foi seguro |
| --- | --- | --- | --- |
| `js/data/restaurantes.js` | Continha entrada `rua-do-mathe` como restaurante, com telefone `(42) 3532-0000`. | Entrada duplicada removida. | A Rua do Mathe já existe como ponto turístico e ficha dinâmica com imagem, coordenadas, descrição e link válido; a entrada extra criava duplicidade no mapa e conflito de contato. |

## 7. O que ficou intencionalmente sem alteração

- Não preenchi telefones, coordenadas, horários, endereços, redes sociais ou imagens ausentes.
- Não alterei `eventos.js` nem fluxos de aprovação/admin.
- Não alterei `sabores.html` e `onde-ficar.html` para consumir datasets, pois isso seria mudança de arquitetura/conteúdo maior.
- Não removi empreendimentos potenciais ou itens com coordenadas aproximadas; apenas documentei a necessidade de validação.
- Não adicionei schema.org.

## 8. Próximos passos recomendados

1. Confirmar manualmente telefones e coordenadas de hospedagens antes de atualizar `js/data/hospedagens.js` e os blocos estáticos de `index.html`/`onde-ficar.html`.
2. Decidir se `sabores.html` deve continuar editorial/genérica ou se deve passar por bloco futuro para refletir `js/data/restaurantes.js` e `js/rotas-data.js`.
3. Criar rotina editorial para itens de `rotas-data.js` sem imagem própria: manter fallback por enquanto, mas associar imagem real somente com acervo confirmado.
4. Revisar itens marcados como "Empreendimento potencial" e `coordStatus: "aproximada"` em uma tarefa de cadastro/curadoria, não nesta auditoria técnica.
5. Se o objetivo futuro for ficha individual para empreendimentos das rotas, criar uma tarefa separada para ampliar `local.html` ou criar rota de detalhe própria, sem quebrar os filtros atuais do mapa.
