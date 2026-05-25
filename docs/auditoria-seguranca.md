# Auditoria de seguranca

Data: 2026-05-25

Escopo: auditoria do site estatico de turismo, sem criacao de backend, painel novo, dependencias, package.json, remocao de funcionalidades, redesign ou refatoracao geral.

## 1. Visao geral do risco atual

O site tem risco geral medio. A maior parte da superficie publica e estatica, mas existem integracoes ativas com Firebase, Formspree, Google Analytics, VLibras, Open-Meteo, OpenStreetMap/Leaflet e um Cloudflare Worker do chatbot. Tambem existem paginas de portal/admin com autenticacao Firebase e leitura/escrita em Firestore.

Os pontos mais sensiveis sao:

- renderizacao com `innerHTML` de dados de Firebase, JSON ou dados turisticos;
- Area Restrita/Admin dependente de regras Firestore corretamente publicadas;
- politicas CSP divergentes entre `_headers` e as metas HTML;
- analytics carregado no topo de varias paginas antes da decisao do banner de cookies.

Nao foram encontrados arquivos `.env`, `serviceAccount`, `private_key` ou segredo privado completo versionado. Foram encontrados identificadores publicos de cliente, como Firebase config, Google Maps key e App Check site key.

## 2. Superficies de ataque

- HTMLs principais: `index.html`, `mapa-turistico.html`, `local.html`, `eventos.html`, `noticias.html`, `noticia.html`, `privacidade.html`, `portal-usuario.html`, `admin-firebase.html` e paginas secundarias.
- Scripts compartilhados: `js/nav-shared.js`, `translations.js`, `js/search.js`, `js/search-index.js`, `js/site-meta.js`, `js/site-stats.js`.
- Mapa turistico: `js/mapa-turistico.js`, dados em `js/data/*`, Leaflet/OpenStreetMap e modal "Ver detalhes".
- Busca global: indice local gerado a partir de dados turisticos.
- Chatbot: `js/chatbot.js` e `cloudflare-worker/chat-worker.js`.
- Portal/Admin/Firebase: `portal-usuario.html`, `admin-firebase.html`, `js/firebase-auth.js`, `js/firebase-app-check.js`, `firestore.rules`, `config.js`.
- Service worker: `sw.js`.
- Privacidade: `js/cookies.js`, analytics, Formspree, localStorage, clima/cache, reservas e avaliacoes locais.
- Links externos: WhatsApp, Instagram, Facebook, YouTube, TikTok, Google Maps, prefeitura, documentos e politicas de terceiros.

## 3. Pontos criticos

- `admin-firebase.html` so e seguro se `firestore.rules` estiverem publicadas no projeto correto. A UI checa `window.currentUser.role === 'admin'`, mas a protecao real precisa estar no Firestore. As regras atuais bloqueiam escrita geral e restringem admin/moderador por `usuarios/{uid}.role`, o que e o desenho correto.
- Google Analytics e carregado diretamente em varias paginas antes de o usuario aceitar cookies. O banner consegue desativar depois da recusa, mas a primeira requisicao pode ocorrer antes do consentimento.
- Metas CSP em HTML ainda incluem `unsafe-eval` e diferem do `_headers`. Em hospedagem que aplica `_headers`, o header prevalece; em hospedagem que ignora `_headers`, as metas HTML ficam mais permissivas.

## 4. Pontos medios

- `local.html` renderiza dados turisticos com template strings e `innerHTML`. Hoje os dados vem de `js/locais-data.js`, mas se esse arquivo virar entrada editorial/CMS, o risco vira XSS. Recomenda-se migracao gradual para `SMSecurity` ou construcao com `textContent`.
- `eventos.html`, `js/reservas.js`, `js/cms.js`, `js/roteiro-ia.js` e algumas paginas antigas ainda usam `innerHTML` para blocos inteiros. Parte e HTML estatico controlado; parte pode receber dados editaveis. Nao foi feita refatoracao ampla nesta rodada.
- `translations.js` e fallback de idioma em `js/nav-shared.js` usam `innerHTML` para traducoes controladas pelo repositorio. Nao e risco imediato enquanto as traducoes forem codigo versionado, mas nao deve receber texto externo sem sanitizacao.
- `config.js` contem chaves publicas de cliente. Nao sao segredo privado, mas devem ter restricoes por dominio/projeto e monitoramento de uso.
- O service worker cacheia scripts como `config.js`, `js/chatbot.js`, `js/reservas.js` e `js/firebase-auth.js`. HTML/JSON e rotas sensiveis nao sao cacheados, mas mudancas de seguranca em scripts exigem incremento de versao.

## 5. Pontos baixos

- Varios links `target="_blank"` tinham `rel="noopener"` sem `noreferrer`, ou nao tinham `rel`. Corrigido.
- `js/search.js` renderizava resultados do indice com `innerHTML` sem escape. Corrigido.
- `portal-usuario.html` listava eventos do usuario e notificacoes com dados vindos de Firebase sem escape. Corrigido.
- `index.html` renderizava cards de eventos mesclando JSON e Firebase sem escape em titulo, horario e local. Corrigido.
- `js/mapa-turistico.js` ja escapava a maior parte dos campos do modal e cards; foi corrigida uma lista auxiliar de itens sem coordenadas e os `rel` dos links externos.

## 6. Correcoes recomendadas

Feitas nesta rodada:

- adicionar `rel="noopener noreferrer"` em links externos e links que abrem nova aba;
- usar escape em resultados da busca;
- usar escape em eventos do Portal do Usuario;
- usar escape em cards de eventos da HOME;
- ajustar `_headers` com CSP conservadora compatibilizada com CDNs usados, Firebase, Open-Meteo, Formspree, VLibras, YouTube/Felt/Google e worker do chatbot;
- documentar os riscos e limites antes de qualquer painel real.

Recomendadas para rodada futura:

- unificar CSP: remover metas HTML divergentes ou gerar a mesma politica em todas as paginas;
- remover `unsafe-eval` das metas HTML se nao houver dependencia real;
- aplicar consentimento de analytics antes de carregar `gtag.js`;
- criar helper unico para renderizacao segura em paginas antigas;
- revisar `eventos.html`, `local.html`, `js/cms.js`, `js/reservas.js` e `js/roteiro-ia.js` por partes, com teste visual apos cada troca;
- publicar e testar `firestore.rules` antes de qualquer evolucao administrativa.

## 7. O que nao e risco imediato

- Firebase `apiKey`, `authDomain`, `appId`, Google Maps key e App Check site key sao chaves publicas de cliente. Devem ser restritas, mas nao equivalem a segredo de servidor.
- `smsUserSession` em localStorage guarda nome/e-mail para exibir estado visual no menu. Nao concede permissao admin por si so.
- Parametros `?grupo=` e `?categoria=` do mapa passam por aliases internos e nao sao renderizados diretamente como HTML.
- `?id=` em `local.html` e usado como chave de busca em `window.locaisData`; nao injeta diretamente o parametro no DOM quando o id nao existe.
- O service worker nao cacheia navegacoes, `.html` nem `.json`, e exclui APIs/Firebase/Open-Meteo/nav/site-meta de cache.

## 8. Proximos passos antes de criar painel/admin

- Confirmar ambiente de producao e se `_headers` e realmente aplicado.
- Publicar/testar `firestore.rules` contra o projeto Firebase correto.
- Definir modelo de permissoes: admin, moderador, operador turistico, usuario comum.
- Garantir que toda tela admin use dados escapados e que nenhuma acao dependa so de estado local.
- Criar trilha de auditoria para aprovacoes, rejeicoes e alteracoes de perfil/permissao.
- Definir politica de retencao para reservas, eventos enviados, estabelecimentos enviados e mensagens de contato.
- Resolver consentimento previo do Analytics.
- So depois disso planejar painel administrativo real.

## XSS e innerHTML

Resumo por area:

- `js/mapa-turistico.js`: usa `innerHTML` extensivamente, mas o modal/cards usam `escapeHtml` para nome, descricao, tags, endereco, contato e links. Corrigido `missingItems.map` para escapar nomes e reforcado `rel`.
- `js/search.js`: antes injetava `title`, `category`, `description` e `url` do indice diretamente. Corrigido com `escapeHtml` e `safeUrl`.
- `portal-usuario.html`: eventos do usuario e notificacoes eram montados sem escape. Corrigido.
- `index.html`: cards de eventos da HOME recebiam dados de JSON/Firebase sem escape. Corrigido para titulo, horario, local e dia da semana.
- `admin-firebase.html`: dados de usuarios/eventos/estabelecimentos usam `SMSecurity` nos pontos revisados. Mantido.
- `noticia.html`: usa `SMSecurity`. Mantido.
- `local.html`: renderizacao de dados turisticos ainda e por template string sem escape amplo. Documentado para refatoracao incremental.
- `eventos.html`: usa `innerHTML` para listas, calendario e modal. Deve ser revisado em rodada propria.
- `translations.js`, `js/nav-shared.js`, `js/chatbot.js`, `js/cookies.js`: HTML controlado pelo repositorio; nao receber texto externo sem sanitizacao.

## Links externos

Todos os `target="_blank"` encontrados passaram a ter `rel="noopener noreferrer"`.

Areas cobertas:

- WhatsApp e compartilhamento;
- Instagram/Facebook/YouTube/TikTok;
- Google Maps;
- portal da prefeitura e noticias externas;
- documentos em nova aba;
- links do modal e do mapa turistico;
- chamadas dinamicas em `js/mapa-turistico.js` e `js/reservas.js`.

## Headers de seguranca

Existe `_headers` na raiz. Ele foi mantido e ajustado.

Estado atual:

- `X-Content-Type-Options: nosniff`: presente.
- `Referrer-Policy: strict-origin-when-cross-origin`: presente.
- `Permissions-Policy`: presente.
- `X-Frame-Options: DENY`: presente.
- `Strict-Transport-Security`: presente; manter apenas se producao sempre usar HTTPS.
- `Content-Security-Policy`: presente para `/*.html`, conservadora e compativel com as integracoes conhecidas.

Observacao: as metas CSP nos HTMLs continuam divergentes e mais permissivas. O ideal e uma fonte unica de politica.

## Service worker

`sw.js` esta em postura razoavel:

- nao intercepta `POST`;
- nao cacheia navegacoes;
- nao cacheia `.html` e `.json`;
- exclui Firebase, Firestore, Open-Meteo, nav-shared, site-meta e Google Tag Manager;
- limpa caches antigos ao ativar;
- usa `CACHE_NAME = 'turismo-sms-v13'`.

Recomendacao: sempre incrementar `CACHE_NAME` quando mudar scripts de seguranca, auth, headers documentados ou recursos precacheados.

## Area Restrita, login e admin

Estado encontrado:

- `portal-usuario.html` usa Firebase Auth real;
- `admin-firebase.html` usa Firebase Auth real e exige `role === 'admin'` na UI;
- `firestore.rules` tem controle real por `usuarios/{uid}.role` e `ativo != false`;
- `localStorage` nao controla role, apenas sessao visual simplificada no menu;
- se as regras Firestore nao estiverem publicadas, a UI sozinha nao basta.

Riscos antes de painel real:

- precisa confirmar deploy de regras;
- precisa revisar todas as telas admin para escape e auditoria;
- precisa evitar qualquer permissao derivada de localStorage;
- precisa definir processo seguro para criar o primeiro admin.

## Busca por segredos

Padroes verificados: `apiKey`, `secret`, `token`, `private_key`, `serviceAccount`, `password`, `senha`, `.env`, `firebase`, `supabase`, `credentials`, `client_secret`.

Achados:

- `config.js`: Google Maps key publica e Firebase config publica.
- `index.html`: Firebase config publica duplicada para eventos da HOME.
- `config.js`: App Check site key publica.
- `cloudflare-worker/chat-worker.js`: referencia `env.ANTHROPIC_API_KEY`, sem valor versionado.
- nenhum `.env`, `private_key`, `serviceAccount`, `client_secret` ou token privado encontrado no repo.

Recomendacoes:

- restringir Google Maps/Firebase por dominio e regras do provedor;
- manter segredo do chatbot somente em variavel de ambiente do worker;
- se alguma chave publica tiver sido usada sem restricao de dominio, revisar cotas e origem permitida.

## Privacidade e LGPD

Armazenamento local identificado:

- `sms_cookie_consent`: consentimento do banner.
- `sms-lang` e `smsLang`: idioma.
- `sms-font-size`: tamanho da fonte.
- `sms-high-contrast`: alto contraste.
- `sms-weather-cache-v1`: cache de previsao Open-Meteo por ate 1 hora.
- `agrosamas-banner-closed`: estado visual do banner.
- `smsUserSession`: nome/e-mail para estado visual do menu.
- reservas e avaliacoes locais em scripts proprios quando usados.

Envio para terceiros:

- Google Analytics/Tag Manager;
- Formspree em contato/newsletter;
- Firebase Auth/Firestore/App Check;
- Open-Meteo para clima;
- OpenStreetMap tiles via Leaflet;
- VLibras;
- Cloudflare Worker do chatbot;
- links externos de redes sociais/WhatsApp/Google Maps.

Risco LGPD principal: analytics carrega antes do consentimento nas paginas com `gtag.js` no `<head>`. A politica de privacidade ja menciona varios terceiros, mas deve citar explicitamente Open-Meteo, OpenStreetMap/Leaflet, VLibras, Formspree e o worker/chatbot se ainda nao estiver claro.

## Validacao executada

Checks de sintaxe:

- `node --check js/nav-shared.js`
- `node --check js/mapa-turistico.js`
- `node --check js/search.js`
- `node --check js/search-index.js`
- `node --check js/chatbot.js`
- `node --check js/security-utils.js`
- `node --check js/weather.js`
- `node --check js/site-meta.js`
- `node --check js/site-stats.js`
- `node --check translations.js`
- `node --check config.js`
- `node --check sw.js`
- `node --check scripts/audit-links.mjs`

Scripts de auditoria:

- `node scripts/audit-links.mjs`: 595 links, 0 quebrados, 16 legados/concorrentes.
- `node scripts/audit-assets.mjs`: 186 midias, 0 grupos duplicados, 0 referencias faltantes.
- `node scripts/audit-project.mjs`: 320 arquivos, 36 HTML, 21 CSS, 34 JS.

Teste local em `http://127.0.0.1:8080/`:

- HOME carregou sem erro de console; clima renderizou dados de Sao Mateus do Sul; menu movel abriu com `aria-expanded="true"`.
- `mapa-turistico.html` carregou sem erro de console; mapa/lista renderizados; 84 botoes de detalhes encontrados; modal abriu para "Igreja Matriz Sao Mateus".
- `portal-usuario.html` carregou sem erro de console e exibiu a tela de autenticacao.
- `privacidade.html` carregou sem erro de console e conteudo de privacidade/LGPD visivel.
- Na rodada complementar, `404.html`, `portal-usuario.html`, `admin-firebase.html` e `mapa-turistico.html` foram revalidados no servidor local sem erro de console novo relevante. Os links do 404 para HOME, Eventos, Galeria, Mapa Turistico, categorias do mapa, Reservas e Rotas abriram destinos reais.

## Correcao dos links quebrados apontados pelo auditor

Rodada complementar em 2026-05-25:

- `js/cms.js`, `js/firebase-auth.js` e `js/reservas.js` importam corretamente `./firebase-app-check.js` a partir da pasta `js/`. O arquivo existente e correto e `js/firebase-app-check.js`. O problema estava no `scripts/audit-links.mjs`, que convertia imports relativos `./firebase-app-check.js` para `/firebase-app-check.js` e passava a procurar o asset na raiz. A decisao foi corrigir a resolucao do auditor, sem alterar o runtime Firebase/Auth/Admin.
- `SECURITY_AUDIT_REPORT.md` e relatorios similares sao artefatos locais ignorados no `.gitignore`, nao paginas publicadas do site. O auditor passou a ignorar esses relatorios para nao contar links internos de evidencia antiga como links quebrados do site.
- Os links de `404.html` para `/mapa-turistico.html` e variantes com query foram mantidos. A variante limpa `/mapa-turistico` e reconhecida conceitualmente pelo mapa de rotas do auditor, mas nao existe como arquivo fisico (`mapa-turistico/index.html`) neste servidor estatico local. Portanto, trocar o 404 para a rota limpa criaria risco de navegacao quebrada localmente. O auditor foi ajustado para so marcar `.html` como redundante quando houver variante fisica sem `.html`.
- O link "Reservas" em `404.html` foi ajustado de `/reservas` para `/reservas.html`, porque nao existe `reservas/index.html` no projeto e a rota limpa quebra no servidor local estatico.
