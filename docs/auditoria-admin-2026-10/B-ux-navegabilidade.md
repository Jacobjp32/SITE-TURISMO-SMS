# B — UX, navegabilidade e facilidade de entendimento

Público de referência: servidores municipais e colaboradores sem formação técnica. Baseado na leitura completa da interface ([anexo 4](anexos/audit-4-ux.md), com rótulos exatos e linhas de código) e no uso do painel renderizado no Emulator ([`evidencias/`](evidencias/)).

---

## 1. Diagnóstico geral

**O painel já tem uma boa espinha dorsal.** Em uso real, a tela inicial é o melhor ponto: "O que precisa da sua atenção" lista tarefas por urgência com um botão de ação em cada ("Moderar", "Analisar", "Corrigir"). Há breadcrumb ("Conteúdo / Empreendimentos"), título da aba por seção, item ativo destacado no menu, foco movido para o título ao trocar de seção, menu em gaveta no celular, tabelas que viram cartões em telas pequenas e uma etiqueta clara de ambiente ("Ambiente local · dados de teste" / "Dados reais"). O componente de diálogos e avisos (`js/admin/admin-feedback.js`) é acessível e bem feito: foco no "Cancelar" em ações perigosas, confirmação digitando "EXCLUIR".

**O que atrapalha o iniciante:**

1. **Perde-se trabalho sem aviso.** Trocar de menu, clicar no fundo escuro do modal, "Voltar" do navegador ou a expiração de 2 h descartam o formulário. Confirmado no navegador (BUG-01 do relatório A).
2. **O painel fala a língua do banco de dados.** "Aprovar e criar draft", "ID / slug canônico", status `published` em inglês no editor, UIDs como autor ("Por: demo-admin"), "Grupos pendentes: core, content…", "Verifique se as Firestore Rules do Bloco 4B…", "Veja o console", "(dismissible)", "Atraso (ms)", texto sem acento ("Salvar e publicar alteracoes").
3. **A mesma situação tem nomes diferentes.** Um item no ar é "Publicado" (eventos), "Publicado no portal" (empreendimentos) ou "Publicada" (rotas). Um item fora do ar é "Despublicado" (eventos, inclusive um evento novo que nunca foi publicado) ou "Rascunho" (notícias).
4. **"Aprovar" significa três coisas.** Um evento aprovado vai ao ar na hora; um empreendimento aprovado vira rascunho em outra tela; um pedido de alteração aprovado ainda precisa de "Aplicar ao catálogo".
5. **Tarefas de um mesmo assunto ficam espalhadas.** Um empreendimento passa por Aprovações, Pedidos de vínculo, Vínculos ativos e Empreendimentos. As imagens ficam em quatro lugares sem ligação (Biblioteca, Galeria pública, upload direto do empreendimento e upload do banner).
6. **Encontrar coisas é difícil fora de Empreendimentos.** Eventos e Notícias não têm busca nem filtro de status; não existe busca global nem botão "Abrir no portal".

---

## 2. Navegação atual × recomendada

**Atual (15 itens em 6 grupos):** Painel · Moderação (Aprovações, Pedidos de vínculo, Vínculos ativos, Usuários) · Conteúdo (Empreendimentos, Eventos, Notícias, Rotas) · Mídia (Biblioteca de mídia, Galeria pública) · Portal (Banners e pop-ups, Sazonal e clima, Mascote) · Sistema (Registro de atividades).

**Recomendada (8 itens, organizados pela tarefa e não pela coleção do banco):**

| Hoje | Proposta | Por quê |
|---|---|---|
| Painel | **Início** | Mantém a fila de trabalho, que já funciona bem. |
| Empreendimentos + Aprovações › empreendimentos + Pedidos de vínculo + Vínculos ativos | **Lugares e negócios**, com abas: Catálogo · Novos cadastros · Pedidos de alteração · Responsáveis | Tudo de um negócio num só lugar. Incluir a palavra "atrativo" (hoje é a categoria "Ponto turistico"). |
| Eventos + Aprovações › eventos | **Agenda**, com abas: Publicados e rascunhos · Enviados para aprovação | A fila fica junto do conteúdo que ela altera. |
| Notícias | **Notícias**, com "Importar da Prefeitura" como aba | Tirar "Importar notícias estáticas" do caminho: cria notícias já publicadas com um clique. |
| Rotas | **Roteiros** | Palavra do visitante. |
| Biblioteca de mídia + Galeria pública | **Fotos**, com abas: Biblioteca · Página Galeria | Uma origem de imagens. |
| Banners e pop-ups | **Avisos e campanhas** | Evita anglicismo. |
| Sazonal e clima + Mascote + Usuários + Registro de atividades | **Administração**: Equipe e acessos · Configurações do portal · Histórico de alterações | Separa a gestão de permissões do trabalho editorial; junta duas telas que hoje têm uma caixa de seleção cada. |

**Importante:** a reorganização pode ser feita **só no menu e nos rótulos** (o `showSection` já aceita qualquer agrupamento), sem refazer as telas. Ela deve vir **depois** dos ganhos rápidos e das correções de perda de dados.

---

## 3. Jornadas: experiência atual × recomendada

Cliques contados a partir do Início, sem contar digitação.

| Jornada | Hoje | Dificuldade principal | Recomendado |
|---|---|---|---|
| **Cadastrar um atrativo/empreendimento** | 6 cliques + 4 campos obrigatórios, ~10 com mapa e foto. Crédito/legenda da foto só depois, em "Ver" → "Editar metadados" (+3 por foto). | Formulário de **52 campos** que abre **abaixo de uma lista de 67 itens** (a página tem 11.798 px no desktop; o editor surge na posição 11.750). "ID / slug canônico" é obrigatório, embora o código saiba gerá-lo. | Editor em tela própria; etapas Básico → Endereço/mapa → Fotos → Contato → Revisar; identificador gerado do nome; crédito e legenda no próprio upload. |
| **Atualizar um estabelecimento** | 3 cliques. | O item **sai do ar durante o salvamento**; se algo falhar, fica fora e a mensagem fala de "outro administrador" (BUG-02). | Salvar sem despublicar; se falhar, aviso vermelho "FORA DO AR". |
| **Aplicar pedido de alteração do dono** | 8–10 cliques e 3 confirmações; a fila nunca esvazia. | Aprovar ≠ aplicar; imagens com fluxo à parte. | Um painel "Antes / Depois" com "Aplicar alterações", "Pedir ajustes" e "Recusar". |
| **Adicionar mídia e usar num empreendimento** | 3 cliques para enviar; ~7 ações em 2 seções para usar (copiar URL, ir ao editor, colar). | A biblioteca não tem "Usar em empreendimento"; o upload do empreendimento não entra na biblioteca. | Seletor da biblioteca dentro de cada editor. |
| **Localizar um cadastro antigo** | Empreendimentos: 1–2 cliques (busca boa). Eventos e Notícias: rolar a tabela. | Sem busca nem filtro. | Busca + filtro de status em todas as listas; busca global no topo. |
| **Corrigir conteúdo publicado** | Evento/notícia: 3 (com prévia obrigatória, bom). Banner: 6, e **fica fora do ar no meio**. | Inconsistência entre módulos. | Padrão de eventos para todos: editar → prévia → "Atualizar no portal". |
| **Revisar notícia importada da Prefeitura** | 5 cliques + 2 por notícia. | Atualizações de notícias já publicadas vão ao ar sem revisão, contra o que a tela diz (BUG-05). | Atualização vira rascunho de revisão; filtro "Importadas". |
| **Ver o que está publicado** | Filtro de status em 3 módulos; nos demais, ler linha a linha. | Sem "Abrir no portal". | Filtro "No ar" em todos + botão "Abrir no portal". |
| **Despublicar** | 2 cliques com confirmação. | Rótulo varia ("Despublicado"/"Rascunho"). | Manter o gesto; unificar rótulos. |

---

## 4. Clareza e linguagem

**Glossário recomendado** (aplicar em todos os módulos):

| Hoje | Usar |
|---|---|
| Publicado / Publicado no portal / Publicada | **No ar** |
| Despublicado / Rascunho / draft | **Rascunho (fora do ar)** |
| Arquivado / Arquivada / archived | **Arquivado** |
| Aprovar e publicar / Aprovar e criar draft / Aprovar para revisão | **Aceitar e publicar** / **Aceitar como rascunho** / **Aceitar alteração** |
| Salvar evento / Salvar rascunho / Salvar e publicar alteracoes / Criar rascunho | **Salvar rascunho** e **Salvar e publicar** (os mesmos dois em todo lugar) |
| ID / slug canônico | Endereço da página (gerado automaticamente; editável em "Avançado") |
| Owner / Manager / Representative | Proprietário / Gestor / Representante |
| UID do autor | Nome do servidor |
| CTA, `_self`/`_blank`, dismissible, targetPages, ms, px | Texto do botão · Abrir na mesma aba/nova aba · Pode ser fechado · Páginas escolhidas · segundos · Pequeno/Médio/Grande |
| "Veja o console", "Firestore Rules", "Emulator" | Mensagem com o próximo passo ("Recarregue a página. Se continuar, avise o suporte informando o código X.") |

**Mensagens que precisam ser reescritas** (exemplos reais): "Falha parcial. O rascunho foi preservado. Tente novamente." aparece quando um item **publicado** saiu do ar; "Este empreendimento foi alterado por outro administrador" apareceu no teste sem nenhum outro administrador; "Upload confirmado, mas o vinculo ao documento ainda esta pendente. Tentar novamente reutiliza o mesmo objeto nesta sessao."

**Campos obrigatórios:** só Banners marca "Título *". Padronizar "(obrigatório)" no rótulo, com `aria-required`.

**Pontos positivos a manter:** login traduz erros ("Senha incorreta."); eventos e notícias avisam "Suas alterações continuam no formulário"; prévia obrigatória antes de publicar evento/notícia; a fila de trabalho do Início.

---

## 5. Interface, responsividade e acessibilidade

| Item | Situação | Sev. |
|---|---|---|
| Celular 375 px | ✅ Sem rolagem horizontal; gaveta de menu; tabelas em cartões (verificado). ⚠️ Lista de empreendimentos com 29.423 px de altura, sem paginação; o Registro de atividades não vira cartão e rola na horizontal. | P2 |
| Linhas de tabela | 5 botões empilhados por empreendimento (Ver, Editar, Despublicar, Arquivar, Excluir); "Excluir" tem o mesmo peso visual que "Ver". Os 67 botões "Editar" têm o mesmo nome acessível (leitor de tela não diz **qual**). | P2 |
| Modais de edição (`#contentModal`, `#managerModal`) | ❌ Verificado: o foco fica no título atrás do modal, Esc não fecha, Tab não fica preso, foco não volta. Todos os editores de evento, notícia, mídia, banner, rota e importador usam esse modal. | P1 |
| Anel de foco | `rgba(200,147,90,.55)` sobre branco = 1,66:1 (mínimo 3:1), com `outline: none`. Foco quase invisível em campos e botões claros. | P1 |
| Contraste de texto | Reprovados: `#888` (3,54:1) em estados vazios; `#999` (2,85:1) no login; `#bbb` (1,92:1) "sem imagem"; rótulos de grupo do menu (4,02:1); `.btn-edit` (4,03:1); bordas de campo ~1,4:1. Aprovados: texto principal, menu (8,7:1), botão primário (12,5:1). | P2 |
| Login | Só placeholder, sem `<label>`; sem "Esqueci minha senha" (a função existe em `firebase-auth.js`). | P2 |
| Datas | Eventos na lista em ISO ("2026-11-05"); data de notícia é texto livre com ISO completo. | P2 |
| Estados vazios e erros | Erro de leitura aparece como "lista vazia" em várias telas. | P2 |
| Sessão | Logout forçado após 2 h sem aviso prévio. | P1 |

---

## 6. Problemas de usabilidade priorizados

| ID | Problema | Sev. |
|---|---|---|
| UX-40 / BUG-01 | Perda de alterações não salvas (menu, fundo do modal, Voltar, sessão) | **P1** |
| UX-42 / BUG-02 | Item publicado sai do ar ao editar; mensagem não avisa | **P1** |
| UX-43 / BUG-05 | Importador diz "nada vai ao ar" e altera notícias no ar | **P1** |
| UX-60 | Modais sem foco, Esc e trava de Tab | P1 |
| UX-61 | Anel de foco invisível | P1 |
| UX-01 | Imagens em quatro lugares sem ligação | P1 |
| UX-02 / UX-03 / UX-04 | Fluxo de empreendimento em 4 telas; "Aprovar" ambíguo; pedido de alteração com 3 etapas | P1 |
| UX-05 | Badge ≠ fila; fila nunca esvazia | P1 |
| UX-10 / UX-11 | Jargão; status com nomes diferentes | P1 |
| UX-12 | Eventos e Notícias sem busca e filtro | P1 |
| UX-15 | Arquivar rota é irreversível, sem distinção visual | P1 |
| UX-17 | Legenda, crédito, capa e ordem das fotos só em "Ver" | P1 |
| UX-21 / UX-22 | Slug obrigatório; formulário de 52 campos abaixo da lista | P1 |
| UX-41 | Logout de 2 h sem aviso | P1 |
| UX-13 / UX-51 | Sem "Abrir no portal" e sem busca global | P2 |
| UX-14 | Banner publicado não pode ser editado sem sair do ar | P2 |
| UX-46 | Filtros perdidos ao trocar de seção | P2 |
| UX-62 / UX-30 | Contrastes reprovados; login sem rótulos | P2 |

Lista completa (UX-01 a UX-67) com arquivo e linha: [anexo 4](anexos/audit-4-ux.md).

---

## 7. Ganhos rápidos (alto impacto, baixo esforço, sem refazer telas)

1. Guarda de "alterações não salvas" em menu, modal, Voltar e `beforeunload`; não fechar editores por clique no fundo.
2. Mensagem do importador corrigida (ou atualizações de publicadas como rascunho).
3. Aviso vermelho "FORA DO AR — edição interrompida" na lista e no Início quando um empreendimento ficar em `editSession`.
4. Glossário aplicado: status "No ar / Rascunho / Arquivado", dois verbos de salvar, sem UIDs, acentos restaurados em `empreendimentos.js`.
5. "(obrigatório)" nos rótulos; identificador de empreendimento gerado do nome.
6. Esc, foco inicial, trava de Tab e retorno de foco nos dois modais legados, reaproveitando `admin-feedback.js`.
7. Anel de foco com contraste ≥ 3:1 e cores de texto ≥ 4,5:1.
8. Busca e filtro de status em Eventos e Notícias (copiar o padrão de Empreendimentos).
9. Botão "Abrir no portal" em itens no ar.
10. Esconder "Importar notícias estáticas"; confirmação forte (ou "Restaurar") em "Arquivar rota".
11. Data da notícia como campo de data; datas da lista em formato brasileiro.
12. Aviso 5 minutos antes do logout por inatividade, com "Continuar conectado".
13. Paginação ou "Mostrar mais" nas listas longas.
14. Nome acessível nos botões das linhas ("Editar Sítio Sapopema").
