# Atualização de empreendimentos recebidos

## Rodada 2026-06-02 - capas publicas das rotas turisticas

Escopo desta rodada:

- auditar as imagens recebidas em `EMPREENDIMENTOS/imagens para as rotas`;
- converter apenas as capas publicas para `WebP` otimizado;
- atualizar `js/data/rotas.js` sem alterar a estrutura das rotas existentes.

Resultado:

| Rota | Bruto auditado | Arquivo publico final | Dimensao final | Peso final |
| --- | --- | --- | --- | ---: |
| Sabores & Memorias | `ROTA SABORES E MEMÓRIAS.png` | `images/rotas/rota-sabores-memorias.webp` | `1600x893` | `187,2 KB` |
| Rota da Erva-Mate | `ROTA DA ERVA MATE.png` | `images/rotas/rota-erva-mate.webp` | `1600x893` | `176,6 KB` |
| Rota Polonesa | `ROTA POLONESA.png` | `images/rotas/rota-polonesa.webp` | `1600x893` | `333,9 KB` |
| Rota das Aguas | `ROTA DAS ÁGUAS.png` | `images/rotas/rota-das-aguas.webp` | `1600x893` | `211,2 KB` |
| Caminhos de Fluviópolis | `ROTA CAMINHOS DE FLUVIÓPOLIS.png` | `images/rotas/rota-caminhos-fluviopolis.webp` | `1600x893` | `369,4 KB` |
| Rota da Terra | `ROTA DA TERRA.png` | `images/rotas/rota-da-terra.webp` | `1600x893` | `206,8 KB` |

Arquivos alterados nesta etapa:

- `js/data/rotas.js`

Observacoes:

- todos os brutos originais foram preservados sem remocao;
- a cobertura das 6 rotas passou de `0` para `6` imagens principais publicas.

## Rodada 2026-05-27 - otimização emergencial das imagens públicas

Motivo da rodada:

- corrigir a publicação indevida de imagens pesadas na árvore pública do site;
- substituir as cópias `.png`, `.jpg` e `.jpeg` recém-criadas por versões `.webp` otimizadas;
- manter os brutos de trabalho fora da área pública versionada.

### Imagens otimizadas

| Item | Arquivo público anterior | Tamanho antes | Arquivo público novo | Tamanho depois |
| --- | --- | ---: | --- | ---: |
| Vapor Pery | `images/vapor-pery.png` | 57,36 MB | `images/vapor-pery.webp` | 274,55 KB |
| Novo Paço Municipal | `images/novo-paco-municipal.jpg` | 15,38 MB | `images/novo-paco-municipal.webp` | 333,86 KB |
| Parque de Exposições | `images/parque-exposicoes-aerea.jpg` | 664,43 KB | `images/parque-exposicoes-aerea.webp` | 428,39 KB |
| AgroSamas | `images/agrosamas-publico-show-noturno.jpeg` | 2,96 MB | `images/agrosamas-publico-show-noturno.webp` | 256,42 KB |
| Ginásio Polacão | `images/ginasio-polacao.jpg` | 516,54 KB | `images/ginasio-polacao.webp` | 302,80 KB |

### Referências atualizadas

- `js/locais-data.js`
- `js/data/eventos.js`
- `js/data/pontos-turisticos.js`
- `galeria.html`

### Remoções e destino dos brutos

- arquivos públicos pesados substituídos por WebP devem sair da árvore pública referenciada:
  - `images/vapor-pery.png`
  - `images/novo-paco-municipal.jpg`
  - `images/parque-exposicoes-aerea.jpg`
  - `images/agrosamas-publico-show-noturno.jpeg`
  - `images/ginasio-polacao.jpg`
- brutos de trabalho movidos para `EMPREENDIMENTOS/_brutos-imagens-troca-2026-05-27/`

### Regra registrada

- novas imagens públicas do site devem entrar apenas como `.webp` otimizado, salvo exceção técnica documentada.

## Rodada 2026-05-27 - Correção de imagens e nome no mapa turístico

Escopo isolado desta rodada:

- corrigir imagens públicas de `Parque de Exposições`, `AgroSamas`, `Paço Municipal`, `Ginásio Polacão` e `Vapor Pery`;
- renomear a exibição de `Paço Municipal` para `Novo Paço Municipal`;
- não criar item novo, não alterar coordenadas e não mexer em login, admin, Firebase ou regras.

### Arquivos de dados alterados

- `js/locais-data.js`
- `js/data/eventos.js`
- `js/data/pontos-turisticos.js`
- `galeria.html`

### Substituições aplicadas

| Item | Imagem anterior | Imagem publicada agora | Origem preservada | Observação |
| --- | --- | --- | --- | --- |
| Parque de Exposições | `images/empreendimentos/agrosamas/agrosamas-01.jpg` | `images/parque-exposicoes-aerea.webp` | `images/PARQUE_EXPOSICOES_PARA_TROCAR.jpg` | Removido o uso da capa do AgroSamas no card/local do parque. |
| AgroSamas | `images/empreendimentos/agrosamas/agrosamas-01.jpg` | `images/agrosamas-publico-show-noturno.webp` | `images/AGROSAMAS_PUBLICO SHOW_PARA_TROCAR.JPEG` | Capa alterada para a imagem aérea noturna com público/show. |
| Paço Municipal | `images/PREFEITURA_MUNICIPAL.jpg` | `images/novo-paco-municipal.webp` | `images/NOVO_PAÇO_MUNICIPAL_PARA_USAR_1.JPG` | Nome exibido alterado para `Novo Paço Municipal`. |
| Ginásio Polacão | `images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg` | `images/ginasio-polacao.webp` | `images/GINASIO_POLACAO_PARA_TROCAR.JPG` | Mantido o nome atual do item. |
| Vapor Pery | `images/PONTE_SOB_O_RIO_IGUACU.jpg` | `images/vapor-pery.webp` | `images/PERY_PARA_TROCAR.png` | Corrigida a imagem do ponto resumido. |

### Pendências e decisões editoriais

- `images/NOVO_PAÇO_MUNICIPAL_PARA_USAR_2.DNG` foi preservado como bruto e não entrou no site por não ser formato web.
- Não houve necessidade de criar cadastro duplicado nem de alterar categoria, descrição ou coordenadas.
- A galeria pública de `Parque de Exposições` em `galeria.html` também passou a usar a imagem correta.

## Rodada 2026-05-27

Atualização realizada a partir das pastas específicas em `EMPREENDIMENTOS/`: `sawe`, `vivenda do mate`, `casa da memoria`, `agrosamas` e `ribeiro pesca`.

### Inventário recebido

| Pasta | TXT | Imagens/mídias | Formatos | Correspondência na base |
|---|---:|---:|---|---|
| `sawe` | 1 | 20 | `.jpeg` | `Sawe Parque Aquático` em `js/rotas-data.js` |
| `vivenda do mate` | 1 | 0 | - | `Vivenda do Mate` em `js/rotas-data.js` |
| `casa da memoria` | 1 vazio | 8 | `.JPEG` | `Casa da Memória Padre Bauer` em `js/data/pontos-turisticos.js` e `js/locais-data.js` |
| `agrosamas` | 0 | 9 | `.JPG`, `.JPEG` | `AgroSamas` em `js/data/eventos.js`; contexto do `Parque de Exposições` em `js/locais-data.js` |
| `ribeiro pesca` | 1 | 11 | `.jpeg`, `.png` | `Ribeiro Pesca e Turismo` em `js/rotas-data.js` |

### Status por empreendimento

| Empreendimento | Pasta de origem | Status | Arquivos atualizados | Imagens usadas | Pendências |
|---|---|---|---|---|---|
| Sawe Parque Aquático | `sawe` | Atualizado com sucesso | `js/rotas-data.js` | `images/empreendimentos/sawe/` com 6 `.jpeg` | Há 14 fotos extras não publicadas nesta rodada por curadoria. |
| Vivenda do Mate | `vivenda do mate` | Atualizado com sucesso | `js/rotas-data.js` | - | TXT não trouxe imagens nem coordenadas novas; imagem segue pendente. |
| Casa da Memória Padre Bauer | `casa da memoria` | Parcialmente atualizado | `js/data/pontos-turisticos.js`, `js/locais-data.js` | `images/empreendimentos/casa-da-memoria/` com 8 `.jpeg` | TXT segue vazio; textos e endereço foram preservados. |
| AgroSamas | `agrosamas` | Atualizado como evento existente | `js/data/eventos.js`, `js/locais-data.js` | `images/empreendimentos/agrosamas/` com 3 imagens | Não foi criado item novo de empreendimento; material foi associado ao evento já existente e ao contexto do `Parque de Exposições`. |
| Ribeiro Pesca e Turismo | `ribeiro pesca` | Atualizado com sucesso | `js/rotas-data.js` | Galeria curada com 8 imagens, incluindo 2 novas `.png` | `ribeiro-pesca-11.png` e outras 2 imagens úteis ficaram fora da galeria por limite editorial desta rodada. |

### Dados incorporados

- Sawe Parque Aquático: descrição ajustada com foco familiar e estrutura do parque, endereço textual específico, imagem principal e galeria.
- Vivenda do Mate: descrição atualizada a partir do TXT, telefone corrigido para DDD `42`, localização textual refinada e site oficial adicionado.
- Casa da Memória Padre Bauer: capa e galeria passaram a usar as fotos reais recebidas, preservando os textos existentes por falta de novo conteúdo descritivo confirmado.
- AgroSamas: classificado nesta rodada como `evento` já existente; recebeu imagem principal e galeria curta para mapa/modal, sem criar item duplicado.
- Parque de Exposições: passou a usar a nova curadoria visual vinculada ao AgroSamas, reforçando o contexto público do evento no mapa.
- Ribeiro Pesca e Turismo: imagem principal substituída por foto aérea nova e galeria recalibrada para manter 8 imagens, preservando fotos anteriores úteis.

### Imagens copiadas

- `images/empreendimentos/sawe/sawe-01.jpeg` até `sawe-06.jpeg`
- `images/empreendimentos/casa-da-memoria/casa-da-memoria-01.jpeg` até `casa-da-memoria-08.jpeg`
- `images/empreendimentos/agrosamas/agrosamas-01.jpg` até `agrosamas-03.jpeg`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-09.png`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-10.png`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-11.png`

### Imagens e arquivos ignorados

- Sawe: 14 arquivos `.jpeg` permaneceram apenas na pasta bruta por curadoria desta rodada; não houve duplicata por hash.
- Vivenda do Mate: sem imagens recebidas na pasta desta rodada.
- Casa da Memória: nenhuma imagem web foi descartada; as 8 fotos recebidas foram aproveitadas.
- AgroSamas: 6 imagens ficaram fora da publicação por redundância temática e peso alto; o material bruto foi mantido intacto.
- Ribeiro Pesca: `ribeiro-pesca-06.jpeg`, `ribeiro-pesca-08.jpeg` e `ribeiro-pesca-11.png` ficaram fora da galeria publicada para manter limite editorial de 8 imagens.

### Dados não incorporados por dúvida ou escopo

- Não houve criação de novo cadastro para `AgroSamas`, porque a correspondência segura foi com o evento já existente.
- `Casa da Memória` não recebeu alteração de texto, horário ou endereço porque o TXT continua vazio.
- `Vivenda do Mate` segue sem imagem publicada por ausência de foto segura na pasta recebida.
- Nenhum arquivo bruto foi apagado, convertido ou sobrescrito em `EMPREENDIMENTOS/`.

### Pendências para revisão humana

- Confirmar se `Vivenda do Mate` deve receber imagem em rodada futura e, se sim, enviar fotos web ou autorizar conversão de originais.
- Confirmar endereço público final da `Casa da Memória Padre Bauer` para remover o marcador `(confirmar endereço)`.
- Revisar se `AgroSamas` merece uma curadoria visual separada entre página de eventos e contexto do `Parque de Exposições`.
- Confirmar no browser, após limpeza de cache local, se o diálogo do item `AgroSamas` passou a refletir a imagem principal adicionada em `js/data/eventos.js`.
- Avaliar compressão futura das imagens grandes de `AgroSamas` e das novas `.png` de `Ribeiro Pesca`.

## Rodada 2026-05-26

### Remocao publica - Morangos da Mary

Solicitacao:

- empreendimento nao participa mais do turismo;
- remover apenas da experiencia publica;
- nao apagar imagem fisica nem material bruto sem confirmacao humana.

Resumo da acao:

- cadastro removido de `js/rotas-data.js`;
- mencoes publicas removidas de `index.html`, `galeria.html` e `js/chatbot.js`;
- tag de rota ajustada em `js/data/rotas.js`;
- nenhuma alteracao foi feita em login, Firebase/Auth/App Check, CSP ou rules reais.

Imagem associada:

- `images/MORANGO_1.jpg` permaneceu no repositorio e pode ter ficado orfa de uso publico;
- nao houve remocao fisica da imagem nesta rodada.

## Rodada 2026-05-19

Atualização realizada a partir das pastas específicas em `EMPREENDIMENTOS/`: `marina barra do iguaçu`, `all garden`, `hotel são mateus` e `nova esperança equoterapia`.

### Inventário recebido

| Pasta | TXT | Imagens/mídias | Formatos | Correspondência na base |
|---|---:|---:|---|---|
| `marina barra do iguaçu` | 1 | 40 | `.jpeg` | `Marina Barra do Iguaçu` em `js/data/restaurantes.js` e `js/rotas-data.js` |
| `all garden` | 1 | 12 | `.jpeg`, `.HEIC` | `All Garden` em `js/rotas-data.js` |
| `hotel são mateus` | 1 | 16 | `.jpeg`, `.HEIC`, `.zip` | `Hotel São Mateus` em `js/data/hospedagens.js` |
| `nova esperança equoterapia` | 1 | 13 | `.JPG`, `.HEIC`, `.DNG` | `Nova Esperança` em `js/rotas-data.js` |

### Status por empreendimento

| Empreendimento | Pasta de origem | Status | Arquivos atualizados | Imagens usadas | Pendências |
|---|---|---|---|---|---|
| Marina Barra do Iguaçu | `marina barra do iguaçu` | Atualizado com sucesso | `js/data/restaurantes.js`, `js/rotas-data.js` | `images/empreendimentos/marina-barra-do-iguacu/` com 40 `.jpeg` | CNPJ não foi exposto por não haver campo público equivalente no card turístico. |
| All Garden | `all garden` | Atualizado com sucesso | `js/rotas-data.js` | `images/empreendimentos/all-garden/` com 10 `.jpeg` | TXT não trouxe endereço novo, horário nem coordenadas; dados atuais foram preservados. Instagram antigo `@allgardenmoments` foi substituído pelo TXT: `@allgarden__`. |
| Hotel São Mateus | `hotel são mateus` | Parcialmente atualizado | `js/data/hospedagens.js` | `images/empreendimentos/hotel-sao-mateus/` com 13 `.jpeg` | TXT trouxe apenas telefone; descrição, localização e coordenadas pendentes foram preservadas. Telefone antigo `(42) 3282-2000` conflitou com o TXT e foi substituído por `(42) 3532-1802`. |
| Nova Esperança | `nova esperança equoterapia` | Parcialmente atualizado | `docs/atualizacao-empreendimentos.md` | Mantidas as 4 imagens já existentes em `images/empreendimentos/nova-esperanca-equoterapia/` | TXT trouxe apenas Instagram já presente na base. Os 4 `.JPG` recebidos já existiam por SHA-256; `.HEIC` e `.DNG` não foram convertidos. |

### Dados incorporados

- Marina Barra do Iguaçu: descrição pública ampliada com vista para o Rio Iguaçu, gastronomia, petiscos, peixes e frutos do mar, garagem náutica, eventos, horários de quarta a sexta e finais de semana/feriados, Instagram e galeria.
- All Garden: descrição atualizada para trilhas sensoriais, cafés especiais, piqueniques, lavandas, riachos e conexão com a natureza; Instagram atualizado para `@allgarden__`; telefone, localização, horário e coordenadas atuais preservados.
- Hotel São Mateus: telefone atualizado para `(42) 3532-1802` e galeria institucional adicionada; sem alteração de coordenadas porque o TXT não trouxe localização exata.
- Nova Esperança: nenhum dado novo de conteúdo além do Instagram já existente; imagens web recebidas eram duplicatas exatas das já incorporadas.

### Imagens copiadas

- `images/empreendimentos/marina-barra-do-iguacu/marina-barra-do-iguacu-01.jpeg` até `marina-barra-do-iguacu-40.jpeg`
- `images/empreendimentos/all-garden/all-garden-01.jpeg` até `all-garden-10.jpeg`
- `images/empreendimentos/hotel-sao-mateus/hotel-sao-mateus-01.jpeg` até `hotel-sao-mateus-13.jpeg`

### Imagens e arquivos ignorados

- All Garden: `IMG_0522.HEIC` e `IMG_0666.HEIC` não foram usados por serem HEIC.
- Hotel São Mateus: `IMG_6612.HEIC` e `IMG_6613.HEIC` não foram usados por serem HEIC; `WhatsApp Unknown 2026-05-19 at 13.45.57.zip` não foi aberto nem vinculado ao site.
- Nova Esperança: `IMG_0702.HEIC`, `IMG_0710.HEIC`, `IMG_0723.HEIC` e 6 arquivos `.DNG` não foram usados por não serem formatos web. `IMG_0719.JPG`, `IMG_0755.JPG`, `IMG_0761.JPG` e `IMG_0838.JPG` já existiam no site por hash e não foram duplicados.

### Observações

- All Garden não foi criado como novo cadastro porque já existia como item seguro em `js/rotas-data.js`.
- Marina Barra do Iguaçu preservou `id`/slug `marina-barra-iguacu` e coordenadas existentes.
- Hotel São Mateus preservou `id`/slug `hotel-sao-mateus`; continua sem coordenadas até haver fonte confiável.
- A pasta bruta `EMPREENDIMENTOS/` permaneceu como fonte local de trabalho e não foi copiada para dentro do site.

---

Rodada realizada em 2026-05-15 a partir de `EMPREENDIMENTOS/`.

## Inventário recebido

| Pasta | TXT | Imagens/mídias | Formatos | Correspondência na base |
|---|---:|---:|---|---|
| `ancestral` | 1 | 4 | `.jpeg` | `Ancestral Gastronomia` em `js/data/restaurantes.js` e `js/rotas-data.js` |
| `baldo` | 1 | 0 | - | `Baldo S/A Comércio, Indústria e Exportação` em `js/rotas-data.js` |
| `casa da memoria` | 1 vazio | 0 | - | `Casa da Memória Padre Bauer` em `js/data/pontos-turisticos.js` e `js/locais-data.js` |
| `doces e delicias` | 1 | 8 | `.jpeg` | Não encontrado como item estruturado |
| `marina` | 1 | 0 | - | `Marina Barra do Iguaçu` em `js/data/restaurantes.js` e `js/rotas-data.js` |
| `nova esperança equoterapia` | 0 | 13 | `.DNG`, `.HEIC`, `.JPG` | `Nova Esperança` em `js/rotas-data.js` |
| `rei verde e hotel moro` | 1 | 1 | `.mp4` | `Ervateira Rei Verde` e `Hotel Moro` em `js/rotas-data.js`; `Hotel Moro` também em `js/data/hospedagens.js` |
| `ribeiro pesca` | 1 | 8 | `.jpeg` | `Ribeiro Pesca e Turismo` em `js/rotas-data.js` |

## Status por empreendimento

| Empreendimento | Pasta de origem | Status | Arquivos atualizados | Imagens usadas | Pendências |
|---|---|---|---|---|---|
| Ancestral Gastronomia | `ancestral` | Atualizado com sucesso | `js/data/restaurantes.js`, `js/rotas-data.js` | `images/empreendimentos/ancestral-gastronomia/ancestral-gastronomia-03.jpeg` | Imagens extras mantidas para futura galeria. |
| Baldo S/A Comércio, Indústria e Exportação | `baldo` | Apenas texto atualizado | `js/rotas-data.js` | - | Nenhuma imagem recebida. |
| Casa da Memória Padre Bauer | `casa da memoria` | Precisa de confirmação humana | - | - | TXT recebido está vazio; nada foi alterado. |
| Doces e Delícias Café e Confeitaria | `doces e delicias` | Não encontrado na base | - | Copiadas para `images/empreendimentos/doces-e-delicias/` | Possível novo cadastro de gastronomia; faltam coordenadas e confirmação para criar item. |
| Marina Barra do Iguaçu | `marina` | Apenas texto atualizado | `js/data/restaurantes.js`, `js/rotas-data.js` | - | Nenhuma imagem recebida. |
| Nova Esperança | `nova esperança equoterapia` | Apenas imagens adicionadas | `js/rotas-data.js`, `js/data/turismo-data-adapter.js` | `images/empreendimentos/nova-esperanca-equoterapia/nova-esperanca-equoterapia-01.jpg` | TXT não recebido; HEIC/DNG não foram convertidos. |
| Ervateira Rei Verde | `rei verde e hotel moro` | Parcialmente atualizado | `js/rotas-data.js` | - | Vídeo recebido não foi vinculado ao mapa; dados de telefone/horário antigos foram preservados. |
| Hotel Moro | `rei verde e hotel moro` | Parcialmente atualizado | `js/data/hospedagens.js`, `js/rotas-data.js` | - | TXT trouxe Instagram e localização; telefone antigo foi preservado por ausência de substituto no TXT. |
| Ribeiro Pesca e Turismo | `ribeiro pesca` | Apenas imagens adicionadas | `js/rotas-data.js`, `js/data/turismo-data-adapter.js` | `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-07.jpeg` | TXT não trouxe descrição/endereço/horário novos; dados existentes foram preservados. |

## Dados incorporados

- Ancestral Gastronomia: descrição ampliada, endereço da Avenida Ozy Mendonça de Lima, telefone preservado, tags de fermentação natural/vivência gastronômica/personal chef e imagem principal.
- Baldo: descrição atualizada, horário comercial de venda de produtos, regra de visita guiada sob agendamento, telefone preservado, Instagram e site oficial.
- Marina Barra do Iguaçu: descrição ampliada com margem do Rio Iguaçu, garagem náutica, eventos, endereço BR-476 Km 283, segundo telefone e tags.
- Nova Esperança: imagem principal adicionada ao item existente de rota.
- Rei Verde: Instagram atualizado para `@reiverde.sms`, link institucional e vídeo registrados no item de rota.
- Hotel Moro: localização atualizada para BR-476 Km 167, Instagram adicionado nas tags/base de rota e descrição ajustada na hospedagem.
- Ribeiro Pesca e Turismo: imagem principal adicionada ao item existente de rota.

## Exibição no mapa turístico

As informações e imagens vinculadas aos itens passam a aparecer também no modal de detalhes aberto pelo botão `Ver detalhes` em `mapa-turistico.html`. O modal usa `imagem` como foto principal e, quando existir `galeria`, exibe miniaturas extras sem criar nova página, backend ou catálogo separado.

Galerias estruturadas nesta rodada:

- `Ancestral Gastronomia`: 4 imagens em `images/empreendimentos/ancestral-gastronomia/`
- `Nova Esperança`: 4 imagens web em `images/empreendimentos/nova-esperanca-equoterapia/`
- `Ribeiro Pesca e Turismo`: 8 imagens em `images/empreendimentos/ribeiro-pesca/`

Baldo, Marina Barra do Iguaçu, Ervateira Rei Verde e Hotel Moro exibem os campos textuais disponíveis no modal. Como não há imagem estática web vinculada com segurança para esses itens, o mapa mantém o fallback visual por categoria.

## Dados não incorporados por dúvida ou escopo

- CNPJ e nome de responsável não foram expostos nos cards turísticos por não haver campo público equivalente na base atual.
- `Doces e Delícias` não foi criado automaticamente porque não havia correspondência segura na base atual nem coordenadas.
- TXT vazio da Casa da Memória não gerou alteração.
- Link longo do Google Maps do Hotel Moro foi usado apenas como evidência; coordenadas existentes foram preservadas.
- Vídeo da pasta `rei verde e hotel moro` não foi copiado para imagens nem vinculado ao mapa, porque o card atual usa imagem estática.
- Arquivos `.HEIC` e `.DNG` da Nova Esperança não foram convertidos nem vinculados.

## Imagens copiadas

- `images/empreendimentos/ancestral-gastronomia/ancestral-gastronomia-01.jpeg`
- `images/empreendimentos/ancestral-gastronomia/ancestral-gastronomia-02.jpeg`
- `images/empreendimentos/ancestral-gastronomia/ancestral-gastronomia-03.jpeg`
- `images/empreendimentos/ancestral-gastronomia/ancestral-gastronomia-04.jpeg`
- `images/empreendimentos/doces-e-delicias/doces-e-delicias-01.jpeg`
- `images/empreendimentos/doces-e-delicias/doces-e-delicias-02.jpeg`
- `images/empreendimentos/doces-e-delicias/doces-e-delicias-03.jpeg`
- `images/empreendimentos/doces-e-delicias/doces-e-delicias-04.jpeg`
- `images/empreendimentos/doces-e-delicias/doces-e-delicias-05.jpeg`
- `images/empreendimentos/doces-e-delicias/doces-e-delicias-06.jpeg`
- `images/empreendimentos/doces-e-delicias/doces-e-delicias-07.jpeg`
- `images/empreendimentos/doces-e-delicias/doces-e-delicias-08.jpeg`
- `images/empreendimentos/nova-esperanca-equoterapia/nova-esperanca-equoterapia-01.jpg`
- `images/empreendimentos/nova-esperanca-equoterapia/nova-esperanca-equoterapia-02.jpg`
- `images/empreendimentos/nova-esperanca-equoterapia/nova-esperanca-equoterapia-03.jpg`
- `images/empreendimentos/nova-esperanca-equoterapia/nova-esperanca-equoterapia-04.jpg`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-01.jpeg`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-02.jpeg`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-03.jpeg`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-04.jpeg`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-05.jpeg`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-06.jpeg`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-07.jpeg`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-08.jpeg`

## Duplicatas detectadas

Nenhuma duplicata exata por SHA-256 foi encontrada entre as imagens/mídias recebidas e os arquivos existentes em `images/`.

## Pendências para revisão humana

- Confirmar se `Doces e Delícias Café e Confeitaria` deve entrar como novo item de Gastronomia e informar coordenadas ou link de Maps.
- Confirmar se as imagens extras devem virar galeria quando o mapa/local suportar múltiplas imagens para empreendimentos de rota.
- Definir se o vídeo da Rei Verde deve ser hospedado/vinculado em alguma área específica do site.
- Confirmar se os arquivos `.HEIC`/`.DNG` da Nova Esperança devem ser convertidos fora desta rodada.
