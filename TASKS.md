# TASKS.md — SITE-TURISMO-SMS

Este arquivo controla o estado atual, pendências e próximos passos do projeto para uso com Claude/Claude Code/Codex.

Atualize este arquivo apenas quando houver mudança real de estado, decisão aprovada ou conclusão de etapa.

---

## Estado atual resumido

**Projeto:** SITE-TURISMO-SMS  
**Área atual de trabalho:** Painel Admin, CMS e Firebase — Authentication, Firestore, Storage, moderação, segurança e integridade dos fluxos administrativos.

**Ferramenta adotada:** Codex. O Claude Fable não será usado nesta frente.

**Status geral:** `ADMIN-B1-PREP` e `ADMIN-B1B-PREP` concluídos exclusivamente em leitura. Login Admin, dashboard, logout e leituras administrativas foram confirmados; Rules locais e implantadas e CORS local/remoto são equivalentes. Os riscos P0/P1 de leitura pública permanecem confirmados e exigem correção local/testes antes de qualquer publicação.

**Frentes pausadas:** site público, V7C1, V7C2, V6, B3 público, otimização de mídia pública, integração CMS → site público e tarefas preparadas para Claude Fable.

**Regra principal:** tratar site público, Painel Admin/CMS e Portal do Usuário como sistemas separados. Não misturar refatoração ou execução entre eles sem bloco e autorização específicos.

---

## Próximo passo recomendado

**`ADMIN-B2A-PREP` — contrato e testes planejados para Firestore Rules.**

- Tipo: PREP, somente leitura/análise, sem edição e sem publicação.
- Objetivo: preparar o contrato e a matriz de testes para `noticias`, `media_library`, `ativo` e `moderator`.
- Prioridade: (1) P0 — proteger notícias draft; (2) P1 — proteger `media_library`; (3) definir `ativo == true` ou `ativo != false`; (4) definir o papel `moderator`; (5) criar testes das identidades e operações.
- Regra humana: nenhuma decisão de role deve ser implementada sem aprovação humana.
- Estado: registrado como próximo bloco único e **não iniciado** nesta governança.

## ADMIN-RESTART-PREP — checkpoint e retomada oficial

### Limites e resultado do PREP

- Concluído somente em leitura, diagnóstico, testes estáticos e smoke sem autenticação.
- Nenhum arquivo foi alterado, criado ou excluído.
- Nenhuma escrita foi feita em Firestore, Firebase Storage, Firebase Authentication, rules, CORS, dados ou produção.
- Nenhum commit, push, deploy, seed, migração ou inventário remoto foi executado.
- Working tree encontrado: branch `main`; referência local `main` alinhada com `origin/main`; nenhuma alteração rastreada; `.claude/settings.local.json` não rastreado e intocado.
- A consulta remota independente do `origin` não foi confirmada por falta de credencial no ambiente.

### Sistemas e prioridade

1. Site público — pausado.
2. Painel Admin/CMS — frente ativa.
3. Portal do Usuário — separado do painel e do site público.

Não misturar refatoração ou execução entre os três sistemas sem bloco e autorização específicos. A modularização administrativa deve continuar progressivamente no futuro, sem reversão e sem reescrita ampla, mas não é a prioridade imediata.

### Estado real do painel

O painel possui runtime administrativo real e não é apenas um protótipo. Estão funcionais ou amplamente implementados:

- autenticação administrativa;
- dashboard;
- aprovações;
- vínculos;
- usuários;
- eventos;
- notícias;
- Biblioteca de Mídia;
- banners;
- empreendimentos;
- contratos de mídia;
- gestão editorial da galeria de empreendimentos;
- scripts de seed/diff;
- inventário seguro de mídias;
- fundação modular em modo passthrough.

Fundação modular real: Dashboard, Banners, Empreendimentos, Context, UI, Registry, Router e Shell.

### Estado dos blocos CMS

- CMS-1: diagnóstico concluído.
- CMS-2A: contrato documentado.
- CMS-2B: CRUD implementado; validação autenticada atual pendente.
- CMS-2B-FIX: lifecycle implementado; produção atual não comprovada.
- CMS-2C: seed/diff e dry-run implementados.
- CMS-2F: seed manual anteriormente registrado; não revalidado.
- CMS-3: aplicação textual implementada; teste autenticado atual pendente.
- CMS-4A: contrato de mídia documentado.
- CMS-4B: revisão por imagem implementada.
- CMS-4C: runtime implementado, mas teste real permaneceu bloqueado por Storage/CORS.
- CMS-4D: gestão editorial da galeria de empreendimentos implementada.
- CMS-4E: inventário seguro implementado.
- CMS-4E-EXEC: não concluído.
- CMS-5A: diagnóstico concluído.
- CMS-5B: adapter/debug isolado implementado.
- CMS-5C: código e rule local concluídos; a governança registra publicação específica.
- CMS-5D: não iniciado e fora da frente atual.

## ADMIN-B1-PREP — concluído

### Confirmações e limites

- Execução exclusivamente em leitura.
- Login Admin manual e real confirmado; dashboard administrativo carregado; logout normal concluído.
- Leituras administrativas confirmadas para `usuarios`, `eventos_pendentes`, `eventos_aprovados` e `estabelecimentos_pendentes`.
- Nenhuma escrita, alteração de Auth, publicação de Rule, upload ou aplicação de CORS.
- O primeiro bloco deixou inconclusivos: Rules remotas completas, notícias draft anônimas, `media_library` anônima, `cms-media` anônimo, CORS, usuário `moderator` e usuário inativo.
- Análise estática confirmou a divergência: o frontend do painel aceita somente `admin`, enquanto as Rules locais concedem permissões específicas a `moderator`.

## ADMIN-B1B-PREP — concluído

### Escopo remoto e projeto

- Somente métodos GET/LIST; nenhuma fonte remota persistida em arquivo e nenhuma configuração alterada.
- Projeto `turismo-sms`; database `(default)`; Firestore em `southamerica-east1`; bucket `turismo-sms.firebasestorage.app` em `US-EAST1`.

### Firestore Rules — origem da verdade confirmada

- Release: `projects/turismo-sms/releases/cloud.firestore`.
- Ruleset: `projects/turismo-sms/rulesets/65e9a0eb-bb4a-4578-9e01-42a3c8137cf2`.
- `firestore.rules` local e Rules implantadas: **iguais**, com zero linhas divergentes.
- SHA-256 normalizado: `24f14a398a289a429b0aaa146451c80e115f37315d1a09dcf4e3a810712438cc`.
- O arquivo local é a origem da verdade correspondente à versão atualmente implantada.

### Storage Rules — origem da verdade confirmada

- Release: `projects/turismo-sms/releases/firebase.storage/turismo-sms.firebasestorage.app`.
- Ruleset: `projects/turismo-sms/rulesets/23c647df-d6bd-4013-a3aa-a4efba2107bc`.
- `storage.rules` local e Rules implantadas: **iguais**, com zero linhas divergentes.
- SHA-256 normalizado: `867deaf99e9724e00d3da89225e3d94fc2b197a7e8b14198696740e1554649fd`.
- O arquivo local é a origem da verdade correspondente à versão atualmente implantada.

### CORS — equivalência confirmada

- Bucket: `turismo-sms.firebasestorage.app`.
- Origem: `https://turismo.saomateusdosul.pr.gov.br`.
- Métodos: GET e HEAD.
- Response headers: `Content-Type` e `Access-Control-Allow-Origin`.
- `maxAgeSeconds`: 3600.
- CORS remoto e `storage-cors.json` local: **iguais**.
- Decisão: não reaplicar CORS. O CMS-4C ainda exige reteste funcional, mas CORS ausente/divergente deixa de ser hipótese principal.

### App Check — estado observado

- App Web: Cadastros Turismo; provider: reCAPTCHA.
- Firestore: Monitorando; 81% verificadas e 19% não verificadas; enforcement não aplicado.
- Storage: Não aplicado; sem enforcement.
- Authentication: Monitorando; 100% verificadas e 0% não verificadas; enforcement não aplicado.
- Decisão: não ativar enforcement nesta etapa; investigar `appCheck/fetch-network-error` separadamente e acompanhar métricas.

### Riscos prioritários confirmados

**P0**

1. `noticias` possui leitura pública ampla nas Firestore Rules implantadas; filtragem de status no frontend não protege documentos draft.

**P1**

2. `media_library` possui leitura pública ampla nas Firestore Rules implantadas.
3. `cms-media` possui leitura pública ampla e recursiva nas Storage Rules implantadas.

### Contratos pendentes de decisão humana

- `isAdmin` e `isModerator` usam `ativo != false`; não exigem explicitamente `ativo == true`.
- Firestore e Storage concedem permissões limitadas a `moderator`; o frontend do painel aceita somente `admin`.
- O comportamento real de uma conta `moderator` não foi testado.
- Nenhuma decisão de role deve ser implementada sem aprovação humana.

### Itens ainda inconclusivos

- causa exata de `appCheck/fetch-network-error`;
- conta `moderator` real;
- usuário inativo real;
- execução real de `submissions`;
- teste ponta a ponta do CMS-4C;
- domínio do registro App Check não exibido na tela consultada.

### Itens que não bloqueiam a primeira versão utilizável

- integração de `cms_establishments` com o site público;
- CMS-5D;
- galeria pública;
- substituição dos dados estáticos públicos;
- Rotas no Admin;
- Sazonal;
- Mascote;
- Configurações;
- relatórios avançados;
- master admin;
- notificações automáticas.

### Roadmap administrativo

- **ADMIN-A — checkpoint e retomada:** concluído pelo `ADMIN-RESTART-PREP`.
- **ADMIN-B1-PREP:** concluído exclusivamente em leitura.
- **ADMIN-B1B-PREP:** concluído exclusivamente por GET/LIST; equivalência de Rules e CORS e estado do App Check registrados.
- **ADMIN-B2A-PREP:** contrato e testes para Firestore Rules (`noticias`, `media_library`, `ativo`, `moderator`), sem edição.
- **ADMIN-B2A-EXEC:** alteração local de `firestore.rules` e testes no Emulator Suite, sem publicação.
- **ADMIN-B2B-PREP:** contrato e testes para Storage Rules (`cms-media`, `submissions`), sem edição.
- **ADMIN-B2B-EXEC:** alteração local de `storage.rules` e testes no Emulator Suite, sem publicação.
- **ADMIN-B3:** revisão final, autorização explícita, publicação controlada das Rules e reteste remoto.
- **ADMIN-C:** integridade dos uploads, rollback e operações atômicas/idempotentes.
- **ADMIN-D:** fechamento de Empreendimentos.
- **ADMIN-E:** fechamento de Eventos.
- **ADMIN-F:** fechamento de Notícias.
- **ADMIN-G:** Biblioteca de Mídia, CMS-4C, galeria editorial, CORS e inventário de órfãos depois da estabilização.
- **ADMIN-H:** fechamento de Banners.
- **ADMIN-I:** modularização incremental do restante do painel.
- **ADMIN-J:** QA autenticada, rules tests, smoke, governança, fechamento e tag final.

### Critério de Painel Admin utilizável

- [x] autenticação Admin testada;
- [ ] contrato `admin`/`moderator` definido;
- [ ] usuário inativo bloqueado;
- [x] rules locais e remotas alinhadas;
- [ ] rascunhos protegidos;
- [ ] dados internos protegidos;
- [x] CORS local/remoto alinhado;
- [ ] CMS-4C retestado ponta a ponta;
- [ ] moderação testada;
- [ ] operações críticas atômicas ou idempotentes;
- [ ] rollback de uploads;
- [ ] CRUD de eventos, estabelecimentos, notícias e banners testado;
- [ ] Biblioteca de Mídia sem quebra de referências;
- [ ] estados de loading, erro e vazio;
- [ ] autoria e timestamps;
- [ ] smoke autenticado;
- [ ] teste anônimo;
- [ ] governança atualizada.

### Tag de checkpoint recomendada

`pre-admin-restart-20260720`

Checkpoint existente e preservado. Nenhuma tag Git foi criada, alterada ou removida nesta tarefa.

### Checkpoint arquitetural pós-V5 — decisão aprovada

**Correção de sequência em 2026-07-16:** R4B — utilitários visuais —, R4A — acessibilidade eMAG —, R5A — remoção do fallback inline obsoleto — e R5B — externalização do runtime i18n — estão concluídos. R5B encerra oficialmente a Fase 1; V4D foi absorvido pelo R5A. Nenhuma etapa da Fase 2 foi iniciada.

O checkpoint foi somente leitura e confirmou um projeto público funcional, sem evidência para reescrita completa ou projeto novo. Após a Fase 1, a dívida técnica está concentrada principalmente em `index.html` (aproximadamente 1.712 linhas, 99 KB e cerca de 220 de JavaScript inline) e `css/index.css` (aproximadamente 7.080 linhas e 743 ocorrências de `!important`). A estratégia aprovada é híbrida: refatoração modular progressiva como espinha dorsal, microblocos para ajustes editoriais/órfãos e B3 como frente própria de performance. A tag anterior `pos-v5-checkpoint` permanece histórica; o novo checkpoint pós-Fase 1 usa a tag `pos-fase1-modular`, publicada local e remotamente, apontando para o commit de governança `3c9caee`.

**Plano aprovado:**

1. **Fase 0 — checkpoint:** concluído com a tag `pos-v5-checkpoint`.
2. **Fase 1 — fundação modular da home:** concluída com R1 eventos, R2 carrossel de experiências, R3 formulário, R4B utilitários visuais, R4A acessibilidade eMAG, R5A remoção do fallback inline obsoleto e R5B externalização do runtime i18n. A home não foi reescrita do zero e a estratégia de refatoração modular progressiva foi preservada.
3. **Fase 2 — navegação e estrutura:** o `V7-PREP`, o `V7A` e o `V7B` foram concluídos; a estratégia V7A→V7B→V7C1→V7C2 segue aprovada, usando `js/nav-shared.js` como base única. O próximo bloco é somente o `V7C1`, ainda não iniciado. V7C2 permanece posterior; V6 permanece pendente e deve ser reavaliado depois.
4. **Fase 3 — dados editoriais:** fonte única de notícias; contrato entre `eventos-2026.json` e `TURISMO_EVENTOS`; preparação da virada anual de eventos.
5. **Fase 4 — performance/B3:** vídeos, imagens pesadas, CSS órfão e revisão gradual de `css/index.css`.
6. **Fase 5 — CMS:** somente quando oficialmente despausado.

**Separação aprovada:** R1 extraiu somente a lógica da grade "Acontece em breve" para `js/home-eventos.js`; R2 extraiu somente o carrossel de experiências para `js/home-experiencias.js`; R3 extraiu somente a lógica do formulário de contato para `js/home-contato.js`; R4B extraiu somente a barra de progresso e o botão “Voltar ao topo” para `js/home-utilitarios.js`; R4A extraiu somente acessibilidade eMAG para `js/home-acessibilidade.js`; R5A removeu somente o fallback inline obsoleto de traduções de `index.html`; R5B externalizou somente o runtime do seletor de idiomas para `js/home-i18n.js`. As extrações foram comportamentalmente 1:1, sem mudança funcional ou visual; R5A preservou `var translations = window.translations || {};`, e R5B preservou `translations.js`, a cobertura PT/EN/ES/PL, `sms-lang`, `window.applyTranslations` e `translationsApplied`. A tag do R5B foi registrada sem `defer`, `async` ou `type="module"`, depois do hamburger e antes dos módulos com `defer`; R1, R2, R3, R4A, R4B e R5A permaneceram intactos.

### Checkpoint pós-Fase 1 — decisão registrada

- A Fase 1 foi encerrada e o checkpoint técnico/arquitetural foi concluído somente em leitura. A validação confirmou home em desktop e mobile, PT/EN/ES/PL, acessibilidade, eventos, carrossel, formulário sem POST, clima, busca, tema, mascote, progresso, voltar ao topo e smoke test das páginas públicas.
- Não foram encontrados `ReferenceError`, `TypeError`, `SyntaxError` ou 404 novos. Os erros de App Check/ReCAPTCHA em localhost permanecem ambientais e conhecidos.
- O `V7-PREP`, o `V7A` e o `V7B` foram concluídos em sequência; o próximo bloco aprovado passou a ser o `V7C1`. V7C2, V6 e B3 permanecem pendentes.
- Os módulos da Fase 1 são `js/home-eventos.js`, `js/home-experiencias.js`, `js/home-contato.js`, `js/home-utilitarios.js`, `js/home-acessibilidade.js` e `js/home-i18n.js`. Nenhuma extração precisa ser revertida; o gargalo estrutural principal passou a ser a duplicação da navegação, com CSS e mídia como gargalos relevantes.
- Cache: os `js/home-*.js` são atendidos pelo runtime cache e `translations.js` participa do cache/precache. Alterações futuras nesses arquivos devem avaliar obrigatoriamente novo token `?v=` ou nova versão de `CACHE_NAME`; o cache não será alterado nesta tarefa.
- Decisão confirmada: o local correto do AgroSamas é `Rua do Mathe`. `TURISMO_EVENTOS/js/data/eventos.js` ainda registra `Parque de Exposições`; isso é uma inconsistência de dados conhecida, a corrigir futuramente em bloco exclusivo de dados, fora do `V7-PREP`. Nenhum arquivo de dados ou fonte turística foi alterado nesta governança.

### V7-PREP — concluído e estratégia do V7 aprovada

O `V7-PREP` foi concluído em 2026-07-16, exclusivamente em leitura, diagnóstico, comparação, experimento em memória e planejamento; nenhum arquivo foi alterado durante o bloco. O experimento temporário em browser confirmou que carregar a navegação atual da home junto com `js/nav-shared.js` produz dois headers, dois `navToggle`, dois `navLinks`, dois seletores de idioma, dois modais de busca, duas barras de acessibilidade, duas barras de progresso, IDs duplicados e +132px indevidos no padding superior da home. A coexistência é inviável: não haverá migração gradual ingênua e o cutover do chrome da home será atômico, precedido por bloco de compatibilidade isolado.

**Microblocos aprovados, com risco e sequência obrigatória (cada um com metadata, commit próprio, governança própria e deploy testado em produção antes do seguinte):**

1. **V7A — compatibilidade do nav-shared (risco baixo-médio, concluído):** adicionada ao `NAV_CSS` a exceção `@media (min-width: 769px) { body.home-page { padding-top: 0; } }`; o token passou para `?v=site-public-v7a-20260716` nas 13 páginas públicas ativas; `index.html` permaneceu completamente intacto; páginas internas foram validadas e o deploy foi confirmado.
2. **V7B — cutover atômico da home (risco alto, concluído):** o `index.html` passou a carregar `js/nav-shared.js?v=site-public-v7a-20260716` como primeira tag do `body.home-page`, em script clássico, síncrono e sem `defer`, `async` ou `type="module"`. O chrome estático, hamburger inline, modal/overlay de busca, progresso, botão de topo, VLibras estático, tag duplicada de `scroll-animations.js` e tags de `js/home-i18n.js`/`js/home-utilitarios.js` foram removidos; os dois últimos arquivos permanecem no disco para rollback até o V7C1. O breakpoint foi alinhado a 968px e `js/home-acessibilidade.js` foi preservado.
3. **V7C1 — limpeza de runtime (risco baixo, não iniciado):** excluir fisicamente `js/home-i18n.js` e `js/home-utilitarios.js`; reduzir `js/home-acessibilidade.js` a `prefers-reduced-motion`/pausa do vídeo e atalhos Alt+1..4; revisar o registro duplicado do Service Worker.
4. **V7C2 — limpeza de CSS (risco médio, não iniciado, bloco separado):** remover somente CSS comprovadamente órfão após o cutover (regras antigas da navegação, `.language-dropdown.active`, drawers antigos) e avaliar `.map-modal-*` e `.agrosamas-banner`; separado devido à complexidade de `css/index.css` e seus ~743 `!important`.

**Cinco decisões humanas aprovadas:**

1. **Início:** destino `/`; clicar em Início estando na home recarrega a página em vez de rolar até `#map-hero` (paridade e manutenção única).
2. **Idioma do primeiro acesso:** prevalece a detecção do navegador feita por `translations.js`; PT não é mais forçado sem `sms-lang`; PT/EN/ES/PL disponíveis; seleção manual persiste em `sms-lang`.
3. **Área restrita:** comportamento dinâmico do nav-shared adotado na home (`smsUserSession` via `localStorage`, nome + Sair para autenticado); não reativa Admin/CMS/Firebase.
4. **Breakpoint:** home alinhada aos 968px do shared, eliminando a divergência 968–1180px; tablets em paisagem usam navegação desktop.
5. **Acessibilidade:** `js/home-acessibilidade.js` mantido no V7B (o shared cobre fonte/contraste, mas não reduced-motion/pausa de vídeo nem atalhos JS Alt+1..4); redução só no V7C1; nenhuma regressão de acessibilidade é aceita.

**Módulos e destinos:** sobrevivem `js/home-eventos.js`, `js/home-experiencias.js`, `js/home-contato.js` e `js/home-acessibilidade.js`; `js/home-i18n.js` e `js/home-utilitarios.js` perderam as tags no V7B, mas os arquivos permanecem no disco até o V7C1; o hamburger inline saiu no V7B. `translations.js` permanece intacto, com `window.applyTranslations` e `translationsApplied` como contratos obrigatórios. O VLibras foi consolidado no próprio V7B em uma única instância funcional; não é pendência do V7C1. Busca: `search.js` e `search-index.js` permanecem intactos; o modal injetado pelo shared é a única instância.

**Regra de cache do V7:** `js/nav-shared.js` está em `NEVER_CACHE` no Service Worker; HTML e navegações não são cacheados pelo SW; `sw.js` e `CACHE_NAME` permaneceram intactos; os módulos aposentáveis permanecem no disco para rollback. O registro inline e o registro do shared para o mesmo Service Worker continuam temporariamente idempotentes e sem erro observado, com consolidação reservada ao V7C1.

**Follow-ups registrados:** o nav-shared não fecha o drawer automaticamente ao redimensionar para desktop; o skip link de busca não existe no shared; Alt+2 ainda tenta focar `#navLinks`, um `ul` sem `tabindex`, mantendo limitação preexistente. O VLibras está único e funcional; a divergência foi resolvida no V7B. O problema de duas opções `.lang-option.active` após reload também foi eliminado pelo cutover.

### V7A — concluído e validado

O V7A foi concluído em 2026-07-17 como microbloco de compatibilidade do `nav-shared`, com validação funcional prévia, commit próprio, push e publicação no GitHub Pages. O commit funcional confirmado pelo Git é `4cd0616cb9d393571946f90c97a753eae16e69c3 feat(nav): prepara nav-shared para adocao pela home (V7A)`, presente em `origin/main`. `git show` confirmou 15 arquivos modificados, 20 inserções e 14 remoções, sem alteração inesperada:

- `js/nav-shared.js`;
- `js/site-meta.js`;
- as 13 páginas públicas ativas: `eventos.html`, `galeria.html`, `local.html`, `mapa-turistico.html`, `noticia.html`, `noticias.html`, `o-que-fazer.html`, `onde-ficar.html`, `para-o-trade.html`, `reservas.html`, `rotas-completas.html`, `sabores.html` e `transparencia.html`.

O `NAV_CSS` recebeu somente o contrato de compatibilidade `@media (min-width: 769px) { body.home-page { padding-top: 0; } }`. As 13 tags clássicas, síncronas e sem `defer`, `async` ou `type="module"` passaram para `?v=site-public-v7a-20260716`; páginas legadas, `portal-usuario` e demais assets não participaram da renovação. A metadata foi atualizada antes do commit funcional com `updatedAt: "2026-07-17T08:56:35-03:00"`.

`index.html` permaneceu byte a byte intacto: a home ainda não carrega `js/nav-shared.js`, mantém sua navegação própria, continua com `body.home-page` em `padding-top: 0` no desktop e preserva os módulos R1–R5. O V7A não iniciou o cutover. As páginas internas permaneceram visual e funcionalmente equivalentes; os smokes desktop/mobile, idiomas, busca, autenticação não logada, VLibras, eMAG, progresso, voltar ao topo e Leaflet foram registrados como aprovados. `js/nav-shared.js` permanece em `NEVER_CACHE`; HTML/navegações continuam fora do cache do Service Worker; `sw.js` e `CACHE_NAME` permaneceram intactos.

O GitHub Pages foi publicado e validado: a página pública respondeu HTTP 200 e `noticias.html` respondeu HTTP 200 servindo a tag `js/nav-shared.js?v=site-public-v7a-20260716`. Nenhum teste de runtime foi repetido nesta atualização documental. O próximo microbloco era o **V7B**, posteriormente concluído; V7C1 e V7C2 permanecem não iniciados. Os módulos sobreviventes `js/home-eventos.js`, `js/home-experiencias.js` e `js/home-contato.js` permanecem preservados; `js/home-i18n.js`, `js/home-utilitarios.js` e `js/home-acessibilidade.js` seguem fisicamente disponíveis conforme o plano registrado. V6, B3, V5C3, V5D, CSS órfão, mídia pesada, Formspree e demais pendências permanecem documentados. A pausa administrativa aqui descrita é histórica; a frente Admin/CMS/Firebase foi retomada em 2026-07-20.

---

## V7B — concluído e validado

O V7B foi concluído em 2026-07-17 como cutover atômico da navegação da home para `js/nav-shared.js`. A execução foi corrigida, validada, commitada, enviada por push e publicada com sucesso; esta atualização é somente documental e não repete testes de runtime, commit, push ou deploy.

### Evidência confirmada pelo Git

- Commit funcional: `e80794418524e521ebbaaab85f76d101ffae5717`.
- Mensagem exata: `feat(home): adota nav-shared como navegacao unica da home (V7B)`.
- O commit está presente em `HEAD`, `origin/main` e `origin/HEAD`.
- `git show --stat --oneline --decorate --no-renames e807944` confirmou 3 arquivos alterados, 4 inserções e 409 remoções.
- `git show --format= --name-status --no-renames e807944` confirmou somente: `index.html`, `css/index.css` e `js/site-meta.js`.
- `js/site-meta.js` no commit registra `updatedAt: "2026-07-17T10:14:49-03:00"`.

### Resultado do cutover

- A primeira tag dentro de `body.home-page` é `<script src="js/nav-shared.js?v=site-public-v7a-20260716"></script>`, preservando script clássico, síncrono, sem `defer`, `async` ou `type="module"`.
- O `nav-shared` tornou-se a navegação única da home e das páginas internas: header, dropdowns, drawer mobile, overlay, idioma, área restrita, barra eMAG, progresso, botão de topo e busca.
- O chrome estático duplicado foi removido de `index.html`: trilho/barra de progresso, skip links antigos, eMAG, navegação, logo/links duplicados, dropdowns, hamburger/menu mobile, atalhos mobile, overlay, idiomas, área restrita, modal de busca, botão de topo, VLibras estático, bloco inline do hamburger e tags duplicadas de scroll/i18n/utilitários.
- `js/home-eventos.js`, `js/home-experiencias.js`, `js/home-contato.js` e `js/home-acessibilidade.js` continuam ativos. `js/home-i18n.js` e `js/home-utilitarios.js` não carregam mais, mas permanecem fisicamente no repositório para rollback até o V7C1.
- `js/home-acessibilidade.js` foi preservado para reduced motion, pausa/remoção de autoplay do vídeo hero e atalhos Alt+1, Alt+2, Alt+3 e Alt+4. A limitação preexistente do Alt+2, que tenta focar o `ul#navLinks` sem `tabindex`, permanece documentada.
- `css/index.css` teve somente os dois thresholds de navegação ajustados de 1180px para 968px; a ocorrência de 1180px relacionada a grades de conteúdo permaneceu intacta.
- O primeiro acesso sem `sms-lang` passou a respeitar o idioma preferencial do navegador; PT/EN/ES/PL, `sms-lang`, `window.translations`, `window.applyTranslations`, `translationsApplied`, `document.documentElement.lang` e persistência após reload foram preservados.
- A área restrita passou a usar o estado dinâmico do shared via `smsUserSession` em `localStorage`, sem reativar Admin/CMS/Firebase.
- A busca passou a ter somente o modal injetado pelo shared, preservando `search.js`, `search-index.js`, foco, resultados, Escape, fechamento, ARIA e tradução. Progresso e voltar ao topo também ficaram unificados, sem carga de `js/home-utilitarios.js`.
- A duplicação real do VLibras encontrada na primeira validação foi corrigida dentro do V7B: uma única `div[vw]`, botão, wrapper, tag do plugin, instância funcional e abertura/fechamento sem órfãos ou erro. A divergência está resolvida e não é pendência do V7C1.

### Service Worker, cache e rollback

- O registro inline do Service Worker foi mantido; o shared também registra o mesmo script/escopo. A duplicidade temporária, observada como idempotente e sem erro, fica para o V7C1.
- `sw.js`, `CACHE_NAME`, escopo e estratégia de cache não foram alterados. `js/nav-shared.js` permanece em `NEVER_CACHE`; HTML permanece fora do cache do SW.
- O rollback continua simples por `git revert` do commit único. `js/home-i18n.js` e `js/home-utilitarios.js` continuam no disco, e a tag `pos-fase1-modular` permanece disponível para consulta.

### Validações funcionais registradas antes desta governança

- Estáticas: `git diff --check`, somente os três arquivos no commit, uma tag nav-shared, zero tags home-i18n/home-utilitarios/scroll estática, módulos sobreviventes presentes, duas mudanças 1180px→968px e nenhum threshold adicional.
- DOM e comportamento: um header/shared nav, IDs únicos, uma busca, uma barra de progresso, um botão de topo, uma barra eMAG, skip links/atalhos únicos e uma instância de VLibras.
- Desktop: 1366px, 1200px, 1000px e 969px; mobile: 768px e 375px; menu, drawer, overlay, scroll lock, Escape, idioma, busca e links preservados.
- Idiomas, acessibilidade, busca, auth via localStorage, R1/R2/R3, páginas internas, console e Network foram validados; App Check/ReCAPTCHA em localhost permanece ambiental.
- A publicação do GitHub Pages foi confirmada na validação funcional consolidada do V7B antes deste registro. A CLI `gh` e a rechecagem HTTP foram tentadas nesta sessão, mas ficaram bloqueadas por permissões/SSL do ambiente; nenhum deploy foi executado agora.

### Estado e pendências preservados

- V7-PREP, V7A e V7B — concluídos; V7C1 — próximo microbloco, ainda não iniciado; V7C2 — posterior, ainda não iniciado.
- V6, B3, V5C3, V5D, limpeza CSS, `.map-modal-*`, `.agrosamas-banner`, mídia pesada, virada anual de eventos, `TURISMO_EVENTOS`/AgroSamas, Formspree e demais follow-ups permanecem pendentes.
- A pausa administrativa registrada no encerramento do V7B é histórica; Admin/CMS/Firebase é a frente ativa desde 2026-07-20.

### Escopo desta atualização documental

- Alterados somente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`.
- `.claude/settings.local.json` permaneceu não rastreado e intocado.
- Não foram executados `node scripts/update-site-meta.mjs`, V7C1, V7C2, V6, B3, commit, push ou deploy nesta atualização.
- Sugestão de mensagem para um futuro commit desta governança: `docs: registrar conclusão do V7B`.

---

## Ordem das frentes após o checkpoint de 2026-07-20

1. **ADMIN-B1-PREP e ADMIN-B1B-PREP** — concluídos exclusivamente em leitura.
2. **ADMIN-B2A-PREP** — próximo bloco único, ainda não iniciado.
3. **ADMIN-B2A-EXEC e ADMIN-B2B-PREP/EXEC** — somente em blocos próprios; alterações locais e Emulator Suite, sem publicação.
4. **ADMIN-B3 a ADMIN-J** — seguir o roadmap administrativo e suas autorizações; publicação de Rules somente no B3.
5. **Site público e backlog anterior** — pausados, sem perda das pendências já registradas.
6. **CMS-5D / integração CMS → site público** — fora da frente atual.
7. **CMS-4E-EXEC** — não concluído; executar somente no momento previsto pelo ADMIN-G e com autorização própria.

---

## Tarefas abertas

### [PAUSADA] Auditoria e melhoria do site público

**Contexto:** esta frente foi ativa após o CMS-5C e permanece preservada como histórico e backlog. Foi pausada oficialmente pelo checkpoint administrativo de 2026-07-20.
**Objetivo futuro:** auditar e melhorar o site público preservando rotas, SEO, responsividade, i18n, acessibilidade e funcionamento estático atual, somente após reabertura explícita.

**Blocos concluídos da auditoria pública pós-Claude Fable 5:**
- B1 — cache-busting público com token `?v=site-public-b1-20260708` padronizado em referências públicas de JS/CSS/dados e strings de carregadores dinâmicos. Nenhum Admin/CMS/Firebase tocado.
- B2 — higiene de `sitemap.xml`: removidos `/rotas-completas`, `/mapa-completo`, `/mapa-3d`, `/roteiro-ia`, `/local` genérico, bloco `hreflang` da home e namespace `xhtml` sem uso. Total final registrado: 11 URLs. Nenhum HTML/CSS/JS/Admin/CMS/Firebase tocado.
- B5 — diagnóstico Firebase público somente leitura: nenhum arquivo alterado; uso de Firebase compat diagnosticado em `mapa-turistico.html` e `eventos.html`; duplicação compat + modular diagnosticada em páginas com `public-banners.js`; Firebase confirmado como enriquecimento com fallback estático; recomendação de evitar B4 genérico e seguir por microblocos.
- B4a — timeout no mapa: alteração restrita a `js/mapa-turistico.js`, com timeout de 2,5s na leitura pública de eventos aprovados do Firestore; dados estáticos e empreendimentos preservados; nenhum HTML/CSS/dados/Admin/CMS/Firebase/rules tocado; bloco testado, commitado e enviado por push.
- SEO-F1 — follow-up de `noindex,follow` concluído nas páginas legadas/suspensas removidas do sitemap: `mapa-completo.html`, `mapa-3d.html` e `roteiro-ia.html`. As páginas seguem existindo para acesso direto. Nenhum `sitemap.xml`, `robots.txt`, CSS, JS, dado turístico, Admin/CMS/Firebase ou rule tocado.
- V1+V2 — visual/UX da home concluído, aprovado, commitado e enviado por push. V1 corrigiu o formulário de contato usando os seletores reais `.form-submit` e `#formStatus`, evitando TypeError por seletor inexistente. V2 melhorou CTAs e links editoriais da home para `/sabores` e `/onde-ficar`, ajustou chips relacionados a Gastronomia e Onde Ficar e adicionou a chave i18n `hospedagem-ver-todas` em `translations.js`. CSS, dados turísticos, Admin/CMS/Firebase e rules não foram tocados.
- V3 — navegação concluído, testado em produção, commitado e enviado por push. Ajustou paridade de navegação entre home e `nav-shared.js`; `index.html` e `js/nav-shared.js` foram os únicos arquivos alterados. Logo da home ajustada para `href="/"`; skip link corrigido para `#navLinks`; Planeje > Onde Ficar aponta para `/onde-ficar`; atalhos mobile Comer/Ficar apontam para `/sabores` e `/onde-ficar`; `nav-shared.js` recebeu `aria-controls`/`id` nos dropdowns Agenda e Planeje. Nenhum CSS, dado turístico, Admin/CMS/Firebase ou rule foi tocado. Teste em produção confirmou que o mapa carregou corretamente; erros anteriores eram de ambiente local/cache/service worker.
- V4A+V4B+V4C — limpeza de peso morto da home concluída, testada, commitada e enviada por push. `index.html` foi o único arquivo alterado nesses microblocos. V4A removeu a seção duplicada e oculta `#onde-ficar-placeholder` e o handler órfão de newsletter que referenciava seletores inexistentes, sem alterar a seção visível `#onde-ficar` nem o formulário de contato. V4B removeu a galeria oculta `#galeria`, preservando `galeria.html` e links para `/galeria`. V4C removeu o script órfão "Direto do Produtor", o modal do mini-mapa, funções relacionadas e telefones placeholder `99999-xxxx` do fonte público; `sabores.html` permaneceu intacto. Aproximadamente 404 linhas de peso morto foram removidas. Nenhum CSS, `translations.js`, dados turísticos reais, Admin/CMS/Firebase ou rules foi tocado.
- V5A — remoção do banner AgroSamas oculto concluída, validada, commitada e reenviada por push após instabilidade/cancelamento do GitHub Pages. `index.html` foi o único arquivo de código alterado no bloco: removidos a section/banner AgroSamas oculto e o script inline exclusivo (`ativarBannerAgrosamas`, `fecharBannerAgrosamas`, `localStorage agrosamas-banner-closed` e autoativação comentada), com aproximadamente 63 linhas removidas. O slot moderno `#public-banners-slot` foi preservado como caminho oficial para banners/campanhas via `js/public-banners.js`; `config.js` e `translations.js` foram preservados, mesmo com `CONFIG.agrosamas` temporariamente sem efeito na home e chaves `agrosamas-banner-*` órfãs. A data/hora da última atualização do site foi atualizada antes do commit real de publicação/reenvio do V5A (`chore: atualiza metadata para reenviar deploy do V5A`). O GitHub Pages build and deployment rodou novamente e concluiu com check verde. Acontece em breve, Festas em Destaque e Eventos & Notícias foram preservadas. Nenhum CSS, mídia, dado de evento, dado turístico real, menu/footer, Admin/CMS/Firebase ou rule foi tocado.
- V5B — priorização de eventos únicos/não recorrentes em "Acontece em breve" concluída, validada, enviada por push e publicada. Eventos recorrentes somente completam vagas quando há menos de quatro eventos únicos futuros. A seleção final permanece limitada a quatro cards, reordenada por data crescente e, em empate, mantém a prioridade para eventos vinculados a estabelecimento. O fallback estático e o merge com eventos aprovados do Firebase foram preservados; eventos do Firebase seguem mapeados como `recorrente: false`. `eventos-2026.json`, `js/data/eventos.js` e as demais fontes de dados permaneceram intactos. A data/hora do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit de código.
- V5C1 — links dos três cards de "Eventos & Notícias" corrigidos, validados, enviados por push e publicados. Polskie Smaki, Fanfarras municipais e Estruturação do turismo local agora apontam para matérias individuais reais do Portal oficial da Prefeitura, com `target="_blank"` e `rel="noopener noreferrer"`. O CTA geral "Ver todas as notícias" permanece em `/noticias`. Textos, imagens, datas, categorias, traduções, layout e CSS foram preservados. A data/hora do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit de código.
- V5C2+V5C2A — atualização editorial sincronizada concluída, validada, enviada por push e publicada. O primeiro card da home passou a exibir "Agosto é Polonês em São Mateus do Sul: confira a programação do 32º Mês Polonês", e a mesma matéria foi adicionada ao topo de `noticias.html`. No microajuste V5C2A, a matéria nova tornou-se `article.post-card.featured`, com título `h2` e selo "Destaque · Cultura e Gastronomia"; a notícia antiga do regulamento foi preservada como segundo card comum, com `h3` e categoria Cultura. Nenhuma notícia anterior foi removida; os cards 2 e 3 da home e o CTA geral `/noticias` permaneceram intactos. CSS, JavaScript, `translations.js`, `noticia.html`, `js/cms.js`, camada opcional do CMS, Admin/CMS/Firebase e rules foram preservados. A data/hora do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit funcional.
- R2 — extração do carrossel “Experiências em destaque” concluída, validada, commitada, enviada por push e publicada. `js/home-experiencias.js` foi criado como segundo módulo da Fase 1 e recebeu a extração comportamental 1:1 de aproximadamente 57 linhas de JavaScript inline de `index.html`, sem mudança visual ou funcional. A tag `script` com `defer` e `?v=site-public-b1-20260708` foi posicionada antes de `js/home-eventos.js`; `initFeaturedExperiencesCarousel` permaneceu privada em IIFE, com listener próprio de `DOMContentLoaded`, sem função em `window`, export, `import()`, `fetch`, URL relativa ou nova dependência. Seletores, botões, passo por largura real do card, gap, fallback, `scrollBy`, reduced motion, estado disabled, tolerância de 2px, setas, scroll passive, resize, inicialização, scroll/swipe nativo, responsividade, scroll-snap, tabindex, `aria-labels` traduzíveis e demais comportamentos foram preservados. A metadata foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`. R1 e `js/home-eventos.js` permaneceram intactos; acessibilidade/utilitários visuais continuam inline para R4.
- R3 — extração do formulário de contato concluída, validada, commitada, enviada por push e publicada. `js/home-contato.js` foi criado como terceiro módulo da Fase 1 e recebeu a extração comportamental 1:1 de aproximadamente 58 linhas de JavaScript inline de `index.html`, sem mudança funcional ou visual. A referência única usa `<script src="js/home-contato.js?v=site-public-b1-20260708" defer></script>` e foi posicionada antes de `js/home-experiencias.js` e `js/home-eventos.js`; a lógica permanece privada em IIFE, sem propriedade em `window`, export ou nova dependência. O endpoint `https://formspree.io/f/xpqykpqd`, o `FORMSPREE_ID` `xpqykpqd`, o POST, headers Accept/Content-Type, `event.preventDefault()`, `FormData`, `Object.fromEntries()`, `JSON.stringify()`, `response.ok`, loading, mensagens, classes `form-status success/error`, reset somente no sucesso, timeout de 6000 ms, console.error, validação nativa e retornos silenciosos foram preservados. R1 e R2 permaneceram intactos; markup, CSS, `translations.js` e `config.js` permaneceram intactos. A metadata foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`; o commit funcional é `9d9a8ef refactor(home): extrai formulario de contato para modulo dedicado`.

**R4B — utilitários visuais concluído, validado, commitado, enviado por push e publicado.** `js/home-utilitarios.js` foi criado como módulo dedicado para a extração comportamental 1:1 da barra de progresso de rolagem e do botão “Voltar ao topo”; aproximadamente 36 linhas inline foram removidas de `index.html`, sem mudança visual ou funcional. A referência usa `<script src="js/home-utilitarios.js?v=site-public-b1-20260708" defer></script>` no ponto anterior do bloco, depois do init do VLibras e antes do menu hamburger; IIFE, null-checks, listeners, cálculos, proteção contra divisão por zero, limiar de 300px, classe `visible` e rolagem suave foram preservados. R1, R2 e R3 permaneceram intactos; menu, i18n e acessibilidade eMAG permaneceram intactos. A metadata foi atualizada antes do commit funcional; o commit é `b272330 refactor(home): extrai utilitarios visuais para modulo dedicado`.

**Pendência externa do Formspree:** nenhum envio real foi executado durante a validação e nenhum envio real deve ocorrer enquanto o endereço institucional estiver `PENDING`. O Workflow atual continua temporariamente entregando para `imprensapmsms@gmail.com`. O endereço obrigatório `turismo@saomateusdosul.pr.gov.br` já foi adicionado em Linked Emails, mas depende de confirmação por outro setor e permanece `PENDING`. Após mudar para `VERIFIED`: abrir Forms > TURISMO > Workflow > Email; selecionar `turismo@saomateusdosul.pr.gov.br`; salvar mantendo a ação Enabled; realizar um único envio institucional controlado; confirmar o recebimento no novo endereço; e confirmar que o Gmail antigo deixou de receber. A troca ocorrerá somente no painel do Formspree, sem alteração de código, metadata, commit ou deploy.

**Próximos caminhos possíveis:**
- V4D — fallback inline de traduções absorvido e concluído pelo R5A; não permanece como pendência duplicada.
- V5C3 — avaliar extração do `style` inline dos CTAs para classe compartilhada; exige alteração de CSS, não executar automaticamente e pode ser incorporado futuramente a um bloco visual maior.
- Follow-up editorial de V5C2 — revisar o destaque do 32º Mês Polonês após 30/08/2026; aplicar a política de rotação mensal dos cards; remover ou substituir cards de eventos em até aproximadamente sete dias após o encerramento.
- Follow-up visual de V5C2 — a notícia nova e a antiga usam atualmente a mesma imagem; avaliar troca somente após conferência visual e em bloco separado.
- Follow-up arquitetural fora do V5C — avaliar fonte única de notícias para evitar manutenção duplicada entre home e `noticias.html`, por JSON, CMS ou outra solução futura; aguarda decisão arquitetural e possível retomada do CMS.
- V5D — revisão anti-envelhecimento de Festas em Destaque; risco médio; depende de mexer em `translations.js`, então só com decisão consciente.
- V6 — reordenação da metade inferior da home.
- V7-PREP — concluído em 2026-07-16; estratégia V7A→V7B→V7C1→V7C2 e cinco decisões humanas aprovadas.
- V7A — compatibilidade do nav-shared concluída, validada, commitada, enviada por push e publicada; commit funcional `4cd0616cb9d393571946f90c97a753eae16e69c3`, com 15 arquivos, 20 inserções e 14 remoções. O V7B foi concluído como próximo microbloco; V7C1 é o próximo passo e V7C2 permanece posterior, ambos ainda não iniciados.
- CSS órfão `.agrosamas-banner` pode ser revisado em bloco próprio.
- Chaves i18n órfãs `agrosamas-banner-*` podem ser revisadas futuramente, mas `translations.js` não deve ser alterado agora.
- `CONFIG.agrosamas` está temporariamente sem efeito na home após V5A.
- CSS órfão `.map-modal-*` pode ser revisado em bloco próprio, pois o modal do mini-mapa foi removido da home.
- Chaves i18n `modal-endereco`, `modal-telefone` e `modal-horario` podem ser revisadas futuramente, mas `translations.js` não deve ser alterado agora.
- Planejar a virada anual de `eventos-2026.json`.
- Avaliar futuramente a duplicação entre `eventos-2026.json` e `TURISMO_EVENTOS`.
- Alinhar futuramente `TURISMO_EVENTOS/js/data/eventos.js` para `Rua do Mathe`, pois a fonte ainda registra `Parque de Exposições`; executar somente em bloco exclusivo de dados, fora do `V7-PREP`.
- App Check/reCAPTCHA em localhost: tratar como ambiente/debug token, não como regressão.
- Service Worker em localhost: investigar em follow-up separado se voltar a interceptar Leaflet/OSM, sem tratar como regressão do V3.
- Eventos aprovados com `establishmentName`, mas sem `establishmentId` seguro, não vinculam ao mapa; revisar dados do Firestore futuramente.
- B4b opcional: migrar Firebase compat de mapa/eventos para import modular sob demanda, somente com teste manual dedicado.
- B3 — mídia/performance fica por último, conforme decisão atual.
- Admin/CMS/Firebase é a frente ativa; esta lista pública permanece pausada.

**Escopo provável:** páginas públicas, navegação, conteúdo visível, acessibilidade, SEO público, performance e dados estáticos públicos, conforme tarefa aprovada.
**Fora de escopo:** Admin, CMS, Firebase, Firestore Rules, Storage Rules, dados reais do Firestore, seeds, deploys e integrações CMS.

**Critério de aceite:**
- Nenhuma alteração em Admin/CMS/Firebase sem autorização explícita.
- Site público segue funcional com dados estáticos.
- Nenhuma dependência nova de login ou Firestore nas páginas públicas principais.
- Mudanças pequenas, auditáveis e validadas com os comandos disponíveis.

### [ABERTA] Tarefa 4 — Fichas/páginas individuais de locais

**Contexto:** evoluir as fichas dinâmicas `local.html?id=...` alimentadas por `js/locais-data.js` (e pontos de `js/data/pontos-turisticos.js`).  
**Objetivo:** melhorar/expandir as páginas de detalhe de locais mantendo compatibilidade com o site estático e com o mapa.

**Escopo provável:** `local.html` e dados de locais já existentes.  
**Fora de escopo:** admin/Firebase, criação de novos negócios, invenção de dados (telefone/endereço/coordenada/horário/imagem).

**Critério de aceite:**
- Fichas continuam abrindo por `?id=` com fallback seguro quando o id não existe.
- Sem colapsar fichas diferentes numa única URL; canonical dinâmico correto.
- Sem quebrar filtros do mapa nem os cards de destaque da home.
- Sem inventar dados de negócios; pendências apenas documentadas.
- Acessibilidade, VLibras, seletor de idiomas, atalhos móveis e mascote preservados.

---

### [ABERTA / FOLLOW-UP FUTURO] Ícone PWA real `512x512`

**Contexto:** PWA sem ícone `512x512` pode degradar splash/instalação em Android, mas não quebra o site. As entradas falsas de `512x512` já foram removidas do `manifest.json` (ele hoje declara apenas o ícone real `192x192`).  
**Ação recomendada:** manter como pendência; criar/validar um ícone real `512x512` antes de reintroduzi-lo no manifest.

**Critério de aceite:**
- Pendência anotada e visível.
- Nenhum arquivo de imagem inventado sem autorização.
- Manifest nunca aponta para arquivo inexistente nem declara dimensão falsa.

---

### [ABERTA / FRENTE ATIVA] Admin / CMS / Firebase

**Contexto:** frente retomada oficialmente em 2026-07-20 pelo `ADMIN-RESTART-PREP`; o detalhamento atual está no início deste arquivo.

**Regra:** executar somente o bloco autorizado. `ADMIN-B1-PREP` e `ADMIN-B1B-PREP` estão concluídos; o próximo bloco é `ADMIN-B2A-PREP`, somente preparação sem edição, e não foi iniciado nesta governança.

### [ABERTA / FUTURO] CMS-5D — Integração controlada do CMS no site público

**Contexto:** CMS-5C foi concluído, commitado, enviado por push e as Firestore Rules foram publicadas para permitir leitura pública mínima de `cms_establishments` apenas quando `status == "published"`.
**Status:** ainda não iniciado.

**Teste esperado em `/cms-public-debug.html`:**
- `Leitura concluida` se houver documentos `published`;
- `Sem published` se não houver documentos `published`;
- nunca deve aparecer `permission-denied` após as rules publicadas.

**Regra:** não ligar mapa, `local.html`, busca, sabores, onde-ficar, o-que-fazer ou home ao CMS até o CMS-5D ser explicitamente iniciado.

### [ABERTA / FUTURO] CMS-4E-EXEC — Inventário remoto de mídias

**Contexto:** inventário remoto de mídias do CMS segue pendente.
**Status:** ainda não iniciado/concluído nesta pausa.

**Regra:** não alterar Storage Rules, arquivos remotos, mídias reais ou dados do CMS sem bloco específico e autorização explícita.

---

## Regra sobre artefatos de auditoria

- `docs/auditoria-output/*` e demais saídas geradas por scripts de auditoria **não devem ser commitadas a menos que explicitamente solicitado**.
- São ruidosas e regeneráveis; por padrão, reverter antes de qualquer commit:
  ```powershell
  git checkout -- docs/auditoria-output/
  ```
- Relatórios curados e escritos por humano (ex.: `docs/bloco-s14-auditoria-dados-turisticos-publicos.md`) podem ser commitados normalmente.

---

## Tarefas concluídas

### [CONCLUÍDA] Redesign de UX da home e polimento de navegação mobile
Aprovado em QA, commitado e enviado (push).

### [CONCLUÍDA] Carrossel de experiências em destaque
Aprovado em QA, commitado e enviado.

### [CONCLUÍDA] Polimento visual do mapa turístico
Aprovado em QA, commitado e enviado.

### [CONCLUÍDA] Polimento final de densidade/widget/menu mobile
Aprovado em QA, commitado e enviado (commit `61dc569`).

### [CONCLUÍDA] Otimização de performance/Lighthouse (passe inicial seguro)
Otimização segura de carregamento (imagens da home e do mapa), sem regressão visual. Aprovado em QA e commitado (commit `0e0c65a`).

### [CONCLUÍDA] Correção de regressão de layout do carrossel em destaque
Estabilização do layout de imagem do carrossel. Aprovado em QA e commitado (commit `87b6457`).

### [CONCLUÍDA] Passe de SEO/metadados sociais
`<title>`, meta description, canonical, Open Graph, Twitter/X, `manifest.json` e metadados dinâmicos de `local.html`. Remoção do `SearchAction` da home (site tem busca modal, sem URL estável de resultados). `rotas-completas.html` mantido `noindex,follow` (página legada). Aprovado em QA e commitado (commit `c34d53b`).

### [CONCLUÍDA] Auditoria de dados turísticos públicos (S14)
Auditoria das fontes de dados públicas + remoção do duplicado `rua-do-mathe` de `js/data/restaurantes.js` (já existia como ponto/ficha canônica com dados mais consistentes; o duplicado tinha telefone conflitante/placeholder). Relatório curado `docs/bloco-s14-auditoria-dados-turisticos-publicos.md` commitado. Aprovado em QA (commit `fe18133`).

### [CONCLUÍDA] CMS-5C — Leitura pública segura de published e debug isolado
CMS-5C concluído, commitado, enviado por push e Firestore Rules publicadas. A leitura pública de `cms_establishments` foi limitada a documentos `status == "published"` e a validação esperada ocorre em `/cms-public-debug.html`, sem integração com as páginas públicas principais.

### [CONCLUÍDA] ADMIN-B1-PREP — Validação Admin somente leitura
Login Admin manual e real, dashboard, logout e leituras de `usuarios`, `eventos_pendentes`, `eventos_aprovados` e `estabelecimentos_pendentes` confirmados sem escrita, alteração de Auth, publicação de Rules, upload ou aplicação de CORS. A divergência entre frontend somente `admin` e permissões limitadas de `moderator` nas Rules foi confirmada estaticamente.

### [CONCLUÍDA] ADMIN-B1B-PREP — Contrato remoto de Rules, CORS e App Check
Releases/rulesets implantados, CORS do bucket e App Check foram recuperados somente por GET/LIST, sem persistência de fontes remotas ou mudança de configuração. `firestore.rules` e `storage.rules` locais correspondem exatamente às versões implantadas; `storage-cors.json` corresponde ao CORS remoto. Riscos P0/P1 de leitura pública em `noticias`, `media_library` e `cms-media` foram confirmados.

### [CONCLUÍDA] B1 — Cache-busting público pós-auditoria
Token `?v=site-public-b1-20260708` padronizado em referências públicas de JS/CSS/dados e strings de carregadores dinâmicos. Bloco commitado e enviado manualmente em 2026-07-08. Nenhum Admin/CMS/Firebase tocado.

### [CONCLUÍDA] B2 — Higiene de sitemap pós-auditoria
`sitemap.xml` higienizado em 2026-07-08, com remoção de páginas legadas/suspensas e `/local` genérico, remoção do bloco `hreflang` da home por idiomas client-side via `localStorage`, remoção do namespace `xhtml` sem uso e total final de 11 URLs. Bloco commitado e enviado manualmente. Nenhum HTML/CSS/JS/Admin/CMS/Firebase tocado.

### [CONCLUÍDA] B5 — Diagnóstico Firebase público
Diagnóstico somente leitura concluído em 2026-07-08. Nenhum arquivo alterado. Uso de Firebase compat diagnosticado em `mapa-turistico.html` e `eventos.html`; duplicação compat + modular diagnosticada em páginas com `public-banners.js`; Firebase confirmado como enriquecimento, com fallback estático preservado. Recomendado evitar B4 genérico e seguir por microblocos.

### [CONCLUÍDA] B4a — Timeout no mapa
Timeout de 2,5s adicionado na leitura pública de eventos aprovados do Firestore em `js/mapa-turistico.js`. Dados estáticos e empreendimentos preservados; nenhum HTML, CSS, dados, Admin/CMS/Firebase ou rules alterado. Bloco testado, commitado e enviado por push em 2026-07-08.

### [CONCLUÍDA] SEO-F1 — Noindex em páginas legadas/suspensas
`noindex,follow` adicionado em `mapa-completo.html`, `mapa-3d.html` e `roteiro-ia.html`, concluindo o follow-up das páginas legadas/suspensas já removidas do sitemap. As páginas continuam existindo para acesso direto; `sitemap.xml`, `robots.txt`, CSS, JS, dados turísticos, Admin/CMS/Firebase e rules não foram alterados. Bloco commitado e enviado por push em 2026-07-08.

### [CONCLUÍDA] V1+V2 — Ajustes visuais/UX da home
Bloco visual/UX concluído, aprovado, commitado e enviado por push. V1 corrigiu o formulário de contato da home para usar `.form-submit` e `#formStatus`, evitando quebra por TypeError de seletor inexistente. V2 melhorou CTAs e links editoriais da home para `/sabores` e `/onde-ficar`, ajustou chips/links relacionados a Gastronomia e Onde Ficar e adicionou a chave i18n `hospedagem-ver-todas` em `translations.js`. Nenhum CSS, dado turístico, Admin/CMS/Firebase ou rule foi alterado.

### [CONCLUÍDA] V3 — Paridade de navegação
Bloco de navegação concluído, testado em produção, commitado e enviado por push. Ajustou paridade entre home e `nav-shared.js`, com correções de logo, skip link, links de Onde Ficar, atalhos mobile Comer/Ficar e `aria-controls`/`id` nos dropdowns Agenda e Planeje. Apenas `index.html` e `js/nav-shared.js` foram alterados no bloco. Nenhum CSS, dado turístico, Admin/CMS/Firebase ou rule foi alterado.

### [CONCLUÍDA] V4A+V4B+V4C — Limpeza de peso morto da home
Microblocos concluídos, testados, commitados e enviados por push. V4A removeu de `index.html` a seção duplicada e oculta `#onde-ficar-placeholder` e o handler órfão de newsletter; V4B removeu a galeria oculta `#galeria`, preservando `galeria.html`; V4C removeu o script órfão "Direto do Produtor", o modal do mini-mapa, funções relacionadas e telefones placeholder `99999-xxxx` do fonte público. Aproximadamente 404 linhas foram removidas da home. `index.html` foi o único arquivo alterado nesses microblocos; nenhum CSS, `translations.js`, dados turísticos reais, Admin/CMS/Firebase ou rule foi alterado.

### [CONCLUÍDA] V5A — Remoção do banner AgroSamas oculto
Microbloco concluído, validado, commitado e reenviado por push após instabilidade/cancelamento do GitHub Pages. Removeu de `index.html` a section/banner AgroSamas oculto e o script inline exclusivo (`ativarBannerAgrosamas`, `fecharBannerAgrosamas`, `localStorage agrosamas-banner-closed` e autoativação comentada), com aproximadamente 63 linhas removidas. O slot moderno `#public-banners-slot`, `js/public-banners.js`, `config.js` e `translations.js` foram preservados. A data/hora da última atualização do site foi atualizada antes do commit real de publicação/reenvio do V5A, e o GitHub Pages build and deployment concluiu novamente com check verde. Nenhum CSS, mídia, dado de evento, dado turístico real, menu/footer, Admin/CMS/Firebase ou rule foi alterado.

### [CONCLUÍDA] V5B — Priorização de eventos únicos em "Acontece em breve"
Microbloco concluído, validado, enviado por push e publicado. A grade passou a priorizar eventos com `recorrente !== true`; eventos com `recorrente === true` somente completam vagas quando faltam eventos únicos futuros. A seleção continua limitada a quatro cards e, depois de formada, é ordenada por data crescente, preservando o desempate por vínculo a estabelecimento. O fallback estático e o merge com Firebase foram preservados; eventos aprovados do Firebase seguem mapeados como `recorrente: false`. `eventos-2026.json`, `js/data/eventos.js` e as demais fontes de dados permaneceram intactos. A data/hora da última atualização do site foi atualizada antes do commit de código.

### [CONCLUÍDA] V5C1 — Links reais em "Eventos & Notícias"
Microbloco concluído, validado, enviado por push e publicado. Os cards Polskie Smaki, Fanfarras municipais e Estruturação do turismo local agora apontam para matérias individuais reais do Portal oficial da Prefeitura e abrem em nova aba com `target="_blank"` e `rel="noopener noreferrer"`. O CTA geral "Ver todas as notícias" continua apontando para `/noticias`. Textos, imagens, datas, categorias, traduções, layout e CSS foram preservados; `noticias.html`, `noticia.html`, `js/cms.js`, `translations.js`, dados, Admin/CMS/Firebase e rules permaneceram intactos. A data/hora da última atualização do site foi atualizada antes do commit de código.

### [CONCLUÍDA] V5C2+V5C2A — Sincronização editorial entre home e notícias
V5C2 e o microajuste V5C2A foram concluídos, validados, enviados por push e publicados. O primeiro card da home passou a destacar a matéria do 32º Mês Polonês, com data de 06 de julho de 2026, categoria Cultura, período de 18 de julho a 30 de agosto de 2026 e link para a matéria oficial; a mesma notícia foi adicionada ao topo de `noticias.html`. A matéria nova recebeu o destaque principal, título `h2` e selo "Destaque · Cultura e Gastronomia"; a notícia antiga do regulamento permaneceu como segundo card comum, com título `h3` e categoria Cultura. Nenhuma notícia anterior foi removida. Os cards 2 e 3 da home, o CTA geral `/noticias`, CSS, JavaScript, `translations.js` e a camada opcional do CMS foram preservados. A data/hora da última atualização do site foi atualizada antes do commit funcional.

### [CONCLUÍDA] R1 — Extração da grade “Acontece em breve”
R1 da Fase 1 foi concluído, validado, commitado, enviado por push e publicado. A lógica foi extraída de `index.html` para `js/home-eventos.js` com comportamento 1:1; aproximadamente 183 linhas de JavaScript inline foram removidas da home. A referência externa usa `defer` e cache-busting, `carregarProximosEventos` permanece privada em IIFE com listener próprio de `DOMContentLoaded`, sem export ou função adicionada a `window`. `eventos-2026.json` continua fonte primária, Firebase permanece enriquecimento opcional, a regra V5B, fallback estático, merge, limite de quatro cards, ordenação e desempate foram preservados. O carrossel de experiências permaneceu inline e fora do módulo. A metadata do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit funcional; o script não foi executado nesta atualização de governança.

### [CONCLUÍDA] R2 — Extração do carrossel “Experiências em destaque”
R2 da Fase 1 foi concluído, validado, commitado, enviado por push e publicado. A lógica foi extraída de `index.html` para `js/home-experiencias.js` com comportamento 1:1; aproximadamente 57 linhas de JavaScript inline foram removidas da home. A tag externa usa `defer` e `?v=site-public-b1-20260708` e foi posicionada antes de `js/home-eventos.js`. `initFeaturedExperiencesCarousel` permanece privada em IIFE com listener próprio de `DOMContentLoaded`, sem export ou função adicionada a `window`; não foram introduzidos `import()`, `fetch`, URL relativa ou nova dependência. O passo por largura real do card, gap, fallback, `scrollBy`, reduced motion, controles disabled, tolerância de 2px, teclado, listeners, scroll/swipe nativo, responsividade, scroll-snap, tabindex e `aria-labels` traduzíveis foram preservados. Não houve mudança visual ou funcional; R1 e `js/home-eventos.js` permaneceram intactos, e acessibilidade/utilitários visuais continuam inline para R4. A metadata do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit funcional; o script não foi executado nesta atualização de governança.

### [CONCLUÍDA] R3 — Extração do formulário de contato
R3 da Fase 1 foi concluído, validado, commitado, enviado por push e publicado. A lógica foi extraída de `index.html` para `js/home-contato.js` com comportamento 1:1; aproximadamente 58 linhas de JavaScript inline foram removidas da home, sem mudança funcional ou visual. A referência única usa `<script src="js/home-contato.js?v=site-public-b1-20260708" defer></script>` e foi posicionada antes de `js/home-experiencias.js` e `js/home-eventos.js`; a lógica permanece privada em IIFE, sem propriedade em `window`, export ou nova dependência. O endpoint `https://formspree.io/f/xpqykpqd`, o `FORMSPREE_ID` `xpqykpqd`, o POST, headers, `FormData`, `Object.fromEntries()`, `JSON.stringify()`, `response.ok`, loading, mensagens, classes `form-status success/error`, reset somente no sucesso, timeout de 6000 ms, console.error, validação nativa e retornos silenciosos foram preservados. R1 e R2 permaneceram intactos; markup, CSS, `translations.js` e `config.js` permaneceram intactos. A metadata foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`; o commit funcional é `9d9a8ef refactor(home): extrai formulario de contato para modulo dedicado`.

**Pendência externa do Formspree:** nenhum envio real foi executado durante a validação e nenhum envio real deve ocorrer enquanto o endereço institucional estiver `PENDING`. O Workflow atual continua temporariamente entregando para `imprensapmsms@gmail.com`. O endereço obrigatório `turismo@saomateusdosul.pr.gov.br` já foi adicionado em Linked Emails, mas depende de confirmação por outro setor e permanece `PENDING`. Após mudar para `VERIFIED`: abrir Forms > TURISMO > Workflow > Email; selecionar `turismo@saomateusdosul.pr.gov.br`; salvar mantendo a ação Enabled; realizar um único envio institucional controlado; confirmar o recebimento no novo endereço; e confirmar que o Gmail antigo deixou de receber. A troca ocorrerá somente no painel do Formspree, sem alteração de código, metadata, commit ou deploy.

### [CONCLUÍDA] R4A — Extração da acessibilidade eMAG
R4A da Fase 1 foi concluído, validado, commitado, enviado por push e publicado. `js/home-acessibilidade.js` foi criado como módulo dedicado para a extração comportamental 1:1 do controle de tamanho da fonte, alto contraste, restauração das preferências via `localStorage`, `prefers-reduced-motion` nos vídeos e atalhos Alt+1..4; aproximadamente 97 linhas de JavaScript inline foram removidas de `index.html`, sem mudança visual ou funcional. O commit funcional confirmado no histórico é `db1b3cb refactor(home): extrai acessibilidade eMAG para modulo dedicado`. `window.changeFontSize` e `window.toggleContrast` foram preservadas explicitamente para os atributos `onclick`; `currentFontSize` permaneceu privado. O contrato `sms-font-size`/`sms-high-contrast`, fonte, contraste, reduced motion, vídeo, atalhos, markup e CSS foram preservados. R1, R2, R3 e R4B permaneceram intactos; GitHub Pages foi publicado e validado na validação funcional anterior ao registro. R4A e R4B permanecem módulos separados por responsabilidade.

### [CONCLUÍDA] R5A — Remoção do fallback inline obsoleto de traduções
R5A foi concluído, validado, commitado, enviado por push e publicado com sucesso. O commit funcional confirmado no histórico e presente em `origin/main` é `55615cd0d0c25db647d9ed0d04decca8e0ea7eb9 refactor(home): remove dicionario fallback inline obsoleto de traducoes`. O dicionário fallback parcial pt/en/es/pl foi removido de `index.html`, com aproximadamente 174 linhas eliminadas, preservando a declaração final `var translations = window.translations || {};`. `translations.js` permaneceu intacto, com cobertura completa das chaves da home nos quatro idiomas. O runtime inline do seletor permaneceu intacto, incluindo `sms-lang`, `window.applyTranslations` e `translationsApplied`; PT/EN/ES/PL, ciclo completo, bandeira/sigla, aria-label/title, placeholders, aria-labels do carrossel, reações ao evento, `document.documentElement.lang` e persistência após reload foram validados. R1, R2, R3, R4A e R4B permaneceram intactos. A metadata foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`; nenhum módulo novo foi criado. V4D foi absorvido e concluído pelo R5A.

### [CONCLUÍDA] R5B — Externalização do runtime i18n do seletor de idiomas
R5B foi concluído, validado, commitado, enviado por push e publicado. O commit funcional confirmado no Git e presente em `origin/main` é `21564847d5b74697affcbfd68ba99c6fcbdb0340 refactor(home): extrai runtime i18n do seletor de idiomas para modulo dedicado`. `git show --stat` confirmou somente `index.html`, `js/home-i18n.js` e `js/site-meta.js`, com `170 insertions(+)` e `165 deletions(-)`. O runtime inline foi removido de `index.html` e criado como `js/home-i18n.js`; a tag `<script src="js/home-i18n.js?v=site-public-b1-20260708"></script>` foi inserida na posição anterior, sem `defer`, `async` ou `type="module"`, depois do menu hamburger e antes de `js/home-acessibilidade.js`, `js/home-contato.js`, `js/home-experiencias.js` e `js/home-eventos.js`. A ordem síncrona de `translations.js` seguida do runtime da home foi preservada, incluindo o comportamento histórico do primeiro acesso sem `sms-lang` terminar em PT, com `🇧🇷 PT` e `document.documentElement.lang` em `pt-BR`. `translations.js` permaneceu intacto; `sms-lang`, `window.translations`, `window.applyTranslations` e `translationsApplied` foram preservados. PT/EN/ES/PL, ciclo de idiomas, bandeira/sigla, atributos do seletor, placeholders, aria-labels, conteúdo dinâmico, persistência após reload, busca, clima, tema sazonal, mascote e fechamento do menu mobile foram validados. A atualização de `js/site-meta.js` ocorreu antes do commit funcional com `node scripts/update-site-meta.mjs`; nenhuma alteração de runtime foi feita nesta atualização de governança.

### [CONCLUÍDA] V7B — Cutover atômico da navegação da home
V7B concluído, corrigido, validado, commitado, enviado por push e publicado. O commit funcional é `e80794418524e521ebbaaab85f76d101ffae5717 feat(home): adota nav-shared como navegacao unica da home (V7B)`, presente em `origin/main`, com somente `index.html`, `css/index.css` e `js/site-meta.js`, em `4 insertions(+)` e `409 deletions(-)`. O cutover tornou `js/nav-shared.js` a navegação única, removeu o chrome estático duplicado, alinhou o breakpoint a 968px, preservou `js/home-acessibilidade.js` e manteve R1/R2/R3. `js/home-i18n.js` e `js/home-utilitarios.js` não carregam, mas permanecem no disco até o V7C1. O primeiro acesso respeita o idioma do navegador, a área restrita é dinâmica, busca/utilitários foram unificados e o VLibras foi consolidado em uma única instância funcional. A metadata registra `2026-07-17T10:14:49-03:00`; o registro duplicado do Service Worker permanece temporário para o V7C1.

### Encerramento oficial da Fase 1
R1, R2, R3, R4B, R4A, R5A e R5B estão concluídos. A Fase 1 foi encerrada sem reescrever a home do zero; a estratégia de refatoração modular progressiva no projeto atual foi preservada, a dívida de JavaScript inline foi significativamente reduzida e cada responsabilidade foi separada em módulo próprio. Nenhuma etapa da Fase 2 foi iniciada. O próximo passo registrado é somente um checkpoint/decisão pós-Fase 1; não iniciar automaticamente V6, V7 ou B3. `js/home-i18n.js` poderá ser aposentado ou absorvido futuramente no V7. O follow-up das duas opções `.lang-option.active` após reload permanece reservado para V7.

**Limite de validação:** o bloqueio direto de `translations.js` não foi possível no ambiente; a degradação foi validada por simulação equivalente, com retorno silencioso, markup original em PT, sem tela vazia e sem TypeError.

**Pendências preservadas:** a frente pública está pausada; V6, V7C1, V7C2 e B3 permanecem pendentes; V5C3 e V5D continuam pendentes; CSS órfão `.map-modal-*` e `.agrosamas-banner` permanece como frente paralela; chaves i18n órfãs e `CONFIG.agrosamas` temporariamente sem efeito na home permanecem documentados; a revisão editorial do destaque do 32º Mês Polonês após 30/08/2026 permanece pendente; a possível duplicação futura entre `eventos-2026.json` e `TURISMO_EVENTOS` e a virada anual de `eventos-2026.json` permanecem pendentes; a pendência externa do Formspree permanece com endpoint `xpqykpqd`, Workflow em `imprensapmsms@gmail.com`, `turismo@saomateusdosul.pr.gov.br` em `PENDING` e sem envio real antes de `VERIFIED`. Admin/CMS/Firebase é a frente ativa, limitada ao próximo `ADMIN-B2A-PREP`.

---

## Arquivos/páginas que não devem ser mexidos sem autorização

- `mapa-completo.html`
- `mapa-3d.html`
- `roteiro-ia.html`

Motivo: existem, mas foram classificados como legado/futuro/suspenso.

---

## Páginas antigas que não existem

Não tentar editar/recriar sem autorização (nomes de arquivo legados, sem arquivo real no projeto):

- gastronomia.html
- rotas.html
- cultura.html

Equivalentes identificados:

- `sabores.html`
- `rotas-completas.html`
- filtros do mapa
- conteúdo cultural distribuído em outras páginas

---

## Checklist antes de qualquer alteração

- [ ] Li `CLAUDE.md`.
- [ ] Li este `TASKS.md`.
- [ ] Conferi `CHANGELOG_AI.md`.
- [ ] Entendi o escopo.
- [ ] Listei arquivos que serão analisados.
- [ ] Listei arquivos que serão alterados.
- [ ] Avisei riscos antes de editar.
- [ ] Não vou fazer commit/deploy sem autorização.

---

## Checklist antes de commit

- [ ] `git status` revisado.
- [ ] `git diff --stat` revisado.
- [ ] `git diff` revisado.
- [ ] Apenas arquivos esperados foram alterados.
- [ ] Nenhum artefato de auditoria (`docs/auditoria-output/*`) entrou sem autorização.
- [ ] Nenhum layout/CSS foi alterado em tarefa de SEO/dados.
- [ ] Nenhum arquivo legado foi mexido sem autorização.
- [ ] Usuário autorizou commit.
