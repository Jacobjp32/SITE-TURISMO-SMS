# Atualização de empreendimentos recebidos

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
