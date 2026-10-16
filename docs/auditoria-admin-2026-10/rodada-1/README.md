# Rodada 1 — Estabilização do painel administrativo

**Data:** 16/10/2026 · **Branch:** `admin/rodada-1-estabilizacao` (worktree `.worktrees/admin-rodada-1`), criada a partir de `origin/main` `f0bf549` · **Base de referência:** [auditoria](../README.md).

Nada foi publicado: nenhum deploy de Rules, Functions ou Hosting, nenhum push, nenhuma escrita em dados reais. A única interação com produção foi **leitura**: comparação de configuração com a conta já logada no Firebase CLI e sondagem anônima do que qualquer visitante consegue ver. Todas as alterações foram testadas no Firebase Emulator com dados sintéticos.

---

## 1. Problemas corrigidos

| # | Problema (auditoria) | Correção | Como foi demonstrado |
|---|---|---|---|
| 1 | **Editar empreendimento publicado o tirava do ar** (BUG-02; caso Artur Biergarten) | Rules aceitam gravar um grupo num item publicado **mantendo-o publicado**, se o resultado continuar apto ao ar. O painel não passa mais por "Retirando publicação". Dados que deixariam o item impublicável são recusados **antes** de qualquer gravação. | Teste de interface: 30–32 leituras concorrentes durante o salvamento, **todas `published`**. Emulator: falha no meio mantém publicado, nova tentativa conclui (7 casos). |
| 2 | Falso "alterado por outro administrador" | Leituras de reconciliação sempre do servidor. Revisão menor que a já confirmada é tratada como leitura atrasada e relida. A nova tentativa reconhece a própria gravação parcial. | Cenário da auditoria (listener aberto) passou de **0 de 4 (auditoria) para 3 de 3**. Teste de leitura atrasada simulada. |
| 3 | Dois administradores sobrescrevendo um ao outro | Mantido o controle por revisão; a mensagem agora diz que nada foi sobrescrito, que o texto continua no formulário e se o item segue no ar. | Navegador com **duas sessões autenticadas distintas**: o texto de B foi preservado, A recebeu aviso claro, o item seguiu publicado. Emulator: 2 casos. |
| 4 | **Perda silenciosa de alterações** (BUG-01) | Proteção única (`js/admin/admin-unsaved-guard.js`): menu, Voltar do navegador, fundo/Fechar/Cancelar do modal, abrir outro cadastro, recarregar/fechar aba. **Não pergunta se nada mudou.** Aviso 5 min antes do fim da sessão. | Teste de interface: menu, Voltar (endereço restaurado), Cancelar, `beforeunload` com e sem alteração. |
| 5 | Modais sem foco, Esc e Tab (UX-60) | Foco entra no primeiro campo, Tab fica preso no diálogo, Esc fecha passando pela proteção, foco volta ao botão de origem. | Teste de interface. *Correção da auditoria:* o diálogo já tinha `role="dialog"`/`aria-modal`; faltavam foco, Esc e Tab. |
| 6 | **FUNC-01** — capa do evento pela Biblioteca não funcionava | Os 6 handlers inline geravam `\'` dentro do atributo (`SyntaxError`). | Teste de interface: escolher, remover, trocar, salvar e reabrir. |
| 7 | **FUNC-02** — `images/...` recusado em notícias/banners | Campos viraram texto com a validação do CMS. Notícias passaram a validar imagem, galeria, vídeo e link antes de gravar: aceita `https://` e caminhos do site; recusa `javascript:`, `data:`, `//host` e aspas. | Teste de interface (caminho aceito, `javascript:` recusado sem gravar) + validação isolada de 10 entradas. |
| 8 | UID técnico como autor | Nome de `usuarios/{uid}.nome`, com o ID da conta no `title` (rastreabilidade). | Teste de interface. |
| 9 | **Importador da Prefeitura alterava notícia no ar** (BUG-05, confirmado) | Notícia publicada nunca é sobrescrita: a versão nova fica em `atualizacaoOrigem` com selo "para revisar". No editor, "Usar o texto atualizado" só preenche o formulário, e publicar passa pela prévia. Rascunhos continuam recebendo o texto novo. Novo estado "pendente" evita regravar. | Emulator 5/5 (inclusive leitura anônima: o público não vê a mudança); unidade 10/10; interface: fluxo completo até publicar. **Nenhuma importação real.** |
| 10 | **Dados pessoais de eventos públicos** (novo — ver §4) | Rules: `eventos_aprovados` só expõe `publicado == true`. Home, agenda e mapa passam a consultar só publicados. | Rules +4 testes; política da home separada em servidor × cliente. |
| 11 | Listagem pública de `cms-media/` | `get` público mantido (as URLs continuam funcionando), `list` só admin. | Storage +2 testes. |
| 12 | Autocadastro com e-mail forjado (SEC-02) | Só os campos do Portal; e-mail, se informado, igual ao da conta; `verificado` não nasce `true`. | Rules +4 testes. |
| 13 | **Corrida no login** (novo, achado pelo teste de interface) | O primeiro evento "sem usuário" podia chegar depois do envio do formulário e fazer o painel encerrar a sessão recém-aberta como "expirada". | Antes: 2 de 3 execuções caíam. Depois: **7 execuções seguidas sem queda**. |
| 14 | 2 falhas de teste no Windows | Testes normalizam CRLF ao ler os fontes. Era portabilidade do teste, não do produto. | 28/28 e 28/28. |

## 2. Evidências dos testes (estado commitado `4989a46`)

| Suíte | Comando | Resultado |
|---|---|---|
| Firestore Rules | `npm run test:rules` | **432/432** (eram 421; +11 novos ou atualizados) |
| Storage Rules | idem | **73/73** (eram 71; +2) |
| Modelo de rotas + mídia | idem | 29/29 + 11/11 |
| E2E painel → portal no Emulator | `npm run test:admin-public-e2e` | **55/55** (eram 48; +7 de edição publicada) |
| Importador no Emulator | `npm run test:prefeitura-news:emulator` | 5/5 |
| **Interface no Chrome real** | `npm run test:admin-ui` (novo) | **6/6**, repetido 7 vezes sem falha |
| Suítes unitárias (35 arquivos, sem Emulator) | `node --test` em cada arquivo | **473/473** |

Logs completos em `rodada-1/evidencias/*.log`, ignorados pelo Git (`*.log` no `.gitignore`). Resumo também em [evidencias/resultados-testes.md](evidencias/resultados-testes.md).

**Testes antigos alterados, e por quê.** Cinco testes codificavam o comportamento que esta rodada corrige:
- Rules **P1** exigia que gravar num publicado fosse negado.
- Dois testes de retomada exigiam `status: "draft"` no meio da falha e contavam a transação de despublicação.
- O importador exigia sobrescrever a notícia no ar.
- A home exigia mostrar eventos legados sem `publicado`.

Cada um foi atualizado para o novo contrato. Os casos negativos foram mantidos ou ampliados: P1b–P1d, impublicável, sessão legada, não-admin.

## 3. Pendentes (não feitos nesta rodada)

| Item | Motivo / próximo passo |
|---|---|
| Publicar Rules e Hosting | Exige autorização (ver §8). |
| Remover os dados pessoais dos 12 rascunhos antigos em `eventos_aprovados` | É escrita em produção; com a Rule nova eles ficam privados, mas os dados continuam lá. Decidir: apagar os campos ou os documentos. |
| Reservas (FUNC-03) | Decisão de produto pendente (tela de leitura × retirar a página). Analisado em §6. |
| Botões de publicar/destacar invertem o estado local; `set(merge)` recria excluídos (FUNC-07, DATA-12) | Rodada 2. |
| Banners: última escrita vence (FUNC-14); galeria redesenha e apaga digitação (FUNC-11) | Rodada 2. |
| Uma regra única de "evento publicado" no cliente (DATA-01) | Parcialmente resolvido: o servidor agora só entrega `publicado == true`. Os filtros de cliente da agenda e do mapa ainda diferem; isso é inócuo (são mais restritivos), mas deve ser unificado. |
| Verificação de e-mail, MFA dos admins (desligado em produção), App Check sem enforcement | Configuração de console/IAM; bloco próprio. |
| Avisos (toasts) cobrem o botão "Salvar" do modal por alguns segundos | Achado do teste de interface; P3, rodada de UX. |
| Recuperação de rascunho após logout | Avaliado: o aviso de 5 min resolve o caso principal. Rascunho automático exigiria guardar texto no navegador (privacidade e versões); não implementado. |

## 4. Produção × repositório (somente leitura, 16/10/2026)

| Item | Produção | Repositório (`origin/main`) | Situação |
|---|---|---|---|
| Firestore Rules | release `cloud.firestore`, ruleset `126896db…`, publicado em 15/09 02:51 UTC | `firestore.rules` | **Idênticas** (SHA-256 normalizado `584e4ca6…` nos dois) |
| Storage Rules | release `firebase.storage/turismo-sms.firebasestorage.app`, ruleset `bed001ca…`, 15/09 02:58 UTC | `storage.rules` | **Idênticas** (`0bb7dc13…`) |
| Function `writeAdminAuditLog` | Gen 2, nodejs22, ACTIVE, atualizada em 05/09 | `functions/index.js` (sem mudança na função depois de 04/09) | Coerente |
| Function `prefeituraFeed` | Gen 2, nodejs22, ACTIVE, atualizada em 15/10 00:05 UTC | criada em `4c8d1a8` (14/10 20:59 −03) | Coerente (deploy posterior ao commit) |
| Auth | login por e-mail/senha; **MFA desligado**; proteção contra enumeração de e-mail ligada; sem *blocking functions*; 4 domínios autorizados | — | MFA continua recomendado |
| App Check | **UNENFORCED** em Firestore, Storage, Auth, Maps e Places | — | Como registrado |

A suspeita da auditoria ("Rules de produção possivelmente atrás do Git") **não se confirmou**: estão iguais. O código-fonte das functions não foi baixado; a coerência foi inferida pelas datas de deploy e de commit.

**Divergência de segurança grave encontrada em produção.**
- **O que está exposto:** `eventos_aprovados` é listável por qualquer pessoa. Hoje tem **12 documentos, todos rascunhos** (`publicado: false`), com dados pessoais de quem enviou:
  - e-mail do responsável (10) e e-mail de quem enviou (10);
  - nomes (10);
  - telefone e WhatsApp (12);
  - UIDs.
- **Como foi verificado:** consulta anônima à API pública, registrando só contagens e nomes de campos, nunca valores.
- **Contenção recomendada:** publicar a Rule desta rodada assim que autorizado. Hoje não há evento publicado nessa coleção, então o portal não perde nada.

Também confirmado: listagem anônima de `cms-media/` (uma pasta de usuário com 14 arquivos).

## 5. Commits

| Hash | Mensagem |
|---|---|
| `6b39e5b` | docs(admin): preserva a auditoria do painel administrativo (out/2026) |
| `71c54b1` | fix(admin): editar empreendimento publicado não o tira mais do ar |
| `4743c84` | fix(admin): leitura atrasada do servidor não vira falso conflito |
| `c029da7` | fix(admin): alterações não salvas, modais pelo teclado e corrida no login |
| `e19c0a0` | fix(admin): capa de evento, caminhos internos, autor legível e importador com revisão |
| `42a103d` | fix(security): rascunhos de eventos e pasta cms-media deixam de ser públicos |
| `0250dbc` | test(admin): testes de interface no Chrome e portabilidade CRLF |
| `4989a46` | test(admin): teste de capa do evento cobre remover e reabrir |
| (este) | docs(admin): relatório da Rodada 1 |

## 6. Riscos residuais

- **Edição de publicado em grupos:** o item continua no ar, mas os grupos são gravados um a um. Durante 1–3 segundos (ou até a nova tentativa, se houver falha) o portal pode mostrar, por exemplo, o resumo novo com o telefone antigo. Cada estado intermediário passa pela validação das Rules. A gravação atômica exigiria reescrever as Rules de grupo, que estão perto do limite de 1000 expressões (atingido e contornado nesta rodada para mídia).
- **Ordem de publicação:** com o painel novo e as Rules antigas, editar um empreendimento publicado **falha sem gravar nada** (o item fica no ar, com mensagem de erro). Por isso as Rules devem ir antes do painel (§8).
- **Eventos legados sem `publicado`** deixam de ser públicos. A produção não tem nenhum hoje, mas importações antigas que ainda não rodaram podem ter.
- **Dados pessoais** nos 12 rascunhos continuam gravados; a Rule só os torna privados.
- **Reservas:** coletam nome, e-mail, telefone e observações em `reservas`. As Rules já restringem leitura a admin e a coleção não é pública (confirmado por sondagem). Porém não há tela para ler, responder, reter ou excluir, e não há prazo de retenção. Sob a LGPD, coletar sem finalidade operacional ativa é o maior problema. Recomendação: decidir entre (a) tela de leitura com exclusão e prazo de retenção, ou (b) desligar o formulário e apagar o acumulado.
- **Testes de interface** dependem do Chrome instalado e das portas 8080/9099/9199/4191 livres.

## 7. Mudanças que precisam de deploy

| Alvo | Arquivos | Como |
|---|---|---|
| **Firestore Rules** | `firestore.rules` | `firebase deploy --only firestore:rules` |
| **Storage Rules** | `storage.rules` | `firebase deploy --only storage` |
| **Hosting (GitHub Pages)** | painel: `admin-firebase.html`, `js/admin/admin-unsaved-guard.js`, `js/admin/modules/empreendimentos.js`, `js/admin/modules/banners.js`, `js/admin-content-cms.js`, `js/admin/prefeitura-news*.js`; público: `index.html`, `eventos.html`, `mapa-turistico.html`, `js/home-eventos.js`, `js/mapa-turistico.js` | merge em `main` + push (publica automaticamente) |
| Cloud Functions | — | **nenhuma mudança** |
| Dados | — | nenhuma migração; limpeza de dados pessoais dos 12 rascunhos é decisão separada |

## 8. Plano de publicação segura e rollback

1. **Rules primeiro** (Firestore + Storage), num único bloco autorizado:
   - painel antigo + Rules novas: compatível. O fluxo antigo de despublicar → editar → republicar continua permitido.
   - páginas públicas antigas + Rule nova de eventos: a leitura da coleção inteira é negada e elas usam o conteúdo estático, como já fazem em falha. Hoje não existe evento publicado na coleção, então nada some.
2. **Validar em produção, só leitura:** repetir a sondagem anônima e confirmar listagem negada em `eventos_aprovados` e em `cms-media/`, mantendo o `get` de imagens.
3. **Hosting:** merge da branch em `main` e push.
4. **Homologar** pelo checklist (§9) com uma conta admin real, num empreendimento de teste ou com alteração reversível.
5. **Rollback:**
   - Rules: republicar os rulesets anteriores (`126896db…` e `bed001ca…`, no histórico do console) ou `firebase deploy` a partir de `f0bf549`.
   - Hosting: `git revert` dos commits da rodada, ou redeploy a partir da tag de rollback recomendada `admin-rodada1-rollback` = `f0bf549`, a criar antes do merge.
   - Para voltar só a mudança de eventos: as consultas públicas novas funcionam com a Rule antiga.

## 9. Checklist de homologação (produção, após o deploy)

- [ ] Anônimo: listar `eventos_aprovados` sem filtro → negado; com `publicado == true` → permitido.
- [ ] Anônimo: listar `cms-media/` → negado; abrir uma imagem publicada pela URL → funciona.
- [ ] Home, Agenda e Mapa carregam sem erro no console.
- [ ] Login de admin entra direto, sem "sessão expirou".
- [ ] Editar um empreendimento publicado: o item não some do portal em nenhum momento, e o aviso diz "salvas e publicadas".
- [ ] Alterar um campo e clicar em outro menu: aparece "Descartar alterações?" e "Continuar editando" mantém o texto.
- [ ] Sem alteração, trocar de menu não pergunta nada.
- [ ] Modal de evento: Esc fecha; Tab não sai do modal.
- [ ] Novo evento: escolher imagem na Biblioteca preenche a capa.
- [ ] Notícia com imagem `images/...` salva sem erro.
- [ ] Lista de notícias mostra o nome do autor.
- [ ] Importador: buscar e importar uma notícia **já publicada** que mudou na origem. O portal não muda, aparece o selo "para revisar", e publicar só ocorre depois da prévia.
- [ ] Autocadastro no Portal do Usuário continua funcionando.

## 10. Preparação da próxima rodada (navegabilidade e UX)

As recomendações da [auditoria de UX](../B-ux-navegabilidade.md) continuam válidas. A Rodada 1 resolveu as dependências de segurança e perda de dados: proteção de alterações, modais acessíveis, publicação sem sair do ar e importador seguro. Plano proposto, em ordem:

| Etapa | Conteúdo | Depende de | Esforço |
|---|---|---|---|
| 2.1 Correções restantes de dados | Publicar/destacar gravam o estado desejado e usam `update`; revisão em eventos, notícias e banners; galeria sem apagar digitação; regra única de "evento publicado" no cliente | — | M |
| 2.2 Linguagem | Glossário único ("No ar / Rascunho / Arquivado"); dois verbos de salvar; "Aceitar…" no lugar de "Aprovar…"; mensagens com próximo passo; acentos em `empreendimentos.js` | — | M |
| 2.3 Listas | Busca e filtro de status em Eventos e Notícias; "Abrir no portal"; paginação; filtros preservados; avisos sem cobrir botões | 2.2 (rótulos) | M |
| 2.4 Formulários | Empreendimento em tela própria e por etapas; obrigatórios marcados; endereço da página automático; fotos (legenda, crédito, capa) dentro do editor; data como campo de data | Rodada 1 (proteção de alterações) | M |
| 2.5 Menu | 15 → 8 itens por tarefa (Início, Agenda, Notícias, Lugares e negócios, Roteiros, Fotos, Avisos e campanhas, Administração), só rótulos e agrupamento | 2.2 | M |
| 2.6 Funcionalidades | Tela de Reservas (se decidido); biblioteca de fotos única com autor e licença (resolve os créditos de imagem); histórico com autor | decisões de produto | G |

Princípios: não criar telas redundantes; cada etapa com teste de interface no mesmo formato de `tests/admin-ui.browser.test.mjs`; nada de reformulação visual ampla.
