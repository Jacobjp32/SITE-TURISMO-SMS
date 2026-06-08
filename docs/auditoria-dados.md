# Auditoria das bases de dados turisticas

## Atualizacao 2026-06-08 - Dona Bernardina

Escopo: atualizacao do empreendimento existente `Delicias da Bernardina` (`id: delicias-da-bernardina`) com imagens locais fornecidas em `EMPREENDIMENTOS/dona bernardina`, sem alterar login, admin, portal, CMS, Firestore Rules ou Storage Rules.

Resultado:

- o cadastro ja existia em `js/rotas-data.js`, vinculado a `route: polonesa`;
- foram preservados id, rota, localizacao textual, telefone, horario, URL do Google Maps e coordenadas existentes;
- o texto foi ajustado para mencionar `Dona Bernardina` e culinaria polonesa sem inventar pratos, horarios, endereco ou redes sociais;
- as imagens publicas foram copiadas para `images/empreendimentos/dona-bernardina/`;
- a capa definida foi `images/empreendimentos/dona-bernardina/dona-bernardina-01.jpg`;
- a galeria do cadastro usa as imagens suportadas da pasta local, incluindo a logo como ultimo item;
- `PÃES.DNG` permaneceu apenas na pasta original por nao ser formato publico adequado para o site;
- nao houve nova pendencia de localizacao: o cadastro ja possui `mapsUrl`, `lat`, `lng` e `coordStatus: ok`.

## Atualizacao 2026-06-08 - hardening final de producao

Escopo: revisao final de robustez em cache, Service Worker, console, mobile, acessibilidade basica, mapa, tema sazonal, clima, admin e portal, sem redesign, sem nova funcionalidade grande e sem alteracao de Firestore Rules ou Storage Rules.

Correcoes aplicadas:

- `_headers` passou a explicitar revalidacao de HTML, `sw.js`, `config.js` e `js/site-meta.js`, alem de `no-store` para `admin-firebase.html` e `portal-usuario.html`;
- `sw.js` teve o cache incrementado para `turismo-sms-v17` e `favicon.ico` foi excluido da estrategia runtime de cache;
- os botoes de mostrar/ocultar senha do portal receberam `aria-label` e `aria-pressed`, sincronizados pelo toggle;
- `docs/commands.md` recebeu orientacao operacional sobre cache/SW, usuario vendo versao antiga, assets sazonais e validacao admin/portal apos deploy.

Validacoes desta rodada confirmaram que:

- `/favicon.ico` existe e carrega sem 404;
- Open-Meteo segue permitido pela CSP em `connect-src`;
- assets sazonais inexistentes nao geram requests quando os roles ficam nulos no manifest;
- `Monumento Vapor Pery` segue com coordenada e acao "Como chegar";
- a area de eventos vinculados do mapa mantem todos os eventos em box interna rolavel.

Pendencias operacionais:

- validar login/admin/portal no dominio publicado com contas reais, pois localhost/headless pode sofrer limitacoes de App Check, dominio autorizado ou sessao;
- criar os assets sazonais reais antes de ativar paths no manifest ou via `window.SMS_SEASON_ASSETS`;
- publicar Firebase Rules somente quando houver mudanca deliberada em rules; esta rodada nao alterou `firestore.rules` nem `storage.rules`.

## Atualizacao 2026-06-08 - mapa turistico, pendencias de coordenadas, Vapor Pery e assets sazonais

Escopo: refinamento da lista publica de itens sem localizacao exata em `mapa-turistico.html`, sem alteracao de login, admin, portal do usuario, Firebase Rules ou Storage Rules.

Resultado:

- a lista "Itens sem localizacao exata" passa a considerar apenas itens reais que deveriam poder receber coordenadas: pontos/atrativos, hospedagens, restaurantes e eventos;
- paginas estruturais, links institucionais, itens de navegacao e servicos informativos nao entram mais na lista de pendencias de coordenadas;
- rotas cadastradas em `js/data/rotas.js` seguem preservadas, mas aparecem em secao propria como "Rotas tematicas sem ponto unico";
- o texto publico explica que ausencia de coordenada nao e erro do site, e sim pendencia de dados.
- a area de eventos vinculados ao empreendimento no mapa mostra todos os eventos em uma caixa interna rolavel, sem esticar indefinidamente o painel lateral ou o modal;
- o manifest sazonal interno nao aponta mais para assets ainda inexistentes; enquanto os arquivos reais nao forem cadastrados, os slots usam fallback CSS sem gerar request 404.

Vapor Pery:

- item atualizado para `Monumento Vapor Pery`;
- endereco fornecido pelo usuario: `R. Joao Gabriel Martins, 1 - Sao Mateus do Sul, PR, 83900-000`;
- Plus Code informado pelo usuario: `4JF7+68 Sao Mateus do Sul, Parana`;
- URL Google Maps fornecida pelo usuario: `https://maps.app.goo.gl/Un5naGFe5cT3o3pp9`;
- coordenada derivada do Plus Code informado pelo usuario: `lat -25.8769375`, `lng -50.3866875`;
- o termo `Vapor Pery` foi preservado em tags para busca e compatibilidade;
- com coordenada preenchida, o item deixa de entrar na lista de itens reais ainda sem coordenada e volta a ter acao "Como chegar".

## Atualizacao 2026-06-02 - rotas com imagem, noticias oficiais e LGPD

Escopo desta rodada:

- adicionar imagens publicas nas 6 rotas de `js/data/rotas.js`;
- atualizar a camada estatica de noticias em `index.html` e `noticias.html` com links oficiais recentes;
- corrigir os blocos de LGPD em `transparencia.html` e `privacidade.html`;
- adicionar o carregamento global do tema sazonal nas paginas publicas.

Resumo dos dados atualizados:

| Area | Situacao anterior | Situacao atual |
| --- | --- | --- |
| Rotas em `js/data/rotas.js` | `6` rotas sem `imagem` | `6` rotas com `imagem` e `galeria` |
| Noticias recentes na home | cards estaticos com pauta de marco/2026 | cards estaticos atualizados com pautas oficiais ate junho/2026 |
| `noticias.html` | selecao com foco em 2024-2026 misturado | selecao reorganizada por recencia e aderencia a cultura/turismo/desenvolvimento |
| LGPD | bloco sintetico com contato incompleto | dados oficiais do Departamento de LGPD e link da pagina oficial |
| Tema sazonal | inexistente | `css/season-theme.css` + `js/season-theme.js` com modo automatico/manual |

Fonte oficial LGPD usada:

- `https://www.saomateusdosul.pr.gov.br/portal/secretarias/330/departamento-de-lgpd/`

Campos confirmados:

- `Nicolas Addor`
- `(42) 3912-7026`
- `lgpd@saomateusdosul.pr.gov.br`
- `Rua João Gabriel Martins, 435, Centro - CEP 83900-000`
- `Segunda a Sexta-feira das 8h as 12h e das 13h15 as 17h15`

Observacao de estrutura:

- as noticias continuam em HTML estatico, sem CMS novo;
- a agenda estruturada de eventos continua separada em `eventos-2026.json` e `js/data/eventos.js`;
- `portal-usuario.html` e `admin-firebase.html` ficaram fora do tema sazonal por decisao de risco.

## Atualização 2026-05-27 - padronização WebP nas imagens públicas recentes

Escopo desta correção:

- nenhuma alteração de texto, categoria, coordenada ou estrutura do mapa;
- apenas troca de referências de imagem pública para versões `.webp` otimizadas.

Referências públicas ajustadas:

- `images/vapor-pery.png` -> `images/vapor-pery.webp`
- `images/novo-paco-municipal.jpg` -> `images/novo-paco-municipal.webp`
- `images/parque-exposicoes-aerea.jpg` -> `images/parque-exposicoes-aerea.webp`
- `images/agrosamas-publico-show-noturno.jpeg` -> `images/agrosamas-publico-show-noturno.webp`
- `images/ginasio-polacao.jpg` -> `images/ginasio-polacao.webp`

Diretriz consolidada:

- novas imagens públicas incluídas em `js/locais-data.js`, `js/data/*` e páginas HTML devem usar `.webp` otimizado como padrão.

## Atualização 2026-05-27 - correção pontual de imagens/nome

Mudanças públicas desta rodada:

- `paco-municipal` em `js/locais-data.js`: nome alterado de `Paço Municipal` para `Novo Paço Municipal`; imagem e galeria atualizadas para `images/novo-paco-municipal.webp`.
- `parque-exposicoes` em `js/locais-data.js`: capa errada do AgroSamas substituída por `images/parque-exposicoes-aerea.webp`; galeria deixou de reutilizar imagens do evento.
- `agrosamas` em `js/data/eventos.js`: imagem principal alterada para `images/agrosamas-publico-show-noturno.webp`, mantendo as demais imagens anteriores na galeria.
- `ginasio-polacao` em `js/locais-data.js`: imagem principal corrigida para `images/ginasio-polacao.webp`.
- `vapor-pery` em `js/data/pontos-turisticos.js`: imagem principal corrigida para `images/vapor-pery.webp`.

Arquivos-fonte preservados:

- `images/AGROSAMAS_PUBLICO SHOW_PARA_TROCAR.JPEG`
- `images/PARQUE_EXPOSICOES_PARA_TROCAR.jpg`
- `images/NOVO_PAÇO_MUNICIPAL_PARA_USAR_1.JPG`
- `images/NOVO_PAÇO_MUNICIPAL_PARA_USAR_2.DNG`
- `images/GINASIO_POLACAO_PARA_TROCAR.JPG`
- `images/PERY_PARA_TROCAR.png`

Pendência de curadoria humana:

- validar futuramente se `Novo Paço Municipal` deve receber também uma segunda imagem web exportada a partir do bruto `.DNG`; nesta rodada não houve conversão.

Data da auditoria: 18/05/2026

Escopo: bases em `js/data/*.js`, bases legadas `js/locais-data.js` e `js/rotas-data.js`, busca, chatbot e roteiro IA. Nenhum dado turistico foi alterado nesta rodada.

## Resumo atual

| Indicador | Valor |
| --- | ---: |
| Itens consolidados em `TURISMO_DATA` | 83 |
| Pontos | 32 |
| Roteiros | 6 |
| Hospedagens | 7 |
| Restaurantes/gastronomia | 19 |
| Eventos | 8 |
| Informacoes essenciais/servicos | 11 |
| Itens sem coordenadas | 17 |

Categorias detectadas:

- Cultura
- Eventos
- Gastronomia
- Historia
- Hospedagem
- Institucional
- Natureza
- Roteiros
- Servicos
- Rota Cultural
- Rota Gastronomica
- Rota Natureza
- Rota Regional
- Rota Rural

## 1. Bases primarias

| Arquivo | Tipo | Status | Observacao |
| --- | --- | --- | --- |
| `js/data/pontos-turisticos.js` | Pontos turisticos resumidos | Ativo | Base nova consumida pelo centralizador. |
| `js/data/rotas.js` | Roteiros resumidos | Ativo | Roteiros sem coordenada unica devem continuar assim. |
| `js/data/hospedagens.js` | Hospedagens | Ativo | Inclui hospedagens recentes e legadas. |
| `js/data/restaurantes.js` | Gastronomia | Ativo | Inclui Ancestral e outros empreendimentos. |
| `js/data/eventos.js` | Eventos | Ativo | Eventos podem compartilhar coordenadas com locais. |
| `js/data/informacoes-essenciais.js` | Servicos/informacoes | Ativo | Alguns itens sao navegacionais, nao pontos fisicos. |
| `js/data/turismo-data.js` | Centralizador | Ativo | Fonte agregada para mapa e busca. |
| `js/data/turismo-data-adapter.js` | Adaptador | Ativo | Integra bases legadas sem duplicar manualmente. |

## 2. Bases legadas

| Arquivo | Papel atual | Ainda necessario? | Risco de remover |
| --- | --- | --- | --- |
| `js/locais-data.js` | Dados ricos de locais e pagina individual `local`. | Sim | Alto: perder detalhes, imagens e coordenadas. |
| `js/rotas-data.js` | Dados ricos de rotas e empreendimentos. | Sim | Alto: perder empreendimentos recentes e imagens. |
| `js/search-index.js` | Indice de busca com fallback e URLs. | Sim | Medio: busca global perde cobertura. |
| `js/chatbot.js` | Respostas turisticas fixas. | Sim, mas duplicado. | Medio: pode responder conteudo antigo. |
| `js/roteiro-ia.js` | Roteiro com base propria. | Sim, se pagina seguir publica. | Medio: dados podem divergir do mapa. |

## 3. Dados duplicados

### Duplicidade por nome

| Nome normalizado | Itens | Diagnostico |
| --- | --- | --- |
| `rua do mathe` | `pontos:rua-do-mathe`, `restaurantes:rua-do-mathe` | Pode ser intencional: local turistico e polo gastronomico. Revisar antes de fundir. |

### Coordenadas compartilhadas

| Coordenada | Itens | Diagnostico |
| --- | --- | --- |
| `-25.87800,-50.38500` | Rua do Mathe, Polskie Smaki, Feira Gastronomica, Feira do Produtor | Provavel reuso intencional para eventos/polo. |
| `-25.87620,-50.38560` | Chimarródromo, Roda de Mathe | Provavel evento no mesmo local. |
| `-25.96601,-50.53982` | Pitayas Dragao, Viveiro Fluviopolis, Propriedade Seu Luiz, Sitio Pica-pau Vermelho, Posto Pelanda | Coordenada generica suspeita; revisar. |
| `-25.90240,-50.27604` | Propriedade do Tico, Sitio Ludevico, Sitio Sapopema | Coordenada compartilhada suspeita; revisar. |
| `-25.88000,-50.39000` | Parque de Exposicoes, AgroSamas | Provavel evento no mesmo local. |
| `-25.87750,-50.38400` | Natal Ouro Verde, Miss Sao Mateus, Prefeitura Municipal | Provavel evento/centro civico. |

## 4. Dados ainda hardcoded

| Local | Tipo de dado | Risco | Recomendacao |
| --- | --- | --- | --- |
| `index.html` | Cards, textos editoriais e secoes fixas. | Medio | Migrar apenas quando houver renderer estavel. |
| `js/chatbot.js` | Respostas por palavra-chave. | Medio | Consumir `TURISMO_DATA` em fase futura. |
| `js/roteiro-ia.js` | Pontos e regras proprios. | Medio | Migrar para base central. |
| `js/search-index.js` | Entradas fixas/fallbacks e URLs. | Medio | Padronizar com `TURISMO_DATA`. |
| Paginas legadas | Textos e cards proprios. | Medio | Transformar em pontes ou consumir base central. |

## 5. Dados que podem ser absorvidos

| Origem | Destino futuro | Condicao |
| --- | --- | --- |
| `js/locais-data.js` | `js/data/pontos-turisticos.js` ou fonte unica futura | Depois que `local.html` tambem consumir a fonte nova. |
| `js/rotas-data.js` | Bases de restaurantes, hospedagens, pontos e roteiros | Depois de mapear campos sem perda. |
| `js/roteiro-ia.js` | `TURISMO_DATA` | Depois de definir regras de roteiro por categoria/tag. |
| `js/chatbot.js` | Consulta em `TURISMO_DATA` | Depois de preservar respostas institucionais. |
| Dados da HOME | `TURISMO_DATA_META` e secoes editoriais | Apenas para estatisticas/cards, sem reescrever layout. |

## 6. Dados que nao devem ser removidos ainda

- `js/locais-data.js`
- `js/rotas-data.js`
- `js/data/turismo-data-adapter.js`
- dados de itens sem coordenadas
- roteiros sem coordenada unica
- imagens de empreendimentos ainda nao estruturadas
- pontes `/local?id=...`
- textos fixos de chatbot/roteiro IA ate existir substituto testado

## 7. Plano de migracao segura

1. Congelar a base central como leitura autoritativa para o mapa.
2. Criar relatorio de equivalencia campo a campo entre base nova e legado.
3. Migrar um tipo por vez: restaurantes, hospedagens, pontos, eventos, roteiros.
4. Validar contagens antes/depois em `window.TURISMO_DATA_META`.
5. Validar mapa, busca, modal de detalhes e pagina `local`.
6. Somente depois marcar arquivo legado como candidato a remocao.

## 8. Pendencias de empreendimentos

| Item | Status atual | Recomendacao |
| --- | --- | --- |
| Ancestral Gastronomia | Imagens e galeria estruturadas. | Manter; revisar peso se necessario. |
| Ribeiro Pesca e Turismo | Galeria curada com 8 imagens, incluindo 2 novas fotos aereas `.png`. | Manter; otimizar `.png` pesados depois. |
| Nova Esperanca | Galeria estruturada. | Manter; otimizar imagens grandes. |
| Doces e Delicias | Imagens em `images/empreendimentos/`, sem item seguro consolidado. | Nao cadastrar automaticamente. Precisa decisao humana. |
| Casa da Memoria | Fotos reais incorporadas em `pontos-turisticos` e `locais-data`; TXT segue vazio. | Confirmar endereco publico antes de revisar texto/horario. |
| Sawe Parque Aquatico | Item existente de rota com nova galeria e endereco textual mais especifico. | Revisar compressao das fotos se o modal ficar pesado. |
| Vivenda do Mate | Texto, telefone e site atualizados com base em TXT seguro; segue sem imagem. | Priorizar imagem institucional em rodada futura. |
| AgroSamas | Material recebido corresponde melhor ao evento existente em `js/data/eventos.js`. | Nao criar item duplicado; separar curadoria de evento e parque se necessario. |
| HEIC/DNG | Material bruto nao web. | Nao usar diretamente; decidir conversao futura. |
| Video da Rei Verde | Nao vinculado ao site. | Decidir se entra como video, imagem poster ou nao entra. |
| Baldo | Dados aparecem em informacoes essenciais/legado. | Revisar imagem principal antes de alterar. |
| Marina Barra do Iguacu | Atualizada com texto, horario, imagem e galeria em `images/empreendimentos/marina-barra-do-iguacu/`. | Manter; revisar peso da galeria se necessario. |
| All Garden | Atualizado como item existente de rota, com imagem, galeria e Instagram do TXT recebido. | Manter como item de rota; nao criar duplicado. |
| Hotel Sao Mateus | Atualizado com telefone do TXT e galeria; segue sem coordenadas confirmadas. | Confirmar localizacao exata antes de habilitar rota/Como chegar. |
| Hotel Moro | Hospedagem com galeria/campos recentes. | Manter; validar imagem principal. |

## 9. Itens sem imagem

Existem muitos itens sem imagem principal, especialmente empreendimentos rurais, hospedagens, eventos e informacoes essenciais. Isso nao e erro automatico: o modal de detalhes deve exibir placeholder/estado sem imagem e ocultar campos ausentes.

Acao recomendada: priorizar imagens de itens mais acessados, sem inventar ou baixar imagens externas.

## 10. Itens sem coordenadas

Itens sem coordenadas continuam validos como cards/lista, mas nao devem mostrar botao "Como chegar".

Casos esperados:

- roteiros tematicos;
- informacoes essenciais navegacionais;
- hospedagens sem endereco confirmado;
- eventos sem local unico.

Acao recomendada: manter `null` ate haver coordenada confirmada.

## 11. Remocao publica de empreendimento

### Rodada 2026-05-26 - Morangos da Mary

Objetivo da rodada:

- remover `Morangos da Mary` da experiencia publica do site de turismo;
- nao mexer em login, CSP, Firebase/Auth/App Check, rules reais ou backend;
- nao apagar imagens fisicas sem confirmacao humana.

Ocorrencias encontradas:

| Local | Ocorrencia | Acao |
| --- | --- | --- |
| `js/rotas-data.js` | Cadastro legado completo do empreendimento (`id: morangos-da-mary`). | Removido da base legada. |
| `js/data/rotas.js` | Tag `morangos` na rota `Sabores & Memorias`. | Removida para nao sugerir busca ligada ao empreendimento removido. |
| `js/chatbot.js` | Respostas fixas de `sabores`, `sabores e memorias`, `morango` e `morangos` citavam o empreendimento. | Textos atualizados para listar apenas empreendimentos ativos e resposta generica para consulta sobre morangos. |
| `cloudflare-worker/chat-worker.js` | Resumo fixo da rota `Sabores & Memorias` citava o empreendimento. | Texto atualizado para listar apenas empreendimentos ativos. |
| `index.html` | Bloco `produtoresData.morangos` com nome, telefone e horario do empreendimento. | Removido. |
| `index.html` | Card oculto da galeria com `images/MORANGO_1.jpg`. | Removido do HTML para evitar uso publico futuro. |
| `galeria.html` | Card publico "Morangos das Colonias" usando `images/MORANGO_1.jpg`. | Removido da galeria publica. |

Arquivos alterados nesta remocao:

- `js/rotas-data.js`
- `js/data/rotas.js`
- `js/chatbot.js`
- `cloudflare-worker/chat-worker.js`
- `index.html`
- `galeria.html`
- `docs/auditoria-dados.md`
- `docs/atualizacao-empreendimentos.md`
- `docs/plano-portal-cadastros.md`

Imagem associada encontrada:

- `images/MORANGO_1.jpg`

Status da imagem:

- o arquivo fisico foi preservado;
- a imagem deixou de ser referenciada publicamente em `index.html` e `galeria.html`;
- fica como candidata a revisao humana posterior por possivel orfandade.

Historico preservado:

- nenhum dado do empreendimento foi mantido em area publica ativa;
- o historico desta remocao fica documentado neste arquivo e em `docs/atualizacao-empreendimentos.md`.
