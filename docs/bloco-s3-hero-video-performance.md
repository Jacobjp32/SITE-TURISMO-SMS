# Bloco S3 - Hero com video e performance

Gerado em: 2026-06-29

## Escopo

Este bloco manteve o video como solucao temporaria/oficial da hero. Nao foi implementado mapa 3D, nao houve teste de SDK de mapa 3D, nao houve conversao de binarios e nenhum video original foi apagado.

## Estado encontrado

| Item | Valor |
| --- | --- |
| Hero | `index.html`, secao `#map-hero` |
| Video atual | `videos/ROTA_DO_TURISMO.mp4` |
| Tamanho do video | 91.975.315 bytes, cerca de 87,71 MB |
| Poster atual | `images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg` |
| Tamanho do poster | 132.518 bytes, cerca de 0,13 MB |
| Referencia do video | `index.html` |
| Video no precache do SW | Nao |
| Poster no precache do SW | Sim |

## Atributos antes/depois

| Atributo | Antes | Depois |
| --- | --- | --- |
| `autoplay` | presente | mantido |
| `muted` | presente | mantido |
| `loop` | presente | mantido |
| `playsinline` | presente | mantido |
| `preload` | `auto` | `metadata` |
| `poster` | `images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg` | mantido |
| `width` / `height` | ausente | `1920` / `1080` |
| fallback textual | ausente | texto interno no `<video>` |
| acessibilidade | sem indicacao explicita | video decorativo com `aria-hidden="true"` e frame com `aria-label` |

## Mudancas feitas

- `index.html`: a hero ganhou classe dedicada no video, `preload="metadata"`, dimensoes declaradas, fallback textual simples e marcacao para tratar o video como decorativo.
- `css/index.css`: o container `#map` e `.hero-video` passaram a usar o poster como background fallback, preservando a imagem se o video demorar, falhar ou ficar indisponivel.
- `sw.js`: a versao de cache passou para `turismo-sms-v18`; videos `.mp4`, `.webm`, `.mov` e `.m4v` entraram em `NEVER_CACHE_EXT`; `images/IGREJA_MATRIZ_1.png` foi removida do precache por ser pesada e ja apontada na auditoria S1.
- `scripts/audit-hero-video.mjs`: novo script de auditoria da hero com video.

## Service Worker

O video da hero nao estava no `PRECACHE_ASSETS`. Mesmo assim, antes do ajuste ele poderia ser salvo no cache dinamico apos uma requisicao GET comum, porque extensoes de video nao estavam bloqueadas em `NEVER_CACHE_EXT`.

A decisao foi bloquear videos no cache dinamico e subir a versao do cache. Isso reduz o risco de armazenar um MP4 de quase 88 MB no cache do navegador/PWA. O poster foi mantido no precache porque e leve e sustenta o fallback visual da hero.

Tambem foi removida do precache a imagem `images/IGREJA_MATRIZ_1.png`, de cerca de 3,45 MB. Ela continua existindo no projeto e pode ser carregada normalmente quando uma pagina precisar dela, mas deixa de pesar na instalacao inicial do PWA.

## Midias pesadas relacionadas

### Videos

| Arquivo | Tamanho | Uso |
| --- | ---: | --- |
| `videos/VIDEO_ABERTURA_4K.mp4` | 98.040.012 bytes, 93,50 MB | `galeria.html` |
| `videos/INSTITUCIONAL_POLONES.mp4` | 97.037.240 bytes, 92,54 MB | `galeria.html` |
| `videos/ROTA_DO_TURISMO.mp4` | 91.975.315 bytes, 87,71 MB | `index.html` |

### Imagens/posters da home

| Arquivo | Tamanho | Uso |
| --- | ---: | --- |
| `images/IGREJA_MATRIZ_1.png` | 3.614.212 bytes, 3,45 MB | `index.html`, `galeria.html`, antes tambem no SW |
| `images/diorama_sao_mateus.png` | 1.414.760 bytes, 1,35 MB | `index.html`, `galeria.html` |
| `images/mascotes/MASCOTE_CAPIVARA_PINHAO.png` | 1.136.738 bytes, 1,08 MB | `index.html`, `galeria.html`, `sw.js` |
| `images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg` | 132.518 bytes, 0,13 MB | poster, SEO/social e galeria |

## Recomendacoes de compressao

- Criar uma versao MP4 H.264 menor para hero, alvo entre 3 MB e 8 MB.
- Criar WebM opcional para navegadores compativeis, mantendo MP4 como fallback.
- Usar duracao entre 8 e 15 segundos, sem audio relevante, em loop suave.
- Exportar em 1920x1080 no maximo, ou 1600x900 se a perda visual for aceitavel.
- Manter bitrate aproximado entre 2 e 4 Mbps para MP4 da hero, ajustando apos revisao visual.
- Manter poster otimizado abaixo de 300 KB.
- Processo sugerido, sem executar neste bloco: gerar primeiro uma copia de trabalho fora do original, comparar visualmente, trocar referencia apenas apos aprovacao.

## Como testar

1. Abrir a home em desktop.
2. Confirmar que a hero mostra o poster antes do video carregar.
3. Confirmar que o video toca quando o navegador permite autoplay.
4. Simular rede lenta ou falha do video e confirmar que o poster/fundo permanece.
5. Testar mobile e confirmar que o frame da hero nao quebra.
6. Confirmar que nenhuma tentativa de mapa 3D foi carregada.
7. Confirmar console sem erro critico novo.

## Rollback

- Em `index.html`, voltar `preload` para `auto` e remover `class`, `width`, `height`, `aria-hidden`, `tabindex` e o fallback textual do `<video>`.
- Em `css/index.css`, remover as regras de background/fallback de `#map` e `.hero-video`.
- Em `sw.js`, voltar `CACHE_NAME` para a versao anterior, remover extensoes de video de `NEVER_CACHE_EXT` e recolocar `images/IGREJA_MATRIZ_1.png` no `PRECACHE_ASSETS`.
- Remover `scripts/audit-hero-video.mjs` e os relatorios gerados por ele, se a auditoria dedicada nao for mais desejada.

## Pendencias humanas

- Aprovar a compressao/substituicao do MP4 da hero.
- Revisar visualmente o video comprimido antes de trocar a referencia.
- Definir se os dois videos pesados da galeria entram em outro bloco de otimizacao.
- Publicar/deployar somente quando autorizado.

## Proxima etapa recomendada

Bloco de midias: gerar uma copia comprimida de `videos/ROTA_DO_TURISMO.mp4`, criar WebM opcional, comparar visualmente com o original e trocar a referencia apenas apos aprovacao.
