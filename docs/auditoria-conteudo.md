# Auditoria de textos e conteudo

Data da auditoria: 18/05/2026

Escopo: textos em HTML, JS, dados, busca, modal de detalhes e paginas legadas. Nenhum texto foi reescrito em massa nesta rodada.

## 1. Textos duplicados ou concorrentes

| Tema | Onde aparece | Risco | Recomendacao |
| --- | --- | --- | --- |
| Mapa turistico | HOME, `mapa-turistico.html`, busca, chatbot, informacoes essenciais | Baixo | Manter como fluxo principal. |
| O Que Fazer | `o-que-fazer.html`, ponte, breadcrumbs, manifest | Medio | Decidir se vira ponte para mapa filtrado. |
| Rotas Completas | `rotas-completas.html`, ponte, breadcrumbs | Medio | Evitar tratar como catalogo principal. |
| Sabores | `sabores.html`, ponte, cards de gastronomia | Medio | Consolidar com categoria Gastronomia no mapa. |
| Onde Ficar | `onde-ficar.html`, ponte, busca | Medio | Consolidar com categoria Hospedagem no mapa. |
| Local individual | `local.html`, `/local?id=...`, dados de pontos | Baixo/medio | Manter enquanto houver fluxo seguro. |

## 2. Textos antigos ou genericos

| Local | Sinal | Acao recomendada |
| --- | --- | --- |
| `noticias.html` | Links para `/portal/noticias/...` sem rota local. | Decidir destino real ou transformar em placeholder claro. |
| `portal-usuario.html` | Fluxo administrativo/usuario sem clareza de status publico. | Decidir se fica oculto, ponte ou futuro admin. |
| `roteiro-ia.html` | Texto/experiencia com base propria. | Revisar quando migrar para `TURISMO_DATA`. |
| `chatbot.js` | Respostas podem ficar atrasadas em relacao ao mapa. | Passar a consultar dados centrais em fase futura. |
| Paginas antigas | Algumas ainda vendem catalogos separados. | Atualizar narrativa quando virarem ponte. |

## 3. Labels inconsistentes

| Label/termo | Variacoes | Recomendacao |
| --- | --- | --- |
| `Ver detalhes` | Botao em cards do mapa/modal. | Manter como acao de abrir modal, nunca link vazio. |
| `Como chegar` | Link de mapa/rota. | Mostrar somente com coordenadas ou URL confirmada. |
| `Roteiro tematico` | Modal/roteiros. | Usar para itens sem coordenada unica. |
| `Sem imagem cadastrada` | Estado de ausencia de imagem. | Manter discreto; nao mostrar `undefined`. |
| `O Que Fazer` | Pagina antiga e categoria editorial. | Decidir se continua nome publico ou ponte. |
| `Rotas Completas` | Catalogo antigo. | Evitar como fluxo principal. |

## 4. Numeros fixos antigos

Risco principal: estatisticas manuais em HTML ficarem diferentes de `window.TURISMO_DATA_META`.

Acao recomendada:

- usar `js/site-stats.js` ou metadados centrais quando possivel;
- evitar novos numeros fixos em HOME, mapa e paginas tematicas;
- manter textos editoriais sem contagem quando a fonte nao for dinamica.

## 5. Placeholders e links externos

| Caso | Evidencia | Acao |
| --- | --- | --- |
| `https://maps.app.goo.gl/exemplo` | Encontrado em dados legados. | Substituir somente quando houver URL real confirmada. |
| Noticias `/portal/noticias/...` | Rotas locais inexistentes. | Decisao humana. |
| Exemplos de imagem em docs | Referencias de exemplo sem arquivo real. | Pode manter como exemplo ou marcar como ficticio. |
| Telefone/site/Instagram ausentes | Campos opcionais em dados. | Ocultar no modal, nao inventar. |

## 6. Textos que devem estar em `translations.js`

Prioridade para futura internacionalizacao:

- labels de botoes do mapa: `Ver detalhes`, `Como chegar`, `Contato`;
- estados de campo ausente: `Sem imagem cadastrada`;
- categorias exibidas: `Gastronomia`, `Hospedagem`, `Roteiro tematico`;
- textos do modal/drawer;
- mensagens de busca vazia e filtros.

## 7. Modal de detalhes

O modal deve continuar consumindo apenas campos existentes. Textos importantes:

- nome do local;
- categoria;
- descricao curta e longa;
- endereco;
- horario;
- telefone/WhatsApp;
- tags/servicos;
- link externo;
- estado sem imagem;
- tipo especial para roteiro.

Risco: se dados legados usarem nomes de campos diferentes, o modal precisa manter normalizacao defensiva.

## 8. Recomendacoes

1. Nao reescrever conteudo em massa antes da limpeza de rotas.
2. Decidir primeiro quais paginas antigas viram ponte.
3. Migrar labels recorrentes para `translations.js` em fase propria.
4. Revisar placeholders com fonte humana.
5. Manter `Sem imagem cadastrada` e campos ocultos para evitar informacao inventada.
