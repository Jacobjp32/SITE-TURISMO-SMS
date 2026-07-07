# Bloco CMS-2F - Seed real controlado de empreendimentos

**Data/hora local do registro:** 2026-07-07 15:22:38 -03:00  
**Projeto:** SITE-TURISMO-SMS-mainv2  
**Collection alvo:** `cms_establishments`  
**Resultado:** seed real controlado concluido manualmente com sucesso.

## 1. Escopo

Este bloco registra o primeiro seed real controlado dos dados normalizados para a collection `cms_establishments`.

O objetivo foi criar apenas os documentos ausentes detectados pelo live-diff, mantendo o catalogo como dado interno do CMS/Admin.

Fora do escopo, preservado neste bloco:

- nao ligar o site publico ao Firestore;
- nao remover dados estaticos;
- nao aplicar solicitacoes aprovadas;
- nao publicar empreendimentos no site;
- nao deletar documentos do Firestore;
- nao alterar rules;
- nao alterar `sitemap.xml`, `js/site-meta.js`, `config.js` ou `sw.js`.

## 2. Pre-check

Comando de verificacao executado nesta finalizacao:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
git status --short --branch
```

Resultado:

- branch local: `main...origin/main`;
- nenhum arquivo modificado listado antes da criacao deste documento;
- o Git exibiu apenas aviso de permissao ao acessar `C:\Users\jacob/.config/git/ignore`.

## 3. Comandos do seed

Comandos registrados sem token, sem UID real e sem segredos:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node scripts/cms-establishments-seed.mjs --dry-run
```

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
$env:FIRESTORE_REST_TOKEN="***"
node scripts/cms-establishments-seed.mjs --live-diff
Remove-Item Env:\FIRESTORE_REST_TOKEN
```

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
$env:FIRESTORE_REST_TOKEN="***"
$env:CMS_SEED_ACTOR_UID="***"
node scripts/cms-establishments-seed.mjs --apply --confirm-cms-establishments-seed
Remove-Item Env:\FIRESTORE_REST_TOKEN
Remove-Item Env:\CMS_SEED_ACTOR_UID
```

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
$env:FIRESTORE_REST_TOKEN="***"
node scripts/cms-establishments-seed.mjs --live-diff
Remove-Item Env:\FIRESTORE_REST_TOKEN
```

Nesta finalizacao documental nao foram executados seed, live-diff remoto nem apply.

## 4. Resultado do seed

Resultado informado apos execucao manual controlada:

| Metrica | Total |
| --- | ---: |
| Docs normalizados | 67 |
| Docs criados em `cms_establishments` | 67 |
| Docs atualizados | 0 |
| Docs deletados | 0 |
| Docs publicados | 0 |
| Solicitacoes aprovadas aplicadas | 0 |

Interpretacao:

- os 67 empreendimentos normalizados foram criados como documentos internos em `cms_establishments`;
- o seed nao removeu dados estaticos;
- o seed nao publicou registros no site publico;
- o seed nao aplicou solicitacoes de `establishment_update_requests`;
- documentos criados permanecem como catalogo interno/admin.

## 5. Live-diff pos-apply

Resultado do live-diff pos-apply informado:

| Metrica | Total |
| --- | ---: |
| Docs normalizados | 67 |
| Docs live lidos | 67 |
| Would create | 0 |
| Would update seguro | 0 |
| Existentes com revisao/protecao | 67 |
| Docs live fora do seed | 0 |

Interpretacao:

- nao ha documentos faltando em `cms_establishments`;
- nao ha atualizacoes seguras pendentes;
- nao ha docs live fora do seed;
- o total live final da collection bate com os 67 documentos normalizados;
- `wouldCreate` final caiu para 0, confirmando que os documentos ausentes foram criados.

## 6. Sobre "Existentes com revisao/protecao: 67"

O contador `Existentes com revisao/protecao: 67` e esperado no live-diff pos-apply.

Depois que os documentos existem no Firestore, o script compara o payload normalizado local com os documentos live. Como os documentos live possuem campos de auditoria e timestamps reais gravados no apply, e como o script protege campos editoriais/status/publicacao contra sobrescrita automatica, os 67 documentos aparecem como existentes preservados para revisao/protecao.

Isso nao indica falha do seed. A leitura correta neste contexto e:

- todos os 67 docs existem;
- nenhum doc precisa ser criado;
- nenhum update seguro esta pendente;
- campos editoriais protegidos continuam preservados;
- qualquer mudanca editorial futura deve passar pelo Admin ou por bloco especifico de aplicacao/revisao.

## 7. Confirmacoes de escopo

Confirmado:

- o site publico nao foi ligado ao Firestore;
- o site publico continua usando os dados estaticos existentes;
- `js/locais-data.js`, `js/data/*.js`, `js/rotas-data.js` e demais fontes estaticas foram preservados;
- solicitacoes aprovadas nao foram aplicadas ao catalogo interno;
- nao houve publicacao automatica de empreendimentos;
- nao houve exclusao de documentos;
- nao houve alteracao de `firestore.rules`;
- nao houve alteracao de `storage.rules`;
- nao houve alteracao de `sitemap.xml`;
- nao houve alteracao de `js/site-meta.js`;
- nao houve alteracao de `config.js`;
- nao houve alteracao de `sw.js`.

## 8. Riscos e atencoes

- Os 67 documentos agora existem no CMS interno, mas ainda precisam de curadoria editorial antes de qualquer publicacao publica futura.
- Duplicidades e campos ausentes detectados nos blocos anteriores continuam sendo pauta de revisao, nao de publicacao automatica.
- O site publico deve permanecer estatico ate um bloco especifico de leitura publica com fallback e QA.
- Solicitacoes aprovadas devem ser aplicadas em fluxo separado, com diff por campo e auditoria.
- Tokens e UIDs usados no seed nao devem ser salvos em arquivo nem impressos em relatorios.

## 9. Rollback operacional

Nao ha rollback automatico recomendado.

Se algum documento criado pelo seed precisar ser removido do fluxo interno, a recomendacao operacional e:

1. revisar o documento no Admin;
2. arquivar individualmente quando fizer sentido;
3. evitar exclusao em massa;
4. manter rastreabilidade por `source.origin`, `source.seededAt`, `createdAt` e `createdBy`;
5. preservar dados estaticos como fonte publica ate a migracao publica ser aprovada.

## 10. Proximos passos

Proximo bloco recomendado: **CMS-3 - aplicar solicitacoes aprovadas ao catalogo interno `cms_establishments`**, ainda sem ligar o site publico ao Firestore.

Escopo sugerido para CMS-3:

- listar solicitacoes aprovadas ainda nao aplicadas;
- comparar `currentSnapshot`, `requestedChanges` e documento atual em `cms_establishments`;
- permitir aplicacao campo a campo pelo Admin;
- registrar `review.lastAppliedRequestId`, `review.lastAppliedAt`, `review.lastAppliedBy` e notas;
- manter documentos como `draft` quando aplicavel;
- nao publicar automaticamente;
- nao alterar o site publico.
