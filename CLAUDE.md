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
- Próximos caminhos possíveis: V4D fallback inline de traduções permanece pendente, risco médio, só deve ser executado por decisão consciente; alternativa aceitável é manter como dívida técnica documentada. V5C fica pendente para higiene editorial de Eventos & Notícias, incluindo confirmar links reais das notícias e revisar conteúdo hard-coded e datas envelhecidas; risco médio e decisão humana item por item. V5D fica pendente para revisão anti-envelhecimento de Festas em Destaque, com risco médio e dependência de alteração em `translations.js`, portanto somente com decisão consciente. Depois: V6 reordenação da metade inferior da home; V7 unificação da navegação como alto risco e para depois; B3 mídia/performance por último. Follow-ups separados: revisar CSS órfão `.agrosamas-banner`; revisar chaves i18n órfãs relacionadas aos blocos removidos, incluindo `agrosamas-banner-*`, `modal-endereco`, `modal-telefone` e `modal-horario`; registrar que `CONFIG.agrosamas` está temporariamente sem efeito na home; revisar CSS órfão `.map-modal-*` em bloco próprio; planejar a virada anual de `eventos-2026.json`; avaliar futuramente a duplicação entre `eventos-2026.json` e `TURISMO_EVENTOS`; investigar Service Worker em localhost se voltar a interceptar Leaflet/OSM, sem tratar como regressão do V3.
- Admin/CMS/Firebase seguem pausados até bloco explícito.

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
