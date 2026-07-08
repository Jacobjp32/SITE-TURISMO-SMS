# TASKS.md — SITE-TURISMO-SMS

Este arquivo controla o estado atual, pendências e próximos passos do projeto para uso com Claude/Claude Code/Codex.

Atualize este arquivo apenas quando houver mudança real de estado, decisão aprovada ou conclusão de etapa.

---

## Estado atual resumido

**Projeto:** SITE-TURISMO-SMS  
**Área atual de trabalho:** auditoria e melhoria do site público, sem mexer em Admin/CMS/Firebase.
**Status geral:** CMS-5C concluído, commitado, enviado por push e Firestore Rules publicadas; Admin/CMS/Firebase pausado temporariamente. Milestones de UX, mapa, performance, SEO/metadados e auditoria de dados S14 também concluídos, aprovados em QA, commitados e enviados.
**Regra principal:** mudanças técnicas devem ser pequenas, auditáveis e sem impacto visual quando a tarefa for de `<head>`/SEO ou dados. Não alterar Admin/CMS/Firebase enquanto a frente ativa for o site público.

---

## Próximo passo recomendado

**Auditoria e melhoria do site público**, sem mexer em Admin/CMS/Firebase. Iniciar apenas após leitura de `CLAUDE.md`, deste `TASKS.md` e do `CHANGELOG_AI.md`, e com plano aprovado antes de editar.

---

## Ordem futura das tarefas

1. **Auditoria e melhoria do site público** (frente ativa atual).
2. **Tarefa 4 — Fichas/páginas individuais de locais**.
3. Eventos vinculados a locais/experiências, **sem alterar admin ainda**.
4. Revisão multilíngue PT/EN/ES/PL.
5. Passe final de acessibilidade.
6. Manual/resumo para a equipe.
7. CMS-5D — integração controlada do CMS no site público, ainda não iniciada.
8. CMS-4E-EXEC — inventário remoto de mídias, ainda pendente.
9. Admin/cadastro (**último**, tarefa futura).

---

## Tarefas abertas

### [ABERTA / FRENTE ATIVA] Auditoria e melhoria do site público

**Contexto:** após a conclusão do CMS-5C e a publicação das Firestore Rules, a frente Admin/CMS/Firebase foi pausada temporariamente.
**Objetivo:** auditar e melhorar o site público preservando rotas, SEO, responsividade, i18n, acessibilidade e funcionamento estático atual.

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

### [ABERTA / FUTURO — ÚLTIMA] Admin / cadastro

**Contexto:** área administrativa e fluxos de cadastro são a última etapa planejada.  
**Regra:** não mexer em admin/Firebase/áreas restritas até esta tarefa ser explicitamente iniciada e aprovada.

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
