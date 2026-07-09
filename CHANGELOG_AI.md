# CHANGELOG_AI.md — SITE-TURISMO-SMS

Registro de alterações feitas com apoio de IA no projeto.

Use este arquivo para manter continuidade entre sessões do Claude, Claude Code, Codex e ChatGPT.

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
