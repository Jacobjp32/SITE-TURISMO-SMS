# TASKS.md — SITE-TURISMO-SMS

Este arquivo controla o estado atual, pendências e próximos passos do projeto para uso com Claude/Claude Code/Codex.

Atualize este arquivo apenas quando houver mudança real de estado, decisão aprovada ou conclusão de etapa.

---

## Estado atual resumido

**Projeto:** SITE-TURISMO-SMS  
**Área atual de trabalho:** auditoria e melhoria do site público, sem mexer em Admin/CMS/Firebase.
**Status geral:** CMS-5C concluído, commitado, enviado por push e Firestore Rules publicadas; Admin/CMS/Firebase pausado temporariamente. Milestones de UX, mapa, performance, SEO/metadados e auditoria de dados S14 também concluídos, aprovados em QA, commitados e enviados. Após a auditoria pública do Claude Fable 5, B1 cache-busting público, B2 higiene de sitemap, B5 diagnóstico Firebase público, B4a timeout no mapa, SEO-F1 `noindex` em páginas legadas, V1+V2 visual/UX da home, V3 navegação, V4A+V4B+V4C limpeza de peso morto da home, V5A remoção do banner AgroSamas oculto, V5B priorização de eventos únicos em "Acontece em breve", V5C1 correção dos links dos cards de "Eventos & Notícias", V5C2+V5C2A sincronização editorial entre home e notícias, R1 extração da grade de eventos, R2 extração do carrossel de experiências, R3 extração do formulário de contato, R4B utilitários visuais e R4A acessibilidade eMAG foram concluídos. O checkpoint arquitetural pós-V5 foi concluído somente em leitura, com a tag `pos-v5-checkpoint` criada e enviada ao remoto; a estratégia aprovada é de refatoração modular progressiva no projeto atual.
**Regra principal:** mudanças técnicas devem ser pequenas, auditáveis e sem impacto visual quando a tarefa for de `<head>`/SEO ou dados. Não alterar Admin/CMS/Firebase enquanto a frente ativa for o site público.

**Estado atual da Fase 1 (2026-07-16):** R1 eventos, R2 carrossel, R3 formulário, R4B utilitários visuais e R4A acessibilidade eMAG estão concluídos, validados, commitados, enviados por push e publicados. R4A usa o commit funcional `db1b3cb refactor(home): extrai acessibilidade eMAG para modulo dedicado`; R5 i18n/fallback inline é o próximo bloco, ainda não iniciado e por último.

---

## Próximo passo recomendado

**Auditoria e melhoria do site público**, sem mexer em Admin/CMS/Firebase. R1, R2, R3, R4B e R4A da fundação modular foram concluídos, validados, commitados, enviados por push e publicados; R4A e R4B permanecem módulos separados por responsabilidade. R5 i18n/fallback inline é o próximo bloco, mas não foi iniciado: antes de qualquer `R5-EXEC`, deverá existir um `R5-PREP` somente em análise. V5C3 avaliação da extração do `style` inline dos CTAs para classe compartilhada (exige CSS, não executar automaticamente, podendo integrar bloco visual maior), V5D revisão anti-envelhecimento de Festas em Destaque (risco médio, depende de `translations.js`, só com decisão consciente) e V4D fallback inline de traduções seguem pendentes. O destaque do 32º Mês Polonês deve ser revisado após 30/08/2026, com rotação mensal dos cards e remoção ou substituição de cards de eventos em até aproximadamente sete dias após o encerramento. V6 e V7 continuam somente após a fundação modular; V7 é de alto risco e fica para depois. B3 mídia/performance permanece em fase própria. Follow-ups separados: revisar CSS órfão `.agrosamas-banner`; revisar chaves i18n órfãs relacionadas aos blocos removidos; registrar que `CONFIG.agrosamas` está temporariamente sem efeito na home; revisar CSS órfão `.map-modal-*`; planejar a virada anual de `eventos-2026.json`; avaliar futuramente a duplicação entre `eventos-2026.json` e `TURISMO_EVENTOS`; investigar Service Worker em localhost se voltar a interceptar Leaflet/OSM, sem tratar como regressão do V3. Iniciar qualquer bloco apenas após leitura de `CLAUDE.md`, deste `TASKS.md` e do `CHANGELOG_AI.md`, e com plano aprovado antes de editar.

R1, R2, R3, R4B e R4A foram concluídos, validados, commitados, enviados por push e publicados. R1 extraiu somente a grade “Acontece em breve” para `js/home-eventos.js`; R2 extraiu somente o carrossel de experiências para `js/home-experiencias.js`; R3 extraiu somente a lógica do formulário de contato para `js/home-contato.js`; R4B extraiu somente a barra de progresso e o botão “Voltar ao topo” para `js/home-utilitarios.js`; R4A extraiu somente acessibilidade eMAG para `js/home-acessibilidade.js`. As cinco extrações foram 1:1, sem mudança funcional ou visual; R1, R2 e R3 permaneceram intactos durante R4B e R4A, e R4A/R4B permanecem separados por responsabilidade. R5 i18n/fallback inline é o próximo bloco, ainda não iniciado e por último; antes de qualquer `R5-EXEC`, deverá existir um `R5-PREP` somente em análise.

### Checkpoint arquitetural pós-V5 — decisão aprovada

**Correção de sequência em 2026-07-15:** R4B — utilitários visuais — está concluído. O próximo microbloco é R4A — acessibilidade eMAG — ainda não iniciado; R5 i18n/fallback inline permanece posterior e por último.

O checkpoint foi somente leitura e confirmou um projeto público funcional, sem evidência para reescrita completa ou projeto novo. A dívida técnica está concentrada principalmente em `index.html` (aproximadamente 2.473 linhas, incluindo cerca de 975 de JavaScript inline) e `css/index.css` (aproximadamente 7.080 linhas e 743 ocorrências de `!important`). A estratégia aprovada é híbrida: refatoração modular progressiva como espinha dorsal, microblocos para ajustes editoriais/órfãos e B3 como frente própria de performance. A tag anotada `pos-v5-checkpoint` foi criada e enviada ao remoto.

**Plano aprovado:**

1. **Fase 0 — checkpoint:** concluído com a tag `pos-v5-checkpoint`.
2. **Fase 1 — fundação modular da home:** R1 eventos concluído; R2 carrossel de experiências concluído; R3 formulário concluído; R4B utilitários visuais concluído; R4A acessibilidade eMAG concluído; R5 i18n/fallback inline como próximo bloco e por último, após `R5-PREP` somente em análise.
3. **Fase 2 — navegação e estrutura:** V7 no projeto atual, usando `js/nav-shared.js` como base única; remover duplicação inline; depois executar V6, se ainda fizer sentido editorialmente.
4. **Fase 3 — dados editoriais:** fonte única de notícias; contrato entre `eventos-2026.json` e `TURISMO_EVENTOS`; preparação da virada anual de eventos.
5. **Fase 4 — performance/B3:** vídeos, imagens pesadas, CSS órfão e revisão gradual de `css/index.css`.
6. **Fase 5 — CMS:** somente quando oficialmente despausado.

**Separação aprovada:** R1 extraiu somente a lógica da grade "Acontece em breve" para `js/home-eventos.js`; R2 extraiu somente o carrossel de experiências para `js/home-experiencias.js`; R3 extraiu somente a lógica do formulário de contato para `js/home-contato.js`; R4B extraiu somente a barra de progresso e o botão “Voltar ao topo” para `js/home-utilitarios.js`; R4A extraiu somente acessibilidade eMAG para `js/home-acessibilidade.js`. As cinco extrações foram 1:1, sem mudança funcional ou visual, e R1, R2 e R3 permaneceram intactos durante R4B e R4A. R4A e R4B foram concluídos como módulos separados por responsabilidade; R5 i18n/fallback inline é o próximo bloco, ainda não iniciado e por último.

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
- V4D — fallback inline de traduções, pendente, risco médio, somente com decisão consciente; alternativa: manter documentado como dívida técnica.
- V5C3 — avaliar extração do `style` inline dos CTAs para classe compartilhada; exige alteração de CSS, não executar automaticamente e pode ser incorporado futuramente a um bloco visual maior.
- Follow-up editorial de V5C2 — revisar o destaque do 32º Mês Polonês após 30/08/2026; aplicar a política de rotação mensal dos cards; remover ou substituir cards de eventos em até aproximadamente sete dias após o encerramento.
- Follow-up visual de V5C2 — a notícia nova e a antiga usam atualmente a mesma imagem; avaliar troca somente após conferência visual e em bloco separado.
- Follow-up arquitetural fora do V5C — avaliar fonte única de notícias para evitar manutenção duplicada entre home e `noticias.html`, por JSON, CMS ou outra solução futura; aguarda decisão arquitetural e possível retomada do CMS.
- V5D — revisão anti-envelhecimento de Festas em Destaque; risco médio; depende de mexer em `translations.js`, então só com decisão consciente.
- V6 — reordenação da metade inferior da home.
- V7 — unificação da navegação, alto risco, deixar para depois.
- CSS órfão `.agrosamas-banner` pode ser revisado em bloco próprio.
- Chaves i18n órfãs `agrosamas-banner-*` podem ser revisadas futuramente, mas `translations.js` não deve ser alterado agora.
- `CONFIG.agrosamas` está temporariamente sem efeito na home após V5A.
- CSS órfão `.map-modal-*` pode ser revisado em bloco próprio, pois o modal do mini-mapa foi removido da home.
- Chaves i18n `modal-endereco`, `modal-telefone` e `modal-horario` podem ser revisadas futuramente, mas `translations.js` não deve ser alterado agora.
- Planejar a virada anual de `eventos-2026.json`.
- Avaliar futuramente a duplicação entre `eventos-2026.json` e `TURISMO_EVENTOS`.
- App Check/reCAPTCHA em localhost: tratar como ambiente/debug token, não como regressão.
- Service Worker em localhost: investigar em follow-up separado se voltar a interceptar Leaflet/OSM, sem tratar como regressão do V3.
- Eventos aprovados com `establishmentName`, mas sem `establishmentId` seguro, não vinculam ao mapa; revisar dados do Firestore futuramente.
- B4b opcional: migrar Firebase compat de mapa/eventos para import modular sob demanda, somente com teste manual dedicado.
- B3 — mídia/performance fica por último, conforme decisão atual.
- Admin/CMS/Firebase segue pausado.

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

**Próximo bloco da Fase 1:** R5 — i18n/fallback inline — ainda não iniciado e por último. Antes de qualquer `R5-EXEC`, deverá existir um `R5-PREP` somente em análise.

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
