# Bloco 4G — Exibição pública de pop-ups publicados no site

> **Pré-requisitos:** Blocos 4B (rules publicadas), 4C (CRUD), 4D (upload), 4E
> (publicação) e 4F (exibição pública de banners) já implementados.
> Worktree estava **limpo** no início. **Nada foi commitado** nesta rodada. **Nenhuma
> escrita** no Firestore/Storage (este bloco só **lê** itens publicados).
>
> **Escopo:** exibição pública de **pop-ups** (`type == 'popup'`) como modal central,
> reaproveitando o mesmo script, a mesma query e os mesmos filtros do Bloco 4F.

---

## 1. O que foi implementado

O carregador público `js/public-banners.js` agora, além de renderizar `type == 'banner'`
no slot discreto (4F), também exibe `type == 'popup'` publicado como **modal central**,
de forma não invasiva (no máximo 1 por carregamento), respeitando `status`, página,
período, prioridade, `showDelayMs`, `frequency`, `dismissible` e `maxWidth`.

- **Mesma leitura**: a query única `where('status','==','published')` alimenta banners
  **e** pop-ups; o `type` é filtrado no client. Nenhuma query extra.
- **Reaproveitamento**: `pageMatches`, `withinWindow`, `selectByType`, `safeUrl`,
  `esc`/`escAttr` são compartilhados entre banner e pop-up.
- **CSS**: estilos do modal adicionados ao **mesmo** `css/public-banners.css`.

### Arquivos criados

| Arquivo | Conteúdo |
|---|---|
| `docs/bloco-4g-popups-publicos.md` | **Novo.** Este documento. |

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `js/public-banners.js` | Adiciona seleção/frequência/delay/modal de pop-up (4G). Banner 4F intacto. |
| `css/public-banners.css` | Adiciona estilos `.public-popup__*` (modal, overlay, responsivo, dark, reduced-motion). |
| `scripts/smoke-public-banners.mjs` | Adiciona checks de pop-up; mantém todos os checks de banner (4F). |
| `index.html`, `eventos.html`, `mapa-turistico.html`, `sabores.html` | Apenas o cache-bust do `<script>` foi de `…4f-20260629` para `…4g-20260629`. |

> **Firestore Rules e Storage Rules NÃO foram alteradas.**

---

## 2. Como o pop-up é carregado

```
DOMContentLoaded → loadBanners()
  ├─ acha #public-banners-slot? (não → encerra silenciosamente)
  ├─ window.CONFIG.firebase existe? (não → encerra)
  ├─ ensureCss()  → injeta <link css/public-banners.css> uma vez
  ├─ import() Firebase app + firestore (gstatic 10.7.1) + App Check (best-effort)
  ├─ getDocs( query(collection('banners'), where('status','==','published')) )
  ├─ renderInto(slot, selectBanners(docs))     ← banners (4F)
  └─ maybeShowPopup( selectPopups(docs) )       ← pop-up (4G), MESMA leitura
```

`maybeShowPopup` percorre os pop-ups aptos (já filtrados/ordenados), pula os já vistos
conforme a frequência e agenda **o primeiro** elegível via `schedulePopup` (delay) →
`showPopup` (DOM). Como `loadBanners` exige o slot `#public-banners-slot`, o pop-up só
aparece nas mesmas 4 páginas já integradas no 4F.

---

## 3. Como filtra status / type / página / período

`selectPopups(docs)` chama `selectByType(docs, 'popup')`, que aplica os mesmos filtros do
banner:

- `status == 'published'` (a query já filtra; o client reforça — `draft`/`archived` nunca aparecem);
- `type == 'popup'`;
- `imageUrl` não vazio (sem imagem, não exibe);
- janela de período `withinWindow` (`startAt`/`endAt`);
- `pageMatches` (`placement` `all`/nomeado/`custom` + `targetPages`);
- ordenação por `priority` **desc**, depois `updatedAt` **desc**.

Diferença em relação ao banner: o pop-up **não** corta com `MAX_BANNERS`; em vez disso,
`maybeShowPopup` exibe no máximo **1** (`MAX_POPUPS = 1`) por carregamento.

---

## 4. Como funciona `frequency`

`normalizeFrequency()` aceita o schema do admin **e** apelidos curtos:

| Valor (admin / apelido) | Comportamento | Storage |
|---|---|---|
| `always` | Mostra sempre | nenhum |
| `oncePerSession` / `session` | 1× por sessão do navegador | `sessionStorage` |
| `oncePerDay` / `day` | 1× por dia | `localStorage` (guarda a data) |
| `oncePerCampaign` / `once` / `campaign` | 1× e não repete | `localStorage` (guarda `"1"`) |
| desconhecido | trata como `session` (conservador) | `sessionStorage` |

- Chave de storage: `sms_popup_<id do documento>`.
- `frequencyAllows(item)` decide **se pode** exibir; `markShown(item)` grava **quando**
  exibido (chamado dentro de `showPopup`).
- **Fallback seguro**: `safeStorage()` testa escrita real (modo privado/cookies bloqueados
  lançam exceção). Se o storage estiver indisponível, `frequencyAllows` retorna `true`
  (permite exibir) e `markShown` falha em silêncio — nunca quebra a página.

---

## 5. Como funciona `showDelayMs`

- `schedulePopup()` lê `showDelayMs` e passa por `clampDelay()`:
  - valores inválidos/negativos → `0` (mostra após o carregamento);
  - valores acima de **60000 ms** são limitados a 60000 (teto = `SHOW_DELAY_MAX` do admin),
    evitando delays absurdos;
- delay `0` → exibe imediatamente; delay `> 0` → `window.setTimeout`.

---

## 6. Como funciona `dismissible`

- O **botão de fechar (×) existe SEMPRE**, mesmo com `dismissible === false` — boas
  práticas de acessibilidade: o usuário nunca fica preso.
- Quando `dismissible !== false` (padrão): além do botão, **ESC** e **clique no overlay**
  (fora do card) também fecham.
- Quando `dismissible === false`: ESC e clique no overlay **não** fecham; apenas o botão ×
  fecha. Assim o pop-up é mais "firme", mas continua acessível.

---

## 7. Como funciona `maxWidth`

- `clampMaxWidth()` aplica faixa segura: mínimo **240 px**, máximo **960 px** (iguais aos
  limites do admin); valor inválido/ausente → padrão **520 px**.
- Aplicado inline no `.public-popup__card` (`style="max-width:<n>px"`). O CSS garante
  `width:100%` + `max-height` com rolagem interna e responsividade mobile.

---

## 8. Acessibilidade

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apontando para o `<h2>` do título
  (com fallback "Destaque" se o título estiver vazio).
- **ESC** fecha quando `dismissible` (capturado em `keydown`).
- **Foco inicial** no botão de fechar (preferência) ou no CTA.
- **Trap de Tab básico**: o Tab/Shift+Tab circula entre os focáveis do modal sem escapar.
- Ao fechar, o **foco anterior é restaurado** (`previouslyFocused.focus()`), sem quebrar a
  navegação da página.
- `@media (prefers-reduced-motion: reduce)` desliga as animações.

---

## 9. Como o CTA é tratado

- `ctaUrl` passa por `safeUrl()`: aceita `http(s)` e caminhos internos; rejeita
  `javascript:`, aspas, parênteses etc. → vira vazio.
- O link só é renderizado se `safeUrl` retornar URL não-vazia **e** houver `ctaLabel`.
- `ctaTarget == '_blank'` → adiciona `rel="noopener noreferrer"`.
- Clicar no CTA fecha o modal (sem atrapalhar a navegação do link).
- Textos (`title`, `description`, `ctaLabel`, `imageAlt`) escapados antes do DOM.

---

## 10. Como o erro de imagem é tratado

- Imagem é **opcional** no modal; sem `imageUrl` válido, o bloco de mídia simplesmente não
  é renderizado (o modal continua com título/descrição/CTA).
- Quando há imagem, `<img onerror>` **oculta apenas a imagem** se ela falhar — o modal
  permanece utilizável (não quebra).

---

## 11. Segurança

- Sem `innerHTML` com dado cru: textos via `esc`/`escAttr`, URLs via `safeUrl`.
- `SMSecurity` não é carregado nas páginas-alvo → o script traz fallback interno equivalente.
- Nenhum campo administrativo (`createdBy`, `imagePath`, etc.) vai ao DOM.
- Falha de Firestore/rede/App Check → `catch` silencioso, slot oculto, sem modal.

---

## 12. Rules — houve alteração?

**Não.** Nenhuma mudança em Firestore Rules ou Storage Rules.

| Rules | Precisa republicar? | Motivo |
|---|---|---|
| **Firestore Rules** | **Não** | A leitura pública de `status == 'published'` já cobre `type == 'popup'` (o Bloco 4B não distingue tipo na leitura). |
| **Storage Rules** | **Não** | Imagens de pop-up usam o mesmo `cms-media` já público; nada mudou. |

> A query continua só com `where('status','==','published')` (sem `orderBy`), então **não
> exige índice composto**.

---

## 13. Como testar manualmente

1. No admin, criar/editar um item com **Tipo = Pop-up (modal)**, imagem, `placement = home`,
   `frequency = always`, e **Publicar**.
2. Abrir a **home** pública → o modal aparece (após `showDelayMs`, se houver).
3. Fechar no **×** / **ESC** / **clique fora** → o modal some.
4. Recarregar:
   - `always` → reaparece;
   - `oncePerSession` → não reaparece na mesma aba/sessão (reaparece em nova sessão);
   - `oncePerDay` → não reaparece no mesmo dia;
   - `oncePerCampaign` → não reaparece (limpar `localStorage` para testar de novo).
5. Marcar `frequency` e limpar storage no DevTools (`localStorage`/`sessionStorage`,
   chaves `sms_popup_*`) para reexibir.
6. **Período**: `startAt` no futuro ou `endAt` no passado → não aparece.
7. **Página**: `placement = eventos` → aparece só em `eventos.html`.
8. **dismissible desligado**: ESC/clique-fora não fecham, mas o × fecha.
9. **CTA**: definir `ctaUrl`/`ctaLabel` → o botão navega (nova aba se `_blank`).
10. **Mobile**: card ocupa quase toda a largura; rolagem interna se for alto.
11. **Banner (4F)**: continua aparecendo normalmente no slot — sem regressão.
12. Console **sem erro crítico** (mensagens de App Check/ReCAPTCHA em localhost são esperadas).

---

## 14. Validações executadas

- `node --check js/public-banners.js` → OK; `config.js` → OK; `sw.js` → OK.
- `node scripts/smoke-public-banners.mjs` → **53/53 checks ✅** (4F + 4G).
- `node scripts/smoke-banners.mjs` (admin, regressão) → **OK ✅** (sem regressão).
- `node scripts/audit-links.mjs` → 663 links, **1 broken pré-existente** (não relacionado),
  18 candidatos *legacy* — **idêntico ao baseline do 4F** (sem novos achados).
- `node scripts/audit-assets.mjs` → 225 mídias, **0 referências faltantes**.
- `node scripts/audit-project.mjs` → 397 arquivos (36 html, 23 css, 46 js).

---

## 15. Limitações (deliberadas)

- Apenas **1** pop-up por carregamento (`MAX_POPUPS = 1`) — não invasivo.
- Pop-up só aparece nas 4 páginas com `#public-banners-slot` (index, eventos, mapa, sabores).
- Sem fila/sequência de múltiplos pop-ups; o de maior `priority` ganha.

---

## 16. Riscos

| Risco | Mitigação |
|---|---|
| Pop-up invasivo / repetitivo | `MAX_POPUPS = 1` + `frequency` + storage. |
| Usuário "preso" no modal | Botão × sempre presente, mesmo com `dismissible === false`. |
| Falha de Firestore/rede | `catch` silencioso; nenhum modal; banner também não quebra. |
| XSS via campos do pop-up | `esc`/`escAttr`/`safeUrl`; CTA perigoso descartado. |
| Storage indisponível (modo privado) | `safeStorage` testa escrita; fallback permite exibir sem quebrar. |
| SW servindo JS/CSS antigos | Cache-bust atualizado para `…4g-20260629` nas 4 páginas. |
| Delay absurdo | `clampDelay` (teto 60 s). |
| Layout do modal estourar a tela | `max-height` + rolagem interna + `clampMaxWidth`. |

---

## 17. Rollback

Sem `git reset`/`git restore` (conforme restrições). Como nada foi commitado:

1. Em `js/public-banners.js`, remover o bloco de pop-up (4G) e a chamada
   `maybeShowPopup(selectPopups(docs))` em `loadBanners` — o banner (4F) volta sozinho.
2. Em `css/public-banners.css`, remover a seção `Pop-up público — Bloco 4G`.
3. Reverter o cache-bust dos 4 HTML de `…4g-20260629` para `…4f-20260629` (opcional).
4. Reverter `scripts/smoke-public-banners.mjs` para a versão 4F (opcional).
5. Apagar este documento (opcional).

> Mesmo sem rollback completo, o pop-up falha em silêncio: sem documento `type == 'popup'`
> publicado, nada aparece.

---

## 18. Próxima etapa recomendada

- Adicionar slot/pop-up em `noticias.html` (já mapeada em `FILE_TO_PLACEMENT`), se desejado.
- Opcional: fila de múltiplos pop-ups ou rotação de banners.
- Opcional: métrica de impressão/fechamento (exigiria escrita → novas rules; fora do escopo atual).
