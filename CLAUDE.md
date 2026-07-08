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
