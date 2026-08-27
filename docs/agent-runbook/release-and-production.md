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
