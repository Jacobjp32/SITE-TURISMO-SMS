# Plano de vinculo entre usuario e empreendimento

## Objetivo desta fase

Implementar o primeiro fluxo funcional de vinculo entre usuario autenticado e empreendimento turistico ja existente no site, sem editar dados publicos do mapa e sem mexer nas collections ja usadas para cadastros pendentes.

Escopo entregue:

- usuario logado pode solicitar vinculo com empreendimento existente;
- admin pode listar, aprovar ou rejeitar a solicitacao;
- usuario passa a ver solicitacoes e vinculos aprovados no portal;
- vinculo aprovado aparece em `Meus empreendimentos` apenas como leitura.

Fora desta fase:

- edicao publica do empreendimento;
- publicacao automatica no mapa turistico;
- eventos vinculados a empreendimento;
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
- usuario le apenas os proprios managers;
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
- o painel admin continua exigindo `role === admin` na UI, embora as rules locais aceitem `admin` e `moderator` para moderacao;
- nao ha workflow de edicao de dados publicos;
- nao ha workflow de eventos vinculados a empreendimento;
- nao ha sincronizacao com o mapa publico.
