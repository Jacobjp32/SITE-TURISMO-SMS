# Bloco S17 - Filtro visual Erva-mate em Sabores

Data: 2026-07-06

## 1. Objetivo

Adicionar a opcao visual **Erva-mate** na barra de filtros da pagina publica
`/sabores`, preservando os hashes e filtros existentes:

- `/sabores#polonesa`
- `/sabores#erva-mate`
- `/sabores#feiras`
- `/sabores#restaurantes`

Nao foram alterados admin, Portal do Usuario, Firestore Rules, Storage Rules,
hero/video, mapa 3D, slugs/URLs limpas, PDF/guia ou dados turisticos.

## 2. Worktree antes do bloco

`git status --short` foi executado antes das edicoes e nao retornou arquivos
modificados. O Git exibiu apenas avisos de permissao ao acessar o ignore global
em `C:\Users\jacob\.config\git\ignore`.

## 3. Comportamento anterior

Em `sabores.html`, a `filter-nav` tinha quatro botoes:

- `Tudo` (`data-filter=""`)
- `Culinaria Polonesa` (`data-filter="polonesa"`)
- `Feiras e Produtores` (`data-filter="feiras"`)
- `Restaurantes` (`data-filter="restaurantes"`)

O script inline usava:

- `sections = ['polonesa', 'feiras', 'restaurantes']`
- `activateFilter(filterId, scroll)` para alternar `fnav-btn--active`,
  sincronizar `aria-pressed` e mostrar/ocultar apenas essas tres secoes.
- `handleHash(h, scroll)` tratava `#polonesa`, `#feiras` e `#restaurantes`
  como filtros visuais.
- `#erva-mate` era uma ancora especial: limpava o filtro para `Tudo` e rolava
  ate o elemento invisivel `.sabores-anchor` antes da secao `#produtor`.

Resultado: `/sabores#erva-mate` navegava para o conteudo correto, mas o botao
ativo continuava sendo `Tudo` porque nao havia filtro visual proprio.

## 4. Comportamento novo

Foi adicionado o botao:

- `Erva-mate` (`data-filter="erva-mate"`, `data-lang-key="sab-filtro-erva-mate"`)

O script agora cria `filterIds = sections.concat(['erva-mate'])`, entao
`handleHash()` reconhece `#erva-mate` como filtro visual. Ao clicar no botao ou
abrir `/sabores#erva-mate` diretamente:

- o hash `#erva-mate` e preservado;
- o botao Erva-mate recebe `fnav-btn--active`;
- `aria-pressed="true"` fica no botao Erva-mate;
- os botoes restantes ficam com `aria-pressed="false"`;
- as secoes historicas `#polonesa`, `#feiras` e `#restaurantes` sao ocultadas;
- a rolagem continua indo para a ancora `#erva-mate`, antes do bloco
  `Direto do Produtor`.

Os filtros existentes foram preservados em sua logica original: Polonesa,
Feiras e Restaurantes continuam atuando sobre as tres secoes historicas, sem
introduzir alteracao de dados ou novas secoes editoriais.

## 5. i18n

Nova chave criada em `translations.js`:

| Chave | PT-BR | EN | ES | PL |
| --- | --- | --- | --- | --- |
| `sab-filtro-erva-mate` | 🧉 Erva-mate | 🧉 Yerba Mate | 🧉 Yerba Mate | 🧉 Yerba Mate |

As chaves existentes foram mantidas:

- `sab-filtro-aria`
- `sab-filtro-tudo`
- `sab-filtro-polonesa`
- `sab-filtro-feiras`
- `sab-filtro-restaurantes`
- `sab-atalho-*`

## 6. Acessibilidade

- O novo botao usa `type="button"`.
- O texto visivel nao depende apenas do icone.
- O estado ativo usa `aria-pressed`.
- O grupo de filtros manteve `aria-label` traduzido por
  `data-lang-key-aria-label="sab-filtro-aria"`.
- O foco visivel continua vindo do estilo global existente.

## 7. Estilo e responsividade

O novo botao usa as classes existentes `.fnav-btn` e `fnav-btn--active`.

Em `css/sabores.css`, a barra local recebeu override pequeno para permitir
quebra responsiva de linha na pagina Sabores:

- `.main-content .filter-nav { flex-wrap: wrap; border-radius: 24px; }`
- no mobile, a barra deixa de depender de rolagem horizontal e pode quebrar em
  mais de uma linha.

## 8. Datas, horarios e campos verificados

| Arquivo/campo | Estado antes | Decisao |
| --- | --- | --- |
| `sitemap.xml` / `/sabores` `lastmod` | `2026-06-29` | Atualizado para `2026-07-06`, pois houve mudanca visivel/indexavel na navegacao da pagina publica. |
| `sitemap.xml` / demais URLs | datas variadas, majoritariamente `2026-06-29`; `/rotas-completas` em `2026-07-06` | Nao alteradas; fora do escopo. |
| `js/site-meta.js` / `updatedAt` | `2026-07-06T12:00:00-03:00` | Atualizado para `2026-07-06T15:22:50-03:00`, refletindo mudanca publica visivel. |
| `config.js` | datas de AgroSamas 2026 e configuracoes globais | Conferido; nao alterado porque nao controla este filtro. |
| `sw.js` / `CACHE_NAME` | `turismo-sms-v20` | Atualizado para `turismo-sms-v21`, porque `translations.js` esta no precache. |
| `sabores.html` | sem texto visivel proprio de ultima atualizacao | Conferido; mudanca limitada ao filtro e script inline. |
| docs S4B/S4C/S15 | registravam `#erva-mate` como ancora especial/invisivel | Conferidos; mantidos como historico. |

## 9. Validações executadas

Comandos executados:

- `node --check translations.js`
- `node --check js/nav-shared.js`
- `node --check js/site-meta.js`
- `node --check config.js`
- `node --check sw.js`
- extracao temporaria dos scripts inline de `sabores.html` para
  `C:\Users\jacob\AppData\Local\Temp\sabores-inline-scripts-s17.js`
- `node --check C:\Users\jacob\AppData\Local\Temp\sabores-inline-scripts-s17.js`
- `node scripts/audit-links.mjs`
- `node scripts/audit-assets.mjs`
- `node scripts/audit-project.mjs`

Resultados:

- JS externos: OK.
- Script inline de `sabores.html`: OK.
- Link audit: 734 links, 0 broken, 1 known false positives, 33 legacy/redundant candidates.
- Asset audit: 226 media, 0 duplicate groups, 0 missing references.
- Project audit: 433 files, 36 html, 24 css, 47 js.

Observacao: os audits regeneraram arquivos em `docs/auditoria-output/`.

## 10. Validacao manual recomendada

Ainda precisa ser feita em navegador real:

1. Abrir `/sabores`.
2. Testar `Tudo`.
3. Testar `Culinaria Polonesa`.
4. Testar `Erva-mate`.
5. Testar `Feiras e Produtores`.
6. Testar `Restaurantes`.
7. Abrir diretamente `/sabores#erva-mate`.
8. Confirmar que o botao Erva-mate fica ativo.
9. Confirmar que `#polonesa`, `#feiras` e `#restaurantes` seguem funcionando.
10. Testar mobile.
11. Testar PT/EN/ES/PL.
12. Confirmar que admin/portal nao foram alterados.
13. Confirmar que hero/video nao foram alterados.

## 11. Riscos

- `#erva-mate` continua apontando para a secao de produtores, nao para uma
  secao editorial exclusiva sobre erva-mate.
- O comportamento antigo dos filtros foi preservado: o bloco `Direto do
  Produtor` nao passa a ser ocultado pelos filtros Polonesa/Feiras/Restaurantes.
- Usuarios com service worker antigo podem precisar de recarregamento apos a
  ativacao do novo cache `turismo-sms-v21`.

## 12. Rollback

Reverter apenas:

- `sabores.html`
- `css/sabores.css`
- `translations.js`
- `sitemap.xml`
- `js/site-meta.js`
- `sw.js`
- `docs/bloco-s17-filtro-erva-mate-sabores.md`

Nao ha migracao de dados, rules, Firebase, admin, portal, slugs ou PDF.

## 13. Proxima etapa recomendada

Fazer a validacao visual/manual em desktop e mobile, incluindo troca de idioma
PT/EN/ES/PL, antes de publicar.
