# Auditoria 4 — UX, arquitetura de informação e acessibilidade (leitura de código)

**Escopo:** painel `admin-firebase.html` + `css/admin-panel.css` + `js/admin/**` + `js/admin-content-cms.js` + importador da Prefeitura.
**Base:** worktree `.worktrees/auditoria-admin`, commit `f0bf549` (origin/main). Somente leitura; nenhum arquivo do repositório alterado.
**Público-alvo considerado:** servidores municipais sem formação técnica.
**Método:** reconstrução da interface a partir do markup, dos textos, do CSS e dos renderizadores JS (sem navegador). Contrastes calculados pela fórmula WCAG 2.x sobre os tokens reais.

Severidade: **P0** = bloqueia/causa dano a dado público; **P1** = alto impacto para iniciante / risco de erro; **P2** = atrito relevante; **P3** = polimento.

---

## 1. Árvore de navegação reconstruída

Menu lateral (`admin-firebase.html:1309-1336`; rótulos de breadcrumb em `js/admin/admin-nav.js:18-34`). Todas as rotas são hashes (`#secao`) com `history.pushState` e suporte a Voltar/Avançar (`admin-nav.js:96-98, 244-248`).

| Grupo (visível) | Item (rótulo exato) | Rota | O que a tela faz | Ações visíveis (rótulos exatos) |
|---|---|---|---|---|
| — | **Painel** | `#home` | "O que precisa da sua atenção": fila de trabalho, KPIs "No portal agora", "Qualidade do catálogo", "Próximos eventos publicados" (`dashboard.js`) | `Atualizar`; CTAs por tarefa: `Moderar`, `Analisar`, `Ver eventos`, `Corrigir`, `Verificar`, `Ver rascunhos`, `Ver notícias`, `Escrever`, `Completar`; link `Ver todos` |
| Moderação | **Aprovações** (badge laranja) | `#aprovacoes` | 3 filas empilhadas: "Eventos aguardando aprovação", "Empreendimentos aguardando aprovação", "Alterações de empreendimentos" | Topo: `Atualizar`. Eventos: `Aprovar`, `Rejeitar`, `Revisar` (modal: `Fechar`, `Aprovar`). Empreendimentos: `Aprovar e criar draft`, `Rejeitar`. Alterações: campos inline + `Aprovar para revisão`, `Rejeitar`, `Pedir ajustes`; depois `Aplicar ao catálogo`; por imagem: select Pendente/Aceita/Rejeitada + `Salvar revisão das imagens`, `Aplicar mídia ao catálogo` |
| Moderação | **Pedidos de vínculo** (badge) | `#vinculos` | Pedidos de usuários que dizem gerir um empreendimento | `Atualizar`; por linha: textarea "Observação interna", campo "Motivo da rejeição", `Aprovar`, `Rejeitar`; `Limpar filtro` |
| Moderação | **Vínculos ativos** | `#gerenciar-vinculos` | Lista quem gere cada empreendimento | `Atualizar`, `Adicionar vínculo`; por linha `Editar`, `Desativar`/`Reativar`; modal: `Cancelar`, `Salvar vínculo` |
| Moderação | **Usuários** | `#usuarios` | Lista de contas; troca de permissão por `<select>` na tabela | `Atualizar`; por linha `Copiar e-mail`, `Ver vínculos`, `Adicionar vínculo`, `Ver solicitações`, `Desativar`/`Ativar` |
| Conteúdo | **Empreendimentos** (badge cinza) | `#empreendimentos` | Catálogo editorial (`cms_establishments`) com filtros Pesquisa/Status/Categoria/Localização; editor abre **abaixo da lista**, na mesma página | `Atualizar`, `Novo empreendimento`; por linha `Ver`, `Editar`, `Publicar`/`Concluir e republicar`/`Despublicar`, `Arquivar`/`Restaurar`, `Excluir`; editor: `Cancelar`, `Salvar rascunho` / `Salvar e publicar alteracoes`; em "Ver": `Fechar`, `Editar`, e na galeria `Editar metadados`, `Definir como imagem principal`, `Mover para cima`, `Mover para baixo`, `Remover da galeria`, `Restaurar`; mapa: `Satélite`, `Usar link do Google Maps`, `Centralizar no ponto`, `Marcar como verificada`, `Desfazer ajuste` |
| Conteúdo | **Eventos** (badge cinza) | `#eventos` | Eventos aprovados/criados pelo admin | `Novo evento`; por linha `Prévia`, `Editar`, `Duplicar`, `Publicar`/`Despublicar`, `Destacar`/`Remover destaque`, `Excluir`; editor: abas `Editar`/`Prévia no portal`, `Cancelar`, `Pré-visualizar`, `Salvar evento`, `Voltar e editar`, `Confirmar e publicar`/`Confirmar e atualizar no portal`; capa: `Limpar seleção`, `Remover capa` |
| Conteúdo | **Notícias** (badge cinza) | `#noticias` | Notícias do CMS + importador | `Nova notícia`, `Buscar notícias da Prefeitura`, `Importar notícias estáticas`; por linha `Prévia`, `Editar`, `Publicar`/`Despublicar`, `Origem`, `Excluir`; importador: abas `Cultura e Turismo`/`Revisão`/`Fora do escopo`/`Todas`, `Marcar novas de Cultura e Turismo`, `Buscar de novo`, `Fechar`, `Importar N selecionada(s) como rascunho` |
| Conteúdo | **Rotas** | `#rotas` | CRUD de rotas temáticas (modal) | `↻ Atualizar`, `➕ Nova rota`; por linha `Editar`, `Preview`, `Publicar`/`Despublicar`, `Arquivar`; modal: `Selecionar da biblioteca`, `Limpar referência`, `Preview`, `Cancelar`, `Salvar rota` |
| Mídia | **Biblioteca de mídia** | `#midia` | Catálogo `media_library` (usado por eventos, notícias e rotas) | `Adicionar mídia`; busca + 2 filtros; por card `Copiar URL`, `Editar`, `Usar em evento`, `Usar em notícia`, `Excluir`; modal `Cancelar`, `Salvar mídia`/`Salvar alterações` |
| Mídia | **Galeria pública** | `#galeria` | Edita metadados de `gallery_items` (não envia nem exclui) | `Atualizar`; por imagem um formulário com `Salvar` |
| Portal | **Banners e pop-ups** | `#banners` | Campanhas (modal) | `↻ Atualizar`, `➕ Novo rascunho`; por linha `Editar`, `Publicar`, `Duplicar`, `Arquivar`, `Detalhes`, `Despublicar`; modal `Cancelar`, `Criar rascunho`/`Salvar rascunho`, `Limpar imagem` |
| Portal | **Sazonal e clima** | `#sazonal` | Liga/desliga tema sazonal; modo Automático/Manual | `Salvar` |
| Portal | **Mascote** | `#mascote` | Liga/desliga a capivara | `Salvar` |
| Sistema | **Registro de atividades** | `#audit-logs` | Log somente leitura (25 por página) | `Carregar mais` |
| Rodapé | `Ver o portal`, `Portal do Usuário` (nova aba), `Sair` | — | — | — |

Barra superior: botão de menu (celular), breadcrumb "Grupo / Item", etiqueta de ambiente (`Dados reais`/`Ambiente local · dados de teste`), avatar com primeiro nome.

---

## 2. Problemas de arquitetura de informação (IA)

| ID | Local | Problema | Impacto no iniciante | Sev. | Recomendação |
|---|---|---|---|---|---|
| UX-01 | `admin-firebase.html:1326-1327`; `admin-content-cms.js:835-901`; `empreendimentos.js:1228-1256`; `gallery.js:13-14`; `banners.js:711-767` | **Quatro "lugares de imagem" independentes**: Biblioteca de mídia (`media_library`), Galeria pública (`gallery_items`), fotos do empreendimento (upload direto ao Storage, não aparecem na biblioteca — confirmado em `ADMIN-END-TO-END-PUBLICATION-CLOSURE.md:203` "Correspondência em media_library: nenhuma") e imagem de banner (upload próprio). A biblioteca não oferece "Usar em empreendimento"/"Usar em banner". | O servidor sobe a mesma foto várias vezes, não encontra a foto que "já enviou" e não entende por que "Galeria pública" não aceita upload. | P1 | Uma única "Biblioteca de fotos" como origem; seletor de biblioteca nos editores de empreendimento e banner; renomear "Galeria pública" para "Fotos da página Galeria" e explicar que ela só ordena/legenda. |
| UX-02 | `admin-firebase.html:1432-1467` + `1470-1487` + `empreendimentos.js` | Fluxo de empreendimento espalhado por 4 telas: cadastro novo em **Aprovações**, pedido de alteração em **Aprovações › Alterações**, pedido de vínculo em **Pedidos de vínculo**, edição final em **Empreendimentos**. Aprovar cadastro cria rascunho em outra tela (`:3060-3078`). | O usuário aprova e acha que publicou; precisa descobrir que deve ir a outra seção, achar o rascunho e publicar. | P1 | Agrupar sob "Empreendimentos" com abas: Catálogo · Novos cadastros · Pedidos de alteração · Responsáveis (vínculos). Após aprovar, abrir o rascunho direto (hoje é opcional, "Agora não"). |
| UX-03 | `admin-firebase.html:2973` vs `:3060-3062` | **"Aprovar" significa coisas diferentes**: aprovar evento = "Aprovar e publicar" (vai ao ar na hora); aprovar empreendimento = "criar rascunho" (não vai ao ar); aprovar alteração = "Aprovar para revisão" (não aplica nada, `:3870`, `:3140`). | Erro de modelo mental: o servidor aprova um evento esperando revisar depois, ou aprova uma alteração esperando que ela apareça. | P1 | Padronizar: "Aceitar e publicar", "Aceitar como rascunho", "Aceitar alteração" + aplicar no mesmo passo (com prévia antes/depois). |
| UX-04 | `admin-firebase.html:3862-3916`, `3943-3998`, `3809-3857` | Pedido de alteração exige **3 etapas e 3 confirmações** (Aprovar para revisão → Aplicar ao catálogo → por imagem escolher status, "Salvar revisão das imagens", "Aplicar mídia ao catálogo"), com ~8 avisos explicativos técnicos ("workflow canônico", "catálogo editorial", "Regra deste bloco…"). | Fila confusa; alto risco de "aprovar e esquecer de aplicar". | P1 | Um único painel "Antes / Depois" com um botão "Aplicar alterações" (e "Recusar"/"Pedir ajustes"); imagens com aceite inline aplicadas no mesmo clique. |
| UX-05 | `admin-firebase.html:2446`; `dashboard.js:105-108, 316-320` | **Contagem divergente**: o Painel conta pedidos `pending`+`changes_requested`; a lista mostra `pending`+`approved` (inclui os já aplicados, que nunca saem da fila: `:3881-3893`). Falha de leitura vira lista vazia (`firebase-auth.js:2080-2083` retorna `[]`). | Badge diz "2", a tela mostra 5 cartões (ou "Nenhuma solicitação" quando na verdade houve erro). Perda de confiança. | P1 | Mesma regra de status nas duas pontas; esconder "aplicadas" em aba "Histórico"; distinguir erro de vazio. |
| UX-06 | `admin-firebase.html:1557-1559`; `admin-content-cms.js:731-833` | `Importar notícias estáticas` (migração única legada) fica ao lado de `Nova notícia` e `Buscar notícias da Prefeitura`, com mesmo peso visual. | Clique acidental cria dezenas de notícias **já publicadas** (`publicado: true`, `:801`). | P1 | Remover ou mover para "Sistema › Ferramentas", com confirmação por digitação. |
| UX-07 | `admin-firebase.html:1331-1332`; `site-config.js:14-18, 53-54` | "Sazonal e clima" e "Mascote" ocupam 2 itens de menu para 1 checkbox cada; textos "Ativado", "Modo: Automático/Manual" sem explicar o efeito no site. | Menu longo (15 itens); telas quase vazias e opacas. | P2 | Fundir em "Configurações do portal" com descrição/prévia de cada opção. |
| UX-08 | `admin-firebase.html:1313-1317` | Grupo "Moderação" mistura fila de trabalho com **Usuários** (gestão de permissões). "Vínculos ativos" vs "Pedidos de vínculo" usam a palavra técnica "vínculo". | Nomes não dizem a tarefa ("dar acesso de um empreendedor ao seu negócio"). | P2 | "Responsáveis por empreendimentos" (pedidos + ativos em abas) e "Equipe e acessos" (usuários). |
| UX-09 | `admin-firebase.html:2921-2964` | Duplicidade legada: `loadApprovedEvents()` inline com tabela própria (4 colunas, sem ações) ainda existe como fallback de `AdminContentCMS`; contadores legados ocultos `:1423-1428`; função de carregamento por `showSection` em `:2090-2127` paralela a `AdminRouter` (passthrough). | Se o módulo falhar, aparece outra tela sem botões — inconsistência difícil de diagnosticar. | P3 | Remover fallbacks mortos após confirmar módulos. |
| UX-10 | Vários (ver tabela de jargão abaixo) | **Jargão técnico exposto** em rótulos e mensagens. | Termos incompreensíveis para servidores. | P1 | Ver tabela 2.1. |
| UX-11 | Ver tabela 2.2 | **Status inconsistentes** entre módulos. | Mesma situação com nomes diferentes; dúvidas se está no ar. | P1 | Vocabulário único: "No ar" / "Rascunho (fora do ar)" / "Arquivado"; badge idêntico em todos os módulos. |
| UX-12 | `admin-content-cms.js:83-107, 498-518` | Eventos e Notícias **não têm busca, filtro de status nem paginação**; ordenados por última alteração. | "Localizar cadastro antigo" e "ver o que está publicado" viram rolagem manual. | P1 | Busca + filtro de status (e "Importadas da Prefeitura") como já existe em Empreendimentos. |
| UX-13 | Todos os módulos | Nenhum link **"Ver no portal"** para itens publicados (eventos, notícias, empreendimentos, banners, rotas). | Para conferir o resultado o servidor precisa navegar no site e procurar. | P2 | Botão "Abrir no portal" em itens publicados (URL limpa já conhecida por slug/id). |
| UX-14 | `banners.js:563-565` | Banner publicado **não pode ser editado**: precisa Despublicar → Editar → Publicar (fica fora do ar no meio) ou Duplicar. | Corrigir um erro de digitação tira a campanha do ar. | P2 | Permitir editar publicado com prévia + "Atualizar no portal" (padrão de eventos/notícias). |
| UX-15 | `rotas.js:87` | Arquivar rota é **irreversível** ("nesta versão uma rota arquivada não pode ser restaurada"), mas o botão `Arquivar` fica ao lado de `Publicar`/`Editar` sem distinção visual. | Perda de conteúdo por clique. | P1 | Adicionar "Restaurar" (como em empreendimentos) ou exigir digitação. |
| UX-16 | `admin-firebase.html:2339-2343` | `<select>` de permissão oferece "Moderador", função declarada **inativa** pela governança (B2A5) — o painel nem aceita moderador logar. | Servidor pode atribuir papel sem efeito/indefinido. | P2 | Remover a opção do runtime (já previsto no bloco RUNTIME). |
| UX-17 | `empreendimentos.js:2644-2683, 1085-1162` | Gestão de fotos (legenda, crédito, foto principal, ordem, remover) **só existe em `Ver`**, não em `Editar`; o editor só tem "URLs atuais da galeria (uma por linha)". | Função importante escondida; usuário edita URLs à mão. | P1 | Mover o gerenciador de galeria para dentro do editor (ou aba "Fotos"). |

### 2.1 Jargão exposto (amostra com citação literal)

| Texto exibido | Local |
|---|---|
| "Aprovar e criar draft" | `admin-firebase.html:2278` |
| "Owner: …", "Fonte: portal_request" | `admin-firebase.html:2218` |
| Tipo de vínculo "Owner (proprietário)", "Manager (gestor)", "Representative (representante)" | `admin-firebase.html:1632-1634` |
| UID exibido sob o nome do usuário; "encontrado(s) para <uid>" no filtro | `admin-firebase.html:2334, 3382` |
| "Origem: <claimId>", id técnico do empreendimento sob o nome | `admin-firebase.html:2552, 2557`; `empreendimentos.js:911` |
| "Atualizado … Por: <uid>" em eventos/notícias; "Aplicada por: <uid>" | `admin-content-cms.js:98-99, 511`; `admin-firebase.html:3886, 3952` |
| "ID / slug canônico", "Canonical path", "Rotas relacionadas (IDs)", "Aliases/IDs legados", "Arquivo de origem", "ID original", "Status da coordenada" (texto livre `ok`/`aproximada`) | `empreendimentos.js:1177, 1218, 1212, 1224, 1221-1222, 1204-1205` |
| Campo Status somente leitura mostra `draft`/`published`/`archived` em inglês | `empreendimentos.js:1318` |
| "Salva no path de CMS Media do empreendimento", "CMS Media", "Submissao" | `empreendimentos.js:1236, 1079, 1081` |
| "Salve o rascunho completo antes de publicar. Grupos pendentes: core, content, contact, …" | `empreendimentos.js:2548` |
| "Permissao negada. Verifique se as Firestore Rules do CMS-2B foram publicadas…" | `empreendimentos.js:839` |
| "Permissão negada ao … Verifique se as Firestore Rules do Bloco 4B…" | `banners.js:1437` |
| "Permissão negada. Use uma conta administradora ativa no Emulator." | `rotas.js:50` |
| "Erro ao … Veja o console." / "Verifique o console e tente novamente." | `empreendimentos.js:840, 2999`; `banners.js:1439`; `admin-firebase.html:2188, 2240, 2252` |
| "Fonte criptografica segura indisponivel para criar o upload.", "EstablishmentSubmissionBridge indisponível." | `empreendimentos.js:309, 226` |
| "Texto do botão (CTA)", "Link do CTA", "Mesma aba (_self)", "Nova aba (_blank)", "Permitir fechar (dismissible)", "Personalizado (targetPages)", "Atraso do pop-up (ms)", "Largura máx. pop-up (px)"; coluna Tipo mostra `banner`/`popup`, Páginas mostra `home`/`custom` | `banners.js:779, 792, 805-818, 595, 508-514` |
| "Admin V1.1", "A relação com empreendimentos é N:N e fica somente no catálogo interno", "ID técnico", "Slug", "Alt da capa", "Limpar referência", "Preview" | `rotas.js:24-25, 60-66, 38` |
| "Slug", "Data de publicação" (texto com ISO `2026-10-16T12:00:00.000Z`), "Galeria opcional (uma URL por linha)" | `admin-content-cms.js:1477, 1479, 1487` |
| "URL manual", "URL existente", "Copiar URL", URL completa impressa em cada card | `admin-content-cms.js:1333, 1502, 887, 885` |
| "Execute a migração autorizada antes de editar." | `gallery.js:23` |
| Registro de atividades com colunas "Entidade", "ID", "Autenticação", "Papel" e valores crus (`action`, `entityType`, `actorAuthType`) | `audit-logs.js:14, 31` |
| "Workflow canônico", "catálogo editorial", "Regra deste bloco", "snapshot atual" | `admin-firebase.html:3911, 3851, 2473` |
| Português sem acentos: "Gestao editorial da galeria", "Fonte publica", "Nao ha imagens removidas", "Edicao publicada interrompida", "ate 5 MB", "serao", "Ponto turistico", "Experiencia", "Servico", "Exclusao cancelada: confirmacao nao confere…", "Firebase ou sessao admin indisponivel" | `empreendimentos.js:1154, 1151, 1168, 1236, 1252, 59-65, 200, 1981` |

### 2.2 Status e verbos de gravação por módulo

| Módulo | Rótulos de status | Botão de gravar | Botão de publicar |
|---|---|---|---|
| Eventos | `Publicado` / **`Despublicado`** (inclusive evento novo nunca publicado, `admin-content-cms.js:1311, 1357`) + `Destaque` | `Salvar evento` | `Publicar agora`, `Confirmar e publicar`, `Confirmar e atualizar no portal` |
| Notícias | `Publicado` / `Rascunho` + `Legado`, `Destaque` | `Salvar notícia` | idem eventos |
| Empreendimentos | **`Publicado no portal`** / `Rascunho` / `Arquivado`; geo: `Localização verificada`… | `Salvar rascunho` / `Salvar e publicar alteracoes` / `Concluir e republicar` | `Publicar` → `Publicar no portal` |
| Banners | `Rascunho` / `Publicado` / `Arquivado` | `Criar rascunho` / `Salvar rascunho` | `Publicar` → `Publicar banner` |
| Rotas | `Rascunho` / **`Publicada`** / **`Arquivada`** / `Desconhecido` | `Salvar rota` | `Publicar rota` |
| Galeria pública | checkbox `Publicada` | `Salvar` | (checkbox) |
| Pedidos de alteração | `Pendente` / `Aprovada, aguardando aplicação` / `Aprovada e aplicada ao catálogo` / `Rejeitada` / `Ajustes necessários` | `Salvar revisão das imagens` | `Aplicar ao catálogo`, `Aplicar mídia ao catálogo` |
| Mídia | `Em uso no CMS` / `Sem uso detectado` | `Salvar mídia` / `Salvar alterações` | — |
| Botões "Atualizar" | `Atualizar` (primário verde em seções legadas), `↻ Atualizar` (secundário em banners/rotas), `Buscar de novo` | | |

---

## 3. Formulários

| ID | Local | Problema | Impacto | Sev. | Recomendação |
|---|---|---|---|---|---|
| UX-20 | `admin-content-cms.js:1514-1516`; `empreendimentos.js:1276-1289`; `rotas.js:57-66`; `banners.js:801` | **Marcação de obrigatório inconsistente**: só Banners usa "Título *"; Eventos (Título, Data), Notícias (Título), Empreendimentos (Nome, ID/slug, Resumo), Rotas (9 campos) usam só `required` HTML, sem marca visual. Os diálogos (`admin-feedback.js:91`) mostram "obrigatório/opcional" — bom padrão não reaproveitado. | Usuário descobre o obrigatório só no bloqueio do navegador (mensagem genérica em inglês/pt conforme browser). | P1 | Padrão único: "(obrigatório)" no rótulo + `aria-required`. |
| UX-21 | `empreendimentos.js:1177, 1407` | "ID / slug canônico" é `required` no HTML embora o código gere o slug a partir do nome quando vazio. | Servidor obrigado a inventar um identificador técnico permanente (readonly depois). | P1 | Gerar automaticamente a partir do nome, mostrar como "Endereço da página: /local?id=…" editável só em "Avançado". |
| UX-22 | `empreendimentos.js:1164-1266` | **Formulário de ~52 campos** em 7 blocos + imagem + galeria; blocos técnicos (SEO, Origem) recolhidos, mas Localização tem 10 campos (inclui lat/lng manuais e "Status da coordenada" texto livre), Exibição 7. Editor abre **abaixo da tabela** na mesma página (`:1009-1012`). | Formulário intimidador; usuário perde a lista de vista e não sabe onde está. | P1 | Assistente em etapas (Básico → Endereço/mapa → Fotos → Contato → Revisar); ocultar lat/lng sob o mapa; editor em tela própria com breadcrumb. |
| UX-23 | `admin-content-cms.js:1326`; `admin-content-preview.css` (`.pv-ev-card.religioso/feira/cultural/esportivo`, `admin-panel.css:1099-1102`) | Categoria de evento é **texto livre** (padrão "cultural"), mas o portal só estiliza 4 valores. Categoria de mídia e de notícia também livres. | Erros de grafia criam categorias "invisíveis"/sem cor. | P2 | `<select>` com lista fechada. |
| UX-24 | `admin-content-cms.js:1479` | "Data de publicação" é campo texto preenchido com ISO (`new Date().toISOString()`). | Usuário não sabe editar; datas inválidas quebram ordenação. | P1 | `type="date"` (+ hora opcional). |
| UX-25 | `admin-firebase.html:2428-2432`, `3866-3868` | Motivos de rejeição/ajuste ficam em **campos soltos na linha da tabela**, antes dos botões; se vazio, toast "Informe o motivo da rejeição antes de continuar." Em eventos/empreendimentos o motivo é pedido em diálogo (`:2983-2991`). | Dois padrões para a mesma ação; três caixas de texto juntas confundem qual preencher. | P2 | Sempre pedir o motivo no diálogo da ação (já existe `askText`). |
| UX-26 | `rotas.js:68, 71` | Erro de validação **reabre o modal inteiro** (`openForm(id, errors)`) — perde rolagem e foco. | Usuário não vê o erro (pode estar no topo). | P2 | Validar inline e focar o primeiro campo com erro. |
| UX-27 | `admin-content-cms.js:1491-1512` | "Adicionar mídia": título obrigatório mas **texto alternativo opcional**, enquanto o Painel cobra "imagens sem texto alternativo" (`dashboard.js:361-365`). | Cria a dívida que depois é cobrada. | P2 | Exigir alt (ou "imagem decorativa") no envio. |
| UX-28 | `empreendimentos.js:1300-1307` | Checkbox com 2 `<label>` ("Destaque na Home" + "Sim"). | Leitor de tela lê "Destaque na Home Sim"; alvo de clique pequeno. | P3 | Um rótulo só, à direita da caixa. |
| UX-29 | `banners.js:806-807`; `rotas.js:63` | Unidades técnicas: "Atraso (ms)", "Largura (px)"; "Ícone" exige emoji digitado; "Cor" livre. | Iniciante não sabe o que digitar. | P2 | "Mostrar depois de X segundos"; tamanhos predefinidos; seletor de ícones. |
| UX-30 | `admin-firebase.html:1248-1250` | Login sem `<label>` (só `placeholder` "E-mail"/"Senha"); sem "Esqueci minha senha" (a API existe: `firebase-auth.js:1275`). | Acessibilidade e bloqueio do servidor que esqueceu a senha. | P2 | Rótulos visíveis + link de recuperação. |

**Mensagens de erro cruas/pouco claras (citações):** "Erro ao salvar empreendimento. Veja o console." (`empreendimentos.js:2999`); "Falha parcial. O rascunho foi preservado. Tente novamente." (`:2114`, enviado mesmo quando o item **estava publicado** e saiu do ar); "Upload confirmado, mas o vinculo ao documento ainda esta pendente. Tentar novamente reutiliza o mesmo objeto nesta sessao." (`:2099`); "Firebase indisponível." (`banners.js:999`); "Não foi possível buscar as notícias da Prefeitura: serviço de consulta não publicado ou indisponível" (`prefeitura-news-importer.js:362`). Pontos positivos: login traduz códigos `auth/*` (`firebase-auth.js:76-87`); toasts de eventos/notícias dizem "Suas alterações continuam no formulário".

---

## 4. Feedback, confirmações e estados

| ID | Local | Problema | Impacto | Sev. | Recomendação |
|---|---|---|---|---|---|
| UX-40 | `admin-content-cms.js:32-38`; `admin-firebase.html:1602, 1662`; `empreendimentos.js:2952-2961`; `banners.js:828` | **Nenhuma proteção contra perda de alterações**: clique no fundo escuro do modal (`onclick="AdminContentCMS.closeModal()"`), `Cancelar`, troca de seção no menu ou `Voltar` do navegador descartam o formulário sem aviso (não há `beforeunload` nem verificação de "sujo" — busca por `dirty|beforeunload` só encontra o componente de diálogo). | Perda de textos longos (notícia, descrição de empreendimento). | **P0** | Guardar estado "alterado" por formulário; confirmar ao fechar/navegar; remover fechamento por clique no fundo em editores. |
| UX-41 | `admin-firebase.html:1726, 1937-1960` | Sessão expira após 2 h de inatividade e faz logout forçado sem aviso prévio nem salvamento de rascunho. | Quem redige uma notícia longa e sai para reunião perde tudo. | P1 | Aviso 5 min antes com "Continuar conectado"; rascunho local. |
| UX-42 | `empreendimentos.js:2060-2066`, `2093-2117`; incidente documentado em `ADMIN-END-TO-END-PUBLICATION-CLOSURE.md:216-228` | Editar um empreendimento **publicado** o retira do ar durante o salvamento ("Retirando publicacao…") e o republica no fim; se falhar no meio, ele fica fora do portal com o aviso "Falha parcial. O rascunho foi preservado" e o rótulo "Concluir e republicar". Já causou o sumiço do Artur Biergarten. | Usuário não percebe que o negócio sumiu do site. | P1 | Mensagem explícita "ATENÇÃO: este empreendimento está FORA DO AR até você concluir"; banner fixo no topo da lista enquanto houver item interrompido; idealmente gravar sem despublicar. |
| UX-43 | `prefeitura-news-importer.js:302-310, 351`; `prefeitura-news.js:538-544` | Confirmação diz "Entram no CMS como rascunho — nada vai ao ar até você publicar", e o toast diz "atualizada(s) como rascunho", mas `buildUpdatePatch` **mantém `publicado`**: notícia importada já publicada tem o conteúdo trocado **no ar** sem revisão. | Mensagem falsa; conteúdo da Prefeitura muda o site sem revisão do Turismo. | **P0** | Corrigir o texto ou forçar rascunho/prévia para atualizações de itens publicados. |
| UX-44 | `admin-feedback.js:68-200` | **Ponto forte**: diálogos nativos `<dialog>` acessíveis, foco inicial em "Cancelar" nas ações perigosas, retorno de foco, `aria-invalid`, confirmação por digitação ("Digite EXCLUIR"). Toasts com `role=alert/status`, 9 s para erro. | — | — | Manter como padrão do painel inteiro. |
| UX-45 | `admin-content-cms.js:325-340`; `gallery.js:42-50`; `site-config.js:37-50` | Ações sem confirmação nem desfazer: `Destacar`/`Remover destaque` (afeta a home), "Publicada" da galeria (desmarcar + `Salvar`), Mascote/Sazonal. | Mudança pública sem aviso. | P2 | Confirmar ou oferecer "Desfazer" no toast. |
| UX-46 | `admin-firebase.html:2090-2127`; módulos `activate()` | Cada clique no menu **recarrega tudo** e reinicia o HTML da seção ("Carregando..."); filtros de Mídia são recriados a cada carga (`admin-content-cms.js:872`); Empreendimentos mantém filtros só em memória e o atalho do Painel zera a busca (`empreendimentos.js:2976-2986`). | Contexto perdido ao ir e voltar; latência repetida. | P2 | Persistir filtros por seção (sessionStorage/hash) e só recarregar sob demanda. |
| UX-47 | `admin-firebase.html:2307, 2395, 2449, 2528`; `admin-ui.js:53-73` | Estados vazios usam `#888` sobre branco (3,54:1) e textos genéricos; erros de carga às vezes viram vazio (UX-05). | Leitura difícil; "vazio" enganoso. | P2 | Classe `.admin-empty` (já existe, `admin-panel.css:958`) em todos; mensagem com próximo passo. |
| UX-48 | `admin-firebase.html:3068-3078` | Após aprovar cadastro, toast + segundo diálogo "Rascunho criado… `Abrir em Empreendimentos` / `Agora não`" mostra o **ID técnico** do rascunho. | Dois avisos seguidos; ID sem utilidade. | P3 | Um só diálogo com o nome e botão "Revisar e publicar agora". |
| UX-49 | Pós-salvar | Eventos/notícias/mídia: fecha modal e recarrega a lista (posição de rolagem mantida — ok). Empreendimentos: remove o editor abaixo da tabela e recarrega (`empreendimentos.js:2084-2091`), devolvendo o usuário a um ponto arbitrário da página, sem destacar o item salvo. | Usuário não confirma visualmente o que salvou. | P3 | Rolar até a linha salva e destacá-la. |

---

## 5. Auxílios de navegação

- **Breadcrumb** "Grupo / Item" e `document.title` por seção (`admin-nav.js:84-95`) — bom. Não reflete subníveis (editor de empreendimento, modais) — P3.
- **Item ativo no menu**: fundo + barra dourada (`admin-panel.css:130-145`) — bom.
- **Deep link por hash** e Voltar do navegador — funcionam por seção (`admin-nav.js:96-98, 244-248, 266-269`). **Não há link para um registro** (ex.: `#empreendimentos/artur-biergarten`) — P2. Voltar com modal aberto troca a seção por baixo e **o modal continua aberto** (`showSection` não fecha `#contentModal`) — P2 (UX-50).
- **Foco após navegação** vai para o `h1` da seção (`admin-nav.js:103-110`) — bom.
- **Busca global**: inexistente — P2 (UX-51). Busca por seção só em Empreendimentos, Rotas (nome/slug) e Mídia.
- **Badges do menu** (`dashboard.js:291-302`): o número ao lado de "Eventos" significa "eventos encerrados ainda publicados" e ao lado de "Empreendimentos" "localização a corrigir" — explicação só no `title` (hover) — P2 (UX-52). O atalho do Painel para "imagens sem texto alternativo" abre Mídia **sem** aplicar o filtro existente "Sem texto alternativo" (`admin-nav.js:214` só suporta empreendimentos) — quick win (UX-53).

---

## 6. Acessibilidade (nível de código)

| ID | Local | Achado | Sev. |
|---|---|---|---|
| UX-60 | `admin-firebase.html:1601-1672`; `admin-content-cms.js:40-44` | Modais legados (`#contentModal`, `#managerModal`) têm `role="dialog" aria-modal="true"` mas **não movem foco para dentro, não prendem o Tab, não fecham com Esc e não devolvem o foco** ao fechar. Todos os editores (evento, notícia, mídia, banner, rota, importador) usam este modal. Rotas move foco só em "Nova rota" (`rotas.js:68`). | P1 |
| UX-61 | `admin-panel.css:35, 69-72` | Anel de foco `rgba(200,147,90,.55)` sobre branco = **1,66:1** (mínimo WCAG 1.4.11 = 3:1); `outline: none` remove o contorno. Sobre botões verdes fica 7,5:1 (ok). Em campos/links/botões claros o foco é quase invisível. | P1 |
| UX-62 | Contrastes calculados | `#888` em estados vazios/legendas = 3,54:1 ❌; `#999` (login "Acesso restrito…", 0,8rem) = 2,85:1 ❌; `#aaa` = 2,32:1 ❌; `#bbb` "sem imagem" (banners) = 1,92:1 ❌; rótulos de grupo do menu (branco 45% sobre `#0a3226`, 0,68rem) = 4,02:1 ❌; botão legado `.btn-edit` `#1976d2` sobre `#e3f2fd` (0,8rem) = 4,03:1 ❌. Aprovados: texto `--adm-muted` 4,99:1 (4,72 no cabeçalho de tabela, 4,51 no fundo da página — no limite), links do menu 8,7:1, badges (4,7–5,8:1), botão primário 12,5:1, erro `#b42318` 6,6:1. Bordas de campo `#cfd6cf` = 1,48:1 e `#ddd` = 1,36:1 vs branco (abaixo de 3:1 para identificar o campo). | P2 |
| UX-63 | `admin-content-cms.js:1402-1407`; `admin-content-preview.js:278-287`; `prefeitura-news-importer.js:205-210` | Abas com `role="tab"` sem navegação por setas; nas abas do editor falta `aria-controls`/`tabpanel`; no importador um botão de ação ("Marcar novas…") está dentro do `tablist`. | P3 |
| UX-64 | `admin-nav.js:153-154` | `aria-label` em `<span>` de badge sem papel (ignorado por vários leitores); o número é lido solto ("Eventos 2"). | P3 |
| UX-65 | `empreendimentos.js:902, 1330`; `admin-firebase.html:1242` | Miniaturas com `alt=""` (ok, decorativas) mas logo do login com `alt="Logo"`; pré-visualizações com `alt="Preview"` (`banners.js:722`). | P3 |
| UX-66 | Teclado | Ações principais são `<button>`/`<a href>` reais com delegação — operáveis por teclado. Seletor de mídia das Rotas lista **só títulos** em botões, sem miniatura (`rotas.js:89`). Mapa do verificador depende de clique/arraste (há busca por endereço e link do Google Maps como alternativa — ok). | P3 |
| UX-67 | Responsivo | ≤960 px menu vira gaveta com Esc/overlay e `inert` (bom, `admin-nav.js:59-81`); ≤720 px tabelas `.data-table` viram cartões (bom, `admin-nav.js:283-333`). Exceções: tabela do Registro de atividades não tem a classe `data-table` (`audit-logs.js:31`) → rola horizontalmente; linhas de Banners usam `white-space:nowrap` com até 5 botões (`banners.js:601`); formulário de empreendimento com grid 2 colunas fixas em campos de 10 itens. | P3 |

---

## 7. Fluxos de tarefa (passos contados no código)

| Tarefa | Caminho atual | Cliques mínimos* | Observações |
|---|---|---|---|
| **Cadastrar atrativo/empreendimento** | Menu `Empreendimentos` → `Novo empreendimento` → preencher Nome, **ID/slug (obrigatório)**, Categoria ("Ponto turistico" — não existe "atrativo"), **Resumo** → (opcional) mapa: buscar endereço/clicar, `Marcar como verificada` + confirmar → escolher arquivo da foto → `Salvar rascunho` → localizar a linha → `Publicar` → `Publicar no portal` | **6 cliques + 4 campos obrigatórios** (≈10 com mapa e foto); legenda/crédito das fotos só depois, em `Ver` → `Editar metadados` (+3 por foto) | ~52 campos visíveis/recolhidos; termo "atrativo" ausente da IA. |
| **Atualizar estabelecimento** (direto) | `Empreendimentos` → pesquisar → `Editar` (editor surge abaixo da lista) → alterar → `Salvar e publicar alteracoes` | **3 cliques** | Item sai do ar durante o salvamento (UX-42). |
| **Atualizar estabelecimento** (pedido do dono) | `Aprovações` → rolar até "Alterações" → `Aprovar para revisão` → confirmar → `Aplicar ao catálogo` → confirmar; fotos: status por foto → `Salvar revisão das imagens` → `Aplicar mídia ao catálogo` → confirmar | **8–10 cliques, 3 confirmações** | Fila nunca esvazia (aplicados continuam visíveis). |
| **Adicionar mídia** | `Biblioteca de mídia` → `Adicionar mídia` → Título + arquivo → `Salvar mídia` | **3 cliques + arquivo** | Para usar num empreendimento: `Copiar URL` → ir a Empreendimentos → `Editar` → colar em "URL da imagem principal" → salvar (≈7 ações em 2 seções). Galeria pública não aceita upload. |
| **Localizar cadastro antigo** | Empreendimentos: busca por nome/endereço (bom, inclui arquivados). Eventos/Notícias: **sem busca** — rolar tabela inteira. Banners: só filtros de status/tipo. Usuários: sem busca. | 1–2 (empreendimentos) / **N rolagens** (eventos, notícias) | Sem busca global. |
| **Corrigir conteúdo publicado** | Evento/notícia: `Editar` → alterar → `Salvar` → prévia → `Confirmar e atualizar no portal` (**3**). Empreendimento: 3 (UX-42). Banner: `Despublicar` → confirmar → `Editar` → salvar → `Publicar` → confirmar (**6**, fora do ar no meio). Rota: `Editar` → `Salvar rota` (**2**, sem prévia obrigatória). | 2–6 | Prévia obrigatória só em eventos/notícias (bom). |
| **Revisar notícia (importador)** | `Notícias` → `Buscar notícias da Prefeitura` (consulta ao vivo, timeout 70 s por lote, `prefeitura-news-importer.js:116`) → revisar pré-seleção → `Importar N…` → confirmar → fechar → na lista (sem filtro "importadas") `Publicar` → revisar prévia → `Publicar agora` | **5 + 2 por notícia** | Notícias importadas não têm badge próprio na lista; atualização de já publicadas vai ao ar sem revisão (UX-43). |
| **Ver o que está publicado** | Painel: só contagens + 5 próximos eventos. Empreendimentos/Banners/Rotas: filtro Status. Eventos/Notícias: sem filtro, ler badge linha a linha. | 2 (com filtro) / N | Sem "Abrir no portal". |
| **Despublicar** | `Despublicar` → confirmar, em todos os módulos (**2**). Galeria: desmarcar `Publicada` + `Salvar` (sem confirmação). Evento despublicado passa a "Despublicado"; notícia a "Rascunho". | 2 | Consistente no gesto, inconsistente no rótulo. |

\*Cliques a partir do Painel, sem contar digitação.

---

## 8. Reorganização de menu proposta

| Atual (grupo › item) | Recomendado | Motivo |
|---|---|---|
| Painel | **Início** (fila de trabalho) | Termo cotidiano. |
| Moderação › Aprovações (3 filas) | Distribuir: eventos → **Agenda › Enviados para aprovação**; empreendimentos → **Lugares e negócios › Novos cadastros / Pedidos de alteração** | A fila fica junto do conteúdo que ela altera. Manter "Pendências" agregadas no Início. |
| Moderação › Pedidos de vínculo + Vínculos ativos | **Lugares e negócios › Responsáveis** (abas Pedidos / Ativos) | Uma tarefa, uma tela. |
| Moderação › Usuários | **Administração › Equipe e acessos** | Separar gestão de permissões do conteúdo. |
| Conteúdo › Empreendimentos | **Lugares e negócios › Catálogo** | Inclui "atrativos" (pontos turísticos) — usar a palavra que a equipe usa. |
| Conteúdo › Eventos | **Agenda** | — |
| Conteúdo › Notícias | **Notícias** (com "Importar da Prefeitura" como aba) | Remover "Importar notícias estáticas". |
| Conteúdo › Rotas | **Roteiros** | Termo do visitante. |
| Mídia › Biblioteca de mídia + Galeria pública | **Fotos** (abas: Biblioteca · Página Galeria) | Uma origem de imagens. |
| Portal › Banners e pop-ups | **Avisos e campanhas** | Evita anglicismo. |
| Portal › Sazonal e clima + Mascote | **Configurações do portal** (uma tela) | Telas de 1 checkbox. |
| Sistema › Registro de atividades | **Administração › Histórico de alterações** | Com textos legíveis. |

Resultado: 15 → ~8 itens de primeiro nível (Início, Agenda, Notícias, Lugares e negócios, Roteiros, Fotos, Avisos e campanhas, Administração).

---

## 9. Quick wins (alto impacto, baixo esforço)

1. **Guarda de alterações não salvas** nos modais e no editor de empreendimento; remover fechamento por clique no fundo dos editores (UX-40, P0).
2. **Corrigir a mensagem do importador** ou forçar rascunho em atualizações de notícias publicadas (UX-43, P0).
3. Trocar textos técnicos por linguagem simples: "Aprovar e criar draft" → "Aceitar como rascunho"; Owner/Manager/Representative → Proprietário/Gestor/Representante; esconder UIDs e IDs; status do empreendimento em português; remover "Veja o console"/"Firestore Rules"/"Emulator" das mensagens; restaurar acentos em `empreendimentos.js` (UX-10).
4. Unificar rótulos de status ("No ar" / "Rascunho" / "Arquivado") e de botões de salvar (UX-11).
5. Marcar campos obrigatórios com "(obrigatório)"; tornar o slug de empreendimento opcional/automático (UX-20, UX-21).
6. Anel de foco com contraste ≥3:1 (ex.: `outline: 3px solid #0b3b2c` + offset) e cores de texto ≥4,5:1 (`#888`, `#999`, `#bbb`, rótulos de grupo) (UX-61, UX-62).
7. Esc/foco/trap no `#contentModal` e `#managerModal` reutilizando o `<dialog>` de `admin-feedback.js` (UX-60).
8. Busca + filtro de status em Eventos e Notícias (UX-12).
9. Atalho do Painel "imagens sem texto alternativo" aplicar o filtro existente (UX-53); explicar badges do menu em texto (UX-52).
10. Esconder `Importar notícias estáticas`; adicionar "Restaurar" ou confirmação forte em "Arquivar rota" (UX-06, UX-15).
11. Data de publicação de notícia como `type="date"`; categoria de evento como lista fechada (UX-23, UX-24).
12. Link "Abrir no portal" em itens publicados (UX-13).
