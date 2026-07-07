# Bloco CMS-4A - Diagnostico e contrato de midia para empreendimentos

**Data:** 2026-07-07  
**Projeto:** SITE-TURISMO-SMS-mainv2  
**Escopo:** diagnosticar e definir contrato de midia para empreendimentos no CMS, sem implementar upload, move, copy, delete, publicacao automatica ou leitura publica Firestore.

## 1. Pre-check

- `git status --short` foi executado antes das alteracoes.
- O worktree estava limpo; o Git exibiu apenas aviso de permissao ao acessar `C:\Users\jacob/.config/git/ignore`.
- Nenhum commit foi feito.
- Nenhum `git reset` ou `git restore` foi executado.
- Nenhum seed, live-diff remoto, apply ou operacao real de Storage foi executado.

## 2. Arquivos inspecionados

- `docs/bloco-cms-2a-contrato-empreendimentos.md`
- `docs/schemas/cms-establishments.schema.md`
- `docs/bloco-cms-2b-crud-empreendimentos.md`
- `docs/bloco-cms-2b-fix-arquivar-excluir-empreendimentos.md`
- `docs/bloco-cms-2f-seed-real-empreendimentos.md`
- `docs/bloco-cms-3-aplicar-solicitacoes-catalogo.md`
- `admin-firebase.html`
- `portal-usuario.html`
- `js/firebase-auth.js`
- `js/admin/modules/empreendimentos.js`
- `firestore.rules`
- `storage.rules`
- `config.js`
- `js/site-meta.js`
- `sw.js`
- `js/locais-data.js`
- `js/data/eventos.js`
- `js/data/hospedagens.js`
- `js/data/informacoes-essenciais.js`
- `js/data/pontos-turisticos.js`
- `js/data/restaurantes.js`
- `js/data/rotas.js`
- `js/data/turismo-data-adapter.js`
- `js/data/turismo-data.js`

Tambem foram buscados termos relacionados a `image`, `imagem`, `gallery`, `galeria`, `mainImage`, `media`, `upload`, `storage`, `cms-media`, `submissions`, `establishment-updates`, `deleteObject`, `uploadBytes`, `getDownloadURL`, `contentType`, `size`, `alt`, `caption`, `credit`, `principal`, `capa` e campos correlatos.

## 3. Estado atual da midia no Portal

O Portal permite anexar imagens em tres fluxos:

| Fluxo | Input | Path root | Collection/destino logico |
| --- | --- | --- | --- |
| Evento enviado pelo usuario | `evtImages` | `events` | `eventos_pendentes` |
| Estabelecimento novo | `estImages` | `establishments` | `estabelecimentos_pendentes` |
| Alteracao de empreendimento vinculado | `updateImages` | `establishment-updates` | `establishment_update_requests` |

Para o escopo deste bloco, o fluxo relevante e **alteracao de empreendimento vinculado**.

### 3.1 Limites no app

- Ate 6 imagens por envio.
- Ate 5 MB por arquivo.
- Tipos aceitos: JPG, JPEG, PNG e WebP.
- `accept` no HTML: `.jpg,.jpeg,.png,.webp`.
- Validacao em JS por `PORTAL_ALLOWED_IMAGE_TYPES`:
  - `image/jpeg`;
  - `image/jpg`;
  - `image/png`;
  - `image/webp`.

Observacao: o limite de 6 imagens e validado no front-end. As Storage Rules validam tipo, tamanho e ownership, mas nao contam arquivos por submissao.

### 3.2 Storage paths usados pelo Portal

O Portal monta o path assim:

```text
submissions/{pathRoot}/{uid}/{submissionId}/{safeName}
```

Para solicitacoes de alteracao de empreendimento:

```text
submissions/establishment-updates/{uid}/{requestId}/{safeName}
```

Exemplo de nome normalizado:

```text
image-01.jpg
image-02.webp
```

O upload usa `cacheControl: private,max-age=0,no-transform`, coerente com anexo de revisao e nao com midia publica final.

### 3.3 Metadados gravados na solicitacao

`portal-usuario.html` envia os arquivos e repassa os metadados para `FirebaseSystem.createEstablishmentUpdateRequest()`.

`js/firebase-auth.js` normaliza cada item em `buildSafeImageMetadata()` com:

```js
{
  url,
  path,
  name,
  contentType,
  size,
  uploadedAt,
  position
}
```

Depois grava em `establishment_update_requests/{requestId}`:

- `images`: lista de metadados;
- `mainImage`: URL da primeira imagem valida, ou a imagem indicada se existir na lista;
- `imageCount`: total de imagens;
- `currentSnapshot.images`;
- `currentSnapshot.mainImage`;
- `currentSnapshot.imageCount`.

Campos textuais aplicaveis ficam em `requestedChanges`, separados das imagens.

### 3.4 Rollback de upload no Portal

O Portal mantem a lista `uploadedImages` durante o envio.

Se a criacao da solicitacao falhar depois do upload, o codigo chama `deleteUploadedFiles(uploadedImages)`, que tenta apagar os paths recem-enviados via `storage.ref(item.path).delete()`.

Caracteristicas:

- rollback e best-effort;
- falhas individuais de delete sao engolidas com `catch(function() { return null; })`;
- nao ha rotina posterior de reconciliacao;
- se o upload conclui e o delete falha, o arquivo pode ficar orfao em `submissions/...`.

### 3.5 Como as imagens aparecem para o Admin

`admin-firebase.html` lista `establishment_update_requests` com status `pending` e `approved`.

As imagens anexadas aparecem em:

- secao "Imagens anexadas";
- grid com thumbnail;
- link aberto em nova aba;
- legenda simples com `name` ou `path`.

Na area de aplicacao ao catalogo, quando uma solicitacao aprovada contem imagens, o Admin mostra aviso de que imagens anexadas nao serao movidas, apagadas nem aplicadas automaticamente.

### 3.6 Vinculo com `establishment_update_requests`

Sim. As imagens ficam ligadas a `establishment_update_requests` pelos campos:

- `images`;
- `mainImage`;
- `imageCount`;
- `currentSnapshot.images`;
- `currentSnapshot.mainImage`;
- `currentSnapshot.imageCount`.

O arquivo fisico permanece no Storage em `submissions/establishment-updates/...`.

## 4. Estado atual da midia no Admin

O CRUD interno de empreendimentos em `js/admin/modules/empreendimentos.js` ja possui upload proprio para o catalogo interno.

### 4.1 Imagem principal

Campos atuais no formulario:

- `est_mainImageUrl`;
- `est_mainImageAlt`;
- `est_mainImageCaption`;
- `est_mainImageCredit`;
- `est_mainImageFile`.

Ao salvar, o modulo grava:

```js
media.mainImage = {
  url,
  path,
  alt,
  caption,
  credit,
  source
}
```

Se houver arquivo selecionado, o upload vai para:

```text
cms-media/{uid}/establishments/{establishmentId}/main/{timestamp}-{fileName}
```

Depois, `media.mainImage.source` passa a ser `cms-media`.

### 4.2 Galeria

Campos atuais no formulario:

- `est_galleryUrls`: URLs atuais, uma por linha;
- `est_galleryFiles`: novos arquivos por upload multiplo;
- `est_galleryPreview`: preview local das imagens selecionadas.

Ao salvar, o modulo monta:

```js
media.gallery = [
  {
    url,
    path,
    alt,
    caption,
    credit,
    source,
    position
  }
]
```

Uploads novos vao para:

```text
cms-media/{uid}/establishments/{establishmentId}/gallery/{timestamp}-{fileName}
```

As imagens novas sao adicionadas ao final e depois reordenadas com `position = index + 1`.

### 4.3 Upload direto no Admin

Sim. O Admin faz upload direto para `cms-media/...`.

Limites no JS:

- JPG, PNG ou WebP;
- ate 5 MB por arquivo.

Metadados do upload:

- `url`;
- `path`;
- `alt: ""`;
- `caption: ""`;
- `credit: ""`;
- `source: "cms-media"`.

### 4.4 Remocao e risco de orfaos

O Admin possui rollback best-effort apenas para uploads feitos durante uma tentativa de salvamento:

- se o upload para Storage funcionar;
- e o `set()` em `cms_establishments` falhar;
- `deleteUploadedFiles(uploaded)` tenta remover os arquivos recem-enviados.

Nao ha fluxo de remocao editorial de midia ja salva.

Riscos atuais:

- se o usuario remove uma URL da galeria manualmente, o Firestore deixa de referenciar a imagem, mas o arquivo em Storage nao e apagado;
- se um documento `draft` ou `archived` for excluido do Firestore, imagens em Storage podem ficar orfas;
- se o rollback best-effort falhar, o arquivo recem-enviado pode ficar orfao;
- nao ha indice reverso de referencias por `storagePath`/`path`;
- nao ha status por imagem (`active`, `archived`, `removed`) no schema aceito pelas rules atuais.

## 5. Storage Rules atuais

Arquivo analisado: `storage.rules`.

### 5.1 Paths existentes

| Path | Leitura | Escrita | Delete |
| --- | --- | --- | --- |
| `submissions/establishments/{uid}/{submissionId}/{fileName}` | dono autenticado ou staff | dono autenticado do `{uid}`, imagem valida | dono autenticado ou staff |
| `submissions/events/{uid}/{submissionId}/{fileName}` | dono autenticado ou staff | dono autenticado do `{uid}`, imagem valida | dono autenticado ou staff |
| `submissions/establishment-updates/{uid}/{submissionId}/{fileName}` | dono autenticado ou staff | dono autenticado do `{uid}`, imagem valida | dono autenticado ou staff |
| `cms-media/{uid}/{allFiles=**}` | publico | admin autenticado do proprio `{uid}`, imagem valida | admin |
| outros paths | bloqueado | bloqueado | bloqueado |

### 5.2 Funcoes relevantes

`validPendingImageUpload(uid)` exige:

- usuario autenticado;
- `request.auth.uid == uid`;
- `request.resource != null`;
- tamanho ate 5 MB;
- `contentType` em `image/(jpeg|jpg|png|webp)`.

`validCmsImageUpload(uid)` exige:

- admin autenticado;
- `request.auth.uid == uid`;
- `request.resource != null`;
- tamanho ate 5 MB;
- `contentType` em `image/(jpeg|jpg|png|webp)`.

### 5.3 Confirmacoes

- Admin pode ler submissions porque `isStaff()` cobre `admin` e `moderator`.
- Admin pode escrever em `cms-media/{adminUid}/...`.
- Empreendedor escreve apenas em paths de submissions dentro do proprio `{uid}`.
- `cms-media` tem leitura publica por regra atual.
- Existe regra de delete para submissions e para `cms-media`.

### 5.4 Lacunas

- Storage Rules nao validam quantidade maxima de arquivos por submissao.
- Storage Rules nao validam dimensoes (`width`/`height`).
- Storage Rules nao validam extensao do nome, apenas `contentType`.
- Delete em `submissions` permite dono ou staff; isso e funcional, mas pede cuidado operacional para nao apagar evidencia de solicitacao sem confirmacao.
- Delete em `cms-media` permite admin, sem checagem de referencia Firestore.
- Nao ha regra especifica para `cms-media/{uid}/establishments/{establishmentId}/...`; o path e coberto pelo wildcard recursivo.
- Nao ha protecao contra apagar arquivo usado por outro item.

## 6. Firestore Rules atuais

Arquivo analisado: `firestore.rules`.

### 6.1 `cms_establishments.media`

As rules atuais aceitam `media` com:

```js
{
  mainImage,
  gallery,
  videoUrl,
  sourceCredits
}
```

`validEstablishmentImage(data)` aceita somente:

```js
{
  url,
  path,
  alt,
  caption,
  credit,
  source
}
```

Todos precisam ser string.

`validEstablishmentMedia(data)` exige:

- `mainImage` valido;
- `gallery` como lista;
- `gallery.size() <= 60`;
- `videoUrl` string;
- `sourceCredits` string.

Lacuna importante: `validEstablishmentMedia()` nao valida cada item da galeria por schema. O JS normaliza a galeria, mas a rule atual so limita a lista e valida o objeto da imagem principal.

### 6.2 Campos de imagens em `establishment_update_requests`

No create de `establishment_update_requests`, as rules exigem:

- `currentSnapshot` com keys permitidas, incluindo `images`, `mainImage`, `imageCount`;
- `requestedChanges` com keys textuais permitidas;
- pelo menos uma alteracao textual ou `imageCount > 0`;
- `images is list`;
- `imageCount == images.size()`;
- top-level keys permitidas, incluindo `images`, `mainImage`, `imageCount`.

Lacuna: as rules nao validam o schema de cada item de `images`; dependem da sanitizacao em `js/firebase-auth.js`.

### 6.3 Aplicar imagens exigiria alteracao de rules?

Sim, se o contrato futuro quiser gravar no catalogo campos alem dos atuais.

As rules atuais **nao aceitam** em `media.mainImage`:

- `id`;
- `storagePath`;
- `uploadedBy`;
- `uploadedAt`;
- `status`;
- `position`;
- `sourceRequestId`;
- `sourceSubmissionPath`;
- `reviewedBy`;
- `reviewedAt`;
- `rejectionReason`;
- `removedAt`;
- `removedBy`.

As rules atuais aceitam `path`, nao `storagePath`.

Portanto, este bloco propoe o contrato alvo, mas uma implementacao futura precisa ajustar `firestore.rules` antes de gravar esse novo shape.

## 7. Contrato de midia proposto para o catalogo

Recomendacao para bloco futuro: evoluir `cms_establishments.media` para um contrato explicito, com status por imagem e rastreabilidade da origem.

```js
media: {
  mainImage: {
    id: "",
    url: "",
    storagePath: "",
    alt: "",
    caption: "",
    credit: "",
    source: "cms-upload|portal-submission|static|external",
    sourceRequestId: "",
    sourceSubmissionPath: "",
    uploadedBy: "",
    uploadedAt: null,
    reviewedBy: "",
    reviewedAt: null,
    status: "active"
  },
  gallery: [
    {
      id: "",
      url: "",
      storagePath: "",
      alt: "",
      caption: "",
      credit: "",
      position: 1,
      source: "cms-upload|portal-submission|static|external",
      sourceRequestId: "",
      sourceSubmissionPath: "",
      uploadedBy: "",
      uploadedAt: null,
      reviewedBy: "",
      reviewedAt: null,
      status: "active"
    }
  ],
  videoUrl: "",
  sourceCredits: ""
}
```

### 7.1 Campos obrigatorios por imagem ativa

- `id`: string estavel dentro do empreendimento.
- `url`: string, URL de leitura.
- `storagePath`: string para arquivos no Firebase Storage; vazio apenas para `external` ou legado `static`.
- `alt`: string recomendada como obrigatoria antes de publicacao publica.
- `source`: enum permitido.
- `status`: enum permitido.

### 7.2 Campos opcionais

- `caption`: legenda editorial.
- `credit`: credito do fotografo, empreendimento, acervo ou prefeitura.
- `position`: obrigatorio na galeria; nao necessario na principal.
- `sourceRequestId`: id da solicitacao quando veio do Portal.
- `sourceSubmissionPath`: path original em `submissions/...` quando veio do Portal.
- `uploadedBy`: UID do admin ou empreendedor, conforme origem.
- `uploadedAt`: timestamp ou string ISO conforme origem.
- `reviewedBy`: UID do admin que aceitou/rejeitou.
- `reviewedAt`: timestamp de revisao.

### 7.3 Tipos e limites sugeridos

| Campo | Tipo | Limite sugerido |
| --- | --- | --- |
| `id` | string | 120 caracteres |
| `url` | string URL | 2048 caracteres |
| `storagePath` | string | 512 caracteres |
| `alt` | string | 160 caracteres |
| `caption` | string | 240 caracteres |
| `credit` | string | 160 caracteres |
| `source` | enum string | `cms-upload`, `portal-submission`, `static`, `external` |
| `status` | enum string | `active`, `archived`, `removed`, `rejected` |
| `position` | int | 1 a 60 |
| `sourceRequestId` | string | 160 caracteres |
| `sourceSubmissionPath` | string | 512 caracteres |
| `uploadedBy`, `reviewedBy` | string UID | 160 caracteres |
| `uploadedAt`, `reviewedAt` | timestamp/null | timestamp Firestore no contrato final |

### 7.4 Campos proibidos

Nao gravar no catalogo:

- token de download separado da URL;
- dados EXIF completos;
- geolocalizacao embutida;
- caminho local do computador do usuario;
- nome original bruto se contiver informacao sensivel;
- MIME ou extensao fora de JPG, JPEG, PNG e WebP;
- `downloadURL` duplicado se `url` ja existe;
- `fullPath` duplicado se `storagePath` ja existe;
- blobs/base64;
- credenciais, tokens ou signed URLs temporarias;
- dados pessoais do empreendedor alem de UID/auditoria ja permitida.

### 7.5 Compatibilidade com schema atual

Enquanto as rules nao forem evoluidas, o formato gravavel continua sendo:

```js
{
  url,
  path,
  alt,
  caption,
  credit,
  source
}
```

Qualquer implementacao futura do contrato completo deve:

1. atualizar `docs/schemas/cms-establishments.schema.md`;
2. atualizar `firestore.rules`;
3. atualizar `js/admin/modules/empreendimentos.js`;
4. validar galeria item a item nas rules;
5. manter migracao/compatibilidade para docs ja existentes.

## 8. Fluxo seguro para imagens vindas do Portal

Fluxo recomendado:

1. Empreendedor envia imagens no Portal.
2. Portal grava arquivos em:

```text
submissions/establishment-updates/{ownerUid}/{requestId}/{fileName}
```

3. Portal grava metadados em `establishment_update_requests.images`.
4. Admin revisa a solicitacao textual e as imagens.
5. Admin pode aceitar ou rejeitar cada imagem.
6. Imagem rejeitada fica registrada na solicitacao como evidencia/revisao, sem virar midia do catalogo.
7. Imagem aceita deve ser copiada/reupada para:

```text
cms-media/{adminUid}/establishments/{establishmentId}/gallery/{timestamp}-{fileName}
cms-media/{adminUid}/establishments/{establishmentId}/main/{timestamp}-{fileName}
```

8. O catalogo grava a nova referencia em `cms_establishments.media`.
9. `submissions/...` permanece como origem/evidencia da solicitacao, ate politica futura de retencao.

## 9. Manter referencia ou copiar/mover?

### Opcao A - manter referencia em `submissions/...`

Vantagens:

- nao duplica arquivo;
- fluxo tecnico mais simples;
- menor custo inicial de Storage.

Desvantagens:

- mistura evidencia de solicitacao com midia publicada;
- path de origem pertence ao empreendedor/request, nao ao catalogo;
- delete futuro da submissao quebraria imagem publicada;
- dificulta governanca editorial;
- `cacheControl` atual e privado/sem cache longo;
- sem isolamento claro entre anexo revisado e asset publico.

### Opcao B - copiar/reupar para `cms-media/...`

Vantagens:

- separa evidencia de solicitacao da midia do catalogo;
- path passa a representar o empreendimento e a curadoria admin;
- leitura publica de `cms-media` ja existe;
- cache publico pode ser usado no asset final;
- facilita limpeza futura de submissions sem quebrar catalogo;
- reduz risco de publicar arquivo ainda preso ao contexto privado da solicitacao.

Desvantagens:

- duplica arquivo;
- exige rotina futura de copia/reupload;
- exige UI/acao admin;
- exige tratamento de falha parcial;
- exige rules/schema para gravar metadados de origem.

### Decisao recomendada

Recomenda-se **copiar/reupar imagem aceita para `cms-media/...`** em bloco futuro.

Nao mover no primeiro fluxo. Mover apagaria ou alteraria a evidencia original da solicitacao e aumentaria o risco de perda de rastreabilidade.

## 10. Imagem principal vs galeria

### 10.1 Imagem principal

Regras recomendadas:

- uma unica `media.mainImage` ativa por empreendimento;
- pode ser escolhida a partir de imagem ja existente na galeria;
- pode ser uma imagem aceita do Portal e copiada/reupada para `cms-media/...`;
- deve ter `alt` preenchido antes de qualquer leitura publica futura;
- deve preservar origem (`sourceRequestId`, `sourceSubmissionPath`) quando vier do Portal;
- trocar imagem principal nao deve apagar o arquivo anterior automaticamente.

Politica operacional:

- se a imagem principal antiga ainda estiver na galeria, manter como galeria ativa;
- se nao estiver na galeria, marcar como `archived` ou manter referencia historica em campo/auditoria futura;
- nao apagar arquivo no Storage durante troca de capa.

### 10.2 Galeria

Regras recomendadas:

- `media.gallery` deve aceitar ate 60 imagens, alinhado ao limite atual das rules;
- cada item deve ter `id`, `url`, `storagePath`, `position`, `source` e `status`;
- somente itens `status == "active"` devem aparecer em leitura publica futura;
- ordenacao por `position`, com normalizacao sequencial ao salvar;
- imagens removidas da exibicao devem virar `removed` ou `archived`, nao delete fisico imediato;
- rejeicoes de solicitacao devem usar `rejected` e permanecer ligadas ao request, nao entrar como galeria ativa.

### 10.3 Evitar apagar midia usada por outro item

Antes de apagar qualquer arquivo em bloco futuro:

- procurar referencias em `cms_establishments.media.mainImage.storagePath`;
- procurar referencias em todos os itens de `cms_establishments.media.gallery`;
- procurar referencias em `media_library`, se usada;
- registrar resultado em relatorio;
- exigir confirmacao admin para delete definitivo;
- nunca apagar se mais de um documento referencia o mesmo path.

## 11. Politica de exclusao e orfaos

Politica recomendada:

- nao apagar arquivo automaticamente quando uma imagem e removida da galeria;
- marcar a imagem como `removed` ou `archived` no Firestore;
- preservar `sourceRequestId` e `sourceSubmissionPath`;
- criar bloco futuro especifico para limpeza de orfaos;
- gerar relatorio antes de qualquer delete;
- nunca apagar midia de `submissions/...` sem confirmacao administrativa explicita;
- nunca apagar arquivo de `cms-media/...` sem verificar referencias em `cms_establishments` e `media_library`;
- manter delete fisico fora do fluxo principal de revisao/publicacao.

### 11.1 Orfaos possiveis hoje

- Upload do Portal concluido, mas criacao da solicitacao falhou e rollback falhou.
- Upload do Admin concluido, mas salvamento no Firestore falhou e rollback falhou.
- Imagem removida manualmente da lista de URLs da galeria no Admin.
- Documento `cms_establishments` excluido sem apagar Storage.
- Arquivo em `cms-media` apagado manualmente fora do app, deixando URL quebrada no Firestore.

### 11.2 Bloco futuro de limpeza

CMS-4E deve:

1. listar arquivos em `cms-media/...`;
2. listar arquivos em `submissions/establishment-updates/...`;
3. extrair referencias de `cms_establishments`, `establishment_update_requests` e `media_library`;
4. classificar como referenciado, candidato a orfao ou protegido;
5. gerar relatorio;
6. exigir confirmacao;
7. apagar somente lote revisado.

## 12. Acessibilidade e SEO

Campos recomendados:

- `alt`: obrigatorio para qualquer imagem que vire publica;
- `caption`: recomendado para contexto editorial;
- `credit`: recomendado para direito autoral, acervo ou fonte;
- `source`: obrigatorio para rastreabilidade.

Regras editoriais:

- evitar publicar imagem sem descricao alternativa;
- `alt` deve descrever o conteudo relevante da imagem, nao repetir apenas o nome do empreendimento;
- `caption` pode contextualizar evento, local, ambiente ou servico;
- `credit` deve identificar fotografo/acervo quando aplicavel;
- imagens de Portal devem ser revisadas quanto a qualidade, direitos de uso, conteudo sensivel e pertinencia.

Validacao tecnica recomendada:

- manter JPG/JPEG, PNG e WebP;
- manter 5 MB por arquivo no primeiro ciclo;
- avaliar dimensoes minimas em bloco futuro, por exemplo 1200px de largura para capa;
- remover ou ignorar metadados EXIF sensiveis em pipeline futuro se houver processamento.

## 13. Datas publicas e arquivos de cache/config

Este bloco e diagnostico/contrato e nao altera o site publico.

Verificados e nao alterados:

- `sitemap.xml`;
- `js/site-meta.js`;
- `config.js`;
- `sw.js`.

Motivo:

- o site publico ainda nao le Firestore para empreendimentos;
- dados publicos continuam em `js/locais-data.js` e `js/data/*.js`;
- nenhuma pagina publica indexavel mudou;
- nenhum cache publico precisou ser invalidado;
- nenhuma data de campanha/configuracao foi alterada.

## 14. Rules futuras necessarias

### 14.1 Firestore Rules

Para implementar o contrato completo, sera necessario:

- aceitar `storagePath` ou decidir manter `path` como nome canonico;
- aceitar `id`, `uploadedBy`, `uploadedAt`, `reviewedBy`, `reviewedAt`, `status`, `sourceRequestId`, `sourceSubmissionPath`;
- validar `source` por enum;
- validar `status` por enum;
- validar `position` como int;
- validar cada item de `media.gallery`;
- manter limite de galeria;
- impedir empreendedor de escrever em `cms_establishments`;
- preservar `createdAt`/`createdBy`;
- exigir `updatedBy == request.auth.uid` para updates admin.

Decisao de compatibilidade recomendada:

- manter `path` no codigo atual ate a migracao;
- no contrato final, preferir `storagePath`;
- se migrar, aceitar temporariamente ambos ou converter `path -> storagePath` em bloco controlado.

### 14.2 Storage Rules

As rules atuais ja cobrem os paths necessarios, mas blocos futuros podem considerar:

- regra mais especifica para `cms-media/{uid}/establishments/{establishmentId}/{type}/{fileName}`;
- manter escrita restrita a admin;
- manter leitura publica para `cms-media`;
- manter `submissions` legivel apenas por dono ou staff;
- bloquear delete automatico por fluxo de app, mesmo se a rule permitir, ate existir checagem de referencias;
- avaliar se delete em `submissions` deve ser limitado a staff para preservar evidencia.

Nenhuma alteracao de rules foi feita neste bloco.

## 15. Riscos

- As rules publicadas no Firebase podem divergir dos arquivos locais.
- `cms-media` tem leitura publica; imagens enviadas pelo Admin ficam publicamente acessiveis por URL.
- `submissions` nao devem ser usadas diretamente como midia publica final.
- Rules de `establishment_update_requests` nao validam item a item dentro de `images`.
- Rules de `cms_establishments` nao validam item a item dentro de `media.gallery`.
- O schema atual de `media.mainImage` nao aceita os metadados completos propostos.
- Delete em Storage hoje nao checa referencias Firestore.
- Remover URL da galeria no Admin pode deixar arquivo orfao.
- Excluir documento interno pode deixar midia orfa.
- Validacao local nao prova Storage/Firestore real, App Check, sessao admin ou rules publicadas.

## 16. Proximos blocos recomendados

1. **CMS-4B - UI Admin para revisar imagens de solicitacoes**
   - Mostrar imagens anexadas com metadados.
   - Permitir aceitar/rejeitar cada imagem.
   - Exigir `alt`/credito quando for virar midia.
   - Nao copiar ainda se o bloco ficar somente revisao.

2. **CMS-4C - Aplicar imagem aceita ao catalogo interno**
   - Copiar/reupar imagem aceita para `cms-media/...`.
   - Gravar referencia em `cms_establishments.media`.
   - Registrar origem em `sourceRequestId`/`sourceSubmissionPath`.
   - Atualizar rules/schema se o contrato completo for usado.

3. **CMS-4D - Gestao de galeria no catalogo**
   - Ordenar galeria.
   - Definir imagem principal a partir da galeria.
   - Arquivar/remover sem delete fisico.
   - Validar acessibilidade.

4. **CMS-4E - Limpeza de midias orfas**
   - Gerar inventario de Storage.
   - Cruzar referencias Firestore.
   - Produzir relatorio.
   - Apagar somente com confirmacao admin.

5. **CMS-5 - Leitura publica Firestore com fallback estatico**
   - Ler somente `cms_establishments` publicaveis.
   - Manter fallback em `js/locais-data.js` e `js/data/*.js`.
   - QA de mapa, local, sabores, hospedagem, busca, SEO, mobile, VLibras e idioma.

## 17. Validacoes planejadas

Executar apos criacao deste documento:

```powershell
cd "D:\PROJETOS CODEX\SITE-TURISMO-SMS-mainv2"
node --check js/firebase-auth.js
node --check js/admin/modules/empreendimentos.js
node --check config.js
node --check sw.js
node scripts/audit-links.mjs
node scripts/audit-assets.mjs
node scripts/audit-project.mjs
git diff --check
```

Nao executar `npm run build`, `npm run lint` ou `npm run test` porque nao ha `package.json` no repositorio.

## 18. Confirmacoes de escopo

Confirmado neste bloco:

- nao foi implementado upload novo;
- nao foi movido arquivo no Storage;
- nao foi copiado arquivo no Storage;
- nao foi apagado arquivo no Storage;
- nao foram alterados dados publicos;
- site publico nao foi ligado ao Firestore;
- imagens nao foram aplicadas automaticamente;
- `firestore.rules` nao foi alterado;
- `storage.rules` nao foi alterado;
- `sitemap.xml` nao foi alterado;
- `js/site-meta.js` nao foi alterado;
- `config.js` nao foi alterado;
- `sw.js` nao foi alterado;
- seed/apply nao foi executado;
- nada foi publicado automaticamente;
- PDF/guia nao foi alterado.
