# Bloco 4B — Firestore Rules + Storage Rules para Banners / Pop-ups

> **Rodada de RULES.** Esta etapa altera apenas `firestore.rules`, `storage.rules`,
> `firebase.json` (registro das storage rules) e documentação. **Nenhum CRUD**, tela
> funcional, collection, documento ou upload foi criado. Worktree estava **limpo** no
> início. **Nada foi commitado.** Base de desenho: [`bloco-4-banners-popups.md`](bloco-4-banners-popups.md).

---

## 1. Resumo das rules aplicadas

### 1.1 Firestore (`firestore.rules`)

- Novos helpers (no escopo do `match /databases/{database}/documents`):
  `isBannerType`, `isBannerStatus`, `bannerFieldsAllowed`, `bannerHasImage`,
  `bannerHasPlacement`, `isValidBannerBase`, `bannerDatesOk`,
  `isValidBannerPublished`, `isValidBannerCreate(bannerId)`, `isValidBannerUpdate()`.
- Novo bloco `match /banners/{bannerId}`:
  - `allow read: if isAdmin() || resource.data.status == 'published';`
  - `allow create: if isValidBannerCreate(bannerId);`
  - `allow update: if isValidBannerUpdate();`
  - `allow delete: if false;` (sem exclusão definitiva nesta fase)
- O catch-all final `match /{document=**} { allow read, write: if false; }`
  permanece **inalterado**.
- Reutiliza o `isAdmin()` já existente (`role == 'admin'` em `usuarios/{uid}` + `ativo != false`).

### 1.2 Storage (`storage.rules`)

- `match /cms-media/{uid}/{fileName}` → `match /cms-media/{uid}/{allFiles=**}`
  (Opção A do plano: recursivo). Mantém leitura pública, escrita
  `validCmsImageUpload(uid)` e delete `isAdmin()`.
- Os demais matches (`submissions/...`) e o catch-all `{allPaths=**}` ficam inalterados.

### 1.3 `firebase.json`

- Adicionado o bloco `"storage": { "rules": "storage.rules" }`. Antes só `firestore`
  estava registrado, então o arquivo `storage.rules` existia mas **não era publicável**
  via `firebase deploy`. Sem essa entrada, o deploy de Storage Rules falharia.

---

## 2. Schema protegido (`banners/{bannerId}`)

Campos aceitos (`hasOnly` — qualquer campo fora desta lista é **negado**):

```
id, title, slug, description, type, status, placement, targetPages,
imageUrl, imagePath, imageAlt, mediaId, ctaLabel, ctaUrl, ctaTarget,
startAt, endAt, priority, frequency, dismissible, showDelayMs, maxWidth,
createdAt, updatedAt, createdBy, updatedBy, publishedAt, archivedAt
```

| Regra | Enforce |
|---|---|
| `type` ∈ `banner \| popup` | sim |
| `status` ∈ `draft \| published \| archived` | sim |
| `title` string não-vazia | sim (qualquer status) |
| `id == bannerId` | sim (create) |
| `createdBy == request.auth.uid` | sim (create) |
| `updatedBy == request.auth.uid` | sim (create e update) |
| `createdBy` imutável | sim (update: `== resource.data.createdBy`) |
| `createdAt` imutável | sim (update: `== resource.data.createdAt`) |
| `createdAt`/`updatedAt` são timestamp | sim (create) |
| `updatedAt` é timestamp | sim (update) |
| Coerência de datas (`endAt > startAt` quando ambos definidos) | sim |
| Publicar exige imagem **e** destino | sim (ver §3) |
| Campos extras | negado (`hasOnly`) |

### 2.1 Mínimo para `draft`

`id`, `title` (não-vazio), `type`, `status='draft'`, `createdBy`, `updatedBy`,
`createdAt`, `updatedAt`. Imagem, datas, CTA e destino podem ficar vazios.

### 2.2 Mínimo para `published`

Tudo do rascunho **mais**:
- imagem: `imageUrl` não-vazio **ou** `mediaId` não-vazio (`bannerHasImage`);
- destino: `placement` não-vazio **ou** `targetPages` não-vazio (`bannerHasPlacement`).

> `startAt`/`endAt` **não** são obrigatórios para publicar (decisão §4). A janela é
> opcional e filtrada no client.

---

## 3. Decisões tomadas

### 3.1 Por que leitura pública usa apenas `status == 'published'`
`draft` e `archived` não devem aparecer no site público. A rule libera leitura pública
somente para `published`; `draft`/`archived` caem no default-deny para anônimos/usuários
comuns. Admin lê tudo via `isAdmin()`.

> **Importante para queries:** a leitura pública precisa filtrar por `status` na própria
> query (`where('status','==','published')`). Uma `list` sem esse filtro é negada pela rule.

### 3.2 Por que a janela de datas fica no client
Comparar `startAt`/`endAt` de **cada** documento contra `request.time` numa operação de
`list` é frágil/inviável em rules (a rule é avaliada por documento, mas a query não tem
como provar a janela). Portanto a rule só garante **coerência** (`endAt > startAt` quando
ambos existem); a janela de exibição é aplicada no script público (Bloco 4F). Um banner
`published` fora da janela continua **legível** — aceitável, pois não há dado sensível.

### 3.3 Decisão sobre delete direto
**Negado** (`allow delete: if false`). A "remoção" padrão é `status='archived'`. Outras
collections do projeto usam `delete` por moderador/admin, mas banners ficam mais seguros
sem exclusão definitiva nesta fase. Exclusão real (com limpeza do Storage) fica para uma
etapa futura, quando houver fluxo de cascade para evitar mídia órfã.

### 3.4 Decisão sobre admin master
O projeto **ainda não tem** claim/role `master` enforced em rules (`isMaster()` é
cosmético no client). Portanto **não** há regra master-only aqui. Toda escrita usa
`isAdmin()`. Quando o enforcement de master existir, exclusão definitiva poderá ser
restrita a master.

### 3.5 Storage: Opção A (recursivo) vs Opção B (match dedicado)
Escolhida a **Opção A** (`cms-media/{uid}/{allFiles=**}`): cobre tanto os uploads atuais
(`cms-media/{uid}/{file}`) quanto banners (`cms-media/{uid}/banners/{bannerId}/{file}`)
com uma única árvore, alinhada à `media_library`. Preserva uploads existentes (o match
recursivo também casa profundidade 1). Não cria silo paralelo.

---

## 4. Storage — paths, formatos, limites

| Item | Decisão |
|---|---|
| Path de banners | `cms-media/{uid}/banners/{bannerId}/{filename}` |
| Quem escreve | `isAdmin()` e somente no próprio uid (`request.auth.uid == uid`) |
| Quem lê | Público (`read: if true`) — imagens de banner são públicas |
| Content types | `image/jpeg`, `image/jpg`, `image/png`, `image/webp` |
| GIF | **Não** nesta fase (animação/peso não controlados) |
| Vídeo | **Não** nesta fase (exigiria novo contentType + CSP `media-src`) |
| Outros types | Negados pela regex de `validCmsImageUpload` |
| Tamanho máximo | **5 MB** (mantido, igual ao CMS atual) |
| Overwrite | Permitido para admin; o client usa nome com `Date.now()` para evitar colisão |
| Delete | `isAdmin()` (para limpeza de órfãos) |

**Risco de arquivos órfãos:** como o Firestore **não** permite delete direto de banner
(usa `archived`), e não há cascade automático, imagens podem ficar órfãas no Storage se um
banner for esvaziado/trocado. Mitigação futura: o módulo CRUD deve apagar o objeto do
Storage (`imagePath`) ao substituir a imagem ou na exclusão definitiva (etapa futura).

---

## 5. Matriz de permissões (o que foi permitido / negado)

| Ator | Ler published | Ler draft/archived | Criar | Editar | Excluir |
|---|---|---|---|---|---|
| Anônimo / usuário comum | ✅ (query com `where status==published`) | ❌ | ❌ | ❌ | ❌ |
| Admin (`role=='admin'`, `ativo!=false`) | ✅ | ✅ | ✅ (schema válido) | ✅ (schema válido) | ❌ (delete desativado) |

Storage:

| Ator | Ler `cms-media/...` | Upload jpeg/png/webp ≤5MB no próprio uid | Upload pdf/gif/vídeo | Upload >5MB | Delete |
|---|---|---|---|---|---|
| Anônimo / usuário comum | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admin | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## 6. Testes de rules

**Não há infraestrutura de testes/emulador no projeto** (sem `package.json`, sem
`node_modules`, sem `firebase-tools`, sem `@firebase/rules-unit-testing`, sem
`firebase.json > emulators`). Para não introduzir dependências pesadas sem autorização,
**não foram criados testes automatizados**. Abaixo, o checklist de testes manuais
recomendados (rodar no emulador ou no console quando o ambiente estiver disponível).

### 6.1 Firestore — checklist
- [ ] Público (anônimo) **lê** banner `published` via `where('status','==','published')` → permitido.
- [ ] Público **não lê** `draft` → negado.
- [ ] Público **não lê** `archived` → negado.
- [ ] Público `list` **sem** filtro de status → negado.
- [ ] Admin **lê** qualquer banner (draft/published/archived) → permitido.
- [ ] Usuário comum **não cria** banner → negado.
- [ ] Admin **cria** `draft` válido (id/title/type/status/createdBy/updatedBy/createdAt/updatedAt) → permitido.
- [ ] Admin **cria** `published` com `imageUrl` + `placement` → permitido.
- [ ] Admin **cria** `published` **sem** imagem (`imageUrl` e `mediaId` vazios) → negado.
- [ ] Admin **cria** `published` **sem** destino (`placement` e `targetPages` vazios) → negado.
- [ ] Admin **cria** com `type` inválido (ex.: `slide`) → negado.
- [ ] Admin **cria** com `status` inválido (ex.: `live`) → negado.
- [ ] Admin **cria** com campo extra fora do schema → negado (`hasOnly`).
- [ ] Admin **cria** com `createdBy != auth.uid` → negado.
- [ ] Admin **cria** com `endAt < startAt` (ambos definidos) → negado.
- [ ] Admin **atualiza** alterando `createdBy` → negado.
- [ ] Admin **atualiza** alterando `createdAt` → negado.
- [ ] Admin **atualiza** mudando para `published` sem imagem → negado.
- [ ] Admin **arquiva** (`status='archived'`) banner válido → permitido.
- [ ] **Delete direto** (admin ou qualquer ator) → negado.

### 6.2 Storage — checklist
- [ ] Admin **envia** `image/jpeg` ≤5MB em `cms-media/{seu-uid}/banners/{id}/x.jpg` → permitido.
- [ ] Admin **envia** `image/png` e `image/webp` ≤5MB → permitido.
- [ ] Admin **envia** `application/pdf` → negado.
- [ ] Admin **envia** `image/gif` → negado.
- [ ] Admin **envia** `video/mp4` → negado.
- [ ] Admin **envia** imagem >5MB → negado.
- [ ] Admin **envia** em uid de outro admin (`uid != auth.uid`) → negado.
- [ ] Usuário comum **envia** qualquer arquivo → negado.
- [ ] Público **lê** imagem em `cms-media/...` → permitido.
- [ ] Uploads **existentes** do CMS (`cms-media/{uid}/{file}` profundidade 1) → continuam permitidos (regressão).

### 6.3 Como rodar (quando houver ambiente)
```bash
# Requer firebase-tools + @firebase/rules-unit-testing (NÃO instalados aqui)
firebase emulators:start --only firestore,storage
# e uma suíte com @firebase/rules-unit-testing cobrindo os casos acima.
```

---

## 7. Como publicar as rules (manual)

> **Não publicar automaticamente.** Publicar só após revisar e, idealmente, validar no
> emulador. Requer `firebase-tools` instalado e login/projeto configurados.

```bash
# Firestore Rules
firebase deploy --only firestore:rules

# Storage Rules (depende da entrada "storage" adicionada ao firebase.json)
firebase deploy --only storage

# Ambas
firebase deploy --only firestore:rules,storage
```

Alternativa pelo Console (sem CLI):
- **Firestore** → Console → Firestore Database → Regras → colar `firestore.rules` → Publicar.
- **Storage** → Console → Storage → Regras → colar `storage.rules` → Publicar.

**Precisa publicar Firestore Rules?** Sim, antes do CRUD real (Bloco 4C).
**Precisa publicar Storage Rules?** Sim, antes do upload real (Bloco 4D).
Até publicar, as regras novas existem só no repositório e não afetam produção.

---

## 8. Riscos

- **R1 — Default-deny:** erro na rule de leitura esconderia banners. Mitigar com o
  checklist §6 antes de publicar.
- **R2 — Query pública precisa de `where status==published`:** sem o filtro, a `list` é
  negada. O script público (4F) deve incluí-lo.
- **R3 — Índice composto:** `status==published` + `orderBy('priority')` pode exigir índice;
  validar no Console quando o Firestore pedir.
- **R4 — Mídia órfã:** sem delete direto e sem cascade, imagens podem sobrar no Storage.
  Tratar no CRUD futuro.
- **R5 — `cms-media` recursivo:** agora qualquer profundidade sob `cms-media/{uid}` aceita
  upload de admin. Continua restrito a `isAdmin` + uid próprio + tipo/tamanho — sem
  ampliação de superfície relevante.

---

## 9. Rollback

Tudo está apenas no worktree (não commitado, não publicado). Para reverter o conteúdo:

- **Firestore:** remover o bloco `match /banners/{bannerId}` e os helpers `isBanner*` /
  `bannerFieldsAllowed` / `banner*` de `firestore.rules`.
- **Storage:** voltar `match /cms-media/{uid}/{allFiles=**}` para
  `match /cms-media/{uid}/{fileName}`.
- **firebase.json:** remover o bloco `"storage"`.
- Se já tiverem sido **publicadas**, republicar a versão anterior das rules
  (`firebase deploy --only firestore:rules,storage` com os arquivos revertidos, ou colar a
  versão antiga no Console).

> Conforme instrução da tarefa, **não** foram usados `git reset` nem `git restore`.

---

## 10. Próxima etapa recomendada

**Bloco 4C — CRUD admin de banners** (`js/admin/modules/banners.js` substituindo o
placeholder, listar + criar/editar rascunho), consumindo estas rules. Pré-requisito:
publicar as Firestore Rules deste bloco. Upload real entra no Bloco 4D (depende das
Storage Rules publicadas).

---

## 11. Confirmação de escopo

- ❌ CRUD **não** implementado.
- ❌ Tela funcional de banners **não** criada (placeholder visual inalterado).
- ❌ Nenhuma collection criada no client; **nenhum** documento gravado.
- ❌ Nenhum upload realizado.
- ❌ Auth/roles/claims/login **não** alterados.
- ❌ Eventos, Notícias, Mídia, Aprovações, Vínculos e Usuários **não** tocados.
- ✅ Alterados apenas: `firestore.rules`, `storage.rules`, `firebase.json` e esta doc.
