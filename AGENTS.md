# AGENTS.md — mapa operacional do projeto

## Propósito

Este repositório mantém o site institucional de Turismo de São Mateus do Sul,
o Admin/CMS e seus contratos Firebase. O repositório é a fonte de verdade para
conhecimento técnico estável; prompts devem descrever apenas o delta da tarefa.

## Leitura progressiva

1. Leia este mapa.
2. Abra o runbook específico em `docs/agent-runbook/`.
3. Inspecione apenas o source, configuração e testes relevantes ao delta.
4. Consulte `TASKS.md` somente quando histórico ou checkpoint for necessário.

Não reconstrua em prompt uma resposta que já esteja no repositório. Não copie
todo o `TASKS.md`: ele contém histórico e estados transitórios que podem estar
superados. Source e testes atuais prevalecem sobre narrativa histórica.

## Arquitetura e referências

- Índice operacional: `docs/agent-runbook/README.md`
- Dados e arquitetura histórica: `docs/estrutura-dados.md`
- Contrato de empreendimentos: `docs/schemas/cms-establishments.schema.md`
- Plano de Rotas: `docs/plano-admin-rotas-v1.1.md`
- Comandos legados de manutenção: `docs/commands.md`
- Metadados públicos canônicos: `js/site-meta.js`

## Runbooks

- Firebase e Emulators: `docs/agent-runbook/firebase-and-emulators.md`
- Integridade Git: `docs/agent-runbook/git-integrity.md`
- Release e produção: `docs/agent-runbook/release-and-production.md`
- CMS Empreendimentos V2: `docs/agent-runbook/cms-establishments-v2.md`

## QA canônico

Para mudanças em Rules ou no contrato Admin/CMS coberto pela suíte:

```powershell
npm.cmd run test:rules
```

O comando usa o projeto demo e inicia Firestore + Storage Emulator. Não troque
por execução Storage-only quando a suíte também inicializa Firestore. Para uma
tarefa apenas documental, valide somente o que mudou; não rode a suíte completa
sem necessidade.

Guardrail operacional leve:

```powershell
node scripts/check-agent-harness.mjs --check
```

## Segurança e produção

- Não faça deploy, publicação, push, exclusão ou mutação crítica sem autorização
  explícita para aquele ato e escopo.
- Produção, Emulator e validação local são ambientes distintos. Evidência local
  não autoriza o próximo bloco.
- Firestore Rules, Storage Rules, indexes e Hosting são escopos de deploy
  independentes.
- Smoke read-only e smoke com escrita em produção exigem autorizações distintas.
- Não altere `.env`, secrets, tokens, credenciais, chaves ou dados sensíveis.
- Não use documento real como cobaia quando um draft efêmero autorizado puder
  provar o contrato.
- Em resultado remoto ambíguo, falhe fechado e não improvise retry ou rollback.

## Disciplina Git

- Preserve untracked preexistentes; os protegidos estão listados no runbook Git.
- Não use `git add .`, `git add -A` ou `git commit -a` em trabalho governado.
- Stageie somente pathspecs explícitos já auditados.
- Não force-push `main` e não use renormalização de EOL como correção incidental.
- Antes de commit/push, confirme base, branch, árvore rastreada, índice e diff.

## Mudanças

- Entenda a estrutura real antes de editar.
- Prefira alterações pequenas, incrementais, reversíveis e compatíveis.
- Preserve rotas, SEO, responsividade, i18n, acessibilidade e estrutura existente.
- Não instale dependências sem justificar e obter confirmação.
- Não invente scripts, arquivos ou comandos: verifique primeiro o projeto.
- Leia o erro antes de alterar arquivos para tentar corrigi-lo.

## Encerramento

Sempre informe: resumo, arquivos alterados, comandos executados, resultados de
validação e riscos ou pendências. Commit e PR devem ser objetivos, em português,
sem mencionar ferramenta, assistente ou modelo.
