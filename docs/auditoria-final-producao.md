# Auditoria Final de Produção

Data: 2026-04-20

## Produção Atual

- Lighthouse mobile na home: Performance 42, Acessibilidade 94, Boas Práticas 92, SEO 100.
- Lighthouse desktop na home: Performance 87, Acessibilidade 94, Boas Práticas 96, SEO 100.
- Console/rede via Chrome DevTools nas páginas principais: sem exceções JavaScript capturadas em `/`, `/galeria`, `/eventos`, `/noticias`, `/portal-usuario`, `/admin-firebase`, `/rotas-completas` e `/reservas`.
- Lighthouse acusou 404 em `/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js`.
- O chatbot real respondeu HTTP 500 porque a API Anthropic retornou saldo insuficiente.
- O Worker real ainda responde `Access-Control-Allow-Origin: *`, indicando que a versão endurecida em `cloudflare-worker/chat-worker.js` ainda não foi publicada.

## Correções Aplicadas Nesta Rodada

- Removidas tags `/cdn-cgi/.../email-decode.min.js` que geravam 404 fora do ambiente Cloudflare.
- Removidos `<meta http-equiv="X-Frame-Options">`; a política correta deve vir por cabeçalho HTTP, já presente em `_headers`.
- Hero video da home deixou de carregar o MP4 imediatamente no mobile; o vídeo é carregado sob demanda em telas maiores, mantendo poster/fallback.
- Ajustes de contraste em números, textos de eventos e rodapé.
- Skip links e landmarks da home ajustados.
- Headings decorativos em cards/testemunhos substituídos por elementos não-heading.
- Widget VLibras envolvido em landmark complementar.
- Chatbot passa a tratar resposta HTTP de erro como fallback amigável, em vez de exibir erro bruto do Worker.

## Resultado Local Após Correções

- Lighthouse mobile local na home: Performance 50, Acessibilidade 100, Boas Práticas 96, SEO 100.
- Payload mobile caiu de aproximadamente 42 MB para aproximadamente 3,8 MB.
- Lighthouse local: 0 erros de console.
- axe-core local na home: 0 violações automáticas.

## Itens Bloqueados Por Acesso Externo

- Deploy real das Firestore Rules: bloqueado porque o Firebase CLI não tem conta autenticada neste ambiente (`firebase login` necessário).
- Dry-run do Firebase também exige autenticação.
- Deploy do Worker do chatbot: depende de acesso Cloudflare e do secret `ANTHROPIC_API_KEY`.
- Erro de Cloudflare no GitHub: não há `.github/workflows` nem `wrangler.toml` no repo; a `main` não está protegida. O check vem de integração externa Cloudflare/GitHub.

## Pontos Para Revisão Humana

- Notícias e testemunhos contêm datas de 2024/2025. Isso pode ser aceitável como histórico, mas deve ser revisado editorialmente.
- Há variação de endereço/CEP entre seções: `Rua João Gabriel Martins s/n, CEP 83900-114` e `Rua Barão do Rio Branco, CEP 83900-000`. Confirmar qual deve ser a referência oficial.
- Vídeos grandes continuam existindo no repo e são incompatíveis com deploys Cloudflare que limitem assets individuais a 25 MB.
