# Auditoria de CSS

Data da auditoria: 18/05/2026

Relatorio bruto relacionado: `docs/auditoria-output/project-report.md`

## 1. CSS essencial

| Arquivo | Papel | Cautela |
| --- | --- | --- |
| `css/index.css` | HOME, componentes globais, overrides finais e ajustes mobile. | Muito sensivel; nao limpar em lote. |
| `css/mapa-turistico.css` | Mapa turistico, cards, filtros e modal/drawer de detalhes. | Preservar comportamento mobile e z-index. |
| `css/shared.css` | Base compartilhada de paginas internas. | Afeta varias paginas. |
| `css/components.css` | Componentes comuns. | Revisar uso antes de mover regras. |
| `css/accessibility.css` | Acessibilidade/controles. | Nao alterar sem teste de teclado e contraste. |
| `css/mobile-fixes.css` | Correcoes mobile. | Provavelmente cobre regressao antiga. |

## 2. CSS legado

| Arquivo | Diagnostico | Acao recomendada |
| --- | --- | --- |
| `css/rotas-completas.css` | Estilo dedicado ao catalogo antigo. | Congelar ate decidir papel de `rotas-completas`. |
| `css/o-que-fazer.css` | Estilo de pagina tematica antiga. | Revisar quando transformar em ponte. |
| `css/sabores.css` | Estilo de pagina tematica antiga. | Revisar apos consolidacao no mapa. |
| `css/onde-ficar.css` | Estilo de pagina tematica antiga. | Revisar apos consolidacao no mapa. |
| `css/mapa-completo.css` | Estilo de mapa antigo. | Nao misturar com `mapa-turistico.css`. |
| `css/mapa3d.css` | Experiencia experimental. | Manter isolado. |
| `css/portal-usuario.css` | Fluxo administrativo/usuario. | Depende de decisao futura. |
| `css/admin.css` | Admin/Firebase antigo ou futuro. | Nao remover sem decisao. |

## 3. Regras duplicadas

Duplicidades encontradas por seletor:

| Seletor/Bloco | Arquivos | Risco |
| --- | --- | --- |
| `.back-to-top`, `.back-to-top.visible`, `.back-to-top:hover` | `css/index.css`, `css/rotas-completas.css` | Comportamento visual diferente por pagina. |
| `.filter-btn` | `css/eventos.css`, `css/onde-ficar.css`, `css/rotas-completas.css` | Botao de filtro pode divergir entre paginas. |
| `.header-logo`, `.header-title`, `.header-nav` | `css/shared.css`, `css/rotas-completas.css`, `css/noticias.css` | Header pode mudar por pagina. |
| `.modal`, `.modal-overlay`, `.modal-close` | `css/eventos.css`, `css/portal-usuario.css` | Risco de conflito com modal do mapa se escopo global crescer. |
| `.local-card`, `.local-btn`, `.produtor-locais` | `css/index.css`, `css/sabores.css` | Cards de conteudo turistico duplicados. |
| `.map-popup` | `css/mapa-completo.css`, `css/mapa-turistico.css` | Dois mapas com popups diferentes. |
| Media queries `768px`, `480px`, `390px` | Varios CSS | Ajustes mobile podem se sobrepor sem rastreabilidade. |

## 4. Regras conflitantes

| Area | Evidencia | Recomendacao |
| --- | --- | --- |
| HOME/header | `css/index.css` concentra varias camadas e overrides finais. | Sempre revisar o fim do arquivo antes de concluir que uma regra nao pegou. |
| Header compartilhado | `shared.css`, `nav-shared.js` e CSS de paginas antigas atuam juntos. | Centralizar depois, com teste por pagina. |
| Modal/drawer do mapa | `css/mapa-turistico.css` usa overlay fixo, body lock e z-index alto. | Testar contra busca, menu mobile, VLibras e chatbot. |
| Botao flutuante | Regras aparecem em mais de um CSS. | Escolher um padrao global em fase posterior. |
| Cards turisticos | HOME, sabores, rotas e mapa possuem variantes. | Evitar unificacao antes de decidir quais paginas permanecem. |

## 5. Pontos de risco mobile

| Ponto | Risco | Validacao necessaria |
| --- | --- | --- |
| `css/index.css` | Muitos `!important` e media queries podem gerar regressao em 390/430 px. | HOME em 390, 430, 768. |
| `css/mapa-turistico.css` | Drawer de detalhes precisa caber sem ficar atras do header/chat/VLibras. | Mapa e modal em 390/430. |
| `css/shared.css` + `nav-shared.js` | Menu mobile e dropdowns dependem de classe/JS. | Teclado e toque. |
| Paginas ponte | Algumas pontes podem ter HTML minimo sem refinamento visual. | Validar pagina por pagina. |
| `rotas-completas.css` | Legado tem ajustes proprios de floating buttons. | Nao reaproveitar sem teste. |

## 6. Proposta de limpeza em etapas

1. Mapear seletores realmente usados por pagina, sem remover.
2. Isolar CSS legado por pagina e impedir que vire padrao novo.
3. Reduzir duplicidade de header apenas depois de validar `nav-shared.js`.
4. Consolidar botoes/filtros compartilhados em um arquivo comum.
5. Reduzir `!important` por bloco, com teste visual em HOME e mapa.
6. Revisar mobile em 390, 430, 768, 1024, 1440 e 1920.

## 7. Arquivos que devem ser tratados com cautela

- `css/index.css`: muito grande, com overrides importantes.
- `css/mapa-turistico.css`: fluxo principal atual.
- `css/shared.css`: afeta paginas internas.
- `css/mobile-fixes.css`: pode representar correcoes de regressao.
- `css/accessibility.css`: risco de quebrar controles acessiveis.
- CSS de paginas legadas: nao limpar ate decidir se viram ponte ou permanecem.
