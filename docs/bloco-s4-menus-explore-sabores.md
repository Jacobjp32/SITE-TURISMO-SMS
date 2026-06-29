# Bloco S4 - Menus Explore e Sabores

Data: 2026-06-29

## Escopo

Simplificacao dos menus publicos "Explore" e "Sabores", sem alterar hero/video, mapa 3D, painel admin, regras Firebase, sitemap ou URLs limpas.

## Worktree inicial

`git status --short` nao retornou arquivos alterados. O Git exibiu apenas avisos de permissao ao acessar o ignore global em `C:\Users\jacob/.config/git/ignore`.

## Estrutura anterior

### Explore

| Item | Destino | Observacao |
| --- | --- | --- |
| Mapa Turistico | `/mapa-turistico.html` | Pagina principal do mapa |
| Pontos Turisticos | `/mapa-turistico.html?grupo=pontos-turisticos` | Aplica grupo do mapa por query |
| Roteiros | `/mapa-turistico.html?grupo=roteiros` | Aplica grupo do mapa por query |
| Galeria | `/galeria` | Pagina real de galeria |
| Experiencias | `/mapa-turistico.html?grupo=roteiros` | Duplicava Roteiros |

### Sabores

| Item | Destino | Observacao |
| --- | --- | --- |
| Gastronomia Polonesa | `/mapa-turistico.html?categoria=Gastronomia` | Aplica categoria do mapa por query |
| Erva-mate | `/mapa-turistico.html?grupo=roteiros` | Reutiliza grupo de roteiros |
| Restaurantes | `/mapa-turistico.html?categoria=Gastronomia` | Duplicava Gastronomia Polonesa |
| Produtos Locais | `/mapa-turistico.html?categoria=Gastronomia` | Duplicava Gastronomia Polonesa |

## Estrutura nova

### Explore

| Item | Destino |
| --- | --- |
| Mapa Turistico | `/mapa-turistico.html` |
| Rotas | `/mapa-turistico.html?grupo=roteiros` |
| Galeria | `/galeria` |

### Sabores

| Item | Destino |
| --- | --- |
| Sabores locais | `/sabores` |

## Itens removidos do menu visual

- `Explore > Pontos Turisticos`
- `Explore > Experiencias`
- `Sabores > Gastronomia Polonesa`
- `Sabores > Erva-mate`
- `Sabores > Restaurantes`
- `Sabores > Produtos Locais`

## Links e filtros preservados

As URLs antigas nao foram removidas da logica do site. Continuam funcionando por acesso direto quando suportadas pelas paginas:

- `/mapa-turistico.html?grupo=pontos-turisticos`
- `/mapa-turistico.html?grupo=roteiros`
- `/mapa-turistico.html?categoria=Gastronomia`
- `/mapa-turistico.html?categoria=Hospedagem`
- `/mapa-turistico.html?categoria=Cultura`
- `/sabores#polonesa`
- `/sabores#feiras`
- `/sabores#restaurantes`

## Paginas e arquivos alterados

- `index.html`: menu estatico da home.
- `js/nav-shared.js`: menu compartilhado das paginas secundarias.
- `translations.js`: novo rotulo `nav-sabores-locais`.
- `docs/bloco-s4-menus-explore-sabores.md`: registro deste bloco.

## Acessibilidade

- `Explore` recebeu `aria-controls` apontando para o submenu correspondente na home e no nav compartilhado.
- O botao de `Explore` recebeu `aria-label` claro para leitores de tela.
- Links dentro do dropdown de `Explore` receberam `role="menuitem"`.
- `Sabores locais` virou link direto, evitando um submenu com apenas um item.
- A logica existente de `aria-expanded`, fechamento por `Escape`, clique externo, overlay e menu mobile foi preservada.

## i18n

Adicionada a chave `nav-sabores-locais` em PT-BR, EN, ES e PL. As chaves antigas foram mantidas para compatibilidade com outras paginas, filtros, rodapes ou conteudos legados.

## Sitemap

Nao houve alteracao de `sitemap.xml`. Nenhuma pagina foi apagada e nenhum link deixou de ter pagina real apenas por esta mudanca visual de menu.

## Como testar

### Desktop

1. Abrir a home.
2. Abrir o menu `Explore`.
3. Confirmar apenas `Mapa Turistico`, `Rotas` e `Galeria`.
4. Confirmar que `Sabores locais` aparece como link direto no header.
5. Clicar em `Mapa Turistico`, `Rotas`, `Galeria` e `Sabores locais`.

### Mobile

1. Abrir a home em largura mobile.
2. Abrir o hamburger.
3. Abrir `Explore` e confirmar os 3 itens.
4. Clicar em `Sabores locais` e confirmar fechamento/navegacao.
5. Repetir em uma pagina secundaria que usa `js/nav-shared.js`, como `mapa-turistico.html` ou `sabores.html`.

### Filtros diretos

1. Abrir `/mapa-turistico.html?grupo=pontos-turisticos`.
2. Abrir `/mapa-turistico.html?grupo=roteiros`.
3. Abrir `/mapa-turistico.html?categoria=Gastronomia`.
4. Abrir `/sabores#polonesa`, `/sabores#feiras` e `/sabores#restaurantes`.

## Riscos

- Usuarios acostumados aos atalhos especificos de `Pontos Turisticos`, `Gastronomia Polonesa`, `Restaurantes` e `Produtos Locais` deixam de ve-los no menu principal, embora os links diretos continuem ativos.
- A pagina `/sabores` e editorial; quem quiser abrir gastronomia ja filtrada no mapa ainda precisa de link direto ou cards internos.
- A validacao visual final depende de abrir o site em navegador, especialmente no menu mobile.

## Rollback

Reverter apenas as mudancas de `index.html`, `js/nav-shared.js`, `translations.js` e remover este documento. Nao ha migracao de dados, rules, sitemap ou dependencias envolvidas.

## Proxima etapa recomendada

Revisar o menu `Sobre`, que ainda possui itens apontando para o mesmo anchor `/#sobre`, e decidir se os atalhos gastronomicos antigos devem virar cards contextuais dentro de `/sabores` em vez de retornarem ao menu principal.
