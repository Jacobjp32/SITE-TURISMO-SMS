# Bloco 4C — CRUD admin inicial de Banners / Pop-ups (modo rascunho)

> **Pré-requisito:** Bloco 4B (Firestore Rules + Storage Rules de `banners`)
> commitado **e publicado** no Firebase. Worktree estava **limpo** no início.
> Nenhum commit foi feito nesta rodada. Nenhuma rule foi alterada.

---

## 1. O que foi implementado

Substituição do **placeholder** "Banners / Pop-ups" por um **módulo funcional**
em modo rascunho/lista, usando a collection `banners`.

Arquivos:

| Arquivo | Mudança |
|---|---|
| `js/admin/modules/banners.js` | **Novo.** Módulo real (IIFE, `window.AdminBannersModule`). |
| `js/admin/modules/placeholder.js` | Guard genérico: `register()` cede a um módulo real já registrado com o mesmo id (não entra em `placeholderIds`, logo `renderAll()` não sobrescreve a seção). |
| `admin-firebase.html` | `<script>` de `banners.js` **antes** de `placeholder.js`; hook em `showSection('banners')` chamando `AdminBannersModule.activate()`. |
| `scripts/smoke-banners.mjs` | **Novo.** Smoke test em Node (vm + stubs). |
| `.claude/launch.json` | **Novo.** Servidor estático local para validação visual no preview. |
| `docs/bloco-4c-crud-banners.md` | **Novo.** Este documento. |

### Como o placeholder foi substituído

O `AdminRegistry.register()` **não** permite duplicar id (rejeita o segundo).
A solução não mexe no contrato do registry:

1. `banners.js` é carregado **antes** de `placeholder.js` → o módulo **real**
   registra `banners` primeiro.
2. `placeholder.js` ganhou um guard: se `AdminRegistry.has(id)` já é verdadeiro,
   ele **não** registra aquele placeholder e **não** o adiciona a `placeholderIds`
   (então `renderAll()` nunca pinta "Em preparação" sobre `#section-banners`).

Resultado verificado no navegador: `AdminRegistry.get('banners').isPlaceholder === false`,
`AdminPlaceholderModule.list()` passou de 8 → **7** ids (sem `banners`), e os demais
placeholders continuam intactos.

---

## 2. Funcionalidades desta etapa

- **Listar** banners (admin lê todos) em tabela, ordenada por `updatedAt` desc.
- **Filtrar** por `status` (todos/draft/published/archived) e `type` (todos/banner/popup).
- **Criar rascunho** (`status` sempre `draft`).
- **Editar rascunho** (preserva `createdAt`/`createdBy`).
- **Arquivar** (`status='archived'`, com confirmação; não apaga).
- **Duplicar como rascunho** (novo id, título "(cópia)", sem `publishedAt`/`archivedAt`,
  sem copiar `imagePath`/`mediaId`).
- **Ver detalhes** (modal somente leitura).
- Estados de **loading / vazio / erro**.
- Botão **Publicar** exibido **desabilitado**. Sem botão de **upload**.

---

## 3. Schema usado no client (collection `banners`)

Espelha `docs/bloco-4-banners-popups.md` §2 e o `hasOnly` das rules (4B). O módulo
**só** envia chaves da lista permitida — campos extras nunca são gravados.

| Campo | Tipo | Origem no client |
|---|---|---|
| `id` | string | == doc id; `slug + sufixo base36` (criação). |
| `title` | string (≤120) | obrigatório. |
| `slug` | string (≤80) | gerado do título (criação); preservado na edição. |
| `description` | string (≤500) | opcional. |
| `type` | `banner`\|`popup` | obrigatório. |
| `status` | `draft`\|`archived` | **nunca** `published` nesta etapa. Criação = `draft`. |
| `placement` | enum | default `home`. |
| `targetPages` | array<string> | filtrado p/ páginas conhecidas (`index/eventos/mapa-turistico/sabores/noticias`). |
| `imageUrl` | string | **URL manual opcional** (sem upload). Validada. |
| `imageAlt` | string (≤160) | opcional. |
| `ctaLabel` / `ctaUrl` / `ctaTarget` | string / url / `_self`\|`_blank` | CTA opcional; URL validada. |
| `startAt` / `endAt` | timestamp\|null | `endAt > startAt` quando ambos. |
| `priority` | number 0–100 | default 50. |
| `frequency` | enum | default `always`. |
| `dismissible` | boolean | default `true`. |
| `showDelayMs` | number 0–60000 | default 0. |
| `maxWidth` | number 240–960\|null | opcional. |
| `createdAt`/`updatedAt` | serverTimestamp | criação seta ambos; edição só `updatedAt`. |
| `createdBy`/`updatedBy` | uid | `currentUser.uid`. `createdBy` imutável na edição. |
| `imagePath`/`mediaId` | string | **não** criados aqui; preservados se já existirem; **não** copiados ao duplicar. |
| `publishedAt`/`archivedAt` | timestamp | `archivedAt` setado ao arquivar. `publishedAt` nunca setado aqui. |

### Sanitização (defesa em profundidade — rules são a proteção real)

`trim`, limites de tamanho, enums restritos a valores válidos, `priority`/`showDelayMs`/`maxWidth`
como inteiros com limites, URL segura (rejeita `'"()\<>` e exige `http(s)`/caminho interno),
datas coerentes. **Nunca confiar só no client** — `firestore.rules` (4B) é o gate efetivo.

---

## 4. Limitações desta etapa (deliberado)

- **Publicar:** desabilitado (botão inerte). Status nunca vira `published`.
- **Upload de imagem / seleção de mídia:** não implementado (só `imageUrl` manual).
- **Exibição pública / pop-up no site:** não existe ainda.
- **Delete definitivo:** não implementado (as rules já bloqueiam `delete`; usar arquivar).

---

## 5. Como testar (manual, no admin real)

1. Login no admin (`admin-firebase.html`).
2. Sidebar → **Banners / Pop-ups**: não aparece mais "Em preparação"; mostra a tela do módulo.
3. Lista vazia → "Nenhum banner cadastrado ainda".
4. **Novo rascunho** → preencher título + tipo → **Criar rascunho**.
5. O rascunho aparece na lista com status **Rascunho**.
6. **Editar** → alterar e salvar.
7. **Duplicar** → surge "… (cópia)" como rascunho novo.
8. **Arquivar** (confirma) → status muda para **Arquivado**.
9. Filtrar por status e por tipo.
10. Conferir que **Publicar** está desabilitado e que não há **upload**.
11. Abrir Dashboard, outros placeholders e Eventos/Notícias/Mídia → seguem normais.
12. Console sem erro novo crítico (os erros de `AppCheck/ReCAPTCHA` em `localhost` são esperados e não relacionados).

### Validação automatizada já executada

- `node --check` em todos os JS afetados + script inline do `admin-firebase.html`: **OK**.
- `node scripts/smoke-banners.mjs`: **todos os checks ✅** (registro, substituição do
  placeholder, render sem Firebase, validações de rascunho, payload sempre `draft`,
  ausência de upload/delete).
- `node scripts/audit-links.mjs` → 0 quebrados; `audit-assets.mjs` → 0 faltantes;
  `audit-project.mjs` → OK.
- Preview no navegador real (`/admin-firebase.html`): módulo registrado, shell e
  empty-state renderizados, validações e `buildPayload` exercitados com sucesso.

> **Escrita real no Firestore durante os testes:** **não houve.** A validação foi
> estática + smoke + preview sem sessão admin autenticada. O fluxo de criação/edição
> de verdade deve ser exercido manualmente por um admin logado.

---

## 6. Erros comuns se as rules NÃO estiverem publicadas

- Carregar a lista lança `permission-denied` → o módulo mostra:
  *"As regras de banners ainda não parecem publicadas (ou seu usuário não é admin).
  Publique as Firestore Rules do Bloco 4B antes de usar este módulo."*
- Salvar/arquivar/duplicar com `permission-denied` → toast pedindo para verificar as
  rules 4B e o papel admin. A tela **não** quebra.

---

## 7. Riscos

- **R1 — Ordem de scripts:** `banners.js` precisa carregar **antes** de `placeholder.js`.
  Se invertido, o placeholder registra `banners` primeiro e o módulo real é rejeitado.
  (Mitigado pela ordem no HTML + guard genérico no placeholder.)
- **R2 — SW cacheando `.js`:** scripts novos usam `?v=admin-modular-20260626`. Se editar
  `banners.js` depois, **bump** o `?v=` para o SW não servir versão antiga.
- **R3 — Índice Firestore:** evitado — a lista usa `.get()` sem `orderBy`/`where` e ordena
  no client. Nenhum índice composto é exigido.
- **R4 — Convenção de status (en) vs CMS legado (pt):** mantida separada (`draft/published/archived`).

---

## 8. Rollback

Reverter sem afetar rules/auth:

1. Remover as duas linhas de `<script>`/hook em `admin-firebase.html`
   (tag de `banners.js` e o `if (section === 'banners') ...` em `showSection`).
2. Reverter o guard em `js/admin/modules/placeholder.js` (volta a registrar o
   placeholder `banners`).
3. (Opcional) apagar `js/admin/modules/banners.js`, `scripts/smoke-banners.mjs`,
   `.claude/launch.json` e este doc.

Como nada foi commitado, `git status` mostra exatamente os arquivos tocados; o rollback
é só desfazer essas edições (sem `git reset`/`git restore`, conforme restrições do bloco).

Documentos `banners` eventualmente criados em testes manuais permanecem na collection
`banners` (delete está bloqueado por rules) — podem ser **arquivados** pelo próprio módulo.

---

## 9. Rules — precisa publicar de novo?

- **Firestore Rules:** **não.** Nenhuma alteração; o módulo opera dentro do contrato 4B.
- **Storage Rules:** **não.** Esta etapa não faz upload.

---

## 10. Próxima etapa recomendada

**Bloco 4D — Upload / seleção de imagem** em `banners.js`, reusando `uploadImageToCms`
para `cms-media/{uid}/banners/{bannerId}/...` (rules 4B já cobrem). Depois **4E**
(preview + publicação/arquivamento com guard de imagem) e **4F** (script público na home).
