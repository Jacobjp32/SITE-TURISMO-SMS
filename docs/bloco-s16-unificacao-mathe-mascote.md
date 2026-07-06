# Bloco S16 — Unificação do Mathe no Mascote (assistente visual único)

**Data:** 2026-07-06
**Projeto:** SITE-TURISMO-SMS-mainv2
**Status:** implementado, **não commitado** (worktree limpo antes de começar).

## Decisão de produto

O mascote interativo (Capivara Pinhão) passa a ser o **único assistente visual** do site,
absorvendo a função útil que era do chatbot "Mathe": respostas rápidas pré-definidas e
encaminhamento ao Departamento de Cultura e Turismo.

- **Não** há dois assistentes concorrendo na interface.
- **Não** foi reativado o widget separado do Mathe.
- **Não** há IA/chat livre nem chamada a API/Worker externo nesta etapa.
- O mascote **não** virou IA completa: continua leve, com atalhos + dicas + agora uma
  seção estática de **"Ajuda rápida"**.

## Estado anterior do Mathe (chatbot)

- `js/chatbot.js` **já não era carregado por nenhuma página** — não existe
  `<script src="js/chatbot.js">` em nenhum HTML público. O arquivo só era referenciado em
  `sw.js` (precache) e no inventário `js/data/turismo-data.js`.
- Ou seja, o Mathe **já estava efetivamente desativado** em produção. Havia defesas
  redundantes (cinto e suspensório), que foram **mantidas** por segurança:
  - `index.html` — `window.__smsChatbotDisabled = true` + remoção de `#chatbot-widget`;
  - `js/nav-shared.js` — remove `#chatbot-widget, #chatbot-styles` nas páginas secundárias;
  - `css/index.css` (linhas ~256 e ~6003) — `#chatbot-widget, #chatbot-styles { display:none }`.
- **Nenhuma chamada ao Cloudflare Worker** (`turismo-sms-chat-proxy.imprensapmsms.workers.dev`)
  acontecia, pois o script nunca inicializava. Confirmado na validação de rede (nenhuma
  requisição ao `workers.dev`).
- Conteúdo útil do Mathe (respostas por gatilho de palavra) foi a base para as respostas
  estáticas da "Ajuda rápida" — sem copiar o mecanismo de chat.

## Estado anterior do mascote (S12)

Launcher fixo no canto inferior esquerdo → painel com **mensagem contextual por página** +
**"Atalhos rápidos"** (Mapa, Eventos, Sabores, Onde ficar, Contato) + link "Ocultar guia".
i18n via `translations.js` (chaves `mascot-*`) com fallback PT-BR embutido no próprio JS.
A11y completa (ESC, foco visível, aria, `prefers-reduced-motion`). `localStorage` lembra
ocultar/teaser. Carregado em 8 páginas.

## Alterações feitas

### `js/tourism-mascot.js`
- Novos textos de fallback (`STR`) em PT/EN/ES/PL: `helpLabel`, `helpNote` e `help.{mapa,
  eventos, comer, ficar, contato}.{q,a}`.
- Nova seção **"Ajuda rápida"** no painel (accordion), abaixo dos atalhos: 5 perguntas que
  expandem uma resposta curta + link útil, e uma nota "não encontrou? fale com Cultura e
  Turismo".
- Helper `helpItem()` que monta cada item; o texto da pergunta fica num `<span>` próprio
  (`.sms-help-q-text`) com `data-lang-key` — isto preserva o chevron quando
  `applyTranslations` reescreve o `innerHTML` do elemento traduzido.
- `bindEvents`: delegação de clique na lista; `toggleHelp()` alterna `aria-expanded` e o
  atributo `hidden` da resposta. **Abertura única**: abrir uma pergunta recolhe as demais
  (mantém o painel baixo no mobile).

### `css/tourism-mascot.css`
- Estilos discretos do accordion (`.sms-mascot-help`, `.sms-help-q`, `.sms-help-chevron`,
  `.sms-help-a`, `.sms-help-link`, `.sms-mascot-help-note`), no mesmo tema verde/areia.
- Painel agora com `max-height: calc(100dvh - 130px)` + `overflow-y: auto` para caber e
  rolar internamente quando o conteúdo cresce.
- Mapa mobile (`body.map-page-body`, ≤768px): painel passa a abrir **para baixo**
  (`top: 56px; bottom: auto; max-height: calc(100dvh - 220px)`), evitando estourar o topo,
  já que ali o mascote fica no alto.
- `prefers-reduced-motion`: incluídos `.sms-help-q` e `.sms-help-chevron`.

### `translations.js`
- Novas chaves `mascot-help-label`, `mascot-help-q-*` / `mascot-help-a-*` (mapa, eventos,
  comer, ficar, contato) e `mascot-help-note` nos 4 idiomas (PT/EN/ES/PL). Nenhuma chave
  existente foi alterada.

### `sw.js`
- Removido `js/chatbot.js` do `PRECACHE_ASSETS` (asset morto, nunca carregado em runtime).
- `CACHE_NAME` `turismo-sms-v19` → `turismo-sms-v20`.

### 8 páginas HTML (cache-bust)
`index, mapa-turistico, sabores, eventos, noticias, onde-ficar, o-que-fazer, local`:
apenas o parâmetro de versão do `<link>`/`<script>` do mascote foi atualizado
(`?v=mascot-s12-20260702` / `?v=mascot-map-polish-20260702b` → `?v=mascot-s16-20260706`).
**Nenhuma outra alteração de layout/conteúdo nessas páginas.**

### `js/site-meta.js`
- `updatedAt` `2026-07-02T10:30:00-03:00` → `2026-07-06T12:00:00-03:00` (o mascote ganha
  função global de assistente/ajuda rápida — componente global relevante).

### `docs/bloco-s16-unificacao-mathe-mascote.md`
- Este documento.

## `chatbot.js` ainda carrega? / Worker foi chamado?

- **`chatbot.js` não carrega** em nenhuma página (nunca carregou via `<script>`; agora
  também **não** é mais precache do SW).
- **Worker/API não foi chamado.** Confirmado na aba de rede do preview: nenhuma requisição
  a `turismo-sms-chat-proxy.imprensapmsms.workers.dev`.
- `js/chatbot.js` e `cloudflare-worker/chat-worker.js` foram **mantidos como legado inerte**
  (não apagados).

## Novas funções do mascote ("Ajuda rápida")

| Pergunta (PT) | Resposta curta | Link |
| --- | --- | --- |
| Onde encontro o mapa turístico? | Veja todos os atrativos no mapa, com filtros por categoria e rotas. | `/mapa-turistico.html` |
| Como vejo os eventos? | Confira a agenda cultural atualizada da cidade. | `/eventos/` |
| Onde comer? | Gastronomia polonesa, feiras e restaurantes locais. | `/sabores` |
| Onde ficar? | Hotéis no centro e pousadas rurais para a sua estadia. | `/onde-ficar` |
| Como falar com Cultura e Turismo? | Ligue para o Departamento de Cultura e Turismo: (42) 3532-4163. | `tel:+554235324163` |

Nota final: "Não encontrou? Fale com o Depto. de Cultura e Turismo."

> Sem dados inventados: telefone `(42) 3532-4163` e rotas de link já existiam no projeto
> (atalhos do próprio mascote / chatbot legado). Nenhum horário/endereço novo foi criado.

## i18n

- 4 idiomas (PT-BR / EN / ES / PL) em `translations.js` + fallback PT-BR embutido no JS.
- Verificado no preview: `applyTranslations('en'|'es'|'pl'|'pt')` atualiza rótulo, perguntas
  e nota; o **chevron sobrevive** à tradução (texto isolado em `.sms-help-q-text`).

## Acessibilidade

- Cada pergunta é um `<button>` com `aria-expanded` (alterna false/true) e `aria-controls`
  apontando para a resposta (`role="region"`), que usa o atributo `hidden`.
- Foco visível (`:focus-visible`) nos botões de pergunta e nos links de resposta.
- **ESC** continua fechando o painel e devolvendo o foco ao launcher (verificado).
- Foco não é preso (dialog não-modal). Imagem do mascote com `alt=""` (decorativa).
- `prefers-reduced-motion`: transições/rotações do accordion desativadas.

## Performance

- `js/chatbot.js` **removido do precache** do SW → o SW deixa de baixar/guardar um asset
  nunca usado.
- Nenhuma chamada a Worker/API externa; nenhuma biblioteca nova; nenhum asset novo.
- Accordion é HTML/CSS puro; init do mascote continua em `load` + `requestIdleCallback`.
- Painel com `max-height` + rolagem interna; mobile não estoura o topo (inclusive no mapa).

## Datas e horários — verificação (REGRA OBRIGATÓRIA)

**Campos verificados:** `sitemap.xml` (lastmod), `js/site-meta.js` (`updatedAt`), `config.js`,
textos visíveis de "última atualização", docs dos blocos, páginas públicas alteradas.

**Atualizado:**
- `js/site-meta.js` → `updatedAt = 2026-07-06T12:00:00-03:00`. Motivo: o mascote (componente
  **global** presente em 8 páginas) passa a oferecer a função de assistente/ajuda rápida;
  o rodapé "Portal atualizado em…" é o carimbo global do portal.

**NÃO atualizado (e por quê):**
- `sitemap.xml` (lastmod por página): **mantido**. A mudança é de UI/overlay compartilhado —
  o **conteúdo informativo** de cada página não mudou. Bumpar lastmod de 8+ páginas por um
  widget global inflaria indevidamente o sinal de frescor para SEO (mesma lógica do S12/S14).
- `config.js`: sem campo de data relevante; nada a alterar.
- Não há textos hardcoded de "última atualização" nas páginas (usam o rodapé dinâmico do
  `site-meta.js`).

## Validações executadas

```
node --check js/tourism-mascot.js   → OK
node --check js/chatbot.js           → OK
node --check js/nav-shared.js        → OK
node --check js/site-meta.js         → OK
node --check translations.js         → OK
node --check config.js               → OK
node --check sw.js                   → OK

node scripts/audit-links.mjs   → 734 links, 0 broken, 1 falso-positivo conhecido, 33 legado
node scripts/audit-assets.mjs  → 226 mídias, 0 duplicatas, 0 referências quebradas
node scripts/audit-project.mjs → 432 arquivos (36 html, 24 css, 47 js)
```

> Os audits regeneram arquivos em `docs/auditoria-output/`. Conforme regra do projeto, **não
> devem ser commitados**; como este bloco não commita e a tarefa proíbe `git restore`/`git
> reset`, os arquivos ficam no worktree e devem ser descartados manualmente antes de qualquer
> commit.

## Validação manual (preview local, servidor estático)

- Home desktop: mascote aparece; Mathe **não** aparece como widget separado; painel abre;
  atalhos + "Ajuda rápida" corretos; cada pergunta expande/recolhe (abertura única).
- ESC fecha e devolve o foco ao launcher.
- i18n: PT/EN/ES/PL atualizam rótulo/perguntas/nota; chevron preservado.
- Rede: **nenhuma** chamada ao Worker/chat API.
- Mobile 375×812 (home): painel cabe na viewport (rola internamente); header visível.
- Mobile no mapa: painel abre para baixo e cabe, sem estourar o topo nem cobrir filtros.
- Console: apenas erros pré-existentes de Firebase AppCheck/reCAPTCHA no localhost
  (domínio-bound), nenhum do mascote.
- Admin/portal, hero/vídeo, mapa 3D, slugs e PDF/guia **não** foram tocados.

## Riscos

1. **Cache do SW (v20):** ao publicar, usuários recebem novo cache — comportamento normal de
   deploy. Sem risco funcional.
2. **Altura do painel no mobile:** com a base (5 atalhos + 5 perguntas) o painel é alto; foi
   mitigado com `max-height` + rolagem interna e, no mapa, abertura para baixo. Em telas
   muito baixas ainda pode exigir rolagem dentro do painel (aceitável).
3. **Defesas de ocultação do Mathe mantidas** em 3 arquivos: inofensivas, mas se um dia se
   quiser realmente remover `chatbot.js`, revisar essas defesas juntas.

## Rollback

Como nada foi commitado:
1. `git checkout -- js/tourism-mascot.js css/tourism-mascot.css translations.js sw.js js/site-meta.js`
   e as 8 páginas HTML (cache-bust) — reverte tudo ao estado S12/S15.
2. `docs/bloco-s16-unificacao-mathe-mascote.md` pode ser apagado ou mantido como histórico.
3. `js/chatbot.js` e `cloudflare-worker/chat-worker.js` não foram alterados — nada a reverter.

## Próxima etapa recomendada

1. Decidir se `js/chatbot.js` e o Worker devem ser formalmente **removidos** (limpeza de
   legado) em um bloco próprio, junto com as defesas de ocultação.
2. (Opcional) Arte oficial otimizada e leve do mascote (sprite ~64px) no lugar do webp de 149 KB.
3. (Opcional) Tornar o cabeçalho do painel "sticky" no mobile para não rolar junto quando o
   conteúdo é longo.
