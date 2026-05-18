# Auditoria geral do site

Data da auditoria: 18/05/2026

Escopo: inventario tecnico sem remocao, sem migracao de dados, sem alteracao visual e sem instalacao de dependencias.

Relatorios brutos gerados:

- `docs/auditoria-output/project-report.md`
- `docs/auditoria-output/project-report.json`
- `docs/auditoria-output/links-report.md`
- `docs/auditoria-output/links-report.json`

## 1. Visao geral da estrutura atual

O projeto e um site estatico com HTML, CSS e JavaScript globais. A estrutura atual mistura tres camadas:

- paginas principais atuais, com destaque para `index.html` e `mapa-turistico.html`;
- paginas legadas ou de compatibilidade, como `rotas-completas.html`, `o-que-fazer.html`, `sabores.html`, `onde-ficar.html`, `mapa-completo.html` e `mapa-3d.html`;
- bases de dados centralizadas e bases legadas, unidas por `js/data/turismo-data.js` e `js/data/turismo-data-adapter.js`.

Resumo do inventario automatico:

| Item | Quantidade |
| --- | ---: |
| Arquivos analisados | 248 |
| HTML | 36 |
| CSS | 21 |
| JavaScript | 31 |
| Midias | 123 |
| `index.html` em subpastas | 14 |

## 2. Principais areas do site

| Area | Arquivos principais | Papel atual | Observacao |
| --- | --- | --- | --- |
| HOME | `index.html`, `css/index.css`, `js/site-stats.js`, `js/nav-shared.js` | Entrada institucional e turistica | Alta concentracao de CSS e scripts compartilhados. |
| Mapa turistico | `mapa-turistico.html`, `js/mapa-turistico.js`, `css/mapa-turistico.css`, `js/data/*`, `js/locais-data.js`, `js/rotas-data.js` | Experiencia principal de exploracao | Fluxo central atual. Deve ser preservado. |
| Detalhes de local | `local.html`, `local/index.html`, `js/locais-data.js` | Pagina individual antiga/compatibilidade | Ainda aparece em links de dados e busca. |
| Rotas antigas | `rotas-completas.html`, `rotas-completas/index.html`, `js/rotas-data.js`, `css/rotas-completas.css` | Catalogo legado/ponte | Nao deve voltar a competir com o mapa sem decisao. |
| Paginas ponte | `*/index.html` em rotas conhecidas | Compatibilidade de URL sem `.html` | Devem ser mantidas enquanto houver links externos/antigos. |
| Busca | `js/search.js`, `js/search-index.js`, `translations.js` | Busca global | Depende de ordem de carregamento e dados globais. |
| Conteudo auxiliar | `noticias.html`, `privacidade.html`, `transparencia.html`, `portal-usuario.html`, `reservas.html` | Paginas institucionais/legadas | Variam entre ativo, legado e placeholder. |

## 3. Arquivos essenciais

Arquivos que nao devem ser removidos nem simplificados sem validacao ampla:

| Arquivo | Motivo |
| --- | --- |
| `index.html` | HOME atual e ponto de entrada do site. |
| `mapa-turistico.html` | Experiencia principal do turismo. |
| `css/index.css` | CSS dominante da HOME e varios elementos globais. |
| `css/mapa-turistico.css` | Estilos do mapa e modal/drawer de detalhes. |
| `css/shared.css` | Base compartilhada de paginas internas. |
| `js/nav-shared.js` | Injeta navegacao, acessibilidade, busca e scripts comuns. |
| `js/mapa-turistico.js` | Renderizacao de cards, filtros, mapa e modal de detalhes. |
| `js/data/turismo-data.js` | Agregador central em `window.TURISMO_DATA`. |
| `js/data/turismo-data-adapter.js` | Ponte entre bases novas e legadas. |
| `js/locais-data.js` | Base rica de locais e pagina `local`. |
| `js/rotas-data.js` | Base rica de rotas e empreendimentos. |
| `js/search.js` e `js/search-index.js` | Busca global e indice. |
| `translations.js` | Textos multi-idioma. |
| `config.js` | Configuracoes globais usadas em paginas antigas/atuais. |

## 4. Arquivos legados

Arquivos que parecem legados ou experimentais, mas ainda podem ser necessarios por compatibilidade:

| Arquivo/rota | Evidencia | Acao recomendada |
| --- | --- | --- |
| `rotas-completas.html` | Fluxo antigo de catalogo; ainda tem CSS/JS dedicados. | Manter como legado/ponte ate decisao de consolidacao. |
| `o-que-fazer.html` | Ainda aparece em atalhos, breadcrumbs e rotas ponte. | Revisar se deve virar ponte para mapa. |
| `sabores.html` | Pagina tematica antiga com CSS proprio. | Manter ate decidir absorcao pelo mapa. |
| `onde-ficar.html` | Pagina tematica antiga com CSS proprio. | Manter ate decidir absorcao pelo mapa. |
| `mapa-completo.html` | Mapa antigo separado. | Tratar como legado; evitar concorrencia com mapa turistico. |
| `mapa-3d.html` e `js/mapa3d.js` | Experiencia experimental com dados proprios. | Manter separado ate decisao humana. |
| `roteiro-ia.html` e `js/roteiro-ia.js` | Roteiro com base propria. | Planejar migracao futura para `TURISMO_DATA`. |
| `portal-usuario.html`, `admin-firebase.html`, `firebase.json`, `.firebaserc` | Fluxo administrativo/Firebase antigo ou futuro. | Nao remover sem decisao sobre admin/CMS. |
| `reservas.html` | Funcionalidade separada/legada. | Revisar papel antes de limpar. |

## 5. Arquivos possivelmente orfaos

Esta lista e indicativa. Nao apagar sem verificacao manual, porque arquivos podem ser usados por URLs externas, conteudo futuro ou referencias dinamicas.

| Arquivo | Motivo | Acao recomendada |
| --- | --- | --- |
| `images/EU_AMO_SMS.png` | Midia grande sem referencia estatica detectada. | Revisar uso real antes de remover. |
| `images/CHALE_DO_PRODUTOR_SEC_CULTURA.png` | Midia grande sem referencia estatica detectada. | Revisar. |
| `images/IGREJA_COLONIA_IGUACU.png` | Midia grande sem referencia estatica detectada. | Revisar. |
| `images/PARQUE_EXPOSICOES_1.jpg` ate `images/PARQUE_EXPOSICOES_7.jpg` | Serie sem referencia estatica detectada. | Ver se deve virar galeria ou quarentena futura. |
| `images/CUIA_1.JPG`, `images/CUIA_3.JPG` | Variacoes de serie sem referencia estatica detectada. | Revisar canonica. |
| `images/logo_turismo_completa.png` | Logo sem referencia estatica detectada. | Revisar antes de remover. |
| `images/praca_rio_iguacu.jpg` | Nome parecido com imagem usada em maiusculas. | Padronizar depois, se confirmado. |
| `images/empreendimentos/doces-e-delicias/*.jpeg` | Imagens copiadas, mas sem item estruturado no mapa. | Manter; depende de decisao humana sobre cadastro. |

A lista completa esta em `docs/auditoria-output/assets-report.md`.

## 6. Arquivos de compatibilidade

As pastas com `index.html` funcionam como aliases para URLs sem `.html`:

| Ponte | Destino esperado |
| --- | --- |
| `eventos/index.html` | `eventos.html` |
| `galeria/index.html` | `galeria.html` |
| `local/index.html` | `local.html` |
| `mapa-3d/index.html` | `mapa-3d.html` |
| `mapa-completo/index.html` | `mapa-completo.html` |
| `noticia/index.html` | Fluxo de noticia individual/legado |
| `noticias/index.html` | `noticias.html` |
| `o-que-fazer/index.html` | `o-que-fazer.html` |
| `onde-ficar/index.html` | `onde-ficar.html` |
| `portal-usuario/index.html` | `portal-usuario.html` |
| `privacidade/index.html` | `privacidade.html` |
| `rotas-completas/index.html` | `rotas-completas.html` |
| `sabores/index.html` | `sabores.html` |
| `transparencia/index.html` | `transparencia.html` |

Essas pontes devem ser mantidas ate haver um plano de redirecionamento definitivo.

## 7. Auditoria de links e rotas

Resumo automatico:

| Item | Quantidade |
| --- | ---: |
| Links internos analisados | 587 |
| Links quebrados ou suspeitos | 19 |
| Candidatos legados/redundantes | 12 |
| Links internos com `.html` | 66 |
| Links que precisam de decisao humana | 17 |
| Links `Ver detalhes` que ainda navegam indevidamente | 0 |

### Links quebrados ou suspeitos

| Origem | Destino | Diagnostico | Acao |
| --- | --- | --- | --- |
| `index.html` | `/eventos#setembro` | Anchor nao encontrado no destino estatico. | Criar anchor real ou ajustar link. |
| `index.html` | `/eventos#dezembro` | Anchor nao encontrado no destino estatico. | Criar anchor real ou ajustar link. |
| `noticias.html` | `/portal/noticias/...` | Rotas de portal nao existem no site estatico. | Decidir se sao externas, legadas ou devem virar noticias locais. |
| `index.html` | `/cdn-cgi/l/email-protection...` | Artefato Cloudflare/email protection, nao rota local. | Revisar se o HTML exportado deve manter isso. |
| `css/index.css` | trecho SVG detectado como URL | Falso positivo do scanner em SVG/data string. | Sem acao imediata. |
| `js/loading.js` | `js/loading.js` | Falso positivo por string em script. | Sem acao imediata. |
| `js/nav-shared.js` | `images/logo_header_branca.png` | Falso positivo de resolucao relativa em JS; arquivo existe. | Sem acao imediata. |

Lista completa: `docs/auditoria-output/links-report.md`.

### Links redundantes

Foram encontrados muitos links internos com `.html` e pontes equivalentes sem `.html`. Isso nao e erro por si so, mas aumenta manutencao. A padronizacao deve ser feita em fase propria.

### Links legados

Ainda aparecem referencias para:

- `/o-que-fazer`
- `/rotas-completas`
- `/sabores`
- `/onde-ficar`
- `/mapa-completo`
- `/mapa-3d`
- `/local?id=...`

Essas rotas nao devem ser removidas agora. O risco principal e concorrerem conceitualmente com o mapa turistico ou manterem dados antigos.

### Links que devem virar ponte

Possiveis candidatos, dependendo da decisao editorial:

- `/o-que-fazer` para o mapa turistico filtrado;
- `/sabores` para `mapa-turistico.html?categoria=Gastronomia`;
- `/onde-ficar` para `mapa-turistico.html?categoria=Hospedagem`;
- `/rotas-completas` para `mapa-turistico.html?grupo=roteiros`.

### Links que devem ser mantidos

- `mapa-turistico.html`
- `local.html` e `/local/?id=...` enquanto paginas individuais existirem;
- pontes `*/index.html` enquanto houver compatibilidade de URLs;
- links externos reais de contato, mapa, site, Instagram e WhatsApp quando vinculados a dados confirmados.

### Links que precisam de decisao humana

- noticias em `/portal/noticias/...`;
- paginas `portal-usuario`, `reservas`, `admin-firebase`;
- rota experimental `mapa-3d`;
- uso publico de `mapa-completo`;
- imagens e pasta `doces-e-delicias` sem cadastro consolidado.

## 8. Riscos identificados

| Risco | Gravidade | Evidencia | Recomendacao |
| --- | --- | --- | --- |
| CSS muito concentrado em `css/index.css` | Media | 132 KB, 448 `!important`, 38 media queries. | Limpeza por blocos, nunca em lote. |
| Bases antigas ainda necessarias | Alta | `locais-data.js` e `rotas-data.js` alimentam mapa via adapter. | Nao remover ate migracao completa. |
| Rotas antigas competindo com mapa | Media | `o-que-fazer`, `sabores`, `onde-ficar`, `rotas-completas`. | Transformar em ponte gradualmente. |
| Midias pesadas | Media | Videos de 90 MB+ e PNGs de 3 MB a 5 MB. | Otimizar em fase propria. |
| Links de noticias para portal inexistente | Media | Varios `/portal/noticias/...`. | Decidir destino ou criar ponte. |
| Dados fixos fora do centralizador | Media | `chatbot.js`, `roteiro-ia.js`, partes da HOME. | Migrar com testes em fase futura. |
| Ordem de carregamento de scripts | Alta | Dados globais e adapter dependem de ordem. | Documentar e reduzir globais antes de mexer. |
| Service worker/cache | Media | Pode manter versoes antigas de scripts. | Revisar cache antes de grandes trocas de JS/CSS. |
