# A — Diagnóstico técnico e funcional do Painel Administrativo

**Data:** 16/10/2026 · **Base auditada:** `origin/main` `f0bf549` (worktree isolada `.worktrees/auditoria-admin`, detached) · **Ambiente de teste:** Firebase Emulator, projeto `demo-turismo-sms-admin-finalization`, dados sintéticos do seed `scripts/admin-painel-demo-seed.mjs`.

Nada foi alterado no código, nos dados reais, nas Rules ou na produção. A `main` local continua **42 commits atrás** de `origin/main` e com 4 arquivos modificados que não são desta auditoria (`AGENTS.md`, `docs/agent-runbook/*`). Eles foram preservados.

Relatórios detalhados de cada frente estão em [`anexos/`](anexos/). Este documento consolida e indica o que foi **verificado no navegador** e o que foi **apenas lido no código**.

---

## 1. Como a auditoria foi feita

| Frente | Método | Resultado |
|---|---|---|
| Arquitetura e bugs | Leitura integral de `admin-firebase.html`, `js/admin/**`, `js/admin-content-cms.js`, partes admin de `js/firebase-auth.js`, `functions/*.js` | [anexos/audit-1-inventario-funcional.md](anexos/audit-1-inventario-funcional.md): 28 achados FUNC |
| Segurança | Leitura de `firestore.rules` (1.704 linhas), `storage.rules`, functions, sinks de XSS, CSP, segredos | [anexos/audit-2-seguranca.md](anexos/audit-2-seguranca.md): 15 achados SEC |
| Dados e desempenho | Contagem de consultas, modelos de dados, concorrência, créditos de imagem | [anexos/audit-3-dados-desempenho.md](anexos/audit-3-dados-desempenho.md): achados DATA/PERF |
| UX | Reconstrução da navegação, textos, formulários, contraste | [anexos/audit-4-ux.md](anexos/audit-4-ux.md): achados UX |
| **Testes automatizados** | 15 suítes Node + 3 suítes no Emulator | ver §2 |
| **Testes no navegador** | Painel renderizado contra o Emulator, desktop 1366×860 e celular 375×812 | ver §5 e [`evidencias/`](evidencias/) |

---

## 2. Testes automatizados executados

| Suíte | Resultado |
|---|---|
| `test:rules` no Emulator: **Firestore Rules (421)** + **Storage Rules (71)** = **492 testes de Rules**; o mesmo script roda também modelo de rotas (29) e segurança de referências de mídia (11), totalizando 532 testes | **492/492 Rules ✔** (532/532 no script)  ([log](evidencias/teste-rules-emulador.log)) |
| `test:admin-public-e2e` no Emulator (admin → portal) | **48/48 ✔** ([log](evidencias/teste-e2e-emulador.log)) |
| `prefeitura-news.emulator` | 5/5 ✔ |
| `admin-finalization.structure`, `admin-geo-validation`, `admin-media-reference-validation`, `admin.rotas.*`, `prefeitura-news`, `public-admin-config`, `media-reference-safety`, `image-attribution`, `admin-emulator-guard`, `public-breadcrumb-xss`, `dynamic-search-index`, `functions.audit` | todas ✔ |
| `security-hardening-02a` | 27/28 (1 falha) |
| `establishment-approval-pipeline` | 27/28 (1 falha) |

**As 2 falhas não são do produto.** Os testes procuram trechos com `\n`, mas o checkout no Windows usa CRLF (`core.autocrlf=true`; o índice está em LF, a cópia de trabalho em CRLF). Já constava na memória do projeto como falha pré-existente. **Recomendação:** `.gitattributes` com `* text=auto eol=lf` para os `.js/.html`, ou normalizar `\r\n` nos testes.

**Lacuna:** a cobertura automática do painel é forte nas Rules e no fluxo de dados, mas **não existe nenhum teste de interface** (navegador) do painel. Os bugs de UI confirmados abaixo (FUNC-01, FUNC-02, perda de edição) passariam por todas as suítes atuais.

---

## 3. Arquitetura e inventário de módulos

**Stack:** HTML estático + JS sem build, Firebase compat **10.7.1** via CDN (testes usam 12.16.0), Firestore, Storage, Auth, Cloud Functions (`writeAdminAuditLog`, `prefeituraFeed`). Hospedagem: GitHub Pages.

**Dois sistemas convivem dentro de `admin-firebase.html` (4.029 linhas):**

1. **Legado inline** (linhas 1717–4026): login, sessão de 2 h, `showSection` (o roteador real), Aprovações, Vínculos, Usuários. Eventos, Notícias e Mídia ficam em `AdminContentCMS` (`js/admin-content-cms.js`, 1.818 linhas).
2. **Modular** (`js/admin/**`): dashboard, empreendimentos (3.079 linhas), banners, rotas, galeria, sazonal/mascote, registro de atividades. `AdminRouter.navigate()` **nunca é chamado**; os módulos são ativados direto por `showSection`. Consequência: `dispose()` nunca roda e o registro de módulos é decorativo.

### Inventário (15 telas + 1 ausente)

| Tela | Situação | Observação principal |
|---|---|---|
| Painel (`#home`) | ✅ Funcional, **verificado** | Fila de trabalho por urgência, "No portal agora" e qualidade do catálogo. É o ponto alto do painel. Lê 9 coleções inteiras a cada abertura. |
| Aprovações | ✅ Funcional, **verificado** | Badge conta um conjunto de status e a lista mostra outro (FUNC-18). |
| Pedidos de vínculo / Vínculos ativos | ✅ Funcional | Erro de leitura vira "lista vazia" (FUNC-15). |
| Usuários | ✅ Funcional | Ainda oferece o papel `moderator`, que a decisão B2A5 retirou. |
| Empreendimentos | ✅ Funcional, **verificado** | Melhor engenharia do painel (revisão otimista, transações), mas despublica antes de salvar (§4, BUG-02). 67 itens sem paginação. |
| Eventos | ⚠️ Parcial, **verificado** | Seleção de mídia quebrada (BUG-03). Sem busca nem filtro. |
| Notícias | ⚠️ Parcial, **verificado** | Campos de imagem recusam caminho relativo (BUG-04); autor aparece como UID. |
| Rotas | ✅ Funcional | Arquivar é irreversível pela interface. |
| Biblioteca de mídia | ✅ Funcional | Sem trava contra duplo envio. |
| Galeria pública | ⚠️ Parcial | Só edita, não cria nem exclui; `gallery_items` dependia de migração (0 docs no gate de 2026-09). Listener redesenha e apaga digitação. |
| Banners e pop-ups | ✅ Funcional | Grava o documento inteiro a partir da cópia em memória (última escrita vence). |
| Sazonal e clima / Mascote | ✅ Funcional | Falha ao salvar pode não avisar (FUNC-20). |
| Registro de atividades | ⚠️ Parcial | Não mostra **quem** fez a ação. |
| **Reservas** | ❌ **Inexistente** | `js/reservas.js` grava pedidos com nome, e-mail e telefone em `reservas`; **nenhuma tela do painel lê**. `/reservas` está no sitemap. |
| `placeholder.js`, `estabelecimentos_aprovados` | Código morto / legado | |

Detalhe de coleções lidas/escritas por tela e modelo de dados: [anexo 1, §2–3](anexos/audit-1-inventario-funcional.md).

**Vocabulário de publicação inconsistente** (raiz de vários bugs): eventos e notícias usam `publicado` (bool) + `status` em português; empreendimentos, rotas e banners usam `status` em inglês (`draft/published/archived`); a galeria usa `published` (bool). Cada tela e cada página pública reimplementa sua própria regra de "publicado".

---

## 4. Bugs confirmados

Severidade: **P0** crítico · **P1** alto · **P2** médio · **P3** baixo. "Verificado" = reproduzido no navegador contra o Emulator. "Código" = comportamento decorre diretamente do código, sem execução.

### BUG-01 — Alterações não salvas são perdidas sem aviso (P1, **verificado**)
- **Onde:** todos os editores; confirmado no editor de Empreendimentos. Sem `beforeunload` nem controle de "formulário alterado" em todo o painel (grep: zero ocorrências).
- **Esperado:** ao sair com alterações pendentes, perguntar "Descartar alterações?".
- **Observado:** editei o Resumo de "Sítio Sapopema", cliquei em **Eventos** no menu, voltei: o editor tinha sumido e o texto também. Nenhum aviso.
- **Também:** clique no fundo do modal, Cancelar, botão Voltar do navegador e logout automático após 2 h de inatividade descartam o formulário (anexos 1 FUNC-10 e 4 UX-40).
- **Impacto:** um servidor que preenche um cadastro longo (52 campos) e clica no menu perde todo o trabalho.
- **Correção:** guarda única de "alterações não salvas" no `showSection`/router, no fechamento de modal e em `beforeunload`, usando o diálogo de `admin-feedback.js`.

### BUG-02 — Editar um empreendimento publicado o tira do portal; qualquer falha no meio o deixa fora (P1, **risco de desenho confirmado**; falha em uso normal **não reproduzida**)

> **Reclassificação (Rodada 1, 16/10/2026):** o comportamento "despublica antes de salvar" está confirmado no código e na sequência de transações observada. Já a **falha** que deixou itens fora do ar só ocorreu com um listener `onSnapshot` aberto pela própria instrumentação da auditoria; o painel não abre esse listener. Em uso normal, 6 de 6 salvamentos observados terminaram publicados. Portanto: o risco é real (qualquer interrupção entre as etapas deixa o item fora do ar, como no caso Artur Biergarten), mas não há evidência de que o fluxo atual falhe sozinho.
- **Onde:** `js/admin/modules/empreendimentos.js:2059-2075` (fase "Retirando publicacao...") e `resumeSagaWorkflow` (`:1939`).
- **Desenho atual:** salvar = (1) mudar status para `draft`, (2) gravar cada grupo de campos, (3) republicar. São 3 a 4 transações em sequência.
- **Reprodução no Emulator:**
  - Sem interferência, 4 de 4 salvamentos funcionaram (`all-garden`, `ervateira-taquaral`, `armazem-campestre`, `ancestral-gastronomia`): o item volta a `published` com a alteração.
  - Com um listener `onSnapshot` aberto no mesmo documento (cenário artificial criado pela instrumentação), **4 de 4 falharam**: o item terminou em `draft`, **fora do portal**, a alteração **não foi gravada** e a mensagem foi "Este empreendimento foi alterado por outro administrador". Clicar em "Tentar novamente" repetiu o erro.
  - **Causa da falha induzida:** `reconcilePendingGroup` lê com `ref.get()` sem `{source: "server"}`. Com listener ativo, o SDK devolve o cache, que ainda não reflete a transação anterior, e o código interpreta como conflito.
- **Por que importa mesmo sem o listener:** o painel não abre listener nessa coleção hoje, então o gatilho exato foi induzido. Mas o desenho garante que **qualquer** falha entre o passo 1 e o 3 (queda de rede, aba fechada, Rule recusando um grupo, conflito real com outro admin) deixa o negócio fora do ar. O projeto já viveu isso em produção: em 10/09/2026 o Artur Biergarten sumiu do portal porque o painel interpretou a **própria** gravação como concorrência e parou antes de republicar (`ADMIN-END-TO-END-PUBLICATION-CLOSURE.md` §3). Aquele gatilho (sentinel de `serverTimestamp`) foi corrigido; a reprodução acima mostra que **a mesma classe de falha continua possível** por outro caminho (leitura de cache).
- **Recuperação existente:** a lista mostra o item como "Rascunho" com o botão "Concluir e republicar"; reabrir e salvar republica. Porém o texto editado se perde, e "Rascunho" não comunica "fora do ar por edição interrompida".
- **Correção:**
  1. Curto prazo: usar `get({source: "server"})` nas leituras de reconciliação; mensagem de falha que diga claramente "o empreendimento está FORA do portal; clique em Concluir e republicar"; selo "Fora do ar — edição interrompida" na lista e no Painel.
  2. Estrutural: aplicar a edição de um item publicado em **uma única transação** (todos os grupos + `revision`), sem passar por `draft`.

### BUG-03 — Escolher imagem da Biblioteca no editor de Evento não faz nada (P1, **verificado**)
- **Onde:** `js/admin-content-cms.js:1334, 1377` (e 91, 877, 1258, 1271): handlers inline gerados com `\\\'` em vez de `\'`.
- **Reprodução:** Eventos → Editar → selecionar item em "Biblioteca de mídia". O campo de capa (`#mainImage`) continuou vazio. Compilando os atributos no navegador: `SyntaxError: Invalid or unexpected token` em `#mainImage[oninput]` e `#eventMediaId[onchange]`.
- **Impacto:** evento salvo sem capa, ou com capa diferente da escolhida; os fallbacks de imagem quebrada também nunca rodam.
- **Correção:** trocar handlers inline por `addEventListener` (resolve também parte da CSP; ver SEC-05).

### BUG-04 — Campos de imagem/vídeo/link de Notícias recusam caminho relativo (P1, **verificado**)
- **Onde:** `#imagem`, `#videoUrl`, `#linkOrigem` são `type="url"`; o mesmo em banners (`banners.js:753, 811`).
- **Reprodução:** com `images/noticias/exemplo.jpg`, o navegador recusa com "Insira um URL." O validador do próprio CMS aceita caminhos relativos e o portal usa imagens em `images/...`.
- **Impacto:** notícias legadas com imagem local e banners com link interno (ex.: `eventos.html`) não podem ser salvos; na Prévia, "Confirmar e publicar" não faz nada, sem aviso.
- **Correção:** `type="text"` com a validação do CMS (que já existe).

### BUG-05 — Importador da Prefeitura altera notícia já publicada e diz que é rascunho (P1, código)
- **Onde:** `js/admin/prefeitura-news.js:538-544` (`buildUpdatePatch` mantém `publicado` de propósito) × `prefeitura-news-importer.js:304, 351` ("Entram no CMS como rascunho — nada vai ao ar", "atualizada(s) como rascunho").
- **Impacto:** quando a matéria muda na origem, o conteúdo de uma notícia **publicada** é trocado no ar sem revisão, enquanto o painel afirma o contrário.
- **Correção:** atualizar como rascunho de revisão (campo `pendingUpdate` ou despublicar com aviso explícito) e corrigir a mensagem.

### Outros bugs confirmados no código (detalhes e reprodução no anexo 1)

| ID | Sev. | Resumo |
|---|---|---|
| FUNC-03 | P1 | Pedidos de **reserva** (dados pessoais) gravados sem nenhuma tela de leitura no painel. Decisão de produto: criar a tela ou retirar `/reservas`. |
| FUNC-07 | P2 | Publicar/destacar evento ou notícia com `set(merge)` a partir do cache **recria** documentos que outro admin excluiu. |
| FUNC-08 / DATA-03 | P2 | Notícia com `status:"publicado"` mas sem `publicado:true` aparece "Publicado" no painel e não está no portal; abrir e salvar a despublica. |
| FUNC-11 / PERF-05 | P2 | Galeria redesenha tudo a cada atualização e apaga o que se está digitando. |
| FUNC-12 / FUNC-14 / DATA-12 | P2 | Fotos de empreendimento, banners, eventos e notícias: "última escrita vence". Botões de publicar **invertem** o estado local, então podem despublicar o que outro admin acabou de publicar. Só `cms_establishments` tem controle de revisão. |
| FUNC-04/05/06 | P2 | Formulário de evento preso em "Salvando…"; upload antes da validação deixa arquivos órfãos; biblioteca sem trava contra duplo envio. |
| FUNC-15 | P2 | Erros de leitura viram "lista vazia". Num caso, `checkExistingManager` devolve `null` em erro e o vínculo existente é sobrescrito. |
| FUNC-16/17/18/20/23–27 | P3 | Duplo clique em aprovar duplica; "Nova rota" abre com ID travado; badge ≠ fila; sazonal/mascote sem aviso de erro; slug de notícia sem unicidade; parágrafos perdidos em rotas; campos de evento ausentes; banner "personalizado" sem páginas. |

---

## 5. Validações no navegador (o que foi visto funcionando)

| Fluxo | Resultado | Evidência |
|---|---|---|
| Login com senha errada | ✅ "Senha incorreta.", claro e em português | [00-login](evidencias/00-login-senha-incorreta.jpg) |
| Login correto e Painel | ✅ Fila de trabalho e indicadores carregam; nenhum erro no console | [01-painel](evidencias/01-painel-inicial.jpg) |
| Navegação pelo menu, breadcrumb, título da aba | ✅ Funciona; hash muda; título "Empreendimentos · Painel Admin" | [02-lista](evidencias/02-lista-empreendimentos.jpg) |
| Editar e salvar empreendimento publicado | ✅ 4/4 sem interferência · ⚠️ ver BUG-02 | — |
| Sair do editor com alterações | ❌ BUG-01 | — |
| Capa de evento pela Biblioteca | ❌ BUG-03 | [04-eventos](evidencias/04-eventos.jpg) |
| Imagem relativa em notícia | ❌ BUG-04 | — |
| Modal de edição: foco e Esc | ❌ Foco fica no `<h1>` atrás do modal; sem `role="dialog"`; Esc não fecha | — |
| Aprovações pendentes | ✅ Tabela clara, ações Aprovar/Rejeitar/Revisar | [05-aprovacoes](evidencias/05-aprovacoes.jpg) |
| Celular 375 px | ✅ Sem rolagem horizontal; tabelas viram cartões; menu em gaveta · ⚠️ lista de empreendimentos com **29.423 px** de altura | [06-mobile](evidencias/06-mobile-empreendimentos.jpg) |
| Carga em segundo plano | ✅ Abrir o painel não grava nada (comparação de `revision` de 67 docs antes/depois do carregamento) | — |

**Não testado visualmente:** upload real para o Storage, importador da Prefeitura (depende da function), expiração de sessão de 2 h, leitor de tela real, Firefox/Safari, conexão lenta/offline, dois administradores simultâneos de verdade (só simulado), produção.

---

## 6. Segurança (resumo; detalhes no anexo 2)

**Nenhuma vulnerabilidade P0/P1 confirmada no código.** O backend está bem desenhado: as Rules releem `role` e `ativo == true` a cada requisição (desativar um admin vale na hora), há negação geral para o que não está listado, notícias só são públicas com `publicado == true`, `media_library` e `reservas` são só para admin, Storage aceita só jpeg/png/webp até 5 MB sem sobrescrever, e o painel escapa HTML de forma consistente. Os 492 testes de Rules (421 Firestore + 71 Storage) passaram no Emulator.

**O maior risco é desconhecido, não confirmado:** o último deploy de Rules registrado é de 13/08/2026 (`CHANGELOG_AI.md:229-230`). Depois disso, `firestore.rules` e `storage.rules` mudaram em 7 commits (26/08 a 14/09) sem registro de deploy, e o deploy da function `writeAdminAuditLog` também não está confirmado. **Os testes provam as Rules do Git, não as da produção.**

| ID | Sev. | Tipo | Resumo |
|---|---|---|---|
| — | **P1** | Risco a validar | Rules e functions de produção podem estar atrás do Git (galeria, `site_config`, `audit_logs`, reservas, approved-media). |
| DATA-02 / FUNC-28 | P2 | Confirmado (Rules locais) | Rascunhos de eventos ficam em `eventos_aprovados`, que tem `allow read: if true`; o filtro é feito no navegador. É o mesmo problema já corrigido em `noticias`. |
| SEC-01 | P2 | Confirmado | `cms-media` tem leitura e **listagem** pública recursiva: quem souber o UID de um admin lista imagens ainda não publicadas (UIDs aparecem em documentos públicos, SEC-14). |
| SEC-02 | P2 | Confirmado | Autocriação de `usuarios` aceita campos extras, inclusive `email` forjado, que o painel usa ao criar vínculos (engenharia social). |
| SEC-03 | P2 | Confirmado | Nenhuma verificação de e-mail; as Rules confiam em `token.email`. |
| SEC-04 | P2 | Suspeito | Admins sem MFA; senha mínima de 6; timeout de 2 h só no navegador. |
| SEC-05 | P2 | Confirmado | CSP com `unsafe-inline` e `unsafe-eval`, CDNs genéricos e um endpoint `workers.dev` do chatbot já retirado. |
| SEC-06 | P2 | Suspeito | GitHub Pages ignora `_headers`: provavelmente sem `X-Frame-Options`/CSP por header (clickjacking). |
| SEC-07 | P2 | Confirmado | App Check sem enforcement; reservas, envios do portal e uploads sem limite de taxa (spam e custo). |
| SEC-08–15 | P3 | Misto | Sem validação de URL no backend; último admin pode se rebaixar; auditoria sem autor; redirect do `prefeituraFeed` antes da checagem de origem; SDK sem SRI; `moderator` com poderes sem interface. |

---

## 7. Banco de dados, desempenho e estabilidade (resumo; anexo 3)

- **PERF-01 (P2, medido):** 31 leituras de coleção inteira sem `limit`/`where`; só uma consulta usa `limit`. O Painel lê 9 coleções a cada abertura, inclusive `usuarios` inteira para um contador. Hoje o volume é pequeno (≈70 empreendimentos), então **não há lentidão observada**; o custo cresce linearmente com o acervo. Usar `count()` no Painel.
- **DATA-01 (P1, medido):** home, agenda, mapa e painel usam **quatro** regras diferentes de "evento publicado". Ex.: um documento sem `status` e sem `publicado` some da home, aparece na agenda e no mapa, e o painel diz "Publicado".
- **DATA-07 (P2):** upload acontece antes da gravação no Firestore; se a gravação falha, o arquivo fica órfão em `cms-media`.
- **PERF-10 (P2):** sem tratamento de offline, timeout ou retry (exceto a saga de empreendimentos).
- **PERF-11 (P3):** Firebase 10.7.1 (dez/2023) via CDN em 37 referências, sem SRI; páginas públicas carregam compat e modular juntos.
- **Sem vazamento de memória** comprovado: o único listener (galeria) cancela a inscrição no `dispose`, embora o `dispose` nunca seja chamado pelo router (o listener persiste até recarregar a página).
- Sem `firestore.indexes.json` no repositório: hoje nenhuma consulta precisa de índice composto, mas o primeiro será criado fora do Git.

### Créditos de imagem: CMS × `js/image-attribution.js` (DATA-15, P1)

- **Duas fontes de verdade.** O CMS guarda só `credit`/`caption` em texto livre e apenas em empreendimentos, sem licença nem link (limite de 160 caracteres no painel e 240 em `publication-contracts.js`). O `REGISTRY` de `js/image-attribution.js` é indexado pelo caminho do arquivo e tem autor, licença e fonte.
- **Quem vence:** quando a URL está no registro, o autor do registro **substitui em silêncio** o crédito digitado no painel. Editar o crédito no painel não tem efeito visível, e o painel mostra os dois lado a lado.
- **Cobertura:** o registro cobre **6 de 130** arquivos em `images/empreendimentos`. Os 9 arquivos de acervo/Prefeitura/Wikimedia do commit `97c62dc` não têm entrada, e o teste só confere registro → arquivo, nunca o inverso. Imagens enviadas pelo Storage nunca casam com o registro.
- **Recomendação (sem migrar agora):**
  1. Já: teste inverso (todo arquivo publicado de terceiros tem entrada de crédito) e um aviso no painel quando o crédito digitado for ignorado.
  2. Bloco próprio: fonte única por ativo em `media_library` (autor, licença, fonte, `mediaId`), com Rules, dry-run e migração.
