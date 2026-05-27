# Otimizacao de imagens dos empreendimentos

## Rodada 2026-05-27 - correção urgente de imagens públicas pesadas

Problema corrigido:

- imagens públicas recém-publicadas entraram em formatos pesados (`.png`, `.jpg`, `.jpeg`) diretamente na árvore pública do site.

Ferramenta usada:

- Pillow `12.2.0` via Python empacotado do ambiente.

Parâmetro aplicado nesta rodada:

- resize para largura máxima de `1600 px`
- exportação `WEBP` com `quality=82`

### Antes e depois

| Arquivo original público | Dimensão original | Tamanho antes | Arquivo WebP | Dimensão final | Tamanho depois |
| --- | --- | ---: | --- | --- | ---: |
| `images/vapor-pery.png` | `8064x6048` | 57,36 MB | `images/vapor-pery.webp` | `1600x1200` | 274,55 KB |
| `images/novo-paco-municipal.jpg` | `9442x3880` | 15,38 MB | `images/novo-paco-municipal.webp` | `1600x657` | 333,86 KB |
| `images/parque-exposicoes-aerea.jpg` | `1920x1080` | 664,43 KB | `images/parque-exposicoes-aerea.webp` | `1600x900` | 428,39 KB |
| `images/agrosamas-publico-show-noturno.jpeg` | `4000x2250` | 2,96 MB | `images/agrosamas-publico-show-noturno.webp` | `1600x900` | 256,42 KB |
| `images/ginasio-polacao.jpg` | `1920x1080` | 516,54 KB | `images/ginasio-polacao.webp` | `1600x900` | 302,80 KB |

### Faixas auditadas em `images/`

- acima de `1 MB`: existem vários arquivos, incluindo públicos antigos e brutos de trabalho
- acima de `3 MB`: havia públicos problemáticos e diversos brutos não publicados
- acima de `10 MB`: os casos críticos desta rodada foram `images/vapor-pery.png` e `images/novo-paco-municipal.jpg`, além dos brutos correspondentes

### Regra operacional daqui para frente

- toda imagem pública nova deve ser publicada apenas em `WebP` otimizado;
- cópia provisória em `jpg/png/jpeg` pode existir só como bruto de trabalho, fora da área pública referenciada;
- se for necessário manter bruto, mover para pasta ignorada em `EMPREENDIMENTOS/`.

## Rodada 2026-05-27 - estabilização de paths públicos

Para evitar `src` com espaço, acento ou nomes provisórios no HTML/JS, esta rodada criou apenas cópias públicas em ASCII, preservando todos os arquivos originais.

Mapeamento aplicado:

- `images/AGROSAMAS_PUBLICO SHOW_PARA_TROCAR.JPEG` -> `images/agrosamas-publico-show-noturno.webp`
- `images/PARQUE_EXPOSICOES_PARA_TROCAR.jpg` -> `images/parque-exposicoes-aerea.webp`
- `images/NOVO_PAÇO_MUNICIPAL_PARA_USAR_1.JPG` -> `images/novo-paco-municipal.webp`
- `images/GINASIO_POLACAO_PARA_TROCAR.JPG` -> `images/ginasio-polacao.webp`
- `images/PERY_PARA_TROCAR.png` -> `images/vapor-pery.webp`

Observações:

- Nenhum arquivo bruto foi apagado ou sobrescrito.
- `images/NOVO_PAÇO_MUNICIPAL_PARA_USAR_2.DNG` segue fora da publicação por não ser formato web.

## Escopo desta rodada

Curadoria leve das galerias exibidas no modal, sem apagar, mover, renomear ou converter arquivos.

Empreendimentos revisados:

- Marina Barra do Iguacu
- All Garden
- Hotel Sao Mateus

## Inventario resumido

### Marina Barra do Iguacu

- Total na pasta: 40 imagens `.jpeg`
- Imagem principal em uso: `marina-barra-do-iguacu-01.jpeg`
- Galeria mantida no site: `01`, `03`, `07`, `17`, `20`, `25`, `37`, `40`
- Curadoria aplicada de forma conservadora, priorizando comida, identidade visual, salao/restaurante, area externa e lazer.

Arquivos mais pesados:

- `marina-barra-do-iguacu-25.jpeg` - 0,77 MB
- `marina-barra-do-iguacu-37.jpeg` - 0,66 MB
- `marina-barra-do-iguacu-40.jpeg` - 0,60 MB
- `marina-barra-do-iguacu-38.jpeg` - 0,59 MB
- `marina-barra-do-iguacu-18.jpeg` - 0,56 MB

Curadoria humana recomendada:

- Revisar visualmente o conjunto completo de `02` a `40` para identificar duplicidades de angulo e definir uma capa mais institucional caso o foco da pagina deva ser menos gastronomico.

### All Garden

- Total na pasta: 10 imagens `.jpeg`
- Imagem principal em uso: `all-garden-01.jpeg`
- Galeria mantida no site: `01`, `02`, `03`, `05`, `07`, `08`, `09`, `10`
- Curadoria aplicada priorizando mesa/piquenique, paisagem, trilha e experiencia no local.

Arquivos mais pesados:

- `all-garden-02.jpeg` - 2,02 MB
- `all-garden-01.jpeg` - 0,84 MB
- `all-garden-08.jpeg` - 0,69 MB
- `all-garden-07.jpeg` - 0,55 MB
- `all-garden-10.jpeg` - 0,51 MB

Curadoria humana recomendada:

- `all-garden-02.jpeg` e `all-garden-07.jpeg` merecem revisao editorial final, porque representam bem o local, mas pedem confirmacao de prioridade entre paisagem e experiencia.

### Hotel Sao Mateus

- Total na pasta: 13 imagens `.jpeg`
- Imagem principal em uso: `hotel-sao-mateus-01.jpeg`
- Galeria mantida no site: `01`, `02`, `03`, `05`, `07`, `09`, `13`
- Curadoria aplicada priorizando quarto, variacao de leitos, sala/estrutura e circulacao interna.

Arquivos mais pesados:

- `hotel-sao-mateus-07.jpeg` - 0,37 MB
- `hotel-sao-mateus-03.jpeg` - 0,35 MB
- `hotel-sao-mateus-13.jpeg` - 0,35 MB
- `hotel-sao-mateus-01.jpeg` - 0,34 MB
- `hotel-sao-mateus-02.jpeg` - 0,34 MB

Curadoria humana recomendada:

- Verificar se faltou uma fachada externa mais forte; pelos nomes e amostras abertas nesta rodada, a selecao ficou centrada na estrutura interna.

## Recomendacoes futuras

- Converter as imagens finais selecionadas para WebP em rodada separada, sem sobrescrever os JPEG originais.
- Adotar como alvo futuro algo entre `250 KB` e `600 KB` por imagem publicada, com excecoes justificadas para imagens hero.
- Limitar dimensoes publicadas para algo em torno de `1600 px` no maior lado para galerias de modal.
- Se houver nova rodada editorial, montar uma curadoria humana final por empreendimento antes de qualquer compressao em lote.

## Rodada 2026-05-27

Empreendimentos revisados:

- Sawe Parque Aquatico
- Casa da Memoria Padre Bauer
- AgroSamas
- Ribeiro Pesca e Turismo

### Sawe Parque Aquatico

- Total na pasta bruta: 20 imagens `.jpeg`
- Publicadas nesta rodada: `sawe-01` a `sawe-06`
- Curadoria aplicada priorizando paisagem, area de descanso, piscina, lago e estrutura de lazer.

Observacao:

- Os arquivos publicados ficaram abaixo de `0,7 MB` cada e nao exigem compressao urgente.

### Casa da Memoria Padre Bauer

- Total na pasta bruta: 8 imagens `.JPEG`
- Publicadas nesta rodada: `casa-da-memoria-01` a `08`
- Curadoria aplicada aproveitando fachada, visita guiada e acervo interno.

Observacao:

- O conjunto esta publicavel no formato atual; uma rodada futura pode reduzir levemente peso sem perda perceptivel.

### AgroSamas

- Total na pasta bruta: 9 imagens (`.JPG` e `.JPEG`)
- Publicadas nesta rodada: `agrosamas-01`, `agrosamas-02`, `agrosamas-03`
- Curadoria aplicada priorizando exposicao agropecuaria, experiencia de balao e publico/show.

Arquivos mais pesados usados:

- `agrosamas-01.jpg` - 4,08 MB
- `agrosamas-02.jpg` - 4,59 MB
- `agrosamas-03.jpeg` - 2,96 MB

Curadoria humana recomendada:

- Reduzir peso e definir se a capa final do evento deve destacar exposicao, experiencia aerea ou publico/show.

### Ribeiro Pesca e Turismo

- Pasta publicada agora inclui `ribeiro-pesca-09.png`, `10.png` e `11.png`
- Galeria ativa mantida com 8 imagens, incluindo `09` e `10`
- Curadoria aplicada para preservar fotos anteriores uteis e incorporar duas novas vistas aereas.

Arquivos mais pesados usados:

- `ribeiro-pesca-10.png` - 2,50 MB
- `ribeiro-pesca-09.png` - 2,07 MB

Curadoria humana recomendada:

- Converter `09` e `10` para WebP em rodada separada; `11.png` pode entrar depois se houver espaco editorial na galeria.
