# Release e produção

## Propósito

Separar versionamento, publicação do site, deploy de Rules e provas de produção.
Nenhum comando deste documento concede autorização para executá-lo.

## Topologia estável

- O site público é hospedado pelo GitHub Pages.
- A fonte do Pages é a branch `main`, path `/`.
- O domínio customizado versionado em `CNAME` é
  `turismo.saomateusdosul.pr.gov.br`.
- Firestore Rules têm deploy separado do site público.
- A fonte canônica de versão e atualização pública é `js/site-meta.js`.
- A versão pública corrente é `Turismo SMS 2.0`.

Não grave data/hora atual em runbook. Quando um release autorizado exigir
metadata nova, atualize a fonte canônica existente e valide os consumidores.

## Ordem e escopo

Quando código novo depende de Rules novas, prefira Rules-first, sempre dentro de
blocos e autorizações separados. Use write freeze somente quando o risco concreto
o exigir e o contrato definir início, fim e recuperação.

Trate como operações distintas:

- push de branch;
- integração/push de `main` e publicação GitHub Pages;
- deploy de Firestore Rules;
- deploy de Storage Rules, indexes ou Hosting;
- smoke read-only em produção;
- smoke com escrita em produção.

## Leituras durante smoke público

Um smoke visual/funcional real executa o runtime normal da página. Se esse
runtime consulta Firestore ou carrega objetos do Storage, essas leituras são
esperadas e não equivalem a uma consulta operacional iniciada pelo agente.

Relate separadamente:

- `FirestoreOperationalReadsByAgent`: consultas administrativas ou diretas por
  gcloud, Firebase/Admin SDK, REST Firestore, script de diagnóstico, service
  account, console/API administrativa ou ferramenta equivalente;
- `FirestoreRuntimeReadsDuringPublicSmoke`: `EXPECTED` quando o runtime público
  consultado usa Firestore;
- `FirestoreWrites`: escritas realizadas durante o bloco;
- `StorageOperationalReadsByAgent`: leituras diretas ou administrativas de
  Storage iniciadas pelo agente;
- `StorageRuntimeReadsDuringPublicSmoke`: `EXPECTED` quando assets ou o runtime
  público usam Storage;
- `StorageWrites`: escritas realizadas durante o bloco.

Em bloco documental ou de release com browser smoke, o gate de leitura deve ser
`FirestoreOperationalReadsByAgent=0` e, quando pertinente,
`StorageOperationalReadsByAgent=0`. Não exija contagem exata de leituras do
runtime quando o objetivo não for auditoria de billing. As escritas continuam
gate absoluto: quando mutações forem proibidas, `FirestoreWrites=0` e
`StorageWrites=0`.

Uma leitura esperada do runtime não converte automaticamente um release
bem-sucedido em falha. Registre-a como runtime read e mantenha separada da
atividade operacional do agente.

## Evidência de Security Rules

Use o Firebase Web SDK quando o objetivo for provar as Security Rules reais do
cliente. Server/Admin SDK autorizado por IAM contorna essas Rules e não é prova
equivalente. Não transforme documento real existente em cobaia quando um draft
efêmero, explicitamente autorizado e removível puder comprovar o contrato.

## Falha e rollback

- Não execute rollback automático em situação ambígua.
- Nunca force-push `main` como mecanismo de rollback.
- Preserve evidência, classifique o estado e exija decisão humana quando não for
  possível provar o efeito remoto.
- Uma prova local ou de Emulator não autoriza release, deploy ou smoke remoto.

## Checklist mínimo de release autorizado

1. Revalidar base, branch, upstream, diff e autorizações atuais.
2. Executar somente os gates ligados aos arquivos alterados.
3. Auditar paths e stagear explicitamente.
4. Atualizar `js/site-meta.js` somente se o release exigir.
5. Publicar apenas o escopo autorizado.
6. Verificar alinhamento remoto e smoke correspondente à autorização.

## STOP CONDITIONS

- Qualquer SHA/base fixada diverge após fetch.
- Falta autorização literal para push, deploy, escrita ou smoke remoto.
- O artefato validado mudou antes da publicação.
- Resultado remoto é ambíguo ou o rollback exigiria force-push.
- O teste proposto usa Admin SDK para alegar prova de Security Rules.
- O agente iniciou consulta administrativa/direta fora do escopo autorizado.
- O smoke produziu escrita inesperada ou qualquer mutação Firebase não
  autorizada.
