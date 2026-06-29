# Bloco 4E — Publicação / despublicação controlada de Banners / Pop-ups (admin)

> **Pré-requisitos:** Blocos 4B (rules publicadas), 4C (CRUD admin) e 4D (upload) já
> implementados e commitados. Worktree estava **limpo** no início. **Nada foi commitado**
> nesta rodada. **Nenhum dado real** foi gravado no Firestore/Storage durante os testes.
>
> **Escopo:** apenas **publicação/despublicação no ADMIN**. **Não** há exibição pública
> de banner/pop-up no site (isso é o Bloco 4F).

---

## 1. O que foi implementado

Habilitação da ação **Publicar / Despublicar** de banners no painel admin, controlando o
campo `status` da collection `banners`:

- botão **Publicar** deixou de ser sempre `disabled`: aparece **habilitado** quando o
  rascunho cumpre os requisitos, e **desabilitado com motivo** (tooltip) quando não cumpre;
- ação **Publicar**: pede confirmação, muda `status` para `published`, grava `publishedAt`,
  atualiza `updatedAt`/`updatedBy`;
- ação **Despublicar**: `published → draft`, com confirmação, atualiza `updatedAt`/`updatedBy`
  e **preserva** `publishedAt`;
- **arquivar** ganhou confirmação reforçada quando o banner está publicado;
- **duplicar** continua nascendo `draft` (sem `publishedAt`/`archivedAt`);
- **lista** com ações contextuais por status e badge de status já existente;
- **detalhes** mostram aptidão de publicação (o que falta), `publishedAt`, `archivedAt`,
  responsável e botões contextuais.

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `js/admin/modules/banners.js` | Publicar/despublicar, `getPublishBlockers`, `buildTransitionPayload`, ações contextuais na lista e nos detalhes. |
| `admin-firebase.html` | `?v=` do script `banners.js` atualizado (`admin-banners-4e-20260629`) para evitar cache do SW. |
| `scripts/smoke-banners.mjs` | Smoke test expandido com contratos 4E. |
| `docs/bloco-4e-publicacao-banners.md` | **Novo.** Este documento. |

> **Firestore Rules e Storage Rules NÃO foram alteradas neste bloco.**

---

## 2. Transições de status

```
              publish()                     archive()
   draft  ───────────────►  published  ───────────────►  archived
     ▲                          │                            │
     │       unpublish()        │         archive()          │
     └──────────────────────────┘◄───────────────────────────┘
                          (draft ← published)

   archived ──(somente via duplicate())──►  novo draft (cópia)
```

| Transição | Função | status final | Campos de tempo |
|---|---|---|---|
| Publicar | `publish()` | `published` | grava `publishedAt`; atualiza `updatedAt`/`updatedBy` |
| Despublicar | `unpublish()` | `draft` | preserva `publishedAt`; atualiza `updatedAt`/`updatedBy` |
| Arquivar | `archive()` | `archived` | grava `archivedAt`; preserva `publishedAt`; atualiza `updatedAt`/`updatedBy` |
| Duplicar | `duplicate()` | `draft` (cópia) | **não** copia `publishedAt`/`archivedAt` |

- **Archived não pode ser publicado diretamente** (precisa duplicar como rascunho).
- Status arbitrário em `buildTransitionPayload` cai para `draft` (defesa contra status fora do enum).

---

## 3. Campos gravados ao publicar

`buildTransitionPayload(item, uid, 'published')` monta o payload **completo** (o `set()`
sobrescreve o documento) usando **apenas** campos da lista `bannerFieldsAllowed` (rules 4B):

| Campo | Valor ao publicar |
|---|---|
| `status` | `'published'` |
| `publishedAt` | `serverTimestamp()` |
| `updatedAt` | `serverTimestamp()` |
| `updatedBy` | `currentUser.uid` |
| `createdAt` / `createdBy` | preservados (imutáveis nas rules) |
| demais campos (`title`, `slug`, `type`, `placement`, `targetPages`, `imageUrl`, `imageAlt`, `ctaLabel`, `ctaUrl`, `ctaTarget`, `startAt`, `endAt`, `priority`, `frequency`, `dismissible`, `showDelayMs`, `maxWidth`) | preservados/sanitizados a partir do documento atual |
| `imagePath` / `mediaId` / `imageUpdatedAt` / `imageUpdatedBy` | preservados **se já existirem** (não inventados) |

### Por que `publishedBy` NÃO é gravado

`publishedBy` **não** consta em `bannerFieldsAllowed` (`firestore.rules`). A lista usa
`hasOnly([...])`, então qualquer campo fora dela causa `permission-denied`. Gravar
`publishedBy` quebraria a escrita. Como o briefing pede gravá-lo **somente se permitido**,
ele foi **omitido**. O responsável fica registrado em `updatedBy` (e em `publishedAt`
fica o momento). Caso se queira `publishedBy` no futuro, será necessário adicioná-lo ao
`hasOnly` e republicar as rules (fora do escopo deste bloco).

---

## 4. Requisitos que bloqueiam a publicação

`getPublishBlockers(item)` espelha `isValidBannerPublished` das rules 4B (defesa em
profundidade — as rules continuam sendo o gate real). Retorna lista de motivos; vazia = apto.

| Requisito | Bloqueia se… |
|---|---|
| `title` | vazio |
| `type` | diferente de `banner`/`popup` |
| `status` | diferente de `draft` (ex.: `archived` não publica direto) |
| imagem | `imageUrl` **e** `mediaId` vazios |
| destino | `placement` vazio **e** `targetPages` vazio |
| `ctaUrl` | preenchido porém inválido (não é http(s)/caminho interno seguro) |
| período | `startAt` e `endAt` definidos com `endAt <= startAt` |
| `priority` | preenchida e não-numérica |

**Avisos que NÃO bloqueiam** (`getPublishWarnings`): `imageAlt` ausente → alerta de
acessibilidade exibido na confirmação e nos detalhes, mas a publicação prossegue.

---

## 5. Comportamento do botão Publicar

- **draft apto** → botão `Publicar` **habilitado** (primário) na lista e nos detalhes.
- **draft inapto** → botão `Publicar` **desabilitado** com `title` (tooltip) listando o que falta.
- **published** → não há botão Publicar; aparece **Despublicar**.
- **archived** → não há botão Publicar (apenas Detalhes e Duplicar como rascunho).
- Ao clicar em Publicar: `window.confirm` (com recomendação de alt, se faltar). Se a
  validação local falhar, mostra `toast` de erro e **não** grava `published`.

### Ações contextuais na lista

| Status | Ações exibidas |
|---|---|
| `draft` | Editar · Publicar (apto) / Publicar-disabled (inapto) · Duplicar · Arquivar · Detalhes |
| `published` | Despublicar · Duplicar · Arquivar · Detalhes |
| `archived` | Detalhes · Duplicar (como rascunho) |

---

## 6. Despublicar

- Disponível só para `published`. Pede confirmação.
- `status → draft`, atualiza `updatedAt`/`updatedBy`.
- **Preserva** `publishedAt` (histórico de quando foi publicado).
- **Não** apaga imagem nem arquiva automaticamente.

## 7. Arquivar banner publicado

- Confirmação **reforçada**: avisa que o banner está PUBLICADO e que arquivar o tira de
  publicação imediatamente.
- `status → archived`, grava `archivedAt`, preserva `publishedAt`.
- Não deleta documento; não apaga imagem do Storage.

## 8. Duplicar banner publicado

- A cópia nasce **sempre** `draft`.
- **Não** copia `publishedAt`/`archivedAt`/`imagePath`/`mediaId`/`imageUpdatedAt`/`imageUpdatedBy`.
- `imageUrl` é copiada (aponta para o mesmo arquivo; aceitável). A cópia não é publicada automaticamente.

---

## 9. Segurança no client

- O client envia **apenas** campos da lista permitida (`buildTransitionPayload` é fechado).
- Status é normalizado por `inEnum(..., STATUSES, 'draft')` → status arbitrário vira `draft`.
- Publicação exige `getPublishBlockers().length === 0` antes de gravar.
- **Não se confia só no client:** `firestore.rules` (4B) continua sendo a proteção real
  (`isValidBannerUpdate` + `isValidBannerPublished` + `hasOnly`).

---

## 10. Rules — precisa publicar de novo?

| Rules | Precisa republicar? | Motivo |
|---|---|---|
| **Firestore Rules** | **Não** | Nenhuma alteração. `status: published`, `publishedAt` e `archivedAt` já são suportados pelo Bloco 4B. |
| **Storage Rules** | **Não** | Este bloco não toca em upload nem em `storage.rules`. |

> As rules do 4B/4D já publicadas cobrem integralmente a publicação. O bloco opera dentro
> do contrato existente.

---

## 11. Escrita real no Firestore/Storage durante os testes

**Não houve.** A validação foi estática (`node --check`) + smoke (sandbox `vm`, sem
Firebase) + audits. O fluxo de publicação/despublicação real deve ser exercido manualmente
por um admin logado (ver §13).

---

## 12. Validações executadas

- `node --check` nos 12 arquivos JS do briefing: **todos OK**.
- `node scripts/smoke-banners.mjs`: **65/65 checks ✅** (contratos 4C + 4D + 4E).
- `node scripts/audit-links.mjs` → 653 links, **1 broken pré-existente** (sem novos), 17 candidatos legacy.
- `node scripts/audit-assets.mjs` → 225 mídias, **0 referências faltantes**.
- `node scripts/audit-project.mjs` → 392 arquivos (36 html, 22 css, 45 js) — OK.

> A alteração em `admin-firebase.html` foi **apenas** o `?v=` do `src` (atributo HTML),
> sem mexer em script inline — por isso não exigiu extração/`node --check` do inline.

---

## 13. Como testar manualmente (admin real)

1. Login no admin (`admin-firebase.html`).
2. Abrir **Banners / Pop-ups**.
3. Criar **rascunho incompleto** (sem imagem) → o botão **Publicar** aparece **desabilitado**;
   passar o mouse mostra o que falta. Em Detalhes, "Apto para publicação" lista os motivos.
4. Criar **rascunho completo** com imagem (upload ou URL) + posição.
5. Clicar **Publicar** → confirmar → status muda para **Publicado** na lista.
6. Clicar **Despublicar** → confirmar → status volta para **Rascunho** (`publishedAt` permanece nos detalhes).
7. **Publicar novamente** o rascunho.
8. **Arquivar** o banner publicado → confirmação reforçada → status **Arquivado**.
9. **Duplicar** o banner publicado → a cópia nasce como **Rascunho** (sem `publishedAt`).
10. Confirmar que **nada aparece ainda no site público** (`index.html`, `eventos.html`, etc.).
11. Console sem erro crítico novo relacionado a banners.

---

## 14. Riscos

| Risco | Mitigação |
|---|---|
| Admin tenta publicar rascunho incompleto | Botão desabilitado + bloqueio em `publish()`; rules rejeitam de qualquer forma. |
| Editar banner publicado rebaixaria para draft | `Editar` não é exibido para `published` (lista e detalhes); fluxo correto é Despublicar → editar → Publicar. |
| `publishedBy` ausente confunde auditoria | Documentado; `updatedBy` registra o responsável; `publishedAt` registra o momento. |
| SW servindo `banners.js` antigo | `?v=admin-banners-4e-20260629` no script tag. |
| Banner publicado fora da janela `startAt/endAt` | A janela é responsabilidade do Bloco 4F (filtro no client público); aqui não há exibição pública. |

---

## 15. Rollback

Sem `git reset`/`git restore` (conforme restrições). Como nada foi commitado, reverter é
desfazer as edições:

1. Em `js/admin/modules/banners.js`: remover `publish`, `unpublish`, `getPublishBlockers`,
   `getPublishWarnings`, `buildTransitionPayload`, `detailsFooterButtons`; restaurar
   `buildArchivePayload` e o botão Publicar disabled na lista; reverter `viewDetails` e o
   texto do formulário (estado do commit `95232bc`, Bloco 4D).
2. Em `admin-firebase.html`: voltar o `?v=` para `admin-banners-4d-20260626`.
3. Em `scripts/smoke-banners.mjs`: reverter para a versão 4D.
4. Apagar este documento (opcional).

> Documentos `banners` publicados em testes manuais permanecem na collection (delete
> bloqueado por rules). Podem ser **despublicados** ou **arquivados** pelo módulo.

---

## 16. O que segue desabilitado / fora deste bloco

- **Exibição pública** de banner/pop-up no site (home e demais páginas) — **Bloco 4F**.
- **Delete definitivo** — rules bloqueiam; usar arquivar.
- **Limpeza de imagem órfã** no Storage ao trocar/arquivar — etapa futura.
- **`publishedBy`** — não gravado (campo não permitido nas rules).
- **Edição direta de banner publicado** — intencional; usar Despublicar antes.

---

## 17. Próxima etapa recomendada

**Bloco 4F — exibição pública**: script no site (home/páginas) que lê banners
`published` via `where('status','==','published')`, aplica a janela `startAt/endAt` e a
`frequency` no client, e renderiza banner/pop-up respeitando `placement`/`targetPages`,
`priority` e `dismissible`. Requer atenção a índice composto (`status==published` +
`orderBy('priority')`) e à CSP. Nada da exibição pública foi iniciado neste bloco.
