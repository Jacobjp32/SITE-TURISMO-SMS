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

O tema sazonal (`js/season-theme.js` e `css/season-theme.css`) tambem usa esse contexto para exibir um badge compacto no topo das paginas publicas. Em paginas sem bloco completo de previsao, `nav-shared.js` carrega `js/weather.js` para atualizar apenas o badge contextual. A configuracao publica fica em:

- `CITY`, `CACHE_KEY` e `CACHE_TTL_MS` dentro de `js/weather.js`;
- `window.SMS_WEATHER_API_OVERRIDE`, opcional, para sobrescrever a URL em testes locais;
- fallback visual do badge em `js/season-theme.js`, sem temperatura falsa quando a API/cache nao estiverem disponiveis.

## Assets sazonais

A estrutura tecnica dos mascotes, badges, stickers e icones sazonais fica em `images/seasonal/`.

Consulte `docs/seasonal-assets.md` para nomes esperados, formatos recomendados, tamanhos e override manual por `window.SMS_SEASON_ASSETS`.

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

Checklist minimo adicional para a fase de solicitacoes de alteracao:

- `Meus empreendimentos` continua carregando;
- o botao `Solicitar alteracao` aparece para vinculo ativo;
- o modal de alteracao abre com os campos atuais preenchidos;
- o portal permite anexar ate 6 imagens de ate 5 MB cada no fluxo de alteracao;
- `Minhas solicitacoes de alteracao` mostra status, campos pedidos e retorno da equipe;
- o card `Alteracoes de empreendimentos` aparece em `Aprovacoes` no admin;
- aprovar, rejeitar e marcar `changes_requested` nao aplicam nada automaticamente no site publico.

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

Para a fila de alteracoes de empreendimento, confirme tambem:

1. o path `submissions/establishment-updates/{uid}/{requestId}/{fileName}` foi publicado nas Storage Rules reais;
2. a collection `establishment_update_requests` esta coberta pelas Firestore Rules reais;
3. um usuario sem vinculo ativo nao consegue criar solicitacao;
4. um admin/moderator consegue revisar sem alterar dados publicos automaticamente.
