# Schema proposto - cms_establishments

Este arquivo e documentacao de contrato. Nao e codigo runtime e nao cria collection por si so.

## Collection

```text
cms_establishments/{establishmentId}
```

`establishmentId` deve ser estavel e preservar o id/slug canonico ja usado nos dados publicos e no Portal.

## Status permitidos

```text
draft
published
archived
```

Leitura publica futura: somente `published`.

## Documento

```js
{
  id: "marina-barra-iguacu",
  slug: "marina-barra-iguacu",
  name: "Marina Barra do Iguacu",
  categoryId: "gastronomia",
  categoryLabel: "Gastronomia",
  status: "draft",

  content: {
    summary: "Descricao curta para cards e mapa.",
    description: "Texto principal.",
    longDescription: "Texto longo opcional.",
    accessibility: "",
    openingHours: "",
    tags: ["gastronomia", "rio-iguacu"],
    notesInternal: ""
  },

  contact: {
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    instagram: "",
    facebook: ""
  },

  location: {
    address: "",
    neighborhood: "",
    city: "Sao Mateus do Sul",
    state: "PR",
    postalCode: "",
    coordinates: {
      lat: null,
      lng: null
    },
    mapsUrl: "",
    coordStatus: "",
    coordNote: ""
  },

  media: {
    mainImage: {
      url: "",
      path: "",
      alt: "",
      caption: "",
      credit: "",
      source: "static|cms-media|submission|external"
    },
    gallery: [
      {
        url: "",
        path: "",
        alt: "",
        caption: "",
        credit: "",
        source: "static|cms-media|submission|external",
        position: 1
      }
    ],
    videoUrl: "",
    sourceCredits: ""
  },

  relationships: {
    routeIds: [],
    relatedPlaceIds: [],
    relatedEventIds: [],
    legacyRoute: "",
    legacyRouteName: ""
  },

  display: {
    featured: false,
    priority: 0,
    mapVisible: true,
    claimable: true
  },

  seo: {
    title: "",
    description: "",
    canonicalPath: ""
  },

  publishing: {
    publishedAt: null,
    publishedBy: "",
    archivedAt: null,
    archivedBy: "",
    archiveReason: ""
  },

  review: {
    lastAppliedRequestId: "",
    lastAppliedAt: null,
    lastAppliedBy: "",
    lastReviewNotes: ""
  },

  source: {
    origin: "static_seed|admin|request_application",
    sourceFile: "js/data/restaurantes.js",
    originalId: "marina-barra-iguacu",
    originalCategory: "Gastronomia",
    legacyIds: [],
    seededAt: null,
    sourceUpdatedAt: null
  },

  createdAt: null,
  createdBy: "",
  updatedAt: null,
  updatedBy: ""
}
```

## Campos editaveis pelo admin

- `name`;
- `categoryId`;
- `categoryLabel`;
- `status`;
- `content`;
- `contact`;
- `location`;
- `media`;
- `relationships`;
- `display`;
- `seo`;
- `publishing`;
- `review`;
- `source` em contexto de importacao/seed;
- `updatedAt`;
- `updatedBy`.

## Campos que podem vir de solicitacao do empreendedor

Somente apos revisao/admin:

| `establishment_update_requests.requestedChanges` | Destino sugerido |
| --- | --- |
| `description` | `content.description` |
| `phone` | `contact.phone` |
| `whatsapp` | `contact.whatsapp` |
| `instagram` | `contact.instagram` |
| `website` | `contact.website` |
| `address` | `location.address` |
| `openingHours` | `content.openingHours` |
| `additionalNotes` | `review.lastReviewNotes` ou `content.notesInternal`, conforme decisao editorial |

Imagens anexadas em `submissions/establishment-updates/...` devem virar candidatas de midia. O admin deve selecionar/copiar para `cms-media/{adminUid}/establishments/{establishmentId}/...` antes de publicar como `media.mainImage` ou `media.gallery`.

## Campos proibidos para empreendedor

O empreendedor nao deve escrever diretamente em:

- `cms_establishments`;
- `id`;
- `slug`;
- `name`;
- `categoryId`;
- `categoryLabel`;
- `status`;
- `location.coordinates`;
- `location.mapsUrl`;
- `media.mainImage`;
- `media.gallery`;
- `relationships`;
- `display`;
- `seo`;
- `publishing`;
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`;
- `review.lastAppliedRequestId`, `review.lastAppliedAt`, `review.lastAppliedBy`;
- qualquer campo de role/permissao/vinculo.

## Regras de publicacao

Para `published`, validar no minimo:

- `id == docId`;
- `slug` nao vazio;
- `name` nao vazio;
- `categoryId` permitido;
- `categoryLabel` nao vazio;
- `status == "published"`;
- `content.summary` ou `content.description` nao vazio;
- `location.address` ou coordenadas validas;
- `updatedAt` e `updatedBy` preenchidos;
- `publishedAt` e `publishedBy` preenchidos.

## Storage

Path recomendado para midia de catalogo:

```text
cms-media/{adminUid}/establishments/{establishmentId}/{timestamp}-{fileName}
```

Path existente para anexos de solicitacao:

```text
submissions/establishment-updates/{uid}/{requestId}/{fileName}
```

Nao misturar `submissions/...` com midia publicada sem revisao administrativa.
