# D — Backlog priorizado de correções e melhorias

Ordem pensada por **risco e dependência**: primeiro saber o que está em produção, depois impedir perda de dados e conteúdo fora do ar, depois clareza, depois recursos. Cada item indica os IDs dos relatórios A/B/C e dos anexos.

Esforço: **P** pequeno (até meio dia) · **M** médio (1–3 dias) · **G** grande (mais de 3 dias). Itens marcados com 🔒 mexem em Rules, Storage ou produção e exigem bloco e autorização próprios, conforme o `CLAUDE.md`.

---

## Rodada 0 — Antes de qualquer código (diagnóstico de produção)

| # | Ação | Por quê | Esforço |
|---|---|---|---|
| 0.1 🔒 | Comparar, **só leitura**, os rulesets Firestore/Storage implantados com `firestore.rules`/`storage.rules` do Git, e confirmar se `writeAdminAuditLog` e `prefeituraFeed` estão implantadas | Último deploy de Rules registrado em 13/08; 7 commits de Rules depois sem registro. Os 492 testes de Rules provam o Git, não a produção. Isso muda a prioridade de vários itens abaixo. | P |
| 0.2 | Verificar no console: MFA dos admins, política de senha, App Check, quem são os admins ativos | SEC-04, SEC-07 | P |
| 0.3 | Confirmar se GitHub Pages é a hospedagem final do painel (headers de `_headers` são ignorados) | SEC-06 | P |

## Rodada 1 — Segurança e problemas críticos

| # | Ação | IDs | Esforço |
|---|---|---|---|
| 1.1 | **Empreendimento publicado não pode sair do ar por falha de salvamento.** Curto prazo: leituras de reconciliação com `get({source:"server"})`; mensagem de falha "FORA DO PORTAL — clique em Concluir e republicar"; selo na lista e alerta no Início para itens com `editSession`. Depois: aplicar edição de publicado numa única transação, sem passar por `draft`. Teste no Emulator que simule falha no meio da saga. | BUG-02, UX-42, FUNC-13 | P (curto) + M (estrutural) |
| 1.2 | **Guarda de alterações não salvas** (menu, fundo do modal, Voltar, `beforeunload`) e aviso antes do logout por inatividade | BUG-01, UX-40, UX-41, FUNC-10 | M |
| 1.3 | **Importador da Prefeitura:** atualização de notícia publicada vira revisão pendente (ou despublica com aviso explícito); corrigir textos | BUG-05, UX-43, FUNC-09 | P |
| 1.4 🔒 | **Rascunhos de eventos fora da leitura pública:** mesma correção já feita em `noticias` (`read: if isAdmin() \|\| publicado == true`) + consultas públicas com `where`. Antes, unificar a regra de "publicado" (2.1) para não sumir evento do site. | DATA-02, FUNC-28 | M |
| 1.5 🔒 | `cms-media`: remover **listagem** pública (manter `get` de arquivo) | SEC-01 | P |
| 1.6 🔒 | `usuarios` self-create: allowlist de campos; `email` igual ao do token | SEC-02 | P |
| 1.7 | Decisão de produto sobre **Reservas**: tela de leitura simples no painel ou retirar `/reservas` do ar e do sitemap (há dados pessoais sendo coletados sem leitor) | FUNC-03 | P (decisão) + M (tela) |
| 1.8 | Ativar MFA para administradores; senha mínima maior | SEC-04 | P (config) |
| 1.9 | Proteção do último administrador (não permitir rebaixar/desativar o único admin ativo) | SEC-10 | P |

## Rodada 2 — Correções funcionais

| # | Ação | IDs | Esforço |
|---|---|---|---|
| 2.1 | **Uma única regra de "evento publicado"** num módulo compartilhado, usada por home, agenda, mapa e painel; cobrir com teste | DATA-01 | M |
| 2.2 | Corrigir handlers inline com `\\\'` em `admin-content-cms.js` (trocar por `addEventListener`) | BUG-03, FUNC-01 | P |
| 2.3 | `type="url"` → `type="text"` com o validador existente (notícias, banners) | BUG-04, FUNC-02 | P |
| 2.4 | Botões de publicar/destacar gravam o **estado desejado** (não invertem o local) e usam `update` em vez de `set(merge)` para não recriar excluídos | FUNC-07, DATA-12 | P |
| 2.5 | Verificação de `updatedAt`/revisão antes de gravar em eventos, notícias e banners (padrão de `cms_establishments`) | FUNC-12, FUNC-14, DATA-12 | M |
| 2.6 | Galeria: não redesenhar formulários em edição; encerrar listener ao sair | FUNC-11, PERF-05 | P |
| 2.7 | Notícia "Publicado" no painel = `publicado === true` (mesma regra da Rule) | FUNC-08, DATA-03 | P |
| 2.8 | Trava contra duplo clique em aprovar, duplicar e enviar mídia | FUNC-06, FUNC-16 | P |
| 2.9 | Erro de leitura ≠ lista vazia; `checkExistingManager` não pode devolver `null` em erro | FUNC-15 | P |
| 2.10 | Badge de Aprovações e fila com a mesma regra; pedidos aplicados saem da fila | FUNC-18, UX-05 | P |
| 2.11 | Validar antes de fazer upload (evita órfãos) | FUNC-05, DATA-07 | P |
| 2.12 | Formulário de evento não pode ficar preso em "Salvando…"; sazonal/mascote avisam erro | FUNC-04, FUNC-20 | P |
| 2.13 | `.gitattributes` (LF) ou normalização nos testes para eliminar as 2 falhas por CRLF | §2 do relatório A | P |
| 2.14 | Primeiros **testes de interface** do painel (navegador + Emulator) cobrindo BUG-01 a BUG-04 | Lacuna de testes | M |

## Rodada 3 — Navegação e facilidade de uso

| # | Ação | IDs | Esforço |
|---|---|---|---|
| 3.1 | Glossário único: status "No ar / Rascunho / Arquivado", dois verbos de salvar, "Aceitar…" no lugar de "Aprovar…", sem UIDs, acentos restaurados | UX-10, UX-11, UX-03 | M |
| 3.2 | Mensagens de erro com próximo passo, sem "console", "Rules", "Emulator" | UX-10 | P |
| 3.3 | Modais acessíveis (foco, Esc, trava de Tab, retorno de foco) reaproveitando `admin-feedback.js` | UX-60 | M |
| 3.4 | Anel de foco e contrastes WCAG AA | UX-61, UX-62 | P |
| 3.5 | Busca + filtro de status em Eventos e Notícias; filtros preservados entre seções | UX-12, UX-46 | P |
| 3.6 | "Abrir no portal" em itens no ar | UX-13 | P |
| 3.7 | Marcação "(obrigatório)"; identificador de empreendimento gerado do nome; data de notícia como campo de data; categoria de evento como lista | UX-20, UX-21, UX-23, UX-24 | P |
| 3.8 | Editor de empreendimento em tela própria (não abaixo da lista), com fotos (legenda, crédito, capa, ordem) dentro do editor | UX-17, UX-22 | M |
| 3.9 | Pedido de alteração em um painel "Antes / Depois" com um só "Aplicar" | UX-04 | M |
| 3.10 | Paginação/"Mostrar mais"; nomes acessíveis nos botões de linha; Registro de atividades responsivo | PERF-01, UX-67 | P |
| 3.11 | Login com rótulos e "Esqueci minha senha" | UX-30 | P |
| 3.12 | Esconder "Importar notícias estáticas"; "Restaurar" em rotas arquivadas; remover opção `moderator` | UX-06, UX-15, UX-16 | P |
| 3.13 | Reorganização do menu em 8 itens (relatório B §2), só nos rótulos e agrupamentos | UX-02, UX-07, UX-08 | M |

## Rodada 4 — Funcionalidades importantes

| # | Ação | Referência | Esforço |
|---|---|---|---|
| 4.1 🔒 | **Biblioteca de fotos única** com autor, licença e fonte; seletor em todos os editores; crédito vindo da biblioteca (resolve a divergência com `js/image-attribution.js`); migração com dry-run | C §3, DATA-15 | G |
| 4.2 | Teste inverso de atribuição (todo arquivo de terceiros publicado tem crédito) e aviso quando o crédito digitado é sobrescrito pelo registro | DATA-15 | P |
| 4.3 | Histórico por item com autor legível e "o que mudou" | SEC-11, FUNC-19 | M |
| 4.4 | Despublicação automática de eventos encerrados | C §2 | P/M |
| 4.5 | Alerta de cadastros sem revisão há mais de N meses no Início | C §4 | P |
| 4.6 | Prévia antes de publicar em Empreendimentos e Banners; editar banner publicado sem tirá-lo do ar | UX-14 | M |
| 4.7 | Galeria pública: criar e excluir itens | C §3 | P |
| 4.8 | Campos de acessibilidade do local (rampa, banheiro adaptado etc.) | C §4 | P |

## Rodada 5 — Otimização e aprimoramento

| # | Ação | Referência | Esforço |
|---|---|---|---|
| 5.1 | `count()` no Início; consultas com `where`/`limit` em vez de coleções inteiras | PERF-01, PERF-02 | M |
| 5.2 🔒 | CSP sem `unsafe-inline`/`unsafe-eval` (depende de 2.2 e da remoção dos handlers inline restantes); retirar o endpoint `workers.dev` do chatbot | SEC-05 | M |
| 5.3 | Atualizar SDK Firebase (10.7.1 → 12.x) com SRI; não carregar compat + modular juntos | PERF-11, SEC-13 | M |
| 5.4 | Remover código morto: `AdminRouter` sem uso (ou passar a usá-lo, ativando `dispose()`), `placeholder.js`, fallbacks inline, `estabelecimentos_aprovados` | Anexo 1 §5 | M |
| 5.5 | Tratamento de offline/timeout com mensagem clara | PERF-10 | P |
| 5.6 | `firestore.indexes.json` versionado | anexo 3 | P |
| 5.7 | Trigger de auditoria ignorando `audit_logs` e cobrindo Storage/reservas | SEC-11 | P |

---

## Dependências que mudam a ordem

- **0.1 antes de tudo:** se as Rules de produção estiverem atrás do Git, publicá-las (com autorização) vira o primeiro item da Rodada 1.
- **2.1 antes de 1.4:** fechar a leitura pública de rascunhos de eventos sem unificar a regra de "publicado" pode esconder eventos que hoje aparecem.
- **2.2 antes de 5.2:** a CSP só pode ficar estrita depois que os handlers inline saírem.
- **3.1 antes de 3.13:** renomear o menu sem unificar os status mantém a confusão.
- **4.1 depois de 4.2:** o teste inverso mede o tamanho real da migração de créditos.
