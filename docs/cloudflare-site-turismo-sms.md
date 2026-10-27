# Portal no Worker `site-turismo-sms`

O site público continua no GitHub Pages (`CNAME` →
`turismo.saomateusdosul.pr.gov.br` → `jacobjp32.github.io`) até alguém
autorizar a troca de DNS. Este arquivo só prepara o Worker que hoje
responde texto `Hello world` em
`https://site-turismo-sms.imprensapmsms.workers.dev`.

Não há segredo neste repositório. Não colar token, account id nem
e-mail operacional em arquivo versionado.

## O que foi escolhido

O recurso que já existe na conta da prefeitura é um **Worker** com esse
nome, não um projeto Pages. O deploy certo é Workers Static Assets, sem
script de aplicação: a raiz do repositório é o site (HTML, CSS, JS,
imagens, PWA). O chat (`cloudflare-worker/chat-worker.js`) é outro
Worker, `turismo-sms-chat-proxy`, e não entra neste deploy.

`html_handling: auto-trailing-slash` repete o GitHub Pages quando existem
os dois arquivos:

| Pedido | O que responde |
| --- | --- |
| `/eventos`, `/sabores`, `/galeria`, `/noticias` | o `.html` real |
| `/eventos/`, `/sabores/`, … | o `index.html` da pasta (página ponte) |
| `/eventos.html` | redireciona 307 para `/eventos` (o mesmo HTML) |
| caminho inexistente | `404.html` com status 404 |

`/arquivo.html?consulta=1` preserva a query no 307. Não colocar o domínio
em `wrangler.jsonc`: um `wrangler deploy` com `routes` ou domínio
passaria a alterar DNS.

## Vídeos e o limite de 25 MiB

Workers Static Assets recusa arquivo maior que 25 MiB (plano Free ou
pago). Há quatro MP4 acima disso. Eles ficam no Git e no GitHub Pages, e
saem do upload pelo `.assetsignore`:

| Arquivo | Tamanho | No portal |
| --- | ---: | --- |
| `videos/VIDEO_ABERTURA_4K.mp4` | 93 MiB | galeria; no Worker sai de `videos/cf/abertura-sao-mateus.mp4` (720p, cerca de 10 MiB; o áudio original já é silêncio digital) |
| `videos/INSTITUCIONAL_POLONES.mp4` | 93 MiB | galeria; no Worker sai de `videos/cf/institucional-polones.mp4` (720p, áudio AAC 96 kbps, cerca de 20 MiB) |
| `videos/ROTA_DO_TURISMO.mp4` | 88 MiB | não referenciado pelo HTML |
| `videos/ROTA_DO_TURISMO.hero-720p.mp4` | 32 MiB | não referenciado; a hero usa `videos/ROTA_DO_TURISMO.hero-720p-opt-v1.mp4` (cerca de 19 MiB), que sobe normalmente |

O `_redirects` faz proxy interno (status 200) só no Cloudflare. O GitHub
Pages ignora `_redirects`, então a galeria em produção continua com os
originais. A URL na página não muda.

O restante do portal (páginas, imagens, PDFs de `docs/comtur`, hero,
`sw.js`) cabe no upload. São centenas de arquivos, bem abaixo do teto de
20.000 do plano Free (100.000 no pago, Wrangler 4.34+). Não há segundo
host obrigatório (R2) para o portal funcionar.

## Antes de publicar

1. Entrar no dashboard Cloudflare com a conta da prefeitura
   (imprensapmsms), não com uma conta pessoal.
2. Abrir **Workers e Pages** → Worker `site-turismo-sms`.
3. Confirmar que **Domínios e rotas** está vazio. Não adicionar
   `turismo.saomateusdosul.pr.gov.br` neste passo.
4. Ter Node 18 ou mais novo. Na raiz do repositório, no commit que já
   contém `wrangler.jsonc`:

```bash
npx wrangler@4.153.0 login
npx wrangler@4.153.0 whoami
```

`whoami` precisa mostrar a conta da prefeitura. Se aparecer mais de uma
conta, copiar o account id do URL do dashboard
(`https://dash.cloudflare.com/<ACCOUNT_ID>/workers/...`) e exportar só
neste terminal:

```bash
export CLOUDFLARE_ACCOUNT_ID="<ACCOUNT_ID>"
```

Não gravar esse valor no repositório. Não criar token dentro do Git.

## Deploy manual (substitui o Hello World)

Na raiz:

```bash
npm run cf:dry-run
npm run cf:deploy
```

Os scripts chamam `npx wrangler@4.153.0`. O nome em `wrangler.jsonc` é
`site-turismo-sms`: o deploy atualiza esse Worker. Deploy feito logado
na conta errada cria outro Worker, em outra conta, e não mexe no Hello
World da prefeitura.

Conferir, ainda sem mexer no DNS:

```bash
curl -sI https://site-turismo-sms.imprensapmsms.workers.dev/ | head
curl -s https://site-turismo-sms.imprensapmsms.workers.dev/ | head -c 400
curl -sI https://site-turismo-sms.imprensapmsms.workers.dev/eventos
curl -sI https://site-turismo-sms.imprensapmsms.workers.dev/eventos/
curl -sI https://site-turismo-sms.imprensapmsms.workers.dev/videos/INSTITUCIONAL_POLONES.mp4
curl -sI https://site-turismo-sms.imprensapmsms.workers.dev/videos/ROTA_DO_TURISMO.hero-720p-opt-v1.mp4
curl -sI https://site-turismo-sms.imprensapmsms.workers.dev/caminho-que-nao-existe
```

Esperado: HTML do portal (não o texto `Hello world`); `/eventos` em 200;
`/eventos/` em 200 com a página ponte; o institucional com
`content-type: video/mp4` e tamanho perto de 20 MiB (não 93 MiB); a hero
em 200; caminho inexistente em 404.

Smoke visual no `workers.dev`: home, mapa, galeria (os dois vídeos locais
e um YouTube), uma notícia `noticia.html?slug=…` se a listagem oferecer
link, VLibras e o seletor de idioma. O `_headers` passa a valer neste
host (o GitHub Pages o ignora): `X-Frame-Options`, HSTS e nosniff em
todas as respostas. A CSP longa desse arquivo só casa com `/*.html`; as
URLs sem extensão seguem a CSP da meta tag da página.

## Builds a partir do Git (opcional)

Só depois que este `wrangler.jsonc` estiver na branch que o Cloudflare
vai construir. Sem esse arquivo, o build não tem o que publicar e o
Hello World permanece.

1. **Workers e Pages** → `site-turismo-sms` → **Configurações** →
   **Builds** → **Conectar**.
2. Repositório deste projeto, branch de produção `main`, diretório raiz
   `/`.
3. Comando de build: vazio (não há build de front).
4. Comando de deploy: `npx wrangler@4.153.0 deploy`.
5. O nome do Worker no dashboard tem de ser idêntico ao `name` do
   `wrangler.jsonc`, senão o build falha de propósito.
6. Deixar o token de API que a própria Cloudflare cria para o build. Não
   copiar token para o repositório.

O chat-worker não é o comando de deploy deste projeto.

## DNS — só quando for autorizado

Fora deste passo. Quando a prefeitura quiser tirar o domínio do GitHub
Pages:

1. No Worker `site-turismo-sms` → **Configurações** → **Domínios e
   rotas** → adicionar o domínio customizado
   `turismo.saomateusdosul.pr.gov.br`.
2. A zona `saomateusdosul.pr.gov.br` já usa nameservers Cloudflare; o
   domínio customizado do Worker cria o registro nessa zona e substitui
   o CNAME que aponta para `jacobjp32.github.io`.
3. Esperar o `workers.dev` estar servindo o portal antes dessa troca.
4. Só remover o domínio customizado do GitHub Pages depois que
   `https://turismo.saomateusdosul.pr.gov.br/` responder pelo Cloudflare
   (cabeçalho `server: cloudflare`, HTML do portal).
5. Não apagar o repositório Pages no mesmo dia: ele ainda é o rollback.

Preview local, sem conta:

```bash
npm run cf:dev
```

Abre o portal em `http://localhost:8787`. Não publica nada.
