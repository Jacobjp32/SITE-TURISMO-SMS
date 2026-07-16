# CLAUDE.md — SITE-TURISMO-SMS

## Identificação do projeto

**Projeto:** SITE-TURISMO-SMS  
**Finalidade:** Site oficial de turismo de São Mateus do Sul — PR.  
**Uso principal:** divulgação turística, mapa turístico, rotas, eventos, cultura, gastronomia/sabores, empreendimentos e materiais institucionais/publicitários.

Este arquivo deve ser lido no início de cada sessão do Claude/Claude Code antes de qualquer alteração.

---

## Regras obrigatórias de trabalho

1. **Não editar nada sem antes analisar e apresentar plano.**
2. **Não fazer commit, push, deploy ou build de produção sem autorização explícita.**
3. **Não alterar layout/render visual quando a tarefa for somente SEO, metadados, head, manifest ou ajustes técnicos.**
4. **Não mexer em arquivos fora do escopo aprovado.**
5. **Não remover conteúdo existente sem justificar e pedir confirmação.**
6. **Não criar arquivos novos desnecessários.**
7. **Não assumir que páginas antigas inexistentes devem ser recriadas sem confirmação.**
8. **Sempre preservar compatibilidade com o site estático e com o comportamento atual de produção.**
9. **Sempre entregar relatório final com arquivos alterados, motivo das alterações, riscos e próximos passos.**

---

## Regras específicas de escopo e conteúdo (produção atual)

Estas regras complementam as obrigatórias acima e refletem o estado atual do site em produção.

1. **Preferir mudanças pequenas e de escopo bem delimitado.** Evitar refatorações amplas ou alterações que ultrapassem o pedido.
2. **Inspecionar antes de editar.** Ler o arquivo/trecho real e entender consumidores/dependências antes de qualquer alteração; nunca assumir estrutura de memória.
3. **Não commitar `docs/auditoria-output/*`** (nem outros artefatos gerados por scripts de auditoria) a menos que explicitamente solicitado. São saídas ruidosas e regeneráveis; reverter antes de commit por padrão.
4. **Não inventar dados de negócios turísticos.** Nunca criar/alterar telefones, endereços, coordenadas, horários, imagens, redes sociais ou nomes de estabelecimentos sem fonte confirmada. Pendências de dados devem ser apenas documentadas para validação humana.
5. **Admin, CMS, Firebase e áreas restritas estão pausados temporariamente** após o CMS-5C. Não alterar regras, autenticação, fluxos de aprovação/cadastro, dados protegidos ou integrações CMS sem pedido explícito. A frente ativa passa a ser auditoria e melhoria do site público.
6. **Preservar as ferramentas de acessibilidade e navegação do site:** VLibras, seletor de idiomas (PT/EN/ES/PL), atalhos móveis, mascote/capivara e a funcionalidade do mapa. Nenhum desses deve ser removido ou quebrado por tarefas de outro escopo.
7. **Não reintroduzir chatbox/cuia.** O antigo widget de chat (cuia) foi retirado e não deve voltar sem decisão explícita do responsável.
8. **Sempre reportar ao final:** arquivos alterados, verificações/comandos executados, riscos residuais e próximo passo recomendado.

---

## Fluxo obrigatório para cada tarefa

Antes de editar:

1. Ler este `CLAUDE.md`.
2. Ler `TASKS.md`.
3. Conferir `CHANGELOG_AI.md` para entender alterações anteriores.
4. Responder com:
   - entendimento do estado atual;
   - arquivos que pretende analisar;
   - arquivos que pretende alterar;
   - riscos;
   - plano em etapas.
5. Aguardar aprovação quando a tarefa envolver alteração sensível, estrutural, visual, SEO global, deploy ou commit.

Depois de editar:

1. Listar exatamente os arquivos alterados.
2. Explicar o que mudou em cada arquivo.
3. Informar comandos executados.
4. Informar validações feitas.
5. Informar riscos residuais.
6. Registrar resumo no `CHANGELOG_AI.md`, se autorizado.
7. Não fazer commit sem autorização.

---

## Estrutura de decisão: auditor antes de executor

Para qualquer tarefa técnica, primeiro classificar os achados em:

- **Seguro aplicar agora**
- **Precisa de confirmação**
- **Não recomendado mexer**
- **Follow-up/documentar depois**

Use essa classificação principalmente para:
- SEO;
- metadados;
- canonical;
- manifest;
- PWA;
- rotas;
- redirects;
- páginas legadas;
- alterações visuais;
- Firebase/Netlify/hosting.

---

## Escopo técnico provável do projeto

Este projeto deve ser tratado como site institucional/turístico estático, com foco em:

- HTML
- CSS
- JavaScript
- assets de imagem/vídeo
- metadados SEO/Open Graph/Twitter
- manifest/PWA
- rotas limpas conforme hosting
- compatibilidade mobile
- performance visual

Se houver framework, build system ou configuração específica no repositório, identificar antes de alterar.

---

## Regras de SEO e metadados

Ao mexer em SEO/head/metadados:

1. Alterar somente o `<head>` quando essa for a tarefa.
2. Não modificar layout, CSS, render, conteúdo visível ou scripts fora do escopo.
3. Validar:
   - `<title>`;
   - meta description;
   - canonical;
   - Open Graph;
   - Twitter Card;
   - imagem absoluta válida;
   - URL limpa;
   - acentos e caracteres especiais;
   - não cortar palavra no meio.
4. Descrições longas devem ser normalizadas, encurtadas e cortadas com segurança.
5. Usar descrição com aproximadamente 150–155 caracteres quando fizer sentido.
6. Não criar canonical quebrado.
7. Não colapsar fichas/páginas diferentes em uma única URL.
8. Query params devem usar `encodeURIComponent` quando necessário.
9. Imagens de compartilhamento devem apontar para URL absoluta válida.

---

## Observações específicas já conhecidas

### Auditoria pública pós-Claude Fable 5

- B1 — cache-busting público concluído em 2026-07-08 com token `?v=site-public-b1-20260708` padronizado em referências públicas de JS/CSS/dados e carregadores dinâmicos. Admin/CMS/Firebase não foram tocados.
- B2 — higiene de `sitemap.xml` concluída em 2026-07-08: sitemap reduzido para 11 URLs, sem páginas legadas/suspensas, sem `/local` genérico, sem bloco `hreflang` client-side e sem namespace `xhtml` sem uso. HTML/CSS/JS/Admin/CMS/Firebase não foram tocados.
- B5 — diagnóstico Firebase público concluído em 2026-07-08, somente leitura e sem arquivos alterados. Confirmou Firebase compat em `mapa-turistico.html` e `eventos.html`, duplicação compat + modular em páginas com `public-banners.js`, Firebase como enriquecimento e fallback estático preservado.
- B4a — timeout do mapa concluído em 2026-07-08, com alteração restrita a `js/mapa-turistico.js`: timeout de 2,5s na leitura pública de eventos aprovados do Firestore, preservando dados estáticos e empreendimentos. Bloco testado, commitado e enviado por push.
- SEO-F1 — follow-up de `noindex,follow` concluído em 2026-07-08 nas páginas legadas/suspensas `mapa-completo.html`, `mapa-3d.html` e `roteiro-ia.html`, já removidas do sitemap. As páginas seguem existindo para acesso direto; `sitemap.xml`, `robots.txt`, CSS, JS, dados turísticos, Admin/CMS/Firebase e rules não foram tocados.
- V1+V2 — bloco visual/UX concluído em 2026-07-09, aprovado, commitado e enviado por push. V1 corrigiu o formulário de contato da home usando `.form-submit` e `#formStatus`; V2 melhorou CTAs/links editoriais da home para `/sabores` e `/onde-ficar`, ajustou chips relacionados e adicionou a chave i18n `hospedagem-ver-todas`. CSS, dados turísticos, Admin/CMS/Firebase e rules não foram tocados.
- V3 — navegação concluído em 2026-07-09, testado em produção, commitado e enviado por push. Ajustou paridade entre home e `nav-shared.js`: logo da home para `/`, skip link para `#navLinks`, Planeje > Onde Ficar para `/onde-ficar`, atalhos mobile Comer/Ficar para `/sabores` e `/onde-ficar`, e `aria-controls`/`id` nos dropdowns Agenda e Planeje. Nenhum CSS, dado turístico, Admin/CMS/Firebase ou rule foi tocado. O mapa carregou corretamente em produção; erros locais anteriores eram de ambiente local/cache/service worker.
- V4A+V4B+V4C — limpeza de peso morto da home concluída em microblocos, testada, commitada e enviada por push. `index.html` foi o único arquivo alterado nesses blocos. V4A removeu a seção duplicada e oculta `#onde-ficar-placeholder` e handler órfão de newsletter; V4B removeu a galeria oculta `#galeria`, preservando `galeria.html` e links para `/galeria`; V4C removeu o script órfão "Direto do Produtor", o modal do mini-mapa e telefones placeholder `99999-xxxx` do fonte público. Aproximadamente 404 linhas de peso morto foram removidas. Nenhum CSS, `translations.js`, dados turísticos reais, Admin/CMS/Firebase ou rules foi alterado.
- V5A — primeiro microbloco da consolidação de eventos/notícias da home concluído em 2026-07-09, validado, commitado e reenviado por push após instabilidade/cancelamento do GitHub Pages. `index.html` foi o único arquivo de código alterado no bloco: removeu o banner/section AgroSamas oculto e o script inline exclusivo (`ativarBannerAgrosamas`, `fecharBannerAgrosamas`, `localStorage agrosamas-banner-closed` e autoativação comentada), removendo aproximadamente 63 linhas. O slot moderno `#public-banners-slot` foi preservado como caminho oficial para banners/campanhas via `js/public-banners.js`; `config.js` e `translations.js` foram preservados. A data/hora da última atualização do site foi atualizada antes do commit real de publicação/reenvio do V5A, e o GitHub Pages build and deployment concluiu novamente com check verde. As seções Acontece em breve, Festas em Destaque e Eventos & Notícias foram preservadas. Nenhum CSS, mídia, dados de eventos, dados turísticos reais, menu/footer, Admin/CMS/Firebase ou rules foi tocado.
- V5B — priorização de eventos únicos/não recorrentes na grade "Acontece em breve" concluída, validada, enviada por push e publicada em 2026-07-10. Eventos recorrentes passaram a completar vagas somente quando houver menos de quatro eventos únicos futuros; a seleção permanece limitada a quatro cards e é reordenada cronologicamente, preservando o desempate por vínculo a estabelecimento. O fallback estático e o merge com eventos aprovados do Firebase foram preservados. `eventos-2026.json`, `js/data/eventos.js` e as demais fontes de dados permaneceram intactos. A data/hora da última atualização do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit de código.
- V5C1 — correção dos links dos três cards de "Eventos & Notícias" concluída, validada, enviada por push e publicada em 2026-07-10. Polskie Smaki, Fanfarras municipais e Estruturação do turismo local agora apontam para matérias individuais reais do Portal oficial da Prefeitura, abrem em nova aba com `target="_blank"` e usam `rel="noopener noreferrer"`. O CTA geral "Ver todas as notícias" continua em `/noticias`; textos, imagens, datas, categorias, traduções, layout e CSS foram preservados. A data/hora da última atualização do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit de código.
- V5C2+V5C2A — atualização editorial sincronizada entre a home e `noticias.html` concluída, validada, enviada por push e publicada em 2026-07-13. O primeiro card da home passou a destacar a matéria do 32º Mês Polonês, também inserida no topo de `noticias.html`; o microajuste V5C2A transferiu de forma coerente o destaque, o `h2` e o selo para a matéria nova, mantendo a notícia antiga do regulamento como card comum com `h3` e categoria Cultura. Nenhuma notícia anterior foi removida; os cards 2 e 3 da home, o CTA geral `/noticias`, CSS, JavaScript, `translations.js` e a camada opcional do CMS foram preservados. A data/hora da última atualização do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit funcional. Follow-ups editoriais: revisar o destaque após 30/08/2026, aplicar a rotação mensal e remover ou substituir cards de eventos em até aproximadamente sete dias após o encerramento; a possível troca da imagem compartilhada pelas notícias nova e antiga depende de conferência visual e bloco separado.
- Checkpoint arquitetural pós-V5 — diagnóstico somente leitura concluído e tag anotada `pos-v5-checkpoint` criada e enviada ao remoto. A decisão aprovada é manter o projeto atual e adotar refatoração modular progressiva como espinha dorsal, com microblocos editoriais/órfãos e B3 em frente própria; não reescrever a home, criar projeto novo ou retomar Admin/CMS/Firebase. A dívida principal permanece concentrada em `index.html` e `css/index.css`, sem justificar reconstrução total. R1, R2 e R3 foram mantidos como extrações separadas da grade "Acontece em breve", do carrossel de experiências e do formulário de contato; V6 vem depois da fundação modular; V7 ocorrerá no projeto atual usando `js/nav-shared.js` como base única; B3 permanece em fase própria. V4D, V5C3 e V5D continuam pendentes.
- R1 — extração da grade "Acontece em breve" concluída, validada, commitada, enviada por push e publicada em 2026-07-13. `js/home-eventos.js` é o primeiro módulo da Fase 1; a extração foi comportamentalmente 1:1, removeu aproximadamente 183 linhas de JavaScript inline de `index.html`, preservou V5B, fallback estático e enriquecimento Firebase, e manteve o carrossel integralmente inline. O aprendizado para R2–R5 é reavaliar todo `import()` relativo após externalização, considerando a localização do novo script e testando o Network para evitar caminhos duplicados como `/js/js/`. R1 permaneceu intacto durante R2.
- R3 — extração comportamental 1:1 da lógica do formulário de contato concluída, validada, commitada, enviada por push e publicada em 2026-07-13. `js/home-contato.js` é o terceiro módulo da Fase 1; aproximadamente 58 linhas de JavaScript inline foram removidas de `index.html`, sem mudança funcional ou visual. A referência única usa `defer` e `?v=site-public-b1-20260708` e foi posicionada antes de `js/home-experiencias.js` e `js/home-eventos.js`; a lógica permanece privada em IIFE, sem propriedade em `window`, export ou nova dependência. O endpoint `https://formspree.io/f/xpqykpqd`, o `FORMSPREE_ID` `xpqykpqd`, o POST, headers, `FormData`, mensagens, classes, reset condicionado ao sucesso, timeout de 6000 ms, console.error, validação nativa e retornos silenciosos foram preservados. Nenhum envio real foi executado durante a validação; R1 e R2 permaneceram intactos, e markup, CSS, `translations.js` e `config.js` permaneceram intactos. A metadata foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`; o commit é `9d9a8ef refactor(home): extrai formulario de contato para modulo dedicado`.
- R4A — extração comportamental 1:1 da acessibilidade eMAG concluída, validada, commitada, enviada por push e publicada em 2026-07-16. `js/home-acessibilidade.js` é o módulo dedicado para tamanho da fonte, alto contraste, restauração via `localStorage`, `prefers-reduced-motion`/vídeos e atalhos Alt+1..4; aproximadamente 97 linhas inline foram removidas de `index.html`, sem mudança visual ou funcional. O commit funcional é `db1b3cb refactor(home): extrai acessibilidade eMAG para modulo dedicado`. `window.changeFontSize` e `window.toggleContrast` foram preservadas explicitamente para o markup com `onclick`; `currentFontSize` permanece privado. O contrato das chaves `sms-font-size` e `sms-high-contrast`, limites/classes da fonte, contraste, reduced motion, pausa dos vídeos, atalhos, null-checks e demais comportamentos foram preservados. R1, R2, R3 e R4B permaneceram intactos; markup e CSS permaneceram intactos; GitHub Pages foi publicado e validado na validação funcional anterior ao registro.
- Pendência externa do Formspree: o endpoint permanece `xpqykpqd`, e o Workflow atual continua temporariamente entregando para `imprensapmsms@gmail.com`. O endereço institucional obrigatório `turismo@saomateusdosul.pr.gov.br` já foi adicionado em Linked Emails, mas permanece `PENDING` e depende de confirmação por outro setor. Nenhum envio real deve ocorrer enquanto estiver `PENDING`. Após `VERIFIED`, deve-se selecionar esse endereço em Forms > TURISMO > Workflow > Email, salvar com a ação Enabled, realizar um único envio institucional controlado, confirmar o recebimento no novo endereço e confirmar que o Gmail antigo deixou de receber. A troca ocorrerá somente no painel do Formspree e não exigirá código, metadata, commit ou deploy.
- Próximos caminhos possíveis: R5 i18n/fallback inline é o próximo bloco da Fase 1, ainda não iniciado e por último, com maior sensibilidade. Antes de qualquer `R5-EXEC`, deverá existir um `R5-PREP` somente em análise. V4D fallback inline de traduções permanece pendente, risco médio, só deve ser executado por decisão consciente; alternativa aceitável é manter como dívida técnica documentada. V5C3 fica pendente para avaliar a extração do `style` inline dos CTAs para classe compartilhada; exige CSS, não deve ser executado automaticamente e pode integrar um bloco visual maior. O follow-up arquitetural de uma fonte única de notícias para evitar manutenção duplicada entre home e `noticias.html` permanece fora do V5C, aguardando decisão entre JSON, CMS ou outra solução futura e possível retomada do CMS. V5D fica pendente para revisão anti-envelhecimento de Festas em Destaque, com risco médio e dependência de alteração em `translations.js`, portanto somente com decisão consciente. V6 e V7 continuam somente após a fundação modular; V7 é de alto risco e fica para depois. B3 mídia/performance permanece em fase própria e por último. Follow-ups separados: revisar CSS órfão `.agrosamas-banner`; revisar chaves i18n órfãs relacionadas aos blocos removidos, incluindo `agrosamas-banner-*`, `modal-endereco`, `modal-telefone` e `modal-horario`; registrar que `CONFIG.agrosamas` está temporariamente sem efeito na home; revisar CSS órfão `.map-modal-*` em bloco próprio; planejar a virada anual de `eventos-2026.json`; avaliar futuramente a duplicação entre `eventos-2026.json` e `TURISMO_EVENTOS`; revisar editorialmente o destaque do 32º Mês Polonês após 30/08/2026; investigar Service Worker em localhost se voltar a interceptar Leaflet/OSM, sem tratar como regressão do V3.
- Admin/CMS/Firebase seguem pausados até bloco explícito.

### Estado atual da refatoração modular da home

- R4B foi concluído, validado, commitado, enviado por push e publicado em 2026-07-15. `js/home-utilitarios.js` é o quarto módulo dedicado da Fase 1 e contém somente a barra de progresso de rolagem e o botão “Voltar ao topo”; aproximadamente 36 linhas inline foram removidas de `index.html` em uma extração comportamental 1:1, sem mudança visual ou funcional. A referência usa `<script src="js/home-utilitarios.js?v=site-public-b1-20260708" defer></script>` no mesmo ponto do bloco anterior, depois do init do VLibras e antes do menu hamburger. Variáveis privadas em IIFE, null-checks, listeners, cálculos, limiar de 300px, classe `visible` e rolagem suave foram preservados; não houve export, nova dependência, `requestAnimationFrame`, debounce, throttle ou novo tratamento de `prefers-reduced-motion`. O commit funcional é `b272330 refactor(home): extrai utilitarios visuais para modulo dedicado`.
- R1, R2 e R3 permaneceram intactos durante R4B. Menu hamburger, seletor de idiomas, i18n, barra eMAG, fonte, contraste, atalhos e acessibilidade eMAG permaneceram intactos.
- R4A foi concluído como módulo separado de R4B, com `js/home-acessibilidade.js`, extração 1:1, aproximadamente 97 linhas inline removidas de `index.html`, sem mudança visual ou funcional e com GitHub Pages publicado e validado. O commit funcional é `db1b3cb refactor(home): extrai acessibilidade eMAG para modulo dedicado`; `window.changeFontSize` e `window.toggleContrast` permanecem globais, enquanto `currentFontSize` permanece privado. R5 i18n/fallback inline é agora o próximo bloco, ainda não iniciado; antes de qualquer `R5-EXEC`, deverá existir um `R5-PREP` somente em análise.

### Páginas legadas/intocadas

As páginas abaixo existem, mas devem ser tratadas como legado/futuro/suspenso e não devem ser mexidas sem autorização explícita:

- `mapa-completo.html`
- `mapa-3d.html`
- `roteiro-ia.html`

### Páginas antigas que não existem

Não assumir que estas páginas existem (nomes de arquivo legados, sem arquivo real no projeto):

- gastronomia.html
- rotas.html
- cultura.html

Equivalentes/alternativas já identificadas:

- gastronomia: `sabores.html`
- rotas: `rotas-completas.html` e filtros do mapa
- cultura: conteúdo cultural distribuído em outras áreas

### Manifest/PWA

Pontos de atenção:

- `manifest.json` deve manter `name`, `short_name`, `description`, `start_url`, `scope` e cores coerentes.
- Ícone declarado `192x192` deve ter dimensão real compatível.
- Se faltar ícone real `512x512`, documentar como follow-up. Não inventar imagem.
- Shortcuts antigos podem apontar para ícones `96x96` pré-existentes; documentar se necessário.
- PWA sem ícone 512 pode degradar splash/instalação no Android, mas não quebra o site.

### Canonical e hosting

- Canonicals com URL limpa podem depender do rewrite do servidor sem `.html`.
- Se o hosting mudar, revalidar comportamento de rotas limpas.
- Não alterar regra de servidor/hosting sem confirmação.

---

## Arquivos de governança do projeto

Este projeto deve manter estes arquivos na raiz do repositório:

- `CLAUDE.md` — regras permanentes e forma de trabalho.
- `TASKS.md` — pendências, estado atual e próximos passos.
- `CHANGELOG_AI.md` — registro das alterações feitas com IA.

Estes arquivos não substituem Git, mas ajudam a manter continuidade entre conversas e sessões.

---

## Formato de resposta esperado do Claude/Claude Code

### Antes de editar

Responder assim:

```md
## Entendimento

[Resumo objetivo]

## Arquivos que vou analisar

- ...

## Arquivos que pretendo alterar

- ...

## Plano

1. ...
2. ...
3. ...

## Riscos

- ...

Aguardo aprovação antes de editar.
```

### Depois de editar

Responder assim:

```md
## Alterações aplicadas

### Arquivos alterados

- `arquivo.ext` — o que mudou

## Validações

- comando executado
- resultado

## Riscos / observações

- ...

## Próximo passo recomendado

- ...
```

---

## Comandos e cuidados

- Antes de mexer, verificar estado do Git se aplicável:
  - `git status`
- Nunca usar comandos destrutivos sem autorização:
  - `git reset --hard`
  - `git clean -fd`
  - remoção em massa
  - rebase
  - force push
- Não editar arquivos gerados automaticamente sem confirmar origem.
- Não mexer em `dist`, `build`, caches ou assets minificados sem necessidade comprovada.

---

## Handoff entre conversas

Quando uma conversa estiver longa ou perto de perder clareza, gerar handoff técnico com:

- objetivo do projeto;
- estado atual;
- arquivos alterados;
- arquivos que não devem ser mexidos;
- decisões tomadas;
- pendências;
- comandos executados;
- riscos conhecidos;
- próximo passo recomendado.

Modelo de prompt:

```text
Faça um handoff técnico completo desta conversa para eu continuar em uma nova conversa.

Inclua:
- objetivo do projeto
- estado atual
- arquivos alterados
- arquivos que NÃO devem ser mexidos
- decisões já tomadas
- pendências
- comandos já executados
- riscos conhecidos
- próximo passo recomendado

Seja objetivo, mas completo.
```

---

## Prioridade geral do projeto

1. Segurança do site em produção.
2. Preservação do layout aprovado.
3. Clareza institucional.
4. SEO correto.
5. Mobile e performance.
6. Organização técnica.
7. Evoluções visuais apenas quando solicitadas.
