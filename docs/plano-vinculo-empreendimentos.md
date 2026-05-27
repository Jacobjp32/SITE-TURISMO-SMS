# Plano de vinculo entre usuario e empreendimento

## Objetivo desta fase

Implementar o primeiro fluxo funcional de vinculo entre usuario autenticado e empreendimento turistico ja existente no site, sem editar dados publicos do mapa e sem mexer nas collections ja usadas para cadastros pendentes.

Escopo entregue:

- usuario logado pode solicitar vinculo com empreendimento existente;
- admin pode listar, aprovar ou rejeitar a solicitacao;
- usuario passa a ver solicitacoes e vinculos aprovados no portal;
- vinculo aprovado aparece em `Meus empreendimentos` apenas como leitura.

## Atualizacao - gestao administrativa de vinculos

Escopo entregue nesta rodada:

- nova secao `Gerenciar Vínculos` no `admin-firebase.html`, separada de `Gerenciar Usuários`;
- listagem completa da collection `establishment_managers`;
- criacao manual de vinculo para usuario existente + empreendimento existente;
- edicao de funcao, status, observacoes e correcao de empreendimento;
- desativacao e reativacao sem apagar historico;
- aviso explicito de que `usuarios.role` e permissao global, nao acesso a empreendimento.

## Diferenca entre role global e vinculo de empreendimento

- `usuarios.role = user` continua sendo o padrao para turista, empreendedor e usuario comum;
- `usuarios.role = moderator` e moderacao global do sistema;
- `usuarios.role = admin` e administracao global do sistema;
- acesso a empreendimento especifico nao vem de `usuarios.role`, e sim de `establishment_managers`.

Exemplo pratico:

- um empreendedor pode continuar com `role = user` e mesmo assim gerenciar eventos vinculados se tiver um documento ativo em `establishment_managers`.

## Como adicionar vinculo manualmente

1. O admin entra em `Gerenciar Vínculos`.
2. Clica em `Adicionar vínculo`.
3. Seleciona um usuario existente da collection `usuarios`.
4. Seleciona um empreendimento existente do catalogo `js/establishment-catalog.js`.
5. Escolhe a funcao:
   - `owner`
   - `manager`
   - `representative`
6. Define se o vinculo ja nasce ativo e pode registrar observacao administrativa.
7. O painel grava em `establishment_managers` sem alterar `usuarios.role`.

## Como editar, desativar e reativar

- `Editar` permite ajustar funcao, observacao, status e corrigir o empreendimento vinculado.
- Se o empreendimento mudar, o admin cria o novo documento tecnico do manager e marca o registro antigo como substituido, evitando perder rastreabilidade.
- `Desativar` marca `active = false` e registra `revokedAt`, `revokedBy` e `revokeReason`.
- `Reativar` volta o documento para `active = true` sem criar duplicidade.

## Como corrigir empreendimento escolhido errado

Se o usuario foi vinculado ao empreendimento errado:

1. abrir o registro em `Gerenciar Vínculos`;
2. trocar o empreendimento no modal de edicao;
3. salvar a correcao;
4. o admin mantem o registro antigo como inativo/substituido e passa a usar o novo alvo correto.

Se o erro foi no usuario escolhido, o caminho recomendado continua sendo:

1. desativar o vinculo incorreto;
2. criar um novo vinculo manual para o usuario certo.

## Atualizacao - eventos vinculados ao empreendimento

Escopo entregue nesta fase:

- usuario com vinculo ativo em `establishment_managers` pode abrir o mesmo formulario de evento como `evento vinculado`;
- o portal mostra a acao `Cadastrar evento vinculado` em cada item de `Meus empreendimentos`;
- o envio continua indo para `eventos_pendentes`;
- o admin continua aprovando manualmente antes de qualquer publicacao;
- os campos de vinculo sao preservados em `eventos_aprovados` porque a aprovacao continua copiando `doc.data()`.

## Como funciona o evento vinculado

1. O usuario entra no portal normalmente.
2. Em `Meus empreendimentos`, escolhe `Cadastrar evento vinculado`.
3. O formulario de evento abre com aviso visual do empreendimento vinculado.
4. Antes do upload/gravação final, o portal consulta `establishment_managers` para validar se o vinculo ainda esta ativo.
5. O evento e salvo em `eventos_pendentes` com `source = establishment_manager`.
6. O admin visualiza esse contexto no painel e decide aprovar ou rejeitar.

O cadastro comum de evento continua existindo e usa `source = portal_usuario`.

## Campos usados em evento vinculado

Novos campos operacionais adicionados ao payload de `eventos_pendentes`:

- `source`
- `linkedManagerId`
- `linkedEstablishmentId`
- `linkedEstablishmentName`
- `linkedEstablishmentRole`

Campos preservados do fluxo existente:

- `ownerUid`
- `ownerEmail`
- `ownerName`
- `images`
- `mainImage`
- `imageCount`
- `createdAt`
- `updatedAt`
- `submittedAt`

## Como o admin identifica evento vinculado

Na lista de eventos pendentes do `admin-firebase.html`, o painel agora mostra:

- selo textual `Evento vinculado a empreendimento`;
- `linkedEstablishmentName`;
- `source`;
- `ownerName` e `ownerEmail`.

## Rules locais desta fase

O arquivo `firestore.rules` agora diferencia:

- evento comum:
  - `source = portal_usuario`
  - campos `linked*` nulos
- evento vinculado:
  - `source = establishment_manager`
  - `linkedManagerId` aponta para um documento real em `establishment_managers`
  - o manager precisa estar `active == true`
  - `userId`, `establishmentId`, `establishmentName` e `role` precisam bater com o documento do manager

Nada foi publicado automaticamente no Firebase.

Fora desta fase:

- edicao publica do empreendimento;
- publicacao automatica no mapa turistico;
- migracao de collections legadas;
- alteracao de `TURISMO_DATA`;
- alteracao de CSP, login, Auth, App Check ou regras publicadas no Console.

## Fonte da lista de empreendimentos

Decisao adotada:

- usar um catalogo enxuto em `js/establishment-catalog.js`;
- ler apenas `js/data/restaurantes.js`, `js/data/hospedagens.js` e `js/rotas-data.js`;
- deduplicar por nome normalizado;
- priorizar `restaurantes` e `hospedagens` quando o mesmo empreendimento existe em mais de uma fonte;
- excluir explicitamente `Morangos da Mary`;
- expor somente metadados necessarios para o portal:
  - `establishmentId`
  - `establishmentName`
  - `category`
  - `source`
  - `originalId`

Motivo:

- evita carregar o snapshot turistico completo no portal;
- reduz acoplamento com o mapa;
- mantem a lista sob leitura apenas, sem tocar nos datasets publicos.

## Collections novas

### `establishment_claims`

Solicitacoes criadas pelo usuario no portal.

Campos usados nesta fase:

- `id`
- `userId`
- `userEmail`
- `userName`
- `contactPhone`
- `establishmentId`
- `establishmentName`
- `establishmentCategory`
- `establishmentSource`
- `establishmentOriginalId`
- `requestedRole`
- `status`
- `message`
- `createdAt`
- `updatedAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`
- `rejectionReason`
- `source`

Status validos:

- `pending`
- `approved`
- `rejected`

### `establishment_managers`

Vinculos aprovados para leitura no portal.

Campos usados nesta fase:

- `userId`
- `userEmail`
- `userName`
- `establishmentId`
- `establishmentName`
- `role`
- `active`
- `approvedAt`
- `approvedBy`
- `claimId`
- `notes`
- `updatedAt`
- `updatedBy`
- `revokedAt`
- `revokedBy`
- `revokeReason`
- `replacedBy`

## Fluxo do usuario

1. Faz login normalmente no `portal-usuario.html`.
2. Escolhe um empreendimento da lista publica existente.
3. Seleciona o tipo de vinculo:
   - `proprietario`
   - `gerente_responsavel`
   - `representante_autorizado`
4. Envia mensagem curta e, se quiser, um telefone adicional.
5. O portal grava a solicitacao em `establishment_claims` com `status = pending`.
6. O usuario acompanha a solicitacao em `Minhas solicitacoes de vinculo`.
7. Se aprovado, passa a ver o item em `Meus empreendimentos`.

## Fluxo do admin

1. Entra no `admin-firebase.html` com conta administrativa.
2. Abre a secao `Solicitacoes de vinculo`.
3. Ve usuario, e-mail, contato, empreendimento, tipo de vinculo e mensagem.
4. Pode registrar:
   - observacao interna;
   - motivo da rejeicao.
5. Ao aprovar:
   - atualiza o claim para `approved`;
   - grava `reviewedAt`, `reviewedBy` e `reviewNotes`;
   - cria ou reativa o documento em `establishment_managers`.
6. Ao rejeitar:
   - atualiza o claim para `rejected`;
   - grava `reviewedAt`, `reviewedBy`, `reviewNotes` e `rejectionReason`.

Historico:

- claims nao sao apagados;
- o portal mostra pendente, aprovado e rejeitado;
- o admin nao duplica vinculo ativo para o mesmo `userId + establishmentId`.

## Regras de duplicidade

No portal e no nucleo Firebase:

- se o usuario ja tem claim `pending` para o mesmo empreendimento, o envio e bloqueado;
- se ja existe claim `approved` para o mesmo empreendimento, o envio e bloqueado;
- se ja existe vinculo ativo em `establishment_managers`, o envio e bloqueado.

Na aprovacao admin:

- antes de criar o manager, a rotina verifica se ja existe vinculo ativo para o mesmo usuario e empreendimento;
- se ja existir, a aprovacao e interrompida e o historico do claim e preservado.

## Regras locais propostas

Arquivo ajustado:

- `firestore.rules`

Politica desejada nesta fase:

- usuario autenticado cria apenas o proprio claim com `status = pending`;
- usuario le apenas os proprios claims;
- usuario nao cria nem edita `establishment_managers`;
- admin/moderator le todos os claims;
- admin/moderator aprova e rejeita claims;
- usuario le apenas os proprios managers ativos;
- admin/moderator le e escreve managers.

## Passo manual necessario

Nada foi publicado automaticamente no Firebase.

Antes de usar em ambiente real:

1. revisar `firestore.rules`;
2. publicar a nova versao no projeto Firebase correto;
3. testar com:
   - um usuario comum;
   - uma conta admin;
   - uma solicitacao aprovada;
   - uma solicitacao rejeitada.

## Limitacoes restantes

- `Meus empreendimentos` e apenas leitura;
- o evento vinculado ainda usa o mesmo formulario do evento comum; nao existe painel detalhado separado por empreendimento;
- o painel admin continua exigindo `role === admin` na UI, embora as rules locais aceitem `admin` e `moderator` para moderacao;
- o admin ainda nao possui CMS de noticias ou galeria administrativa;
- nao ha workflow de edicao de dados publicos;
- nao ha sincronizacao com o mapa publico.
- nao existe selo publico na agenda para indicar que um evento aprovado veio de empreendimento vinculado;
- nao existe publicacao dinamica no mapa nem painel avancado de operacao por empreendimento.
