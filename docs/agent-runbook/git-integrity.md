# Integridade Git

## Propósito

Preservar autoria e integridade versionada em Windows sem confundir bytes CRLF do
checkout com o objeto LF armazenado pelo Git.

## Antes e depois de versionar

Antes do commit, hashes do working tree podem congelar um candidato local. Depois
do commit, a autoridade canônica é o conjunto:

- commit SHA;
- identidade do blob Git por path;
- árvore rastreada limpa.

Comandos úteis para um path explicitamente autorizado:

```powershell
git rev-parse HEAD:<path>
git hash-object --path=<path> <path>
git diff --quiet HEAD -- <path>
```

`git rev-parse HEAD:<path>` identifica o blob versionado. `git hash-object
--path=<path> <path>` aplica os filtros Git do path ao checkout. O diff confirma
se o conteúdo lógico rastreado diverge do commit.

## EOL no Windows

LF/CRLF pode mudar no checkout sem alterar o source versionado. Não use SHA-256
raw do arquivo CRLF como hard gate contra um blob Git LF. Não tente corrigir uma
divergência aparente com renormalização automática e não altere `.gitattributes`,
`core.autocrlf` ou `core.eol` sem autorização específica.

## Staging de alto risco

Não use:

```text
git add .
git add -A
git commit -a
```

Audite o diff e use `git add -- <path1> <path2>` somente com paths nomeados. Antes
do commit, execute `git diff --name-status`, `git diff --stat`, `git diff --check`
e leia integralmente o diff. Depois do staging, confirme também o diff cached.

## Untracked protegidos

Estes paths preexistentes são protegidos enquanto continuarem presentes:

- `.claude/settings.local.json`
- `IMAGENS_MES_POLONES_2026_WEB.zip`
- `images/mascotes/mascotes.zip`

`git status` pode observar seus nomes. Não abrir, ler, explorar, modificar,
remover, limpar ou stagear sem autorização explícita. Não use `git clean` como
atalho de higiene. Se a forma exibida pelo Git mudar, documente apenas a forma
nominal observada, sem explorar conteúdo.

## STOP CONDITIONS

- HEAD/base, branch ou upstream diverge do contrato aprovado.
- Árvore rastreada ou índice contém mudança não autorizada.
- Um path protegido entrou no diff ou staging.
- A operação exigiria reset, clean, rebase, force-push ou mudança de EOL não
  autorizada.
