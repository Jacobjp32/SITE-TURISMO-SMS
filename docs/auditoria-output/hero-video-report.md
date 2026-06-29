# Saida da auditoria da hero com video

Gerado em 2026-06-29T14:10:36.418Z.

## Hero

- Hero encontrada: sim
- Video encontrado: sim
- Poster: images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg (0.13 MB)
- Cache SW atual: turismo-sms-v18
- Original preservado: sim
- Original referenciado pela hero: nao
- Extensoes de video em NEVER_CACHE_EXT: sim

## Atributos do video

| attr | valor |
| --- | --- |
| class | hero-video |
| autoplay | presente |
| muted | presente |
| loop | presente |
| playsinline | presente |
| preload | metadata |
| width | 1920 |
| height | 1080 |
| aria-hidden | true |
| tabindex | -1 |
| poster | images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg |


## Video da hero

| tipo | arquivo | tamanho | uso | precache | neverCacheExt |
| --- | --- | --- | --- | --- | --- |
| MP4 | videos/ROTA_DO_TURISMO.hero-720p.mp4 | 32.01 MB | index.html | nao | sim |


## Original preservado

| arquivo | tamanho | preservado | hero |
| --- | --- | --- | --- |
| videos/ROTA_DO_TURISMO.mp4 | 87.71 MB | sim | nao |


## Maiores videos do projeto

| arquivo | tamanho | uso |
| --- | --- | --- |
| videos/VIDEO_ABERTURA_4K.mp4 | 93.50 MB | galeria.html |
| videos/INSTITUCIONAL_POLONES.mp4 | 92.54 MB | galeria.html |
| videos/ROTA_DO_TURISMO.mp4 | 87.71 MB | scripts/audit-hero-video.mjs |
| videos/ROTA_DO_TURISMO.hero-720p.mp4 | 32.01 MB | index.html |


## Imagens pesadas da home e poster

| arquivo | tamanho | uso |
| --- | --- | --- |
| images/IGREJA_MATRIZ_1.png | 3.45 MB | galeria.html, index.html, js/locais-data.js |
| images/diorama_sao_mateus.png | 1.35 MB | galeria.html, index.html |
| images/mascotes/MASCOTE_CAPIVARA_PINHAO.png | 1.08 MB | galeria.html, index.html, sw.js |
| images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg | 0.13 MB | galeria.html, index.html, js/admin-content-cms.js, js/cms.js, js/reservas.js, manifest.json, noticia.html, noticias.html, sw.js |


## Recomendacoes

- Manter o video fora do precache e impedir cache dinamico por extensao.
- Produzir MP4 H.264 menor para hero, com alvo entre 3 MB e 8 MB.
- Gerar WebM opcional para navegadores compativeis.
- Manter poster otimizado abaixo de 300 KB e com dimensoes proximas de 1600x900 ou 1920x1080.
- Preferir duracao de 8 a 15 segundos, sem audio relevante, em loop suave.
