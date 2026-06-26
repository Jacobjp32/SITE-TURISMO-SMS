# Bloco 4D — Upload / seleção de imagem nos Banners / Pop-ups (admin)

> **Pré-requisito:** Blocos 4B (rules publicadas) e 4C (CRUD admin) já implementados e
> commitados. Worktree estava **limpo** no início. **Nada foi commitado** nesta rodada.
> Nenhum dado real foi gravado no Firestore/Storage durante os testes.

---

## 1. O que foi implementado

Upload de imagem para banners em rascunho no painel admin, com:

- campo de **upload** (file input) + campo de **URL manual** coexistentes;
- **preview client-side** da imagem selecionada/já salva no formulário;
- **miniatura** na lista de banners quando há `imageUrl`;
- **preview** maior na tela de detalhes;
- **path de Storage** conforme rules do Bloco 4B: `cms-media/{uid}/banners/{bannerId}/{timestamp}-{filename}`;
- campos `imageUrl`, `imagePath`, `imageAlt`, `imageUpdatedAt`, `imageUpdatedBy`
  persistidos no documento `banners`;
- validação client-side de tipo e tamanho antes do upload;
- tratamento de erros específicos do Storage (permission, rede, cota);
- modal não trava se upload ou gravação falhar.

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `js/admin/modules/banners.js` | Upload, preview, miniatura (reescrita do Bloco 4C). |
| `firestore.rules` | `imageUpdatedAt`, `imageUpdatedBy` adicionados ao `bannerFieldsAllowed`. |
| `admin-firebase.html` | `?v=` do script `banners.js` atualizado para evitar cache do SW. |
| `scripts/smoke-banners.mjs` | Smoke test expandido para contratos 4D. |
| `docs/bloco-4d-upload-banners.md` | **Novo.** Este documento. |

---

## 2. Helper de upload reutilizado

A função `uploadImageToCms` de `js/admin-content-cms.js` é **privada** (closure interna).
Não foi possível reutilizá-la diretamente.

Em vez disso, foram reutilizados **os padrões** do mesmo arquivo:

| Padrão reutilizado | Fonte |
|---|---|
| `validateImageFile` (tipo + tamanho) | `admin-content-cms.js` |
| `safeFileName` (normaliza nome do arquivo) | `admin-content-cms.js` |
| Limite de 5 MB (`MAX_IMAGE_BYTES`) | `admin-content-cms.js` |
| Tipos aceitos: `image/jpeg`, `image/png`, `image/webp` | `admin-content-cms.js` |
| Pattern `storage.ref(path).put(file, { contentType })` | `admin-content-cms.js` |

A função equivalente em `banners.js` é `uploadBannerImage(storage, file, uid, bannerId)`.

---

## 3. Caminho usado no Storage

```
cms-media/{uid}/banners/{bannerId}/{timestamp}-{safeFilename}
```

Exemplos:
```
cms-media/abc123/banners/meu-banner-k1l2m3n4/1719360000000-foto-banner.jpg
cms-media/abc123/banners/popup-verao-p5q6r7s8/1719360001234-imagem.png
```

- `{uid}` = `currentUser.uid` do admin que fez o upload;
- `{bannerId}` = id do documento (gerado em `makeId`, estável antes do upload);
- `{timestamp}` = `Date.now()` em milissegundos;
- `{safeFilename}` = nome do arquivo sem caracteres perigosos, máx. 90 chars.

Coberto pela rule do Bloco 4B: `match /cms-media/{uid}/{allFiles=**}` com `validCmsImageUpload(uid)`.

---

## 4. Campos adicionados ao schema `banners`

Além dos campos do Bloco 4C, o documento agora persiste:

| Campo | Tipo | Quando definido |
|---|---|---|
| `imageUrl` | string | Sempre (upload sobrescreve; URL manual preservada; empty ao limpar). |
| `imagePath` | string | Apenas quando há upload. URL manual → `imagePath` não é gravado. |
| `imageAlt` | string (≤160) | Quando preenchido. |
| `imageUpdatedAt` | timestamp | Quando imagem é adicionada/substituída (upload ou troca de URL manual). |
| `imageUpdatedBy` | string (uid) | Idem. |

### Regra de preservação em edição

| Situação | imageUrl | imagePath | imageUpdatedAt/By |
|---|---|---|---|
| Novo upload | URL do Storage | caminho do Storage | `serverTimestamp()` / `currentUid()` |
| URL manual inalterada | preservada | preservada (se existia) | preservado do base |
| URL manual trocada | nova URL | **nenhum** | `serverTimestamp()` / `currentUid()` |
| Imagem removida (campo zerado) | `""` | **nenhum** | **nenhum** |

---

## 5. Por que `imageUpdatedAt`/`imageUpdatedBy` exigiram atualização de rules

A função `bannerFieldsAllowed` do Bloco 4B usava `data.keys().hasOnly([...])`. Qualquer
campo fora dessa lista causa `permission-denied` no Firestore.

`imageUpdatedAt` e `imageUpdatedBy` não estavam na lista e são campos **explicitamente
especificados** no Bloco 4D. Incluí-los no payload sem atualizar as rules causaria falha
silenciosa (permission denied ao salvar). Por isso foram adicionados ao `hasOnly` em
`firestore.rules`, o que exige **nova publicação das Firestore Rules** (ver §10).

---

## 6. Como o upload funciona (fluxo interno)

```
submitForm(event)
  ├─ readForm()               // lê title, type, imageUrl (manual), imageAlt, etc.
  ├─ validateBannerImageFile  // tipo e tamanho antes de desabilitar o botão
  ├─ stableId = bannerId || makeId(title)  // id estável para o path E o doc
  ├─ [se file]
  │   ├─ getStorage()
  │   └─ uploadBannerImage(storage, file, uid, stableId)
  │       └─ storage.ref("cms-media/{uid}/banners/{stableId}/{ts}-{name}").put(file)
  │           └─ getDownloadURL() → { url, path }
  └─ buildPayload(formData, base, uploadResult, stableId)
      └─ payload.imageUrl  = uploadResult.url   (ou URL manual)
         payload.imagePath = uploadResult.path  (ou preservado / null)
         payload.imageUpdatedAt = serverTimestamp()
         payload.imageUpdatedBy = uid
      └─ db.collection("banners").doc(stableId).set(payload)
```

---

## 7. Como o preview funciona no formulário

1. **Ao abrir o formulário** (`openForm`):
   - se `item.imageUrl` existe → exibe no `#bannerImagePreview` com nota de origem.
   - se não → exibe placeholder cinza "Sem imagem definida".
   - `releaseBannerPreviewUrl()` é chamado para limpar preview anterior.

2. **Ao selecionar arquivo** (`onImageFileChange`):
   - valida tipo e tamanho; rejeita com toast se inválido;
   - cria `URL.createObjectURL(file)` e exibe no preview;
   - limpa o campo de URL manual (upload tem prioridade);
   - nota: "aguardando salvar" (o upload ainda não aconteceu).

3. **Ao clicar "Limpar imagem"** (`clearImageSelection`):
   - revoga o object URL, limpa file input e URL field;
   - preview volta ao placeholder.

4. **Ao cancelar** (`cancelForm`) ou **após salvar com sucesso**:
   - `releaseBannerPreviewUrl()` revoga o object URL para evitar memory leak.

---

## 8. Como a miniatura na lista funciona

Na tabela da lista (`renderList`), dentro da célula do título:

```html
<img src="{imageUrl}" alt="{imageAlt}" style="max-width:72px;max-height:40px;..."
     onerror="this.style.display='none'">
```

- Visível quando `item.imageUrl` é não-vazio;
- falha silenciosa via `onerror` → `display:none` (não quebra o layout);
- quando não há `imageUrl` → exibe `<div>sem imagem</div>` discreto.

---

## 9. Validações de arquivo (client-side)

| Regra | Mensagem ao usuário |
|---|---|
| Arquivo ausente | "Selecione um arquivo de imagem." |
| Tipo != jpeg/jpg/png/webp | "Tipo de arquivo inválido. Use JPG, PNG ou WEBP." |
| Tamanho > 5 MB | "Imagem muito grande. Limite: 5 MB. Selecione uma imagem menor." |

A validação ocorre em `validateBannerImageFile(file)`, chamada em dois momentos:
1. `onImageFileChange` — ao selecionar o arquivo (feedback imediato no preview);
2. `submitForm` — antes de desabilitar o botão de submit (última barreira client).

> As Storage Rules são a proteção real. O client pode ser bypassado.

---

## 10. Tratamento de erros

| Código Storage | Mensagem |
|---|---|
| `storage/unauthorized` | Permissão negada. Verificar rules 4B e papel admin. |
| `storage/canceled` | Upload cancelado. |
| `storage/network-request-failed` | Erro de rede. Verificar conexão. |
| `storage/quota-exceeded` | Cota de armazenamento excedida. |
| `storage/invalid-argument` | Arquivo inválido. Verificar tipo e tamanho. |
| outros | Mensagem genérica + log no console. |

Em todos os casos de erro (upload ou Firestore), o botão de submit é re-habilitado e o
modal permanece aberto para nova tentativa. Não há modal travado.

---

## 11. Como testar manualmente

1. **Login** no admin (`admin-firebase.html`).
2. Abrir **Banners / Pop-ups** na sidebar.
3. **Novo rascunho** sem imagem → criar → confirmar que aparece na lista ("sem imagem").
4. **Novo rascunho com imagem válida**:
   - selecionar arquivo JPG/PNG/WEBP ≤ 5 MB → preview aparece no formulário;
   - salvar → miniatura aparece na lista; URL e caminho visíveis nos detalhes.
5. **Editar rascunho** → trocar imagem → salvar → confirmar novo `imagePath` nos detalhes.
6. **Editar alt text** sem trocar imagem → salvar → `imagePath` deve permanecer o mesmo.
7. **Testar arquivo inválido** (ex.: `.pdf` ou `.gif`) → toast de erro, formulário aberto.
8. **Testar arquivo > 5 MB** → toast de erro imediato ao selecionar.
9. **Testar URL manual** (sem upload) → salvar → `imageUrl` salvo, sem `imagePath`.
10. **Limpar imagem** → salvar → `imageUrl: ""` no documento, miniatura some.
11. **Duplicar** banner com imagem → cópia tem `imageUrl` (URL) mas sem `imagePath`.
12. **Arquivar** banner com imagem → `imagePath` preservado no documento arquivado.
13. **Publicar** continua desabilitado.
14. **Site público** (`index.html`, `eventos.html`, etc.) não alterado.
15. **Console** sem novo erro crítico relacionado a banners.

---

## 12. O que ainda não foi implementado (deliberado)

- **Publicação** de banner (`status: 'published'`, slot no site) — Bloco 4E.
- **Exibição pública** no site / pop-up — Bloco 4F.
- **Exclusão** de arquivo antigo do Storage ao substituir imagem — etapa futura.
- **Delete definitivo** de banner — rules bloqueiam; usar arquivar.
- **Seleção de mídia da biblioteca** (integração com `media_library`) — etapa futura.
- **GIF e vídeo** — não suportados pelas rules (propositalmente).

---

## 13. Riscos

| Risco | Mitigação |
|---|---|
| Arquivos órfãos no Storage | Documentado; solução futura no CRUD (exclusão com cascade). |
| `imagePath` do original exposto na cópia | Não é copiado; `imageUrl` copiada aponta para mesmo arquivo (aceitável). |
| Rules rejeitarem payload com `imageUpdatedAt/By` | Adicionados ao `hasOnly` neste bloco. **Requer nova publicação das Firestore Rules.** |
| SW cacheando banners.js antigo | `?v=admin-banners-4d-20260626` no script tag. |
| Object URL vazando se modal fechar inesperadamente | `dispose()` e `cancelForm()` chamam `releaseBannerPreviewUrl()`. |

---

## 14. Rules — o que precisa publicar

| Rules | Precisa republicar? | Motivo |
|---|---|---|
| **Firestore Rules** | **Sim** | `imageUpdatedAt` e `imageUpdatedBy` adicionados ao `bannerFieldsAllowed`. Sem essa publicação, o payload com esses campos recebe `permission-denied`. |
| **Storage Rules** | **Sim (se ainda não publicadas do Bloco 4B)** | O upload real depende de `validCmsImageUpload` nas Storage Rules. Se as rules do 4B já foram publicadas, não é necessário publicar de novo — nenhuma alteração foi feita ao `storage.rules`. |

Como publicar:
```bash
# Firestore Rules (obrigatório neste bloco)
firebase deploy --only firestore:rules

# Storage Rules (só se não publicadas ainda do 4B)
firebase deploy --only storage

# Ou ambas:
firebase deploy --only firestore:rules,storage
```

---

## 15. Rollback

Para desfazer sem afetar auth/roles/outros módulos:

1. Reverter `js/admin/modules/banners.js` para a versão do Bloco 4C (commit `0357b81`).
2. Reverter o `?v=` em `admin-firebase.html` para `admin-modular-20260626`.
3. Remover `imageUpdatedAt` e `imageUpdatedBy` de `firestore.rules` e republica-las.
4. Reverter `scripts/smoke-banners.mjs` (opcional; o teste do 4C ainda funciona).
5. Apagar este documento (opcional).

> Documentos `banners` eventualmente criados em testes manuais permanecem na collection
> (delete bloqueado por rules). Podem ser **arquivados** via módulo. Arquivos de imagem
> no Storage permanecem (limpeza manual via Console se necessário).

---

## 16. Validações executadas

- `node --check` em todos os 12 arquivos JS listados no briefing: **todos OK**.
- `node scripts/smoke-banners.mjs`: **46/46 checks ✅** (contratos 4C + 4D).
- `node scripts/audit-links.mjs` → 1 link "broken" pré-existente, sem novos.
- `node scripts/audit-assets.mjs` → 0 referências faltantes.
- `node scripts/audit-project.mjs` → OK.

---

## 17. Próxima etapa recomendada

**Bloco 4E — Publicação de banners**: habilitar o botão "Publicar" (mudar `status` para
`published`), exigindo imagem (`imageUrl` ou `mediaId`) e destino (`placement`/`targetPages`)
— validação já está nas Firestore Rules do Bloco 4B. Requisito: banner deve ter imagem
(upload ou URL) antes de publicar.

Depois: **Bloco 4F** — script público na home/site para exibir banners/pop-ups publicados.
