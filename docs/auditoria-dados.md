# Auditoria das bases de dados turisticas

Data da auditoria: 18/05/2026

Escopo: bases em `js/data/*.js`, bases legadas `js/locais-data.js` e `js/rotas-data.js`, busca, chatbot e roteiro IA. Nenhum dado turistico foi alterado nesta rodada.

## Resumo atual

| Indicador | Valor |
| --- | ---: |
| Itens consolidados em `TURISMO_DATA` | 83 |
| Pontos | 32 |
| Roteiros | 6 |
| Hospedagens | 7 |
| Restaurantes/gastronomia | 19 |
| Eventos | 8 |
| Informacoes essenciais/servicos | 11 |
| Itens sem coordenadas | 17 |

Categorias detectadas:

- Cultura
- Eventos
- Gastronomia
- Historia
- Hospedagem
- Institucional
- Natureza
- Roteiros
- Servicos
- Rota Cultural
- Rota Gastronomica
- Rota Natureza
- Rota Regional
- Rota Rural

## 1. Bases primarias

| Arquivo | Tipo | Status | Observacao |
| --- | --- | --- | --- |
| `js/data/pontos-turisticos.js` | Pontos turisticos resumidos | Ativo | Base nova consumida pelo centralizador. |
| `js/data/rotas.js` | Roteiros resumidos | Ativo | Roteiros sem coordenada unica devem continuar assim. |
| `js/data/hospedagens.js` | Hospedagens | Ativo | Inclui hospedagens recentes e legadas. |
| `js/data/restaurantes.js` | Gastronomia | Ativo | Inclui Ancestral e outros empreendimentos. |
| `js/data/eventos.js` | Eventos | Ativo | Eventos podem compartilhar coordenadas com locais. |
| `js/data/informacoes-essenciais.js` | Servicos/informacoes | Ativo | Alguns itens sao navegacionais, nao pontos fisicos. |
| `js/data/turismo-data.js` | Centralizador | Ativo | Fonte agregada para mapa e busca. |
| `js/data/turismo-data-adapter.js` | Adaptador | Ativo | Integra bases legadas sem duplicar manualmente. |

## 2. Bases legadas

| Arquivo | Papel atual | Ainda necessario? | Risco de remover |
| --- | --- | --- | --- |
| `js/locais-data.js` | Dados ricos de locais e pagina individual `local`. | Sim | Alto: perder detalhes, imagens e coordenadas. |
| `js/rotas-data.js` | Dados ricos de rotas e empreendimentos. | Sim | Alto: perder empreendimentos recentes e imagens. |
| `js/search-index.js` | Indice de busca com fallback e URLs. | Sim | Medio: busca global perde cobertura. |
| `js/chatbot.js` | Respostas turisticas fixas. | Sim, mas duplicado. | Medio: pode responder conteudo antigo. |
| `js/roteiro-ia.js` | Roteiro com base propria. | Sim, se pagina seguir publica. | Medio: dados podem divergir do mapa. |

## 3. Dados duplicados

### Duplicidade por nome

| Nome normalizado | Itens | Diagnostico |
| --- | --- | --- |
| `rua do mathe` | `pontos:rua-do-mathe`, `restaurantes:rua-do-mathe` | Pode ser intencional: local turistico e polo gastronomico. Revisar antes de fundir. |

### Coordenadas compartilhadas

| Coordenada | Itens | Diagnostico |
| --- | --- | --- |
| `-25.87800,-50.38500` | Rua do Mathe, Polskie Smaki, Feira Gastronomica, Feira do Produtor | Provavel reuso intencional para eventos/polo. |
| `-25.87620,-50.38560` | Chimarródromo, Roda de Mathe | Provavel evento no mesmo local. |
| `-25.96601,-50.53982` | Pitayas Dragao, Viveiro Fluviopolis, Propriedade Seu Luiz, Sitio Pica-pau Vermelho, Posto Pelanda | Coordenada generica suspeita; revisar. |
| `-25.90240,-50.27604` | Propriedade do Tico, Sitio Ludevico, Sitio Sapopema | Coordenada compartilhada suspeita; revisar. |
| `-25.88000,-50.39000` | Parque de Exposicoes, AgroSamas | Provavel evento no mesmo local. |
| `-25.87750,-50.38400` | Natal Ouro Verde, Miss Sao Mateus, Prefeitura Municipal | Provavel evento/centro civico. |

## 4. Dados ainda hardcoded

| Local | Tipo de dado | Risco | Recomendacao |
| --- | --- | --- | --- |
| `index.html` | Cards, textos editoriais e secoes fixas. | Medio | Migrar apenas quando houver renderer estavel. |
| `js/chatbot.js` | Respostas por palavra-chave. | Medio | Consumir `TURISMO_DATA` em fase futura. |
| `js/roteiro-ia.js` | Pontos e regras proprios. | Medio | Migrar para base central. |
| `js/search-index.js` | Entradas fixas/fallbacks e URLs. | Medio | Padronizar com `TURISMO_DATA`. |
| Paginas legadas | Textos e cards proprios. | Medio | Transformar em pontes ou consumir base central. |

## 5. Dados que podem ser absorvidos

| Origem | Destino futuro | Condicao |
| --- | --- | --- |
| `js/locais-data.js` | `js/data/pontos-turisticos.js` ou fonte unica futura | Depois que `local.html` tambem consumir a fonte nova. |
| `js/rotas-data.js` | Bases de restaurantes, hospedagens, pontos e roteiros | Depois de mapear campos sem perda. |
| `js/roteiro-ia.js` | `TURISMO_DATA` | Depois de definir regras de roteiro por categoria/tag. |
| `js/chatbot.js` | Consulta em `TURISMO_DATA` | Depois de preservar respostas institucionais. |
| Dados da HOME | `TURISMO_DATA_META` e secoes editoriais | Apenas para estatisticas/cards, sem reescrever layout. |

## 6. Dados que nao devem ser removidos ainda

- `js/locais-data.js`
- `js/rotas-data.js`
- `js/data/turismo-data-adapter.js`
- dados de itens sem coordenadas
- roteiros sem coordenada unica
- imagens de empreendimentos ainda nao estruturadas
- pontes `/local?id=...`
- textos fixos de chatbot/roteiro IA ate existir substituto testado

## 7. Plano de migracao segura

1. Congelar a base central como leitura autoritativa para o mapa.
2. Criar relatorio de equivalencia campo a campo entre base nova e legado.
3. Migrar um tipo por vez: restaurantes, hospedagens, pontos, eventos, roteiros.
4. Validar contagens antes/depois em `window.TURISMO_DATA_META`.
5. Validar mapa, busca, modal de detalhes e pagina `local`.
6. Somente depois marcar arquivo legado como candidato a remocao.

## 8. Pendencias de empreendimentos

| Item | Status atual | Recomendacao |
| --- | --- | --- |
| Ancestral Gastronomia | Imagens e galeria estruturadas. | Manter; revisar peso se necessario. |
| Ribeiro Pesca e Turismo | Galeria estruturada em dados legados/adaptados. | Manter; otimizar imagens pesadas depois. |
| Nova Esperanca | Galeria estruturada. | Manter; otimizar imagens grandes. |
| Doces e Delicias | Imagens em `images/empreendimentos/`, sem item seguro consolidado. | Nao cadastrar automaticamente. Precisa decisao humana. |
| Casa da Memoria | TXT recebido vazio em rodada anterior; dados atuais preservados. | Nao alterar sem fonte confirmada. |
| HEIC/DNG | Material bruto nao web. | Nao usar diretamente; decidir conversao futura. |
| Video da Rei Verde | Nao vinculado ao site. | Decidir se entra como video, imagem poster ou nao entra. |
| Baldo | Dados aparecem em informacoes essenciais/legado. | Revisar imagem principal antes de alterar. |
| Marina Barra do Iguacu | Aparece em gastronomia. | Revisar se ha imagem web segura. |
| Hotel Moro | Hospedagem com galeria/campos recentes. | Manter; validar imagem principal. |

## 9. Itens sem imagem

Existem muitos itens sem imagem principal, especialmente empreendimentos rurais, hospedagens, eventos e informacoes essenciais. Isso nao e erro automatico: o modal de detalhes deve exibir placeholder/estado sem imagem e ocultar campos ausentes.

Acao recomendada: priorizar imagens de itens mais acessados, sem inventar ou baixar imagens externas.

## 10. Itens sem coordenadas

Itens sem coordenadas continuam validos como cards/lista, mas nao devem mostrar botao "Como chegar".

Casos esperados:

- roteiros tematicos;
- informacoes essenciais navegacionais;
- hospedagens sem endereco confirmado;
- eventos sem local unico.

Acao recomendada: manter `null` ate haver coordenada confirmada.
