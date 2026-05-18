# Auditoria visual e mobile

Data da auditoria: 18/05/2026

Escopo solicitado: HOME, mapa turistico, modal/drawer de detalhes, `o-que-fazer`, `rotas-completas`, noticias, `local?id=igreja-matriz`, privacidade e paginas ponte nos breakpoints 1920, 1440, 1024, 768, 430 e 390.

## Limitacao da validacao

Foi iniciado servidor local em `http://127.0.0.1:8080/`, mas a automacao visual com screenshot nao conseguiu navegar de forma confiavel no navegador integrado nesta rodada. Portanto, esta auditoria visual ficou limitada a:

- analise de estrutura HTML/CSS/JS;
- relatorios automaticos de links/assets;
- leitura de CSS, media queries, z-index e pontos de conflito;
- validacao sintatica dos scripts.

As recomendacoes abaixo devem ser confirmadas com captura visual humana ou nova rodada de QA em navegador.

## 1. Problemas encontrados

| Problema | Paginas afetadas | Gravidade | Evidencia | Recomendacao |
| --- | --- | --- | --- | --- |
| CSS principal muito grande e com muitos overrides | HOME e elementos globais | Media | `css/index.css` tem 132 KB e 448 `!important`. | Validar HOME em 390/430 antes de qualquer limpeza. |
| Header definido por CSS compartilhado e CSS especificos | Internas, legadas e pontes | Media | Seletores de header aparecem em varios CSS. | Centralizar apenas em fase planejada. |
| Modal/drawer do mapa precisa teste real contra overlays | Mapa turistico | Media | Overlay usa z-index alto e body lock. | Testar com menu, busca, VLibras e chat. |
| Paginas antigas podem concorrer visualmente com mapa | `o-que-fazer`, `sabores`, `onde-ficar`, `rotas-completas` | Media | CSS e layouts proprios. | Decidir se viram ponte. |
| Botao flutuante/back-to-top duplicado | HOME e `rotas-completas` | Baixa/media | Seletores duplicados. | Padronizar depois. |
| Noticias apontam para rotas inexistentes | `noticias.html` | Media | Links `/portal/noticias/...`. | Corrigir destino ou ponte. |
| Imagens muito pesadas podem degradar percepcao | HOME, mapa, modal | Media | Videos 90 MB+ e PNGs 3 MB+. | Otimizar assets em fase propria. |

## 2. Paginas afetadas

| Pagina | Status tecnico | Risco visual |
| --- | --- | --- |
| `index.html` | Ativa, complexa, com CSS dominante. | Alto em mobile por volume de overrides. |
| `mapa-turistico.html` | Ativa, fluxo principal. | Medio por mapa, cards, filtros e modal. |
| `o-que-fazer.html` | Legada/tematica. | Medio se continuar competindo com mapa. |
| `rotas-completas.html` | Legada/catalogo. | Medio; CSS proprio. |
| `noticias.html` | Ativa/legada. | Medio por links quebrados. |
| `local.html?id=igreja-matriz` | Compatibilidade de local. | Medio; depende de dados legados. |
| `privacidade.html` | Institucional. | Baixo; validar header/rodape. |
| Pontes `*/index.html` | Compatibilidade. | Baixo/medio; podem ter UX simples. |

## 3. Breakpoints a validar manualmente

| Breakpoint | Foco |
| --- | --- |
| 1920 | Hero da HOME, largura de grids, mapa e modal centralizado. |
| 1440 | Layout desktop padrao. |
| 1024 | Tablet/hibrido, header e filtros. |
| 768 | Menu mobile/tablet, cards e rodape. |
| 430 | Drawer do modal, botoes tocaveis, sem overflow horizontal. |
| 390 | Pior caso mobile comum, chat/VLibras nao cobrindo CTAs. |

## 4. Recomendacoes

1. Rodar QA visual real antes de qualquer limpeza de CSS.
2. Testar mapa com filtros, busca, marker e modal em 390/430.
3. Testar `local?id=igreja-matriz` porque ainda depende de fluxo legado.
4. Testar paginas ponte com header e rodape.
5. Testar se chat/VLibras nao cobre botoes do drawer.
6. Registrar screenshots antes/depois em futuras mudancas visuais.

## 5. O que precisa de validacao humana

- Qual pagina antiga ainda deve ser navegavel como experiencia propria.
- Se `rotas-completas` deve virar ponte total para o mapa.
- Quais imagens orfas sao realmente descartaveis.
- Se videos grandes continuam necessarios em 4K.
- Se o estado sem imagem do modal e aceitavel editorialmente.

## 6. Rodada visual/interativa de 18/05/2026

Correcoes aplicadas nesta rodada:

- HOME: os 5 indicadores da secao "Sao Mateus do Sul: Onde a Tradicao Encontra o Futuro" agora usam grid de 5 colunas em desktop/notebook, com quebra responsiva em 3/2 colunas nos tamanhos menores.
- HOME: o texto descritivo dos indicadores foi reforcado em branco para contraste com o fundo premium.
- Galeria: "Igreja Agua Branca" passou a ocupar 1 card em Patrimonio Historico, mantendo as 10 imagens no lightbox do proprio conjunto.
- Galeria: Patrimonio Historico ficou como primeira prioridade visual; Videos continuam abaixo.
- Menu mobile: o fechamento do drawer foi separado da navegacao real, preservando links, subitens, busca, idioma, overlay e ESC.
- `o-que-fazer`: pagina mantida por compatibilidade e tratada como ponte compacta para o Mapa Turistico, sem virar catalogo concorrente.
- Mapa Turistico: estatisticas de "Visao rapida" e "Resumo da exploracao" foram compactadas em mobile.

Decisoes editoriais mantidas:

- Nenhuma imagem foi apagada.
- Nenhuma pagina ponte foi removida.
- `/o-que-fazer/` e `/o-que-fazer.html` continuam ativos por compatibilidade.
- `TURISMO_DATA` nao foi alterado nesta rodada.
