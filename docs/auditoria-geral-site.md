# Auditoria geral do site

Data da auditoria: 08/06/2026  
Escopo: diagnostico/auditoria sem correcao de codigo, sem commit, sem alteracao de rules, sem redesign, sem alteracao de dados de empreendimentos.

## 1. Resumo executivo

O worktree iniciou limpo. O comando `git status --short` nao listou arquivos pendentes; exibiu apenas aviso de permissao ao tentar ler `C:\Users\jacob/.config/git/ignore`, fora do projeto.

A auditoria tecnica encontrou boa base estrutural: sem erro de sintaxe nos JavaScripts solicitados, sem links internos quebrados, sem referencias de midia inexistentes e com manifest apontando para assets existentes. A validacao renderizada abriu 9 paginas prioritarias em 3 viewports com status 200.

Os principais riscos encontrados sao:

- `eventos.html` tem meta CSP mais restritiva que `_headers` e bloqueia `https://www.google.com/recaptcha/api.js` no teste local.
- `eventos.html` manteve a interface em `Carregando eventos...` no recorte mobile porque `carregarEventos()` aguarda `Promise.all([loadStaticEvents(), loadApprovedFirebaseEvents()])`; se App Check/Firebase demorar ou falhar sem resolver rapido, o fallback estatico fica bloqueado.
- Ha 35 midias pesadas, incluindo 3 videos entre 87 MB e 93 MB e imagens acima de 3 MB usadas em paginas/dados.
- Ha 79 midias provavelmente orfas; nao devem ser apagadas sem validacao humana.
- Ha rotas legadas/redundantes e fluxo `/local?id=...` ainda referenciado, exigindo decisao antes de simplificar.
- Ha pendencias de dados: imagens vazias, coordenadas nulas, `mapsUrl` nulo/placeholder e duplicidades entre bases antigas e consolidadas.

Nao foram identificados problemas criticos que exijam publicacao imediata de Firebase Rules ou Storage Rules nesta rodada.

## 2. Quantitativos auditados

| Item | Quantidade |
| --- | ---: |
| Arquivos mapeados | 377 |
| HTMLs no projeto | 36 |
| HTMLs principais na raiz | 22 |
| Diretórios com `index.html` | 14 |
| CSS | 22 |
| JS no projeto | 37 |
| JS com `node --check` solicitado | 16 |
| Links coletados | 639 |
| Midias encontradas | 225 |
| Midias referenciadas | 146 |
| Paginas/viewport em validacao visual | 27 |

Relatorios brutos gerados/atualizados:

- `docs/auditoria-output/project-report.md`
- `docs/auditoria-output/project-report.json`
- `docs/auditoria-output/links-report.md`
- `docs/auditoria-output/links-report.json`
- `docs/auditoria-output/assets-report.md`
- `docs/auditoria-output/assets-report.json`
- `docs/auditoria-output/visual-playwright-report.json`
- `docs/auditoria-output/interaction-playwright-report.json`
- `docs/auditoria-output/data-audit-report.json`

## 3. Problemas criticos

Nenhum problema critico confirmado nesta rodada.

## 4. Problemas medios

| Pagina/arquivo | Problema | Evidencia | Impacto | Sugestao | Arquivos provaveis | Seguro corrigir depois? |
| --- | --- | --- | --- | --- | --- | --- |
| `eventos.html` | CSP da meta tag bloqueia reCAPTCHA | Playwright: `Loading the script 'https://www.google.com/recaptcha/api.js' violates Content Security Policy`; `_headers` permite recaptcha, mas a meta CSP de `eventos.html` nao inclui `https://www.google.com/recaptcha/` em `script-src`. | App Check pode falhar na agenda publica; em localhost houve erro de console. | Alinhar a meta CSP da pagina com a politica de `_headers`, mantendo origem especifica, sem abrir CSP de forma ampla. | `eventos.html`, `_headers` | Sim, mas validar em dominio publicado. |
| `eventos.html` | Fallback estatico pode ficar bloqueado por Firebase/App Check | Interacao mobile: texto permaneceu em `Carregando eventos...`; codigo usa `Promise.all([loadStaticEvents(), loadApprovedFirebaseEvents()])`. | Se Firebase/App Check travar ou demorar, a agenda estatica nao aparece mesmo com `eventos-2026.json` disponivel. | Renderizar eventos estaticos assim que carregarem e mesclar Firebase depois; ou aplicar timeout curto ao Firebase publico. | `eventos.html` | Sim, com teste em localhost e producao. |
| `js/locais-data.js` | URL de Maps placeholder e varios `mapsUrl: null` | `mapsUrl: 'https://maps.app.goo.gl/exemplo'` em `js/locais-data.js:25`; varios `mapsUrl: null`. | Pode levar usuario a rota invalida ou remover CTA de direcao em paginas legadas. | Validar manualmente links reais antes de trocar; nao inventar URL. | `js/locais-data.js` | Precisa validacao manual de dados. |
| `js/data/*`, `js/rotas-data.js` | Duplicidades por integracao legada | `rua-do-mathe` aparece em `pontos-turisticos.js` e `restaurantes.js`; `igreja-agua-branca` aparece em base de pontos e legado. | Risco de cards duplicados ou merges ambiguos no mapa/adapters. | Revisar regra de merge no adapter e decidir fonte canonica por item. | `js/data/turismo-data-adapter.js`, `js/data/pontos-turisticos.js`, `js/data/restaurantes.js`, `js/rotas-data.js` | Precisa validacao manual. |
| `sw.js` / assets | Precache contem imagem pesada | `images/IGREJA_MATRIZ_1.png` tem 3,45 MB e esta referenciada por `sw.js`. | Instalação/atualizacao do SW fica mais pesada; usuarios moveis podem baixar asset grande cedo demais. | Usar versao otimizada/WebP no precache ou remover do precache se nao for essencial offline. | `sw.js`, `images/IGREJA_MATRIZ_1.png` | Sim, apos validar offline. |

## 5. Problemas baixos

| Pagina/arquivo | Problema | Evidencia | Impacto | Sugestao | Arquivos provaveis | Seguro corrigir depois? |
| --- | --- | --- | --- | --- | --- | --- |
| `js/breadcrumbs.js`, paginas legadas | 16 rotas legadas/concorrentes | `links-report.md`: `/o-que-fazer`, `/rotas-completas`, `/mapa-completo`, `/mapa-3d`, `/sabores`, `/onde-ficar`. | Confunde arquitetura e manutencao; nao quebra link. | Decidir se continuam como compatibilidade ou se viram redirecionamento/documentacao. | `js/breadcrumbs.js`, paginas legadas | Sim, com decisao de produto. |
| Varias paginas | 15 links redundantes com `.html` quando existe rota limpa | `links-report.md`: `eventos/index.html -> /eventos.html`, `manifest.json -> /eventos.html?...`, etc. | Baixo risco; aumenta superficie de cache/SEO duplicado. | Padronizar URL canonica aos poucos. | HTMLs de compatibilidade, `manifest.json`, `sw.js` | Sim. |
| `index.html`, `js/data/pontos-turisticos.js`, `js/data/restaurantes.js` | Fluxo `/local?id=...` ainda depende de decisao | 17 ocorrencias marcadas como decisao humana no relatorio de links. | Mantem rota legada viva; pode competir com modal/mapa. | Decidir se `local.html` permanece como detalhe oficial ou se o mapa/modal vira fonte unica. | `index.html`, `local.html`, `js/locais-data.js`, `js/data/pontos-turisticos.js` | Precisa decisao manual. |
| UI global | Botoes de idioma/estacao sem nome acessivel detectavel | Playwright: 9 botoes sem texto/aria-label em desktop (`season-switcher__option`, `lang-option`). | Acessibilidade parcial para leitor de tela. | Adicionar `aria-label`/texto oculto aos botoes. | `js/season-theme.js`, `js/nav-shared.js`, HTMLs globais | Sim. |
| Dados | Imagens vazias em restaurantes/hospedagens/eventos | `data-audit-report.json`; exemplos: `Restaurante e Churrascaria Dallas`, `Parada Pinoli`, `Hotel Nora`, `Feira Gastronômica`. | Cards podem depender de fallback generico. | Preencher imagens reais ou manter fallback documentado. | `js/data/restaurantes.js`, `js/data/hospedagens.js`, `js/data/eventos.js` | Precisa validacao de dados. |
| Dados | Coordenadas nulas em hospedagens/eventos/informacoes | `data-audit-report.json`; exemplos: `Hotel São Mateus`, `Hotel Nora`, `Feira da Lua`. | Itens aparecem sem marcador ou em lista de pendencias. | Confirmar coordenadas reais antes de alterar. | `js/data/hospedagens.js`, `js/data/eventos.js`, `js/data/informacoes-essenciais.js` | Precisa validacao manual. |
| Assets | 79 midias provavelmente orfas | `assets-report.md`; inclui `images/EU_AMO_SMS.png`, `images/CASA_DA_MEMORIA.png`, `images/CHALE_DO_PRODUTOR_SEC_CULTURA.png`. | Peso de repositorio/deploy; nao afeta runtime se nao referenciado. | Inventariar antes; nao apagar sem validacao humana. | `images/` | Precisa validacao manual. |

## 6. Avisos inofensivos ou dependentes do ambiente

| Origem | Aviso | Classificacao |
| --- | --- | --- |
| App Check em `index.html`, `mapa-turistico.html`, `portal-usuario.html`, `admin-firebase.html` | `FirebaseError: AppCheck: ReCAPTCHA error. (appCheck/recaptcha-error)` em localhost/headless. | Limitacao de localhost/headless, mas deve ser revalidado no dominio publicado. |
| Google Analytics | Requisicoes `https://www.google-analytics.com/g/collect...` abortadas em headless. | Aviso inofensivo no ambiente de auditoria. |
| `noticia.html` | `Firebase CMS indisponível, usando localStorage: CONFIG.firebase ausente`. | Fallback esperado quando a pagina nao recebe config Firebase. |
| Leaflet | Elemento `.leaflet-proxy` parece ter grande `right` no detector de overflow, mas `documentElement.scrollWidth` ficou sem overflow horizontal. | Falso positivo visual tipico do Leaflet. |
| Browser embutido | Inicializacao falhou com runtime do Browser. | Falha da ferramenta, nao erro do site. Fallback usado: Playwright + Chrome local. |

## 7. Problemas de dados

Resumo do `data-audit-report.json`:

- 79 itens analisados entre dados novos e legado carregavel em ambiente Node.
- 151 achados heuristicos, concentrados em campos vazios, coordenadas nulas, duplicidades entre bases e dados legados sem categoria explicita.
- A contagem inclui falsos positivos esperados do legado, porque `js/rotas-data.js` e `js/data/turismo-data-adapter.js` normalizam parte desses campos em runtime.

Itens que merecem revisao manual primeiro:

1. `js/locais-data.js:25`: `mapsUrl` de exemplo.
2. `js/data/restaurantes.js`: imagens vazias em `Restaurante e Churrascaria Dallas` e `Parada Pinoli`.
3. `js/data/hospedagens.js`: imagens vazias e coordenadas nulas em hoteis/pousadas.
4. `js/data/eventos.js`: eventos sem imagem e `Feira da Lua` com coordenada nula.
5. Duplicidades por id/nome entre pontos turisticos, restaurantes e legado.

## 8. Problemas de imagem/asset

O `audit-assets` encontrou 225 midias, 0 duplicatas reais por SHA-256 e 0 referencias quebradas.

Principais candidatos a otimizacao:

| Arquivo | Tamanho | Uso |
| --- | ---: | --- |
| `videos/VIDEO_ABERTURA_4K.mp4` | 93,50 MB | `galeria.html` |
| `videos/INSTITUCIONAL_POLONES.mp4` | 92,54 MB | `galeria.html` |
| `videos/ROTA_DO_TURISMO.mp4` | 87,71 MB | `index.html` |
| `images/empreendimentos/agrosamas/agrosamas-02.jpg` | 4,59 MB | `js/data/eventos.js` |
| `images/empreendimentos/agrosamas/agrosamas-01.jpg` | 4,08 MB | `js/data/eventos.js` |
| `images/IGREJA_MATRIZ_1.png` | 3,45 MB | `galeria.html`, `index.html`, `js/locais-data.js`, `sw.js` |

Manifest/PWA: icones e screenshot do `manifest.json` existem.

## 9. Problemas de mobile/layout

Viewports testados: desktop 1366x900, mobile 390x844 e mobile 430x932.

Achados:

- Nao houve overflow horizontal real (`scrollWidth` sem excesso) nas paginas prioritarias.
- O detector apontou `#navLinks` fora da viewport em mobile; pela captura, trata-se do menu recolhido/offcanvas, nao overflow do documento.
- O cookie banner aparece no primeiro viewport mobile e ocupa a parte inferior; nao e quebra, mas interfere na leitura inicial em paginas como `sabores.html`.
- `eventos.html` mobile ficou com `Carregando eventos...`, o que e problema funcional mais relevante do que layout.

## 10. Problemas de cache/SW

`sw.js` passou em `node --check`.

Pontos positivos:

- `CACHE_NAME = 'turismo-sms-v17'`.
- Navegacoes, HTML e JSON saem do runtime cache.
- `admin-firebase.html` e `portal-usuario.html` tem `no-store` em `_headers`.
- `config.js`, `js/site-meta.js`, `sw.js` e scripts criticos aparecem como `no-cache`/`NEVER_CACHE`.

Riscos:

- `sw.js` faz precache de assets relativamente pesados.
- Mudancas de CSP/metas por pagina ainda precisam ser validadas em producao porque `_headers` e meta CSP podem se sobrepor.

## 11. Problemas de console/CSP/terceiros

| Pagina | Achado | Gravidade | Observacao |
| --- | --- | --- | --- |
| `eventos.html` | CSP bloqueia `https://www.google.com/recaptcha/api.js`. | Media | Meta CSP da pagina nao acompanha `_headers`. |
| `index.html`, `mapa-turistico.html`, `portal-usuario.html`, `admin-firebase.html` | App Check/reCAPTCHA falha em localhost/headless. | Aviso/ambiente | Nao tratar como erro final do site sem producao. |
| Varias paginas | GA abortado no headless. | Baixa/inofensiva | Nao afeta navegacao. |
| `noticia.html` | CMS cai para localStorage sem `CONFIG.firebase`. | Baixa | Fallback esperado; validar fluxo real de noticia publicada. |

## 12. Recomendações por prioridade

1. Corrigir o carregamento de eventos para nao bloquear fallback estatico quando Firebase/App Check falhar ou demorar.
2. Alinhar a meta CSP de `eventos.html` com as origens reCAPTCHA especificas ja previstas em `_headers`.
3. Revisar `mapsUrl` placeholder em `js/locais-data.js`, sem inventar dados.
4. Otimizar os 3 videos grandes ou trocar estrategia de carregamento na home/galeria.
5. Revisar imagens acima de 3 MB usadas por dados/cards.
6. Adicionar nomes acessiveis aos botoes globais de idioma/estacao.
7. Decidir o papel de `/local?id=...` e paginas legadas antes de remover/redirectar.
8. Confirmar coordenadas e imagens vazias em hospedagens/restaurantes/eventos.
9. Revisar precache do Service Worker para evitar assets grandes.
10. Revalidar App Check, login e agenda no dominio publicado.

## 13. Proximos blocos de correcao por risco

### Bloco A: correcoes pequenas e seguras

- Acessibilidade dos botoes de idioma/estacao.
- Mensagens de fallback mais claras quando Firebase/App Check falha.
- Padronizacao pontual de links redundantes sem mudar arquitetura.

Arquivos provaveis: `js/nav-shared.js`, `js/season-theme.js`, HTMLs com controles globais.

### Bloco B: dados/imagens

- `mapsUrl` placeholder/nulos.
- Imagens vazias.
- Coordenadas nulas.
- Midias acima de 3 MB.

Arquivos provaveis: `js/locais-data.js`, `js/data/*.js`, `js/rotas-data.js`, `images/`, `videos/`.

Precisa validacao manual.

### Bloco C: layout/mobile

- Validar menu mobile com interacao manual.
- Revisar impacto do banner de cookies no primeiro viewport.
- Confirmar `eventos.html` apos corrigir loading.

Arquivos provaveis: `css/*`, `js/nav-shared.js`, `eventos.html`.

### Bloco D: admin/portal

- Revalidar login, mostrar senha, expiracao de sessao e dados opcionais em dominio publicado.
- Nao alterar auth, roles ou rules sem bloco proprio.

Arquivos provaveis: `admin-firebase.html`, `portal-usuario.html`, `js/firebase-auth.js`, `js/admin-content-cms.js`.

### Bloco E: cache/SW/CSP

- CSP de `eventos.html`.
- Precache com asset pesado.
- Validacao de Service Worker apos deploy.

Arquivos provaveis: `eventos.html`, `_headers`, `sw.js`.

## 14. O que nao deve ser alterado sem validacao manual

- Firestore Rules.
- Storage Rules.
- Auth, roles, claims e permissoes.
- Dados de empreendimentos, coordenadas e Maps URLs.
- Remocao de midias orfas.
- Remocao de paginas legadas ou fluxo `/local?id=...`.
- CSP ampla com `*` ou liberacao generica de scripts.
- Estrutura visual/redesign.

## 15. Validacoes executadas

Comandos:

```powershell
git status --short
node --check sw.js
node --check config.js
node --check js/site-meta.js
node --check js/weather.js
node --check js/season-theme.js
node --check js/nav-shared.js
node --check js/firebase-auth.js
node --check js/admin-content-cms.js
node --check js/cms.js
node --check js/mapa-turistico.js
node --check js/rotas-data.js
node --check js/data/pontos-turisticos.js
node --check js/data/rotas.js
node --check js/data/turismo-data.js
node --check js/data/turismo-data-adapter.js
node --check js/locais-data.js
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
```

Validacao visual:

- Browser embutido: tentativa falhou na inicializacao do runtime; tratado como falha da ferramenta, nao do site.
- Fallback: servidor local com `python -m http.server` e Playwright usando Chrome local.
- Paginas abertas: `index.html`, `mapa-turistico.html`, `sabores.html`, `eventos.html`, `noticias.html`, `noticia.html`, `onde-ficar.html`, `portal-usuario.html`, `admin-firebase.html`.
- Viewports: 1366x900, 390x844, 430x932.
- Interacao adicional: `mapa-turistico.html` desktop com busca por `Ancestral`, filtros `Gastronomia`, `Eventos`, `Hospedagem`, `Roteiros`, clique em marcador e popup.
- Interacao adicional: `eventos.html` mobile 390px para confirmar estado de fallback/cards.

## 16. Limitacoes da auditoria

- Nao houve login real no admin/portal.
- Permissoes Firebase nao foram validadas como verdade absoluta em localhost/headless.
- App Check/reCAPTCHA em localhost/headless pode falhar mesmo quando producao esta correta.
- Nao foram instaladas dependencias nem browsers.
- A auditoria de dados e heuristica; parte dos achados de legado pode ser normalizada pelo adapter em runtime.
- Nao houve publicacao nem validacao no Netlify/producao.

## 17. Publicacao/Netlify/Rules

- Firebase Rules: nao precisa publicar nesta rodada; nenhum arquivo de rules foi alterado.
- Storage Rules: nao precisa publicar nesta rodada; nenhum arquivo de rules foi alterado.
- Netlify: recomendada validacao posterior de `_headers` + meta CSP em producao, especialmente para `eventos.html`.
