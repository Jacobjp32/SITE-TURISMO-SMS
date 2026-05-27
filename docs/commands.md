# Comandos operacionais

## Preparar atualizacao publica

Antes de commitar uma atualizacao publica do site, rode:

```bash
node scripts/prepare-update.mjs
```

O comando usa apenas Node nativo, roda `scripts/update-site-meta.mjs`, atualiza `updatedAt` em `js/site-meta.js` e executa checks basicos de sintaxe nos scripts operacionais. Depois revise o diff e siga com:

```bash
git add ...
git commit -m "tipo: descricao breve"
git push
```

Opcionalmente, quem quiser automatizar localmente pode criar um hook `pre-commit` chamando `node scripts/prepare-update.mjs`. Nao ha hook instalado automaticamente neste repositorio.

O comando direto abaixo continua disponivel para atualizar somente a data do portal:

```bash
node scripts/update-site-meta.mjs
```

## Previsao do tempo

A HOME carrega `js/weather.js`, que consulta a API publica sem chave da Open-Meteo para Sao Mateus do Sul:

```text
https://api.open-meteo.com/v1/forecast
```

O script usa coordenadas centralizadas em `js/weather.js`, cache local em `localStorage` por 1 hora e fallback honesto. Se a API falhar, usa cache antigo quando existir; se nao houver cache, mostra dados indisponiveis sem inventar temperatura.

## Validacao visual/interativa local

Para rodadas de ajuste visual sem dependencias novas:

```bash
node --check js/establishment-catalog.js
node --check js/firebase-auth.js
node --check js/firebase-app-check.js
node --check js/cms.js
node --check js/nav-shared.js
node --check js/mapa-turistico.js
node --check js/search.js
node --check js/search-index.js
node --check js/security-utils.js
node --check js/site-stats.js
node --check js/site-meta.js
node --check js/weather.js
node --check scripts/update-site-meta.mjs
node --check scripts/prepare-update.mjs
node --check translations.js
node --check config.js
node --check sw.js
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
```

Para fluxos do portal/admin com vinculo de empreendimento, vale validar tambem:

```bash
python -m http.server 8080 --bind 127.0.0.1
```

E abrir:

- `http://127.0.0.1:8080/portal-usuario.html`
- `http://127.0.0.1:8080/admin-firebase.html`

Checklist minimo para a fase de eventos vinculados:

- cadastro comum de evento continua abrindo e enviando;
- `Meus empreendimentos` continua carregando;
- o botao `Cadastrar evento vinculado` aparece para manager ativo;
- o modal de evento mostra o aviso do empreendimento vinculado;
- o admin continua listando eventos pendentes e identifica quando o `source` e `establishment_manager`.

Checklist minimo adicional para a fase de gestao de vinculos:

- o menu `Gerenciar Vínculos` aparece no admin;
- a lista de `establishment_managers` carrega ou falha com erro amigavel;
- o botao `Adicionar vínculo` abre modal com usuarios e empreendimentos;
- `Gerenciar Usuários` mostra o aviso de que permissao global nao e vinculo de empreendimento;
- editar, desativar e reativar um vinculo nao quebram o portal nem os eventos vinculados.

Servidor local:

```bash
python -m http.server 8080 --bind 127.0.0.1
```

No Windows deste projeto, se `python` nao estiver no PATH, use o runtime local ja validado:

```powershell
C:\Users\jacob\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m http.server 8080 --bind 127.0.0.1
```

## Firebase Storage

O arquivo versionado `storage.rules` e apenas rascunho local. Antes de usar upload de imagens em ambiente real:

1. revise o arquivo `storage.rules`;
2. publique as rules no Firebase Console ou pela CLI oficial do projeto;
3. teste upload com usuario comum e aprovacao com conta administrativa.
