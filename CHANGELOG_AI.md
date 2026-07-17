# CHANGELOG_AI.md — SITE-TURISMO-SMS

Registro de alterações feitas com apoio de IA no projeto.

Use este arquivo para manter continuidade entre sessões do Claude, Claude Code, Codex e ChatGPT.

---

## 2026-07-17 — Conclusão do V7A de compatibilidade do nav-shared

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** V7A concluído, validado, commitado, enviado por push e publicado; esta atualização é somente de governança, sem novo commit, push ou deploy.

### Objetivo

Registrar oficialmente a conclusão do V7A, primeiro microbloco da estratégia de unificação da navegação pública aprovada no V7-PREP. O V7A preparou a compatibilidade futura do `js/nav-shared.js`, renovou o token das páginas internas ativas e manteve a home completamente intacta. V7B, V7C1, V7C2, V6 e B3 não foram executados nesta atualização.

### Evidência confirmada pelo Git

- Commit funcional: `4cd0616cb9d393571946f90c97a753eae16e69c3`.
- Mensagem exata: `feat(nav): prepara nav-shared para adocao pela home (V7A)`.
- O commit está presente em `origin/main`.
- `git show --stat --oneline --decorate --no-renames` confirmou **15 arquivos modificados, 20 inserções e 14 remoções**.
- `git show --format= --name-status --no-renames` confirmou somente os arquivos abaixo:
  - `js/nav-shared.js`;
  - `js/site-meta.js`;
  - `eventos.html`;
  - `galeria.html`;
  - `local.html`;
  - `mapa-turistico.html`;
  - `noticia.html`;
  - `noticias.html`;
  - `o-que-fazer.html`;
  - `onde-ficar.html`;
  - `para-o-trade.html`;
  - `reservas.html`;
  - `rotas-completas.html`;
  - `sabores.html`;
  - `transparencia.html`.

### Alterações consolidadas

O `NAV_CSS` de `js/nav-shared.js` recebeu exatamente o contrato de compatibilidade abaixo:

```css
@media (min-width: 769px) {
    body.home-page {
        padding-top: 0;
    }
}
```

A regra é específica para `body.home-page`, atua somente a partir de 769px e define apenas `padding-top: 0`. Ela permanece inerte nas páginas internas atuais e prepara a adoção futura pelo V7B, sem alterar `NAV_HTML`, links, IDs, idioma, busca, autenticação, VLibras, utilitários ou registro do Service Worker.

As 13 páginas públicas ativas passaram a usar o token `?v=site-public-v7a-20260716` na tag clássica e síncrona:

```html
<script src="js/nav-shared.js?v=site-public-v7a-20260716"></script>
```

Não foram alterados `index.html`, páginas legadas, `portal-usuario.html`, páginas administrativas, páginas CMS/Firebase ou tokens de outros assets. A metadata foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`; o valor confirmado em `js/site-meta.js` é `updatedAt: "2026-07-17T08:56:35-03:00"`.

### Home preservada

- `index.html` permaneceu byte a byte sem alteração no V7A.
- A home ainda não carrega `js/nav-shared.js` e continua usando sua navegação própria.
- `body.home-page` continua com `padding-top: 0` no desktop.
- Os módulos R1–R5 continuam carregando normalmente.
- Nenhum cutover foi iniciado; V7B continua não executado.
- Os módulos sobreviventes `js/home-eventos.js`, `js/home-experiencias.js` e `js/home-contato.js` não foram alterados.
- `js/home-i18n.js`, `js/home-utilitarios.js` e `js/home-acessibilidade.js` permanecem fisicamente disponíveis para o V7B e rollback conforme o escopo aprovado.

### Validações registradas

As validações funcionais foram realizadas antes do registro desta governança e não foram repetidas nesta tarefa. Foram registrados: `node --check js/nav-shared.js`; `git diff --check`; exatamente uma ocorrência de `body.home-page` dentro do `@media (min-width: 769px)` com somente `padding-top: 0`; 13 ocorrências do token novo nas páginas autorizadas; ausência do token novo na home, páginas legadas e `portal-usuario`; remoção do token antigo das 13 páginas ativas; ausência de diff em `index.html`; e ausência de alterações em CSS externo, `translations.js` e `sw.js`.

O smoke detalhado em `noticias.html`, `mapa-turistico.html` e `eventos.html`, além do smoke básico nas demais páginas ativas, confirmou navegação desktop/mobile, padding interno aproximado de 132px, logo, dropdowns, menu mobile, scroll lock, Escape, links, PT/EN, persistência `sms-lang`, opção `.lang-option.active`, busca, autenticação não logada, VLibras, barra eMAG, progresso, voltar ao topo e Leaflet. Network e console não apresentaram 404, ReferenceError, TypeError, SyntaxError ou Promise rejection novos; os erros conhecidos de App Check/ReCAPTCHA e Firestore em localhost permanecem ambientais.

### Publicação, cache e Service Worker

O GitHub Pages foi publicado e validado antes deste registro. A verificação HTTP somente leitura respondeu 200 para a página pública e 200 para `noticias.html`; a página `noticias.html` serviu exatamente `js/nav-shared.js?v=site-public-v7a-20260716`.

`js/nav-shared.js` permanece em `NEVER_CACHE`; HTML e navegações permanecem fora do cache do Service Worker; `sw.js` permaneceu intacto; `CACHE_NAME` permaneceu intacto; não houve bump de `CACHE_NAME`; o V7A usou somente o novo token `?v=`; páginas legadas e `portal-usuario` ficaram fora da renovação.

### Estado após o V7A

- V7-PREP — concluído.
- V7A — concluído, validado, commitado, enviado por push e publicado.
- V7B — próximo microbloco, cutover atômico da home, risco alto, não iniciado; depende de autorização humana explícita, escopo aprovado, deploy e validação em produção antes do bloco seguinte.
- V7C1 — não iniciado.
- V7C2 — não iniciado.
- V6 — pendente.
- B3 — pendente.
- V5D — pendente.
- Admin/CMS/Firebase — pausado.

### Pendências preservadas

Permanecem documentados: handler de resize do drawer; skip link Alt+3 ausente no shared; consolidação futura do VLibras; limpeza de CSS no V7C2; V5C3; V5D; CSS órfão `.map-modal-*`; CSS órfão `.agrosamas-banner`; mídia pesada; B3; correção futura de `TURISMO_EVENTOS` para Rua do Mathe; virada anual de eventos; duplicação potencial entre fontes de eventos; revisão editorial do destaque após 30/08/2026; Formspree externo e não bloqueante. O endpoint continua `xpqykpqd`, o Workflow temporário continua em `imprensapmsms@gmail.com`, `turismo@saomateusdosul.pr.gov.br` permanece `PENDING` e nenhum envio real deve ocorrer antes de `VERIFIED`.

### Escopo desta atualização documental

- Alterados somente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`.
- `.claude/settings.local.json` permaneceu não rastreado e intocado.
- Não foram executados `node scripts/update-site-meta.mjs`, V7B, V7C1, V7C2, V6, B3, commit, push ou deploy nesta atualização.
- A sugestão de mensagem para um futuro commit desta governança é: `docs: registrar conclusão do V7A`.

---

## 2026-07-16 — Conclusão do V7-PREP e aprovação da estratégia do V7

**Ferramenta/modelo:** Claude Fable 5 (Claude Code)
**Responsável pela aprovação:** Jacob
**Status:** aplicado (governança-only, sem commit nesta atualização)

### Objetivo

Registrar oficialmente a conclusão do V7-PREP — bloco exclusivamente de leitura, diagnóstico, comparação, experimento em memória e planejamento — e as cinco decisões humanas aprovadas para a futura execução do V7. Nenhum arquivo de código, HTML, CSS, JavaScript de runtime, dado, metadata, Service Worker, tag Git, Admin/CMS/Firebase ou artefato de auditoria foi alterado, nem durante o V7-PREP, nem nesta governança.

### Diagnóstico consolidado do V7-PREP

- A navegação da home (`index.html`) permanece mantida separadamente; as 17 páginas internas usam `js/nav-shared.js` (13 ativas com token `?v=site-public-b1-20260708`, 3 legadas e `portal-usuario` com tokens antigos, fora do bloco).
- A duplicação da navegação é a principal dívida estrutural remanescente após a Fase 1. A execução do V7 possui risco alto.
- O desktop já tem paridade visual quase total (computed styles da home: nav `top:36px`, logo 70px, padding `1rem 2rem` — iguais aos do shared). As divergências críticas são o offset do body no desktop (shared impõe `padding-top:132px`; a home desenha com 0) e o breakpoint mobile (home 1180px vs shared 968px).
- O guard `#mainNav` do nav-shared não protege a home atual, pois o `<nav>` da home não tem esse `id`; o trilho da barra de progresso é injetado sem guard.

### Experimento temporário em memória (browser local, desfeito por reload)

Carregar a home atual e injetar `js/nav-shared.js` pelo console produziu: dois headers/navs, dois `#navToggle`, dois `#navLinks`, dois seletores de idioma (`#currentLang`/`#langDropdown`), dois modais de busca (`#searchModal`), duas barras de acessibilidade, duas barras de progresso (`#sms-scroll-*`), duas faixas de atalhos mobile, IDs duplicados em série e aumento indevido de 132px no padding superior do body (hero empurrado). Os guards de VLibras e do `#backToTop` funcionaram (1 instância cada). Conclusão: **a coexistência é inviável; não haverá migração gradual ingênua; o cutover do chrome da home deverá ser atômico, precedido por bloco de compatibilidade isolado.**

### Estratégia aprovada (V7A → V7B → V7C1 → V7C2)

- **V7A — compatibilidade do nav-shared (risco baixo-médio):** preparar `js/nav-shared.js` para uso futuro na home, adicionando exceção de padding para `body.home-page` no desktop no CSS injetado; atualizar o token `?v=` das tags ativas de nav-shared; manter `index.html` completamente intacto; testar as páginas internas.
- **V7B — cutover atômico da home (risco alto):** substituir a navegação própria pelo nav-shared, removendo no mesmo commit o chrome estático da navegação, o menu hamburger inline, o modal de busca estático, o overlay estático, a barra de progresso estática, o botão voltar ao topo estático, as tags de `js/home-i18n.js` e `js/home-utilitarios.js` e a tag duplicável de `scroll-animations.js` (o guard do shared é por `id`, não por `src`); manter fisicamente os módulos aposentáveis no disco para rollback; manter `js/home-acessibilidade.js` durante o cutover; alinhar o breakpoint mobile da home.
- **V7C1 — limpeza de runtime (risco baixo):** excluir fisicamente `js/home-i18n.js` e `js/home-utilitarios.js`; reduzir `js/home-acessibilidade.js` a `prefers-reduced-motion`/pausa do vídeo e atalhos Alt+1..4; revisar o registro duplicado do Service Worker.
- **V7C2 — limpeza de CSS (risco médio, bloco separado):** remover somente CSS comprovadamente órfão após o cutover — regras antigas da navegação, `.language-dropdown.active`, drawers antigos — e avaliar `.map-modal-*` e `.agrosamas-banner`. Separado devido à complexidade de `css/index.css` e seus ~743 `!important`.

Cada microbloco exige metadata, commit próprio, governança própria e deploy com teste em produção antes do microbloco seguinte.

### Decisões humanas aprovadas

1. **Link "Início":** adota o destino `/`; aceita-se que clicar em Início estando na home recarregue a página em vez de rolar até `#map-hero`, priorizando paridade e manutenção única.
2. **Idioma do primeiro acesso:** prevalece a detecção do idioma preferencial do navegador feita por `translations.js`; PT deixa de ser forçado quando `sms-lang` estiver ausente. PT/EN/ES/PL continuam disponíveis e a seleção manual continua persistida em `sms-lang`.
3. **Área restrita:** a home adota o comportamento dinâmico do nav-shared — usuário não autenticado vê o acesso normal; usuário com `smsUserSession` vê nome e opção de saída. Somente leitura de `localStorage`; não reativa Admin/CMS/Firebase.
4. **Breakpoint:** a navegação da home é alinhada aos 968px do shared, eliminando a divergência da faixa 968–1180px; tablets em paisagem passam a usar a navegação desktop.
5. **Acessibilidade:** `js/home-acessibilidade.js` é mantido durante o V7B e não é aposentado integralmente no cutover — o shared cobre fonte e contraste, mas não cobre a pausa do vídeo com `prefers-reduced-motion` nem os atalhos JS Alt+1..4 (incluindo Alt+3 da busca). No V7C1 o módulo será reduzido às responsabilidades que o shared não possui. Nenhuma regressão de acessibilidade deve ser aceita.

### Módulos e destinos

- Sobrevivem ao V7: `js/home-eventos.js`, `js/home-experiencias.js`, `js/home-contato.js`.
- Tags removidas no V7B, arquivos preservados até o V7C1: `js/home-i18n.js`, `js/home-utilitarios.js`.
- Mantido no V7B e reduzido no V7C1: `js/home-acessibilidade.js`.
- Removido no V7B: bloco inline do menu hamburger.
- `translations.js` permanece intacto como fonte compartilhada; `window.applyTranslations` e `translationsApplied` permanecem contratos obrigatórios.
- VLibras: o bloco estático da home permanece no V7B; os guards do shared impedem segunda instância; consolidação eventual fica para o V7C1 ou follow-up.
- Busca: `search.js` e `search-index.js` intactos; o modal estático da home sai no V7B e o modal injetado pelo shared vira a única instância.

### Cache

`js/nav-shared.js` pertence a `NEVER_CACHE` no Service Worker; HTML e navegações não são cacheados pelo SW; `sw.js` e `CACHE_NAME` não deverão ser alterados em V7A ou V7B. O V7A usará novo token `?v=` nas tags de nav-shared das páginas ativas; páginas legadas e `portal-usuario` ficam fora do bloco. `home-i18n.js`, `home-utilitarios.js` e `home-acessibilidade.js` permanecem fisicamente no disco durante o V7B para facilitar rollback.

### Riscos e follow-ups preservados

- O nav-shared não fecha automaticamente o drawer ao redimensionar para desktop (edge case; follow-up pós-V7).
- O skip link Alt+3 não existe no shared (coberto pelo `home-acessibilidade.js` mantido).
- `css/index.css` possui ~743 ocorrências de `!important` — motivo do V7C2 separado.
- O VLibras estático poderá ser consolidado depois.
- O bug das duas opções `.lang-option.active` após reload será corrigido naturalmente pelo shared no cutover.
- Nenhuma dessas melhorias adicionais deve ser misturada ao V7A.

### Estado após esta governança

V7-PREP concluído; estratégia do V7 aprovada; cinco decisões humanas aprovadas; **V7A é o próximo microbloco e ainda não foi iniciado**; V7B, V7C1 e V7C2 não iniciados; V6 e B3 pendentes; V5D pendente e não urgente; correção de `TURISMO_EVENTOS`/AgroSamas fora do V7; Admin/CMS/Firebase pausado. A tag `pos-fase1-modular` segue protegendo o estado anterior ao V7.

### Arquivos alterados

- `CLAUDE.md` — registro do V7-PREP, estratégia V7A→V7B→V7C, contrato `body.home-page`, módulos preservados/aposentáveis e decisões aprovadas.
- `TASKS.md` — V7-PREP concluído, cinco decisões, V7A como próximo passo, riscos por microbloco e requisitos de deploy/teste entre microblocos.
- `CHANGELOG_AI.md` — este registro.

---

## 2026-07-16 — Checkpoint pós-Fase 1

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (governança-only, sem commit nesta atualização)

### Objetivo

Registrar oficialmente o checkpoint técnico e arquitetural pós-Fase 1, preservando a decisão de não iniciar automaticamente qualquer fase posterior. Nenhum arquivo de runtime, dado, auditoria, Admin/CMS/Firebase, Service Worker, tag ou metadata foi alterado.

### Resultado consolidado

- A Fase 1 modular foi concluída e não há extração a reverter. Os módulos são `js/home-eventos.js`, `js/home-experiencias.js`, `js/home-contato.js`, `js/home-utilitarios.js`, `js/home-acessibilidade.js` e `js/home-i18n.js`.
- O checkpoint foi concluído somente em leitura. A tag `pos-fase1-modular` está publicada localmente e remotamente e aponta para o commit de governança `3c9caee docs: registrar conclusão do R5B e da Fase 1`.
- `index.html` está em aproximadamente 1.712 linhas e 99 KB, com cerca de 220 linhas de JavaScript inline, redução aproximada de 31% desde `pos-v5-checkpoint`. O principal bloco inline restante é o menu hamburger, reservado ao V7.
- A avaliação confirmou responsabilidades coerentes, ausência de fragmentação excessiva e redução objetiva do efeito Frankenstein. O gargalo estrutural principal passou a ser a duplicação da navegação; CSS e mídia permanecem gargalos relevantes.

### Validação e decisão

- Foram consolidados os testes de home em desktop/mobile, PT/EN/ES/PL, acessibilidade, eventos, carrossel, formulário sem POST, clima, busca, tema, mascote, progresso, voltar ao topo e smoke test das páginas públicas.
- Não foram encontrados `ReferenceError`, `TypeError`, `SyntaxError` ou 404 novos. Os erros de App Check/ReCAPTCHA em localhost permanecem ambientais e conhecidos.
- O próximo bloco aprovado é `V7-PREP`, somente leitura e planejamento. `V7-EXEC` não foi iniciado nem autorizado; V6 e B3 permanecem pendentes. Após o `V7-PREP`, haverá nova decisão humana sobre os microblocos de execução.
- Arquivos `js/home-*.js` são atendidos pelo runtime cache e `translations.js` participa do cache/precache. Alterações futuras nesses arquivos exigem avaliar novo token `?v=` ou nova versão de `CACHE_NAME`; o cache não foi alterado nesta tarefa.

### Decisão de conteúdo conhecida

- O local correto do AgroSamas foi confirmado humanamente como `Rua do Mathe`.
- `TURISMO_EVENTOS/js/data/eventos.js` ainda registra `Parque de Exposições`. Essa referência é uma inconsistência de dados conhecida, não uma dúvida editorial.
- O alinhamento para `Rua do Mathe` deverá ocorrer futuramente em bloco exclusivo de dados, fora do `V7-PREP`. Nenhum arquivo de dados, `TURISMO_EVENTOS`, `eventos-2026.json` ou `js/data/*` foi alterado nesta atualização.

### Pendências preservadas

- V5C3, V5D, CSS órfão `.map-modal-*` e `.agrosamas-banner`, chaves i18n órfãs, `CONFIG.agrosamas` sem efeito na home, vídeo hero de 32 MB, `translations.js` síncrono, imagens/mídias possivelmente órfãs, `avaliacoes.js` síncrono, notícias hard-coded duplicadas, virada anual de `eventos-2026.json`, possível duplicação entre `eventos-2026.json` e `TURISMO_EVENTOS`, revisão do destaque do 32º Mês Polonês após 30/08/2026 e a pendência externa do Formspree permanecem documentados.
- Admin/CMS/Firebase continua pausado. Não foram iniciados V6, V7, V7-EXEC ou B3.

### Arquivos alterados

- `CLAUDE.md` — checkpoint pós-Fase 1, decisão `V7-PREP` e nota curta sobre AgroSamas.
- `TASKS.md` — métricas atuais, próximo bloco, regra de cache e decisão de dados.
- `CHANGELOG_AI.md` — este registro e correção da nota de status do registro anterior do R5B.

### Nota de correção histórica

O registro anterior do R5B não deve ser interpretado como “aplicado sem commit”: o commit de governança `3c9caee` existe e registra a conclusão do R5B e da Fase 1. O status abaixo foi corrigido para refletir esse fato; a ausência de commit mencionada neste novo registro refere-se somente à atualização documental atual.

---

## 2026-07-16 — Registro de R5B e encerramento da Fase 1

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado e commitado no commit de governança `3c9caee`

### Objetivo

Registrar exclusivamente na governança a conclusão do R5B e o encerramento oficial da Fase 1 da refatoração modular progressiva da home. Nenhum teste de runtime, alteração de código, push ou deploy foi executado nesta atualização documental; o registro foi posteriormente preservado no commit de governança `3c9caee`.

### Resultado consolidado

- R5B foi concluído, validado, commitado, enviado por push e publicado com sucesso. O commit funcional confirmado no Git é `21564847d5b74697affcbfd68ba99c6fcbdb0340 refactor(home): extrai runtime i18n do seletor de idiomas para modulo dedicado`, presente em `origin/main`.
- `git show --stat --oneline --decorate --no-renames 2156484` confirmou somente os arquivos esperados: `index.html`, `js/home-i18n.js` e `js/site-meta.js`, com `170 insertions(+)` e `165 deletions(-)`. `js/home-i18n.js` foi criado, o runtime inline foi removido de `index.html` e `js/site-meta.js` foi atualizado antes do commit funcional.
- A tag registrada em `index.html` é `<script src="js/home-i18n.js?v=site-public-b1-20260708"></script>`. O contrato crítico foi preservado: sem `defer`, sem `async` e sem `type="module"`.
- A ordem de inicialização permanece histórica: `translations.js` síncrono no head; depois, no body, o menu hamburger inline; `js/home-i18n.js` síncrono; e então `js/home-acessibilidade.js`, `js/home-contato.js`, `js/home-experiencias.js` e `js/home-eventos.js` com `defer`.
- O primeiro acesso sem `sms-lang` continua terminando em PT, com `🇧🇷 PT` no botão e `document.documentElement.lang` em `pt-BR`. O motivo do carregamento clássico — preservar a ordem entre `translations.js` e o runtime da home — fica registrado como decisão consciente.
- `translations.js` permaneceu intacto. `sms-lang`, `window.translations`, `window.applyTranslations` e o evento `translationsApplied` foram preservados. PT/EN/ES/PL, ciclo de idiomas, persistência após reload, atributos do seletor, placeholders, aria-labels, conteúdo dinâmico, busca, clima, tema sazonal, mascote e menu mobile foram validados no R5B.
- R1, R2, R3, R4B, R4A e R5A permaneceram intactos. V4D permanece concluído e absorvido pelo R5A.

### Encerramento oficial da Fase 1

1. R1 — eventos: concluído.
2. R2 — carrossel de experiências: concluído.
3. R3 — formulário de contato: concluído.
4. R4B — utilitários visuais: concluído.
5. R4A — acessibilidade eMAG: concluído.
6. R5A — remoção do fallback inline obsoleto: concluído.
7. R5B — externalização do runtime i18n: concluído.
8. Fase 1 da refatoração modular: concluída.

A Fase 1 foi concluída sem reescrever a home do zero. A estratégia de refatoração modular progressiva no projeto atual foi preservada, a dívida de JavaScript inline foi significativamente reduzida e cada responsabilidade foi separada em módulo próprio. `js/home-i18n.js` poderá ser aposentado ou absorvido futuramente no V7.

### Próximas decisões e pendências

- Nenhuma etapa da Fase 2 foi iniciada. O próximo passo registrado é somente um checkpoint/decisão pós-Fase 1.
- V6, V7 e B3 permanecem pendentes; não foram iniciados automaticamente. V7 continua sendo bloco de alto risco para unificação da navegação e deve receber decisão própria; V6 deve ser reavaliado após a fundação modular; B3 mídia/performance continua reservado para depois.
- V5C3, V5D, CSS órfão `.map-modal-*`, CSS órfão `.agrosamas-banner`, chaves i18n órfãs, `CONFIG.agrosamas` temporariamente sem efeito na home, revisão editorial do destaque do 32º Mês Polonês após 30/08/2026, virada anual de `eventos-2026.json`, possível duplicação entre `eventos-2026.json` e `TURISMO_EVENTOS` e demais follow-ups existentes permanecem documentados.
- O follow-up de duas opções `.lang-option.active` após reload permanece reservado para V7 e não foi corrigido nesta governança.
- Admin/CMS/Firebase continua pausado.

### Pendência externa do Formspree

- O endpoint permanece `xpqykpqd`.
- O Workflow continua temporariamente direcionado para `imprensapmsms@gmail.com`.
- O endereço institucional obrigatório `turismo@saomateusdosul.pr.gov.br` permanece `PENDING` em Linked Emails e depende de confirmação por outro setor.
- Nenhum envio real deve ocorrer antes de `VERIFIED`.
- Após `VERIFIED`, a troca deve ocorrer somente no painel do Formspree: Forms > TURISMO > Workflow > Email; selecionar o endereço institucional; salvar mantendo a ação Enabled; realizar um único envio institucional controlado; confirmar o recebimento institucional; e confirmar que o Gmail antigo deixou de receber. Não serão necessários código, metadata, commit ou deploy.

### Arquivos alterados

- `CLAUDE.md` — estado do R5B, contrato de carregamento, encerramento da Fase 1 e checkpoint pós-Fase 1 atualizados.
- `TASKS.md` — estado atual, bloco concluído, Fase 1 encerrada, próximas decisões e pendências atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -20
git rev-parse 2156484
git show --stat --oneline --decorate --no-renames 2156484
git show --format= --name-status --no-renames 2156484
git merge-base --is-ancestor 2156484 origin/main
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
```

### Validações e limites

- [x] Working tree inicial sem alterações rastreadas pendentes; `.claude/settings.local.json` não rastreado foi identificado e permaneceu intocado.
- [x] Commit funcional R5B confirmado no histórico e presente em `origin/main`.
- [x] Commit de governança do R5A (`33be2e1`) e commits funcionais/de governança anteriores da Fase 1 confirmados no histórico recente.
- [x] `git show` confirmou os três arquivos e as estatísticas reais do R5B, sem mudança inesperada.
- [x] R5B foi somente registrado nesta governança; as validações funcionais foram concluídas antes desta atualização e não foram executadas novamente.
- [x] Nenhum código, HTML, CSS, JavaScript de runtime, dados, metadata, regras, Admin/CMS/Firebase, service worker, sitemap, robots, `.claude/*` ou `docs/auditoria-output/*` foi alterado nesta atualização.
- [ ] Commit, push e deploy desta atualização de governança — não executados por escopo.

### Próximo passo

- Fazer somente uma decisão/checkpoint pós-Fase 1. Não iniciar automaticamente Fase 2, V6, V7 ou B3.

---

## 2026-07-16 — Registro de R5A na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar oficialmente a conclusão do R5A da refatoração modular progressiva da home, sem executar novamente alterações ou testes de runtime.

### Resultado consolidado

- R5A foi concluído, validado, commitado, enviado por push e publicado com sucesso. O commit funcional confirmado no `git log` é `55615cd0d0c25db647d9ed0d04decca8e0ea7eb9 refactor(home): remove dicionario fallback inline obsoleto de traducoes`, e o commit está presente em `origin/main`.
- O dicionário fallback inline obsoleto e duplicado pt/en/es/pl foi removido de `index.html`, com aproximadamente 174 linhas do fallback eliminadas. A declaração final foi preservada exatamente como `var translations = window.translations || {};`.
- `translations.js` permaneceu intacto e preserva cobertura completa das chaves da home em PT, EN, ES e PL, com aproximadamente 906 chaves por idioma e nenhuma chave do markup dependente do fallback removido.
- O runtime inline do seletor permaneceu intacto, incluindo `sms-lang`, `window.applyTranslations`, `translationsApplied`, IIFE, `'use strict'`, `ready()`, mapas, dropdown, listeners, aplicação inicial e caminhos de degradação.
- PT/EN/ES/PL, ciclo PT → EN → ES → PL → PT, bandeira/sigla, `aria-label`/`title`, placeholders, aria-labels do carrossel, reações ao evento `translationsApplied`, `document.documentElement.lang` e persistência após reload foram validados.
- R1, R2, R3, R4A e R4B permaneceram intactos. Nenhuma tag ou módulo novo foi criado neste bloco. A atualização de `js/site-meta.js` ocorreu antes do commit funcional com `node scripts/update-site-meta.mjs`.

### Estado da Fase 1

1. R1 — eventos: concluído.
2. R2 — carrossel: concluído.
3. R3 — formulário: concluído.
4. R4B — utilitários visuais: concluído.
5. R4A — acessibilidade eMAG: concluído.
6. R5A — remoção do fallback obsoleto: concluído.
7. R5B — externalização do runtime i18n para `js/home-i18n.js`: próximo microbloco, ainda não iniciado.

- V4D foi absorvido e concluído pelo R5A; não permanece como pendência ativa duplicada.
- Antes de qualquer `R5B-EXEC`, usar o escopo definido pelo `R5-PREP` somente em análise.
- `js/home-i18n.js` deverá ser carregado sem `defer`, na mesma posição atual do bloco inline, depois do menu hamburger e antes de `js/home-acessibilidade.js`.
- R5B não foi iniciado nesta atualização.

### Validação funcional registrada e limites

- As validações funcionais do R5A foram concluídas previamente e apenas registradas nesta atualização; nenhum teste de runtime foi executado novamente.
- A degradação com bloqueio direto de `translations.js` não pôde ser reproduzida no ambiente; foi validada por simulação equivalente, com retorno silencioso, markup original em PT, sem tela vazia e sem TypeError.
- O follow-up de duas opções `.lang-option.active` após reload fica registrado para V7; não foi corrigido no R5A nem nesta governança.

### Pendências preservadas

- Admin/CMS/Firebase continua pausado.
- V6 e V7 continuam posteriores à Fase 1; B3 permanece em fase própria.
- V5C3 e V5D continuam pendentes.
- CSS órfão `.map-modal-*` e `.agrosamas-banner` permanece como frente paralela.
- A revisão editorial do destaque do 32º Mês Polonês após 30/08/2026 permanece pendente.
- A pendência externa do Formspree permanece: endpoint `xpqykpqd`, Workflow em `imprensapmsms@gmail.com`, `turismo@saomateusdosul.pr.gov.br` em `PENDING` e nenhum envio real antes de `VERIFIED`.

### Arquivos alterados

- `CLAUDE.md` — estado permanente do R5A, V4D absorvido, R5B como próximo microbloco e regra sem `defer` atualizados.
- `TASKS.md` — estado atual, Fase 1, R5A concluído, R5B não iniciado e pendências atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -15
git show -s --format=fuller 55615cd
git show --stat --oneline 55615cd
git merge-base --is-ancestor 55615cd origin/main
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git diff -- .claude
git status --short --untracked-files=all
```

### Validações e limites

- [x] Working tree inicial sem alterações rastreadas pendentes; `.claude/settings.local.json` não rastreado foi identificado e permaneceu intocado.
- [x] Commit funcional R5A confirmado no histórico e presente em `origin/main`.
- [x] Commit de governança do R4A (`f70e1af`) e commits funcionais anteriores da Fase 1 confirmados no histórico.
- [x] `git diff --check` aprovado.
- [x] Somente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md` foram alterados nesta atualização.
- [x] Nenhum código, HTML, CSS, JavaScript de runtime, `index.html`, `js/site-meta.js`, `translations.js`, dados, regras, Admin/CMS/Firebase, service worker, sitemap, robots, `.claude/*` ou `docs/auditoria-output/*` foi alterado nesta atualização.

### Próximo passo

- Manter R5B como próximo microbloco, sem iniciá-lo nesta governança; usar primeiro o escopo do R5-PREP e preservar o carregamento sem `defer`.

---

## 2026-07-16 — Registro de R4A na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar oficialmente a conclusão do R4A da refatoração modular progressiva da home, sem executar novamente testes de runtime, atualizar metadata, alterar código ou publicar novamente.

### Resultado consolidado

- R4A foi concluído, validado, commitado, enviado por push e publicado com sucesso. O commit funcional confirmado no histórico é `db1b3cb refactor(home): extrai acessibilidade eMAG para modulo dedicado`.
- `js/home-acessibilidade.js` foi criado como módulo dedicado para a extração comportamental 1:1 da acessibilidade eMAG: tamanho da fonte, alto contraste, restauração das preferências via `localStorage`, `prefers-reduced-motion` nos vídeos e atalhos Alt+1..4.
- Aproximadamente 97 linhas de JavaScript inline foram removidas de `index.html`; não houve mudança visual ou funcional. A referência usa `defer` e `?v=site-public-b1-20260708`, posicionada imediatamente antes de `js/home-contato.js`, mantendo a ordem R4A, R3, R2 e R1 dos módulos da home.
- `window.changeFontSize` e `window.toggleContrast` foram preservadas explicitamente para o markup com `onclick`; `currentFontSize` permaneceu privado dentro da IIFE. O contrato `sms-font-size`/`sms-high-contrast`, fonte, contraste, reduced motion, vídeo e atalhos foi preservado.
- R1, R2, R3 e R4B permaneceram intactos. Markup e CSS permaneceram intactos. R4A e R4B continuam módulos separados por responsabilidade.
- A metadata da última atualização do site havia sido atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`. GitHub Pages foi publicado e validado na validação funcional anterior ao registro.

### Validação funcional registrada

- Validações previamente concluídas foram apenas registradas nesta atualização: `node --check js/home-acessibilidade.js`, `git diff --check`, preservação do markup e dos atributos `onclick`, funções globais preservadas, `window.currentFontSize` indefinido, carregamento único, ausência de 404 novo, fonte, contraste, atalhos e reduced motion preservados.
- Nenhum teste de runtime foi executado novamente nesta atualização. Nenhum envio real do Formspree foi realizado.

### Estado da Fase 1 e limites mantidos

1. R1 — eventos: concluído.
2. R2 — carrossel: concluído.
3. R3 — formulário: concluído.
4. R4B — utilitários visuais: concluído.
5. R4A — acessibilidade eMAG: concluído.
6. R5 — i18n/fallback inline: próximo bloco, ainda não iniciado e por último.

- Antes de qualquer `R5-EXEC`, deverá existir um `R5-PREP` somente em análise.
- Admin/CMS/Firebase continua pausado.
- V6 e V7 continuam somente após a fundação modular; B3 permanece em fase própria.
- V4D, V5C3 e V5D continuam pendentes.
- O CSS órfão `.map-modal-*` e `.agrosamas-banner` continua como frente paralela.
- A revisão editorial do destaque do 32º Mês Polonês após 30/08/2026 continua pendente.
- A pendência externa do Formspree permanece integralmente: Workflow em `imprensapmsms@gmail.com`, `turismo@saomateusdosul.pr.gov.br` em `PENDING`, nenhum envio real antes de `VERIFIED` e troca posterior somente no painel.
- R5, V6, V7 e B3 não foram executados nesta atualização de governança.

### Arquivos alterados

- `CLAUDE.md` — estado permanente de R4A, separação R4A/R4B e R5 como próximo bloco atualizados.
- `TASKS.md` — estado atual, Fase 1, R4A concluído, `R5-PREP` e pendências atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -15
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações e limites

- [x] Working tree inicial sem alterações rastreadas pendentes; `.claude/settings.local.json` não rastreado foi identificado e permaneceu intocado.
- [x] Commit funcional `db1b3cb` confirmado no histórico.
- [x] Commit de governança do R4B `ab94b13` confirmado no histórico.
- [x] Commits funcionais de R1 (`efe6c11`), R2 (`6e126cd`) e R3 (`9d9a8ef`) confirmados no histórico.
- [x] Apenas `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md` foram alterados nesta atualização.
- [x] Nenhum código, HTML, CSS, JavaScript de runtime, metadata, dado, regra, Admin/CMS/Firebase, service worker, sitemap, robots ou artefato de auditoria foi alterado.

### Próximo passo

- Preparar futuramente o `R5-PREP` somente em análise; não executar `R5-EXEC`, V6, V7 ou B3 automaticamente.

---

## 2026-07-15 — Registro de R4B na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar oficialmente a conclusão do R4B da refatoração modular progressiva da home, sem alterar runtime, código funcional ou publicação.

### Resultado consolidado

- R4B foi concluído, validado, commitado, enviado por push e publicado com sucesso. O commit funcional presente no histórico é `b272330 refactor(home): extrai utilitarios visuais para modulo dedicado`.
- `js/home-utilitarios.js` foi criado como módulo dedicado para a extração comportamental 1:1 dos utilitários visuais da home: barra de progresso de rolagem e botão “Voltar ao topo”. Aproximadamente 36 linhas inline foram removidas de `index.html`, sem mudança visual ou funcional.
- A referência adicionada foi `<script src="js/home-utilitarios.js?v=site-public-b1-20260708" defer></script>`, no mesmo ponto do bloco anterior: depois do init do VLibras e antes do menu hamburger. As variáveis ficaram privadas em IIFE, sem export, sem propriedade em `window` e sem nova dependência.
- Foram preservados busca e null-checks dos elementos, listener de scroll passivo, cálculos de `scrollTop`/`docHeight`, proteção contra divisão por zero, `Math.round`, atualização de `style.width`, segundo listener de scroll, limiar de 300px, classe `visible`, clique e `window.scrollTo({ top: 0, behavior: 'smooth' })`. Não foram introduzidos `requestAnimationFrame`, debounce, throttle ou tratamento novo para `prefers-reduced-motion`.
- R1, R2 e R3 permaneceram intactos. Menu hamburger, seletor de idiomas, barra eMAG, fonte, contraste, atalhos, i18n e acessibilidade eMAG permaneceram intactos.
- A metadata da última atualização do site foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`.

### Validação funcional registrada

- `node --check js/home-utilitarios.js` aprovado.
- `git diff --check` aprovado.
- Uma única referência a `js/home-utilitarios.js`; módulo carregado uma única vez; nenhum 404 novo.
- Barra de progresso validada em 0% no topo, valor intermediário no meio e aproximadamente 100% no final.
- Botão validado oculto antes de 300px, visível depois de 300px, retornando ao topo no clique e ocultando novamente no topo.
- Comportamento validado em desktop e mobile; menu hamburger, seletor de idiomas, barra eMAG, fonte, contraste, atalhos, R1, R2 e R3 permaneceram funcionais.
- Nenhum POST real foi executado no formulário; GitHub Pages foi publicado e validado.

### Estado da Fase 1 e limites mantidos

1. R1 — eventos: concluído.
2. R2 — carrossel: concluído.
3. R3 — formulário: concluído.
4. R4B — utilitários visuais: concluído.
5. R4A — acessibilidade eMAG: próximo microbloco, ainda não iniciado.
6. R5 — i18n/fallback inline: posterior e por último.

- R4A permanece restrito a fonte, contraste, restauração via `localStorage`, `prefers-reduced-motion`/vídeo e atalhos Alt+1..4. Deverá preservar explicitamente `window.changeFontSize` e `window.toggleContrast`, pois quatro atributos `onclick` da home dependem dessas funções globais.
- Admin/CMS/Firebase continua pausado.
- V6 e V7 continuam somente após a fundação modular; B3 permanece em fase própria.
- V4D, V5C3 e V5D continuam pendentes.
- O CSS órfão `.map-modal-*` e `.agrosamas-banner` permanece como frente paralela.
- A revisão editorial do destaque do 32º Mês Polonês após 30/08/2026 permanece pendente.
- A pendência do Formspree permanece: Workflow temporariamente em `imprensapmsms@gmail.com`; `turismo@saomateusdosul.pr.gov.br` continua `PENDING`; nenhum envio real até a troca do Workflow.
- R4A, R5, V6, V7 e B3 não foram executados nesta atualização de governança.

### Arquivos alterados

- `CLAUDE.md` — estado permanente de R4B, separação R4A/R5 e próximos caminhos atualizados.
- `TASKS.md` — estado atual, Fase 1, R4B concluído, R4A como próximo microbloco e pendências atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -12
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações e limites

- [x] Working tree inicial sem alterações rastreadas pendentes.
- [x] Commit funcional `b272330` presente no histórico.
- [x] Commits funcionais de R1 (`efe6c11`), R2 (`6e126cd`) e R3 (`9d9a8ef`) presentes no histórico.
- [x] `.claude/settings.local.json` identificado como não rastreado e mantido intocado.
- [x] Apenas `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md` foram alterados nesta atualização.
- [x] Nenhum código, HTML, CSS, JavaScript de runtime, dado, regra, Admin/CMS/Firebase, service worker, sitemap, robots ou artefato de auditoria foi alterado.

### Próximo passo

- Planejar R4A como microbloco separado, restrito à acessibilidade eMAG, após escopo explícito; não executar R4A, R5, V6, V7 ou B3 automaticamente.

---

## 2026-07-13 — Registro de R3 na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar oficialmente a conclusão do R3 da refatoração modular progressiva da home, sem alterar runtime, código funcional ou publicação.

### Resultado consolidado

- R3 foi concluído, validado, commitado, enviado por push e publicado com sucesso. O commit funcional presente no histórico é `9d9a8ef refactor(home): extrai formulario de contato para modulo dedicado`.
- `js/home-contato.js` foi criado como terceiro módulo da Fase 1 para a extração comportamental 1:1 da lógica do formulário de contato; aproximadamente 58 linhas inline foram removidas de `index.html`, sem mudança funcional ou visual.
- A referência única adicionada foi `<script src="js/home-contato.js?v=site-public-b1-20260708" defer></script>`, posicionada antes de `js/home-experiencias.js` e `js/home-eventos.js`. A lógica permanece privada em IIFE, sem propriedade em `window`, export ou nova dependência.
- O endpoint `https://formspree.io/f/xpqykpqd` e o `FORMSPREE_ID` `xpqykpqd` foram preservados, assim como POST, headers Accept/Content-Type, `event.preventDefault()`, `FormData`, `Object.fromEntries()`, `JSON.stringify()`, `response.ok`, loading, mensagens, classes `form-status success/error`, reset somente no sucesso, timeout de 6000 ms, `console.error`, validação nativa e retornos silenciosos.
- R1 e R2 permaneceram intactos. Markup, CSS, `translations.js` e `config.js` permaneceram intactos.
- A metadata da última atualização do site foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`.

### Validação funcional registrada

- `node --check js/home-contato.js` aprovado.
- `git diff --check` aprovado.
- `FORMSPREE_ID` removido de `index.html`; uma única referência a `js/home-contato.js`; módulo carregado uma única vez.
- Validação HTML nativa `required` bloqueou submissão vazia.
- Nenhuma requisição POST e nenhum envio real foram realizados durante a validação.
- Console sem novo `ReferenceError` ou `TypeError`; carrossel de experiências continuou funcionando; grade “Acontece em breve” continuou com quatro cards.
- R1 e R2 permaneceram intactos; CSS, `translations.js`, `config.js` e markup permaneceram intactos; GitHub Pages foi publicado e validado.

### Pendência externa do Formspree

- O Workflow atual continua temporariamente entregando para `imprensapmsms@gmail.com`.
- O endereço institucional obrigatório `turismo@saomateusdosul.pr.gov.br` já foi adicionado em Linked Emails, mas o status permanece `PENDING` e depende de confirmação por outro setor.
- Nenhum envio real deve ocorrer enquanto permanecer `PENDING`.
- Após o status mudar para `VERIFIED`: abrir Forms > TURISMO > Workflow > Email; selecionar `turismo@saomateusdosul.pr.gov.br`; salvar mantendo a ação Enabled; realizar um único envio institucional controlado; confirmar recebimento no novo endereço; e confirmar que o Gmail antigo deixou de receber.
- A troca futura ocorrerá somente no painel do Formspree e não exigirá alteração de código, metadata, commit ou deploy.

### Estado da Fase 1 e limites mantidos

1. R1 — eventos: concluído.
2. R2 — carrossel: concluído.
3. R3 — formulário: concluído.
4. R4 — acessibilidade e utilitários visuais: próximo módulo, não iniciado nesta tarefa.
5. R5 — i18n/fallback inline: posterior e por último.

- Admin/CMS/Firebase continua pausado.
- V6 e V7 continuam somente após a fundação modular; B3 permanece em fase própria.
- V4D, V5C3 e V5D continuam pendentes.
- O CSS órfão `.map-modal-*` e `.agrosamas-banner` permanece como frente paralela.
- A revisão editorial do destaque do 32º Mês Polonês após 30/08/2026 permanece pendente.
- R4, R5, V6, V7 e B3 não foram executados nesta atualização de governança.

### Arquivos alterados

- `CLAUDE.md` — estado permanente de R3, separação dos módulos da Fase 1, pendência do Formspree e próximos caminhos atualizados.
- `TASKS.md` — estado atual, Fase 1, R3 concluído, R4 como próximo módulo e pendências atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -10
git show --stat --oneline 9d9a8ef
git show --stat --oneline 6e126cd
git show --stat --oneline efe6c11
git diff -- .claude
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações e limites

- [x] Working tree inicial sem alterações rastreadas pendentes.
- [x] Commit funcional `9d9a8ef` presente no histórico.
- [x] Commits funcionais de R1 (`efe6c11`) e R2 (`6e126cd`) presentes no histórico.
- [x] `.claude/settings.local.json` identificado como não rastreado e mantido intocado.
- [x] Apenas `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md` foram alterados nesta atualização.
- [x] Nenhum código, HTML, CSS, JavaScript de runtime, dado, regra, Admin/CMS/Firebase, service worker, sitemap, robots ou artefato de auditoria foi alterado.

### Próximo passo

- Planejar R4 em bloco separado, após escopo explícito; não executar R4, R5, V6, V7 ou B3 nesta atualização.

---

## 2026-07-13 — Registro de R2 na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar oficialmente R2 como o segundo módulo concluído da Fase 1 da refatoração modular progressiva da home.

### Resultado consolidado

- R2 extraiu comportamentalmente 1:1 o carrossel “Experiências em destaque” de `index.html` para `js/home-experiencias.js`, sem mudança visual ou funcional.
- Aproximadamente 57 linhas de JavaScript inline foram removidas de `index.html`; o novo arquivo tornou-se o segundo módulo da fundação modular.
- A referência adicionada em `index.html` usa `<script src="js/home-experiencias.js?v=site-public-b1-20260708" defer></script>` e foi posicionada antes de `js/home-eventos.js`.
- `initFeaturedExperiencesCarousel` permaneceu privada em IIFE, com listener próprio de `DOMContentLoaded`, sem função em `window`, export, `import()`, `fetch`, URL relativa ou nova dependência.
- Seletores `data-featured-*`, retorno silencioso, botões anterior/próximo, passo pela largura real do card, leitura de gap, fallback `Math.min(track.clientWidth, 320)`, `scrollBy`, `smooth/auto` conforme reduced motion, controles disabled e tolerância de 2px foram preservados.
- Click, ArrowLeft/ArrowRight com `preventDefault`, scroll passive, resize, atualização inicial, scroll/swipe nativo no mobile, responsividade, scroll-snap, tabindex e aria-labels traduzíveis foram preservados.
- R2 foi concluído, validado, commitado, enviado por push e publicado. O commit funcional presente no histórico é `6e126cd refactor(home): extrai carrossel de experiencias para modulo dedicado`.
- A data/hora da última atualização do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit funcional; o script não foi executado nesta atualização de governança.

### Separação R1/R2 e ordem da Fase 1

- R1 permaneceu intacto: `js/home-eventos.js` continua contendo somente a grade “Acontece em breve”.
- R2 contém somente o carrossel “Experiências em destaque” em `js/home-experiencias.js`.
- Acessibilidade e utilitários visuais permanecem inline para o futuro R4.
- R3, destinado ao formulário, passa a ser o próximo módulo, mas não foi iniciado nesta tarefa.
- R4 e R5 permanecem posteriores; R5 continua reservado ao i18n/fallback inline por último e com maior sensibilidade.

### Pendências e limites mantidos

- Admin/CMS/Firebase continua pausado.
- V6 e V7 continuam somente após a fundação modular; B3 permanece em fase própria.
- V4D, V5C3 e V5D permanecem pendentes.
- O CSS órfão `.map-modal-*` e `.agrosamas-banner` permanece como frente paralela.
- A revisão editorial do destaque do 32º Mês Polonês após 30/08/2026 permanece pendente.
- R3, R4, R5, V6, V7 e B3 não foram executados nesta atualização de governança.

### Arquivos alterados

- `CLAUDE.md` — estado permanente de R2, separação R1/R2 e próximos módulos atualizados.
- `TASKS.md` — estado da Fase 1, conclusão de R2, R3 como próximo módulo e pendências atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -10
git diff -- .claude
Get-ChildItem -Force .claude
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações e limites

- [x] Working tree inicial sem alterações rastreadas pendentes
- [x] Commit funcional `6e126cd` presente no histórico
- [x] `.claude/settings.local.json` identificado como não rastreado e mantido intocado
- [x] Leitura dos três arquivos de governança
- [x] Escopo restrito a `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Nenhum código, HTML, CSS, JavaScript de runtime, dado, regra, Admin/CMS/Firebase ou artefato de auditoria alterado

### Próximo passo

- Planejar R3 em bloco separado, após escopo explícito; não executar automaticamente nesta atualização.

---

## 2026-07-13 — Registro de R1 na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar oficialmente R1 como o primeiro módulo concluído da Fase 1 da refatoração modular progressiva da home.

### Resultado consolidado

- R1 extraiu somente a lógica da grade “Acontece em breve” de `index.html` para `js/home-eventos.js` com comportamento 1:1 e sem mudança funcional ou editorial.
- Aproximadamente 183 linhas de JavaScript inline foram removidas de `index.html`; `js/home-eventos.js` tornou-se o primeiro módulo da fundação modular.
- R1 foi concluído, validado, commitado, enviado por push e publicado. O commit funcional presente no histórico é `efe6c11 refactor(home): extrai grade de eventos para modulo dedicado`.
- `eventos-2026.json` continua fonte primária; fallback estático, regra V5B, priorização de únicos, preenchimento por recorrentes, limite de quatro cards, ordenação, desempate e enriquecimento opcional via Firebase foram preservados.
- A extração manteve `carregarProximosEventos` privada em IIFE, listener próprio de `DOMContentLoaded`, nenhum export e nenhuma função adicionada a `window`.
- A metadata do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit funcional; o script não foi executado nesta atualização de governança.

### Separação R1/R2 e aprendizado técnico

- O carrossel de experiências permaneceu integralmente inline e fora de `js/home-eventos.js`.
- R2 continua como próximo módulo, destinado somente ao carrossel em `js/home-experiencias.js`; não foi iniciado.
- Para R2–R5, todo `import()` relativo deve ser reavaliado quando código inline for externalizado: a resolução passa a considerar a localização do novo arquivo. Não copiar caminhos relativos cegamente; testar no Network para evitar duplicações como `/js/js/`.

### Ordem da Fase 1

1. R1 — eventos: concluído.
2. R2 — carrossel: próximo, não iniciado.
3. R3 — formulário.
4. R4 — acessibilidade e utilitários visuais.
5. R5 — i18n/fallback inline, por último e mais sensível.

### Pendências mantidas

- CSS órfão `.map-modal-*` e `.agrosamas-banner` permanecem para follow-up separado.
- Revisar editorialmente o destaque do 32º Mês Polonês após 30/08/2026.
- V4D, V5C3 e V5D permanecem pendentes.
- V6 e V7 só devem ocorrer após a fundação modular; B3 permanece em fase própria.
- Admin/CMS/Firebase continua pausado.
- R2, R3, R4, R5, V6, V7 e B3 não foram executados nesta atualização.

### Arquivos alterados

- `CLAUDE.md` — decisão consolidada de R1 e separação R1/R2.
- `TASKS.md` — estado, Fase 1, próximo módulo e pendências atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -10
git show --stat --oneline --decorate --no-renames efe6c11
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações e limites

- [x] Working tree inicial sem alterações rastreadas pendentes
- [x] Commit funcional `efe6c11` presente no histórico e em `origin/main`
- [x] `.claude/settings.local.json` identificado como não rastreado e mantido intocado
- [x] Leitura dos três arquivos de governança
- [x] `git diff --check`
- [x] `git diff --name-only`
- [x] `git diff --stat`
- [x] `git status` final
- [x] Somente os três arquivos de governança alterados
- [x] Nenhum runtime, regra, dado, mídia, Admin/CMS/Firebase ou artefato de auditoria alterado

### Próximo passo

- Preparar R2 em bloco separado, após escopo explícito; não executar automaticamente.

---

## 2026-07-13 — Checkpoint arquitetural pós-V5

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar o checkpoint arquitetural pós-V5, a tag `pos-v5-checkpoint`, a estratégia aprovada e o plano de fases, sem executar R1 ou qualquer alteração de runtime.

### Resultado consolidado

- O diagnóstico foi somente leitura e confirmou que o projeto público está funcional e saudável em várias áreas, com deploy GitHub Pages estável, governança reversível, fallbacks estáticos resilientes, camada `TURISMO_*` + adapters organizada, service worker adequado, cache-busting consistente e SEO público organizado.
- A dívida técnica está concentrada principalmente em `index.html` (aproximadamente 2.473 linhas, cerca de 975 de JavaScript inline) e `css/index.css` (aproximadamente 7.080 linhas e 743 ocorrências de `!important`). Também foram registrados acoplamento de navegação, fallback i18n inline duplicado, manutenção paralela de notícias, padrões Firebase compat/modular misturados e órfãos de CSS/configuração/i18n.
- Não há evidência para reescrita completa ou projeto novo. A estratégia aprovada é híbrida: refatoração modular progressiva como espinha dorsal, microblocos para ajustes editoriais e remoção de órfãos, e B3 como frente própria de performance.
- A tag anotada `pos-v5-checkpoint` foi criada e enviada ao remoto.

### Decisões e separações

- Não reconstruir a home do zero, não criar projeto novo, não iniciar reescrita total e não retomar Admin/CMS/Firebase neste momento.
- R1 extrairá somente a lógica da grade "Acontece em breve" para `js/home-eventos.js`.
- R2 será posterior e separado, destinado ao carrossel de experiências em `js/home-experiencias.js`; o carrossel não será colocado em `js/home-eventos.js`.
- V6 continua válido, mas somente depois da fundação modular da home.
- V7 ocorrerá no projeto atual depois das extrações, usando `js/nav-shared.js` como base única e removendo a navegação inline duplicada.
- B3 pode receber auditoria somente leitura antecipada, mas a execução de mídia/performance permanece em fase própria.
- V4D, V5C3 e V5D continuam pendentes e não serão executados automaticamente.
- R1 é o próximo microbloco aprovado para preparação, mas não foi executado nesta tarefa.

### Plano aprovado

1. **Fase 0 — checkpoint:** concluído com a tag `pos-v5-checkpoint`.
2. **Fase 1 — fundação modular da home:** R1 eventos; R2 carrossel; R3 formulário; R4 acessibilidade e utilitários visuais; R5 i18n/fallback inline por último e após análise específica.
3. **Fase 2 — navegação e estrutura:** V7 com `js/nav-shared.js` como base única; depois V6, se ainda fizer sentido editorialmente.
4. **Fase 3 — dados editoriais:** fonte única de notícias; contrato entre `eventos-2026.json` e `TURISMO_EVENTOS`; preparação da virada anual de eventos.
5. **Fase 4 — performance/B3:** vídeos, imagens pesadas, CSS órfão e revisão gradual de `css/index.css`.
6. **Fase 5 — CMS:** somente quando oficialmente despausado.

### Arquivos alterados

- `CLAUDE.md` — decisão arquitetural durável e separação R1/R2 registradas.
- `TASKS.md` — checkpoint, fases, próximo microbloco e pendências atualizados.
- `CHANGELOG_AI.md` — registro deste checkpoint de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git tag --list "pos-v5-checkpoint"
git show-ref --tags --verify "refs/tags/pos-v5-checkpoint"
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações e limites

- [x] Estado inicial sem alterações rastreadas pendentes
- [x] Tag local `pos-v5-checkpoint` confirmada por `git show-ref`
- [x] Leitura dos três arquivos de governança
- [x] Alteração restrita aos três arquivos permitidos
- [x] `git diff --check`
- [x] `git diff --name-only`
- [x] `git diff --stat`
- [x] `git status` final
- [x] R1 não executado
- [x] Nenhum código, HTML, CSS, JavaScript de runtime, dados, rules, Admin/CMS/Firebase, `.claude/*` ou `docs/auditoria-output/*` alterado

### Próximo passo

- Preparar R1 em bloco separado, após novo escopo explícito; não executar R1, R2, V6, V7, B3 ou qualquer fase nesta atualização.

---

## 2026-07-13 — Registro de V5C2 e V5C2A na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que V5C2-EXEC e o microajuste V5C2A foram concluídos, validados, enviados por push e publicados, mantendo os próximos blocos apenas como pendências conscientes.

### Arquivos alterados

- `CLAUDE.md` — decisão consolidada da frente pública atualizada com V5C2+V5C2A concluídos, preservações e follow-ups.
- `TASKS.md` — estado atual, bloco concluído, roadmap e pendências editoriais/visuais atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações

- [x] Estado inicial sem alteração rastreada pendente
- [x] `.claude/settings.local.json` identificado como não rastreado e mantido intocado
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito aos três arquivos de governança
- [x] `git diff --check`
- [x] `git diff --name-only`
- [x] `git diff --stat`
- [x] `git status` final

### Registros consolidados

- O primeiro card da home foi atualizado para a matéria "Agosto é Polonês em São Mateus do Sul: confira a programação do 32º Mês Polonês", e a mesma matéria foi adicionada ao topo de `noticias.html`, mantendo home e listagem sincronizadas.
- A matéria nova passou a ser o destaque principal de `noticias.html`, como `article.post-card.featured`, com título `h2` e selo "Destaque · Cultura e Gastronomia".
- A notícia antiga sobre o regulamento da Polskie Smaki foi preservada como segundo card comum, com título `h3` e categoria Cultura; a hierarquia `h2`/`h3` e o selo foram transferidos de forma coerente.
- Nenhuma notícia anterior foi removida. Os cards 2 e 3 da home e o CTA geral `/noticias` permaneceram intactos.
- CSS, JavaScript, `translations.js`, `noticia.html`, `js/cms.js` e a camada opcional do CMS foram preservados.
- A data/hora da última atualização do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit funcional; esse script não foi executado nesta atualização de governança.

### Riscos / observações

- Revisar o destaque do 32º Mês Polonês após 30/08/2026, aplicar a política de rotação mensal e remover ou substituir cards de eventos em até aproximadamente sete dias após o encerramento.
- A notícia nova e a antiga usam atualmente a mesma imagem; eventual troca deve ocorrer somente após conferência visual e em bloco separado.
- V5C3 permanece pendente para avaliar a extração dos `style` inline dos CTAs para classe compartilhada; exige CSS, pode integrar bloco visual futuro e não deve ser executado automaticamente.
- V5D permanece pendente para revisão anti-envelhecimento de Festas em Destaque; depende de `translations.js`, tem risco médio e exige decisão consciente.
- V4D permanece pendente como dívida técnica/decisão consciente.
- A fonte única de notícias permanece como follow-up arquitetural futuro.
- B3 mídia/performance permanece para o final.
- Admin/CMS/Firebase segue pausado.
- Nenhum código, HTML, CSS, JavaScript de runtime, `index.html`, `noticias.html`, `js/site-meta.js`, `noticia.html`, `js/cms.js`, `translations.js`, `config.js`, mídia, dados de eventos, sitemap, robots, rules, Admin/CMS/Firebase, `.claude/*` ou `docs/auditoria-output/*` foi alterado nesta atualização.
- V5C3, V5D, V6, V7 e B3 não foram iniciados.

### Próximo passo

- Manter os follow-ups editoriais e visuais registrados e não iniciar outro bloco sem decisão explícita.

---

## 2026-07-10 — Registro de V5C1 na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que o V5C1 foi concluído, validado, enviado por push e publicado, mantendo V5C2 e V5C3 pendentes e sem iniciar outro bloco.

### Arquivos alterados

- `CLAUDE.md` — decisão consolidada da frente pública atualizada com V5C1 concluído e próximos caminhos.
- `TASKS.md` — estado atual, blocos concluídos, pendências V5C2/V5C3 e follow-up arquitetural atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações

- [x] Estado inicial sem alteração rastreada de código ou governança
- [x] `.claude/settings.local.json` identificado como não rastreado e mantido intocado
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito aos três arquivos de governança
- [x] `git diff --check`
- [x] `git diff --name-only`
- [x] `git diff --stat`
- [x] `git status` final

### Riscos / observações

- V5C1 corrigiu os links dos cards Polskie Smaki, Fanfarras municipais e Estruturação do turismo local para matérias individuais reais do Portal oficial da Prefeitura.
- Os três links abrem em nova aba com `target="_blank"` e incluem `rel="noopener noreferrer"`.
- O CTA geral "Ver todas as notícias" continua apontando para `/noticias`.
- Textos, imagens, datas, categorias, traduções, layout e CSS foram preservados.
- A data/hora da última atualização do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit de código; esse script não foi executado nesta atualização de governança.
- Nenhum código, HTML, CSS, JavaScript de runtime, `index.html`, `js/site-meta.js`, `noticias.html`, `noticia.html`, `js/cms.js`, `translations.js`, `config.js`, dado, sitemap, robots, rule, Admin/CMS/Firebase, `.claude/*` ou `docs/auditoria-output/*` foi alterado nesta atualização.
- V5C2 permanece pendente para higiene e rotação editorial dos cards, decisão sobre substituir o card mais antigo e definição da política de atualização da home em relação a `noticias.html`; risco médio e decisão humana item por item.
- V5C3 permanece pendente para avaliar a extração do `style` inline dos CTAs para classe compartilhada; exige CSS, não deve ser executado automaticamente e pode integrar um bloco visual maior.
- O follow-up arquitetural de fonte única de notícias entre home e `noticias.html` permanece fora do V5C, aguardando decisão entre JSON, CMS ou outra solução futura e possível retomada do CMS.
- V5D permanece pendente para revisão anti-envelhecimento de Festas em Destaque, com dependência de `translations.js`, risco médio e decisão consciente.
- V4D permanece como dívida técnica/decisão consciente; B3 mídia/performance permanece para o final; Admin/CMS/Firebase segue pausado.

### Próximo passo

- Manter V5C2, V5C3 e V5D pendentes até decisão humana explícita; não iniciar outro bloco nesta atualização.

---

## 2026-07-10 — Registro de V5B na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que o V5B foi concluído, validado, enviado por push e publicado, mantendo V5C e V5D pendentes e sem iniciar outro bloco.

### Arquivos alterados

- `CLAUDE.md` — decisão durável da frente pública atualizada com V5B concluído, preservações, pendências e follow-ups.
- `TASKS.md` — estado atual, próximo passo, blocos concluídos e tarefas pendentes atualizados com V5B.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --branch
```

### Validações

- [x] `git status` inicial, sem alteração rastreada pendente
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git diff --name-only`
- [x] `git diff --stat`
- [x] `git status` final

### Riscos / observações

- V5B prioriza eventos únicos/não recorrentes na grade "Acontece em breve"; eventos recorrentes somente completam vagas quando faltam eventos únicos.
- A seleção final permanece cronológica, limitada a quatro cards e com o desempate por vínculo a estabelecimento preservado.
- O fallback estático e o merge com eventos aprovados do Firebase foram preservados; eventos vindos do Firebase continuam mapeados como `recorrente: false`.
- `eventos-2026.json`, `js/data/eventos.js` e as demais fontes de dados permaneceram intactos.
- A data/hora da última atualização do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit de código do V5B; esse script não foi executado nesta atualização de governança.
- Nenhum código, HTML, CSS, JavaScript de runtime, `index.html`, `js/site-meta.js`, `translations.js`, `config.js`, `js/public-banners.js`, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado nesta atualização.
- V5C permanece pendente para higiene editorial de Eventos & Notícias, confirmação dos links reais das notícias e revisão de conteúdo hard-coded e datas envelhecidas; risco médio e decisão humana item por item.
- V5D permanece pendente para revisão anti-envelhecimento de Festas em Destaque; risco médio, depende de `translations.js` e exige decisão consciente.
- V4D permanece pendente como dívida técnica/decisão consciente; B3 mídia/performance permanece para o final; Admin/CMS/Firebase segue pausado.
- Follow-ups mantidos: CSS órfão `.map-modal-*`, CSS órfão `.agrosamas-banner`, chaves i18n órfãs relacionadas aos blocos removidos, `CONFIG.agrosamas` temporariamente sem efeito na home, virada anual de `eventos-2026.json` e possível duplicação futura entre `eventos-2026.json` e `TURISMO_EVENTOS`.

### Próximo passo

- Manter V5C e V5D pendentes até decisão humana explícita; não iniciar outro bloco nesta atualização.

---

## 2026-07-09 — Registro de V5A na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que o V5A foi concluído, validado, commitado e reenviado por push após instabilidade/cancelamento do GitHub Pages, mantendo V5B, V5C e V5D como pendências separadas.

### Arquivos alterados

- `CLAUDE.md` — observações permanentes atualizadas com V5A concluído, publicação/reenvio com check verde, preservações e próximos microblocos V5B/V5C/V5D.
- `TASKS.md` — estado atual, próximo passo recomendado, blocos concluídos, próximos caminhos, follow-ups e tarefas concluídas atualizados com V5A.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git status --short --branch
git diff --stat
```

### Validações

- [x] `git status` inicial
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final
- [x] `git diff --stat`

### Riscos / observações

- Nenhum código, HTML, CSS, JS, `translations.js`, `config.js`, dados de eventos, `js/public-banners.js`, `js/site-meta.js`, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado nesta atualização de governança.
- V5A removeu da home o banner/section AgroSamas oculto e o script inline exclusivo (`ativarBannerAgrosamas`, `fecharBannerAgrosamas`, `localStorage agrosamas-banner-closed` e autoativação comentada), com aproximadamente 63 linhas removidas de `index.html` no bloco já concluído.
- O slot moderno `#public-banners-slot` foi preservado como caminho oficial para banners/campanhas; `js/public-banners.js`, `config.js` e `translations.js` foram preservados.
- A data/hora da última atualização do site foi atualizada antes do commit real de publicação/reenvio do V5A (`chore: atualiza metadata para reenviar deploy do V5A`), e o GitHub Pages build and deployment concluiu novamente com check verde.
- V5B segue pendente para despriorizar recorrentes na grade "Acontece em breve"; risco baixo-médio; exige teste visual e funcional da home.
- V5C segue pendente para higiene editorial de Eventos & Notícias; risco médio; exige decisão humana sobre notícias e links reais.
- V5D segue pendente para revisão anti-envelhecimento de Festas em Destaque; risco médio; depende de mexer em `translations.js`, então só com decisão consciente.
- Follow-ups mantidos: CSS órfão `.agrosamas-banner`, chaves i18n órfãs `agrosamas-banner-*`, `CONFIG.agrosamas` temporariamente sem efeito na home, B3 mídia/performance para o final e Admin/CMS/Firebase pausado.

### Próximo passo

- Planejar V5B como microbloco separado, com teste visual e funcional da home antes de qualquer conclusão.

---

## 2026-07-09 — Registro de V4A, V4B e V4C na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que os microblocos V4A, V4B e V4C da limpeza de peso morto da home foram concluídos, testados, commitados e enviados por push, deixando V4D como pendência consciente.

### Arquivos alterados

- `CLAUDE.md` — observações permanentes atualizadas com V4A+V4B+V4C concluídos, V4D pendente/risco médio e próximos caminhos V5, V6, V7, B3 e follow-ups futuros.
- `TASKS.md` — estado atual, próximo passo recomendado, blocos concluídos, próximos caminhos e tarefas concluídas atualizados com V4A+V4B+V4C.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git status --short
git diff --stat
```

### Validações

- [x] `git status` inicial
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final
- [x] `git diff --stat`

### Riscos / observações

- Nenhum código, HTML, CSS, JS, `translations.js`, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado nesta atualização de governança.
- V4A+V4B+V4C removeram aproximadamente 404 linhas de peso morto da home; `index.html` foi o único arquivo alterado nesses microblocos já concluídos.
- V4D fallback inline de traduções permanece pendente, com risco médio, e só deve ser executado por decisão consciente; alternativa aceitável é manter documentado como dívida técnica.
- V5 consolidação de eventos/notícias da home, V6 reordenação da metade inferior da home e V7 unificação da navegação seguem como caminhos futuros; V7 é alto risco e deve ficar para depois.
- B3 mídia/performance continua para o final.
- Admin/CMS/Firebase segue pausado.
- Follow-up futuro: CSS órfão `.map-modal-*` pode ser revisado em bloco próprio, e as chaves i18n `modal-endereco`, `modal-telefone` e `modal-horario` podem ser revisadas futuramente sem alterar `translations.js` agora.

### Próximo passo

- Decidir conscientemente se V4D será executado ou mantido como dívida técnica documentada; depois seguir para V5.

---

## 2026-07-09 — Registro de V3 navegação na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que o bloco V3 de navegação foi concluído, testado em produção, commitado e enviado por push, e indicar V4 como próximo bloco provável sem iniciá-lo.

### Arquivos alterados

- `CLAUDE.md` — observações permanentes atualizadas com V3 concluído, próximos caminhos V4 a V7, B3 por último, Admin/CMS/Firebase pausado e follow-up separado de Service Worker em localhost.
- `TASKS.md` — estado atual, próximo passo recomendado, blocos concluídos, próximos caminhos e tarefas concluídas atualizados com V3.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git status --short
```

### Validações

- [x] `git status` inicial
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final

### Riscos / observações

- Nenhum código, HTML, CSS, JS, `translations.js`, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado nesta atualização de governança.
- V3 alterou apenas `index.html` e `js/nav-shared.js`, já commitados e enviados por push no bloco anterior.
- Teste em produção confirmou que o mapa carregou corretamente; os erros anteriores eram de ambiente local/cache/service worker.
- V4 fica como próximo bloco provável: limpeza de peso morto da home, somente com confirmação item a item e sem iniciar nesta atualização.
- V5 consolidação de eventos, V6 reordenação da home e V7 unificação da navegação ficam como etapas futuras; V7 é alto risco e deve ficar para depois.
- B3 mídia/performance continua para o final.
- Admin/CMS/Firebase segue pausado.
- Follow-up separado: investigar Service Worker em localhost se voltar a interceptar Leaflet/OSM, sem tratar como regressão do V3.

### Próximo passo

- Planejar V4 limpeza de peso morto da home como bloco separado, somente com confirmação item a item.

---

## 2026-07-09 — Registro de V1+V2 na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que o bloco visual/UX V1+V2 foi concluído, aprovado, commitado e enviado por push, e indicar V3 navegação como próximo bloco provável.

### Arquivos alterados

- `CLAUDE.md` — adicionada observação permanente sobre V1+V2 concluído e próximos caminhos V3 a V7.
- `TASKS.md` — estado atual, frente ativa, blocos concluídos, próximos caminhos e tarefas concluídas atualizados com V1+V2.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git status --short
```

### Validações

- [x] `git status` inicial
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final

### Riscos / observações

- Nenhum código, HTML, CSS, JS, `translations.js`, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado nesta atualização de governança.
- V3 navegação fica como próximo bloco provável: paridade entre nav da home e `nav-shared`, links para `/sabores` e `/onde-ficar`, atalhos mobile e sem unificação da home com `nav-shared` ainda.
- V4 limpeza de peso morto deve ocorrer somente depois e com confirmação item a item.
- V5 consolidação de eventos, V6 reordenação da home e V7 unificação da navegação ficam como etapas futuras; V7 é alto risco e deve ficar para depois.
- B3 mídia/performance continua para o final.
- Frente Admin/CMS/Firebase segue pausada.

### Próximo passo

- Planejar V3 navegação como bloco separado, pequeno e auditável.

---

## 2026-07-08 — Registro de SEO-F1 na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que SEO-F1 foi concluído, commitado e enviado por push, encerrando o follow-up de `noindex,follow` nas páginas legadas/suspensas removidas do sitemap.

### Arquivos alterados

- `CLAUDE.md` — adicionada observação permanente sobre SEO-F1 concluído e próximos caminhos restantes.
- `TASKS.md` — estado atual, frente ativa, blocos concluídos e tarefas concluídas atualizados com SEO-F1.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git status --short
```

### Validações

- [x] `git status` inicial
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final

### Riscos / observações

- Nenhum código, HTML, CSS, JS, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado nesta atualização de governança.
- SEO-F1 concluiu o follow-up de `noindex` das páginas legadas/suspensas removidas do sitemap.
- B3 mídia/performance continua decidido para o final.
- B4b migração Firebase modular sob demanda permanece como possível próximo bloco, mas ainda não iniciado.
- Frente Admin/CMS/Firebase segue pausada.

### Próximo passo

- Escolher futuramente entre B4b modular com teste manual dedicado, investigação Service Worker/OpenStreetMap ou revisão de dados Firestore; manter B3 mídia/performance para o final.

---

## 2026-07-08 — Registro de B5/B4a e follow-ups da auditoria pública

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que B5 diagnóstico Firebase público e B4a timeout no mapa foram concluídos, e documentar follow-ups aprovados sem alterar código, HTML, CSS, JS, sitemap, robots, rules, Admin/CMS/Firebase ou artefatos de auditoria.

### Arquivos alterados

- `CLAUDE.md` — adicionadas observações permanentes sobre B5/B4a concluídos e próximos caminhos possíveis.
- `TASKS.md` — estado atual, frente ativa, blocos concluídos, follow-ups e tarefas concluídas atualizados com B5/B4a.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git status --short
```

### Validações

- [x] `git status` inicial
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final

### Riscos / observações

- Nenhum código, HTML, CSS, JS, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado.
- App Check/reCAPTCHA em localhost deve ser tratado como ambiente/debug token, não regressão.
- Service Worker/OpenStreetMap, vínculos de eventos sem `establishmentId`, B4b modular e SEO `noindex` ficaram como blocos futuros separados.
- B3 mídia/performance fica por último, conforme decisão atual.

### Próximo passo

- Escolher um microbloco futuro entre SEO `noindex`, investigação Service Worker/OpenStreetMap, revisão de dados Firestore ou B4b modular com teste manual dedicado.

---

## 2026-07-08 — Registro de B1/B2 da auditoria pública

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que os blocos B1 e B2 da auditoria pública pós-Claude Fable 5 foram concluídos, commitados e enviados manualmente, e deixar documentados os próximos caminhos possíveis sem alterar código, sitemap, robots, rules, Admin/CMS/Firebase ou artefatos de auditoria.

### Arquivos alterados

- `CLAUDE.md` — adicionada orientação permanente curta sobre B1/B2 concluídos, próximos caminhos possíveis e pausa mantida de Admin/CMS/Firebase.
- `TASKS.md` — estado atual, frente ativa e tarefas concluídas atualizados com B1 cache-busting, B2 higiene de sitemap e próximos caminhos possíveis.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch
Get-Content -Raw -Path "CLAUDE.md"
Get-Content -Raw -Path "TASKS.md"
Get-Content -Raw -Path "CHANGELOG_AI.md"
git diff --check
git status --short --branch
```

### Validações

- [x] `git status` inicial
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final

### Riscos / observações

- Nenhum código, HTML, CSS, JS, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado.
- Follow-up SEO de `noindex` em páginas legadas/suspensas deve ser tratado como bloco opcional e explícito.
- B3 deve começar preferencialmente como inventário de mídia/performance sem edição; B4 tem risco médio; B5 deve ser diagnóstico sem edição do Firebase.
- Admin/CMS/Firebase segue pausado.

### Próximo passo

- Escolher entre follow-up SEO opcional, B3 inventário de mídia/performance, B4 scripts/defer ou B5 diagnóstico sem edição do Firebase em mapa/eventos.

---

## 2026-07-08 — Pausa temporária de Admin/CMS/Firebase

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar nos arquivos de governança que o CMS-5C foi concluído, commitado, enviado por push e que as Firestore Rules foram publicadas, pausando temporariamente a frente Admin/CMS/Firebase para priorizar auditoria e melhoria do site público.

### Arquivos alterados

- `CLAUDE.md` — orientação permanente atualizada para indicar pausa temporária de Admin/CMS/Firebase e foco atual no site público.
- `TASKS.md` — estado atual atualizado; CMS-5C marcado como concluído; teste esperado de `/cms-public-debug.html` registrado; CMS-5D e CMS-4E-EXEC mantidos como pendências futuras.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
Get-Content -Path 'CLAUDE.md'
Get-Content -Path 'TASKS.md'
Get-Content -Path 'CHANGELOG_AI.md'
git diff --check
git status --short --branch --untracked-files=all
```

### Validações

- [x] `git status` inicial limpo
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final

### Riscos / observações

- Nenhum código, HTML, CSS, JS, rules, dados ou artefato de auditoria deve ser alterado nesta tarefa.
- A próxima frente ativa é o site público; Admin/CMS/Firebase só deve ser retomado por bloco explícito.

### Próximo passo

- Iniciar auditoria e melhoria do site público sem mexer em Admin/CMS/Firebase.

---

## Como registrar

Cada entrada deve seguir este modelo:

```md
## AAAA-MM-DD — Título curto da alteração

**Ferramenta/modelo:** Claude Code / Codex / ChatGPT / outro  
**Responsável pela aprovação:** Jacob  
**Status:** planejado / aplicado / validado / revertido

### Objetivo

[Objetivo da alteração]

### Arquivos alterados

- `arquivo.ext` — resumo do que mudou

### Comandos executados

```powershell
comando
```

### Validações

- [ ] build
- [ ] lint
- [ ] revisão visual
- [ ] revisão de SEO/metadados
- [ ] teste em produção/homologação

### Riscos / observações

- ...

### Próximo passo

- ...
```

---

## 2026-07-03 — Tarefa 6: revisão multilíngue PT-BR / EN / ES / PL

**Ferramenta/modelo:** Codex (implementação) + Claude Code (QA)  
**Responsável pela aprovação:** Jacob  
**Status:** validado (QA aprovado, aguardando commit)

### Objetivo

Completar o passe de i18n público (PT-BR/EN/ES/PL) da agenda de eventos, do nav e dos rótulos de acessibilidade, sem deploy, commit, dependências ou mudanças em Firebase/admin/dados.

### Arquivos alterados

- `translations.js` — novas chaves nos 4 idiomas (agenda pública, meses/dias, estados vazios, modal de evento, atalhos mobile, ARIA do nav e seletor de idioma). Paridade 888/888/888/888, sem duplicatas.
- `eventos.html` — textos estáticos e dinâmicos da agenda ligados ao i18n; **fix do `currentLang()`** (passa a priorizar `document.documentElement.lang`) para o conteúdo dinâmico não ficar um idioma atrasado ao trocar de idioma.
- `index.html` — `data-lang-key-aria-label` no nav/atalhos mobile; correção de 2 `data-lang-key` duplicados; ARIA/title traduzíveis do botão de idioma.
- `js/nav-shared.js` — ARIA traduzível de menus, atalhos mobile e estado/título do seletor de idioma.

### Validações

- [x] `node --check` (nav-shared, translations, season-theme, mapa-turistico, locais-data, data/eventos) — OK
- [x] `git diff --check` — limpo
- [x] Auditorias (tourism-data / links / assets / project) — OK (reports gerados revertidos)
- [x] Navegador PT/EN/ES/PL: eventos.html (estático+dinâmico sincronizados, modal abre/re-renderiza/fecha), index.html, local.html (com id, sem id, id inválido), 390px/412px
- [ ] teste em produção/homologação

### Riscos / observações

- Overflow de 3px no `.featured-carousel-track` em 390/412px é pré-existente e independente de idioma (sem overflow de página) — follow-up opcional, não relacionado a esta tarefa.
- `aria-label`/`title` do seletor de idioma incluem emoji da bandeira + espaços (padrão já existente em `nav-shared.js`) — follow-up opcional global.
- Relatórios gerados (`docs/auditoria-dados-turisticos.md`, `docs/auditoria-output/*`) foram revertidos; não incluir no commit.

### Próximo passo

- Commit dos 4 arquivos: `translations.js`, `eventos.html`, `index.html`, `js/nav-shared.js` (mediante autorização).

---

## 2026-07-03 — Governança de uso do Claude no projeto

**Ferramenta/modelo:** ChatGPT  
**Responsável pela aprovação:** Jacob  
**Status:** planejado

### Objetivo

Adicionar arquivos de governança para melhorar o uso do Claude/Claude Code no projeto, reduzir retrabalho, evitar alterações fora de escopo e manter histórico entre conversas.

### Arquivos propostos

- `CLAUDE.md` — regras permanentes do projeto e forma de trabalho.
- `TASKS.md` — estado atual, pendências e próximos passos.
- `CHANGELOG_AI.md` — registro das alterações feitas com IA.

### Local recomendado

Raiz do repositório, no mesmo nível de arquivos como:

- `.git/`
- `package.json`, se existir
- `index.html`
- `manifest.json`
- pastas principais do projeto

Exemplo provável:

```powershell
D:\PROJETOS CODEX\SITE-TURISMO-SMS\CLAUDE.md
D:\PROJETOS CODEX\SITE-TURISMO-SMS\TASKS.md
D:\PROJETOS CODEX\SITE-TURISMO-SMS\CHANGELOG_AI.md
```

Se o projeto estiver na pasta `SITE-TURISMO-SMS-mainv2`, usar:

```powershell
D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2\CLAUDE.md
D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2\TASKS.md
D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2\CHANGELOG_AI.md
```

### Observações

- Estes arquivos não devem substituir Git.
- Devem ser usados como contexto inicial para Claude/Claude Code.
- Antes de cada tarefa, pedir ao Claude para ler `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`.
- Não fazer commit/deploy sem autorização explícita.

---

## 2026-07-03 — Auditoria SEO/metadados versão 2.02

**Ferramenta/modelo:** Claude/Claude Code  
**Responsável pela aprovação:** Jacob  
**Status:** em revisão

### Objetivo

Revisar SEO e metadados do site sem impacto em layout/render.

### Pontos registrados

- Fallback de imagem absoluta válida quando não houver imagem local.
- Função de truncamento seguro para meta description longa.
- Preservação de acentos e caracteres especiais.
- Uso de `encodeURIComponent` em query params.
- Alterações restritas ao `<head>` e função JS isolada quando aplicável.
- Revisão de `manifest.json` quanto a nome, descrição, cores, start_url e scope.

### Pendências

- Reverter/remover `docs/auditoria-output/` se for artefato temporário.
- Encurtar descrição da home para cerca de 150–155 caracteres.
- Registrar follow-up para ícone PWA real `512x512`.
- Revisar diff antes de commit.

### Arquivos que não devem ser alterados sem autorização

- `mapa-completo.html`
- `mapa-3d.html`
- `roteiro-ia.html`

### Riscos conhecidos

- Canonical limpo depende de rewrite do servidor sem `.html`.
- PWA sem ícone real `512x512` pode degradar instalação/splash no Android, mas não quebra o site.

---

## 2026-07-03 — Otimização de performance/Lighthouse (passe inicial)

**Ferramenta/modelo:** Claude/Codex  
**Responsável pela aprovação:** Jacob  
**Status:** validado / commitado (`0e0c65a`)

- Otimização segura de carregamento de imagens da home e do mapa turístico.
- Sem regressão visual; layout aprovado preservado.

---

## 2026-07-03 — Correção de regressão de layout do carrossel em destaque

**Ferramenta/modelo:** Claude/Codex  
**Responsável pela aprovação:** Jacob  
**Status:** validado / commitado (`87b6457`)

- Estabilização do layout de imagem do carrossel de experiências em destaque.
- Correção pontual, sem redesign.

---

## 2026-07-03 — Conclusão do passe de SEO/metadados sociais

**Ferramenta/modelo:** Claude/Codex  
**Responsável pela aprovação:** Jacob  
**Status:** validado / commitado (`c34d53b`)

- `<title>`, meta description, canonical, Open Graph e Twitter/X revisados nas páginas públicas.
- `manifest.json` ajustado (nome, descrição, ícone real `192x192`, screenshot com dimensão real); entradas falsas de `512x512` removidas.
- Metadados dinâmicos de `local.html` com truncamento seguro de descrição e OG/Twitter por `?id=`.
- `SearchAction` removido da home (busca é modal, sem URL estável de resultados).
- `rotas-completas.html` mantido `noindex,follow` (página legada).
- QA aprovado; alterações restritas a `<head>`/manifest, sem impacto de layout.

---

## 2026-07-03 — Auditoria de dados turísticos públicos (S14) + remoção de duplicado

**Ferramenta/modelo:** Claude/Codex  
**Responsável pela aprovação:** Jacob  
**Status:** validado / commitado (`fe18133`)

- Auditoria das fontes públicas de dados (atrativos, gastronomia, hospedagem, rotas, mapa e fichas `local.html`).
- Removido o registro duplicado `rua-do-mathe` de `js/data/restaurantes.js`; a Rua do Mathe já existia como ponto/ficha canônica (`js/locais-data.js` + `js/data/pontos-turisticos.js`) com dados mais consistentes. O duplicado tinha telefone conflitante/placeholder.
- QA confirmou que ficha, card da home e filtro `categoria=Gastronomia` do mapa continuam funcionando; nenhum efeito colateral.
- Relatório curado commitado: `docs/bloco-s14-auditoria-dados-turisticos-publicos.md`.
- Relatórios gerados (`docs/auditoria-output/*`, `docs/auditoria-dados-turisticos.md`) mantidos fora do commit.

---

## 2026-07-03 — Atualização dos arquivos de governança

**Ferramenta/modelo:** Claude/Codex  
**Responsável pela aprovação:** Jacob  
**Status:** aplicado (sem commit até autorização)

### Objetivo

Atualizar `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md` para refletir os milestones concluídos e preparar a Tarefa 4.

### Arquivos alterados

- `CLAUDE.md` — nova seção "Regras específicas de escopo e conteúdo": mudanças pequenas, inspecionar antes de editar, não commitar `docs/auditoria-output/*` sem pedido, não inventar dados de negócios, admin/Firebase fora de escopo, preservar acessibilidade/VLibras/idiomas/atalhos móveis/mascote, não reintroduzir chatbox/cuia, sempre reportar.
- `TASKS.md` — SEO/metadados, performance, correção do carrossel e auditoria S14 marcados como concluídos; adicionada a Tarefa 4 (fichas individuais de locais); mantidos follow-up do ícone PWA `512x512` e admin/cadastro como tarefa final; explicitada a regra de não commitar `docs/auditoria-output/*`.
- `CHANGELOG_AI.md` — entradas concisas para performance, carrossel, SEO, S14 e esta atualização de governança.

### Observações

- Nenhum arquivo de código/HTML/CSS/JS/dados foi alterado nesta tarefa.
- Sem commit/deploy; aguardando autorização.
