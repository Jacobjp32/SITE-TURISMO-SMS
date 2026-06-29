# Bloco S3B - Compressao real do video da hero

Gerado em: 2026-06-29

## Status

Concluido com MP4 comprimido. O WebM opcional foi iniciado, mas interrompido por lentidao e removido por ser arquivo parcial.

O mapa 3D continua suspenso. A hero continua usando video, agora apontando para a versao MP4 comprimida. O arquivo original foi preservado no projeto.

## Estado inicial

| Item | Resultado |
| --- | --- |
| Worktree no inicio | Apenas documentacao/relatorios pendentes do S3B anterior |
| Video original | `videos/ROTA_DO_TURISMO.mp4` |
| Tamanho original | 91.975.315 bytes, cerca de 87,71 MB |
| Poster atual | `images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg` |
| Service Worker | `turismo-sms-v18`, videos em `NEVER_CACHE_EXT` |

## Ferramentas

`ffmpeg` e `ffprobe` nao resolveram pelo PATH desta sessao, apesar de haver uma entrada antiga do WinGet apontando para uma pasta Gyan inexistente:

```text
C:\Users\jacob\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin
```

Foi usado o par funcional encontrado em:

```text
C:\Program Files (x86)\Wondershare\Recoverit\ffmpeg.exe
C:\Program Files (x86)\Wondershare\Recoverit\ffprobe.exe
```

Versoes usadas:

| Ferramenta | Versao |
| --- | --- |
| `ffmpeg` | 7.0.1 |
| `ffprobe` | 7.0.1 |

Os encoders `libx264` e `libvpx-vp9` estavam disponiveis.

## Dados tecnicos do original

| Campo | Valor |
| --- | --- |
| Arquivo | `videos/ROTA_DO_TURISMO.mp4` |
| Tamanho | 91.975.315 bytes, cerca de 87,71 MB |
| Duracao | 135,166667 s |
| Resolucao | 1920x1080 |
| Proporcao | 16:9 |
| Codec de video | H.264 / AVC |
| Perfil | High |
| FPS | 30 |
| Bitrate de video | 5.122.454 bps |
| Bitrate total | 5.443.668 bps |
| Audio | Sim, AAC LC stereo, 48 kHz |
| Bitrate de audio | 317.334 bps |

## Arquivos gerados

| Arquivo | Status | Tamanho |
| --- | --- | ---: |
| `videos/ROTA_DO_TURISMO.hero-720p.mp4` | Gerado e usado na hero | 33.565.857 bytes, cerca de 32,01 MB |
| `videos/ROTA_DO_TURISMO.hero-720p.webm` | Tentado, interrompido por lentidao e removido | N/A |

Reducao do MP4 comprimido em relacao ao original: cerca de 63,51%.

## Dados tecnicos do MP4 comprimido

| Campo | Valor |
| --- | --- |
| Arquivo | `videos/ROTA_DO_TURISMO.hero-720p.mp4` |
| Tamanho | 33.565.857 bytes, cerca de 32,01 MB |
| Duracao | 135,166667 s |
| Resolucao | 1280x720 |
| Codec de video | H.264 / AVC, `libx264` |
| FPS | 30 |
| Bitrate de video | 1.983.772 bps |
| Bitrate total | 1.986.635 bps |
| Audio | Removido |
| `faststart` | Aplicado com `-movflags +faststart` |

## Comandos executados

Versoes:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
ffmpeg -version
ffprobe -version
```

Como o PATH nao resolveu os binarios nesta sessao, os comandos efetivos usaram caminho absoluto.

Inspecao do original:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
& "C:\Program Files (x86)\Wondershare\Recoverit\ffprobe.exe" -v error -show_format -show_streams -of json "videos\ROTA_DO_TURISMO.mp4"
```

Geracao MP4:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
& "C:\Program Files (x86)\Wondershare\Recoverit\ffmpeg.exe" -y -i "videos\ROTA_DO_TURISMO.mp4" -vf "scale='min(1280,iw)':-2" -c:v libx264 -preset slow -crf 28 -an -movflags +faststart "videos\ROTA_DO_TURISMO.hero-720p.mp4"
```

Tentativa WebM opcional:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
& "C:\Program Files (x86)\Wondershare\Recoverit\ffmpeg.exe" -y -i "videos\ROTA_DO_TURISMO.mp4" -vf "scale='min(1280,iw)':-2" -c:v libvpx-vp9 -deadline good -cpu-used 4 -crf 36 -b:v 0 -an "videos\ROTA_DO_TURISMO.hero-720p.webm"
```

A tentativa WebM foi interrompida com `q` apos avancar apenas cerca de 35 s de video em mais de 2 minutos. O arquivo parcial foi removido.

## Alteracao no HTML

`index.html` deixou de referenciar o MP4 original na hero e passou a usar:

```html
<source src="videos/ROTA_DO_TURISMO.hero-720p.mp4" type="video/mp4">
```

Foram mantidos:

- `autoplay`
- `muted`
- `loop`
- `playsinline`
- `preload="metadata"`
- `poster="images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg"`
- `width="1920"` e `height="1080"`
- fallback textual

## Service Worker

`sw.js` nao foi alterado neste bloco.

O estado atual continua contendo:

```js
const NEVER_CACHE_EXT = ['.json', '.html', '.mp4', '.webm', '.mov', '.m4v'];
```

O MP4 comprimido nao foi adicionado ao `PRECACHE_ASSETS`.

## Validacoes

Executadas:

- `node --check scripts/audit-hero-video.mjs`
- `node --check sw.js`
- `node scripts/audit-hero-video.mjs`
- `node scripts/audit-assets.mjs`
- `node scripts/audit-project.mjs`
- `node scripts/audit-links.mjs`

Tambem foi feita validacao local da home em desktop e mobile.

## Validacao visual/manual

Desktop local:

- Hero carregou.
- Video comprimido presente.
- Fonte detectada: `videos/ROTA_DO_TURISMO.hero-720p.mp4`.
- Poster/fallback preservado.
- Sem erro de console relacionado a hero.

Mobile local:

- Viewport testado: 390x844.
- Hero carregou.
- Sem overflow horizontal.
- Video comprimido presente.
- Poster/fallback preservado.

Observacao: console local pode exibir erros de Firebase/App Check em localhost, externos a este bloco.

## Riscos

- O MP4 final ainda tem cerca de 32,01 MB porque o video original tem 135 s. O ideal para hero continua sendo um loop bem mais curto.
- WebM nao foi mantido por custo de processamento nesta sessao.
- A build Gyan informada no briefing nao estava acessivel no PATH desta sessao; foi usado outro par FFmpeg/FFprobe funcional com suporte aos codecs necessarios.

## Rollback

1. Em `index.html`, trocar a fonte da hero de volta para:

```html
<source src="videos/ROTA_DO_TURISMO.mp4" type="video/mp4">
```

2. Opcionalmente remover `videos/ROTA_DO_TURISMO.hero-720p.mp4`.
3. Rodar `node scripts/audit-hero-video.mjs` para atualizar o relatorio.

## Proxima etapa recomendada

Criar um corte curto da hero, idealmente entre 8 e 15 segundos, e recomprimir esse loop. A reducao estrutural ja aconteceu, mas a maior economia viria de reduzir a duracao do video decorativo.
