# C — Matriz de funcionalidades necessárias

Critério de inclusão: resolve um problema observado nesta auditoria ou no histórico do projeto, cabe na arquitetura atual (HTML/JS estático + Firebase) e não exige um sistema novo. Recursos considerados e **não recomendados** estão no fim.

Situação: **Existente** (funciona) · **Parcial** (existe com lacunas relevantes) · **Ausente**.

## 1. Dashboard e organização

| Funcionalidade | Situação atual | Benefício (problema que resolve) | Prioridade | Complexidade |
|---|---|---|---|---|
| Painel inicial com fila de trabalho | **Existente** — fila por urgência, "No portal agora", qualidade do catálogo, próximos eventos | Já resolve "por onde começo". Manter. | — | — |
| Contagens confiáveis no painel | **Parcial** — badge conta status diferentes da lista; erro vira zero | Confiança no número exibido | P2 | Baixa |
| Alerta "item fora do ar por edição interrompida" | **Ausente** | Evita repetir o caso Artur Biergarten sem ninguém perceber | **P1** | Baixa |
| Busca e filtro de status em Eventos e Notícias | **Ausente** (existe em Empreendimentos, Rotas, Mídia) | Localizar cadastro antigo; ver o que está no ar | **P1** | Baixa |
| Busca global (nome em todas as coleções) | **Ausente** | Encontrar qualquer item sem saber a seção | P3 | Média |
| Paginação / "Mostrar mais" nas listas | **Ausente** (exceto Registro de atividades) | Listas de 11–29 mil px; custo de leitura cresce com o acervo | P2 | Baixa |
| Filtros preservados ao navegar | **Ausente** | Voltar à lista no mesmo ponto após editar | P2 | Baixa |
| Link "Abrir no portal" | **Ausente** | Conferir o resultado em 1 clique | P2 | Baixa |

## 2. Gestão de conteúdo

| Funcionalidade | Situação atual | Benefício | Prioridade | Complexidade |
|---|---|---|---|---|
| Rascunhos | **Existente** em todos os módulos | — | — | — |
| Pré-visualização antes de publicar | **Parcial** — obrigatória em Eventos/Notícias; Rotas tem "Preview"; Empreendimentos e Banners não | Reduz erro publicado | P2 | Média |
| Proteção contra perda de edição | **Ausente** | Ver BUG-01 | **P1** | Baixa |
| Editar item publicado sem tirá-lo do ar | **Parcial** — Eventos/Notícias sim; Empreendimentos despublica durante o salvamento; Banners exigem despublicar | Ver BUG-02 | **P1** | Média |
| Controle de edição simultânea (revisão/versão) | **Parcial** — só Empreendimentos | Dois servidores não apagam o trabalho um do outro | P2 | Média |
| Status de publicação unificado | **Ausente** (4 vocabulários) | Elimina o bug de "publicado" diferente em cada página (DATA-01) | **P1** | Média |
| Validação de obrigatórios com marcação visual | **Parcial** | Usuário sabe o que falta antes de salvar | P2 | Baixa |
| Indicador de cadastro incompleto | **Parcial** — "Qualidade do catálogo" no Início, só para empreendimentos | Estender a eventos (sem imagem, sem local) e notícias (sem imagem) | P3 | Baixa |
| Arquivamento reversível | **Parcial** — Empreendimentos restaura; Rotas não | Evita perda por clique | P2 | Baixa |
| Duplicar | **Existente** em Eventos e Banners (com risco de duplo clique) | — | P3 | Baixa |
| Agendamento de publicação | **Parcial** — só Banners (`startAt`/`endAt`) | Evento encerrado sair do ar sozinho resolve um alerta recorrente do Início | P3 | Média |
| Despublicação automática de evento encerrado | **Ausente** (o Início só alerta) | Agenda sempre atual sem trabalho manual | P2 | Baixa (cliente) / Média (função agendada) |
| Histórico de alterações por item | **Parcial** — `audit_logs` global, sem autor nem conteúdo | Saber quem mudou o quê e quando | P2 | Média |
| Recuperar versão anterior | **Ausente** | Desfazer um erro publicado | P3 | Alta |
| Fluxo de revisão/aprovação entre editores | **Ausente** (só existe moderação de envios externos) | Só faz sentido se houver perfil "editor" (ver §5) | P3 | Alta |
| Edição em lote | **Ausente** | Volume atual (≈70 itens) não justifica | — | — |

## 3. Mídias

| Funcionalidade | Situação atual | Benefício | Prioridade | Complexidade |
|---|---|---|---|---|
| Biblioteca central | **Parcial** — existe, mas fotos de empreendimento e banners não passam por ela | Uma foto enviada uma vez, usada em qualquer lugar | **P1** | Média |
| Seletor da biblioteca nos editores | **Parcial** — Eventos (quebrado, BUG-03), Notícias, Rotas; falta em Empreendimentos e Banners | Usar foto sem copiar e colar URL | **P1** | Média |
| Autoria e licença por imagem | **Parcial** — `credit` livre só em empreendimentos; registro estático separado (`js/image-attribution.js`) que o sobrescreve | Fonte única de crédito; obrigação legal de atribuição | **P1** | Média (campos) / Alta (migração) |
| Texto alternativo obrigatório no envio | **Parcial** — opcional, mas cobrado depois pelo Início | Acessibilidade sem retrabalho | P2 | Baixa |
| Uso da mídia ("onde está sendo usada") | **Parcial** — ignora banners, galeria e `site_config` | Excluir com segurança | P2 | Baixa |
| Arquivos órfãos no Storage | **Ausente** (upload antes da gravação deixa órfãos) | Custo e organização | P3 | Média |
| Validação de formato e tamanho | **Existente** (Storage: jpeg/png/webp ≤ 5 MB) | — | — | — |
| Prevenção de duplicidade (mesmo arquivo) | **Ausente** | Biblioteca limpa | P3 | Média |
| Galeria pública: criar e excluir itens | **Parcial** — só edita | Gerir a página Galeria sem script | P2 | Baixa |

## 4. Turismo

| Funcionalidade | Situação atual | Benefício | Prioridade | Complexidade |
|---|---|---|---|---|
| Endereço e mapa com verificação | **Existente** — verificador de coordenadas, satélite, link do Google Maps, "Marcar como verificada" | Ponto forte; manter | — | — |
| Contatos e horários | **Existente** (campos de contato; horários em texto) | — | — | — |
| Categorias de atrativo | **Parcial** — "Ponto turistico" existe como categoria, mas a palavra "atrativo" não aparece no painel | Linguagem da equipe | P3 | Baixa |
| Informações de acessibilidade do local | **Ausente** | Requisito comum em portais de turismo; ajuda o visitante com deficiência | P3 | Baixa (campos) |
| Eventos ligados a empreendimentos | **Parcial** — `relatedEventIds` existe no modelo; sem interface clara | Agenda ↔ local | P3 | Média |
| Roteiros | **Existente** (Rotas, com vínculo N:N a empreendimentos) | — | — | — |
| Destaques e conteúdo sazonal | **Existente** (destaque em eventos/notícias/empreendimentos; tema sazonal) | — | — | — |
| Dados desatualizados ("revisado há mais de N meses") | **Ausente** | Telefones e horários mudam; o Início poderia listar os mais antigos | P2 | Baixa (`updatedAt` já existe) |
| Verificador de links externos | **Ausente** | Sites e redes de negócios saem do ar | P3 | Média (precisa de função) |
| SEO por item | **Existente** em empreendimentos (bloco "SEO e compartilhamento") | — | — | — |
| **Tela de Reservas** | **Ausente** — a coleção recebe pedidos com dados pessoais e ninguém lê | Decidir: tela de leitura simples, ou retirar `/reservas` do ar | **P1** (decisão) | Baixa a média |

## 5. Usuários, permissões e controle editorial

| Funcionalidade | Situação atual | Benefício | Prioridade | Complexidade |
|---|---|---|---|---|
| Perfis com papéis | **Parcial** — `admin` e `user` reais; `moderator` existe no backend sem interface e foi declarado inativo (B2A5), mas ainda aparece no seletor | Remover a opção evita atribuir papel sem efeito | P2 | Baixa |
| Separação editar × publicar | **Ausente** | Só necessária se a equipe crescer além de poucos administradores de confiança. Não implementar agora. | P3 | Alta |
| Desativação imediata de acesso | **Existente** (Rules exigem `ativo == true` a cada requisição) | — | — | — |
| Proteção do último administrador | **Ausente** | Evita trancar a equipe fora | P2 | Baixa |
| Autor visível nas ações | **Parcial** — UID cru em eventos/notícias; Registro de atividades sem autor | "Quem publicou isto?" | P2 | Baixa |
| Confirmação de ações destrutivas | **Existente** (digitar EXCLUIR) | — | — | — |
| MFA para administradores | **Ausente** (a confirmar no console) | Protege contas com poder de publicação | P2 | Baixa (config) |
| Aviso antes do logout por inatividade | **Ausente** | Evita perda de texto | P1 | Baixa |
| Recuperação de senha no login | **Ausente** na tela (API existe) | Autonomia do servidor | P2 | Baixa |

## 6. Avaliados e não recomendados agora

| Recurso | Motivo |
|---|---|
| Edição em lote | Acervo pequeno; risco maior que o ganho. |
| Fluxo editorial multi-etapas (editor → revisor → publicador) | Equipe pequena; adicionaria cliques a todas as tarefas. Reavaliar se houver mais de ~5 editores. |
| Versionamento completo com restauração | Custo alto; o histórico simples com "o que mudou" resolve 80% da necessidade. |
| Métricas de acesso no painel | Não há fonte confiável integrada; evitar números que não se pode sustentar. |
| Reescrita do painel em framework | O problema é coerência e proteção contra erro, não tecnologia. As correções cabem no código atual. |
