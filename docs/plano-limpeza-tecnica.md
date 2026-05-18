# Plano de limpeza tecnica

Data: 18/05/2026

Principio: executar em fases pequenas, com validacao local, sem apagar dados ou assets antes de confirmar uso real.

## Fase 1 - Limpeza segura imediata

| Item | Risco | Arquivos envolvidos | Beneficio | Acao recomendada | Validacao humana |
| --- | --- | --- | --- | --- | --- |
| Corrigir anchors `/eventos#setembro` e `/eventos#dezembro` | Baixo | `index.html` | Remove links quebrados reais. | Resolvido nesta rodada: ambos apontam para `/eventos/`, sem criar ancora falsa. | Revisar depois se houver campanha mensal com anchor real. |
| Resolver links `/portal/noticias/...` | Medio | `noticias.html`, `scripts/audit-links.mjs` | Evita falso positivo como rota local inexistente. | Resolvido como falso positivo da auditoria: links continuam externos para o portal oficial da Prefeitura. | Sim, se houver decisao de trazer noticias locais. |
| Padronizar links obvios para mapa | Medio | `manifest.json`, paginas legadas | Reduz rotas concorrentes. | Resolvido apenas no atalho PWA `O Que Fazer`, agora para `/mapa-turistico.html?grupo=roteiros`. Demais rotas antigas seguem preservadas. | Sim. |
| Documentar ordem de scripts | Baixo | `docs/auditoria-js.md` | Evita `Identifier already declared`. | Mantido e atualizado com a limpeza do artefato Cloudflare. | Nao. |

### Rodada 1 - executada em 18/05/2026

Resolvido:

- `index.html`: links `/eventos#setembro` e `/eventos#dezembro` trocados por `/eventos/`.
- `index.html`: residuos Cloudflare de email protection removidos e email exposto como `mailto:turismo@saomateusdosul.pr.gov.br`.
- `manifest.json`: atalho PWA `O Que Fazer` direcionado para o grupo de roteiros no mapa turistico.
- `scripts/audit-links.mjs`: falsos positivos corrigidos para links externos oficiais, strings de CSS/data SVG, comentarios JS e assets injetados por JS.
- `local.html`: carregamento de `js/locais-data.js` antecipado para a pagina individual funcionar em `/local/?id=...`.
- `sw.js`: navegacoes deixam de ser cacheadas para evitar HTML antigo em rotas sem `.html`; cache atualizado para `turismo-sms-v12`.

Adiado:

- remocao de imagens orfas provaveis;
- escolha de imagem canonica;
- mudanca estrutural nas paginas legadas;
- migracao de dados turisticos ou bases legadas;
- refatoracao de CSS/JS sensiveis.

## Fase 2 - Assets

| Item | Risco | Arquivos envolvidos | Beneficio | Acao recomendada | Validacao humana |
| --- | --- | --- | --- | --- | --- |
| Escolher imagens canonicas por serie | Medio | `images/`, `images/empreendimentos/`, dados JS | Reduz confusao e peso futuro. | Comparar uso, qualidade e tamanho. | Sim. |
| Otimizar videos grandes | Medio/alto | `videos/*.mp4`, HTML que referencia video | Melhora performance. | Criar versoes web otimizadas sem apagar originais. | Sim. |
| Otimizar PNGs acima de 3 MB | Medio | `images/*.png` | Melhora carregamento. | Gerar versoes web e trocar referencias com QA. | Sim. |
| Decidir imagens extras de empreendimentos | Medio | `images/empreendimentos/`, `js/rotas-data.js`, `js/data/restaurantes.js` | Melhora modal/galeria. | Estruturar `galeria` somente onde houver certeza. | Sim. |
| Decidir HEIC/DNG | Medio | `EMPREENDIMENTOS/` bruto | Evita asset nao web. | Converter em fase separada, preservando bruto. | Sim. |
| Quarentena de duplicatas | Alto | `images/` | Limpeza segura antes de remocao. | Mover somente apos validacao; nao nesta rodada. | Sim. |

## Fase 3 - CSS

| Item | Risco | Arquivos envolvidos | Beneficio | Acao recomendada | Validacao humana |
| --- | --- | --- | --- | --- | --- |
| Reduzir duplicidade de header | Alto | `css/index.css`, `css/shared.css`, CSS legados | Manutencao melhor. | Unificar em pequenas etapas. | Sim, por pagina. |
| Padronizar botoes/filtros | Medio | `eventos.css`, `onde-ficar.css`, `rotas-completas.css`, `mapa-turistico.css` | Consistencia visual. | Extrair apenas padroes estaveis. | Sim. |
| Reduzir `!important` | Alto | `css/index.css` principalmente | Menos conflito. | Remover por bloco com screenshot. | Sim. |
| Estabilizar mobile | Alto | `css/index.css`, `css/mapa-turistico.css`, `mobile-fixes.css` | Menos regressao em 390/430. | QA por breakpoint. | Sim. |

## Fase 4 - JS/dados

| Item | Risco | Arquivos envolvidos | Beneficio | Acao recomendada | Validacao humana |
| --- | --- | --- | --- | --- | --- |
| Absorver dados legados | Alto | `locais-data.js`, `rotas-data.js`, `js/data/*` | Fonte unica futura. | Migrar por tipo e validar contagem. | Sim. |
| Reduzir globais | Alto | Scripts de dados e mapa | Menos risco de conflito. | Fazer so apos estabilizar rotas. | Nao obrigatoria, mas exige QA tecnico. |
| Revisar `nav-shared.js` | Alto | `js/nav-shared.js` | Menos responsabilidades em um arquivo. | Documentar e separar em partes pequenas. | Sim, por comportamento. |
| Integrar chatbot ao centralizador | Medio | `js/chatbot.js`, `TURISMO_DATA` | Conteudo menos duplicado. | Criar fallback seguro. | Sim. |
| Revisar modal de detalhes | Medio | `js/mapa-turistico.js`, `css/mapa-turistico.css` | Melhor UX e menos edge cases. | Testar campos opcionais e roteiros. | Sim. |

## Fase 5 - Conteudo/paginas legadas

| Item | Risco | Arquivos envolvidos | Beneficio | Acao recomendada | Validacao humana |
| --- | --- | --- | --- | --- | --- |
| Definir papel de `o-que-fazer` | Medio | `o-que-fazer.html`, ponte, nav | Reduz duplicidade. | Virar ponte ou manter editorial. | Sim. |
| Definir papel de `rotas-completas` | Alto | `rotas-completas.html`, `rotas-data.js` | Evita catalogo duplicado. | Manter dados, talvez transformar pagina em ponte. | Sim. |
| Definir `sabores` e `onde-ficar` | Medio | HTML/CSS respectivos | Menos paginas concorrentes. | Apontar para mapa filtrado se aprovado. | Sim. |
| Revisar noticias | Medio | `noticias.html`, rotas portal | Remove links quebrados. | Corrigir destinos. | Sim. |
| Revisar textos antigos | Baixo/medio | HTMLs e translations | Consistencia editorial. | Ajustar por pagina. | Sim. |

## Fase 6 - Automacao futura

| Item | Risco | Arquivos envolvidos | Beneficio | Acao recomendada | Validacao humana |
| --- | --- | --- | --- | --- | --- |
| `site-meta` | Medio | Dados centrais, HOME, SEO | Metadados consistentes. | Criar fonte estatica sem backend. | Sim. |
| Clima | Medio | HOME/mapa/config | Valor ao visitante. | Usar fonte segura apenas quando aprovada. | Sim. |
| Painel admin/CMS | Alto | `admin-firebase.html`, `portal-usuario.html`, dados | Atualizacao operacional. | Planejar arquitetura antes; nao improvisar. | Sim. |
| Auditorias recorrentes | Baixo | `scripts/audit-*.mjs`, `docs/auditoria-output/` | Evita regressao. | Rodar antes de releases. | Nao. |

## O que pode ser limpo com seguranca primeiro

- links quebrados confirmados em `index.html` para anchors inexistentes;
- exemplos documentais que parecem asset real;
- padronizacao de links internos quando a pagina destino ja existe;
- comentarios ou scripts duplicados apenas apos confirmar que nao sao gerados por ferramenta externa.

## O que precisa de revisao humana

- remocao de qualquer imagem;
- escolha de imagem canonica;
- conversao de HEIC/DNG;
- papel publico de paginas antigas;
- eventual espelhamento local das noticias hoje vinculadas ao portal externo oficial;
- estado de `portal-usuario`, `admin-firebase` e `reservas`;
- textos editoriais e categorias que afetam narrativa do turismo.

## O que nao deve ser apagado ainda

- `js/locais-data.js`
- `js/rotas-data.js`
- `js/data/turismo-data-adapter.js`
- paginas ponte `*/index.html`
- imagens de `images/empreendimentos/`
- imagens orfas provaveis antes de validacao
- arquivos Firebase/admin antes de decisao
- paginas antigas enquanto houver links e compatibilidade
