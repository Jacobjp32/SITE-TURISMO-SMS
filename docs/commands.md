# Comandos operacionais

## Atualizar metadados do portal

Antes de commit/push de uma atualizacao publica do site, atualize a data exibida no rodape:

```bash
node scripts/update-site-meta.mjs
```

O comando usa apenas Node nativo e atualiza `updatedAt` em `js/site-meta.js`, preservando `version` e `environment`.

## Validacao visual/interativa local

Para rodadas de ajuste visual sem dependencias novas:

```bash
node --check js/nav-shared.js
node --check js/mapa-turistico.js
node --check js/search.js
node --check js/search-index.js
node --check js/site-stats.js
node --check js/site-meta.js
node --check translations.js
node --check config.js
node --check sw.js
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
```

Servidor local:

```bash
python -m http.server 8080 --bind 127.0.0.1
```

No Windows deste projeto, se `python` nao estiver no PATH, use o runtime local ja validado:

```powershell
C:\Users\jacob\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m http.server 8080 --bind 127.0.0.1
```
