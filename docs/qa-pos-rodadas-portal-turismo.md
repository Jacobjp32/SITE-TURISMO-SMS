# QA pós-rodadas do portal de turismo

Gerado em 2026-05-27.

## Escopo desta auditoria

- Sem implementação de nova funcionalidade.
- Sem alteração de login.
- Sem alteração de Firebase Rules.
- Sem alteração estrutural do mapa.
- Sem alteração em `TURISMO_DATA`.
- Sem instalação de dependências.
- Sem backend novo.

## 1. Fluxos verificados

### 1.1 Upload de imagens no portal

Arquivos analisados:

- `portal-usuario.html`
- `storage.rules`
- `firestore.rules`
- `js/firebase-auth.js`

Resultado:

- `evento`: verificado.
  - Front-end aceita até `6` imagens.
  - Front-end valida `5 MB` por arquivo.
  - Tipos aceitos no front-end: `JPG`, `PNG`, `WebP`.
  - Upload grava em `submissions/events/{uid}/{submissionId}/{fileName}`.
  - Path está compatível com `storage.rules`.
- `estabelecimento`: verificado.
  - Front-end aceita até `6` imagens.
  - Front-end valida `5 MB` por arquivo.
  - Tipos aceitos no front-end: `JPG`, `PNG`, `WebP`.
  - Upload grava em `submissions/establishments/{uid}/{submissionId}/{fileName}`.
  - Path está compatível com `storage.rules`.
- `alteração de empreendimento`: verificado.
  - Front-end aceita até `6` imagens.
  - Front-end valida `5 MB` por arquivo.
  - Tipos aceitos no front-end: `JPG`, `PNG`, `WebP`.
  - Upload grava em `submissions/establishment-updates/{uid}/{submissionId}/{fileName}`.
  - Path está compatível com `storage.rules`.

Leitura das rules:

- `storage.rules` cobre os três caminhos acima.
- `storage.rules` valida:
  - usuário autenticado;
  - ownership do `uid` no path;
  - `request.resource.size <= 5 * 1024 * 1024`;
  - `contentType` em `image/(jpeg|jpg|png|webp)`.
- `storage.rules` não valida o limite de `6` imagens por submissão.
  - Esse limite hoje existe apenas no front-end.

Conclusão operacional:

- Os fluxos atuais de upload estão coerentes entre front-end e `storage.rules`.
- O principal ponto de atenção é que o limite de quantidade depende só da aplicação cliente.

### 1.2 Admin

Arquivos analisados:

- `admin-firebase.html`
- `js/firebase-auth.js`
- `firestore.rules`
- `js/establishment-catalog.js`

Resultado:

- `Gerenciar Vínculos`: fluxo encontrado e ligado a `establishment_managers`.
- `Solicitações de vínculo`: fluxo encontrado e ligado a `establishment_claims`.
- `Eventos pendentes`: fluxo encontrado e ligado a `eventos_pendentes`.
- `Alterações de empreendimentos`: fluxo encontrado e ligado a `establishment_update_requests`.
- `Gerenciar Usuários`: fluxo encontrado e ligado a `usuarios`.

Conclusão operacional:

- As cinco áreas pedidas existem no painel e têm integração de leitura/ação prevista no código.
- A camada de papéis está coerente:
  - painel exige `admin` para entrar;
  - funções de aprovação/moderação usam `isModerator()` ou `isAdmin()` em `js/firebase-auth.js`;
  - `firestore.rules` contempla essas collections.

### 1.3 Mapa turístico

Arquivos analisados:

- `js/locais-data.js`
- `js/rotas-data.js`
- `js/data/eventos.js`
- `js/data/pontos-turisticos.js`
- `js/mapa-turistico.js`

Resultado por item:

- `Parque de Exposições`: encontrado em `js/locais-data.js`.
- `AgroSamas`: encontrado em `js/data/eventos.js` e citado no contexto do `Parque de Exposições`.
- `Novo Paço Municipal`: encontrado em `js/locais-data.js`.
- `Ginásio Polacão`: encontrado em `js/locais-data.js`.
- `Vapor Pery`: encontrado em `js/data/pontos-turisticos.js`.
- `Sawe`: encontrado como `Sawe Parque Aquático` em `js/rotas-data.js`.
- `Vivenda do Mate`: encontrado em `js/rotas-data.js`.
- `Casa da Memória`: encontrada como `Casa da Memória Padre Bauer` em `js/locais-data.js` e `js/data/pontos-turisticos.js`.
- `Ribeiro Pesca`: encontrado como `Ribeiro Pesca e Turismo` em `js/rotas-data.js`.

Conclusão operacional:

- Todos os itens pedidos foram localizados na camada de dados usada pelo mapa/site.
- Não foi identificado, nesta rodada, erro estrutural que justificasse alteração de dados.

## 2. Rules

Arquivos analisados:

- `firestore.rules`
- `storage.rules`
- `firebase.json`

Leitura geral:

- `firestore.rules` contempla os fluxos atuais de:
  - usuários;
  - eventos pendentes/aprovados;
  - estabelecimentos pendentes/aprovados;
  - solicitações de vínculo;
  - vínculos aprovados;
  - solicitações de alteração de empreendimento;
  - notícias;
  - reservas.
- `storage.rules` contempla os três fluxos atuais de upload do portal.

Pontos de atenção:

- `firestore.rules` para `estabelecimentos_pendentes` está funcional, mas permissiva.
  - Hoje valida basicamente `submittedBy` e `status == 'pendente'`.
  - Não faz whitelist rígida de campos nem validação explícita de `images`, `mainImage` e `imageCount` como ocorre em `establishment_update_requests`.
- `storage.rules` não consegue impor com segurança o limite de `6` imagens por submissão.
  - O próprio arquivo já documenta isso.

Publicação manual:

- `firestore.rules` está referenciado em `firebase.json`.
- `storage.rules` não aparece em `firebase.json`.
- Portanto:
  - qualquer mudança em `storage.rules` depende de publicação manual no Firebase;
  - `firestore.rules` também depende de publicação operacional quando houver mudança, mas o arquivo já está conectado no `firebase.json`;
  - hoje não há evidência no repositório de automação única cobrindo os dois arquivos juntos.

## 3. Imagens

### 3.1 Confirmação de WebP nas imagens novas

Confirmações positivas nas trocas públicas recentes já referenciadas pelo site:

- `Parque de Exposições`: usa `images/parque-exposicoes-aerea.webp`.
- `Novo Paço Municipal`: usa `images/novo-paco-municipal.webp`.
- `Ginásio Polacão`: usa `images/ginasio-polacao.webp`.
- `Vapor Pery`: usa `images/vapor-pery.webp`.
- `AgroSamas` no contexto de imagem pública destacada: existe `images/agrosamas-publico-show-noturno.webp`.

Pendências/restrições encontradas:

- Nem toda imagem pública nova está em `WebP`.
- Ainda há uso público de formatos pesados ou mistos em dados atuais:
  - `AgroSamas` em `js/data/eventos.js` usa `.jpg` e `.jpeg`;
  - `Casa da Memória` usa galeria `.jpeg`;
  - `Sawe` usa galeria `.jpeg`;
  - `Ribeiro Pesca e Turismo` usa mistura de `.jpeg` e `.png`;
  - `Vivenda do Mate` segue sem imagem publicada.

Conclusão:

- As substituições públicas recentes destacadas do mapa foram convertidas para `WebP`.
- O acervo público mais novo do portal ainda não está uniformizado em `WebP`.

### 3.2 Imagens públicas acima de 1 MB

Lista encontrada:

- `images/EU_AMO_SMS.png` — `5,16 MB`
- `images/CASA_DA_MEMORIA.png` — `5,02 MB`
- `images/empreendimentos/agrosamas/agrosamas-02.jpg` — `4,81 MB`
- `images/CHALE_DO_PRODUTOR_SEC_CULTURA.png` — `4,41 MB`
- `images/empreendimentos/agrosamas/agrosamas-01.jpg` — `4,28 MB`
- `images/IGREJA_COLONIA_IGUACU.png` — `3,86 MB`
- `images/IGREJA_MATRIZ_1.png` — `3,61 MB`
- `images/empreendimentos/nova-esperanca-equoterapia/nova-esperanca-equoterapia-01.jpg` — `3,36 MB`
- `images/IGREJA_MATRIZ_2.png` — `3,32 MB`
- `images/empreendimentos/nova-esperanca-equoterapia/nova-esperanca-equoterapia-03.jpg` — `3,17 MB`
- `images/empreendimentos/agrosamas/agrosamas-03.jpeg` — `3,10 MB`
- `images/empreendimentos/nova-esperanca-equoterapia/nova-esperanca-equoterapia-04.jpg` — `2,78 MB`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-10.png` — `2,62 MB`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-11.png` — `2,34 MB`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-09.png` — `2,18 MB`
- `images/empreendimentos/all-garden/all-garden-02.jpeg` — `2,12 MB`
- `images/empreendimentos/nova-esperanca-equoterapia/nova-esperanca-equoterapia-02.jpg` — `1,83 MB`
- `images/diorama_sao_mateus.png` — `1,41 MB`
- `images/IMIGRANTES_IA_2.png` — `1,41 MB`
- `images/IMG_2326.jpg` — `1,28 MB`
- `images/mascotes/MASCOTE_MATE_XISTO_AGUA.png` — `1,24 MB`
- `images/IMIGRANTES_IA_1.png` — `1,18 MB`
- `images/empreendimentos/ribeiro-pesca/ribeiro-pesca-07.jpeg` — `1,14 MB`
- `images/mascotes/MASCOTE_CAPIVARA_PINHAO.png` — `1,14 MB`
- `images/mascotes/MASCOTE_CAPIVARA_PINHAO_2.png` — `1,08 MB`

### 3.3 Imagens públicas acima de 3 MB

Lista encontrada:

- `images/EU_AMO_SMS.png` — `5,16 MB`
- `images/CASA_DA_MEMORIA.png` — `5,02 MB`
- `images/empreendimentos/agrosamas/agrosamas-02.jpg` — `4,81 MB`
- `images/CHALE_DO_PRODUTOR_SEC_CULTURA.png` — `4,41 MB`
- `images/empreendimentos/agrosamas/agrosamas-01.jpg` — `4,28 MB`
- `images/IGREJA_COLONIA_IGUACU.png` — `3,86 MB`
- `images/IGREJA_MATRIZ_1.png` — `3,61 MB`
- `images/empreendimentos/nova-esperanca-equoterapia/nova-esperanca-equoterapia-01.jpg` — `3,36 MB`
- `images/IGREJA_MATRIZ_2.png` — `3,32 MB`
- `images/empreendimentos/nova-esperanca-equoterapia/nova-esperanca-equoterapia-03.jpg` — `3,17 MB`
- `images/empreendimentos/agrosamas/agrosamas-03.jpeg` — `3,10 MB`

## 4. Resultado dos checks

Comandos executados:

```powershell
node --check js/establishment-catalog.js
node --check js/firebase-auth.js
node --check js/firebase-app-check.js
node --check js/cms.js
node --check js/security-utils.js
node --check js/nav-shared.js
node --check config.js
node --check sw.js
node --check js/rotas-data.js
node --check js/locais-data.js
node --check js/data/eventos.js
node --check js/data/pontos-turisticos.js
node --check js/mapa-turistico.js
```

Resultado:

- Todos os `node --check` passaram.
- Nenhum erro de sintaxe foi retornado nos arquivos listados.

## 5. Resultado das auditorias

### `node scripts/audit-links.mjs`

Resultado:

- `601` links coletados.
- `0` links quebrados.
- `16` links legados ou concorrentes.
- `13` links redundantes com `.html`.
- `17` itens que ainda dependem de decisão humana, concentrados no fluxo legado de `/local`.

Resumo de risco:

- Não há quebra imediata de link no estado atual.
- Persistem rotas legadas e concorrentes que podem gerar manutenção duplicada e ambiguidade de navegação.

### `node scripts/audit-assets.mjs`

Resultado:

- `211` mídias encontradas.
- `131` mídias referenciadas.
- `80` órfãs prováveis.
- `0` grupos duplicados por hash.
- `0` referências quebradas.
- `28` mídias pesadas.

Resumo de risco:

- Não há referência de mídia quebrada no site.
- O passivo principal é peso de mídia e acervo órfão/provável legado.

### `node scripts/audit-project.mjs`

Resultado:

- `351` arquivos mapeados.
- `36` HTML.
- `21` CSS.
- `35` JS.

Resumo de risco:

- Estrutura geral consistente.
- Ainda existe camada de compatibilidade/legado relevante no projeto.

## 6. Pendências encontradas

- O limite de `6` imagens por submissão está só no front-end; não é garantido por `storage.rules`.
- `estabelecimentos_pendentes` em `firestore.rules` está funcional, mas menos restritivo do que os demais fluxos administrativos.
- `storage.rules` não está declarado em `firebase.json`, então publicação de Storage segue dependente de ação manual.
- O fluxo legado `/local` ainda aparece como pendência recorrente nas auditorias de links.
- Nem todas as imagens públicas novas estão padronizadas em `WebP`.
- `Vivenda do Mate` segue sem imagem pública publicada.

## 7. Riscos de produção

- Risco de divergência entre cliente e backend no upload:
  - se alguém contornar o front-end, `storage.rules` não barra mais de `6` arquivos por submissão.
- Risco operacional de publicação parcial:
  - publicar só `firestore.rules` e esquecer `storage.rules` mantém uploads expostos a comportamento antigo.
- Risco de performance:
  - há imagens públicas acima de `3 MB` sendo usadas em dados públicos, principalmente em `AgroSamas`, `Nova Esperança Equoterapia` e `Ribeiro Pesca`.
- Risco de manutenção:
  - rotas legadas e variantes `.html` continuam aumentando a superfície de inconsistência futura.

## 8. Próxima ação recomendada

- Antes de produção, fazer uma rodada exclusivamente operacional de publicação e validação real no Firebase:
  - confirmar que `firestore.rules` publicadas são as mesmas deste repositório;
  - publicar manualmente `storage.rules` atuais;
  - testar com conta real os 3 fluxos de upload do portal;
  - priorizar redução de peso das imagens públicas ainda acima de `3 MB`.

