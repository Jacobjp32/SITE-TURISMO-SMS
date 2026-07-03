# CHANGELOG_AI.md — SITE-TURISMO-SMS

Registro de alterações feitas com apoio de IA no projeto.

Use este arquivo para manter continuidade entre sessões do Claude, Claude Code, Codex e ChatGPT.

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
