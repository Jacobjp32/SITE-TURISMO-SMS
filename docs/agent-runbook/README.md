# Runbooks para agentes

## Propósito

Este diretório concentra conhecimento operacional estável e verificável. Use-o
por divulgação progressiva: abra somente o documento ligado ao delta atual e,
depois, o source e os testes indicados por ele.

## Índice

| Tema | Runbook | Prova principal |
| --- | --- | --- |
| Firebase, Rules e Emulators | `firebase-and-emulators.md` | `package.json`, `firebase.json`, testes de Rules |
| Git, EOL e paths protegidos | `git-integrity.md` | objetos Git e árvore rastreada |
| GitHub Pages e produção | `release-and-production.md` | configuração de Pages, `CNAME`, `js/site-meta.js` |
| Save Contract C1 V2 | `cms-establishments-v2.md` | Admin, Rules e testes canônicos |

Execute o guardrail estrutural com:

```powershell
node scripts/check-agent-harness.mjs --check
```

Ele não substitui testes funcionais nem autorização de produção.

## Contrato para prompts futuros

Um prompt deve informar principalmente:

- objetivo e delta esperado;
- escopo e arquivos/áreas autorizados;
- atos explicitamente autorizados;
- hard gates específicos;
- critério de sucesso;
- checkpoint humano, quando necessário.

Não repita a arquitetura inteira, a saga histórica, todos os comandos conhecidos
ou centenas de linhas de regras já versionadas. O agente deve seguir:

```text
AGENTS.md -> runbook específico -> source/configuração/testes relevantes
```

## STOP CONDITIONS

- A base exigida diverge do Git atual.
- O escopo depende de credencial, dado ou autorização não fornecida.
- O runbook contradiz source/configuração/testes atuais: reporte o drift; não o
  esconda nem atualize fatos por suposição.
- A próxima ação seria deploy, push, escrita remota ou exclusão não autorizada.
