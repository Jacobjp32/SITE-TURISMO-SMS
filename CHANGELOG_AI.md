# CHANGELOG_AI.md — SITE-TURISMO-SMS

Registro de alterações feitas com apoio de IA no projeto.

Use este arquivo para manter continuidade entre sessões do Claude, Claude Code, Codex e ChatGPT.

---

## 2026-08-04 — ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-LOGIN-PREP

**Ferramenta/modelo:** Claude Opus 5 (Claude Code)

**Status:** `ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-LOGIN-PREP` **concluído** com parecer **B. PRONTO COM DECISÃO HUMANA PENDENTE**. Bloco exclusivamente de pesquisa em documentação oficial do Google Cloud, análise de segurança, verificação local somente leitura e atualização documental, a partir do commit-base `2278f79f14f07235badd55b577e393d85ec7e72c` (`docs: registrar reparo do isolamento da CLI do ADMIN-B2A5`). **Nenhum `gcloud` foi executado nesta sessão.** Não houve login, navegador OAuth, autenticação, access token, refresh token, ADC, acesso a Google Cloud/Firebase, custom role, conta de serviço, binding, policy, API habilitada, inventário, alteração funcional, staging, commit ou push.

### Pesquisa oficial consultada

Somente documentação oficial do Google Cloud, sem blogs, fóruns ou tutoriais de terceiros. Consultadas em 2026-08-04: referência de `gcloud auth login`; referência de `gcloud auth revoke`; referência de `gcloud auth list`; referência de `gcloud config list`; referência de `gcloud config configurations list`; guia de configurações do gcloud CLI; guia de autorização do gcloud CLI; guia de Application Default Credentials; e guia de fornecimento de credenciais ao ADC.

### Comportamento oficial confirmado do login

- `gcloud auth login` "Obtains access credentials for your user account via a web-based authorization flow" e "When this command completes successfully, it sets the active account in the current configuration to the account specified".
- Argumento `ACCOUNT`: "When the account specified has valid credentials in the local credential store these credentials will be re-used, otherwise a new credential will be fetched". Havendo credenciais válidas, "the account is set to active without rerunning the flow"; inexistindo configuração, é criada uma chamada `default`.
- `--activate` é "Enabled by default"; `--brief` é "Minimal user output".
- Consequência contratual: como o baseline pré-login exige zero contas credentialed, o caminho de reutilização silenciosa não pode ocorrer. Login sem abertura de navegador com baseline zero é **anomalia**, não sucesso — e `--force` fica proibido justamente por mascarar essa anomalia.
- A criação/atualização da configuração `default` **dentro do diretório isolado** é esperada e não é falha; o diretório já contém `configurations/config_default` vazio e `active_config` criados pelo próprio SDK no reparo. Somente configuração **adicional** inesperada produz `unexpectedConfigurationDetected`.

### Decisões registradas

- **Comando único:** `auth login OPERATOR_IN_MEMORY --brief`, por caminho absoluto de `gcloud.cmd`, sob `CLOUDSDK_CONFIG` isolado somente no processo.
- **Flags proibidas, com razão:** `--no-activate` (a ativação é o padrão e é necessária); `--update-adc`, que "Write[s] the obtained credentials to the well-known location for Application Default Credentials (ADC)"; `--force`; `--cred-file`, que é caminho de external account ou chave JSON de service account; `--enable-gdrive-access`; `--login-config` (workforce identity federation); `--no-browser` e `--no-launch-browser`; `--impersonate-service-account`; `--access-token-file`; `--project`; `--billing-project`. Também `gcloud init` e qualquer `gcloud config set`.
- **Fallback sem navegador proibido sem autorização separada:** `--no-browser` exige "a different, trusted device that has both a web browser and the gcloud CLI version 372.0.0 or later installed"; `--no-launch-browser` depende de copiar URL e colar código obtido em outro dispositivo. Falha do navegador produz `oauthBrowserUnavailable` e para.
- **Operador humano só em memória:** e-mail exato mais a autorização literal `AUTORIZO O ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-LOGIN-EXEC`, nunca em documento, script, Git, relatório ou log; representado só por hash e booleanos. Normalização limitada a trim externo e comparação case-insensitive. Proibido aceitar service account, `iam.gserviceaccount.com`, workload/workforce identity, arquivo de credencial ou chave JSON.
- **Dois wrappers separados:** `Invoke-IsolatedLocalGcloud`, com prompts desativados, output só em memória e allowlist fechada — `info`, `auth list`, `config list`, `config configurations list` e `version`; e `Invoke-IsolatedHumanLogin`, permitido **uma única vez** e só para o login, com navegador padrão, zero automação de browser, zero captura de senha ou MFA, zero fallback e zero repetição automática. Nenhuma chamada `gcloud` fora dos dois wrappers.
- **Exceção controlada de prompts:** o login é interativo por natureza; remover temporariamente **apenas** o `CLOUDSDK_CORE_DISABLE_PROMPTS` criado pelo próprio bloco, executar só o login e restaurá-lo em seguida. Nunca remover variável preexistente do usuário.
- **Fluxo do navegador sob controle humano:** avisar antes, iniciar uma única vez, devolver o controle ao humano e aguardar. Proibido interagir com janela, seletor de conta, senha, MFA, consentimento, códigos ou cookies; proibido screenshot, registro de URL OAuth ou de códigos; proibido segundo fluxo automático.
- **ADC estritamente separado:** ordem oficial `GOOGLE_APPLICATION_CREDENTIALS` → arquivo de `gcloud auth application-default login` → conta de serviço via metadata server; no Windows, `%APPDATA%\gcloud\application_default_credentials.json`; "The credentials you provide to ADC by using the gcloud CLI are distinct from your gcloud credentials" e "The gcloud CLI itself doesn't use ADC to access Google Cloud resources". Verificar só existência, nunca conteúdo.
- **Rollback por revogação real:** `gcloud auth revoke CONTA_EM_MEMÓRIA --quiet` sob o mesmo `CLOUDSDK_CONFIG`. Para contas de usuário, "This command revokes the user account token on the server. If the revocation is successful, or if the token has already been revoked, this command removes the credential from the local machine" — portanto atinge servidor **e** máquina local, e não depende de excluir o diretório. `--all` só com baseline zero comprovado e origem integralmente atribuída ao bloco; caso contrário, parar e escalar.

### Verificação local somente leitura

- Instalação preservada, com `gcloud.cmd` presente no diretório isolado de instalação.
- `%APPDATA%\gcloud` **ausente**; ADC **ausente**; `CLOUDSDK_CONFIG` e `GOOGLE_APPLICATION_CREDENTIALS` ausentes em processo e em escopo de usuário.
- Diretório isolado existente, sem reparse point, com proprietário esperado e contendo apenas cinco arquivos de metadata do SDK — `.last_survey_prompt.yaml`, `active_config`, `gce`, `configurations/config_default` vazio e um log de `2026-08-04` — e **zero** artefatos de credencial (`credentials.db`, `access_tokens.db`, `legacy_credentials`, `application_default_credentials.json`).
- Essa leitura sustenta a expectativa do baseline, mas **não substitui** a reverificação obrigatória imediatamente antes do login no EXEC.

### Riscos residuais

- **Persistência da credencial.** A documentação oficial adverte: "Any user with access to your file system can use the stored access credentials created by `gcloud auth login`". A credencial é refresh token de conta humana, utilizável sem nova senha e sem novo MFA, e o operador detém no contrato do `PROVISION-PREP` permissões de mutação IAM, incluindo `iam.roles.create` e `iam.serviceAccounts.create`.
- Mitigações vigentes: diretório isolado e dedicado protegido pelo perfil do usuário; zero ADC; zero chave; zero projeto padrão; zero impersonação; nenhum papel concedido ao operador por este bloco; e `gcloud auth revoke` obrigatório no `AUTH-REVOKE`, que não poderá depender apenas da exclusão do diretório.
- **Rede — formulação precisa:** o login **necessariamente** faz comunicação remota com os serviços de autenticação do Google. O bloco afirma `intentionalAuthenticationRemoteFlowExecuted = true`, `intentionalRemoteResourceCommandExecuted = false` e `networkAbsenceForensicallyProven = false`, este intencional e sem alegação de captura de tráfego ou prova forense absoluta.

### Decisão humana pendente — motivo do parecer B

Todas as demais credenciais e permissões do `ADMIN-B2A5` têm limite explícito: token de impersonação de aproximadamente 1 hora, binding IAM de 2 horas, conta de serviço desabilitada e preservada 7 dias. A credencial da CLI é a **única** vinculada apenas ao evento `AUTH-REVOKE`, sem limite temporal, e a sequência ainda intercala `LOGIN-GOVERNANCE` e `PROVISION-GOVERNANCE` entre o login e o inventário. Sem prazo declarado, a cláusula "qualquer pausa ou abandono do workflow exige revogação explícita" fica inaplicável, porque "pausa" não está definida. **Nenhum prazo foi inventado.** A decisão deverá fixar: o prazo máximo de persistência sem progresso do workflow; se ele dispara revogação obrigatória ou apenas reavaliação; e quem executa a revogação em caso de pausa ou abandono. Por isso o parecer é **B**, o `LOGIN-EXEC` **não** foi autorizado e **nenhum prompt-ready foi produzido** — este é reservado à classificação **A**.

### Arquivos alterados

- `CLAUDE.md` — nova seção com o contrato durável do `LOGIN-PREP`; supersessão marcada nos dois bullets do `ISOLATION-REPAIR-EXEC` que apontavam o LOGIN-PREP como próximo gate; atualização dos dois parágrafos de estado consolidado.
- `TASKS.md` — decisão humana pendente como próximo gate; `LOGIN-PREP` marcado como concluído com o contrato do futuro EXEC; sequência e status geral atualizados; `LOGIN-EXEC` mantido como não iniciado.
- `CHANGELOG_AI.md` — esta entrada.

### Próximo gate

Commit documental deste PREP → **decisão humana sobre o limite temporal da persistência da credencial** → `CLI-SETUP-LOGIN-EXEC` → `LOGIN-GOVERNANCE` → `AUTH-PROVISION-EXEC` → `PROVISION-GOVERNANCE` → `ACTIVATION-PREP` → `ACTIVATION-EXEC` → `INVENTORY-EXEC` → `AUTH-REVOKE` → governanças correspondentes → `MIGRATION-PREP` somente se necessário → `FIRESTORE-PREP/EXEC` → `RUNTIME-PREP/EXEC` → `ADMIN-B2B` → `ADMIN-B3`. Nenhuma etapa inicia automaticamente; a publicação de Rules permanece exclusiva do `ADMIN-B3`.

---

## 2026-08-04 — ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-ISOLATION-REPAIR-GOVERNANCE

**Ferramenta/modelo:** Claude Opus 5 (Claude Code)

**Status:** `ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-ISOLATION-REPAIR-EXEC` **concluído**, com classificação funcional **A. STORES LOCAIS ATRIBUÍDOS AO SDK E COMPROVADAMENTE VAZIOS; ISOLAMENTO DA GOOGLE CLOUD CLI REPARADO SEM LOGIN**. Esta entrada é atualização **exclusivamente documental** da conclusão, a partir do commit-base `4042c309bb523b7864a25efd2fb031e792f2a147` (`docs: preparar reparo do isolamento da CLI do ADMIN-B2A5`). Nenhum `gcloud` foi executado nesta governança, e não houve login, navegador OAuth, acesso a Google Cloud/Firebase, ADC, token, chave, custom role, conta de serviço, binding, API habilitada, inventário, alteração funcional, staging, commit ou push.

### Duas paradas C históricas, preservadas como corretas

- **`CLI-SETUP-EXEC` (2026-08-03):** PARADA FAIL-CLOSED ANTES DO LOGIN — CLI instalada, isolamento não comprovado, operador não autenticado, sob `isolatedConfigUnverified`, porque `%APPDATA%\gcloud` passou a existir após estar comprovadamente ausente no preflight.
- **`ISOLATION-REPAIR-EXEC` anterior:** parada **C** enquanto a origem dos artefatos e o conteúdo dos stores locais não estavam comprovados, conforme os critérios cumulativos de remoção segura.
- **Ambas permanecem registradas como histórico correto.** A classificação **A** decorre exclusivamente das evidências adicionais obtidas depois, **não** de flexibilização de critério: enquanto a atribuição e o conteúdo eram desconhecidos, parar era o comportamento certo.

### Atribuição final dos artefatos locais

- **Janela reconciliada:** `2026-08-03T18:13:46Z` a `2026-08-03T18:13:57Z` pertence ao anterior `ISOLATION-REPAIR-EXEC`, o que dá atribuição temporal comprovada, dentro de execução conhecida do workflow, aos artefatos antes tratados como de origem indeterminada.
- **Banco de metadata antes ambíguo:** atribuído ao SDK como `sdkManagedLocalMetadataNoCredentials` — metadata local gerenciada pelo próprio SDK, sem credencial.
- **Credential stores dos diretórios padrão e isolado:** atribuídos inequivocamente ao SDK, esquema reconhecido, **zero linhas**, hashes antes/depois idênticos e **zero sidecars** — `sdkManagedEmptyCredentialStore`.
- **Access-token caches dos dois diretórios:** atribuídos inequivocamente ao SDK, esquema reconhecido, **zero linhas**, hashes antes/depois idênticos e **zero sidecars** — `sdkManagedEmptyAccessTokenCache`.
- **Artefatos desconhecidos:** `unknownWorkflowArtifactCount = 0`.
- **Estado autenticado antes do reparo:** zero contas credentialed, zero contas ativas, zero projeto, zero impersonação, zero access-token file e zero ADC.

### Método de inspeção — leitura estrita, sem escrita

- Python empacotado da própria CLI, invocado por caminho absoluto, com código mantido **somente em memória**.
- SQLite aberto em `mode=ro`, com `immutable=1` e `PRAGMA query_only=ON`.
- Leitura restrita a cabeçalho, schema, integrity check e `COUNT(*)`; **zero leitura de valores** e **zero escrita**.
- A igualdade dos hashes antes e depois é a prova observacional de que a inspeção não alterou os arquivos. Nenhum valor, e-mail, token, projectId ou conteúdo de configuração foi lido, impresso ou persistido.

### Remoções, recriação e prova de isolamento

- **Diretório padrão:** removido por caminho absoluto validado e **não reapareceu** após as chamadas posteriores.
- **Diretório isolado anterior:** removido por caminho absoluto validado.
- **Diretório isolado novo:** recriado vazio, fora do repositório, com proprietário esperado e sem ponto de reparse; caminho comprovado pelo campo oficial `gcloud info --format="value(config.paths.global_config_dir)"`.
- **Instalação da CLI:** preservada, não reinstalada, não desinstalada e sem alteração de PATH nesta execução.
- **Resultado sanitizado:** `isolatedConfigPathVerifiedAfterRepair = true`, `defaultConfigReappeared = false`, `loginExecuted = false`, `adcDetected = false`, `rollbackRequired = false` e `failureCategory = null`.

### Limites e não ações

- Zero login, navegador OAuth, conta Google autenticada, ADC, access token, ID token, chave, impersonação, recurso IAM, API habilitada, Firestore, Storage, inventário, migração, deploy e publicação.
- Nenhuma alteração no repositório durante o EXEC e nenhum bloco posterior iniciado.
- **Rede:** nenhum comando destinado a recurso Google Cloud remoto; o único acesso remoto intencional foi `git fetch origin`; `networkAbsenceForensicallyProven = false` permanece **intencional e não é falha**, e **nenhuma alegação absoluta de ausência de tráfego de rede** é feita.

### Próximo bloco

`ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-LOGIN-PREP`, ainda **não iniciado** e dependente de autorização própria. O LOGIN-PREP precede o LOGIN-EXEC porque a autenticação humana grava credenciais no diretório isolado, torna uma conta ativa, abre fluxo OAuth no navegador, cria estado local sensível e exige contrato próprio de operador, sanitização, rollback e revogação. O projeto **não** deve ser classificado como pronto diretamente para o `PROVISION-EXEC`.

Sequência futura: `ISOLATION-REPAIR-GOVERNANCE` → commit documental separado → `CLI-SETUP-LOGIN-PREP` → commit documental do LOGIN-PREP → `CLI-SETUP-LOGIN-EXEC` → `LOGIN-GOVERNANCE` → `AUTH-PROVISION-EXEC` → `PROVISION-GOVERNANCE` → `ACTIVATION-PREP` → `ACTIVATION-EXEC` → `INVENTORY-EXEC` → `AUTH-REVOKE` → governanças correspondentes → demais blocos do roadmap. Publicação de Rules permanece exclusiva do `ADMIN-B3`.

### Arquivos alterados

- `CLAUDE.md` — nova seção do resultado do `ISOLATION-REPAIR-EXEC`, ordem futura da seção do PREP marcada como superada e dois bullets de status atualizados.
- `TASKS.md` — status geral, novo próximo passo `CLI-SETUP-LOGIN-PREP`, registro da conclusão do reparo, contrato do PREP preservado como referência, pré-requisito do PROVISION e sequência vigente.
- `CHANGELOG_AI.md` — este registro.

Nenhum arquivo funcional, script, Rule, teste, dependência, configuração, runtime, metadata ou asset foi alterado. A data/hora pública não foi atualizada.

---

## 2026-08-03 — ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-EXEC (parcial) e ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-ISOLATION-REPAIR-PREP

**Ferramenta/modelo:** Claude Opus 5 (Claude Code)

**Status:** `ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-EXEC` autorizado e **executado parcialmente**, com **parada fail-closed antes do login** sob a falha `isolatedConfigUnverified`. Em seguida, `ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-ISOLATION-REPAIR-PREP` concluído exclusivamente como pesquisa em documentação oficial do Google Cloud, análise local somente leitura e atualização documental, a partir do commit-base `ebe6310fba0fcc8c4c0b2e6ea9c7c4e6db779e48`. Parecer do PREP: **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-ISOLATION-REPAIR-EXEC**, mantido pelo `ISOLATION-REPAIR-PREP-PATH-FINALIZATION` e pelo `ISOLATION-REPAIR-PREP-LOCAL-NETWORK-FINALIZATION`, ambos exclusivamente documentais. Zero login, navegador OAuth, access token, ADC, acesso a Google Cloud/Firebase, custom role, conta de serviço, binding, API habilitada, inventário, desinstalação, reinstalação, remoção de diretório, execução de `gcloud`, alteração funcional, staging, commit, push ou EXEC iniciado.

### Resultado parcial do CLI-SETUP-EXEC

- **Concluído:** Google Cloud CLI instalada, versão 578.0.0, escopo single-user, assinatura do instalador válida, instalador temporário removido, `gcloud.cmd` localizado por caminho absoluto, diretório isolado criado e `CLOUDSDK_CONFIG` definido durante parte das verificações.
- **Não ocorreu:** login, navegador OAuth, access token, ADC, conta autenticada, recurso IAM, acesso a dados, inventário, staging, commit, push ou qualquer alteração no repositório.
- **Falha `isolatedConfigUnverified`:** `%APPDATA%\gcloud` estava comprovadamente ausente no preflight do PREP e passou a existir após a instalação e as primeiras execuções locais. O conteúdo não foi lido e não se determinou se a criação veio do instalador ou de uma chamada `gcloud` executada **antes** da definição de `CLOUDSDK_CONFIG`. O diretório isolado também permanece criado; nenhum rollback foi realizado.
- **Classificação:** PARADA FAIL-CLOSED ANTES DO LOGIN — CLI INSTALADA, ISOLAMENTO NÃO COMPROVADO, OPERADOR NÃO AUTENTICADO. O PREP havia definido o isolamento como comprovável por observação, justamente porque nada preexistia; a criação do diretório padrão eliminou essa prova, e a parada preservou a propriedade em vez de prosseguir sob suposição.

### Duas correções factuais do relatório do EXEC

- **`bundledPythonSelected = false` era limitação de coleta, não uso de Python externo.** A instalação contém `platform\bundledpython\python.exe` na versão 3.14.6, dentro da faixa oficial "Python 3.10 to 3.14", e o launcher `gcloud.cmd` seleciona o Python empacotado sempre que `CLOUDSDK_PYTHON` estiver vazio e o executável empacotado existir — que é exatamente o estado atual, com a variável ausente em processo, usuário e máquina. A documentação confirma que "By default, the Windows version of Google Cloud CLI comes bundled with Python 3".
- **O PATH do usuário foi alterado.** Existe exatamente uma entrada apontando para dentro do diretório isolado de instalação; o PATH de máquina permanece sem qualquer entrada da CLI. O relatório anterior registrou PATH inalterado porque o PATH do **processo** em execução não herda a escrita feita no PATH do **usuário**. Não é bloqueante — a execução continua obrigatoriamente por caminho absoluto —, mas passa a integrar o rollback do `AUTH-REVOKE` e da desinstalação.

### Fundamento oficial e limite honesto

- **Confirmado por documentação oficial:** configurações ficam no diretório do usuário, "typically `~/.config/gcloud` on MacOS and Linux, or `%APPDATA%\gcloud` on Windows"; "The config directory can be changed by setting the environment variable `CLOUDSDK_CONFIG`"; "The gcloud CLI stores the credential files it uses in the gcloud CLI configuration directory"; ADC é conjunto distinto, com ordem `GOOGLE_APPLICATION_CREDENTIALS` → arquivo de `gcloud auth application-default login` → conta de serviço via metadata server, e "The credentials you provide to ADC by using the gcloud CLI are distinct from your gcloud credentials"; `auth list` lista contas cujas credenciais vieram de `gcloud init`, `gcloud auth login` e `activate-service-account`, com exemplo documentado `--filter=status:ACTIVE --format="value(account)"`; `config list` é local e cobre `core/account`, `core/project`, `auth/impersonate_service_account` e `auth/access_token_file`; `config configurations list/create/activate/delete` existe e "You can't delete the active configuration"; `info` possui o flag `--anonymize` — "Minimize any personal identifiable information"; a desinstalação no Windows executa o `uninstaller.exe` do diretório da CLI e apaga instalação e diretório de configuração do usuário; `auth revoke` "removes the credential from the local machine"; e logs em arquivo são o padrão, com `core/disable_file_logging` e `core/max_log_days`.
- **Não sustentado por documentação oficial, portanto registrado como inferência:** que `gcloud version`, `gcloud info` ou outro comando isolado **crie** o diretório padrão — a documentação associa a configuração `default` ao setup inicial e a `gcloud init`.
- **Evidência local que sustenta a inferência sem elevá-la a fato:** o diretório padrão contém `logs/2026.08.03/` com três arquivos de invocação, `config_sentinel`, `active_config`, `default_configs.db` e `configurations/config_default` vazio, todos criados dentro da janela do EXEC e posteriores à criação do diretório de instalação; o diretório isolado contém um único log, criado depois. Compatível com chamadas locais antes e depois da definição de `CLOUDSDK_CONFIG`, mas sem distinguir formalmente instalador de primeira invocação.

### Contrato do futuro ISOLATION-REPAIR-EXEC

- **Isolamento sem exceção:** `CLOUDSDK_CONFIG` definido **antes de toda e qualquer** chamada `gcloud`, inclusive `version`, `info`, `auth list`, `config list`, `config configurations list` e `auth login`; sempre pelo caminho absoluto de `gcloud.cmd`, nunca pelo PATH; somente em processo; sem alterar a configuração padrão do usuário. Para inspecionar o diretório padrão, apontar `CLOUDSDK_CONFIG` explicitamente para ele — leitura sob isolamento declarado, não uso implícito da configuração padrão.
- **Auditoria permitida:** existência, timestamps, proprietário, atributos, contagem e nomes relativos de arquivos, tamanhos, hashes quando necessários, presença de caminhos conhecidos de credenciais e saída **sanitizada** de comandos locais, dos quais se extraem apenas contagens e booleanos. **Proibido** abrir ou imprimir banco de credenciais, tokens, conteúdo SQLite, conteúdo de configuração, e-mail, projectId, refresh token, access token, URLs e logs integrais.
- **Categorias de classificação:** `sessionCreatedNoCredentials`, `sessionCreatedLocalMetadataOnly`, `containsCredentialedAccount`, `containsActiveAccount`, `containsProjectConfiguration`, `containsImpersonationConfiguration`, `containsAccessTokenFileConfiguration`, `containsAdc`, `preexisting`, `ownershipUnverified`, `originAmbiguous` e `inaccessible`. ADC detectado: não remover, não abrir, classificar `preexistingOrUnexpectedAdcDetected` e interromper.
- **Critérios cumulativos de remoção segura:** classificação `sessionCreatedNoCredentials` ou `sessionCreatedLocalMetadataOnly` **e** ausência no preflight, criação na janela do EXEC, caminho absoluto exato, proprietário esperado, zero contas credentialed, zero conta ativa, zero projeto, zero impersonação, zero access-token file, zero ADC, nenhum arquivo de origem desconhecida e nenhuma ambiguidade de junction, symlink ou redirecionamento. Falhando qualquer um: não remover, classificar **C**, exigir decisão humana e não prosseguir ao login.
- **Reparo:** preservar a instalação; não reexecutar o instalador; remover os dois diretórios apenas sob os critérios acima, por caminhos absolutos exatos, sem wildcard e sem `git clean`; recriar o diretório isolado vazio; comprovar o caminho de configuração resolvido e que `%APPDATA%\gcloud` não reaparece; **não executar login no mesmo bloco**.

### Correção factual do PATH-FINALIZATION — campo oficial da prova de caminho

- **Afirmação incorreta retirada.** Uma versão anterior deste registro afirmou que os nomes de campo de `gcloud info`, inclusive `config.paths.global_config_dir`, não eram documentados, e criou a categoria de falha `configPathKeyUnverified`. **A afirmação estava errada.** Ela decorreu de generalizar a página de referência de `gcloud info`, que de fato não enumera campos, para toda a documentação — ignorando as páginas que apresentam o comando diretamente.
- **Evidência oficial.** A página de configurações declara: "Configurations are stored in your user config directory (typically `~/.config/gcloud` on MacOS and Linux, or `%APPDATA%\gcloud` on Windows); you can find the location of your config directory by running `gcloud info --format='value(config.paths.global_config_dir)'`." O tópico de desinstalação repete a instrução — "Locate your user config directory ... by running: `gcloud info --format="value(config.paths.global_config_dir)"`" — ao lado de `value(installation.sdk_root)` para o diretório de instalação. Combinado com a alteração oficial do diretório por `CLOUDSDK_CONFIG`, esse comando é o mecanismo oficial aprovado de prova.
- **`configPathKeyUnverified` removido** do contrato operacional; permanece apenas como categoria histórica superada. Não haverá descoberta dinâmica da chave.
- **Prova exigida três vezes,** sempre com `CLOUDSDK_CONFIG` definido antes e `gcloud.cmd` por caminho absoluto, com retorno apenas em memória e jamais impresso: `defaultConfigPathVerified` antes das consultas ao diretório padrão; `isolatedConfigPathVerifiedBeforeRepair` antes das consultas ao isolado atual; `isolatedConfigPathVerifiedAfterRepair` depois da recriação. `auth list`, `config list` e `config configurations list` só rodam após a confirmação do respectivo diretório, e o diretório padrão não é removido antes de confirmar caminho, concluir auditoria, classificar e aprovar todos os critérios.
- **Normalização e comparação no Windows:** remover apenas whitespace externo, resolver caminho absoluto, validar ausência de ponto de reparse, comparar com semântica case-insensitive e não alterar o diretório durante a normalização. Aprovado só com exit code 0, retorno não vazio, caminho absoluto existente, sem junction ou symlink, coincidente com o esperado e fora do repositório.
- **Novas categorias objetivas de falha:** `configPathQueryFailed`, `configPathResponseEmpty`, `configPathResponseMalformed`, `configPathResolutionFailed`, `configPathMismatch`, `configPathReparsePointDetected` e `configPathInsideRepositoryDetected`. Cada uma interrompe, não executa login, não acessa recurso remoto, não remove diretório adicional, não repete automaticamente, preserva a instalação e emite apenas saída sanitizada — sem caminho esperado, caminho retornado, nome de usuário, diretório completo ou output bruto.
- **Campos acrescentados à allowlist:** `defaultConfigPathVerified`, `isolatedConfigPathVerifiedBeforeRepair`, `isolatedConfigPathVerifiedAfterRepair`, `configPathQueryUsedOfficialField` e `configPathFailureCategory`. Em sucesso, os quatro primeiros verdadeiros e o último nulo. Nenhum campo pode conter o caminho.
- A prova observacional — novos artefatos somente no diretório isolado e `%APPDATA%\gcloud` ausente — permanece **complementar**, não substitutiva. A classificação **A** é mantida: a correção elimina uma restrição inexistente e nenhum bloqueio novo foi identificado.
- **Python:** nada será reinstalado por esse motivo. Verificação local sanitizada da versão efetiva e de sua resolução dentro da instalação isolada, emitindo apenas versão e booleano; o login só é bloqueado se a versão efetiva sair da faixa suportada ou resolver para local inseguro ou ambíguo.
- **Saída por allowlist** de 31 campos, de `ok` e `schemaVersion` a `loginExecuted`, `rollbackRequired`, `startedAtUtc` e `endedAtUtc`, sem caminhos completos, nomes de arquivo sensíveis, operador, e-mail, projectId, conteúdo de configuração, token, banco SQLite, log bruto ou stack.
- **Falha e rollback:** qualquer ambiguidade interrompe; proibido apagar credencial, revogar conta, remover ou reinstalar a instalação, repetir o reparo automaticamente, executar login para testar e acessar Google Cloud. Removida com segurança uma parte e falhando etapa posterior: não recriar dados antigos, preservar a instalação, registrar o estado e aguardar revisão humana.

### Correção do LOCAL-NETWORK-FINALIZATION — controles de processo e limite de evidência de rede

- **Motivo.** As chamadas locais de inspeção da CLI ainda podiam disparar verificação automática de atualização, coleta de estatísticas de uso ou prompt inesperado, e o contrato continha afirmações excessivamente absolutas de "zero operação remota". Atualização exclusivamente documental, sem executar `gcloud`, sem reparo, sem remover ou recriar diretório, sem login, sem acesso a Google Cloud/Firebase, sem variável persistente, sem alteração de PATH e sem staging, commit ou push.
- **Quatro variáveis de processo, obrigatórias antes de toda chamada:** `CLOUDSDK_CONFIG` com o diretório esperado, `CLOUDSDK_CORE_DISABLE_USAGE_REPORTING = "true"`, `CLOUDSDK_COMPONENT_MANAGER_DISABLE_UPDATE_CHECK = "true"` e `CLOUDSDK_CORE_DISABLE_PROMPTS = "1"`. Existem somente no processo atual, são definidas antes da primeira chamada, permanecem ativas em todas as chamadas locais, não vão para o perfil do usuário, não são definidas em escopo `User` ou `Machine`, não são persistidas em arquivo e são limpas em `finally`, inclusive em falha.
- **Base documental e limite honesto.** As propriedades oficiais correspondentes são `core/disable_usage_reporting`, `component_manager/disable_update_check` — "if True, the CLI will not automatically check for updates" — e `core/disable_prompts`; o padrão `CLOUDSDK_SECTION_PROPERTY` é oficialmente demonstrado por `CLOUDSDK_CORE_DISABLE_PROMPTS`, mas a regra geral não está citada verbatim. Portanto as duas outras variáveis seguem o padrão **por inferência**, e o EXEC deverá comprovar o efeito por leitura sanitizada das propriedades efetivas nos comandos já allowlisted, extraindo apenas booleanos. Não sendo possível comprovar, classificar `gcloudUsageReportingControlUnverified`, `gcloudUpdateCheckControlUnverified` ou `gcloudPromptControlUnverified` e parar — nunca inventar nome de variável, nunca presumir o controle aplicado e nunca persistir propriedade como alternativa.
- **Justificativa para não persistir propriedades.** `gcloud config set disable_usage_reporting`, `gcloud config set component_manager/disable_update_check` e `gcloud config set disable_prompts` ficam proibidos porque gravariam propriedades **dentro dos próprios diretórios sob auditoria**, criando ou alterando arquivos nos diretórios que serão classificados, podendo converter `sessionCreatedNoCredentials` em estado ambíguo e persistindo além do bloco. Não se altera configuração para preparar a própria auditoria.
- **Wrapper único e obrigatório.** Conceitualmente `Invoke-IsolatedGcloud -ConfigDirectory <dir> -Arguments <string[]>`, que define as quatro variáveis e executa `& $GcloudPath @Arguments`. Requisitos: somente o caminho absoluto já localizado de `gcloud.cmd`, previamente resolvido e validado; nenhuma chamada `gcloud` fora do wrapper; verificação de que as quatro variáveis estão definidas antes de executar; exit code e saída capturados **apenas em memória**; nenhum output bruto impresso; nenhum argumento de login ou de recurso remoto aceito; sem PATH; sem alias; sem `Start-Transcript`. Violação de invariante produz `localGcloudWrapperInvariantFailed`.
- **Allowlist fechada, validada antes de iniciar o processo `gcloud`:** `info --format=value(config.paths.global_config_dir)`, opcionalmente com `--anonymize`; `auth list --format=json` ou formato sanitizado equivalente aprovado; `config list --format=json`; `config configurations list --format=json`; e `version` somente quando necessário à validação local da instalação e do Python. **Proibidos** `auth login`, `auth revoke`, `auth print-access-token`, `auth application-default`, `projects`, `iam`, `services`, `firestore`, `storage`, `firebase`, `components update`, `components install`, `config set`, `config unset` e qualquer comando não allowlisted; a tentativa produz `nonAllowlistedGcloudCommandRequested`, registra `nonAllowlistedGcloudCommandBlocked` e **não executa** o comando.
- **Colisão ambiental e limpeza.** Antes de definir, registrar apenas **se** cada variável já existia, jamais o valor. Preexistente com valor divergente: `processEnvironmentCollision`, parada antes da primeira chamada, sem sobrescrever silenciosamente e **sem remover a variável preexistente**. Precisão operacional acrescentada: o `finally` remove exclusivamente as variáveis criadas pelo próprio bloco — uma preexistente de valor idêntico não foi criada por ele e não pode ser removida por ele.
- **Correção da afirmação de zero rede.** Retiradas as formulações "zero possibilidade de operação remota", "prova de ausência total de tráfego" e "nenhuma comunicação de rede é tecnicamente possível"; a frase "todos sob `CLOUDSDK_CONFIG` explícito e sem chamada remota" passou a "sem nenhum comando destinado a recurso Google Cloud remoto". O contrato preciso é: nenhum comando destinado a recurso remoto; nenhum login; nenhuma chamada a API de recurso; nenhum comando Firestore, IAM, Storage ou Firebase; telemetria, verificação de atualização e prompts desativados no processo; **nenhuma operação remota intencional**; e **nenhuma alegação de captura ou prova forense de ausência absoluta de tráfego**. A classificação funcional permanece: zero acesso a dados, zero IAM, zero autenticação, zero inventário.
- **Oito campos sanitizados acrescentados:** `usageReportingDisabledForProcess`, `automaticUpdateCheckDisabledForProcess`, `promptsDisabledForProcess`, `gcloudCommandsExecutedThroughWrapper`, `nonAllowlistedGcloudCommandBlocked`, `processEnvironmentCollision`, `intentionalRemoteResourceCommandExecuted` e `networkAbsenceForensicallyProven`. Em sucesso: os quatro primeiros `true`, os quatro últimos `false`. `networkAbsenceForensicallyProven = false` é **intencional e não é falha** — apenas declara que o bloco não fez captura de tráfego nem prova forense absoluta. Nenhum campo pode conter valor de variável, PATH, diretório completo, argumento sensível, output bruto, log ou identificador pessoal.
- **Seis categorias de falha acrescentadas:** `processEnvironmentCollision`, `localGcloudWrapperInvariantFailed`, `gcloudUsageReportingControlUnverified`, `gcloudUpdateCheckControlUnverified`, `gcloudPromptControlUnverified` e `nonAllowlistedGcloudCommandRequested`. Cada uma interrompe **antes da chamada correspondente**, não altera a instalação, não altera diretórios adicionais e não repete automaticamente.
- **Classificação mantida: A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-ISOLATION-REPAIR-EXEC.** As quatro variáveis foram incorporadas, nenhuma alteração persistente de propriedade é usada, toda chamada passa pelo wrapper, a allowlist é validada antes da execução, as afirmações de rede foram corrigidas, nenhuma decisão humana permanece pendente e nenhum bloqueio novo surgiu. Ficam preservados o campo oficial `config.paths.global_config_dir`, o uso oficial de `CLOUDSDK_CONFIG`, as três provas de caminho, as categorias objetivas de falha, os critérios cumulativos de remoção segura, a auditoria sanitizada, a classificação independente dos dois diretórios, a preservação da instalação, a correção do Python empacotado, o registro da alteração do PATH do usuário, zero login e zero ADC.

### Sequência futura vigente

`CLI-SETUP-ISOLATION-REPAIR-PREP` → commit da governança → `CLI-SETUP-ISOLATION-REPAIR-EXEC` → governança do reparo → `CLI-SETUP-LOGIN-PREP` ou `LOGIN-EXEC` → `CLI-SETUP-GOVERNANCE` final → `PROVISION-EXEC` → `PROVISION-GOVERNANCE` → `ACTIVATION-PREP` → `ACTIVATION-EXEC` → `INVENTORY-EXEC` → `AUTH-REVOKE` → demais governanças → `MIGRATION-PREP` se necessário → `FIRESTORE-PREP/EXEC` → `RUNTIME-PREP/EXEC` → `ADMIN-B2B` → `ADMIN-B3`. Nenhuma etapa inicia automaticamente; cada uma exige autorização própria. Publicação de Rules permanece exclusiva do `ADMIN-B3`.

### Arquivos alterados

- `CLAUDE.md` — nova seção do resultado parcial do `CLI-SETUP-EXEC`, nova seção do contrato do `ISOLATION-REPAIR-PREP`, ordem futura corrigida e dois bullets de status atualizados.
- `TASKS.md` — status geral, novo bloco de próximo passo, registro da execução parcial, pré-requisito do PROVISION e sequência vigente.
- `CHANGELOG_AI.md` — este registro.

Nenhum arquivo funcional, script, Rule, teste, dependência, configuração, runtime ou asset foi alterado. Nenhum diretório foi removido, nenhuma CLI foi desinstalada ou reinstalada e nenhum comando `gcloud` foi executado neste bloco.

---

## 2026-08-03 — ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-PREP

**Ferramenta/modelo:** Claude Opus 5 (Claude Code)

**Status:** `ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-PREP` concluído exclusivamente como pesquisa em documentação oficial do Google Cloud, verificação local somente leitura e atualização documental, a partir do commit-base `66c5f36665029456a208aa8209b13dbfbbfa182d`. Parecer **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-CLI-SETUP-EXEC**. Zero download, instalador, instalação, PATH alterado, execução de `gcloud`, login, fluxo OAuth, access token, ADC, configuração gcloud, credencial, acesso a Google Cloud/Firebase, recurso IAM, API habilitada, inventário, alteração funcional, staging, commit, push ou EXEC iniciado.

### Motivo — pré-requisito operacional inexistente

- O parecer **A** do `AUTH-PROVISION-PREP` permanece correto, mas o preflight local do PROVISION-EXEC comprovou que nada podia ser executado: sem CLI instalada e sem operador autenticado, nenhum gate remoto é possível. Instalar software e autenticar uma identidade humana são mutações de ambiente de natureza distinta da criação de recursos IAM, portanto ganham bloco, preflight e autorização próprios em vez de virem embutidas no PROVISION-EXEC.
- **Ausência comprovada por leitura, sem executar o binário:** `gcloud`, `gcloud.cmd`, `gsutil` e `bq` não resolvem por `Get-Command`; nenhuma entrada de PATH contém `Google`, `Cloud SDK` ou `CloudSDK`; `gcloud.cmd` inexistente sob o perfil até profundidade 4; ausentes `%LOCALAPPDATA%\Google\Cloud SDK`, `%APPDATA%\gcloud`, `%ProgramFiles%\Google\Cloud SDK`, `%ProgramFiles(x86)%\Google\Cloud SDK`, `C:\Google\Cloud SDK` e `%LOCALAPPDATA%\Google\CloudSDK`.
- **Estado local:** `%APPDATA%\gcloud` ausente; `application_default_credentials.json` ausente; `CLOUDSDK_CONFIG` e `GOOGLE_APPLICATION_CREDENTIALS` não definidas; diretório isolado pretendido ausente; sessão **não** administrativa; Windows 11 Pro AMD64; PowerShell 7.6.3; Python do sistema `Python314`.
- **Ganho de segurança verificável:** como não existe configuração gcloud nem ADC preexistente, o bloco não pode sobrescrever nada do usuário, e o isolamento passa a ser comprovável por observação — `%APPDATA%\gcloud` e o ADC devem permanecer ausentes após instalação e login. Essa prova é obrigatória no EXEC.

### Decisão 1 — instalação silenciosa, com limite honesto das flags

- Flags oficiais confirmadas verbatim e **case sensitive**: `/S`, `/D`, `/allusers`, `/singleuser` (default), `/screenreader`, `/reporting`, `/noreporting` (default), `/nostartmenu`, `/nodesktop`. Escolhida a instalação **silenciosa** por produzir linha de comando exata, reproduzível e auditável, sem cliques humanos inconsistentes. Não misturar interativa e silenciosa.
- **Limite registrado sem eufemismo:** a documentação **não** expõe flag para Python empacotado, alteração de PATH, execução de `gcloud init` ou abertura da shell. Esses quatro efeitos **não são preveníveis por flag** e serão tratados por **observação antes/depois**, nunca por promessa. Proibido inventar flag ou tratar comportamento não documentado como garantido.
- **Restrição derivada e sutil:** `/D` deve ser o último parâmetro, "não pode conter aspas, mesmo que o caminho contenha espaços", e só aceita caminho absoluto. Como o PowerShell cita automaticamente argumentos com espaço, o diretório de instalação **não poderá conter espaço** — o que descarta `%LOCALAPPDATA%\Google\Cloud SDK` como destino explícito. Adotado `%LOCALAPPDATA%\Google\CloudSDK\admin-b2a5-cli`, com asserção prévia de ausência de espaço sob pena de `installDirectoryPathUnsafeForInstallerFlag`.
- Escopo por usuário com `/singleuser` explícito. Sessão não administrativa torna a alteração do **PATH do sistema tecnicamente inviável**; alteração inesperada dele interrompe. O diretório padrão não é documentado como caminho fixo e o instalador cria o subdiretório `google-cloud-sdk`, portanto `gcloud.cmd` é **localizado**, nunca presumido.

### Decisão 2 — instalador, assinatura e integridade

- Origem única `https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe`, só HTTPS, sem espelho, gerenciador de pacote ou terceiro. `Get-AuthenticodeSignature` exigindo `Status` `Valid`, certificado presente, cadeia válida e publisher coerente com **Google LLC**; qualquer divergência produz `installerSignatureInvalid` e parada antes de qualquer execução, sem ignorar warnings.
- SHA-256 calculado e registrado **somente como hash**, como evidência da cópia baixada. **Nenhum hash permanente é fixado**, porque o canal `rapid` muda de versão — allowlist histórica seria falsa segurança.

### Decisão 3 — configuração isolada e diferença CLI/ADC

- O diretório de configuração é `%APPDATA%\gcloud` no Windows e "pode ser alterado definindo a variável de ambiente `CLOUDSDK_CONFIG`"; a CLI "armazena os arquivos de credencial que usa no diretório de configuração". Logo, relocalizar o diretório relocaliza as credenciais da CLI. Adotado `%LOCALAPPDATA%\Google\CloudSDK\admin-b2a5-config`, definido **apenas no processo**.
- Isolamento por **diretório**, não por configuração nomeada, porque as credenciais residem no diretório e não em cada configuração. Colisão classificada em `absent`, `exists-empty`, `exists-nonempty`, `inaccessible` e `ambiguous`: **somente `absent` autoriza criação**; qualquer outro estado para, sem reutilizar, apagar, renomear, mesclar ou sobrescrever.
- **Diferença durável registrada:** credenciais da CLI vêm de `gcloud auth login` e ficam no diretório de configuração; o ADC é conjunto **distinto**, para bibliotecas, normalmente criado por `gcloud auth application-default login`, gravado em `%APPDATA%\gcloud\application_default_credentials.json`, com ordem de busca `GOOGLE_APPLICATION_CREDENTIALS` → arquivo bem conhecido → conta de serviço via metadata server. A documentação afirma que a própria CLI **não usa ADC**. **Nenhum ADC será criado**, e a ausência será comprovada por caminho.

### Decisão 4 — autenticação, navegador, projeto e componentes

- Somente `auth login --brief`, porque o comando "obtém credenciais de acesso da conta de usuário por fluxo de autorização web" e "define a conta ativa na configuração atual" — exatamente o necessário. **`gcloud init` descartado** por configurar propriedades comuns, podendo selecionar projeto, região e zona e alterar a configuração ativa, gerando efeitos persistentes desnecessários.
- Proibidos `application-default login`, `--update-adc`, `--cred-file`, conta de serviço, chave JSON, impersonação, workload identity, `--access-token-file`, `--enable-gdrive-access`, projeto padrão e qualquer `gcloud config set`. Blocos posteriores seguem passando `--project` e `--account` explicitamente.
- Navegador: fluxo padrão local, já que o ambiente é desktop com navegador. `--no-browser` exige segundo dispositivo confiável com gcloud 372.0.0+ e navegador; o fluxo manual de copiar e colar código tem histórico de descontinuação no ecossistema OAuth. Nenhum dos dois será usado sem autorização, e falha de navegador interrompe sem fallback silencioso.
- Componentes: registrar versão da CLI, versão do Python e presença de `gcloud`, `bq`, `gsutil` e `core`. **Proibido** `components update`, instalar componente, reverter versão ou agir sobre aviso de atualização, que é informativo. A propriedade oficial `component_manager/disable_update_check` fica registrada; a variável equivalente segue o padrão `CLOUDSDK_SECTION_PROPERTY` demonstrado por `CLOUDSDK_CORE_DISABLE_PROMPTS`, **sem regra geral citada verbatim** — se usada, apenas em processo e como conveniência, com nome incorreto tendo como única consequência um aviso informativo.

### Decisão 5 — persistência, rollback e falhas parciais

- **Persistência: preservar** a autenticação isolada até o `AUTH-REVOKE`, porque PROVISION, ACTIVATION, INVENTORY e o próprio REVOKE dependem do operador autenticado; revogar ao fim do SETUP forçaria novos logins interativos sem ganho de segurança. Risco residual registrado: credencial humana permanece local, em diretório isolado, por todo o workflow. Mitigada por diretório dedicado, zero ADC, zero chave, zero projeto padrão, zero impersonação, zero papel concedido ao operador e obrigação de revogação no REVOKE.
- **Rollback em quatro planos:** instalação por `uninstaller.exe` oficial; diretório isolado removido **somente** se comprovadamente criado pelo bloco, por caminho absoluto conferido e nunca com `git clean`; login por `gcloud auth revoke`, que revoga o token no servidor e remove a credencial local; e cleanup final ao término do workflow. Reversão de PATH somente se alterado pelo bloco. Nunca apagar configuração padrão, credencial preexistente, diretório preexistente ou instalação preexistente.
- **Catorze falhas parciais previstas** — de assinatura inválida a ADC criado indevidamente, conta divergente, mais de uma conta ativa e PATH alterado inesperadamente — todas com parada, evidência sanitizada, sem repetir login automaticamente, sem apagar credencial de origem não comprovada e com escalonamento humano na ambiguidade.
- **Saída sanitizada por allowlist** de 26 campos; proibido imprimir operador, e-mail, projectId, caminhos completos, token, refresh token, código OAuth, URL de autorização, conteúdo de configuração, certificado, logs brutos e output integral do instalador. Rede/proxy/TLS têm seis categorias de parada e proibição expressa de alterar proxy, desativar TLS, instalar certificado ou executar bypass.

### Preservações e limites

- Nenhuma decisão anterior do ADMIN-B2A5 foi reaberta ou ampliada: as duas permissões, o descarte de `roles/datastore.viewer`, zero chave JSON, Token Creator só na conta específica e só na ACTIVATION, token de ~1 hora, janela de 2 horas, `--max-docs 10000`, Data Access audit logs como estão, conta desabilitada e preservada 7 dias, `AUTH-REVOKE` obrigatório, condição pelo database `(default)` e coleção/campos impostos pelo código auditado.
- **Arquivos alterados:** `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`. Ferramenta isolada, testes, manifests, Rules, Storage, runtime, `js/site-meta.js`, metadata e data/hora pública **intactos**.
- **Ordem vigente:** `AUTH-CLI-SETUP-PREP` → commit documental → `AUTH-CLI-SETUP-EXEC` → `AUTH-CLI-SETUP-GOVERNANCE` → `AUTH-PROVISION-EXEC` → `AUTH-PROVISION-GOVERNANCE` → `AUTH-ACTIVATION-PREP` → `AUTH-ACTIVATION-EXEC` → `INVENTORY-EXEC` → `AUTH-REVOKE` → governanças → `MIGRATION-PREP` somente se necessário → `FIRESTORE-PREP/EXEC` → `RUNTIME-PREP/EXEC` → `ADMIN-B2B` → `ADMIN-B3`. Publicação de Rules segue exclusiva do `ADMIN-B3`.
- **Fontes oficiais consultadas (2026-08-03):** *Install the Google Cloud CLI* (atualizado 2026-07-28); *Using the Google Cloud CLI installer* (2026-07-31); *Managing gcloud CLI configurations*; *Initializing the gcloud CLI* (2026-07-28); *Authorize the gcloud CLI* (2026-07-28); *gcloud auth login* (2026-05-27); *gcloud auth list*; *gcloud auth revoke*; *gcloud version*; *How Application Default Credentials works*; *Set up ADC for a local development environment* (2026-07-21); *Managing gcloud CLI components*; *gcloud topic configurations*; *gcloud config set*; *Uninstalling the gcloud CLI* (2026-07-28); *gcloud CLI proxy settings* (2026-07-28).

---

## 2026-08-02 — Transporte REST dos gates do ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP

**Ferramenta/modelo:** Claude Opus 5 (Claude Code)

**Status:** `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-REST-TRANSPORT-FINALIZATION` concluído exclusivamente como atualização documental, a partir do mesmo commit-base `b58541d21ba70424870fe16650a50ea9b8e09fe7`. Define o mecanismo executável dos quatro `testIamPermissions`, separa o access token OAuth temporário do operador humano dos tokens permanentemente proibidos e fecha o último detalhe operacional antes do commit documental. Parecer **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC** **mantido**.

### Lacuna corrigida — método exigido sem mecanismo

- O contrato já exigia `projects.testIamPermissions`, `folders.testIamPermissions`, `organizations.testIamPermissions` e `projects.serviceAccounts.testIamPermissions`, mas **não dizia como executá-los**. A referência estável da gcloud CLI não apresenta comandos correspondentes em `gcloud projects`, `gcloud resource-manager folders` ou `gcloud iam service-accounts`, e a busca na documentação oficial não retornou nenhum. Fica proibido inventar `gcloud projects test-iam-permissions`, `gcloud resource-manager folders test-iam-permissions` ou `gcloud iam service-accounts test-iam-permissions` sem confirmação simultânea na versão local instalada e na documentação estável.
- **Contrato principal adotado: endpoints REST oficiais**, confirmados verbatim em 2026-08-02 — projeto `POST https://cloudresourcemanager.googleapis.com/v3/{resource=projects/*}:testIamPermissions`; pasta `.../v3/{resource=folders/*}:testIamPermissions`; organização `.../v3/{resource=organizations/*}:testIamPermissions`; conta de serviço, só após a criação, `POST https://iam.googleapis.com/v1/{resource=projects/*/serviceAccounts/*}:testIamPermissions`. Corpo sempre `{"permissions": ["PERMISSION_1", "PERMISSION_2"]}`; a resposta devolve **apenas o subconjunto que o chamador possui**; wildcards são oficialmente proibidos.
- O recurso da conta aceita **e-mail ou `uniqueId`**; usar o identificador numérico devolvido pela criação quando isso aumentar a confiabilidade. **Proibido `projects/-/serviceAccounts/...`:** a documentação oficial orienta evitar o wildcard `-` porque ele "pode causar mensagens de resposta com códigos de erro enganosos". URLs concretas, IDs, project numbers e resource names reais não são impressos nem persistidos.

### Token do operador humano — proibição absoluta substituída por distinção precisa

- A formulação "nenhum token" tornava o gate inexecutável e confundia dois objetos distintos. **Continua proibido:** ADC, `gcloud auth application-default login`, `gcloud auth application-default print-access-token`, token obtido por ADC, `--impersonate-service-account`, impersonação de qualquer conta, access token ou ID token **da futura conta de serviço**, refresh token novo, chave JSON e qualquer credencial persistida.
- **Exceção técnica limitada, só no futuro PROVISION-EXEC:** um único access token OAuth **temporário do operador humano já autenticado na gcloud**, obtido exclusivamente para transportar as chamadas REST do gate. Comando contratual `gcloud auth print-access-token OPERATOR_IN_MEMORY --quiet` — a documentação confirma o posicional `[ACCOUNT]` e restringe `--lifetime` à impersonação, que não será usada. Ele materializa a credencial que a gcloud já usaria nos comandos remotos aprovados: **não é ADC, não é impersonação, não é token da conta de serviço, não concede acesso novo e não inicia a janela de ACTIVATION.**
- **Ciclo de vida:** somente em variável do processo; nunca impresso, persistido, logado, transcrito, relatado, copiado para arquivo, variável de ambiente persistente, configuração gcloud ou clipboard; não reutilizado fora do bloco; limpo obrigatoriamente em `finally`, junto com headers e bodies, inclusive em falha. Proibidos `Write-Host`, `Write-Output`, `echo`, `Start-Transcript`, serialização de headers, captura de output bruto e exibição de exceptions com headers. `Remove-Variable` fica como limpeza adicional a avaliar; **não se alega apagamento criptográfico da memória**, apenas remoção das referências.

### Projeto de quota e bootstrap fail-closed

- A documentação oficial confirma que o projeto de quota pode ser indicado em REST pelo cabeçalho `x-goog-user-project` e que o principal precisa de **`serviceusage.services.use`** sobre ele — permissão do papel Service Usage Consumer. Ela passa a integrar o gate pré-mutação do projeto, ao lado de `serviceusage.services.list`, que continua necessária ao estado das APIs. Conjunto pré-mutação do projeto: `iam.roles.create`, `iam.roles.list`, `iam.serviceAccounts.create`, `iam.serviceAccounts.list`, `resourcemanager.projects.get`, `resourcemanager.projects.getIamPolicy`, `serviceusage.services.list` e `serviceusage.services.use`.
- **Dependência circular resolvida fail-closed:** o gate testa `serviceusage.services.use` por uma chamada que pode exigir essa mesma permissão. Contrato — obter o token só em memória; executar a primeira `projects.testIamPermissions` **com** o cabeçalho; incluir `serviceusage.services.use` entre as permissões pedidas; se falhar por quota project, service usage ou permissão relacionada ao cabeçalho, classificar **`operatorQuotaProjectPermissionMissing`**, limpar token e headers e **parar antes de qualquer mutação**; se responder com sucesso mas **omitir** a permissão, aplicar a mesma categoria e a mesma parada; prosseguir só quando a resposta trouxer integralmente todas as permissões pré-mutação exigidas.
- Proibido repetir sem autorização, remover silenciosamente o cabeçalho, tentar outro projeto de quota, conceder permissão, tratar falha da primeira chamada como ausência de recurso ou usar fallback para leitura dos papéis do operador.

### Execução, erros e campos sanitizados

- `Invoke-RestMethod`/`Invoke-WebRequest` apenas com POST, `Content-Type: application/json; charset=utf-8`, Bearer em memória, `X-Goog-User-Project`, corpo compacto gerado em memória, timeout finito, nenhum arquivo temporário e nenhuma saída bruta. Processar exclusivamente `$Response.permissions`; nunca imprimir resposta integral, headers, request, endpoint concreto, IDs, token ou erro bruto.
- Categorias acrescentadas: `operatorAccessTokenUnavailable`, `operatorRestAuthenticationFailed`, `operatorQuotaProjectPermissionMissing`, `testIamPermissionsRequestFailed`, `testIamPermissionsResponseMalformed`, `operatorFolderPermissionMissing` e `operatorOrganizationPermissionMissing`, somadas às já vigentes `operatorProjectPermissionMissing` e `operatorServiceAccountPermissionMismatch`. Cada uma interrompe conforme sua fase, sem mensagem HTTP bruta, response body, token, URL concreta ou identificador real.
- Campos acrescentados à allowlist: `humanOperatorAccessTokenUsedForRest`, `humanOperatorAccessTokenPersisted`, `humanOperatorAccessTokenCleared`, `quotaProjectHeaderUsed`, `quotaProjectPermissionConfirmed`, `testIamPermissionsTransport` e `restTransportCompleted`. Em sucesso: `true`, `false`, `true`, `true`, `true`, `"official-rest"` e `true`. **Nunca registrar o token nem fingerprint do token.**
- **Formulação precisa das proibições:** onde se lê "zero token", entenda-se zero token da conta de serviço, zero impersonação, zero ID token, zero ADC, zero chave e zero token persistido — com o access token temporário do operador humano como única exceção. Preservados zero token emitido em nome da futura conta, zero binding criada pelo fluxo e zero janela de ACTIVATION iniciada. A classificação operacional específica foi ajustada na mesma direção, sem ampliar escopo.

### Preservações e limites

- Preservados sem alteração: escopo de recurso do `testIamPermissions`; permissões pré-mutação; verificações após o custom role; `projects.serviceAccounts.testIamPermissions` só após a criação da conta; ancestralidade; policies hierárquicas; `group:` e `domain:` sob fail-closed; principal sets; expansão dos papéis; atributos completos na criação; stage `GA`; ordem custom role → service account; polling somente leitura; escopo comprovável Firestore/Datastore; escopo global entre serviços não avaliado; zero bindings; zero ADC, impersonação e chave; rollback sem exclusão automática; classificação operacional específica; e a arquitetura PROVISION/ACTIVATION/INVENTORY/REVOKE.
- **Nenhum novo bloqueio e nenhuma decisão humana aberta.** A exceção do token humano não conflita com nenhuma decisão anterior: as sete decisões de autenticação tratam de credenciais **da conta de serviço** — sem chave JSON, sem ADC de serviço, impersonação apenas na ACTIVATION —, e nenhuma delas proíbe o operador humano de usar a própria credencial já autorizada, que é exatamente o que os comandos gcloud aprovados deste bloco já fariam.
- Esta entrada altera exclusivamente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`. Não houve autenticação, obtenção de access token, acesso remoto a Google Cloud ou Firebase, comando gcloud remoto, custom role, conta de serviço, binding, ADC, chave, API habilitada, inventário, migração, alteração de ferramenta, runtime ou metadata, atualização da data/hora pública, deploy, publicação, staging, commit ou push. Nenhum bloco posterior foi iniciado.

---

## 2026-08-02 — Escopo de recurso das permissões do ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP

**Ferramenta/modelo:** Claude Opus 5 (Claude Code)

**Status:** `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-RESOURCE-PERMISSIONS-FINALIZATION` concluído exclusivamente como atualização documental, a partir do mesmo commit-base `b58541d21ba70424870fe16650a50ea9b8e09fe7`. Corrige o escopo de recurso usado em `testIamPermissions` e impede que o EXEC declare, antes da criação, permissões específicas de recursos que ainda não existem. Parecer **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC** **mantido**.

### Correção factual central — escopo de recurso

- `testIamPermissions` testa as permissões que o chamador possui **sobre o recurso fornecido à operação**. Logo: `projects.testIamPermissions` testa sobre o projeto; `folders.testIamPermissions` sobre a pasta; `organizations.testIamPermissions` sobre a organização; `projects.serviceAccounts.testIamPermissions` sobre uma conta de serviço específica.
- **Não se pode assumir** que uma permissão cujo método é autorizado sobre um recurso filho será validada corretamente por `projects.testIamPermissions` apenas porque o papel do operador foi concedido no projeto. A herança de policy e o escopo de teste do método são coisas distintas, e a segunda não está documentada como equivalente à primeira.
- **Afirmação anterior retirada.** A entrada precedente declarava que `iam.serviceAccounts.getIamPolicy` poderia ser testada no projeto por a conta ainda não existir. Isso era uma inferência minha, não um fato documentado, e foi removida. Ficam igualmente proibidas as afirmações de que `iam.serviceAccountKeys.list`, `iam.serviceAccounts.get` e `iam.roles.get` seriam integralmente comprováveis antes de o recurso correspondente existir.

### Gate pré-mutação — somente o aplicável ao projeto e aos ancestrais

- **Projeto:** `iam.roles.create`, `iam.roles.list`, `iam.serviceAccounts.create`, `iam.serviceAccounts.list`, `resourcemanager.projects.get`, `resourcemanager.projects.getIamPolicy` e `serviceusage.services.list`.
- **Pasta ancestral, no recurso pasta:** `resourcemanager.folders.getIamPolicy`. **Organização, no recurso organização:** `resourcemanager.organizations.getIamPolicy`.
- Sem wildcard; sem inferir permissões pelo nome do papel; resposta parcial não equivale a aprovação integral. Ausência produz **`operatorProjectPermissionMissing`** e interrompe antes da criação do custom role. Demais gates aprovados permanecem inalterados.

### Permissões dependentes de recurso

- **`iam.roles.get`** é autorizada sobre o recurso **do papel específico**, inexistente antes da primeira mutação. Portanto: não declarar comprovada antecipadamente pelo gate do projeto; **não inventar método `roles.testIamPermissions`**; criar o papel após todos os gates pré-mutação possíveis; e validá-lo imediatamente pela descrição somente leitura, sem repetir a criação. Falha por `PERMISSION_DENIED` → **`operatorCustomRolePermissionMismatch`**: preservar o papel, não excluir, não repetir, **não criar a service account** e aguardar decisão humana.
- **`iam.serviceAccounts.get`, `iam.serviceAccounts.getIamPolicy` e `iam.serviceAccountKeys.list`** passam a ser testadas por `projects.serviceAccounts.testIamPermissions` **no recurso exato da conta**, após sua criação e visibilidade, usando o identificador numérico devolvido pela criação quando isso aumentar a confiabilidade da identificação imediatamente posterior. **Somente depois desse teste** a conta é descrita, a policy anexada é lida e as chaves `USER_MANAGED` são listadas. Permissão ausente → **`operatorServiceAccountPermissionMismatch`**: preservar a conta, não excluir, não conceder acesso adicional, não repetir, não prosseguir e aguardar decisão humana. `PERMISSION_DENIED` nunca é tratado como inexistência.

### Três estados distintos, nunca colapsados

- **(A)** permissões pré-mutação de projeto e ancestrais — `operatorPreMutationPermissionsComplete`. **(B)** verificação do custom role criado — `operatorCustomRoleVerificationPermissionConfirmed`. **(C)** permissões sobre a service account criada — `operatorServiceAccountResourcePermissionsComplete`.
- `operatorPermissionsComplete` deixa de significar "tudo comprovado antes da primeira mutação" e sobrevive **apenas como resultado agregado final**: `true` somente após gates pré-mutação aprovados, papel descrito e validado, permissões testadas no recurso da própria conta e todas as verificações posteriores concluídas. **Nunca pode ser `true` antes da criação dos dois recursos.**
- **Risco de falha parcial explicitamente registrado e aceito:** como as permissões específicas de recurso só podem ser testadas depois que o recurso existe, é possível criar o papel — ou o papel e a conta — e só então descobrir que falta permissão de verificação. O contrato responde preservando o recurso, interrompendo e escalando; jamais excluindo, concedendo permissão ou repetindo a mutação.

### Relatório sanitizado e limites

- Allowlist do operador atualizada para `operatorPreMutationRequiredPermissionsCount`, `operatorPreMutationGrantedPermissionsCount`, `operatorPreMutationPermissionsComplete`, `operatorProjectPermissionMissing`, `operatorCustomRoleVerificationPermissionConfirmed`, `operatorCustomRolePermissionMismatch`, `operatorServiceAccountRequiredPermissionsCount`, `operatorServiceAccountGrantedPermissionsCount`, `operatorServiceAccountResourcePermissionsComplete`, `operatorServiceAccountPermissionMismatch`, `operatorPermissionsComplete`, `preMutationGatesCompleted`, `customRolePostCreateVerificationCompleted` e `serviceAccountPostCreateVerificationCompleted`. Nunca imprimir e-mail, projectId, nome completo de recurso, permissões extras, papéis integrais, policies, tokens, chave ou ADC: somente contagens, booleanos e categorias sanitizadas.
- Preservados sem alteração: permissões de criação; tratamento fail-closed; ancestralidade; policies hierárquicas; `group:` e `domain:`; principal sets; expansão dos papéis; atributos completos dos dois recursos; stage `GA`; ordem custom role → service account; escopo comprovável Firestore/Datastore; escopo global entre serviços não avaliado; gates anteriores à mutação; verificações posteriores; polling somente leitura; zero bindings; zero ADC, token e chave; rollback sem exclusão automática; classificação operacional específica; e a arquitetura PROVISION/ACTIVATION/INVENTORY/REVOKE.
- **Nenhum novo bloqueio e nenhuma decisão humana aberta.** A impossibilidade de comprovar antecipadamente permissões de recursos inexistentes não conflita com nenhuma decisão institucional anterior: nenhuma delas exigiu comprovação prévia integral, e o desfecho de uma falha tardia é sempre parada segura com recurso preservado.
- Esta entrada altera exclusivamente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`. Não houve autenticação, acesso remoto a Google Cloud ou Firebase, comando gcloud remoto, custom role, conta de serviço, binding, ADC, token, chave, API habilitada, inventário, migração, alteração de ferramenta, runtime ou metadata, atualização da data/hora pública, deploy, publicação, staging, commit ou push. Nenhum bloco posterior foi iniciado.

---

## 2026-08-02 — Permissões do operador do ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP

**Ferramenta/modelo:** Claude Opus 5 (Claude Code)

**Status:** `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-OPERATOR-PERMISSIONS-FINALIZATION` concluído exclusivamente como atualização documental, a partir do mesmo commit-base `b58541d21ba70424870fe16650a50ea9b8e09fe7`. Incorpora as permissões de criação e leitura ausentes do contrato do operador e corrige a distinção entre gates pré-mutação e verificações só possíveis após a criação. Parecer **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC** **mantido**.

### Correção 1 — permissões de criação e leitura ausentes

- O contrato consolidado do operador **omitia as duas permissões sem as quais o EXEC não pode sequer executar**: `iam.roles.create` e `iam.serviceAccounts.create`. Um bloco cuja única finalidade é criar dois recursos não pode ter as permissões de criação fora da lista fechada.
- Lista fechada agora registrada — **criação:** `iam.roles.create`, `iam.serviceAccounts.create`; **leitura do papel:** `iam.roles.get`, `iam.roles.list`; **leitura da conta:** `iam.serviceAccounts.get`, `iam.serviceAccounts.list`; **auditoria de chaves:** `iam.serviceAccountKeys.list`; **policy da conta:** `iam.serviceAccounts.getIamPolicy`; **APIs:** `serviceusage.services.list`; **Resource Manager:** `resourcemanager.projects.get`, `resourcemanager.projects.getIamPolicy`, mais `resourcemanager.folders.getIamPolicy` quando houver pasta ancestral e `resourcemanager.organizations.getIamPolicy` quando houver organização.
- Registrado explicitamente que **permissões de leitura não autorizam criação**: `iam.roles.get`/`list` não substituem `iam.roles.create`, e `iam.serviceAccounts.get`/`list` não substituem `iam.serviceAccounts.create`. Não presumir Owner, Editor ou papel básico; nenhuma permissão é concedida neste fluxo.

### Correção 2 — gate pré-mutação de permissões do operador

- Antes da primeira mutação, o EXEC deverá comprovar **todas** as permissões necessárias **nos recursos aplicáveis**, por `projects.testIamPermissions`, `folders.testIamPermissions`, `organizations.testIamPermissions` ou método `testIamPermissions` específico do recurso.
- A documentação oficial confirma que o método "retorna as permissões que um chamador tem sobre o projeto especificado" e que **wildcards não são permitidos** na requisição — coerente com a proibição de wildcard já adotada.
- **Reconciliação com a ressalva anterior do PREP.** O registro anterior classificava `testIamPermissions` como verificação apenas suplementar, por ser oficialmente destinado a GUIs de terceiros. Essa ressalva vale para tentar comprovar o acesso de **outro** principal — a futura conta de serviço —, e permanece íntegra. Aqui o uso é diferente e restrito: as permissões **do próprio chamador**, que é exatamente o que o método retorna. Ele não substitui, e não é usado para, a análise das allow policies quanto à conta futura.
- Gate do projeto com ao menos `iam.roles.create`, `iam.roles.get`, `iam.roles.list`, `iam.serviceAccounts.create`, `iam.serviceAccounts.get`, `iam.serviceAccounts.list`, `iam.serviceAccountKeys.list`, `resourcemanager.projects.get`, `resourcemanager.projects.getIamPolicy` e `serviceusage.services.list`. Pasta e organização comprovadas **nos recursos corretos**.
- Esta entrada afirmou que **`iam.serviceAccounts.getIamPolicy` seria verificada no nível do projeto** por a conta ainda não existir. **Isso foi corrigido no mesmo dia pelo `PROVISION-PREP-RESOURCE-PERMISSIONS-FINALIZATION`:** `testIamPermissions` testa as permissões do chamador **sobre o recurso fornecido à operação**, e não se pode presumir que uma permissão de recurso filho seja validada corretamente no projeto apenas por o papel ter sido concedido nesse nível. Essa permissão — e também `iam.serviceAccounts.get`, `iam.serviceAccountKeys.list` e `iam.roles.get` — saiu do gate pré-mutação; ver a entrada seguinte.
- Sem wildcard; sem inferir permissão pelo nome do papel do operador; sem tratar resposta parcial como aprovação integral. Ausência de qualquer permissão obrigatória produz **`operatorPermissionMissing` e interrompe antes da criação do custom role**, sem conceder permissão automaticamente, sem solicitar Owner ou Editor e **sem mutação exploratória para descobrir se o operador tem permissão**.
- Direção de falha registrada honestamente: o gate é fail-closed no sentido seguro — resultado insuficiente interrompe. Se o resultado for otimista e a criação ainda assim falhar na API, o desfecho é falha limpa tratada pelo caminho pós-criação, nunca ação insegura silenciosa.

### Correção 3 — gates pré-mutação × verificações pós-criação

- Removida a formulação absoluta de que **todas** as verificações remotas ocorreriam antes da primeira mutação. Ela é falsa: descrever o papel criado, ler a policy anexada à conta e listar as chaves da conta **exigem que o recurso exista**.
- Contrato preciso: todas as verificações de operador, APIs, ancestralidade, policies, permissões, expansão de papéis e colisões **tecnicamente possíveis** ocorrem antes da primeira mutação; as demais ocorrem **imediatamente após a criação correspondente, sem repetir a mutação**.
- **(A) Gates pré-mutação:** identidade ativa do operador; fingerprint do projeto; permissões do operador; estado das APIs; ancestralidade; leitura integral das policies; bindings condicionais; expansão dos papéis; `group:`; `domain:`; principal sets; colisão do custom role; colisão da conta; e suporte das duas permissões em custom roles.
- **(B) Após o custom role:** descrever o papel; confirmar ID, title, description, stage e exatamente as duas permissões; confirmar que o comando não criou binding; nunca repetir a criação. **A conta só é criada depois de o papel ser integralmente validado.**
- **(C) Após a conta e o polling somente leitura:** descrever a conta; confirmar account ID, display name, description e enabled/disabled; ler a IAM policy anexada e confirmar zero binding; listar somente chaves `USER_MANAGED` e confirmar `userManagedKeyCount == 0`; nunca repetir a criação.
- **Falha de permissão pós-criação:** não repetir a criação; classificar falha parcial; preservar o recurso; não excluir; não conceder permissão adicional; não prosseguir ao recurso seguinte com a validação do primeiro incompleta; relatar `operatorPermissionMismatch`; aguardar decisão humana. `PERMISSION_DENIED` **nunca** será reclassificado como recurso inexistente.

### Relatório sanitizado e limites

- Acrescentados à allowlist desta etapa: `operatorRequiredPermissionsCount`, `operatorGrantedPermissionsCount`, `operatorPermissionsComplete`, `operatorPermissionMissing`, `operatorPermissionMismatch`, `preMutationGatesCompleted`, `customRolePostCreateVerificationCompleted` e `serviceAccountPostCreateVerificationCompleted`. **Os cinco primeiros nomes foram substituídos no mesmo dia pelo `PROVISION-PREP-RESOURCE-PERMISSIONS-FINALIZATION`, que separou pré-mutação, custom role e service account em campos próprios; a allowlist vigente é a da entrada seguinte.** Emitem apenas contagens, booleanos e categorias sanitizadas — nunca permissões extras não relacionadas, papéis completos do operador, e-mail, projectId, policies ou principal real.
- Preservados sem alteração: atributos completos e descrições aprovadas dos dois recursos; stage `GA`; as duas permissões do papel; fail-closed de `group:` e `domain:`; ancestralidade e policies hierárquicas; principal sets; expansão dos papéis; escopo comprovável Firestore/Datastore; escopo global entre serviços não avaliado; `noApplicableFirestoreDatastoreGrantDetected`; `noApplicableImpersonationGrantDetected`; zero bindings; zero ADC, token e chave; ordem custom role → service account; colisões; polling somente leitura; rollback sem exclusão automática; classificação operacional específica; e a arquitetura PROVISION/ACTIVATION/INVENTORY/REVOKE.
- **Nenhum novo bloqueio e nenhuma decisão humana aberta.** As permissões exigidas são comprováveis antecipadamente pelo gate, e a única incerteza remanescente — um resultado otimista do gate — resolve-se por falha limpa da API, sem ação insegura.
- Esta entrada altera exclusivamente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`. Não houve autenticação, acesso remoto a Google Cloud ou Firebase, comando gcloud remoto, custom role, conta de serviço, binding, ADC, token, chave, API habilitada, inventário, migração, alteração de ferramenta, runtime ou metadata, atualização da data/hora pública, deploy, publicação, staging, commit ou push. Nenhum bloco posterior foi iniciado.

---

## 2026-08-02 — Finalização do prompt do ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP

**Ferramenta/modelo:** Claude Opus 5 (Claude Code)

**Status:** `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-PROMPT-FINALIZATION` concluído exclusivamente como atualização documental, a partir do mesmo commit-base `b58541d21ba70424870fe16650a50ea9b8e09fe7`. Corrige três inconsistências do prompt-ready do futuro EXEC: atributos incompletos na criação, classificação de sucesso ampla demais e nomes de campos que sugeriam testes remotos de negação. Parecer **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC** **mantido**.

### Correção 1 — atributos completos no ato da criação

- O prompt-ready anterior citava os identificadores mas **omitia as descrições aprovadas** no momento da criação, o que produziria recursos incompletos e divergentes do contrato já validado quanto a limites UTF-8.
- **Custom role:** role ID `adminB2A5InventoryRead`; title `ADMIN B2A5 Inventory Read`; description `Read-only Firestore entity permissions reserved for the approved ADMIN-B2A5 inventory activation window. Do not bind outside the authorized workflow.`; stage `GA`; permissões exclusivamente `datastore.entities.get` e `datastore.entities.list`.
- **Service account:** account ID `admin-b2a5-inventory-reader`; display name `ADMIN B2A5 Inventory Reader`; description `Dedicated keyless identity for the approved ADMIN-B2A5 Firestore inventory. Access bindings are applied only during an authorized activation window.`.
- Confirmado: nenhuma descrição contém projectId, operador, data real ou informação pessoal, e os limites já documentados permanecem respeitados — role title 25 bytes de 100, role description 149 de 300, display name 27 de 100 e description da conta 148 de 256.
- Os atributos passam a ser **exigidos por flags estáveis nos próprios comandos** — `--title`, `--description`, `--permissions`, `--stage` no papel; `--display-name` e `--description` na conta —, sem arquivo YAML ou JSON temporário quando as flags diretas bastarem. `--project` e `--account` sempre explícitos, com valores só em memória, nunca impressos, sem configuração persistente e sem repetir criação de resultado ambíguo.

### Correção 2 — classificação operacional específica

- Removida a classificação ampla **"A. PROVISIONAMENTO CONCLUÍDO SEM ACESSO"**, incompatível com o escopo delimitado horas antes pelo `SCOPE-CORRECTION`.
- Substituída por **"A. PROVISIONAMENTO CONCLUÍDO SEM ACESSO FIRESTORE/DATASTORE, SEM CAPACIDADE DE IMPERSONAÇÃO E SEM BINDINGS CRIADAS"**, exigindo cumulativamente: ausência de grants Firestore/Datastore aplicáveis nas policies examinadas; ausência de grants aplicáveis de impersonação, Token Creator, Service Account User e gerenciamento de chaves; zero user-managed keys; zero ADC; zero token; zero binding criada pelo bloco; e limites de escopo registrados.
- Continua proibido afirmar zero acesso global, ausência total de acesso Storage, ausência de acesso em todo recurso descendente ou ausência de acesso a todos os serviços do projeto. Preservados `globalCrossServiceAccessNotEvaluated`, `descendantPoliciesNotInventoried` e `storageAclsNotEvaluated`.

### Correção 3 — campos de resultado renomeados

- `firestoreDatastoreAccessDenied` → **`noApplicableFirestoreDatastoreGrantDetected`**; `impersonationCapabilityDenied` → **`noApplicableImpersonationGrantDetected`**.
- Motivo material: o sufixo `Denied` sugere tentativa real contra o serviço e resposta de negação. **Isso não ocorrerá.** O fluxo não executa chamada Firestore, não gera token, não impersona e não tenta usar a conta; a conclusão deriva **exclusivamente** da análise das allow policies e das bindings da conta.
- `noApplicableFirestoreDatastoreGrantDetected` é `true` somente quando a análise fail-closed de **todas** as policies hierárquicas legíveis e aplicáveis não encontrar grant Firestore/Datastore relevante para a futura identidade, principal sets, `group:`, `domain:`, `allUsers` ou `allAuthenticatedUsers`.
- `noApplicableImpersonationGrantDetected` é `true` somente quando a mesma análise não encontrar grant aplicável de `iam.serviceAccounts.getAccessToken`, `iam.serviceAccounts.getOpenIdToken`, `iam.serviceAccounts.signBlob`, `iam.serviceAccounts.signJwt`, Service Account Token Creator, Service Account User, gerenciamento ou criação de chaves, ou outra permissão de representação prevista no contrato.
- Nenhum dos dois pode ser descrito como resultado de teste remoto de negação. Os nomes antigos ficam proibidos em documentos, relatório e prompt.

### Allowlist final e limites

- Allowlist do relatório sanitizado: `ancestryClass`, `ancestorPoliciesReadCount`, `conditionalBindingsVerified`, `groupBindingsCount`, `domainBindingsCount`, `relevantGroupBindingsCount`, `relevantDomainBindingsCount`, `indirectMembershipRisk`, `rolePermissionsResolved`, `noApplicableFirestoreDatastoreGrantDetected`, `noApplicableImpersonationGrantDetected`, `bindingsCreatedByThisBlock`, `userManagedKeyCount`, `customRoleCreated`, `serviceAccountCreated`, `iamApiEnabled`, `serviceAccountCredentialsApiState`, `globalCrossServiceAccessNotEvaluated`, `descendantPoliciesNotInventoried` e `storageAclsNotEvaluated`. Nenhum campo poderá declarar `accessDenied` por teste remoto, zero acesso global, ausência global de Storage ou ausência de acesso em todo recurso descendente.
- Preservados sem alteração: tratamento fail-closed de `group:` e `domain:`; distinção entre Workspace e principal IAM; limites da análise hierárquica; zero acesso Firestore/Datastore; zero capacidade de impersonação; zero binding criada pelo fluxo; escopo global entre serviços explicitamente não avaliado; principal sets; ancestralidade; expansão de papéis; `conditionalBindingsUnverified`; `indirectMembershipRisk`; `rolePermissionsUnresolved`; stage `GA`; ordem custom role → service account; colisões; polling somente leitura; zero user-managed keys; rollback sem exclusão automática; e a arquitetura PROVISION/ACTIVATION/INVENTORY/REVOKE.
- **Nenhum novo bloqueio identificado e nenhuma decisão humana aberta**; os três ajustes são de precisão contratual e semântica, e nenhum deles reabre decisão anterior, amplia permissão, estende janela ou altera escopo aprovado. `PROVISION-GOVERNANCE` permanece bloco posterior separado.
- Esta entrada altera exclusivamente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`. Não houve autenticação, acesso remoto a Google Cloud ou Firebase, comando gcloud remoto, custom role, conta de serviço, binding, ADC, token, chave, API habilitada, inventário, migração, alteração de ferramenta, runtime ou metadata, atualização da data/hora pública, deploy, publicação, staging, commit ou push. Nenhum bloco posterior foi iniciado.

---

## 2026-08-02 — Correção de escopo do ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP

**Ferramenta/modelo:** Claude Opus 5 (Claude Code)

**Status:** `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-SCOPE-CORRECTION` concluído exclusivamente como atualização documental, a partir do mesmo commit-base `b58541d21ba70424870fe16650a50ea9b8e09fe7`. Corrige o tratamento de `domain:` e delimita a prova de ausência de acesso ao escopo tecnicamente comprovável. Parecer **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC** **mantido**.

### Correção 1 — `domain:` não pode ser declarado inofensivo

- A entrada anterior afirmava, com base na documentação de contas de serviço, que `domain:` seria varredura apenas de defesa em profundidade porque "contas de serviço não pertencem ao domínio do Workspace". **Essa formulação categórica foi removida: ela transportava para a avaliação de allow policies do IAM uma regra que pertence a outro contexto.**
- Distinção agora registrada: (1) a documentação de contas de serviço trata do **compartilhamento de recursos do Google Workspace** — ativos compartilhados com todo o domínio não alcançam contas de serviço; (2) a documentação de principais do IAM descreve o principal de domínio como o conjunto de **"todas as identidades em todos os domínios, incluindo subdomínios, associados ao customer ID"**, avaliado pelo customer ID e não pelo nome do domínio, **sem excluir explicitamente contas de serviço**. As duas afirmações não são intercambiáveis, e a regra do Workspace **não prova** o comportamento do IAM.
- Contrato conservador adotado para allow policies: `domain:` **pode** representar risco de acesso indireto; recebe o **mesmo fail-closed de `group:`**; não se infere ausência de associação; qualquer `domain:` com papel relevante ou perigoso **interrompe antes da criação**. Proibido resolver a discrepância criando a conta, habilitar Cloud Identity ou outra API para dirimi-la e aceitar o risco silenciosamente. A governança **não** afirma que `domain:` alcança contas de serviço, e também **não** afirma o contrário.

### Correção 2 — limite da análise hierárquica

- Policies de organização, pasta e projeto **não incluem necessariamente** policies anexadas diretamente a recursos descendentes. O Cloud Storage, por exemplo, admite IAM policy em bucket, IAM policy em managed folder e ACLs de bucket ou objeto conforme a configuração; nenhuma dessas concessões aparece integralmente na leitura da policy do projeto.
- Sem Policy Analyzer, Cloud Asset API, inventário dos recursos e policies descendentes e análise das ACLs aplicáveis — **nenhum deles habilitado ou iniciado neste fluxo** — não é possível comprovar ausência global de acesso ao Storage ou a todos os serviços. A afirmação anterior, de escopo amplo, era tecnicamente insustentável.

### Escopo comprovável obrigatório do PROVISION-EXEC

- **A. Zero acesso Firestore/Datastore.** Comprovar, pelas allow policies de organização, pastas e projeto, a ausência de `datastore.entities.get`, `list`, `create`, `update`, `delete`, `allocateIds` e de qualquer outro grant Firestore/Datastore capaz de conceder acesso aos dados, considerando identidade individual, principal sets, `allUsers`, `allAuthenticatedUsers`, `group:`, `domain:`, bindings condicionais, papéis predefinidos e custom roles de projeto e de organização. Integralmente comprovável porque o Firestore concede esses papéis **no nível do projeto**, com acesso por database delimitado por IAM Conditions na própria policy do projeto.
- **B. Zero capacidade de representação ou credencial.** Nenhuma chave `USER_MANAGED`; nenhuma binding Token Creator na própria conta; nenhuma binding Service Account User na própria conta; nenhuma binding aplicável em organização, pastas ou projeto que conceda criação de tokens, impersonação ou gerenciamento de chaves; nenhum ADC criado; nenhum token gerado; nenhuma chave criada.
- **C. Zero binding criada pelo fluxo.** Custom role sem binding criada pelo bloco; conta sem papel criado pelo bloco; nenhuma allow policy alterada; nenhum `setIamPolicy`; nenhum `add-iam-policy-binding`; nenhuma policy de recurso modificada.

### Escopo explicitamente não comprovado

- O PROVISION-EXEC **não** comprova ausência global de acesso a todos os buckets, managed folders, objetos e ACLs do Storage, a todos os recursos com allow policies próprias, a todos os serviços do Google Cloud, nem a policies anexadas a recursos descendentes não inventariados.
- O relatório poderá declarar somente que **nenhum grant Storage/Auth/IAM perigoso foi identificado nas policies hierárquicas examinadas**, registrando que isso **não é prova global**, que nenhuma policy descendente foi inventariada, que nenhuma ACL foi consultada e que nenhuma chamada de serviço foi usada para testar acesso.
- Removidas as expressões "zero acesso global", "ausência de qualquer acesso Storage", "prova completa para todos os serviços" e "nenhuma capacidade em qualquer recurso do projeto". A etapa foi renomeada de "ZERO ACESSO EFETIVO" para **"ZERO ACESSO FIRESTORE/DATASTORE E ZERO CAPACIDADE DE IMPERSONAÇÃO"**.

### Decisão de escopo, risco residual e Policy Analyzer

- Decisão adotada: o provisionamento exige prova fail-closed **apenas** de (A), (B) e (C). Prova global não é necessária ao inventário Firestore e exigiria infraestrutura e permissões adicionais. A análise de papéis perigosos nas policies hierárquicas permanece **gate conservador e observação**, jamais prova global.
- **Sem conflito com decisão humana anterior.** As sete decisões do AUTH-PREP tratam de permissões do papel, identidade, operador, janela, `--max-docs`, audit logs e ciclo de vida da conta; **nenhuma** exigiu prova de zero acesso global. A decisão humana 1 aceitou formalmente o risco **database-wide** com sete controles compensatórios, o que é compatível com esta delimitação. A expressão ampla anterior era formulação própria do PREP, não requisito institucional — por isso a classificação permanece **A** e nenhuma nova decisão humana é aberta.
- **Risco residual registrado:** uma policy ou ACL anexada diretamente a um recurso descendente de outro serviço poderia abranger a conta por grupo, domínio ou principal set sem aparecer na análise hierárquica atual. **Mitigações:** conta criada exclusivamente para o inventário; nenhuma credencial; nenhuma impersonação; nenhuma binding Token Creator; nenhuma chave; nenhuma aplicação usa a conta; nenhuma operação de outro serviço será executada; conta desabilitada após o inventário; qualquer ampliação da prova exigirá bloco próprio.
- **Policy Analyzer:** é a ferramenta apropriada para analisar quais principais possuem quais acessos em recursos descendentes, tratando também expansão de grupos e papéis, mas usa a Cloud Asset API, que **não será habilitada neste fluxo**; portanto **não será utilizado no PROVISION-EXEC**. Uma análise global futura exige PREP e autorização próprios e **não** é dependência do inventário Firestore atual.

### Preservado e limites

- Preservados sem alteração: permissões condicionais de projeto, pasta e organização; estratégia e comandos de ancestralidade; leitura separada por nível; `conditionalBindingsUnverified`; tratamento fail-closed de `group:`; principal sets; expansão obrigatória dos papéis; `indirectMembershipRisk`; `rolePermissionsUnresolved`; stage `GA`; ordem custom role → conta de serviço; política de colisão; polling somente leitura; zero user-managed keys; rollback sem exclusão automática; as sete decisões humanas anteriores; e a arquitetura PROVISION/ACTIVATION/INVENTORY/REVOKE.
- Campos sanitizados do relatório atualizados para incluir `globalCrossServiceAccessNotEvaluated`, `descendantPoliciesNotInventoried` e `storageAclsNotEvaluated`, com remoção de qualquer campo que afirme zero acesso global. Esta entrada propôs também `firestoreDatastoreAccessDenied` e `impersonationCapabilityDenied`, **ambos substituídos no mesmo dia pelo `PROVISION-PREP-PROMPT-FINALIZATION`** por `noApplicableFirestoreDatastoreGrantDetected` e `noApplicableImpersonationGrantDetected`, porque o sufixo `Denied` sugeria um teste remoto de negação que não ocorrerá; ver a entrada seguinte. `PROVISION-GOVERNANCE` permanece bloco posterior separado.
- Esta entrada altera exclusivamente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`. Não houve autenticação, acesso remoto a Google Cloud ou Firebase, comando gcloud remoto, custom role, conta de serviço, binding, ADC, token, chave, API habilitada, inventário, migração, alteração de ferramenta, runtime ou metadata, atualização da data/hora pública, deploy, publicação, staging, commit ou push. Nenhum bloco posterior foi iniciado.

---

## 2026-07-31 — Correções finais do ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP

**Ferramenta/modelo:** Claude Opus 5 (Claude Code)

**Status:** `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-FINAL-CORRECTIONS` concluído exclusivamente como atualização documental, a partir do mesmo commit-base `b58541d21ba70424870fe16650a50ea9b8e09fe7`. Fecha duas lacunas bloqueantes do contrato fail-closed e **mantém** o parecer **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC**.

### Correção bloqueante 1 — permissões das policies ancestrais

- O contrato fail-closed exige ler as allow policies do projeto, de todas as pastas ancestrais e da organização, mas a lista de permissões do operador continha apenas `resourcemanager.projects.getIamPolicy`. **`resourcemanager.projects.getIamPolicy` não autoriza ler as policies das pastas nem da organização** — a lacuna tornaria o contrato inexequível justamente no caso que ele existe para cobrir.
- Passam a constar, condicionadas à existência do nível e **obrigatórias quando o nível existir**: `resourcemanager.folders.getIamPolicy` para cada pasta ancestral e `resourcemanager.organizations.getIamPolicy` para a organização. No projeto permanecem `resourcemanager.projects.get` e `resourcemanager.projects.getIamPolicy`, além de `iam.serviceAccounts.getIamPolicy` para a policy da própria conta.
- O EXEC deverá resolver a ancestralidade antes da primeira mutação, determinar quais permissões condicionais são necessárias conforme os níveis encontrados, comprová-las nos recursos corretos e interromper antes da criação se qualquer uma faltar. Não conceder novas permissões ao operador, não presumir Owner, Editor ou administrador da organização e não tratar `PERMISSION_DENIED` como policy ausente.

### Estratégia de ancestralidade e comandos escolhidos

- `gcloud projects get-ancestors` (estável) resolve a hierarquia e fornece a **lista autoritativa dos níveis que obrigatoriamente deverão ser lidos**, servindo de referência contra a qual a completude é conferida.
- A leitura das policies será feita por **comandos separados e por nível** — `gcloud projects get-iam-policy`, `gcloud resource-manager folders get-iam-policy` e `gcloud organizations get-iam-policy` —, porque só assim cada leitura é individualmente comprovável.
- `gcloud projects get-ancestors-iam-policy` é comando **estável** e retorna as policies do projeto e de seus ancestrais, mas a documentação **não** define seu comportamento em sucesso parcial, **não** lista as permissões exigidas e **não** expõe flag de policy version. Por isso é adotado apenas como **conferência cruzada**, nunca como fonte única da prova. Não usar variantes `alpha` ou `beta` havendo comando estável equivalente.
- Requisitos da leitura: capturar em memória, não imprimir saída bruta, não persistir policy em arquivo. **Bindings condicionais não podem ser omitidas** — como `gcloud projects get-iam-policy` não documenta flag de policy version, o EXEC deverá confirmar o mecanismo no `--help` da CLI instalada, **sem inventar flag**, e verificar que a estrutura retornada expõe o campo `condition`; não sendo comprovável, parar sob `conditionalBindingsUnverified`.
- Sucesso parcial nunca representa leitura integral: ancestral ausente da resposta esperada é `ancestryIncomplete`; erro de permissão é `ancestorPolicyUnreadable`. Ambos interrompem antes da primeira mutação.

### Correção bloqueante 2 — grupos e domínios

- O registro anterior afirmava que bindings `group:` e `domain:` não alcançariam uma conta nova. **Isso estava incorreto quanto a grupos.** Contas de serviço **podem ser membros de Google Groups**, e a documentação oficial confirma a prática ao recomendar principal sets de contas de serviço "em vez de usar grupos personalizados" para conceder papéis a todas as contas de um projeto, pasta ou organização. Logo, uma binding `group:` **pode** produzir acesso indireto, e a ausência do e-mail individual — ou de principal set — **não** exclui acesso.
- Quanto a `domain:`, esta entrada registrou que a documentação afirmaria o oposto — "contas de serviço não pertencem ao seu domínio do Google Workspace" e ativos compartilhados com todo o domínio "não são compartilhados com contas de serviço" —, mantendo `domain:` na varredura apenas como defesa em profundidade. **Esta formulação foi superada em 2026-08-02 pelo `PROVISION-PREP-SCOPE-CORRECTION`:** aquela regra pertence ao contexto de compartilhamento do Workspace e não descreve a avaliação de allow policies do IAM, cuja documentação define o principal de domínio como "todas as identidades" associadas ao customer ID, sem excluir contas de serviço. `domain:` passou a receber o mesmo fail-closed de `group:`; ver a entrada de 2026-08-02.
- Principais adicionados à análise: `group:GROUP_PLACEHOLDER` e `domain:DOMAIN_PLACEHOLDER`, sem persistir ou imprimir grupos e domínios reais.

### Contrato fail-closed para associação indireta

- Em cada allow policy aplicável: localizar bindings cujo membro seja `group:` ou `domain:`; resolver o papel de cada uma — predefinido, custom role de projeto ou custom role de organização; determinar se contém qualquer permissão relevante ou perigosa, incluindo ao menos `datastore.entities.get`, `datastore.entities.list`, qualquer escrita Firestore/Datastore, Storage, Firebase Auth, alteração de IAM, geração ou gerenciamento de chaves, geração de tokens, impersonação, Service Account User e administração do projeto.
- Havendo qualquer uma: **interromper antes da criação de qualquer recurso** e classificar como `indirectMembershipRisk`. Proibido descobrir a associação criando a conta, aceitar o risco, encaminhar a verificação ao `ACTIVATION-PREP`, considerar grupo ou domínio seguro só porque o nome parece não ter relação com o projeto, habilitar Policy Troubleshooter ou Cloud Identity para resolver a dúvida e ampliar permissões do operador.
- Métricas sanitizadas emitidas: `groupBindingsCount`, `domainBindingsCount`, `relevantGroupBindingsCount`, `relevantDomainBindingsCount` e `indirectMembershipRisk`, mais hashes apenas quando estritamente necessário. Nunca nome de grupo, domínio, membros, policy integral ou resource names reais.

### Expansão obrigatória dos papéis

- O EXEC deverá, somente por leitura, descrever os papéis predefinidos relevantes, os custom roles de projeto e os custom roles de organização que aparecerem nas policies, capturando em memória apenas a lista de permissões necessária, sem imprimir descrições integrais e sem persistir resultado.
- **Não inferir permissões pelo nome do papel.** Papel inacessível, inexistente, `deleted`, `disabled`, ambíguo, não descritível ou com permissões não resolvidas produz parada antes da criação, sob `rolePermissionsUnresolved`.

### Prova de acesso e novas categorias de parada

- A prova passa a abranger conjuntamente, **nas policies hierárquicas de organização, pastas e projeto**: identidade individual futura; principal sets de contas de serviço do projeto, das pastas e da organização; `allUsers`; `allAuthenticatedUsers`; grupos; domínios; bindings condicionais; políticas diretas e herdadas; e as permissões efetivas dos papéis. **O alcance desta prova foi delimitado em 2026-08-02 pelo `PROVISION-PREP-SCOPE-CORRECTION` a zero acesso Firestore/Datastore, zero capacidade de impersonação/token/chave e zero binding criada pelo fluxo; não há prova global de ausência de acesso a Storage, ACLs ou recursos descendentes.**
- Somente allow policies concedem acesso; deny e PAB não substituem essa análise; ausência de binding direta não é prova suficiente; principal sets associam automaticamente; `group:` pode causar associação indireta; qualquer prova incompleta interrompe antes da criação; nenhuma chamada Firestore será usada para testar a negativa.
- Categorias de parada novas: `indirectMembershipRisk`, `rolePermissionsUnresolved` e `conditionalBindingsUnverified`, somadas às já existentes `PERMISSION_DENIED`, `inaccessible`, `ambiguous`, `ancestorPolicyUnreadable` e `ancestryIncomplete`.

### Classificação e risco operacional registrado

- Classificação mantida: **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC**. As permissões de projeto, pasta e organização estão incorporadas; a leitura integral das policies ancestrais está definida; `group:` e `domain:` estão abrangidos por fail-closed; a expansão dos papéis está definida; associação indireta não resolvida interrompe antes da criação; nenhuma API ou permissão adicional precisa ser habilitada ou concedida; e não resta decisão humana pendente.
- **Risco operacional honesto, não bloqueante da classificação:** o contrato é deliberadamente severo e é plausível que uma binding `group:` legítima e comum — por exemplo um grupo administrativo com papel amplo no projeto ou na organização — dispare `indirectMembershipRisk` e impeça o provisionamento. Isso é o comportamento desejado de uma política fail-closed, e o desfecho é uma **parada segura antes de qualquer mutação**, não uma falha. Se isso ocorrer, a saída não é relaxar a regra no EXEC, mas um novo bloco humano de análise dirigido àquela binding específica.
- Preservados sem alteração: correção dos limites de `displayName` e `description`, descrição corrigida do Policy Troubleshooter, decisão fail-closed, consulta integral da ancestralidade, parecer **B** histórico, stage `GA`, ordem papel-primeiro/conta-depois, 44 dias do role ID, 30 dias de recuperação da conta, bindings `deleted:` por até 60 dias, polling somente leitura, zero keys, zero bindings, rollback sem exclusão automática, as sete decisões humanas anteriores e a arquitetura PROVISION/ACTIVATION/INVENTORY/REVOKE.
- Esta entrada altera exclusivamente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`. Não houve autenticação, acesso remoto a Google Cloud ou Firebase, custom role, conta de serviço, binding, ADC, token, chave, API habilitada, inventário, migração, alteração de ferramenta, runtime ou metadata, atualização da data/hora pública, deploy, publicação, staging, commit ou push. Nenhum bloco posterior foi iniciado.

---

## 2026-07-31 — Decisão fail-closed do ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP

**Ferramenta/modelo:** Claude Opus 5 (Claude Code)

**Status:** `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-DECISION` concluído exclusivamente como atualização documental, a partir do mesmo commit-base `b58541d21ba70424870fe16650a50ea9b8e09fe7`. Incorpora a decisão humana final, corrige duas imprecisões factuais do PREP e eleva o parecer de **B** para **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC**. O parecer **B** permanece preservado como histórico na entrada seguinte.

### Correção factual 1 — limites dos campos da conta de serviço

- O PREP registrou que `displayName` e `description` da service account não tinham limite documentado. **Isso estava errado.** Os limites oficiais são `displayName` com no máximo **100 bytes UTF-8** e `description` com no máximo **256 bytes UTF-8**.
- Contagem real verificada dos quatro textos aprovados: role title 25 bytes de 100; role description 149 de 300; service account display name 27 de 100; service account description 148 de 256. Todos folgados, **nenhum texto precisou ser alterado**.
- Confirmado também que o account ID satisfaz a regex oficial `[a-z]([-a-z0-9]*[a-z0-9])`, além do intervalo de 6 a 30 caracteres já registrado.

### Correção factual 2 — descrição do Policy Troubleshooter

- Substituída a formulação absoluta "Policy Troubleshooter resolveria tudo" por descrição precisa: ele poderia avaliar, **para uma permissão e um recurso determinados**, as allow policies, deny policies e Principal Access Boundary policies relevantes àquela decisão IAM, inclusive herdadas e condicionais, e para um principal diferente do chamador.
- Registrado que é **adequado à prova IAM deste escopo Firestore**, mas **não deve ser descrito como ferramenta universal** e **não cobre mecanismos externos ao IAM**. Sua API `policytroubleshooter.googleapis.com` precisaria estar habilitada; nenhuma API será habilitada neste fluxo sem bloco próprio; e ele **não será usado no PROVISION-EXEC atual**.

### Decisão humana final — fail-closed

- Adotada a alternativa mais conservadora: **parar antes de criar qualquer recurso quando a ancestralidade IAM não puder ser integralmente verificada.** Foram descartadas as alternativas de conceder ao operador leitura nos níveis superiores e de aceitar formalmente o residual.
- O PROVISION-EXEC consultará a ancestralidade do projeto **somente por leitura e antes de qualquer mutação**, classificando-a em `project-only`, `project-and-folder`, `project-and-organization`, `project-folder-and-organization`, `inaccessible` ou `ambiguous`.
- Em `project-only`: analisar a allow policy do projeto, analisar a policy da própria conta depois da criação e aplicar os demais gates já aprovados.
- Havendo pasta ou organização: exigir leitura **bem-sucedida** das allow policies de **todos** os níveis — projeto, todas as pastas ancestrais e organização. Não considerar apenas a policy do projeto.
- Qualquer resultado `PERMISSION_DENIED`, `inaccessible`, `ambiguous`, `ancestorPolicyUnreadable` ou `ancestryIncomplete` **interrompe o PROVISION-EXEC antes da criação do custom role e da conta de serviço**.
- Proibições explícitas: não conceder ao operador novos acessos em pasta ou organização; não criar bloco automático para ampliar permissões do operador; não habilitar Policy Troubleshooter ou Cloud Asset API; não aceitar formalmente o risco de políticas ancestrais não verificadas; não escalar uma verificação incompleta ao `ACTIVATION-PREP`; não tratar ausência de permissão como ausência de policy; não usar tentativa de criação como mecanismo de descoberta.
- Consequência prática: como a parada ocorre **antes da primeira mutação**, o custo de um bloqueio é zero — nada foi criado, não há rollback a executar e nenhum identificador é consumido, preservando os 44 dias do role ID e os 30 dias de recuperação da conta.

### Análise das allow policies e prova de zero acesso

- Contrato preservado: analisar identidade exata da conta, principal sets de contas de serviço do projeto, das pastas ancestrais e da organização, `allUsers`, `allAuthenticatedUsers`, bindings diretas e herdadas e condições existentes. Qualquer binding aplicável encontrada interrompe o fluxo.
- Somente allow policies concedem acesso; deny policies somente restringem; PAB policies não concedem acesso isoladamente. A prova de ausência de concessão **depende da verificação integral das allow policies aplicáveis** — a ausência de uma binding direta não é prova suficiente. Um custom role não vinculado não concede acesso, mas uma conta nova **pode ser abrangida automaticamente por principal sets**. Nenhuma chamada Firestore será usada para testar a negativa.
- A verificação de deny e PAB permanece relevante no `ACTIVATION-PREP`, para identificar bloqueios que impeçam o inventário, mas **não substitui** a análise das allow policies neste provisionamento.
- Saída inalterada: somente categorias, contagens, hashes e booleanos sanitizados. Nunca projectId, project number, folder number, organization number, membros reais, policies integrais, e-mails ou principal sets completos.

### Classificação e limites

- Classificação final: **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-EXEC**. A política fail-closed elimina a única decisão humana pendente; nenhuma outra incerteza bloqueia o contrato; o EXEC pode parar antes da primeira criação quando a ancestralidade não for integralmente legível; nenhuma ampliação de permissão é necessária; e rollback, colisões, polling e sanitização permanecem definidos.
- Preservados sem alteração: os 44 dias de bloqueio do role ID, os 30 dias de recuperação da conta, as bindings `deleted:` por até 60 dias, o polling de 60 segundos ou mais com backoff, o stage `GA`, a ordem papel-primeiro/conta-depois, a política de colisão, zero user-managed keys, zero bindings, a saída sanitizada, o tratamento de falha parcial, o rollback sem exclusão automática, as sete decisões humanas anteriores e a ordem PROVISION/ACTIVATION/INVENTORY/REVOKE.
- O parecer **A** autoriza iniciar o PROVISION-EXEC mediante autorização de execução própria; não pré-valida nenhuma verificação remota, todas com parada definida.
- Esta entrada altera exclusivamente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`. Não houve autenticação, acesso a Google Cloud ou Firebase, gcloud remoto, custom role, conta de serviço, binding, ADC, token, chave, API habilitada, inventário, migração, alteração de ferramenta, runtime ou metadata, atualização da data/hora pública, deploy, publicação, staging, commit ou push. Nenhum bloco posterior foi iniciado.

---

## 2026-07-31 — Conclusão do ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP

**Ferramenta/modelo:** Claude Opus 5 (Claude Code)

**Status:** `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP` concluído exclusivamente como pesquisa em documentação oficial do Google Cloud, análise de segurança e atualização documental, a partir do commit-base `b58541d21ba70424870fe16650a50ea9b8e09fe7` (`docs: separar provisionamento e ativação do ADMIN-B2A5`). Parecer intermediário: **B. Pronto com decisão humana pendente** — o contrato operacional do provisionamento está completo e restava uma única decisão, descrita ao fim desta entrada. **Essa decisão foi resolvida na mesma data pelo `ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP-DECISION`, que adotou a política fail-closed, corrigiu duas imprecisões factuais desta entrada — os limites de `displayName`/`description` da conta e a descrição do Policy Troubleshooter — e elevou o parecer final a A; ver a entrada do bloco de decisão.** O parecer **B** permanece preservado aqui como histórico.

### Pesquisa oficial consultada

- *Create service accounts* — IAM, Google Cloud Documentation, consultada em 2026-07-31.
- *Delete, disable, and undelete service accounts* e *List and edit service accounts* — IAM, Google Cloud Documentation.
- *Create and manage custom roles* e *Understanding IAM custom roles* — IAM, Google Cloud Documentation.
- *List and get service account keys* — IAM, Google Cloud Documentation.
- *Troubleshoot access* (Policy Troubleshooter) — IAM, Google Cloud Documentation.
- *Principal identifiers* e *Principals overview* — IAM, Google Cloud Documentation.
- *Deny policies overview* e *Deny access to principals* — IAM, Google Cloud Documentation.
- *Principal access boundary policies* — IAM, Google Cloud Documentation.
- *Identity and Access Management (IAM)* — Datastore, Google Cloud Documentation, para as permissões `datastore.entities.*`.
- *List services* — Service Usage, e a referência da CLI `gcloud iam service-accounts keys list`.
- Nenhum blog, fórum, Stack Overflow, Reddit, tutorial de terceiros ou snippet não oficial foi usado. URLs brutas não foram inseridas nesta governança.

### Identificadores, textos e stage

- `admin-b2a5-inventory-reader`: 27 caracteres, dentro do intervalo obrigatório de 6 a 30, somente minúsculas alfanuméricas e hífens. O nome da conta **não pode ser alterado após a criação**.
- `adminB2A5InventoryRead`: 22 bytes, dentro do limite de 64, somente alfanuméricos. Custom role IDs aceitam maiúsculas, minúsculas, sublinhados e pontos, mas **não hífens** — o que confirma a escolha camelCase e mostra que a convenção da conta de serviço não poderia ter sido reaproveitada. O role ID é imutável e não reutilizável no projeto.
- Textos aprovados dentro dos limites oficiais de 100 bytes para o title e 300 bytes para a description do papel; display name e description da conta não têm limite documentado e permanecem folgados. Nenhum texto contém projectId, operador, data real, identificador pessoal ou segredo.
- Stage decidido: **`GA`**. A documentação classifica os launch stages como informativos, sem efeito sobre a autorização, com a única exceção de `DISABLED`, cujos papéis continuam podendo ser concedidos mas não têm efeito. As permissões são de serviço GA e o papel é mínimo e estável. `DISABLED` fica reservado como alavanca de neutralização não destrutiva, nunca como estado inicial.
- Permissões inalteradas: `datastore.entities.get` ("Read an entity") e `datastore.entities.list` (lista chaves e exige `get` para acessar dados), nenhuma marcada como não suportada em custom roles. Verificação definitiva por `gcloud iam list-testable-permissions` com filtro `customRolesSupportLevel!=NOT_SUPPORTED`.

### Ordem de criação e consistência eventual

- Ordem decidida: **custom role primeiro, conta de serviço depois**, por razão de segurança e não de conveniência. Um custom role não vinculado **não é um principal** e não pode ser alcançado por nenhuma binding preexistente; uma conta de serviço órfã **é uma identidade** e pode ser capturada automaticamente por um principal set já existente. Criar primeiro o recurso inerte concentra todo o risco na última etapa, imediatamente antes da verificação de acesso efetivo.
- Assimetria confirmada de consistência eventual: a documentação adverte que, após criar uma conta de serviço, pode ser necessário **aguardar 60 segundos ou mais** antes de usá-la, e recomenda **retry com backoff exponencial**. Para custom roles não há atraso equivalente documentado; o único caso citado, de até 24 horas, envolve alterações em `resourcemanager.*.get`, permissões ausentes deste papel.
- O polling será somente leitura, limitado em tempo e tentativas, e **nunca repetirá o comando de criação**. Esgotado o limite, o resultado é `timeout` sanitizado — jamais uma segunda mutação.

### Colisões e por que nada será excluído automaticamente

- Política: qualquer estado diferente de `absent` interrompe o EXEC. Categorias sanitizadas: `absent`, `exists-exact`, `exists-divergent`, `deleted`, `inaccessible`, `ambiguous`. `PERMISSION_DENIED` é `inaccessible` e nunca prova de inexistência; "criar e ver se falha" não será mecanismo de descoberta.
- Base factual severa: excluir um custom role impede criar outro com o mesmo ID no projeto **até o fim do processo de exclusão de 44 dias**. Contas de serviço admitem undelete por **até 30 dias**, suas bindings só são purgadas **em até 60 dias** e aparecem com prefixo `deleted:` e sufixo `?uid=`, e recriar o mesmo nome produz **identidade separada, que não herda os papéis da conta excluída**.
- Consequência direta no rollback: **preservar, nunca excluir automaticamente**. Ambos os órfãos são inertes — papel não vinculado não concede nada, conta sem binding não tem acesso —, de modo que a exclusão automática apenas para "deixar limpo" seria o pior desfecho possível. As alavancas não destrutivas são `--stage=DISABLED` e `gcloud iam service-accounts disable`, ambas reversíveis e ambas dependentes de autorização humana explícita.

### Prova de ausência de acesso efetivo

- Fundamento lógico fechado: **somente allow policies concedem acesso**. Deny policies apenas impedem o uso de permissões e são avaliadas antes das allow; principal access boundary policies "sozinhas não dão acesso a recursos" e podem apenas tornar um principal inelegível. Portanto, para provar **ausência** de acesso, deny e PAB são irrelevantes — nenhuma delas pode criar permissão. Elas voltam a importar no `ACTIVATION-PREP`, onde um deny inesperado poderia quebrar o inventário.
- A prova reduz-se à auditoria das allow policies quanto a tudo que possa alcançar uma conta recém-criada: o próprio e-mail da conta; os principal sets de contas de serviço; e `allUsers`/`allAuthenticatedUsers`, este último incluindo contas de serviço por definição oficial. **A afirmação seguinte desta entrada — de que bindings `group:` e `domain:` não alcançariam uma conta nova — foi corrigida ainda em 2026-07-31 quanto a `group:` e em 2026-08-02 quanto a `domain:`; ambos passaram ao contrato fail-closed.**
- Formato oficial confirmado dos principal sets: `principalSet://cloudresourcemanager.googleapis.com/projects/PROJECT_NUMBER/type/ServiceAccount`, com variantes `/folders/` e `/organizations/`, e associação **automática e dinâmica** — uma conta criada agora passa a pertencer ao conjunto sem nenhuma binding individual. Este é o vetor principal pelo qual o provisionamento poderia produzir, involuntariamente, uma identidade já com acesso.
- A varredura no nível do projeto é obrigatória e bloqueante: encontrar principal set de contas de serviço, `allUsers` ou `allAuthenticatedUsers` com papel de dados interrompe e escala.
- Policy Troubleshooter avalia allow, deny e PAB, inclusive herdadas e condicionais, e para outro principal além do chamador — mas **exige habilitar `policytroubleshooter.googleapis.com`**, alteração remota de projeto que permanece proibida sem bloco próprio. Por isso não é o método adotado, e a prova estrutural acima o dispensa.
- Chaves: listagem restrita a `USER_MANAGED`, com resultado obrigatório zero. Chaves Google-managed existem por padrão e são usadas pela Service Account Credentials API — não devem ser confundidas com chaves criadas pelo projeto. A listagem nunca expõe material privado. Valor maior que zero interrompe, sem exclusão automática.

### APIs, operador e saída

- Verificação somente leitura de `iam.googleapis.com` e `iamcredentials.googleapis.com`, sem habilitar nenhuma. IAM API desabilitada **para** o bloco antes de criar qualquer recurso, porque a criação depende dela. Service Account Credentials API desabilitada **não impede** o PROVISION, que não usa impersonação: registra-se `disabled` e o gate é herdado pelo `ACTIVATION-PREP`. API habilitada nunca equivale a permissão concedida.
- Operador: somente autenticação gcloud humana já existente e previamente autorizada; proibidos `gcloud auth login`, `gcloud init`, `gcloud auth application-default login`, geração de ADC, impersonação e chave de conta de serviço. O operador esperado será recebido em memória e comparado sem impressão; `--account` e `--project` sempre explícitos, sem `gcloud config set project` e sem alteração persistente de configuração.
- Permissões mínimas do operador, separadas por finalidade: `iam.roles.create` para criar o papel; `iam.roles.get`/`iam.roles.list` para lê-lo; `iam.serviceAccounts.create` para criar a conta; leitura de contas e chaves; `resourcemanager.projects.getIamPolicy` e `iam.serviceAccounts.getIamPolicy` para as políticas; `serviceusage.services.list` para as APIs. **Explicitamente não necessárias e a não conceder:** qualquer `setIamPolicy`, criação de chaves, Token Creator, Service Account User, papéis básicos Owner/Editor/Viewer, Firebase Admin, Storage, Authentication, Logging e habilitação de APIs. Nenhum papel foi concedido nesta sessão.
- Saída por allowlist, sem projectId, project number, e-mails, unique ID bruto, resource name completo, política integral, membros, grupos, domains, principal sets reais, token, chave, ADC, caminho de credencial ou output bruto da gcloud. Sem persistência automática em arquivo; o EXEC não criará arquivo no repositório nem exportará política.

### Decisão humana pendente e limites

- **Única decisão em aberto:** se o projeto tiver pai organizacional e o operador **não** puder ler as allow policies de pasta e organização, a herança por principal set de contas de serviço nesses níveis não poderá ser descartada. Opções: **(a)** parar antes de criar qualquer recurso — recomendada, porque nada foi criado e o rollback é gratuito; **(b)** conceder previamente ao operador leitura de políticas nos níveis superiores, o que é mutação de IAM e exige bloco próprio; **(c)** aceitar formalmente o residual e escalá-lo ao `ACTIVATION-PREP`. Se o projeto **não** estiver sob organização, a questão se resolve sozinha e o parecer converte-se a **A** sem nova análise. Por ser esta a única pendência, o prompt-ready do PROVISION-EXEC **não** foi emitido.
- Nenhuma decisão anterior foi reaberta: as duas permissões, o descarte de `roles/datastore.viewer`, a ausência de chave JSON, o Token Creator apenas na conta específica e apenas na ACTIVATION, o token de aproximadamente 1 hora, a janela de 2 horas, `--max-docs 10000`, os Data Access audit logs como estão, a conta desabilitada e preservada 7 dias, a exclusão apenas com autorização posterior, o `AUTH-REVOKE` obrigatório, a condição pelo database `(default)` e a imposição de coleção e campos pelo código auditado permanecem íntegros. Nenhuma permissão ampliada e nenhuma janela estendida.
- Esta entrada altera exclusivamente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`. Não houve autenticação, login, credencial, chave, conta de serviço, custom role, binding, política, API habilitada, acesso a Google Cloud ou Firebase, consulta a dados, execução da ferramenta, inventário, migração, alteração de ferramenta, runtime ou metadata, atualização da data/hora pública, deploy, publicação, staging, commit ou push. Nenhum bloco posterior foi iniciado.

---

## 2026-07-31 — Ajuste de sequência do ADMIN-B2A5-INVENTORY-AUTH

**Ferramenta/modelo:** Claude Opus 5 (Claude Code)

**Status:** `ADMIN-B2A5-INVENTORY-AUTH-SEQUENCING-ADJUSTMENT` concluído exclusivamente como análise de segurança e atualização documental, a partir do commit-base `95c13039712d8794e80a446144a9873f60f455b4` (`docs: registrar decisões de autenticação do ADMIN-B2A5`). Parecer: **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-PROVISION-PREP**. O parecer **A** do AUTH-PREP permanece correto para a arquitetura então planejada, mas foi superado quanto à sequência operacional.

### Defeito de sequência identificado

- A ordem registrada era, em essência, `AUTH-EXEC` → governança do AUTH-EXEC → `INVENTORY-EXEC` → `AUTH-REVOKE`. O `AUTH-EXEC` planejado criaria, de uma só vez, binding Firestore válida por 2 horas, binding de Token Creator e ADC temporário.
- A revisão humana e o commit documental posicionados entre `AUTH-EXEC` e `INVENTORY-EXEC` poderiam consumir parte relevante da janela, deixá-la expirar, manter permissões temporárias ativas enquanto nenhuma operação é executada, incentivar aumento posterior da duração e criar pressão para pular gates humanos.
- Princípio adotado: **a governança documental não deve manter uma binding ativa aguardando commit.**
- Alternativas rejeitadas: aumentar a janela; remover a revisão humana; deixar acesso ativo indefinidamente; criar binding sem expiração; executar o inventário silenciosamente dentro do `AUTH-EXEC`.

### Base técnica da separação

- A documentação oficial determina conceder papéis **depois** de criar a conta de serviço, para que ela possa agir; a concessão é etapa separada e explícita.
- Uma conta de serviço sem nenhuma binding não possui acesso, e um custom role que existe mas não está vinculado a nenhum principal não concede permissão alguma.
- Portanto o provisionamento de identidade é comprovadamente livre de acesso e pode ser revisado, registrado e commitado sem nenhuma janela correndo. Não há impedimento técnico à separação entre provisionamento e ativação, o que afasta a classificação C.

### Decomposição adotada

- **PROVISION-PREP:** planeja custom role, conta de serviço, verificação da Service Account Credentials API, ausência de chaves, ausência de papéis herdados inesperados e rollback; nenhum acesso a Firestore.
- **PROVISION-EXEC:** cria somente o custom role mínimo e a conta de serviço dedicada; não cria binding Firestore, binding de Token Creator, ADC, token ou acesso a dados.
- **PROVISION-GOVERNANCE:** registra e commita a infraestrutura sem acesso, com a janela ainda não iniciada.
- **ACTIVATION-PREP:** define a janela UTC real de 2 horas e o operador em memória; confirma sintaxe da condição, estado da API, isolamento do ADC, comandos exatos, rollback e a sequência imediatamente posterior. Só começa quando `INVENTORY-EXEC` e `AUTH-REVOKE` estiverem prontos para execução imediata.
- **ACTIVATION-EXEC:** no início da janela, cria a binding Firestore condicionada ao database e ao tempo, a binding de Token Creator condicionada ao tempo no recurso da conta, o ADC isolado por impersonação e as verificações negativas sem leitura de documentos.
- **INVENTORY-EXEC:** imediatamente após a ativação, dentro da mesma janela operacional, permanecendo bloco separado com autorização própria.
- **AUTH-REVOKE:** imediatamente após o inventário e independentemente do resultado — revogar ADC, remover arquivo temporário, limpar variáveis, remover a binding de Token Creator, remover a binding Firestore, desabilitar a conta e comprovar ausência de acesso residual.
- **Governança:** provisionamento, ativação, inventário e revogação passam a ser registrados separadamente.

### Condição temporal com intervalo

- Condição lógica planejada: `resource.name == "projects/PROJECT_PLACEHOLDER/databases/(default)" && request.time >= timestamp("START_UTC") && request.time < timestamp("END_UTC")`.
- O limite superior isolado já estava confirmado verbatim para bindings Firestore. A documentação oficial também registra intervalo com início e fim, no padrão `request.time > timestamp(...) && request.time < timestamp(...)`, e que `request.time` pode ser comparado a outro timestamp.
- O operador exato do limite inferior — `>` no exemplo oficial contra `>=` planejado — deverá ser confirmado no ACTIVATION-PREP, sem inventar sintaxe. `START_UTC` e `END_UTC` serão definidos somente ali, separados por 2 horas, sempre em UTC e nunca inventados; nenhum projectId real será persistido.
- Para o Token Creator, avaliar condição temporal equivalente apenas com `request.time`, no recurso da conta de serviço. `resource.type` continua proibido sem confirmação oficial.
- O limite inferior é **defesa adicional, não requisito da arquitetura**: a correção de sequência é o que torna a janela segura, porque a ativação passa a ocorrer no início da janela por construção. Se o limite inferior não se confirmar, a arquitetura permanece válida apenas com o limite superior aprovado.

### Gates, falhas e preservações

- O PROVISION-EXEC pode ser revisado sem acesso a dados. O ACTIVATION-EXEC só começa com `INVENTORY-EXEC` e `AUTH-REVOKE` prontos para execução imediata. Se o inventário não puder começar, executar `AUTH-REVOKE` sem aguardar. Qualquer falha após a ativação aciona revogação.
- A expiração continua sendo defesa adicional, nunca rollback. Nenhuma etapa aumentará automaticamente as 2 horas e nenhum bloco deixará ADC ou binding ativa para “continuar depois”.
- Nenhuma decisão humana foi reaberta: risco database-wide aceito com os sete controles conjuntos, `adminB2A5InventoryRead` com exclusivamente `datastore.entities.get` e `datastore.entities.list`, `roles/datastore.viewer` descartado, `admin-b2a5-inventory-reader`, nenhuma chave JSON, Token Creator somente na conta específica, token de aproximadamente 1 hora, janela de 2 horas, `--max-docs 10000`, Data Access audit logs mantidos como estão, conta desabilitada e preservada 7 dias, exclusão somente com nova autorização, `AUTH-REVOKE` obrigatório, condição pelo database `(default)`, ferramenta auditada read-only e coleção/campos impostos pelo código. Nenhuma permissão ampliada e nenhuma extensão de janela.
- Benefício operacional registrado: como a conta desabilitada e o custom role sobrevivem 7 dias após o `AUTH-REVOKE`, uma repetição autorizada do inventário exigirá apenas nova ACTIVATION, não novo PROVISION.
- Ordem futura vigente: `AUTH-PROVISION-PREP` → `AUTH-PROVISION-EXEC` → `AUTH-PROVISION-GOVERNANCE` → `AUTH-ACTIVATION-PREP` → `AUTH-ACTIVATION-EXEC` → `INVENTORY-EXEC` → `AUTH-REVOKE` → governança separada de cada etapa → `MIGRATION-PREP` somente se necessário → `FIRESTORE-PREP/EXEC` → `RUNTIME-PREP/EXEC` → `ADMIN-B2B` → `ADMIN-B3`.
- Esta entrada altera exclusivamente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`. Não houve autenticação, acesso a Google Cloud ou Firebase, conta de serviço, custom role, binding, ADC, token, inventário, migração, alteração de ferramenta, runtime ou metadata, atualização da data/hora pública, deploy, publicação, staging, commit, push ou início de qualquer EXEC.

---

## 2026-07-31 — Conclusão do ADMIN-B2A5-INVENTORY-AUTH-PREP

**Ferramenta/modelo:** Claude Opus 5 (Claude Code)

**Status:** `ADMIN-B2A5-INVENTORY-AUTH-PREP` concluído exclusivamente como análise técnica, pesquisa em documentação oficial e atualização documental, a partir do commit-base `0335ce741ef56ab1c20800519f8b18b00e94ba60`. Parecer intermediário: **B. Pronto com decisões humanas pendentes**. As sete decisões humanas foram recebidas na mesma data e incorporadas, elevando o parecer final a **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-EXEC** — ver a seção *Decisões humanas recebidas e parecer final* ao fim desta entrada. `ADMIN-B2A5-INVENTORY-AUTH-EXEC` passa a ser o próximo bloco e permanece não iniciado.

### Pesquisa oficial consultada

- *Security for server client libraries* e *Identity and Access Management (IAM)* — Firestore in Native mode, Google Cloud Documentation, consultadas em 2026-07-31.
- *Firestore audit logging information* — Firestore in Native mode, Google Cloud Documentation.
- *Identity and Access Management (IAM)* — Datastore, Google Cloud Documentation, para a lista de permissões `datastore.*` e do papel Viewer.
- *Firestore roles and permissions* — IAM, Google Cloud Documentation.
- *Resource attributes for IAM Conditions*, *Configure resource-based access*, *Overview of IAM Conditions* e *Manage conditional role bindings* — IAM, Google Cloud Documentation.
- *Creating and managing custom roles* e *Access change propagation* — IAM, Google Cloud Documentation.
- *Service account impersonation*, *Create short-lived credentials for a service account* e *Best practices for using service accounts* — IAM, Google Cloud Documentation.
- *Application Default Credentials*, *Set up ADC for a local development environment* e *gcloud CLI configurations* — Autenticação e Google Cloud SDK, Google Cloud Documentation.
- *Configure Data Access audit logs* — Cloud Logging, Google Cloud Documentation.
- *Test permissions for custom user interfaces* — IAM, Google Cloud Documentation.
- Nenhum blog, fórum, Stack Overflow, Reddit, tutorial de terceiros ou snippet não oficial foi usado. URLs brutas não foram inseridas nesta governança.

### Fato de segurança central e permissões mínimas

- Confirmado que `@google-cloud/firestore` é biblioteca de servidor, autorizada por IAM e não por Firestore Security Rules. As Rules locais e publicadas não restringirão a ferramenta, o App Check não será barreira de autorização nesta execução e o perímetro remoto efetivo é a identidade IAM. Nenhuma permissão de escrita poderá ser concedida.
- Confirmado que `RunQuery` e `RunAggregationQuery` exigem exatamente `datastore.entities.get` e `datastore.entities.list`, ambas do tipo `DATA_READ`. O contrato candidato mínimo foi validado sem necessidade documental de permissão adicional para inicialização ou execução; `datastore.databases.get` cobre início/rollback de transação e commit vazio e não é requerida pela ferramenta.
- Registrado que o AUTH-EXEC deverá testar primeiro somente get/list, que qualquer `PERMISSION_DENIED` interromperá o bloco e que o papel não será ampliado automaticamente. A ferramenta já traduz gRPC `7`/`16` em `auth-denied` com exit code `5`, sem dado e sem resumo parcial.

### Papel predefinido versus custom role

- `roles/datastore.viewer` contém 15 permissões: `appengine.applications.get`, `datastore.databases.get`, `datastore.databases.getMetadata`, `datastore.databases.list`, `datastore.entities.get`, `datastore.entities.list`, `datastore.schemas.get`, `datastore.schemas.list`, `datastore.namespaces.get`, `datastore.namespaces.list`, `datastore.statistics.get`, `datastore.statistics.list`, `resourcemanager.projects.get`, `resourcemanager.projects.list` e `datastore.insights.get`. Treze são excedentes para esta ferramenta.
- Recomendado custom role com exclusivamente `datastore.entities.get` e `datastore.entities.list`, role ID sanitizado provisório `adminB2A5InventoryRead`, mantendo `roles/datastore.viewer` apenas como fallback dependente de decisão humana explícita. Nenhum papel foi criado nesta sessão.

### Escopo IAM, condições e risco residual

- Confirmado que o IAM do Firestore opera em nível de projeto e de database e que condições baseadas em recurso com `resource.name` são oficialmente suportadas, no formato `projects/PROJECT_PLACEHOLDER/databases/(default)`. Sem condição, o principal alcança todos os databases do projeto.
- Confirmado que **não existe suporte oficial a restrição IAM por coleção, por documento ou por campo**. A projeção `select("ativo", "role")` não é barreira IAM; coleção e campos serão impostos apenas pelo código auditado da ferramenta. Risco residual registrado sem minimização: uma identidade comprometida poderia tentar outras leituras dentro do database durante a vigência da permissão.
- O modelo temporal oficial confirmado é `request.time < timestamp('AAAA-MM-DDTHH:MM:SS.sssZ')`. O literal exato de `resource.type` do database **não foi confirmado verbatim**: a orientação do Firestore cita o serviço `firestore.googleapis.com`, enquanto a forma canônica de IAM é `serviço/Tipo`. O AUTH-EXEC deverá confirmar o token no editor de condições/CLI antes de gravar a binding. Nenhum projectId real foi registrado.
- Registrada a possibilidade de o Console não refletir corretamente a experiência condicionada por database, enquanto APIs e bibliotecas cliente aplicam a condição.

### Expiração, propagação e identidade

- Dois limites independentes: token de impersonação com máximo padrão de 1 hora (3.600 s), extensível a 12 horas somente por política de organização, e binding condicional com expiração própria por `request.time`.
- Propagação de IAM é eventualmente consistente, tipicamente 2 minutos e potencialmente 7 minutos ou mais, exigindo margem antes de testar e proibindo tratar expiração como substituto de rollback.
- Identidade dedicada de propósito único `admin-b2a5-inventory-reader`, sem chave, senha, login interativo ou papéis herdados, e sem Editor, Owner, Firebase Admin, `roles/datastore.user`, Storage, Auth, Logging, alteração de IAM ou criação de tokens para terceiros. A prática oficial recomendada é desabilitar quando não for mais necessária e excluir somente após um período, para não perder bindings inadvertidamente.
- Impersonação sem chave JSON, com `roles/iam.serviceAccountTokenCreator` concedido somente no recurso da própria conta de serviço, nunca no projeto ou pasta, porque a concessão ampla permitiria representar qualquer conta de serviço do projeto. Impersonar com credenciais de usuário preserva no log o principal que agiu. A aplicação de condição temporal a essa binding específica ficou como pendência de verificação do AUTH-EXEC, sem afirmação de suporte.
- A impersonação depende de `iamcredentials.googleapis.com`. O AUTH-EXEC deverá verificar se já está habilitada e, se não estiver, parar e pedir autorização específica; habilitar API é alteração remota de projeto e não equivale a permissão concedida.

### ADC, isolamento e variáveis

- Ordem de descoberta oficial do ADC: `GOOGLE_APPLICATION_CREDENTIALS`, depois o arquivo criado por `gcloud auth application-default login`, depois a conta de serviço anexada via metadata server. No Windows o arquivo padrão é `%APPDATA%\gcloud\application_default_credentials.json`; a revogação é `gcloud auth application-default revoke`. Nada foi executado.
- Isolamento classificado como **B. provável, mas requer teste controlado no AUTH-EXEC**: a documentação confirma que `CLOUDSDK_CONFIG` altera o diretório de configuração do gcloud, cujo padrão no Windows é `%APPDATA%\gcloud`, e que o arquivo ADC reside nesse diretório, mas não há afirmação oficial única de que a variável relocalize o próprio ADC.
- Se o ADC padrão do usuário puder ser sobrescrito, o AUTH-EXEC deverá parar antes do login e exigir decisão humana, sem ler o conteúdo do ADC e sem copiar segredo para o repositório.
- Variáveis somente no processo: `ADMIN_B2A5_PROJECT_ID`, mais `CLOUDSDK_CONFIG` e `GOOGLE_APPLICATION_CREDENTIALS` apenas se a arquitetura aprovada exigir; nenhuma `FIRESTORE_EMULATOR_HOST` no modo remoto e nenhuma variável persistente de sistema. O projectId permanecerá só em memória, validado por fingerprint, sem impressão nem persistência.

### Auditoria e prova de ausência de escrita

- A rastreabilidade normal de IAM/impersonação cobre operador, identidade representada, horário, concessão, uso e revogação, sem identidades reais no repositório.
- Data Access audit logs estão desabilitados por padrão, podem gerar volume e custo, exigem `setIamPolicy` para alterar e `getIamPolicy` para inspecionar, podem ser herdados de organização/pasta com configuração resultante em união, e sua leitura exige `roles/logging.privateLogViewer`. Habilitar DATA_READ do Firestore é decisão humana separada e bloco próprio; nada foi habilitado e a ferramenta não recebe acesso a Logs.
- Prova de ausência de escrita sem escrever: sem tentativa real e sem documento de teste. A comprovação usará inspeção da definição do custom role e das bindings e, para bindings condicionais, o Policy Troubleshooter. `testIamPermissions` é oficialmente destinado a interfaces gráficas de terceiros, e a documentação orienta usar o Policy Troubleshooter para diagnosticar acesso, portanto vale apenas como verificação suplementar.

### Decisões pendentes, ordem futura e limites

- Sete decisões humanas submetidas à aprovação: aceitação do limite por database sem garantia de coleção/campos; aprovação do custom role mínimo em lugar de `roles/datastore.viewer`; principal humano autorizado a impersonar, sem e-mail no repositório; janela UTC de expiração das bindings; valor institucional de `--max-docs`; tratamento dos Data Access audit logs; e destino da conta de serviço após o inventário.
- `AUTH-REVOKE` confirmado como bloco obrigatório separado, com rollback de ADC, variáveis, bindings de custom role e de Token Creator, desabilitação da conta, decisão posterior de exclusão, confirmação de ausência de chaves e tokens persistentes, remoção do diretório temporário e confirmação de configuração normal intacta e dados inalterados.

### Decisões humanas recebidas e parecer final

- As sete decisões foram recebidas e incorporadas em 2026-07-31, elevando o parecer a **A. Pronto para ADMIN-B2A5-INVENTORY-AUTH-EXEC**. O parecer A autoriza **iniciar** o AUTH-EXEC mediante autorização de execução própria; não pré-valida os gates de verificação remota.
- **1. Escopo IAM:** aceito que o IAM limite temporariamente a identidade ao database `(default)` sem garantir tecnicamente acesso exclusivo à coleção `usuarios` ou somente aos campos `ativo`/`role`. Aceitação condicionada ao uso conjunto de conta de serviço exclusiva, custom role mínimo, condição pelo database, expiração temporal, token temporário, ferramenta auditada com coleção e campos fixos e revogação explícita; a ausência de qualquer controle invalida a aceitação. Permanece proibido declarar que `select("ativo", "role")` é barreira IAM.
- **2. Papel:** aprovado o custom role mínimo com exclusivamente `datastore.entities.get` e `datastore.entities.list`, role ID lógico provisório `adminB2A5InventoryRead`. `roles/datastore.viewer` **não será utilizado** e deixa de ser fallback. Nenhuma permissão de criação, atualização, exclusão, IDs, importação, exportação, índices, operações, Storage, Auth, Logging, IAM ou administração. Papel não criado nesta sessão.
- **3. Principal humano:** o operador será o principal já autorizado e responsável pelo projeto; o e-mail ou identificador real não será registrado no repositório nem nos documentos e será informado somente em memória no AUTH-EXEC. `roles/iam.serviceAccountTokenCreator` vinculado somente à conta de serviço específica, nunca no projeto inteiro.
- **4. Janela temporal:** token de impersonação de aproximadamente 1 hora, dentro do máximo padrão de 3.600 s e sem extensão por política de organização; binding IAM com validade total de 2 horas; timestamps UTC reais definidos no AUTH-EXEC; margem para propagação; revogação explícita imediatamente após o inventário. A expiração não substitui o `AUTH-REVOKE`.
- **5. `--max-docs`:** aprovado `--max-docs 10000` como **teto operacional de segurança**, explicitamente não como estimativa do total existente. Se count ou scan exceder 10.000: interromper, não emitir resumo parcial, não aumentar automaticamente e solicitar nova decisão humana.
- **6. Data Access logs:** manter a configuração atual; não habilitar nem alterar Data Access audit logs neste fluxo. Ampliar auditoria de `DATA_READ` exigirá bloco específico e autorizado, com análise de custo, volume, herança e permissões.
- **7. Ciclo de vida da conta:** após o inventário, revogar o ADC temporário, remover o arquivo ADC, limpar as variáveis do processo, remover a binding de Token Creator, remover a binding do custom role, desabilitar imediatamente a conta de serviço e preservá-la desabilitada por 7 dias para conferência; exclusão apenas depois e mediante autorização humana específica. Nenhuma chave JSON será criada.
- **Ajuste da condição IAM:** nenhum literal de `resource.type` será fixado sem confirmação oficial. Condição-base planejada: `resource.name == "projects/PROJECT_PLACEHOLDER/databases/(default)" && request.time < timestamp("EXPIRATION_UTC")`. No AUTH-EXEC: confirmar a sintaxe final, confirmar se `resource.type` é necessário ou útil, não inventar o literal e parar em caso de incompatibilidade.
- **Quatro gates remanescentes, todos com parada explícita e nenhum bloqueante para iniciar:** sintaxe/necessidade de `resource.type`; isolamento real do ADC via `CLOUDSDK_CONFIG`, classificado **B** e com parada antes do login se o ADC padrão puder ser sobrescrito; estado de `iamcredentials.googleapis.com`, a verificar sem habilitar; e condição temporal na binding de Token Creator, cuja eventual indisponibilidade não quebra a segurança porque a binding de leitura de dados permanece condicionada ao database e expira em 2 horas.
- Ordem futura registrada neste bloco: revisão humana deste AUTH-PREP → commit documental separado → AUTH-EXEC → governança do AUTH-EXEC → INVENTORY-EXEC → AUTH-REVOKE → comprovação de ausência de acesso residual → INVENTORY-GOVERNANCE → MIGRATION-PREP somente se necessário → FIRESTORE-PREP/EXEC → RUNTIME-PREP/EXEC → ADMIN-B2B → ADMIN-B3. **Esta ordem foi posteriormente superada pelo `ADMIN-B2A5-INVENTORY-AUTH-SEQUENCING-ADJUSTMENT`, que separou o AUTH-EXEC em PROVISION e ACTIVATION; ver a entrada do ajuste de sequência.**
- Esta entrada altera exclusivamente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`. Não houve autenticação, login, credencial, chave, conta de serviço, papel, binding, política, API habilitada, Firebase/Google Cloud remoto, consulta a dados, execução da ferramenta, inventário, migração, alteração de runtime ou metadata, atualização da data/hora pública, deploy, publicação, staging, commit ou push. Nenhum bloco posterior foi iniciado.

---

## 2026-07-30 — Conclusão funcional da ferramenta isolada de inventário ADMIN-B2A5

**Ferramenta/modelo:** Codex

**Status:** `ADMIN-B2A5-INVENTORY-TOOL-ISOLATED-EXEC` concluído e classificado como **A. VALIDADO LOCALMENTE**; implementação, validação, commit funcional e push registrados. `ADMIN-B2A5-INVENTORY-AUTH-PREP` permanece como próximo bloco possível e não iniciado.

### Pacote isolado, integridade e reprodutibilidade

- A arquitetura aprovada no commit documental `d6fe820fad692e64553961a1d8ea061429d41cfd` foi implementada em `tools/admin-b2a5-inventory/`, pacote Node independente, sem workspace e sem alteração dos manifests raiz.
- Foram criados exatamente quatro arquivos: `package.json`, `package-lock.json`, `admin-b2a5-inventory.mjs` e `admin-b2a5-inventory.test.mjs`. O `node_modules/` próprio permanece ignorado e fora do Git; nenhum quinto arquivo funcional foi criado.
- O package é privado, ESM, requer Node `>=18`, contém quatro scripts locais e fixa `@google-cloud/firestore@8.7.0`. Não contém workspace, override, dependência direta de `picomatch`, script remoto ou `firebase-tools`.
- O lockfile próprio usa `lockfileVersion 3`. Instalação e execução seguem `npm --prefix`; a árvore isolada não contém a cadeia `firebase-tools`/`tinyglobby`/`fdir`/`picomatch`, e a resolução de Firestore foi comprovada dentro de `tools/admin-b2a5-inventory/node_modules/`.
- A instalação isolada concluiu com 122 pacotes. `npm ls` passou sem `invalid`, `missing` ou `ELSPROBLEMS`; `npm ci` isolado passou, e `package.json`/`package-lock.json` permaneceram byte a byte estáveis antes e depois.
- SHA-256 aprovados: package `B05ACB53F4D5DD480E436A7A3BB1C71C78E456959B9DC39AC84285C9A744B9EF`; lock `EAC09322DE633EAA33AD901F18C6D4F2FD31355E6D304F9A93EEE858B6DB3897`; módulo `A877FE4CA8266F8ED20B7106F8FE5C4633F686170902C980A496D682ED59EC13`; teste `45A91BFB2CA302D61D3CE018C2278D48201563C019AA275E13E47B99F60614AA`. Os manifests raiz permaneceram intactos e sem Firestore.

### Arquitetura, gates e metadata

- O módulo ESM possui 29 contratos exportados, pode ser importado sem executar `main`, protege o entry point e carrega `@google-cloud/firestore` por import dinâmico.
- A CLI é restrita: database fixa `(default)`, coleção fixa `usuarios`, `max-docs` obrigatório e sem quantidade institucional como default. Fingerprints, gates de alvo e modo Emulator explícito impedem descoberta implícita; não há `projectId` remoto em texto claro, credencial ou retry automático.
- O modo remoto foi implementado somente nos gates e não foi executado, validado operacionalmente ou autorizado. Nenhuma autenticação, IAM, descoberta de projeto ou conexão remota ocorreu.
- Uma primeira execução integral produziu `MetadataLookupWarning` pela detecção automática da biblioteca Google, sem autenticação ou acesso a dados. O módulo foi endurecido para definir `METADATA_SERVER_DETECTION=none` somente no modo Emulator; as execuções integrais finais ocorreram sem o aviso.

### Contrato read-only, classificações e saída

- O adaptador expõe somente `countDocuments()` e `scanProjected(maxDocuments)`. As operações Firestore permitidas são `collection("usuarios").count().get()` e uma única consulta `collection("usuarios").select("ativo", "role").limit(maxDocuments + 1).get()`.
- O módulo de produção não contém `set`, `create`, `add`, `update`, `delete`, `batch`, `bulkWriter`, transaction, `recursiveDelete`, import ou export. A busca estática encontrou somente os falsos positivos locais aprovados `seen.add(token)` e `createHash(...).update(...)`.
- Também não há `doc.id`, `doc.ref`, `doc.path`, `Object.keys` para explorar documentos, `console.log`, `console.error`, `error.message` ou `error.stack`.
- Ativo possui 12 categorias: `booleanTrue`, `booleanFalse`, `absent`, `null`, `string`, `number`, `array`, `map`, `timestamp`, `reference`, `geopoint` e `other`. Role possui sete: `admin`, `moderator`, `user`, `otherString`, `absent`, `null` e `nonString`.
- A matriz cruza `admin`, `moderator`, `user` e `invalidOrAbsent` com as 12 categorias de ativo. As métricas são `administrativeProfilesRequiringEvaluation`, `invalidTypeDocuments` e `dataQualityDocumentsRequiringReview`.
- A agregação deduplica por flags temporárias, não armazena IDs nem Set de IDs e não preserva strings desconhecidas. As invariantes validam somas, linhas da matriz, inteiros não negativos, categorias conhecidas, nenhum documento perdido e classificação derivada de uma única consulta projetada.
- A saída é JSON compacto de uma linha, determinístico e protegido por allowlist estrutural; `stdout` somente no sucesso e `stderr` somente no erro. Erros são emitidos apenas por categoria, com exit codes `0` e `2`–`12`, sem stack, mensagem bruta, ID, UID, path, valor real, projeto real, token, URL, persistência ou resumo parcial em falha.
- Testes de sanitização negaram output contendo `projectId`, `/documents/`, `projects/`, `usuarios/`, `Bearer` ou `Authorization`.

### Testes, fixtures e Emulator

- A suíte possui 102 testes: 16 de ativo, 10 de role, 25 de CLI/alvo/fingerprint/gates, 10 de agregação/métricas, 13 de invariantes, 10 de saída/sanitização/erros, 8 de adaptador/orquestração fake e 10 de integração Emulator.
- Resultado integral: 102 tests, 102 pass, zero fail, skipped, cancelled ou todo. Há 92 casos não Emulator e dez nomes iniciados por `EMULATOR:`; no subconjunto unitário, os casos Emulator aparecem como skipped pelo filtro do Node, enquanto o gate integral dentro do Emulator teve zero skipped. Nenhum teste foi removido para ocultar skips.
- As 84 fixtures sintéticas cobrem uma combinação por célula do cartesiano de sete roles por 12 ativos, sem dados de produção. Totais: 84 documentos; cada role 12; cada ativo 7; admin 12; moderator 12; user 12; `invalidOrAbsent` 48; admin e moderator true/not true em `1/11`; métricas finais `71`, `60` e `78`.
- Buffer/bytes foi validado pela categoria `other` no round-trip final do Emulator.
- O gate utilizou somente Firestore Emulator, projeto `demo-turismo-sms-rules-test`, `FIRESTORE_EMULATOR_HOST` local, nenhuma credencial ou conexão remota, encerramento automático e portas 8080/4000 sem listeners finais. Nenhum processo foi encerrado manualmente.
- `firestore-debug.log` foi gerado localmente com 939 bytes nas execuções da ferramenta, removido após cada execução e confirmado ausente ao final.

### Regressão, commit e push

- A regressão raiz `npm run test:rules` passou em cinco suítes: 87 tests, 87 pass, zero fail/skipped/cancelled/todo e coverage local HTTP 200. O Emulator encerrou; o `firestore-debug.log` de 84.209 bytes foi removido e ficou ausente.
- Nenhuma Firestore Rule, teste existente de Rules ou Storage Rule foi alterado. Nenhuma Rule foi publicada.
- Após revisão integral, hashes aprovados e staging nominal dos quatro paths, foi criado exatamente um commit funcional: `1102741201d4858b55a7145570568856f6859573` (`1102741`), mensagem `feat: adicionar ferramenta isolada de inventário do ADMIN-B2A5`.
- O commit contém exclusivamente os quatro artefatos isolados, com 3.535 inserções: módulo 902, teste 1.238, lockfile 1.377 e package 18. `.claude/settings.local.json` permaneceu fora do staging.
- Push concluído: `d6fe820..1102741 main -> main`. `HEAD`, `main`, `origin/main` e `origin/HEAD` ficaram alinhados, com divergência `0 0`.

### Supply chain, limites e próximos gates

- Avisos não bloqueantes: `node-domexception@1.0.0` e `glob@10.5.0` foram reportados como deprecated. `npm audit` estava proibido e não foi executado; nenhuma vulnerabilidade é inferida somente dos avisos, nenhuma atualização automática foi feita e eventual análise de supply chain exige bloco próprio.
- A ferramenta foi criada e validada localmente, mas não foi executada contra dados reais. O modo remoto não foi executado; autenticação e IAM não foram configurados; o valor institucional de `max-docs` não foi definido; inventário e migração não começaram.
- Rules não foram publicadas; Storage, runtime, metadata, hotfix visual, data/hora pública e produção não foram alterados pela ferramenta.
- Próximo bloco possível: `ADMIN-B2A5-INVENTORY-AUTH-PREP`, **não iniciado**, para planejar identidade temporária estritamente read-only, IAM mínimo, impedimento de escrita e acesso excedente, autenticação temporária, expiração/revogação, logs sanitizados e rollback, ainda sem inventário.
- Ordem futura preservada: revisão e commit/push documental desta governança → AUTH-PREP → AUTH-EXEC → INVENTORY-EXEC → INVENTORY-GOVERNANCE → MIGRATION-PREP somente se necessária → FIRESTORE-PREP/EXEC → RUNTIME-PREP/EXEC → ADMIN-B2B → ADMIN-B3.
- Esta entrada altera exclusivamente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`. Nesta governança não houve npm, teste, Emulator, autenticação, Firebase/Google Cloud remoto, inventário, migração, deploy, publicação, staging, commit ou push; nenhum bloco posterior foi iniciado.

---

## 2026-07-30 — Governança da recuperação npm raiz e do isolamento da ferramenta ADMIN-B2A5

**Ferramenta/modelo:** Codex

**Status:** `ADMIN-B2A5-INVENTORY-TOOL-ISOLATION-PREP-GOVERNANCE` concluído exclusivamente como atualização documental; parecer preservado em **A. Pronto para ADMIN-B2A5-INVENTORY-TOOL-ISOLATED-EXEC**; nenhum bloco posterior iniciado.

### Recuperação do pacote raiz

- O registro parte do commit `6b7923f2c551d7489ed3fbb960139f39e8e6ac67` (`fix: exibir banners e pop-ups sem cortes`), já publicado e validado no domínio público. `HEAD`, `main`, `origin/main` e `origin/HEAD` permaneceram nesse hash, divergência `0 0`, tag `pre-admin-restart-20260720` preservada, somente `.claude/settings.local.json` não rastreado e `firestore-debug.log` ausente.
- A tentativa de instalar `@google-cloud/firestore@8.7.0` na raiz foi abandonada após `ELSPROBLEMS` físico e virtual na cadeia `firebase-tools@15.24.0` → `tinyglobby@0.2.17`/`fdir@6.5.0` → `picomatch@2.3.2`/`4.0.5`. O override restrito não reparou a árvore, e a solução integrada foi rejeitada.
- `package.json` e `package-lock.json` raiz foram restaurados ao `HEAD`; objetos Git filtrados `e5548f71f21def5234b8825ab0d8cfa461b44be2` e `431ee44032731c8624e392a4cc51fb2abb066061`. Uma única execução de `npm ci --ignore-scripts --no-audit --no-fund` recuperou o baseline: árvores física/virtual válidas, Firebase CLI `15.24.0`, Firestore e overrides ausentes da raiz.
- Hashes limpos: `package.json` `8CA1CC95ABD8598852C08BE7E2E4D308FC0394498C167ECB2762C6DCDD50E95B`; `package-lock.json` `011CCA2C7FF45FABE80D5737070E2F56AE94D8CBCFE6ED94748BF83D56B60E0F`.

### Arquitetura isolada aprovada

- A ferramenta não será instalada ou executada no pacote npm raiz. A arquitetura definitiva é `tools/admin-b2a5-inventory/`, pacote Node independente, sem workspace e sem dependências integradas à árvore do site.
- Quatro arquivos futuros exclusivos: `package.json`, `package-lock.json`, `admin-b2a5-inventory.mjs` e `admin-b2a5-inventory.test.mjs` dentro do diretório isolado. Nenhum quinto arquivo funcional; a regra `node_modules/` existente cobre o `node_modules` aninhado e `.gitignore` permanecerá intacto.
- O package aprovado é privado, versão `0.0.0`, ESM, `engines.node >=18`, sem workspace/publishConfig/publicação/inventário remoto. Scripts locais: `test`, `test:unit`, `test:emulator` e `check`. `@google-cloud/firestore@8.7.0` será `dependency` exata de runtime, sem range, override, picomatch direto ou `firebase-tools`.
- Node local `v24.13.0` satisfaz apenas o gate declarado de engine; import, APIs e funcionamento real permanecem pendentes de comprovação no ISOLATED-TOOL-EXEC.
- O lockfile será próprio, `lockfileVersion 3`, gerado apenas no pacote isolado com scripts, audit e funding desabilitados, revisado integralmente e reproduzido por `npm ci`; não poderá modificar os manifests raiz.
- Padrão único: `npm --prefix "tools/admin-b2a5-inventory" <comando>` para install exato, `ls --all`, `ci`, `run check`, `run test:unit` e teste integral. Não usar workspace, instalação raiz ou alternância arbitrária de diretório.
- O import dinâmico deverá resolver Firestore em `tools/admin-b2a5-inventory/node_modules/`; o teste importará `./admin-b2a5-inventory.mjs` no mesmo package scope. O `node_modules` raiz servirá apenas à Firebase CLI.

### Emulator, contrato e validações futuras

- Comando futuro aprovado, executado da raiz: `& ".\node_modules\.bin\firebase.cmd" emulators:exec --only firestore --project demo-turismo-sms-rules-test "npm --prefix tools/admin-b2a5-inventory test"`. Somente Firestore Emulator e projeto demo, host obrigatório, sem credencial, acesso remoto ou fallback, com encerramento automático.
- O contrato funcional anterior permanece: ESM importável, database `(default)`, coleção `usuarios`, projeção `ativo`/`role`, count como gate, scan único `max + 1`, zero IDs/escrita/persistência/valores reais/retry, fingerprints, JSON determinístico, erros sanitizados, exit codes `0` e `2`–`12`, `countMismatchDetected` e `classificationDerivedFromSingleQuerySnapshot`.
- Testes: 102 — 16 ativo, 10 role, 25 CLI/alvo/fingerprint/gates, 10 agregação/métricas, 13 invariantes, 10 saída/sanitização/erros, 8 adaptador/orquestração fake e 10 `EMULATOR:`. Resultado obrigatório: 102 pass e zero fail/skipped/cancelled/todo.
- Fixtures: 84 (`7 × 12`), com total 84, `administrativeProfilesRequiringEvaluation = 71`, `invalidTypeDocuments = 60` e `dataQualityDocumentsRequiringReview = 78`. Buffer/bytes deverá ser `other`; divergência encerra o EXEC sem improvisação.
- Regressão raiz obrigatória: `npm run test:rules`, 87/87 em cinco suítes, coverage local HTTP 200, zero fail/skipped/cancelled/todo, Emulator encerrado, portas 8080/4000 livres e log ausente. Nenhuma Rule será alterada.
- Zero escrita: módulo de produção sem mutadores, transaction, `recursiveDelete` ou import/export; adaptador somente `countDocuments()`/`scanProjected(maxDocuments)`; writes apenas no teste para fixtures locais; fakes validam um count, no máximo um scan e zero retry.
- Integridade futura: hashes e objetos filtrados da raiz antes/depois de install, `npm ci` e testes; hashes dos quatro arquivos isolados após criação e validações; nenhum teste poderá alterar arquivos.

### Rollback, riscos e ordem

- Rollback pré-commit por remoção autorizada somente dos quatro paths novos e do `node_modules` isolado após conferência absoluta; nunca `git clean`. Depois de commit, `git revert HASH_DO_ISOLATED_TOOL_EXEC`. Nenhum rollback toca dados, IAM, Rules, produção ou o hotfix visual.
- Riscos não bloqueantes: import/APIs reais do Firestore 8.7.0 no Node 24.13.0, árvore isolada, round-trip Buffer/bytes, `firestore-debug.log`, portas e caminho de resolução. Autenticação, IAM e valor real de `max-docs` permanecem fora do TOOL-EXEC.
- Ordem: revisão/commit/push desta governança → ISOLATED-TOOL-EXEC → revisão/governança/commit funcional próprios → AUTH-PREP/EXEC → INVENTORY-EXEC/GOVERNANCE → MIGRATION-PREP se necessária → FIRESTORE-PREP/EXEC → RUNTIME-PREP/EXEC → ADMIN-B2B → ADMIN-B3.

### Limites desta atualização documental

- Arquivos alterados exclusivamente: `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`.
- Nenhum arquivo funcional, package, lockfile, Rule, Storage, runtime, metadata, hotfix visual, dado ou produção foi alterado. A data/hora pública não foi atualizada.
- Não houve `npm install`, `npm ci`, dependência, pacote, ferramenta, teste, Emulator, autenticação, Firebase/Google Cloud remoto, inventário, migração, deploy, publicação, staging, commit ou push nesta governança. As únicas chamadas npm foram os `npm pkg get` de leitura exigidos no preflight.
- `.claude/settings.local.json` permaneceu não rastreado, não lido, não pesquisado e intocado. `tools/admin-b2a5-inventory/` e `firestore-debug.log` permaneceram inexistentes.
- `ADMIN-B2A5-INVENTORY-TOOL-ISOLATED-EXEC` e todos os blocos posteriores permanecem não iniciados e dependem de autorização própria.

---

## 2026-07-30 — Conclusão do ADMIN-B2A5-INVENTORY-TOOL-PREP

**Ferramenta/modelo:** Codex

**Status:** `ADMIN-B2A5-INVENTORY-TOOL-PREP` concluído exclusivamente por análise local e somente leitura; parecer **A. Pronto para ADMIN-B2A5-INVENTORY-TOOL-EXEC**; nenhum bloco posterior iniciado.

### Conclusão, Git e limites

- O TOOL-PREP partiu do commit-base `7059aa8973566acde24096a62ff99eb6a50696d5` (`docs: registrar prep do inventário do ADMIN-B2A5`), com `HEAD`, `main`, `origin/main` e `origin/HEAD` alinhados, divergência `0 0`, tag `pre-admin-restart-20260720` preservada, somente `.claude/settings.local.json` não rastreado e `firestore-debug.log` ausente.
- O parecer A fecha versão, arquitetura, quatro arquivos, funções, CLI, gates, adaptador, taxonomias, métricas, invariantes, schema, erros, exit codes, testes, fixtures, validações, integridade e rollback. Isso não autoriza automaticamente implementação, autenticação, IAM, inventário, migração, commit, push, deploy ou publicação.
- Esta governança altera exclusivamente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`. Nenhum arquivo funcional, ferramenta, teste, pacote, lockfile, configuração Firebase, Rule, runtime, dado ou produção foi alterado.

### Dependência, arquivos e compatibilidade

- Dependência futura definida: `@google-cloud/firestore@8.7.0`, exata, sem `^` ou `~`, em `devDependencies`, com comando planejado `npm install --save-dev --save-exact --ignore-scripts @google-cloud/firestore@8.7.0`.
- A metadata pública consultada declarou `engines.node >=18`; o Node local `v24.13.0` satisfaz o gate de engine. A dependência não foi instalada, portanto import, APIs e execução real no Node 24 não foram comprovados e deverão ser validados somente no TOOL-EXEC.
- APIs planejadas: `Firestore`, `Query.select()`, `Query.count()`, `Query.limit()`, `Timestamp`, `GeoPoint`, `DocumentReference`, `databaseId` e `FIRESTORE_EMULATOR_HOST`.
- Os quatro arquivos suficientes para o futuro EXEC são `scripts/admin-b2a5-inventory.mjs`, `tests/admin-b2a5-inventory.test.mjs`, `package.json` e `package-lock.json`. Qualquer necessidade de quinto arquivo deverá interromper o EXEC, ser tecnicamente justificada e receber autorização própria.

### Arquitetura, adaptador e CLI

- A ferramenta será Node ESM, rastreada, auditável, importável sem executar main e estritamente read-only. O plano separa constantes/schema, erro seguro, parser, max-docs, target, SHA-256, import dinâmico, classificadores, inventário, agregação, invariantes, allowlist, sanitização, adaptador, orquestrador, main e guard por `import.meta.url`.
- Contrato funcional: `parseCliArgs`, `validateMaxDocuments`, `validateTarget`, `sha256Utf8`, `classifyAtivo`, `classifyRole`, `createEmptyInventory`, `accumulateDocument`, `validateInventory`, `formatInventorySummary`, `assertSanitizedOutput`, `sanitizeErrorCategory`, `serializeSuccess`, `serializeError`, `loadFirestoreModule`, `createFirestoreReadAdapter`, `runInventory` e `main`. Ajustes mínimos de nome são aceitáveis apenas se responsabilidades, cobertura, quatro arquivos e sanitização permanecerem.
- O adaptador exporá somente `countDocuments()` e `scanProjected(maxDocuments)`. As duas operações serão `collection("usuarios").count().get()` e `collection("usuarios").select("ativo", "role").limit(maxDocuments + 1).get()`.
- Permanecem proibidos mutadores, batch/bulk writer/transaction, import/export, Auth, Storage, IAM, fetch arbitrário, retry, campos arbitrários e acesso a ID/ref/path/name/snapshot/objeto Firestore em logs ou saída.
- A CLI exigirá `--database-id`, `--collection`, `--max-docs` e `--expected-project-sha256`; `--emulator` será explícito. Database fixo `(default)`, coleção fixa `usuarios`, max positivo obrigatório e sem default, sem project ID por argumento, posicionais, opções desconhecidas/duplicadas ou scan ilimitado.
- Remoto: project ID somente por `ADMIN_B2A5_PROJECT_ID`, nunca impresso ou herdado de gcloud/ADC/`.firebaserc`, comparado antes do cliente à fingerprint `68cf9cf1208055a962c614232e75b8a0b4f4f7564865e77e2a84382a87bd8c60`.
- Emulator: projeto `demo-turismo-sms-rules-test`, fingerprint `b2d2fda672cd3134c50b1afd30579947fb89c8aace85bb35852f6ed4c935e7b9`, `FIRESTORE_EMULATOR_HOST` obrigatório e restrito a loopback, sem credencial ou fallback remoto. Modo remoto com a variável do Emulator presente deverá abortar.

### Classificação, métricas e consistência

- `ativo`: `booleanTrue`, `booleanFalse`, `absent`, `null`, `string`, `number`, `array`, `map`, `timestamp`, `reference`, `geopoint` e `other`; ordem de detecção por ausência, null, booleanos, string, número, array, tipos Firestore especiais, mapa simples e other. Sem coerção; Buffer/bytes deverá validar `other` no Emulator ou o EXEC deverá parar.
- `role`: `admin`, `moderator`, `user`, `otherString`, `absent`, `null` e `nonString`, por comparação exata, sem trim/lowercase e sem guardar/imprimir strings desconhecidas.
- `roleByAtivo` terá quatro linhas, 12 colunas e 48 células. `administrativeProfilesRequiringEvaluation` agrega Admin não ativo, todos os moderator e roles inválidas/ausentes, sem tratar usuário comum apenas por ativo diferente de true como candidato administrativo. `invalidTypeDocuments` e `dataQualityDocumentsRequiringReview` serão uniões deduplicadas e não autorizarão migração ou alteração.
- Count será apenas gate; scan usará `max-docs + 1`. Excesso gera `volume-limit`; divergência dentro do limite gera `count-mismatch`, sem retry, sem `concurrentChangeDetected` e sem alegação de concorrência comprovada. Mismatch não emitirá resumo ou totais parciais.
- Invariantes: somas de ativo/role/matriz, linhas da matriz, inteiros, não negativos, categorias conhecidas, nenhum documento perdido, acumulações iguais ao scan e `classificationDerivedFromSingleQuerySnapshot` somente para a consulta projetada única.

### Saída, erros, testes e rollback

- Sucesso: JSON compacto determinístico, `schemaVersion: 1`, uma linha em stdout, sem persistência. Falha: stdout vazio e somente categoria fechada em stderr. São proibidos project ID real, identificadores, paths, snapshots, valores reais, role desconhecida, erro bruto, stack, URL, token, request, response e headers.
- Exit codes: `0` sucesso; `2` argumentos inválidos; `3` alvo; `4` Emulator; `5` auth denied; `6` dependência; `7` volume; `8` count mismatch; `9` query; `10` invariante; `11` sanitização; `12` inesperado.
- Plano final: **102 testes**, sendo 16 de ativo, 10 de role, 25 de CLI/gates, 10 de agregação/métricas, 13 de invariantes, 10 de saída/sanitização/erros, 8 de adaptador/orquestração fake e 10 de Emulator. Nenhuma biblioteca adicional de teste.
- Fixtures finais: **84** (`7 roles × 12 ativos`), substituindo a referência provisória de 77. A matriz completa deverá produzir total 84, 12 por role, uma ocorrência por célula, 48 em `invalidOrAbsent`, splits Admin/moderator `1/11`, `administrativeProfilesRequiringEvaluation = 71`, `invalidTypeDocuments = 60` e `dataQualityDocumentsRequiringReview = 78`.
- Validação futura: instalação exata com scripts ignorados, revisão integral do lockfile, `node --check`, testes unitários, Emulator demo, suíte de Rules, busca estática por operações mutadoras, diff integral, `git diff --check` e SHA-256 do script/teste antes e depois.
- Rollback pré-commit: restaurar apenas `package.json` e `package-lock.json`; arquivos `.mjs` novos somente por paths exatos e autorização, sem `git clean`. Depois de commit, `git revert HASH_DO_TOOL_EXEC`.

### Não ações e próximo gate

- Nenhum npm, instalação, ferramenta, teste, Emulator, autenticação, acesso Firebase/Google Cloud, IAM, inventário, migração, commit, push, deploy ou publicação foi executado no TOOL-PREP ou nesta governança.
- O próximo bloco possível é `ADMIN-B2A5-INVENTORY-TOOL-EXEC`, ainda não iniciado e dependente de autorização humana própria. AUTH, inventário, governança do inventário, eventual migração, Firestore, runtime, `ADMIN-B2B` e `ADMIN-B3` permanecem posteriores e separados.

---

## 2026-07-29 — Conclusão do ADMIN-B2A5-INVENTORY-PREP

**Ferramenta/modelo:** Codex

**Status:** `ADMIN-B2A5-INVENTORY-PREP` concluído exclusivamente por análise local e somente leitura; parecer **C. Requer ferramenta local separada antes do INVENTORY-EXEC**; progressão esperada **C → B → A**; nenhum bloco posterior iniciado.

### Conclusão e evidências locais

- O PREP partiu do commit-base `1bd7377d25e540819e8fb67248568e38ba1b8601` (`docs: registrar decisões do ADMIN-B2A5`), com `HEAD`, `main` e `origin/main` alinhados, divergência `0 0`, tag `pre-admin-restart-20260720` preservada e somente `.claude/settings.local.json` não rastreado e intocado.
- Não existe ferramenta adequada para o inventário de `usuarios`. `scripts/cms-media-inventory.mjs` e `scripts/cms-establishments-seed.mjs` têm outros alvos e contratos, podem ler dados mais amplos, usam token manual ou possuem caminhos de escrita e não devem ser reutilizados.
- Não existem dependências diretas `firebase-admin` ou `@google-cloud/firestore`. A dependência futura recomendada é `@google-cloud/firestore`; versão exata, compatibilidade com Node e impacto no lockfile deverão ser definidos no `ADMIN-B2A5-INVENTORY-TOOL-PREP`.
- A classificação C exige ferramenta local rastreada e validada. Depois disso, a etapa B exigirá identidade IAM read-only e autenticação temporária aprovadas; somente após ambas a etapa A poderá liberar o INVENTORY-EXEC.

### Método futuro e minimização

- Método recomendado: ferramenta Node rastreada com `count()` inicial apenas como gate de volume, consulta única de `usuarios` com `select("ativo", "role")` e `limit(T + 1)`, classificação em memória e saída exclusivamente agregada.
- Coleção exclusiva: `usuarios`. Campos exclusivos: `ativo` e `role`. Não acessar logicamente nome, e-mail, telefone, organização, foto, CPF, endereço, tokens, Auth ou qualquer outro dado pessoal.
- O document ID poderá existir tecnicamente no snapshot, mas a ferramenta será proibida de acessar `.id`, `.ref` e `.path`, imprimir, persistir, pseudonimizar ou incluir identificadores em logs e erros.
- Categorias de `ativo`: `booleanTrue`, `booleanFalse`, `absent`, `null`, `string`, `number`, `array`, `map`, `timestamp`, `reference`, `geopoint` e `other`. Categorias de `role`: `admin`, `moderator`, `user`, `otherString`, `absent`, `null` e `nonString`. A matriz terá linhas `admin`, `moderator`, `user` e `invalidOrAbsent`, cada uma com todas as categorias de `ativo`.
- Invariantes: somas de `ativo`, `role` e matriz iguais ao total; Admin e moderator integralmente distribuídos; contagens inteiras e não negativas; nenhuma categoria silenciosamente descartada; classificação derivada de uma única consulta projetada.

### Ajustes de precisão aprovados

- Count e scan são operações distintas. Diferença deverá encerrar a execução com erro sanitizado e `countMismatchDetected`; igualdade não comprova ausência de alteração concorrente. `classificationDerivedFromSingleQuerySnapshot` indicará somente que as categorias foram calculadas a partir da mesma consulta projetada.
- As métricas serão separadas em `administrativeProfilesRequiringEvaluation` e `dataQualityDocumentsRequiringReview`. Usuário comum com `ativo` falso ou ausente não será automaticamente classificado como candidato a migração administrativa. Moderator será contabilizado separadamente para a futura remoção de grants, sem correção automática ou promoção.
- `T = 10.000` é teto técnico recomendado, ainda pendente de confirmação humana no TOOL-PREP ou antes do INVENTORY-EXEC. Nenhum scan ilimitado será permitido e qualquer aumento exigirá autorização explícita.
- `roles/datastore.viewer` é apenas a referência read-only. O escopo tecnicamente suportado deverá ser comprovado no AUTH-PREP e não será descrito como restrito à coleção ou aos campos. A minimização dependerá cumulativamente de IAM sem escrita, ferramenta auditada, alvo e projeção fixos, saída agregada, logs sanitizados e gates de projeto/banco.

### Ferramenta, testes e ordem futura

- Arquivos prováveis do TOOL-EXEC: `scripts/admin-b2a5-inventory.mjs`, `tests/admin-b2a5-inventory.test.mjs`, `package.json` e `package-lock.json`; nenhum está autorizado para alteração nesta governança.
- O TOOL-PREP deverá separar classificador puro do adaptador Firestore, definir CLI/gates/saída, verificar suporte de `count()` e `select()` no Emulator, revisar o lockfile, definir busca estática por escrita e fixar a contagem final de testes. A referência de 44 testes e 77 fixtures é planejamento inicial, a confirmar ou ajustar sem redução indevida de cobertura.
- Ordem futura: INVENTORY-TOOL-PREP → INVENTORY-TOOL-EXEC → governança/commit da ferramenta quando aprovados → INVENTORY-AUTH-PREP → INVENTORY-AUTH-EXEC → INVENTORY-EXEC → INVENTORY-GOVERNANCE → MIGRATION-PREP somente se necessário → FIRESTORE-PREP/EXEC → RUNTIME-PREP/EXEC → ADMIN-B2B → ADMIN-B3.

### Limites desta governança

- Alteração exclusivamente documental e restrita a `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`.
- Nenhuma Rule, teste funcional, Storage, script, pacote, configuração Firebase, Admin, Portal, CMS, Auth, HTML, App Check, CSP, runtime, metadata ou dado foi alterado.
- Nenhum npm, dependência, ferramenta, Emulator, autenticação, acesso remoto, IAM, service account, chave, token, inventário, migração, deploy, publicação, commit ou push foi executado.
- `.claude/settings.local.json` permaneceu não rastreado, não lido e intocado; `firestore-debug.log` permaneceu ausente.
- `INVENTORY-TOOL-PREP`, TOOL-EXEC, AUTH-PREP/EXEC, INVENTORY-EXEC e todos os blocos posteriores permanecem não iniciados e dependem de autorização humana própria.

---

## 2026-07-29 — Decisões humanas e decomposição do ADMIN-B2A5

**Ferramenta/modelo:** Codex

**Responsável pela aprovação:** Jacob

**Status:** `ADMIN-B2A5-PREP` concluído; decisões humanas posteriores registradas; EXEC monolítico classificado como **C. Bloqueado por dependências técnicas**; nenhum bloco posterior iniciado.

### Conclusão do PREP e parecer

- O `ADMIN-B2A5-PREP` foi concluído exclusivamente como análise somente de leitura.
- Parecer original preservado: **B. Pronto com decisão humana pendente**.
- O diagnóstico confirmou o contrato atual `ativo != false`, a divergência entre Admin e Rules, a ausência de função operacional própria para `moderator` e a separação entre Firestore e Storage.
- O PREP teve zero alteração funcional, acesso remoto, Emulator, inventário, migração, publicação, commit ou push.

### Decisões humanas

- Contrato futuro: gates baseados em papel exigirão `usuarios.ativo == true`.
- Somente o booleano `true` autoriza. Serão negados `false`, campo ausente, `null`, strings, números, listas, mapas, qualquer outro tipo/valor diferente do booleano `true` e documento `usuarios/{uid}` inexistente.
- Não haverá compatibilidade temporária para ausência ou tipos inválidos; `ativo != false` não será preservado como contrato final.
- A desativação alcançará acessos administrativos e de equipe protegidos por role. Admin ou eventual membro de equipe com `ativo` diferente de `true` perderá essas operações.
- O Portal não receberá bloqueio global automático: `signedIn()`, autoria, propriedade, `establishment_managers` e demais contratos próprios continuam fora dessa ampliação. Suspensão total de cidadão exige política e autorização separadas.
- `moderator` não é função institucional ativa, não será tratado como Admin e não receberá novos privilégios.
- Grants administrativos específicos atuais de `moderator` serão removidos futuramente; os fluxos de Admin serão preservados.
- `moderator` não deverá receber administração de `usuarios`, drafts de `noticias`, `media_library`, CMS integral, `reservas`, `banners` ou administração genérica.

### Separação de escopo e classificação

- Runtime será tratado em bloco próprio: gate de `ativo`, revalidação do perfil, sessão, bloqueio/logout visual, mensagens e remoção/desativação da opção `moderator`.
- Storage permanece exclusivamente no `ADMIN-B2B`, incluindo alinhamento de `isStaff()` e grants atuais de Admin/moderator.
- Inventário remoto mínimo e sanitizado deverá preceder qualquer publicação; nenhum nome, e-mail, telefone, UID completo ou dado pessoal deverá constar do relatório.
- Migração terá PREP/EXEC próprios somente se o inventário comprovar necessidade, com backup lógico, dry-run, rollback e autorização específica.
- O EXEC monolítico foi classificado como **C. Bloqueado por dependências técnicas**. A classificação não cancela o `ADMIN-B2A5`; impõe decomposição.

### Roadmap decomposto

1. `ADMIN-B2A5-INVENTORY-PREP/EXEC` — não iniciados; autorizações próprias.
2. `ADMIN-B2A5-MIGRATION-PREP/EXEC` — não iniciados e condicionais ao inventário; autorizações próprias.
3. `ADMIN-B2A5-FIRESTORE-PREP/EXEC` — não iniciados; provável limite a `firestore.rules` e `tests/firestore.rules.test.mjs`, projeto demo e nenhuma publicação.
4. `ADMIN-B2A5-RUNTIME-PREP/EXEC` — não iniciados; arquivos e comportamento serão definidos no PREP.
5. `ADMIN-B2B` — não iniciado; Storage, `ativo == true`, moderator/staff, `cms-media`, arquivos físicos e testes próprios.
6. `ADMIN-B3` — não iniciado; revisão consolidada, autorização explícita, única publicação autorizada e reteste remoto sanitizado.

### Riscos e limites desta governança

- Permanecem como dependências: perfis potencialmente incompatíveis com `ativo == true`, possível migração, divergência Admin/Rules, sessão sem revalidação contínua, opção `moderator` no runtime e grants atuais em Firestore/Storage.
- Alteração restrita a `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`.
- Nenhum arquivo funcional, Rule, teste, Storage, runtime, pacote, configuração Firebase, dado, asset ou metadata foi alterado.
- A data/hora pública do site não foi atualizada.
- Nenhum teste, build, lint, npm, Emulator, acesso remoto, inventário, migração, deploy, publicação, commit ou push foi executado.
- `.claude/settings.local.json` permaneceu não rastreado, não lido e intocado.
- Nenhum bloco posterior foi iniciado.

---

## 2026-07-29 — Conclusão funcional do ADMIN-B2A4-EXEC

**Ferramenta/modelo:** Codex

**Responsável pela aprovação:** Jacob

**Status:** `ADMIN-B2A4-EXEC` concluído, revisado integralmente, classificado como **A. VALIDADO FUNCIONALMENTE**, commitado e enviado para `origin/main`; Rule versionada e ainda não publicada.

### 1. Implementação

- O `ADMIN-B2A4-PREP` foi concluído, aprovado e teve sua governança registrada no commit `f9067e332a078ace7f840fecbe6f457bda324d34` (`docs: aprovar prep da proteção de media_library`).
- O `ADMIN-B2A4-EXEC` alterou exclusivamente:
  - `firestore.rules`;
  - `tests/firestore.rules.test.mjs`.
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

- A leitura pública ampla foi removida e passou a ser exclusiva de Admin autorizado.
- A escrita foi preservada byte a byte como `allow write: if isAdmin();`.
- Nenhum helper, outro `match`, schema, campo de publicação/status ou contrato de `ativo`/`moderator` foi alterado.
- Nenhuma alteração de runtime, Storage, índice, Admin, Portal, CMS, HTML, App Check, CSP ou metadata foi necessária.

### 2. Contrato final versionado

- Admin ativo:
  - get permitido;
  - list integral permitido;
  - leitura de registro legado/esparso permitida;
  - get inexistente autorizado com `exists() == false`;
  - create, update e delete permitidos.
- Anônimo:
  - get e list negados;
  - queries por `url` e `storagePath` negadas;
  - escrita negada.
- Usuário comum:
  - get e list negados;
  - create, update e delete negados.
- Usuário autenticado sem documento em `usuarios`:
  - get e list negados;
  - create negado;
  - ausência do perfil não concede acesso.
- `moderator`:
  - get e list negados;
  - create, update e delete negados;
  - nenhuma dependência real de `media_library` foi comprovada;
  - contrato institucional definitivo reservado ao `ADMIN-B2A5`.
- Admin inativo:
  - get e list negados;
  - create negado;
  - comportamento segue o contrato atual de `ativo`, reservado ao `ADMIN-B2A5`.

### 3. Revisão integral e alterações dos testes

- Baseline anterior: 69 testes em 5 suítes, com 10 testes dedicados de `media_library`.
- Suíte renomeada de `Baseline atual de media_library` para `Contrato de leitura e escrita de media_library`.
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
  1. usuário comum não lista;
  2. usuário sem perfil não faz get;
  3. usuário sem perfil não lista;
  4. `moderator` não lista;
  5. Admin inativo não faz get;
  6. Admin inativo não lista;
  7. Admin ativo lista integralmente;
  8. Admin ativo lê registro legado/esparso;
  9. Admin ativo faz get inexistente e confirma `exists() == false`;
  10. anônimo não consulta por `url`;
  11. anônimo não consulta por `storagePath`;
  12. usuário sem perfil não cria;
  13. Admin ativo atualiza;
  14. Admin ativo exclui;
  15. usuário comum não atualiza;
  16. usuário comum não exclui;
  17. `moderator` não atualiza;
  18. `moderator` não exclui.
- Zero testes foram removidos e zero subtests foram adicionados.
- O teste adicional `moderator/create` da suíte `moderator` foi preservado.
- As outras quatro suítes permaneceram intactas.
- As 18 remoções textuais do commit correspondem a renomeações e inversões, não à exclusão de casos.
- Fixtures exclusivamente sintéticas, URLs em `example.com` e projeto demo preservado.
- Composição final:
  - `noticias`: 37;
  - `media_library`: 28;
  - `ativo`/`isAdmin`: 9;
  - `moderator`: 10;
  - fallback deny: 3;
  - total: 87 testes em 5 suítes.

### 4. Validação funcional

- Classificação: **A. VALIDADO FUNCIONALMENTE**.
- Comando executado no bloco funcional: `npm run test:rules`.
- Projeto: `demo-turismo-sms-rules-test`.
- Ambiente:
  - somente Firestore Emulator local;
  - `firestore.rules` local;
  - porta Firestore 8080;
  - UI local 4000;
  - concorrência Node 1;
  - nenhuma credencial;
  - nenhum projeto real.
- Resultado:
  - suites: 5;
  - tests: 87;
  - pass: 87;
  - fail: 0;
  - skipped: 0;
  - cancelled: 0;
  - todo: 0;
  - exit code: 0.
- O endpoint local de rule coverage respondeu HTTP 200.
- O coverage exerceu o ramo `isAdmin()` de `media_library`, get/list/create/update/delete administrativos, negativas para anônimo, usuário comum, `moderator`, Admin inativo e usuário sem perfil, documento existente e inexistente, registro legado, queries por `url` e `storagePath` e fallback deny.
- Nenhum relatório HTML ou JSON foi persistido.
- O Emulator encerrou automaticamente; as portas 8080 e 4000 ficaram sem listeners; nenhum processo foi encerrado manualmente.
- `firestore-debug.log` foi gerado pelo Emulator, removido após a suíte e ficou ausente ao final.

### 5. Tentativa ambiental

- Uma primeira execução terminou antes do Emulator por erro `EPERM` no configstore local do Firebase CLI.
- Nenhuma Rule, teste, configuração ou dependência foi alterada.
- O mesmo comando foi repetido no ambiente autorizado e concluiu em 87/87.
- O `EPERM` foi classificado como evento ambiental e não representa falha funcional da implementação.

### 6. Commit e push funcionais

- Hash completo: `13245dcf6dcc2e5704ee3d019ed3c05233a057b3`.
- Hash curto: `13245dc`.
- Mensagem: `fix: restringir media_library a administradores`.
- Estatística: 2 arquivos, 300 inserções e 18 remoções textuais.
- Push para `origin/main` concluído.
- Estado confirmado após o push:
  - `HEAD`: `13245dcf6dcc2e5704ee3d019ed3c05233a057b3`;
  - `main`: `13245dcf6dcc2e5704ee3d019ed3c05233a057b3`;
  - `origin/main`: `13245dcf6dcc2e5704ee3d019ed3c05233a057b3`;
  - divergência: `0 0`.

### 7. Produção, publicação e separação Firestore/Storage

- A Rule nova está versionada no Git, mas não foi publicada no Firebase.
- Nenhum deploy ou publicação de Firestore Rules foi executado.
- O commit no GitHub não altera automaticamente o ruleset ativo; produção permanece com o último ruleset publicado até autorização específica do `ADMIN-B3`.
- Nenhum acesso ao Firebase real, leitura ou alteração de dados reais, inventário ou migração foi executado.
- `media_library` é coleção Firestore de catálogo e metadados; a proteção versionada impede enumeração pública dos documentos.
- `cms-media` é caminho de Cloud Storage com arquivos físicos e URLs e não foi alterado; permanece reservado ao `ADMIN-B2B`.
- A proteção de `media_library` não revoga URLs já distribuídas, não torna privados arquivos públicos no Storage, não altera imagens copiadas para notícias, eventos ou banners e não modifica `storage.rules`.
- Nenhuma alteração de runtime, Admin, Portal, CMS, HTML, App Check, CSP, índices, metadata ou `js/site-meta.js` foi executada.
- A data/hora pública não foi atualizada.

### 8. Roadmap

- `ADMIN-B2A4-PREP`: concluído, aprovado e registrado em `f9067e332a078ace7f840fecbe6f457bda324d34`.
- `ADMIN-B2A4-EXEC`: concluído, validado funcionalmente em 87/87, commitado em `13245dcf6dcc2e5704ee3d019ed3c05233a057b3` e enviado para `origin/main`, sem publicação.
- `ADMIN-B2A5`: próximo bloco possível, não iniciado, dependente de PREP e autorização humana próprios; deve tratar separadamente `ativo` e `moderator`.
- `ADMIN-B2B`: posterior e não iniciado; trata Storage/`cms-media` em bloco próprio.
- `ADMIN-B3`: posterior e não iniciado; única etapa autorizada a publicar as Rules, após revisão consolidada e autorização explícita, seguida de reteste remoto.
- Ordem preservada: `ADMIN-B2A5` → `ADMIN-B2B` → `ADMIN-B3`.
- Nenhuma etapa posterior foi iniciada automaticamente.

### Limites desta atualização documental

- Alteração restrita a `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`.
- `firestore.rules`, `tests/firestore.rules.test.mjs`, `storage.rules`, configurações, dependências, runtime, Admin, Portal, CMS, HTML, App Check, CSP, dados, assets, índices e metadata permaneceram intactos.
- Nenhum teste, Emulator, acesso remoto, inventário, migração, deploy, publicação, commit ou push foi executado nesta atualização documental.
- `.claude/settings.local.json` permaneceu não rastreado, não lido e intocado.

---

## 2026-07-29 — Aprovação do ADMIN-B2A4-PREP

**Ferramenta/modelo:** Codex

**Responsável pela aprovação:** Jacob

**Status:** governança atualizada; `ADMIN-B2A4-PREP` concluído e aprovado somente por leitura; parecer **A. pronto para ADMIN-B2A4-EXEC**; EXEC pendente e não iniciado.

### Objetivo e limites

- Registrar exclusivamente a aprovação do `ADMIN-B2A4-PREP`, o contrato futuro Admin-only de `media_library`, o plano exato do futuro EXEC e os limites Firestore/Storage, sem alteração funcional.
- O PREP não alterou arquivo, Rule, teste, runtime ou dado.
- Não executou npm, Firebase Emulator, acesso remoto, inventário, migração, deploy, publicação, commit ou push.
- Não iniciou `ADMIN-B2A4-EXEC`, `ADMIN-B2A5`, `ADMIN-B2B` ou `ADMIN-B3`.

### Hipótese principal e referências de runtime

- Hipótese confirmada: `media_library` é uma coleção operacional do CMS/Admin.
- `AdminContentCMS.ensureMediaLoaded()` executa listagem integral da coleção.
- `AdminContentCMS.saveMedia()` cria ou atualiza documentos.
- `AdminContentCMS.deleteMedia()` exclui documentos.
- Editores e seletores usam a biblioteca já carregada em memória.
- O painel administrativo aceita somente role `admin`.
- Não existe consulta direta comprovada nas páginas públicas, no Portal ou no service worker.
- Importadores não possuem referência direta comprovada.
- Não existe consumidor real dependente de role `moderator`.
- Páginas públicas consomem URLs já copiadas para notícias, eventos, banners e outras entidades; portanto nenhuma alteração de runtime é necessária.

### Contrato atual, risco e alternativa aprovada

- Match atual:

  ```text
  match /media_library/{mediaId} {
    allow read: if true;
    allow write: if isAdmin();
  }
  ```

- Risco confirmado: get, list e queries públicas permitem enumerar URLs, nomes, paths e metadados administrativos. O frontend não constitui proteção.
- A escrita já é Admin-only e permanecerá exatamente como `allow write: if isAdmin();`.
- As alternativas A–F foram analisadas. A alternativa **A — leitura e escrita exclusivamente por Admin** foi escolhida por menor privilégio, diff mínimo, ausência de consumidor público, inexistência de campo canônico de publicação/visibilidade, inexistência de dependência real de `moderator`, compatibilidade com registros legados e ausência de dependência de runtime.
- Rule futura recomendada:

  ```text
  match /media_library/{mediaId} {
    allow read: if isAdmin();
    allow write: if isAdmin();
  }
  ```

- Admin ativo manterá get, list integral, leitura de registro legado/esparso, get inexistente autorizado com `exists() == false`, create, update e delete.
- Anônimo, usuário comum, usuário autenticado sem perfil, `moderator` e Admin inativo terão leitura negada; as escritas continuarão submetidas ao contrato Admin-only.
- Ausência de `usuarios/{uid}` não concede permissão.
- O contrato institucional definitivo de `moderator` e de `ativo` permanece reservado ao `ADMIN-B2A5`.
- Não incluir helper novo, `isModerator()`, campo de publicação/status, validação de schema, autoria, timestamps, transições editoriais ou mudança do contrato de ativo.

### Separação entre Firestore e Cloud Storage

- `media_library` é coleção Firestore de catálogo e metadados e constitui o objeto exclusivo do `ADMIN-B2A4`.
- `cms-media` é caminho de Cloud Storage para arquivos físicos e URLs de download e permanece fora do B2A4, reservado ao `ADMIN-B2B` ou bloco posterior autorizado.
- Proteger `media_library` impedirá leitura e enumeração dos documentos, mas não revogará URLs existentes, não tornará privados arquivos públicos no Storage, não alterará imagens copiadas para notícias/eventos/banners e não modificará `storage.rules`.
- Índices, App Check, CSP, metadata e runtime não precisam mudar.

### Plano do futuro ADMIN-B2A4-EXEC

- Estado: pendente, não iniciado e dependente de autorização humana explícita.
- Arquivos funcionais exclusivos:
  - `firestore.rules`;
  - `tests/firestore.rules.test.mjs`.
- Qualquer terceiro arquivo exigirá nova autorização.
- Baseline atual: 69 testes em 5 suítes; 10 testes dedicados de `media_library`; um teste adicional de `moderator/create` em outra suíte deve permanecer intacto.
- Renomear a suíte `Baseline atual de media_library` para `Contrato de leitura e escrita de media_library`.
- Renomear os 10 testes dedicados, retirando “BASELINE ATUAL” e referências a comportamento futuro.
- Inverter exatamente quatro resultados:
  1. anônimo get: ALLOW → DENY;
  2. anônimo list: ALLOW → DENY;
  3. usuário comum get: ALLOW → DENY;
  4. `moderator` get: ALLOW → DENY.
- Preservar exatamente seis resultados:
  1. Admin ativo get: ALLOW;
  2. anônimo create: DENY;
  3. usuário comum create: DENY;
  4. `moderator` create: DENY;
  5. Admin ativo create: ALLOW;
  6. Admin inativo create: DENY.
- Adicionar exatamente 18 testes:
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
- Remover zero testes e não alterar semanticamente as outras quatro suítes.
- Contagem futura exata:
  - `noticias`: 37;
  - `media_library`: 28;
  - `ativo`/`isAdmin`: 9;
  - `moderator`: 10;
  - fallback deny: 3;
  - total: 87 testes em 5 suítes.
- Resultado futuro obrigatório: 87 pass; 0 fail; 0 skipped; 0 cancelled; 0 todo; exit code 0; coverage local HTTP 200.

### Fixtures, harness, riscos e rollback futuros

- Usar somente fixtures sintéticas: registro legado/esparso; registro compatível com runtime com `title`, `url`, `storagePath`, `contentType`, `size`, `category` e `alt` quando necessário; Admin ativo; Admin inativo; `moderator`; usuário comum; usuário autenticado sem perfil.
- Nenhum dado, URL, UID ou metadado real.
- Preservar `withSecurityRulesDisabled()` somente para seeds, `clearFirestore()`, cleanup, `node:test`, `assertSucceeds`, `assertFails`, concorrência 1 e o projeto obrigatório `demo-turismo-sms-rules-test`.
- Riscos futuros controlados: regressão de leitura do Admin, alteração acidental das outras suítes, confusão entre documento Firestore e arquivo Storage e interpretação incorreta de código local como Rule publicada.
- Rollback planejado do futuro EXEC: restaurar somente o match atual de `media_library` e o baseline correspondente nos dois arquivos funcionais antes de qualquer commit; como o EXEC não publicará Rules, produção permanecerá inalterada.

### Produção, publicação e roadmap

- O futuro EXEC não publicará Firestore Rules e não fará deploy.
- A publicação continua exclusiva do `ADMIN-B3`, após revisão final e autorização explícita próprias.
- A ordem permanece `ADMIN-B2A4-EXEC` → `ADMIN-B2A5` → `ADMIN-B2B` → `ADMIN-B3`.
- Nenhuma etapa posterior foi iniciada.

### Arquivos alterados nesta governança

- `CLAUDE.md` — estado durável do PREP aprovado, contrato Admin-only, separação Firestore/Storage, plano de testes e gate do roadmap.
- `TASKS.md` — PREP concluído, EXEC pendente, matriz futura, fixtures, contagem 87/5, escopo de dois arquivos e proibição de publicação.
- `CHANGELOG_AI.md` — este registro cronológico.

### Limites desta atualização documental

- Alteração restrita aos três arquivos de governança.
- `firestore.rules`, `tests/firestore.rules.test.mjs`, `storage.rules`, runtime, Admin, Portal, CMS, HTML, App Check, CSP, dados, assets, índices e metadata permaneceram intactos.
- A data/hora pública do site e `js/site-meta.js` não foram atualizadas.
- Nenhum teste, Emulator, acesso remoto, deploy, publicação, commit ou push foi executado nesta atualização documental.
- `.claude/settings.local.json` permaneceu não rastreado, não lido e intocado.

---

## 2026-07-29 — Conclusão funcional do ADMIN-B2A3-EXEC

**Ferramenta/modelo:** Codex

**Responsável pela aprovação:** Jacob

**Status:** `ADMIN-B2A3-EXEC` concluído, auditado, validado localmente, commitado e enviado para `origin/main`; Rule versionada e ainda não publicada.

### Objetivo

Registrar exclusivamente a conclusão funcional do `ADMIN-B2A3-EXEC`, o contrato final de leitura de `noticias`, a validação local de 69/69, o commit e o push funcionais e a distinção entre código versionado e Rule ativa em produção, sem iniciar bloco posterior.

### 1. Implementação funcional

- Rule anterior:

  ```text
  allow read: if true;
  ```

- Rule nova versionada:

  ```text
  allow read: if isAdmin() || (resource.data.publicado == true);
  ```

- Escrita preservada exatamente como:

  ```text
  allow write: if isAdmin();
  ```

- Arquivos funcionais exclusivos:
  - `firestore.rules`;
  - `tests/firestore.rules.test.mjs`.
- Admin autorizado continua lendo notícias publicadas, drafts, documentos legados, documentos sem `publicado` e tipos históricos ou inválidos; também lista integralmente a coleção.
- Público anônimo lê somente `publicado == true` booleano; campo ausente, `false`, `null`, string, número, lista, mapa ou apenas `status: "publicado"` permanecem privados.
- Usuário comum autenticado e `moderator` seguem o ramo público e não ganham acesso a drafts. O contrato definitivo de `moderator` continua reservado ao `ADMIN-B2A5`.
- `status` não participa da autorização, não substitui `publicado` e não revoga `publicado: true`.
- Precedência registrada: `publicado: true` com `status: "rascunho"` permanece público; `status: "publicado"` sem `publicado: true` permanece privado.
- Create, update e delete continuam sob `isAdmin()`.
- Nenhuma validação adicional de schema, autoria, timestamps ou transição editorial foi incluída.

### 2. Auditoria estática

- Parecer: **A. implementação completa e compatível**.
- Os 12 testes existentes de `noticias` foram renomeados.
- Exatamente quatro resultados inseguros foram invertidos:
  1. anônimo lendo draft;
  2. anônimo listando toda a coleção;
  3. usuário comum lendo draft;
  4. `moderator` lendo draft.
- Foram adicionados 25 testes e removidos zero testes.
- Composição final:
  - `noticias`: 37 testes;
  - `media_library`: 10 testes;
  - `ativo`/`isAdmin`: 9 testes;
  - `moderator`: 10 testes;
  - fallback deny: 3 testes;
  - total: 69 testes em 5 suítes.
- Nenhum outro `match`, helper, índice, Storage Rule, configuração ou dependência foi alterado.

### 3. Validação funcional local

- Classificação: **A. validado funcionalmente**.
- Comando: `npm run test:rules`.
- Projeto: `demo-turismo-sms-rules-test`.
- Ambiente: somente Firestore Emulator local, usando `firestore.rules` local.
- Resultado:
  - 69 testes;
  - 5 suítes;
  - 69 pass;
  - 0 fail;
  - 0 skipped;
  - 0 cancelled;
  - 0 todo;
  - exit code 0.
- Coverage: endpoint local respondeu HTTP 200.
- Emulator encerrado automaticamente.
- Portas 8080 e 4000 sem listeners após a suíte.
- `firestore-debug.log` foi gerado pelo Emulator e removido após a validação.
- Os hashes de `firestore.rules` e `tests/firestore.rules.test.mjs` permaneceram preservados antes e depois da suíte.

#### Tentativa ambiental anterior

- Uma primeira execução terminou antes do Emulator por erro ambiental `EPERM` relacionado ao configstore local do Firebase CLI.
- Nenhuma Rule, teste, configuração ou dependência foi alterada em decorrência do erro.
- A segunda execução autorizada concluiu com sucesso em 69/69.
- A tentativa ambiental não é classificada como falha funcional da implementação.

### 4. Commit funcional

- Hash completo: `4f25d8b0385efa760ba21c77a5211293eb84ea0f`.
- Hash curto: `4f25d8b`.
- Mensagem: `fix: restringir leitura pública de notícias`.
- Escopo confirmado no commit:
  - `firestore.rules`;
  - `tests/firestore.rules.test.mjs`.

### 5. Push

- A branch `main` foi enviada para `origin/main`.
- Estado confirmado após o push:
  - `HEAD`: `4f25d8b0385efa760ba21c77a5211293eb84ea0f`;
  - `main`: `4f25d8b0385efa760ba21c77a5211293eb84ea0f`;
  - `origin/main`: `4f25d8b0385efa760ba21c77a5211293eb84ea0f`.

### 6. Limites, produção e roadmap

- Nenhum acesso ao Firebase real.
- Nenhuma leitura ou alteração de dados reais.
- Nenhum deploy.
- Nenhuma publicação de Firestore Rules.
- Nenhuma alteração de Admin, Portal, CMS, HTML, App Check, CSP, índices, Storage, assets, metadata ou `js/site-meta.js`.
- Código versionado no Git não publica Security Rules.
- Produção continua com a Rule anteriormente publicada e permanece inalterada.
- A publicação continua exclusiva do `ADMIN-B3`, que permanece não iniciado e exige autorização humana separada.
- `ADMIN-B2A4` permanece o próximo bloco possível, posterior e não iniciado; exige PREP e autorização humana próprios.
- A ordem posterior permanece `ADMIN-B2A4` → `ADMIN-B2A5` → `ADMIN-B2B` → `ADMIN-B3`.
- Nenhuma etapa posterior foi iniciada nesta governança.

### Arquivos alterados nesta governança

- `CLAUDE.md` — estado durável do EXEC, contrato final, validação, commit/push, distinção Git/produção e gate do roadmap.
- `TASKS.md` — conclusão do PREP/EXEC, evidências 69/69, composição das suítes, commit, push e `ADMIN-B2A4` como próximo bloco possível.
- `CHANGELOG_AI.md` — este registro cronológico.

### Limites desta atualização documental

- Alteração restrita aos três arquivos de governança.
- Nenhum teste, Emulator, acesso remoto, deploy, publicação, commit ou push foi executado nesta atualização documental.
- `.claude/settings.local.json` permaneceu não rastreado e intocado.
- `firestore.rules` e `tests/firestore.rules.test.mjs` foram somente lidos e permaneceram intactos em relação ao commit funcional.

---

## 2026-07-27 — Aprovação do ADMIN-B2A3-PREP

**Ferramenta/modelo:** Codex

**Responsável pela aprovação:** Jacob

**Status:** governança atualizada; `ADMIN-B2A3-PREP` concluído e aprovado; `ADMIN-B2A3-EXEC` pendente e não iniciado.

### Objetivo

Registrar exclusivamente a conclusão e a aprovação do `ADMIN-B2A3-PREP`, o contrato escolhido para leitura de `noticias`, o escopo do futuro `ADMIN-B2A3-EXEC` e os gates de publicação, sem iniciar execução funcional.

### Limites do PREP

- Análise realizada somente por leitura.
- Nenhum arquivo funcional foi alterado.
- Nenhum teste ou Firebase Emulator foi executado.
- Nenhum Firebase remoto foi acessado.
- Nenhuma publicação, deploy, commit ou push foi realizado.
- Nenhuma mudança de dados, migração ou inventário remoto ocorreu.
- `ADMIN-B2A3-EXEC` não foi iniciado.

### Contrato aprovado de leitura de `noticias`

- Admin autorizado pode ler todos os documentos, incluindo publicados, drafts, documentos sem `publicado` e registros legados, por `isAdmin()`.
- Público anônimo, usuário comum autenticado e `moderator` podem ler somente documentos cujo campo `publicado` seja o booleano `true`.
- `publicado` é o único campo canônico de autorização pública.
- `status` não autoriza nem revoga leitura.
- São negados ao público: `publicado: false`, campo ausente, `null`, `"true"`, `1`, `[]`, `{}` e `status: "publicado"` sem `publicado: true`.
- `publicado: true` com `status: "rascunho"` continua público, pois `publicado` controla a Rule.
- `moderator` não recebe acesso administrativo a drafts neste bloco; seu contrato definitivo permanece reservado ao `ADMIN-B2A5`.
- A escrita continua exclusiva de Admin.

Rule escolhida para o futuro EXEC:

```text
match /noticias/{noticiaId} {
  allow read: if isAdmin() || (resource.data.publicado == true);
  allow write: if isAdmin();
}
```

### Alternativas analisadas

1. **Admin ou `publicado == true`: escolhida.** Produz diff funcional mínimo de uma linha, preserva escrita e leitura administrativa, mantém compatibilidade com a query pública e falha de forma fechada para ausência e tipos inválidos.
2. **Separar `allow get` e `allow list`: válida, porém desnecessária no contrato atual.** O mesmo critério aprovado vale para ambos.
3. **Criar helper `isNoticiaPublicada()`: descartada.** Excesso de abstração para uma única ocorrência.
4. **Incluir `isModerator()`: descartada.** Ampliaria privilégios antes da decisão humana reservada ao `ADMIN-B2A5`.
5. **Autorizar `status == "publicado"`: descartada.** Criaria contrato ambíguo e possibilidade de exposição inconsistente.
6. **Manter `allow read: if true` e confiar na query: descartada.** Firestore Rules não funcionam como filtro de segurança; a query não substitui a autorização.

### Compatibilidade e segurança

- A query pública atual já usa `where("publicado", "==", true)`.
- O Admin atualmente lista toda a coleção e precisa continuar compatível.
- Não há dependência comprovada de `moderator` para leitura de drafts.
- Ausência e tipos inválidos de `publicado` devem negar leitura pública.
- Não existe `match` sobreposto que conceda acesso alternativo.
- O fallback recursivo continua deny.
- Índices não precisam ser alterados.
- App Check e CSP estão fora do escopo.
- A publicação das Firestore Rules permanece bloqueada até o `ADMIN-B3`.
- Registros legados poderão exigir inventário sanitizado antes da publicação, mas nenhum inventário remoto foi realizado nesta sessão.

### Escopo futuro do ADMIN-B2A3-EXEC

- Estado: pendente e não iniciado.
- Depende de nova autorização humana explícita.
- Arquivos funcionais autorizados futuramente:
  - `firestore.rules`;
  - `tests/firestore.rules.test.mjs`.
- Qualquer terceiro arquivo exigirá nova autorização.
- Estado atual da suíte: 44 testes, 5 suítes e 12 testes atuais de `noticias`.
- Estratégia futura:
  - renomear os 12 testes atuais de `noticias`;
  - inverter exatamente quatro resultados inseguros: anônimo lendo draft, anônimo listando toda a coleção, usuário comum lendo draft e `moderator` lendo draft;
  - adicionar exatamente 25 testes;
  - remover zero testes.
- Resultado esperado futuro: 69 testes, 5 suítes, 69 pass, 0 fail, 0 skipped, 0 cancelled e 0 todo.
- Usará somente o projeto demo `demo-turismo-sms-rules-test` e somente o Firestore Emulator local.
- Não acessará produção, não publicará Rules, não alterará índices, não instalará dependências, não alterará runtime e não alterará dados.
- Site público, Admin, Portal, App Check e CSP permanecerão fora do escopo.

### Arquivos alterados nesta governança

- `CLAUDE.md` — estado durável do PREP aprovado, contrato de leitura, escopo futuro e gates do EXEC/B3.
- `TASKS.md` — estado atual, contrato, estratégia de testes, contagens futuras e ordem do roadmap.
- `CHANGELOG_AI.md` — este registro cronológico.

### Comandos executados nesta governança

```powershell
Set-Location "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -15
git rev-parse HEAD
git rev-parse main
git rev-parse origin/main
git show-ref --tags --verify "refs/tags/pre-admin-restart-20260720"
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -LiteralPath "TASKS.md"
Get-Content -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git diff -- CLAUDE.md
git diff -- TASKS.md
git diff -- CHANGELOG_AI.md
git status --short --branch --untracked-files=all
```

### Validações e preservações

- Escopo restrito a `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`.
- `firestore.rules` e `tests/firestore.rules.test.mjs` permaneceram intactos.
- Nenhum arquivo funcional, HTML, Admin, Portal, dado, asset, metadata, App Check, CSP ou arquivo de produção foi alterado.
- `js/site-meta.js` permaneceu intacto; a data/hora pública do site não foi atualizada.
- `.claude/settings.local.json` permaneceu não rastreado, sem leitura, edição, adição ou remoção.
- Nenhum `firestore-debug.log` foi criado.
- Não houve teste, Emulator, acesso remoto, publicação, commit, push ou deploy.

### Próximo passo

- `ADMIN-B2A3-EXEC` permanece não iniciado.
- O próximo passo depende de nova autorização humana explícita.
- A ordem posterior permanece `ADMIN-B2A3-EXEC` → `ADMIN-B2A4` → `ADMIN-B2A5` → `ADMIN-B2B` → `ADMIN-B3`.

---

## 2026-07-27 — Aprovação do bridge público e da correção CSP

**Ferramenta/modelo:** Codex

**Responsável pela aprovação:** Jacob

**Status:** governança atualizada; `ADMIN-B2A2-CSP-FIX-EXEC` concluído e publicado; `ADMIN-B2A2-CSP-FIX-PROD-VALIDATION` aprovado; `ADMIN-B2A2-BRIDGE` aprovado funcionalmente; gate do futuro `ADMIN-B2A3-PREP` liberado.

### Objetivo

Registrar oficialmente o encerramento funcional do bridge público de notícias e da correção mínima da CSP para reCAPTCHA/App Check, consolidar a publicação e a validação em produção e liberar somente o gate do próximo PREP, sem alterar runtime, Rules, testes, dados ou produção nesta atualização documental.

### Contexto e diagnóstico

- O `ADMIN-B2A2-BRIDGE` já havia sido publicado, mas sua validação funcional permaneceu bloqueada porque a meta CSP impedia o carregamento do reCAPTCHA usado pelo App Check.
- O `ADMIN-B2A2-NETWORK-DIAG-PREP` confirmou a incompatibilidade CSP/reCAPTCHA como defeito real sem declarar antecipadamente que ela fosse a única causa do timeout.
- Depois do `ADMIN-B2A2-CSP-FIX-EXEC`, reCAPTCHA, App Check, Firestore e o runtime CMS foram validados no domínio oficial.
- `ADMIN-B2A2-FIRESTORE-TRANSPORT-PREP` não é necessário no estado atual; somente deve ser reaberto se timeout reaparecer com CSP válida.

### Commits funcionais confirmados pelo Git

#### Bridge público de notícias

- Commit: `4b1b783398fa659ebbff7302cdf1038e6bdd184a`.
- Mensagem: `fix: filtrar notícias públicas no Firestore`.
- Presença: confirmado como ancestral de `origin/main`.
- Arquivos: `js/cms.js`, `js/site-meta.js`, `noticia.html` e `noticias.html`.
- Estatística: 4 arquivos alterados, 32 inserções e 29 remoções.

#### Correção CSP

- Commit: `e2c82494c438f7f722fcf82fa47c1705f8854feb`.
- Mensagem: `fix: permitir reCAPTCHA nas páginas Firebase públicas`.
- Presença: `HEAD`, `main`, `origin/main` e `origin/HEAD`; confirmado como ancestral de `origin/main`.
- Arquivos: `js/site-meta.js`, `noticia.html`, `noticias.html`, `reservas.html` e `sabores.html`.
- Estatística: 5 arquivos alterados, 5 inserções e 5 remoções.
- Metadata funcional confirmada em `js/site-meta.js`: `updatedAt: "2026-07-27T13:07:40-03:00"`.
- Horário do commit Git: `2026-07-27T13:10:06-03:00`.

### Contrato final do bridge

- A consulta pública usa `where('publicado', '==', true)`.
- O filtro posterior permanece como defesa adicional.
- Consulta Firestore vazia é sucesso: `CMS.posts = []` e `CMS.source = 'firebase'`.
- Fallback local é usado somente em falha real.
- `noticia.html` carrega `config.js` antes de `js/cms.js`.
- Token do CMS preservado: `admin-b2a2-20260724`.
- Firestore Rules permaneceram intactas.

### Delta CSP publicado

- `script-src` recebeu `https://www.google.com/recaptcha/`.
- `frame-src` recebeu `https://recaptcha.google.com/recaptcha/`.
- `connect-src` recebeu:
  - `https://firebaseinstallations.googleapis.com`;
  - `https://content-firebaseappcheck.googleapis.com`;
  - `https://firebaseappcheck.googleapis.com`;
  - `https://www.google.com/recaptcha/`.
- Foram preservados todas as diretivas e origens anteriores, `unsafe-inline`, `unsafe-eval`, wildcards existentes, posição da meta, UTF-8 sem BOM, LF, Service Worker, `CACHE_NAME` e tokens dos scripts.
- Não foram adicionados `script-src-elem`, `script-src-attr`, nonce, `strict-dynamic`, wildcard novo, endpoints de source map, `securetoken` ou `*.googleapis.com`.

### Publicação confirmada

- HTTP 200 no domínio oficial para `noticias.html`, `noticia.html`, `reservas.html`, `sabores.html` e `js/site-meta.js`.
- As quatro páginas servem exatamente uma meta CSP.
- Headers observados: `Cache-Control: max-age=600`, `Server: GitHub.com` e `Via: 1.1 varnish`.
- CSP por header: ausente.
- CSP Report-Only: ausente.
- A política ativa continua vindo somente da meta HTML.
- `_headers` local não é aplicado pelo hosting atual e permaneceu intacto.

### Validação Chrome e Firefox

- Chrome: hard reload concluído; `api.js`, iframe e endpoints App Check não foram bloqueados; `getDocsFromServer` e CMS Firebase foram aprovados.
- Firefox: hard reload concluído; `grecaptcha` disponível como objeto; `api.js`, iframes e anchors carregados; CMS Firebase com 8 itens e sem diferença funcional relevante.
- Os bloqueios de `firebase-app.js.map`, `firebase-firestore.js.map` e `firebase-app-check.js.map` permanecem classificados como recursos de depuração, sem impacto funcional.
- Avisos de cookies e armazenamento particionado no Firefox permanecem informativos, sem falha funcional comprovada.

### Resultado Firestore e runtime CMS

- `getDocsFromServer`:
  - `ok: true`;
  - `source: server`;
  - `count: 8`;
  - `allPublished: true`.
- Runtime CMS:
  - binding: `object`;
  - `CMS.source: firebase`;
  - `count: 8`;
  - `allPublished: true`.
- Não houve `permission-denied`, timeout, `unavailable` ou fallback por `CONFIG.firebase` ausente.
- Conclusão: o `ADMIN-B2A2-BRIDGE` está aprovado e a consulta pública é compatível com a futura proteção de drafts nas Rules.

### Páginas validadas

- `noticias.html`: página íntegra, grid visível, 8 cards presentes e visíveis, nenhum draft no resultado normalizado, `config.js` e `js/cms.js` carregados uma vez cada.
- `noticia.html` com slug inexistente: “Notícia não encontrada”, nenhum conteúdo de outro documento, scripts únicos e CMS mantido em Firebase.
- `reservas.html`: smoke somente de leitura aprovado, 6 cards, formulário fechado e nenhuma escrita.
- `sabores.html`: smoke somente de leitura aprovado, conteúdo estrutural íntegro, banners sem bloqueio e nenhuma escrita.

### Limitação residual e follow-up

- O detalhe de uma notícia publicada permanece **NÃO TESTADO**.
- A listagem apresentou `internalDetailLinkCount: 0`; nenhum link interno seguro para `noticia.html?slug=...` estava disponível.
- Nenhum slug foi inventado ou extraído manualmente.
- Tratar a navegação de detalhes como follow-up funcional separado.
- A limitação não bloqueia a aprovação da CSP, do bridge ou o início futuro do `ADMIN-B2A3-PREP`.

### Ausência de escrita e preservações

- Permaneceram intactos: `firestore.rules`, `storage.rules`, `tests/firestore.rules.test.mjs`, `admin-firebase.html`, `portal-usuario.html`, `js/cms.js` após o commit do bridge, `js/firebase-app-check.js`, `config.js`, `sw.js`, dados, Firebase remoto, App Check remoto, enforcement, Admin e Portal.
- Nenhuma Rule foi publicada.
- Não houve escrita, criação ou alteração de dados.
- A publicação das Rules continua exclusiva do `ADMIN-B3`.

### Rollback

- O bridge permanece isolado no commit `4b1b783398fa659ebbff7302cdf1038e6bdd184a`.
- A correção CSP permanece isolada no commit `e2c82494c438f7f722fcf82fa47c1705f8854feb`.
- Se rollback futuro for autorizado, cada bloco deve ser revertido por novo commit revisado, sem reescrever histórico e sem misturar publicação de Rules.
- Nenhum rollback foi executado nesta governança.

### Roadmap e gate

- `ADMIN-B2A1-EXEC`: concluído; baseline 44/44.
- `ADMIN-B2A2-BRIDGE`: concluído, publicado, validado contra o servidor e aprovado.
- `ADMIN-B2A2-NETWORK-DIAG-PREP`: concluído; diagnóstico conservador correto.
- `ADMIN-B2A2-CSP-FIX-PREP`, `EXEC` e `PROD-VALIDATION`: concluídos, publicados e aprovados.
- `ADMIN-B2A2-FIRESTORE-TRANSPORT-PREP`: não necessário no estado atual.
- `ADMIN-B2A3-PREP`: próximo bloco recomendado, exclusivamente leitura e planejamento; gate liberado e bloco ainda não iniciado.
- `ADMIN-B2A3-EXEC`: posterior, local e reversível; alteração de Rules, inversão/ampliação dos testes e Emulator, sem publicação.
- `ADMIN-B2A4`: proteção de `media_library`, posterior.
- `ADMIN-B2A5`: contratos de `ativo` e `moderator`, posterior e dependente de decisões humanas.
- `ADMIN-B2B`: Storage Rules, posterior.
- `ADMIN-B3`: única etapa autorizada a publicar Rules.

O gate do `ADMIN-B2A3-PREP` foi liberado porque o consumidor público já filtra `publicado == true`, a query real foi aceita pelo servidor, `allPublished` foi `true`, `CMS.source` foi `firebase`, CSP/App Check não bloquearam a leitura e nenhuma incompatibilidade entre query e Rules foi observada.

O gate não autoriza editar `firestore.rules` nesta tarefa, iniciar `ADMIN-B2A3-EXEC`, publicar Rules ou alterar dados.

### Próximo bloco — registrado e não iniciado

`ADMIN-B2A3-PREP`, somente leitura e planejamento, para:

- definir a Rule mínima de leitura pública quando `publicado == true`;
- manter leitura administrativa de drafts;
- planejar a inversão dos testes inseguros do baseline;
- verificar `get`, `list` e query;
- preservar compatibilidade com a query já publicada;
- preparar um futuro `ADMIN-B2A3-EXEC` local e reversível.

### Arquivos alterados nesta governança

- `CLAUDE.md` — estado durável do bridge, CSP, limitação residual, gate e exclusividade do `ADMIN-B3`.
- `TASKS.md` — evidências, commits, publicação, validações, riscos, roadmap e próximo PREP.
- `CHANGELOG_AI.md` — este registro detalhado.

### Comandos executados nesta governança

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -20
git rev-parse 4b1b783
git rev-parse e2c8249
git show --stat --oneline --decorate --no-renames 4b1b783
git show --format= --name-status --no-renames 4b1b783
git show --stat --oneline --decorate --no-renames e2c8249
git show --format= --name-status --no-renames e2c8249
git merge-base --is-ancestor 4b1b783 origin/main
git merge-base --is-ancestor e2c8249 origin/main
Get-Content -LiteralPath "CLAUDE.md"
Get-Content -LiteralPath "TASKS.md"
Get-Content -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
git diff -- .claude
```

### Limites desta governança

- Atualização exclusivamente documental.
- Nenhum teste funcional, npm, Emulator, login, Firebase CLI, metadata, deploy, publicação de Rules, commit, push, tag ou outro bloco foi executado.
- `.claude/settings.local.json` permaneceu não rastreado e intocado.
- Sugestão de commit: `docs: registrar aprovação do bridge e da correção CSP`.

---

## 2026-07-27 — Encerramento do ADMIN-B2A2-NETWORK-DIAG-PREP

**Ferramenta/modelo:** Codex

**Responsável pela aprovação:** Jacob

**Status:** governança atualizada; `ADMIN-B2A2-NETWORK-DIAG-PREP` concluído com defeito CSP/reCAPTCHA confirmado e causa única do timeout do Firestore ainda inconclusiva.

### Objetivo

Registrar o parecer final do diagnóstico de rede posterior ao bridge público de notícias, sem alterar runtime, Rules, CSP ou produção, e deixar `ADMIN-B2A2-CSP-FIX-PREP` apenas como próximo bloco recomendado.

### Estado funcional anterior preservado

- `ADMIN-B2A2-BRIDGE-PREP` e `ADMIN-B2A2-BRIDGE` estão concluídos.
- Commit funcional: `4b1b783398fa659ebbff7302cdf1038e6bdd184a fix: filtrar notícias públicas no Firestore`, presente em `HEAD` e `origin/main`.
- O commit alterou `js/cms.js`, `noticias.html`, `noticia.html` e a metadata em `js/site-meta.js`.
- A consulta pública usa `where('publicado', '==', true)`.
- Resultado vazio do Firestore permanece sucesso com `CMS.posts = []` e `CMS.source = 'firebase'`; fallback local ocorre somente em falha.

### Matriz confirmada

- Firefox normal / rede residencial: timeout.
- Firefox normal / rede institucional: timeout.
- Firefox normal / hotspot móvel: timeout.
- Chrome / hotspot móvel: timeout.
- CSP/reCAPTCHA bloqueada em todas as combinações testadas.
- Sem `permission-denied`.
- Sem `CONFIG.firebase` ausente.

### Parecer

- Recurso crítico bloqueado: `https://www.google.com/recaptcha/api.js`.
- Origem observada: `firebase-app-check.js`.
- Status: bloqueado por `script-src-elem`.
- A CSP não define `script-src-elem` separadamente; o navegador utiliza `script-src` como fallback, e o endereço do reCAPTCHA não está autorizado.
- A incompatibilidade CSP/reCAPTCHA é um defeito confirmado.
- Não há evidência suficiente para afirmar que ela seja a única causa do timeout do Firestore.
- `firebase-app.js.map`, `firebase-firestore.js.map` e `firebase-app-check.js.map` também foram bloqueados por `connect-src`, mas são recursos de depuração do DevTools e não constituem, isoladamente, falha de execução dos módulos Firebase.

### Decisões e limites

- Não alterar `js/cms.js`.
- Não alterar Firestore Rules.
- Não iniciar `ADMIN-B2A3`.
- Não testar long polling ainda.
- Não aplicar correção de CSP nesta governança.
- Não executar commit, push ou deploy.

### Próximo bloco recomendado — não iniciado

`ADMIN-B2A2-CSP-FIX-PREP`, exclusivamente para:

- localizar a fonte exata da meta CSP;
- propor a alteração mínima;
- revisar `script-src`/`script-src-elem`, `frame-src` e `connect-src` conforme os requisitos oficiais do reCAPTCHA;
- preservar todas as demais diretivas;
- não aplicar a correção sem autorização de EXEC própria.

### Arquivos alterados nesta governança

- `CLAUDE.md` — estado durável, parecer do diagnóstico, limites e próximo PREP.
- `TASKS.md` — estado atual, matriz, roadmap e próximo bloco recomendado.
- `CHANGELOG_AI.md` — este registro.

### Validações e preservações

- Escopo restrito aos três arquivos de governança.
- `.claude/settings.local.json` permaneceu não rastreado e intocado.
- Nenhum HTML, CSS, JavaScript de runtime, Rule, configuração Firebase, CSP, dado, metadata ou arquivo em `.claude/` foi alterado.
- Nenhum teste de runtime, Rules, rede ou long polling foi repetido nesta atualização documental.

---

## 2026-07-24 — Conclusão do ADMIN-B2A1-EXEC

**Ferramenta/modelo:** Codex

**Responsável pela aprovação:** Jacob

**Status:** governança atualizada; `ADMIN-B2A1-EXEC` concluído, validado, commitado, enviado por push e presente em `origin/main`; `ADMIN-B2A2-BRIDGE-PREP` registrado e não iniciado.

### Objetivo

Registrar oficialmente a conclusão do `ADMIN-B2A1-EXEC`, que criou a infraestrutura local e isolada e o baseline automatizado das Firestore Rules administrativas antes de qualquer correção ou publicação. Esta atualização é exclusivamente documental e não repete testes, não altera Rules e não inicia outro bloco.

### Estado das frentes

- Frente ativa: Painel Admin, CMS, Firebase Authentication, Firestore, Firebase Storage, segurança administrativa, moderação e integridade dos fluxos.
- Blocos concluídos: `ADMIN-RESTART-PREP`, `ADMIN-B1-PREP`, `ADMIN-B1B-PREP`, `ADMIN-B2A-PREP` e `ADMIN-B2A1-EXEC`.
- Permanecem pausados: site público, V7C1, V7C2, V6, B3 público, Fable e integração CMS → site público.
- Checkpoint existente e preservado: `pre-admin-restart-20260720`.

### Evidência confirmada pelo Git

- Commit funcional completo: `9ccc595d34edb106348936f23ce789329047280c`.
- Mensagem: `test(rules): adiciona baseline local das Firestore Rules administrativas`.
- O commit está em `HEAD`, `main`, `origin/main` e `origin/HEAD`.
- Arquivos reais do commit:
  - `firebase.json` — modificado;
  - `package.json` — criado;
  - `package-lock.json` — criado;
  - `tests/firestore.rules.test.mjs` — criado.
- Estatística real: 4 arquivos alterados e 10.129 inserções:
  - `firebase.json`: 10 inserções;
  - `package.json`: 14 inserções;
  - `package-lock.json`: 9.442 inserções;
  - `tests/firestore.rules.test.mjs`: 663 inserções.

### Infraestrutura local criada

- `package.json`: `private: true`, `type: module`, somente `devDependencies`, runner Node separado, execução pelo Firestore Emulator e concorrência 1.
- Não foram adicionados scripts de build, deploy ou produção.
- Dependências diretas exatas:
  - `firebase@12.16.0`;
  - `@firebase/rules-unit-testing@5.0.1`;
  - `firebase-tools@15.24.0`.
- `package-lock.json`: lockfile version 3, gerado e versionado, com 9.442 linhas e dependências raiz limitadas às três versões autorizadas.
- `firebase.json` preservou `firestore.rules` e `storage.rules` e adicionou somente:
  - Firestore Emulator na porta 8080;
  - Emulator UI na porta 4000;
  - `singleProjectMode: true`.
- Não foram adicionados Auth Emulator, Storage Emulator, Functions, Hosting, import/export ou projeto Firebase real.

### Projeto demo e isolamento

- Projeto obrigatório e exclusivo: `demo-turismo-sms-rules-test`.
- O mesmo ID foi usado no script npm, Firebase CLI, `initializeTestEnvironment` e endpoint local de coverage.
- O project ID real `turismo-sms` não teve uso operacional.
- Não houve login Firebase, API key, token, credencial, chamada de produção, dado real, UID real, e-mail real ou URL real.

### Suíte automatizada

- Arquivo: `tests/firestore.rules.test.mjs`.
- Estrutura:
  - `node:test`;
  - `@firebase/rules-unit-testing`;
  - API modular do Firestore;
  - leitura de `firestore.rules` diretamente do disco;
  - uma inicialização de `initializeTestEnvironment`;
  - `clearFirestore` antes de cada teste;
  - `cleanup` no final;
  - `withSecurityRulesDisabled` somente para seeds fictícios;
  - exclusivamente dados artificiais.
- Resultado final após reinstalação e limpeza:
  - testes: 44;
  - suítes: 5;
  - aprovados: 44;
  - falhas: 0;
  - cancelados: 0;
  - ignorados: 0;
  - `todo`: 0;
  - código de saída: 0.

### Baseline de `noticias`

- Anônimo lê notícia publicada e notícia draft.
- Anônimo lista toda a coleção e executa query com `publicado == true`.
- Usuário comum lê draft; `moderator` lê draft devido à leitura pública; admin ativo lê draft.
- Anônimo, usuário comum e `moderator` não criam notícia.
- Admin ativo cria notícia; admin inativo não cria.
- Decisão: o risco **P0** está documentado e reproduzível, sem aceitação institucional. A leitura pública de drafts será alterada somente no `ADMIN-B2A3`; nenhuma alteração foi feita em `firestore.rules` no B2A1.

### Baseline de `media_library`

- Anônimo faz `getDoc` e lista a coleção.
- Usuário comum, `moderator` e admin ativo leem.
- Anônimo, usuário comum e `moderator` não criam.
- Admin ativo cria; admin inativo não cria.
- Decisão: o risco **P1** está documentado e reproduzível. A proteção será alterada somente no `ADMIN-B2A4`; nenhuma alteração foi feita em `firestore.rules` no B2A1.

### Baseline do campo `ativo`

- `ativo: true` — ALLOW.
- `ativo: false` — DENY.
- Campo `ativo` ausente — DENY.
- `ativo: null`, `ativo: "true"` e `ativo: 1` — ALLOW.
- Role ausente, role inválida e documento `usuarios` ausente — DENY.
- Conclusão: o contrato atual `ativo != false` aceita valores não booleanos diferentes de `false`. A decisão e eventual correção permanecem reservadas ao `ADMIN-B2A5`.

### Baseline de `moderator`

- `moderator` ativo lê, atualiza e exclui `eventos_pendentes`; `moderator` inativo recebe DENY.
- `moderator` não cria `noticias` nem `media_library`.
- `moderator` não lista `usuarios`, mas lê o próprio documento.
- `moderator` não administra `cms_establishments` draft.
- `moderator` escreve `eventos_aprovados` conforme a Rule atual.
- Conclusão: o contrato real está automatizado; o frontend continua aceitando somente `admin`; a decisão institucional e qualquer alteração permanecem reservadas ao `ADMIN-B2A5`.

### Fallback global deny

- Anônimo não lê coleção desconhecida.
- Usuário comum não lê coleção desconhecida.
- Admin não lê coleção desconhecida sem `match` explícito.
- O fallback global deny permanece válido.

### Coverage

- Endpoint local: `http://127.0.0.1:8080/emulator/v1/projects/demo-turismo-sms-rules-test:ruleCoverage`.
- Resultado: HTTP 200.
- Nenhum arquivo de coverage foi persistido.

### Limpeza dos pacotes extraneous

- A primeira instalação relatou `google-logging-utils@1.1.4` e um `picomatch@4.0.5` aninhado como extraneous.
- `npm prune --no-save` removeu os dois pacotes.
- `package-lock.json` foi preservado por comparação de SHA-256.
- Novo `npm prune --dry-run` retornou `remove` vazio.
- `npm ls --depth=0` mostrou somente as três dependências diretas.
- `google-logging-utils` permaneceu apenas em versões transitivas legítimas.
- A suíte 44/44 passou novamente após a limpeza.
- Os pacotes extraneous não são pendência atual.

### Dívida npm não bloqueante

- Quatro avisos de pacotes depreciados.
- Sete vulnerabilidades moderadas relatadas pelo npm.
- Nenhum `npm audit fix` foi executado.
- Nenhuma atualização automática foi realizada.
- Os avisos não bloquearam o baseline local e permanecem como dívida das ferramentas de desenvolvimento.

### Rules, runtime e remoto preservados

- `firestore.rules`, `storage.rules`, `storage-cors.json`, `.firebaserc`, `config.js`, `admin-firebase.html`, `js/**`, HTML/CSS, site público, Portal do Usuário e `js/site-meta.js` permaneceram intactos no bloco funcional.
- Nenhuma Rule foi alterada, criada remotamente, sincronizada, implantada ou publicada.
- Nenhuma metadata foi atualizada.
- Não houve acesso remoto, escrita de dados, login, credencial, deploy ou publicação.
- `ADMIN-B3` continua sendo o único bloco autorizado a publicar Rules, mediante autorização explícita.

### Roadmap preservado

- `ADMIN-B2A1-EXEC`: concluído.
- `ADMIN-B2A2-BRIDGE-PREP`: próximo bloco, somente leitura/análise e não iniciado.
- `ADMIN-B2A2-BRIDGE`: adaptação mínima do consumidor público em `js/cms.js`; não iniciado e dependente de autorização explícita.
- `ADMIN-B2A3`: proteção local de drafts de `noticias` e inversão dos testes inseguros; sem publicação; não iniciado.
- `ADMIN-B2A4`: proteção local de `media_library` e inversão dos testes públicos; sem publicação; não iniciado.
- `ADMIN-B2A5`: contrato de `ativo` e `moderator`, dependente de decisões humanas; não iniciado.
- `ADMIN-B2B`: Storage Rules; não iniciado.
- `ADMIN-B3`: publicação controlada; não iniciado e continua sendo o único bloco autorizado a publicar Rules.

### Próximo passo

`ADMIN-B2A2-BRIDGE-PREP`, exclusivamente em leitura, para:

- confirmar o consumidor público real de notícias;
- confirmar o campo canônico de publicação;
- confirmar a query atual;
- determinar a alteração mínima necessária antes de restringir as Rules;
- preservar layout, conteúdo e demais funcionalidades públicas;
- não executar a bridge;
- não alterar `firestore.rules`.

### Rollback do bloco funcional

- Se um rollback do `ADMIN-B2A1-EXEC` for futuramente autorizado, o ponto reversível é o commit único `9ccc595d34edb106348936f23ce789329047280c`.
- O rollback deve ocorrer por novo commit de reversão revisado, sem reescrever histórico e sem publicação de Rules.
- Nenhum rollback foi executado nesta governança.

### Arquivos alterados nesta governança

- `CLAUDE.md` — estado durável, baseline 44/44, projeto demo, Rules intactas, ordem B2A2→B2A3→B2A4→B2A5 e próximo PREP.
- `TASKS.md` — evidência funcional, infraestrutura, dependências, testes, baselines, coverage, limpeza, dívida npm e roadmap.
- `CHANGELOG_AI.md` — este registro detalhado.

### Comandos executados nesta governança

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -20
git rev-parse 9ccc595
git show --stat --oneline --decorate --no-renames 9ccc595
git show --format= --name-status --no-renames 9ccc595
git rev-parse origin/main
git merge-base --is-ancestor 9ccc595 origin/main
git show-ref --tags --verify refs/tags/pre-admin-restart-20260720
Get-Content -Raw CLAUDE.md
Get-Content TASKS.md
Get-Content CHANGELOG_AI.md
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações e limites desta governança

- Leitura integral de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md` concluída antes da edição.
- Alteração restrita aos três arquivos de governança.
- `.claude/settings.local.json` permaneceu não rastreado e intocado.
- Nenhum código, teste, dependência, configuração Firebase, Rule, runtime, dado, metadata, tag Git ou arquivo em `.claude/` foi alterado.
- Não foram executados npm, suíte de Rules, Emulator, `ADMIN-B2A2`, `ADMIN-B2A3`, `ADMIN-B2A4`, `ADMIN-B2A5`, `ADMIN-B2B`, `ADMIN-B3`, commit, push ou deploy nesta atualização documental.
- Sugestão de commit: `docs: registrar conclusão do ADMIN-B2A1`.

---

## 2026-07-22 — Conclusão do ADMIN-B1-PREP e ADMIN-B1B-PREP

**Ferramenta/modelo:** Codex

**Responsável pela aprovação:** Jacob

**Status:** governança atualizada; `ADMIN-B1-PREP` e `ADMIN-B1B-PREP` concluídos; `ADMIN-B2A-PREP` registrado e não iniciado.

### Objetivo

Registrar oficialmente, sem alterar runtime ou configuração, a conclusão dos dois blocos somente leitura, as equivalências local/remota de Rules e CORS, o estado do App Check, os riscos confirmados, os contratos ainda pendentes e a divisão aprovada do ADMIN-B2/ADMIN-B3.

### Estado das frentes

- Frente ativa: Painel Admin, CMS, Firebase Authentication, Firestore, Firebase Storage, segurança administrativa, moderação e integridade dos fluxos.
- Permanecem pausados: site público, V7C1, V7C2, V6, B3 público, Fable e integração CMS → site público.
- Checkpoint existente e preservado: `pre-admin-restart-20260720`.
- Site público, Painel Admin/CMS e Portal do Usuário permanecem sistemas separados.

### ADMIN-B1-PREP — concluído

- Executado exclusivamente em leitura.
- Login Admin manual e real, dashboard carregado e logout normal confirmados.
- Leituras administrativas confirmadas para `usuarios`, `eventos_pendentes`, `eventos_aprovados` e `estabelecimentos_pendentes`.
- Nenhuma escrita, alteração de Auth, publicação de Rule, upload ou aplicação de CORS.
- No primeiro bloco ficaram inconclusivos: Rules remotas completas, notícias draft anônimas, `media_library` anônima, `cms-media` anônimo, CORS, usuário `moderator` e usuário inativo.
- A análise estática confirmou que o frontend aceita somente `admin`, enquanto as Rules locais concedem permissões específicas a `moderator`.

### ADMIN-B1B-PREP — concluído

- Recuperou somente por GET/LIST os releases/rulesets implantados de Firestore e Storage, o CORS atual do bucket e o estado do App Check.
- Nenhuma fonte remota foi persistida em arquivo e nenhuma configuração foi alterada.
- Projeto: `turismo-sms`; database `(default)`; Firestore em `southamerica-east1`; bucket `turismo-sms.firebasestorage.app` em `US-EAST1`.

### Firestore Rules

- Release implantada: `projects/turismo-sms/releases/cloud.firestore`.
- Ruleset implantado: `projects/turismo-sms/rulesets/65e9a0eb-bb4a-4578-9e01-42a3c8137cf2`.
- `firestore.rules` local e Rules remotas: **iguais**, com zero linhas divergentes.
- SHA-256 normalizado: `24f14a398a289a429b0aaa146451c80e115f37315d1a09dcf4e3a810712438cc`.
- Origem da verdade: o arquivo local corresponde exatamente à versão implantada.

### Storage Rules

- Release implantada: `projects/turismo-sms/releases/firebase.storage/turismo-sms.firebasestorage.app`.
- Ruleset implantado: `projects/turismo-sms/rulesets/23c647df-d6bd-4013-a3aa-a4efba2107bc`.
- `storage.rules` local e Rules remotas: **iguais**, com zero linhas divergentes.
- SHA-256 normalizado: `867deaf99e9724e00d3da89225e3d94fc2b197a7e8b14198696740e1554649fd`.
- Origem da verdade: o arquivo local corresponde exatamente à versão implantada.

### CORS

- Bucket: `turismo-sms.firebasestorage.app`.
- Origem: `https://turismo.saomateusdosul.pr.gov.br`.
- Métodos: GET e HEAD.
- Response headers: `Content-Type` e `Access-Control-Allow-Origin`.
- `maxAgeSeconds`: 3600.
- CORS remoto e `storage-cors.json` local: **iguais**.
- Decisão: não reaplicar CORS. O CMS-4C ainda exige reteste funcional; CORS ausente/divergente deixa de ser hipótese principal.

### App Check

- App Web: Cadastros Turismo; provider: reCAPTCHA.
- Firestore: Monitorando; 81% verificadas e 19% não verificadas; enforcement não aplicado.
- Storage: Não aplicado; sem enforcement.
- Authentication: Monitorando; 100% verificadas e 0% não verificadas; enforcement não aplicado.
- Decisão: não ativar enforcement nesta etapa; investigar `appCheck/fetch-network-error` separadamente e acompanhar métricas.

### Riscos confirmados

- **P0:** `noticias` possui leitura pública ampla nas Firestore Rules implantadas; filtro de status no frontend não protege documentos draft.
- **P1:** `media_library` possui leitura pública ampla nas Firestore Rules implantadas.
- **P1:** `cms-media` possui leitura pública ampla e recursiva nas Storage Rules implantadas.

### Contratos e itens inconclusivos

- `isAdmin` e `isModerator` usam `ativo != false`; não exigem explicitamente `ativo == true`.
- Firestore e Storage concedem permissões limitadas a `moderator`; o frontend do painel aceita somente `admin`.
- O comportamento real de uma conta `moderator` e de um usuário inativo não foi testado; nenhuma decisão de role deve ser implementada sem aprovação humana.
- Permanecem inconclusivos: causa exata de `appCheck/fetch-network-error`, conta `moderator` real, usuário inativo real, execução real de `submissions`, teste ponta a ponta do CMS-4C e domínio do registro App Check não exibido na tela consultada.

### ADMIN-B2 e ADMIN-B3

- O ADMIN-B2 está liberado somente para preparação; publicação de Rules não está autorizada.
- `ADMIN-B2A-PREP`: contrato e testes para Firestore Rules (`noticias`, `media_library`, `ativo`, `moderator`), sem edição.
- `ADMIN-B2A-EXEC`: alteração local de `firestore.rules` e testes no Emulator Suite, sem publicação.
- `ADMIN-B2B-PREP`: contrato e testes para Storage Rules (`cms-media`, `submissions`), sem edição.
- `ADMIN-B2B-EXEC`: alteração local de `storage.rules` e testes no Emulator Suite, sem publicação.
- `ADMIN-B3`: revisão final, autorização explícita, publicação controlada das Rules e reteste remoto.
- Prioridade do futuro B2A: proteger notícias draft, proteger `media_library`, definir o contrato de `ativo`, definir o papel `moderator` e criar testes das identidades/operações.

### Arquivos alterados

- `CLAUDE.md` — estado durável dos blocos, equivalências, App Check, riscos, contratos e gate do próximo passo.
- `TASKS.md` — estado atual, blocos concluídos, critérios, roadmap B2A/B2B/B3 e `ADMIN-B2A-PREP` como próximo bloco.
- `CHANGELOG_AI.md` — este registro documental.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -15
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações e limites

- Leitura integral de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md` concluída antes da edição.
- Escopo restrito a `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`.
- Nenhum código, HTML, CSS, JavaScript, Firebase Rule, CORS, App Check, dado, metadata, tag Git ou arquivo em `.claude/` foi alterado.
- Não foram executados `ADMIN-B2A-PREP`, `ADMIN-B2A-EXEC`, `ADMIN-B2B-PREP`, `ADMIN-B2B-EXEC`, `ADMIN-B3`, login, teste de runtime, commit, push ou deploy.

### Próximo passo

- `ADMIN-B2A-PREP` permanece registrado como próximo bloco e não foi iniciado.
- Sugestão de commit: `docs: registrar conclusão do ADMIN-B1 e ADMIN-B1B`.

---

## 2026-07-20 — Retomada Admin/CMS/Firebase e conclusão do ADMIN-RESTART-PREP

**Ferramenta/modelo:** Codex

**Responsável pela aprovação:** Jacob

**Status:** governança atualizada; `ADMIN-RESTART-PREP` concluído; `ADMIN-B1-PREP` registrado e não iniciado.

### Objetivo

Registrar oficialmente a mudança de prioridade para a frente administrativa, a conclusão estritamente não mutante do `ADMIN-RESTART-PREP`, o estado real do painel e dos blocos CMS, os bloqueios de segurança e integridade, o roadmap ADMIN-A a ADMIN-J e o próximo bloco único. Esta atualização é exclusivamente documental.

### Mudança de prioridade aprovada

- Frente ativa: Painel Admin, CMS, Firebase Authentication, Firestore, Firebase Storage, moderação, segurança e integridade dos fluxos administrativos.
- Ferramenta adotada: Codex. O Claude Fable não será usado nesta frente.
- Frentes pausadas: site público, V7C1, V7C2, V6, B3, otimização de mídia pública, integração CMS → site público e tarefas preparadas para Claude Fable.
- Separação obrigatória: site público, Painel Admin/CMS e Portal do Usuário são sistemas distintos. Não misturar execução ou refatoração entre eles sem bloco e autorização específicos.

### Conclusão e limites do ADMIN-RESTART-PREP

- Concluído somente em leitura, diagnóstico, testes estáticos e smoke sem autenticação.
- Nenhum arquivo foi alterado, criado ou excluído.
- Nenhuma escrita em Firestore, Firebase Storage, Firebase Authentication, rules, CORS, dados ou produção.
- Nenhum commit, push, deploy, seed, migração ou inventário remoto.
- Working tree encontrado em `main`, com referência local `main` alinhada com `origin/main`, nenhuma alteração rastreada e `.claude/settings.local.json` não rastreado e intocado.
- A consulta remota independente do `origin` não foi confirmada por falta de credencial no ambiente.

### Estado real do painel

O painel possui runtime administrativo real e não é apenas um protótipo. Estão funcionais ou amplamente implementados: autenticação administrativa, dashboard, aprovações, vínculos, usuários, eventos, notícias, Biblioteca de Mídia, banners, empreendimentos, contratos de mídia, gestão editorial da galeria de empreendimentos, scripts de seed/diff, inventário seguro de mídias e fundação modular em modo passthrough.

A fundação modular real cobre Dashboard, Banners, Empreendimentos, Context, UI, Registry, Router e Shell. A modularização deve continuar progressivamente no futuro, sem reversão e sem reescrita ampla, mas não é a prioridade imediata.

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
- CMS-4C: runtime implementado; teste real permaneceu bloqueado por Storage/CORS.
- CMS-4D: gestão editorial da galeria de empreendimentos implementada.
- CMS-4E: inventário seguro implementado.
- CMS-4E-EXEC: não concluído.
- CMS-5A: diagnóstico concluído.
- CMS-5B: adapter/debug isolado implementado.
- CMS-5C: código e rule local concluídos; a governança registra publicação específica.
- CMS-5D: não iniciado e fora da frente atual.

### Bloqueios antes da conclusão do painel

**P0**

1. Notícias em rascunho potencialmente públicas: `firestore.rules` possui leitura pública ampla em `noticias`; o filtro `publicado` no frontend não protege o acesso.
2. Estado remoto completo das Firestore Rules e Storage Rules não comprovado; somente a publicação específica do CMS-5C está claramente registrada. O arquivo local atual não deve ser presumido como cópia integral da produção.

**P1**

3. `media_library` publicamente legível pelas Firestore Rules.
4. `cms-media` publicamente legível pelas Storage Rules, potencialmente incluindo rascunhos, mídias internas e órfãos.
5. CMS-4C sem conclusão ponta a ponta: `storage-cors.json` preparado, mas aplicação do CORS no bucket não comprovada.
6. Uploads sem rollback consistente em banners, biblioteca, eventos e aplicação de mídia aceita.
7. Aprovação de eventos e estabelecimentos não atômica.
8. Divergência do papel `moderator`: rules concedem operações, enquanto o painel principal aceita somente `admin`.
9. Ausência de teste autenticado atual.

### Não bloqueadores da primeira versão utilizável

Integração de `cms_establishments` com o site público, CMS-5D, galeria pública, substituição de dados estáticos públicos, Rotas no Admin, Sazonal, Mascote, Configurações, relatórios avançados, master admin e notificações automáticas permanecem futuras/opcionais.

### Próximo bloco único

`ADMIN-B1-PREP` — validação autenticada e anônima do contrato real de acesso.

- PREP somente leitura, sem correção e sem publicação.
- Confirmará Firebase Authentication, App Check, usuário admin, usuário sem role, usuário inativo, Firestore Rules, Storage Rules, CORS, rascunhos de notícias, `media_library`, `cms-media`, coleções administrativas, dados publicados e dados privados.
- O login será manual pelo usuário no navegador; senha e token nunca serão fornecidos ao Codex.
- Preferir domínio publicado/autorizado; localhost somente com debug provider do App Check explicitamente preparado.
- Não criar, atualizar, excluir, fazer upload, publicar rules, aplicar CORS ou copiar dados pessoais para relatórios.
- Saída esperada: matriz real ALLOW/DENY, evidência mínima e sanitizada, divergências entre runtime local, rules locais e comportamento remoto, e decisão objetiva para o `ADMIN-B2-EXEC`.
- O `ADMIN-B1-PREP` foi somente registrado e **não foi iniciado** nesta tarefa.

### Roadmap ADMIN-A a ADMIN-J

- ADMIN-A: checkpoint e retomada — concluído pelo `ADMIN-RESTART-PREP`.
- ADMIN-B1-PREP: validar Auth, roles, rules, Storage, App Check e CORS reais.
- ADMIN-B2-EXEC: corrigir contrato de roles e segurança local; proteger rascunhos, `media_library` e `cms-media`; criar testes de rules; somente após B1.
- ADMIN-B3-EXEC: publicar rules aprovadas e retestar; exige autorização explícita.
- ADMIN-C: integridade dos uploads, rollback e operações atômicas/idempotentes.
- ADMIN-D: fechamento de Empreendimentos.
- ADMIN-E: fechamento de Eventos.
- ADMIN-F: fechamento de Notícias.
- ADMIN-G: Biblioteca de Mídia, CMS-4C, galeria editorial, CORS e inventário de órfãos depois da estabilização.
- ADMIN-H: fechamento de Banners.
- ADMIN-I: modularização incremental do restante do painel.
- ADMIN-J: QA autenticada, rules tests, smoke, governança, fechamento e tag final.

### Critério de painel utilizável

Autenticação Admin testada; contrato `admin`/`moderator` definido; usuário inativo bloqueado; rules locais e remotas alinhadas; rascunhos e dados internos protegidos; CORS validado; moderação testada; operações críticas atômicas ou idempotentes; rollback de uploads; CRUD de eventos, estabelecimentos, notícias e banners testado; Biblioteca de Mídia sem quebra de referências; estados de loading, erro e vazio; autoria e timestamps; smoke autenticado; teste anônimo; governança atualizada.

### Tag de checkpoint

- Tag recomendada: `pre-admin-restart-20260720`.
- Condições: revisar esta governança, fazer o commit documental e concluir o push do commit.
- A tag não foi criada nesta tarefa.

### Arquivos alterados

- `CLAUDE.md` — prioridade ativa, separação dos três sistemas, limites do PREP, próximo bloco e gate da tag.
- `TASKS.md` — estado do painel/CMS, bloqueios P0/P1, não bloqueadores, critérios, roadmap e `ADMIN-B1-PREP`.
- `CHANGELOG_AI.md` — este checkpoint documental.

### Validações e limites

- `git status --short --branch --untracked-files=all` e `git log --oneline -30` executados antes da edição.
- Leitura integral de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`.
- `git diff --check`, `git diff --name-only`, `git diff --stat` e `git status --short --untracked-files=all` executados após a edição.
- Nenhum código, HTML, CSS, JavaScript de runtime, metadata, dado, rule, Firebase, CORS, script, site público ou arquivo em `.claude/` foi alterado.
- Não foram executados `ADMIN-B1-PREP`, qualquer EXEC, login, leitura Firebase real, upload, seed, migração, inventário remoto, publicação de rules, aplicação de CORS, commit, push, deploy ou tag Git.

### Pendências preservadas

- Todos os bloqueios P0/P1 permanecem abertos até validação e execução próprias.
- CMS-4E-EXEC e CMS-5D permanecem não concluídos/fora da frente imediata.
- V7C1, V7C2, V6, B3 e todo o backlog público continuam pausados.
- A modularização incremental permanece futura, sem reversão e sem reescrita ampla.

### Próximo passo

- Revisar e, somente mediante autorização futura, iniciar o `ADMIN-B1-PREP` em modo estritamente somente leitura.
- Sugestão de commit: `docs: registrar retomada da frente administrativa`.

---

## 2026-07-17 — Conclusão do V7B: cutover atômico da navegação da home

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** V7B concluído, corrigido, validado, commitado, enviado por push e publicado; esta atualização é somente de governança, sem novo commit, push ou deploy.

### Objetivo

Registrar oficialmente a conclusão do V7B, que substituiu atomicamente a navegação própria da home pela implementação compartilhada de `js/nav-shared.js`. O bloco manteve rollback simples em um único commit e não iniciou V7C1, V7C2, V6, B3 ou qualquer outra frente.

### Evidência confirmada pelo Git

- Commit funcional: `e80794418524e521ebbaaab85f76d101ffae5717`.
- Mensagem exata: `feat(home): adota nav-shared como navegacao unica da home (V7B)`.
- O commit está presente em `HEAD`, `origin/main` e `origin/HEAD`.
- `git show --stat --oneline --decorate --no-renames e807944` confirmou 3 arquivos alterados, 4 inserções e 409 remoções.
- `git show --format= --name-status --no-renames e807944` confirmou exatamente:
  - `index.html`;
  - `css/index.css`;
  - `js/site-meta.js`.
- Nenhum arquivo funcional inesperado entrou no commit.
- A metadata, atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`, registra em `js/site-meta.js` o valor `updatedAt: "2026-07-17T10:14:49-03:00"`.

### Cutover da navegação

- `index.html` passou a carregar como primeira tag dentro de `body.home-page`:

  ```html
  <script src="js/nav-shared.js?v=site-public-v7a-20260716"></script>
  ```

- O contrato foi preservado: script clássico, síncrono, sem `defer`, sem `async` e sem `type="module"`.
- `js/nav-shared.js` passou a ser a navegação única da home e das páginas internas, assumindo header, dropdowns, menu mobile, overlay, idiomas, área restrita, barra eMAG, progresso, botão voltar ao topo e modal de busca.
- O chrome estático duplicado da home foi removido: trilho/barra de progresso, skip links antigos, barra eMAG, navegação, logo/links duplicados, dropdowns, hamburger/menu mobile, atalhos mobile, `#mobileOverlay`, idiomas, área restrita, modal de busca, botão voltar ao topo, bloco inline completo do hamburger, VLibras estático, tag estática de `scroll-animations.js`, tag de `js/home-i18n.js` e tag de `js/home-utilitarios.js`.
- O `nav-shared` manteve a carga única de `scroll-animations.js`, `search.js`, `search-index.js` e demais utilitários compartilhados.

### Módulos da home e contratos preservados

- R1/R2/R3 permanecem preservados e funcionais: `js/home-eventos.js`, `js/home-experiencias.js` e `js/home-contato.js`.
- `js/home-acessibilidade.js` permaneceu ativo para `prefers-reduced-motion`, pausa/remoção de autoplay do vídeo hero e atalhos Alt+1, Alt+2, Alt+3 e Alt+4. A limitação preexistente do Alt+2, que tenta focar o `ul#navLinks` sem `tabindex`, fica preservada para reavaliação no V7C1 ou em bloco de acessibilidade posterior.
- `js/home-i18n.js` e `js/home-utilitarios.js` deixaram de ser carregados, mas permanecem fisicamente no repositório para rollback até o V7C1. Eles não foram excluídos no V7B.
- `translations.js`, `window.translations`, `window.applyTranslations`, `translationsApplied`, `sms-lang`, PT/EN/ES/PL, `document.documentElement.lang`, persistência após reload e tradução de conteúdo dinâmico permanecem contratos preservados.
- R1, R2 e R3 não foram unificados nem reescritos no V7B.

### Diferenças aprovadas

- O link “Início” aponta para `/`, mantendo as âncoras compartilhadas como `/#sobre` e `/#contato`.
- O primeiro acesso sem `sms-lang` respeita o idioma preferencial do navegador; a home não força mais PT após a detecção de `translations.js`.
- A área restrita usa o comportamento dinâmico do shared: estado em `smsUserSession` no `localStorage`, acesso normal para não autenticado e nome/opção Sair para autenticado, sem reativar Admin/CMS/Firebase.
- Os dois thresholds de navegação em `css/index.css` passaram de 1180px para 968px. A terceira ocorrência de 1180px, relacionada a grades de conteúdo, permaneceu intacta.
- A busca usa exclusivamente o modal injetado pelo shared, com foco, resultados, Escape, fechamento, atributos ARIA e tradução preservados.
- Progresso e botão voltar ao topo ficaram unificados sob o shared. Foi validado um único progresso, estado 0% no topo, atualização intermediária, 100% no fim, um único botão após aproximadamente 300px e retorno suave ao topo.

### VLibras: descoberta e correção dentro do V7B

Na primeira validação do V7B foi encontrada uma duplicação real: duas `div[vw]`, duas cargas do plugin e duas inicializações do Widget. A causa foi o carregamento antecipado do shared antes de o parser encontrar o markup estático da home, permitindo que o guard injetasse uma instância e o bloco estático criasse outra.

A correção foi incluída no próprio V7B: o bloco estático, o container, a tag de `vlibras-plugin.js` e o init inline foram removidos de `index.html`; o shared passou a ser a única origem. O resultado validado foi uma única `div[vw]`, um botão de acesso, um wrapper, uma tag do plugin, uma instância funcional, abertura/fechamento corretos, nenhum elemento órfão e nenhum erro de inicialização. A divergência do VLibras está resolvida dentro do V7B e não é pendência do V7C1.

### Service Worker, cache e rollback

- O registro inline do Service Worker foi mantido. O shared também realiza o registro; a duplicidade temporária para o mesmo script/escopo foi observada como idempotente e sem erro e fica explicitamente reservada ao V7C1.
- `sw.js`, `CACHE_NAME`, estratégia de cache e escopo não foram alterados.
- `js/nav-shared.js` permanece em `NEVER_CACHE`; HTML permanece fora do cache do Service Worker; o token `?v=site-public-v7a-20260716` foi preservado porque `js/nav-shared.js` não foi alterado no V7B.
- O rollback continua simples por `git revert` do commit único. `js/home-i18n.js` e `js/home-utilitarios.js` permanecem no disco, e a tag `pos-fase1-modular` segue disponível para consulta.

### Validações registradas antes desta governança

- `git diff --check` foi aprovado após a correção das duas terminações problemáticas de linha em `css/index.css`.
- A inspeção estática confirmou uma tag nav-shared, zero tags de `home-i18n`, zero tags de `home-utilitarios`, zero tag estática de `scroll-animations.js`, uma carga de `home-acessibilidade`, uma carga de `home-contato`, uma carga de `home-experiencias` e uma carga de `home-eventos`.
- DOM: um `#mainNav`, `#navToggle`, `#navLinks`, `#currentLang`, `#langDropdown`, `#menuOverlay`, `#searchModal`, `#search`, `#searchResults`, barra de progresso, botão voltar ao topo, barra eMAG, skip links, atalhos mobile e instância de VLibras; zero IDs duplicados e zero segundo header.
- Desktop validado em 1366px, 1200px, 1000px e 969px; mobile validado em 768px e 375px; padding desktop 0, hero sem deslocamento, menu desktop acima de 968px, drawer, overlay, scroll lock, Escape, links, idioma e busca preservados.
- PT/EN/ES/PL, persistência, `document.documentElement.lang`, primeiro acesso pelo idioma do navegador, fonte, contraste, reduced motion, Alt+1/3/4, auth por `localStorage`, busca, R1/R2/R3 e páginas internas foram validados.
- Console e Network não apresentaram `ReferenceError`, `TypeError`, `SyntaxError`, rejection ou 404 novos. Os erros App Check/ReCAPTCHA em localhost permanecem ambientais.
- A publicação do GitHub Pages foi confirmada na validação funcional consolidada do V7B antes deste registro. Nesta governança, `gh` e a rechecagem HTTP foram tentados apenas em leitura e ficaram bloqueados por permissões/SSL do ambiente; nenhum deploy foi executado novamente.

### Estado do V7 e pendências preservadas

- V7-PREP — concluído.
- V7A — concluído, validado, commitado, enviado por push e publicado.
- V7B — concluído, corrigido, validado, commitado, enviado por push e publicado.
- V7C1 — próximo microbloco, ainda não iniciado. Escopo reservado: excluir fisicamente `js/home-i18n.js` e `js/home-utilitarios.js`, reduzir `js/home-acessibilidade.js` às responsabilidades que ainda não pertencem ao shared, remover o registro inline duplicado do Service Worker e reavaliar Alt+2. Não tratar VLibras como duplicação pendente.
- V7C2 — limpeza de CSS posterior, ainda não iniciada; inclui somente CSS comprovadamente órfão após preflight próprio.
- V6, B3, V5C3, V5D, CSS órfão `.map-modal-*`, CSS órfão `.agrosamas-banner`, 743 ocorrências de `!important`, mídia pesada, virada anual de eventos, `TURISMO_EVENTOS`/AgroSamas, Formspree e demais follow-ups permanecem pendentes.
- Drawer sem fechamento automático ao redimensionar para desktop e ausência de skip link de busca no shared permanecem como pendências. O problema de duas opções `.lang-option.active` foi resolvido pelo cutover.
- Admin/CMS/Firebase continua pausado.

### Arquivos e escopo desta atualização documental

- Alterados somente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`.
- `.claude/settings.local.json` permaneceu não rastreado e intocado.
- Não foram executados `node scripts/update-site-meta.mjs`, V7C1, V7C2, V6, B3, commit, push ou deploy nesta atualização.
- Sugestão de mensagem para um futuro commit desta governança: `docs: registrar conclusão do V7B`.

---

## 2026-07-17 — Conclusão do V7A de compatibilidade do nav-shared

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** V7A concluído, validado, commitado, enviado por push e publicado; esta atualização é somente de governança, sem novo commit, push ou deploy.

### Objetivo

Registrar oficialmente a conclusão do V7A, primeiro microbloco da estratégia de unificação da navegação pública aprovada no V7-PREP. O V7A preparou a compatibilidade futura do `js/nav-shared.js`, renovou o token das páginas internas ativas e manteve a home completamente intacta. V7B, V7C1, V7C2, V6 e B3 não foram executados nesta atualização.

### Evidência confirmada pelo Git

- Commit funcional: `4cd0616cb9d393571946f90c97a753eae16e69c3`.
- Mensagem exata: `feat(nav): prepara nav-shared para adocao pela home (V7A)`.
- O commit está presente em `origin/main`.
- `git show --stat --oneline --decorate --no-renames` confirmou **15 arquivos modificados, 20 inserções e 14 remoções**.
- `git show --format= --name-status --no-renames` confirmou somente os arquivos abaixo:
  - `js/nav-shared.js`;
  - `js/site-meta.js`;
  - `eventos.html`;
  - `galeria.html`;
  - `local.html`;
  - `mapa-turistico.html`;
  - `noticia.html`;
  - `noticias.html`;
  - `o-que-fazer.html`;
  - `onde-ficar.html`;
  - `para-o-trade.html`;
  - `reservas.html`;
  - `rotas-completas.html`;
  - `sabores.html`;
  - `transparencia.html`.

### Alterações consolidadas

O `NAV_CSS` de `js/nav-shared.js` recebeu exatamente o contrato de compatibilidade abaixo:

```css
@media (min-width: 769px) {
    body.home-page {
        padding-top: 0;
    }
}
```

A regra é específica para `body.home-page`, atua somente a partir de 769px e define apenas `padding-top: 0`. Ela permanece inerte nas páginas internas atuais e prepara a adoção futura pelo V7B, sem alterar `NAV_HTML`, links, IDs, idioma, busca, autenticação, VLibras, utilitários ou registro do Service Worker.

As 13 páginas públicas ativas passaram a usar o token `?v=site-public-v7a-20260716` na tag clássica e síncrona:

```html
<script src="js/nav-shared.js?v=site-public-v7a-20260716"></script>
```

Não foram alterados `index.html`, páginas legadas, `portal-usuario.html`, páginas administrativas, páginas CMS/Firebase ou tokens de outros assets. A metadata foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`; o valor confirmado em `js/site-meta.js` é `updatedAt: "2026-07-17T08:56:35-03:00"`.

### Home preservada

- `index.html` permaneceu byte a byte sem alteração no V7A.
- A home ainda não carrega `js/nav-shared.js` e continua usando sua navegação própria.
- `body.home-page` continua com `padding-top: 0` no desktop.
- Os módulos R1–R5 continuam carregando normalmente.
- Nenhum cutover foi iniciado; V7B continua não executado.
- Os módulos sobreviventes `js/home-eventos.js`, `js/home-experiencias.js` e `js/home-contato.js` não foram alterados.
- `js/home-i18n.js`, `js/home-utilitarios.js` e `js/home-acessibilidade.js` permanecem fisicamente disponíveis para o V7B e rollback conforme o escopo aprovado.

### Validações registradas

As validações funcionais foram realizadas antes do registro desta governança e não foram repetidas nesta tarefa. Foram registrados: `node --check js/nav-shared.js`; `git diff --check`; exatamente uma ocorrência de `body.home-page` dentro do `@media (min-width: 769px)` com somente `padding-top: 0`; 13 ocorrências do token novo nas páginas autorizadas; ausência do token novo na home, páginas legadas e `portal-usuario`; remoção do token antigo das 13 páginas ativas; ausência de diff em `index.html`; e ausência de alterações em CSS externo, `translations.js` e `sw.js`.

O smoke detalhado em `noticias.html`, `mapa-turistico.html` e `eventos.html`, além do smoke básico nas demais páginas ativas, confirmou navegação desktop/mobile, padding interno aproximado de 132px, logo, dropdowns, menu mobile, scroll lock, Escape, links, PT/EN, persistência `sms-lang`, opção `.lang-option.active`, busca, autenticação não logada, VLibras, barra eMAG, progresso, voltar ao topo e Leaflet. Network e console não apresentaram 404, ReferenceError, TypeError, SyntaxError ou Promise rejection novos; os erros conhecidos de App Check/ReCAPTCHA e Firestore em localhost permanecem ambientais.

### Publicação, cache e Service Worker

O GitHub Pages foi publicado e validado antes deste registro. A verificação HTTP somente leitura respondeu 200 para a página pública e 200 para `noticias.html`; a página `noticias.html` serviu exatamente `js/nav-shared.js?v=site-public-v7a-20260716`.

`js/nav-shared.js` permanece em `NEVER_CACHE`; HTML e navegações permanecem fora do cache do Service Worker; `sw.js` permaneceu intacto; `CACHE_NAME` permaneceu intacto; não houve bump de `CACHE_NAME`; o V7A usou somente o novo token `?v=`; páginas legadas e `portal-usuario` ficaram fora da renovação.

### Estado após o V7A

- V7-PREP — concluído.
- V7A — concluído, validado, commitado, enviado por push e publicado.
- V7B — próximo microbloco, cutover atômico da home, risco alto, não iniciado; depende de autorização humana explícita, escopo aprovado, deploy e validação em produção antes do bloco seguinte.
- V7C1 — não iniciado.
- V7C2 — não iniciado.
- V6 — pendente.
- B3 — pendente.
- V5D — pendente.
- Admin/CMS/Firebase — pausado.

### Pendências preservadas

Permanecem documentados: handler de resize do drawer; skip link Alt+3 ausente no shared; consolidação futura do VLibras; limpeza de CSS no V7C2; V5C3; V5D; CSS órfão `.map-modal-*`; CSS órfão `.agrosamas-banner`; mídia pesada; B3; correção futura de `TURISMO_EVENTOS` para Rua do Mathe; virada anual de eventos; duplicação potencial entre fontes de eventos; revisão editorial do destaque após 30/08/2026; Formspree externo e não bloqueante. O endpoint continua `xpqykpqd`, o Workflow temporário continua em `imprensapmsms@gmail.com`, `turismo@saomateusdosul.pr.gov.br` permanece `PENDING` e nenhum envio real deve ocorrer antes de `VERIFIED`.

### Escopo desta atualização documental

- Alterados somente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`.
- `.claude/settings.local.json` permaneceu não rastreado e intocado.
- Não foram executados `node scripts/update-site-meta.mjs`, V7B, V7C1, V7C2, V6, B3, commit, push ou deploy nesta atualização.
- A sugestão de mensagem para um futuro commit desta governança é: `docs: registrar conclusão do V7A`.

---

## 2026-07-16 — Conclusão do V7-PREP e aprovação da estratégia do V7

**Ferramenta/modelo:** Claude Fable 5 (Claude Code)
**Responsável pela aprovação:** Jacob
**Status:** aplicado (governança-only, sem commit nesta atualização)

### Objetivo

Registrar oficialmente a conclusão do V7-PREP — bloco exclusivamente de leitura, diagnóstico, comparação, experimento em memória e planejamento — e as cinco decisões humanas aprovadas para a futura execução do V7. Nenhum arquivo de código, HTML, CSS, JavaScript de runtime, dado, metadata, Service Worker, tag Git, Admin/CMS/Firebase ou artefato de auditoria foi alterado, nem durante o V7-PREP, nem nesta governança.

### Diagnóstico consolidado do V7-PREP

- A navegação da home (`index.html`) permanece mantida separadamente; as 17 páginas internas usam `js/nav-shared.js` (13 ativas com token `?v=site-public-b1-20260708`, 3 legadas e `portal-usuario` com tokens antigos, fora do bloco).
- A duplicação da navegação é a principal dívida estrutural remanescente após a Fase 1. A execução do V7 possui risco alto.
- O desktop já tem paridade visual quase total (computed styles da home: nav `top:36px`, logo 70px, padding `1rem 2rem` — iguais aos do shared). As divergências críticas são o offset do body no desktop (shared impõe `padding-top:132px`; a home desenha com 0) e o breakpoint mobile (home 1180px vs shared 968px).
- O guard `#mainNav` do nav-shared não protege a home atual, pois o `<nav>` da home não tem esse `id`; o trilho da barra de progresso é injetado sem guard.

### Experimento temporário em memória (browser local, desfeito por reload)

Carregar a home atual e injetar `js/nav-shared.js` pelo console produziu: dois headers/navs, dois `#navToggle`, dois `#navLinks`, dois seletores de idioma (`#currentLang`/`#langDropdown`), dois modais de busca (`#searchModal`), duas barras de acessibilidade, duas barras de progresso (`#sms-scroll-*`), duas faixas de atalhos mobile, IDs duplicados em série e aumento indevido de 132px no padding superior do body (hero empurrado). Os guards de VLibras e do `#backToTop` funcionaram (1 instância cada). Conclusão: **a coexistência é inviável; não haverá migração gradual ingênua; o cutover do chrome da home deverá ser atômico, precedido por bloco de compatibilidade isolado.**

### Estratégia aprovada (V7A → V7B → V7C1 → V7C2)

- **V7A — compatibilidade do nav-shared (risco baixo-médio):** preparar `js/nav-shared.js` para uso futuro na home, adicionando exceção de padding para `body.home-page` no desktop no CSS injetado; atualizar o token `?v=` das tags ativas de nav-shared; manter `index.html` completamente intacto; testar as páginas internas.
- **V7B — cutover atômico da home (risco alto):** substituir a navegação própria pelo nav-shared, removendo no mesmo commit o chrome estático da navegação, o menu hamburger inline, o modal de busca estático, o overlay estático, a barra de progresso estática, o botão voltar ao topo estático, as tags de `js/home-i18n.js` e `js/home-utilitarios.js` e a tag duplicável de `scroll-animations.js` (o guard do shared é por `id`, não por `src`); manter fisicamente os módulos aposentáveis no disco para rollback; manter `js/home-acessibilidade.js` durante o cutover; alinhar o breakpoint mobile da home.
- **V7C1 — limpeza de runtime (risco baixo):** excluir fisicamente `js/home-i18n.js` e `js/home-utilitarios.js`; reduzir `js/home-acessibilidade.js` a `prefers-reduced-motion`/pausa do vídeo e atalhos Alt+1..4; revisar o registro duplicado do Service Worker.
- **V7C2 — limpeza de CSS (risco médio, bloco separado):** remover somente CSS comprovadamente órfão após o cutover — regras antigas da navegação, `.language-dropdown.active`, drawers antigos — e avaliar `.map-modal-*` e `.agrosamas-banner`. Separado devido à complexidade de `css/index.css` e seus ~743 `!important`.

Cada microbloco exige metadata, commit próprio, governança própria e deploy com teste em produção antes do microbloco seguinte.

### Decisões humanas aprovadas

1. **Link "Início":** adota o destino `/`; aceita-se que clicar em Início estando na home recarregue a página em vez de rolar até `#map-hero`, priorizando paridade e manutenção única.
2. **Idioma do primeiro acesso:** prevalece a detecção do idioma preferencial do navegador feita por `translations.js`; PT deixa de ser forçado quando `sms-lang` estiver ausente. PT/EN/ES/PL continuam disponíveis e a seleção manual continua persistida em `sms-lang`.
3. **Área restrita:** a home adota o comportamento dinâmico do nav-shared — usuário não autenticado vê o acesso normal; usuário com `smsUserSession` vê nome e opção de saída. Somente leitura de `localStorage`; não reativa Admin/CMS/Firebase.
4. **Breakpoint:** a navegação da home é alinhada aos 968px do shared, eliminando a divergência da faixa 968–1180px; tablets em paisagem passam a usar a navegação desktop.
5. **Acessibilidade:** `js/home-acessibilidade.js` é mantido durante o V7B e não é aposentado integralmente no cutover — o shared cobre fonte e contraste, mas não cobre a pausa do vídeo com `prefers-reduced-motion` nem os atalhos JS Alt+1..4 (incluindo Alt+3 da busca). No V7C1 o módulo será reduzido às responsabilidades que o shared não possui. Nenhuma regressão de acessibilidade deve ser aceita.

### Módulos e destinos

- Sobrevivem ao V7: `js/home-eventos.js`, `js/home-experiencias.js`, `js/home-contato.js`.
- Tags removidas no V7B, arquivos preservados até o V7C1: `js/home-i18n.js`, `js/home-utilitarios.js`.
- Mantido no V7B e reduzido no V7C1: `js/home-acessibilidade.js`.
- Removido no V7B: bloco inline do menu hamburger.
- `translations.js` permanece intacto como fonte compartilhada; `window.applyTranslations` e `translationsApplied` permanecem contratos obrigatórios.
- VLibras: o bloco estático da home permanece no V7B; os guards do shared impedem segunda instância; consolidação eventual fica para o V7C1 ou follow-up.
- Busca: `search.js` e `search-index.js` intactos; o modal estático da home sai no V7B e o modal injetado pelo shared vira a única instância.

### Cache

`js/nav-shared.js` pertence a `NEVER_CACHE` no Service Worker; HTML e navegações não são cacheados pelo SW; `sw.js` e `CACHE_NAME` não deverão ser alterados em V7A ou V7B. O V7A usará novo token `?v=` nas tags de nav-shared das páginas ativas; páginas legadas e `portal-usuario` ficam fora do bloco. `home-i18n.js`, `home-utilitarios.js` e `home-acessibilidade.js` permanecem fisicamente no disco durante o V7B para facilitar rollback.

### Riscos e follow-ups preservados

- O nav-shared não fecha automaticamente o drawer ao redimensionar para desktop (edge case; follow-up pós-V7).
- O skip link Alt+3 não existe no shared (coberto pelo `home-acessibilidade.js` mantido).
- `css/index.css` possui ~743 ocorrências de `!important` — motivo do V7C2 separado.
- O VLibras estático poderá ser consolidado depois.
- O bug das duas opções `.lang-option.active` após reload será corrigido naturalmente pelo shared no cutover.
- Nenhuma dessas melhorias adicionais deve ser misturada ao V7A.

### Estado após esta governança

V7-PREP concluído; estratégia do V7 aprovada; cinco decisões humanas aprovadas; **V7A é o próximo microbloco e ainda não foi iniciado**; V7B, V7C1 e V7C2 não iniciados; V6 e B3 pendentes; V5D pendente e não urgente; correção de `TURISMO_EVENTOS`/AgroSamas fora do V7; Admin/CMS/Firebase pausado. A tag `pos-fase1-modular` segue protegendo o estado anterior ao V7.

### Arquivos alterados

- `CLAUDE.md` — registro do V7-PREP, estratégia V7A→V7B→V7C, contrato `body.home-page`, módulos preservados/aposentáveis e decisões aprovadas.
- `TASKS.md` — V7-PREP concluído, cinco decisões, V7A como próximo passo, riscos por microbloco e requisitos de deploy/teste entre microblocos.
- `CHANGELOG_AI.md` — este registro.

---

## 2026-07-16 — Checkpoint pós-Fase 1

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (governança-only, sem commit nesta atualização)

### Objetivo

Registrar oficialmente o checkpoint técnico e arquitetural pós-Fase 1, preservando a decisão de não iniciar automaticamente qualquer fase posterior. Nenhum arquivo de runtime, dado, auditoria, Admin/CMS/Firebase, Service Worker, tag ou metadata foi alterado.

### Resultado consolidado

- A Fase 1 modular foi concluída e não há extração a reverter. Os módulos são `js/home-eventos.js`, `js/home-experiencias.js`, `js/home-contato.js`, `js/home-utilitarios.js`, `js/home-acessibilidade.js` e `js/home-i18n.js`.
- O checkpoint foi concluído somente em leitura. A tag `pos-fase1-modular` está publicada localmente e remotamente e aponta para o commit de governança `3c9caee docs: registrar conclusão do R5B e da Fase 1`.
- `index.html` está em aproximadamente 1.712 linhas e 99 KB, com cerca de 220 linhas de JavaScript inline, redução aproximada de 31% desde `pos-v5-checkpoint`. O principal bloco inline restante é o menu hamburger, reservado ao V7.
- A avaliação confirmou responsabilidades coerentes, ausência de fragmentação excessiva e redução objetiva do efeito Frankenstein. O gargalo estrutural principal passou a ser a duplicação da navegação; CSS e mídia permanecem gargalos relevantes.

### Validação e decisão

- Foram consolidados os testes de home em desktop/mobile, PT/EN/ES/PL, acessibilidade, eventos, carrossel, formulário sem POST, clima, busca, tema, mascote, progresso, voltar ao topo e smoke test das páginas públicas.
- Não foram encontrados `ReferenceError`, `TypeError`, `SyntaxError` ou 404 novos. Os erros de App Check/ReCAPTCHA em localhost permanecem ambientais e conhecidos.
- O próximo bloco aprovado é `V7-PREP`, somente leitura e planejamento. `V7-EXEC` não foi iniciado nem autorizado; V6 e B3 permanecem pendentes. Após o `V7-PREP`, haverá nova decisão humana sobre os microblocos de execução.
- Arquivos `js/home-*.js` são atendidos pelo runtime cache e `translations.js` participa do cache/precache. Alterações futuras nesses arquivos exigem avaliar novo token `?v=` ou nova versão de `CACHE_NAME`; o cache não foi alterado nesta tarefa.

### Decisão de conteúdo conhecida

- O local correto do AgroSamas foi confirmado humanamente como `Rua do Mathe`.
- `TURISMO_EVENTOS/js/data/eventos.js` ainda registra `Parque de Exposições`. Essa referência é uma inconsistência de dados conhecida, não uma dúvida editorial.
- O alinhamento para `Rua do Mathe` deverá ocorrer futuramente em bloco exclusivo de dados, fora do `V7-PREP`. Nenhum arquivo de dados, `TURISMO_EVENTOS`, `eventos-2026.json` ou `js/data/*` foi alterado nesta atualização.

### Pendências preservadas

- V5C3, V5D, CSS órfão `.map-modal-*` e `.agrosamas-banner`, chaves i18n órfãs, `CONFIG.agrosamas` sem efeito na home, vídeo hero de 32 MB, `translations.js` síncrono, imagens/mídias possivelmente órfãs, `avaliacoes.js` síncrono, notícias hard-coded duplicadas, virada anual de `eventos-2026.json`, possível duplicação entre `eventos-2026.json` e `TURISMO_EVENTOS`, revisão do destaque do 32º Mês Polonês após 30/08/2026 e a pendência externa do Formspree permanecem documentados.
- Admin/CMS/Firebase continua pausado. Não foram iniciados V6, V7, V7-EXEC ou B3.

### Arquivos alterados

- `CLAUDE.md` — checkpoint pós-Fase 1, decisão `V7-PREP` e nota curta sobre AgroSamas.
- `TASKS.md` — métricas atuais, próximo bloco, regra de cache e decisão de dados.
- `CHANGELOG_AI.md` — este registro e correção da nota de status do registro anterior do R5B.

### Nota de correção histórica

O registro anterior do R5B não deve ser interpretado como “aplicado sem commit”: o commit de governança `3c9caee` existe e registra a conclusão do R5B e da Fase 1. O status abaixo foi corrigido para refletir esse fato; a ausência de commit mencionada neste novo registro refere-se somente à atualização documental atual.

---

## 2026-07-16 — Registro de R5B e encerramento da Fase 1

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado e commitado no commit de governança `3c9caee`

### Objetivo

Registrar exclusivamente na governança a conclusão do R5B e o encerramento oficial da Fase 1 da refatoração modular progressiva da home. Nenhum teste de runtime, alteração de código, push ou deploy foi executado nesta atualização documental; o registro foi posteriormente preservado no commit de governança `3c9caee`.

### Resultado consolidado

- R5B foi concluído, validado, commitado, enviado por push e publicado com sucesso. O commit funcional confirmado no Git é `21564847d5b74697affcbfd68ba99c6fcbdb0340 refactor(home): extrai runtime i18n do seletor de idiomas para modulo dedicado`, presente em `origin/main`.
- `git show --stat --oneline --decorate --no-renames 2156484` confirmou somente os arquivos esperados: `index.html`, `js/home-i18n.js` e `js/site-meta.js`, com `170 insertions(+)` e `165 deletions(-)`. `js/home-i18n.js` foi criado, o runtime inline foi removido de `index.html` e `js/site-meta.js` foi atualizado antes do commit funcional.
- A tag registrada em `index.html` é `<script src="js/home-i18n.js?v=site-public-b1-20260708"></script>`. O contrato crítico foi preservado: sem `defer`, sem `async` e sem `type="module"`.
- A ordem de inicialização permanece histórica: `translations.js` síncrono no head; depois, no body, o menu hamburger inline; `js/home-i18n.js` síncrono; e então `js/home-acessibilidade.js`, `js/home-contato.js`, `js/home-experiencias.js` e `js/home-eventos.js` com `defer`.
- O primeiro acesso sem `sms-lang` continua terminando em PT, com `🇧🇷 PT` no botão e `document.documentElement.lang` em `pt-BR`. O motivo do carregamento clássico — preservar a ordem entre `translations.js` e o runtime da home — fica registrado como decisão consciente.
- `translations.js` permaneceu intacto. `sms-lang`, `window.translations`, `window.applyTranslations` e o evento `translationsApplied` foram preservados. PT/EN/ES/PL, ciclo de idiomas, persistência após reload, atributos do seletor, placeholders, aria-labels, conteúdo dinâmico, busca, clima, tema sazonal, mascote e menu mobile foram validados no R5B.
- R1, R2, R3, R4B, R4A e R5A permaneceram intactos. V4D permanece concluído e absorvido pelo R5A.

### Encerramento oficial da Fase 1

1. R1 — eventos: concluído.
2. R2 — carrossel de experiências: concluído.
3. R3 — formulário de contato: concluído.
4. R4B — utilitários visuais: concluído.
5. R4A — acessibilidade eMAG: concluído.
6. R5A — remoção do fallback inline obsoleto: concluído.
7. R5B — externalização do runtime i18n: concluído.
8. Fase 1 da refatoração modular: concluída.

A Fase 1 foi concluída sem reescrever a home do zero. A estratégia de refatoração modular progressiva no projeto atual foi preservada, a dívida de JavaScript inline foi significativamente reduzida e cada responsabilidade foi separada em módulo próprio. `js/home-i18n.js` poderá ser aposentado ou absorvido futuramente no V7.

### Próximas decisões e pendências

- Nenhuma etapa da Fase 2 foi iniciada. O próximo passo registrado é somente um checkpoint/decisão pós-Fase 1.
- V6, V7 e B3 permanecem pendentes; não foram iniciados automaticamente. V7 continua sendo bloco de alto risco para unificação da navegação e deve receber decisão própria; V6 deve ser reavaliado após a fundação modular; B3 mídia/performance continua reservado para depois.
- V5C3, V5D, CSS órfão `.map-modal-*`, CSS órfão `.agrosamas-banner`, chaves i18n órfãs, `CONFIG.agrosamas` temporariamente sem efeito na home, revisão editorial do destaque do 32º Mês Polonês após 30/08/2026, virada anual de `eventos-2026.json`, possível duplicação entre `eventos-2026.json` e `TURISMO_EVENTOS` e demais follow-ups existentes permanecem documentados.
- O follow-up de duas opções `.lang-option.active` após reload permanece reservado para V7 e não foi corrigido nesta governança.
- Admin/CMS/Firebase continua pausado.

### Pendência externa do Formspree

- O endpoint permanece `xpqykpqd`.
- O Workflow continua temporariamente direcionado para `imprensapmsms@gmail.com`.
- O endereço institucional obrigatório `turismo@saomateusdosul.pr.gov.br` permanece `PENDING` em Linked Emails e depende de confirmação por outro setor.
- Nenhum envio real deve ocorrer antes de `VERIFIED`.
- Após `VERIFIED`, a troca deve ocorrer somente no painel do Formspree: Forms > TURISMO > Workflow > Email; selecionar o endereço institucional; salvar mantendo a ação Enabled; realizar um único envio institucional controlado; confirmar o recebimento institucional; e confirmar que o Gmail antigo deixou de receber. Não serão necessários código, metadata, commit ou deploy.

### Arquivos alterados

- `CLAUDE.md` — estado do R5B, contrato de carregamento, encerramento da Fase 1 e checkpoint pós-Fase 1 atualizados.
- `TASKS.md` — estado atual, bloco concluído, Fase 1 encerrada, próximas decisões e pendências atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -20
git rev-parse 2156484
git show --stat --oneline --decorate --no-renames 2156484
git show --format= --name-status --no-renames 2156484
git merge-base --is-ancestor 2156484 origin/main
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
```

### Validações e limites

- [x] Working tree inicial sem alterações rastreadas pendentes; `.claude/settings.local.json` não rastreado foi identificado e permaneceu intocado.
- [x] Commit funcional R5B confirmado no histórico e presente em `origin/main`.
- [x] Commit de governança do R5A (`33be2e1`) e commits funcionais/de governança anteriores da Fase 1 confirmados no histórico recente.
- [x] `git show` confirmou os três arquivos e as estatísticas reais do R5B, sem mudança inesperada.
- [x] R5B foi somente registrado nesta governança; as validações funcionais foram concluídas antes desta atualização e não foram executadas novamente.
- [x] Nenhum código, HTML, CSS, JavaScript de runtime, dados, metadata, regras, Admin/CMS/Firebase, service worker, sitemap, robots, `.claude/*` ou `docs/auditoria-output/*` foi alterado nesta atualização.
- [ ] Commit, push e deploy desta atualização de governança — não executados por escopo.

### Próximo passo

- Fazer somente uma decisão/checkpoint pós-Fase 1. Não iniciar automaticamente Fase 2, V6, V7 ou B3.

---

## 2026-07-16 — Registro de R5A na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar oficialmente a conclusão do R5A da refatoração modular progressiva da home, sem executar novamente alterações ou testes de runtime.

### Resultado consolidado

- R5A foi concluído, validado, commitado, enviado por push e publicado com sucesso. O commit funcional confirmado no `git log` é `55615cd0d0c25db647d9ed0d04decca8e0ea7eb9 refactor(home): remove dicionario fallback inline obsoleto de traducoes`, e o commit está presente em `origin/main`.
- O dicionário fallback inline obsoleto e duplicado pt/en/es/pl foi removido de `index.html`, com aproximadamente 174 linhas do fallback eliminadas. A declaração final foi preservada exatamente como `var translations = window.translations || {};`.
- `translations.js` permaneceu intacto e preserva cobertura completa das chaves da home em PT, EN, ES e PL, com aproximadamente 906 chaves por idioma e nenhuma chave do markup dependente do fallback removido.
- O runtime inline do seletor permaneceu intacto, incluindo `sms-lang`, `window.applyTranslations`, `translationsApplied`, IIFE, `'use strict'`, `ready()`, mapas, dropdown, listeners, aplicação inicial e caminhos de degradação.
- PT/EN/ES/PL, ciclo PT → EN → ES → PL → PT, bandeira/sigla, `aria-label`/`title`, placeholders, aria-labels do carrossel, reações ao evento `translationsApplied`, `document.documentElement.lang` e persistência após reload foram validados.
- R1, R2, R3, R4A e R4B permaneceram intactos. Nenhuma tag ou módulo novo foi criado neste bloco. A atualização de `js/site-meta.js` ocorreu antes do commit funcional com `node scripts/update-site-meta.mjs`.

### Estado da Fase 1

1. R1 — eventos: concluído.
2. R2 — carrossel: concluído.
3. R3 — formulário: concluído.
4. R4B — utilitários visuais: concluído.
5. R4A — acessibilidade eMAG: concluído.
6. R5A — remoção do fallback obsoleto: concluído.
7. R5B — externalização do runtime i18n para `js/home-i18n.js`: próximo microbloco, ainda não iniciado.

- V4D foi absorvido e concluído pelo R5A; não permanece como pendência ativa duplicada.
- Antes de qualquer `R5B-EXEC`, usar o escopo definido pelo `R5-PREP` somente em análise.
- `js/home-i18n.js` deverá ser carregado sem `defer`, na mesma posição atual do bloco inline, depois do menu hamburger e antes de `js/home-acessibilidade.js`.
- R5B não foi iniciado nesta atualização.

### Validação funcional registrada e limites

- As validações funcionais do R5A foram concluídas previamente e apenas registradas nesta atualização; nenhum teste de runtime foi executado novamente.
- A degradação com bloqueio direto de `translations.js` não pôde ser reproduzida no ambiente; foi validada por simulação equivalente, com retorno silencioso, markup original em PT, sem tela vazia e sem TypeError.
- O follow-up de duas opções `.lang-option.active` após reload fica registrado para V7; não foi corrigido no R5A nem nesta governança.

### Pendências preservadas

- Admin/CMS/Firebase continua pausado.
- V6 e V7 continuam posteriores à Fase 1; B3 permanece em fase própria.
- V5C3 e V5D continuam pendentes.
- CSS órfão `.map-modal-*` e `.agrosamas-banner` permanece como frente paralela.
- A revisão editorial do destaque do 32º Mês Polonês após 30/08/2026 permanece pendente.
- A pendência externa do Formspree permanece: endpoint `xpqykpqd`, Workflow em `imprensapmsms@gmail.com`, `turismo@saomateusdosul.pr.gov.br` em `PENDING` e nenhum envio real antes de `VERIFIED`.

### Arquivos alterados

- `CLAUDE.md` — estado permanente do R5A, V4D absorvido, R5B como próximo microbloco e regra sem `defer` atualizados.
- `TASKS.md` — estado atual, Fase 1, R5A concluído, R5B não iniciado e pendências atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -15
git show -s --format=fuller 55615cd
git show --stat --oneline 55615cd
git merge-base --is-ancestor 55615cd origin/main
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git diff -- .claude
git status --short --untracked-files=all
```

### Validações e limites

- [x] Working tree inicial sem alterações rastreadas pendentes; `.claude/settings.local.json` não rastreado foi identificado e permaneceu intocado.
- [x] Commit funcional R5A confirmado no histórico e presente em `origin/main`.
- [x] Commit de governança do R4A (`f70e1af`) e commits funcionais anteriores da Fase 1 confirmados no histórico.
- [x] `git diff --check` aprovado.
- [x] Somente `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md` foram alterados nesta atualização.
- [x] Nenhum código, HTML, CSS, JavaScript de runtime, `index.html`, `js/site-meta.js`, `translations.js`, dados, regras, Admin/CMS/Firebase, service worker, sitemap, robots, `.claude/*` ou `docs/auditoria-output/*` foi alterado nesta atualização.

### Próximo passo

- Manter R5B como próximo microbloco, sem iniciá-lo nesta governança; usar primeiro o escopo do R5-PREP e preservar o carregamento sem `defer`.

---

## 2026-07-16 — Registro de R4A na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar oficialmente a conclusão do R4A da refatoração modular progressiva da home, sem executar novamente testes de runtime, atualizar metadata, alterar código ou publicar novamente.

### Resultado consolidado

- R4A foi concluído, validado, commitado, enviado por push e publicado com sucesso. O commit funcional confirmado no histórico é `db1b3cb refactor(home): extrai acessibilidade eMAG para modulo dedicado`.
- `js/home-acessibilidade.js` foi criado como módulo dedicado para a extração comportamental 1:1 da acessibilidade eMAG: tamanho da fonte, alto contraste, restauração das preferências via `localStorage`, `prefers-reduced-motion` nos vídeos e atalhos Alt+1..4.
- Aproximadamente 97 linhas de JavaScript inline foram removidas de `index.html`; não houve mudança visual ou funcional. A referência usa `defer` e `?v=site-public-b1-20260708`, posicionada imediatamente antes de `js/home-contato.js`, mantendo a ordem R4A, R3, R2 e R1 dos módulos da home.
- `window.changeFontSize` e `window.toggleContrast` foram preservadas explicitamente para o markup com `onclick`; `currentFontSize` permaneceu privado dentro da IIFE. O contrato `sms-font-size`/`sms-high-contrast`, fonte, contraste, reduced motion, vídeo e atalhos foi preservado.
- R1, R2, R3 e R4B permaneceram intactos. Markup e CSS permaneceram intactos. R4A e R4B continuam módulos separados por responsabilidade.
- A metadata da última atualização do site havia sido atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`. GitHub Pages foi publicado e validado na validação funcional anterior ao registro.

### Validação funcional registrada

- Validações previamente concluídas foram apenas registradas nesta atualização: `node --check js/home-acessibilidade.js`, `git diff --check`, preservação do markup e dos atributos `onclick`, funções globais preservadas, `window.currentFontSize` indefinido, carregamento único, ausência de 404 novo, fonte, contraste, atalhos e reduced motion preservados.
- Nenhum teste de runtime foi executado novamente nesta atualização. Nenhum envio real do Formspree foi realizado.

### Estado da Fase 1 e limites mantidos

1. R1 — eventos: concluído.
2. R2 — carrossel: concluído.
3. R3 — formulário: concluído.
4. R4B — utilitários visuais: concluído.
5. R4A — acessibilidade eMAG: concluído.
6. R5 — i18n/fallback inline: próximo bloco, ainda não iniciado e por último.

- Antes de qualquer `R5-EXEC`, deverá existir um `R5-PREP` somente em análise.
- Admin/CMS/Firebase continua pausado.
- V6 e V7 continuam somente após a fundação modular; B3 permanece em fase própria.
- V4D, V5C3 e V5D continuam pendentes.
- O CSS órfão `.map-modal-*` e `.agrosamas-banner` continua como frente paralela.
- A revisão editorial do destaque do 32º Mês Polonês após 30/08/2026 continua pendente.
- A pendência externa do Formspree permanece integralmente: Workflow em `imprensapmsms@gmail.com`, `turismo@saomateusdosul.pr.gov.br` em `PENDING`, nenhum envio real antes de `VERIFIED` e troca posterior somente no painel.
- R5, V6, V7 e B3 não foram executados nesta atualização de governança.

### Arquivos alterados

- `CLAUDE.md` — estado permanente de R4A, separação R4A/R4B e R5 como próximo bloco atualizados.
- `TASKS.md` — estado atual, Fase 1, R4A concluído, `R5-PREP` e pendências atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -15
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações e limites

- [x] Working tree inicial sem alterações rastreadas pendentes; `.claude/settings.local.json` não rastreado foi identificado e permaneceu intocado.
- [x] Commit funcional `db1b3cb` confirmado no histórico.
- [x] Commit de governança do R4B `ab94b13` confirmado no histórico.
- [x] Commits funcionais de R1 (`efe6c11`), R2 (`6e126cd`) e R3 (`9d9a8ef`) confirmados no histórico.
- [x] Apenas `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md` foram alterados nesta atualização.
- [x] Nenhum código, HTML, CSS, JavaScript de runtime, metadata, dado, regra, Admin/CMS/Firebase, service worker, sitemap, robots ou artefato de auditoria foi alterado.

### Próximo passo

- Preparar futuramente o `R5-PREP` somente em análise; não executar `R5-EXEC`, V6, V7 ou B3 automaticamente.

---

## 2026-07-15 — Registro de R4B na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar oficialmente a conclusão do R4B da refatoração modular progressiva da home, sem alterar runtime, código funcional ou publicação.

### Resultado consolidado

- R4B foi concluído, validado, commitado, enviado por push e publicado com sucesso. O commit funcional presente no histórico é `b272330 refactor(home): extrai utilitarios visuais para modulo dedicado`.
- `js/home-utilitarios.js` foi criado como módulo dedicado para a extração comportamental 1:1 dos utilitários visuais da home: barra de progresso de rolagem e botão “Voltar ao topo”. Aproximadamente 36 linhas inline foram removidas de `index.html`, sem mudança visual ou funcional.
- A referência adicionada foi `<script src="js/home-utilitarios.js?v=site-public-b1-20260708" defer></script>`, no mesmo ponto do bloco anterior: depois do init do VLibras e antes do menu hamburger. As variáveis ficaram privadas em IIFE, sem export, sem propriedade em `window` e sem nova dependência.
- Foram preservados busca e null-checks dos elementos, listener de scroll passivo, cálculos de `scrollTop`/`docHeight`, proteção contra divisão por zero, `Math.round`, atualização de `style.width`, segundo listener de scroll, limiar de 300px, classe `visible`, clique e `window.scrollTo({ top: 0, behavior: 'smooth' })`. Não foram introduzidos `requestAnimationFrame`, debounce, throttle ou tratamento novo para `prefers-reduced-motion`.
- R1, R2 e R3 permaneceram intactos. Menu hamburger, seletor de idiomas, barra eMAG, fonte, contraste, atalhos, i18n e acessibilidade eMAG permaneceram intactos.
- A metadata da última atualização do site foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`.

### Validação funcional registrada

- `node --check js/home-utilitarios.js` aprovado.
- `git diff --check` aprovado.
- Uma única referência a `js/home-utilitarios.js`; módulo carregado uma única vez; nenhum 404 novo.
- Barra de progresso validada em 0% no topo, valor intermediário no meio e aproximadamente 100% no final.
- Botão validado oculto antes de 300px, visível depois de 300px, retornando ao topo no clique e ocultando novamente no topo.
- Comportamento validado em desktop e mobile; menu hamburger, seletor de idiomas, barra eMAG, fonte, contraste, atalhos, R1, R2 e R3 permaneceram funcionais.
- Nenhum POST real foi executado no formulário; GitHub Pages foi publicado e validado.

### Estado da Fase 1 e limites mantidos

1. R1 — eventos: concluído.
2. R2 — carrossel: concluído.
3. R3 — formulário: concluído.
4. R4B — utilitários visuais: concluído.
5. R4A — acessibilidade eMAG: próximo microbloco, ainda não iniciado.
6. R5 — i18n/fallback inline: posterior e por último.

- R4A permanece restrito a fonte, contraste, restauração via `localStorage`, `prefers-reduced-motion`/vídeo e atalhos Alt+1..4. Deverá preservar explicitamente `window.changeFontSize` e `window.toggleContrast`, pois quatro atributos `onclick` da home dependem dessas funções globais.
- Admin/CMS/Firebase continua pausado.
- V6 e V7 continuam somente após a fundação modular; B3 permanece em fase própria.
- V4D, V5C3 e V5D continuam pendentes.
- O CSS órfão `.map-modal-*` e `.agrosamas-banner` permanece como frente paralela.
- A revisão editorial do destaque do 32º Mês Polonês após 30/08/2026 permanece pendente.
- A pendência do Formspree permanece: Workflow temporariamente em `imprensapmsms@gmail.com`; `turismo@saomateusdosul.pr.gov.br` continua `PENDING`; nenhum envio real até a troca do Workflow.
- R4A, R5, V6, V7 e B3 não foram executados nesta atualização de governança.

### Arquivos alterados

- `CLAUDE.md` — estado permanente de R4B, separação R4A/R5 e próximos caminhos atualizados.
- `TASKS.md` — estado atual, Fase 1, R4B concluído, R4A como próximo microbloco e pendências atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -12
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações e limites

- [x] Working tree inicial sem alterações rastreadas pendentes.
- [x] Commit funcional `b272330` presente no histórico.
- [x] Commits funcionais de R1 (`efe6c11`), R2 (`6e126cd`) e R3 (`9d9a8ef`) presentes no histórico.
- [x] `.claude/settings.local.json` identificado como não rastreado e mantido intocado.
- [x] Apenas `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md` foram alterados nesta atualização.
- [x] Nenhum código, HTML, CSS, JavaScript de runtime, dado, regra, Admin/CMS/Firebase, service worker, sitemap, robots ou artefato de auditoria foi alterado.

### Próximo passo

- Planejar R4A como microbloco separado, restrito à acessibilidade eMAG, após escopo explícito; não executar R4A, R5, V6, V7 ou B3 automaticamente.

---

## 2026-07-13 — Registro de R3 na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar oficialmente a conclusão do R3 da refatoração modular progressiva da home, sem alterar runtime, código funcional ou publicação.

### Resultado consolidado

- R3 foi concluído, validado, commitado, enviado por push e publicado com sucesso. O commit funcional presente no histórico é `9d9a8ef refactor(home): extrai formulario de contato para modulo dedicado`.
- `js/home-contato.js` foi criado como terceiro módulo da Fase 1 para a extração comportamental 1:1 da lógica do formulário de contato; aproximadamente 58 linhas inline foram removidas de `index.html`, sem mudança funcional ou visual.
- A referência única adicionada foi `<script src="js/home-contato.js?v=site-public-b1-20260708" defer></script>`, posicionada antes de `js/home-experiencias.js` e `js/home-eventos.js`. A lógica permanece privada em IIFE, sem propriedade em `window`, export ou nova dependência.
- O endpoint `https://formspree.io/f/xpqykpqd` e o `FORMSPREE_ID` `xpqykpqd` foram preservados, assim como POST, headers Accept/Content-Type, `event.preventDefault()`, `FormData`, `Object.fromEntries()`, `JSON.stringify()`, `response.ok`, loading, mensagens, classes `form-status success/error`, reset somente no sucesso, timeout de 6000 ms, `console.error`, validação nativa e retornos silenciosos.
- R1 e R2 permaneceram intactos. Markup, CSS, `translations.js` e `config.js` permaneceram intactos.
- A metadata da última atualização do site foi atualizada antes do commit funcional com `node scripts/update-site-meta.mjs`.

### Validação funcional registrada

- `node --check js/home-contato.js` aprovado.
- `git diff --check` aprovado.
- `FORMSPREE_ID` removido de `index.html`; uma única referência a `js/home-contato.js`; módulo carregado uma única vez.
- Validação HTML nativa `required` bloqueou submissão vazia.
- Nenhuma requisição POST e nenhum envio real foram realizados durante a validação.
- Console sem novo `ReferenceError` ou `TypeError`; carrossel de experiências continuou funcionando; grade “Acontece em breve” continuou com quatro cards.
- R1 e R2 permaneceram intactos; CSS, `translations.js`, `config.js` e markup permaneceram intactos; GitHub Pages foi publicado e validado.

### Pendência externa do Formspree

- O Workflow atual continua temporariamente entregando para `imprensapmsms@gmail.com`.
- O endereço institucional obrigatório `turismo@saomateusdosul.pr.gov.br` já foi adicionado em Linked Emails, mas o status permanece `PENDING` e depende de confirmação por outro setor.
- Nenhum envio real deve ocorrer enquanto permanecer `PENDING`.
- Após o status mudar para `VERIFIED`: abrir Forms > TURISMO > Workflow > Email; selecionar `turismo@saomateusdosul.pr.gov.br`; salvar mantendo a ação Enabled; realizar um único envio institucional controlado; confirmar recebimento no novo endereço; e confirmar que o Gmail antigo deixou de receber.
- A troca futura ocorrerá somente no painel do Formspree e não exigirá alteração de código, metadata, commit ou deploy.

### Estado da Fase 1 e limites mantidos

1. R1 — eventos: concluído.
2. R2 — carrossel: concluído.
3. R3 — formulário: concluído.
4. R4 — acessibilidade e utilitários visuais: próximo módulo, não iniciado nesta tarefa.
5. R5 — i18n/fallback inline: posterior e por último.

- Admin/CMS/Firebase continua pausado.
- V6 e V7 continuam somente após a fundação modular; B3 permanece em fase própria.
- V4D, V5C3 e V5D continuam pendentes.
- O CSS órfão `.map-modal-*` e `.agrosamas-banner` permanece como frente paralela.
- A revisão editorial do destaque do 32º Mês Polonês após 30/08/2026 permanece pendente.
- R4, R5, V6, V7 e B3 não foram executados nesta atualização de governança.

### Arquivos alterados

- `CLAUDE.md` — estado permanente de R3, separação dos módulos da Fase 1, pendência do Formspree e próximos caminhos atualizados.
- `TASKS.md` — estado atual, Fase 1, R3 concluído, R4 como próximo módulo e pendências atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -10
git show --stat --oneline 9d9a8ef
git show --stat --oneline 6e126cd
git show --stat --oneline efe6c11
git diff -- .claude
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações e limites

- [x] Working tree inicial sem alterações rastreadas pendentes.
- [x] Commit funcional `9d9a8ef` presente no histórico.
- [x] Commits funcionais de R1 (`efe6c11`) e R2 (`6e126cd`) presentes no histórico.
- [x] `.claude/settings.local.json` identificado como não rastreado e mantido intocado.
- [x] Apenas `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md` foram alterados nesta atualização.
- [x] Nenhum código, HTML, CSS, JavaScript de runtime, dado, regra, Admin/CMS/Firebase, service worker, sitemap, robots ou artefato de auditoria foi alterado.

### Próximo passo

- Planejar R4 em bloco separado, após escopo explícito; não executar R4, R5, V6, V7 ou B3 nesta atualização.

---

## 2026-07-13 — Registro de R2 na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar oficialmente R2 como o segundo módulo concluído da Fase 1 da refatoração modular progressiva da home.

### Resultado consolidado

- R2 extraiu comportamentalmente 1:1 o carrossel “Experiências em destaque” de `index.html` para `js/home-experiencias.js`, sem mudança visual ou funcional.
- Aproximadamente 57 linhas de JavaScript inline foram removidas de `index.html`; o novo arquivo tornou-se o segundo módulo da fundação modular.
- A referência adicionada em `index.html` usa `<script src="js/home-experiencias.js?v=site-public-b1-20260708" defer></script>` e foi posicionada antes de `js/home-eventos.js`.
- `initFeaturedExperiencesCarousel` permaneceu privada em IIFE, com listener próprio de `DOMContentLoaded`, sem função em `window`, export, `import()`, `fetch`, URL relativa ou nova dependência.
- Seletores `data-featured-*`, retorno silencioso, botões anterior/próximo, passo pela largura real do card, leitura de gap, fallback `Math.min(track.clientWidth, 320)`, `scrollBy`, `smooth/auto` conforme reduced motion, controles disabled e tolerância de 2px foram preservados.
- Click, ArrowLeft/ArrowRight com `preventDefault`, scroll passive, resize, atualização inicial, scroll/swipe nativo no mobile, responsividade, scroll-snap, tabindex e aria-labels traduzíveis foram preservados.
- R2 foi concluído, validado, commitado, enviado por push e publicado. O commit funcional presente no histórico é `6e126cd refactor(home): extrai carrossel de experiencias para modulo dedicado`.
- A data/hora da última atualização do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit funcional; o script não foi executado nesta atualização de governança.

### Separação R1/R2 e ordem da Fase 1

- R1 permaneceu intacto: `js/home-eventos.js` continua contendo somente a grade “Acontece em breve”.
- R2 contém somente o carrossel “Experiências em destaque” em `js/home-experiencias.js`.
- Acessibilidade e utilitários visuais permanecem inline para o futuro R4.
- R3, destinado ao formulário, passa a ser o próximo módulo, mas não foi iniciado nesta tarefa.
- R4 e R5 permanecem posteriores; R5 continua reservado ao i18n/fallback inline por último e com maior sensibilidade.

### Pendências e limites mantidos

- Admin/CMS/Firebase continua pausado.
- V6 e V7 continuam somente após a fundação modular; B3 permanece em fase própria.
- V4D, V5C3 e V5D permanecem pendentes.
- O CSS órfão `.map-modal-*` e `.agrosamas-banner` permanece como frente paralela.
- A revisão editorial do destaque do 32º Mês Polonês após 30/08/2026 permanece pendente.
- R3, R4, R5, V6, V7 e B3 não foram executados nesta atualização de governança.

### Arquivos alterados

- `CLAUDE.md` — estado permanente de R2, separação R1/R2 e próximos módulos atualizados.
- `TASKS.md` — estado da Fase 1, conclusão de R2, R3 como próximo módulo e pendências atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -10
git diff -- .claude
Get-ChildItem -Force .claude
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações e limites

- [x] Working tree inicial sem alterações rastreadas pendentes
- [x] Commit funcional `6e126cd` presente no histórico
- [x] `.claude/settings.local.json` identificado como não rastreado e mantido intocado
- [x] Leitura dos três arquivos de governança
- [x] Escopo restrito a `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Nenhum código, HTML, CSS, JavaScript de runtime, dado, regra, Admin/CMS/Firebase ou artefato de auditoria alterado

### Próximo passo

- Planejar R3 em bloco separado, após escopo explícito; não executar automaticamente nesta atualização.

---

## 2026-07-13 — Registro de R1 na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar oficialmente R1 como o primeiro módulo concluído da Fase 1 da refatoração modular progressiva da home.

### Resultado consolidado

- R1 extraiu somente a lógica da grade “Acontece em breve” de `index.html` para `js/home-eventos.js` com comportamento 1:1 e sem mudança funcional ou editorial.
- Aproximadamente 183 linhas de JavaScript inline foram removidas de `index.html`; `js/home-eventos.js` tornou-se o primeiro módulo da fundação modular.
- R1 foi concluído, validado, commitado, enviado por push e publicado. O commit funcional presente no histórico é `efe6c11 refactor(home): extrai grade de eventos para modulo dedicado`.
- `eventos-2026.json` continua fonte primária; fallback estático, regra V5B, priorização de únicos, preenchimento por recorrentes, limite de quatro cards, ordenação, desempate e enriquecimento opcional via Firebase foram preservados.
- A extração manteve `carregarProximosEventos` privada em IIFE, listener próprio de `DOMContentLoaded`, nenhum export e nenhuma função adicionada a `window`.
- A metadata do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit funcional; o script não foi executado nesta atualização de governança.

### Separação R1/R2 e aprendizado técnico

- O carrossel de experiências permaneceu integralmente inline e fora de `js/home-eventos.js`.
- R2 continua como próximo módulo, destinado somente ao carrossel em `js/home-experiencias.js`; não foi iniciado.
- Para R2–R5, todo `import()` relativo deve ser reavaliado quando código inline for externalizado: a resolução passa a considerar a localização do novo arquivo. Não copiar caminhos relativos cegamente; testar no Network para evitar duplicações como `/js/js/`.

### Ordem da Fase 1

1. R1 — eventos: concluído.
2. R2 — carrossel: próximo, não iniciado.
3. R3 — formulário.
4. R4 — acessibilidade e utilitários visuais.
5. R5 — i18n/fallback inline, por último e mais sensível.

### Pendências mantidas

- CSS órfão `.map-modal-*` e `.agrosamas-banner` permanecem para follow-up separado.
- Revisar editorialmente o destaque do 32º Mês Polonês após 30/08/2026.
- V4D, V5C3 e V5D permanecem pendentes.
- V6 e V7 só devem ocorrer após a fundação modular; B3 permanece em fase própria.
- Admin/CMS/Firebase continua pausado.
- R2, R3, R4, R5, V6, V7 e B3 não foram executados nesta atualização.

### Arquivos alterados

- `CLAUDE.md` — decisão consolidada de R1 e separação R1/R2.
- `TASKS.md` — estado, Fase 1, próximo módulo e pendências atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git log --oneline -10
git show --stat --oneline --decorate --no-renames efe6c11
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações e limites

- [x] Working tree inicial sem alterações rastreadas pendentes
- [x] Commit funcional `efe6c11` presente no histórico e em `origin/main`
- [x] `.claude/settings.local.json` identificado como não rastreado e mantido intocado
- [x] Leitura dos três arquivos de governança
- [x] `git diff --check`
- [x] `git diff --name-only`
- [x] `git diff --stat`
- [x] `git status` final
- [x] Somente os três arquivos de governança alterados
- [x] Nenhum runtime, regra, dado, mídia, Admin/CMS/Firebase ou artefato de auditoria alterado

### Próximo passo

- Preparar R2 em bloco separado, após escopo explícito; não executar automaticamente.

---

## 2026-07-13 — Checkpoint arquitetural pós-V5

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar o checkpoint arquitetural pós-V5, a tag `pos-v5-checkpoint`, a estratégia aprovada e o plano de fases, sem executar R1 ou qualquer alteração de runtime.

### Resultado consolidado

- O diagnóstico foi somente leitura e confirmou que o projeto público está funcional e saudável em várias áreas, com deploy GitHub Pages estável, governança reversível, fallbacks estáticos resilientes, camada `TURISMO_*` + adapters organizada, service worker adequado, cache-busting consistente e SEO público organizado.
- A dívida técnica está concentrada principalmente em `index.html` (aproximadamente 2.473 linhas, cerca de 975 de JavaScript inline) e `css/index.css` (aproximadamente 7.080 linhas e 743 ocorrências de `!important`). Também foram registrados acoplamento de navegação, fallback i18n inline duplicado, manutenção paralela de notícias, padrões Firebase compat/modular misturados e órfãos de CSS/configuração/i18n.
- Não há evidência para reescrita completa ou projeto novo. A estratégia aprovada é híbrida: refatoração modular progressiva como espinha dorsal, microblocos para ajustes editoriais e remoção de órfãos, e B3 como frente própria de performance.
- A tag anotada `pos-v5-checkpoint` foi criada e enviada ao remoto.

### Decisões e separações

- Não reconstruir a home do zero, não criar projeto novo, não iniciar reescrita total e não retomar Admin/CMS/Firebase neste momento.
- R1 extrairá somente a lógica da grade "Acontece em breve" para `js/home-eventos.js`.
- R2 será posterior e separado, destinado ao carrossel de experiências em `js/home-experiencias.js`; o carrossel não será colocado em `js/home-eventos.js`.
- V6 continua válido, mas somente depois da fundação modular da home.
- V7 ocorrerá no projeto atual depois das extrações, usando `js/nav-shared.js` como base única e removendo a navegação inline duplicada.
- B3 pode receber auditoria somente leitura antecipada, mas a execução de mídia/performance permanece em fase própria.
- V4D, V5C3 e V5D continuam pendentes e não serão executados automaticamente.
- R1 é o próximo microbloco aprovado para preparação, mas não foi executado nesta tarefa.

### Plano aprovado

1. **Fase 0 — checkpoint:** concluído com a tag `pos-v5-checkpoint`.
2. **Fase 1 — fundação modular da home:** R1 eventos; R2 carrossel; R3 formulário; R4 acessibilidade e utilitários visuais; R5 i18n/fallback inline por último e após análise específica.
3. **Fase 2 — navegação e estrutura:** V7 com `js/nav-shared.js` como base única; depois V6, se ainda fizer sentido editorialmente.
4. **Fase 3 — dados editoriais:** fonte única de notícias; contrato entre `eventos-2026.json` e `TURISMO_EVENTOS`; preparação da virada anual de eventos.
5. **Fase 4 — performance/B3:** vídeos, imagens pesadas, CSS órfão e revisão gradual de `css/index.css`.
6. **Fase 5 — CMS:** somente quando oficialmente despausado.

### Arquivos alterados

- `CLAUDE.md` — decisão arquitetural durável e separação R1/R2 registradas.
- `TASKS.md` — checkpoint, fases, próximo microbloco e pendências atualizados.
- `CHANGELOG_AI.md` — registro deste checkpoint de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
git tag --list "pos-v5-checkpoint"
git show-ref --tags --verify "refs/tags/pos-v5-checkpoint"
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações e limites

- [x] Estado inicial sem alterações rastreadas pendentes
- [x] Tag local `pos-v5-checkpoint` confirmada por `git show-ref`
- [x] Leitura dos três arquivos de governança
- [x] Alteração restrita aos três arquivos permitidos
- [x] `git diff --check`
- [x] `git diff --name-only`
- [x] `git diff --stat`
- [x] `git status` final
- [x] R1 não executado
- [x] Nenhum código, HTML, CSS, JavaScript de runtime, dados, rules, Admin/CMS/Firebase, `.claude/*` ou `docs/auditoria-output/*` alterado

### Próximo passo

- Preparar R1 em bloco separado, após novo escopo explícito; não executar R1, R2, V6, V7, B3 ou qualquer fase nesta atualização.

---

## 2026-07-13 — Registro de V5C2 e V5C2A na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que V5C2-EXEC e o microajuste V5C2A foram concluídos, validados, enviados por push e publicados, mantendo os próximos blocos apenas como pendências conscientes.

### Arquivos alterados

- `CLAUDE.md` — decisão consolidada da frente pública atualizada com V5C2+V5C2A concluídos, preservações e follow-ups.
- `TASKS.md` — estado atual, bloco concluído, roadmap e pendências editoriais/visuais atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações

- [x] Estado inicial sem alteração rastreada pendente
- [x] `.claude/settings.local.json` identificado como não rastreado e mantido intocado
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito aos três arquivos de governança
- [x] `git diff --check`
- [x] `git diff --name-only`
- [x] `git diff --stat`
- [x] `git status` final

### Registros consolidados

- O primeiro card da home foi atualizado para a matéria "Agosto é Polonês em São Mateus do Sul: confira a programação do 32º Mês Polonês", e a mesma matéria foi adicionada ao topo de `noticias.html`, mantendo home e listagem sincronizadas.
- A matéria nova passou a ser o destaque principal de `noticias.html`, como `article.post-card.featured`, com título `h2` e selo "Destaque · Cultura e Gastronomia".
- A notícia antiga sobre o regulamento da Polskie Smaki foi preservada como segundo card comum, com título `h3` e categoria Cultura; a hierarquia `h2`/`h3` e o selo foram transferidos de forma coerente.
- Nenhuma notícia anterior foi removida. Os cards 2 e 3 da home e o CTA geral `/noticias` permaneceram intactos.
- CSS, JavaScript, `translations.js`, `noticia.html`, `js/cms.js` e a camada opcional do CMS foram preservados.
- A data/hora da última atualização do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit funcional; esse script não foi executado nesta atualização de governança.

### Riscos / observações

- Revisar o destaque do 32º Mês Polonês após 30/08/2026, aplicar a política de rotação mensal e remover ou substituir cards de eventos em até aproximadamente sete dias após o encerramento.
- A notícia nova e a antiga usam atualmente a mesma imagem; eventual troca deve ocorrer somente após conferência visual e em bloco separado.
- V5C3 permanece pendente para avaliar a extração dos `style` inline dos CTAs para classe compartilhada; exige CSS, pode integrar bloco visual futuro e não deve ser executado automaticamente.
- V5D permanece pendente para revisão anti-envelhecimento de Festas em Destaque; depende de `translations.js`, tem risco médio e exige decisão consciente.
- V4D permanece pendente como dívida técnica/decisão consciente.
- A fonte única de notícias permanece como follow-up arquitetural futuro.
- B3 mídia/performance permanece para o final.
- Admin/CMS/Firebase segue pausado.
- Nenhum código, HTML, CSS, JavaScript de runtime, `index.html`, `noticias.html`, `js/site-meta.js`, `noticia.html`, `js/cms.js`, `translations.js`, `config.js`, mídia, dados de eventos, sitemap, robots, rules, Admin/CMS/Firebase, `.claude/*` ou `docs/auditoria-output/*` foi alterado nesta atualização.
- V5C3, V5D, V6, V7 e B3 não foram iniciados.

### Próximo passo

- Manter os follow-ups editoriais e visuais registrados e não iniciar outro bloco sem decisão explícita.

---

## 2026-07-10 — Registro de V5C1 na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que o V5C1 foi concluído, validado, enviado por push e publicado, mantendo V5C2 e V5C3 pendentes e sem iniciar outro bloco.

### Arquivos alterados

- `CLAUDE.md` — decisão consolidada da frente pública atualizada com V5C1 concluído e próximos caminhos.
- `TASKS.md` — estado atual, blocos concluídos, pendências V5C2/V5C3 e follow-up arquitetural atualizados.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --untracked-files=all
```

### Validações

- [x] Estado inicial sem alteração rastreada de código ou governança
- [x] `.claude/settings.local.json` identificado como não rastreado e mantido intocado
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito aos três arquivos de governança
- [x] `git diff --check`
- [x] `git diff --name-only`
- [x] `git diff --stat`
- [x] `git status` final

### Riscos / observações

- V5C1 corrigiu os links dos cards Polskie Smaki, Fanfarras municipais e Estruturação do turismo local para matérias individuais reais do Portal oficial da Prefeitura.
- Os três links abrem em nova aba com `target="_blank"` e incluem `rel="noopener noreferrer"`.
- O CTA geral "Ver todas as notícias" continua apontando para `/noticias`.
- Textos, imagens, datas, categorias, traduções, layout e CSS foram preservados.
- A data/hora da última atualização do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit de código; esse script não foi executado nesta atualização de governança.
- Nenhum código, HTML, CSS, JavaScript de runtime, `index.html`, `js/site-meta.js`, `noticias.html`, `noticia.html`, `js/cms.js`, `translations.js`, `config.js`, dado, sitemap, robots, rule, Admin/CMS/Firebase, `.claude/*` ou `docs/auditoria-output/*` foi alterado nesta atualização.
- V5C2 permanece pendente para higiene e rotação editorial dos cards, decisão sobre substituir o card mais antigo e definição da política de atualização da home em relação a `noticias.html`; risco médio e decisão humana item por item.
- V5C3 permanece pendente para avaliar a extração do `style` inline dos CTAs para classe compartilhada; exige CSS, não deve ser executado automaticamente e pode integrar um bloco visual maior.
- O follow-up arquitetural de fonte única de notícias entre home e `noticias.html` permanece fora do V5C, aguardando decisão entre JSON, CMS ou outra solução futura e possível retomada do CMS.
- V5D permanece pendente para revisão anti-envelhecimento de Festas em Destaque, com dependência de `translations.js`, risco médio e decisão consciente.
- V4D permanece como dívida técnica/decisão consciente; B3 mídia/performance permanece para o final; Admin/CMS/Firebase segue pausado.

### Próximo passo

- Manter V5C2, V5C3 e V5D pendentes até decisão humana explícita; não iniciar outro bloco nesta atualização.

---

## 2026-07-10 — Registro de V5B na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que o V5B foi concluído, validado, enviado por push e publicado, mantendo V5C e V5D pendentes e sem iniciar outro bloco.

### Arquivos alterados

- `CLAUDE.md` — decisão durável da frente pública atualizada com V5B concluído, preservações, pendências e follow-ups.
- `TASKS.md` — estado atual, próximo passo, blocos concluídos e tarefas pendentes atualizados com V5B.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git diff --name-only
git diff --stat
git status --short --branch
```

### Validações

- [x] `git status` inicial, sem alteração rastreada pendente
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git diff --name-only`
- [x] `git diff --stat`
- [x] `git status` final

### Riscos / observações

- V5B prioriza eventos únicos/não recorrentes na grade "Acontece em breve"; eventos recorrentes somente completam vagas quando faltam eventos únicos.
- A seleção final permanece cronológica, limitada a quatro cards e com o desempate por vínculo a estabelecimento preservado.
- O fallback estático e o merge com eventos aprovados do Firebase foram preservados; eventos vindos do Firebase continuam mapeados como `recorrente: false`.
- `eventos-2026.json`, `js/data/eventos.js` e as demais fontes de dados permaneceram intactos.
- A data/hora da última atualização do site foi atualizada com `node scripts/update-site-meta.mjs` antes do commit de código do V5B; esse script não foi executado nesta atualização de governança.
- Nenhum código, HTML, CSS, JavaScript de runtime, `index.html`, `js/site-meta.js`, `translations.js`, `config.js`, `js/public-banners.js`, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado nesta atualização.
- V5C permanece pendente para higiene editorial de Eventos & Notícias, confirmação dos links reais das notícias e revisão de conteúdo hard-coded e datas envelhecidas; risco médio e decisão humana item por item.
- V5D permanece pendente para revisão anti-envelhecimento de Festas em Destaque; risco médio, depende de `translations.js` e exige decisão consciente.
- V4D permanece pendente como dívida técnica/decisão consciente; B3 mídia/performance permanece para o final; Admin/CMS/Firebase segue pausado.
- Follow-ups mantidos: CSS órfão `.map-modal-*`, CSS órfão `.agrosamas-banner`, chaves i18n órfãs relacionadas aos blocos removidos, `CONFIG.agrosamas` temporariamente sem efeito na home, virada anual de `eventos-2026.json` e possível duplicação futura entre `eventos-2026.json` e `TURISMO_EVENTOS`.

### Próximo passo

- Manter V5C e V5D pendentes até decisão humana explícita; não iniciar outro bloco nesta atualização.

---

## 2026-07-09 — Registro de V5A na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que o V5A foi concluído, validado, commitado e reenviado por push após instabilidade/cancelamento do GitHub Pages, mantendo V5B, V5C e V5D como pendências separadas.

### Arquivos alterados

- `CLAUDE.md` — observações permanentes atualizadas com V5A concluído, publicação/reenvio com check verde, preservações e próximos microblocos V5B/V5C/V5D.
- `TASKS.md` — estado atual, próximo passo recomendado, blocos concluídos, próximos caminhos, follow-ups e tarefas concluídas atualizados com V5A.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git status --short --branch
git diff --stat
```

### Validações

- [x] `git status` inicial
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final
- [x] `git diff --stat`

### Riscos / observações

- Nenhum código, HTML, CSS, JS, `translations.js`, `config.js`, dados de eventos, `js/public-banners.js`, `js/site-meta.js`, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado nesta atualização de governança.
- V5A removeu da home o banner/section AgroSamas oculto e o script inline exclusivo (`ativarBannerAgrosamas`, `fecharBannerAgrosamas`, `localStorage agrosamas-banner-closed` e autoativação comentada), com aproximadamente 63 linhas removidas de `index.html` no bloco já concluído.
- O slot moderno `#public-banners-slot` foi preservado como caminho oficial para banners/campanhas; `js/public-banners.js`, `config.js` e `translations.js` foram preservados.
- A data/hora da última atualização do site foi atualizada antes do commit real de publicação/reenvio do V5A (`chore: atualiza metadata para reenviar deploy do V5A`), e o GitHub Pages build and deployment concluiu novamente com check verde.
- V5B segue pendente para despriorizar recorrentes na grade "Acontece em breve"; risco baixo-médio; exige teste visual e funcional da home.
- V5C segue pendente para higiene editorial de Eventos & Notícias; risco médio; exige decisão humana sobre notícias e links reais.
- V5D segue pendente para revisão anti-envelhecimento de Festas em Destaque; risco médio; depende de mexer em `translations.js`, então só com decisão consciente.
- Follow-ups mantidos: CSS órfão `.agrosamas-banner`, chaves i18n órfãs `agrosamas-banner-*`, `CONFIG.agrosamas` temporariamente sem efeito na home, B3 mídia/performance para o final e Admin/CMS/Firebase pausado.

### Próximo passo

- Planejar V5B como microbloco separado, com teste visual e funcional da home antes de qualquer conclusão.

---

## 2026-07-09 — Registro de V4A, V4B e V4C na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que os microblocos V4A, V4B e V4C da limpeza de peso morto da home foram concluídos, testados, commitados e enviados por push, deixando V4D como pendência consciente.

### Arquivos alterados

- `CLAUDE.md` — observações permanentes atualizadas com V4A+V4B+V4C concluídos, V4D pendente/risco médio e próximos caminhos V5, V6, V7, B3 e follow-ups futuros.
- `TASKS.md` — estado atual, próximo passo recomendado, blocos concluídos, próximos caminhos e tarefas concluídas atualizados com V4A+V4B+V4C.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git status --short
git diff --stat
```

### Validações

- [x] `git status` inicial
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final
- [x] `git diff --stat`

### Riscos / observações

- Nenhum código, HTML, CSS, JS, `translations.js`, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado nesta atualização de governança.
- V4A+V4B+V4C removeram aproximadamente 404 linhas de peso morto da home; `index.html` foi o único arquivo alterado nesses microblocos já concluídos.
- V4D fallback inline de traduções permanece pendente, com risco médio, e só deve ser executado por decisão consciente; alternativa aceitável é manter documentado como dívida técnica.
- V5 consolidação de eventos/notícias da home, V6 reordenação da metade inferior da home e V7 unificação da navegação seguem como caminhos futuros; V7 é alto risco e deve ficar para depois.
- B3 mídia/performance continua para o final.
- Admin/CMS/Firebase segue pausado.
- Follow-up futuro: CSS órfão `.map-modal-*` pode ser revisado em bloco próprio, e as chaves i18n `modal-endereco`, `modal-telefone` e `modal-horario` podem ser revisadas futuramente sem alterar `translations.js` agora.

### Próximo passo

- Decidir conscientemente se V4D será executado ou mantido como dívida técnica documentada; depois seguir para V5.

---

## 2026-07-09 — Registro de V3 navegação na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que o bloco V3 de navegação foi concluído, testado em produção, commitado e enviado por push, e indicar V4 como próximo bloco provável sem iniciá-lo.

### Arquivos alterados

- `CLAUDE.md` — observações permanentes atualizadas com V3 concluído, próximos caminhos V4 a V7, B3 por último, Admin/CMS/Firebase pausado e follow-up separado de Service Worker em localhost.
- `TASKS.md` — estado atual, próximo passo recomendado, blocos concluídos, próximos caminhos e tarefas concluídas atualizados com V3.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git status --short
```

### Validações

- [x] `git status` inicial
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final

### Riscos / observações

- Nenhum código, HTML, CSS, JS, `translations.js`, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado nesta atualização de governança.
- V3 alterou apenas `index.html` e `js/nav-shared.js`, já commitados e enviados por push no bloco anterior.
- Teste em produção confirmou que o mapa carregou corretamente; os erros anteriores eram de ambiente local/cache/service worker.
- V4 fica como próximo bloco provável: limpeza de peso morto da home, somente com confirmação item a item e sem iniciar nesta atualização.
- V5 consolidação de eventos, V6 reordenação da home e V7 unificação da navegação ficam como etapas futuras; V7 é alto risco e deve ficar para depois.
- B3 mídia/performance continua para o final.
- Admin/CMS/Firebase segue pausado.
- Follow-up separado: investigar Service Worker em localhost se voltar a interceptar Leaflet/OSM, sem tratar como regressão do V3.

### Próximo passo

- Planejar V4 limpeza de peso morto da home como bloco separado, somente com confirmação item a item.

---

## 2026-07-09 — Registro de V1+V2 na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que o bloco visual/UX V1+V2 foi concluído, aprovado, commitado e enviado por push, e indicar V3 navegação como próximo bloco provável.

### Arquivos alterados

- `CLAUDE.md` — adicionada observação permanente sobre V1+V2 concluído e próximos caminhos V3 a V7.
- `TASKS.md` — estado atual, frente ativa, blocos concluídos, próximos caminhos e tarefas concluídas atualizados com V1+V2.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git status --short
```

### Validações

- [x] `git status` inicial
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final

### Riscos / observações

- Nenhum código, HTML, CSS, JS, `translations.js`, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado nesta atualização de governança.
- V3 navegação fica como próximo bloco provável: paridade entre nav da home e `nav-shared`, links para `/sabores` e `/onde-ficar`, atalhos mobile e sem unificação da home com `nav-shared` ainda.
- V4 limpeza de peso morto deve ocorrer somente depois e com confirmação item a item.
- V5 consolidação de eventos, V6 reordenação da home e V7 unificação da navegação ficam como etapas futuras; V7 é alto risco e deve ficar para depois.
- B3 mídia/performance continua para o final.
- Frente Admin/CMS/Firebase segue pausada.

### Próximo passo

- Planejar V3 navegação como bloco separado, pequeno e auditável.

---

## 2026-07-08 — Registro de SEO-F1 na governança

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que SEO-F1 foi concluído, commitado e enviado por push, encerrando o follow-up de `noindex,follow` nas páginas legadas/suspensas removidas do sitemap.

### Arquivos alterados

- `CLAUDE.md` — adicionada observação permanente sobre SEO-F1 concluído e próximos caminhos restantes.
- `TASKS.md` — estado atual, frente ativa, blocos concluídos e tarefas concluídas atualizados com SEO-F1.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git status --short
```

### Validações

- [x] `git status` inicial
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final

### Riscos / observações

- Nenhum código, HTML, CSS, JS, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado nesta atualização de governança.
- SEO-F1 concluiu o follow-up de `noindex` das páginas legadas/suspensas removidas do sitemap.
- B3 mídia/performance continua decidido para o final.
- B4b migração Firebase modular sob demanda permanece como possível próximo bloco, mas ainda não iniciado.
- Frente Admin/CMS/Firebase segue pausada.

### Próximo passo

- Escolher futuramente entre B4b modular com teste manual dedicado, investigação Service Worker/OpenStreetMap ou revisão de dados Firestore; manter B3 mídia/performance para o final.

---

## 2026-07-08 — Registro de B5/B4a e follow-ups da auditoria pública

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que B5 diagnóstico Firebase público e B4a timeout no mapa foram concluídos, e documentar follow-ups aprovados sem alterar código, HTML, CSS, JS, sitemap, robots, rules, Admin/CMS/Firebase ou artefatos de auditoria.

### Arquivos alterados

- `CLAUDE.md` — adicionadas observações permanentes sobre B5/B4a concluídos e próximos caminhos possíveis.
- `TASKS.md` — estado atual, frente ativa, blocos concluídos, follow-ups e tarefas concluídas atualizados com B5/B4a.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short
Get-Content -Raw -LiteralPath "CLAUDE.md"
Get-Content -Raw -LiteralPath "TASKS.md"
Get-Content -Raw -LiteralPath "CHANGELOG_AI.md"
git diff --check
git status --short
```

### Validações

- [x] `git status` inicial
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final

### Riscos / observações

- Nenhum código, HTML, CSS, JS, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado.
- App Check/reCAPTCHA em localhost deve ser tratado como ambiente/debug token, não regressão.
- Service Worker/OpenStreetMap, vínculos de eventos sem `establishmentId`, B4b modular e SEO `noindex` ficaram como blocos futuros separados.
- B3 mídia/performance fica por último, conforme decisão atual.

### Próximo passo

- Escolher um microbloco futuro entre SEO `noindex`, investigação Service Worker/OpenStreetMap, revisão de dados Firestore ou B4b modular com teste manual dedicado.

---

## 2026-07-08 — Registro de B1/B2 da auditoria pública

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar em governança que os blocos B1 e B2 da auditoria pública pós-Claude Fable 5 foram concluídos, commitados e enviados manualmente, e deixar documentados os próximos caminhos possíveis sem alterar código, sitemap, robots, rules, Admin/CMS/Firebase ou artefatos de auditoria.

### Arquivos alterados

- `CLAUDE.md` — adicionada orientação permanente curta sobre B1/B2 concluídos, próximos caminhos possíveis e pausa mantida de Admin/CMS/Firebase.
- `TASKS.md` — estado atual, frente ativa e tarefas concluídas atualizados com B1 cache-busting, B2 higiene de sitemap e próximos caminhos possíveis.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch
Get-Content -Raw -Path "CLAUDE.md"
Get-Content -Raw -Path "TASKS.md"
Get-Content -Raw -Path "CHANGELOG_AI.md"
git diff --check
git status --short --branch
```

### Validações

- [x] `git status` inicial
- [x] Leitura de `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final

### Riscos / observações

- Nenhum código, HTML, CSS, JS, sitemap, robots, rules, Admin/CMS/Firebase ou `docs/auditoria-output/*` foi alterado.
- Follow-up SEO de `noindex` em páginas legadas/suspensas deve ser tratado como bloco opcional e explícito.
- B3 deve começar preferencialmente como inventário de mídia/performance sem edição; B4 tem risco médio; B5 deve ser diagnóstico sem edição do Firebase.
- Admin/CMS/Firebase segue pausado.

### Próximo passo

- Escolher entre follow-up SEO opcional, B3 inventário de mídia/performance, B4 scripts/defer ou B5 diagnóstico sem edição do Firebase em mapa/eventos.

---

## 2026-07-08 — Pausa temporária de Admin/CMS/Firebase

**Ferramenta/modelo:** Codex
**Responsável pela aprovação:** Jacob
**Status:** aplicado (sem commit)

### Objetivo

Registrar nos arquivos de governança que o CMS-5C foi concluído, commitado, enviado por push e que as Firestore Rules foram publicadas, pausando temporariamente a frente Admin/CMS/Firebase para priorizar auditoria e melhoria do site público.

### Arquivos alterados

- `CLAUDE.md` — orientação permanente atualizada para indicar pausa temporária de Admin/CMS/Firebase e foco atual no site público.
- `TASKS.md` — estado atual atualizado; CMS-5C marcado como concluído; teste esperado de `/cms-public-debug.html` registrado; CMS-5D e CMS-4E-EXEC mantidos como pendências futuras.
- `CHANGELOG_AI.md` — registro desta atualização de governança.

### Comandos executados

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch --untracked-files=all
Get-Content -Path 'CLAUDE.md'
Get-Content -Path 'TASKS.md'
Get-Content -Path 'CHANGELOG_AI.md'
git diff --check
git status --short --branch --untracked-files=all
```

### Validações

- [x] `git status` inicial limpo
- [x] Escopo restrito a arquivos de governança
- [x] `git diff --check`
- [x] `git status` final

### Riscos / observações

- Nenhum código, HTML, CSS, JS, rules, dados ou artefato de auditoria deve ser alterado nesta tarefa.
- A próxima frente ativa é o site público; Admin/CMS/Firebase só deve ser retomado por bloco explícito.

### Próximo passo

- Iniciar auditoria e melhoria do site público sem mexer em Admin/CMS/Firebase.

---

## Como registrar

Cada entrada deve seguir este modelo:

```md
## AAAA-MM-DD — Título curto da alteração

**Ferramenta/modelo:** Claude Code / Codex / ChatGPT / outro  
**Responsável pela aprovação:** Jacob  
**Status:** planejado / aplicado / validado / revertido

### Objetivo

[Objetivo da alteração]

### Arquivos alterados

- `arquivo.ext` — resumo do que mudou

### Comandos executados

```powershell
comando
```

### Validações

- [ ] build
- [ ] lint
- [ ] revisão visual
- [ ] revisão de SEO/metadados
- [ ] teste em produção/homologação

### Riscos / observações

- ...

### Próximo passo

- ...
```

---

## 2026-07-03 — Tarefa 6: revisão multilíngue PT-BR / EN / ES / PL

**Ferramenta/modelo:** Codex (implementação) + Claude Code (QA)  
**Responsável pela aprovação:** Jacob  
**Status:** validado (QA aprovado, aguardando commit)

### Objetivo

Completar o passe de i18n público (PT-BR/EN/ES/PL) da agenda de eventos, do nav e dos rótulos de acessibilidade, sem deploy, commit, dependências ou mudanças em Firebase/admin/dados.

### Arquivos alterados

- `translations.js` — novas chaves nos 4 idiomas (agenda pública, meses/dias, estados vazios, modal de evento, atalhos mobile, ARIA do nav e seletor de idioma). Paridade 888/888/888/888, sem duplicatas.
- `eventos.html` — textos estáticos e dinâmicos da agenda ligados ao i18n; **fix do `currentLang()`** (passa a priorizar `document.documentElement.lang`) para o conteúdo dinâmico não ficar um idioma atrasado ao trocar de idioma.
- `index.html` — `data-lang-key-aria-label` no nav/atalhos mobile; correção de 2 `data-lang-key` duplicados; ARIA/title traduzíveis do botão de idioma.
- `js/nav-shared.js` — ARIA traduzível de menus, atalhos mobile e estado/título do seletor de idioma.

### Validações

- [x] `node --check` (nav-shared, translations, season-theme, mapa-turistico, locais-data, data/eventos) — OK
- [x] `git diff --check` — limpo
- [x] Auditorias (tourism-data / links / assets / project) — OK (reports gerados revertidos)
- [x] Navegador PT/EN/ES/PL: eventos.html (estático+dinâmico sincronizados, modal abre/re-renderiza/fecha), index.html, local.html (com id, sem id, id inválido), 390px/412px
- [ ] teste em produção/homologação

### Riscos / observações

- Overflow de 3px no `.featured-carousel-track` em 390/412px é pré-existente e independente de idioma (sem overflow de página) — follow-up opcional, não relacionado a esta tarefa.
- `aria-label`/`title` do seletor de idioma incluem emoji da bandeira + espaços (padrão já existente em `nav-shared.js`) — follow-up opcional global.
- Relatórios gerados (`docs/auditoria-dados-turisticos.md`, `docs/auditoria-output/*`) foram revertidos; não incluir no commit.

### Próximo passo

- Commit dos 4 arquivos: `translations.js`, `eventos.html`, `index.html`, `js/nav-shared.js` (mediante autorização).

---

## 2026-07-03 — Governança de uso do Claude no projeto

**Ferramenta/modelo:** ChatGPT  
**Responsável pela aprovação:** Jacob  
**Status:** planejado

### Objetivo

Adicionar arquivos de governança para melhorar o uso do Claude/Claude Code no projeto, reduzir retrabalho, evitar alterações fora de escopo e manter histórico entre conversas.

### Arquivos propostos

- `CLAUDE.md` — regras permanentes do projeto e forma de trabalho.
- `TASKS.md` — estado atual, pendências e próximos passos.
- `CHANGELOG_AI.md` — registro das alterações feitas com IA.

### Local recomendado

Raiz do repositório, no mesmo nível de arquivos como:

- `.git/`
- `package.json`, se existir
- `index.html`
- `manifest.json`
- pastas principais do projeto

Exemplo provável:

```powershell
D:\PROJETOS CODEX\SITE-TURISMO-SMS\CLAUDE.md
D:\PROJETOS CODEX\SITE-TURISMO-SMS\TASKS.md
D:\PROJETOS CODEX\SITE-TURISMO-SMS\CHANGELOG_AI.md
```

Se o projeto estiver na pasta `SITE-TURISMO-SMS-mainv2`, usar:

```powershell
D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2\CLAUDE.md
D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2\TASKS.md
D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2\CHANGELOG_AI.md
```

### Observações

- Estes arquivos não devem substituir Git.
- Devem ser usados como contexto inicial para Claude/Claude Code.
- Antes de cada tarefa, pedir ao Claude para ler `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md`.
- Não fazer commit/deploy sem autorização explícita.

---

## 2026-07-03 — Auditoria SEO/metadados versão 2.02

**Ferramenta/modelo:** Claude/Claude Code  
**Responsável pela aprovação:** Jacob  
**Status:** em revisão

### Objetivo

Revisar SEO e metadados do site sem impacto em layout/render.

### Pontos registrados

- Fallback de imagem absoluta válida quando não houver imagem local.
- Função de truncamento seguro para meta description longa.
- Preservação de acentos e caracteres especiais.
- Uso de `encodeURIComponent` em query params.
- Alterações restritas ao `<head>` e função JS isolada quando aplicável.
- Revisão de `manifest.json` quanto a nome, descrição, cores, start_url e scope.

### Pendências

- Reverter/remover `docs/auditoria-output/` se for artefato temporário.
- Encurtar descrição da home para cerca de 150–155 caracteres.
- Registrar follow-up para ícone PWA real `512x512`.
- Revisar diff antes de commit.

### Arquivos que não devem ser alterados sem autorização

- `mapa-completo.html`
- `mapa-3d.html`
- `roteiro-ia.html`

### Riscos conhecidos

- Canonical limpo depende de rewrite do servidor sem `.html`.
- PWA sem ícone real `512x512` pode degradar instalação/splash no Android, mas não quebra o site.

---

## 2026-07-03 — Otimização de performance/Lighthouse (passe inicial)

**Ferramenta/modelo:** Claude/Codex  
**Responsável pela aprovação:** Jacob  
**Status:** validado / commitado (`0e0c65a`)

- Otimização segura de carregamento de imagens da home e do mapa turístico.
- Sem regressão visual; layout aprovado preservado.

---

## 2026-07-03 — Correção de regressão de layout do carrossel em destaque

**Ferramenta/modelo:** Claude/Codex  
**Responsável pela aprovação:** Jacob  
**Status:** validado / commitado (`87b6457`)

- Estabilização do layout de imagem do carrossel de experiências em destaque.
- Correção pontual, sem redesign.

---

## 2026-07-03 — Conclusão do passe de SEO/metadados sociais

**Ferramenta/modelo:** Claude/Codex  
**Responsável pela aprovação:** Jacob  
**Status:** validado / commitado (`c34d53b`)

- `<title>`, meta description, canonical, Open Graph e Twitter/X revisados nas páginas públicas.
- `manifest.json` ajustado (nome, descrição, ícone real `192x192`, screenshot com dimensão real); entradas falsas de `512x512` removidas.
- Metadados dinâmicos de `local.html` com truncamento seguro de descrição e OG/Twitter por `?id=`.
- `SearchAction` removido da home (busca é modal, sem URL estável de resultados).
- `rotas-completas.html` mantido `noindex,follow` (página legada).
- QA aprovado; alterações restritas a `<head>`/manifest, sem impacto de layout.

---

## 2026-07-03 — Auditoria de dados turísticos públicos (S14) + remoção de duplicado

**Ferramenta/modelo:** Claude/Codex  
**Responsável pela aprovação:** Jacob  
**Status:** validado / commitado (`fe18133`)

- Auditoria das fontes públicas de dados (atrativos, gastronomia, hospedagem, rotas, mapa e fichas `local.html`).
- Removido o registro duplicado `rua-do-mathe` de `js/data/restaurantes.js`; a Rua do Mathe já existia como ponto/ficha canônica (`js/locais-data.js` + `js/data/pontos-turisticos.js`) com dados mais consistentes. O duplicado tinha telefone conflitante/placeholder.
- QA confirmou que ficha, card da home e filtro `categoria=Gastronomia` do mapa continuam funcionando; nenhum efeito colateral.
- Relatório curado commitado: `docs/bloco-s14-auditoria-dados-turisticos-publicos.md`.
- Relatórios gerados (`docs/auditoria-output/*`, `docs/auditoria-dados-turisticos.md`) mantidos fora do commit.

---

## 2026-07-03 — Atualização dos arquivos de governança

**Ferramenta/modelo:** Claude/Codex  
**Responsável pela aprovação:** Jacob  
**Status:** aplicado (sem commit até autorização)

### Objetivo

Atualizar `CLAUDE.md`, `TASKS.md` e `CHANGELOG_AI.md` para refletir os milestones concluídos e preparar a Tarefa 4.

### Arquivos alterados

- `CLAUDE.md` — nova seção "Regras específicas de escopo e conteúdo": mudanças pequenas, inspecionar antes de editar, não commitar `docs/auditoria-output/*` sem pedido, não inventar dados de negócios, admin/Firebase fora de escopo, preservar acessibilidade/VLibras/idiomas/atalhos móveis/mascote, não reintroduzir chatbox/cuia, sempre reportar.
- `TASKS.md` — SEO/metadados, performance, correção do carrossel e auditoria S14 marcados como concluídos; adicionada a Tarefa 4 (fichas individuais de locais); mantidos follow-up do ícone PWA `512x512` e admin/cadastro como tarefa final; explicitada a regra de não commitar `docs/auditoria-output/*`.
- `CHANGELOG_AI.md` — entradas concisas para performance, carrossel, SEO, S14 e esta atualização de governança.

### Observações

- Nenhum arquivo de código/HTML/CSS/JS/dados foi alterado nesta tarefa.
- Sem commit/deploy; aguardando autorização.
