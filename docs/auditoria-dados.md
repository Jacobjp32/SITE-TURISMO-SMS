# Auditoria das bases de dados turísticas

| Arquivo | Tipo de dado | Ainda usado? | Observação | Próxima ação recomendada |
| --- | --- | --- | --- | --- |
| `js/data/pontos-turisticos.js` | Pontos turísticos resumidos | Sim | Base nova usada pela camada central | Ampliar cobertura com mais pontos de `locais-data.js` |
| `js/data/rotas.js` | Rotas resumidas | Sim | Base nova usada pela camada central | Conectar com detalhes de `rotas-data.js` |
| `js/data/hospedagens.js` | Hospedagens resumidas | Sim | Base nova usada pela camada central | Incluir mais hospedagens reais conforme catálogo crescer |
| `js/data/restaurantes.js` | Restaurantes e polos gastronômicos | Sim | Base nova usada pela camada central | Expandir com empreendimentos da Rota Polonesa e Fluviópolis |
| `js/data/eventos.js` | Eventos anuais e recorrentes | Sim | Base nova usada pela camada central | Integrar com calendário dinâmico quando houver fonte estável |
| `js/data/informacoes-essenciais.js` | Blocos de apoio ao visitante | Sim | Base nova usada pela camada central | Reaproveitar na HOME e em páginas temáticas futuras |
| `js/data/turismo-data.js` | Centralizador | Sim | Reúne as bases novas em `window.TURISMO_DATA` | Tornar ponto de entrada padrão para novos scripts |
| `js/search-index.js` | Índice da busca | Sim | Já lê `window.TURISMO_DATA` com fallback | Manter como adaptador da busca |
| `js/locais-data.js` | Pontos turísticos ricos e páginas de local | Sim | Fonte legada importante, mais detalhada que a nova | Migrar gradualmente para alimentar `TURISMO_PONTOS` |
| `js/rotas-data.js` | Rotas e empreendimentos ricos | Sim | Fonte legada importante, cobre restaurantes, hospedagens e experiências | Definir como fonte principal futura para rotas completas |
| `js/roteiro-ia.js` | Pontos e regras para roteiros | Sim | Usa base própria simplificada | Passar a consumir `TURISMO_DATA` em rodada futura |
| `js/chatbot.js` | Respostas por palavras-chave | Sim | Conteúdo turístico fixo, não centralizado | Trocar respostas estáticas por consultas à camada central |
| `js/mapa3d.js` | Pontos do mapa 3D experimental | Sim | Coordenadas próprias e subconjunto separado | Fazer mapa ler `TURISMO_DATA.pontos` mais tarde |
| `index.html` | Conteúdo editorial e cards da HOME | Sim | Ainda concentra dados visuais renderizados direto | Migrar só quando houver renderer estável |
