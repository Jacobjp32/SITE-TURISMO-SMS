# Auditoria de limpeza segura do projeto

Data: 2026-06-08 15:57:27 -03:00

## Escopo

Limpeza segura da raiz do projeto, restrita a artefatos locais temporarios de Chrome/Playwright/Codex e logs. Nao houve alteracao em rotas publicas, assets, HTML, CSS, JS de producao, dados, login, admin, portal, CMS, Firestore Rules ou Storage Rules.

## Estado inicial do Git

Comando inicial:

```powershell
git status --short
```

Resultado: worktree sem arquivos pendentes. O Git exibiu apenas o aviso local `unable to access 'C:\Users\jacob/.config/git/ignore': Permission denied`, sem indicar alteracoes no repositorio.

Comandos complementares executados:

```powershell
git status --ignored --short
git ls-files
git ls-files --others --exclude-standard
```

Itens ignorados vistos no inicio:

- `.codex/`
- `EMPREENDIMENTOS/`
- `SECURITY_AUDIT_REPORT.md`
- `SECURITY_REMEDIATION_PLAN.md`
- `debug.log`

`git ls-files --others --exclude-standard` nao listou arquivos nao rastreados fora dos ignorados.

## Inventario dos itens investigados

| Item | Existe no inicio | Rastreado no Git | Tamanho aproximado | Referencias em scripts/projeto | Classificacao | Acao |
| --- | --- | --- | --- | --- | --- | --- |
| `.codex/` | Sim | Nao | 892 B | Ignorado pelos scripts de auditoria; contem `environments/environment.toml` | Local, manter por cautela | Mantido |
| `.codex-chrome-csp-profile` | Sim | Nao | 0 B | Nenhuma referencia funcional encontrada | Temporario seguro para remocao | Removido |
| `.codex-chrome-csp-profile2` | Sim | Nao | 0 B | Nenhuma referencia funcional encontrada | Temporario seguro para remocao | Removido |
| `.codex-chrome-csp-profile3` | Sim | Nao | 0 B | Nenhuma referencia funcional encontrada | Temporario seguro para remocao | Removido |
| `.codex-chrome-csp-profile4` | Sim | Nao | 0 B | Nenhuma referencia funcional encontrada | Temporario seguro para remocao | Removido |
| `.codex-chrome-csp-profile5` | Sim | Nao | 0 B | Nenhuma referencia funcional encontrada | Temporario seguro para remocao | Removido |
| `.codex-chrome-dump-profile` | Sim | Nao | 0 B | Nenhuma referencia funcional encontrada | Temporario seguro para remocao | Removido |
| `.tmp-chrome/` | Sim | Nao | 0 B | Nenhuma referencia funcional encontrada | Temporario seguro para remocao | Removido |
| `tmp-screens/` | Sim | Nao | 0 B | Apenas `.gitignore` | Temporario seguro para remocao | Removido |
| `debug.log` | Sim | Nao | 1.550 B | Apenas padrao `*.log` no `.gitignore`; conteudo era log de GPU/Chrome | Temporario seguro para remocao | Removido |

## Itens removidos

- `.codex-chrome-csp-profile`
- `.codex-chrome-csp-profile2`
- `.codex-chrome-csp-profile3`
- `.codex-chrome-csp-profile4`
- `.codex-chrome-csp-profile5`
- `.codex-chrome-dump-profile`
- `.tmp-chrome/`
- `tmp-screens/`
- `debug.log`

Antes da remocao, os caminhos resolvidos foram validados para garantir que estavam dentro de `D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2`.

## Itens mantidos por cautela

- `.codex/`: mantida porque contem `environments/environment.toml`, que aparenta ser configuracao local util do projeto. A pasta ja estava ignorada no `.gitignore`.
- `EMPREENDIMENTOS/`: ignorada, mas fora do escopo da limpeza segura e explicitamente protegida.
- `SECURITY_AUDIT_REPORT.md` e `SECURITY_REMEDIATION_PLAN.md`: ignorados, mas explicitamente protegidos.

## Alteracoes no `.gitignore`

Entradas adicionadas:

```gitignore
.codex-chrome-*/
.codex-chrome-dump-profile/
.tmp-chrome/
```

Entradas relevantes que ja existiam e foram mantidas:

```gitignore
.codex/
*.log
*.tmp
tmp-screens/
```

## Tamanho aproximado liberado

Conteudo de arquivos removido: aproximadamente 1.550 bytes. Os diretorios removidos estavam vazios, entao a liberacao adicional e apenas metadado de filesystem.

## Riscos

- Baixo risco: os itens removidos eram locais, nao rastreados, temporarios e sem referencia funcional encontrada.
- `.codex/` nao foi removida para evitar perda de configuracao local.
- O aviso de permissao no ignore global do Git e externo ao repositorio e nao foi corrigido nesta rodada.

## Proximos passos sugeridos

- Se o aviso `C:\Users\jacob/.config/git/ignore` incomodar, revisar permissao desse arquivo fora do repositorio.
- Revisar manualmente `.codex/` apenas se houver decisao futura de padronizar configuracoes locais fora do projeto.

## Validacoes

Validacoes executadas apos a limpeza:

```powershell
git status --short
git status --ignored --short
git ls-files --others --exclude-standard
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
```

Resultados:

- `git status --short`: mostra apenas alteracoes esperadas da rodada (`.gitignore`, este relatorio e relatorios gerados em `docs/auditoria-output/`).
- `git status --ignored --short`: `debug.log`, `.codex-chrome-*`, `.codex-chrome-dump-profile`, `.tmp-chrome/` e `tmp-screens/` nao aparecem mais; permanecem ignorados `.codex/`, `EMPREENDIMENTOS/`, `SECURITY_AUDIT_REPORT.md` e `SECURITY_REMEDIATION_PLAN.md`.
- `git ls-files --others --exclude-standard`: lista apenas `docs/auditoria-limpeza-projeto.md`, por ser relatorio novo ainda nao rastreado.
- `node scripts/audit-links.mjs`: `639 links, 0 broken, 16 legacy/redundant candidates`.
- `node scripts/audit-assets.mjs`: `225 media, 0 duplicate groups, 0 missing references`.
- `node scripts/audit-project.mjs`: `377 files, 36 html, 22 css, 37 js`.

Os scripts de auditoria atualizaram os arquivos rastreados em `docs/auditoria-output/` com novo timestamp e metricas atuais.
