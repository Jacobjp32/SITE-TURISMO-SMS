# TASKS.md — SITE-TURISMO-SMS

Este arquivo controla o estado atual, pendências e próximos passos do projeto para uso com Claude/Claude Code/Codex.

Atualize este arquivo apenas quando houver mudança real de estado, decisão aprovada ou conclusão de etapa.

---

## Backlog reconciliado — 01/09/2026

- `baseHead=5224f015f1c8c8f5ba4368ad4694935aacd755bc`
- `historicalSectionsCanBeStale=true`
- `latestEvidenceWins=true`

Este checkpoint reconcilia pendências históricas com releases, testes e evidências posteriores. Itens antigos permanecem como provenance quando necessário, mas não reabrem automaticamente frentes concluídas.

### Regra canônica de leitura

- Este checkpoint é a fonte atual para `CURRENT ACTIVE BACKLOG`, `RESOLVED`, `HISTORICAL / PROVENANCE`, `EXTERNAL WAIT`, `OPTIONAL / DEFERRED` e `HOUSEKEEPING`.
- Se uma afirmação abaixo deste checkpoint divergir dele, a afirmação antiga deve ser lida como `HISTÓRICO — SUPERADO POR CHECKPOINT POSTERIOR`.
- Uma frente histórica somente volta ao backlog ativo quando aparecer em `Backlog ativo reconciliado` com status aberto.
- Releases, testes e evidências posteriores prevalecem sobre marcadores intermediários de PREP, dry-run, migração ou cutover.

### RESOLVED

#### Rotas V1.1

- `ROTAS_SCHEMA_RULES=RESOLVED`
- `ROTAS_NORMALIZATION=RESOLVED`
- `ROTAS_DATA_MIGRATION=RESOLVED`
- `ROTAS_ADMIN_CRUD=RESOLVED`
- `ROTAS_ADMIN_RELEASE=RESOLVED`
- `ROTAS_PUBLIC_ADAPTER=RESOLVED`
- `legacyStaticRoutesPresent=true`
- `cmsRoutesCollectionPresent=true`
- `adminRoutesReady=true`
- `migratedRoutesCount=6`
- `publishedRoutesCount=6`
- `draftRoutesCount=0`
- `publicAdapterImplemented=true`
- `publicAdapterReleased=true`
- As rotas publicadas no Firestore são a fonte pública quando os adapters retornam `SUCCESS`; as rotas estáticas permanecem apenas como fallback técnico e segurança de precutover.
- `ROTAS_V1.1_PUBLIC_ADAPTER_RELEASE` foi removido do backlog ativo. Checkpoints anteriores permanecem somente como provenance.

#### Admin V1

- `ADMIN_V1_CORE=RESOLVED`
- Módulos concluídos: Dashboard; Aprovações; Solicitações de vínculo; Gerenciar Vínculos; Usuários; Eventos; Notícias; Mídia; Banners / Pop-ups; Empreendimentos.
- `ADMIN-B1`, `ADMIN-B2A*` e os marcos Admin `ALPHA/BETA` são provenance histórica, não pendências do núcleo V1.
- `ADMIN_FUTURE_MODULES=OPTIONAL`, `priority=LOW`: Galeria, Configurações, Sazonal, Mascote e Logs são possibilidades futuras, não dívida do release V1.

#### PWA-03

- `PWA_03=RESOLVED`
- O fallback offline não integra mais o backlog ativo; a evidência de produção permanece no checkpoint histórico específico.

#### AgroSamas e Parque de Exposições

- `AGROSAMAS_RESOLVED_CHAIN=RESOLVED`
- Local funcional corrigido para Rua do Mathe: `localId=rua-do-mathe`, `/local?id=rua-do-mathe`, `coordinates=-25.878,-50.385`.
- Associação editorial antiga do Parque removida; galeria corrigida; documento CMS `parque-exposicoes` convergido.
- Commits da cadeia: `0ca9554449ffb29ddee37cdcdb59f7bebb20f998` e `869a1a4c8b8474e9e21b61065faf28d98619cb3d`.
- Não há pendências equivalentes dessa cadeia no backlog ativo. A taxonomia do Parque é uma frente editorial independente.

#### Mês Polonês

- `POLISH_MONTH_HOME_EDITORIAL_ROTATION=RESOLVED`
- O destaque temporário foi removido após o encerramento de agosto no release `4f35145b28c990a67a78b68998673a5faea4b2c4`; a produção foi validada em desktop e mobile e `/mes-polones-2026` permaneceu preservado.
- `POLISH_MONTH_PERMANENT_HUB=RESOLVED`
- O release `5224f015f1c8c8f5ba4368ad4694935aacd755bc` criou `/mes-polones`, integrou `Sobre > Capital Polonesa do Paraná`, busca e sitemap, preservou `/mes-polones-2026` como arquivo independente e incorporou retrospectiva 2026 e a seção da Rede Municipal de Ensino.
- Os smokes de desktop, mobile, browser e execução das novas versões de cache foram aprovados em produção.

#### Eventos — identidade, deduplicação e publicação da Home

- `EVENTS_HOME_IDENTITY_DEDUP=RESOLVED`
- A identidade sintética `90000+index` foi removida; eventos Firestore preservam `documentId`; o runtime usa `annual:<event.id>` e `firestore:<documentId>`; a deduplicação é identity-first, com static-first e limite de quatro cards preservados. Release concluído.
- `EVENTS_HOME_IDENTITY_CACHE_BUST=RESOLVED` — parte da cadeia de identidade, não uma tarefa ativa independente; geração `events-home-identity-44ed8c68` publicada e comprovada no browser.
- `EVENTS_HOME_PUBLICATION_POLICY=RESOLVED`
- A policy canônica aplica `publicado=false` como veto absoluto; status bloqueado vence `publicado=true`; status desconhecido falha fechado; status ausente exige `publicado=true`; `approved`/`aprovado` sem `publicado` continua público; a fonte anual permanece implicitamente publicada.
- Evidência: suíte `29/29`; release `25bebd00f9be0789fee088984cad6d9010080db8`.
- `EVENTS_HOME_PUBLICATION_POLICY_CACHE_BUST=RESOLVED` — parte da cadeia da policy, sem item ativo independente; geração vigente `events-home-policy-25bebd00`, publicada e executada em produção.
- Esses contratos estabilizam a Home, mas não resolvem a duplicação arquitetural entre fontes, os vínculos canônicos ausentes, a virada anual ou a higiene de dados.

#### CMS, App Check e V7

- `CMS_07=RESOLVED_BY_LATER_WORK`
- `CMS_08=RESOLVED_BY_LATER_WORK`
- `CMS_FULL_SAVE=RESOLVED_BY_LATER_WORK`
- `APP_CHECK_CSP=RESOLVED_WITH_CONDITIONAL_MONITORING`: funcionalmente resolvido; monitorar timeout somente se reaparecer, sem tratar como bug ativo.
- `V7A=RESOLVED`
- `V7B=RESOLVED`

`resolvedItems=[Admin V1 core, PWA-03, AgroSamas Rua do Mathe, associação antiga do Parque, galeria Parque, convergência CMS Parque, Mês Polonês rotação editorial da Home, Mês Polonês hub permanente, Eventos Home identity/dedup, Eventos Home identity cache bust, Eventos Home publication policy, Eventos Home publication policy cache bust, Rotas schema/Rules, Rotas normalization, Rotas migration/publication, Rotas Admin CRUD/release, Rotas public adapter/cutover, CMS-07, CMS-08, CMS full-save, App Check/reCAPTCHA CSP, V7A, V7B]`

### PARTIALLY RESOLVED

#### CMS-5D

- `CMS_5D=PARTIALLY_RESOLVED`
- Decomposição original: `CMS-5C=mapa`; `CMS-5D=local.html`; `CMS-5E=busca, sabores, onde-ficar e o-que-fazer`; `home=posterior`.
- Concluído por trabalhos posteriores: adapter público `cms_establishments`; leituras `published-only`; mapa dinâmico via `TURISMO_DATA`; Rotas V1.1 públicas; relacionamentos N:N em `relationships.routeIds[]`; estatísticas dinâmicas da home; busca dinâmica nas superfícies que carregam `TURISMO_DATA`.
- Remainder real: `local.html` ainda estático; `CMS-first /local?id=slug`; busca em páginas sem adapters/`TURISMO_DATA`; `sabores.html` editorial/estático; `onde-ficar.html` editorial/estático; `o-que-fazer.html` como ponte estática; cards editoriais da home ainda não integralmente migrados ao CMS.
- Somente `CMS_5D_OPEN_REMAINDER` permanece ativo; a frente histórica completa não está aberta.

### Backlog ativo reconciliado

Esta é a única lista canônica de pendências ativas. Menções antigas fora deste bloco são provenance e não duplicam o backlog.

#### P1

- `EVENTS_MISSING_ESTABLISHMENT_ID=OPEN_DATA_AUDIT_REQUIRED`, `priority=P1` — auditar eventos sem vínculo seguro antes de alterar dados.
- `EVENT_SOURCE_DUPLICATION=OPEN_DATA_ARCHITECTURE`, `priority=P1` — `duplicationStillExists=true`; `canonicalEventSourceDefined=PARTIAL_ONLY`. Fontes versionadas: `eventos-2026.json`, com papel anual de agenda/home; `js/data/eventos.js` / `TURISMO_EVENTOS`, com papel de mapa/busca; e `eventos_aprovados`, como enriquecimento Firestore opcional. Identidade runtime, deduplicação e policy de publicação da Home foram estabilizadas, mas não existe fonte global única consolidada e a duplicação arquitetural permanece aberta.
- `ANNUAL_ROLLOVER_2027=OPEN_FUTURE_REQUIRED`, `priority=P1` — `annualEventsRolloverRequired=true`; `recommendedTiming=planejar no Q4/2026 e concluir antes da primeira publicação da agenda 2027`.

#### P2

- `CMS_5D_OPEN_REMAINDER=OPEN`, `priority=P2` — executar somente o remainder descrito na seção `PARTIALLY RESOLVED`.
- `CMS_4E_EXEC=OPEN`, `priority=P2` — inventário remoto read-only de mídias; não executar sem bloco próprio e autorização operacional; sem cleanup.
- `ROUTE_NONCANONICAL_11=OPEN`, `priority=P2`, `blocking=false` — os 11 agrupamentos não canônicos não bloqueiam Rotas V1.1 públicas e dependem de decisão editorial/de dados separada.
- `EVENT_DATA_HYGIENE=OPEN`, `priority=P2` — snapshot versionado: 17 eventos com horário `A confirmar` e 2 eventos com local `A confirmar`; não corrigir sem bloco de dados.
- `V7C1=OPEN`, `priority=P2` — limpeza de runtime; deve preceder V7C2.
- `V5D=OPEN_EDITORIAL_REVIEW`, `priority=P2` — revisão anti-envelhecimento editorial; não iniciar automaticamente.
- `PARQUE_TAXONOMY=OPEN_EDITORIAL_TAXONOMY`, `priority=P2`, `blocking=false` — badge CMS observado `GA Gastronomia` versus taxonomia estática `Agropecuária`; independente de AgroSamas.
- `LOCAL_DATA_HYGIENE=OPEN`, `priority=P2` — registros/endereço ainda marcados como `A confirmar`; não corrigir sem fonte confiável.
- `NEWS_SOURCE_DUPLICATION=OPEN`, `priority=P2` — home/listagem ainda têm dívida de fonte de verdade.
- `NEWS_DYNAMIC_SEO=OPEN`, `priority=P2` — a notícia dinâmica atualiza canonical, mas metadados dinâmicos completos ainda precisam revisão.
- `FORMSPREE_EMAIL=EXTERNAL_WAIT` / `FORM_SPREE_INSTITUTIONAL_EMAIL=EXTERNAL_WAIT`, `priority=P2` — `temporaryWorkflow=imprensapmsms@gmail.com`; `institutionalEmail=turismo@saomateusdosul.pr.gov.br`; `institutionalEmailState=PENDING`. Não afirmar estado atual do painel sem verificação externa autorizada.

#### P3

- `V7C2=BLOCKED_BY_V7C1`, `priority=P3` — executar somente depois da limpeza de runtime V7C1.
- `V6=OPEN_REQUIRES_EDITORIAL_REVIEW`, `priority=P3` — reordenação da metade inferior da home; não iniciar automaticamente.
- `V5C3=HOUSEKEEPING_VISUAL_REFACTOR`, `priority=P3` — possível extração de estilos inline dos CTAs; depende de revisão visual.
- `ORPHAN_FRONTEND_CHAIN=HOUSEKEEPING`, `priority=P3` — `.map-modal-*`, `.agrosamas-banner`, `.mes-polones-home-*` e configurações/chaves i18n relacionadas a elementos ausentes; o CSS `.mes-polones-home-*` tornou-se órfão após a rotação da Home; dependência `V7C1/V7C2`. Não limpar neste checkpoint.
- `POLISH_MONTH_ROTATION_HOLD_BRANCH_CLEANUP=OPTIONAL_HOUSEKEEPING`, `priority=P3` — a branch `hold/polish-month-home-rotation-2026-09-01` pode ser reconciliada futuramente, mas não deve ser deletada neste bloco nem tratada como P1/P2.
- `SITEMAP_FRESHNESS=OPEN`, `priority=P3` — alterar `lastmod` somente quando houver mudança real da URL/conteúdo; não atualizar artificialmente.
- `PWA_SHORTCUT_ICONS=OPEN_P3`, `priority=P3` — polimento separado de PWA-03.

#### LOW

- `PWA_ICON_512=OPEN_LOW`, `priority=LOW` — polimento separado de PWA-03.
- `FIREBASE_COMPAT_MODULAR=OPTIONAL`, `priority=LOW` — não priorizar antes das frentes funcionais/documentais.
- `B3_MEDIA_PERFORMANCE=OPEN_DEFERRED`, `priority=LOW` — executar após o trabalho funcional prioritário; métricas existentes permanecem apenas como snapshot histórico, sem nova auditoria pesada neste checkpoint.
- `GIT_EOL_POLICY=HOUSEKEEPING_NON_BLOCKING`, `priority=LOW` — `js/locais-data.js` e `sw.js` possuem histórico mixed EOL; não há política `.gitattributes` consolidada; releases atuais não sofreram churn não relacionado. Não criar `.gitattributes` nem renormalizar neste bloco.
- `SW_LEAFLET_LOCALHOST=CONDITIONAL_FOLLOWUP`, `priority=LOW` — investigar somente se reproduzir novamente; não é bug ativo de produção.
- `serviceWorkerHardeningDeferred=true` — os releases recentes comprovaram a execução das gerações por query string; não abrir task P1 de service worker por causa desses cache busts.

### HISTORICAL / PROVENANCE

Todos os itens seguintes são `HISTÓRICO — SUPERADO POR CHECKPOINT POSTERIOR` quando encontrados em seções antigas deste arquivo:

`historicalOnlyItems=[ADMIN-B1, ADMIN-B2A*, Admin ALPHA/BETA, Rotas discovery/dry-runs encerrados, markers antigos de migração Rotas, publicAdapterReleased=false, productionRotasDraft=6, NEXT_PHASE=ROTAS_V1.1_PUBLIC_ADAPTER_RELEASE, PWA-03 como bug aberto, AgroSamas associado ao Parque, POLISH_MONTH_HOME_EDITORIAL_ROTATION=OPEN_TIME_BOUND, SITE-V2-POLISH-MONTH-HOME-EDITORIAL-ROTATION-PREP, CMS-07/CMS-08 como P1, knownIssueCmsEstablishmentsFullSave=true, App Check/CSP como bug ativo anterior, V7A/V7B como etapas abertas]`

Esses registros permanecem para auditoria. Eles não representam o backlog vigente e sempre apontam conceitualmente para este checkpoint atual.

### Ordem oficial de execução

`recommendedExecutionOrder=[`

1. Auditoria dos eventos sem `establishmentId` + arquitetura/fonte canônica de eventos.
2. Preparação da virada anual 2027.
3. `CMS-5D open remainder`.
4. `CMS-4E-EXEC` read-only, com autorização própria.
5. V7C1.
6. 11 agrupamentos não canônicos + higiene editorial/taxonômica.
7. V7C2, V6, V5C3 e V5D conforme decisão editorial.
8. B3, PWA polish, EOL e demais housekeeping.

`]`

Rotas V1.1 não integra mais a fila de próximas execuções.

### Próximo bloco funcional

- `nextFunctionalBlock=SITE-V2-EVENTS-MISSING-ESTABLISHMENT-ID-AND-SOURCE-AUDIT-PREP`
- `nextFunctionalBlockExecuted=false`
- Objetivo futuro: discovery/audit `READ-ONLY` de eventos sem vínculo canônico seguro; `establishmentId`/`localId`/`placeId`/aliases existentes; fontes anuais; `TURISMO_EVENTOS`; `eventos_aprovados`; duplicações e divergências; e proposta de arquitetura canônica.
- Esse bloco futuro não foi executado neste checkpoint.

---

## HISTÓRICO — Rotas Admin V1.1 — Admin release e smoke read-only de Rotas aprovados — SUPERADO PELO CHECKPOINT DE 30/08/2026

> Os marcadores intermediários abaixo, inclusive `productionRotasDraft=6`, `publicAdapterReleased=false`, `knownIssueCmsEstablishmentsFullSave=true` e `NEXT_PHASE=ROTAS_V1.1_PUBLIC_ADAPTER_RELEASE`, são provenance. O estado vigente está em `Backlog reconciliado — 30/08/2026`.

- `adminReleaseClassification=A`
- `productionReleaseHead=20c70b10c922976ec4f187751f5813b850999fba`
- `githubPagesRelease=true`
- `productionDomain=turismo.saomateusdosul.pr.gov.br`
- `productionAdminAssetsMatched=true`
- `adminRotasReadonlySmoke=true`
- `productionRotasVisibleToAdmin=6`
- `productionRotasDraft=6`
- `productionRotasPublished=0`
- `adminSmokeFirestoreWrites=0`
- `adminSmokeStorageWrites=0`
- `publicRegressionDetected=false`
- `publicAdapterReleased=false`
- `migrationClassification=A`
- `migrationExecuted=true`
- `knownIssueCmsEstablishmentsFullSave=true`
- `knownIssueCategory=FIRESTORE_RULE_EXPRESSION_LIMIT_1000`
- `knownIssueRegressionClassification=PREEXISTING_ESTABLISHMENT_CONTRACT_ISSUE`
- `knownIssueIntroducedByRotasV11=false`
- `knownIssueFixApplied=false`
- `priorHumanStorageMutation=INDETERMINATE`
- `NEXT_PHASE=ROTAS_V1.1_PUBLIC_ADAPTER_RELEASE`

---

## Rotas Admin V1.1 — data migration executada em produção

- `migrationClassification=A`
- `migrationExecutorHead=c79e2c6d7c6e31fef36a5543011705e956eda6cd`
- `manifestFileSha256=528e0547b0bcf40da04a50e8bac6c8a317e7cf65df16dbad74299ccbd2176557`
- `planSha256=888ef5ffadcc44d9fc1a3cd7459e39e83cb11bd88f40a4b93ed29298a4722fe5`
- `routeCreatesApplied=6`
- `cmsUpdatesApplied=2`
- `totalWritesApplied=8`
- `postMigrationRotasDocuments=6`
- `postMigrationCmsDocuments=67`
- `postMigrationCanonicalRelationships=60`
- `postMigrationUnknownValuesPreserved=11`
- `postMigrationMalformedRelationships=0`
- `postMigrationRelationshipFingerprintSha256=b6ae88e498fee6c7216e5624112acf5fd0f47fdd61a6be132ad733c9e561badd`
- `commitTime=2026-08-24T13:49:39.098378Z`
- `writeRoleBindingAbsent=true`
- `writeRoleDeleted=true`
- `readBindingAbsent=true`
- `tokenCreatorBindingAbsent=true`
- `serviceAccountDisabled=true`
- `userManagedKeys=0`
- `adcAbsent=true`
- `authFinalZero=true`
- `migrationExecuted=true`
- `NEXT_PHASE=ROTAS_V1.1_ADMIN_RELEASE_AND_PRODUCTION_SMOKE`

---

## Rotas Admin V1.1 — remote migration dry-run aprovado

- `remoteMigrationDryRunClassification=A`
- `dryRunToolHead=f7ef013c1c937521137d58f0136b4c7c36802b47`
- `productionBaselineFingerprintMatched=true`
- `remoteRotasDocuments=0`
- `remoteCmsDocuments=67`
- `plannedRouteCreates=6`
- `plannedCmsDocumentUpdates=2`
- `plannedTotalWrites=8`
- `aliasesToNormalize=2`
- `unknownValuesPreserved=11`
- `malformedRelationshipDocuments=0`
- `planSha256=888ef5ffadcc44d9fc1a3cd7459e39e83cb11bd88f40a4b93ed29298a4722fe5`
- `manifestFileSha256=528e0547b0bcf40da04a50e8bac6c8a317e7cf65df16dbad74299ccbd2176557`
- `seedValidation=true`
- `idempotency=true`
- `FirestoreWrites=0`
- `migrationExecuted=false`
- `MIGRATION_EXEC_ALLOWED=false`
- `NEXT_PHASE=ROTAS_V1.1_DATA_MIGRATION_EXEC_HUMAN_REVIEW`

---

## Rotas Admin V1.1 — erratum do SHA-256 do manifest de migração

- `manifestSha256ErratumClassification=A`
- `manifestSha256ErratumReason=DOCUMENTARY_EXTRA_HEX_CHARACTER`
- `previousInvalidManifestFileSha256Length=65`
- `correctManifestFileSha256=528e0547b0bcf40da04a50e8bac6c8a317e7cf65df16dbad74299ccbd2176557`
- `manifestSha256Length=64`
- `manifestIndependentHashAgreement=true`
- `manifestBytesModified=false`
- `planSha256=888ef5ffadcc44d9fc1a3cd7459e39e83cb11bd88f40a4b93ed29298a4722fe5`
- `planSha256Matched=true`
- `remoteMigrationDryRunClassification=A`
- `migrationExecHumanReviewClassification=A`
- `migrationExecuted=false`
- `MIGRATION_EXEC_ALLOWED=false`

O valor documental anterior possuía 65 caracteres por conter um caractere hexadecimal extra. O literal inválido completo não é preservado neste checkpoint. Os bytes do manifesto e o plan não foram modificados.

---

## Rotas Admin V1.1 — baseline de produção e Firestore Rules publicadas

- `baselineClassification=A`
- `ROTAS_DRY_RUN_ALLOWED=true`
- `productionRotasDocuments=0`
- `productionCmsEstablishmentsDocuments=67`
- `canonicalRelationshipsAfter=60`
- `malformedRelationshipDocuments=0`
- `relationshipFingerprintSha256=b6ae88e498fee6c7216e5624112acf5fd0f47fdd61a6be132ad733c9e561badd`
- `firestoreRulesDeployClassification=A`
- `firestoreRulesDeployUtc=2026-08-22T23:24:12.748Z`
- `firestoreRulesSourceSha256=502b463504249b707ccb8a1f319060a59d8938715add783c90b1fb8be1cf2fc3`
- `firestoreRulesProject=turismo-sms`
- `storageRulesDeployed=false`
- `hostingDeployed=false`
- `migrationExecuted=false`
- `NEXT_PHASE=REMOTE_DATA_MIGRATION_DRY_RUN_WITH_MANIFEST`

---

## Rotas Admin V1.1 — instrumentation PREP da baseline read-only em 2026-08-21

- Bloco: `POST-V1-ROTAS-V1.1-READONLY-BASELINE-INSTRUMENTATION-PREP`.
- O bloco remoto anterior `POST-V1-ROTAS-V1.1-PRODUCTION-READONLY-BASELINE` permanece classificado como **F — INCONCLUSIVO**: não leu `rotas` ou `cms_establishments`, não escreveu Firestore e terminou com cleanup comprovado (bindings ausentes, service account desabilitada, zero chaves `USER_MANAGED`, ADC ausente, artifacts removidos e credencial humana revogada).
- A forense local preserva `historicalEnableInvocation = INDETERMINATE`. O run registrou apenas uma categoria agregada de falha e não serializou `commandInvocationEntered`, `commandReturned`, `exitCodeCaptured`, `exitCode`, stage ou journal de mutações. O estado pós-cleanup não pode promover essa evidência a “enable não enviado” nem a “enable concluído”.
- `migrationDryRunSafeToPrepare = NOT_PROVEN`. Migração continua bloqueada. O único próximo bloco possível, dependente de autorização literal nova, é `POST-V1-ROTAS-V1.1-PRODUCTION-READONLY-BASELINE-RETRY`.

### Source canônico — B2A5_MUTATION_EXECUTOR_SOURCE

Todo comando nativo mutável do futuro retry — enable/disable da service account, add/remove das duas bindings e `auth revoke` quando aplicável — deve usar exclusivamente este executor. Ele não recebe token, policy, URL OAuth, argumento bruto nem saída nativa no objeto retornado; o chamador fornece somente `SanitizedTargetLabel`.

<!-- B2A5_MUTATION_EXECUTOR_SOURCE_BEGIN -->
```powershell
function Invoke-B2A5NativeMutation {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $Executable,

        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [string[]] $Arguments,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $OperationName,

        [Parameter(Mandatory = $true)]
        [ref] $CallCounterRef,

        [Parameter(Mandatory = $true)]
        [ValidateRange(1, [int]::MaxValue)]
        [int] $ExpectedCallOrdinal,

        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $SanitizedTargetLabel
    )

    $record = [ordered]@{
        operationName = $OperationName
        sanitizedTargetLabel = $SanitizedTargetLabel
        callCountBefore = $null
        callCountAfter = $null
        commandInvocationEntered = $false
        commandWasSent = $false
        commandReturned = $false
        exitCodeCaptured = $false
        exitCode = $null
        startedAtUtc = $null
        returnedAtUtc = $null
        wrapperFailure = $false
        wrapperFailureClass = $null
        wrapperFailurePhase = $null
    }

    try {
        $callCountBefore = [int] $CallCounterRef.Value

        if ($ExpectedCallOrdinal -ne ($callCountBefore + 1)) {
            throw [System.InvalidOperationException]::new(
                'B2A5_MUTATION_CALL_ORDINAL_COLLISION'
            )
        }

        $CallCounterRef.Value = $callCountBefore + 1
        $record.callCountBefore = $callCountBefore
        $record.callCountAfter = [int] $CallCounterRef.Value
        $record.startedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
        $record.commandInvocationEntered = $true

        & $Executable @Arguments
        $NativeExitCode = $LASTEXITCODE

        $record.commandReturned = $true
        $record.exitCodeCaptured = $true
        $record.commandWasSent = $true
        $record.exitCode = [int] $NativeExitCode
        $record.returnedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
    }
    catch {
        $record.wrapperFailure = $true

        if ($record.commandInvocationEntered -and -not $record.exitCodeCaptured) {
            $record.commandWasSent = 'INDETERMINATE'
            $record.exitCode = 'INDETERMINATE'
            $record.wrapperFailureClass =
                'HOST_FAILURE_AFTER_INVOCATION_ENTERED'
            $record.wrapperFailurePhase =
                'afterInvocationEnteredBeforeExitCapture'
        }
        else {
            $record.commandWasSent = $false
            $record.wrapperFailureClass = 'LOCAL_PREINVOCATION_FAILURE'
            $record.wrapperFailurePhase =
                'beforeCommandInvocationEntered'
        }
    }

    return [pscustomobject] $record
}
```
<!-- B2A5_MUTATION_EXECUTOR_SOURCE_END -->

### Contrato operacional do retry

1. Antes de cada mutation, o chamador valida que `ExpectedCallOrdinal` é único e cria um journal process-local com `sequence`, `operationName`, `callOrdinal`, `startedAtUtc`, `commandInvocationEntered`, `commandReturned`, `exitCodeCaptured`, `exitCode`, `postValidationStarted`, `postValidationResult` e `cleanupRequired`.
2. O executor incrementa o contador e grava `commandInvocationEntered=true` imediatamente antes de `& $Executable @Arguments`. A atribuição `$NativeExitCode = $LASTEXITCODE` é a primeira instrução executável após o retorno nativo.
3. Se falhar antes de `commandInvocationEntered`, `commandWasSent=false`. Se falhar depois da entrada e antes da captura, `commandWasSent=INDETERMINATE` e `exitCode=INDETERMINATE`. Estado remoto pós-operação jamais substitui exit code ausente.
4. Leitura pós-operação começa somente depois do record estrutural do executor e atualiza somente `postValidationStarted`/`postValidationResult` no journal. Falha de serialização ou cleanup não apaga records já capturados.
5. Não há retry automático de mutation. `exitCodeCaptured=true` com exit diferente de zero bloqueia repetição; evidence `INDETERMINATE` exige reconciliação separada e cleanup fail-closed.
6. O cleanup mantém a remoção exata de bindings, disable final, zero chaves, ADC ausente, revogação nominal da credencial criada e remoção de artifacts. Ele pode apagar artifacts operacionais, mas não os records sanitizados em memória antes do relatório final.

### Campos obrigatórios do relatório de retry

Para o enable da service account: `serviceAccountEnableCallCount`, `enableCommandInvocationEntered`, `enableCommandReturned`, `enableExitCodeCaptured`, `enableExitCode`, `enableStartedAtUtc`, `enableReturnedAtUtc`, `enablePostReadAtUtc` e `disabledAfterEnable`. A mesma disciplina vale para ADD/REMOVE de binding, disable e revoke. O executor proíbe `System.Diagnostics.Process` com handlers assíncronos, `OutputDataReceived`, `ErrorDataReceived`, jobs, `Start-Job`, parsing de comando como string única, `Invoke-Expression` e atribuição manual a `$LASTEXITCODE`.

### Validação sintética deste PREP

- `Windows PowerShell 5.1`: `parseErrorCount=0`; `10/10 PASS`.
- `PowerShell 7.x`: `parseErrorCount=0`; `10/10 PASS`.
- Os dez casos cobriram exit `0`, exit `7`, sequência sem `$LASTEXITCODE` stale, executável e argumento com espaço, ordem literal da captura, falha pré-invocation, host failure após `commandInvocationEntered`, falha de serialização posterior e colisão de ordinal. Nenhum caso executou `gcloud` ou qualquer acesso remoto.

---

## Rotas Admin V1.1 — contrato normativo da baseline read-only de produção

### Identidade, escopo e precedência

- Bloco que congelou este contrato: `POST-V1-ROTAS-V1.1-PRODUCTION-READONLY-BASELINE-CONTRACT-RESET`.
- `CONTRACT_KIND = NEW_HUMAN_APPROVED_REPLACEMENT`.
- `DATA_CONTRACT = ROTAS_V1.1`.
- `HISTORICAL_RETRY_CONTRACTS_SUPERSEDED=true`.
- `CANONICAL_RUNNER_DETOUR_SUPERSEDED=true`.
- `NEW_NORMATIVE_BASELINE_CONTRACT_FROZEN=true`.
- Esta é a nova fonte normativa, aprovada pelo humano, para substituir os retries históricos incompletos somente quanto à próxima baseline de produção de Rotas V1.1. Os prompts históricos recuperados permanecem apenas como provenance; não realizar nova recuperação histórica, procurar outro runner ou reconstruir V1/V2/V3.
- Este contrato não é `ADMIN-B2A5-INVENTORY`, não trata de `usuarios`, `ativo`, `role` nem institui canonical runner.
- Fontes rastreadas preservadas: `TASKS.md`, `scripts/lib/rotas-v1.1-model.mjs`, `scripts/rotas-v1.1-normalize-dry-run.mjs` e `firestore.rules`. Para `RELATIONSHIPS`, a autoridade funcional é `scripts/lib/rotas-v1.1-model.mjs`; sua normalização não deve ser reinventada.
- O bloco de congelamento foi `LOCAL-ONLY`, `DOCUMENTATION-ONLY`, `ZERO-CLOUD`, `ZERO-AUTH`, `ZERO-IAM` e `ZERO-FIRESTORE`, alterando somente `TASKS.md`. Este texto define um futuro EXEC, mas não o autoriza nem o inicia.

### Preflight obrigatório do futuro EXEC

Executar `git fetch origin`, `git status --short --branch --untracked-files=all`, `git status --porcelain=v2 --branch`, `git rev-parse HEAD`, `git rev-parse origin/feature/rotas-v1.1-admin-crud`, `git diff --check` e `git diff --cached --check`. Exigir branch `feature/rotas-v1.1-admin-crud`, HEAD aprovado pelo bloco futuro, tracked tree limpo e índice vazio. Confirmar que `tools/admin-b2a5-canonical-runner` não existe. Não abrir, ler, modificar ou stagear `.claude/settings.local.json`, `IMAGENS_MES_POLONES_2026_WEB.zip` e `images/mascotes/mascotes.zip`.

### Auth e IAM temporários do futuro EXEC

- `AUTH_MODEL = HISTORICAL_TEMPORARY_SERVICE_ACCOUNT_IMPERSONATION`.
- A proibição total de IAM introduzida posteriormente está explicitamente superada para esta baseline. No futuro EXEC, e somente nele, são autorizáveis exatamente estas mutations temporárias:
  1. habilitar a dedicated service account;
  2. adicionar a ela, no project, o custom role `projects/turismo-sms/roles/adminB2A5InventoryRead`;
  3. adicionar ao operador humano, somente no recurso da service account, `roles/iam.serviceAccountTokenCreator`;
  4. executar cleanup reverso exato: remover a Token Creator binding criada pelo run; remover a project binding criada pelo run; desabilitar novamente a service account; confirmar zero chaves `USER_MANAGED`; revogar ADC; e revogar a credencial humana criada no run.
- Nenhuma outra IAM mutation é autorizável.
- Dedicated service account logical ID: `admin-b2a5-inventory-reader`.
- Permissões exatas do custom role: `datastore.entities.get` e `datastore.entities.list`.
- São proibidos `Owner`, `Editor`, `Datastore User`, `Datastore Viewer`, `Firebase Admin` e service-account key.
- O e-mail do operador não pode ser persistido em `TASKS.md`. No futuro EXEC, deve ser fornecido literalmente pelo humano ou já estar presente como literal humano recuperável na mesma task. Nunca inferir por Git, username do Windows, estado do gcloud, arquivo ou ambiente.

### Janela temporária

- `START_UTC` é o UTC atual normalizado ao segundo inteiro, materializado imediatamente antes da primeira IAM mutation.
- `END_UTC = START_UTC + 7200 segundos`.
- As bindings temporárias devem usar `request.time >= timestamp(START_UTC) AND request.time < timestamp(END_UTC)`.
- A project read binding permanece restrita ao database por `resource.name == "projects/turismo-sms/databases/(default)"`.
- Não reintroduzir `ceilToNextMinute`, lead, `startTolerance` ou `ACTIVATION_MUST_START_BY`.

### ADC isolado

- Config root: `%LOCALAPPDATA%\Google\CloudSDK\admin-b2a5-config`.
- ADC: `%LOCALAPPDATA%\Google\CloudSDK\admin-b2a5-config\application_default_credentials.json`.
- Antes do login: `credentialed accounts = 0`, `active accounts = 0` e ADC file ausente.
- O config root pode existir somente se estiver sem credentialed account, sem active account, sem ADC e sem impersonation/access-token-file residual. Não apagar recursivamente o config root.
- O ADC deve usar impersonação da dedicated service account. O access token para REST deve ser obtido somente do ADC impersonado, mantido em memória e nunca persistido.

### Transporte Firestore estritamente read-only

- `FIRESTORE_READ_METHOD = projects.databases.documents.listDocuments`.
- API Firestore REST v1, método HTTP `GET`, parent `projects/turismo-sms/databases/(default)/documents`.
- Não usar `runQuery`, `batchGet`, `getDocument` individual como estratégia principal, `runAggregationQuery` nem Firebase client SDK.
- Não escrever Firestore.

#### Collection `rotas`

- DocumentMask somente com `id`, `slug`, `status` e `displayOrder`.
- O technical document ID é o segmento final de `Document.name`.
- Não incluir conteúdo editorial no relatório.
- `pageSize = 100`; paginar por `nextPageToken` até sua ausência; `showMissing = false`; sem filtros.
- Hard safety cap de `10000` documentos. Se excedido, baseline inconclusiva e `FAIL-CLOSED`.

#### Collection `cms_establishments`

- DocumentMask exata: `relationships.routeIds`.
- O technical document ID é o segmento final de `Document.name`.
- Não ler `name`, `contact`, `location`, `content`, `media`, SEO, PII nem conteúdo editorial.
- `pageSize = 100`; paginar por `nextPageToken` até sua ausência; `showMissing = false`; sem filtros.
- Hard safety cap de `10000` documentos. Se excedido, baseline inconclusiva e `FAIL-CLOSED`.

### Rotas canônicas e aliases

IDs canônicos, preservados exatamente e nesta autoridade:

1. `sabores-memorias`
2. `rota-erva-mate`
3. `rota-polonesa`
4. `rota-das-aguas`
5. `caminhos-de-fluviopolis`
6. `rota-da-terra`

Alias map preservado exatamente:

- `sabores` → `sabores-memorias`
- `mate` → `rota-erva-mate`
- `polonesa` → `rota-polonesa`
- `aguas` → `rota-das-aguas`
- `fluviop` → `caminhos-de-fluviopolis`
- `terra` → `rota-da-terra`
- `rota-da-erva-mate` → `rota-erva-mate`

### Normalização vinculante de relacionamentos

A baseline deve espelhar exatamente `normalizeRouteIds()` e `normalizeRelationshipDocuments()` de `scripts/lib/rotas-v1.1-model.mjs`, somente em memória:

- `routeIds` deve ser list/array, com no máximo 50 elementos, todos strings;
- ID canônico permanece canônico e alias aprovado é convertido;
- string não canônica é preservada;
- duplicate é removido somente dentro do mesmo documento, preservando a primeira ocorrência;
- não existe dedupe global entre documentos.

São `malformedRelationshipDocument`: `relationships` ausente; `routeIds` ausente, `null` ou não-array; mais de 50 elementos; ou qualquer elemento não-string. Cada ocorrência deve compor `malformedRelationshipDocuments` e impor `ROTAS_DRY_RUN_ALLOWED=false`. String desconhecida não é malformed: é `nonCanonicalPreserved` / `unknownValue`.

### Agregados sanitizados

Para `cms_establishments`, produzir somente:

- `documentsInspected`
- `documentsWithCanonicalRoutes`
- `canonicalRelationshipsBefore`
- `aliasesNormalized`
- `canonicalRelationshipsAfter`
- `multiRouteDocuments`
- `nonCanonicalGroupingsPreserved`
- `duplicatesRemoved`
- `unknownValues`
- `malformedRelationshipDocuments`

Para `rotas`, produzir somente:

- `routeDocumentsInspected`
- `canonicalRouteDocumentsPresent`
- `nonCanonicalRouteDocumentCount`
- `malformedRouteDocumentCount`

Não listar IDs de `cms_establishments` no relatório.

### Referência local não vinculante

Os números do dry-run local rastreado são somente referência, nunca gate numérico de produção: `canonicalRouteCount = 6`, `canonicalRelationshipsAfter = 60`, `documentsWithCanonicalRoutes = 51`, `aliasesNormalized = 2`, `nonCanonicalGroupingsPreserved = 11`, `multiRouteDocuments = 9`, `seedRouteCount = 6` e `seedValid = true`. Produção não precisa ser numericamente idêntica; diferenças devem ser reportadas, não tratadas automaticamente como erro.

### Fingerprint vinculante byte a byte

Calcular somente quando houver zero malformed relationship documents:

1. Para cada documento válido de `cms_establishments`, extrair `technicalId` como o segmento final de `Document.name`.
2. Aplicar `normalizeRouteIds()` e copiar os `routeIds` normalizados.
3. Ordenar essa cópia por comparação ordinal de string.
4. Serializar um JSON array compacto `[technicalId,sortedNormalizedRouteIds]`, com JSON escaping padrão e sem whitespace adicional.
5. Ordenar todos os records por `technicalId`, usando comparação ordinal.
6. Concatenar os JSON records com LF, byte `0x0A`, entre records e sem LF final.
7. Codificar em UTF-8 sem BOM e calcular SHA-256.
8. Emitir `relationshipFingerprintSha256` como hexadecimal lowercase de 64 caracteres.

Os technical IDs são usados internamente, mas o payload pré-hash não integra o relatório. Se houver qualquer malformed, `relationshipFingerprintSha256 = null` e a baseline não pode ser `A`.

### Reporter mínimo e fechado

- `schemaVersion = "rotas-production-baseline-1.0"`.
- O relatório final possui somente estas famílias fechadas: `identity`, `timing`, `git`, `auth`, `rotas`, `cmsEstablishments`, `relationshipFingerprintSha256`, `cleanup`, `mutationCounters`, `baselineClassification`, `failureCategory` e `rotasDryRunAllowed`.
- Não recriar reporter de 78, 96 ou 137 campos e não reutilizar reporter do canonical runner.
- Não persistir e-mail do operador, token, URL/code OAuth, e-mail da service account, raw IAM policy, raw Firestore documents, technical IDs de CMS, PII ou conteúdo editorial.

### Critério de sucesso fail-closed

`baselineClassification = A` somente quando todos os itens forem provados:

- Git preflight aprovado;
- auth baseline aprovado;
- activation temporária concluída com journal auditável;
- leitura completa de `rotas` e `cms_establishments`, ambas abaixo do hard cap;
- zero malformed route documents e zero malformed relationship documents;
- fingerprint produzido;
- zero Firestore write, zero Storage mutation/access, zero Firebase Auth mutation e zero Rules mutation;
- cleanup completo;
- project binding temporária ausente e Token Creator binding temporária ausente;
- service account desabilitada e zero chaves `USER_MANAGED`;
- ADC ausente, credencial humana criada pelo run revogada e auth final zero;
- Git inalterado.

Somente nesse estado `ROTAS_DRY_RUN_ALLOWED=true`. Qualquer condição não provada impõe `baselineClassification=F` e `ROTAS_DRY_RUN_ALLOWED=false`.

### Próximo passo, sem execução automática

Se e somente se a baseline terminar em `A`, apenas liberar preparação, sem executar automaticamente, para a sequência rastreada: (1) deploy isolado das Rules exatas; (2) data migration dry-run com manifest; (3) migration EXEC com autorização separada; (4) release Admin + smoke; (5) adapter público posteriormente.

O próximo bloco autorizável é `POST-V1-ROTAS-V1.1-PRODUCTION-READONLY-BASELINE-EXEC`. Este contrato congelado não autoriza produção, autenticação, IAM, Firestore, deploy, migration, merge ou push e não inicia esse próximo bloco.

## Rotas Admin V1.1 — erratum de observação de propagação

`POST_MUTATION_OBSERVATION_CONTRACT = BOUNDED_READ_POLLING`.

Mutation jamais é repetida apenas porque o read-back ainda não observou o estado esperado.

### Service account enable/disable

Após `exitCode=0` da única mutation de enable ou disable, realizar somente leituras de estado nos offsets aproximados `t+5s`, `t+15s`, `t+30s` e `t+60s`, medidos desde o retorno da mutation. Parar imediatamente quando o estado esperado for comprovado.

- Para enable, o estado esperado é `disabled=false`.
- Para disable, o estado esperado é `disabled=true`.
- Cada leitura deve ter exit code capturado, ser parseada estruturalmente, confirmar a mesma service account, nunca alterar estado e nunca imprimir identidade no reporter.
- Se nenhuma leitura comprovar o estado esperado até `t+60s`: `POST_VALIDATION_PROPAGATION_TIMEOUT` → `FAIL-CLOSED` → cleanup quando aplicável.
- O `exitCode=0` da mutation continua não sendo prova suficiente sozinho.

### IAM policy read-back

Após project binding add/remove ou Token Creator binding add/remove, a mutation também continua sendo executada uma única vez. A observação da policy pode ser repetida somente por `getIamPolicy` ou leitura equivalente nos offsets aproximados `t+5s`, `t+15s`, `t+30s` e `t+60s`, medidos desde o retorno da mutation.

- Após add, procurar a binding exata.
- Após remove, provar ausência da binding exata.
- Não criar ou remover novamente a binding por causa de atraso do read-back.
- Se a observação não convergir até `t+60s`: `POST_VALIDATION_PROPAGATION_TIMEOUT` → `FAIL-CLOSED` → cleanup.

### Authorization effect propagation

Policy visibility e authorization effectiveness não são a mesma coisa.

Depois que as duas bindings estiverem comprovadamente presentes na policy, a tentativa de ADC impersonado pode ainda receber `permission-denied` enquanto o IAM propaga o novo acesso. Nesse caso específico, permitir somente `ADC_IMPERSONATION_AUTH_PROPAGATION_RETRY`, com tentativas em `t+0`, `t+120s` e `t+300s`, contadas a partir da primeira tentativa de ADC.

O retry é permitido somente quando:

- o policy read-back continua comprovando as duas bindings exatas;
- a service account continua enabled;
- `USER_MANAGED keys=0`;
- o erro é compatível com authorization/permission propagation.

Não executar retry se houver malformed response, wrong principal, wrong role, wrong condition, missing binding, project mismatch, ADC path collision, filesystem failure, OAuth/login failure ou qualquer erro não relacionado a authorization propagation. Não repetir enable, bindings ou login durante esses retries. Se a tentativa de `t+300s` também falhar: `FAIL-CLOSED` → cleanup.

### Disciplina vinculante

- `MUTATION_RETRY = PROHIBITED`.
- `READ_OBSERVATION_RETRY = ALLOWED_BOUNDED`.
- `AUTH_EFFECT_RETRY = ALLOWED_BOUNDED_WHEN_EXPLICITLY_DEFINED`.
- Cleanup de binding remove somente a binding comprovadamente criada pela execução.
- Cleanup disable usa a mesma observação limitada em `t+5s`, `t+15s`, `t+30s` e `t+60s`; somente uma leitura que comprove `disabled=true` permite `serviceAccountDisabledFinal=true`.
- O reporter sanitizado acrescenta `enableObservationAttempts`, `enableObservedAtUtc`, `disableObservationAttempts`, `disableObservedAtUtc`, `projectBindingObservationAttempts`, `tokenBindingObservationAttempts`, `adcAuthPropagationAttempts` e `priorRunCleanupReconciled`.
- Todo o restante do contrato normativo congelado permanece inalterado.

## Rotas Admin V1.1 — erratum Token Creator command contract

Este erratum integra o contrato normativo da baseline read-only de produção e prevalece sobre qualquer construção anterior incompatível da mutation Token Creator. `TOKEN_CREATOR_MUTATION_EXIT_CODE_DOES_NOT_PROVE_REMOTE_STATE=true`.

### Token Creator ADD — contrato exato

A única mutation ADD autorizável usa `gcloud iam service-accounts add-iam-policy-binding` com os seguintes argumentos semânticos exatos:

- `SERVICE_ACCOUNT = <TARGET_SERVICE_ACCOUNT_EMAIL_IN_MEMORY>`;
- `--member=user:<OPERATOR_IN_MEMORY>`;
- `--role=roles/iam.serviceAccountTokenCreator`;
- `--condition-from-file=<TOKEN_CONDITION_FILE>`;
- `--project=turismo-sms`;
- `--account=<OPERATOR_IN_MEMORY>`;
- `--quiet`.

A ordem das flags pode variar se aceita pela CLI, mas todos os argumentos acima são obrigatórios. É proibido usar `--condition` inline, condition string montada diretamente no argv, omitir `--project`, omitir `--account`, usar `--all`, outro role ou outro principal.

### Construção e validação local do argv

A chamada deve ser construída como argv estruturado, sem concatenar command string dinâmica. Cada flag/value deve ocupar exatamente um argumento lógico conforme exigido pela CLI. Antes da mutation, a validação local do argv planejado deve exigir cumulativamente:

- command `iam service-accounts add-iam-policy-binding`;
- target service account correta;
- member prefix `user:`;
- role exato `roles/iam.serviceAccountTokenCreator`;
- condition mechanism `condition-from-file`;
- project `turismo-sms`;
- account igual ao operador humano aprovado;
- `quiet` presente.

Se qualquer item divergir: `COMMAND_CONSTRUCTION_FAILURE` e parada antes da mutation. Valores sensíveis e argv sensível bruto não integram o relatório.

### Token condition file

A Token Creator condition deve existir exclusivamente em arquivo local temporário, criado de forma exclusiva fora do repositório, em JSON ou YAML aceito oficialmente pelo gcloud, com conteúdo semântico exato:

- title: `admin_b2a5_inventory_impersonation_window`;
- description: `Rotas V1.1 temporary inventory impersonation window`;
- expression: `request.time >= timestamp("<START_UTC>") && request.time < timestamp("<END_UTC>")`.

`START_UTC` e `END_UTC` são os valores da janela corrente definidos pelo contrato. A Token Creator condition não pode incluir `resource.name`.

Antes da mutation, reparsear o arquivo e confirmar title, description, expression e `START_UTC < END_UTC`; calcular hash local; manter path/hash somente em memória operacional; não persistir o arquivo no repositório. O mesmo `TOKEN_CONDITION_FILE` criado para ADD deve permanecer disponível até que o cleanup da Token Creator binding tenha sido totalmente reconciliado. Não apagá-lo antes. A remoção deve reutilizar a mesma condition — title, description e expression — e preferencialmente o mesmo arquivo/hash pertencente ao run.

### Token Creator REMOVE — contrato exato

Quando o cleanup exigir remoção, usar `gcloud iam service-accounts remove-iam-policy-binding` com os seguintes argumentos semânticos exatos:

- `SERVICE_ACCOUNT = <TARGET_SERVICE_ACCOUNT_EMAIL_IN_MEMORY>`;
- `--member=user:<OPERATOR_IN_MEMORY>`;
- `--role=roles/iam.serviceAccountTokenCreator`;
- `--condition-from-file=<MESMO_TOKEN_CONDITION_FILE>`;
- `--project=turismo-sms`;
- `--account=<OPERATOR_IN_MEMORY>`;
- `--quiet`.

São proibidos `--all`, condition diferente, member diferente, role diferente ou remover binding não atribuída ao run.

### Reconciliation obrigatória da Token Creator

Antes da mutation ADD, a precondition deve provar a ausência da target exact Token Creator binding. Depois de qualquer tentativa de ADD — `exitCode=0`, `exitCode!=0` ou resultado indeterminado — deve existir reconciliation read-only antes de revogar a credencial humana. É proibido derivar `bindingAbsent=true` de `exitCode != 0`.

A reconciliation deve ler a IAM policy da target service account e procurar exatamente:

- member `user:<OPERATOR>`;
- role `roles/iam.serviceAccountTokenCreator`;
- condition title `admin_b2a5_inventory_impersonation_window`;
- condition description `Rotas V1.1 temporary inventory impersonation window`;
- condition expression com os `START_UTC` e `END_UTC` exatos deste run.

Classificar o resultado como `CONFIRMED_PRESENT_CREATED_BY_RUN`, `CONFIRMED_ABSENT` ou `INCONCLUSIVE`.

- Se ADD retornar `exitCode=0`, usar o bounded policy polling normatizado até confirmar `PRESENT`.
- Se ADD retornar `exitCode!=0`, não repetir a mutation; realizar reconciliation read-only. Se a exact binding estiver presente, classificar `REMOTE_EFFECT_AFTER_NONZERO_EXIT` e removê-la exatamente uma vez no cleanup. Se estiver comprovadamente ausente, classificar `CONFIRMED_ABSENT`. Se o read falhar, estiver malformed ou for inconclusivo, classificar `INCONCLUSIVE` e falhar fechado.

### Reporter fail-closed

`bindingsAbsentFinal=true` somente quando BOTH forem comprovadas por remote read: project binding absent e Token Creator binding absent. Nunca derivar ausência de mutation não executada, exit code não zero, exception ou cleanup path não alcançado. Se Token Creator absence não puder ser lida, `bindingsAbsentFinal=false` ou estado equivalente not-proven permitido pelo schema, e `baselineClassification=F`.

O reporter sanitizado desta execução deve contemplar os campos aprovados pelo bloco `POST-V1-ROTAS-V1.1-PRODUCTION-READONLY-BASELINE-TOKEN-CREATOR-FIX-AND-RETRY`, incluindo `tokenConditionSemanticallyValid`, `tokenConditionSha256`, `tokenCreatorPlannedArgvSemanticallyValid`, `tokenCreatorAddExitCode`, `tokenCreatorReconciliationResult`, `tokenCreatorBindingCreated`, `tokenCreatorBindingAbsentFinal` e `bindingsAbsentFinal`, sem operador, service account, condition payload bruto, argv sensível bruto, token, raw policy ou raw Firestore documents.

### Cleanup obrigatório após qualquer IAM mutation

Não revogar primeiro a autenticação humana se ainda forem necessárias reads para reconciliation ou cleanup. Após qualquer tentativa de IAM mutation, executar best-effort nesta ordem:

1. interromper ADC/Firestore, se iniciados;
2. revoke ADC, se criado;
3. reconcile Token Creator binding;
4. remover a Token Creator binding exata se comprovadamente criada pelo run;
5. provar Token Creator binding ausente;
6. reconcile project binding;
7. remover a project binding exata se criada pelo run;
8. provar project binding ausente;
9. disable service account se habilitada pelo run;
10. bounded observation até `disabled=true`;
11. confirmar `USER_MANAGED keys=0`;
12. remover condition artifacts pertencentes ao run;
13. somente então revogar a credencial humana;
14. confirmar auth `0/0`.

Mesmo se alguma reconciliation falhar, continuar best-effort nos passos independentes e classificar `baselineClassification=F`. Nenhuma mutation possui retry automático; o erratum de observação de propagação permanece aplicável às leituras bounded e ao retry congelado de ADC em `t+0`, `t+120` e `t+300` quando, e somente quando, seu gate específico for atendido.

## Rotas Admin V1.1 — erratum project binding argv e journal

Este erratum integra o contrato normativo da baseline read-only de produção. Preserva integralmente os contratos anteriores, inclusive o erratum Token Creator, e corrige exclusivamente a atomicidade do argv da project binding e a preservação monotônica de exit codes nativos já capturados.

### Project binding ADD — argv exato

A project binding temporária deve ser criada semanticamente como os seguintes argumentos lógicos separados:

1. `gcloud`;
2. `projects`;
3. `add-iam-policy-binding`;
4. `turismo-sms`;
5. `--member=serviceAccount:<TARGET_SERVICE_ACCOUNT_IN_MEMORY>`;
6. `--role=projects/turismo-sms/roles/adminB2A5InventoryRead`;
7. `--condition-from-file=<PROJECT_CONDITION_FILE>`;
8. `--account=<OPERATOR_IN_MEMORY>`;
9. `--quiet`.

O `PROJECT_ID` `turismo-sms` é argumento posicional único. Cada flag com valor deve chegar à CLI como um argumento lógico completo. É proibido entregar `"--member="` e `"serviceAccount:<target>"` como dois argumentos separados; o token deve ser semanticamente `"--member=serviceAccount:<target>"`. A mesma atomicidade é obrigatória para `--role=`, `--condition-from-file=` e `--account=`.

Não concatenar project, member, role e condition em uma única shell command string. Antes da mutation, validar localmente o argv planejado. Se qualquer token estiver partido ou divergente: `COMMAND_CONSTRUCTION_FAILURE` e parada antes da mutation.

### Project condition preservada

Usar exclusivamente `--condition-from-file=<PROJECT_CONDITION_FILE>`; condition inline permanece proibida. A project condition continua contendo semanticamente:

- `resource.name == "projects/turismo-sms/databases/(default)"`;
- `request.time >= timestamp("<START_UTC>")`;
- `request.time < timestamp("<END_UTC>")`.

O restante do contrato temporal permanece inalterado.

### Project binding REMOVE — argv exato

O cleanup deve usar semanticamente os seguintes argumentos lógicos separados:

1. `gcloud`;
2. `projects`;
3. `remove-iam-policy-binding`;
4. `turismo-sms`;
5. `--member=serviceAccount:<TARGET_SERVICE_ACCOUNT_IN_MEMORY>`;
6. `--role=projects/turismo-sms/roles/adminB2A5InventoryRead`;
7. `--condition-from-file=<MESMO_PROJECT_CONDITION_FILE>`;
8. `--account=<OPERATOR_IN_MEMORY>`;
9. `--quiet`.

Aplicar a mesma regra de argv atômico. São proibidos `--all`, member diferente, role diferente ou condition diferente.

### Token Creator preservado

O erratum Token Creator já publicado permanece integralmente vinculante e não é alterado. Continuam obrigatórios target service account posicional correto, `--member=user:<OPERATOR>`, `--role=roles/iam.serviceAccountTokenCreator`, `--condition-from-file=<TOKEN_CONDITION_FILE>`, `--project=turismo-sms`, `--account=<OPERATOR>` e `--quiet`, cada flag/value como um único argumento lógico.

### Journal de exit code monotônico

`CAPTURED_NATIVE_EXIT_CODE_IS_MONOTONIC=true`.

Quando uma chamada nativa retornar, capturar imediatamente:

```powershell
$capturedExitCode = $LASTEXITCODE
```

Depois que `exitCodeCaptured=true` e `exitCode=<integer>` forem registrados em memória/journal, nenhuma falha posterior pode converter esse valor em `INDETERMINATE`, `NOT_CAPTURED`, `null` ou apagar o valor. Falha de reporter, emissão de evento, serialização, pós-validação ou exception posterior deve possuir campo/categoria separada e não modifica o exit code já observado.

Para qualquer mutation nativa, a ordem obrigatória é:

1. registrar `invocationEntered=true`;
2. executar o comando;
3. capturar imediatamente `$LASTEXITCODE`;
4. registrar em estrutura in-memory `returned=true`, `exitCodeCaptured=true` e `exitCode=<valor>`;
5. somente depois executar report emission, post-validation, read-back, serialization ou instrumentação adicional.

Se a etapa 5 falhar, preservar integralmente as evidências das etapas 1–4.

`INDETERMINATE` fica reservado somente para situação em que realmente não seja possível saber se o processo nativo retornou ou se o código foi capturado. Não usar `INDETERMINATE` apenas porque pós-validação, reporter, binding ausente ou lógica posterior falhou. Exit code e efeito remoto permanecem separados; `exitCode=0` com `remoteEffect=CONFIRMED_ABSENT` é um estado válido e não autoriza reescrever o exit code.

### Reconciliation preservada

Exit code não prova efeito remoto. Após qualquer tentativa de ADD, read-back/reconciliation continua obrigatória e a mutation não é repetida automaticamente. Para project binding e Token Creator, preservar as classificações `CONFIRMED_PRESENT_CREATED_BY_RUN`, `CONFIRMED_ABSENT` e `INCONCLUSIVE` conforme seus contratos vigentes.

---

## Rotas Admin V1.1 — rollout PREP concluído em 2026-08-21

- Classificação: **A. ROLLOUT PREP COMPLETE**, restrita a Git/local e documentação.
- Topologia confirmada: `origin/main` e merge-base em `cc170862d4378229a7485f788b31308174032a6d`; feature alinhada em `8433a7232dd67ce4654bb6316192c2ca01b1dfff`; integração futura pode usar `git merge --ff-only` após revalidação.
- O release contém Admin UI/JS, endurecimento fail-closed de `firestore.rules`, testes e documentação. `storage.rules` permaneceu byte a byte idêntico; o portal público continua com fontes estáticas e não lê a collection `rotas`.
- Ordem recomendada: baseline remoto somente leitura; deploy isolado das Rules exatas; dry-run remoto com manifest; EXEC de dados autorizado separadamente; release/Admin smoke; adapter público somente depois.
- Seeds futuros são os seis IDs canônicos em `draft`; normalização preserva valores não canônicos e exige dry-run, aprovação humana e pós-verificação antes de qualquer write.
- Não houve produção, deploy, migração, merge ou alteração de `main`. Próximo bloco autorizado somente mediante novo comando literal: `POST-V1-ROTAS-V1.1-PRODUCTION-READONLY-BASELINE`.

---

## Rotas Admin V1.1 — CRUD local concluído e QA_LOCAL_ROTAS_PASS em 2026-08-21

- Bloco em execução: `POST-V1-ROTAS-V1.1-ADMIN-CRUD`, na branch isolada `feature/rotas-v1.1-admin-crud`, criada a partir de `cc170862d4378229a7485f788b31308174032a6d`. `main` não foi alterada.
- Implementados `js/admin/modules/rotas-helpers.js` e `js/admin/modules/rotas.js`: listagem ordenada, filtros, create/edit de rascunho, preview, publicar, despublicar, arquivar e ausência deliberada de hard delete.
- Associação N:N é calculada por diferença e escrita em `runTransaction`, somente nos documentos alterados de `cms_establishments.relationships.routeIds[]`; IDs secundários existentes são preservados.
- A capa é selecionada exclusivamente de `media_library`, persistida no shape mínimo `mediaId|url|path|alt`, e a exclusão na biblioteca agora bloqueia mídia referenciada por `rotas.cover` por ID, path ou URL.
- O alias `edit: openForm` corrigiu o Editar. Nas Rules, guards estruturais e o caminho relacional estreito corrigiram os blockers de expressão/propriedade, mantendo autorização de admin ativo e malformed fail-closed.
- Regressão final: testes Admin `8/8 PASS`; modelo/normalizador `29/29 PASS`; dry-run local sanitizado PASS; Firestore `212/212`; Storage `24/24`; total Rules `265/265`, sem failures/skips, exclusivamente no projeto demo/Emulator.
- `firestore.rules`, `storage.rules`, datasource público, mapas, HOME, busca e demais placeholders não foram alterados.
- **Classificação atual: A. ADMIN CRUD LOCAL CONCLUÍDO — `QA_LOCAL_ROTAS_PASS`.** O QA humano posterior validou o fluxo autenticado no Emulator, incluindo desktop/tablet/mobile e ausência dos blockers. Não houve fallback ou acesso à produção.
- A feature continua isolada e não integrada a `main`; rollout permanece pendente. Próximo passo autorizável: `POST-V1-ROTAS-V1.1-ROLLOUT-PREP`.

---

## Rotas Admin V1.1 — modelo, Rules e Emulator concluídos em 2026-08-13

- Bloco concluído: `POST-V1-ROTAS-V1.1-DATA-MODEL-RULES-AND-EMULATOR`.
- Classificação: **A. ROTAS V1.1 DATA MODEL + RULES READY — SCHEMA FROZEN, NORMALIZATION DETERMINISTIC, N:N PRESERVED, FIRESTORE RULES TESTED LOCALLY, ZERO PRODUCTION ACCESS, ADMIN CRUD READY TO IMPLEMENT**.
- Schema final de `rotas/{routeId}` congelado com ID imutável, slug mutável somente antes da primeira publicação, `draft|published|archived`, `displayOrder`, cover mínima, tags editoriais e auditoria completa. Hard delete negado e `archived` terminal.
- `firestore.rules` ganhou leitura pública somente de `published`, CRUD somente por admin com `ativo == true`, allowlist/tipos/lifecycle fail-closed e delete negado. Moderator e user não recebem write.
- `cms_establishments.relationships.routeIds[]` permanece como relação N:N. Um caminho estreito permite ao admin ativo atualizar somente `relationships` + auditoria de update, sem lookup dinâmico nem IDs canônicos hardcoded nas Rules.
- Normalizador/seed local: `scripts/lib/rotas-v1.1-model.mjs`; CLI sanitizado: `scripts/rotas-v1.1-normalize-dry-run.mjs`.
- Dry-run: 6 IDs canônicos; 67 documentos inspecionados; 58 relações canônicas antes; 2 aliases; 60 depois; 51 documentos relacionados; 9 multirrota; 11 agrupamentos não canônicos preservados; idempotência comprovada; 6 seeds futuros em `draft`; zero write.
- Testes: baseline legado `169/169`; modelo/normalizador `29/29`; Firestore final `203/203` (`145` legados + `50` Rotas + `8` relacionamentos); Storage `24/24`; total final `256/256`; zero falhas e zero skips.
- `storage.rules`, source público, datasource/fallback, HOME/mapas/local/busca/galeria, Admin UI e placeholder Rotas permaneceram inalterados.
- Produção intocada: Firestore/Storage/Auth remotos `false`; deploy `0`; `gcloud` `0`; IAM `0`; ADC `false`; documentos reais criados/alterados `0`.
- Requisito do próximo bloco: incluir referências de `rotas.cover` na detecção de mídia em uso antes de habilitar seleção/remoção de capa.
- `NEXT_BLOCK_READY = true`.
- Próximo bloco exato, não iniciado e dependente de autorização própria: `POST-V1-ROTAS-V1.1-ADMIN-CRUD`.

---

## Rotas Admin V1.1 — discovery concluído em 2026-08-13

- Bloco concluído: `POST-V1-ROTAS-V1.1-DISCOVERY-AND-DESIGN`.
- Classificação: **A. ROTAS V1.1 DISCOVERY COMPLETE — CURRENT MODEL MAPPED, CANONICAL SOURCE IDENTIFIED, SAFE ADMIN ARCHITECTURE DEFINED, IMPLEMENTATION READY**.
- `CURRENT_ROUTE_SOURCE_OF_TRUTH = MULTIPLE`: `js/data/rotas.js` é a lista editorial canônica de seis rotas; `js/rotas-data.js` duplica nomes/cores/ícones e mantém 47 empreendimentos com 56 relações; `js/locais-data.js` usa rótulos textuais que misturam rotas e agrupamentos.
- Relação comprovada N:N: `route` + `routes[]` no legado, com nove locais em duas rotas. O contrato CMS já possui `cms_establishments.relationships.routeIds[]`; essa é a estratégia principal futura.
- As seis rotas temáticas não possuem ordem de visita nem geometria. `js/roteiro-ia.js` tem roteiros ordenados separados, noindex e fora do escopo do CRUD temático.
- Decisão de escopo: **C. PRECISA DE ETAPA DE NORMALIZAÇÃO ANTES DO CRUD**, incorporada ao primeiro bloco e baseada em allowlist; não gerar rotas a partir de Centro, Eventos Anuais, Turismo de Fé ou outros textos.
- Modelo futuro mínimo: `rotas/{routeId}` com ID imutável, slug estável, conteúdo, cor, ícone, capa, `draft|published|archived`, ordem apenas de cards e auditoria. Sem `placeIds`, polylines, ordem de pontos, hard delete, página individual ou novo framework.
- Migração parcial estimada localmente: 6 documentos de rota e 60 relações canônicas em 51 documentos, compostas por 58 ocorrências já exatas e 2 aliases claros; 11 agrupamentos não canônicos ficam fora da allowlist e permanecem preservados como legado.
- Compatibilidade: datasource dinâmico com fallback estático somente em erro; fontes estáticas preservadas durante rollout; portal principal ainda precisa receber `routeIds[]`, filtro por rota, contagem e busca dinâmicas.
- Documento vinculante: `docs/plano-admin-rotas-v1.1.md`.
- Próximo bloco recomendado, não iniciado e dependente de autorização literal separada: `POST-V1-ROTAS-V1.1-DATA-MODEL-RULES-AND-EMULATOR`.
- Esse próximo bloco é estritamente local: schema, Rules, testes Emulator e transformador/dry-run. Não autoriza collection real, migração, deploy, Firestore/Storage remoto, Auth, gcloud ou IAM.

---

## HISTÓRICO — Painel Admin V1 — estado vinculante de 2026-08-13 — SUPERADO PELO CHECKPOINT DE 30/08/2026

- Bloco: `ADMIN-B2A8-ADMIN-PANEL-V1-RELEASE`.
- `ADMIN_PANEL_VERSION = 1.0.0`.
- `ADMIN_PANEL_V1_RELEASED = true`.
- `V1_RELEASE_DATE = 2026-08-13`.
- `CORE_PANEL_RELEASE_READY = true`.
- `ALPHA_BETA_PHASE = closed`.
- `FUTURE_MODULES_COMPLETE = false`.
- Dependências reconhecidas: `B2A5 = complete`; `B2A6 = complete`; `B2A7 = passed`, com classificação A, zero P0/P1 e recomendação vinculante de saída da fase Alfa/Beta.
- Núcleo operacional V1: Dashboard; Aprovações; Solicitações de vínculo; Gerenciar Vínculos; Usuários; Eventos; Notícias; Mídia; Banners / Pop-ups; Empreendimentos.
- Roadmap V1.x/pós-V1, preservado como **Em preparação**: Rotas; Galeria; Configurações; Sazonal / Clima; Mascote; Logs / Auditoria. Um módulo em preparação não torna o núcleo V1 um produto Beta.
- `Master = cosmeticOnly` permanece verdadeiro nos placeholders: não existe role, custom claim ou enforcement master real.
- P3 anterior `logout messaging`: **RESOLVED**. O logout voluntário preserva o fluxo aprovado e informa `Sessão encerrada.`; expiração de sessão continua com mensagem própria.
- Nenhuma feature futura, collection, persistência, schema, role, claim, Firestore Rule ou Storage Rule integra este release.

---

## HISTÓRICO — Estado vinculante do ADMIN-B2A5/B2A6 — 2026-08-13 — SUPERADO PELO CHECKPOINT DE 30/08/2026

- `B2A5_OPERATIONAL_FLOW_COMPLETE = true`. Classificação final: **A. INVENTORY CONCLUÍDO E AUTH-REVOKE COMPLETO — B2A5 OPERACIONAL ENCERRADO EM ESTADO FAIL-CLOSED**.
- Inventário agregado de `usuarios`: total `11`; `admin = 3`; `moderator = 0`; `user = 8`; `ativo` boolean `true = 11/11`; `administrativeProfilesRequiringEvaluation = 0`; `dataQualityDocumentsRequiringReview = 0`; todas as invariantes `true`. Não há migração corretiva de `role` ou `ativo` antes do hardening.
- Estado de segurança final herdado e não revalidado remotamente neste bloco: ADC ausente; bindings temporárias de Token Creator e projeto ausentes; conditions removidas; service account desabilitada; chaves `USER_MANAGED = 0`; autenticação humana Google Cloud CLI `0/0`; escritas Firestore durante B2A5 `0`; Storage não acessado; Rules não alteradas durante B2A5.
- `ADMIN-B2A6-AUTHORIZATION-RULES-HARDENING-LOCAL` concluído localmente com classificação **A. AUTHORIZATION RULES HARDENED LOCALLY**: Firestore e Storage exigem `usuarios/{uid}.ativo == true` estrito para gates administrativos/staff; `role` continua limitada a `admin`, `moderator` e `user`; `moderator` existente foi preservado sem ampliação de privilégio.
- `validUserAuthorizationProfile(request.resource.data)` protege o estado futuro de create/update em `usuarios`: role válida e `ativo is bool`. Self-create continua restrito a `role = user` e `ativo = true`; self-update continua limitado a `nome`, `telefone`, `tipo` e `organizacao`; autoelevação e perfis malformados são negados.
- Baseline pré-edição: Firestore Rules `87/87`. Validação final local no projeto demo `demo-turismo-sms-rules-test`: Firestore `145/145` em 6 suítes e Storage `24/24` em 2 suítes, zero fail/skipped/cancelled/todo. O Storage Emulator comprovou a arquitetura cross-service `firestore.get(...)`.
- `ADMIN-B2A6-AUTHORIZATION-RULES-DEPLOY` concluído em produção com classificação **A. B2A6 SECURITY RULES DEPLOYED TO PRODUCTION**. A autenticação Firebase CLI foi recuperada manualmente pelo humano e confirmada por `firebase login:list`/`firebase projects:list`; este bloco não executou login ou logout. Storage Rules foram publicadas em `2026-08-13T17:11:06Z` e Firestore Rules em `2026-08-13T17:11:38Z`, ambas com exit code `0`, projeto explícito `turismo-sms` e sem IAM adicional.
- Source implantado: HEAD `f99305ec2e88cabc9d34e417b84b5a15c93531e2`; `firestore.rules` SHA-256 `58716622eb09d79b7b49e776d2806660f55c02cd1044dcd3caf4fd1402257050`; `storage.rules` SHA-256 `2f3f58d0af112c2938775a9fe434ba5f0814bbad3855276af863da8ad8e4241c`. Evidência pré-deploy reutilizada: Firestore `145/145`, Storage `24/24`, total `169/169`, zero falhas/skips.
- Smoke anônimo em produção passou após espera de propagação de 35 segundos: `noticias` publicadas e `cms_establishments` publicados permitidos; query ampla de `noticias`, `media_library` e fallback desconhecido negados; Storage privado retornou `storage/unauthorized`. `B2A6_RULES_DEPLOYED_TO_PRODUCTION = true`; production data writes `0`; user migrations `0`; Firebase Auth user mutations `0`; IAM mutations `0`; gcloud calls `0`; ADC `false`; Hosting e GitHub Pages não alterados.
- Próximo bloco recomendado: `ADMIN-B2A7-ADMIN-PANEL-PRODUCTION-QA`, não iniciado e dependente de autorização literal separada.

## HISTÓRICO — Estado então atual resumido — SUPERADO PELO CHECKPOINT DE 30/08/2026

**Projeto:** SITE-TURISMO-SMS  
**Área atual de trabalho:** Painel Admin, CMS e Firebase — Authentication, Firestore, Storage, moderação, segurança e integridade dos fluxos administrativos.

**Ferramenta adotada:** Codex. O Claude Fable não será usado nesta frente.

**Nota de leitura:** o parágrafo histórico `Status geral` abaixo preserva a cronologia anterior e está integralmente superado pelo estado vinculante de 2026-08-13; ele não representa pendência operacional nem autoriza retomar o B2A5.

**Status geral:** `ADMIN-B2A3-PREP/EXEC`, `ADMIN-B2A4-PREP/EXEC`, `ADMIN-B2A5-PREP`, `ADMIN-B2A5-INVENTORY-PREP`, `ADMIN-B2A5-INVENTORY-TOOL-PREP`, `ADMIN-B2A5-INVENTORY-TOOL-ROOT-RECOVERY-AND-ISOLATION-PREP`, `ADMIN-B2A5-INVENTORY-TOOL-ISOLATED-EXEC` e `ADMIN-B2A5-INVENTORY-AUTH-PREP` concluídos. A ferramenta isolada foi classificada como **A. VALIDADO LOCALMENTE**, recebeu 102/102 testes, preservou a regressão das Rules em 87/87 e foi enviada para `origin/main` no commit `1102741201d4858b55a7145570568856f6859573`. O `ADMIN-B2A5-INVENTORY-AUTH-PREP` foi concluído em 2026-07-31 apenas como análise e pesquisa documental oficial, com as sete decisões humanas recebidas e parecer final **A**, e está versionado no commit `95c13039712d8794e80a446144a9873f60f455b4`. O `ADMIN-B2A5-INVENTORY-AUTH-SEQUENCING-ADJUSTMENT`, também em 2026-07-31 e também apenas documental, substituiu o AUTH-EXEC monolítico por PROVISION e ACTIVATION separados, para que nenhuma binding fique ativa aguardando revisão e commit; parecer **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP**. O `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP` foi concluído em 2026-07-31, também apenas por pesquisa oficial e análise, com parecer intermediário **B**: identificadores, textos, stage `GA`, ordem de criação, consistência eventual, colisões, provas negativas, saída sanitizada e rollback ficaram definidos. O `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-DECISION`, na mesma data e também exclusivamente documental, incorporou a decisão humana **fail-closed** de ancestralidade, corrigiu os limites de `displayName`/`description` da conta e a descrição do Policy Troubleshooter, e elevou o parecer a **A**; o `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-FINAL-CORRECTIONS`, ainda na mesma data, fechou as duas lacunas bloqueantes restantes — permissões condicionais de pasta e organização e acesso indireto por `group:`/`domain:`; o `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-SCOPE-CORRECTION`, em 2026-08-02, corrigiu o tratamento de `domain:` e delimitou a prova a Firestore/Datastore, impersonação e bindings criadas pelo fluxo, retirando qualquer afirmação de zero acesso global; o `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-PROMPT-FINALIZATION`, na mesma data, tornou obrigatórios os atributos completos na criação, especificou a classificação operacional do EXEC e renomeou dois campos de resultado que sugeriam testes remotos inexistentes; o `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-OPERATOR-PERMISSIONS-FINALIZATION`, ainda na mesma data, incorporou `iam.roles.create`, `iam.serviceAccounts.create` e as permissões de leitura e chaves faltantes, criou o gate pré-mutação do operador e separou gates pré-mutação de verificações pós-criação; o `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-RESOURCE-PERMISSIONS-FINALIZATION`, também na mesma data, corrigiu o escopo de recurso do `testIamPermissions`, retirou do gate de projeto as permissões que só existem sobre recursos ainda inexistentes e separou os três estados de comprovação; e o `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-REST-TRANSPORT-FINALIZATION`, ainda na mesma data, definiu os endpoints REST oficiais como mecanismo executável dos quatro `testIamPermissions`, separou o access token OAuth temporário do operador humano dos tokens permanentemente proibidos, acrescentou `serviceusage.services.use` ao gate pré-mutação do projeto e fechou o bootstrap fail-closed da primeira chamada. O parecer final permanece **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC**. O `ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-PREP` foi concluído em 2026-08-03, também exclusivamente por pesquisa oficial, verificação local somente leitura e atualização documental, com parecer **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-EXEC**: o preflight comprovou que a Google Cloud CLI **não está instalada** e que **nenhum operador está autenticado**, de modo que instalação da CLI e login humano passam a ser um bloco próprio anterior ao PROVISION-EXEC. O `ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-EXEC` foi autorizado e executado **parcialmente** em 2026-08-03: instalou a Google Cloud CLI 578.0.0 em escopo single-user, com assinatura válida e instalador removido, e **parou fail-closed antes do login** sob a falha `isolatedConfigUnverified`, porque `%APPDATA%\gcloud` — comprovadamente ausente no preflight — passou a existir após a instalação e as primeiras execuções locais. O `ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-ISOLATION-REPAIR-PREP`, na mesma data e exclusivamente por pesquisa oficial, análise local somente leitura e atualização documental, definiu o contrato do reparo com parecer **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-ISOLATION-REPAIR-EXEC**, mantido pelo `ISOLATION-REPAIR-PREP-PATH-FINALIZATION` e pelo `ISOLATION-REPAIR-PREP-LOCAL-NETWORK-FINALIZATION`, que fixou os quatro controles processuais da CLI, o wrapper único, a allowlist fechada de comandos locais e a correção das afirmações absolutas de rede. O `ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-ISOLATION-REPAIR-EXEC` foi **concluído em 2026-08-04** com classificação **A. STORES LOCAIS ATRIBUÍDOS AO SDK E COMPROVADAMENTE VAZIOS; ISOLAMENTO DA GOOGLE CLOUD CLI REPARADO SEM LOGIN**: a janela de `2026-08-03T18:13:46Z` a `18:13:57Z` foi reconciliada como pertencente ao próprio EXEC anterior, o banco de metadata antes ambíguo foi atribuído ao SDK como `sdkManagedLocalMetadataNoCredentials`, os credential stores e os access-token caches dos dois diretórios foram atribuídos ao SDK e comprovados vazios, o diretório padrão foi removido e não reapareceu, e o diretório isolado foi recriado vazio com caminho comprovado pelo campo oficial. Essa classificação **substitui** as classificações **C** anteriores, preservadas como histórico correto das paradas fail-closed anteriores às evidências adicionais. O `ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-LOGIN-PREP` foi **concluído em 2026-08-04**, também exclusivamente por pesquisa oficial, verificação local somente leitura e atualização documental, com parecer **B. PRONTO COM DECISÃO HUMANA PENDENTE**: comando único, operador em memória, autorização literal, isolamento pré-login, wrappers separados, fluxo humano de navegador, separação de ADC, gates pós-login, rollback por `gcloud auth revoke` e saída sanitizada ficaram integralmente definidos, restando uma única decisão humana — o limite temporal da persistência da credencial da CLI. O `ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-LOGIN-PREP-DECISION`, ainda em 2026-08-04 e também exclusivamente documental, recebeu os sete parâmetros vinculantes do operador — 60 minutos sem progresso material, 8 horas absolutas, revogação imediata em qualquer dos limites, `AUTH-REVOKE` antes de pausa ou encerramento, Codex como responsável primário, operador humano como subsidiário e novo `LOGIN-EXEC` na retomada — e elevou o parecer a **A. PRONTO PARA ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-LOGIN-EXEC**, com prompt-ready produzido. O `ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-LOGIN-EXEC` foi então **autorizado e interrompido fail-closed antes do OAuth** em 2026-08-04, sob a falha `gcloudExecutableNotLocated`: autorização literal recebida, operador em memória, política de persistência reconhecida, diretório isolado íntegro, diretório padrão ausente, zero indicadores de credencial — e `loginStarted = false`, `loginCompleted = false`, `browserFlowUsed = false`, `rollbackRequired = false`. **Nenhum prazo de credencial foi iniciado e nenhum `AUTH-REVOKE` é necessário nesse estado.** O `ADMIN-B2A5-INVENTORY-AUTH-CLI-EXECUTABLE-RECOVERY-PREP`, ainda em 2026-08-04 e exclusivamente por diagnóstico local somente leitura, pesquisa oficial e atualização documental, concluiu que **a premissa do bloco não se confirmou**: a instalação da Google Cloud CLI **578.0.0 está presente, completa e íntegra** no caminho esperado — 49.054 arquivos, componentes completos por manifest, Python empacotado 3.14.6, `uninstaller.exe`, entrada única de desinstalação em `HKCU`, zero pontos de reparse e nenhuma instalação alternativa nos escopos varridos. A falha foi de **detecção**, não de ausência, e **nenhuma recuperação de instalação é necessária**. Parecer **B**, elevado a **A** pelo `ADMIN-B2A5-INVENTORY-AUTH-CLI-EXECUTABLE-RECOVERY-PREP-DECISION` da mesma data, que aprovou a **opção A**: `RECOVERY-EXEC` **cancelado**, instalação 578.0.0 e Python 3.14.6 preservados, classificação definitiva `present-and-complete` e contrato corretivo de detecção do executável tornado vinculante para um **novo** `LOGIN-EXEC`, que exige nova autorização literal — a anterior não pode ser reutilizada. O **novo `ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-LOGIN-EXEC` foi então concluído com sucesso em 2026-08-04**, classificação **A. LOGIN ISOLADO CONCLUÍDO, OPERADOR AUTENTICADO E ESTADO COMPROVADO**, em uma única chamada humana, com `loginExitCode = 0`, uma conta credentialed e ativa correspondente ao operador, isolamento comprovado antes e depois, zero ADC, zero projeto, zero impersonação e credencial preservada deliberadamente para a cadeia. O `ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-LOGIN-GOVERNANCE`, porém, só foi iniciado em **2026-08-05** e, antes de qualquer edição, constatou que os limites de **60 minutos** e **8 horas** estavam vencidos (≈18,12 horas após o login): a governança **parou fail-closed**, nenhum arquivo foi alterado, nenhum novo deadline foi derivado e a classificação passou a ser revogação obrigatória. O `ADMIN-B2A5-INVENTORY-AUTH-REVOKE-EXPIRED-LOGIN` foi **concluído em 2026-08-05** com classificação **A. CREDENCIAL HUMANA EXPIRADA REVOGADA NO SERVIDOR E REMOVIDA DA CONFIGURAÇÃO ISOLADA; ESTADO ZERO COMPROVADO** — revogação executada exatamente uma vez, exit code 0, zero contas credentialed e ativas depois, zero ADC, instalação 578.0.0 e diretório isolado preservados. **Estado atual: não existe credencial humana ativa e nenhum prazo está correndo.** O pacote npm raiz permanece intacto e sem Firestore. Nunca foram executados `AUTH-PROVISION-EXEC`, `ACTIVATION-EXEC` ou `INVENTORY-EXEC`, portanto não existe custom role, conta de serviço, binding, policy, ADC ou chave criada por esta cadeia; IAM, acesso remoto a dados, inventário real, migração e publicação não foram iniciados e produção permanece com o último ruleset publicado. Qualquer retomada exige um **novo `LOGIN-EXEC`** com autorização literal própria.

**Atualização operacional de 2026-08-07 — estado atual:** o `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-GOVERNANCE-RESUME` foi retomado e concluído. O projeto `turismo-sms` permaneceu `ACTIVE`, com fingerprint exato e `serviceusage.googleapis.com`, `iam.googleapis.com` e `iamcredentials.googleapis.com` habilitadas. O custom role `adminB2A5InventoryRead` foi revalidado como existente, `GA`, não excluído, com title/description exatos e somente `datastore.entities.get` e `datastore.entities.list`; hash semântico `1eddae03e588fbee46821c518c2f74b25530e2a81d627570cb942bed46a221f7`. A service account `admin-b2a5-inventory-reader` foi revalidada com metadata exata, habilitada e com zero chave `USER_MANAGED`. A leitura oficial da CLI, analisada por `System.Text.Json.JsonDocument`, confirmou na policy própria: `bindingsPropertyPresent = false`, `bindingsIsNull = false`, `bindingsArrayCount = 0`, `materialBindingCount = 0` e `policyShapeUnexpected = false`. A prova delimitada da policy de projeto confirmou zero binding para a service account alvo e zero binding usando o custom role; isso não afirma zero bindings globais. O falso positivo anterior permanece classificado como `FALSE_POSITIVE_PARSER`, sem remediation IAM. O provisionamento está agora formalmente governado e continua distinto de ativação: nenhuma binding foi concedida ou removida, nenhum papel foi atribuído e Firestore, Storage e inventário não foram acessados. A credencial humana permanece ativa somente na configuração isolada para continuidade imediata, com zero ADC, projeto persistido, impersonação e access-token file; o diretório padrão permanece ausente.

**Atualização operacional posterior de 2026-08-07 — registro histórico superado pelo resequencing abaixo:** o `ADMIN-B2A5-INVENTORY-AUTH-ACTIVATION-PREP-OFFLINE` foi concluído local e documentalmente com classificação **A. ACTIVATION-PREP-OFFLINE CONCLUÍDO — CONTRATO, ADC ISOLADO, CONDITIONS, ROLLBACK E TRÊS PROMPTS PRONTOS; ESTADO ZERO; PRONTO PARA NOVO LOGIN**. A sessão humana anterior foi revogada antes deste bloco; o preflight e o encerramento confirmaram zero contas credentialed/ativas, zero ADC, projeto, impersonação e access-token file, diretório padrão ausente e nenhum deadline ativo. Não houve login, OAuth, chamada remota Google Cloud, mutação IAM, acesso a Firestore/Storage/Logging ou inventário. O gate local da ferramenta passou em 102/102, zero skipped, somente no Firestore Emulator.

**Atualização operacional final de 2026-08-07 — estado corrente e vinculante:** o `ADMIN-B2A5-INVENTORY-AUTH-ACTIVATION-WINDOW-RESEQUENCING-PREP` corrigiu exclusivamente em documentação a corrida `TIMESTAMP_HANDOFF_RACE`. A tentativa anterior de `ACTIVATION-EXEC` começou aproximadamente 85 segundos depois do prazo transferido e terminou antes da primeira mutação: zero binding de projeto, zero Token Creator, zero ADC, zero impersonação, zero Firestore, zero Storage, zero inventário e zero mutação IAM. A janela `2026-08-08T02:18:00Z` → `2026-08-08T04:18:00Z` e o prazo `2026-08-08T02:23:00Z` estão definitivamente invalidados e não podem ser reutilizados. A janela de 7200 segundos passa a ser materializada somente dentro do futuro `ACTIVATION-EXEC`, após autorização humana literal, depois dos gates read-only e imediatamente antes da primeira mutação. O estado local permanece zero; a revogação local anterior removeu a credencial, mas retornou exit code 1, portanto `serverSideRevocationStatus = INCONCLUSIVE` e o próximo login fica bloqueado até prova humana/oficial separada de revogação server-side.

**Atualização operacional de 2026-08-08 — estado corrente e vinculante:** o `ADMIN-B2A5-INVENTORY-AUTH-ADC-ISOLATION-CORRECTION-PREP` corrigiu exclusivamente o contrato local/documental de isolamento ADC, após a tentativa mais recente de `ACTIVATION-EXEC` parar antes de qualquer chamada `gcloud`, chamada remota, timestamp, binding ou ADC sob `CLOUDSDK_CONFIG_PRECEDES_APPDATA`. A configuração dedicada `%LOCALAPPDATA%\Google\CloudSDK\admin-b2a5-config` passa a ser `B2A5_GCLOUD_CONFIG` e o container canônico do ADC temporário; `B2A5_ADC_PATH = %LOCALAPPDATA%\Google\CloudSDK\admin-b2a5-config\application_default_credentials.json`. Credenciais da CLI e ADC continuam conceitualmente distintas embora residam sob a mesma raiz B2A5. A árvore `%LOCALAPPDATA%\Google\CloudSDK\admin-b2a5-activation\AppData\gcloud\application_default_credentials.json` e a alternativa `ActivationRoot\gcloud-config\application_default_credentials.json` estão invalidadas para este fluxo. A prova local, sem autenticação e sem abrir arquivos, confirmou configuração e ADC B2A5 fora do repositório, `B2A5_ADC_PATH` ausente, ADC padrão ausente, caminho antigo ausente e `GOOGLE_APPLICATION_CREDENTIALS` ausente. A pausa humana invalida toda âncora, deadline e timestamp anterior; nenhum novo prazo foi criado. Classificação: **A. ADC ISOLATION CORRIGIDO — CONFIGURAÇÃO B2A5 ISOLADA PASSA A SER O CONTAINER CANÔNICO DO ADC TEMPORÁRIO; WEB FLOW ADC GOVERNADO; QUATRO PROMPTS ATUALIZADOS; PRONTO PARA NOVA RETOMADA OPERACIONAL.**

**Atualização operacional de 2026-08-10 — estado corrente e vinculante:** o `ADMIN-B2A5-INVENTORY-AUTH-ADC-INVOCATION-CORRECTION-PREP` incorporou a forense da tentativa operacional posterior. As duas bindings temporárias chegaram a ser criadas e validadas; o OAuth do ADC retornou HTTP 200, mas a Google Cloud CLI 578.0.0 encerrou localmente com `google.auth.exceptions.InvalidValue` e mensagem sanitizada `None could not be converted to bytes` antes de `DumpImpersonatedServiceAccountToADC`. `ADC_FAILURE_ROOT_CAUSE = GCLOUD_578_POSITIONAL_ACCOUNT_WITH_IMPERSONATION_LOCAL_VALIDATION_FAILURE`; IAM Credentials API e `GenerateAccessToken` não foram chamados, logo `IAM_PROPAGATION_CAUSED_THIS_INCIDENT = false`. O rollback removeu as duas bindings, deixou ADC ausente, zero chave `USER_MANAGED`, zero Firestore/Storage/inventário e desabilitou a service account; a credencial humana foi revogada depois, com estado local `0/0`. A invocation futura remove obrigatoriamente o `ACCOUNT` posicional e usa `gcloud auth application-default login --impersonate-service-account=TARGET_SA_EMAIL_IN_MEMORY --configuration=default`. A retomada exige nova sessão humana governada e o novo bloco autônomo `ADMIN-B2A5-INVENTORY-AUTH-SERVICE-ACCOUNT-REENABLE-EXEC` antes do FINALIZATION, todos com autorizações literais próprias.

**Atualização operacional posterior de 2026-08-10 — estado corrente e vinculante:** o `ADMIN-B2A5-INVENTORY-AUTH-ACTIVATION-COLLISION-GATE-SYNTAX-CORRECTION-PREP` comprovou que a tentativa mais recente parou antes de materializar START/END por uma falha local na implementação ad-hoc do gate de colisão. O trecho gerado combinava duas invocações de `Test-Path` sem delimitar as expressões: `if (Test-Path ... -or Test-Path ...)`. Embora `Parser.ParseInput` aceite esse texto, a execução liga os dois `-LiteralPath` à mesma chamada e produz `System.Management.Automation.ParameterBindingException`/`ParameterAlreadyBound`; não é `ParserError`. O prompt versionado não continha o trecho defeituoso, mas também não especificava um gate executável, portanto foi fortalecido com loop explícito, null-safe, `Test-Path -LiteralPath`, parser obrigatório e escrita posterior sem overwrite. O trecho canônico passou com `parseErrorCount = 0` e 7/7 casos tanto no PowerShell 7.6.3 quanto no Windows PowerShell 5.1. O estado fail-closed herdado permanece: service account desabilitada, zero chave `USER_MANAGED`, zero bindings temporárias, zero ADC, credencial humana local `0/0`, Firestore/Storage não acessados e inventário não executado. Nenhuma nova tentativa operacional foi iniciada.

**Atualização operacional final de 2026-08-10 — estado corrente e vinculante:** o `ADMIN-B2A5-INVENTORY-AUTH-IAM-POLICY-PARSER-WRAPPER-CORRECTION-PREP` comprovou que o último `SERVICE-ACCOUNT-REENABLE-EXEC` parou no wrapper local, depois da leitura da own policy e antes de qualquer enable. O source ad-hoc continha `return[pscustomobject]@` sem separação; `Parser.ParseInput` aceitava o texto com zero erro, mas o runtime tentou resolver esse token como comando e lançou `System.Management.Automation.CommandNotFoundException`. A causa é `F. SCRIPTBLOCK_OR_WRAPPER_COMPOSITION_ERROR`, não falha do IAM nem do JSON. O contrato agora versiona `Get-B2A5IamPolicyShape`, proíbe wrapper ad-hoc e JSON remoto embutido em source, exige código/dados separados, reutiliza o mesmo parser para own e project policy e exige syntax gate mais runtime sintético. O source canônico passou com zero parse errors no Windows PowerShell 5.1 e PowerShell 7.x; os 12 casos estruturais e os seis casos de filtro passaram em ambos. `bindings` ausente continua sendo shape esperado e zero material binding; `bindings = null`, root/tipo inválido, JSON inválido ou binding malformada são fail-closed. O estado Cloud permanece apenas por handoff: service account desabilitada, zero chave `USER_MANAGED`, zero bindings temporárias, zero ADC e credencial humana local `0/0`; nenhuma nova leitura remota foi feita.

**Atualização operacional de 2026-08-13 — estado corrente e vinculante:** o `ADMIN-B2A5-INVENTORY-AUTH-LOGIN-EXITCODE-WRAPPER-RECOVERY-PREP` reconciliou o estado local isolado como `A2_ALREADY_ZERO`: contas credentialed/ativas `0/0`, `core/account` ausente, zero projeto, impersonação e access-token file, ADC B2A5/padrão ausentes e `GOOGLE_APPLICATION_CREDENTIALS` ausente; por isso nenhum revoke foi executado. A forense da invocation de 2026-08-10 comprovou no evento local `.NET Runtime` 1026 que o `pwsh.exe` encerrou por `System.Management.Automation.PSInvalidOperationException` não tratada: os handlers PowerShell de `OutputDataReceived`/`ErrorDataReceived` foram chamados por `AsyncStreamReader` em thread sem Runspace. `wrapperExitCode = -532462766` (`0xE0434352`) pertence ao host CLR; `historicalGcloudLoginExitCode = INDETERMINATE` e o estado histórico `1/1` não pode promovê-lo a zero. O LOGIN-EXEC futuro usa exclusivamente o source canônico abaixo: call operator direto e cópia imediata de `$LASTEXITCODE`, sem `System.Diagnostics.Process`, handlers assíncronos, nested PowerShell, job, runspace ou captura textual complexa. O source teve zero parse errors e runtime sintético 6/6 no Windows PowerShell 5.1.26100.9168 e PowerShell 7.6.3. O IAM policy parser 14/14 + 6/6, collision gate 7/7, invocation ADC sem operador posicional e janela diferida de 7200 segundos permanecem inalterados. Próximo bloco: `ADMIN-B2A5-INVENTORY-AUTH-RESUME-LOCAL-STATE-CHECK`, não iniciado e dependente de autorização humana própria.

**Frentes pausadas:** site público, V7C1, V7C2, V6, B3 público, otimização de mídia pública, integração CMS → site público e tarefas preparadas para Claude Fable.

**Regra principal:** tratar site público, Painel Admin/CMS e Portal do Usuário como sistemas separados. Não misturar refatoração ou execução entre eles sem bloco e autorização específicos.

---

## HISTÓRICO — Próximo passo então recomendado — SUPERADO PELO CHECKPOINT DE 30/08/2026

**Executar o próximo bloco `ADMIN-B2A7-ADMIN-PANEL-PRODUCTION-QA` somente com autorização literal separada.**

- B2A5 permanece encerrado e `B2A6_RULES_DEPLOYED_TO_PRODUCTION = true`; não iniciar novo login, IAM, ADC, inventário, migração ou novo deploy de Rules.
- B2A7 deve avaliar o Painel Admin em produção como produto real, sem inferir autorização para mutações fora do bloco que vier a ser aprovado.
- Não iniciar autenticação ou módulos novos automaticamente a partir deste documento.

### Registro histórico: source canônico do executor/capturador do LOGIN-EXEC do B2A5 encerrado

Esta seção é histórico auditável e não autoriza nova execução. O B2A5 está operacionalmente encerrado; qualquer texto futuro abaixo pertence ao fluxo anterior e está superado pelo estado vinculante de 2026-08-13.

```powershell
# B2A5_LOGIN_EXECUTOR_SOURCE_BEGIN
$LoginStartedAtUtc = [DateTimeOffset]::UtcNow
& $GcloudPath auth login $Operator --brief --configuration=default
$LoginExitCode = $LASTEXITCODE
$LoginReturnedAtUtc = [DateTimeOffset]::UtcNow

if ($null -eq $LoginExitCode) {
    throw "B2A5_GCLOUD_LOGIN_EXITCODE_NOT_CAPTURED"
}

if ($LoginExitCode -ne 0) {
    throw "B2A5_GCLOUD_LOGIN_NONZERO_EXIT"
}
# B2A5_LOGIN_EXECUTOR_SOURCE_END
```

Ordem vinculante: timestamp pré-login → chamada direta → cópia imediata de `$LASTEXITCODE` → timestamp pós-retorno → pós-validação local por `auth list`/config → somente então `loginCompleted = true` e `loginCompletedAtUtc` materializado. `LOGIN-GOVERNANCE` permanece bloqueado se o exit code não for capturado, ficar indeterminado ou for diferente de zero; conta local `1/1` nunca substitui o exit status da invocation.

### PROVISION-GOVERNANCE retomada e concluída — 2026-08-07

- **Classificação:** **A. PROVISION-GOVERNANCE RETOMADA E CONCLUÍDA — RECURSOS REVALIDADOS, POLICY PRÓPRIA SEM BINDING MATERIAL, DOCUMENTAÇÃO PUBLICADA, CREDENCIAL ATIVA E ACTIVATION-PREP HABILITADO.**
- **Estado provisionado:** projeto exato e `ACTIVE`; três APIs habilitadas; custom role íntegro e sem binding; service account íntegra, habilitada, sem chave `USER_MANAGED`, sem binding material na policy própria e sem papel de projeto concedido pelo fluxo.
- **Parsing corrigido aplicado:** leitura oficial da CLI sob configuração isolada; `System.Text.Json.JsonDocument`; `bindings` ausente tratado estruturalmente como zero grants, sem array-subexpression ou truthiness.
- **Escopo negativo:** bindings criadas = `0`; bindings removidas = `0`; mutações IAM = `0`; Firestore acessado = `false`; Storage acessado = `false`; inventário executado = `false`.
- **Separação obrigatória — registro histórico:** provisionamento não é ativação. Naquele checkpoint, o próximo bloco era `ADMIN-B2A5-INVENTORY-AUTH-ACTIVATION-PREP`; o próximo gate corrente é o de revogação server-side descrito acima.

### ADMIN-B2A5-INVENTORY-AUTH-ACTIVATION-WINDOW-RESEQUENCING-PREP — concluído em 2026-08-07

#### Escopo, estado e fontes oficiais

- Natureza: correção offline, exclusivamente documental e sem autenticação. IAM mutations = `0`; Firestore accessed = `false`; Storage accessed = `false`; inventory executed = `false`; deadlines ativos = nenhum.
- Git inicial: `main`, HEAD `9403cba0a3029522a2a4d1094d4e6ba70273917e`, índice vazio, zero alteração rastreada, nenhuma operação Git ativa e `origin/main...main = 0/0` após `git fetch origin`. Os três itens locais protegidos permaneceram fechados, intocados e fora do stage.
- Estado zero inicial: `credentialedAccountCount = 0`, `activeAccountCount = 0`, `adcDetected = false`, `projectConfigured = false`, `impersonationConfigured = false`, `accessTokenFileConfigured = false` e `GOOGLE_APPLICATION_CREDENTIALS` ausente.
- A última tentativa de `ACTIVATION-EXEC` recebeu `START_UTC = 2026-08-08T02:18:00Z`, `END_UTC = 2026-08-08T04:18:00Z` e `ACTIVATION_MUST_START_BY_UTC = 2026-08-08T02:23:00Z`, mas iniciou em `2026-08-08T02:24:25.317Z`, aproximadamente 85 segundos tarde. Resultado: **B. JANELA EXPIROU ANTES DA PRIMEIRA MUTAÇÃO — ZERO IAM MUTATION**. Os três timestamps estão definitivamente invalidados e não podem ser reutilizados.
- Diagnóstico: o desenho `LOGIN → FINALIZATION → materializar START/END → handoff humano → autorização ACTIVATION → outro turno` introduziu latência entre a materialização e a primeira mutação. `TIMESTAMP_HANDOFF_RACE = true`; não foi falha IAM, OAuth, permissão ou ADC.
- Revogação: a credencial local foi removida e o estado `0/0` foi comprovado, mas `gcloud auth revoke` retornou exit code 1. Portanto `localCredentialStateZero = true`, `serverSideRevocationConfirmed = false` e `serverSideRevocationStatus = INCONCLUSIVE`. Este PREP não tenta resolver a incerteza.
- Fontes oficiais reconfirmadas: [project add binding](https://docs.cloud.google.com/sdk/gcloud/reference/projects/add-iam-policy-binding), [project remove binding](https://docs.cloud.google.com/sdk/gcloud/reference/projects/remove-iam-policy-binding), [Firestore IAM por database](https://docs.cloud.google.com/firestore/native/docs/manage-databases), [IAM Conditions attributes](https://docs.cloud.google.com/iam/docs/conditions-attribute-reference), [service-account add binding](https://docs.cloud.google.com/sdk/gcloud/reference/iam/service-accounts/add-iam-policy-binding) e [service-account remove binding](https://docs.cloud.google.com/sdk/gcloud/reference/iam/service-accounts/remove-iam-policy-binding). Elas confirmam `request.time >= timestamp(...)`, `request.time < timestamp(...)`, composição por `&&`, `resource.name` por database e condition/`--condition-from-file` nos quatro comandos add/remove.

#### Conditions canônicas e armazenamento

- O projeto aceita `serviceAccount:` como principal, custom role de projeto e condition com `expression`, `title` e `description`. O database `(default)` é ID oficial válido e seu resource name é `projects/turismo-sms/databases/(default)`.
- `request.time >= timestamp(...)`, `request.time < timestamp(...)` e a conjunção `&&` são oficialmente suportados. Os timestamps reais continuam proibidos neste PREP.
- Mecanismo escolhido: dois arquivos JSON em `--condition-from-file`, criados somente no `ACTIVATION-EXEC`, fora do repositório. Cada arquivo terá SHA-256 registrado, será reutilizado sem alteração no rollback e removido no encerramento. `--all` é proibido no rollback normal.
- Os hashes históricos prefixados por `eeb171b1...` e `235f963...` pertenciam às conditions com timestamps invalidados e estão proibidos para reuso. O `ACTIVATION-EXEC` calcula novos `projectConditionSha256` e `tokenConditionSha256` depois de materializar START/END e antes da primeira mutação.
- Diretório futuro: `$ActivationRoot = Join-Path $env:LOCALAPPDATA "Google\CloudSDK\admin-b2a5-activation"`; conditions em `$ActivationRoot\conditions`.

Project condition template:

```json
{
  "title": "admin_b2a5_inventory_database_window",
  "description": "Temporary read-only access to the approved ADMIN-B2A5 Firestore database during the authorized inventory window.",
  "expression": "resource.name == \"projects/turismo-sms/databases/(default)\" && request.time >= timestamp(\"START_UTC\") && request.time < timestamp(\"END_UTC\")"
}
```

Token Creator condition template:

```json
{
  "title": "admin_b2a5_inventory_impersonation_window",
  "description": "Temporary service account impersonation for the approved ADMIN-B2A5 inventory window.",
  "expression": "request.time >= timestamp(\"START_UTC\") && request.time < timestamp(\"END_UTC\")"
}
```

#### ADC no Windows — decisão vinculante

- A busca oficial do ADC ocorre em: (1) `GOOGLE_APPLICATION_CREDENTIALS`; (2) arquivo local de `application-default login`; (3) metadata server. No Windows, o well-known path padrão é `%APPDATA%\gcloud\application_default_credentials.json`.
- A documentação oficial confirma que `CLOUDSDK_CONFIG` muda o diretório global da CLI. Separadamente, a inspeção local já comprovou que a CLI 578.0.0 resolve o ADC consultando `CLOUDSDK_CONFIG` antes de `%APPDATA%`: `CLOUDSDK_CONFIG_PRECEDES_APPDATA = true`. A prova local não é substituída por inferência documental genérica.
- Decisão canônica: `B2A5_GCLOUD_CONFIG = %LOCALAPPDATA%\Google\CloudSDK\admin-b2a5-config` e `B2A5_ADC_PATH = %LOCALAPPDATA%\Google\CloudSDK\admin-b2a5-config\application_default_credentials.json`. A raiz já é dedicada ao B2A5, fica fora do repositório, difere do perfil padrão e é selecionada explicitamente por `CLOUDSDK_CONFIG`; não será criada uma segunda árvore de configuração apenas para o ADC.
- Estão invalidados para o ADC deste fluxo: `%LOCALAPPDATA%\Google\CloudSDK\admin-b2a5-activation\AppData\gcloud\application_default_credentials.json` e `ActivationRoot\gcloud-config\application_default_credentials.json`. `APPDATA` não será redirecionado.
- Credenciais da gcloud CLI autenticam comandos da própria CLI; ADC autentica bibliotecas cliente da aplicação. São conjuntos conceitualmente distintos mesmo quando armazenados sob a mesma raiz B2A5. O inventário Node.js usa ADC e não usa diretamente o credential store da CLI.
- Regra de ciclo de vida: antes de `ACTIVATION`, `B2A5_ADC_PATH` deve estar ausente; durante `ACTIVATION → INVENTORY → AUTH-REVOKE`, pode existir somente após a criação autorizada; ao fim do `AUTH-REVOKE`, deve estar ausente novamente. Não apagar manualmente `credentials.db` nem remover `B2A5_GCLOUD_CONFIG` inteiro.
- A invocation antiga `gcloud auth application-default login OPERATOR_IN_MEMORY --impersonate-service-account=TARGET_SA_EMAIL_IN_MEMORY` está proibida. A criação futura será somente por `gcloud auth application-default login --impersonate-service-account=TARGET_SA_EMAIL_IN_MEMORY --configuration=default`, sob `CLOUDSDK_CONFIG=B2A5_GCLOUD_CONFIG`, depois das duas bindings temporárias criadas e validadas. O operador humano não será passado como argumento posicional; sua identidade continuará validada em gate separado antes de qualquer mutação IAM. A referência oficial atual caracteriza o comando como web flow: não exigir `storedUserCredentialReused = true` ou `webOAuthStarted = false`; o futuro `ACTIVATION-EXEC` deve autorizar explicitamente a interação humana no navegador se solicitada. Isso não autoriza nem executa novo `gcloud auth login` da CLI. Chave JSON permanece proibida.
- Node.js é oficialmente suportado para ADC local por impersonação. O processo do inventário receberá `GOOGLE_APPLICATION_CREDENTIALS=B2A5_ADC_PATH` somente em sua própria tabela de ambiente; o processo pai continuará sem a variável. Assim, o Node usa o arquivo exato.
- Prova estrutural pós-criação, sem imprimir conteúdo: arquivo regular, fora do repositório, sem reparse point, JSON válido, `type = impersonated_service_account`, `service_account_impersonation_url` correspondente ao target mantido em memória, `source_credentials.type = authorized_user`; qualquer divergência aciona rollback.
- Revogação: executar `gcloud auth application-default revoke` sob `CLOUDSDK_CONFIG=B2A5_GCLOUD_CONFIG` e confirmar `B2A5_ADC_PATH` ausente. O comando oficial revoga ADC criado por `application-default login` e exclui o arquivo local; não afeta as credenciais da CLI. Preservar `credentials.db` e a raiz B2A5.
- Fontes oficiais atuais: [referência de application-default login](https://docs.cloud.google.com/sdk/gcloud/reference/auth/application-default/login), [uso de impersonação e suporte das bibliotecas](https://docs.cloud.google.com/docs/authentication/use-service-account-impersonation), [papéis para autenticação de service accounts](https://docs.cloud.google.com/iam/docs/service-account-permissions), [propagação de mudanças IAM](https://docs.cloud.google.com/iam/docs/access-change-propagation), [referência de application-default revoke](https://docs.cloud.google.com/sdk/gcloud/reference/auth/application-default/revoke) e [configurações/CLOUDSDK_CONFIG](https://docs.cloud.google.com/sdk/gcloud/reference/topic/configurations). A documentação descreve genericamente `ACCOUNT` como argumento opcional de credencial de usuário, o web flow, a invocation de ADC impersonado sem `ACCOUNT`, o suporte Node.js, Token Creator/`iam.serviceAccounts.getAccessToken`, consistência eventual de IAM, revoke e override do diretório. Ela não documenta o bug local da CLI 578.0.0; `CLOUDSDK_CONFIG_PRECEDES_APPDATA` e a causa `InvalidValue` permanecem evidências locais deste ambiente.

#### Forense vinculante da falha ADC na Google Cloud CLI 578.0.0

- Classificação forense: `F. OTHER_CONFIRMED_CAUSE`.
- `ADC_FAILURE_ROOT_CAUSE = GCLOUD_578_POSITIONAL_ACCOUNT_WITH_IMPERSONATION_LOCAL_VALIDATION_FAILURE`.
- A invocation que falhou continha simultaneamente `ACCOUNT` posicional e `--impersonate-service-account`. A validação interna local da identidade recebeu valor ausente, o decodificador JWT lançou `google.auth.exceptions.InvalidValue` com mensagem sanitizada `None could not be converted to bytes`, e o comando encerrou antes de `DumpImpersonatedServiceAccountToADC`.
- O callback OAuth local e o token endpoint OAuth retornaram HTTP 200. Não houve erro de filesystem, quota project, flag desconhecida ou sintaxe; o ramo de escrita do ADC não foi alcançado.
- IAM Credentials API, `GenerateAccessToken` e `iam.serviceAccounts.getAccessToken` não foram chamados; não houve `PERMISSION_DENIED` ou HTTP 403. Portanto: `IAM_PROPAGATION_CAUSED_THIS_INCIDENT = false`, `ADC_OAUTH_FAILURE = false`, `ADC_QUOTA_PROJECT_FAILURE = false`, `ADC_FILESYSTEM_FAILURE = false` e `UNKNOWN_FLAG_OR_SYNTAX_FAILURE = false`.
- `google.auth.exceptions.InvalidValue` local não recebe retry. Qualquer ocorrência depois de binding material aciona rollback imediato. Somente um futuro `PERMISSION_DENIED` explicitamente associado a `iam.serviceAccounts.getAccessToken` ou `GenerateAccessToken` poderá ser classificado separadamente como possível propagação IAM.

#### Gate separado de identidade do operador

- Antes de qualquer binding futura, exigir `credentialedAccountCount = 1`, `activeAccountCount = 1`, active account e `core/account` iguais ao operador humano autorizado e `operatorAccountMatched = true`.
- A identidade do operador não será inferida pelo `application-default login`. A remoção do `ACCOUNT` posicional altera somente a invocation ADC e não reduz o gate pré-mutação.

#### Comandos canônicos futuros — não executar neste PREP

Project binding:

```powershell
& $GcloudPath projects add-iam-policy-binding turismo-sms `
  --member="serviceAccount:$TARGET_SA_EMAIL_IN_MEMORY" `
  --role="projects/turismo-sms/roles/adminB2A5InventoryRead" `
  --condition-from-file=$ProjectConditionPath `
  --account=$OPERATOR_IN_MEMORY `
  --quiet
```

Token Creator sobre a service account como recurso:

```powershell
& $GcloudPath iam service-accounts add-iam-policy-binding $TARGET_SA_EMAIL_IN_MEMORY `
  --member="user:$OPERATOR_IN_MEMORY" `
  --role="roles/iam.serviceAccountTokenCreator" `
  --condition-from-file=$TokenConditionPath `
  --project=turismo-sms `
  --account=$OPERATOR_IN_MEMORY `
  --quiet
```

Rollback project — condition exata:

```powershell
& $GcloudPath projects remove-iam-policy-binding turismo-sms `
  --member="serviceAccount:$TARGET_SA_EMAIL_IN_MEMORY" `
  --role="projects/turismo-sms/roles/adminB2A5InventoryRead" `
  --condition-from-file=$ProjectConditionPath `
  --account=$OPERATOR_IN_MEMORY `
  --quiet
```

Rollback Token Creator — condition exata:

```powershell
& $GcloudPath iam service-accounts remove-iam-policy-binding $TARGET_SA_EMAIL_IN_MEMORY `
  --member="user:$OPERATOR_IN_MEMORY" `
  --role="roles/iam.serviceAccountTokenCreator" `
  --condition-from-file=$TokenConditionPath `
  --project=turismo-sms `
  --account=$OPERATOR_IN_MEMORY `
  --quiet
```

#### Prompt pronto — ADMIN-B2A5-INVENTORY-AUTH-SERVICE-ACCOUNT-REENABLE-EXEC

```text
Bloco exclusivo: ADMIN-B2A5-INVENTORY-AUTH-SERVICE-ACCOUNT-REENABLE-EXEC.
Exigir autorização literal própria:
AUTORIZO O ADMIN-B2A5-INVENTORY-AUTH-SERVICE-ACCOUNT-REENABLE-EXEC.
Exigir nova credencial humana governada e operador somente em memória. Não reutilizar
login, operador, autorização, deadline ou janela de tentativa anterior.

Objetivo único: revalidar a service account B2A5 exata e habilitá-la para uma nova
tentativa governada. Não conceder binding, não criar ADC, não impersonar, não acessar
Firestore/Storage, não executar inventário e não iniciar FINALIZATION ou ACTIVATION.

1. Confirmar Git 0/0, itens protegidos fechados, B2A5_GCLOUD_CONFIG canônico e fora
   do repo, B2A5_ADC_PATH ausente e GOOGLE_APPLICATION_CREDENTIALS ausente.
2. Confirmar em gate separado: credentialedAccountCount=1, activeAccountCount=1,
   active account e core/account iguais ao operador autorizado e
   operatorAccountMatched=true.
3. Revalidar por leitura projeto/fingerprint/lifecycle e a service account exata.
4. Exigir estado de entrada: disabled=true; userManagedKeyCount=0; zero project
   binding alvo; zero binding usando o custom role; zero material binding na own
   policy; ADC ausente; FirestoreAccessed=false. Ler cada policy como JSON de dados,
   invocar exatamente `Get-B2A5IamPolicyShape` do bloco versionado
   `B2A5_IAM_POLICY_PARSER_SOURCE`, rejeitar `policyShapeUnexpected=true` e usar o
   callback normalizado para filtros. Own e project policy usam o mesmo source;
   é proibido gerar novo parser ou interpolar JSON no source PowerShell.
5. Confirmar a permissão mínima do operador para iam.serviceAccounts.enable por gate
   read-only aprovado. Qualquer divergência para antes da mutação.
6. Executar uma única chamada de enable para a service account exata.
7. Validar por leitura: serviceAccountExactMatch=true, disabled=false e
   userManagedKeyCount=0.
8. Emitir somente metadados sanitizados e parar. Não iniciar FINALIZATION.

Em falha, não conceder acesso alternativo, não criar chave JSON, não criar ADC e não
seguir para ACTIVATION. A service account só pode ser habilitada depois de uma nova
sessão humana governada e volta a disabled=true no AUTH-REVOKE final.
```

#### FINALIZATION curto, permissões e janela

- Pré-requisito do `ACTIVATION-PREP-FINALIZATION`: `SERVICE-ACCOUNT-REENABLE-EXEC` concluído e governado na mesma nova sessão humana, com `serviceAccountExactMatch = true`, `disabled = false` e `userManagedKeyCount = 0`. O FINALIZATION não habilita a conta.
- Gates do `ACTIVATION-PREP-FINALIZATION`: login válido e corrente; Git `0/0`; `B2A5_GCLOUD_CONFIG` canônico e fora do repositório; `B2A5_ADC_PATH` fora do repositório e ausente; ADC padrão ausente; projeto/fingerprint/lifecycle; três APIs; custom role exato; service account exata e habilitada pelo REENABLE governado; zero `USER_MANAGED` keys; zero binding alvo no projeto; zero binding usando o custom role; zero binding material na policy própria; permissões do operador; prompts de ACTIVATION, INVENTORY e AUTH-REVOKE íntegros; algoritmo da janela validado; relatório authorization-ready.
- Permissões mínimas futuras: projeto `resourcemanager.projects.get`, `resourcemanager.projects.getIamPolicy`, `resourcemanager.projects.setIamPolicy`, `serviceusage.services.list` e `serviceusage.services.use`; service account `iam.serviceAccounts.get`, `iam.serviceAccounts.getIamPolicy`, `iam.serviceAccounts.setIamPolicy` e `iam.serviceAccountKeys.list`; custom role `iam.roles.get`. Não conceder nada no FINALIZATION.
- Usar `projects.testIamPermissions` para as permissões de projeto e `projects.serviceAccounts.testIamPermissions` no recurso exato da conta para as permissões aplicáveis. `iam.roles.get`, listagem de APIs e chaves permanecem provas read-only diretas. Qualquer ausência para antes da primeira binding.
- Resultado obrigatório: `windowAlgorithmValidated = true`, `windowDurationSeconds = 7200`, `START_UTC = DEFERRED_TO_ACTIVATION_EXEC`, `END_UTC = DEFERRED_TO_ACTIVATION_EXEC`, `humanAuthorizationBeforeMutation = true`, `timestampsUnknownAtAuthorization = true` e `windowAlgorithmKnownAtAuthorization = true`.
- Foram removidos `ceilToNextMinute`, lead, tolerância de início e `ACTIVATION_MUST_START_BY_UTC`. Nenhum timestamp real atravessa o handoff humano e nenhuma janela IAM começa no FINALIZATION.
- A credencial humana conserva seus limites operacionais próprios. Se estiver próxima do limite antes da primeira mutação, não ativar: revogar e exigir novo login. Não é necessário que sobreviva às duas horas completas, pois o `AUTH-REVOKE` deve ocorrer muito antes; após qualquer binding material, rollback permanece obrigatório mesmo sob problema da credencial.

#### Prompt pronto — ADMIN-B2A5-INVENTORY-AUTH-ACTIVATION-PREP-FINALIZATION

```text
Bloco exclusivo: ADMIN-B2A5-INVENTORY-AUTH-ACTIVATION-PREP-FINALIZATION.
Exigir autorização literal própria, login humano vigente e prova de que o bloco
SERVICE-ACCOUNT-REENABLE-EXEC foi concluído e governado nesta nova sessão. O
FINALIZATION não habilita a service account e não corrige estado de sessão anterior.

Não criar ou remover binding, não criar ADC, não impersonar, não ler Firestore/Storage,
não executar inventário e não materializar START_UTC ou END_UTC.

1. Confirmar login, deadlines operacionais da credencial, main, Git 0/0, índice e
   tracked tree limpos e itens protegidos fechados.
2. Confirmar configuração isolada e uma conta humana credentialed/ativa igual ao
   operador em memória; B2A5_GCLOUD_CONFIG canônico e fora do repo; B2A5_ADC_PATH
   fora do repo e ausente; ADC padrão ausente; zero projeto/impersonação/access-token file.
3. Revalidar somente por leitura projeto turismo-sms, fingerprint
   68cf9cf1208055a962c614232e75b8a0b4f4f7564865e77e2a84382a87bd8c60,
   lifecycle ACTIVE e as três APIs exigidas.
4. Revalidar custom role exato, somente datastore.entities.get/list, e service account
   exata, enabled pelo REENABLE governado, com zero USER_MANAGED keys.
5. Confirmar zero project binding para a service account alvo, zero project binding
   usando o custom role e zero material binding na own policy com o mesmo source
   versionado `B2A5_IAM_POLICY_PARSER_SOURCE`; não criar wrapper alternativo.
6. Confirmar permissões mínimas do operador por provas read-only aprovadas.
7. Confirmar CLOUDSDK_CONFIG_PRECEDES_APPDATA como prova local já governada; confirmar
   que credenciais CLI e ADC são distintas; validar rollback readiness e as versões
   correntes dos prompts ACTIVATION, INVENTORY e AUTH-REVOKE.
8. Validar somente o algoritmo autorizado: após todos os gates do ACTIVATION-EXEC e
   imediatamente antes da primeira mutação, START_UTC = UTC corrente normalizado para
   segundo inteiro e END_UTC = START_UTC + exatamente 7200 segundos.
9. Emitir somente: ACTIVATION_READY=true, windowAlgorithmValidated=true,
   windowDurationSeconds=7200, START_UTC=DEFERRED_TO_ACTIVATION_EXEC,
   END_UTC=DEFERRED_TO_ACTIVATION_EXEC, windowMaterialized=false,
   humanAuthorizationBeforeMutation=true, timestampsUnknownAtAuthorization=true e
   windowAlgorithmKnownAtAuthorization=true; parar.

Qualquer falha para sem mutação. O FINALIZATION não autoriza ACTIVATION-EXEC.
```

#### Propagação e comando da ferramenta

- IAM policy changes são eventualmente consistentes: a documentação oficial informa tipicamente 2 minutos e potencialmente 7 minutos ou mais. Essa propriedade geral permanece relevante, mas `IAM_PROPAGATION_CAUSED_THIS_INCIDENT = false` porque a falha comprovada foi `InvalidValue` local antes de qualquer chamada à IAM Credentials API.
- Não adicionar espera fixa antes da criação do ADC por causa deste incidente e não usar Firestore como readiness probe. O `ACTIVATION-EXEC` não usará documentos reais como health check nem criará novo probe remoto obrigatório.
- `google.auth.exceptions.InvalidValue` não recebe retry. Um futuro `PERMISSION_DENIED` explicitamente associado a `iam.serviceAccounts.getAccessToken` ou `GenerateAccessToken` deve ser registrado como categoria separada e acionar o rollback corrente, sem loop automático neste contrato.
- O `INVENTORY-EXEC`, único bloco autorizado a ler documentos, preserva sua política própria: poderá repetir somente a categoria sanitizada `auth-denied` em três tentativas máximas nos marcos `t+0s`, `t+120s` e `t+300s`, usando esperas de no máximo 30 segundos com rechecagem temporal. Nenhuma outra categoria recebe retry.
- Comando remoto preparado, não executado; `ADMIN_B2A5_PROJECT_ID` e `GOOGLE_APPLICATION_CREDENTIALS` existirão somente no processo filho, e `FIRESTORE_EMULATOR_HOST` deverá estar ausente:

```powershell
node ".\tools\admin-b2a5-inventory\admin-b2a5-inventory.mjs" `
  --database-id "(default)" `
  --collection "usuarios" `
  --max-docs "10000" `
  --expected-project-sha256 "68cf9cf1208055a962c614232e75b8a0b4f4f7564865e77e2a84382a87bd8c60"
```

- Tool readiness herdada do PREP-OFFLINE e não rerodada neste bloco: `npm --prefix "tools/admin-b2a5-inventory" run check` passou; unitários passaram em 92/92; gate integral com Firestore Emulator passou em 102/102, zero falhas e zero skipped. Nenhuma instalação/atualização foi executada.

#### Matriz de falhas vinculante

- Antes de materializar a janela: qualquer falha produz zero mutação IAM; revogar login se a continuidade parar.
- Depois de materializar e antes da primeira mutação: se não puder continuar imediatamente, descartar START/END, não reutilizar timestamps e encerrar com zero mutação. Qualquer nova tentativa reinicia os gates críticos.
- Project binding create falha: validar se houve materialização parcial; se ausente, zero rollback; se presente, remover a binding exata.
- Project binding validation falha: remover a project binding exata.
- Token Creator create/validation falha: remover Token Creator se material e remover project binding exata.
- ADC create/validation falha: sem retry automático; remover ADC parcial, se houver, e ambas as bindings exatas. Classificar `InvalidValue`, filesystem, cancelamento OAuth e `PERMISSION_DENIED` explícito da IAM Credentials separadamente.
- Inventory não inicia, falha ou conclui: executar AUTH-REVOKE completo imediatamente.
- AUTH-REVOKE parcial: continuar best-effort nos passos independentes seguros, registrar estado sanitizado exato e escalar intervenção humana. Expiração nunca equivale a rollback concluído.

#### Prompt pronto — ADMIN-B2A5-INVENTORY-AUTH-ACTIVATION-EXEC

```text
Bloco exclusivo: ADMIN-B2A5-INVENTORY-AUTH-ACTIVATION-EXEC.
Exigir autorização literal: AUTORIZO O ADMIN-B2A5-INVENTORY-AUTH-ACTIVATION-EXEC,
acompanhada da autorização explícita do algoritmo: “Após todos os gates read-only
passarem e imediatamente antes da primeira mutação IAM, calcular START_UTC a partir
do UTC corrente e END_UTC como START_UTC + exatamente 7200 segundos.”
Entradas obrigatórias do FINALIZATION e mantidas somente em memória:
LOGIN_COMPLETED_AT, LOGIN_INACTIVITY_DEADLINE, LOGIN_ABSOLUTE_DEADLINE,
OPERATOR_IN_MEMORY, TARGET_SA_EMAIL_IN_MEMORY, project/token condition templates,
B2A5_GCLOUD_CONFIG, B2A5_ADC_PATH, windowAlgorithmValidated=true,
windowDurationSeconds=7200,
START_UTC=DEFERRED_TO_ACTIVATION_EXEC e END_UTC=DEFERRED_TO_ACTIVATION_EXEC.
Exigir também collisionGateParserValidationRequired=true,
parseErrorCountExpected=0 e prova local anterior de collisionGateTestsPassed=7/7.

Não fazer novo gcloud auth login da CLI, não alterar duração/targets/textos, não usar chave JSON,
não conceder Service Account User ou qualquer papel adicional, não ler documentos,
não acessar Storage/Logging, não executar inventário e não alterar o repositório.
Este bloco autoriza somente o application-default login impersonado previsto em L,
inclusive o web flow humano se o próprio comando solicitar; conta, senha, MFA,
consentimento, URL e código permanecem integralmente sob controle humano.

A. Confirmar que a autorização literal acima já foi recebida antes de qualquer mutação.
B. Executar os gates críticos: Git/local; configuração isolada;
   credentialedAccountCount=1; activeAccountCount=1; active account e core/account iguais
   a OPERATOR_IN_MEMORY; operatorAccountMatched=true; projeto/fingerprint/lifecycle;
   APIs; custom role; service account exata, enabled pelo REENABLE governado; zero USER_MANAGED
   keys; zero project binding alvo; zero binding do custom role; zero material binding
   na own policy; permissões do operador; B2A5_GCLOUD_CONFIG canônico e fora do repo;
   B2A5_ADC_PATH fora do repo e ausente; ADC padrão ausente; rollback readiness;
   INVENTORY prompt ready; AUTH-REVOKE prompt ready. Own e project policy devem passar
   pelo mesmo `B2A5_IAM_POLICY_PARSER_SOURCE`, com JSON em variável/arquivo de dados,
   nunca embutido no source; qualquer shape inesperado para fail-closed.
C. Confirmar windowMaterialized=false. Se a credencial humana estiver próxima do
   limite operacional, não ativar: revogar e exigir novo login.
D. Antes de START_UTC/END_UTC e sem criar o diretório ou qualquer arquivo, derivar
   ProjectConditionPath e TokenConditionPath futuros. Analisar o trecho exato abaixo
   com [System.Management.Automation.Language.Parser]::ParseInput, capturar tokens e
   parseErrors e exigir parseErrorCount=0. Depois executar exatamente o gate local:

# B2A5_COLLISION_GATE_BEGIN
$ConditionPaths = @(
    $ProjectConditionPath,
    $TokenConditionPath
)

$ConditionPathCollisionCount = 0

foreach ($ConditionPath in $ConditionPaths) {

    if ([string]::IsNullOrWhiteSpace($ConditionPath)) {
        throw "B2A5_CONDITION_PATH_INVALID"
    }

    if (Test-Path -LiteralPath $ConditionPath) {
        $ConditionPathCollisionCount++
    }
}

if ($ConditionPathCollisionCount -ne 0) {
    throw "B2A5_CONDITION_FILE_COLLISION"
}
# B2A5_COLLISION_GATE_END

   Registrar somente a categoria sanitizada. Qualquer path inválido, colisão ou erro
   de parser para fail-closed sem materializar a janela. Não substituir por expressão
   compacta com `-or` nem usar `Test-Path -Path`.
E. Fazer a última leitura do clock em UTC somente depois do gate de colisão passar.
F. Imediatamente antes da primeira mutação, normalizar o UTC corrente para RFC3339
   com precisão de segundos: windowMaterializedAtUtc=START_UTC; definir
   END_UTC=START_UTC+7200s. Não usar ceilToNextMinute, lead, startTolerance ou
   ACTIVATION_MUST_START_BY_UTC.
G. Só depois de F, criar o diretório de conditions e os dois JSON canônicos fora do
   repo, substituindo somente START_UTC/END_UTC. Usar criação exclusiva equivalente a
   FileMode.CreateNew, sem overwrite, para fechar a janela TOCTOU entre o check e a
   escrita. Se qualquer criação falhar, remover somente arquivo atribuível à tentativa
   atual, descartar START/END e parar sem binding. Title, description e restante da
   expression permanecem byte/semanticamente exatos.
H. Calcular projectConditionSha256 e tokenConditionSha256 antes da primeira mutação;
   tornar conteúdo, paths e hashes imutáveis para validação, handoff e rollback.
I. Criar a project binding IMEDIATAMENTE pelo arquivo canônico. Se houver pausa humana
   entre F e I, abortar, descartar timestamps, não mutar e não recalcular sem reiniciar
   os gates críticos.
J. Validar exatamente member, role, title, description, expression e hash da project binding.
K. Criar Token Creator na service account como recurso pelo segundo arquivo.
L. Validar exatamente member, role, title, description, expression e hash.
M. Depois das duas bindings criadas e validadas, usar
   CLOUDSDK_CONFIG=B2A5_GCLOUD_CONFIG, APPDATA inalterado e
   GOOGLE_APPLICATION_CREDENTIALS ausente. Executar exatamente
   gcloud auth application-default login
   --impersonate-service-account=TARGET_SA_EMAIL_IN_MEMORY
   --configuration=default. Não passar OPERATOR_IN_MEMORY como argumento posicional.
   A identidade do operador já deve ter sido comprovada pelo gate separado antes da
   primeira binding. Permitir o web flow se solicitado; não exigir
   storedUserCredentialReused=true nem webOAuthStarted=false.
   O navegador, conta, senha, MFA, consentimento, URL e código ficam sob controle humano.
N. Confirmar B2A5_ADC_PATH existe e está fora do repo; validar somente metadados:
   type=impersonated_service_account, target exato e source authorized_user. Não imprimir,
   transcrever, persistir ou hashear access_token, refresh_token, client_secret,
   authorization code ou o conteúdo integral do ADC.
O. Não setar GOOGLE_APPLICATION_CREDENTIALS no pai. Parar para autorização do INVENTORY
   e entregar windowMaterializedAtUtc, START_UTC, END_UTC, canonical objects/paths/hashes,
   bindings exatas, B2A5_ADC_PATH e ADC pronto. Não executar inventário automaticamente.

Falha entre F e I sem mutação descarta a janela. Qualquer falha após binding material
executa imediatamente o prompt AUTH-REVOKE completo com os mesmos JSON e hashes:
revoke/remover ADC, limpar env, remover Token Creator exata, validar, remover project
binding exata, validar e concluir o restante do rollback. Nunca usar --all e nunca
esperar expiração. `google.auth.exceptions.InvalidValue`, falha de filesystem e
cancelamento OAuth não recebem retry cego ou automático: rollback imediato. Um
`PERMISSION_DENIED` explicitamente associado a iam.serviceAccounts.getAccessToken ou
GenerateAccessToken recebe categoria própria e rollback, sem loop automático. Não apagar
credentials.db nem B2A5_GCLOUD_CONFIG. Encerrar sem INVENTORY.
```

#### Prompt pronto — ADMIN-B2A5-INVENTORY-EXEC

```text
Bloco exclusivo: ADMIN-B2A5-INVENTORY-EXEC.
Exigir autorização literal: AUTORIZO O ADMIN-B2A5-INVENTORY-EXEC.
Exigir AUTH-REVOKE já autorizado/pronto antes da primeira leitura.
Entradas dinâmicas produzidas pelo ACTIVATION-EXEC e mantidas em memória:
START_UTC, END_UTC, projectConditionCanonical, tokenConditionCanonical,
ProjectConditionPath/sha256, TokenConditionPath/sha256, OPERATOR_IN_MEMORY,
TARGET_SA_EMAIL_IN_MEMORY, B2A5_GCLOUD_CONFIG, B2A5_ADC_PATH,
fingerprint 68cf9cf1208055a962c614232e75b8a0b4f4f7564865e77e2a84382a87bd8c60.

1. Gate temporal e de continuidade; confirmar bindings canônicas ainda exatas,
   B2A5_ADC_PATH estruturalmente válido, arquivo fora do repo, target exato e nenhuma
   credencial alternativa.
2. Criar processo filho com GOOGLE_APPLICATION_CREDENTIALS=B2A5_ADC_PATH e
   ADMIN_B2A5_PROJECT_ID=turismo-sms; remover FIRESTORE_EMULATOR_HOST do ambiente.
   Não definir METADATA_SERVER_DETECTION no modo remoto e não alterar o pai.
3. Executar somente:
   node .\tools\admin-b2a5-inventory\admin-b2a5-inventory.mjs
     --database-id "(default)" --collection "usuarios" --max-docs "10000"
     --expected-project-sha256 "68cf9cf1208055a962c614232e75b8a0b4f4f7564865e77e2a84382a87bd8c60"
4. Capturar stdout/stderr separadamente. Aceitar somente o JSON agregado allowlisted;
   nunca emitir IDs, UIDs, paths, snapshots, campos pessoais ou erro bruto.
5. Se e somente se a categoria sanitizada for auth-denied, permitir no máximo três
   tentativas em t+0s, t+120s e t+300s, com esperas segmentadas de até 30s e gate
   temporal antes de cada tentativa. Não retry para qualquer outra categoria.
6. Volume acima de 10000, mismatch, falha de query/invariante/sanitização ou qualquer
   outra categoria encerra sem resumo parcial e sem elevar limites.
7. Em finally operacional, remover variáveis do processo filho e executar imediatamente
   o prompt ADMIN-B2A5-INVENTORY-AUTH-REVOKE, independentemente de sucesso ou falha.

Não escrever documento, não migrar, não alterar Rules, não acessar Storage/Logging,
não manter ADC/binding para continuação e não iniciar governança antes do revoke.
```

#### Prompt pronto — ADMIN-B2A5-INVENTORY-AUTH-REVOKE

```text
Bloco obrigatório: ADMIN-B2A5-INVENTORY-AUTH-REVOKE.
Executar imediatamente após INVENTORY ou qualquer falha pós-activation.
Entradas dinâmicas recebidas somente do ACTIVATION-EXEC: START_UTC, END_UTC,
projectConditionCanonical, tokenConditionCanonical, projectConditionSha256,
tokenConditionSha256, ProjectConditionPath e TokenConditionPath com hashes de arquivo,
OPERATOR_IN_MEMORY, TARGET_SA_EMAIL_IN_MEMORY, ActivationRoot, B2A5_GCLOUD_CONFIG e
B2A5_ADC_PATH. Não aceitar timestamps ou hashes produzidos pelo FINALIZATION.

1. Impedir nova execução inventory e aguardar/encerrar somente o processo filho exato.
2. Sob CLOUDSDK_CONFIG=B2A5_GCLOUD_CONFIG, executar uma vez
   gcloud auth application-default revoke.
3. Confirmar B2A5_ADC_PATH ausente. Se não estiver ausente, marcar ADC cleanup como
   inconclusivo e continuar best-effort nos passos IAM independentes seguros; não apagar
   credentials.db e não remover B2A5_GCLOUD_CONFIG. Preservar os arquivos de condition.
4. Limpar GOOGLE_APPLICATION_CREDENTIALS e ADMIN_B2A5_PROJECT_ID de qualquer processo
   criado pela cadeia; comprovar ausentes no pai.
5. Validar equivalência byte a byte e SHA-256 do TokenConditionPath e remover a Token
   Creator binding exata com --condition-from-file.
6. Validar ausência da Token Creator binding por policy estrutural.
7. Validar equivalência byte a byte e SHA-256 do ProjectConditionPath e remover a
   project binding exata com --condition-from-file. Nunca usar --all.
8. Validar ausência da project binding por policy estrutural; só então remover os dois
   arquivos canônicos e o ActivationRoot exato das conditions, se vazio e integralmente
   atribuível. B2A5_GCLOUD_CONFIG não pertence a essa limpeza.
9. Confirmar zero USER_MANAGED keys.
10. Desabilitar a service account.
11. Confirmar disabled=true; preservar a conta desabilitada e o custom role por 7 dias,
    sem excluir ou desabilitar o custom role sem nova autorização.
12. Revogar nominalmente a credencial humana da CLI isolada uma única vez.
13. Comprovar zero contas credentialed/ativas, zero ADC, projeto, impersonação e
    access-token file, B2A5_ADC_PATH ausente, diretório padrão separado, ADC padrão
    ausente e nenhuma variável residual. Preservar a service account e o custom role
    conforme a política vigente. Relatar
    somente booleanos, contagens, categorias e hashes de conditions. Não imprimir
    operador, SA e-mail integral, policies, ADC, tokens, chaves, IDs ou erros brutos.

Em falha parcial, continuar best-effort nos passos independentes seguros, registrar
quais estados ficaram confirmados/inconclusivos e escalar intervenção humana. A
expiração temporal não encerra rollback e não autoriza --all.
```

#### Teste lógico local do algoritmo da janela

- Teste efêmero em PowerShell com `DateTimeOffset`/UTC, sem login, rede ou arquivo persistido: quatro casos, incluindo valor arbitrário com fração, `23:59:59Z` com virada de dia, fim de mês e fim de ano.
- Resultado: 4/4 com `START` truncado ao segundo inteiro sem avançar ao próximo minuto, `END > START`, diferença exata de 7200 segundos e transições de calendário corretas.
- `activationMustStartByRequired = false`; nenhum utilitário artificial foi adicionado ao repositório.

#### Gate pré-login de revogação server-side

- Estado atual: `localCredentialStateZero = true`, `serverSideRevocationConfirmed = false`, `serverSideRevocationStatus = INCONCLUSIVE`.
- Antes de novo `LOGIN-EXEC`, exigir: (A) confirmação humana de remoção de todas as conexões “Google Cloud SDK” na Conta Google; ou (B) outra prova oficial e confiável de revogação server-side.
- Não tentar verificar token antigo e não iniciar login enquanto o gate permanecer pendente. A classificação corrente é **B. RESEQUENCING CONCLUÍDO, MAS GATE PRÉ-LOGIN EXIGE DECISÃO HUMANA SOBRE REVOGAÇÃO SERVER-SIDE**.

### Fechamento pós-pausa e correção do contrato de policy — 2026-08-07

- **Cronologia vinculante:** PROVISION criou os dois recursos sem binding; a primeira leitura da policy própria foi problemática; uma leitura corretiva indicou zero; a GOVERNANCE voltou a derivar aparentemente uma binding e parou fail-closed; a credencial foi revogada; seguiram-se `ANOMALY-PREP`, novo `LOGIN-EXEC` e `ANOMALY-INVESTIGATION`. REST oficial e Google Cloud CLI, independentes, retornaram policy com `bindings` ausente, zero elemento e zero binding material, com correspondência semântica integral. Resultado: `originClassification = FALSE_POSITIVE_PARSER`, `riskClassification = NONE_FROM_SERVICE_ACCOUNT_RESOURCE_POLICY` e `remediationRequired = false`.
- **Causa e limite de evidência:** a classe de falso positivo é a contagem por `@($policy.bindings).Count`, ou equivalente, sobre propriedade ausente/`$null`. A regressão local confirmou `@($null).Count = 1` e `@($policy.bindings).Count = 1` para `{ "etag": "x" }` tanto no PowerShell 7.6.3 quanto no Windows PowerShell 5.1. O script efêmero exato da leitura histórica não foi preservado; não se atribui a ele um comando literal não comprovado. Busca integral nos arquivos rastreados não encontrou implementação reutilizável vulnerável, portanto a correção é documental/contratual.
- **Regra canônica:** é proibido contar `@($policy.bindings).Count` ou equivalente sobre propriedade possivelmente ausente/`null`. O parser de qualquer retomada deverá usar tokens JSON estruturais, preferencialmente `System.Text.Json.JsonDocument`, e expor somente `policyVersion`, `etagPresent`, `bindingsPropertyPresent`, `bindingsIsNull`, `bindingsArrayCount`, `materialBindingCount`, `policyShapeUnexpected`, `roleNames`, `memberTypeCounts` e `conditionCount`.
- **Validade material:** somente conta a binding que seja objeto, tenha `role` string não vazia e `members` presente como array não vazio cujos itens sejam todos strings não vazias. `bindings` ausente, `null` ou `[]` produz zero; qualquer shape escalar ou binding malformada marca `policyShapeUnexpected = true` e não pode ser filtrada silenciosamente.
- **Regressão vinculante:** `{ "etag": "x" }`, representando o shape real observado com `bindings` ausente, deve produzir `bindingsPropertyPresent = false`, `bindingsArrayCount = 0`, `materialBindingCount = 0` e `policyShapeUnexpected = false` — nunca `1`.
- **Fail-closed explícito para `null`:** `bindings = null` permanece distinto de propriedade ausente: retorna `bindingsPropertyPresent = true`, `bindingsIsNull = true`, contagens zero e `policyShapeUnexpected = true`. Isso preserva `materialBindingCount = 0` e impede que `null` seja aceito como shape normal.
- **Código e dados separados:** JSON bruto obtido da CLI deve permanecer em variável ou arquivo TEMP de dados e entrar em `-RawJson`. É proibido interpolar, concatenar ou embutir essa resposta no source de `powershell -Command`, script string ou wrapper equivalente. `rawJsonEmbeddedInSourceProhibited = true`.

#### Source canônico — B2A5_IAM_POLICY_PARSER_SOURCE

Este é o único source operacional permitido para own e project policy. O callback recebe somente uma binding material normalizada para filtros locais explícitos; toda saída normal da função contém apenas as cinco métricas sanitizadas. O chamador deve falhar fechado quando `policyShapeUnexpected = true` ou quando ocorrer exceção de entrada/parse. Não regenerar nem compactar este trecho.

<!-- B2A5_IAM_POLICY_PARSER_SOURCE_BEGIN -->
```powershell
function Get-B2A5IamPolicyShape {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [AllowEmptyString()]
        [string] $RawJson,

        [Parameter(Mandatory = $false)]
        [scriptblock] $OnMaterialBinding
    )

    if ([string]::IsNullOrWhiteSpace($RawJson)) {
        throw [System.ArgumentException]::new('IAM_POLICY_JSON_EMPTY')
    }

    $document = [System.Text.Json.JsonDocument]::Parse($RawJson)

    try {
        $result = [ordered]@{
            bindingsPropertyPresent = $false
            bindingsIsNull = $false
            bindingsArrayCount = 0
            materialBindingCount = 0
            policyShapeUnexpected = $false
        }

        $root = $document.RootElement

        if ($root.ValueKind -ne [System.Text.Json.JsonValueKind]::Object) {
            $result.policyShapeUnexpected = $true
            return [pscustomobject] $result
        }

        $bindingsElement = [System.Text.Json.JsonElement]::new()
        $result.bindingsPropertyPresent = $root.TryGetProperty(
            'bindings',
            [ref] $bindingsElement
        )

        if (-not $result.bindingsPropertyPresent) {
            return [pscustomobject] $result
        }

        if ($bindingsElement.ValueKind -eq [System.Text.Json.JsonValueKind]::Null) {
            $result.bindingsIsNull = $true
            $result.policyShapeUnexpected = $true
            return [pscustomobject] $result
        }

        if ($bindingsElement.ValueKind -ne [System.Text.Json.JsonValueKind]::Array) {
            $result.policyShapeUnexpected = $true
            return [pscustomobject] $result
        }

        foreach ($bindingElement in $bindingsElement.EnumerateArray()) {
            $result.bindingsArrayCount++

            if ($bindingElement.ValueKind -ne [System.Text.Json.JsonValueKind]::Object) {
                $result.policyShapeUnexpected = $true
                continue
            }

            $roleElement = [System.Text.Json.JsonElement]::new()
            $rolePresent = $bindingElement.TryGetProperty('role', [ref] $roleElement)

            if (
                (-not $rolePresent) -or
                ($roleElement.ValueKind -ne [System.Text.Json.JsonValueKind]::String) -or
                [string]::IsNullOrWhiteSpace($roleElement.GetString())
            ) {
                $result.policyShapeUnexpected = $true
                continue
            }

            $membersElement = [System.Text.Json.JsonElement]::new()
            $membersPresent = $bindingElement.TryGetProperty(
                'members',
                [ref] $membersElement
            )

            if (
                (-not $membersPresent) -or
                ($membersElement.ValueKind -ne [System.Text.Json.JsonValueKind]::Array)
            ) {
                $result.policyShapeUnexpected = $true
                continue
            }

            $members = [System.Collections.Generic.List[string]]::new()
            $membersValid = $true

            foreach ($memberElement in $membersElement.EnumerateArray()) {
                if (
                    ($memberElement.ValueKind -ne [System.Text.Json.JsonValueKind]::String) -or
                    [string]::IsNullOrWhiteSpace($memberElement.GetString())
                ) {
                    $membersValid = $false
                    continue
                }

                $members.Add($memberElement.GetString())
            }

            if ((-not $membersValid) -or ($members.Count -eq 0)) {
                $result.policyShapeUnexpected = $true
                continue
            }

            $conditionElement = [System.Text.Json.JsonElement]::new()
            $conditionPresent = $bindingElement.TryGetProperty(
                'condition',
                [ref] $conditionElement
            )

            if (
                $conditionPresent -and
                ($conditionElement.ValueKind -ne [System.Text.Json.JsonValueKind]::Object)
            ) {
                $result.policyShapeUnexpected = $true
                continue
            }

            $result.materialBindingCount++

            if ($null -ne $OnMaterialBinding) {
                $normalizedBinding = [pscustomobject]@{
                    role = $roleElement.GetString()
                    members = $members.ToArray()
                    conditionPresent = $conditionPresent
                }

                $null = & $OnMaterialBinding $normalizedBinding
            }
        }

        return [pscustomobject] $result
    }
    finally {
        $document.Dispose()
    }
}
```
<!-- B2A5_IAM_POLICY_PARSER_SOURCE_END -->

#### Contrato de validação e filtros

- `policyParserCanonicalRequired = true`; `policyParserAdHocWrapperProhibited = true`; `policyParserSyntaxValidationRequired = true`; `policyParserRuntimeValidationRequired = true`; `policyParserParseErrorCountExpected = 0`; `policyParserRuntimeTestsExpected >= 12/12`; `ownPolicyAndProjectPolicyShareCanonicalParser = true`.
- Extrair o source exato entre os marcadores, executar `Parser.ParseInput` e exigir zero erro no Windows PowerShell 5.1 e PowerShell 7.x. Zero erro sintático não substitui runtime.
- Executar no mínimo os 12 casos sintéticos governados: ausente, array vazio, uma binding, múltiplas bindings, condition válida, `null`, tipo não-array, root não-object, JSON inválido, caracteres especiais, multilinha e aspas/escapes válidos.
- Para project policy, o callback conta separadamente binding que contém o target como member e binding que usa o custom role. Para own policy, conta separadamente Token Creator temporária do operador. Binding condicional e não condicional são entradas distintas. Nunca afirmar zero bindings globais.
- Fluxo obrigatório do futuro REENABLE: `READ own policy JSON → canonical parser → validate shape → derive ownPolicyMaterialBindingCount → READ project policy JSON → SAME canonical parser → validate shape → derive project target counts → test iam.serviceAccounts.enable → last clock → enable`.
- **Estado zero deste fechamento:** `credentialedAccountCountBefore = 0`, `activeAccountCountBefore = 0`, `revokeRequired = false`, `revokeExecuted = false`, `stateZeroProven = true`; zero ADC, zero projeto persistido, zero impersonação e zero access-token file; diretório padrão ausente; nenhum login e nenhum comando destinado a recurso Google Cloud.

**Ciclo de login de 2026-08-04/05 — concluído, vencido e revogado.**

- **`LOGIN-EXEC` (nova execução) — concluído em 2026-08-04, classificação A.** `loginStarted = true`, `loginCompleted = true`, `browserFlowUsed = true`, `loginExitCode = 0`, `credentialedAccountCountAfterLogin = 1`, `activeAccountCountAfterLogin = 1`, ambas correspondentes ao operador; `installationSdkRootVerified`, `isolatedConfigPathVerifiedBeforeLogin` e `isolatedConfigPathVerifiedAfterLogin` verdadeiros; `defaultConfigAbsent` antes e depois; zero ADC, projeto, impersonação e access-token file; `credentialsPreservedForWorkflow = true`; `repositoryMutationDetected = false`. `rollbackSucceeded = false` **não foi falha** — nenhum rollback era necessário. `operatorSha256 = 61e41d5c9654769b486e1adca0f886951864234f0fcbee5d20e5d104f6f96f37`. O contrato corretivo de detecção do executável funcionou; `gcloudExecutableNotLocated` não se repetiu.
- **Prazos:** `loginCompletedAtUtc = 2026-08-04T19:07:39.0732231Z`; `credentialIdleDeadlineUtc = 2026-08-04T20:07:39.0732231Z`; `credentialAbsoluteDeadlineUtc = 2026-08-05T03:07:39.0732231Z`.
- **`LOGIN-GOVERNANCE` — INTERROMPIDO antes de qualquer edição.** Iniciado só em 2026-08-05; constatou `nowUtc = 2026-08-05T13:14:51.2277906Z`, com o limite de ociosidade vencido há ≈17h07 e o absoluto há ≈10h07. Nenhum arquivo foi alterado, nenhuma governança parcial foi criada, `loginGovernanceCompletedAtUtc` não foi registrado e `nextCredentialIdleDeadlineUtc` não foi derivado. Parada correta e fail-closed.
- **`AUTH-REVOKE-EXPIRED-LOGIN` — concluído em 2026-08-05, classificação A.** `revokeExecuted = true`, `revokeExitCode = 0`, execução única, sem `--all` e sem segunda tentativa; `credentialedAccountCountAfterRevoke = 0`, `activeAccountCountAfterRevoke = 0`, `adcDetectedAfterRevoke = false`, projeto/impersonação/access-token file ausentes, diretório padrão ausente, diretório isolado e instalação preservados, `processVariablesCleaned = true`, `rollbackRequired = false`, `failureCategory = null`. `startedAtUtc = 2026-08-05T13:33:46.3722194Z`; `endedAtUtc = 2026-08-05T13:33:58.4829737Z`. O `operatorSha256` coincidiu com o do login.
- **Escopo proporcional:** `AUTH-PROVISION-EXEC`, `ACTIVATION-EXEC` e `INVENTORY-EXEC` nunca foram executados, portanto não havia custom role, conta de serviço, binding, policy, ADC, chave, access-token file, projeto padrão ou recurso Firestore a remover. **Não registrar recursos inexistentes como criados ou removidos.**
- **Limites honestos:** os arquivos locais de armazenamento do SDK permanecem fisicamente no diretório isolado, sem conta lógica registrada pela CLI — **não afirmar que foram apagados** e não afirmar inspeção de valores ou linhas, que não ocorreu. A primeira redação do script foi bloqueada pelo guard por conter `Remove-Item` em `Env:`, sem executar, sem chamar `gcloud` e sem mudar estado; o cleanup foi refeito com `SetEnvironmentVariable(..., $null, "Process")`. O timeout foi aplicado no nível da invocação da ferramenta, não como timeout individual do processo `gcloud`.

**`ADMIN-B2A5-INVENTORY-AUTH-CLI-EXECUTABLE-RECOVERY-EXEC` — CANCELADO por decisão humana em 2026-08-04.**

- Cancelado por **desnecessidade comprovada**: a instalação foi verificada como presente, completa, íntegra e atribuível ao workflow. Ficam **proibidos**, sem bloco e autorização novos: download, reinstalação, reparo, substituição, extração, desinstalação, atualização da CLI e alteração de PATH.
- **Preservar integralmente:** Google Cloud CLI **578.0.0**; Python empacotado **3.14.6**; instalação single-user; diretório isolado já reparado; diretório padrão ausente; PATH atual. A instalação **não** deverá ser substituída pela versão corrente do canal `rapid`.
- Classificação definitiva do diagnóstico local: **`present-and-complete`**. A falha anterior foi de **detecção**; a causa específica **permanece indeterminada** e as hipóteses do PREP **não** devem ser tratadas como fatos.

**Contrato corretivo de detecção — vinculante para o novo `LOGIN-EXEC`.**

- Construir **no próprio processo** `$InstallRoot = Join-Path $env:LOCALAPPDATA "Google\CloudSDK\admin-b2a5-cli"` e `$GcloudPath = Join-Path $InstallRoot "google-cloud-sdk\bin\gcloud.cmd"`.
- Usar **exclusivamente** o caminho absoluto. **Não** depender do PATH, de `Get-Command`, do diretório atual, de estado de shell anterior ou de variável de outra sessão; **não** pesquisar variantes com espaço no nome.
- Validar antes de executar: arquivo existente; arquivo regular; proprietário esperado; sem ponto de reparse; dentro da raiz esperada; fora do repositório; versão e instalação coerentes.
- Se o arquivo absoluto não existir: **parar fail-closed**, sem busca ilimitada por instalação alternativa e sem instalar ou reparar automaticamente.
- Antes do login, sob `CLOUDSDK_CONFIG` isolado e pelo `gcloud.cmd` absoluto, confirmar `installation.sdk_root` e `config.paths.global_config_dir`, com `installationSdkRootVerified = true` e `isolatedConfigPathVerifiedBeforeLogin = true` **separadamente**, mais diretório padrão ausente, zero contas, zero ADC, zero projeto, zero impersonação e zero access-token file.

**`ADMIN-B2A5-INVENTORY-AUTH-CLI-EXECUTABLE-RECOVERY-PREP` — concluído em 2026-08-04, somente leitura, com premissa não confirmada.**

- Parecer: **B. PRONTO COM DECISÃO HUMANA PENDENTE**, a partir do commit-base `4d0c726619d6eff0181663fc6a52ca2eb8828982`. Zero download, instalador, instalação, reinstalação, extração, `gcloud`, login, OAuth, alteração de PATH ou de diretórios da CLI, remoção de artefato, ADC, token, chave, IAM, Firestore, Storage, inventário, staging, commit ou push.
- **Achado central:** a instalação executável **não está ausente**. `google-cloud-sdk\bin\gcloud.cmd` existe sob a raiz esperada, com proprietário correto, sem ponto de reparse e criado em `2026-08-03T13:28:47Z`; `VERSION` declara **578.0.0**; a árvore tem 49.054 arquivos, 9.911 diretórios, ~749 MB e zero pontos de reparse; os manifests de `core`, `gcloud`, `gcloud-deps`, `gcloud-crc32c`, `bq` e `bundled-python3`, com as variantes `windows-x86_64`, estão todos presentes.
- **Classificação: `present-and-complete`** — sexta categoria, criada porque nenhuma das cinco previstas (`absent`, `partial`, `moved`, `inaccessible`, `ambiguous`) descreve o estado real. A taxonomia foi ampliada em vez de forçada.
- Escopo single-user confirmado: `install_mode = 0`, `uninstaller.exe` presente, **uma** entrada de desinstalação em `HKCU` com publisher "Google LLC", zero entradas em `HKLM`/`WOW6432Node`, zero atalhos no Menu Iniciar e no Desktop — coerente com `/singleuser`, `/nostartmenu` e `/nodesktop`.
- PATH: **uma** entrada no escopo de **usuário** sob a raiz esperada, **zero** no de máquina. Reconfirma a correção do `ISOLATION-REPAIR-PREP` — o `CLI-SETUP-EXEC` registrou PATH inalterado apenas porque o processo em execução não herdou a escrita no escopo de usuário.
- Varredura **limitada** por raízes e profundidade encontrou exatamente **um** diretório `google-cloud-sdk`, o esperado, e zero alternativos; os quatro locais convencionais estão ausentes. Comprova ausência **nos escopos varridos**, não ausência global em todos os discos.
- Isolamento preservado sem executar `gcloud`: diretório isolado existente, criado em `2026-08-04T12:50:53Z`, do usuário esperado, sem reparse point, fora do repositório, com 8 entradas e **zero** artefatos de credencial; `%APPDATA%\gcloud` ausente; ADC ausente; `CLOUDSDK_CONFIG`, `GOOGLE_APPLICATION_CREDENTIALS`, `CLOUDSDK_PYTHON` e `CLOUDSDK_ROOT_DIR` indefinidas nos três escopos. O **log único** do diretório isolado corrobora que o `LOGIN-EXEC` não chegou a invocar `gcloud`.
- Causa da falha de detecção: **indeterminada** por inspeção somente leitura. Hipóteses compatíveis e **não comprovadas** — estado de shell não persistir entre invocações; sonda dependente de PATH de processo em shell antigo; divergência de literal `CloudSDK` × `Cloud SDK`. Nenhuma é elevada a fato.
- **Entrega técnica — contrato corretivo de detecção.** Derivar a raiz a partir de `%LOCALAPPDATA%` **no próprio processo**, nunca de variável herdada; testar `google-cloud-sdk\bin\gcloud.cmd` por caminho absoluto literal; **não** depender do PATH; validar ausência de reparse point, proprietário esperado e localização fora do repositório; só então, sob `CLOUDSDK_CONFIG` isolado, confirmar pelo campo oficial `installation.sdk_root`; divergência é categoria própria de falha, sem reinstalar, sem alterar PATH e sem remover artefato. `gcloudExecutableNotLocated` só é emitível após falha do teste por caminho absoluto derivado no próprio processo.
- Pesquisa oficial registrada (Google Cloud SDK documentation, consultada em 2026-08-04): instalador `GoogleCloudSDKInstaller.exe` no canal `rapid` em `dl.google.com`, com `/S`, `/D` obrigatoriamente último e sem aspas, `/singleuser` como default, `/noreporting`, `/nostartmenu`, `/nodesktop`, `/allusers`, `/reporting` e `/screenreader`; Python suportado "Python 3.10 to 3.14" com Python 3 empacotado no Windows; arquivos versionados em `.../channels/rapid/downloads/[arquivo]`, com **checksums SHA256 publicados** e instalação por `.\google-cloud-sdk\install.bat` (`install.bat --help` para flags não interativas); desinstalação no Windows por `uninstaller.exe`, com localização oficial por `gcloud info --format='value(installation.sdk_root)'` e `value(config.paths.global_config_dir)`.
- **Limite honesto:** a página oficial de arquivos versionados publica a versão **corrente**, hoje **579.0.0**. A disponibilidade oficial do arquivo exato de **578.0.0** **não foi comprovada** e não pode ser afirmada.

**`ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-LOGIN-EXEC` — autorizado, interrompido fail-closed e pendente de NOVA autorização.**

- Interrompido em 2026-08-04 antes do OAuth sob `gcloudExecutableNotLocated`. Permanece **não iniciado para efeito de sequência** e exige nova autorização literal e novo operador informado em memória.
- **Gate operacional obrigatório antes de iniciar:** confirmar que `LOGIN-GOVERNANCE`, `AUTH-PROVISION-EXEC`, `PROVISION-GOVERNANCE`, `ACTIVATION-PREP`, `ACTIVATION-EXEC`, `INVENTORY-EXEC` e `AUTH-REVOKE` estão prontos para execução praticamente contínua. Com 8 horas absolutas de credencial, iniciar o login sem essa prontidão desperdiça a janela.
- Exige, no ato da execução: e-mail exato da conta Google humana autorizada e a autorização literal `AUTORIZO O ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-LOGIN-EXEC`.
- Deverá incorporar o contrato corretivo de detecção do executável definido pelo `EXECUTABLE-RECOVERY-PREP`.

**Política de persistência da credencial da CLI — decisão humana aprovada em 2026-08-04, vinculante.**

- **60 minutos** sem progresso material. Progresso material é somente a conclusão comprovada de um gate ou bloco da sequência vigente; leitura, espera, pesquisa, preparação de comandos, revisão sem conclusão e ausência de resposta **não** contam.
- **8 horas** absolutas após a conclusão bem-sucedida do `LOGIN-EXEC`, com ou sem progresso. **Nenhuma extensão automática.**
- Atingir **qualquer** um dos limites exige **revogação imediata**, não reavaliação. Os limites são independentes; prevalece o mais próximo.
- Pausa planejada que possa passar de 60 minutos, encerramento de sessão, abandono ou impossibilidade de prosseguir exigem `AUTH-REVOKE` **antes** da pausa ou do encerramento.
- Responsável primário: **Codex**, enquanto tarefa e ambiente estiverem ativos. Subsidiário: **operador humano responsável**; na indisponibilidade dele, um proprietário ou administrador humano autorizado do projeto.
- Após revogação, retomar exige **novo `LOGIN-EXEC`** com preflight, operador informado e autorização própria.
- Escopo proporcional: se o vencimento ocorrer antes do `PROVISION-EXEC` ou do `ACTIVATION-EXEC`, o `AUTH-REVOKE` reduz-se à revogação da credencial da CLI, limpeza das variáveis de processo e comprovação de estado zero — não há binding, conta de serviço ou ADC a remover.
- O `ACTIVATION-PREP` deverá posicionar a janela IAM de 2 horas de modo que `ACTIVATION-EXEC`, `INVENTORY-EXEC` e `AUTH-REVOKE` terminem **antes** de `loginCompletedAtUtc + 8h`. Deixar a credencial expirar com binding viva é resultado proibido.
- Estes prazos são governança **deste projeto**, não limites impostos pelo Google.
- **Estado em 2026-08-05: nenhum prazo em curso e nenhuma credencial ativa.** A política chegou a vigorar entre `2026-08-04T19:07:39Z` e a revogação de `2026-08-05T13:33:51Z`, quando ambos os limites já haviam vencido. Após o `AUTH-REVOKE-EXPIRED-LOGIN`, não há credencial, binding, conta de serviço ou ADC a revogar, e novos prazos só passarão a correr quando outro `LOGIN-EXEC` concluir com sucesso.
- **Precedente registrado:** o primeiro ciclo real desta política terminou em vencimento, não em uso. A causa foi o intervalo entre o `LOGIN-EXEC` e a governança seguinte — o mesmo defeito de sequência que o `AUTH-SEQUENCING-ADJUSTMENT` já havia corrigido para as bindings IAM. Antes de novo login, garantir execução praticamente contínua da cadeia.

**`ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-LOGIN-PREP` — concluído em 2026-08-04, sem login e sem execução de `gcloud`.**

- Parecer: **B** no encerramento do PREP, **elevado a A pelo `LOGIN-PREP-DECISION`** de 2026-08-04, que recebeu os sete parâmetros vinculantes de persistência. Concluído a partir do commit-base `2278f79f14f07235badd55b577e393d85ec7e72c`, exclusivamente por pesquisa em documentação oficial do Google Cloud, análise de segurança, verificação local somente leitura e atualização documental. Zero `gcloud`, login, navegador OAuth, autenticação, token, ADC, acesso remoto a recursos, IAM, API habilitada, inventário, alteração funcional, staging, commit, push ou EXEC iniciado.
- Motivo do bloco: o reparo de isolamento foi concluído sem login, e a autenticação humana **não** é continuação trivial dele. O login grava credenciais no diretório isolado, torna uma conta ativa, abre fluxo OAuth no navegador, cria estado local sensível e exige contrato próprio de operador, sanitização, rollback e revogação. Por isso o projeto **não** foi classificado como pronto diretamente para o `PROVISION-EXEC`.
- Comando único definido: `auth login OPERATOR_IN_MEMORY --brief`, por caminho absoluto de `gcloud.cmd`, sob `CLOUDSDK_CONFIG` isolado apenas no processo. Oficialmente o comando "sets the active account in the current configuration to the account specified", `--activate` é "Enabled by default" e `--brief` é "Minimal user output".
- Proibidos: `--no-activate`, `--update-adc`, `--force`, `--cred-file`, `--enable-gdrive-access`, `--login-config`, `--no-browser`, `--no-launch-browser`, `--impersonate-service-account`, `--access-token-file`, `--project`, `--billing-project`, `gcloud init` e qualquer `gcloud config set`. Fallback sem navegador exige autorização separada; falha do navegador produz `oauthBrowserUnavailable` e para.
- Dois wrappers separados: `Invoke-IsolatedLocalGcloud`, com prompts desativados e allowlist `info`/`auth list`/`config list`/`config configurations list`/`version`; e `Invoke-IsolatedHumanLogin`, uma única vez e exclusivamente para o login, com navegador padrão, zero automação de browser, zero captura de senha ou MFA, zero fallback e zero repetição automática.
- Baseline pré-login: caminho isolado verificado, diretório padrão ausente, zero contas credentialed, zero contas ativas, zero projeto, zero impersonação, zero access-token file, zero ADC, `GOOGLE_APPLICATION_CREDENTIALS` ausente e repositório intacto. Divergência: **não iniciar o login**, não reparar automaticamente, classificar **C** e aguardar revisão humana.
- Verificação local somente leitura feita neste PREP: instalação preservada com `gcloud.cmd` presente; diretório padrão ausente; ADC ausente; variáveis ausentes; diretório isolado existente, sem reparse point, com apenas cinco arquivos de metadata do SDK e **zero** artefatos de credencial. Não substitui a reverificação obrigatória no EXEC.
- Pós-login: exatamente uma conta credentialed e uma ativa, ambas iguais ao operador; caminho isolado; diretório padrão ausente; zero projeto, impersonação, access-token file e ADC; nenhuma configuração adicional; nenhum arquivo no repositório; nenhum comando de recurso. Proibido imprimir e-mail, token, URL, projectId ou output bruto.
- Rollback: `gcloud auth revoke CONTA_EM_MEMÓRIA --quiet` sob o mesmo `CLOUDSDK_CONFIG`. A documentação confirma que, para contas de usuário, o comando revoga o token no servidor e, em caso de sucesso ou token já revogado, "removes the credential from the local machine". `--all` só é admissível com baseline zero comprovado e origem integralmente atribuída ao bloco; caso contrário, parar e escalar.
- Rede: o login **necessariamente** faz comunicação remota de autenticação. `intentionalAuthenticationRemoteFlowExecuted = true`, `intentionalRemoteResourceCommandExecuted = false` e `networkAbsenceForensicallyProven = false` — este intencional, sem alegação absoluta de ausência de tráfego.
- Sequência vigente, após a decisão de 2026-08-04: `EXECUTABLE-RECOVERY-PREP` → `EXECUTABLE-RECOVERY-PREP-DECISION` → commit documental → **novo** `CLI-SETUP-LOGIN-EXEC` com o contrato corretivo de detecção, mediante nova autorização literal e confirmação de prontidão da cadeia → `LOGIN-GOVERNANCE` → `AUTH-PROVISION-EXEC` → `PROVISION-GOVERNANCE` → `ACTIVATION-PREP` → `ACTIVATION-EXEC` → `INVENTORY-EXEC` → `AUTH-REVOKE` → governanças correspondentes → `MIGRATION-PREP` somente se necessário → `FIRESTORE-PREP/EXEC` → `RUNTIME-PREP/EXEC` → `ADMIN-B2B` → `ADMIN-B3`. Nenhuma etapa inicia automaticamente.

**`ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-ISOLATION-REPAIR-EXEC` — concluído em 2026-08-04, sem login e sem acesso remoto a recursos.**

- Classificação funcional: **A. STORES LOCAIS ATRIBUÍDOS AO SDK E COMPROVADAMENTE VAZIOS; ISOLAMENTO DA GOOGLE CLOUD CLI REPARADO SEM LOGIN.** Substitui as classificações **C** anteriores, preservadas como histórico correto das paradas fail-closed ocorridas **antes** das evidências adicionais — o fail-closed foi correto enquanto origem e conteúdo não estavam comprovados.
- Reconciliação: a janela de `2026-08-03T18:13:46Z` a `18:13:57Z` foi reconciliada como pertencente ao anterior `ISOLATION-REPAIR-EXEC`.
- Banco de metadata antes ambíguo: atribuído ao SDK como `sdkManagedLocalMetadataNoCredentials`.
- Credential stores dos diretórios padrão e isolado: atribuídos inequivocamente ao SDK, esquema reconhecido, **zero linhas**, hashes antes/depois idênticos, **zero sidecars** — `sdkManagedEmptyCredentialStore`.
- Access-token caches dos dois diretórios: atribuídos inequivocamente ao SDK, esquema reconhecido, **zero linhas**, hashes antes/depois idênticos, **zero sidecars** — `sdkManagedEmptyAccessTokenCache`.
- Método de inspeção: Python empacotado da CLI por caminho absoluto, código somente em memória, SQLite em `mode=ro` com `immutable=1` e `PRAGMA query_only=ON`, leitura restrita a cabeçalho, schema, integrity check e `COUNT(*)`; **zero leitura de valores** e **zero escrita**, com a igualdade dos hashes como prova observacional.
- Estado autenticado antes do reparo: zero contas credentialed, zero contas ativas, zero projeto, zero impersonação, zero access-token file e zero ADC. `unknownWorkflowArtifactCount = 0`.
- Diretórios: o padrão foi removido por caminho absoluto validado e **não reapareceu** após as chamadas posteriores; o isolado anterior foi removido por caminho absoluto validado; o novo foi recriado vazio, fora do repositório, com proprietário esperado, sem reparse point e com caminho comprovado por `gcloud info --format="value(config.paths.global_config_dir)"`.
- Instalação: preservada, não reinstalada, não desinstalada e sem alteração de PATH nesta execução.
- Resultado sanitizado: `isolatedConfigPathVerifiedAfterRepair = true`, `defaultConfigReappeared = false`, `loginExecuted = false`, `adcDetected = false`, `rollbackRequired = false` e `failureCategory = null`.
- Limites: zero login, navegador OAuth, conta Google autenticada, ADC, access token, ID token, chave, impersonação, recurso IAM, API habilitada, Firestore, Storage, inventário, migração, deploy e publicação; nenhuma alteração no repositório durante o EXEC; nenhum bloco posterior iniciado. Nenhum comando destinado a recurso Google Cloud remoto foi executado; o único acesso remoto intencional foi `git fetch origin`; `networkAbsenceForensicallyProven = false` permanece intencional, sem alegação absoluta de ausência de tráfego de rede.

**Contrato do `ISOLATION-REPAIR-PREP` — preservado como referência do bloco já concluído.**

- Estado do PREP: **concluído** em 2026-08-03, a partir do commit-base `ebe6310fba0fcc8c4c0b2e6ea9c7c4e6db779e48`, com parecer **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-ISOLATION-REPAIR-EXEC**, exclusivamente por pesquisa em documentação oficial do Google Cloud, análise local somente leitura e atualização documental. Zero login, navegador OAuth, access token, ADC, acesso remoto, recurso IAM, API habilitada, inventário, desinstalação, reinstalação, remoção de diretório, execução de `gcloud`, staging, commit, push ou EXEC iniciado.
- Motivo do bloco: o `CLI-SETUP-EXEC` instalou a CLI e parou fail-closed **antes do login** sob `isolatedConfigUnverified`. `%APPDATA%\gcloud` estava comprovadamente ausente no preflight e passou a existir após a instalação e as primeiras execuções locais; o conteúdo não foi lido e não se determinou se a criação veio do instalador ou de uma chamada `gcloud` anterior à definição de `CLOUDSDK_CONFIG`. O diretório isolado também permanece criado e nenhum rollback foi realizado.
- Base oficial: as configurações ficam em `%APPDATA%\gcloud` no Windows; "The config directory can be changed by setting the environment variable `CLOUDSDK_CONFIG`"; e "The gcloud CLI stores the credential files it uses in the gcloud CLI configuration directory". Logo, `CLOUDSDK_CONFIG` é mecanismo oficial e suficiente de isolamento, e relocalizar o diretório relocaliza as credenciais da CLI.
- Limite honesto: **não há** documentação oficial afirmando que `gcloud version`, `gcloud info` ou outro comando isolado **crie** o diretório padrão. A causa da criação permanece **inferência não comprovada**, sustentada por evidência local — três logs de invocação, `config_sentinel`, `active_config` e `config_default` vazio criados na janela do EXEC.
- Prova de caminho — corrigida pelo `ISOLATION-REPAIR-PREP-PATH-FINALIZATION`: uma versão anterior deste PREP afirmou, **incorretamente**, que `config.paths.global_config_dir` não era documentado, e criou a categoria `configPathKeyUnverified`; a afirmação foi removida e a categoria deixou de existir operacionalmente. A documentação oficial orienta o comando `gcloud info --format='value(config.paths.global_config_dir)'` para localizar o diretório de configuração, e o guia de desinstalação repete essa instrução ao lado de `value(installation.sdk_root)`. Esse é o mecanismo oficial de prova, exigido **três vezes**: antes das consultas ao diretório padrão, antes das consultas ao isolado atual e após a recriação do isolado. Comparação com normalização de whitespace externo, resolução absoluta, rejeição de ponto de reparse e semântica case-insensitive do Windows; aprovado só com exit code 0, retorno não vazio, caminho absoluto existente, sem junction/symlink, coincidente com o esperado e fora do repositório. Falhas objetivas: `configPathQueryFailed`, `configPathResponseEmpty`, `configPathResponseMalformed`, `configPathResolutionFailed`, `configPathMismatch`, `configPathReparsePointDetected` e `configPathInsideRepositoryDetected` — cada uma interrompe sem login, sem acesso remoto, sem remoção adicional e sem repetição automática. Nenhum caminho, usuário ou output bruto pode ser impresso, e a saída ganha `defaultConfigPathVerified`, `isolatedConfigPathVerifiedBeforeRepair`, `isolatedConfigPathVerifiedAfterRepair`, `configPathQueryUsedOfficialField` e `configPathFailureCategory`.
- Contrato de isolamento: `CLOUDSDK_CONFIG` definido **antes de toda e qualquer** chamada `gcloud`, inclusive `version`, `info`, `auth list`, `config list`, `config configurations list` e `auth login`; sempre pelo caminho absoluto de `gcloud.cmd`, nunca pelo PATH; somente em processo; sem alterar a configuração padrão do usuário.
- Auditoria permitida: existência, timestamps, proprietário, atributos, contagem e nomes relativos, tamanhos, hashes quando necessários, presença de caminhos conhecidos de credenciais e resultado **sanitizado** de comandos locais. Proibido abrir ou imprimir banco de credenciais, tokens, SQLite, conteúdo de configuração, e-mail, projectId, refresh token, access token, URLs e logs integrais. Dos comandos locais extrair apenas contagens e booleanos.
- Critérios cumulativos de remoção segura: classificação `sessionCreatedNoCredentials` ou `sessionCreatedLocalMetadataOnly` **e** ausência no preflight, criação na janela do EXEC, caminho absoluto exato, proprietário esperado, zero contas credentialed, zero conta ativa, zero projeto, zero impersonação, zero access-token file, zero ADC, nenhum arquivo de origem desconhecida e nenhuma ambiguidade de junction, symlink ou redirecionamento. Falhando qualquer um: não remover, classificar **C** e exigir decisão humana.
- Reparo aprovado: preservar a instalação; não reexecutar o instalador; remover os dois diretórios somente sob os critérios acima, por caminhos absolutos exatos, sem wildcard e sem `git clean`; recriar o diretório isolado vazio; comprovar que o caminho de configuração resolvido é o isolado e que `%APPDATA%\gcloud` não reaparece; e **não executar login no mesmo bloco**.
- Duas correções factuais do relatório do `CLI-SETUP-EXEC`, apuradas por leitura local: `bundledPythonSelected = false` era **limitação de coleta** — a instalação traz `bundledpython` 3.14.6, dentro da faixa oficial 3.10–3.14, e o launcher seleciona o Python empacotado quando `CLOUDSDK_PYTHON` está vazio, que é o estado atual; e **o PATH do usuário foi alterado**, com exatamente uma entrada sob o diretório isolado de instalação, enquanto o PATH de máquina permanece limpo — o relatório anterior registrou o contrário porque o PATH do processo não herda a escrita no PATH do usuário. Nenhuma é bloqueante; ambas integram rollback e governança.
- Controles processuais da CLI, fixados pelo `ISOLATION-REPAIR-PREP-LOCAL-NETWORK-FINALIZATION`: antes de **toda** chamada `gcloud`, definir simultaneamente e **somente no processo** `CLOUDSDK_CONFIG`, `CLOUDSDK_CORE_DISABLE_USAGE_REPORTING = "true"`, `CLOUDSDK_COMPONENT_MANAGER_DISABLE_UPDATE_CHECK = "true"` e `CLOUDSDK_CORE_DISABLE_PROMPTS = "1"`, sem escopo `User`/`Machine`, sem perfil, sem arquivo e com limpeza obrigatória em `finally`. É **proibido** `gcloud config set` para esses controles, porque persistiria propriedades **dentro dos próprios diretórios auditados** e contaminaria a evidência. Limite honesto: apenas `CLOUDSDK_CORE_DISABLE_PROMPTS` é demonstrado verbatim na documentação; as outras duas seguem o padrão `CLOUDSDK_SECTION_PROPERTY` por inferência, e o EXEC deve **comprovar o efeito** por leitura sanitizada, classificando `gcloudUsageReportingControlUnverified`, `gcloudUpdateCheckControlUnverified` ou `gcloudPromptControlUnverified` quando não conseguir.
- Wrapper e allowlist: todas as chamadas passam por uma única função local que define as quatro variáveis, usa somente o caminho absoluto de `gcloud.cmd`, valida as invariantes antes de executar, captura exit code e saída apenas em memória e não usa PATH, alias ou `Start-Transcript`. Allowlist fechada, validada **antes** de iniciar o processo: `info --format=value(config.paths.global_config_dir)` — opcionalmente `--anonymize` —, `auth list --format=json`, `config list --format=json`, `config configurations list --format=json` e `version` quando necessário. Proibidos `auth login`, `auth revoke`, `auth print-access-token`, `auth application-default`, `projects`, `iam`, `services`, `firestore`, `storage`, `firebase`, `components update/install`, `config set/unset` e qualquer outro; tentativa produz `nonAllowlistedGcloudCommandRequested` e o comando **não** é executado. Colisão de variável preexistente com valor divergente: `processEnvironmentCollision`, parada antes da primeira chamada, sem sobrescrever e sem remover a preexistente.
- Correção da afirmação de rede: retiradas as formulações absolutas de "zero possibilidade de operação remota" e de prova de ausência total de tráfego. O contrato preciso é **nenhuma operação remota intencional** — zero comando destinado a recurso remoto, zero login, zero chamada a API de recurso, zero comando Firestore/IAM/Storage/Firebase, telemetria, update check e prompts desativados no processo — e **nenhuma alegação forense** de ausência absoluta de tráfego. Campos acrescentados: `usageReportingDisabledForProcess`, `automaticUpdateCheckDisabledForProcess`, `promptsDisabledForProcess`, `gcloudCommandsExecutedThroughWrapper`, `nonAllowlistedGcloudCommandBlocked`, `processEnvironmentCollision`, `intentionalRemoteResourceCommandExecuted` e `networkAbsenceForensicallyProven` — os quatro primeiros `true` e os quatro últimos `false` em sucesso, sendo `networkAbsenceForensicallyProven = false` **intencional e não uma falha**. Zero acesso a dados, zero IAM, zero autenticação e zero inventário permanecem intactos.
- Escopo negativo do reparo: **não** autentica, **não** cria ADC, token, custom role, conta de serviço ou binding, **não** habilita API, **não** lê policy, ancestralidade, Firestore ou dados, **não** executa inventário e **não** desinstala nem reinstala a CLI.

**`ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-EXEC` — autorizado e executado parcialmente em 2026-08-03; parada fail-closed antes do login.**

- Resultado: CLI 578.0.0 instalada em escopo single-user, assinatura do instalador válida, instalador temporário removido, `gcloud.cmd` localizado, diretório isolado criado e `CLOUDSDK_CONFIG` definido em parte das verificações. **Não ocorreram** login, navegador OAuth, access token, ADC, conta autenticada, recurso IAM, acesso a dados, alteração no repositório, staging, commit ou push. Falha registrada: `isolatedConfigUnverified`. Classificação: **PARADA FAIL-CLOSED ANTES DO LOGIN — CLI INSTALADA, ISOLAMENTO NÃO COMPROVADO, OPERADOR NÃO AUTENTICADO**.
- Os bullets abaixo permanecem válidos como contrato herdado do PREP e continuam regendo o futuro bloco de login, que passa a ser separado do reparo.
- Estado do PREP: **concluído** em 2026-08-03 com parecer **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-EXEC**, exclusivamente por pesquisa oficial, verificação local somente leitura e atualização documental, sem download, instalação, PATH, `gcloud`, login, ADC, token, credencial ou acesso remoto.
- Motivo do bloco: o preflight comprovou que **a Google Cloud CLI não está instalada** e que **nenhum operador está autenticado**, portanto nenhum gate remoto do PROVISION pode ser executado. Instalar software e autenticar identidade humana são mutações de ambiente distintas da criação de recursos IAM e exigem bloco, preflight e autorização próprios.
- Ausência comprovada: `gcloud`, `gcloud.cmd`, `gsutil` e `bq` não resolvem; nenhuma entrada de PATH com `Google`/`Cloud SDK`/`CloudSDK`; `gcloud.cmd` ausente sob o perfil até profundidade 4; e ausentes `%LOCALAPPDATA%\Google\Cloud SDK`, `%APPDATA%\gcloud`, `%ProgramFiles%\Google\Cloud SDK`, `%ProgramFiles(x86)%\Google\Cloud SDK`, `C:\Google\Cloud SDK` e `%LOCALAPPDATA%\Google\CloudSDK`. Nenhum comando `gcloud` foi invocado.
- Estado local: `%APPDATA%\gcloud` ausente; ADC ausente; `CLOUDSDK_CONFIG` e `GOOGLE_APPLICATION_CREDENTIALS` não definidas; diretório isolado pretendido ausente; sessão **não** administrativa; Windows 11 Pro AMD64, PowerShell 7.6.3, Python do sistema `Python314` — dentro da faixa oficial suportada de 3.10 a 3.14.
- Prova de isolamento disponível: como nada preexiste, o EXEC comprova o isolamento por observação — `%APPDATA%\gcloud` e o arquivo ADC devem permanecer **ausentes** após instalação e login. Não há risco de sobrescrever configuração, credencial ou ADC do usuário.
- Contrato do EXEC: instalador oficial único `GoogleCloudSDKInstaller.exe` de `dl.google.com` por HTTPS; `Get-AuthenticodeSignature` exigindo `Valid` e publisher Google LLC; SHA-256 registrado apenas como evidência da cópia, **sem** allowlist permanente; instalação **silenciosa** com `/S /singleuser /noreporting /nostartmenu /nodesktop` e `/D=` por último; diretório **sem espaço** porque `/D` proíbe aspas; escopo por usuário; `gcloud.cmd` localizado por caminho absoluto, nunca presumido; `version` apenas para registro, **sem** `components update`.
- Limite honesto: a documentação oficial **não** expõe flag para Python empacotado, PATH, `gcloud init` ou abertura da shell. Esses efeitos são tratados por **observação** antes/depois, nunca por promessa, e nenhuma flag será inventada. PATH de sistema não é alterável nesta sessão não administrativa; alteração inesperada dele interrompe.
- Autenticação: somente `auth login --brief`, com conta humana autorizada recebida em memória, sob `CLOUDSDK_CONFIG` isolado em `%LOCALAPPDATA%\Google\CloudSDK\admin-b2a5-config`, definido **apenas no processo**. Proibidos `gcloud init`, `application-default login`, `--update-adc`, `--cred-file`, chave JSON, impersonação, workload identity, `--access-token-file`, projeto padrão e qualquer `gcloud config set`. Fluxo padrão de navegador local; `--no-browser` e `--no-launch-browser` **não** serão usados sem autorização.
- Isolamento por **diretório** de configuração, não por configuração nomeada, porque as credenciais da CLI residem no diretório de configuração. Colisão em `absent`/`exists-empty`/`exists-nonempty`/`inaccessible`/`ambiguous`: **somente `absent` autoriza criação**; qualquer outro estado para, sem reutilizar, apagar, renomear ou sobrescrever.
- Persistência decidida: **preservar** a autenticação isolada até o `AUTH-REVOKE`, porque PROVISION, ACTIVATION, INVENTORY e o próprio REVOKE dependem do operador autenticado. Risco residual registrado; o `AUTH-REVOKE` passa a incluir `gcloud auth revoke`, remoção do diretório isolado, limpeza das variáveis de processo e, se aplicável, desinstalação da CLI e reversão de PATH.
- Escopo negativo: o SETUP **não** cria custom role, conta de serviço, binding, ADC, token da conta de serviço, chave ou janela; **não** habilita API; **não** lê policy, ancestralidade, Firestore ou dados; **não** executa inventário; e **não** inicia o PROVISION-EXEC.

**`ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC` — bloco seguinte, ainda não iniciado, dependente da conclusão e da governança do CLI-SETUP.**

- Estado do PREP: **concluído** em 2026-07-31 com parecer intermediário **B**, elevado a **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC** pelo `PROVISION-PREP-DECISION`, que adotou a política **fail-closed** de ancestralidade e encerrou a única pendência.
- Pré-requisito operacional: exige CLI instalada e operador autenticado, usando o caminho absoluto de `gcloud.cmd` e o `CLOUDSDK_CONFIG` isolado. A CLI 578.0.0 está instalada, o isolamento foi comprovado, um novo login foi concluído em 2026-08-07 e o `IAM-API-ENABLEMENT-EXEC` confirmou as duas APIs IAM habilitadas. A credencial permanece ativa sob a política de 60 minutos sem progresso material e limite absoluto invariável de 8 horas; o PROVISION ainda exige gate temporal, todos os gates contratuais e autorização humana literal própria.
- Política fail-closed: o EXEC consulta a ancestralidade do projeto **somente por leitura e antes de qualquer mutação**. Em `project-only`, basta a allow policy do projeto mais a policy da própria conta após a criação. Havendo pasta ou organização, é obrigatória a leitura bem-sucedida das allow policies de **todos** os níveis ancestrais, o que exige `resourcemanager.folders.getIamPolicy` e `resourcemanager.organizations.getIamPolicy` nos recursos correspondentes. `PERMISSION_DENIED`, `inaccessible`, `ambiguous`, `ancestorPolicyUnreadable`, `ancestryIncomplete`, `indirectMembershipRisk`, `rolePermissionsUnresolved` ou `conditionalBindingsUnverified` **interrompem antes da primeira criação** — custo zero, nada criado, nenhum identificador consumido.
- A varredura abrange identidade individual, principal sets de projeto/pasta/organização, `allUsers`, `allAuthenticatedUsers`, **`group:`**, **`domain:`** — ambos sob o mesmo fail-closed —, bindings condicionais, políticas diretas e herdadas e as **permissões efetivas dos papéis**, que precisam ser expandidas por leitura e nunca inferidas pelo nome.
- Escopo da prova, delimitado pelo `PROVISION-PREP-SCOPE-CORRECTION`: fail-closed obrigatório para **zero acesso Firestore/Datastore**, **zero capacidade de impersonação, token ou chave** e **zero binding criada pelo fluxo**. **Não** há prova de ausência global de acesso a Storage, ACLs, recursos descendentes ou demais serviços — a análise hierárquica não os alcança, e Policy Analyzer e Cloud Asset API não serão habilitados.
- Transporte dos gates, fixado pelo `PROVISION-PREP-REST-TRANSPORT-FINALIZATION`: os quatro `testIamPermissions` serão executados pelos **endpoints REST oficiais** — `cloudresourcemanager.googleapis.com/v3` para projeto, pasta e organização e `iam.googleapis.com/v1` para a conta já criada —, porque a referência estável da gcloud CLI não expõe comandos equivalentes e nenhum comando será inventado. O transporte usa um **access token OAuth temporário do operador humano**, somente em memória, obtido por `gcloud auth print-access-token`, nunca impresso ou persistido e obrigatoriamente limpo em `finally`. Isso **não** é ADC, impersonação, token da conta de serviço ou início de janela; ADC, `--impersonate-service-account`, ID token, chave e credencial persistida seguem proibidos.
- Projeto de quota: as chamadas REST usam `X-Goog-User-Project`, o que exige **`serviceusage.services.use`** no projeto — agora parte do gate pré-mutação, ao lado de `serviceusage.services.list`. A primeira chamada é fail-closed: falha de quota project ou ausência dessa permissão na resposta produz `operatorQuotaProjectPermissionMissing`, limpa o token e **para antes de qualquer mutação**, sem remover o cabeçalho, trocar de projeto de quota ou conceder permissão.
- Proibido: ampliar acessos do operador em pasta ou organização, habilitar Policy Troubleshooter, Policy Analyzer, Cloud Asset API ou Cloud Identity, aceitar formalmente políticas ancestrais não verificadas, escalar verificação incompleta ao `ACTIVATION-PREP`, tratar ausência de permissão como ausência de policy, usar tentativa de criação como descoberta e declarar prova global de ausência de acesso.
- Estado do EXEC: **não iniciado**. Criará exclusivamente o custom role `adminB2A5InventoryRead` e a conta de serviço `admin-b2a5-inventory-reader`, nesta ordem. **Nenhuma binding, nenhum ADC, nenhum token da conta de serviço, nenhuma impersonação, nenhum acesso a Firestore e nenhuma janela iniciada** — o único token é o access token temporário do próprio operador humano, em memória, para o transporte REST dos gates.
- Motivo da separação: o AUTH-EXEC monolítico deixaria binding de 2 horas, binding de Token Creator e ADC ativos durante a revisão humana e o commit documental, consumindo ou expirando a janela. Provisionamento e ativação passam a ser blocos distintos, porque criar conta e conceder papéis são etapas oficialmente separadas e uma conta sem binding não possui acesso.
- Parâmetros aprovados e preservados: exclusivamente `datastore.entities.get` e `datastore.entities.list`; `roles/datastore.viewer` descartado; nenhuma chave JSON; Token Creator somente na conta específica; token de aproximadamente 1 hora; janela de 2 horas; `--max-docs 10000`; Data Access audit logs mantidos como estão; conta desabilitada e preservada 7 dias; `AUTH-REVOKE` obrigatório; condição pelo database `(default)`; coleção e campos impostos pelo código, não pelo IAM.
- Gate: exige autorização humana própria; o PROVISION não executa binding, ADC, inventário, migração, Firestore, runtime, Storage ou publicação.
- Sequência vigente após `IAM-API-ENABLEMENT-GOVERNANCE`: `AUTH-PROVISION-EXEC` → `PROVISION-GOVERNANCE` → `ACTIVATION-PREP` → `ACTIVATION-EXEC` → `INVENTORY-EXEC` → `AUTH-REVOKE` → governanças correspondentes → `MIGRATION-PREP` somente se necessário → `FIRESTORE-PREP/EXEC` → `RUNTIME-PREP/EXEC` → `ADMIN-B2B` → `ADMIN-B3`.
- Publicação: continua bloqueada e reservada exclusivamente ao `ADMIN-B3`.

## ADMIN-RESTART-PREP — checkpoint e retomada oficial

### Limites e resultado do PREP

- Concluído somente em leitura, diagnóstico, testes estáticos e smoke sem autenticação.
- Nenhum arquivo foi alterado, criado ou excluído.
- Nenhuma escrita foi feita em Firestore, Firebase Storage, Firebase Authentication, rules, CORS, dados ou produção.
- Nenhum commit, push, deploy, seed, migração ou inventário remoto foi executado.
- Working tree encontrado: branch `main`; referência local `main` alinhada com `origin/main`; nenhuma alteração rastreada; `.claude/settings.local.json` não rastreado e intocado.
- A consulta remota independente do `origin` não foi confirmada por falta de credencial no ambiente.

### Sistemas e prioridade

1. Site público — pausado.
2. Painel Admin/CMS — frente ativa.
3. Portal do Usuário — separado do painel e do site público.

Não misturar refatoração ou execução entre os três sistemas sem bloco e autorização específicos. A modularização administrativa deve continuar progressivamente no futuro, sem reversão e sem reescrita ampla, mas não é a prioridade imediata.

### Estado real do painel

O painel possui runtime administrativo real e não é apenas um protótipo. Estão funcionais ou amplamente implementados:

- autenticação administrativa;
- dashboard;
- aprovações;
- vínculos;
- usuários;
- eventos;
- notícias;
- Biblioteca de Mídia;
- banners;
- empreendimentos;
- contratos de mídia;
- gestão editorial da galeria de empreendimentos;
- scripts de seed/diff;
- inventário seguro de mídias;
- fundação modular em modo passthrough.

Fundação modular real: Dashboard, Banners, Empreendimentos, Context, UI, Registry, Router e Shell.

### Estado dos blocos CMS

- CMS-1: diagnóstico concluído.
- CMS-2A: contrato documentado.
- CMS-2B: CRUD implementado; validação autenticada atual pendente.
- CMS-2B-FIX: lifecycle implementado; produção atual não comprovada.
- CMS-2C: seed/diff e dry-run implementados.
- CMS-2F: seed manual anteriormente registrado; não revalidado.
- CMS-3: aplicação textual implementada; teste autenticado atual pendente.
- CMS-4A: contrato de mídia documentado.
- CMS-4B: revisão por imagem implementada.
- CMS-4C: runtime implementado, mas teste real permaneceu bloqueado por Storage/CORS.
- CMS-4D: gestão editorial da galeria de empreendimentos implementada.
- CMS-4E: inventário seguro implementado.
- CMS-4E-EXEC: não concluído.
- CMS-5A: diagnóstico concluído.
- CMS-5B: adapter/debug isolado implementado.
- CMS-5C: código e rule local concluídos; a governança registra publicação específica.
- CMS-5D: não iniciado e fora da frente atual.

## ADMIN-B1-PREP — concluído

### Confirmações e limites

- Execução exclusivamente em leitura.
- Login Admin manual e real confirmado; dashboard administrativo carregado; logout normal concluído.
- Leituras administrativas confirmadas para `usuarios`, `eventos_pendentes`, `eventos_aprovados` e `estabelecimentos_pendentes`.
- Nenhuma escrita, alteração de Auth, publicação de Rule, upload ou aplicação de CORS.
- O primeiro bloco deixou inconclusivos: Rules remotas completas, notícias draft anônimas, `media_library` anônima, `cms-media` anônimo, CORS, usuário `moderator` e usuário inativo.
- Análise estática confirmou a divergência: o frontend do painel aceita somente `admin`, enquanto as Rules locais concedem permissões específicas a `moderator`.

## ADMIN-B1B-PREP — concluído

### Escopo remoto e projeto

- Somente métodos GET/LIST; nenhuma fonte remota persistida em arquivo e nenhuma configuração alterada.
- Projeto `turismo-sms`; database `(default)`; Firestore em `southamerica-east1`; bucket `turismo-sms.firebasestorage.app` em `US-EAST1`.

### Firestore Rules — origem da verdade confirmada

- Release: `projects/turismo-sms/releases/cloud.firestore`.
- Ruleset: `projects/turismo-sms/rulesets/65e9a0eb-bb4a-4578-9e01-42a3c8137cf2`.
- Na conclusão do `ADMIN-B1B-PREP`, `firestore.rules` local e Rules implantadas eram **iguais**, com zero linhas divergentes.
- SHA-256 normalizado: `24f14a398a289a429b0aaa146451c80e115f37315d1a09dcf4e3a810712438cc`.
- Esse registro é histórico: o `ADMIN-B2A3-EXEC` passou a versionar uma Rule local nova para `noticias`, ainda não publicada. Produção permanece com a versão anterior até o `ADMIN-B3`.

### Storage Rules — origem da verdade confirmada

- Release: `projects/turismo-sms/releases/firebase.storage/turismo-sms.firebasestorage.app`.
- Ruleset: `projects/turismo-sms/rulesets/23c647df-d6bd-4013-a3aa-a4efba2107bc`.
- `storage.rules` local e Rules implantadas: **iguais**, com zero linhas divergentes.
- SHA-256 normalizado: `867deaf99e9724e00d3da89225e3d94fc2b197a7e8b14198696740e1554649fd`.
- O arquivo local é a origem da verdade correspondente à versão atualmente implantada.

### CORS — equivalência confirmada

- Bucket: `turismo-sms.firebasestorage.app`.
- Origem: `https://turismo.saomateusdosul.pr.gov.br`.
- Métodos: GET e HEAD.
- Response headers: `Content-Type` e `Access-Control-Allow-Origin`.
- `maxAgeSeconds`: 3600.
- CORS remoto e `storage-cors.json` local: **iguais**.
- Decisão: não reaplicar CORS. O CMS-4C ainda exige reteste funcional, mas CORS ausente/divergente deixa de ser hipótese principal.

### App Check — estado observado

- App Web: Cadastros Turismo; provider: reCAPTCHA.
- Firestore: Monitorando; 81% verificadas e 19% não verificadas; enforcement não aplicado.
- Storage: Não aplicado; sem enforcement.
- Authentication: Monitorando; 100% verificadas e 0% não verificadas; enforcement não aplicado.
- Decisão: não ativar enforcement nesta etapa; investigar `appCheck/fetch-network-error` separadamente e acompanhar métricas.

### Riscos prioritários confirmados

**P0**

1. `noticias` possui leitura pública ampla nas Firestore Rules implantadas; filtragem de status no frontend não protege documentos draft.

**P1**

2. `media_library` possui leitura pública ampla nas Firestore Rules implantadas.
3. `cms-media` possui leitura pública ampla e recursiva nas Storage Rules implantadas.

### Contratos pendentes de decisão humana

- `isAdmin` e `isModerator` usam `ativo != false`; não exigem explicitamente `ativo == true`.
- Firestore e Storage concedem permissões limitadas a `moderator`; o frontend do painel aceita somente `admin`.
- O comportamento real de uma conta `moderator` não foi testado.
- Nenhuma decisão de role deve ser implementada sem aprovação humana.

### Itens ainda inconclusivos

- causa exata de `appCheck/fetch-network-error`;
- conta `moderator` real;
- usuário inativo real;
- execução real de `submissions`;
- teste ponta a ponta do CMS-4C;
- domínio do registro App Check não exibido na tela consultada.

### Itens que não bloqueiam a primeira versão utilizável

- integração de `cms_establishments` com o site público;
- CMS-5D;
- galeria pública;
- substituição dos dados estáticos públicos;
- Rotas no Admin;
- Sazonal;
- Mascote;
- Configurações;
- relatórios avançados;
- master admin;
- notificações automáticas.

## ADMIN-B2A-PREP — concluído

- O contrato e a estratégia de testes das Firestore Rules foram preparados sem edição ou publicação.
- A execução foi dividida em microblocos para separar baseline, compatibilidade do consumidor público, correções de segurança e decisões humanas.
- Ordem aprovada: `ADMIN-B2A1-EXEC` → `ADMIN-B2A2-BRIDGE` → `ADMIN-B2A3` → `ADMIN-B2A4` → `ADMIN-B2A5`.
- A disciplina PREP/EXEC permanece obrigatória. O bridge, o CSP-FIX, o `ADMIN-B2A3-PREP`, o `ADMIN-B2A3-EXEC`, o `ADMIN-B2A4-PREP` e o `ADMIN-B2A4-EXEC` foram concluídos; o `ADMIN-B2A5` é o próximo bloco possível, permanece não iniciado e depende de PREP e autorização explícita próprios.

## ADMIN-B2A1-EXEC — concluído

### Evidência funcional confirmada

- Status: concluído, validado, commitado, enviado por push e presente em `origin/main`.
- Commit funcional completo: `9ccc595d34edb106348936f23ce789329047280c`.
- Mensagem: `test(rules): adiciona baseline local das Firestore Rules administrativas`.
- Arquivos reais: `firebase.json` modificado; `package.json`, `package-lock.json` e `tests/firestore.rules.test.mjs` criados.
- Estatística real: 4 arquivos alterados e 10.129 inserções — 10 em `firebase.json`, 14 em `package.json`, 9.442 em `package-lock.json` e 663 em `tests/firestore.rules.test.mjs`.

### Infraestrutura local e isolada

- `package.json`: `private: true`, `type: module`, somente `devDependencies`, runner Node separado, Firestore Emulator e concorrência 1; nenhum script de build, deploy ou produção.
- Dependências diretas exatas: `firebase@12.16.0`, `@firebase/rules-unit-testing@5.0.1` e `firebase-tools@15.24.0`.
- `package-lock.json`: lockfile version 3, gerado e versionado, com 9.442 linhas e dependências raiz limitadas às três versões autorizadas.
- `firebase.json`: preservou as referências a `firestore.rules` e `storage.rules`; adicionou somente Firestore Emulator na porta 8080, Emulator UI na porta 4000 e `singleProjectMode: true`.
- Não foram adicionados Auth Emulator, Storage Emulator, Functions, Hosting, import/export ou projeto Firebase real.
- Projeto demo obrigatório em todo o ambiente: `demo-turismo-sms-rules-test`, usado pelo script npm, Firebase CLI, `initializeTestEnvironment` e endpoint local de coverage.
- O projeto real `turismo-sms` não foi usado operacionalmente. Não houve login Firebase, API key, token, credencial, chamada de produção, dado real, UID real, e-mail real ou URL real.

### Suíte automatizada

- Arquivo: `tests/firestore.rules.test.mjs`.
- Estrutura: `node:test`, `@firebase/rules-unit-testing`, API modular do Firestore, leitura de `firestore.rules` diretamente do disco, uma inicialização de `initializeTestEnvironment`, `clearFirestore` antes de cada teste, `cleanup` no final e `withSecurityRulesDisabled` somente para seeds fictícios.
- Dados: exclusivamente artificiais.
- Resultado final após reinstalação e limpeza: 44 testes, 5 suítes, 44 aprovados, 0 falhas, 0 cancelados, 0 ignorados, 0 `todo`; código de saída 0.
- Coverage local: `http://127.0.0.1:8080/emulator/v1/projects/demo-turismo-sms-rules-test:ruleCoverage`, com HTTP 200 e nenhum arquivo de coverage persistido.

### Baseline de `noticias`

- Anônimo lê notícia publicada, lê notícia draft, lista toda a coleção e executa query com `publicado == true`.
- Usuário comum lê draft; `moderator` lê draft por causa da leitura pública; admin ativo lê draft.
- Anônimo, usuário comum e `moderator` não criam notícia; admin ativo cria; admin inativo não cria.
- Decisão: o baseline inseguro documenta e reproduz o risco **P0**, sem aceitá-lo. A leitura pública de drafts será alterada somente no `ADMIN-B2A3`; `firestore.rules` permaneceu intacto no B2A1.

### Baseline de `media_library`

- Anônimo faz `getDoc` e lista a coleção; usuário comum, `moderator` e admin ativo leem.
- Anônimo, usuário comum e `moderator` não criam; admin ativo cria; admin inativo não cria.
- Decisão: o risco **P1** está reproduzível e será tratado somente no `ADMIN-B2A4`; `firestore.rules` permaneceu intacto no B2A1.

### Baseline do campo `ativo`

- `ativo: true` — ALLOW; `ativo: false` — DENY; campo ausente — DENY.
- `ativo: null`, `ativo: "true"` e `ativo: 1` — ALLOW.
- Role ausente, role inválida e documento `usuarios` ausente — DENY.
- Conclusão: o contrato atual `ativo != false` aceita valores não booleanos diferentes de `false`. A decisão e eventual correção permanecem reservadas ao `ADMIN-B2A5`.

### Baseline de `moderator`

- `moderator` ativo lê, atualiza e exclui `eventos_pendentes`; `moderator` inativo recebe DENY.
- `moderator` não cria `noticias`, não cria `media_library`, não lista `usuarios`, lê o próprio documento `usuarios` e não administra `cms_establishments` draft.
- `moderator` escreve `eventos_aprovados` conforme a Rule atual.
- Conclusão: o contrato real está automatizado; o frontend continua aceitando somente `admin`; a decisão institucional e qualquer alteração permanecem reservadas ao `ADMIN-B2A5`.

### Fallback global deny

- Anônimo, usuário comum e admin não leem coleção desconhecida sem `match` explícito.
- O fallback global deny permanece válido.

### Limpeza local e dívida npm

- A instalação inicial apresentou `google-logging-utils@1.1.4` e um `picomatch@4.0.5` aninhado como extraneous.
- `npm prune --no-save` removeu os dois extraneous; o SHA-256 de `package-lock.json` permaneceu igual.
- Novo `npm prune --dry-run` retornou `remove` vazio; `npm ls --depth=0` mostrou somente as três dependências diretas; `google-logging-utils` permaneceu apenas em versões transitivas legítimas.
- A suíte passou novamente em 44/44 após a limpeza. Os extraneous não são pendência atual.
- Dívida não bloqueante das ferramentas de desenvolvimento: quatro avisos de pacotes depreciados e sete vulnerabilidades moderadas relatadas pelo npm. Nenhum `npm audit fix` ou atualização automática foi executado.

### Limites e preservações

- O bloco não corrigiu Rules. `firestore.rules`, `storage.rules`, `storage-cors.json`, `.firebaserc`, runtime, dados, site público, Portal do Usuário, metadata e governança permaneceram intactos no commit funcional.
- Nenhuma Rule foi alterada, criada remotamente, sincronizada, implantada ou publicada.
- `ADMIN-B3` continua sendo o único bloco autorizado a publicar Rules.

## ADMIN-B2A2-BRIDGE — concluído, publicado e aprovado

### Evidência do commit

- Commit funcional: `4b1b783398fa659ebbff7302cdf1038e6bdd184a`.
- Mensagem: `fix: filtrar notícias públicas no Firestore`.
- Presença: confirmado como ancestral de `origin/main`.
- Arquivos: `js/cms.js`, `noticias.html`, `noticia.html` e `js/site-meta.js`.
- Estatística real: 4 arquivos alterados, 32 inserções e 29 remoções.

### Contrato implementado

- A consulta pública usa `where('publicado', '==', true)` e mantém filtro posterior como defesa adicional.
- Resultado vazio do Firestore é sucesso: `CMS.posts = []` e `CMS.source = 'firebase'`; fallback local ocorre somente em falha real.
- `noticia.html` carrega `config.js` antes de `js/cms.js`.
- Token do CMS preservado: `admin-b2a2-20260724`.
- `firestore.rules`, long polling, Service Worker, paginação, `orderBy`, `limit` e leitura direta por slug permaneceram fora do bloco.

### Validação funcional final contra o servidor

- `getDocsFromServer`: `ok: true`, `source: server`, `count: 8` e `allPublished: true`.
- Runtime CMS: binding `object`, `CMS.source = 'firebase'`, `count: 8` e `allPublished: true`.
- `noticias.html`: página íntegra, grid visível, 8 cards presentes e visíveis, uma carga de `config.js`, uma carga de `js/cms.js`, nenhum fallback por configuração ausente, nenhum `permission-denied`, timeout ou `unavailable`.
- Conclusão: bridge aprovado e compatível com a futura proteção das Rules.
- `ADMIN-B2A2-FIRESTORE-TRANSPORT-PREP` não é necessário no estado atual; reabrir somente se timeout reaparecer após CSP válida.

## ADMIN-B2A2-NETWORK-DIAG-PREP — concluído

### Matriz confirmada

- Firefox normal / rede residencial: timeout.
- Firefox normal / rede institucional: timeout.
- Firefox normal / hotspot móvel: timeout.
- Chrome / hotspot móvel: timeout.
- CSP/reCAPTCHA bloqueada em todas as combinações testadas.
- Sem `permission-denied`.
- Sem `CONFIG.firebase` ausente.

### Parecer

- Defeito confirmado: `https://www.google.com/recaptcha/api.js`, originado por `firebase-app-check.js`, está bloqueado por `script-src-elem`.
- A CSP não define `script-src-elem` separadamente; o navegador usa `script-src` como fallback, e essa diretiva não autoriza o recurso.
- Os bloqueios de `firebase-app.js.map`, `firebase-firestore.js.map` e `firebase-app-check.js.map` por `connect-src` envolvem recursos de depuração do DevTools e não comprovam, por si, falha de execução dos módulos Firebase.
- Conclusão conservadora: a incompatibilidade CSP/reCAPTCHA é um defeito objetivo e corrigível, mas ainda não está comprovada como causa única do timeout do Firestore.
- Preservações: `js/cms.js` e Firestore Rules não foram alterados; `ADMIN-B2A3` não foi iniciado; long polling não foi testado.

## ADMIN-B2A2-CSP-FIX — concluído, publicado e aprovado

### Evidência do commit

- `ADMIN-B2A2-CSP-FIX-PREP`, `ADMIN-B2A2-CSP-FIX-EXEC` e `ADMIN-B2A2-CSP-FIX-PROD-VALIDATION` concluídos.
- Commit funcional: `e2c82494c438f7f722fcf82fa47c1705f8854feb`.
- Mensagem: `fix: permitir reCAPTCHA nas páginas Firebase públicas`.
- Presença: `HEAD`, `main`, `origin/main` e `origin/HEAD`; confirmado como ancestral de `origin/main`.
- Arquivos: `noticias.html`, `noticia.html`, `reservas.html`, `sabores.html` e `js/site-meta.js`.
- Estatística real: 5 arquivos alterados, 5 inserções e 5 remoções.
- Metadata funcional confirmada em `js/site-meta.js`: `2026-07-27T13:07:40-03:00`.

### Delta CSP mínimo

- `script-src`: adicionado `https://www.google.com/recaptcha/`.
- `frame-src`: adicionado `https://recaptcha.google.com/recaptcha/`.
- `connect-src`: adicionados `https://firebaseinstallations.googleapis.com`, `https://content-firebaseappcheck.googleapis.com`, `https://firebaseappcheck.googleapis.com` e `https://www.google.com/recaptcha/`.
- Preservados: diretivas e origens anteriores, `unsafe-inline`, `unsafe-eval`, wildcards existentes, posição da meta, UTF-8 sem BOM, LF, Service Worker, `CACHE_NAME` e tokens dos scripts.
- Não adicionados: `script-src-elem`, `script-src-attr`, nonce, `strict-dynamic`, wildcard novo, endpoints de source map, `securetoken` ou `*.googleapis.com`.

### Publicação

- Domínio oficial: HTTP 200 para `noticias.html`, `noticia.html`, `reservas.html`, `sabores.html` e `js/site-meta.js`.
- Cada uma das quatro páginas serve exatamente uma meta CSP.
- Headers observados: `Cache-Control: max-age=600`, `Server: GitHub.com` e `Via: 1.1 varnish`.
- CSP por header e CSP Report-Only: ausentes. A política ativa continua vindo somente da meta HTML.
- `_headers` local não é aplicado pelo hosting atual e permaneceu intacto.

### Chrome, Firefox, reCAPTCHA e App Check

- Chrome: hard reload; `api.js`, iframe e endpoints do App Check sem bloqueio; `getDocsFromServer` e CMS Firebase aprovados.
- Firefox: hard reload; `grecaptcha` disponível como objeto; `api.js`, iframes e anchors carregados; CMS Firebase com 8 itens e sem diferença funcional relevante.
- Source maps bloqueados permanecem recursos de depuração sem impacto funcional.
- Avisos de cookies/armazenamento particionado do Firefox permanecem informativos e sem falha funcional comprovada.

### Páginas validadas e limitação residual

- `noticias.html`: aprovada com Firestore real, 8 cards e nenhum draft no resultado normalizado.
- `noticia.html` com slug inexistente: aprovada com “Notícia não encontrada”, sem conteúdo de outro documento, scripts únicos e CMS mantido em Firebase.
- `reservas.html`: smoke somente de leitura aprovado, 6 cards, formulário fechado e nenhuma escrita.
- `sabores.html`: smoke somente de leitura aprovado, conteúdo estrutural íntegro, banners sem bloqueio e nenhuma escrita.
- Detalhe de notícia publicada: **NÃO TESTADO**. A listagem apresentou `internalDetailLinkCount: 0`; nenhum link interno seguro estava disponível e nenhum slug foi inventado ou extraído manualmente.
- A limitação do detalhe é follow-up funcional separado e não bloqueia a aprovação da CSP, do bridge ou o gate do `ADMIN-B2A3-PREP`.

### Preservações e gate

- Permaneceram intactos: `firestore.rules`, `storage.rules`, `tests/firestore.rules.test.mjs`, `admin-firebase.html`, `portal-usuario.html`, `js/cms.js` após o bridge, `js/firebase-app-check.js`, `config.js`, `sw.js`, dados, Firebase remoto, App Check remoto, enforcement, Admin e Portal.
- Nenhuma Rule foi publicada; publicação continua exclusiva do `ADMIN-B3`.
- O gate que permitiu o `ADMIN-B2A3-PREP` foi liberado porque a query pública já filtra `publicado == true`, foi aceita pelo servidor, retornou `allPublished: true`, manteve `CMS.source = 'firebase'` e não apresentou incompatibilidade com as Rules atuais.
- O `ADMIN-B2A3-PREP` foi concluído e aprovado somente por leitura; esse gate não autoriza editar `firestore.rules`, iniciar `ADMIN-B2A3-EXEC`, publicar Rules ou alterar dados.

## ADMIN-B2A3-PREP — concluído e aprovado

- Status: concluído e aprovado.
- Natureza: somente análise de leitura.
- Governança do PREP commitada em `01ee3a9e667679a79ac4310d49a3f0f6c163450a`.
- Alteração funcional: zero.
- Acesso remoto: zero.
- Publicação: zero.
- Não houve teste, Emulator, commit, push, deploy, alteração de dados ou início do `ADMIN-B2A3-EXEC`.

### Contrato aprovado de leitura de `noticias`

- Admin autorizado: lê todos os documentos, incluindo publicados, drafts, documentos sem `publicado` e registros legados, por `isAdmin()`.
- Público anônimo, usuário comum autenticado e `moderator`: leem somente documentos cujo campo `publicado` seja o booleano `true`.
- `publicado` é o único campo canônico para autorização pública; `status` não participa da autorização.
- Valores públicos negados: `publicado: false`, campo ausente, `null`, `"true"`, `1`, `[]`, `{}` e `status: "publicado"` sem `publicado: true`.
- Precedência: `publicado: true` com `status: "rascunho"` continua público, pois `publicado` controla a Rule.
- `moderator` não recebe acesso administrativo a drafts neste bloco; seu contrato definitivo continua reservado ao `ADMIN-B2A5`.
- A escrita permanece exclusiva de Admin.

Rule escolhida para o futuro EXEC:

```text
match /noticias/{noticiaId} {
  allow read: if isAdmin() || (resource.data.publicado == true);
  allow write: if isAdmin();
}
```

Motivos: diff funcional mínimo de uma linha; escrita intacta; Admin continua lendo toda a coleção; público permanece compatível com `where("publicado", "==", true)`; nenhum helper novo; nenhum uso de `isModerator()` ou `status`; nenhuma alteração na validação de escrita; ausência e tipos inválidos falham de forma fechada; não existe `match` sobreposto que conceda acesso alternativo; fallback recursivo continua deny.

### ADMIN-B2A3-EXEC — concluído

#### Implementação e auditoria

- Status: concluído; implementação local aplicada.
- Arquivos funcionais exclusivos:
  - `firestore.rules`;
  - `tests/firestore.rules.test.mjs`.
- Auditoria estática: **A. implementação completa e compatível**.
- Rule de leitura anterior: `allow read: if true;`.
- Rule de leitura versionada: `allow read: if isAdmin() || (resource.data.publicado == true);`.
- Escrita preservada exatamente como `allow write: if isAdmin();`.
- Nenhum outro `match`, helper, índice, Storage Rule, configuração, dependência ou arquivo funcional foi alterado.

#### Contrato final de `noticias`

- Admin autorizado lê notícias publicadas, drafts, documentos legados, documentos sem `publicado` e tipos históricos ou inválidos; lista integralmente a coleção e mantém create, update e delete sob `isAdmin()`.
- Público anônimo lê somente `publicado == true` booleano; não lê drafts, campo ausente, tipos inválidos, `status` isolado nem lista a coleção sem filtro seguro.
- Usuário comum autenticado e `moderator` seguem o ramo público; autenticação ou role `moderator` não concede acesso a drafts. O contrato definitivo de `moderator` permanece reservado ao `ADMIN-B2A5`.
- `status` não participa da autorização, não substitui `publicado` e não revoga `publicado: true`.
- Precedência: `publicado: true` com `status: "rascunho"` permanece público; `status: "publicado"` sem `publicado: true` permanece privado.
- Nenhuma validação adicional de schema, autoria, timestamps ou transição editorial foi incluída.

#### Validação funcional local

- Classificação: **A. validado funcionalmente**.
- Comando: `npm run test:rules`.
- Projeto: `demo-turismo-sms-rules-test`.
- Ambiente: somente Firestore Emulator local, carregando `firestore.rules` local.
- Resultado: 69 testes em 5 suítes; 69 pass; 0 fail; 0 skipped; 0 cancelled; 0 todo; exit code 0.
- Composição final:
  - `noticias`: 37 testes;
  - `media_library`: 10 testes;
  - `ativo`/`isAdmin`: 9 testes;
  - `moderator`: 10 testes;
  - fallback deny: 3 testes;
  - total: 69.
- Coverage: endpoint local respondeu HTTP 200.
- Encerramento: Emulator encerrado automaticamente; portas 8080 e 4000 sem listeners após a suíte.
- Artefato: `firestore-debug.log` foi gerado pelo Emulator e removido após a validação.
- Integridade: hashes de `firestore.rules` e `tests/firestore.rules.test.mjs` permaneceram inalterados antes e depois da suíte.
- Uma primeira tentativa terminou antes do Emulator por erro ambiental `EPERM` relacionado ao configstore local do Firebase CLI. Nenhuma Rule, teste, configuração ou dependência foi alterada entre essa tentativa e a execução funcional aprovada; o evento não é falha funcional da implementação.

#### Commit, push e produção

- Commit funcional: `4f25d8b0385efa760ba21c77a5211293eb84ea0f`.
- Mensagem: `fix: restringir leitura pública de notícias`.
- Push para `origin/main`: concluído.
- `HEAD`, `main` e `origin/main`: alinhados no commit funcional após o push.
- Nenhum deploy e nenhuma publicação de Firestore Rules.
- Nenhum acesso ao Firebase real e nenhuma leitura ou alteração de dados reais.
- Código versionado no Git não significa Rule ativa em produção: produção ainda usa a Rule anterior.
- A publicação permanece exclusiva do `ADMIN-B3`.

## ADMIN-B2A4-PREP — concluído e aprovado

- Status: concluído e aprovado exclusivamente como análise somente de leitura.
- Parecer: **A. pronto para ADMIN-B2A4-EXEC**.
- Governança registrada no commit `f9067e332a078ace7f840fecbe6f457bda324d34` (`docs: aprovar prep da proteção de media_library`).
- Hipótese principal confirmada: `media_library` é uma coleção operacional do CMS/Admin e não possui consumidor público direto.
- Alteração funcional: zero.
- Teste ou Emulator: zero.
- Acesso ao Firebase remoto ou a dados reais: zero.
- Commit, push, deploy ou publicação: zero.
- No encerramento do PREP, `ADMIN-B2A4-EXEC`, `ADMIN-B2A5`, `ADMIN-B2B` e `ADMIN-B3` não haviam sido iniciados.

### Contrato comprovado de `media_library`

- Rule atual:

  ```text
  match /media_library/{mediaId} {
    allow read: if true;
    allow write: if isAdmin();
  }
  ```

- Risco atual: get, list e queries públicas são permitidos; URLs, nomes, paths e metadados administrativos podem ser enumerados. O frontend não constitui proteção. A escrita já é Admin-only.
- Consumidor direto comprovado: `AdminContentCMS`.
- `ensureMediaLoaded()` lista integralmente `media_library`; `saveMedia()` cria ou atualiza documentos; `deleteMedia()` exclui documentos.
- Editores e seletores usam a biblioteca já carregada em memória.
- Páginas públicas, Portal e service worker não consultam diretamente `media_library`; importadores não possuem referência direta comprovada.
- Não existe consumidor real de `media_library` com role `moderator`.
- Páginas públicas consomem URLs copiadas para notícias, eventos, banners e outras entidades.
- Nenhuma alteração de runtime, índice, App Check, CSP ou metadata é necessária.

### Alternativa aprovada

- Alternativa escolhida: leitura e escrita exclusivamente por Admin.
- Rule futura recomendada:

  ```text
  match /media_library/{mediaId} {
    allow read: if isAdmin();
    allow write: if isAdmin();
  }
  ```

- Motivos: único consumidor comprovado no CMS/Admin; painel aceita somente role `admin`; nenhuma query pública; nenhum campo canônico de publicação/visibilidade; compatibilidade com registros legados; escrita já Admin-only; menor privilégio; diff mínimo; nenhuma dependência de runtime.
- Admin ativo: get, list integral, registro legado/esparso, get inexistente, create, update e delete permitidos.
- Anônimo: get, list, queries, create, update e delete negados.
- Usuário comum: get, list, create, update e delete negados.
- Usuário autenticado sem perfil: get, list e create negados; ausência de `usuarios/{uid}` não concede permissão.
- `moderator`: get, list, create, update e delete negados; seu contrato institucional definitivo continua reservado ao `ADMIN-B2A5`.
- Admin inativo: get, list e create negados conforme o contrato atual de ativo, que permanece fora do B2A4 e reservado ao `ADMIN-B2A5`.
- A escrita será preservada exatamente como `allow write: if isAdmin();`.
- Não incluir helper novo, `isModerator()`, campo de publicação/status, schema, autoria, timestamps, transições editoriais, mudança de `ativo` ou alteração de Storage.

## ADMIN-B2A4-EXEC — concluído

- Status: concluído, revisado integralmente, validado funcionalmente, commitado e enviado para `origin/main`.
- Classificação final: **A. VALIDADO FUNCIONALMENTE**.
- Commit funcional: `13245dcf6dcc2e5704ee3d019ed3c05233a057b3` (`fix: restringir media_library a administradores`).
- Arquivos funcionais exclusivos do commit:
  - `firestore.rules`;
  - `tests/firestore.rules.test.mjs`.
- Estatística: 2 arquivos, 300 inserções e 18 remoções textuais; as remoções correspondem a renomeações e inversões de testes, não à exclusão de casos.
- Push concluído: `HEAD`, `main` e `origin/main` alinhados em `13245dcf6dcc2e5704ee3d019ed3c05233a057b3`, com divergência `0 0`.

### Rule e contrato final versionado

- Rule anterior:

  ```text
  match /media_library/{mediaId} {
    allow read: if true;
    allow write: if isAdmin();
  }
  ```

- Rule nova versionada:

  ```text
  match /media_library/{mediaId} {
    allow read: if isAdmin();
    allow write: if isAdmin();
  }
  ```

- A leitura pública ampla foi removida; a leitura passou a ser exclusiva de Admin autorizado.
- A escrita foi preservada byte a byte sob `isAdmin()`.
- Nenhum helper, outro `match`, schema, campo de publicação/status, contrato de `ativo`/`moderator`, runtime, Storage, índice, App Check, CSP, metadata ou dado foi alterado.
- Admin ativo: get, list integral, leitura de registro legado/esparso, get inexistente autorizado com `exists() == false`, create, update e delete permitidos.
- Anônimo: get, list, queries por `url` e `storagePath`, create, update e delete negados.
- Usuário comum: get, list, create, update e delete negados.
- Usuário autenticado sem perfil: get, list e create negados; ausência de `usuarios/{uid}` não concede acesso.
- `moderator`: get, list, create, update e delete negados; o contrato institucional definitivo permanece reservado ao `ADMIN-B2A5`.
- Admin inativo: get, list e create negados conforme o contrato atual de ativo, que permanece reservado ao `ADMIN-B2A5`.

### Alterações e composição final dos testes

- Baseline anterior: 69 testes em 5 suítes, com 10 testes dedicados de `media_library`.
- A suíte foi renomeada de `Baseline atual de media_library` para `Contrato de leitura e escrita de media_library`.
- Os 10 testes dedicados existentes foram renomeados.
- Exatamente quatro resultados foram invertidos:
  1. anônimo get: ALLOW → DENY;
  2. anônimo list: ALLOW → DENY;
  3. usuário comum get: ALLOW → DENY;
  4. `moderator` get: ALLOW → DENY.
- Seis resultados foram preservados:
  1. Admin ativo get: ALLOW;
  2. anônimo create: DENY;
  3. usuário comum create: DENY;
  4. `moderator` create: DENY;
  5. Admin ativo create: ALLOW;
  6. Admin inativo create: DENY.
- Exatamente 18 testes foram adicionados:
  1. usuário comum list DENY;
  2. usuário autenticado sem perfil get DENY;
  3. usuário autenticado sem perfil list DENY;
  4. `moderator` list DENY;
  5. Admin inativo get DENY;
  6. Admin inativo list DENY;
  7. Admin ativo list integral ALLOW;
  8. Admin ativo lê registro legado/esparso;
  9. Admin ativo get inexistente ALLOW e `exists()` false;
  10. anônimo query por `url` DENY;
  11. anônimo query por `storagePath` DENY;
  12. usuário sem perfil create DENY;
  13. Admin ativo update ALLOW;
  14. Admin ativo delete ALLOW;
  15. usuário comum update DENY;
  16. usuário comum delete DENY;
  17. `moderator` update DENY;
  18. `moderator` delete DENY.
- Zero testes foram removidos; zero subtests foram adicionados; o teste adicional `moderator/create` da suíte `moderator` foi preservado; as outras quatro suítes permaneceram intactas.
- Composição final:
  - `noticias`: 37;
  - `media_library`: 28;
  - `ativo`/`isAdmin`: 9;
  - `moderator`: 10;
  - fallback deny: 3;
  - total: 87 testes em 5 suítes.
- Fixtures exclusivamente sintéticas, URLs em `example.com` e projeto `demo-turismo-sms-rules-test` preservados.

### Validação funcional local

- Comando validado no bloco funcional: `npm run test:rules`.
- Ambiente: somente Firestore Emulator local, `firestore.rules` local, porta Firestore 8080, UI local 4000, concorrência Node 1, nenhuma credencial e nenhum projeto real.
- Resultado: 5 suítes, 87 testes, 87 pass, 0 fail, 0 skipped, 0 cancelled, 0 todo e exit code 0.
- Coverage: endpoint local de rule coverage respondeu HTTP 200; o ramo `isAdmin()` de `media_library`, get, list, create, update e delete administrativos, negativas por identidade, documento existente/inexistente, registro legado, queries por `url`/`storagePath` e fallback deny foram exercitados.
- Emulator encerrado automaticamente; portas 8080 e 4000 sem listeners; nenhum processo encerrado manualmente.
- `firestore-debug.log` foi gerado e removido após a suíte; nenhum relatório HTML ou JSON foi persistido.
- Uma primeira tentativa terminou antes do Emulator por `EPERM` no configstore local do Firebase CLI. Nenhuma Rule, teste, configuração ou dependência foi alterada; o mesmo comando foi repetido no ambiente autorizado e concluiu em 87/87. O evento ambiental não representa falha funcional.

### Git, produção e não ações

- A nova Rule está versionada no Git e foi enviada para `origin/main`, mas não foi publicada no Firebase.
- Nenhum deploy, acesso ao Firebase real, leitura ou alteração de dados reais, inventário, migração ou alteração de Storage foi executado.
- O commit no GitHub não altera automaticamente o ruleset ativo. Produção permanece com o último ruleset publicado até autorização específica do `ADMIN-B3`.
- O `ADMIN-B2A5`, o `ADMIN-B2B` e o `ADMIN-B3` não foram iniciados.

### Limite entre Firestore e Cloud Storage

- `media_library`: coleção Firestore de catálogo e metadados; objeto exclusivo do `ADMIN-B2A4`.
- `cms-media`: caminho de Cloud Storage com arquivos físicos e URLs de download; fora do B2A4 e reservado ao `ADMIN-B2B` ou bloco posterior autorizado.
- A proteção versionada de `media_library` impede leitura e enumeração pública dos documentos, mas não revoga URLs existentes, não torna privados os arquivos públicos no Storage, não altera imagens copiadas para notícias/eventos/banners e não modifica `storage.rules`.

## ADMIN-B2A5-PREP — concluído com decisões humanas posteriores

### Conclusão do PREP e evolução do parecer

- Status: concluído exclusivamente como análise somente de leitura.
- Parecer original: **B. Pronto com decisão humana pendente**.
- As decisões humanas pendentes foram recebidas e concluídas após o PREP.
- Alteração funcional, acesso remoto, Emulator e publicação: zero.
- O PREP não executou inventário, migração, commit, push ou deploy.
- O histórico do parecer B permanece preservado.

### Decisões humanas confirmadas

- Contrato futuro: gates baseados em papel exigirão `usuarios.ativo == true`.
- Somente o booleano `true` autoriza. Negam: `false`, campo ausente, `null`, `"true"`, `"false"`, `1`, `0`, `[]`, `{}`, qualquer outro tipo/valor diferente do booleano `true` e documento `usuarios/{uid}` inexistente.
- Não haverá compatibilidade temporária para ausência, `null`, strings, números, listas ou mapas; `ativo != false` não será preservado como contrato final.
- A desativação controlará acessos administrativos e de equipe protegidos por role. Admin ou eventual membro de equipe com `ativo` diferente de `true` não poderá executar operações institucionais baseadas em papel; Firestore deverá negar essas operações imediatamente após a alteração do perfil.
- O Portal fica fora do bloqueio automático: fluxos baseados somente em `signedIn()`, autoria, propriedade, `establishment_managers` ou outros contratos próprios não serão ampliados silenciosamente. Suspensão total de conta de cidadão exige política e autorização separadas.
- `moderator` não é função institucional ativa. Novos privilégios são proibidos, `moderator` não será tratado como Admin e os grants administrativos específicos atuais serão removidos futuramente.
- Admin será preservado nos mesmos fluxos administrativos.
- `moderator` não receberá acesso administrativo a `usuarios`, drafts de `noticias`, `media_library`, CMS integral, `reservas`, `banners` ou administração genérica.
- Runtime terá bloco separado para gate de `ativo`, revalidação de perfil, comportamento de sessão, bloqueio/logout visual, mensagens e remoção/desativação da opção `moderator`.
- Storage permanece separado e será alinhado exclusivamente no `ADMIN-B2B`, incluindo `isStaff()` e grants atuais de Admin/moderator.

### Bloqueio do EXEC monolítico

- `ADMIN-B2A5-EXEC` não será iniciado como bloco monolítico.
- Classificação consolidada: **C. Bloqueado por dependências técnicas**.
- Dependências: inventário sanitizado antes da publicação; possível migração de perfis; divergência entre painel Admin e Firestore Rules; revalidação/logout visual; opção `moderator` no runtime; grants de `moderator` no Firestore; grants de staff no Storage; separação obrigatória entre Firestore, runtime e Storage.
- A classificação C não cancela o `ADMIN-B2A5`; determina sua decomposição em blocos independentes e autorizados.

### ADMIN-B2A5-INVENTORY-PREP — concluído

- Status: concluído em 2026-07-29 exclusivamente por análise local e somente leitura.
- Parecer: **C. Requer ferramenta local separada antes do INVENTORY-EXEC**; progressão esperada **C → B → A**.
- Não existe ferramenta adequada para `usuarios`; os scripts atuais têm outros alvos/contratos, podem ler campos mais amplos, usam token manual ou possuem caminhos de escrita e foram descartados para reutilização.
- Não existem dependências diretas `firebase-admin` ou `@google-cloud/firestore`. A biblioteca futura recomendada é `@google-cloud/firestore`, com versão exata, compatibilidade com Node e impacto no lockfile ainda a definir no TOOL-PREP.
- Método previsto: `count()` somente como gate, scan único de `usuarios` com `select("ativo", "role")` e `limit(T + 1)`, classificação em memória, saída agregada, zero persistência de snapshot, zero IDs e zero escrita.
- Categorias de `ativo`: `booleanTrue`, `booleanFalse`, `absent`, `null`, `string`, `number`, `array`, `map`, `timestamp`, `reference`, `geopoint` e `other`. Categorias de `role`: `admin`, `moderator`, `user`, `otherString`, `absent`, `null` e `nonString`. A matriz terá linhas `admin`, `moderator`, `user` e `invalidOrAbsent`, cada uma com todas as categorias de `ativo`.
- Invariantes: somas de `ativo`, `role` e matriz iguais ao total; Admin e moderator integralmente distribuídos; contagens inteiras e não negativas; nenhuma categoria descartada; classificação derivada de uma única consulta projetada.
- Count e scan não compartilharão necessariamente snapshot. Diferença encerra com erro sanitizado e `countMismatchDetected`; igualdade não prova ausência de concorrência. `classificationDerivedFromSingleQuerySnapshot` descreve somente a origem comum das categorias.
- Separar `administrativeProfilesRequiringEvaluation` de `dataQualityDocumentsRequiringReview`. Usuários comuns com `ativo` falso ou ausente não serão candidatos automáticos a migração administrativa; moderator será contado separadamente, sem correção automática ou promoção.
- `T = 10.000` é teto técnico recomendado, pendente de confirmação humana no TOOL-PREP ou antes do INVENTORY-EXEC. Nenhum scan ilimitado será permitido.
- IAM futuro: identidade dedicada, read-only, temporária, sem chave JSON e preferencialmente impersonada; `roles/datastore.viewer` é referência, com escopo real a comprovar no AUTH-PREP. O papel não será descrito como restrito à coleção ou aos campos.
- Arquivos prováveis do TOOL-EXEC: `scripts/admin-b2a5-inventory.mjs`, `tests/admin-b2a5-inventory.test.mjs`, `package.json` e `package-lock.json`, ainda não autorizados. O plano inicial de 44 testes e 77 fixtures deverá ser confirmado ou ajustado no TOOL-PREP conforme a implementação final.
- Zero alteração funcional, dependência, Emulator, autenticação, acesso remoto, IAM, inventário, migração, commit, push, deploy ou publicação. Nenhum bloco posterior foi iniciado.

### ADMIN-B2A5-INVENTORY-TOOL-PREP — concluído

- Status: concluído em 2026-07-30 exclusivamente por análise local e somente leitura, no commit-base `7059aa8973566acde24096a62ff99eb6a50696d5`.
- Parecer: **A. Pronto para ADMIN-B2A5-INVENTORY-TOOL-EXEC**. Não há decisão técnica bloqueante restante para implementar e validar localmente a ferramenta; o parecer não autoriza iniciar o EXEC nem qualquer ação remota.
- Dependência futura: `@google-cloud/firestore@8.7.0`, exata, sem `^`/`~`, em `devDependencies`, com `--save-exact` e `--ignore-scripts`. A metadata declarou Node `>=18` e o Node local `v24.13.0` satisfaz somente o gate de engine; pacote, import e APIs continuam não instalados/não validados até o TOOL-EXEC.
- APIs planejadas: `Firestore`, `Query.select()`, `Query.count()`, `Query.limit()`, `Timestamp`, `GeoPoint`, `DocumentReference`, `databaseId` e `FIRESTORE_EMULATOR_HOST`, todas dependentes de validação executável futura.
- Quatro arquivos suficientes: `scripts/admin-b2a5-inventory.mjs`, `tests/admin-b2a5-inventory.test.mjs`, `package.json` e `package-lock.json`. Qualquer quinto arquivo interrompe o EXEC e exige justificativa e autorização.
- Arquitetura: Node ESM, importável sem executar main, import dinâmico da dependência, funções puras exportadas, parser/gates estritos, SHA-256 local, agregador, invariantes, allowlist, sanitizador, adaptador read-only, orquestrador injetável e guard por `import.meta.url`.
- Adaptador: somente `countDocuments()` e `scanProjected(maxDocuments)`, implementados com `collection("usuarios").count().get()` e `select("ativo", "role").limit(maxDocuments + 1).get()`. Zero mutadores, Auth, Storage, IAM, fetch arbitrário, retry, IDs, refs, paths, names, campos arbitrários, snapshots ou objetos Firestore em logs.
- CLI: `--database-id`, `--collection`, `--max-docs`, `--expected-project-sha256` e modo local explícito `--emulator`; database `(default)`, collection `usuarios`, max positivo obrigatório e sem default, nenhuma opção de project ID ou seleção de campos. Remoto usa somente `ADMIN_B2A5_PROJECT_ID` e fingerprint `68cf9cf1208055a962c614232e75b8a0b4f4f7564865e77e2a84382a87bd8c60`; Emulator usa projeto demo e fingerprint `b2d2fda672cd3134c50b1afd30579947fb89c8aace85bb35852f6ed4c935e7b9`, host obrigatório em loopback e nenhuma credencial.
- Taxonomias: 12 categorias de `ativo` e 7 de `role`, sem coerção ou normalização; tipos especiais antes de mapa; Buffer/bytes deverá validar `other` no Emulator ou o EXEC deverá parar. `roleByAtivo` terá 48 células; as métricas administrativas, de tipo inválido e qualidade serão uniões agregadas/deduplicadas e não autorizarão migração.
- Count/scan: count apenas como gate, scan com `max + 1`, `volume-limit` acima do teto e `count-mismatch` em divergência dentro do limite, sem retry ou alegação de concorrência comprovada. Mismatch não terá resumo parcial.
- Saída: JSON compacto determinístico, `schemaVersion: 1`, uma linha em stdout apenas no sucesso; falha com categoria fechada em stderr e stdout vazio. Exit codes definidos de `0` a `12`, sem message/stack/URL/token/project ID real/ID/path/snapshot/dado.
- Invariantes: somas de ativo/role/matriz, linhas da matriz, inteiros, não negativos, categorias conhecidas, nenhum documento perdido, chamadas de acumulação iguais ao scan e classificação derivada da consulta projetada única.
- Testes futuros: **102** com `node:test`/`assert/strict`, sem nova biblioteca de teste: 16 ativo, 10 role, 25 CLI/gates, 10 agregação/métricas, 13 invariantes, 10 saída/sanitização/erros, 8 adapter/orquestração fake e 10 Emulator. Fixtures finais: **84** (`7 × 12`), substituindo a referência provisória de 77.
- Validação futura: instalação exata com scripts ignorados, revisão do lockfile, `node --check`, unitários, Emulator demo, suíte de Rules existente, busca estática de mutadores, diff integral, `git diff --check` e SHA-256 antes/depois. Rollback sem `git clean`: restaurar os dois arquivos de pacote e remover novos `.mjs` somente por paths exatos e autorização; após commit, `git revert`.
- Limites daquele PREP: nenhuma ferramenta, teste, dependência, npm, Emulator, autenticação, acesso remoto, IAM, inventário, migração, commit, push, deploy ou publicação foi executado; naquele checkpoint, o TOOL-EXEC e os blocos posteriores ainda não haviam sido iniciados.

### ADMIN-B2A5-INVENTORY-TOOL-ROOT-RECOVERY-AND-ISOLATION-PREP — concluído

- Status: concluído em 2026-07-30, no commit-base `6b7923f2c551d7489ed3fbb960139f39e8e6ac67` (`fix: exibir banners e pop-ups sem cortes`), sem alterar o hotfix visual publicado.
- Recuperação raiz: `package.json` e `package-lock.json` restaurados ao `HEAD`; baseline congelado reconstruído com uma única execução de `npm ci --ignore-scripts --no-audit --no-fund`; árvores física e virtual válidas; Firebase CLI raiz `15.24.0`; Firestore e overrides ausentes da raiz.
- Falha registrada: instalar `@google-cloud/firestore@8.7.0` na raiz produziu `ELSPROBLEMS` físico e virtual na cadeia `firebase-tools@15.24.0` → `tinyglobby@0.2.17`/`fdir@6.5.0` → `picomatch`, e o override restrito para `4.0.5` não reparou a árvore. A arquitetura integrada foi abandonada; não insistir com novos overrides, picomatch direto, dedupe, install strategies ou edição manual do lockfile raiz.
- Arquitetura definitiva: pacote Node independente `tools/admin-b2a5-inventory/`, sem workspace, sem dependências compartilhadas e sem alteração dos manifests raiz. Quatro arquivos exclusivos: `package.json`, `package-lock.json`, `admin-b2a5-inventory.mjs` e `admin-b2a5-inventory.test.mjs`. Nenhum quinto arquivo funcional; `node_modules/` isolado já é coberto pela regra recursiva de `.gitignore`.
- Package: `turismo-sms-admin-b2a5-inventory-tool`, versão `0.0.0`, `private: true`, ESM, engine `>=18`, scripts locais `test`, `test:unit`, `test:emulator` e `check`, sem workspace, publishConfig, publicação ou inventário remoto. `@google-cloud/firestore@8.7.0` será `dependency` exata de runtime, sem range, override, picomatch direto ou firebase-tools.
- Lockfile: próprio, `lockfileVersion 3`, gerado somente no pacote isolado, scripts/audit/funding desabilitados, revisão integral e reprodução obrigatória por `npm ci`; apenas Firestore e transitivas legítimas, sem tocar o lockfile raiz.
- Padrão npm oficial: `npm --prefix "tools/admin-b2a5-inventory" <comando>`. Usar por prefixo para install exato, `ls --all`, `ci`, `run check`, `run test:unit` e teste integral; não alternar com workspace, instalação raiz ou mudança arbitrária de diretório.
- Resolução: o import dinâmico de Firestore deverá resolver sob `tools/admin-b2a5-inventory/node_modules/`; o teste importará o módulo no mesmo package scope. A raiz continuará sem Firestore; seu `node_modules` será usado apenas para a Firebase CLI.
- Emulator: executar da raiz `& ".\node_modules\.bin\firebase.cmd" emulators:exec --only firestore --project demo-turismo-sms-rules-test "npm --prefix tools/admin-b2a5-inventory test"`. Somente Firestore Emulator e projeto demo, `FIRESTORE_EMULATOR_HOST` obrigatório, sem credencial, remoto ou fallback, encerramento automático.
- Contrato preservado: ESM importável, database `(default)`, coleção `usuarios`, projeção `ativo`/`role`, count como gate, scan único `max + 1`, zero IDs/escrita/persistência/dados reais/retry, fingerprints, saída determinística, erros sanitizados, exit codes `0` e `2`–`12`, `countMismatchDetected`, `classificationDerivedFromSingleQuerySnapshot`, 12 categorias de ativo e 7 de role.
- Testes: 102 no total — 16 ativo, 10 role, 25 CLI/alvo/fingerprint/gates, 10 agregação/métricas, 13 invariantes, 10 saída/sanitização/erros, 8 adaptador/orquestração fake e 10 `EMULATOR:`. Resultado integral obrigatório: 102 pass e zero fail/skipped/cancelled/todo.
- Fixtures: 84 documentos sintéticos (`7 × 12`), com total 84, `administrativeProfilesRequiringEvaluation = 71`, `invalidTypeDocuments = 60` e `dataQualityDocumentsRequiringReview = 78`. Buffer/bytes deverá ser `other`; divergência de round-trip interrompe o EXEC.
- Regressão: executar depois `npm run test:rules` na raiz e exigir 87/87 em cinco suítes, coverage HTTP 200, Emulator encerrado, portas 8080/4000 livres e log ausente, sem alterar Rules.
- Zero escrita: módulo de produção sem mutadores, transaction, `recursiveDelete` ou import/export; adaptador apenas com `countDocuments()` e `scanProjected(maxDocuments)`; writes somente no teste para fixtures locais; fakes comprovam um count, no máximo um scan e zero retry; busca estática limitada ao módulo de produção.
- Integridade: registrar SHA-256 e objetos filtrados dos manifests raiz antes/depois de install, `npm ci` e testes; registrar hashes dos quatro arquivos isolados após criação e validações. Baseline atual: `package.json` `8CA1CC95ABD8598852C08BE7E2E4D308FC0394498C167ECB2762C6DCDD50E95B`; `package-lock.json` `011CCA2C7FF45FABE80D5737070E2F56AE94D8CBCFE6ED94748BF83D56B60E0F`.
- Rollback: antes de commit, remover somente os quatro arquivos por paths explícitos e, mediante autorização/conferência absoluta, o `node_modules` isolado; nunca `git clean`. Depois de commit, `git revert HASH_DO_ISOLATED_TOOL_EXEC`. O rollback não toca dados, IAM, Rules, produção ou o hotfix visual.
- Riscos não bloqueantes: import/APIs de Firestore 8.7.0 no Node local `v24.13.0`, árvore isolada, Buffer/bytes, `firestore-debug.log`, portas e caminho resolvido. Node 24.13.0 satisfaz somente o gate `>=18`; compatibilidade executável será comprovada no EXEC. Autenticação, IAM e valor real de `max-docs` permanecem fora do TOOL-EXEC.
- Parecer histórico deste PREP: **A. Pronto para ADMIN-B2A5-INVENTORY-TOOL-ISOLATED-EXEC**. O pacote isolado e seus testes foram posteriormente concluídos no EXEC; AUTH, inventário, migração e os demais blocos posteriores permanecem não iniciados.

### ADMIN-B2A5-INVENTORY-TOOL-ISOLATED-EXEC — concluído

- Status: concluído em 2026-07-30 e classificado como **A. VALIDADO LOCALMENTE**. O pacote independente `tools/admin-b2a5-inventory/` foi implementado, integralmente revisado, validado e versionado sem alterar os manifests raiz.
- Artefatos exclusivos: `package.json`, `package-lock.json`, `admin-b2a5-inventory.mjs` e `admin-b2a5-inventory.test.mjs`. `node_modules/` próprio permanece ignorado; não houve quinto arquivo.
- Package/lock: privado, ESM, Node `>=18`, quatro scripts, `@google-cloud/firestore@8.7.0` exato, sem workspace, override, `firebase-tools` ou cadeia `tinyglobby`/`fdir`/`picomatch`; lockfile próprio `lockfileVersion 3`; padrão `npm --prefix`; resolução comprovada no `node_modules` isolado.
- Reprodutibilidade: 122 pacotes instalados; `npm ls` aprovado sem `invalid`, `missing` ou `ELSPROBLEMS`; `npm ci` aprovado; package e lock byte a byte estáveis. Hashes SHA-256: package `B05ACB53F4D5DD480E436A7A3BB1C71C78E456959B9DC39AC84285C9A744B9EF`; lock `EAC09322DE633EAA33AD901F18C6D4F2FD31355E6D304F9A93EEE858B6DB3897`; módulo `A877FE4CA8266F8ED20B7106F8FE5C4633F686170902C980A496D682ED59EC13`; teste `45A91BFB2CA302D61D3CE018C2278D48201563C019AA275E13E47B99F60614AA`.
- Arquitetura: 29 contratos exportados, entry point protegido, import dinâmico, CLI restrita, `(default)`, coleção `usuarios`, `max-docs` obrigatório, fingerprints e gates de alvo, modo Emulator explícito e modo remoto não executado. Sem descoberta implícita, projeto remoto em texto claro, credencial ou retry automático.
- Metadata: a primeira execução integral produziu `MetadataLookupWarning` da detecção automática da biblioteca Google, sem autenticação ou acesso a dados. O hardening define `METADATA_SERVER_DETECTION=none` somente no modo Emulator; as execuções finais não emitiram o aviso.
- Read-only: adaptador apenas `countDocuments()` e `scanProjected(maxDocuments)`; operações limitadas a count e à consulta projetada `ativo`/`role` com `limit(maxDocuments + 1)`. Sem mutadores, transaction, `recursiveDelete`, import ou export; buscas estáticas retornaram somente `seen.add(token)` e `createHash(...).update(...)`. Sem ID/ref/path, exploração por `Object.keys`, log bruto, mensagem ou stack de erro.
- Modelo agregado: 12 categorias de ativo, sete de role e matriz `admin`/`moderator`/`user`/`invalidOrAbsent`; métricas `administrativeProfilesRequiringEvaluation`, `invalidTypeDocuments` e `dataQualityDocumentsRequiringReview`; deduplicação por flags, invariantes de somas/tipos/categorias e nenhum ID ou valor desconhecido preservado.
- Saída: JSON compacto, de uma linha, determinístico e allowlisted; stdout somente no sucesso, stderr somente no erro; categorias sanitizadas e exit codes `0` e `2`–`12`; sem stack, conteúdo bruto, ID, UID, path, valor real, projeto real, token, URL, persistência ou resumo parcial.
- Testes: 102 totais — 16 ativo, 10 role, 25 CLI/alvo/fingerprint/gates, 10 agregação/métricas, 13 invariantes, 10 saída/sanitização/erros, 8 adaptador/orquestração fake e 10 integração Emulator. Resultado integral: 102 pass e zero fail/skipped/cancelled/todo; 92 casos não Emulator e dez `EMULATOR:`, sem remoção de testes para ocultar skips do filtro unitário.
- Fixtures: 84 sintéticas (`7 × 12`), sem produção. Totais: cada role 12, cada ativo 7, admin 12, moderator 12, user 12, `invalidOrAbsent` 48, admin e moderator true/not true `1/11`, métricas `71`, `60` e `78`; Buffer/bytes validado como `other`.
- Emulator: somente Firestore, projeto `demo-turismo-sms-rules-test`, host local, sem credencial ou remoto, encerramento automático e portas 8080/4000 livres. Log de 939 bytes removido após cada execução e ausente ao final.
- Regressão: `npm run test:rules` executado no bloco funcional, cinco suítes, 87/87 pass, zero fail/skipped/cancelled/todo, coverage HTTP 200, Emulator encerrado e log de 84.209 bytes removido. Nenhuma Rule ou teste de Rules foi alterado ou publicado.
- Commit funcional: `1102741201d4858b55a7145570568856f6859573` (`1102741`), mensagem `feat: adicionar ferramenta isolada de inventário do ADMIN-B2A5`, exatamente quatro arquivos e 3.535 inserções. Staging nominal, um único commit, push `d6fe820..1102741 main -> main` e alinhamento final `0 0`.
- Supply chain: avisos deprecated para `node-domexception@1.0.0` e `glob@10.5.0`; `npm audit` proibido e não executado; nenhuma vulnerabilidade inferida. Análise futura exige bloco próprio.
- Limites: modo remoto, autenticação, IAM, valor institucional de `max-docs`, inventário real e migração não foram executados; Rules não foram publicadas; Storage, runtime e produção não foram alterados.

### ADMIN-B2A5-INVENTORY-AUTH-PREP — concluído

- Status: concluído em 2026-07-31, no commit-base `0335ce741ef56ab1c20800519f8b18b00e94ba60`, exclusivamente como análise técnica, pesquisa em documentação oficial do Google Cloud/Firebase e atualização documental.
- Parecer final: **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-EXEC**. As sete decisões humanas foram recebidas e incorporadas em 2026-07-31 e não restou bloqueio técnico; o parecer intermediário **B** permanece preservado como histórico. O parecer A autoriza iniciar o AUTH-EXEC mediante autorização de execução própria, mas não pré-valida os quatro gates de verificação remota.
- Zero execução: nenhuma autenticação, login, credencial, chave, conta de serviço, papel IAM, binding, política, API habilitada, acesso a Firebase/Google Cloud real, consulta a dados, execução da ferramenta, inventário, migração, alteração de runtime, staging, commit, push, deploy ou publicação.
- Fato central: `@google-cloud/firestore` é biblioteca de servidor e não é autorizada por Security Rules; o IAM é o perímetro remoto efetivo. As Rules locais e publicadas não restringirão a ferramenta e o App Check não será barreira de autorização nesta execução.
- Permissões mínimas confirmadas: `RunQuery` e `RunAggregationQuery` exigem exatamente `datastore.entities.get` e `datastore.entities.list`, ambas `DATA_READ`. Nenhuma permissão adicional está documentada como necessária; `datastore.databases.get` cobre transações e não é requerida. O AUTH-EXEC testará apenas get/list e qualquer `PERMISSION_DENIED` interrompe o bloco, sem ampliação automática.
- Custom role aprovado (decisão 2): `roles/datastore.viewer` traz 15 permissões, 13 delas excedentes (App Engine, listagem de databases, metadata, schemas, namespaces, statistics, insights, projetos e transações) e **não será utilizado**. O papel `adminB2A5InventoryRead` conterá apenas as duas permissões necessárias, sem criação, atualização, exclusão, IDs, importação, exportação, índices, operações, Storage, Auth, Logging, IAM ou administração.
- Escopo IAM: projeto e database. Condição por `resource.name` no formato `projects/PROJECT_PLACEHOLDER/databases/(default)` é oficialmente suportada; **não há suporte oficial a restrição por coleção, documento ou campo**. Coleção `usuarios` e campos `ativo`/`role` serão impostos apenas pelo código auditado, e a projeção não é barreira IAM.
- Risco residual aceito (decisão 1): acesso database-wide durante a vigência da binding, aceito somente pelo uso conjunto de conta exclusiva, custom role mínimo, condição pelo database, expiração temporal, token temporário, ferramenta auditada com coleção e campos fixos e revogação explícita. A ausência de qualquer controle invalida a aceitação.
- Quatro gates de verificação do AUTH-EXEC, todos com parada: sintaxe final da condição e necessidade de `resource.type`, sem inventar literal; comprovação não destrutiva de que `CLOUDSDK_CONFIG` relocaliza o ADC (classificação **B**, provável), com parada antes do login se o ADC padrão puder ser sobrescrito; verificação prévia de `iamcredentials.googleapis.com` sem habilitá-la; e condição temporal na binding de Token Creator, cuja indisponibilidade não quebra a segurança porque a binding de leitura expira em 2 horas.
- Tempo aprovado (decisão 4): token de aproximadamente 1 hora — máximo padrão de 3.600 s, sem extensão por política de organização — e binding com validade total de 2 horas, com timestamps UTC definidos no AUTH-EXEC. Propagação IAM é eventualmente consistente, tipicamente 2 minutos e potencialmente 7 minutos ou mais, absorvida com folga pela janela; expiração não substitui revogação explícita.
- `--max-docs` aprovado (decisão 5): `10000` como teto operacional de segurança, não como estimativa do total. Exceder interrompe, sem resumo parcial, sem aumento automático e com nova decisão humana obrigatória.
- Identidade e impersonação (decisão 3): conta dedicada de propósito único `admin-b2a5-inventory-reader`, sem chave, senha, login interativo ou papéis herdados; `roles/iam.serviceAccountTokenCreator` somente no recurso da própria conta de serviço, nunca no projeto inteiro. O operador será o principal humano já autorizado e responsável pelo projeto, com identificador real fora do repositório e informado somente em memória no AUTH-EXEC. ADC futuro por `gcloud auth application-default login --impersonate-service-account`, com revogação por `gcloud auth application-default revoke`; no Windows o arquivo padrão é `%APPDATA%\gcloud\application_default_credentials.json`.
- Auditoria (decisão 6): a rastreabilidade normal de IAM/impersonação é suficiente para operador, identidade representada, horário, concessão, uso e revogação. Data Access audit logs ficam **como estão** e não serão habilitados ou alterados neste fluxo; estão desabilitados por padrão, geram volume e custo, dependem de `setIamPolicy`/`getIamPolicy`, podem ser herdados de organização/pasta e sua leitura exige `roles/logging.privateLogViewer`. Ampliar `DATA_READ` exige bloco específico e autorizado.
- Prova de ausência de escrita: sem tentativa de escrita real e sem documento de teste. Comprovação por inspeção do custom role e das bindings, com Policy Troubleshooter para bindings condicionais; `testIamPermissions` é destinado a GUIs de terceiros e serve apenas como verificação suplementar.
- Ciclo de vida aprovado (decisão 7): após o inventário, revogar o ADC temporário, remover o arquivo ADC, limpar variáveis do processo, remover a binding de Token Creator, remover a binding do custom role, desabilitar imediatamente a conta de serviço e preservá-la desabilitada por 7 dias para conferência; exclusão apenas depois e mediante autorização humana específica. Nenhuma chave JSON em nenhuma etapa.
- `AUTH-REVOKE` confirmado como bloco obrigatório separado, com rollback completo de ADC, variáveis, bindings, conta de serviço, papel, diretório temporário e confirmação de configuração normal intacta.

### ADMIN-B2A5-INVENTORY-AUTH-SEQUENCING-ADJUSTMENT — concluído

- Status: concluído em 2026-07-31, no commit-base `95c13039712d8794e80a446144a9873f60f455b4`, exclusivamente como análise de segurança e atualização documental. Zero autenticação, acesso remoto, conta de serviço, custom role, binding, ADC, inventário, migração, alteração funcional, staging, commit, push ou início de EXEC.
- Parecer: **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP**. O parecer **A** do AUTH-PREP permanece correto para a arquitetura então planejada, mas foi superado quanto à sequência operacional.
- Defeito corrigido: o `AUTH-EXEC` monolítico criaria binding Firestore de 2 horas, binding de Token Creator e ADC, e só depois haveria revisão humana e commit documental antes do inventário. Isso consumiria ou expiraria a janela, manteria permissão ativa sem operação em curso e pressionaria por ampliação da duração ou por pular gates. Governança documental não deve manter binding ativa aguardando commit.
- Rejeitados: aumentar a janela, remover revisão humana, deixar acesso ativo indefinidamente, criar binding sem expiração e executar inventário dentro do AUTH-EXEC.
- Base técnica confirmada: a documentação oficial determina conceder papéis **depois** de criar a conta de serviço; conta sem binding não tem acesso e custom role não vinculado não concede nada. Portanto provisionamento é comprovadamente livre de acesso e revisável sem janela correndo. Não há impedimento técnico à separação.
- Nenhuma decisão humana reaberta: as sete decisões, o risco database-wide aceito, as duas permissões, o descarte do viewer, a ausência de chaves, o token de ~1 hora, a janela de 2 horas, `--max-docs 10000`, os Data Access logs, os 7 dias e o `AUTH-REVOKE` obrigatório permanecem íntegros. Nenhuma permissão ampliada e nenhuma extensão de janela.
- `PROVISION-PREP`: planeja custom role, conta, verificação da API, ausência de chaves e de papéis herdados e rollback; nenhum acesso a Firestore.
- `PROVISION-EXEC`: cria somente o custom role mínimo e a conta dedicada; nada de binding, ADC, token da conta de serviço, impersonação ou acesso a dados — o único token é o access token temporário do operador humano, em memória, para o transporte REST dos gates.
- `PROVISION-GOVERNANCE`: registra e commita a infraestrutura sem acesso, com a janela ainda não iniciada.
- `ACTIVATION-PREP`: define a janela UTC real de 2 horas e o operador em memória; confirma sintaxe da condição, estado da API, isolamento do ADC, comandos exatos, rollback e a sequência imediatamente posterior.
- `ACTIVATION-EXEC`: no início da janela, cria a binding Firestore condicionada ao database e ao tempo, a binding de Token Creator condicionada ao tempo no recurso da conta, o ADC isolado por impersonação e as verificações negativas sem leitura de documentos.
- `INVENTORY-EXEC`: imediatamente após a ativação, dentro da mesma janela operacional, ainda como bloco separado com autorização própria.
- `AUTH-REVOKE`: imediatamente após o inventário e independentemente do resultado — revogar ADC, remover arquivo temporário, limpar variáveis, remover as duas bindings, desabilitar a conta e comprovar ausência de acesso residual.
- Condição temporal planejada: `resource.name == "projects/PROJECT_PLACEHOLDER/databases/(default)" && request.time >= timestamp("START_UTC") && request.time < timestamp("END_UTC")`. O limite superior já estava confirmado verbatim para Firestore; a documentação oficial também registra intervalo início-fim no padrão `request.time > timestamp(...) && request.time < timestamp(...)`. O operador exato do limite inferior deverá ser confirmado no ACTIVATION-PREP, sem inventar sintaxe; `START_UTC`/`END_UTC` só ali, separados por 2 horas, em UTC, sem persistir projectId real. `resource.type` continua proibido sem confirmação oficial. O limite inferior é defesa adicional, não requisito: a arquitetura permanece válida apenas com o limite superior.
- Gates e falhas: PROVISION-EXEC revisável sem acesso a dados; ACTIVATION-EXEC só começa com INVENTORY-EXEC e AUTH-REVOKE prontos para execução imediata; se o inventário não puder começar, executar AUTH-REVOKE sem aguardar; qualquer falha após a ativação aciona revogação; expiração é defesa adicional, nunca rollback; nenhuma etapa amplia automaticamente as 2 horas; nenhum bloco deixa ADC ou binding ativa para continuar depois.
- Benefício registrado: como a conta desabilitada e o custom role sobrevivem 7 dias após o `AUTH-REVOKE`, uma repetição autorizada do inventário exigirá apenas nova ACTIVATION, não novo PROVISION.

### ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP — concluído

- Status: concluído em 2026-07-31, no commit-base `b58541d21ba70424870fe16650a50ea9b8e09fe7`, exclusivamente como pesquisa em documentação oficial do Google Cloud, análise de segurança e atualização documental. Zero autenticação, conta de serviço, custom role, binding, ADC, token, chave, API habilitada, acesso remoto, inventário, migração, alteração funcional, staging, commit, push ou início de EXEC.
- Parecer intermediário: **B. Pronto com decisão humana pendente** — uma única decisão em aberto, sobre o alcance da prova de acesso efetivo quando houver pai organizacional inacessível ao operador. Encerrada pelo `PROVISION-PREP-DECISION` na mesma data; parecer final **A**.
- Identificadores validados: `admin-b2a5-inventory-reader` tem 27 caracteres, dentro de 6–30, com minúsculas alfanuméricas e hífens, e é imutável. `adminB2A5InventoryRead` tem 22 bytes, dentro de 64, e usa apenas alfanuméricos — custom role IDs aceitam maiúsculas, minúsculas, sublinhados e pontos, **não hífens**, o que confirma o camelCase; também é imutável e não reutilizável no projeto.
- Textos aprovados dentro dos limites oficiais: papel com title de até 100 bytes e description de até 300 bytes; **conta com `displayName` de até 100 bytes UTF-8 e `description` de até 256 bytes UTF-8** — corrigindo o registro anterior, que os dava como sem limite documentado. Contagem verificada: 25, 149, 27 e 148 bytes, respectivamente; nenhum texto precisou ser alterado. Nenhum contém projectId, operador, data real ou dado pessoal.
- Stage decidido: **`GA`**. Launch stages são informativos e não afetam a autorização; a única exceção é `DISABLED`, cujos papéis podem ser concedidos mas não têm efeito. `DISABLED` fica reservado como alavanca de neutralização não destrutiva, nunca como estado inicial.
- Permissões inalteradas: `datastore.entities.get` e `datastore.entities.list`, nenhuma marcada como não suportada em custom roles. Verificação definitiva por `gcloud iam list-testable-permissions` com filtro `customRolesSupportLevel!=NOT_SUPPORTED`.
- Ordem decidida: **custom role primeiro, conta depois**, por segurança — um papel não vinculado não é principal e não pode ser alcançado por binding preexistente, enquanto uma conta órfã é identidade e pode ser capturada por principal set. O risco concentra-se na última etapa, imediatamente antes da verificação.
- Consistência eventual: a documentação adverte que pode ser necessário aguardar **60 segundos ou mais** após criar uma conta de serviço, com retry por backoff exponencial. Custom roles não têm atraso equivalente documentado; o caso de até 24 horas envolve `resourcemanager.*.get`, ausente deste papel. Polling somente leitura, limitado, sem jamais repetir o comando de criação; esgotado o limite, `timeout` sanitizado.
- Colisão: qualquer estado diferente de `absent` interrompe. Excluir um custom role bloqueia o mesmo ID por **44 dias**; contas de serviço admitem undelete por **30 dias**, bindings antigas são purgadas em até **60 dias** com prefixo `deleted:`, e recriar o mesmo nome produz **identidade separada, sem herdar papéis**. Categorias: `absent`, `exists-exact`, `exists-divergent`, `deleted`, `inaccessible`, `ambiguous`. `PERMISSION_DENIED` é `inaccessible`, nunca prova de inexistência.
- Prova de acesso efetivo: como somente allow policies concedem — deny apenas impede e PAB apenas torna inelegível —, a prova reduz-se à auditoria de allow policies quanto ao e-mail da conta, aos principal sets de contas de serviço e a `allUsers`/`allAuthenticatedUsers`, este último incluindo contas de serviço por definição. Formato confirmado: `principalSet://cloudresourcemanager.googleapis.com/projects/PROJECT_NUMBER/type/ServiceAccount`, com variantes de pasta e organização e associação automática e dinâmica.
- Policy Troubleshooter poderia avaliar, **para uma permissão e um recurso determinados**, as allow, deny e PAB policies relevantes àquela decisão IAM, inclusive herdadas e condicionais e para outro principal além do chamador. É adequado à prova IAM deste escopo Firestore, mas **não é ferramenta universal** e não cobre mecanismos externos ao IAM. Exigiria habilitar `policytroubleshooter.googleapis.com`, e nenhuma API será habilitada neste fluxo sem bloco próprio; por isso **não será usado no PROVISION-EXEC atual**.
- Decisão fail-closed incorporada pelo `PROVISION-PREP-DECISION`: consulta de ancestralidade somente por leitura antes de qualquer mutação, classificada em `project-only`, `project-and-folder`, `project-and-organization`, `project-folder-and-organization`, `inaccessible` ou `ambiguous`; havendo pasta ou organização, leitura bem-sucedida das allow policies de **todos** os níveis; `PERMISSION_DENIED`, `inaccessible`, `ambiguous`, `ancestorPolicyUnreadable` ou `ancestryIncomplete` interrompem antes de criar o papel e a conta. Nenhuma permissão do operador será ampliada e nenhuma API será habilitada.
- Chaves: listagem restrita a `USER_MANAGED`, resultado obrigatório zero. Chaves Google-managed existem por padrão e não devem ser confundidas; a listagem nunca expõe material privado. Valor maior que zero interrompe sem exclusão automática.
- APIs — contrato histórico e estado atual: a primeira tentativa do PROVISION observou a IAM API desabilitada e parou antes de criar. Em 2026-08-07, um bloco próprio habilitou `iam.googleapis.com` e observou `iamcredentials.googleapis.com` habilitada como efeito documentado; o futuro PROVISION deve revalidar ambas por leitura, sem habilitar ou desabilitar serviço.
- Rollback: preservar, nunca excluir automaticamente. Órfãos são inertes; diante das janelas de 44 e 30 dias, a exclusão automática seria o pior desfecho. Alavancas não destrutivas disponíveis mediante autorização: `--stage=DISABLED` e `gcloud iam service-accounts disable`.
- Operador: somente autenticação gcloud humana já existente; proibidos login, init, ADC, impersonação e chave. `--account` e `--project` explícitos, sem `gcloud config set project`. Permissões mínimas por finalidade, sem `setIamPolicy`, criação de chaves, Token Creator, Service Account User, papéis básicos, Firebase Admin, Storage, Auth, Logging ou habilitação de APIs. Nenhum papel concedido neste PREP.
- **Correção final 1 — permissões das policies ancestrais.** A lista anterior continha apenas `resourcemanager.projects.getIamPolicy`, que **não** autoriza ler policies de pasta ou organização. Passam a ser obrigatórias, condicionadas à existência do nível: `resourcemanager.folders.getIamPolicy` para cada pasta ancestral e `resourcemanager.organizations.getIamPolicy` para a organização, além de `resourcemanager.projects.get` e `resourcemanager.projects.getIamPolicy` no projeto. O EXEC resolve a ancestralidade antes da primeira mutação, determina as permissões condicionais necessárias, comprova-as nos recursos corretos e interrompe se faltar qualquer uma — sem conceder permissões, sem presumir Owner/Editor/admin da organização e sem tratar `PERMISSION_DENIED` como policy ausente.
- **Estratégia de ancestralidade.** `gcloud projects get-ancestors` (estável) produz a lista autoritativa dos níveis a ler; a leitura é feita por comandos separados por nível — `projects get-iam-policy`, `resource-manager folders get-iam-policy` e `organizations get-iam-policy` —, porque só assim cada nível é comprovável. `gcloud projects get-ancestors-iam-policy` é estável e cobre projeto e ancestrais, mas seu comportamento em sucesso parcial e suas permissões não estão documentados e não há flag de policy version documentada; serve apenas como conferência cruzada. Não usar `alpha`/`beta` havendo estável. Tudo em memória, sem saída bruta e sem persistir policy. Sucesso parcial nunca equivale a leitura integral.
- **Correção final 2 — acesso indireto por grupo e domínio.** O registro anterior afirmava que `group:`/`domain:` não alcançariam a conta nova; **isso estava incorreto quanto a grupos**: contas de serviço podem ser membros de Google Groups, e a documentação confirma a prática ao recomendar principal sets "em vez de grupos personalizados".
- **Correção de escopo 1 — `domain:` não pode ser declarado inofensivo.** A formulação anterior, de que `domain:` seria apenas defesa em profundidade porque contas de serviço não pertencem ao domínio do Workspace, **foi removida por confundir dois contextos**. A documentação de contas de serviço trata de **compartilhamento de recursos do Workspace**; a documentação de principais do IAM descreve o principal de domínio como "todas as identidades em todos os domínios, incluindo subdomínios, associados ao customer ID", sem excluir contas de serviço. Contrato adotado: `domain:` **pode** representar acesso indireto e recebe **o mesmo fail-closed de `group:`** — não inferir ausência de associação, interromper antes da criação diante de papel relevante ou perigoso, não resolver a dúvida criando a conta, não habilitar Cloud Identity ou outra API e não aceitar o risco silenciosamente.
- **Fail-closed para associação indireta.** Localizar bindings `group:` e `domain:`, resolver o papel de cada uma (predefinido, custom de projeto ou custom de organização) e verificar se contém permissão relevante ou perigosa — entities.get/list, escrita Firestore/Datastore, Storage, Firebase Auth, alteração de IAM, chaves, tokens, impersonação, Service Account User ou administração. Havendo qualquer uma, parar antes de criar e classificar `indirectMembershipRisk`; proibido descobrir associação criando a conta, aceitar o risco, escalar ao `ACTIVATION-PREP` ou presumir segurança pelo nome.
- **Expansão dos papéis.** Não inferir permissões pelo nome. Descrever por leitura os papéis predefinidos e os custom roles de projeto e de organização que aparecerem, capturando em memória só o necessário. Papel inacessível, inexistente, `deleted`, `disabled`, ambíguo ou não descritível para antes da criação sob `rolePermissionsUnresolved`. Bindings condicionais não podem ser omitidas: sem flag de policy version documentada, confirmar o mecanismo no `--help` sem inventar flag e, não sendo comprovável, parar sob `conditionalBindingsUnverified`.
- **Métricas sanitizadas adicionais:** `groupBindingsCount`, `domainBindingsCount`, `relevantGroupBindingsCount`, `relevantDomainBindingsCount`, `indirectMembershipRisk`. Nunca nome de grupo, domínio, membros, policy integral ou resource names reais.
- Saída por allowlist, sem projectId, project number, e-mails, unique ID, resource name, política integral, membros, principal sets reais, token, chave ou output bruto da gcloud; sem persistência automática e sem criar arquivo no repositório.
- **Correção de escopo 2 — limite da análise hierárquica.** Policies de organização, pasta e projeto **não incluem necessariamente** policies anexadas a recursos descendentes. O Cloud Storage admite IAM policy em bucket, IAM policy em managed folder e ACLs de bucket ou objeto, que não aparecem na leitura da policy do projeto. Sem Policy Analyzer, Cloud Asset API, inventário de recursos descendentes e análise de ACLs — nenhum deles habilitado ou iniciado neste fluxo — **não é possível comprovar ausência global de acesso** ao Storage ou a todos os serviços.
- **Escopo comprovável obrigatório.** (A) **Zero acesso Firestore/Datastore**: ausência de `datastore.entities.get`, `list`, `create`, `update`, `delete`, `allocateIds` e de qualquer outro grant Firestore/Datastore, considerando identidade individual, principal sets, `allUsers`, `allAuthenticatedUsers`, `group:`, `domain:`, bindings condicionais e papéis predefinidos e customizados — integralmente comprovável porque o Firestore concede no nível do projeto, com database delimitado por IAM Conditions na policy do projeto. (B) **Zero capacidade de representação ou credencial**: nenhuma chave `USER_MANAGED`, nenhuma binding Token Creator ou Service Account User na própria conta, nenhuma binding aplicável que conceda tokens, impersonação ou gerenciamento de chaves, nenhum ADC, nenhum token da conta de serviço, nenhuma impersonação e nenhuma chave criados — o access token temporário do operador humano, usado só no transporte REST dos gates, não é token da conta e não altera esta prova. (C) **Zero binding criada pelo fluxo**: papel sem binding, conta sem papel, nenhuma allow policy alterada, nenhum `setIamPolicy` e nenhum `add-iam-policy-binding`.
- **Escopo NÃO comprovado.** O EXEC não comprova ausência global de acesso a todos os buckets, managed folders, objetos e ACLs do Storage, a todos os recursos com policies próprias, a todos os serviços, nem a policies de recursos descendentes não inventariados. O relatório declara apenas que **nenhum grant Storage/Auth/IAM perigoso foi identificado nas policies hierárquicas examinadas**, registrando que isso **não é prova global**, que nenhuma policy descendente foi inventariada, que nenhuma ACL foi consultada e que nenhuma chamada de serviço testou acesso. Proibidas as expressões "zero acesso global", "ausência de qualquer acesso Storage", "prova completa para todos os serviços" e "nenhuma capacidade em qualquer recurso do projeto".
- **Decisão de escopo e risco residual.** O provisionamento exige prova fail-closed apenas de (A), (B) e (C); prova global não é necessária ao inventário Firestore e exigiria infraestrutura e permissões adicionais. A análise de papéis perigosos nas policies hierárquicas permanece **gate conservador e observação**, nunca prova global. Risco residual: uma policy ou ACL em recurso descendente de outro serviço poderia abranger a conta por grupo, domínio ou principal set sem aparecer na análise hierárquica. Mitigações: conta exclusiva do inventário, sem credencial, sem impersonação, sem Token Creator, sem chave, sem aplicação que a use, sem operação de outro serviço, desabilitada após o inventário; qualquer ampliação da prova exige bloco próprio.
- **Policy Analyzer.** É a ferramenta apropriada para saber quais principais têm quais acessos em recursos descendentes, incluindo expansão de grupos e papéis, mas usa a Cloud Asset API, que **não será habilitada**; portanto **não será usado no PROVISION-EXEC**. Análise global futura exige PREP e autorização próprios e **não** é dependência do inventário Firestore atual.
- **Finalização 1 — atributos completos obrigatórios na criação.** Os quatro textos aprovados devem ser aplicados **nos próprios comandos**, por flags estáveis, sem YAML ou JSON temporário quando as flags bastarem. Papel: `--title "ADMIN B2A5 Inventory Read"`, `--description "Read-only Firestore entity permissions reserved for the approved ADMIN-B2A5 inventory activation window. Do not bind outside the authorized workflow."`, `--permissions "datastore.entities.get,datastore.entities.list"`, `--stage GA`. Conta: `--display-name "ADMIN B2A5 Inventory Reader"`, `--description "Dedicated keyless identity for the approved ADMIN-B2A5 Firestore inventory. Access bindings are applied only during an authorized activation window."`. `--project` e `--account` sempre explícitos, em memória e nunca impressos; nunca repetir criação com resultado ambíguo. Nenhuma descrição contém projectId, operador, data real ou informação pessoal, e os limites UTF-8 continuam respeitados.
- **Finalização 2 — classificação operacional específica do EXEC.** A classificação ampla de sucesso foi substituída por **"A. PROVISIONAMENTO CONCLUÍDO SEM ACESSO FIRESTORE/DATASTORE, SEM CAPACIDADE DE IMPERSONAÇÃO E SEM BINDINGS CRIADAS"**, exigindo cumulativamente ausência de grants Firestore/Datastore aplicáveis, ausência de grants aplicáveis de impersonação/Token Creator/Service Account User/gerenciamento de chaves, zero user-managed keys, zero ADC, zero token da conta de serviço, zero impersonação, zero token persistido, zero binding criada pelo bloco e limites de escopo registrados. Continua proibido afirmar zero acesso global, ausência total de Storage ou ausência de acesso em todo recurso descendente.
- **Permissões do operador — lista fechada.** Criação, antes ausentes da lista consolidada e agora indispensáveis: `iam.roles.create` e `iam.serviceAccounts.create`. Leitura: `iam.roles.get`, `iam.roles.list`, `iam.serviceAccounts.get`, `iam.serviceAccounts.list`. Chaves: `iam.serviceAccountKeys.list`. Policy da conta: `iam.serviceAccounts.getIamPolicy`. APIs e projeto de quota: `serviceusage.services.list` e `serviceusage.services.use`. Resource Manager: `resourcemanager.projects.get`, `resourcemanager.projects.getIamPolicy`, mais `folders.getIamPolicy` e `organizations.getIamPolicy` quando o nível existir. **Leitura não autoriza criação**; não presumir Owner, Editor ou papel básico; não conceder permissão neste fluxo.
- **Escopo de recurso do `testIamPermissions` — correção central.** O método testa as permissões do chamador **sobre o recurso fornecido à operação**: `projects.*` sobre o projeto, `folders.*` sobre a pasta, `organizations.*` sobre a organização e `projects.serviceAccounts.*` sobre uma conta específica. **Não assumir** que uma permissão de recurso filho seja validada por `projects.testIamPermissions` só porque o papel do operador foi concedido no projeto. Proibido afirmar que `iam.serviceAccounts.getIamPolicy` pode ser testada no projeto por a conta não existir, ou que `iam.serviceAccountKeys.list`, `iam.serviceAccounts.get` e `iam.roles.get` são comprováveis antes de o recurso existir.
- **Gate pré-mutação — só o aplicável ao projeto.** No projeto: `iam.roles.create`, `iam.roles.list`, `iam.serviceAccounts.create`, `iam.serviceAccounts.list`, `resourcemanager.projects.get`, `resourcemanager.projects.getIamPolicy`, `serviceusage.services.list` e `serviceusage.services.use`. Pasta: `resourcemanager.folders.getIamPolicy` **no recurso pasta**. Organização: `resourcemanager.organizations.getIamPolicy` **no recurso organização**. Sem wildcard, sem inferir permissão pelo nome do papel e sem tratar resposta parcial como aprovação. Ausência produz `operatorProjectPermissionMissing` e **interrompe antes da criação do custom role**, sem conceder permissão, sem pedir Owner/Editor e sem mutação exploratória.
- **Permissões dependentes de recurso.** `iam.roles.get` é autorizada sobre o recurso do papel específico: não declarar comprovada antes da criação e **não inventar `roles.testIamPermissions`**; validar pela descrição imediatamente após criar. Falha → `operatorCustomRolePermissionMismatch`, preservar o papel, não excluir, não repetir e **não criar a conta**. Depois da conta criada e visível, testar `iam.serviceAccounts.get`, `iam.serviceAccounts.getIamPolicy` e `iam.serviceAccountKeys.list` por `projects.serviceAccounts.testIamPermissions` **no recurso da própria conta**, usando o identificador numérico devolvido pela criação quando aumentar a confiabilidade; só então descrever, ler a policy e listar `USER_MANAGED`. Falha → `operatorServiceAccountPermissionMismatch`, preservar, não excluir, não conceder acesso, não repetir, não prosseguir. `PERMISSION_DENIED` nunca é inexistência.
- **Três estados de permissão, nunca colapsados.** (A) pré-mutação de projeto e ancestrais → `operatorPreMutationPermissionsComplete`; (B) verificação do papel criado → `operatorCustomRoleVerificationPermissionConfirmed`; (C) permissões sobre a conta criada → `operatorServiceAccountResourcePermissionsComplete`. `operatorPermissionsComplete` sobrevive **apenas como agregado final**, `true` só após os três, e **nunca antes da criação dos dois recursos**. Risco de falha parcial aceito e registrado: pode-se criar o papel — ou papel e conta — e só então descobrir permissão de verificação faltante; a resposta é preservar, interromper e escalar.
- **Gates pré-mutação × verificações pós-criação.** Corrigida a formulação absoluta: nem toda verificação pode preceder a mutação. **(A) Pré-mutação:** identidade do operador, fingerprint, permissões de projeto e ancestrais, APIs, ancestralidade, policies integrais, bindings condicionais, expansão de papéis, `group:`, `domain:`, principal sets, colisões dos dois recursos e suporte das permissões em custom role. **(B) Após o custom role:** descrever o papel e confirmar ID, title, description, stage, exatamente as duas permissões e ausência de binding — a conta só é criada depois disso. **(C) Após a conta e o polling read-only:** testar as três permissões no recurso da conta e só então descrever, confirmar account ID, display name, description e enabled/disabled, ler a policy anexada e confirmar zero binding, listar somente `USER_MANAGED` e confirmar `userManagedKeyCount == 0`. Nunca repetir uma criação.
- **Falha de permissão pós-criação.** Não repetir a criação; classificar falha parcial; preservar o recurso; não excluir; não conceder permissão; não prosseguir ao recurso seguinte com a validação do primeiro incompleta; relatar `operatorCustomRolePermissionMismatch` ou `operatorServiceAccountPermissionMismatch`; aguardar decisão humana. `PERMISSION_DENIED` nunca vira recurso inexistente.
- **Campos sanitizados adicionais:** `operatorPreMutationRequiredPermissionsCount`, `operatorPreMutationGrantedPermissionsCount`, `operatorPreMutationPermissionsComplete`, `operatorProjectPermissionMissing`, `operatorCustomRoleVerificationPermissionConfirmed`, `operatorCustomRolePermissionMismatch`, `operatorServiceAccountRequiredPermissionsCount`, `operatorServiceAccountGrantedPermissionsCount`, `operatorServiceAccountResourcePermissionsComplete`, `operatorServiceAccountPermissionMismatch`, `operatorPermissionsComplete`, `preMutationGatesCompleted`, `customRolePostCreateVerificationCompleted`, `serviceAccountPostCreateVerificationCompleted`, `humanOperatorAccessTokenUsedForRest`, `humanOperatorAccessTokenPersisted`, `humanOperatorAccessTokenCleared`, `quotaProjectHeaderUsed`, `quotaProjectPermissionConfirmed`, `testIamPermissionsTransport` e `restTransportCompleted` — apenas contagens, booleanos e categorias, nunca permissões extras, papéis do operador, e-mail, projectId, nome completo de recurso, policies, token, chave ou ADC.
- **Transporte REST oficial dos quatro `testIamPermissions`.** A gcloud CLI estável não expõe comandos equivalentes em `gcloud projects`, `gcloud resource-manager folders` ou `gcloud iam service-accounts`, e nenhum comando será inventado sem confirmação simultânea na versão local e na documentação oficial. Endpoints contratuais: `POST https://cloudresourcemanager.googleapis.com/v3/{resource=projects/*}:testIamPermissions`, `.../v3/{resource=folders/*}:testIamPermissions`, `.../v3/{resource=organizations/*}:testIamPermissions` e `POST https://iam.googleapis.com/v1/{resource=projects/*/serviceAccounts/*}:testIamPermissions`. Corpo sempre `{"permissions": [...]}`, sem wildcard; a resposta devolve só o subconjunto que o chamador possui. A conta aceita e-mail ou `uniqueId` — usar o identificador numérico devolvido pela criação —, e o wildcard `projects/-/serviceAccounts/...` é proibido porque a documentação adverte que ele pode gerar códigos de erro enganosos. URLs concretas e identificadores reais ficam só em memória.
- **Token do operador humano — exceção única e delimitada.** Continuam proibidos ADC, `gcloud auth application-default login`, `gcloud auth application-default print-access-token`, `--impersonate-service-account`, impersonação, access token ou ID token da conta de serviço, refresh token novo, chave JSON e qualquer credencial persistida. Permitido apenas no PROVISION-EXEC: um access token OAuth **temporário do operador humano já autenticado**, via `gcloud auth print-access-token OPERATOR_IN_MEMORY --quiet` — o argumento posicional `[ACCOUNT]` é oficial e `--lifetime` serve só a impersonação, que não será usada. O token vive só em variável do processo, nunca é impresso, persistido, logado, transcrito ou relatado, não é reutilizado fora do bloco e é limpo em `finally` junto com headers e bodies, inclusive em falha. Sem `Write-Host`, `Write-Output`, `echo`, `Start-Transcript`, serialização de headers ou exibição de exceptions com headers; avaliar `Remove-Variable` como limpeza adicional, sem alegar apagamento criptográfico da memória.
- **`X-Goog-User-Project`, `serviceusage.services.use` e bootstrap fail-closed.** A documentação confirma o cabeçalho `x-goog-user-project` para indicar o projeto de quota em REST e a exigência de `serviceusage.services.use` sobre ele. A primeira chamada `projects.testIamPermissions` já vai com o cabeçalho e já solicita essa permissão: falha por quota project/service usage/permissão do cabeçalho **ou** sucesso que omita a permissão produzem `operatorQuotaProjectPermissionMissing`, limpeza imediata do token e parada antes de qualquer mutação — sem repetir sem autorização, sem remover o cabeçalho, sem trocar de projeto de quota, sem conceder permissão e sem fallback para leitura dos papéis do operador. Falha da primeira chamada nunca é lida como ausência de recurso.
- **Execução e erros do transporte.** `Invoke-RestMethod`/`Invoke-WebRequest` com POST, `Content-Type: application/json; charset=utf-8`, Bearer em memória, `X-Goog-User-Project`, corpo compacto gerado em memória, timeout finito, nenhum arquivo temporário e nenhuma saída bruta; processar apenas `$Response.permissions`. Categorias sanitizadas acrescentadas: `operatorAccessTokenUnavailable`, `operatorRestAuthenticationFailed`, `operatorQuotaProjectPermissionMissing`, `testIamPermissionsRequestFailed`, `testIamPermissionsResponseMalformed`, `operatorFolderPermissionMissing` e `operatorOrganizationPermissionMissing`, somadas a `operatorProjectPermissionMissing` e `operatorServiceAccountPermissionMismatch`. Nenhuma carrega mensagem HTTP bruta, response body, token, URL concreta ou identificador real.
- **Formulação precisa de "zero token".** Onde os documentos deste bloco disserem "nenhum token", leia-se zero token da conta de serviço, zero impersonação, zero ID token, zero ADC, zero chave e zero token persistido, sendo o access token temporário do operador humano a única exceção — em memória e só para o transporte REST. Permanecem intactos zero token em nome da futura conta, zero binding criada pelo fluxo e zero janela de ACTIVATION iniciada.
- **Finalização 3 — campos renomeados.** `firestoreDatastoreAccessDenied` → `noApplicableFirestoreDatastoreGrantDetected` e `impersonationCapabilityDenied` → `noApplicableImpersonationGrantDetected`. O sufixo `Denied` sugeria tentativa real contra o serviço e resposta de negação, o que **não ocorrerá**: o fluxo não executa chamada Firestore, não gera token, não impersona e não tenta usar a conta — a conclusão deriva exclusivamente da análise das allow policies e das bindings da conta. O primeiro campo é `true` só quando nenhuma policy hierárquica legível e aplicável contiver grant Firestore/Datastore relevante; o segundo, só quando não houver grant aplicável de `getAccessToken`, `getOpenIdToken`, `signBlob`, `signJwt`, Token Creator, Service Account User ou gerenciamento/criação de chaves. Os nomes antigos ficam proibidos.

### Ordem futura obrigatória

1. **ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP, PROVISION-PREP-DECISION, PROVISION-PREP-FINAL-CORRECTIONS, PROVISION-PREP-SCOPE-CORRECTION, PROVISION-PREP-PROMPT-FINALIZATION, PROVISION-PREP-OPERATOR-PERMISSIONS-FINALIZATION, PROVISION-PREP-RESOURCE-PERMISSIONS-FINALIZATION e PROVISION-PREP-REST-TRANSPORT-FINALIZATION** — atualização documental atual, com a decisão fail-closed, as permissões condicionais de pasta/organização, o tratamento fail-closed de `group:`/`domain:`, a delimitação do escopo da prova, os atributos completos de criação, a classificação operacional específica, os campos de resultado renomeados, as permissões de criação do operador, a separação entre gates pré-mutação e verificações pós-criação, a correção do escopo de recurso do `testIamPermissions` e o transporte REST oficial com token temporário do operador já incorporados, e parecer final **A**; revisão humana e commit/push documental permanecem separados e não iniciados nesta sessão. O AUTH-PREP, suas sete decisões e o ajuste de sequência já estão versionados nos commits `95c1303` e `b58541d`.
2. **Revisão humana e commit/push documental** — somente após aprovação integral dos três diffs.
3. **ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC** — não iniciado; criar somente o custom role mínimo e a conta dedicada, nesta ordem, sem binding, ADC, token da conta de serviço, impersonação ou acesso a dados, executando os gates por REST oficial com o token temporário do operador em memória, e parando antes da primeira criação se a ancestralidade IAM não for integralmente legível.
4. **ADMIN-B2A5-INVENTORY-AUTH-PROVISION-GOVERNANCE** — não iniciada; registrar e commitar a infraestrutura sem acesso, com a janela ainda não iniciada.
5. **ADMIN-B2A5-INVENTORY-AUTH-ACTIVATION-PREP** — não iniciado; definir a janela UTC real de 2 horas e o operador em memória e confirmar condição, API, isolamento do ADC, comandos e rollback.
6. **ADMIN-B2A5-INVENTORY-AUTH-ACTIVATION-EXEC** — não iniciado; no início da janela, criar as duas bindings condicionadas ao tempo, o ADC isolado e as verificações negativas sem leitura de documentos.
7. **ADMIN-B2A5-INVENTORY-EXEC** — não iniciado; imediatamente após a ativação, dentro da mesma janela, com autorização própria.
8. **ADMIN-B2A5-INVENTORY-AUTH-REVOKE** — bloco obrigatório separado, não iniciado; imediatamente após o inventário e independentemente do resultado, com comprovação de ausência de acesso residual.
9. **Governança separada** — não iniciada; registrar provisionamento, ativação, inventário e revogação em blocos distintos.
10. **ADMIN-B2A5-MIGRATION-PREP** — não iniciado e condicional ao inventário.
11. **ADMIN-B2A5-FIRESTORE-PREP/EXEC** — não iniciados; nenhuma publicação.
12. **ADMIN-B2A5-RUNTIME-PREP/EXEC** — não iniciados.
13. **ADMIN-B2B** — não iniciado; Storage separado.
14. **ADMIN-B3** — não iniciado; única etapa autorizada a publicar Rules e executar reteste remoto sanitizado.
15. **Demais fases administrativas** — seguir o roadmap e suas autorizações próprias.

Nenhum bloco posterior foi iniciado por esta atualização de governança.

### Roadmap administrativo

- **ADMIN-A — checkpoint e retomada:** concluído pelo `ADMIN-RESTART-PREP`.
- **ADMIN-B1-PREP:** concluído exclusivamente em leitura.
- **ADMIN-B1B-PREP:** concluído exclusivamente por GET/LIST; equivalência de Rules e CORS e estado do App Check registrados.
- **ADMIN-B2A-PREP:** concluído; contrato, matriz e divisão dos microblocos Firestore registrados.
- **ADMIN-B2A1-EXEC:** concluído; infraestrutura local e baseline atual automatizado em 44/44, sem alteração de Rules.
- **ADMIN-B2A2-BRIDGE-PREP e ADMIN-B2A2-BRIDGE:** concluídos, publicados, validados contra o servidor e aprovados no commit `4b1b783`.
- **ADMIN-B2A2-NETWORK-DIAG-PREP:** concluído; confirmou CSP/reCAPTCHA como defeito real sem declarar causalidade única antecipadamente.
- **ADMIN-B2A2-CSP-FIX-PREP, EXEC e PROD-VALIDATION:** concluídos; correção mínima publicada, validada e aprovada no commit `e2c8249`.
- **ADMIN-B2A2-FIRESTORE-TRANSPORT-PREP:** não necessário no estado atual; reabrir somente se timeout reaparecer após CSP válida.
- **ADMIN-B2A3-PREP:** concluído e aprovado somente como análise de leitura; governança registrada no commit `01ee3a9e667679a79ac4310d49a3f0f6c163450a`.
- **ADMIN-B2A3-EXEC:** concluído; implementação local, auditoria **A**, validação funcional **A** em 69/69, commit `4f25d8b0385efa760ba21c77a5211293eb84ea0f` e push para `origin/main`, sem publicação de Rules.
- **ADMIN-B2A4-PREP:** concluído e aprovado somente como análise de leitura; parecer **A. pronto para ADMIN-B2A4-EXEC**; governança registrada no commit `f9067e332a078ace7f840fecbe6f457bda324d34`.
- **ADMIN-B2A4-EXEC:** concluído e classificado como **A. VALIDADO FUNCIONALMENTE**; Rule Admin-only implementada; 87/87 em 5 suítes; coverage HTTP 200; commit `13245dcf6dcc2e5704ee3d019ed3c05233a057b3` e push para `origin/main`; sem publicação.
- **ADMIN-B2A5-PREP:** concluído somente por leitura; parecer original **B**; decisões humanas posteriores concluídas.
- **ADMIN-B2A5-DECISIONS-GOVERNANCE:** concluído e versionado no commit `1bd7377d25e540819e8fb67248568e38ba1b8601`.
- **ADMIN-B2A5-INVENTORY-PREP:** concluído somente por análise local; parecer **C**, progressão **C → B → A** e zero acesso remoto.
- **ADMIN-B2A5-INVENTORY-TOOL-PREP:** concluído somente por análise local; parecer **A** e zero alteração funcional/remota.
- **ADMIN-B2A5-INVENTORY-TOOL-ROOT-RECOVERY-AND-ISOLATION-PREP:** concluído; baseline raiz recuperado e arquitetura isolada aprovada com parecer **A**.
- **ADMIN-B2A5-INVENTORY-TOOL-ISOLATED-EXEC:** concluído e classificado como **A. VALIDADO LOCALMENTE**; 102/102, regressão 87/87 e commit funcional `1102741201d4858b55a7145570568856f6859573` em `origin/main`.
- **ADMIN-B2A5-INVENTORY-AUTH-PREP:** concluído em 2026-07-31 somente por análise e pesquisa documental oficial; parecer final **A** após as sete decisões humanas, com o parecer intermediário **B** preservado; versionado no commit `95c13039712d8794e80a446144a9873f60f455b4`; zero autenticação, IAM, acesso remoto ou inventário.
- **ADMIN-B2A5-INVENTORY-AUTH-SEQUENCING-ADJUSTMENT:** concluído em 2026-07-31 somente como análise de segurança e atualização documental; parecer **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP**; decompôs o AUTH-EXEC em PROVISION e ACTIVATION para que nenhuma binding fique ativa aguardando revisão e commit, sem reabrir decisão humana, ampliar permissão ou estender a janela.
- **ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP:** concluído em 2026-07-31 somente por pesquisa oficial e análise; parecer intermediário **B**; contrato dos dois recursos, stage `GA`, ordem, colisões, consistência eventual, provas negativas, saída sanitizada e rollback definidos; zero recurso criado e zero acesso remoto.
- **ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-DECISION:** concluído em 2026-07-31 somente como atualização documental; incorporou a decisão humana **fail-closed** de ancestralidade, corrigiu os limites de `displayName`/`description` da conta e a descrição do Policy Troubleshooter, e elevou o parecer a **A**, sem ampliar permissão, habilitar API ou criar recurso.
- **ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-FINAL-CORRECTIONS:** concluído em 2026-07-31 somente como atualização documental; fechou duas lacunas bloqueantes — permissões condicionais de pasta e organização para ler policies ancestrais, e acesso indireto por `group:`/`domain:` com expansão obrigatória dos papéis — e manteve o parecer **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC**, sem conceder permissão, habilitar API ou criar recurso.
- **ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-SCOPE-CORRECTION:** concluído em 2026-08-02 somente como atualização documental; passou `domain:` ao mesmo fail-closed de `group:` e delimitou a prova obrigatória a zero acesso Firestore/Datastore, zero capacidade de impersonação/token/chave e zero binding criada pelo fluxo, retirando qualquer afirmação de zero acesso global e registrando o risco residual de policies e ACLs em recursos descendentes; parecer **A** mantido, sem habilitar Policy Analyzer ou Cloud Asset API e sem criar recurso.
- **ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-PROMPT-FINALIZATION:** concluído em 2026-08-02 somente como atualização documental; tornou obrigatórios title, description, permissions, stage, display name e description nos comandos de criação, substituiu a classificação ampla de sucesso pela específica de Firestore/Datastore + impersonação + bindings, e renomeou `firestoreDatastoreAccessDenied` e `impersonationCapabilityDenied` para `noApplicableFirestoreDatastoreGrantDetected` e `noApplicableImpersonationGrantDetected`, eliminando a sugestão de testes remotos de negação que não ocorrerão; parecer **A** mantido, sem criar recurso ou executar comando remoto.
- **ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-OPERATOR-PERMISSIONS-FINALIZATION:** concluído em 2026-08-02 somente como atualização documental; incorporou `iam.roles.create` e `iam.serviceAccounts.create`, antes ausentes, mais as permissões de get/list, `iam.serviceAccountKeys.list` e `iam.serviceAccounts.getIamPolicy`; definiu o gate pré-mutação por `testIamPermissions` nos recursos aplicáveis, interrompendo antes da criação; e corrigiu a formulação absoluta, separando gates pré-mutação das verificações que só existem após cada criação, com categoria própria para falha posterior. As categorias e o escopo de recurso desse gate foram refinados no mesmo dia pelo `RESOURCE-PERMISSIONS-FINALIZATION`; parecer **A** mantido, sem conceder permissão ou criar recurso.
- **ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-RESOURCE-PERMISSIONS-FINALIZATION:** concluído em 2026-08-02 somente como atualização documental; corrigiu o escopo de recurso do `testIamPermissions`, retirou `iam.roles.get`, `iam.serviceAccounts.get`, `iam.serviceAccounts.getIamPolicy` e `iam.serviceAccountKeys.list` do gate de projeto por dependerem de recursos ainda inexistentes, reservou `projects.serviceAccounts.testIamPermissions` para a conta já criada e separou os três estados de comprovação com `operatorProjectPermissionMissing`, `operatorCustomRolePermissionMismatch` e `operatorServiceAccountPermissionMismatch`; parecer **A** mantido, com o risco de falha parcial registrado.
- **ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-REST-TRANSPORT-FINALIZATION:** concluído em 2026-08-02 somente como atualização documental; adotou os endpoints REST oficiais como mecanismo executável dos quatro `testIamPermissions`, proibiu comandos gcloud não confirmados e o wildcard `projects/-/serviceAccounts/...`, autorizou como exceção única o access token OAuth temporário do operador humano — em memória, nunca impresso ou persistido e limpo em `finally` —, acrescentou `serviceusage.services.use` ao gate pré-mutação por causa do `X-Goog-User-Project`, fechou o bootstrap fail-closed da primeira chamada com `operatorQuotaProjectPermissionMissing` e substituiu as proibições absolutas de token por formulação precisa; parecer **A** mantido, sem obter token, autenticar ou executar comando remoto.
- **ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC:** não iniciado; cria apenas papel e identidade, nessa ordem, sem acesso, executando os gates por REST oficial com token temporário do operador em memória, e para antes da primeira criação se a ancestralidade IAM não for integralmente legível.
- **ADMIN-B2A5-INVENTORY-AUTH-ACTIVATION-PREP/EXEC:** não iniciados; iniciam a janela de 2 horas e as bindings condicionadas ao tempo.
- **ADMIN-B2A5-INVENTORY-AUTH-REVOKE:** não iniciado; bloco obrigatório separado imediatamente após o inventário, independentemente do resultado.
- **ADMIN-B2A5-INVENTORY-EXEC/GOVERNANCE:** não iniciados; dependem da ferramenta e do IAM aprovados.
- **ADMIN-B2A5-MIGRATION-PREP/EXEC:** não iniciados; condicionais ao inventário e dependentes de autorizações próprias.
- **ADMIN-B2A5-FIRESTORE-PREP/EXEC:** não iniciados; dependem de autorizações próprias e não publicarão Rules.
- **ADMIN-B2A5-RUNTIME-PREP/EXEC:** não iniciados; dependem de autorizações próprias.
- **ADMIN-B2B:** Storage Rules; não iniciado e dependente de autorização própria.
- **ADMIN-B3:** não iniciado; revisão final, autorização explícita, única publicação controlada das Rules e reteste remoto sanitizado.
- **ADMIN-C:** integridade dos uploads, rollback e operações atômicas/idempotentes.
- **ADMIN-D:** fechamento de Empreendimentos.
- **ADMIN-E:** fechamento de Eventos.
- **ADMIN-F:** fechamento de Notícias.
- **ADMIN-G:** Biblioteca de Mídia, CMS-4C, galeria editorial, CORS e inventário de órfãos depois da estabilização.
- **ADMIN-H:** fechamento de Banners.
- **ADMIN-I:** modularização incremental do restante do painel.
- **ADMIN-J:** QA autenticada, rules tests, smoke, governança, fechamento e tag final.

### Critério de Painel Admin utilizável

- [x] autenticação Admin testada;
- [ ] contrato `admin`/`moderator` definido;
- [ ] usuário inativo bloqueado;
- [ ] Rules versionadas e remotas alinhadas; a Rule nova de `noticias` ainda não foi publicada;
- [ ] rascunhos protegidos em produção; proteção local versionada e validada em 69/69;
- [ ] dados internos protegidos;
- [x] CORS local/remoto alinhado;
- [ ] CMS-4C retestado ponta a ponta;
- [ ] moderação testada;
- [ ] operações críticas atômicas ou idempotentes;
- [ ] rollback de uploads;
- [ ] CRUD de eventos, estabelecimentos, notícias e banners testado;
- [ ] Biblioteca de Mídia sem quebra de referências;
- [ ] estados de loading, erro e vazio;
- [ ] autoria e timestamps;
- [ ] smoke autenticado;
- [ ] teste anônimo;
- [ ] governança atualizada.

### Tag de checkpoint recomendada

`pre-admin-restart-20260720`

Checkpoint existente e preservado. Nenhuma tag Git foi criada, alterada ou removida nesta tarefa.

### Checkpoint arquitetural pós-V5 — decisão aprovada

**Correção de sequência em 2026-07-16:** R4B — utilitários visuais —, R4A — acessibilidade eMAG —, R5A — remoção do fallback inline obsoleto — e R5B — externalização do runtime i18n — estão concluídos. R5B encerra oficialmente a Fase 1; V4D foi absorvido pelo R5A. Nenhuma etapa da Fase 2 foi iniciada.

O checkpoint foi somente leitura e confirmou um projeto público funcional, sem evidência para reescrita completa ou projeto novo. Após a Fase 1, a dívida técnica está concentrada principalmente em `index.html` (aproximadamente 1.712 linhas, 99 KB e cerca de 220 de JavaScript inline) e `css/index.css` (aproximadamente 7.080 linhas e 743 ocorrências de `!important`). A estratégia aprovada é híbrida: refatoração modular progressiva como espinha dorsal, microblocos para ajustes editoriais/órfãos e B3 como frente própria de performance. A tag anterior `pos-v5-checkpoint` permanece histórica; o novo checkpoint pós-Fase 1 usa a tag `pos-fase1-modular`, publicada local e remotamente, apontando para o commit de governança `3c9caee`.

**Plano aprovado:**

1. **Fase 0 — checkpoint:** concluído com a tag `pos-v5-checkpoint`.
2. **Fase 1 — fundação modular da home:** concluída com R1 eventos, R2 carrossel de experiências, R3 formulário, R4B utilitários visuais, R4A acessibilidade eMAG, R5A remoção do fallback inline obsoleto e R5B externalização do runtime i18n. A home não foi reescrita do zero e a estratégia de refatoração modular progressiva foi preservada.
3. **Fase 2 — navegação e estrutura:** o `V7-PREP`, o `V7A` e o `V7B` foram concluídos; a estratégia V7A→V7B→V7C1→V7C2 segue aprovada, usando `js/nav-shared.js` como base única. O próximo bloco é somente o `V7C1`, ainda não iniciado. V7C2 permanece posterior; V6 permanece pendente e deve ser reavaliado depois.
4. **Fase 3 — dados editoriais:** fonte única de notícias; contrato entre `eventos-2026.json` e `TURISMO_EVENTOS`; preparação da virada anual de eventos.
5. **Fase 4 — performance/B3:** vídeos, imagens pesadas, CSS órfão e revisão gradual de `css/index.css`.
6. **Fase 5 — CMS:** somente quando oficialmente despausado.

**Separação aprovada:** R1 extraiu somente a lógica da grade "Acontece em breve" para `js/home-eventos.js`; R2 extraiu somente o carrossel de experiências para `js/home-experiencias.js`; R3 extraiu somente a lógica do formulário de contato para `js/home-contato.js`; R4B extraiu somente a barra de progresso e o botão “Voltar ao topo” para `js/home-utilitarios.js`; R4A extraiu somente acessibilidade eMAG para `js/home-acessibilidade.js`; R5A removeu somente o fallback inline obsoleto de traduções de `index.html`; R5B externalizou somente o runtime do seletor de idiomas para `js/home-i18n.js`. As extrações foram comportamentalmente 1:1, sem mudança funcional ou visual; R5A preservou `var translations = window.translations || {};`, e R5B preservou `translations.js`, a cobertura PT/EN/ES/PL, `sms-lang`, `window.applyTranslations` e `translationsApplied`. A tag do R5B foi registrada sem `defer`, `async` ou `type="module"`, depois do hamburger e antes dos módulos com `defer`; R1, R2, R3, R4A, R4B e R5A permaneceram intactos.

### Checkpoint pós-Fase 1 — decisão registrada

- A Fase 1 foi encerrada e o checkpoint técnico/arquitetural foi concluído somente em leitura. A validação confirmou home em desktop e mobile, PT/EN/ES/PL, acessibilidade, eventos, carrossel, formulário sem POST, clima, busca, tema, mascote, progresso, voltar ao topo e smoke test das páginas públicas.
- Não foram encontrados `ReferenceError`, `TypeError`, `SyntaxError` ou 404 novos naquele checkpoint. A classificação histórica dos erros de App Check/reCAPTCHA em localhost como ambientais foi superada pelo `ADMIN-B2A2-NETWORK-DIAG-PREP`, que confirmou incompatibilidade da CSP sem atribuir a ela, ainda, causa única do timeout.
- O `V7-PREP`, o `V7A` e o `V7B` foram concluídos em sequência; o próximo bloco aprovado passou a ser o `V7C1`. V7C2, V6 e B3 permanecem pendentes.
- Os módulos da Fase 1 são `js/home-eventos.js`, `js/home-experiencias.js`, `js/home-contato.js`, `js/home-utilitarios.js`, `js/home-acessibilidade.js` e `js/home-i18n.js`. Nenhuma extração precisa ser revertida; o gargalo estrutural principal passou a ser a duplicação da navegação, com CSS e mídia como gargalos relevantes.
- Cache: os `js/home-*.js` são atendidos pelo runtime cache e `translations.js` participa do cache/precache. Alterações futuras nesses arquivos devem avaliar obrigatoriamente novo token `?v=` ou nova versão de `CACHE_NAME`; o cache não será alterado nesta tarefa.
- Decisão confirmada: o local correto do AgroSamas é `Rua do Mathe`. `TURISMO_EVENTOS/js/data/eventos.js` ainda registra `Parque de Exposições`; isso é uma inconsistência de dados conhecida, a corrigir futuramente em bloco exclusivo de dados, fora do `V7-PREP`. Nenhum arquivo de dados ou fonte turística foi alterado nesta governança.

### V7-PREP — concluído e estratégia do V7 aprovada

O `V7-PREP` foi concluído em 2026-07-16, exclusivamente em leitura, diagnóstico, comparação, experimento em memória e planejamento; nenhum arquivo foi alterado durante o bloco. O experimento temporário em browser confirmou que carregar a navegação atual da home junto com `js/nav-shared.js` produz dois headers, dois `navToggle`, dois `navLinks`, dois seletores de idioma, dois modais de busca, duas barras de acessibilidade, duas barras de progresso, IDs duplicados e +132px indevidos no padding superior da home. A coexistência é inviável: não haverá migração gradual ingênua e o cutover do chrome da home será atômico, precedido por bloco de compatibilidade isolado.

**Microblocos aprovados, com risco e sequência obrigatória (cada um com metadata, commit próprio, governança própria e deploy testado em produção antes do seguinte):**

1. **V7A — compatibilidade do nav-shared (risco baixo-médio, concluído):** adicionada ao `NAV_CSS` a exceção `@media (min-width: 769px) { body.home-page { padding-top: 0; } }`; o token passou para `?v=site-public-v7a-20260716` nas 13 páginas públicas ativas; `index.html` permaneceu completamente intacto; páginas internas foram validadas e o deploy foi confirmado.
2. **V7B — cutover atômico da home (risco alto, concluído):** o `index.html` passou a carregar `js/nav-shared.js?v=site-public-v7a-20260716` como primeira tag do `body.home-page`, em script clássico, síncrono e sem `defer`, `async` ou `type="module"`. O chrome estático, hamburger inline, modal/overlay de busca, progresso, botão de topo, VLibras estático, tag duplicada de `scroll-animations.js` e tags de `js/home-i18n.js`/`js/home-utilitarios.js` foram removidos; os dois últimos arquivos permanecem no disco para rollback até o V7C1. O breakpoint foi alinhado a 968px e `js/home-acessibilidade.js` foi preservado.
3. **V7C1 — limpeza de runtime (risco baixo, não iniciado):** excluir fisicamente `js/home-i18n.js` e `js/home-utilitarios.js`; reduzir `js/home-acessibilidade.js` a `prefers-reduced-motion`/pausa do vídeo e atalhos Alt+1..4; revisar o registro duplicado do Service Worker.
4. **V7C2 — limpeza de CSS (risco médio, não iniciado, bloco separado):** remover somente CSS comprovadamente órfão após o cutover (regras antigas da navegação, `.language-dropdown.active`, drawers antigos) e avaliar `.map-modal-*` e `.agrosamas-banner`; separado devido à complexidade de `css/index.css` e seus ~743 `!important`.

**Cinco decisões humanas aprovadas:**

1. **Início:** destino `/`; clicar em Início estando na home recarrega a página em vez de rolar até `#map-hero` (paridade e manutenção única).
2. **Idioma do primeiro acesso:** prevalece a detecção do navegador feita por `translations.js`; PT não é mais forçado sem `sms-lang`; PT/EN/ES/PL disponíveis; seleção manual persiste em `sms-lang`.
3. **Área restrita:** comportamento dinâmico do nav-shared adotado na home (`smsUserSession` via `localStorage`, nome + Sair para autenticado); não reativa Admin/CMS/Firebase.
4. **Breakpoint:** home alinhada aos 968px do shared, eliminando a divergência 968–1180px; tablets em paisagem usam navegação desktop.
5. **Acessibilidade:** `js/home-acessibilidade.js` mantido no V7B (o shared cobre fonte/contraste, mas não reduced-motion/pausa de vídeo nem atalhos JS Alt+1..4); redução só no V7C1; nenhuma regressão de acessibilidade é aceita.

**Módulos e destinos:** sobrevivem `js/home-eventos.js`, `js/home-experiencias.js`, `js/home-contato.js` e `js/home-acessibilidade.js`; `js/home-i18n.js` e `js/home-utilitarios.js` perderam as tags no V7B, mas os arquivos permanecem no disco até o V7C1; o hamburger inline saiu no V7B. `translations.js` permanece intacto, com `window.applyTranslations` e `translationsApplied` como contratos obrigatórios. O VLibras foi consolidado no próprio V7B em uma única instância funcional; não é pendência do V7C1. Busca: `search.js` e `search-index.js` permanecem intactos; o modal injetado pelo shared é a única instância.

**Regra de cache do V7:** `js/nav-shared.js` está em `NEVER_CACHE` no Service Worker; HTML e navegações não são cacheados pelo SW; `sw.js` e `CACHE_NAME` permaneceram intactos; os módulos aposentáveis permanecem no disco para rollback. O registro inline e o registro do shared para o mesmo Service Worker continuam temporariamente idempotentes e sem erro observado, com consolidação reservada ao V7C1.

**Follow-ups registrados:** o nav-shared não fecha o drawer automaticamente ao redimensionar para desktop; o skip link de busca não existe no shared; Alt+2 ainda tenta focar `#navLinks`, um `ul` sem `tabindex`, mantendo limitação preexistente. O VLibras está único e funcional; a divergência foi resolvida no V7B. O problema de duas opções `.lang-option.active` após reload também foi eliminado pelo cutover.

### V7A — concluído e validado

O V7A foi concluído em 2026-07-17 como microbloco de compatibilidade do `nav-shared`, com validação funcional prévia, commit próprio, push e publicação no GitHub Pages. O commit funcional confirmado pelo Git é `4cd0616cb9d393571946f90c97a753eae16e69c3 feat(nav): prepara nav-shared para adocao pela home (V7A)`, presente em `origin/main`. `git show` confirmou 15 arquivos modificados, 20 inserções e 14 remoções, sem alteração inesperada:

- `js/nav-shared.js`;
- `js/site-meta.js`;
- as 13 páginas públicas ativas: `eventos.html`, `galeria.html`, `local.html`, `mapa-turistico.html`, `noticia.html`, `noticias.html`, `o-que-fazer.html`, `onde-ficar.html`, `para-o-trade.html`, `reservas.html`, `rotas-completas.html`, `sabores.html` e `transparencia.html`.

O `NAV_CSS` recebeu somente o contrato de compatibilidade `@media (min-width: 769px) { body.home-page { padding-top: 0; } }`. As 13 tags clássicas, síncronas e sem `defer`, `async` ou `type="module"` passaram para `?v=site-public-v7a-20260716`; páginas legadas, `portal-usuario` e demais assets não participaram da renovação. A metadata foi atualizada antes do commit funcional com `updatedAt: "2026-07-17T08:56:35-03:00"`.

`index.html` permaneceu byte a byte intacto: a home ainda não carrega `js/nav-shared.js`, mantém sua navegação própria, continua com `body.home-page` em `padding-top: 0` no desktop e preserva os módulos R1–R5. O V7A não iniciou o cutover. As páginas internas permaneceram visual e funcionalmente equivalentes; os smokes desktop/mobile, idiomas, busca, autenticação não logada, VLibras, eMAG, progresso, voltar ao topo e Leaflet foram registrados como aprovados. `js/nav-shared.js` permanece em `NEVER_CACHE`; HTML/navegações continuam fora do cache do Service Worker; `sw.js` e `CACHE_NAME` permaneceram intactos.

O GitHub Pages foi publicado e validado: a página pública respondeu HTTP 200 e `noticias.html` respondeu HTTP 200 servindo a tag `js/nav-shared.js?v=site-public-v7a-20260716`. Nenhum teste de runtime foi repetido nesta atualização documental. O próximo microbloco era o **V7B**, posteriormente concluído; V7C1 e V7C2 permanecem não iniciados. Os módulos sobreviventes `js/home-eventos.js`, `js/home-experiencias.js` e `js/home-contato.js` permanecem preservados; `js/home-i18n.js`, `js/home-utilitarios.js` e `js/home-acessibilidade.js` seguem fisicamente disponíveis conforme o plano registrado. V6, B3, V5C3, V5D, CSS órfão, mídia pesada, Formspree e demais pendências permanecem documentados. A pausa administrativa aqui descrita é histórica; a frente Admin/CMS/Firebase foi retomada em 2026-07-20.

---

## V7B — concluído e validado

O V7B foi concluído em 2026-07-17 como cutover atômico da navegação da home para `js/nav-shared.js`. A execução foi corrigida, validada, commitada, enviada por push e publicada com sucesso; esta atualização é somente documental e não repete testes de runtime, commit, push ou deploy.

### Evidência confirmada pelo Git

- Commit funcional: `e80794418524e521ebbaaab85f76d101ffae5717`.
- Mensagem exata: `feat(home): adota nav-shared como navegacao unica da home (V7B)`.
- O commit está presente em `HEAD`, `origin/main` e `origin/HEAD`.
- `git show --stat --oneline --decorate --no-renames e807944` confirmou 3 arquivos alterados, 4 inserções e 409 remoções.
- `git show --format= --name-status --no-renames e807944` confirmou somente: `index.html`, `css/index.css` e `js/site-meta.js`.
- `js/site-meta.js` no commit registra `updatedAt: "2026-07-17T10:14:49-03:00"`.

### Resultado do cutover

- A primeira tag dentro de `body.home-page` é `<script src="js/nav-shared.js?v=site-public-v7a-20260716"></script>`, preservando script clássico, síncrono, sem `defer`, `async` ou `type="module"`.
- O `nav-shared` tornou-se a navegação única da home e das páginas internas: header, dropdowns, drawer mobile, overlay, idioma, área restrita, barra eMAG, progresso, botão de topo e busca.
- O chrome estático duplicado foi removido de `index.html`: trilho/barra de progresso, skip links antigos, eMAG, navegação, logo/links duplicados, dropdowns, hamburger/menu mobile, atalhos mobile, overlay, idiomas, área restrita, modal de busca, botão de topo, VLibras estático, bloco inline do hamburger e tags duplicadas de scroll/i18n/utilitários.
- `js/home-eventos.js`, `js/home-experiencias.js`, `js/home-contato.js` e `js/home-acessibilidade.js` continuam ativos. `js/home-i18n.js` e `js/home-utilitarios.js` não carregam mais, mas permanecem fisicamente no repositório para rollback até o V7C1.
- `js/home-acessibilidade.js` foi preservado para reduced motion, pausa/remoção de autoplay do vídeo hero e atalhos Alt+1, Alt+2, Alt+3 e Alt+4. A limitação preexistente do Alt+2, que tenta focar o `ul#navLinks` sem `tabindex`, permanece documentada.
- `css/index.css` teve somente os dois thresholds de navegação ajustados de 1180px para 968px; a ocorrência de 1180px relacionada a grades de conteúdo permaneceu intacta.
- O primeiro acesso sem `sms-lang` passou a respeitar o idioma preferencial do navegador; PT/EN/ES/PL, `sms-lang`, `window.translations`, `window.applyTranslations`, `translationsApplied`, `document.documentElement.lang` e persistência após reload foram preservados.
- A área restrita passou a usar o estado dinâmico do shared via `smsUserSession` em `localStorage`, sem reativar Admin/CMS/Firebase.
- A busca passou a ter somente o modal injetado pelo shared, preservando `search.js`, `search-index.js`, foco, resultados, Escape, fechamento, ARIA e tradução. Progresso e voltar ao topo também ficaram unificados, sem carga de `js/home-utilitarios.js`.
- A duplicação real do VLibras encontrada na primeira validação foi corrigida dentro do V7B: uma única `div[vw]`, botão, wrapper, tag do plugin, instância funcional e abertura/fechamento sem órfãos ou erro. A divergência está resolvida e não é pendência do V7C1.

### Service Worker, cache e rollback

- O registro inline do Service Worker foi mantido; o shared também registra o mesmo script/escopo. A duplicidade temporária, observada como idempotente e sem erro, fica para o V7C1.
- `sw.js`, `CACHE_NAME`, escopo e estratégia de cache não foram alterados. `js/nav-shared.js` permanece em `NEVER_CACHE`; HTML permanece fora do cache do SW.
- O rollback continua simples por `git revert` do commit único. `js/home-i18n.js` e `js/home-utilitarios.js` continuam no disco, e a tag `pos-fase1-modular` permanece disponível para consulta.

### Validações funcionais registradas antes desta governança

- Estáticas: `git diff --check`, somente os três arquivos no commit, uma tag nav-shared, zero tags home-i18n/home-utilitarios/scroll estática, módulos sobreviventes presentes, duas mudanças 1180px→968px e nenhum threshold adicional.
- DOM e comportamento: um header/shared nav, IDs únicos, uma busca, uma barra de progresso, um botão de topo, uma barra eMAG, skip links/atalhos únicos e uma instância de VLibras.
- Desktop: 1366px, 1200px, 1000px e 969px; mobile: 768px e 375px; menu, drawer, overlay, scroll lock, Escape, idioma, busca e links preservados.
- Idiomas, acessibilidade, busca, auth via localStorage, R1/R2/R3, páginas internas, console e Network foram validados naquele bloco; a classificação histórica do App Check/reCAPTCHA como ambiental foi posteriormente superada pelo diagnóstico de CSP de 2026-07-27.
- A publicação do GitHub Pages foi confirmada na validação funcional consolidada do V7B antes deste registro. A CLI `gh` e a rechecagem HTTP foram tentadas nesta sessão, mas ficaram bloqueadas por permissões/SSL do ambiente; nenhum deploy foi executado agora.

### Estado e pendências preservados

- V7-PREP, V7A e V7B — concluídos; V7C1 — próximo microbloco, ainda não iniciado; V7C2 — posterior, ainda não iniciado.
- V6, B3, V5C3, V5D, limpeza CSS, `.map-modal-*`, `.agrosamas-banner`, mídia pesada, virada anual de eventos, `TURISMO_EVENTOS`/AgroSamas, Formspree e demais follow-ups permanecem pendentes.
- A pausa administrativa registrada no encerramento do V7B é histórica; Admin/CMS/Firebase é a frente ativa desde 2026-07-20.

### Escopo desta atualização documental

- Alterados somente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`.
- `.claude/settings.local.json` permaneceu não rastreado e intocado.
- Não foram executados `node scripts/update-site-meta.mjs`, V7C1, V7C2, V6, B3, commit, push ou deploy nesta atualização.
- Sugestão de mensagem para um futuro commit desta governança: `docs: registrar conclusão do V7B`.

---

## HISTÓRICO — Ordem das frentes após o checkpoint de 2026-07-20 — SUPERADA PELO CHECKPOINT DE 30/08/2026

1. **ADMIN-B1-PREP, ADMIN-B1B-PREP e ADMIN-B2A-PREP** — concluídos.
2. **ADMIN-B2A1-EXEC** — infraestrutura local e baseline automatizado concluídos em 44/44, sem alteração ou publicação de Rules.
3. **ADMIN-B2A2-BRIDGE-PREP e ADMIN-B2A2-BRIDGE** — concluídos, publicados e aprovados; commit funcional `4b1b783`.
4. **ADMIN-B2A2-NETWORK-DIAG-PREP** — concluído; confirmou o defeito CSP/reCAPTCHA.
5. **ADMIN-B2A2-CSP-FIX-PREP, EXEC e PROD-VALIDATION** — concluídos, publicados e aprovados; commit funcional `e2c8249`.
6. **ADMIN-B2A2-FIRESTORE-TRANSPORT-PREP** — não necessário no estado atual; condicional ao reaparecimento de timeout com CSP válida.
7. **ADMIN-B2A3-PREP** — concluído e aprovado somente como análise de leitura; governança registrada no commit `01ee3a9e667679a79ac4310d49a3f0f6c163450a`.
8. **ADMIN-B2A3-EXEC** — concluído, auditado e validado localmente em 69/69; commit funcional `4f25d8b0385efa760ba21c77a5211293eb84ea0f` enviado para `origin/main`; sem publicação.
9. **ADMIN-B2A4-PREP** — concluído e aprovado somente por leitura, com parecer **A. pronto para ADMIN-B2A4-EXEC** e governança registrada no commit `f9067e332a078ace7f840fecbe6f457bda324d34`.
10. **ADMIN-B2A4-EXEC** — concluído e validado funcionalmente em 87/87; commit funcional `13245dcf6dcc2e5704ee3d019ed3c05233a057b3` enviado para `origin/main`; sem publicação.
11. **ADMIN-B2A5-PREP** — concluído somente por leitura; parecer original **B**; decisões humanas posteriores concluídas.
12. **ADMIN-B2A5-INVENTORY-PREP** — concluído somente por análise local; parecer **C** e progressão **C → B → A**.
13. **ADMIN-B2A5-INVENTORY-TOOL-PREP** — concluído somente por análise local; parecer **A** histórico.
14. **ADMIN-B2A5-INVENTORY-TOOL-ROOT-RECOVERY-AND-ISOLATION-PREP** — concluído; raiz recuperada e pacote isolado aprovado.
15. **ADMIN-B2A5-INVENTORY-TOOL-ISOLATION-PREP-GOVERNANCE** — concluído e versionado no commit `d6fe820fad692e64553961a1d8ea061429d41cfd`.
16. **ADMIN-B2A5-INVENTORY-TOOL-ISOLATED-EXEC** — concluído, validado localmente e publicado no Git no commit `1102741201d4858b55a7145570568856f6859573`.
17. **ADMIN-B2A5-INVENTORY-TOOL-ISOLATED-EXEC-GOVERNANCE** — atualização documental atual; revisão/commit/push separados.
18. **ADMIN-B2A5-INVENTORY-AUTH-PREP/EXEC** — não iniciados e dependentes de autorizações próprias.
19. **ADMIN-B2A5-INVENTORY-EXEC/GOVERNANCE** — não iniciados; somente após ferramenta e IAM aprovados.
20. **ADMIN-B2A5-MIGRATION-PREP/EXEC** — não iniciados; executar somente se o inventário comprovar necessidade e com autorizações próprias.
21. **ADMIN-B2A5-FIRESTORE-PREP/EXEC** — não iniciados e dependentes de autorizações próprias; nenhuma publicação.
22. **ADMIN-B2A5-RUNTIME-PREP/EXEC** — não iniciados e dependentes de autorizações próprias.
23. **ADMIN-B2B** — Storage separado; não iniciado e dependente de autorização própria.
24. **ADMIN-B3** — revisão final e única etapa autorizada a publicar Rules; não iniciado.
25. **ADMIN-C a ADMIN-J** — seguir o roadmap administrativo e suas autorizações.
26. **Site público e backlog anterior** — pausados, sem perda das pendências já registradas.
27. **CMS-5D / integração CMS → site público** — fora da frente atual.
28. **CMS-4E-EXEC** — não concluído; executar somente no momento previsto pelo ADMIN-G e com autorização própria.

---

## HISTÓRICO — Tarefas abertas anteriores — SUPERADAS PELO BACKLOG RECONCILIADO DE 30/08/2026

### [PAUSADA] Auditoria e melhoria do site público

**Contexto:** esta frente foi ativa após o CMS-5C e permanece preservada como histórico e backlog. Foi pausada oficialmente pelo checkpoint administrativo de 2026-07-20.
**Objetivo futuro:** auditar e melhorar o site público preservando rotas, SEO, responsividade, i18n, acessibilidade e funcionamento estático atual, somente após reabertura explícita.

**Blocos concluídos da auditoria pública pós-Claude Fable 5:**
- B1 — cache-busting público com token `?v=site-public-b1-20260708` padronizado em referências públicas de JS/CSS/dados e strings de carregadores dinâmicos. Nenhum Admin/CMS/Firebase tocado.
- B2 — higiene de `sitemap.xml`: removidos `/rotas-completas`, `/mapa-completo`, `/mapa-3d`, `/roteiro-ia`, `/local` genérico, bloco `hreflang` da home e namespace `xhtml` sem uso. Total final registrado: 11 URLs. Nenhum HTML/CSS/JS/Admin/CMS/Firebase tocado.
- B5 — diagnóstico Firebase público somente leitura: nenhum arquivo alterado; uso de Firebase compat diagnosticado em `mapa-turistico.html` e `eventos.html`; duplicação compat + modular diagnosticada em páginas com `public-banners.js`; Firebase confirmado como enriquecimento com fallback estático; recomendação de evitar B4 genérico e seguir por microblocos.
- B4a — timeout no mapa: alteração restrita a `js/mapa-turistico.js`, com timeout de 2,5s na leitura pública de eventos aprovados do Firestore; dados estáticos e empreendimentos preservados; nenhum HTML/CSS/dados/Admin/CMS/Firebase/rules tocado; bloco testado, commitado e enviado por push.
- SEO-F1 — follow-up de `noindex,follow` concluído nas páginas legadas/suspensas removidas do sitemap: `mapa-completo.html`, `mapa-3d.html` e `roteiro-ia.html`. As páginas seguem existindo para acesso direto. Nenhum `sitemap.xml`, `robots.txt`, CSS, JS, dado turístico, Admin/CMS/Firebase ou rule tocado.
- V1+V2 — visual/UX da home concluído, aprovado, commitado e enviado por push. V1 corrigiu o formulário de contato usando os seletores reais `.form-submit` e `#formStatus`, evitando TypeError por seletor inexistente. V2 melhorou CTAs e links editoriais da home para `/sabores` e `/onde-ficar`, ajustou chips relacionados a Gastronomia e Onde Ficar e adicionou a chave i18n `hospedagem-ver-todas` em `translations.js`. CSS, dados turísticos, Admin/CMS/Firebase e rules não foram tocados.
- V3 — navegação concluído, testado em produção, commitado e enviado por push. Ajustou paridade de navegação entre home e `nav-shared.js`; `index.html` e `js/nav-shared.js` foram os únicos arquivos alterados. Logo da home ajustada para `href="/"`; skip link corrigido para `#navLinks`; Planeje > Onde Ficar aponta para `/onde-ficar`; atalhos mobile Comer/Ficar apontam para `/sabores` e `/onde-ficar`; `nav-shared.js` recebeu `aria-controls`/`id` nos dropdowns Agenda e Planeje. Nenhum CSS, dado turístico, Admin/CMS/Firebase ou rule foi tocado. Teste em produção confirmou que o mapa carregou corretamente; erros anteriores eram de ambiente local/cache/service worker.
- V4A+V4B+V4C — limpeza de peso morto da home concluída, testada, commitada e enviada por push. `index.html` foi o único arquivo alterado nesses microblocos. V4A removeu a seção duplicada e oculta `#onde-ficar-placeholder` e o handler órfão de newsletter que referenciava seletores inexistentes, sem alterar a seção visível `#onde-ficar` nem o formulário de contato. V4B removeu a galeria oculta `#galeria`, preservando `galeria.html` e links para `/galeria`. V4C removeu o script órfão "Direto do Produtor", o modal do mini-mapa, funções relacionadas e telefones placeholder `99999-xxxx` do fonte público; `sabores.html` permaneceu intacto. Aproximadamente 404 linhas de peso morto foram removidas. Nenhum CSS, `translations.js`, dados turísticos reais, Admin/CMS/Firebase ou rules foi tocado.
- V5A — remoção do banner AgroSamas oculto concluída, validada, commitada e reenviada por push após instabilidade/cancelamento do GitHub Pages. `index.html` foi o único arquivo de código alterado no bloco: removidos a section/banner AgroSamas oculto e o script inline exclusivo (`ativarBannerAgrosamas`, `fecharBannerAgrosamas`, `localStorage agrosamas-banner-closed` e autoativação comentada), com aproximadamente 63 linhas removidas. O slot moderno `#public-banners-slot` foi preservado como caminho oficial para banners/campanhas via `js/public-banners.js`; `config.js` e `translations.js` foram preservados, mesmo com `CONFIG.agrosamas` temporariamente sem efeito na home e chaves `agrosamas-banner-*` órfãs. A data/hora da última atualização do site foi atualizada antes do commit real de publicação/reenvio do V5A (`chore: atualiza metadata para reenviar deploy do V5A`). O GitHub Pages build and deployment rodou novamente e concluiu com check verde. Acontece em breve, Festas em Destaque e Eventos & Notícias foram preservadas. Nenhum CSS, mídia, dado de evento, dado turístico real, menu/footer, Admin/CMS/Firebase ou rule foi tocado.
- V5B — priorização de eventos únicos/não recorrentes em "Acontece em breve" concluída, validada, enviada por push e publicada. Eventos recorrentes somente completam vagas quando há menos de quatro eventos únicos futuros. A seleção final permanece limitada a quatro cards, reordenada por data crescente e, em empate, mantém a prioridade para eventos vinculados a estabelecimento. O fallback estático e o merge com eventos aprovados do Firebase foram preservados; eventos do Firebase seguem mapeados como `recorrente: false`. `eventos-2026.json`, `js/data/eventos.js` e as demais fontes de dados permaneceram intactos. A data/hora do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit de código.
- V5C1 — links dos três cards de "Eventos & Notícias" corrigidos, validados, enviados por push e publicados. Polskie Smaki, Fanfarras municipais e Estruturação do turismo local agora apontam para matérias individuais reais do Portal oficial da Prefeitura, com `target="_blank"` e `rel="noopener noreferrer"`. O CTA geral "Ver todas as notícias" permanece em `/noticias`. Textos, imagens, datas, categorias, traduções, layout e CSS foram preservados. A data/hora do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit de código.
- V5C2+V5C2A — atualização editorial sincronizada concluída, validada, enviada por push e publicada. O primeiro card da home passou a exibir "Agosto é Polonês em São Mateus do Sul: confira a programação do 32º Mês Polonês", e a mesma matéria foi adicionada ao topo de `noticias.html`. No microajuste V5C2A, a matéria nova tornou-se `article.post-card.featured`, com título `h2` e selo "Destaque · Cultura e Gastronomia"; a notícia antiga do regulamento foi preservada como segundo card comum, com `h3` e categoria Cultura. Nenhuma notícia anterior foi removida; os cards 2 e 3 da home e o CTA geral `/noticias` permaneceram intactos. CSS, JavaScript, `translations.js`, `noticia.html`, `js/cms.js`, camada opcional do CMS, Admin/CMS/Firebase e rules foram preservados. A data/hora do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit funcional.
- R2 — extração do carrossel “Experiências em destaque” concluída, validada, commitada, enviada por push e publicada. `js/home-experiencias.js` foi criado como segundo módulo da Fase 1 e recebeu a extração comportamental 1:1 de aproximadamente 57 linhas de JavaScript inline de `index.html`, sem mudança visual ou funcional. A tag `script` com `defer` e `?v=site-public-b1-20260708` foi posicionada antes de `js/home-eventos.js`; `initFeaturedExperiencesCarousel` permaneceu privada em IIFE, com listener próprio de `DOMContentLoaded`, sem função em `window`, export, `import()`, `fetch`, URL relativa ou nova dependência. Seletores, botões, passo por largura real do card, gap, fallback, `scrollBy`, reduced motion, estado disabled, tolerância de 2px, setas, scroll passive, resize, inicialização, scroll/swipe nativo, responsividade, scroll-snap, tabindex, `aria-labels` traduzíveis e demais comportamentos foram preservados. A metadata foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`. R1 e `js/home-eventos.js` permaneceram intactos; acessibilidade/utilitários visuais continuam inline para R4.
- R3 — extração do formulário de contato concluída, validada, commitada, enviada por push e publicada. `js/home-contato.js` foi criado como terceiro módulo da Fase 1 e recebeu a extração comportamental 1:1 de aproximadamente 58 linhas de JavaScript inline de `index.html`, sem mudança funcional ou visual. A referência única usa `<script src="js/home-contato.js?v=site-public-b1-20260708" defer></script>` e foi posicionada antes de `js/home-experiencias.js` e `js/home-eventos.js`; a lógica permanece privada em IIFE, sem propriedade em `window`, export ou nova dependência. O endpoint `https://formspree.io/f/xpqykpqd`, o `FORMSPREE_ID` `xpqykpqd`, o POST, headers Accept/Content-Type, `event.preventDefault()`, `FormData`, `Object.fromEntries()`, `JSON.stringify()`, `response.ok`, loading, mensagens, classes `form-status success/error`, reset somente no sucesso, timeout de 6000 ms, console.error, validação nativa e retornos silenciosos foram preservados. R1 e R2 permaneceram intactos; markup, CSS, `translations.js` e `config.js` permaneceram intactos. A metadata foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`; o commit funcional é `9d9a8ef refactor(home): extrai formulario de contato para modulo dedicado`.

**R4B — utilitários visuais concluído, validado, commitado, enviado por push e publicado.** `js/home-utilitarios.js` foi criado como módulo dedicado para a extração comportamental 1:1 da barra de progresso de rolagem e do botão “Voltar ao topo”; aproximadamente 36 linhas inline foram removidas de `index.html`, sem mudança visual ou funcional. A referência usa `<script src="js/home-utilitarios.js?v=site-public-b1-20260708" defer></script>` no ponto anterior do bloco, depois do init do VLibras e antes do menu hamburger; IIFE, null-checks, listeners, cálculos, proteção contra divisão por zero, limiar de 300px, classe `visible` e rolagem suave foram preservados. R1, R2 e R3 permaneceram intactos; menu, i18n e acessibilidade eMAG permaneceram intactos. A metadata foi atualizada antes do commit funcional; o commit é `b272330 refactor(home): extrai utilitarios visuais para modulo dedicado`.

**Pendência externa do Formspree:** nenhum envio real foi executado durante a validação e nenhum envio real deve ocorrer enquanto o endereço institucional estiver `PENDING`. O Workflow atual continua temporariamente entregando para `imprensapmsms@gmail.com`. O endereço obrigatório `turismo@saomateusdosul.pr.gov.br` já foi adicionado em Linked Emails, mas depende de confirmação por outro setor e permanece `PENDING`. Após mudar para `VERIFIED`: abrir Forms > TURISMO > Workflow > Email; selecionar `turismo@saomateusdosul.pr.gov.br`; salvar mantendo a ação Enabled; realizar um único envio institucional controlado; confirmar o recebimento no novo endereço; e confirmar que o Gmail antigo deixou de receber. A troca ocorrerá somente no painel do Formspree, sem alteração de código, metadata, commit ou deploy.

**Próximos caminhos possíveis:**
- V4D — fallback inline de traduções absorvido e concluído pelo R5A; não permanece como pendência duplicada.
- V5C3 — avaliar extração do `style` inline dos CTAs para classe compartilhada; exige alteração de CSS, não executar automaticamente e pode ser incorporado futuramente a um bloco visual maior.
- Follow-up editorial de V5C2 — revisar o destaque do 32º Mês Polonês após 30/08/2026; aplicar a política de rotação mensal dos cards; remover ou substituir cards de eventos em até aproximadamente sete dias após o encerramento.
- Follow-up visual de V5C2 — a notícia nova e a antiga usam atualmente a mesma imagem; avaliar troca somente após conferência visual e em bloco separado.
- Follow-up arquitetural fora do V5C — avaliar fonte única de notícias para evitar manutenção duplicada entre home e `noticias.html`, por JSON, CMS ou outra solução futura; aguarda decisão arquitetural e possível retomada do CMS.
- V5D — revisão anti-envelhecimento de Festas em Destaque; risco médio; depende de mexer em `translations.js`, então só com decisão consciente.
- V6 — reordenação da metade inferior da home.
- V7-PREP — concluído em 2026-07-16; estratégia V7A→V7B→V7C1→V7C2 e cinco decisões humanas aprovadas.
- V7A — compatibilidade do nav-shared concluída, validada, commitada, enviada por push e publicada; commit funcional `4cd0616cb9d393571946f90c97a753eae16e69c3`, com 15 arquivos, 20 inserções e 14 remoções. O V7B foi concluído como próximo microbloco; V7C1 é o próximo passo e V7C2 permanece posterior, ambos ainda não iniciados.
- CSS órfão `.agrosamas-banner` pode ser revisado em bloco próprio.
- Chaves i18n órfãs `agrosamas-banner-*` podem ser revisadas futuramente, mas `translations.js` não deve ser alterado agora.
- `CONFIG.agrosamas` está temporariamente sem efeito na home após V5A.
- CSS órfão `.map-modal-*` pode ser revisado em bloco próprio, pois o modal do mini-mapa foi removido da home.
- Chaves i18n `modal-endereco`, `modal-telefone` e `modal-horario` podem ser revisadas futuramente, mas `translations.js` não deve ser alterado agora.
- Planejar a virada anual de `eventos-2026.json`.
- Avaliar futuramente a duplicação entre `eventos-2026.json` e `TURISMO_EVENTOS`.
- Alinhar futuramente `TURISMO_EVENTOS/js/data/eventos.js` para `Rua do Mathe`, pois a fonte ainda registra `Parque de Exposições`; executar somente em bloco exclusivo de dados, fora do `V7-PREP`.
- App Check/reCAPTCHA: a classificação anterior como somente ambiente/debug token foi superada; a incompatibilidade da CSP é defeito confirmado, com causa única do timeout ainda inconclusiva.
- Service Worker em localhost: investigar em follow-up separado se voltar a interceptar Leaflet/OSM, sem tratar como regressão do V3.
- Eventos aprovados com `establishmentName`, mas sem `establishmentId` seguro, não vinculam ao mapa; revisar dados do Firestore futuramente.
- B4b opcional: migrar Firebase compat de mapa/eventos para import modular sob demanda, somente com teste manual dedicado.
- B3 — mídia/performance fica por último, conforme decisão atual.
- Admin/CMS/Firebase é a frente ativa; esta lista pública permanece pausada.

**Escopo provável:** páginas públicas, navegação, conteúdo visível, acessibilidade, SEO público, performance e dados estáticos públicos, conforme tarefa aprovada.
**Fora de escopo:** Admin, CMS, Firebase, Firestore Rules, Storage Rules, dados reais do Firestore, seeds, deploys e integrações CMS.

**Critério de aceite:**
- Nenhuma alteração em Admin/CMS/Firebase sem autorização explícita.
- Site público segue funcional com dados estáticos.
- Nenhuma dependência nova de login ou Firestore nas páginas públicas principais.
- Mudanças pequenas, auditáveis e validadas com os comandos disponíveis.

### [ABERTA] Tarefa 4 — Fichas/páginas individuais de locais

**Contexto:** evoluir as fichas dinâmicas `local.html?id=...` alimentadas por `js/locais-data.js` (e pontos de `js/data/pontos-turisticos.js`).  
**Objetivo:** melhorar/expandir as páginas de detalhe de locais mantendo compatibilidade com o site estático e com o mapa.

**Escopo provável:** `local.html` e dados de locais já existentes.  
**Fora de escopo:** admin/Firebase, criação de novos negócios, invenção de dados (telefone/endereço/coordenada/horário/imagem).

**Critério de aceite:**
- Fichas continuam abrindo por `?id=` com fallback seguro quando o id não existe.
- Sem colapsar fichas diferentes numa única URL; canonical dinâmico correto.
- Sem quebrar filtros do mapa nem os cards de destaque da home.
- Sem inventar dados de negócios; pendências apenas documentadas.
- Acessibilidade, VLibras, seletor de idiomas, atalhos móveis e mascote preservados.

---

### [ABERTA / FOLLOW-UP FUTURO] Ícone PWA real `512x512`

**Contexto:** PWA sem ícone `512x512` pode degradar splash/instalação em Android, mas não quebra o site. As entradas falsas de `512x512` já foram removidas do `manifest.json` (ele hoje declara apenas o ícone real `192x192`).  
**Ação recomendada:** manter como pendência; criar/validar um ícone real `512x512` antes de reintroduzi-lo no manifest.

**Critério de aceite:**
- Pendência anotada e visível.
- Nenhum arquivo de imagem inventado sem autorização.
- Manifest nunca aponta para arquivo inexistente nem declara dimensão falsa.

---

### [ABERTA / FRENTE ATIVA] Admin / CMS / Firebase

**Contexto:** frente retomada oficialmente em 2026-07-20 pelo `ADMIN-RESTART-PREP`; o detalhamento atual está no início deste arquivo.

**Regra:** executar somente o bloco autorizado. `ADMIN-B2A5-PREP`, suas decisões humanas, `ADMIN-B2A5-INVENTORY-PREP`, `ADMIN-B2A5-INVENTORY-TOOL-PREP`, o ROOT-RECOVERY-AND-ISOLATION-PREP e o ISOLATED-TOOL-EXEC estão concluídos. A ferramenta isolada foi classificada como **A. VALIDADO LOCALMENTE** e publicada no Git no commit `1102741201d4858b55a7145570568856f6859573`. `ADMIN-B2A5-INVENTORY-AUTH-PREP` é o próximo bloco possível e permanece não iniciado; autenticação, inventário real, eventual migração, Firestore, runtime, `ADMIN-B2B` e `ADMIN-B3` não foram executados. A publicação continua bloqueada e exclusiva do `ADMIN-B3`.

### [HISTÓRICO — PARCIALMENTE SUPERADO] CMS-5D — Integração controlada do CMS no site público

**Contexto:** CMS-5C foi concluído, commitado, enviado por push e as Firestore Rules foram publicadas para permitir leitura pública mínima de `cms_establishments` apenas quando `status == "published"`.
**Status:** ainda não iniciado.

**Teste esperado em `/cms-public-debug.html`:**
- `Leitura concluida` se houver documentos `published`;
- `Sem published` se não houver documentos `published`;
- nunca deve aparecer `permission-denied` após as rules publicadas.

**Regra:** não ligar mapa, `local.html`, busca, sabores, onde-ficar, o-que-fazer ou home ao CMS até o CMS-5D ser explicitamente iniciado.

### [HISTÓRICO / PROVENANCE] CMS-4E-EXEC — Inventário remoto de mídias

**Contexto:** inventário remoto de mídias do CMS segue pendente.
**Status:** ainda não iniciado/concluído nesta pausa.

**Regra:** não alterar Storage Rules, arquivos remotos, mídias reais ou dados do CMS sem bloco específico e autorização explícita.

---

## Regra sobre artefatos de auditoria

- `docs/auditoria-output/*` e demais saídas geradas por scripts de auditoria **não devem ser commitadas a menos que explicitamente solicitado**.
- São ruidosas e regeneráveis; por padrão, reverter antes de qualquer commit:
  ```powershell
  git checkout -- docs/auditoria-output/
  ```
- Relatórios curados e escritos por humano (ex.: `docs/bloco-s14-auditoria-dados-turisticos-publicos.md`) podem ser commitados normalmente.

---

## Tarefas concluídas

### [CONCLUÍDA] Redesign de UX da home e polimento de navegação mobile
Aprovado em QA, commitado e enviado (push).

### [CONCLUÍDA] Carrossel de experiências em destaque
Aprovado em QA, commitado e enviado.

### [CONCLUÍDA] Polimento visual do mapa turístico
Aprovado em QA, commitado e enviado.

### [CONCLUÍDA] Polimento final de densidade/widget/menu mobile
Aprovado em QA, commitado e enviado (commit `61dc569`).

### [CONCLUÍDA] Otimização de performance/Lighthouse (passe inicial seguro)
Otimização segura de carregamento (imagens da home e do mapa), sem regressão visual. Aprovado em QA e commitado (commit `0e0c65a`).

### [CONCLUÍDA] Correção de regressão de layout do carrossel em destaque
Estabilização do layout de imagem do carrossel. Aprovado em QA e commitado (commit `87b6457`).

### [CONCLUÍDA] Passe de SEO/metadados sociais
`<title>`, meta description, canonical, Open Graph, Twitter/X, `manifest.json` e metadados dinâmicos de `local.html`. Remoção do `SearchAction` da home (site tem busca modal, sem URL estável de resultados). `rotas-completas.html` mantido `noindex,follow` (página legada). Aprovado em QA e commitado (commit `c34d53b`).

### [CONCLUÍDA] Auditoria de dados turísticos públicos (S14)
Auditoria das fontes de dados públicas + remoção do duplicado `rua-do-mathe` de `js/data/restaurantes.js` (já existia como ponto/ficha canônica com dados mais consistentes; o duplicado tinha telefone conflitante/placeholder). Relatório curado `docs/bloco-s14-auditoria-dados-turisticos-publicos.md` commitado. Aprovado em QA (commit `fe18133`).

### [CONCLUÍDA] CMS-5C — Leitura pública segura de published e debug isolado
CMS-5C concluído, commitado, enviado por push e Firestore Rules publicadas. A leitura pública de `cms_establishments` foi limitada a documentos `status == "published"` e a validação esperada ocorre em `/cms-public-debug.html`, sem integração com as páginas públicas principais.

### [CONCLUÍDA] ADMIN-B1-PREP — Validação Admin somente leitura
Login Admin manual e real, dashboard, logout e leituras de `usuarios`, `eventos_pendentes`, `eventos_aprovados` e `estabelecimentos_pendentes` confirmados sem escrita, alteração de Auth, publicação de Rules, upload ou aplicação de CORS. A divergência entre frontend somente `admin` e permissões limitadas de `moderator` nas Rules foi confirmada estaticamente.

### [CONCLUÍDA] ADMIN-B1B-PREP — Contrato remoto de Rules, CORS e App Check
Releases/rulesets implantados, CORS do bucket e App Check foram recuperados somente por GET/LIST, sem persistência de fontes remotas ou mudança de configuração. `firestore.rules` e `storage.rules` locais correspondem exatamente às versões implantadas; `storage-cors.json` corresponde ao CORS remoto. Riscos P0/P1 de leitura pública em `noticias`, `media_library` e `cms-media` foram confirmados.

### [CONCLUÍDA] ADMIN-B2A1-EXEC — Infraestrutura local e baseline das Firestore Rules
Infraestrutura local e isolada concluída, validada, commitada e enviada por push no commit `9ccc595d34edb106348936f23ce789329047280c`, presente em `origin/main`. O projeto demo obrigatório `demo-turismo-sms-rules-test` executou 44 testes em 5 suítes, todos aprovados. O baseline automatizou os riscos P0 de drafts públicos em `noticias`, P1 de leitura pública em `media_library`, o contrato atual de `ativo`, o comportamento de `moderator` e o fallback deny. Nenhuma Rule foi alterada ou publicada; correções permanecem reservadas a `ADMIN-B2A3`, `ADMIN-B2A4` e `ADMIN-B2A5`.

### [CONCLUÍDA] ADMIN-B2A3-PREP — Contrato de proteção de notícias
PREP concluído e aprovado somente como análise de leitura, com governança commitada em `01ee3a9e667679a79ac4310d49a3f0f6c163450a`. O contrato escolheu `publicado == true` booleano como único ramo público, preservou Admin e escrita sob `isAdmin()` e reservou a publicação ao `ADMIN-B3`.

### [CONCLUÍDA] ADMIN-B2A3-EXEC — Proteção local de drafts de notícias
Implementação local concluída em `firestore.rules` e `tests/firestore.rules.test.mjs`, com auditoria **A. implementação completa e compatível** e validação **A. validado funcionalmente**. O projeto demo `demo-turismo-sms-rules-test` executou 69 testes em 5 suítes, com 69 pass e zero falhas ou ignorados; coverage local HTTP 200. O commit funcional `4f25d8b0385efa760ba21c77a5211293eb84ea0f` foi enviado para `origin/main`. A Rule está versionada, mas não publicada; produção permanece inalterada até o `ADMIN-B3`.

### [CONCLUÍDA] ADMIN-B2A4-PREP — Contrato Admin-only de `media_library`
PREP concluído e aprovado exclusivamente como análise somente de leitura, com parecer **A. pronto para ADMIN-B2A4-EXEC** e governança registrada no commit `f9067e332a078ace7f840fecbe6f457bda324d34`. O contrato aprovado trocou somente a leitura de `media_library` para `isAdmin()`, preservou a escrita Admin-only, dispensou runtime e manteve `cms-media`/Storage reservado ao `ADMIN-B2B`.

### [CONCLUÍDA] ADMIN-B2A4-EXEC — Proteção local Admin-only de `media_library`
Implementação local concluída em `firestore.rules` e `tests/firestore.rules.test.mjs`, com classificação **A. VALIDADO FUNCIONALMENTE**. O projeto demo `demo-turismo-sms-rules-test` executou 87 testes em 5 suítes, com 87 pass, zero fail/skipped/cancelled/todo e coverage local HTTP 200. O commit funcional `13245dcf6dcc2e5704ee3d019ed3c05233a057b3` (`fix: restringir media_library a administradores`) foi enviado para `origin/main`, com `HEAD`, `main` e `origin/main` alinhados. A Rule está versionada, mas não publicada; produção permanece com o último ruleset publicado até o `ADMIN-B3`.

### [CONCLUÍDA] ADMIN-B2A5-PREP — Contratos de `ativo` e `moderator`
PREP concluído exclusivamente por leitura, com parecer original **B. Pronto com decisão humana pendente**, zero alteração funcional, acesso remoto, Emulator ou publicação. As decisões humanas posteriores definiram `ativo == true` fail-closed, desativação administrativa/equipe sem bloqueio automático do Portal e `moderator` sem função institucional ativa. O EXEC monolítico foi classificado como **C** e decomposto; naquele checkpoint, todos os blocos posteriores ainda dependiam de autorização própria.

### [CONCLUÍDA] ADMIN-B2A5-INVENTORY-TOOL-ROOT-RECOVERY-AND-ISOLATION-PREP
Baseline npm raiz recuperado e validado no commit-base `6b7923f2c551d7489ed3fbb960139f39e8e6ac67`, com Firestore e overrides ausentes da raiz. A instalação integrada foi abandonada após `ELSPROBLEMS` e falha do override restrito; o pacote independente `tools/admin-b2a5-inventory/` foi aprovado com quatro arquivos, dependency exata `@google-cloud/firestore@8.7.0`, lockfile próprio, padrão `npm --prefix`, 102 testes, 84 fixtures, regressão 87/87, zero escrita e rollback explícito. Parecer histórico **A. Pronto para ADMIN-B2A5-INVENTORY-TOOL-ISOLATED-EXEC**; o EXEC foi posteriormente concluído no commit `1102741`.

### [CONCLUÍDA] ADMIN-B2A5-INVENTORY-TOOL-ISOLATED-EXEC
Ferramenta isolada criada em quatro arquivos, validada localmente em 102/102, com 84 fixtures sintéticas, regressão das Rules em 87/87 e contrato estritamente read-only/sanitizado. Commit funcional `1102741201d4858b55a7145570568856f6859573` enviado para `origin/main`, com exatamente 3.535 inserções e alinhamento final `0 0`. Modo remoto, AUTH/IAM, inventário real, migração e publicação não foram executados. Próximo bloco possível: `ADMIN-B2A5-INVENTORY-AUTH-PREP`, não iniciado.

### [CONCLUÍDA] B1 — Cache-busting público pós-auditoria
Token `?v=site-public-b1-20260708` padronizado em referências públicas de JS/CSS/dados e strings de carregadores dinâmicos. Bloco commitado e enviado manualmente em 2026-07-08. Nenhum Admin/CMS/Firebase tocado.

### [CONCLUÍDA] B2 — Higiene de sitemap pós-auditoria
`sitemap.xml` higienizado em 2026-07-08, com remoção de páginas legadas/suspensas e `/local` genérico, remoção do bloco `hreflang` da home por idiomas client-side via `localStorage`, remoção do namespace `xhtml` sem uso e total final de 11 URLs. Bloco commitado e enviado manualmente. Nenhum HTML/CSS/JS/Admin/CMS/Firebase tocado.

### [CONCLUÍDA] B5 — Diagnóstico Firebase público
Diagnóstico somente leitura concluído em 2026-07-08. Nenhum arquivo alterado. Uso de Firebase compat diagnosticado em `mapa-turistico.html` e `eventos.html`; duplicação compat + modular diagnosticada em páginas com `public-banners.js`; Firebase confirmado como enriquecimento, com fallback estático preservado. Recomendado evitar B4 genérico e seguir por microblocos.

### [CONCLUÍDA] B4a — Timeout no mapa
Timeout de 2,5s adicionado na leitura pública de eventos aprovados do Firestore em `js/mapa-turistico.js`. Dados estáticos e empreendimentos preservados; nenhum HTML, CSS, dados, Admin/CMS/Firebase ou rules alterado. Bloco testado, commitado e enviado por push em 2026-07-08.

### [CONCLUÍDA] SEO-F1 — Noindex em páginas legadas/suspensas
`noindex,follow` adicionado em `mapa-completo.html`, `mapa-3d.html` e `roteiro-ia.html`, concluindo o follow-up das páginas legadas/suspensas já removidas do sitemap. As páginas continuam existindo para acesso direto; `sitemap.xml`, `robots.txt`, CSS, JS, dados turísticos, Admin/CMS/Firebase e rules não foram alterados. Bloco commitado e enviado por push em 2026-07-08.

### [CONCLUÍDA] V1+V2 — Ajustes visuais/UX da home
Bloco visual/UX concluído, aprovado, commitado e enviado por push. V1 corrigiu o formulário de contato da home para usar `.form-submit` e `#formStatus`, evitando quebra por TypeError de seletor inexistente. V2 melhorou CTAs e links editoriais da home para `/sabores` e `/onde-ficar`, ajustou chips/links relacionados a Gastronomia e Onde Ficar e adicionou a chave i18n `hospedagem-ver-todas` em `translations.js`. Nenhum CSS, dado turístico, Admin/CMS/Firebase ou rule foi alterado.

### [CONCLUÍDA] V3 — Paridade de navegação
Bloco de navegação concluído, testado em produção, commitado e enviado por push. Ajustou paridade entre home e `nav-shared.js`, com correções de logo, skip link, links de Onde Ficar, atalhos mobile Comer/Ficar e `aria-controls`/`id` nos dropdowns Agenda e Planeje. Apenas `index.html` e `js/nav-shared.js` foram alterados no bloco. Nenhum CSS, dado turístico, Admin/CMS/Firebase ou rule foi alterado.

### [CONCLUÍDA] V4A+V4B+V4C — Limpeza de peso morto da home
Microblocos concluídos, testados, commitados e enviados por push. V4A removeu de `index.html` a seção duplicada e oculta `#onde-ficar-placeholder` e o handler órfão de newsletter; V4B removeu a galeria oculta `#galeria`, preservando `galeria.html`; V4C removeu o script órfão "Direto do Produtor", o modal do mini-mapa, funções relacionadas e telefones placeholder `99999-xxxx` do fonte público. Aproximadamente 404 linhas foram removidas da home. `index.html` foi o único arquivo alterado nesses microblocos; nenhum CSS, `translations.js`, dados turísticos reais, Admin/CMS/Firebase ou rule foi alterado.

### [CONCLUÍDA] V5A — Remoção do banner AgroSamas oculto
Microbloco concluído, validado, commitado e reenviado por push após instabilidade/cancelamento do GitHub Pages. Removeu de `index.html` a section/banner AgroSamas oculto e o script inline exclusivo (`ativarBannerAgrosamas`, `fecharBannerAgrosamas`, `localStorage agrosamas-banner-closed` e autoativação comentada), com aproximadamente 63 linhas removidas. O slot moderno `#public-banners-slot`, `js/public-banners.js`, `config.js` e `translations.js` foram preservados. A data/hora da última atualização do site foi atualizada antes do commit real de publicação/reenvio do V5A, e o GitHub Pages build and deployment concluiu novamente com check verde. Nenhum CSS, mídia, dado de evento, dado turístico real, menu/footer, Admin/CMS/Firebase ou rule foi alterado.

### [CONCLUÍDA] V5B — Priorização de eventos únicos em "Acontece em breve"
Microbloco concluído, validado, enviado por push e publicado. A grade passou a priorizar eventos com `recorrente !== true`; eventos com `recorrente === true` somente completam vagas quando faltam eventos únicos futuros. A seleção continua limitada a quatro cards e, depois de formada, é ordenada por data crescente, preservando o desempate por vínculo a estabelecimento. O fallback estático e o merge com Firebase foram preservados; eventos aprovados do Firebase seguem mapeados como `recorrente: false`. `eventos-2026.json`, `js/data/eventos.js` e as demais fontes de dados permaneceram intactos. A data/hora da última atualização do site foi atualizada antes do commit de código.

### [CONCLUÍDA] V5C1 — Links reais em "Eventos & Notícias"
Microbloco concluído, validado, enviado por push e publicado. Os cards Polskie Smaki, Fanfarras municipais e Estruturação do turismo local agora apontam para matérias individuais reais do Portal oficial da Prefeitura e abrem em nova aba com `target="_blank"` e `rel="noopener noreferrer"`. O CTA geral "Ver todas as notícias" continua apontando para `/noticias`. Textos, imagens, datas, categorias, traduções, layout e CSS foram preservados; `noticias.html`, `noticia.html`, `js/cms.js`, `translations.js`, dados, Admin/CMS/Firebase e rules permaneceram intactos. A data/hora da última atualização do site foi atualizada antes do commit de código.

### [CONCLUÍDA] V5C2+V5C2A — Sincronização editorial entre home e notícias
V5C2 e o microajuste V5C2A foram concluídos, validados, enviados por push e publicados. O primeiro card da home passou a destacar a matéria do 32º Mês Polonês, com data de 06 de julho de 2026, categoria Cultura, período de 18 de julho a 30 de agosto de 2026 e link para a matéria oficial; a mesma notícia foi adicionada ao topo de `noticias.html`. A matéria nova recebeu o destaque principal, título `h2` e selo "Destaque · Cultura e Gastronomia"; a notícia antiga do regulamento permaneceu como segundo card comum, com título `h3` e categoria Cultura. Nenhuma notícia anterior foi removida. Os cards 2 e 3 da home, o CTA geral `/noticias`, CSS, JavaScript, `translations.js` e a camada opcional do CMS foram preservados. A data/hora da última atualização do site foi atualizada antes do commit funcional.

### [CONCLUÍDA] R1 — Extração da grade “Acontece em breve”
R1 da Fase 1 foi concluído, validado, commitado, enviado por push e publicado. A lógica foi extraída de `index.html` para `js/home-eventos.js` com comportamento 1:1; aproximadamente 183 linhas de JavaScript inline foram removidas da home. A referência externa usa `defer` e cache-busting, `carregarProximosEventos` permanece privada em IIFE com listener próprio de `DOMContentLoaded`, sem export ou função adicionada a `window`. `eventos-2026.json` continua fonte primária, Firebase permanece enriquecimento opcional, a regra V5B, fallback estático, merge, limite de quatro cards, ordenação e desempate foram preservados. O carrossel de experiências permaneceu inline e fora do módulo. A metadata do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit funcional; o script não foi executado nesta atualização de governança.

### [CONCLUÍDA] R2 — Extração do carrossel “Experiências em destaque”
R2 da Fase 1 foi concluído, validado, commitado, enviado por push e publicado. A lógica foi extraída de `index.html` para `js/home-experiencias.js` com comportamento 1:1; aproximadamente 57 linhas de JavaScript inline foram removidas da home. A tag externa usa `defer` e `?v=site-public-b1-20260708` e foi posicionada antes de `js/home-eventos.js`. `initFeaturedExperiencesCarousel` permanece privada em IIFE com listener próprio de `DOMContentLoaded`, sem export ou função adicionada a `window`; não foram introduzidos `import()`, `fetch`, URL relativa ou nova dependência. O passo por largura real do card, gap, fallback, `scrollBy`, reduced motion, controles disabled, tolerância de 2px, teclado, listeners, scroll/swipe nativo, responsividade, scroll-snap, tabindex e `aria-labels` traduzíveis foram preservados. Não houve mudança visual ou funcional; R1 e `js/home-eventos.js` permaneceram intactos, e acessibilidade/utilitários visuais continuam inline para R4. A metadata do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit funcional; o script não foi executado nesta atualização de governança.

### [CONCLUÍDA] R3 — Extração do formulário de contato
R3 da Fase 1 foi concluído, validado, commitado, enviado por push e publicado. A lógica foi extraída de `index.html` para `js/home-contato.js` com comportamento 1:1; aproximadamente 58 linhas de JavaScript inline foram removidas da home, sem mudança funcional ou visual. A referência única usa `<script src="js/home-contato.js?v=site-public-b1-20260708" defer></script>` e foi posicionada antes de `js/home-experiencias.js` e `js/home-eventos.js`; a lógica permanece privada em IIFE, sem propriedade em `window`, export ou nova dependência. O endpoint `https://formspree.io/f/xpqykpqd`, o `FORMSPREE_ID` `xpqykpqd`, o POST, headers, `FormData`, `Object.fromEntries()`, `JSON.stringify()`, `response.ok`, loading, mensagens, classes `form-status success/error`, reset somente no sucesso, timeout de 6000 ms, console.error, validação nativa e retornos silenciosos foram preservados. R1 e R2 permaneceram intactos; markup, CSS, `translations.js` e `config.js` permaneceram intactos. A metadata foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`; o commit funcional é `9d9a8ef refactor(home): extrai formulario de contato para modulo dedicado`.

**Pendência externa do Formspree:** nenhum envio real foi executado durante a validação e nenhum envio real deve ocorrer enquanto o endereço institucional estiver `PENDING`. O Workflow atual continua temporariamente entregando para `imprensapmsms@gmail.com`. O endereço obrigatório `turismo@saomateusdosul.pr.gov.br` já foi adicionado em Linked Emails, mas depende de confirmação por outro setor e permanece `PENDING`. Após mudar para `VERIFIED`: abrir Forms > TURISMO > Workflow > Email; selecionar `turismo@saomateusdosul.pr.gov.br`; salvar mantendo a ação Enabled; realizar um único envio institucional controlado; confirmar o recebimento no novo endereço; e confirmar que o Gmail antigo deixou de receber. A troca ocorrerá somente no painel do Formspree, sem alteração de código, metadata, commit ou deploy.

### [CONCLUÍDA] R4A — Extração da acessibilidade eMAG
R4A da Fase 1 foi concluído, validado, commitado, enviado por push e publicado. `js/home-acessibilidade.js` foi criado como módulo dedicado para a extração comportamental 1:1 do controle de tamanho da fonte, alto contraste, restauração das preferências via `localStorage`, `prefers-reduced-motion` nos vídeos e atalhos Alt+1..4; aproximadamente 97 linhas de JavaScript inline foram removidas de `index.html`, sem mudança visual ou funcional. O commit funcional confirmado no histórico é `db1b3cb refactor(home): extrai acessibilidade eMAG para modulo dedicado`. `window.changeFontSize` e `window.toggleContrast` foram preservadas explicitamente para os atributos `onclick`; `currentFontSize` permaneceu privado. O contrato `sms-font-size`/`sms-high-contrast`, fonte, contraste, reduced motion, vídeo, atalhos, markup e CSS foram preservados. R1, R2, R3 e R4B permaneceram intactos; GitHub Pages foi publicado e validado na validação funcional anterior ao registro. R4A e R4B permanecem módulos separados por responsabilidade.

### [CONCLUÍDA] R5A — Remoção do fallback inline obsoleto de traduções
R5A foi concluído, validado, commitado, enviado por push e publicado com sucesso. O commit funcional confirmado no histórico e presente em `origin/main` é `55615cd0d0c25db647d9ed0d04decca8e0ea7eb9 refactor(home): remove dicionario fallback inline obsoleto de traducoes`. O dicionário fallback parcial pt/en/es/pl foi removido de `index.html`, com aproximadamente 174 linhas eliminadas, preservando a declaração final `var translations = window.translations || {};`. `translations.js` permaneceu intacto, com cobertura completa das chaves da home nos quatro idiomas. O runtime inline do seletor permaneceu intacto, incluindo `sms-lang`, `window.applyTranslations` e `translationsApplied`; PT/EN/ES/PL, ciclo completo, bandeira/sigla, aria-label/title, placeholders, aria-labels do carrossel, reações ao evento, `document.documentElement.lang` e persistência após reload foram validados. R1, R2, R3, R4A e R4B permaneceram intactos. A metadata foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`; nenhum módulo novo foi criado. V4D foi absorvido e concluído pelo R5A.

### [CONCLUÍDA] R5B — Externalização do runtime i18n do seletor de idiomas
R5B foi concluído, validado, commitado, enviado por push e publicado. O commit funcional confirmado no Git e presente em `origin/main` é `21564847d5b74697affcbfd68ba99c6fcbdb0340 refactor(home): extrai runtime i18n do seletor de idiomas para modulo dedicado`. `git show --stat` confirmou somente `index.html`, `js/home-i18n.js` e `js/site-meta.js`, com `170 insertions(+)` e `165 deletions(-)`. O runtime inline foi removido de `index.html` e criado como `js/home-i18n.js`; a tag `<script src="js/home-i18n.js?v=site-public-b1-20260708"></script>` foi inserida na posição anterior, sem `defer`, `async` ou `type="module"`, depois do menu hamburger e antes de `js/home-acessibilidade.js`, `js/home-contato.js`, `js/home-experiencias.js` e `js/home-eventos.js`. A ordem síncrona de `translations.js` seguida do runtime da home foi preservada, incluindo o comportamento histórico do primeiro acesso sem `sms-lang` terminar em PT, com `🇧🇷 PT` e `document.documentElement.lang` em `pt-BR`. `translations.js` permaneceu intacto; `sms-lang`, `window.translations`, `window.applyTranslations` e `translationsApplied` foram preservados. PT/EN/ES/PL, ciclo de idiomas, bandeira/sigla, atributos do seletor, placeholders, aria-labels, conteúdo dinâmico, persistência após reload, busca, clima, tema sazonal, mascote e fechamento do menu mobile foram validados. A atualização de `js/site-meta.js` ocorreu antes do commit funcional com `node scripts/update-site-meta.mjs`; nenhuma alteração de runtime foi feita nesta atualização de governança.

### [CONCLUÍDA] V7B — Cutover atômico da navegação da home
V7B concluído, corrigido, validado, commitado, enviado por push e publicado. O commit funcional é `e80794418524e521ebbaaab85f76d101ffae5717 feat(home): adota nav-shared como navegacao unica da home (V7B)`, presente em `origin/main`, com somente `index.html`, `css/index.css` e `js/site-meta.js`, em `4 insertions(+)` e `409 deletions(-)`. O cutover tornou `js/nav-shared.js` a navegação única, removeu o chrome estático duplicado, alinhou o breakpoint a 968px, preservou `js/home-acessibilidade.js` e manteve R1/R2/R3. `js/home-i18n.js` e `js/home-utilitarios.js` não carregam, mas permanecem no disco até o V7C1. O primeiro acesso respeita o idioma do navegador, a área restrita é dinâmica, busca/utilitários foram unificados e o VLibras foi consolidado em uma única instância funcional. A metadata registra `2026-07-17T10:14:49-03:00`; o registro duplicado do Service Worker permanece temporário para o V7C1.

### Encerramento oficial da Fase 1
R1, R2, R3, R4B, R4A, R5A e R5B estão concluídos. A Fase 1 foi encerrada sem reescrever a home do zero; a estratégia de refatoração modular progressiva no projeto atual foi preservada, a dívida de JavaScript inline foi significativamente reduzida e cada responsabilidade foi separada em módulo próprio. Nenhuma etapa da Fase 2 foi iniciada. O próximo passo registrado é somente um checkpoint/decisão pós-Fase 1; não iniciar automaticamente V6, V7 ou B3. `js/home-i18n.js` poderá ser aposentado ou absorvido futuramente no V7. O follow-up das duas opções `.lang-option.active` após reload permanece reservado para V7.

**Limite de validação:** o bloqueio direto de `translations.js` não foi possível no ambiente; a degradação foi validada por simulação equivalente, com retorno silencioso, markup original em PT, sem tela vazia e sem TypeError.

**Pendências preservadas:** a frente pública está pausada; V6, V7C1, V7C2 e B3 permanecem pendentes; V5C3 e V5D continuam pendentes; CSS órfão `.map-modal-*` e `.agrosamas-banner` permanece como frente paralela; chaves i18n órfãs e `CONFIG.agrosamas` temporariamente sem efeito na home permanecem documentados; a revisão editorial do destaque do 32º Mês Polonês após 30/08/2026 permanece pendente; a possível duplicação futura entre `eventos-2026.json` e `TURISMO_EVENTOS` e a virada anual de `eventos-2026.json` permanecem pendentes; a pendência externa do Formspree permanece com endpoint `xpqykpqd`, Workflow em `imprensapmsms@gmail.com`, `turismo@saomateusdosul.pr.gov.br` em `PENDING` e sem envio real antes de `VERIFIED`. Admin/CMS/Firebase é a frente ativa; `ADMIN-B2A3-PREP`, `ADMIN-B2A3-EXEC`, `ADMIN-B2A4-PREP` e `ADMIN-B2A4-EXEC` estão concluídos. `ADMIN-B2A5` é o próximo bloco possível, permanece não iniciado e exige PREP e autorização humana próprios.

---

## Arquivos/páginas que não devem ser mexidos sem autorização

- `mapa-completo.html`
- `mapa-3d.html`
- `roteiro-ia.html`

Motivo: existem, mas foram classificados como legado/futuro/suspenso.

---

## Páginas antigas que não existem

Não tentar editar/recriar sem autorização (nomes de arquivo legados, sem arquivo real no projeto):

- gastronomia.html
- rotas.html
- cultura.html

Equivalentes identificados:

- `sabores.html`
- `rotas-completas.html`
- filtros do mapa
- conteúdo cultural distribuído em outras páginas

---

## Checklist antes de qualquer alteração

- [ ] Li `CLAUDE.md`.
- [ ] Li este `TASKS.md`.
- [ ] Conferi `CHANGELOG_AI.md`.
- [ ] Entendi o escopo.
- [ ] Listei arquivos que serão analisados.
- [ ] Listei arquivos que serão alterados.
- [ ] Avisei riscos antes de editar.
- [ ] Não vou fazer commit/deploy sem autorização.

---

## Checklist antes de commit

- [ ] `git status` revisado.
- [ ] `git diff --stat` revisado.
- [ ] `git diff` revisado.
- [ ] Apenas arquivos esperados foram alterados.
- [ ] Nenhum artefato de auditoria (`docs/auditoria-output/*`) entrou sem autorização.
- [ ] Nenhum layout/CSS foi alterado em tarefa de SEO/dados.
- [ ] Nenhum arquivo legado foi mexido sem autorização.
- [ ] Usuário autorizou commit.

---

## HISTÓRICO — Rotas V1.1 — publicação editorial Firestore comprovada — SUPERADO PELO CHECKPOINT DE 30/08/2026

> Este checkpoint preserva a fotografia intermediária da publicação. `knownIssueCmsEstablishmentsFullSave=true`, `publicAdapterReleased=false`, `publicAdapterCutover=false` e `NEXT_PHASE=ROTAS_V1.1_PUBLIC_ADAPTER_CUTOVER` foram superados por trabalhos posteriores e não integram o backlog vigente.

- `publicationClassification=A`
- `publicationMethod=ONE_SHOT_SERVER_SIDE_MANIFEST_CONTROLLED`
- `publicationManifestFileSha256=1ff5de417ae22d9d165f5be4bf7a3cf2c3811836f6dc9f4528cc3c29694a1979`
- `publicationPlanSha256=db5bea69c0cb711b9a0ddd38b896a763b3dc03c0b149016d1314f2d79f7271d1`
- `publicationWriteTemplateSha256=93cc3cb62cb488ce8a143b98c59dd6bb5293c8c3f660300a7b6688ac71564e23`
- `routesPublished=6`
- `cmsEstablishmentsPublished=67`
- `totalPublicationWrites=73`
- `publicationCommitTime=2026-08-25T14:34:23.798594Z`
- `productionPublishedRoutes=6`
- `productionPublishedEstablishments=67`
- `routesPublicQueryState=SUCCESS`
- `establishmentsPublicQueryState=SUCCESS`
- `humanApprovedRelationshipNormalizations=2`
- `mediaMismatchCount=0`
- `unapprovedPublicProjectionMismatchCount=0`
- `knownIssueCmsEstablishmentsFullSave=true`
- `knownIssueFixApplied=false`
- `orphanStorageObjectPossible=true`
- `storageCleanupDeferred=true`
- `publicAdapterImplemented=true`
- `publicAdapterReleased=false`
- `publicAdapterCutover=false`
- `FirestoreWritesThisBlock=73`
- `FirestoreCreatesThisBlock=0`
- `FirestoreUpdatesThisBlock=73`
- `FirestoreDeletesThisBlock=0`
- `StorageWritesThisBlock=0`
- `StorageDeletesThisBlock=0`
- `writeRoleBindingAbsent=true`
- `writeRoleDeleted=true`
- `readBindingAbsent=true`
- `tokenCreatorBindingAbsent=true`
- `serviceAccountDisabled=true`
- `userManagedKeys=0`
- `adcAbsent=true`
- `authFinalZero=true`
- `NEXT_PHASE=ROTAS_V1.1_PUBLIC_ADAPTER_CUTOVER`

---

## CMS Establishments Save Contract V2 — prova final de produção

- `classification=A — CMS ESTABLISHMENTS SAVE CONTRACT V2 PRODUCTION WRITE SMOKE PROVEN`
- `productionHead=a52bd92a9b20aefd302459f9cd5635e03d61c9d1`
- `adminWriteTransport=PRODUCTION_ADMIN_WEB_FIREBASE_COMPAT_WEB_SDK_PRODUCTION_RULES`
- `humanApprovalReceived=true`
- `smokeDocumentIdSanitized=cms-v2-smoke-<timestamp>-************`
- `createCompleted=true`
- `expectedCreateWrites=14`
- `revisionAfterCreate=13`
- `validatedMarkerCountAfterCreate=13`
- `allExpectedMarkersValid=true`
- `publicDraftVisible=false`
- `publishedEstablishmentsCountPreserved=67`
- `publishedRoutesCountPreserved=6`
- `updateCompleted=true`
- `updateGroup=content`
- `revisionAfterUpdate=14`
- `exactlyOneSemanticGroupChanged=true`
- `deleteCompleted=true`
- `documentExistsFinal=false`
- `committedFirestoreWrites=16`
- `hardWriteCapExceeded=false`
- `manualRetryUsed=false`
- `uploadCalls=0`
- `StorageWrites=0`
- `StorageDeletes=0`
- `existingProductionDocumentsModified=0`
- `publishedDocumentsCreated=0`
- `firestoreRulesV2Deployed=true`
- `adminV2Deployed=true`
- `productionWriteSmokeProven=true`
- `CMS_ESTABLISHMENTS_SAVE_CONTRACT_V2_ROLLOUT_COMPLETE=true`

### Resolução operacional registrada

O problema operacional anteriormente registrado para o full-save de Empreendimentos, causado por `FIRESTORE_RULE_EXPRESSION_LIMIT_1000`, foi resolvido para o fluxo atual do Admin pela arquitetura Save Contract V2 / C1. O limite de 1.000 expressões continua existindo na plataforma; o fluxo atual não depende mais do full-save problemático e foi comprovado em produção.

### Limites deste checkpoint documental

- `FirestoreReads=0`
- `FirestoreWrites=0`
- `StorageReads=0`
- `StorageWritesThisCheckpoint=0`
- `RulesDeploys=0`
- `HostingDeploys=0`
- `mainPushes=0`
- `functionalSourceFilesModified=0`
- `NEXT_PHASE=NONE_AUTOMATIC`

---

## Storage e segurança referencial de mídia — checkpoint de produção

- `classification=A — STORAGE AND MEDIA REFERENCE SAFETY DEPLOYED AND READONLY SMOKE PROVEN`
- `productionFunctionalHead=1c8ce12b7b071626cc76fcd3208e34aee196a7e2`
- `cms07Resolved=true`
- `cmsLibraryPhysicalDeleteRemoved=true`
- `logicalUnlinkPreserved=true`
- `activeClientPhysicalDeletePathsRemaining=0`
- `cms08Resolved=true`
- `submissionCreatePreserved=true`
- `submissionUpdateDenied=true`
- `submissionDeleteDenied=true`
- `portalDestructiveCleanupRemoved=true`
- `cmsMediaCreatePreserved=true`
- `cmsMediaReadPreserved=true`
- `cmsMediaUpdateDenied=true`
- `cmsMediaDeleteDenied=true`
- `storageCreateOnlyPreserved=true`
- `ambiguousRetrySafe=true`
- `metadataReconciliationSufficient=true`
- `samePathPreserved=true`
- `pathRotationIntroduced=false`
- `secondPutAfterMatchingReconciliation=false`
- `c1ContractChanged=false`
- `c1InvariantsPreserved=true`

### Validação e publicação registradas

- `preDeployFocusedTests=11/11 PASS`
- `preDeployFullTests=458/458 PASS`
- `failures=0`
- `cancelled=0`
- `unexpectedSkips=0`
- `expressionLimitDetected=false`
- `storageRulesDeployed=true`
- `storageRulesDeployScope=storage-only`
- `firestoreDeployed=false`
- `hostingDeployedByFirebase=false`
- `otherFirebaseServicesDeployed=false`
- `mainFastForwardOnly=true`
- `pagesHeadMatched=true`
- `productionRuntimeAssetsMatched=true`
- `adminReadonlySmoke=true`
- `portalReadonlySmoke=true`
- `publicHttpSmoke=true`
- `unexpectedPermissionDenied=0`
- `consoleErrorsDetected=0`

### Contabilidade e política técnica atual

- `FirestoreWrites=0`
- `StorageObjectWrites=0`
- `StorageObjectDeletes=0`
- `FirebaseAuthMutations=0`
- `STORAGE_AND_MEDIA_REFERENCE_SAFETY_ROLLOUT_COMPLETE=true`

Objetos em `submissions` são tecnicamente tratados como create-only pelo cliente e pelas Rules atuais. O physical cleanup não é mais uma operação casual do navegador: qualquer limpeza física futura exige fluxo de manutenção controlado e autorização separada. Inventário e cleanup de órfãos continuam sendo uma tarefa distinta; este checkpoint não afirma que todos os objetos atualmente existentes no bucket foram auditados.

### Limites deste checkpoint documental

- `FirestoreOperationalReadsByAgent=0`
- `FirestoreWritesThisCheckpoint=0`
- `StorageOperationalReadsByAgent=0`
- `StorageWritesThisCheckpoint=0`
- `StorageDeletesThisCheckpoint=0`
- `RulesDeploys=0`
- `FirebaseAuthMutationsThisCheckpoint=0`
- `functionalSourceFilesModified=0`
- `NEXT_PHASE=NONE_AUTOMATIC`

---

## PWA-03 — fallback offline de navegação — resolvido em produção

- `classification=A — PWA OFFLINE FALLBACK DEPLOYED AND PROVEN IN PRODUCTION`
- `productionFunctionalHead=dbdc6364f07fd5377a8d3400cd606490ed80ade1`
- `PWA03Resolved=true`
- `PWA_OFFLINE_FALLBACK_ROLLOUT_COMPLETE=true`

### Causa raiz e contrato final

- `rootCause=NAVIGATION_NOT_INTERCEPTED`
- Navegações públicas não eram interceptadas pelo Service Worker: o fluxo retornava antes de `event.respondWith()`, deixando `offline.html` existente, porém inalcançável em falhas de navegação.
- `navigationHandlerCoversNavigate=true`
- `navigationStrategy=NETWORK_FIRST`
- `publicVisitedPageAvailableOffline=true`
- `publicUnvisitedPageReturnsFallback=true`
- `offlineFallbackPrecached=true`
- `offlineFallbackSelfContained=true`
- `queryStringBehavior=PASS_IGNORE_SEARCH_DOCUMENT_ONLY`
- `privatePagesServedFromPublicCache=false`
- `authenticatedPagesCached=false`
- `firebaseApiResponsesCached=false`
- `storageGoogleApisExcluded=true`
- `firebasestorageAppBucketsExcluded=true`
- `responseCloneSemanticsCorrect=true`
- `publicNavigationRespondWithSynchronous=true`
- `backgroundCacheWorkAttachedToEvent=true`
- `backgroundCacheRejectionsHandled=true`
- `noUnhandledFetchRejections=true`
- `missingOfflineFallbackReturnsControlled503=true`

### Ciclo de cache

- `oldCacheVersion=turismo-sms-v21`
- `newCacheVersion=turismo-sms-v22`
- `oldCacheCleanupScoped=true`
- `currentCacheNeverDeleted=true`
- `immediateActivationCompatibility=SAFE`
- `productionUpgradeFromV21DirectlyObserved=false`
- Upgrade e limpeza de cache foram comprovados localmente no candidato idêntico; produção comprovou o worker v22 ativo e controlando, com `turismo-sms-v22` presente.

### Revisão e evidências

- `sourceReviewR1=REJECTED_WITH_CONCRETE_FINDINGS`: foram corrigidas a exclusão incompleta de hosts Storage/Firebase, a detecção insuficiente de mutants obrigatórios pelo harness e as Promises de cache em background sem lifecycle/rejection handling adequado.
- `sourceReviewR2=APPROVED`
- `blockingFindingsFinal=0`
- `focusedTests=24/24 PASS`
- `failures=0`
- `cancelled=0`
- `unexpectedSkips=0`
- `mutationDetection=6/6`
- `localBrowserProof=PASS_UNDER_DENY_EXTERNAL_BEFORE_NETWORK_ALLOW_LOCALHOST`
- `FirebaseProductionRequestsAllowedDuringLocalProof=0`

### Prova de produção

- `mainFastForwardOnly=true`
- `mainProductionHead=dbdc6364f07fd5377a8d3400cd606490ed80ade1`
- `pagesDeployObserved=true`
- `pagesStatus=built`
- `pagesHeadMatched=true`
- `canonicalSwBlobOid=fb2296870fc25e23d1d441570a852d763365dedf`
- `productionSwAssetMatched=true`
- `registrationActive=true`
- `serviceWorkerControllerPresent=true`
- `activeCacheV22=true`
- `publicVisitedPageAvailableOffline=true`
- `publicUnvisitedPageReturnsFallback=true`
- `offlineFallbackSelfContained=true`
- `queryStringBehavior=PASS_IGNORE_SEARCH_DOCUMENT_ONLY`
- `privatePagesServedFromPublicCache=false`
- `networkFirstRestored=true`
- `unexpectedPwaErrors=0`
- `publicHttpSmoke=8/8 PASS`

### Lição de isolamento e contabilidade de produção

`localBrowserSmokeFirebaseLesson`: localhost não implica Firebase Emulator; quando zero acesso backend é um gate, o smoke browser deve conectar explicitamente aos Emulators ou usar isolamento de rede comprovado antes da primeira navegação.

- `FirestoreOperationalReadsByAgent=0`
- `FirestoreRuntimeReadsDuringSmoke=BLOCKED_BY_ISOLATION`
- `FirestoreWrites=0`
- `StorageOperationalReadsByAgent=0`
- `StorageRuntimeReadsDuringSmoke=NOT_COUNTED_NO_STORAGE_REQUEST_OBSERVED`
- `StorageWrites=0`
- `StorageDeletes=0`
- `FirebaseAuthMutations=0`
- `FirebaseDeploys=0`
- `RulesDeploys=0`

### Observações e limites deste checkpoint documental

- `sw.js` permanece com EOL misto e o housekeeping foi deliberadamente diferido.
- A observação ambiental do commit-graph não afetou os objetos relevantes.
- Essas observações não bloqueiam PWA-03.
- Todos os demais findings e itens de backlog permanecem inalterados.
- `functionalSourceFilesModified=0`
- `NEXT_PHASE=NONE_AUTOMATIC`
