# Comandos operacionais

## Atualizar metadados do portal

Antes de commit/push de uma atualizacao publica do site, atualize a data exibida no rodape:

```bash
node scripts/update-site-meta.mjs
```

O comando usa apenas Node nativo e atualiza `updatedAt` em `js/site-meta.js`, preservando `version` e `environment`.
