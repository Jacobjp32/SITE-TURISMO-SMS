# Auditoria de assets e midias

Data da auditoria: 18/05/2026

Relatorios brutos:

- `docs/auditoria-output/assets-report.md`
- `docs/auditoria-output/assets-report.json`

Escopo analisado: `images/`, `assets/`, `uploads/`, `videos/`, SVGs, icones e referencias em HTML, CSS, JS e dados turisticos. A pasta `EMPREENDIMENTOS/` nao foi auditada para limpeza porque e material bruto local ignorado pelo Git.

## Resumo

| Item | Quantidade |
| --- | ---: |
| Midias encontradas | 123 |
| Midias referenciadas | 88 |
| Midias provavelmente orfas | 35 |
| Grupos duplicados reais por hash | 0 |
| Referencias sem arquivo detectadas | 0 |

Observacao: nao foram encontradas imagens identicas por hash. Existem, porem, muitas series com nomes parecidos e possivel sobreposicao editorial.

## 1. Imagens duplicadas reais

Nenhum grupo de duplicidade real por SHA-256 foi encontrado.

Acao recomendada: manter todos os arquivos por enquanto. A proxima fase deve escolher canonicas apenas nos grupos com nomes parecidos, usando uso real e qualidade visual.

## 2. Imagens com nomes parecidos

| Grupo | Arquivos | Uso detectado | Acao recomendada |
| --- | --- | --- | --- |
| `ancestral-gastronomia` | `ancestral-gastronomia-01.jpeg` a `04.jpeg` | Vinculado a dados de restaurante/rota e modal. | Manter; serie boa para galeria. |
| `ribeiro-pesca` | `ribeiro-pesca-01.jpeg` a `08.jpeg` | Vinculado a dados de rota/modal. | Manter; avaliar peso de `07`. |
| `nova-esperanca-equoterapia` | `nova-esperanca-equoterapia-01.jpg` a `04.jpg` | Vinculado a rota/modal. | Manter; imagens pesadas pedem otimizacao futura. |
| `doces-e-delicias` | `doces-e-delicias-01.jpeg` a `08.jpeg` | Sem item estruturado no mapa. | Manter; depende de decisao humana/cadastro. |
| `IGREJA_MATRIZ` | PNG e WEBP em varias versoes | Usado em dados/galeria. | Escolher canonica futura sem quebrar pagina local. |
| `IGREJA_AGUA_BRANCA` | Serie numerada | Usado em dados/galeria. | Manter; revisar nomes em fase de assets. |
| `PARQUE_EXPOSICOES` | Serie `1` a `7` | Parte aparece como possivel orfa. | Revisar se deve virar galeria ou quarentena. |
| `PONTE_ENTRADA_CIDADE` | Serie com sufixos diferentes | Uso parcial. | Revisar canonica. |
| `CUIA` | `CUIA_1.JPG`, `CUIA_2.JPG`, `CUIA_3.JPG` | Uso parcial. | Revisar canonica. |
| `WEBP/NATAL`, `WEBP/RUA-DO-MATHE` | Series em WebP | Uso parcial. | Validar dimensoes e compressao. |

## 3. Imagens quebradas/referencias sem arquivo

Nao foram encontradas referencias quebradas reais em HTML/CSS/JS/dados turisticos que exigissem correcao imediata.

Observacao: os scripts ignoram `docs/` para evitar que exemplos documentais entrem como erro do site publicado.

Rodada 1 de limpeza segura: nenhuma imagem foi apagada, movida, renomeada ou escolhida como canonica. As 35 orfas provaveis continuam pendentes de revisao humana posterior.

## 4. Imagens orfas provaveis

| Arquivo | Tamanho | Observacao | Acao recomendada |
| --- | ---: | --- | --- |
| `images/EU_AMO_SMS.png` | 5.161.495 bytes | Grande e sem referencia estatica. | Revisar uso externo antes de remover. |
| `images/CHALE_DO_PRODUTOR_SEC_CULTURA.png` | 4.410.089 bytes | Grande e sem referencia estatica. | Revisar. |
| `images/IGREJA_COLONIA_IGUACU.png` | 3.855.743 bytes | Grande e sem referencia estatica. | Revisar. |
| `images/PARQUE_EXPOSICOES_1.jpg` a `7.jpg` | Variavel | Serie sem referencia estatica detectada. | Avaliar galeria/canonica. |
| `images/CUIA_1.JPG`, `images/CUIA_3.JPG` | Variavel | Nome parecido com arquivo possivelmente usado. | Revisar. |
| `images/GINASIO_POLACAO.JPG` | Variavel | Sem referencia estatica detectada. | Revisar se substituiu outra imagem. |
| `images/logo_turismo_completa.png` | Variavel | Logo sem referencia estatica detectada. | Nao apagar sem validar identidade visual. |
| `images/praca_rio_iguacu.jpg` | Variavel | Nome parecido com arquivo usado em maiusculas. | Revisar padronizacao. |
| `images/empreendimentos/doces-e-delicias/*.jpeg` | Variavel | Imagens novas sem item consolidado. | Manter; pendencia de conteudo. |

Lista completa em `docs/auditoria-output/assets-report.md`.

## 5. Imagens e videos pesados

| Arquivo | Tamanho | Risco |
| --- | ---: | --- |
| `videos/VIDEO_ABERTURA_4K.mp4` | 98.040.012 bytes | Alto impacto em carregamento se usado sem poster/lazy strategy. |
| `videos/INSTITUCIONAL_POLONES.mp4` | 97.037.240 bytes | Alto impacto. |
| `videos/ROTA_DO_TURISMO.mp4` | 91.975.315 bytes | Alto impacto. |
| `images/EU_AMO_SMS.png` | 5.161.495 bytes | PNG pesado. |
| `images/CASA_DA_MEMORIA.png` | 5.020.646 bytes | PNG pesado, mas usado. |
| `images/CHALE_DO_PRODUTOR_SEC_CULTURA.png` | 4.410.089 bytes | PNG pesado e possivelmente orfao. |
| `images/IGREJA_COLONIA_IGUACU.png` | 3.855.743 bytes | PNG pesado e possivelmente orfao. |
| `images/empreendimentos/nova-esperanca-equoterapia/nova-esperanca-equoterapia-01.jpg` | 3.360.949 bytes | Usado em empreendimento; otimizar depois. |

## 6. Sugestao de imagem canonica

Nao houve escolha canonica nesta rodada. Criterios sugeridos para a fase 2:

| Caso | Canonica sugerida | Validacao necessaria |
| --- | --- | --- |
| Series de empreendimentos com galeria | Manter `-01` como principal quando ja vinculado nos dados. | Conferir qualidade visual e peso. |
| Mesmo local em PNG e WebP | Preferir WebP otimizado se todos os navegadores alvo aceitarem e referencias forem atualizadas juntas. | Testar HOME, mapa, local e busca. |
| Imagem antiga e nova do mesmo empreendimento | Preferir a ja vinculada em dados recentes, sem apagar a antiga. | Validacao humana. |
| Arquivos em maiusculas/minusculas | Padronizar somente depois de confirmar referencias em Windows e deploy case-sensitive. | Testar em servidor estatico. |

## 7. Acoes recomendadas

| Tipo | Acao | Risco |
| --- | --- | --- |
| Manter | Todas as imagens de `images/empreendimentos/` ja vinculadas a dados. | Baixo. |
| Revisar | Imagens de `doces-e-delicias`, porque nao ha item seguro consolidado. | Medio. |
| Substituir referencia | Apenas se uma referencia quebrada real aparecer em HTML/CSS/JS/dados. | Baixo. |
| Otimizar depois | Videos e PNGs acima de 3 MB. | Medio, exige QA visual. |
| Remover depois | Somente arquivos confirmados como orfaos apos validacao humana. | Alto se feito sem conferencia. |

## Observacoes sobre empreendimentos

- Ancestral Gastronomia, Ribeiro Pesca e Turismo e Nova Esperanca ja possuem imagens estruturadas suficientes para modal/galeria.
- Doces e Delicias possui imagens copiadas, mas nao deve aparecer ate existir item confirmado.
- HEIC/DNG nao devem ser usados diretamente no site.
- Video da Ervateira Rei Verde nao foi vinculado nesta auditoria.
- Baldo, Marina Barra do Iguacu, Rei Verde e Hotel Moro dependem do que ja estiver vinculado nos dados; nao foi criada substituicao automatica.
