# Bloco P2 — Validação do fluxo do Portal do Usuário (empreendedor vinculado)

Validação de ponta a ponta do fluxo do empreendedor vinculado no Portal, após a
correção do vínculo (Bloco P1 / commit `c23edbe`). Caso de referência: **Alle
Musial × Marina Barra do Iguaçu**.

## 1. Worktree

`git status` estava **limpo** antes de iniciar. A correção do P1
(`.where('active','==',true)`) já estava **commitada** em `c23edbe` ("Corrige
leitura de vinculos no portal do usuario"). **Nada foi commitado neste bloco.**

## 2. Arquivos inspecionados

- `portal-usuario.html` (UI: "Meus empreendimentos", modal de alteração, upload)
- `js/firebase-auth.js` (`FirebaseSystem`: leitura de vínculos, criação de
  solicitação de alteração, upload metadata, revisão admin)
- `js/establishment-catalog.js` (catálogo público/currentSnapshot)
- `firestore.rules`, `storage.rules`, `config.js`
- `js/rotas-data.js` (dados legados — origem da Marina)
- Referência: `docs/plano-vinculo-empreendimentos.md`,
  `docs/bloco-vinculos-admin-portal-usuario.md`

## 3. Fluxo do Portal do Usuário encontrado

**Arquitetura = solicitação + aprovação (NÃO é edição direta do site público).**

1. **Login** normal no `portal-usuario.html`.
2. **Solicitar vínculo**: escolhe empreendimento do catálogo público →
   `createEstablishmentClaim` grava em `establishment_claims` (`status: pending`).
3. **Minhas solicitações de vínculo**: `getUserEstablishmentClaims`
   (`where userId == uid`).
4. **Meus empreendimentos**: `getUserManagedEstablishments`
   (`where userId == uid AND active == true`). Exibição **somente leitura** do
   vínculo ativo. Cada card tem duas ações:
   - **Solicitar alteração** → modal de update-request.
   - **Cadastrar evento vinculado** → `eventos_pendentes` (`source =
     establishment_manager`).
5. **Abrir edição** ("Solicitar alteração"): `abrirModalSolicitacaoAlteracao`
   revalida o vínculo em memória, busca o `currentSnapshot` no
   `EstablishmentCatalog` pelo `establishmentId` e pré-preenche o formulário.
6. **Campos editáveis** (modal): descrição, telefone, WhatsApp, Instagram, site,
   endereço/localização textual, horário e observações adicionais. Mais até 6
   imagens.
7. **Salvar**: `enviarSolicitacaoAlteracaoEmpreendimento` →
   `createEstablishmentUpdateRequest`. **Revalida o vínculo ativo antes de gravar**
   e escreve em `establishment_update_requests` com `status: pending`. Mensagem:
   "Solicitação enviada para análise. Nada será publicado automaticamente no site
   público."
8. **Minhas solicitações de alteração**: `listMyEstablishmentUpdateRequests`
   (`where ownerUid == uid`).
9. **Admin** revisa em "Alterações de empreendimentos"
   (`reviewEstablishmentUpdateRequest`): `approved` / `rejected` /
   `changes_requested`. Aprovar **não publica** automaticamente no site — apenas
   libera para publicação manual futura.

> Conclusão importante para o guia/PDF: o empreendedor **não edita** o
> empreendimento diretamente. Ele **envia uma solicitação de alteração** que o
> admin revisa. Isso é intencional e não deve ser descrito como "edição ao vivo".

## 4. Collections usadas

| Collection | Papel | Chave de dono | Status |
| --- | --- | --- | --- |
| `establishment_claims` | Solicitação de vínculo | `userId` | `pending`/`approved`/`rejected` |
| `establishment_managers` | Vínculo aprovado (fonte de "Meus empreendimentos") | `userId` + `active:true` | boolean `active` |
| `establishment_update_requests` | Solicitação de alteração de dados | `ownerUid` | `pending`/`approved`/`rejected`/`changes_requested` |
| `eventos_pendentes` | Evento (comum ou vinculado) | `ownerUid`/`submittedBy` | `pendente` |
| `estabelecimentos_pendentes` | Cadastro de **novo** empreendimento | `submittedBy` | `pendente` |

Storage: `submissions/establishment-updates/{uid}/{submissionId}/{fileName}`.

## 5. Campos editáveis pelo empreendedor (update-request)

`description`, `phone`, `whatsapp`, `instagram`, `website`, `address`,
`openingHours`, `additionalNotes` (constante
`ESTABLISHMENT_UPDATE_ALLOWED_FIELDS`). Apenas os campos alterados vão em
`requestedChanges`; `currentSnapshot` guarda o retrato público no momento do
pedido. **Campos administrativos (`status`, `reviewedBy`, `active`, etc.) não são
enviáveis** — as rules bloqueiam via `hasOnly()`.

## 6. Como o upload funciona

- Cliente: `uploadSubmissionImages('update', requestId, user)` grava em
  `submissions/establishment-updates/{currentUser.uid}/{requestId}/{arquivo}`.
- Limite de app: 6 imagens; tipos jpeg/jpg/png/webp; nome/segmentos sanitizados.
- Metadados salvos no doc (`images[]`, `mainImage`, `imageCount`) via
  `buildSafeImageMetadata`.
- Rollback de upload: se a gravação do doc falhar, os arquivos enviados são
  removidos (`deleteUploadedFiles`).
- Storage Rules (`validPendingImageUpload`): `request.auth.uid == uid`, ≤ 5 MB,
  content-type de imagem. Leitura/delete: o próprio `uid` ou staff (admin/mod).

## 7. Rules envolvidas (Firestore)

- `establishment_managers` **read**: `isModerator() || (ownsUserId && active ==
  true)`. Query do portal já alinhada (P1).
- `establishment_update_requests` **read**: `isModerator() ||
  ownsOwnerUid(resource.data)`. Query do portal usa `where ownerUid == uid` →
  alinhada, sem exigência de `active`/`status`. **Sem risco de permission-denied.**
- `establishment_update_requests` **create**: exige `ownerUid == auth.uid`,
  `ownerEmail == auth.token.email`, `status == 'pending'`, `source ==
  'establishment_manager'`, vínculo ativo real (`managerDoc.userId == uid`,
  `active == true`, `establishmentId`/`establishmentName` batendo), e `hasOnly()`
  em `currentSnapshot`, `requestedChanges` e no doc. **update/delete só moderador.**
- Verificado: os builders (`buildSafeCurrentSnapshot`, `buildSafeRequestedChanges`,
  `buildSafeImageMetadata`) produzem **exatamente** as chaves permitidas pelas
  rules — payload e rule estão casados.

## 8. Problemas encontrados

**Nenhum bug de código no fluxo do empreendedor vinculado.** Após o P1, todas as
queries de contexto de usuário respeitam as rules e todos os payloads batem com os
`hasOnly()`. Foram descartadas as hipóteses do checklist:

- botão de editar não aparece → aparece (render em `managedEstablishmentsList`);
- edição abre mas não salva → salva em `establishment_update_requests` (pending);
- upload falha por permission-denied → path e rule alinhados;
- grava em collection diferente da pública → **por design**: grava em request,
  não no dado público (aprovação manual);
- rules exigem campos que o portal não envia → payload casa com `hasOnly()`;
- falta `active == true` em query → corrigido no P1;
- uso de email quando rule espera UID → usa `auth.uid` (dono) + `auth.token.email`
  só onde a rule exige.

**Observação de robustez (não é bug):** o modal de alteração depende de o
`EstablishmentCatalog` conter uma entrada com `establishmentId ==
manager.establishmentId` (para montar o `currentSnapshot`). Confirmado que
`Marina Barra do Iguaçu` existe em `js/rotas-data.js` (`id:
marina-barra-iguacu`, com `social`), logo é catalogável e o `establishmentId`
bate. Se um vínculo apontar para um `establishmentId` fora do catálogo público, o
modal mostra erro claro ("O catálogo público deste empreendimento não está
disponível agora") — comportamento correto, mas depende de consistência de dados.

## 9. Correções feitas ou recomendadas

- **Feitas neste bloco:** nenhuma (validação confirmou o fluxo íntegro).
- **Recomendadas (fora de escopo mínimo):** ao criar vínculo no admin, garantir
  que o `establishmentId` venha sempre do mesmo `EstablishmentCatalog`, para o
  modal de alteração sempre encontrar o `currentSnapshot`.

## 10. Alteração de Firestore Rules

**Nenhuma.** As rules já cobrem o fluxo com o mínimo necessário.

## 11. Alteração de Storage Rules

**Nenhuma.** `submissions/establishment-updates/**` já está coberto por
`validPendingImageUpload`.

## 12. Precisa publicar rules?

**Não há rule nova para publicar neste bloco.** Pré-requisito operacional (herdado
das fases anteriores): confirmar no Console que a versão publicada de
`firestore.rules` e `storage.rules` já contém os blocos
`establishment_managers`, `establishment_update_requests` e
`submissions/establishment-updates/**`. Se ainda não estiverem publicadas, publicar
antes do uso real — mas isso é da feature, não desta validação.

## 13. Validações executadas

- `node --check js/firebase-auth.js` → OK
- `node --check config.js` → OK
- `node --check sw.js` → OK
- `node --check js/establishment-catalog.js` → OK

## 14. Resultado dos audits

- `audit-links.mjs` → 662 links, 0 quebrados (exit 0)
- `audit-assets.mjs` → 226 mídias, 0 faltando (exit 0)
- `audit-project.mjs` → 417 arquivos (exit 0)

## 15. Teste manual recomendado

1. Entrar no Portal com a conta da Alle.
2. Confirmar Marina Barra do Iguaçu em "Meus empreendimentos" (badge "Ativo").
3. Clicar em "Solicitar alteração" → modal abre pré-preenchido.
4. Alterar um campo simples (ex.: horário) e enviar.
5. Confirmar mensagem de sucesso e o item em "Minhas solicitações de alteração"
   como **pendente**.
6. Anexar 1 imagem numa nova solicitação e confirmar upload sem erro.
7. Recarregar e confirmar persistência da solicitação.
8. Conta **sem vínculo**: confirmar "Você ainda não possui vínculos aprovados" e
   ausência de botões de alteração.
9. Confirmar que a Alle **não** vê nem altera empreendimento de terceiros (as
   queries filtram por `uid`/`ownerUid`; rules reforçam).
10. Admin/master: confirmar que a solicitação aparece em "Alterações de
    empreendimentos" e pode ser aprovada/rejeitada.
11. Confirmar explicitamente que **aprovar não publica** automaticamente no site
    público (é liberação para publicação manual posterior).

## 16. Riscos

- **Dado inconsistente de `establishmentId`**: vínculo apontando para id fora do
  catálogo impede abrir o modal (erro claro, sem corrupção). Mitigar mantendo o
  admin restrito ao catálogo.
- **Rules não publicadas**: se o Console estiver desatualizado, o
  update-request/upload falha com permission-denied. Verificar publicação.
- **Expectativa de "edição direta"**: o guia/PDF deve deixar claro que é
  *solicitação* com aprovação, não edição ao vivo.

## 17. Rollback

Nenhuma alteração de código neste bloco → nada a reverter. Para desfazer o P1 (se
necessário): `git revert c23edbe` (não recomendado — reintroduz o permission-denied
da leitura de vínculos).

## 18. Próxima etapa recomendada

- Teste manual real com a conta da Alle seguindo a seção 15.
- Confirmar no Console que `firestore.rules` e `storage.rules` publicadas batem com
  os arquivos do repositório.
- (Fase futura, fora deste bloco) definir o fluxo em que uma solicitação `approved`
  é efetivamente aplicada ao dado público/mapa — hoje isso é manual e separado.
- Redigir o guia/PDF do empreendedor descrevendo o fluxo como *solicitação →
  aprovação*, incluindo upload de imagens e limites (6 imagens, 5 MB, jpeg/png/webp).
