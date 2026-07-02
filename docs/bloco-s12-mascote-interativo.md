# Bloco S12 — Mascote Interativo de Turismo

**Data:** 2026-07-02
**Status:** implementado, **não commitado** (worktree limpo antes de começar).

## Objetivo

Criar a **primeira versão leve** de um mascote interativo para o site de turismo de
São Mateus do Sul — inspirado em assistentes clássicos (Clippy), mas adaptado ao turismo.
Ajuda o visitante de forma discreta com **atalhos, dicas e mensagens contextuais por página**.

> **NÃO** é chatbot, **NÃO** usa IA, **NÃO** chama API externa. Sem Lottie/WebGL/vídeo/bibliotecas.

## Coexistência com o chatbot "Mathe"

O site **já possui** um chatbot ("Mathe", `js/chatbot.js`) fixo no **canto inferior direito**,
que chama um Cloudflare Worker externo. Ele **não foi tocado**.

Para evitar sobreposição, o mascote foi posicionado no **canto inferior ESQUERDO**.
São dois componentes distintos e independentes. Ver *Riscos* abaixo.

## Asset escolhido

- **`images/mascotes/MASCOTE_CAPIVARA_PINHAO.webp`** (149 KB, 1200 px) — versão webp leve
  do mascote "Capivara Pinhão", que representa a fauna local + o pinhão da araucária.
- Já existia no projeto (usado na seção de mascotes da home e na galeria).
- **Fallback visual:** se a imagem não carregar, o launcher mostra o emoji `🌿` (via `onerror`).
- Não foi criada arte nova. Uma arte oficial/otimizada dedicada (sprite pequeno ~64px) fica
  como melhoria futura — hoje reaproveitamos o webp existente.

## Arquivos criados

| Arquivo | Função |
| --- | --- |
| `js/tourism-mascot.js` | Lógica do mascote (injeção, estados, i18n, a11y, preferências). |
| `css/tourism-mascot.css` | Estilo isolado do componente. |
| `docs/bloco-s12-mascote-interativo.md` | Esta documentação. |

## Arquivos alterados

| Arquivo | Alteração |
| --- | --- |
| `index.html` | + `<link>` css no `<head>` e `<script defer>` antes de `</body>`. |
| `mapa-turistico.html` | idem |
| `sabores.html` | idem |
| `eventos.html` | idem |
| `noticias.html` | idem |
| `onde-ficar.html` | idem |
| `o-que-fazer.html` | idem |
| `local.html` | idem |
| `translations.js` | + 21 chaves de i18n por idioma (PT/EN/ES/PL) — bloco `MASCOTE INTERATIVO`. |
| `sw.js` | cache `v18`→`v19`; precache de `js/tourism-mascot.js`, `css/tourism-mascot.css` e `MASCOTE_CAPIVARA_PINHAO.webp`. |
| `js/site-meta.js` | `SITE_META.updatedAt` → `2026-07-02T10:30:00-03:00` (feature global do portal). |

Cache-bust usado: `?v=mascot-s12-20260702`.
**Sem duplicação de lógica inline**: toda a lógica está nos 2 arquivos externos; cada página
só recebe 2 tags (link + script).

## Páginas integradas (8)

home, mapa-turístico, sabores, eventos, notícias, onde-ficar, o-que-fazer, local.

**Não integrado** (fora de escopo): admin, portal-usuário, galeria, transparência, reservas,
para-o-trade, roteiro-ia, mapa-3d, mapa-completo, rotas-completas, noticia, 404, offline.

## Comportamento

- Launcher circular fixo no canto inferior esquerdo (60px desktop / 50px mobile).
- Clique abre um **painel** com: mensagem contextual + **atalhos rápidos** + fechar (×) +
  link "Ocultar guia".
- **Balão de fala (teaser):** aparece **uma única vez** (após 3,5s), some sozinho em 9s ou ao
  interagir. Não é invasivo e nunca reaparece depois (`localStorage`).
- Fecha ao: clicar no ×, pressionar **ESC**, ou clicar fora do componente.
- "Ocultar guia" → esconde o mascote e deixa um **mini botão de reabrir** (🌿) discreto.

### Atalhos disponíveis
1. 🗺️ Mapa Turístico → `/mapa-turistico.html`
2. 📅 Eventos → `/eventos/`
3. 🍽️ Sabores locais → `/sabores`
4. 🛏️ Onde ficar → `/onde-ficar`
5. ☎️ Fale com Cultura e Turismo → `tel:+554235324163` (config: (42) 3532-4163)

### Mensagens contextuais (PT)
| Página | Mensagem |
| --- | --- |
| Home | Olá! Quer começar pelo mapa turístico? |
| Mapa | Use os filtros para encontrar atrativos. |
| Sabores | Explore gastronomia, feiras e restaurantes. |
| Eventos | Confira a programação atualizada. |
| Notícias | Veja as últimas novidades da cidade. |
| Onde ficar | Encontre hotéis e pousadas para sua estadia. |
| O que fazer | Descubra rotas e experiências pela cidade. |
| Local | Você pode traçar rota até este ponto. |
| (fallback) | Posso ajudar você a explorar São Mateus do Sul. |

## Acessibilidade

- Launcher é `<button>` com `aria-label` (traduzível), `aria-haspopup="dialog"`,
  `aria-expanded` e `aria-controls`.
- Painel: `role="dialog"` + `aria-modal="false"` + `aria-labelledby` (título).
- **Foco** move para o botão fechar ao abrir; volta ao launcher ao fechar por ×/ESC.
- **Não prende o foco** (Tab pode sair livremente) — dialog não-modal.
- **ESC** fecha o painel.
- Navegação por teclado (botões e links nativos).
- `:focus-visible` com contorno verde visível.
- `@media (prefers-reduced-motion: reduce)` desativa transições/animações e o hover-scale.
- No mobile ocupa pouco espaço (50px) e não sobrepõe conteúdo nem o botão "voltar ao topo".

## i18n

- 4 idiomas (PT-BR / EN / ES / PL) via `translations.js` (chaves `mascot-*`).
- Elementos usam `data-lang-key`, `data-lang-key-aria-label`; após injeção o mascote chama
  `window.applyTranslations(lang)`. Trocas de idioma do portal atualizam o mascote
  automaticamente (elementos já estão no DOM).
- **Fallback:** o próprio `tourism-mascot.js` embute os textos PT-BR; se `translations.js`
  não estiver disponível numa página, o PT-BR permanece. Todas as 8 páginas integradas
  carregam `translations.js`, então há tradução dinâmica completa.

## localStorage / preferência

| Chave | Uso |
| --- | --- |
| `sms-mascot-hidden` | `'true'` se o visitante clicou em "Ocultar guia" → só mostra o mini botão de reabrir; não reabre o painel sozinho. |
| `sms-mascot-teaser` | `'true'` após o balão de fala aparecer uma vez → não repete. |

Reusa `sms-lang` (idioma escolhido) — não cria chave nova de idioma.

## Performance

- **1 imagem webp leve (149 KB)**, sem vídeo, sem bibliotecas externas.
- Launcher é `position: fixed` → **não afeta layout nem LCP** da home.
- Inicialização em `window.load` + `requestIdleCallback` (timeout 2,5s) → não compete com
  recursos críticos (hero/vídeo).
- Injeção única (guardas contra dupla execução); listeners globais (ESC/clique-fora)
  registrados **uma vez**.
- Falha em silêncio (`try/catch`) se algo não carregar.
- Compatível com o CSP das páginas (`script-src 'self'`, `img-src 'self'`, `style-src 'self'
  'unsafe-inline'`): tudo é local.

## Datas / horários — verificação (REGRA OBRIGATÓRIA)

**Campos verificados:** `sitemap.xml` (lastmod), `js/site-meta.js` (`SITE_META.updatedAt`),
`config.js`, textos visíveis de "última atualização" e docs.

**Atualizado:**
- `js/site-meta.js` → `updatedAt = 2026-07-02T10:30:00-03:00`. Motivo: o rodapé "Portal
  atualizado em…" é o carimbo **global** do portal e este bloco adiciona uma feature
  interativa **em todo o site**.

**NÃO atualizado (e por quê):**
- `sitemap.xml` (lastmod por página): **mantido em 2026-06-29**. O mascote é um componente de
  *chrome*/overlay compartilhado (análogo ao nav-shared e ao chatbot) — o **conteúdo
  informativo** de cada página não mudou. Bumpar lastmod de 8+ páginas por um widget global
  inflaria indevidamente o sinal de frescor para SEO.
- `config.js`: sem campos de data; nada a alterar.
- Não há textos hardcoded de "última atualização" nas 8 páginas (usam o rodapé dinâmico do
  `site-meta.js`).

## Validações executadas

```
node --check js/tourism-mascot.js   → OK
node --check js/nav-shared.js        → OK
node --check translations.js         → OK
node --check config.js               → OK
node --check sw.js                   → OK
node --check js/site-meta.js         → OK
node scripts/audit-links.mjs   → 682 links, 0 broken, 1 falso-positivo conhecido
node scripts/audit-assets.mjs  → 226 mídias, 0 duplicatas, 0 referências quebradas
node scripts/audit-project.mjs → 422 arquivos, 36 html, 24 css, 47 js
```

## Validação manual (preview local)

- Home desktop: mascote aparece discreto no canto inferior esquerdo; abre/fecha painel;
  atalhos corretos; ESC fecha e devolve foco; troca PT↔EN atualiza título/mensagem/aria.
- Ocultar → mini botão de reabrir → restaura o mascote e reabre o painel.
- `local.html`: mensagem contextual correta ("Você pode traçar rota até este ponto.").
- Mobile (375×812): launcher 50px, **sem sobreposição** com o botão "voltar ao topo"
  (folga de ~12px) nem com o chatbot (canto direito).
- Console: **nenhum erro do mascote** (apenas erros pré-existentes de Firebase AppCheck no
  localhost).
- Chatbot (direita), VLibras e hero/vídeo intactos; admin/portal e mapa 3D não tocados.

## Riscos

1. **Dois assistentes na tela** (chatbot Mathe à direita + mascote à esquerda). Funcionam, mas
   convém decidir com o cliente se convergem no futuro (ex.: mascote vira o "rosto" do chatbot).
2. **Asset de 149 KB** para um ícone pequeno — aceitável (webp, fixed, fora do LCP), mas uma
   arte dedicada leve melhoraria ainda mais.
3. Banner de cookies/consent ocupa o rodapé no primeiro acesso e pode cobrir temporariamente o
   mascote no mobile até ser aceito (comportamento aceitável; consent tem prioridade).

## Rollback

1. Remover as 2 tags (`<link ... tourism-mascot.css>` e `<script ... tourism-mascot.js>`) das 8
   páginas.
2. Apagar `js/tourism-mascot.js` e `css/tourism-mascot.css`.
3. Reverter o bloco `MASCOTE INTERATIVO` em `translations.js`.
4. Reverter `sw.js` (`v19`→`v18` e remover os 3 precache) e `js/site-meta.js` (`updatedAt`).
5. `docs/bloco-s12-mascote-interativo.md` pode ser mantido como histórico.

Como nada foi commitado, `git checkout -- <arquivo>` reverte os alterados e basta apagar os
novos.

## Próxima etapa recomendada

Conforme a ordem do usuário: **URLs bonitas/slugs**, depois **tema sazonal/clima mais marcante**.
Para o mascote em si: (a) decidir a convivência/convergência com o chatbot Mathe; (b) arte
oficial otimizada; (c) possíveis dicas contextuais mais ricas por página.
