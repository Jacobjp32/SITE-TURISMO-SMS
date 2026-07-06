# Bloco S15 - Validacao geral pos-blocos recentes

**Data:** 2026-07-06  
**Projeto:** SITE-TURISMO-SMS-mainv2  
**Dominio publicado validado:** https://turismo.saomateusdosul.pr.gov.br  
**Escopo:** validacao geral apos P4, S12, S13, S14 e dados turisticos. Sem feature nova.

## 1. Pre-check do worktree

- `git status --short`: sem arquivos modificados antes do inicio.
- `git status`: branch `main`, atualizada com `origin/main`, `working tree clean`.
- Observacao: o Git emitiu aviso de permissao no ignore global `C:\Users\jacob\.config\git\ignore`, sem impacto no status do repositorio.

## 2. Comandos executados

Audits iniciais solicitados:

```powershell
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
```

Validacoes de sintaxe:

```powershell
node --check js/nav-shared.js
node --check js/site-meta.js
node --check js/season-theme.js
node --check js/tourism-mascot.js
node --check js/search-index.js
node --check js/locais-data.js
node --check js/mapa-turistico.js
node --check translations.js
node --check sw.js
```

Audits finais:

```powershell
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
```

Checagem HTTP publicada:

```powershell
Invoke-WebRequest -Uri https://turismo.saomateusdosul.pr.gov.br/... -Method Get -MaximumRedirection 5
```

Observacao: a primeira tentativa HTTP dentro do sandbox falhou com erro SSL. A mesma checagem foi repetida fora do sandbox e retornou status 200 nas rotas testadas.

## 3. Resultado dos audits

| Comando | Resultado |
| --- | --- |
| `node scripts/audit-links.mjs` | 734 links, 0 broken, 1 known false positive, 33 legacy/redundant candidates |
| `node scripts/audit-assets.mjs` | 226 media, 0 duplicate groups, 0 missing references |
| `node scripts/audit-project.mjs` | 430 files, 36 html, 24 css, 47 js |

Os audits atualizaram arquivos gerados em `docs/auditoria-output/`:

- `docs/auditoria-output/assets-report.json`
- `docs/auditoria-output/assets-report.md`
- `docs/auditoria-output/links-report.json`
- `docs/auditoria-output/links-report.md`
- `docs/auditoria-output/project-report.json`
- `docs/auditoria-output/project-report.md`

Decisao: mantidos como evidencia da rodada. Nao foi usado `git restore` nem `git reset`, conforme regra do bloco.

## 4. Rotas publicadas testadas

Todas retornaram HTTP 200:

| Rota | Resultado |
| --- | --- |
| `/` | 200 - home publicada |
| `/eventos` | 200 |
| `/eventos.html` | 200 |
| `/mapa-turistico` | 200 |
| `/mapa-turistico.html` | 200 |
| `/mapa-turistico?grupo=roteiros` | 200 |
| `/mapa-turistico?categoria=Gastronomia` | 200 |
| `/sabores` | 200 |
| `/sabores.html` | 200 |
| `/noticias` | 200 |
| `/noticias.html` | 200 |
| `/onde-ficar` | 200 |
| `/onde-ficar.html` | 200 |
| `/galeria` | 200 |
| `/galeria.html` | 200 |
| `/o-que-fazer` | 200 |
| `/o-que-fazer.html` | 200 |
| `/local?id=casa-da-memoria` | 200; renderizou Casa da Memoria Padre Bauer |
| `/local?id=casa-memoria-padre-bauer` | 200; renderizou Casa da Memoria Padre Bauer |
| `/sabores#polonesa` | 200; alvo encontrado e visivel |
| `/sabores#erva-mate` | 200; ancora encontrada, mas invisivel por design (`.sabores-anchor`) |
| `/sabores#feiras` | 200; alvo encontrado e visivel |
| `/sabores#restaurantes` | 200; alvo encontrado e visivel |
| `/portal-usuario` | 200; tela de login/portal abre |
| `/admin-firebase` | 200; tela admin/login abre |

## 5. Home publicada

Validado em navegador no dominio publicado:

- Hero/video: presente (`video`/frame da home detectado).
- Faixa de clima: presente e renderizada.
- Etiqueta sazonal: presente, texto observado `Inverno · frio`.
- Tema sazonal: `html[data-season="winter"]`.
- Clima real: `html[data-weather="rain"]`; cards renderizados com temperaturas reais (`16°C`, `6-17°C`, `2-19°C` na rodada).
- VLibras: widget presente.
- Botao voltar ao topo: presente; aparece apos scroll.
- Menu desktop/mobile: navegacao principal e atalhos mobile presentes; sem erro de console.
- Console: sem erro novo capturado na navegacao validada.

Observacao sobre chatbot/Mathe:

- `#chatbot-widget` nao renderiza na home publicada.
- Isso ja esta refletido no codigo existente: `index.html` contem comentario de desativacao do Chatbot Mathe/Cuia na home para evitar duplicidade com o mascote visual, `js/nav-shared.js` remove/oculta `#chatbot-widget`, e `css/index.css` tambem oculta `#chatbot-widget`/`#chatbot-styles`.
- Como o bloco S15 e de validacao e nao de feature/correcao funcional ampla, nada foi alterado. Fica como ponto de decisao editorial se o Mathe deve voltar a aparecer.

## 6. URLs limpas, antigas e filtros

Validacao publicada:

- URLs limpas e `.html` coexistem com status 200.
- `/mapa-turistico?grupo=roteiros` ativou filtro/grupo de roteiros.
- `/mapa-turistico?categoria=Gastronomia` normalizou para `?categoria=Gastronomia&grupo=gastronomia` e ativou Gastronomia.
- Busca interna testada em desktop com termo `igreja`; modal abriu, resultados apareceram, com links para `/local?id=igreja-agua-branca`, `/local?id=igreja-matriz`, `/mapa-turistico?grupo=roteiros` e `/mapa-turistico?categoria=Hospedagem`.
- `/sabores#polonesa`, `#feiras` e `#restaurantes` ativaram seus blocos.
- `/sabores#erva-mate` usa ancora invisivel dedicada; rota e ancora existem, mas o filtro permanece em `Tudo`. Nao foi tratado como bug neste bloco porque o comentario local descreve essa ancora especial.

## 7. Mascote S12

Validado em home e mapa publicado:

- Mascote injeta apos carregamento/idle.
- Abre pelo launcher.
- Fecha pelo botao `x`.
- Fecha com `Escape`.
- Atalhos renderizados:
  - `/mapa-turistico.html`
  - `/eventos/`
  - `/sabores`
  - `/onde-ficar`
  - `tel:+554235324163`
- Botao `Ocultar guia` troca o estado visual para mini botao de reabrir (`🌿`).
- Em mobile 390x844 e 412x915, o mascote nao sobrepos o botao voltar ao topo.
- No mapa mobile 390x844, o mascote nao sobrepos filtros nem painel/lista do mapa.
- Como o Mathe nao renderiza atualmente no site publicado, a convivencia visual com o chatbot nao pode ser validada em producao nesta rodada.

Traducoes:

- Chaves de mascote verificadas em `translations.js` para `pt`, `en`, `es`, `pl`: `mascot-title`, `mascot-hide`, `mascot-msg-home`, `mascot-link-mapa`.
- Todas presentes.

## 8. Tema sazonal e clima S14

Validado em home desktop e mobile:

- `js/season-theme.js` aplicou `data-season="winter"` em 2026-07-06.
- Etiqueta sazonal renderizada como `Inverno · frio`.
- `js/weather.js` carregou dados da Open-Meteo e disparou estado `data-weather="rain"`.
- Cards de clima renderizaram temperaturas e condicoes.
- Fallback verificado por codigo: se a API falhar, `weather.js` usa cache valido, depois cache expirado com aviso, e por fim estado indisponivel com `weather-unavailable`.
- Sem evidencia de animacao pesada; CSS possui caminhos de `prefers-reduced-motion`/`season-reduced-motion`.
- Mobile: faixa de clima visivel, sem sobreposicao com mascote ou voltar ao topo.

Traducoes:

- Chaves verificadas em `translations.js` para `pt`, `en`, `es`, `pl`: `weather-label`, `weather-title`, `season-etiqueta-winter`, `weather-unavailable`.
- Todas presentes.

## 9. Portal/admin - smoke

Somente abertura, sem fluxo autenticado real:

| Rota | Resultado |
| --- | --- |
| `/portal-usuario` | abriu, titulo `Portal do Usuario — Turismo Sao Mateus do Sul`, h1 `Bem-vindo(a), Usuario!`, formulario/login presente, console sem erro |
| `/admin-firebase` | abriu, titulo `Painel Admin | Turismo SMS`, h1 `Painel Administrativo`, formulario/login presente, console sem erro |

Decisao: nenhum teste de fluxo completo foi feito por exigir login real/sessao Firebase. Nao houve indicio de alteracao indevida por P4/S12/S13/S14 na abertura dessas telas.

## 10. Datas e horarios verificados

Arquivos verificados:

- `sitemap.xml`
- `js/site-meta.js`
- `config.js`
- docs dos blocos P4, S12, S13, S14

Resultados:

| Arquivo | Estado observado | Decisao |
| --- | --- | --- |
| `sitemap.xml` | `lastmod` majoritario em `2026-06-29`; `/rotas-completas` em `2026-07-06` | Nao atualizado. Este bloco e validacao, sem mudanca indexavel significativa. |
| `js/site-meta.js` | `updatedAt: "2026-07-02T10:30:00-03:00"` | Nao atualizado. Sem mudanca funcional/editorial nova do portal. |
| `config.js` | Agrosamas 2026: `dataInicio: '2026-09-17'`, `dataFim: '2026-09-21'`; dominio oficial em `CONFIG.site.url` | Nao atualizado. Fora do escopo. |
| `docs/bloco-p4-aplicacao-publicacao-solicitacoes.md` | Data 2026-07-02; documenta que aprovacao nao publica automaticamente | Conferido. |
| `docs/bloco-s12-mascote-interativo.md` | Data 2026-07-02; registra decisao de nao alterar sitemap por widget global | Conferido. |
| `docs/bloco-s13-urls-bonitas-slugs.md` | Data 2026-07-06; registra URLs limpas e lastmod pontual de `/rotas-completas` | Conferido. |
| `docs/bloco-s14-tema-sazonal-clima.md` | Data 2026-07-06; registra decisao de nao atualizar `site-meta.updatedAt`/sitemap | Conferido. |
| `docs/bloco-s14-auditoria-dados-turisticos-publicos.md` | Data 2026-07-03; registra dados turisticos e pendencias de validacao humana | Conferido. |

## 11. Problemas encontrados

Nenhum bug bloqueante encontrado nos blocos recentes.

Observacoes:

1. Chatbot/Mathe nao aparece na home publicada por regra existente de remocao/ocultacao. Como a tarefa era validacao, nao foi reativado.
2. `/sabores#erva-mate` aponta para uma ancora invisivel especial; a navegacao funciona, mas nao ativa filtro visual proprio porque nao ha filtro `erva-mate` na barra. Mantido como comportamento existente.
3. A checagem HTTP no sandbox falhou por SSL, mas fora do sandbox retornou 200 para todas as rotas.
4. Os audits atualizaram relatorios gerados em `docs/auditoria-output/` e o Git avisou sobre futura conversao LF/CRLF nesses arquivos.

## 12. Correcoes feitas

Nenhuma correcao de codigo foi feita.

Arquivos criados/alterados intencionalmente nesta rodada:

- `docs/bloco-s15-validacao-geral-pos-blocos.md`
- `docs/auditoria-output/assets-report.json`
- `docs/auditoria-output/assets-report.md`
- `docs/auditoria-output/links-report.json`
- `docs/auditoria-output/links-report.md`
- `docs/auditoria-output/project-report.json`
- `docs/auditoria-output/project-report.md`

## 13. Riscos e pendencias

- Validacao de portal/admin foi smoke sem login real; fluxos autenticados seguem dependentes de sessao/permissao Firebase e App Check em ambiente publicado.
- Convivencia visual mascote + Mathe nao foi validavel porque o Mathe esta oculto/removido no site publicado atual.
- `#erva-mate` em `sabores` funciona como ancora invisivel; se o objetivo futuro for filtro visual dedicado, isso deve entrar em bloco proprio.
- Relatorios de auditoria foram atualizados por scripts; se esses outputs nao devem entrar em commit futuro, decidir manualmente antes de publicar um PR.

## 14. Rollback

Como nao houve mudanca funcional:

1. Remover este documento S15 se a rodada precisar ser descartada.
2. Decidir se os arquivos gerados em `docs/auditoria-output/` devem ser mantidos como evidencia ou descartados em uma operacao Git autorizada.
3. Nenhum rollback de JS/CSS/HTML/rules/admin/portal e necessario, pois nada foi alterado nessas areas.

## 15. Proxima etapa recomendada

Abrir um bloco pequeno de decisao, nao implementacao imediata, para definir:

1. se o Mathe deve permanecer oculto com o mascote visual ou voltar como assistente separado;
2. se `sabores#erva-mate` deve ganhar filtro visual proprio;
3. se os relatorios gerados em `docs/auditoria-output/` devem ser versionados apos cada rodada de QA ou tratados como artefatos locais.
