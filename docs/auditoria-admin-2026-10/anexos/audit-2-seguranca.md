# Auditoria de segurança (somente leitura) — Painel Admin/CMS

- **Worktree:** `.worktrees/auditoria-admin` (origin/main `f0bf549`)
- **Data:** 2026-10-16
- **Escopo:** `firestore.rules`, `storage.rules`, `functions/*`, `admin-firebase.html`, `js/admin/**`, `js/admin-content-cms.js`, `js/firebase-auth.js`, `js/security-utils.js`, consumidores públicos relevantes, `_headers`, `.gitignore`, testes.
- **Método:** leitura estática. Nada foi executado contra produção, nenhum ataque foi executado, nenhum arquivo do repositório foi alterado. `npm audit` **não** foi executado: `functions/node_modules` não existe no worktree e a auditoria precisaria de rede.

## 0. Estado de implantação (não verificável daqui)

| Item | O que o repositório mostra | Situação em produção |
|---|---|---|
| Firestore/Storage Rules | Último deploy documentado: `ADMIN-B2A6-AUTHORIZATION-RULES-DEPLOY` em 2026-08-13 (CHANGELOG_AI.md:229-230). Depois disso, `firestore.rules`/`storage.rules` mudaram nos commits `a52bd92`, `1c8ce12`, `26b89b5`, `432c8eb`, `72aa8c5`, `e8fed8a` e `22a15d7` (2026-08-26 a 2026-09-14) | **NÃO VERIFICADO.** Não encontrei registro de deploy desses commits. É possível que a produção esteja com o ruleset de 13/08 (sem `gallery_items`, `site_config`, `audit_logs`, endurecimento de `reservas`, `approved-media`, travas CMS). Confirme com `firebase firestore:rules`/console antes de concluir qualquer item. |
| `noticias` com leitura de rascunho só para admin, `media_library` só para admin, `ativo == true` estrito | Presentes no arquivo local; segundo a governança, publicados em 13/08 | Provável, mas não verificado |
| Function `prefeituraFeed` | A memória do projeto diz que foi publicada com 4c8d1a8 | Não verificado |
| Function `writeAdminAuditLog` | Código presente | **Deploy não verificado.** Se não estiver implantada, `audit_logs` fica vazio |
| App Check | Ativado no cliente (`activate(siteKey, true)`). Pela governança, **sem enforcement**: Firestore em monitoramento, Storage não aplicado | Não verificado |
| Headers HTTP (`_headers`) | Arquivo em formato Netlify/Cloudflare | Hospedagem é GitHub Pages (`CNAME`), que **ignora** `_headers` — SUSPEITO de que nenhum desses headers seja enviado |

Cada achado indica: **[Backend]** quando a regra ou a function aplica o controle, **[Frontend]** quando só o cliente aplica, e **[Deploy?]** quando o risco depende do estado de implantação.

---

## 1. Achados

### SEC-01 — `cms-media` com leitura e listagem públicas e recursivas (P2, CONFIRMADO no código) [Backend][Deploy: provavelmente ativo desde antes de 08/13]
- **Local:** `storage.rules:73-77` (`match /cms-media/{uid}/{allFiles=**} { allow read: if true; }`)
- **Descrição:** `read` em Storage Rules v2 cobre `get` **e** `list`. Qualquer anônimo que conheça o UID de um admin pode listar e baixar todos os objetos em `cms-media/{uid}/`, inclusive imagens de rascunho, de banners ainda não publicados e envios descartados. Os UIDs dos admins aparecem em documentos públicos (SEC-14).
- **Cenário (teórico):** um anônimo lê `createdBy` em uma rota ou banner publicado e chama a API de listagem do bucket com o prefixo `cms-media/<uid>/`. Com isso enumera e baixa imagens que ainda não foram publicadas.
- **Recomendação:** separar `get` (público) de `list` (`allow list: if isAdmin()`). Depois, mover rascunhos para um namespace privado e publicar por cópia, no mesmo padrão já usado em `approved-media/cms-establishments` com `publicPaths`. A governança registra este item como P1 conhecido, reservado ao ADMIN-B2B.

### SEC-02 — Autocriação de `usuarios` aceita campos arbitrários, como `email` forjado e `verificado` (P2, CONFIRMADO) [Backend permissivo]
- **Local:** `firestore.rules:79-82` e `1430-1437`. A regra valida só `role`/`ativo` e não tem `hasOnly`. Consumidor: `admin-firebase.html:2809-2817`, onde o vínculo é criado com `userEmail: selectedUser.email`, lido do próprio documento do usuário.
- **Descrição:** na autocriação, o usuário escolhe livremente `email`, `nome`, `verificado`, `organizacao` e quaisquer outras chaves. O painel mostra e copia o `email` do documento como identidade do usuário.
- **Cenário:** um atacante cria uma conta e grava `usuarios/{uid}` com `email: "dono@restaurante-real.com.br"`. Ao montar um vínculo ou revisar uma solicitação, o admin vê o e-mail “do dono” e vincula a conta do atacante ao empreendimento. Com o vínculo, o atacante passa a enviar `establishment_update_requests` válidas. É engenharia social, mas o backend permite.
- **Recomendação:** na regra de create, `keys().hasOnly([...])` e `request.resource.data.email == request.auth.token.email`. No painel, exibir o e-mail do token/Auth (via function), não o do documento.

### SEC-03 — Sem verificação de e-mail; as Rules confiam em `request.auth.token.email` (P2, CONFIRMADO no código; impacto SUSPEITO) [Backend]
- **Local:** `firestore.rules:159-160` (eventos), `1490` (claims) e `1537` (update requests). Não há `sendEmailVerification` nem `email_verified` em todo o repositório.
- **Descrição:** no provedor e-mail/senha é possível criar uma conta com um endereço que a pessoa não controla. As Rules exigem só que o campo seja igual ao e-mail do token, o que não prova a posse do endereço.
- **Cenário:** alguém se cadastra com o e-mail institucional de um empreendimento, abre um `establishment_claim`, e o moderador aprova confiando no domínio do e-mail.
- **Recomendação:** exigir `request.auth.token.email_verified == true` nos creates do portal, ou ao menos destacar no painel quando o e-mail não está verificado. Ativar no Auth a proteção contra enumeração de e-mail.

### SEC-04 — Contas admin sem MFA; sessão mantida só no cliente (P2, SUSPEITO, depende do console) [Frontend + configuração]
- **Local:** `js/firebase-auth.js:1260-1299` (e-mail/senha). Em `admin-firebase.html:1725-1726`, o timeout de 2 h é controlado em `localStorage`.
- **Descrição:** não há MFA (TOTP/SMS) no código, e a política de senha é o padrão do Firebase (mínimo de 6 caracteres). O timeout de 2 h é só de interface: o refresh token do Firebase continua válido. O controle forte que existe é que as Rules releem `usuarios/{uid}.role/ativo` a cada requisição, então desativar ou rebaixar tem efeito imediato no backend. Isso é positivo.
- **Cenário:** um phishing da senha de um admin dá controle total do CMS, inclusive a promoção de outros admins.
- **Recomendação:** Identity Platform com MFA TOTP obrigatório para admins, política de senha mais forte, e `revokeRefreshTokens` ao desativar (via function).

### SEC-05 — CSP do painel fraca: `unsafe-inline`, `unsafe-eval`, CDNs genéricos e um endpoint de terceiro (P2, CONFIRMADO) [Frontend]
- **Local:** `admin-firebase.html:8`
- **Descrição:** `script-src` inclui `'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.youtube.com https://vlibras.gov.br`. Em `connect-src` aparece `https://turismo-sms-chatbot.jacobpimentel32.workers.dev`, de uma conta pessoal da Cloudflare, do chatbot já retirado. `img-src https:` permite exfiltração por imagem. Na prática, a CSP não mitiga XSS. Como qualquer XSS no painel tem poder de admin (trocar roles, publicar), a defesa em profundidade fica ausente. O painel tem centenas de handlers inline (`onclick`, `onerror`), o que impede remover `unsafe-inline` de imediato.
- **Recomendação:** remover `unsafe-eval` (verificar se algo depende dele), o domínio `workers.dev`, YouTube, VLibras e os CDNs genéricos do painel. A médio prazo, migrar os handlers inline para delegação (já iniciada com `data-admin-action`) e adotar nonce/hash.

### SEC-06 — Painel pode ser embutido em iframe (clickjacking) (P2, SUSPEITO, depende da hospedagem) [Hosting]
- **Local:** `_headers:3` (`X-Frame-Options: DENY`), mas o site está no GitHub Pages (`CNAME`), que não aplica `_headers`. CSP por `<meta>` não suporta `frame-ancestors`, e não há código de frame-busting.
- **Cenário:** uma página maliciosa carrega `/admin-firebase` em iframe transparente e induz o admin logado a clicar em “Ativar/Desativar” ou em trocar a role. Os diálogos de confirmação reduzem, mas não eliminam, o risco; a exclusão exige digitar EXCLUIR.
- **Recomendação:** confirmar os headers reais da resposta. Se não houver `X-Frame-Options`, servir o painel por um host que aplique headers (Firebase Hosting ou Cloudflare) ou adicionar no topo do painel um frame-busting com `if (top !== self)`.

### SEC-07 — Superfícies de escrita abertas sem App Check aplicado e sem limite de taxa (P2, CONFIRMADO nas Rules; App Check conforme a governança) [Backend][Deploy?]
- **Local:** `firestore.rules:1662-1663` (`reservas`: create **anônimo**), `1451-1464` (pendentes de qualquer usuário autenticado), `1485-1519` (claims), `storage.rules:25-67` (até 5 MB por arquivo, **sem limite de quantidade** — o comentário nas linhas 111-113 admite isso).
- **Descrição:** o cadastro no portal é aberto e sem verificação de e-mail, e o App Check não é aplicado. Um script consegue criar milhares de reservas falsas (com PII arbitrária), eventos e estabelecimentos pendentes, claims e uploads, inundando as filas do painel e gerando custo de Storage.
- **Recomendação:** ativar o enforcement do App Check (Firestore e Storage) depois de medir as métricas. Fazer os uploads por function com cota por uid, ou validar no Storage a convenção de nome por índice (`{fileName}` em `[0-5].ext`). Avaliar mover a criação de `reservas` para uma function com rate limit.

### SEC-08 — Conteúdo público e URLs sem validação de esquema no backend (P3, CONFIRMADO) [Frontend-only]
- **Local:** `firestore.rules:1469-1477` (`eventos_aprovados`/`estabelecimentos_aprovados`: `write: if isModerator()` sem schema), `1652-1654` (`noticias`: `write: if isAdmin()` sem schema), `199-209` (banners: `ctaUrl` e `imageUrl` livres), `507-511` (`contact.website` só `is string`), `92-104` (`gallery.url` livre). Não há `matches('^https://')` em nenhum campo de URL.
- **Descrição:** quem garante que só a allowlist pública, sem PII e com URLs seguras, chega às coleções públicas é o projetor do cliente (`publication-contracts.js`, coberto por `security-hardening-02a.test.mjs`). Os renderizadores públicos e o painel escapam corretamente (`SMSecurity.url` só aceita http/https e paths internos). Hoje não há XSS explorável, mas uma sessão admin ou moderador comprometida, ou um cliente alterado, pode gravar PII ou `javascript:` diretamente.
- **Recomendação:** adicionar `hasOnly` e `matches('^https://')` (ou paths internos) às Rules de `eventos_aprovados`, `banners.ctaUrl/imageUrl`, `noticias` e `contact.website`.

### SEC-09 — Submissões pendentes sem allowlist de campos; imagens com URL externa arbitrária (P3, CONFIRMADO) [Backend permissivo]
- **Local:** `firestore.rules:1461-1464` (`estabelecimentos_pendentes`: sem `hasOnly`), `153-170` (`eventos_pendentes`: sem `hasOnly` nem limites de tamanho), `1582-1583` (`images` em update requests: lista livre).
- **Descrição:** o usuário pode anexar campos e URLs externas. O painel escapa tudo (`SEC.url`/`SEC.html`, ver `admin-firebase.html:3440-3490` e `3958-3985`), mas carrega `<img src>` de domínio do atacante. Isso revela o IP e o horário do admin, e serve de pixel de rastreamento. A aprovação recusa mídia externa (testado), então não há escalada.
- **Recomendação:** `hasOnly`, limites de tamanho e restrição de `images[].url` ao padrão `firebasestorage` / path `submissions/{uid}/...`. No painel, não carregar imagens fora do bucket.

### SEC-10 — Gestão de admins sem salvaguardas (P3, CONFIRMADO) [Backend]
- **Local:** `firestore.rules:1438-1448` e `admin-firebase.html:3267-3290`
- **Descrição:** qualquer admin ativo pode promover, rebaixar, desativar ou excluir qualquer outro admin. Não há proteção do último admin nem segundo aprovador. O painel só desabilita a troca da própria role (no cliente). Excluir `usuarios/{uid}` não bane: o usuário recria o perfil como `user` ativo (`1430-1436`) e a conta do Auth continua existindo.
- **Recomendação:** usar desativação em vez de exclusão, mover mudanças de role para uma function com regras (não remover o último admin, registrar o motivo), e desabilitar a conta do Auth quando o banimento for intencional.

### SEC-11 — Trilha de auditoria incompleta (P3, CONFIRMADO) [Backend]
- **Local:** `functions/audit-core.js:5-10` e `138-144`
- **Descrição:** é positivo que `audit_logs` seja imutável para clientes (`firestore.rules:1695-1698`), gravado pelo Admin SDK e idempotente por `eventId`. As lacunas: `HUMAN_FIRESTORE_AUTH_TYPES` é um conjunto **vazio**, então `actorRoleSnapshot` nunca é preenchido; `reservas`, `cms_establishment_submission_locks` e todo o Storage não são auditados; só há metadados (sem diff de conteúdo), o que impede reconstruir uma alteração maliciosa de notícia ou banner; e não há alerta de mudança de role.
- **Recomendação:** preencher os tipos de autenticação humanos corretos, incluir `reservas`, guardar um hash ou diff resumido do conteúdo e alertar (e-mail) em `change_user_role`/`change_user_status`.

### SEC-12 — `prefeituraFeed`: redirect seguido antes da checagem de origem (P3, SUSPEITO, baixo) [Backend]
- **Local:** `functions/prefeitura-feed.js:39-48`
- **Descrição:** é positivo que a function seja callable só para admin ativo (`index.js:63-67`), com allowlist estrita de paths via regex, origem fixa, timeout, concorrência 4 e `maxInstances: 2`. Porém `redirect: "follow"` faz a requisição ao destino redirecionado **antes** de validar `finalUrl.origin`. Um open redirect no portal da Prefeitura viraria SSRF cego (o corpo não é devolvido). Além disso, `text()` lê o corpo inteiro antes de checar `MAX_BYTES`, e não há `enforceAppCheck`.
- **Recomendação:** `redirect: "manual"` com validação de cada `Location` contra `ORIGIN`, leitura em stream com corte em `MAX_BYTES`, e `enforceAppCheck: true`.

### SEC-13 — SDK Firebase do painel desatualizado e sem SRI (P3, CONFIRMADO) [Frontend]
- **Local:** `admin-firebase.html:1683-1688` e `js/firebase-app-check.js:1` (gstatic `10.7.1` compat, dez/2023), sem `integrity`. Os testes usam `firebase@12.16.0`.
- **Recomendação:** atualizar para um SDK recente (modular) e servir localmente ou com SRI.

### SEC-14 — UIDs de admins expostos em documentos públicos (P3, CONFIRMADO) [Backend]
- **Local:** schemas de `rotas` (`createdBy/updatedBy/publishedBy/archivedBy`, `firestore.rules:1182-1195`), `banners`, `cms_establishments` e `gallery_items`, todos legíveis quando publicados.
- **Descrição:** facilita a enumeração de `cms-media/{uid}` (SEC-01) e o direcionamento de ataques.
- **Recomendação:** manter a autoria em subcoleção ou documento privado, ou projetar DTOs públicos sem esses campos.

### SEC-15 — Papel `moderator` com poderes de backend sem interface (P3, CONFIRMADO; latente) [Backend]
- **Local:** `firestore.rules:1452-1456`, `1469-1477`, `1520` e `1528` (CRUD de `establishment_managers` e claims), `storage.rules:19-23`
- **Descrição:** o moderador pode criar vínculos para qualquer usuário, publicar eventos e estabelecimentos aprovados sem schema e alterar ou excluir claims. Pelo inventário B2A5, hoje há 0 moderadores. Mas qualquer admin pode atribuir o papel, e o frontend do painel só aceita admin, então esse poder fica invisível.
- **Recomendação:** conforme a decisão B2A5 (moderator não é função institucional ativa), remover os grants de moderador das Rules e do Storage, ou remover a opção “Moderador” do seletor (`admin-firebase.html:2341`).

### Observação funcional (não é segurança)
- `js/public-banners.js:224/241` e `370/399`: `SMSecurity.url()` já devolve o valor com escape de atributo, e `escAttr()` escapa de novo. Uma URL de CTA com `&` vira `&amp;amp;` e quebra a query string.

---

## 2. Controles corretamente implementados (achados positivos)
1. **Autorização estrita no backend:** `hasRole()` exige `role in [...] && ativo == true` (`firestore.rules:13-23`), e o Storage faz o mesmo (`storage.rules:13-23`). O papel vem do documento Firestore e é relido a cada requisição, então a desativação vale na hora.
2. **Sem autoelevação:** a autocriação exige `role == 'user' && ativo == true`, e a auto-atualização só pode tocar `nome/telefone/tipo/organizacao` (`1430-1447`).
3. **Fallback deny-all** em Firestore (`1700-1702`) e Storage (`105-107`).
4. **Leitura pública mínima:** `noticias` só com `publicado == true`, `media_library` e `reservas` só para admin, `cms_establishments`/`rotas`/`banners`/`gallery_items` só quando publicados, `site_config` com `get` em dois IDs e `list` negado.
5. **Schemas fortes:** `rotas` (slug por regex, cor, transições, autoria por `request.auth.uid` e `request.time`), `cms_establishments` (grupos, revisão, editSession, `isAdmin` em todos os caminhos), `reservas` (catálogo, preço, data, e-mail), banners, galeria e `site_config`.
6. **Exclusões restritas:** banners, galeria, rotas, `site_config`, locks e `approved-media` são create-only ou sem delete. `cms_establishments` só exclui em draft/archived sem editSession.
7. **Storage:** uploads limitados a `image/(jpeg|jpg|png|webp)` (SVG excluído), ≤ 5 MB, create-only (sem overwrite/delete), path ligado a `request.auth.uid`, e `approved-media/cms-establishments` público só se estiver publicado **e** listado em `publicPaths`.
8. **Escape consistente no painel:** `SMSecurity.html/attr/url` (`js/security-utils.js`) e `esc`/`escapeHtml` locais, usados em todos os templates inspecionados (filas, usuários, claims, update requests, mídia, notícias, banners, rotas, galeria, logs e importador da Prefeitura). `SMSecurity.url` bloqueia `javascript:`, `data:` e aspas. As ações usam `data-admin-action` delegado em vez de JS inline com IDs (testado em `security-hardening-02a`).
9. **Operações destrutivas com confirmação:** diálogos com `requireText: "EXCLUIR"` para eventos e notícias, e confirmação para roles, status e mídia.
10. **Logs de auditoria imutáveis para clientes**, gravados pelo backend e idempotentes.
11. **Importador da Prefeitura:** allowlist de paths por regex, origem fixa, só admin ativo, timeout e limite de instâncias.
12. **Modo emulador** só em `localhost/127.0.0.1` com `?emulator=1` (`js/firebase-auth.js:1144`).
13. **Segredos:** nenhuma chave privada, service account, `.env` ou token encontrado no repositório. A `apiKey` do Firebase em `config.js` é pública por design. O `.gitignore` cobre `.env*`, `serviceAccount*.json`, `credentials*.json`, `*.pem` e `*.key`.
14. **Painel:** `noindex,nofollow`, `Referrer-Policy`, e o service worker não faz cache de `/admin-firebase*`.
15. **Dependências das functions fixadas em versão exata** (`firebase-admin 14.3.0`, `firebase-functions 7.3.2`, Node 22). Não foram auditadas contra CVEs por falta de rede e de `node_modules`.

## 3. Testes existentes e lacunas
- **Cobertos:** `tests/firestore.rules.test.mjs` (203 casos: `noticias`, `media_library`, `ativo`, moderator, `usuarios`, aprovação V2, cms_establishments C1 V2); `firestore.rotas.rules.test.mjs`; `firestore.reservations.rules.test.mjs`; `admin-finalization.rules.test.mjs` (galeria, `site_config`, `audit_logs`); `storage.rules.test.mjs` (cms-media, submissions, approved-media); `security-hardening-02a.test.mjs` (contrato de URL, projeção sem PII, proveniência de mídia, IDs hostis, ações delegadas); `functions.audit.test.cjs`; `prefeitura-news.test.mjs` (incluindo “sem redirecionamento externo”).
- **Lacunas:**
  - Nenhum teste de Rules para `banners`, `establishment_claims` e `establishment_managers`.
  - `eventos_aprovados`/`estabelecimentos_aprovados` com cobertura mínima de escrita (sem teste de schema, porque não há schema).
  - Nenhum teste de injeção de campos extras em `usuarios` (`email`/`verificado`) nem em `*_pendentes`.
  - Nenhum teste de `list` anônimo em `cms-media`.
  - Nenhum teste que impeça o último admin de se rebaixar.
  - O teste do `prefeituraFeed` valida a origem final, mas não que a requisição ao destino redirecionado nem seja feita.
  - Os testes de Rules rodam contra o arquivo local; nenhum teste compara com o ruleset implantado (ver seção 0).

## 4. Priorização sugerida
1. **Confirmar o estado de implantação** das Rules e functions (seção 0) — sem isso, a gravidade real não pode ser fechada.
2. SEC-01 (`list` em cms-media), SEC-02/SEC-03 (identidade de e-mail), SEC-04 (MFA de admins).
3. SEC-05/SEC-06 (CSP e clickjacking), SEC-07 (App Check e limites de taxa).
4. SEC-08 a SEC-15 como endurecimento incremental, com testes de Rules correspondentes.
