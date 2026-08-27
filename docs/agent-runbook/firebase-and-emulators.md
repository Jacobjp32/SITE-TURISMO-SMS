# Firebase e Emulators

## Propósito

Definir o harness canônico e impedir que falhas ambientais ou escopos Firebase
distintos sejam confundidos com aprovação funcional ou autorização de produção.

## Invariantes

- Use a Firebase CLI local do projeto quando disponível. Scripts npm resolvem
  `node_modules/.bin/firebase` local antes de uma CLI global.
- O projeto real configurado em `.firebaserc` é `turismo-sms`; testes usam
  explicitamente o projeto demo `demo-turismo-sms-rules-test`.
- O harness canônico é `npm.cmd run test:rules`.
- O harness atual depende de Firestore + Storage Emulator porque a suíte inclui
  ambos os serviços. Não repita em modo Storage-only se ela inicializa Firestore.
- Firestore Rules, Storage Rules, indexes e Hosting são escopos independentes.
- Um DENY esperado não é PASS se a causa real for `maximum of 1000 expressions`.
  O limite de expressões é hard failure, não evidência de autorização correta.

## Configuração isolada no Windows

Se a CLI falhar ao acessar preferências globais, use um diretório temporário
externo ao repositório e defina `XDG_CONFIG_HOME` somente no processo da execução.
Não altere a configuração global para fazer o teste passar. Preserve o comando e
leia o erro antes de decidir se uma repetição é justificável.

Exemplo de forma process-local (o diretório deve ser novo e temporário):

```powershell
$env:XDG_CONFIG_HOME = $caminhoTemporarioAutorizado
npm.cmd run test:rules
Remove-Item Env:XDG_CONFIG_HOME
```

Não persista tokens, credenciais ou conteúdo de configuração temporária no repo.

## Comandos canônicos

Harness local completo:

```powershell
npm.cmd run test:rules
```

Deploy de Firestore Rules, somente quando um bloco o autorizar literalmente:

```powershell
firebase deploy --only firestore:rules --project turismo-sms
```

Quando o contrato exigir Rules-only, não substitua por `firebase deploy` nem por
`--only firestore`. A forma acima não autoriza sua própria execução.

## Prova executável

- Orquestração: `package.json`
- Mapeamento dos serviços: `firebase.json`
- Firestore: `firestore.rules`, `tests/firestore.rules.test.mjs` e
  `tests/firestore.rotas.rules.test.mjs`
- Storage: `storage.rules` e `tests/storage.rules.test.mjs`

## STOP CONDITIONS

- Projeto não demo durante teste local.
- Serviço exigido pela suíte ausente do comando de Emulator.
- DENY explicado pelo limite de 1.000 expressões.
- Pedido de deploy sem autorização específica, escopo literal ou preflight.
- Tentativa de alterar config global, credencial ou Rules para contornar falha
  ambiental.
