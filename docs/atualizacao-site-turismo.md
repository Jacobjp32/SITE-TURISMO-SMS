# Atualizacao do site de turismo

## Rodada 2026-06-02 - rotas, noticias, LGPD e tema sazonal

### Escopo executado

- adicionar capas publicas WebP para as 6 rotas existentes;
- atualizar a home e `noticias.html` com noticias oficiais recentes do portal da Prefeitura;
- atualizar os blocos de LGPD em `transparencia.html` e `privacidade.html`;
- criar tema sazonal com modo automatico, selecao manual e persistencia local;
- preservar login, portal do usuario, admin Firebase, regras, upload e estrutura principal do mapa.

## 1. Auditoria das imagens de rotas recebidas

Origem auditada:

- `EMPREENDIMENTOS/imagens para as rotas`

Inventario bruto encontrado:

| Arquivo bruto | Formato | Dimensao | Tamanho bruto | Rota correspondente |
| --- | --- | --- | ---: | --- |
| `ROTA SABORES E MEMÓRIAS.png` | PNG | `5504x3072` | `42,61 MB` | `sabores-memorias` |
| `ROTA DA ERVA MATE.png` | PNG | `5504x3072` | `39,97 MB` | `rota-erva-mate` |
| `ROTA POLONESA.png` | PNG | `5504x3072` | `40,88 MB` | `rota-polonesa` |
| `ROTA DAS ÁGUAS.png` | PNG | `5504x3072` | `37,18 MB` | `rota-das-aguas` |
| `ROTA CAMINHOS DE FLUVIÓPOLIS.png` | PNG | `5504x3072` | `42,52 MB` | `caminhos-de-fluviopolis` |
| `ROTA DA TERRA.png` | PNG | `5504x3072` | `42,31 MB` | `rota-da-terra` |

Cobertura antes da rodada:

- `js/data/rotas.js` tinha 6 rotas cadastradas e 0 com campo `imagem`.

Cobertura depois da rodada:

- 6 rotas cadastradas;
- 6 rotas com `imagem` e `galeria`;
- 0 rotas sem capa publica.

## 2. Conversao publica para WebP

Destino publico:

- `images/rotas/`

Parametros usados:

- largura maxima `1600 px`
- exportacao `WebP`
- `quality=80`
- preservacao integral dos brutos fora da area publica

Resultado:

| Arquivo publico | Dimensao final | Peso final |
| --- | --- | ---: |
| `images/rotas/rota-sabores-memorias.webp` | `1600x893` | `187,2 KB` |
| `images/rotas/rota-erva-mate.webp` | `1600x893` | `176,6 KB` |
| `images/rotas/rota-polonesa.webp` | `1600x893` | `333,9 KB` |
| `images/rotas/rota-das-aguas.webp` | `1600x893` | `211,2 KB` |
| `images/rotas/rota-caminhos-fluviopolis.webp` | `1600x893` | `369,4 KB` |
| `images/rotas/rota-da-terra.webp` | `1600x893` | `206,8 KB` |

Observacoes:

- nenhuma imagem publica nova ficou acima de `500 KB`;
- nenhum bruto foi apagado, movido ou sobrescrito;
- a estrutura de dados das rotas foi mantida, com inclusao apenas dos campos de imagem.

## 3. Rotas atualizadas

Arquivo alterado:

- `js/data/rotas.js`

Rotas que passaram a exibir capa publica:

- `Sabores & Memorias`
- `Rota da Erva-Mate`
- `Rota Polonesa`
- `Rota das Aguas`
- `Caminhos de Fluviópolis`
- `Rota da Terra`

Impacto esperado:

- cards/lista do mapa deixam de cair no fallback visual de rota;
- modal/detalhe de rota passa a exibir imagem principal;
- filtros e busca permanecem inalterados porque `id`, `nome`, `categoria` e `tags` foram preservados.

## 4. Noticias oficiais integradas

Fonte oficial utilizada:

- `https://www.saomateusdosul.pr.gov.br/portal/noticias/3/1/50/0/0/0`

Observacao editorial:

- a noticia da Polskie Smaki aparecia como `Ontem` na listagem oficial consultada em `2026-06-02`; foi normalizada para `01 de junho de 2026` na interface local.

Noticias priorizadas nesta rodada:

| Data | Tema | Link oficial |
| --- | --- | --- |
| `01/06/2026` | Regulamento da 7ª edicao da Polskie Smaki | `https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/3502/regulamento-da-7-edicao-da-polskie-smaki-ja-esta-disponivel-para-consulta/` |
| `26/05/2026` | Investimento para fortalecer fanfarras municipais | `https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/3495/sao-mateus-do-sul-tera-investimento-de-r-75-mil-para-fortalecer-fanfarras-municipais/` |
| `24/04/2026` | Classificacao provisoria da PNAB 2026 | `https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/3465/sao-mateus-do-sul-divulga-classificacao-provisoria-dos-projetos-da-pnab-2026/` |
| `24/04/2026` | Chimarrao: tradicao que aquece a alma | `https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/3464/chimarrao-tradicao-que-aquece-a-alma/` |
| `26/03/2026` | Estruturacao do turismo local | `https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/3444/municipio-alinha-acoes-e-avanca-na-estruturacao-do-turismo-local/` |
| `23/03/2026` | Atendimento ao trabalhador e desenvolvimento | `https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/3439/sao-mateus-do-sul-e-contemplado-com-novo-veiculo-para-fortalecer-atendimento-ao-trabalhador/` |
| `19/03/2026` | Edital Aldir Blanc | `https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/3431/sao-mateus-do-sul-abre-inscricoes-para-projetos-culturais-com-recursos-da-politica-nacional-aldir-blanc/` |
| `05/03/2026` | Chamamento para artistas locais | `https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/3420/atencao---chamamento-geral-para-artistas-locais/` |
| `24/02/2026` | Eleicao da diretoria do COMTUR | `https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/3408/eleicao-de-nova-diretoria-e-planejamento-estrategico-marcam-reuniao-do-conselho-de-turismo/` |
| `11/12/2025` | Inovacao e incubadora Inova | `https://www.saomateusdosul.pr.gov.br/portal/noticias/0/3/3363/palestra-sobre-inteligencia-artificial-reune-publico-na-incubadora-inova-sao-mateus/` |

Arquivos atualizados:

- `index.html`
- `noticias.html`

Limitacao mantida:

- a agenda estruturada de `eventos.html` continua separada em `eventos-2026.json` e `js/data/eventos.js`;
- nao foi criado CMS nem feed novo de noticias.

## 5. LGPD e transparencia

Fonte oficial obrigatoria usada:

- `https://www.saomateusdosul.pr.gov.br/portal/secretarias/330/departamento-de-lgpd/`

Campos confirmados na pagina oficial:

- responsavel: `Nicolas Addor`
- telefone: `(42) 3912-7026`
- e-mail: `lgpd@saomateusdosul.pr.gov.br`
- endereco: `Rua João Gabriel Martins, 435, Centro - CEP 83900-000`
- funcionamento: `Segunda a Sexta-feira das 8h as 12h e das 13h15 as 17h15`
- ato relacionado: `Portaria nº 435/2026`

Arquivos atualizados:

- `transparencia.html`
- `privacidade.html`

## 6. Tema sazonal

Arquivos criados:

- `css/season-theme.css`
- `js/season-theme.js`

Comportamento implementado:

- modo automatico pela data atual no Brasil (`America/Sao_Paulo`);
- selecao manual entre `Verao`, `Outono`, `Inverno` e `Primavera`;
- retorno ao modo automatico pela opcao `Automatico`;
- persistencia em `localStorage` quando disponivel;
- fallback silencioso se `localStorage` estiver indisponivel;
- respeito a `prefers-reduced-motion`.

Aplicacao:

- paginas publicas com `nav-shared.js` recebem o tema automaticamente;
- `index.html` e `privacidade.html` receberam carga direta por nao dependerem desse nav compartilhado;
- `portal-usuario.html` e `admin-firebase.html` ficaram fora do escopo para evitar risco visual em area restrita.

## 7. Arquivos alterados nesta rodada

- `css/season-theme.css`
- `docs/atualizacao-site-turismo.md`
- `docs/atualizacao-empreendimentos.md`
- `docs/auditoria-dados.md`
- `docs/otimizacao-imagens.md`
- `index.html`
- `js/data/rotas.js`
- `js/nav-shared.js`
- `js/season-theme.js`
- `noticias.html`
- `privacidade.html`
- `transparencia.html`

## 8. Pendencias e recomendacoes

- revisar futuramente se `eventos.html` deve consumir uma fonte oficial estruturada separada da pagina estatica de noticias;
- se houver validacao editorial, substituir imagens ilustrativas de cards de noticias por derivacoes oficiais ja autorizadas;
- considerar aplicar o tema sazonal nas paginas publicas restantes fora da lista principal (`sabores`, `local`, `reservas`, `roteiro-ia`) em rodada separada;
- validar em browser se o seletor de estacao ficou com boa ergonomia em todos os breakpoints do menu publico.
