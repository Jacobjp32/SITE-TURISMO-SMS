# Plano tecnico do Portal de Cadastros

## Status da Fase 1.4 - fila de alteracoes de empreendimento

Implementado nesta rodada:

- `portal-usuario.html` ganhou a acao `Solicitar alteracao` para cada vinculo ativo em `Meus empreendimentos`;
- o formulario usa apenas campos seguros desta fase:
  - descricao
  - telefone
  - WhatsApp
  - Instagram
  - site
  - endereco/localizacao textual
  - horario de funcionamento
  - observacoes adicionais
- o portal registra apenas alteracoes propostas em `establishment_update_requests`;
- o snapshot atual do empreendimento e lido do catalogo `js/establishment-catalog.js`, sem editar dados publicos;
- o historico `Minhas solicitacoes de alteracao` mostra campos pedidos, status, data e retorno da equipe;
- `admin-firebase.html` ganhou a fila `Alteracoes de empreendimentos` dentro de `Aprovacoes`;
- aprovar nao publica automaticamente no mapa nem nos dados estaticos.

Colecao nova desta fase:

- `establishment_update_requests`

Campos operacionais principais:

- `managerId`
- `ownerUid`
- `establishmentId`
- `currentSnapshot`
- `requestedChanges`
- `images`
- `mainImage`
- `imageCount`
- `status`
- `reviewNotes`
- `rejectionReason`
- `changesRequestedNotes`

Limites e decisoes desta fase:

- nao altera `TURISMO_DATA`;
- nao altera mapa turistico;
- nao mexe em login, Auth, App Check ou CSP;
- nao cria backend;
- nao faz autoapply da aprovacao;
- nao permite mudar coordenadas, categoria, slug ou ids sensiveis;
- quando o usuario anexa so imagens, `requestedChanges` pode ficar vazio e a solicitacao continua valida.

## Status da Fase 1.3 - gestao administrativa de vinculos

Implementado nesta rodada:

- `admin-firebase.html` ganhou a secao separada `Gerenciar Vínculos`;
- o admin pode listar `establishment_managers` sem depender de `Gerenciar Usuários`;
- o admin pode adicionar vinculo manual usando `usuarios` + catalogo de empreendimentos;
- o admin pode editar funcao, status, observacao e corrigir o empreendimento vinculado;
- o admin pode desativar e reativar vinculos sem apagar o documento por padrao;
- `Gerenciar Usuários` agora explica que permissao global nao substitui vinculo de empreendimento.

Mantido fora desta fase:

- nenhuma edicao publica de empreendimento;
- nenhuma publicacao automatica no mapa;
- nenhum CMS de noticias;
- nenhuma galeria administrativa.

## Status da Fase 1.2 - eventos vinculados ao empreendimento

Implementado nesta rodada:

- `Meus empreendimentos` agora oferece a acao `Cadastrar evento vinculado`;
- o portal reaproveita o mesmo modal de evento, mas mostra aviso visual quando o envio esta vinculado a um empreendimento gerenciado;
- antes do envio final, o portal consulta `establishment_managers` para validar que o vinculo continua ativo;
- o evento vinculado entra em `eventos_pendentes` com:
  - `source = establishment_manager`
  - `linkedManagerId`
  - `linkedEstablishmentId`
  - `linkedEstablishmentName`
  - `linkedEstablishmentRole`
- o evento comum continua usando `source = portal_usuario`;
- a aprovacao admin continua preservando `doc.data()`, entao os campos de vinculo seguem para `eventos_aprovados`.

Mantido fora desta fase:

- nenhuma publicacao automatica na agenda publica;
- nenhuma alteracao do mapa turistico;
- nenhuma edicao direta de empreendimento;
- nenhuma migracao de collections.

## Status da Fase 1.1 - vinculo com empreendimento existente

Implementado nesta rodada:

- secao `Solicitar vinculo com empreendimento` no `portal-usuario.html`;
- lista de empreendimentos existentes montada por leitura de fontes publicas ja aprovadas, sem tocar em `TURISMO_DATA`;
- historico `Minhas solicitacoes de vinculo`;
- area `Meus empreendimentos` apenas para leitura;
- secao admin `Solicitacoes de vinculo` em `admin-firebase.html`;
- collections novas:
  - `establishment_claims`
  - `establishment_managers`
- verificacao de duplicidade por usuario + empreendimento antes do create e antes da aprovacao.

Mantido fora desta fase:

- nenhuma edicao publica do empreendimento;
- nenhuma integracao com o mapa turistico;
- nenhuma migracao de collections existentes;
- nenhum ajuste de login/Auth/App Check;
- nenhuma mudanca em `storage.rules`.

Documento detalhado:

- `docs/plano-vinculo-empreendimentos.md`

## Status da Fase 1

Implementado nesta rodada:

- upload de ate 6 imagens em `portal-usuario.html` para eventos e estabelecimentos;
- preview local com remocao antes do envio;
- validacao cliente para `jpg`, `jpeg`, `png` e `webp`;
- bloqueio cliente de arquivos acima de `5 MB`;
- upload para Firebase Storage antes da gravacao nas collections pendentes;
- gravacao de `images`, `mainImage`, `imageCount`, `ownerUid`, `ownerEmail`, `ownerName`, `createdAt`, `updatedAt`, `submittedAt` e `source`;
- preservacao dos campos de imagem na aprovacao atual, porque o admin continua copiando `doc.data()` para as collections aprovadas.

Fora desta fase:

- nada e publicado automaticamente no mapa turistico;
- nada e publicado automaticamente na agenda publica;
- o admin nao ganhou galeria visual completa;
- as rules reais do Firebase ainda precisam ser publicadas manualmente no Console.

## 1. Estado atual confirmado

Arquivos revisados nesta rodada:

- `docs/plano-portal-cadastros.md`
- `firestore.rules`
- `config.js`
- `js/firebase-auth.js`
- `admin-firebase.html`
- `portal-usuario.html`
- `docs/auditoria-seguranca.md`

Confirmacoes do estado atual:

- O portal grava eventos em `eventos_pendentes`.
- O portal grava estabelecimentos em `estabelecimentos_pendentes`.
- O admin aprova eventos para `eventos_aprovados`.
- O admin aprova estabelecimentos para `estabelecimentos_aprovados`.
- O papel administrativo vem de `usuarios/{uid}.role`.
- A UI admin exige `role === 'admin'`, mas as regras reais aceitam `admin` e `moderator` nas acoes moderadas.
- `storageBucket` esta configurado em `config.js`.
- A Fase 1 agora permite upload de imagem no portal.
- O portal agora usa Firebase Storage para anexos de cadastros pendentes.
- Existe arquivo `storage.rules` local no repositorio.
- As Storage Rules reais ainda nao foram publicadas.

## 2. Collections atuais e impacto real

Collections hoje em uso para o portal:

- `usuarios`
- `eventos_pendentes`
- `eventos_aprovados`
- `estabelecimentos_pendentes`
- `estabelecimentos_aprovados`

Fluxo atual:

1. Usuario autenticado envia.
2. Se houver imagens, o portal envia primeiro para o Storage.
3. Documento entra em collection de pendentes.
4. Admin/moderador aprova copiando o documento para collection de aprovados.
5. O documento pendente aprovado e apagado.
6. Rejeicao hoje apenas atualiza `status = 'rejeitado'` no pendente.

Paths usados na Fase 1:

- `submissions/events/{uid}/{submissionId}/image-01.ext`
- `submissions/establishments/{uid}/{submissionId}/image-01.ext`

Consequencias do modelo atual:

- funciona para o fluxo basico existente;
- aumenta duplicacao de logica entre pendente e aprovado;
- complica historico;
- complica pedido de ajustes;
- complica upload de imagens se os arquivos dependerem do documento final;
- complica listagem consolidada por usuario;
- obriga o admin a pensar em "mover/copiar" em vez de "mudar status".

## 3. Estado atual das Firestore Rules

As `firestore.rules` atuais sao conservadoras e coerentes com o fluxo existente:

- `usuarios/{userId}`:
  - leitura pelo proprio usuario ou admin;
  - criacao pelo proprio usuario ou admin;
  - update restrito a poucos campos se for o proprio usuario;
  - delete apenas admin.
- `eventos_pendentes/{eventId}`:
  - leitura por moderador/admin ou dono (`submittedBy`);
  - create autenticado com `submittedBy == request.auth.uid` e `status == 'pendente'`;
  - update/delete apenas moderador/admin.
- `estabelecimentos_pendentes/{estId}`:
  - mesmo desenho de `eventos_pendentes`.
- `eventos_aprovados/{eventId}`:
  - leitura publica;
  - write apenas moderador/admin.
- `estabelecimentos_aprovados/{estId}`:
  - leitura publica;
  - write apenas moderador/admin.

O que as rules atuais **nao** suportam para a fase futura:

- dono editar submissao propria em `pendente`;
- dono editar submissao propria em `changes_requested`;
- campos novos como `ownerUid`, `ownerEmail`, `ownerName`, `images`, `mainImage`, `updatedAt`, `rejectionReason`, `source`;
- collections unificadas;
- requests de alteracao de empreendimento existente;
- qualquer fluxo de Firebase Storage.

## 4. Como roles/admin sao tratados hoje

Estado atual:

- Perfil fica em `usuarios/{uid}`.
- `role` pode ser `user`, `moderator` ou `admin`.
- `ativo != false` participa da autorizacao real nas rules.
- `FirebaseSystem.isModerator()` aceita `admin` ou `moderator`.
- `admin-firebase.html` usa `role === 'admin'` na UI de entrada do painel.

Observacao importante:

- Hoje existe pequena assimetria entre UI e rules: a UI restringe o painel a `admin`, enquanto as rules aceitam `moderator` para acoes moderadas. Isso nao quebra seguranca, mas precisa ser lembrado quando o painel for evoluido.
- Vinculo com empreendimento nao usa `usuarios.role`; ele depende de `establishment_managers`, inclusive para liberar eventos vinculados.

## 5. Existe Storage Rules hoje?

Sim, como rascunho local versionado.

Confirmado nesta rodada:

- existe `storage.rules` no repositorio;
- nao existe `firebase.storage.rules`;
- o portal ja usa SDK de Storage no fluxo de envio;
- existe apenas `storageBucket` configurado em `config.js`.

Conclusao:

- o projeto agora tem fluxo de upload e proposta versionada de rules;
- as Storage Rules reais ainda precisam ser revisadas e publicadas fora do repositorio antes de producao.

## 6. Decisao de arquitetura

### Opcao A: manter collections atuais

Collections:

- `eventos_pendentes`
- `eventos_aprovados`
- `estabelecimentos_pendentes`
- `estabelecimentos_aprovados`

Vantagens:

- menor risco imediato;
- menor diff na fase 1;
- encaixa melhor no codigo atual;
- acelera a entrega do primeiro upload com aprovacao;
- evita retrabalho cedo no admin e no portal.

Desvantagens:

- modelo menos limpo;
- duplicacao estrutural;
- historico ruim;
- pedido de ajustes menos natural;
- migracao futura continua necessaria se o fluxo crescer.

### Opcao B: migrar agora para collections unificadas

Collections:

- `event_submissions`
- `establishment_submissions`
- `establishment_update_requests`

Vantagens:

- modelo mais limpo e escalavel;
- status centralizado;
- melhor para historico e auditoria;
- melhor para `changes_requested`;
- melhor para upload e metadados de imagem;
- melhor para futura integracao com mapa e agenda.

Desvantagens:

- maior impacto no codigo atual;
- maior risco de quebrar fluxo existente;
- exige mexer simultaneamente em portal, admin, regras e acompanhamento do usuario;
- torna a primeira entrega mais pesada.

### Recomendacao final

Recomendo **arquitetura incremental com Opcao A primeiro e Opcao B planejada como fase de maturacao**.

Decisao pratica desta rodada:

- **Fase 1 a Fase 4**: manter collections atuais para reduzir risco.
- **Fase 5**: migrar para collections unificadas se o fluxo provar valor e volume.

Motivo:

- respeita o estado real do projeto;
- reduz chance de quebrar o portal atual;
- permite introduzir upload e aprovacao visual com mudanca cirurgica;
- adia a migracao estrutural para um momento com menos incerteza.

## 7. Modelo de dados recomendado

Mesmo mantendo collections atuais no curto prazo, o modelo de campos ja deve nascer alinhado ao modelo final.

### Evento

Collection alvo curta: `eventos_pendentes`

Collection alvo longa: `event_submissions`

Campos recomendados:

- `id`
- `ownerUid`
- `ownerEmail`
- `ownerName`
- `status`
- `title`
- `date`
- `time`
- `location`
- `description`
- `organizer`
- `phone`
- `whatsapp`
- `instagram`
- `website`
- `images`
- `mainImage`
- `createdAt`
- `updatedAt`
- `submittedAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`
- `rejectionReason`
- `source`

Compatibilidade com o modelo atual:

- `submittedBy` pode coexistir temporariamente com `ownerUid`;
- `nome` pode coexistir temporariamente com `title`;
- `local` pode coexistir temporariamente com `location`;
- `site` pode coexistir temporariamente com `website` ou `instagram`.
- `images`, `mainImage` e `imageCount` ja podem coexistir no fluxo atual sem quebrar aprovacao.

### Estabelecimento

Collection alvo curta: `estabelecimentos_pendentes`

Collection alvo longa: `establishment_submissions`

Campos recomendados:

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
- `submittedAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`
- `rejectionReason`
- `source`

Compatibilidade com o modelo atual:

- `submittedBy` pode coexistir temporariamente com `ownerUid`;
- `nome` pode coexistir temporariamente com `name`;
- `endereco` pode coexistir temporariamente com `address`;
- `horario` pode coexistir temporariamente com `openingHours`;
- `site` pode coexistir temporariamente com `website` e `instagram`.
- `images`, `mainImage` e `imageCount` ja podem coexistir no fluxo atual sem quebrar aprovacao.

### Pedido de alteracao futura

Collection recomendada:

- `establishment_update_requests`

Campos:

- `id`
- `establishmentId`
- `ownerUid`
- `ownerEmail`
- `status`
- `requestedChanges`
- `images`
- `mainImage`
- `createdAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`

## 8. Estrutura recomendada para images

Recomendacao:

- `images` deve ser array de objetos, nao array simples de strings.

Cada item:

- `path`
- `url`
- `fileName`
- `contentType`
- `sizeBytes`
- `position`
- `uploadedAt`

Campo `mainImage`:

- apontar para o item de capa escolhido;
- pode ser a URL publica controlada ou o path canônico do Storage, conforme a fase.

## 9. Firestore Rules propostas

As regras abaixo sao **proposta documental**, nao devem ser aplicadas automaticamente nesta rodada.

### Requisitos

- usuario autenticado cria cadastro proprio;
- usuario autenticado le apenas cadastros proprios;
- usuario autenticado edita apenas cadastro proprio com `status in ['pendente', 'changes_requested']`;
- usuario nao aprova nem rejeita;
- admin le todos;
- admin/moderador revisa todos;
- ninguem nao autenticado escreve;
- leitura publica apenas para collections aprovadas quando isso fizer sentido.

### Proposta de comportamento

#### Se a fase 1 mantiver collections atuais

- `eventos_pendentes`
  - `create`: owner somente;
  - `read`: owner ou moderador/admin;
  - `update`: owner somente se `status` atual for `pendente` ou `changes_requested`, com lista de campos permitidos;
  - `update`: moderador/admin para revisar;
  - `delete`: evitar delete do owner; moderador/admin apenas se houver politica clara.
- `estabelecimentos_pendentes`
  - mesmo desenho.
- `eventos_aprovados`
  - leitura publica se continuar sendo fonte publica;
  - write apenas moderador/admin.
- `estabelecimentos_aprovados`
  - leitura publica se continuar sendo fonte publica;
  - write apenas moderador/admin.

#### Se houver migracao futura para collections unificadas

- `event_submissions`
  - owner cria;
  - owner le os seus;
  - owner atualiza somente status `pendente` ou `changes_requested`;
  - moderador/admin le todos e revisa;
  - publico nao le bruto.
- `establishment_submissions`
  - mesmo desenho.
- `establishment_update_requests`
  - owner cria e le os seus;
  - owner atualiza somente antes de revisao ou quando `changes_requested`;
  - moderador/admin le todos e revisa.

### Regras de validacao recomendadas

- obrigar `ownerUid == request.auth.uid`;
- bloquear troca arbitraria de `ownerUid`, `ownerEmail`, `ownerName`;
- bloquear mudanca de `status` pelo owner;
- limitar `status` a conjunto conhecido;
- limitar chaves permitidas;
- exigir `submittedAt` no create;
- exigir `updatedAt` no update;
- exigir `reviewedAt`, `reviewedBy`, `reviewNotes` apenas para moderador/admin;
- bloquear arrays e mapas fora do schema esperado quando possivel.

## 10. Storage Rules propostas

Existe `storage.rules` no repositorio como rascunho local. Ele ainda precisa de revisao humana e publicacao manual no Firebase.

### Paths recomendados

Estabelecimentos:

- `submissions/establishments/{uid}/{submissionId}/{fileName}`

Eventos:

- `submissions/events/{uid}/{submissionId}/{fileName}`

### Regras desejadas

- usuario autenticado so envia para o proprio `{uid}`;
- usuario autenticado so le os proprios arquivos pendentes;
- admin pode ler todos;
- publico nao lista arquivos brutos pendentes;
- tipos aceitos:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- bloquear:
  - `image/svg+xml`
  - `image/heic`
  - `application/zip`
  - formatos de camera brutos como `dng`
- limite recomendado:
  - `5 * 1024 * 1024` bytes por arquivo.

### Observacao importante

O limite de **6 imagens por submissao** deve ser tratado no app e reforcado por validacao de submissao no Firestore. Storage Rules sozinhas nao contam facilmente quantidade de arquivos por pasta com seguranca suficiente para esse caso.

### Destino futuro das imagens aprovadas

Decisao ainda em aberto, mas a recomendacao e uma destas:

- manter o mesmo arquivo e apenas referencia-lo quando aprovado;
- ou copiar para area/prefixo publico controlado em fase posterior.

Nao decidir isso agora evita acoplamento prematuro.

## 11. Plano incremental recomendado

### Fase 1

- adicionar upload de imagens no portal para cadastros pendentes;
- manter collections atuais;
- gravar metadados no Firestore;
- introduzir Storage rules e ajuste controlado das Firestore rules.

### Fase 2

- permitir que o admin visualize imagens;
- aprovar, rejeitar ou solicitar ajustes;
- registrar observacao estruturada.

### Fase 3

- publicar aprovados em area publica dinamica ou export controlado;
- manter aprovados fora do mapa/agenda ate status final.

### Fase 4

- criar fluxo de pedido de alteracao de empreendimento existente;
- introduzir `establishment_update_requests`.

### Fase 5

- reavaliar migracao para `event_submissions` e `establishment_submissions`;
- executar migracao apenas se a complexidade operacional justificar.

## 12. Riscos

- mudar tudo para collections unificadas cedo demais pode quebrar o fluxo atual;
- manter collections separadas para sempre tende a acumular divida tecnica;
- upload sem rules de Storage revisadas cria superficie nova de risco;
- o painel admin atual ainda nao suporta detalhes ricos;
- owner editando submissao apos envio exige rules mais precisas do que as atuais;
- misturar campos legados e novos sem plano de compatibilidade pode confundir o admin.

## 13. Validacoes humanas obrigatorias antes de publicar rules

- confirmar se `moderator` deve continuar com poder de aprovacao ou se isso sera apenas `admin`;
- decidir se leitura publica continuara em collections aprovadas ou via export controlado;
- decidir estrategia de URL final das imagens aprovadas;
- decidir politica de retencao para arquivos rejeitados;
- revisar se o painel admin deve aceitar `changes_requested` na UI;
- revisar se os campos legados serao mantidos em paralelo por uma fase.

## 14. O que nao deve ser implementado ainda

- nao publicar `firestore.rules` automaticamente;
- nao criar `storage.rules` definitivas sem revisao humana;
- nao implementar upload agora;
- nao mexer em `portal-usuario.html` nesta rodada;
- nao mexer em `admin-firebase.html` nesta rodada;
- nao mexer em login/Auth;
- nao mexer em CSP;
- nao mexer no mapa turistico;
- nao mover dados estaticos publicos para Firestore agora;
- nao abrir leitura publica ampla de arquivos pendentes.

## 15. Proxima etapa recomendada

Proxima etapa:

1. Revisar e aprovar o documento de rules proposto.
2. Definir se a fase 1 vai mesmo manter collections atuais.
3. Implementar upload de imagens em cadastros pendentes com risco minimo.
4. So depois evoluir o painel admin para preview e revisao completa.

## 16. Vinculo entre usuario logado e empreendimento existente

Escopo desta secao:

- planejamento tecnico apenas;
- sem alterar login, Auth, App Check, CSP, backend ou rules reais nesta rodada;
- sem liberar edicao publica direta do mapa;
- sem migrar collections atuais.

Objetivo funcional futuro:

- permitir que um usuario autenticado e aprovado seja vinculado a um empreendimento ja existente, como `Marina Barra do Iguacu`;
- permitir que esse usuario envie pedidos de atualizacao do proprio empreendimento;
- permitir que esse usuario cadastre eventos vinculados ao empreendimento;
- manter tudo sob moderacao antes de qualquer reflexo publico.

Principios de seguranca e operacao:

- o mapa turistico continua lendo apenas dados publicos aprovados;
- nenhum usuario comum edita diretamente `js/rotas-data.js`, `TURISMO_DATA` ou collections publicas aprovadas;
- todo pedido entra como pendente;
- o vinculo usuario ↔ empreendimento precisa ser aprovado por admin/moderador;
- um empreendimento pode ter mais de um usuario vinculado, com papeis diferentes, se isso fizer sentido operacional.

Modelo incremental recomendado:

### Fase A - vinculo administrativo

Criar colecao futura de vinculos aprovados, sem substituir o fluxo atual:

- `establishment_user_links`

Campos recomendados:

- `id`
- `establishmentId`
- `establishmentSlug`
- `establishmentName`
- `userUid`
- `userEmail`
- `userName`
- `role`
- `status`
- `createdAt`
- `updatedAt`
- `approvedAt`
- `approvedBy`
- `notes`

Valores recomendados:

- `role`: `owner`, `manager`, `editor`
- `status`: `pending`, `approved`, `revoked`

Regra operacional:

- o usuario nao cria o vinculo final sozinho;
- o usuario pode no maximo solicitar vinculacao;
- admin/moderador aprova ou rejeita;
- somente vinculos `approved` habilitam pedidos de alteracao e cadastro de eventos vinculados.

### Fase B - solicitacao de vinculo

Criar colecao futura para pedido inicial:

- `establishment_link_requests`

Campos recomendados:

- `id`
- `establishmentId`
- `userUid`
- `userEmail`
- `userName`
- `message`
- `status`
- `createdAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`

Fluxo recomendado:

1. Usuario autenticado escolhe um empreendimento existente.
2. Envia pedido de vinculacao com mensagem curta e dados de contato.
3. Admin/moderador revisa evidencias fora do sistema se necessario.
4. Se aprovado, cria `establishment_user_links`.
5. O pedido original permanece como historico.

### Fase C - pedido de atualizacao do empreendimento existente

Reaproveitar a ideia ja prevista de pedidos de alteracao, mas agora exigindo vinculo aprovado:

- `establishment_update_requests`

Campos minimos adicionais ao plano atual:

- `establishmentId`
- `linkedUserUid`
- `linkRole`
- `changedFields`
- `proposedData`
- `images`
- `mainImage`
- `status`
- `createdAt`
- `updatedAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`

Comportamento recomendado:

- o pedido referencia o empreendimento aprovado existente, nao cria um novo duplicado;
- `changedFields` lista exatamente o que mudou;
- `proposedData` guarda apenas os campos editaveis do formulario;
- aprovacao humana aplica o patch no registro publico final;
- rejeicao ou `changes_requested` devolve observacoes ao usuario sem tocar no mapa publico.

Campos publicos editaveis sugeridos:

- descricao
- telefone
- whatsapp
- instagram
- website
- horario
- imagens
- imagem principal

Campos que devem continuar bloqueados para edicao direta do vinculado:

- `id`
- slug
- categoria estrutural
- coordenadas
- rota principal
- flags internas
- qualquer campo de aprovacao/moderacao

### Fase D - eventos vinculados ao empreendimento

Implementado de forma incremental, sem backend novo e sem nova collection de eventos.

Colecao mantida:

- `eventos_pendentes`

Campos usados nesta fase:

- `linkedEstablishmentId`
- `linkedEstablishmentName`
- `linkedEstablishmentRole`
- `linkedManagerId`
- `source`

Regras funcionais:

- se `source = establishment_manager`, o usuario precisa ter vinculo ativo com o empreendimento;
- o evento continua pendente de moderacao antes de entrar em qualquer agenda publica;
- o empreendimento vinculado aparece apenas como referencia operacional, nao como autorizacao de auto-publicacao.

### Fase E - painel do usuario

Capacidades futuras do `portal-usuario.html`:

- listar vinculos aprovados do usuario;
- listar pedidos de vinculacao pendentes;
- abrir formulario de atualizacao apenas para empreendimentos vinculados;
- mostrar status de revisao: `pendente`, `changes_requested`, `approved`, `rejected`.

Estado atual:

- `Meus empreendimentos` ja lista vinculos aprovados do usuario;
- o portal ja abre o formulario de evento com o empreendimento selecionado quando o usuario escolhe `Cadastrar evento vinculado`;
- o cadastro comum de evento continua disponivel em paralelo.

Consulta recomendada no cliente:

- carregar primeiro o usuario autenticado atual;
- buscar apenas vinculos onde `userUid == currentUser.uid`;
- liberar acoes somente quando houver pelo menos um vinculo `approved`.

### Fase F - rules futuras

Quando esta funcionalidade for implementada de verdade, as rules reais precisarao validar:

- autenticacao obrigatoria;
- vinculo aprovado entre `request.auth.uid` e `establishmentId`;
- bloqueio de update direto em collections publicas aprovadas;
- criacao/update apenas em collections de pedidos pendentes;
- bloqueio de troca manual de `linkedUserUid`, `establishmentId`, `status`, `reviewedBy` e campos de moderacao.

### Exemplo aplicado: Marina Barra do Iguacu

Fluxo desejado:

1. Usuario faz login normalmente no portal atual.
2. Solicita vinculacao com `Marina Barra do Iguacu`.
3. Admin confirma a legitimidade e aprova o vinculo.
4. O usuario passa a poder:
   - enviar pedido para atualizar descricao, telefone, horario, Instagram e imagens da Marina;
   - cadastrar um evento vinculado a `Marina Barra do Iguacu`.
5. Nada entra no mapa ou na agenda publica sem aprovacao posterior.

### Riscos se implementar errado

- permitir escrita direta no registro publico do empreendimento;
- usar apenas email como prova de posse sem aprovacao humana;
- misturar pedido de novo empreendimento com pedido de alteracao de empreendimento existente;
- deixar evento vinculado publicar automaticamente no calendario publico;
- permitir que vinculado altere coordenadas, categoria ou slug sem moderacao.

### Recomendacao final

Para a futura implementacao, o caminho de menor risco e:

1. criar primeiro o vinculo aprovado `usuario ↔ empreendimento`;
2. depois liberar pedido de alteracao do empreendimento existente;
3. por ultimo liberar cadastro de evento vinculado ao empreendimento.

Isso preserva o login atual, evita mexer no mapa publico e reduz o risco de quebrar o fluxo existente.
