# Auditoria de JavaScript

Data da auditoria: 18/05/2026

Relatorios brutos relacionados:

- `docs/auditoria-output/project-report.md`
- `docs/auditoria-output/links-report.md`

## 1. Scripts essenciais

| Script | Papel | Observacao |
| --- | --- | --- |
| `js/nav-shared.js` | Navegacao compartilhada, menu, busca, acessibilidade, injecao de scripts comuns. | Hub de alto risco. |
| `js/mapa-turistico.js` | Mapa, filtros, cards, selecao, modal/drawer de detalhes. | Fluxo principal atual. |
| `js/data/turismo-data.js` | Centraliza `window.TURISMO_DATA`. | Depende das bases carregadas antes. |
| `js/data/turismo-data-adapter.js` | Adapta `locais-data.js` e `rotas-data.js` para a base central. | Nao remover sem migracao. |
| `js/locais-data.js` | Dados ricos de pontos e pagina local. | Legado ainda necessario. |
| `js/rotas-data.js` | Dados ricos de rotas e empreendimentos. | Legado ainda necessario. |
| `js/search.js` | Interface de busca. | Depende de indice e dados globais. |
| `js/search-index.js` | Indice de busca. | Consome `TURISMO_DATA` com fallback. |
| `js/weather.js` | Previsao do tempo real da HOME. | Usa Open-Meteo, cache local de 1 hora e fallback honesto. |
| `js/site-meta.js` | Metadados do rodape. | Renderiza versao e data de atualizacao sem backend. |
| `translations.js` | Textos multi-idioma. | Carregado por muitas paginas. |
| `config.js` | Configuracoes globais. | Usado por paginas atuais e antigas. |

## 2. Scripts legados

| Script | Diagnostico | Acao recomendada |
| --- | --- | --- |
| `js/mapa-completo.js` | Mapa antigo separado. | Manter ate decidir aposentadoria. |
| `js/mapa3d.js` | Experiencia 3D/experimental com dados proprios. | Nao misturar com mapa turistico. |
| `js/roteiro-ia.js` | Usa base propria simplificada. | Migrar futuramente para `TURISMO_DATA`. |
| `js/portal-usuario.js` | Fluxo de usuario/admin. | Depende de decisao de produto. |
| `js/admin.js` | Admin/Firebase antigo ou futuro. | Nao remover agora. |
| `js/reservas.js` | Fluxo separado de reservas. | Revisar se ainda e produto ativo. |
| `js/loading.js` | Loading/UX global ou legado. | Revisar carregamento real. |

## 3. Ordem de carregamento critica

Ordem segura atual para o mapa:

1. `js/locais-data.js`
2. `js/rotas-data.js`
3. `js/data/pontos-turisticos.js`
4. `js/data/rotas.js`
5. `js/data/hospedagens.js`
6. `js/data/restaurantes.js`
7. `js/data/eventos.js`
8. `js/data/informacoes-essenciais.js`
9. `js/data/turismo-data-adapter.js`
10. `js/data/turismo-data.js`
11. `js/search-index.js`
12. `js/search.js`
13. `js/mapa-turistico.js`

Risco: os arquivos legados usam `const` globais, como `locaisData`, `routeInfo` e `establishments`. Se forem carregados duas vezes no mesmo contexto, podem gerar `Identifier already declared`.

## 4. Variaveis globais usadas

| Global | Origem | Uso |
| --- | --- | --- |
| `window.TURISMO_DATA` | `js/data/turismo-data.js` | Fonte central do mapa e busca. |
| `window.TURISMO_DATA_META` | `js/data/turismo-data.js` | Estatisticas e integracao legado/base nova. |
| `window.TURISMO_PONTOS` | `js/data/pontos-turisticos.js` | Base nova de pontos. |
| `window.TURISMO_ROTAS` | `js/data/rotas.js` | Base nova de roteiros. |
| `window.TURISMO_HOSPEDAGENS` | `js/data/hospedagens.js` | Base nova de hospedagens. |
| `window.TURISMO_RESTAURANTES` | `js/data/restaurantes.js` | Base nova de gastronomia. |
| `window.TURISMO_EVENTOS` | `js/data/eventos.js` | Base nova de eventos. |
| `window.TURISMO_INFO_ESSENCIAIS` | `js/data/informacoes-essenciais.js` | Blocos de apoio. |
| `window.SMS_WEATHER` | `js/weather.js` | Configuracao publica da previsao: cidade, cache key e TTL. |
| `locaisData` | `js/locais-data.js` | Base legada de locais. |
| `routeInfo`, `establishments` | `js/rotas-data.js` | Base legada de rotas e empreendimentos. |

## 5. Duplicidades

| Caso | Evidencia | Acao recomendada |
| --- | --- | --- |
| Dados de turismo em base nova e legada | `TURISMO_DATA` ainda agrega `locais-data.js` e `rotas-data.js`. | Manter adapter ate migracao completa. |
| Busca e chatbot com conteudo proprio | `search-index.js` e `chatbot.js` possuem textos fixos/fallbacks. | Reduzir duplicidade em fase futura. |
| Roteiro IA com pontos proprios | `js/roteiro-ia.js` nao depende totalmente de `TURISMO_DATA`. | Migrar depois. |
| Mapas separados | `mapa-turistico.js`, `mapa-completo.js`, `mapa3d.js`. | Definir quais ficam publicos. |
| Cloudflare email decode | `index.html` carregava script externo de email protection em duplicidade. | Resolvido na rodada 1: email convertido para `mailto:` e scripts Cloudflare removidos. |

## 6. Ajuste no auditor de links

Na rodada 1, `scripts/audit-links.mjs` foi ajustado para reduzir falsos positivos sem alterar a logica do site:

- links externos oficiais da Prefeitura deixam de ser reduzidos para rota local;
- strings de CSS/data SVG nao entram como links internos;
- comentarios JS deixam de gerar falso positivo de asset;
- assets injetados por JS tambem podem ser resolvidos a partir da raiz publica.

Na mesma rodada, `local.html` passou a carregar `js/locais-data.js` antes do script inline da pagina individual. A alteracao preserva a base legada e evita o estado falso de "Local nao encontrado" em `/local/?id=igreja-matriz`.

`sw.js` tambem foi ajustado de `turismo-sms-v11` para `turismo-sms-v12` e deixou de cachear requisicoes de navegacao, mantendo coerencia com a regra documentada de nao cachear HTML.

## 7. Riscos

| Risco | Gravidade | Recomendacao |
| --- | --- | --- |
| Duplicacao de scripts com query string | Alta | Manter deteccao query-aware em `nav-shared.js`. |
| Variaveis `const` globais em scripts legados | Alta | Evitar carregar bases legadas duas vezes. |
| Service worker mantendo JS antigo | Media | Revisar estrategia de cache antes de novas mudancas grandes. |
| API de clima indisponivel | Baixa | Manter cache local e mensagem honesta sem dados mockados. |
| `nav-shared.js` fazer muitas responsabilidades | Alta | Documentar antes de quebrar em partes. |
| Links antigos em `search-index.js` | Media | Padronizar URLs na fase de rotas. |
| Modal de detalhes depender de campos opcionais | Baixa | Continuar ocultando campo vazio/ausente. |

## 8. Recomendacoes de limpeza

1. Congelar scripts legados enquanto ainda alimentam dados.
2. Padronizar ordem de carregamento em `index.html` e `mapa-turistico.html`.
3. Revisar `nav-shared.js` em uma fase propria, com testes de menu, busca, acessibilidade e service worker.
4. Migrar `chatbot.js`, `roteiro-ia.js` e paginas antigas para consumir `TURISMO_DATA`.
5. Remover ou aposentar scripts antigos apenas quando a rota correspondente virar ponte definitiva.
6. Manter `node --check` como validacao minima para qualquer alteracao em JS.
