# Plano tecnico do Portal de Cadastros

## 1. Estado atual do Portal do Usuario

Arquivos auditados nesta rodada:

- `portal-usuario.html`
- `admin-firebase.html`
- `js/firebase-auth.js`
- `js/firebase-app-check.js`
- `js/cms.js`
- `js/reservas.js`
- `js/security-utils.js`
- `config.js`
- `sw.js`
- `_headers`
- `firestore.rules`
- `docs/auditoria-seguranca.md`
- `docs/commands.md`

Resumo do estado atual:

- O Portal do Usuario ja possui login real com Firebase Auth.
- O formulario de evento e renderizado em modal inline dentro de `portal-usuario.html`.
- O formulario de estabelecimento tambem e renderizado em modal inline dentro de `portal-usuario.html`.
- Os envios atuais ja sao gravados no Firestore.
- Nao existe upload de imagens hoje.
- Nao existe uso atual de Firebase Storage no portal/admin.
- Ja existe painel admin simples para aprovar ou rejeitar eventos e estabelecimentos.
- O fluxo atual usa collections separadas de pendentes e aprovados.
- O card "acompanhar cadastros" existe no portal, mas a listagem implementada hoje acompanha apenas eventos do usuario.

## 2. O que ja existe

### Formularios e tela logada

- Evento: modal `#eventModal` em `portal-usuario.html`.
- Estabelecimento: modal `#establishmentModal` em `portal-usuario.html`.
- Envio do evento: funcao inline `enviarEvento()`.
- Envio do estabelecimento: funcao inline `enviarEstabelecimento()`.
- Acompanhamento atual: funcao inline `carregarEventos()`, sem equivalente para estabelecimentos.

### Firestore atual

Collections ja usadas:

- `usuarios`
- `eventos_pendentes`
- `eventos_aprovados`
- `estabelecimentos_pendentes`
- `estabelecimentos_aprovados`
- `noticias`
- `reservas`

Fluxo atual:

- Usuario cria conta e ganha documento em `usuarios/{uid}`.
- Evento enviado vai para `eventos_pendentes`.
- Estabelecimento enviado vai para `estabelecimentos_pendentes`.
- Admin/moderador aprova copiando para collection de aprovados.
- No caso de aprovacao, o documento pendente e removido.
- No caso de rejeicao, o documento permanece na collection pendente com `status = 'rejeitado'`.

### Admin atual

O painel `admin-firebase.html` ja possui:

- secao de aprovacoes pendentes;
- listagem de eventos pendentes;
- listagem de estabelecimentos pendentes;
- aprovacao;
- rejeicao com observacao via `prompt`;
- listagem de usuarios;
- listagem de eventos aprovados.

Limitacoes atuais do admin:

- nao ha visualizacao detalhada real de evento;
- nao ha visualizacao detalhada de estabelecimento;
- nao ha anexos/imagens;
- nao ha estado "solicitar ajustes";
- nao ha listagem de estabelecimentos aprovados;
- nao ha filtro, busca ou historico de revisao.

### Seguranca e papeis atuais

- A UI admin depende de `window.currentUser.role === 'admin'`.
- A protecao real esta em `firestore.rules`, usando `usuarios/{uid}.role` e `ativo != false`.
- `moderator` ja e aceito nas regras e em `FirebaseSystem.isModerator()`.
- `localStorage` guarda apenas sessao visual simplificada (`smsUserSession`), nao o papel admin.

## 3. O que falta

- Upload de ate 6 imagens por estabelecimento.
- Upload de imagens para eventos.
- Uso real de Firebase Storage no portal/admin.
- Modelo unico e mais escalavel para submissao e revisao.
- Acompanhamento de estabelecimentos pelo proprio usuario.
- Estado intermediario de ajuste solicitado.
- Painel admin com detalhes completos e preview de imagens.
- Estrutura para pedido de alteracao de empreendimento existente.
- Integracao futura entre aprovados e mapa sem editar JS estatico a cada cadastro.

## 4. Modelo de dados atual

### Tabela de mapeamento

| Campo atual | Onde aparece | Collection/arquivo | Observacao |
| --- | --- | --- | --- |
| `uid` | sessao e auth | Firebase Auth / `usuarios` | chave do usuario |
| `nome` | cadastro/login/menu/admin | `usuarios` / `js/firebase-auth.js` | usado tambem como `submittedByName` |
| `email` | cadastro/login/admin | `usuarios` / `js/firebase-auth.js` | usado tambem como `submittedByEmail` |
| `telefone` | cadastro usuario | `usuarios` / `js/firebase-auth.js` | perfil basico |
| `tipo` | cadastro usuario | `usuarios` / `js/firebase-auth.js` | `turista`, `organizador`, `estabelecimento` |
| `organizacao` | cadastro usuario | `usuarios` / `js/firebase-auth.js` | texto livre |
| `ativo` | admin/regras | `usuarios` / `firestore.rules` | bloqueia acesso quando `false` |
| `role` | admin/regras | `usuarios` / `firestore.rules` | `user`, `moderator`, `admin` |
| `criadoEm` | usuarios/admin | `usuarios` / `js/firebase-auth.js` | timestamp servidor |
| `verificado` | usuarios | `usuarios` / `js/firebase-auth.js` | hoje sem fluxo adicional |
| `id` | evento | `eventos_pendentes`, `eventos_aprovados` | gerado como `evt_{timestamp}` |
| `nome` | evento | `eventos_pendentes`, `eventos_aprovados` | nome publico do evento |
| `categoria` | evento | `eventos_pendentes`, `eventos_aprovados` | texto simples |
| `dataInicio` | evento | `eventos_pendentes`, `eventos_aprovados` | string de data |
| `dataFim` | evento | `eventos_pendentes`, `eventos_aprovados` | opcional |
| `horaInicio` | evento | `eventos_pendentes`, `eventos_aprovados` | opcional |
| `horaFim` | evento | `eventos_pendentes`, `eventos_aprovados` | opcional |
| `local` | evento | `eventos_pendentes`, `eventos_aprovados` | texto livre |
| `descricao` | evento | `eventos_pendentes`, `eventos_aprovados` | texto livre |
| `entrada` | evento | `eventos_pendentes`, `eventos_aprovados` | `gratuito`, `pago`, `contribuicao` |
| `valor` | evento | `eventos_pendentes`, `eventos_aprovados` | opcional |
| `contato` | evento | `eventos_pendentes`, `eventos_aprovados` | telefone/whatsapp em um campo so |
| `site` | evento | `eventos_pendentes`, `eventos_aprovados` | URL ou rede social |
| `submittedBy` | evento | `eventos_pendentes`, `eventos_aprovados` | dono do envio |
| `submittedByName` | evento | `eventos_pendentes`, `eventos_aprovados` | snapshot do perfil |
| `submittedByEmail` | evento | `eventos_pendentes`, `eventos_aprovados` | snapshot do perfil |
| `status` | evento | `eventos_pendentes`, `eventos_aprovados` | `pendente`, `rejeitado`, `aprovado` |
| `submittedAt` | evento | `eventos_pendentes`, `eventos_aprovados` | timestamp servidor |
| `reviewedAt` | evento | `eventos_pendentes`, `eventos_aprovados` | existe no fluxo atual |
| `reviewedBy` | evento | `eventos_pendentes`, `eventos_aprovados` | uid do revisor |
| `reviewNotes` | evento | `eventos_pendentes`, `eventos_aprovados` | observacao simples |
| `id` | estabelecimento | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | gerado como `est_{timestamp}` |
| `nome` | estabelecimento | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | nome publico |
| `categoria` | estabelecimento | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | texto simples |
| `endereco` | estabelecimento | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | texto livre |
| `descricao` | estabelecimento | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | texto livre |
| `telefone` | estabelecimento | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | obrigatorio |
| `whatsapp` | estabelecimento | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | opcional |
| `site` | estabelecimento | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | hoje mistura site e Instagram |
| `horario` | estabelecimento | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | texto livre |
| `submittedBy` | estabelecimento | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | dono do envio |
| `submittedByName` | estabelecimento | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | snapshot do perfil |
| `submittedByEmail` | estabelecimento | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | snapshot do perfil |
| `status` | estabelecimento | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | `pendente`, `rejeitado`, `aprovado` |
| `submittedAt` | estabelecimento | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | timestamp servidor |
| `reviewedAt` | estabelecimento aprovado/rejeitado | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | incompleto no create atual |
| `reviewedBy` | estabelecimento aprovado/rejeitado | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | incompleto no create atual |
| `reviewNotes` | estabelecimento aprovado/rejeitado | `estabelecimentos_pendentes`, `estabelecimentos_aprovados` | incompleto no create atual |

### Notificacao atual

Nao existe collection de notificacoes implementada hoje.

O que existe:

- mensagens de retorno em tela;
- texto dizendo que o usuario recebera notificacao;
- infraestrutura de `push` preparada no `sw.js`, mas sem fluxo conectado ao portal.

### Cadastro pendente atual

Ja existe como conceito, mas separado por dominio:

- `eventos_pendentes`
- `estabelecimentos_pendentes`

### Perfil, role e admin atual

Ja existe em `usuarios`:

- `role`
- `ativo`
- `tipo`
- `organizacao`

## 5. Modelo de dados proposto

### Recomendacao principal

Para a proxima fase, vale trocar o modelo "pendentes/aprovados em collections separadas" por "uma collection por tipo de submissao com `status`". Isso simplifica:

- listagem por dono;
- auditoria;
- historico;
- solicitacao de ajustes;
- aprovacao sem mover documento;
- integracao futura com Storage;
- sincronizacao com mapa e agenda.

### Establishment submissions

Collection proposta: `establishment_submissions`

Campos:

- `id`
- `ownerUid`
- `ownerEmail`
- `ownerName`
- `status`
- `name`
- `category`
- `address`
- `description`
- `phone`
- `whatsapp`
- `instagram`
- `website`
- `openingHours`
- `images`
- `mainImage`
- `createdAt`
- `updatedAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`
- `source`
- `publishedAt`

Observacoes:

- `status`: recomendar `draft`, `pending`, `changes_requested`, `approved`, `rejected`, `archived`.
- `images`: array de objetos, nao so array de strings.
- `mainImage`: URL/caminho da imagem de capa.
- `source`: ex. `portal_usuario`.
- `publishedAt`: util quando aprovado virar conteudo publico.

Estrutura sugerida para `images`:

- `path`
- `url`
- `fileName`
- `contentType`
- `sizeBytes`
- `position`

### Event submissions

Collection proposta: `event_submissions`

Campos:

- `id`
- `ownerUid`
- `ownerEmail`
- `ownerName`
- `status`
- `title`
- `date`
- `endDate`
- `time`
- `endTime`
- `location`
- `description`
- `organizer`
- `phone`
- `whatsapp`
- `instagram`
- `website`
- `ticketType`
- `ticketPrice`
- `images`
- `mainImage`
- `createdAt`
- `updatedAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`
- `publishedAt`

### Pedido de alteracao de empreendimento existente

Collection proposta: `establishment_update_requests`

Campos:

- `id`
- `establishmentId`
- `ownerUid`
- `ownerEmail`
- `ownerName`
- `requestedChanges`
- `images`
- `status`
- `reviewNotes`
- `createdAt`
- `updatedAt`
- `reviewedAt`
- `reviewedBy`

Observacao:

- `requestedChanges` deve guardar apenas diff sem apagar automaticamente o cadastro publico.

## 6. Upload de imagens ate 6 fotos

### Requisitos propostos

- maximo de 6 imagens por envio;
- formatos aceitos: `jpg`, `jpeg`, `png`, `webp`;
- bloquear `heic`, `dng`, `zip`, `svg`;
- limite de `3 MB` por imagem;
- preview antes do envio;
- remocao individual antes do envio;
- contador visual `0/6 imagens`;
- validacao no cliente antes de enviar;
- nao converter para WebP nesta fase.

### Estrutura de UI sugerida

Sem mudar layout geral, incluir no formulario:

- `<input type="file" multiple accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp">`
- area de preview em grade simples;
- contador `X/6 imagens`;
- mensagem por arquivo recusado;
- botao remover por preview.

### Validacoes obrigatorias no cliente

- total maximo de 6 arquivos;
- extensao e MIME type aceitos;
- tamanho maximo por arquivo;
- impedir duplicatas obvias por nome+tamanho;
- impedir envio se nao houver login;
- impedir envio se upload falhar parcialmente.

### Caminho de Storage recomendado

Estabelecimentos:

- `submissions/establishments/{uid}/{submissionId}/image-01.ext`
- `submissions/establishments/{uid}/{submissionId}/image-02.ext`

Eventos:

- `submissions/events/{uid}/{submissionId}/image-01.ext`
- `submissions/events/{uid}/{submissionId}/image-02.ext`

### Estrategia tecnica recomendada

1. Criar primeiro o documento Firestore com status `pending`.
2. Gerar `submissionId`.
3. Subir imagens para o path desse `submissionId`.
4. Gravar metadados das imagens no proprio documento.
5. Atualizar `mainImage` com a primeira imagem valida ou com a escolhida pelo usuario.

Vantagem:

- evita upload sem vinculo;
- facilita limpeza futura por submissao;
- simplifica Storage rules por UID e path.

### O que nao fazer agora no upload

- nao tentar converter HEIC/DNG no navegador;
- nao usar SVG vindo do usuario;
- nao depender de compressao automatica pesada nesta fase;
- nao salvar apenas base64 em Firestore;
- nao misturar imagens publicas finais com imagens de submissao pendente.

## 7. Fluxo de aprovacao proposto

### Admin

Painel admin futuro deve permitir:

- listar pendentes;
- filtrar por tipo e status;
- abrir detalhes da submissao;
- visualizar imagens;
- aprovar;
- rejeitar;
- solicitar ajustes;
- registrar observacao;
- manter historico de revisao.

### Status recomendados

- `pending`
- `changes_requested`
- `approved`
- `rejected`

### Regras de fluxo

- Nada entra no mapa ou agenda publica antes de `approved`.
- `changes_requested` deve manter o envio visivel ao dono.
- Rejeicao nao deve apagar imagens automaticamente sem politica de retencao definida.
- Aprovacao deve registrar `reviewedAt`, `reviewedBy` e `reviewNotes`.

### Painel atual versus painel futuro

O painel atual ja serve como base, mas ainda e raso:

- hoje aprova/rejeita por linha de tabela;
- nao abre detalhes reais;
- nao enxerga imagens;
- nao trabalha com pedidos de ajuste;
- nao centraliza estabelecimentos aprovados.

## 8. Integracao futura com mapa

### Estado atual do mapa

- O mapa publico hoje depende principalmente de `window.TURISMO_DATA` e arquivos JS estaticos.
- Os cadastros do portal ainda nao alimentam o mapa turistico.

### Opcao A: overlay dinamico em tempo real

Como funcionaria:

- carregar base estatica atual;
- depois consultar Firestore para `establishment_submissions` aprovados;
- normalizar esses dados no cliente;
- mesclar com a lista estatica como camada complementar.

Vantagens:

- sem editar JS estatico a cada aprovacao;
- publicacao mais rapida;
- historico mais simples.

Riscos:

- aumenta dependencia de Firestore no mapa publico;
- exige cuidado de cache, disponibilidade e seguranca;
- pode introduzir variacao de carregamento e inconsistencia de UX.

### Opcao B: rotina administrativa/manual para exportar aprovados

Como funcionaria:

- admin aprova no Firestore;
- depois uma rotina manual ou tela admin exporta os aprovados para um JS/JSON controlado pelo projeto;
- o mapa continua lendo majoritariamente fonte estatica publicada.

Vantagens:

- preserva a arquitetura atual do site;
- menor risco de impacto no mapa publico;
- mais previsivel para hospedagem estatica e cache.

Riscos:

- exige etapa operacional extra;
- publicacao nao e imediata;
- aumenta chance de backlog manual.

### Recomendacao para este projeto

Recomendo **Opcao B primeiro**.

Motivo:

- o projeto atual e majoritariamente estatico;
- o pedido desta fase e conservador;
- o mapa ja tem camada de dados sensivel e nao deve virar dependente de Firestore agora;
- primeiro vale estabilizar submissao, revisao e aprovacao;
- depois, se o fluxo provar volume e necessidade real, avaliar overlay dinamico apenas para aprovados.

## 9. Integracao futura com eventos

Para eventos, a mesma logica vale:

- manter `event_submissions` no Firestore como origem editorial;
- publicar na agenda publica apenas itens `approved`;
- em fase inicial, preferir uma rotina controlada que gere feed estavel para a agenda;
- evitar que `eventos.html` dependa imediatamente de leitura publica ampla do Firestore sem revisar bem seguranca e cache.

## 10. Regras de seguranca necessarias

Cuidados obrigatorios:

- usuario so cria seus proprios cadastros;
- usuario so ve seus proprios envios;
- admin ve todos;
- apenas admin ou moderador aprova;
- Storage rules devem limitar path por UID;
- validar tipo e tamanho no cliente;
- nao confiar apenas no front-end;
- escapar dados ao renderizar;
- evitar HTML bruto nas descricoes;
- nao usar `localStorage` para papel admin;
- revisar Firestore rules e Storage rules antes de producao;
- separar claramente arquivos pendentes de arquivos publicos finais.

### Observacao importante desta rodada

As regras atuais de Firestore ja protegem bem o fluxo atual de pendentes/aprovados, mas **nao ha Storage rules auditadas aqui** porque o upload ainda nao existe.

## 11. Etapas recomendadas de implementacao

### Fase 1

- revisar e fechar modelo final de collections;
- decidir se mantem collections separadas ou migra para `*_submissions`;
- definir politica de status;
- desenhar Storage rules e Firestore rules para o novo modelo.

### Fase 2

- adicionar upload de imagens no formulario de evento;
- adicionar upload de imagens no formulario de estabelecimento;
- salvar submissao com metadados de imagem;
- listar eventos e estabelecimentos do proprio usuario no portal.

### Fase 3

- evoluir `admin-firebase.html` para detalhes completos;
- preview de imagens;
- aprovacao, rejeicao e pedido de ajustes;
- historico minimo de revisao.

### Fase 4

- publicar aprovados em feed controlado para mapa/agenda;
- testar fluxo completo com dados reais;
- definir limpeza/retencao de submissao rejeitada ou substituida.

## 12. Riscos

- crescer em cima do modelo atual de collections separadas pode gerar manutencao ruim;
- conectar mapa diretamente ao Firestore cedo demais aumenta risco operacional;
- upload sem Storage rules revisadas cria risco serio;
- misturar site e Instagram no mesmo campo dificulta validacao futura;
- o portal hoje acompanha apenas eventos, o que pode gerar UX inconsistente quando estabelecimentos comecarem a ter imagens e status detalhado;
- `reviewNotes` hoje existe, mas sem fluxo mais rico de ajustes;
- o painel admin ainda depende fortemente de HTML inline e precisa continuar escapando dados em toda expansao.

## 13. O que nao deve ser feito agora

- nao alterar `firestore.rules` nesta rodada;
- nao alterar CSP;
- nao alterar login/Auth;
- nao alterar mapa turistico;
- nao alterar dados turisticos estaticos;
- nao criar backend;
- nao instalar dependencias;
- nao criar `package.json`;
- nao mudar layout geral;
- nao publicar leitura publica de Storage ou Firestore sem revisar regras;
- nao fazer upload direto para pasta publica do site.

## 14. Recomendacao final

Proxima etapa sugerida:

1. Fechar o modelo alvo com collections unificadas `establishment_submissions` e `event_submissions`.
2. Definir Firestore rules e Storage rules para esse modelo.
3. Implementar primeiro o upload e acompanhamento do proprio usuario.
4. Depois evoluir o painel admin de aprovacao.
5. So por ultimo decidir como aprovados entram no mapa e na agenda publica.
