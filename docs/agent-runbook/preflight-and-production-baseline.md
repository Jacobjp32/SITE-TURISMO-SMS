# Preflight obrigatório antes de desenvolver

## Objetivo

Identificar a base real e preservar trabalhos em andamento antes de editar código.
Um `git status` limpo não prova que o checkout está sincronizado ou publicado.

## Sequência obrigatória

1. Identifique o repositório, o diretório efetivo, `HEAD`, branch, upstream,
   árvore de trabalho e índice. Leia `AGENTS.md` e o runbook do escopo.
2. Inventarie worktrees e branches sem mudar seus arquivos. Registre alterações
   rastreadas e nomes dos untracked; não explore paths protegidos ou secrets.
3. Consulte a ponta remota com `git ls-remote origin refs/heads/main`. Compare-a
   com `origin/main` e `HEAD`. Não trate um remote-tracking ref como leitura ao vivo.
   Se faltarem objetos, um fetch explícito e não destrutivo pode obtê-los;
   não use pull, reset ou rebase para resolver divergência por conveniência.
4. Demonstre a ancestralidade com `git merge-base` e
   `git rev-list --left-right --count HEAD...<base-confirmada>`.
   Registre commits exclusivos de cada lado e branches paralelas relevantes.
5. Identifique a versão publicada pelo provedor real. Para GitHub Pages, confira
   origem configurada, último build bem-sucedido e deployment/status. Dentro de
   uma auditoria pública autorizada, compare os arquivos servidos do escopo com
   os blobs do commit. Diferencie igualdade de bytes de igualdade após LF/CRLF.
6. Congele um ponto de recuperação: SHA da base, status, diff binário dos arquivos
   rastreados alterados e hashes dos arquivos autorizados relevantes. Preserve
   untracked no local; uma cópia não deve incluir secrets ou paths protegidos.
7. Só então selecione o checkout de implementação. Se o diretório original estiver
   atrasado, divergente, sujo ou ocupado por outra frente, use um worktree isolado
   baseado na versão confirmada, preservando o original e trabalhos paralelos.
8. Transfira somente o delta da tarefa, com merge de três vias quando necessário.
   Resolva conflitos conservando funcionalidades posteriores. Não substitua um
   arquivo inteiro por uma versão antiga para eliminar conflitos.
9. Revise o diff contra a base confirmada, inclusive arquivos excluídos, imports,
   tokens de cache, lockfiles e alterações de segurança. Não incorpore branches
   paralelas ou documentação histórica sem relação com a tarefa.
10. Execute os gates aplicáveis na base final reconciliada. Evidência anterior em
    outra base é intermediária. Repita checks afetados por alterações posteriores.

## Comandos de inspeção

Na raiz do checkout, em PowerShell:

```powershell
git status --short
git diff --cached --name-status
git rev-parse HEAD origin/main
git ls-remote origin refs/heads/main
git worktree list --porcelain
git rev-list --left-right --count HEAD...origin/main
git merge-base HEAD origin/main
```

Para o painel deste repositório, a auditoria estática pública pode ser repetida com:

```powershell
node scripts/verify-admin-production-baseline.mjs
```

Esse script só lê Git, GitHub Pages e HTML/JS/CSS públicos diretamente referenciados.
Ele não consulta Firebase operacionalmente, não atualiza refs e não faz escrita
remota. O relatório gerado é evidência temporária, não uma versão fixa do runbook.

## Limites da evidência

- O SHA do Pages não comprova a versão de Rules, Functions, indexes ou dados.
- Testes de Emulator e navegador local não homologam documentos reais.
- Autorização para desenvolver não autoriza commit, push, deploy ou publicação.
- Se a versão remota mudar durante o trabalho, reavalie o delta antes de integrar.
- Uma divergência não justifica interromper investigação independente; bloqueie
  apenas edição ou publicação cuja base/autorização não seja comprovável.

## Encerramento

Informe base, relação local/remoto/produção, worktree usado, conflitos conciliados,
preservação dos trabalhos anteriores, comandos e resultados de testes. Declare o
alcance da cobertura: ausência de regressão nos testes não prova todos os usos
possíveis de produção. Mantenha publicação condicionada à autorização específica.
