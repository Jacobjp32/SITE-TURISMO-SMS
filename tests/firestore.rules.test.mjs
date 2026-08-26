import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, describe, test } from "node:test";
import { runInNewContext } from "node:vm";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  or,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const PROJECT_ID = "demo-turismo-sms-rules-test";
const RULE_COVERAGE_URL =
  `http://127.0.0.1:8080/emulator/v1/projects/${PROJECT_ID}:ruleCoverage`;

const NEWS_PUBLISHED = {
  title: "Synthetic published news",
  publicado: true,
  status: "published",
};
const NEWS_DRAFT = {
  title: "Synthetic draft news",
  publicado: false,
  status: "draft",
};
const NEWS_WITHOUT_STATUS = {
  title: "Synthetic news without status",
  publicado: false,
};
const NEWS_WITHOUT_PUBLISHED = {
  title: "Synthetic news without publicado",
  slug: "synthetic-without-publicado",
};
const NEWS_PUBLISHED_NULL = {
  title: "Synthetic news with null publicado",
  slug: "synthetic-publicado-null",
  publicado: null,
};
const NEWS_PUBLISHED_STRING = {
  title: "Synthetic news with string publicado",
  slug: "synthetic-publicado-string",
  publicado: "true",
};
const NEWS_PUBLISHED_NUMBER = {
  title: "Synthetic news with numeric publicado",
  slug: "synthetic-publicado-number",
  publicado: 1,
};
const NEWS_PUBLISHED_LIST = {
  title: "Synthetic news with list publicado",
  slug: "synthetic-publicado-list",
  publicado: [],
};
const NEWS_PUBLISHED_MAP = {
  title: "Synthetic news with map publicado",
  slug: "synthetic-publicado-map",
  publicado: {},
};
const NEWS_STATUS_ONLY = {
  title: "Synthetic status-only news",
  slug: "synthetic-status-only",
  status: "publicado",
};
const NEWS_PUBLISHED_WITH_DRAFT_STATUS = {
  title: "Synthetic published news with draft status",
  slug: "synthetic-published-draft-status",
  publicado: true,
  status: "rascunho",
};
const MEDIA_BASELINE = {
  alt: "Synthetic media",
  path: "synthetic/media-public-baseline.jpg",
};

let testEnv;
const expressionLimitMessages = [];
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

function captureExpressionLimit(original) {
  return (...args) => {
    const rendered = args.map(String).join(" ");
    if (/maximum of 1000 expressions/i.test(rendered)) {
      expressionLimitMessages.push(rendered);
    }
    original(...args);
  };
}

function anonymousDb() {
  return testEnv.unauthenticatedContext().firestore();
}

function authenticatedDb(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

function userEntry(uid, role, ativo = true) {
  const data = { role };
  if (ativo !== undefined) {
    data.ativo = ativo;
  }
  return [`usuarios/${uid}`, data];
}

async function seedDocuments(entries) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all(
      entries.map(([path, data]) => setDoc(doc(db, path), data)),
    );
  });
}

async function seedNews() {
  await seedDocuments([
    ["noticias/news-published", NEWS_PUBLISHED],
    ["noticias/news-draft", NEWS_DRAFT],
    ["noticias/news-without-status", NEWS_WITHOUT_STATUS],
  ]);
}

async function seedMedia() {
  await seedDocuments([
    ["media_library/media-public-baseline", MEDIA_BASELINE],
  ]);
}

const ESTABLISHMENT_GROUPS = [
  "core", "content", "contact", "location", "media",
  "relationshipsRouteIds", "relationshipsRelatedPlaceIds", "relationshipsRelatedEventIds",
  "display", "seo", "review", "source", "lifecycle",
];

function establishmentFixture(status = "draft") {
  const published = status === "published";
  const archived = status === "archived";
  return {
    id: "est-v2",
    slug: "est-v2",
    name: "Empreendimento V2",
    categoryId: "gastronomia",
    categoryLabel: "Gastronomia",
    status,
    content: {
      summary: "Resumo válido", description: "", longDescription: "",
      accessibility: "", openingHours: "", tags: [], notesInternal: "",
    },
    contact: {
      phone: "", whatsapp: "", email: "", website: "", instagram: "", facebook: "",
    },
    location: {
      address: "Rua de teste", neighborhood: "", city: "São Mateus do Sul",
      state: "PR", postalCode: "", coordinates: { lat: null, lng: null },
      mapsUrl: "", coordStatus: "", coordNote: "",
    },
    media: {
      mainImage: {
        url: "", path: "", alt: "", caption: "", credit: "", source: "", status: "active",
      },
      gallery: [], videoUrl: "", sourceCredits: "",
    },
    relationships: {
      routeIds: [], relatedPlaceIds: [], relatedEventIds: [], legacyRoute: "", legacyRouteName: "",
    },
    display: { featured: false, priority: 0, mapVisible: true, claimable: true },
    seo: { title: "", description: "", canonicalPath: "" },
    publishing: {
      publishedAt: published ? new Date("2026-08-25T12:00:00Z") : null,
      publishedBy: published ? "admin-v2" : "",
      archivedAt: archived ? new Date("2026-08-25T12:00:00Z") : null,
      archivedBy: archived ? "admin-v2" : "",
      archiveReason: archived ? "Teste" : "",
    },
    review: {
      lastAppliedRequestId: "", lastAppliedAt: null, lastAppliedBy: "", lastReviewNotes: "",
      lastMediaEditedAt: null, lastMediaEditedBy: "", mediaEditReason: "",
    },
    source: {
      origin: "admin", sourceFile: "", originalId: "est-v2", originalCategory: "",
      legacyIds: [], seededAt: null, sourceUpdatedAt: null,
    },
    createdAt: new Date("2026-08-25T10:00:00Z"),
    createdBy: "admin-v2",
    updatedAt: new Date("2026-08-25T10:00:00Z"),
    updatedBy: "admin-v2",
  };
}

function allMarkers() {
  return Object.fromEntries(ESTABLISHMENT_GROUPS.map((group) => [group, 2]));
}

function v2Fixture(status = "draft", markers = allMarkers(), revision = 11) {
  return {
    ...establishmentFixture(status),
    schemaVersion: 2,
    validatedGroups: { ...markers },
    revision,
  };
}

function validGroupMutation(group, source = establishmentFixture()) {
  switch (group) {
    case "core":
      return { slug: "est-v2", name: "Nome atualizado", categoryId: "gastronomia", categoryLabel: "Gastronomia" };
    case "content": return { content: { ...source.content, summary: "Resumo atualizado" } };
    case "contact": return { contact: { ...source.contact, phone: "42 99999-0000" } };
    case "location": return { location: { ...source.location, address: "Nova rua" } };
    case "media": return { media: { ...source.media, videoUrl: "https://example.test/video" } };
    case "relationshipsRouteIds": return { relationships: { ...source.relationships, routeIds: ["rota-erva-mate"] } };
    case "relationshipsRelatedPlaceIds": return { relationships: { ...source.relationships, relatedPlaceIds: ["place-related"] } };
    case "relationshipsRelatedEventIds": return { relationships: { ...source.relationships, relatedEventIds: ["event-related"] } };
    case "display": return { display: { ...source.display, featured: true } };
    case "seo": return { seo: { ...source.seo, title: "SEO atualizado" } };
    case "review": return { review: { ...source.review, lastReviewNotes: "Revisado" } };
    case "source": return { source: { ...source.source, sourceFile: "fonte.json" } };
    case "lifecycle": return { status: "draft", publishing: { ...source.publishing } };
    default: throw new Error(`Grupo desconhecido: ${group}`);
  }
}

function invalidGroupMutation(group, source = establishmentFixture()) {
  const valid = validGroupMutation(group, source);
  switch (group) {
    case "core": return { ...valid, name: "" };
    case "content": return { content: { ...source.content, summary: 42 } };
    case "contact": return { contact: { ...source.contact, phone: null } };
    case "location": return { location: { ...source.location, coordinates: { lat: "x", lng: null } } };
    case "media": return { media: { ...source.media, gallery: "x" } };
    case "relationshipsRouteIds": return { relationships: { ...source.relationships, routeIds: null } };
    case "relationshipsRelatedPlaceIds": return { relationships: { ...source.relationships, relatedPlaceIds: null } };
    case "relationshipsRelatedEventIds": return { relationships: { ...source.relationships, relatedEventIds: null } };
    case "display": return { display: { ...source.display, priority: "alta" } };
    case "seo": return { seo: { ...source.seo, title: null } };
    case "review": return { review: { ...source.review, lastAppliedAt: "ontem" } };
    case "source": return { source: { ...source.source, legacyIds: "x" } };
    case "lifecycle": return { status: "invalid", publishing: { ...source.publishing } };
    default: throw new Error(`Grupo desconhecido: ${group}`);
  }
}

async function writeGroup(target, group, mutation, revision, markers = {}) {
  return updateDoc(target, {
    ...mutation,
    schemaVersion: 2,
    validatedGroups: { ...markers, [group]: 2 },
    revision,
    updatedAt: serverTimestamp(),
    updatedBy: "admin-v2",
  });
}

before(async () => {
  console.warn = captureExpressionLimit(originalConsoleWarn);
  console.error = captureExpressionLimit(originalConsoleError);
  const rules = await readFile(
    new URL("../firestore.rules", import.meta.url),
    "utf8",
  );

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  try {
    const response = await fetch(RULE_COVERAGE_URL);
    console.log(
      `RULE COVERAGE LOCAL: ${RULE_COVERAGE_URL} respondeu HTTP ${response.status}.`,
    );
  } catch (error) {
    console.warn(
      `RULE COVERAGE LOCAL: endpoint indisponível durante a suíte (${error.message}).`,
    );
  } finally {
    await testEnv?.cleanup();
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  }
  assert.equal(
    expressionLimitMessages.length,
    0,
    `FIRESTORE_RULE_EXPRESSION_LIMIT_1000 detectado: ${expressionLimitMessages[0] || ""}`,
  );
});

describe("Contrato de leitura e escrita de noticias", () => {
  test("anônimo lê notícia com publicado == true", async () => {
    await seedNews();
    const snapshot = await assertSucceeds(
      getDoc(doc(anonymousDb(), "noticias", "news-published")),
    );
    assert.equal(snapshot.exists(), true);
  });

  test("anônimo não lê draft com publicado == false", async () => {
    await seedNews();
    await assertFails(
      getDoc(doc(anonymousDb(), "noticias", "news-draft")),
    );
  });

  test("anônimo não lista integralmente a coleção noticias", async () => {
    await seedNews();
    await assertFails(
      getDocs(collection(anonymousDb(), "noticias")),
    );
  });

  test("anônimo consulta noticias com publicado == true", async () => {
    await seedNews();
    const publicQuery = query(
      collection(anonymousDb(), "noticias"),
      where("publicado", "==", true),
    );
    const snapshot = await assertSucceeds(getDocs(publicQuery));
    assert.equal(snapshot.size, 1);
  });

  test("usuário comum não lê draft com publicado == false", async () => {
    await seedDocuments([
      userEntry("user-active", "user", true),
      ["noticias/news-draft", NEWS_DRAFT],
    ]);
    await assertFails(
      getDoc(doc(authenticatedDb("user-active"), "noticias", "news-draft")),
    );
  });

  test("moderator não lê draft com publicado == false", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      ["noticias/news-draft", NEWS_DRAFT],
    ]);
    await assertFails(
      getDoc(
        doc(authenticatedDb("moderator-active"), "noticias", "news-draft"),
      ),
    );
  });

  test("admin ativo lê draft de noticias", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["noticias/news-draft", NEWS_DRAFT],
    ]);
    await assertSucceeds(
      getDoc(doc(authenticatedDb("admin-active"), "noticias", "news-draft")),
    );
  });

  test("anônimo não cria noticia", async () => {
    await assertFails(
      setDoc(
        doc(anonymousDb(), "noticias", "news-draft"),
        NEWS_DRAFT,
      ),
    );
  });

  test("usuário comum não cria noticia", async () => {
    await seedDocuments([userEntry("user-active", "user", true)]);
    await assertFails(
      setDoc(
        doc(authenticatedDb("user-active"), "noticias", "news-draft"),
        NEWS_DRAFT,
      ),
    );
  });

  test("moderator não cria noticia", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
    ]);
    await assertFails(
      setDoc(
        doc(authenticatedDb("moderator-active"), "noticias", "news-draft"),
        NEWS_DRAFT,
      ),
    );
  });

  test("admin ativo cria noticia", async () => {
    await seedDocuments([userEntry("admin-active", "admin", true)]);
    await assertSucceeds(
      setDoc(
        doc(authenticatedDb("admin-active"), "noticias", "news-draft"),
        NEWS_DRAFT,
      ),
    );
  });

  test("admin inativo não cria noticia conforme contrato atual de ativo", async () => {
    await seedDocuments([userEntry("admin-inactive", "admin", false)]);
    await assertFails(
      setDoc(
        doc(authenticatedDb("admin-inactive"), "noticias", "news-draft"),
        NEWS_DRAFT,
      ),
    );
  });

  test("anônimo não lê documento sem publicado", async () => {
    await seedDocuments([
      ["noticias/news-without-publicado", NEWS_WITHOUT_PUBLISHED],
    ]);
    await assertFails(
      getDoc(doc(anonymousDb(), "noticias", "news-without-publicado")),
    );
  });

  test("anônimo não lê tipos inválidos de publicado", async () => {
    const invalidPublishedFixtures = [
      ["news-publicado-null", NEWS_PUBLISHED_NULL],
      ["news-publicado-string", NEWS_PUBLISHED_STRING],
      ["news-publicado-number", NEWS_PUBLISHED_NUMBER],
      ["news-publicado-list", NEWS_PUBLISHED_LIST],
      ["news-publicado-map", NEWS_PUBLISHED_MAP],
    ];
    await seedDocuments(
      invalidPublishedFixtures.map(([id, data]) => [`noticias/${id}`, data]),
    );

    for (const [id] of invalidPublishedFixtures) {
      await assertFails(getDoc(doc(anonymousDb(), "noticias", id)));
    }
  });

  test("anônimo não lê documento apenas com status == publicado", async () => {
    await seedDocuments([
      ["noticias/news-status-only", NEWS_STATUS_ONLY],
    ]);
    await assertFails(
      getDoc(doc(anonymousDb(), "noticias", "news-status-only")),
    );
  });

  test("anônimo lê publicado true mesmo com status == rascunho", async () => {
    await seedDocuments([
      [
        "noticias/news-published-draft-status",
        NEWS_PUBLISHED_WITH_DRAFT_STATUS,
      ],
    ]);
    const snapshot = await assertSucceeds(
      getDoc(
        doc(anonymousDb(), "noticias", "news-published-draft-status"),
      ),
    );
    assert.equal(snapshot.exists(), true);
  });

  test("usuário comum lê documento publicado", async () => {
    await seedDocuments([
      userEntry("user-active", "user", true),
      ["noticias/news-published", NEWS_PUBLISHED],
    ]);
    const snapshot = await assertSucceeds(
      getDoc(
        doc(authenticatedDb("user-active"), "noticias", "news-published"),
      ),
    );
    assert.equal(snapshot.exists(), true);
  });

  test("usuário autenticado sem documento em usuarios lê publicado pelo ramo público", async () => {
    await seedDocuments([
      ["noticias/news-published", NEWS_PUBLISHED],
    ]);
    const snapshot = await assertSucceeds(
      getDoc(
        doc(
          authenticatedDb("user-no-profile"),
          "noticias",
          "news-published",
        ),
      ),
    );
    assert.equal(snapshot.exists(), true);
  });

  test("admin lê documento publicado", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["noticias/news-published", NEWS_PUBLISHED],
    ]);
    const snapshot = await assertSucceeds(
      getDoc(
        doc(authenticatedDb("admin-active"), "noticias", "news-published"),
      ),
    );
    assert.equal(snapshot.exists(), true);
  });

  test("admin lê documentos legados sem publicado ou com tipo inválido", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["noticias/news-without-publicado", NEWS_WITHOUT_PUBLISHED],
      ["noticias/news-publicado-string", NEWS_PUBLISHED_STRING],
    ]);
    const db = authenticatedDb("admin-active");
    const withoutPublished = await assertSucceeds(
      getDoc(doc(db, "noticias", "news-without-publicado")),
    );
    const invalidPublished = await assertSucceeds(
      getDoc(doc(db, "noticias", "news-publicado-string")),
    );
    assert.equal(withoutPublished.exists(), true);
    assert.equal(invalidPublished.exists(), true);
  });

  test("moderator lê documento publicado", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      ["noticias/news-published", NEWS_PUBLISHED],
    ]);
    const snapshot = await assertSucceeds(
      getDoc(
        doc(
          authenticatedDb("moderator-active"),
          "noticias",
          "news-published",
        ),
      ),
    );
    assert.equal(snapshot.exists(), true);
  });

  test("documento inexistente não expõe conteúdo ao público e permite get administrativo", async () => {
    await seedDocuments([userEntry("admin-active", "admin", true)]);
    await assertFails(
      getDoc(doc(anonymousDb(), "noticias", "news-missing")),
    );
    const snapshot = await assertSucceeds(
      getDoc(
        doc(authenticatedDb("admin-active"), "noticias", "news-missing"),
      ),
    );
    assert.equal(snapshot.exists(), false);
  });

  test("anônimo não consulta publicado == false", async () => {
    await seedNews();
    const draftQuery = query(
      collection(anonymousDb(), "noticias"),
      where("publicado", "==", false),
    );
    await assertFails(getDocs(draftQuery));
  });

  test("anônimo não consulta somente status == publicado", async () => {
    await seedDocuments([
      ["noticias/news-status-only", NEWS_STATUS_ONLY],
    ]);
    const statusQuery = query(
      collection(anonymousDb(), "noticias"),
      where("status", "==", "publicado"),
    );
    await assertFails(getDocs(statusQuery));
  });

  test("anônimo consulta slug combinado com publicado == true", async () => {
    const publishedWithSlug = {
      ...NEWS_PUBLISHED,
      slug: "synthetic-published",
    };
    await seedDocuments([
      ["noticias/news-published", publishedWithSlug],
      ["noticias/news-draft", { ...NEWS_DRAFT, slug: "synthetic-published" }],
    ]);
    const publicSlugQuery = query(
      collection(anonymousDb(), "noticias"),
      where("slug", "==", "synthetic-published"),
      where("publicado", "==", true),
    );
    const snapshot = await assertSucceeds(getDocs(publicSlugQuery));
    assert.equal(snapshot.size, 1);
  });

  test("anônimo não consulta somente slug", async () => {
    await seedDocuments([
      [
        "noticias/news-published",
        { ...NEWS_PUBLISHED, slug: "synthetic-shared-slug" },
      ],
      [
        "noticias/news-draft",
        { ...NEWS_DRAFT, slug: "synthetic-shared-slug" },
      ],
    ]);
    const slugQuery = query(
      collection(anonymousDb(), "noticias"),
      where("slug", "==", "synthetic-shared-slug"),
    );
    await assertFails(getDocs(slugQuery));
  });

  test("usuário comum lista documentos com publicado == true", async () => {
    await seedDocuments([
      userEntry("user-active", "user", true),
      ["noticias/news-published", NEWS_PUBLISHED],
      ["noticias/news-draft", NEWS_DRAFT],
    ]);
    const publicQuery = query(
      collection(authenticatedDb("user-active"), "noticias"),
      where("publicado", "==", true),
    );
    const snapshot = await assertSucceeds(getDocs(publicQuery));
    assert.equal(snapshot.size, 1);
  });

  test("usuário comum não lista a coleção integralmente", async () => {
    await seedDocuments([
      userEntry("user-active", "user", true),
      ["noticias/news-published", NEWS_PUBLISHED],
      ["noticias/news-draft", NEWS_DRAFT],
    ]);
    await assertFails(
      getDocs(collection(authenticatedDb("user-active"), "noticias")),
    );
  });

  test("admin lista a coleção integralmente", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["noticias/news-published", NEWS_PUBLISHED],
      ["noticias/news-draft", NEWS_DRAFT],
      ["noticias/news-without-publicado", NEWS_WITHOUT_PUBLISHED],
    ]);
    const snapshot = await assertSucceeds(
      getDocs(collection(authenticatedDb("admin-active"), "noticias")),
    );
    assert.equal(snapshot.size, 3);
  });

  test("admin consulta drafts com publicado == false", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["noticias/news-published", NEWS_PUBLISHED],
      ["noticias/news-draft", NEWS_DRAFT],
    ]);
    const draftQuery = query(
      collection(authenticatedDb("admin-active"), "noticias"),
      where("publicado", "==", false),
    );
    const snapshot = await assertSucceeds(getDocs(draftQuery));
    assert.equal(snapshot.size, 1);
  });

  test("moderator lista documentos com publicado == true", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      ["noticias/news-published", NEWS_PUBLISHED],
      ["noticias/news-draft", NEWS_DRAFT],
    ]);
    const publicQuery = query(
      collection(authenticatedDb("moderator-active"), "noticias"),
      where("publicado", "==", true),
    );
    const snapshot = await assertSucceeds(getDocs(publicQuery));
    assert.equal(snapshot.size, 1);
  });

  test("moderator não lista a coleção integralmente", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      ["noticias/news-published", NEWS_PUBLISHED],
      ["noticias/news-draft", NEWS_DRAFT],
    ]);
    await assertFails(
      getDocs(collection(authenticatedDb("moderator-active"), "noticias")),
    );
  });

  test("público consulta publicado in [true]", async () => {
    await seedNews();
    const publicQuery = query(
      collection(anonymousDb(), "noticias"),
      where("publicado", "in", [true]),
    );
    const snapshot = await assertSucceeds(getDocs(publicQuery));
    assert.equal(snapshot.size, 1);
  });

  test("público não consulta publicado in [true, false]", async () => {
    await seedNews();
    const mixedQuery = query(
      collection(anonymousDb(), "noticias"),
      where("publicado", "in", [true, false]),
    );
    await assertFails(getDocs(mixedQuery));
  });

  test("público não executa consulta OR que pode incluir draft", async () => {
    await seedNews();
    const mixedOrQuery = query(
      collection(anonymousDb(), "noticias"),
      or(
        where("publicado", "==", true),
        where("publicado", "==", false),
      ),
    );
    await assertFails(getDocs(mixedOrQuery));
  });

  test("admin atualiza notícia existente", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["noticias/news-draft", NEWS_DRAFT],
    ]);
    await assertSucceeds(
      updateDoc(
        doc(authenticatedDb("admin-active"), "noticias", "news-draft"),
        { title: "Synthetic updated draft news" },
      ),
    );
  });

  test("admin exclui notícia existente", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["noticias/news-draft", NEWS_DRAFT],
    ]);
    await assertSucceeds(
      deleteDoc(
        doc(authenticatedDb("admin-active"), "noticias", "news-draft"),
      ),
    );
  });
});

describe("Contrato de leitura e escrita de media_library", () => {
  const MEDIA_RUNTIME = {
    title: "Synthetic runtime media",
    url: "https://example.com/media/synthetic-image.jpg",
    storagePath: "cms-media/test-user/synthetic-image.jpg",
    contentType: "image/jpeg",
    size: 1024,
    category: "synthetic",
    alt: "Synthetic runtime media",
  };

  test("anônimo não lê media_library", async () => {
    await seedMedia();
    await assertFails(
      getDoc(
        doc(anonymousDb(), "media_library", "media-public-baseline"),
      ),
    );
  });

  test("anônimo não lista integralmente media_library", async () => {
    await seedMedia();
    await assertFails(
      getDocs(collection(anonymousDb(), "media_library")),
    );
  });

  test("usuário comum não lê media_library", async () => {
    await seedDocuments([
      userEntry("user-active", "user", true),
      ["media_library/media-public-baseline", MEDIA_BASELINE],
    ]);
    await assertFails(
      getDoc(
        doc(
          authenticatedDb("user-active"),
          "media_library",
          "media-public-baseline",
        ),
      ),
    );
  });

  test("moderator não lê media_library", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      ["media_library/media-public-baseline", MEDIA_BASELINE],
    ]);
    await assertFails(
      getDoc(
        doc(
          authenticatedDb("moderator-active"),
          "media_library",
          "media-public-baseline",
        ),
      ),
    );
  });

  test("admin ativo lê media_library", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["media_library/media-public-baseline", MEDIA_BASELINE],
    ]);
    await assertSucceeds(
      getDoc(
        doc(
          authenticatedDb("admin-active"),
          "media_library",
          "media-public-baseline",
        ),
      ),
    );
  });

  test("anônimo não cria media_library", async () => {
    await assertFails(
      setDoc(
        doc(anonymousDb(), "media_library", "media-public-baseline"),
        MEDIA_BASELINE,
      ),
    );
  });

  test("usuário comum não cria media_library", async () => {
    await seedDocuments([userEntry("user-active", "user", true)]);
    await assertFails(
      setDoc(
        doc(
          authenticatedDb("user-active"),
          "media_library",
          "media-public-baseline",
        ),
        MEDIA_BASELINE,
      ),
    );
  });

  test("moderator não cria media_library", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
    ]);
    await assertFails(
      setDoc(
        doc(
          authenticatedDb("moderator-active"),
          "media_library",
          "media-public-baseline",
        ),
        MEDIA_BASELINE,
      ),
    );
  });

  test("admin ativo cria media_library", async () => {
    await seedDocuments([userEntry("admin-active", "admin", true)]);
    await assertSucceeds(
      setDoc(
        doc(
          authenticatedDb("admin-active"),
          "media_library",
          "media-public-baseline",
        ),
        MEDIA_BASELINE,
      ),
    );
  });

  test("admin inativo não cria media_library", async () => {
    await seedDocuments([userEntry("admin-inactive", "admin", false)]);
    await assertFails(
      setDoc(
        doc(
          authenticatedDb("admin-inactive"),
          "media_library",
          "media-public-baseline",
        ),
        MEDIA_BASELINE,
      ),
    );
  });

  test("usuário comum não lista media_library", async () => {
    await seedDocuments([
      userEntry("user-active", "user", true),
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    await assertFails(
      getDocs(
        collection(authenticatedDb("user-active"), "media_library"),
      ),
    );
  });

  test("usuário autenticado sem perfil não lê media_library", async () => {
    await seedDocuments([
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    await assertFails(
      getDoc(
        doc(
          authenticatedDb("profileless-user"),
          "media_library",
          "media-test-runtime",
        ),
      ),
    );
  });

  test("usuário autenticado sem perfil não lista media_library", async () => {
    await seedDocuments([
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    await assertFails(
      getDocs(
        collection(
          authenticatedDb("profileless-user"),
          "media_library",
        ),
      ),
    );
  });

  test("moderator não lista media_library", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    await assertFails(
      getDocs(
        collection(authenticatedDb("moderator-active"), "media_library"),
      ),
    );
  });

  test("admin inativo não lê media_library", async () => {
    await seedDocuments([
      userEntry("admin-inactive", "admin", false),
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    await assertFails(
      getDoc(
        doc(
          authenticatedDb("admin-inactive"),
          "media_library",
          "media-test-runtime",
        ),
      ),
    );
  });

  test("admin inativo não lista media_library", async () => {
    await seedDocuments([
      userEntry("admin-inactive", "admin", false),
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    await assertFails(
      getDocs(
        collection(authenticatedDb("admin-inactive"), "media_library"),
      ),
    );
  });

  test("admin ativo lista integralmente media_library", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["media_library/media-test-legacy", MEDIA_BASELINE],
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    const snapshot = await assertSucceeds(
      getDocs(
        collection(authenticatedDb("admin-active"), "media_library"),
      ),
    );
    assert.equal(snapshot.size, 2);
  });

  test("admin ativo lê registro legado e esparso de media_library", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["media_library/media-test-legacy", MEDIA_BASELINE],
    ]);
    const snapshot = await assertSucceeds(
      getDoc(
        doc(
          authenticatedDb("admin-active"),
          "media_library",
          "media-test-legacy",
        ),
      ),
    );
    assert.equal(snapshot.exists(), true);
  });

  test("admin ativo consulta documento inexistente de media_library", async () => {
    await seedDocuments([userEntry("admin-active", "admin", true)]);
    const snapshot = await assertSucceeds(
      getDoc(
        doc(
          authenticatedDb("admin-active"),
          "media_library",
          "media-test-missing",
        ),
      ),
    );
    assert.equal(snapshot.exists(), false);
  });

  test("anônimo não consulta media_library por url", async () => {
    await seedDocuments([
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    await assertFails(
      getDocs(
        query(
          collection(anonymousDb(), "media_library"),
          where(
            "url",
            "==",
            "https://example.com/media/synthetic-image.jpg",
          ),
        ),
      ),
    );
  });

  test("anônimo não consulta media_library por storagePath", async () => {
    await seedDocuments([
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    await assertFails(
      getDocs(
        query(
          collection(anonymousDb(), "media_library"),
          where(
            "storagePath",
            "==",
            "cms-media/test-user/synthetic-image.jpg",
          ),
        ),
      ),
    );
  });

  test("usuário autenticado sem perfil não cria media_library", async () => {
    await assertFails(
      setDoc(
        doc(
          authenticatedDb("profileless-user"),
          "media_library",
          "media-test-runtime",
        ),
        MEDIA_RUNTIME,
      ),
    );
  });

  test("admin ativo atualiza documento existente de media_library", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    await assertSucceeds(
      updateDoc(
        doc(
          authenticatedDb("admin-active"),
          "media_library",
          "media-test-runtime",
        ),
        { title: "Synthetic updated runtime media" },
      ),
    );
  });

  test("admin ativo exclui documento existente de media_library", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    await assertSucceeds(
      deleteDoc(
        doc(
          authenticatedDb("admin-active"),
          "media_library",
          "media-test-runtime",
        ),
      ),
    );
  });

  test("usuário comum não atualiza media_library", async () => {
    await seedDocuments([
      userEntry("user-active", "user", true),
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    await assertFails(
      updateDoc(
        doc(
          authenticatedDb("user-active"),
          "media_library",
          "media-test-runtime",
        ),
        { title: "Synthetic unauthorized user update" },
      ),
    );
  });

  test("usuário comum não exclui media_library", async () => {
    await seedDocuments([
      userEntry("user-active", "user", true),
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    await assertFails(
      deleteDoc(
        doc(
          authenticatedDb("user-active"),
          "media_library",
          "media-test-runtime",
        ),
      ),
    );
  });

  test("moderator não atualiza media_library", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    await assertFails(
      updateDoc(
        doc(
          authenticatedDb("moderator-active"),
          "media_library",
          "media-test-runtime",
        ),
        { title: "Synthetic unauthorized moderator update" },
      ),
    );
  });

  test("moderator não exclui media_library", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      ["media_library/media-test-runtime", MEDIA_RUNTIME],
    ]);
    await assertFails(
      deleteDoc(
        doc(
          authenticatedDb("moderator-active"),
          "media_library",
          "media-test-runtime",
        ),
      ),
    );
  });
});

describe("Autorização administrativa pós-B2A5 exige ativo boolean true", () => {
  const cases = [
    {
      name: "ativo true permite",
      uid: "admin-active",
      profile: { role: "admin", ativo: true },
      expectation: assertSucceeds,
    },
    {
      name: "ativo false nega",
      uid: "admin-inactive",
      profile: { role: "admin", ativo: false },
      expectation: assertFails,
    },
    {
      name: "campo ativo ausente nega",
      uid: "admin-missing-active",
      profile: { role: "admin" },
      expectation: assertFails,
    },
    {
      name: "ativo null nega",
      uid: "admin-null",
      profile: { role: "admin", ativo: null },
      expectation: assertFails,
    },
    {
      name: "ativo string true nega",
      uid: "admin-string",
      profile: { role: "admin", ativo: "true" },
      expectation: assertFails,
    },
    {
      name: "ativo numérico 1 nega",
      uid: "admin-number",
      profile: { role: "admin", ativo: 1 },
      expectation: assertFails,
    },
    {
      name: "ativo array nega",
      uid: "admin-array",
      profile: { role: "admin", ativo: [] },
      expectation: assertFails,
    },
    {
      name: "ativo map nega",
      uid: "admin-map",
      profile: { role: "admin", ativo: {} },
      expectation: assertFails,
    },
    {
      name: "role ausente nega",
      uid: "admin-role-missing",
      profile: { ativo: true },
      expectation: assertFails,
    },
    {
      name: "role inválida nega",
      uid: "admin-invalid-role",
      profile: { role: "invalid", ativo: true },
      expectation: assertFails,
    },
  ];

  for (const { name, uid, profile, expectation } of cases) {
    test(`PÓS-B2A5: ${name} na criação administrativa de noticia`, async () => {
      await seedDocuments([[`usuarios/${uid}`, profile]]);
      await expectation(
        setDoc(
          doc(authenticatedDb(uid), "noticias", `news-${uid}`),
          NEWS_DRAFT,
        ),
      );
    });
  }

  test("PÓS-B2A5: documento usuarios ausente nega criação administrativa de noticia", async () => {
    await assertFails(
      setDoc(
        doc(
          authenticatedDb("user-no-profile"),
          "noticias",
          "news-user-no-profile",
        ),
        NEWS_DRAFT,
      ),
    );
  });
});

describe("Semântica pós-B2A5 de moderator", () => {
  test("PÓS-B2A5: moderator ativo lê eventos_pendentes", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      [
        "eventos_pendentes/pending-event",
        { submittedBy: "synthetic-owner", status: "pendente" },
      ],
    ]);
    await assertSucceeds(
      getDoc(
        doc(
          authenticatedDb("moderator-active"),
          "eventos_pendentes",
          "pending-event",
        ),
      ),
    );
  });

  test("PÓS-B2A5: moderator ativo atualiza eventos_pendentes", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      [
        "eventos_pendentes/pending-event",
        { submittedBy: "synthetic-owner", status: "pendente" },
      ],
    ]);
    await assertSucceeds(
      updateDoc(
        doc(
          authenticatedDb("moderator-active"),
          "eventos_pendentes",
          "pending-event",
        ),
        { status: "reviewing" },
      ),
    );
  });

  test("PÓS-B2A5: moderator ativo exclui eventos_pendentes", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      [
        "eventos_pendentes/pending-event",
        { submittedBy: "synthetic-owner", status: "pendente" },
      ],
    ]);
    await assertSucceeds(
      deleteDoc(
        doc(
          authenticatedDb("moderator-active"),
          "eventos_pendentes",
          "pending-event",
        ),
      ),
    );
  });

  test("PÓS-B2A5: moderator inativo recebe DENY em eventos_pendentes", async () => {
    await seedDocuments([
      userEntry("moderator-inactive", "moderator", false),
      [
        "eventos_pendentes/pending-event",
        { submittedBy: "synthetic-owner", status: "pendente" },
      ],
    ]);
    await assertFails(
      getDoc(
        doc(
          authenticatedDb("moderator-inactive"),
          "eventos_pendentes",
          "pending-event",
        ),
      ),
    );
  });

  for (const { name, ativo } of [
    { name: "ativo ausente", ativo: undefined },
    { name: "ativo null", ativo: null },
    { name: "ativo string", ativo: "true" },
    { name: "ativo numérico", ativo: 1 },
    { name: "ativo array", ativo: [] },
    { name: "ativo map", ativo: {} },
  ]) {
    test(`PÓS-B2A5: moderator com ${name} recebe DENY em eventos_pendentes`, async () => {
      const uid = `moderator-malformed-${String(name).replaceAll(" ", "-")}`;
      await seedDocuments([
        ativo === undefined
          ? [`usuarios/${uid}`, { role: "moderator" }]
          : userEntry(uid, "moderator", ativo),
        [
          "eventos_pendentes/pending-event",
          { submittedBy: "synthetic-owner", status: "pendente" },
        ],
      ]);
      await assertFails(
        getDoc(
          doc(authenticatedDb(uid), "eventos_pendentes", "pending-event"),
        ),
      );
    });
  }

  test("PÓS-B2A5: moderator não cria noticia exclusiva de admin", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
    ]);
    await assertFails(
      setDoc(
        doc(authenticatedDb("moderator-active"), "noticias", "news-draft"),
        NEWS_DRAFT,
      ),
    );
  });

  test("PÓS-B2A5: moderator não cria media_library exclusiva de admin", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
    ]);
    await assertFails(
      setDoc(
        doc(
          authenticatedDb("moderator-active"),
          "media_library",
          "media-public-baseline",
        ),
        MEDIA_BASELINE,
      ),
    );
  });

  test("PÓS-B2A5: moderator não lista usuarios", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      userEntry("user-active", "user", true),
    ]);
    await assertFails(
      getDocs(collection(authenticatedDb("moderator-active"), "usuarios")),
    );
  });

  test("PÓS-B2A5: moderator lê o próprio documento usuario", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
    ]);
    await assertSucceeds(
      getDoc(
        doc(
          authenticatedDb("moderator-active"),
          "usuarios",
          "moderator-active",
        ),
      ),
    );
  });

  test("PÓS-B2A5: moderator não administra cms_establishments draft exclusivo de admin", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      [
        "cms_establishments/synthetic-draft",
        { name: "Synthetic draft establishment", status: "draft" },
      ],
    ]);
    await assertFails(
      deleteDoc(
        doc(
          authenticatedDb("moderator-active"),
          "cms_establishments",
          "synthetic-draft",
        ),
      ),
    );
  });

  test("PÓS-B2A5: moderator escreve eventos_aprovados conforme contrato preservado", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
    ]);
    await assertSucceeds(
      setDoc(
        doc(
          authenticatedDb("moderator-active"),
          "eventos_aprovados",
          "approved-event",
        ),
        { title: "Synthetic approved event", status: "approved" },
      ),
    );
  });
});

describe("Schema de autorização de usuarios pós-B2A5", () => {
  test("usuário ativo lê o próprio documento", async () => {
    await seedDocuments([userEntry("user-active", "user", true)]);
    await assertSucceeds(
      getDoc(doc(authenticatedDb("user-active"), "usuarios", "user-active")),
    );
  });

  test("usuário não lê documento de outro uid", async () => {
    await seedDocuments([
      userEntry("user-active", "user", true),
      userEntry("other-user", "user", true),
    ]);
    await assertFails(
      getDoc(doc(authenticatedDb("user-active"), "usuarios", "other-user")),
    );
  });

  test("usuário não lista usuarios", async () => {
    await seedDocuments([userEntry("user-active", "user", true)]);
    await assertFails(
      getDocs(collection(authenticatedDb("user-active"), "usuarios")),
    );
  });

  test("usuário cria o próprio perfil com role user e ativo true", async () => {
    await assertSucceeds(
      setDoc(doc(authenticatedDb("new-user"), "usuarios", "new-user"), {
        nome: "Synthetic user",
        role: "user",
        ativo: true,
      }),
    );
  });

  for (const role of ["admin", "moderator"]) {
    test(`usuário não cria o próprio perfil com role ${role}`, async () => {
      const uid = `self-create-${role}`;
      await assertFails(
        setDoc(doc(authenticatedDb(uid), "usuarios", uid), {
          nome: "Synthetic user",
          role,
          ativo: true,
        }),
      );
    });
  }

  for (const { name, ativo } of [
    { name: "false", ativo: false },
    { name: "null", ativo: null },
    { name: "string", ativo: "true" },
    { name: "number", ativo: 1 },
    { name: "array", ativo: [] },
    { name: "map", ativo: {} },
    { name: "ausente", ativo: undefined },
  ]) {
    test(`usuário não cria o próprio perfil com ativo ${name}`, async () => {
      const uid = `self-create-active-${name}`;
      const profile = { nome: "Synthetic user", role: "user" };
      if (ativo !== undefined) {
        profile.ativo = ativo;
      }
      await assertFails(
        setDoc(doc(authenticatedDb(uid), "usuarios", uid), profile),
      );
    });
  }

  for (const { name, profile } of [
    { name: "ausente", profile: { ativo: true } },
    { name: "inválida", profile: { role: "owner", ativo: true } },
  ]) {
    test(`usuário não cria o próprio perfil com role ${name}`, async () => {
      const uid = `self-create-role-${name}`;
      await assertFails(
        setDoc(doc(authenticatedDb(uid), "usuarios", uid), {
          nome: "Synthetic user",
          ...profile,
        }),
      );
    });
  }

  test("usuário não cria documento de outro uid", async () => {
    await assertFails(
      setDoc(doc(authenticatedDb("user-active"), "usuarios", "other-user"), {
        nome: "Synthetic other user",
        role: "user",
        ativo: true,
      }),
    );
  });

  test("usuário atualiza somente campos de perfil permitidos", async () => {
    await seedDocuments([
      [
        "usuarios/user-active",
        {
          nome: "Synthetic user",
          telefone: "",
          tipo: "turista",
          organizacao: "",
          role: "user",
          ativo: true,
        },
      ],
    ]);
    await assertSucceeds(
      updateDoc(doc(authenticatedDb("user-active"), "usuarios", "user-active"), {
        nome: "Synthetic updated user",
        telefone: "000000000",
      }),
    );
  });

  for (const role of ["admin", "moderator"]) {
    test(`usuário não altera a própria role para ${role}`, async () => {
      const uid = `user-role-${role}`;
      await seedDocuments([userEntry(uid, "user", true)]);
      await assertFails(
        updateDoc(doc(authenticatedDb(uid), "usuarios", uid), { role }),
      );
    });
  }

  for (const { name, role } of [
    { name: "inválida", role: "owner" },
    { name: "null", role: null },
    { name: "numérica", role: 1 },
    { name: "ausente", role: undefined },
  ]) {
    test(`usuário não altera a própria role para valor ${name}`, async () => {
      const uid = `user-invalid-role-${name}`;
      await seedDocuments([userEntry(uid, "user", true)]);
      await assertFails(
        updateDoc(doc(authenticatedDb(uid), "usuarios", uid), {
          role: role === undefined ? deleteField() : role,
        }),
      );
    });
  }

  test("usuário não altera o próprio ativo", async () => {
    await seedDocuments([userEntry("user-active", "user", true)]);
    await assertFails(
      updateDoc(doc(authenticatedDb("user-active"), "usuarios", "user-active"), {
        ativo: false,
      }),
    );
  });

  for (const { name, ativo } of [
    { name: "null", ativo: null },
    { name: "string", ativo: "true" },
    { name: "number", ativo: 1 },
    { name: "array", ativo: [] },
    { name: "map", ativo: {} },
    { name: "ausente", ativo: undefined },
  ]) {
    test(`usuário não altera o próprio ativo para valor ${name}`, async () => {
      const uid = `user-invalid-active-${name}`;
      await seedDocuments([userEntry(uid, "user", true)]);
      await assertFails(
        updateDoc(doc(authenticatedDb(uid), "usuarios", uid), {
          ativo: ativo === undefined ? deleteField() : ativo,
        }),
      );
    });
  }

  test("admin ativo lista usuarios", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      userEntry("user-active", "user", true),
    ]);
    await assertSucceeds(
      getDocs(collection(authenticatedDb("admin-active"), "usuarios")),
    );
  });

  test("admin ativo cria perfil de autorização válido", async () => {
    await seedDocuments([userEntry("admin-active", "admin", true)]);
    await assertSucceeds(
      setDoc(
        doc(authenticatedDb("admin-active"), "usuarios", "created-user"),
        { nome: "Synthetic created user", role: "moderator", ativo: true },
      ),
    );
  });

  test("admin ativo atualiza role para valor permitido", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      userEntry("managed-user", "user", true),
    ]);
    await assertSucceeds(
      updateDoc(
        doc(authenticatedDb("admin-active"), "usuarios", "managed-user"),
        { role: "moderator" },
      ),
    );
  });

  test("admin ativo atualiza ativo com booleanos true e false", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      userEntry("managed-user", "user", true),
    ]);
    const target = doc(
      authenticatedDb("admin-active"),
      "usuarios",
      "managed-user",
    );
    await assertSucceeds(updateDoc(target, { ativo: false }));
    await assertSucceeds(updateDoc(target, { ativo: true }));
  });

  test("admin ativo não cria perfil com role inválida", async () => {
    await seedDocuments([userEntry("admin-active", "admin", true)]);
    await assertFails(
      setDoc(
        doc(authenticatedDb("admin-active"), "usuarios", "invalid-role"),
        { role: "owner", ativo: true },
      ),
    );
  });

  test("admin ativo não atualiza perfil para role inválida", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      userEntry("managed-user", "user", true),
    ]);
    await assertFails(
      updateDoc(
        doc(authenticatedDb("admin-active"), "usuarios", "managed-user"),
        { role: "owner" },
      ),
    );
  });

  test("admin ativo não cria perfil com role ausente", async () => {
    await seedDocuments([userEntry("admin-active", "admin", true)]);
    await assertFails(
      setDoc(
        doc(authenticatedDb("admin-active"), "usuarios", "missing-role"),
        { ativo: true },
      ),
    );
  });

  test("admin ativo não atualiza perfil para remover role", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      userEntry("managed-user", "user", true),
    ]);
    await assertFails(
      setDoc(
        doc(authenticatedDb("admin-active"), "usuarios", "managed-user"),
        { ativo: true },
      ),
    );
  });

  for (const { name, ativo } of [
    { name: "null", ativo: null },
    { name: "string", ativo: "true" },
    { name: "number", ativo: 1 },
    { name: "array", ativo: [] },
    { name: "map", ativo: {} },
    { name: "ausente", ativo: undefined },
  ]) {
    test(`admin ativo não cria perfil com ativo ${name}`, async () => {
      await seedDocuments([userEntry("admin-active", "admin", true)]);
      const profile = { role: "user" };
      if (ativo !== undefined) {
        profile.ativo = ativo;
      }
      await assertFails(
        setDoc(
          doc(
            authenticatedDb("admin-active"),
            "usuarios",
            `created-malformed-${name}`,
          ),
          profile,
        ),
      );
    });

    test(`admin ativo não atualiza perfil para ativo ${name}`, async () => {
      await seedDocuments([
        userEntry("admin-active", "admin", true),
        userEntry(`managed-malformed-${name}`, "user", true),
      ]);
      const target = doc(
        authenticatedDb("admin-active"),
        "usuarios",
        `managed-malformed-${name}`,
      );
      if (ativo === undefined) {
        await assertFails(setDoc(target, { role: "user" }));
      } else {
        await assertFails(updateDoc(target, { ativo }));
      }
    });
  }
});

describe("Regressão pós-B2A5 do fallback deny", () => {
  test("PÓS-B2A5: anônimo não lê coleção desconhecida", async () => {
    await seedDocuments([
      ["private_unknown_collection/private-document", { value: "synthetic" }],
    ]);
    await assertFails(
      getDoc(
        doc(
          anonymousDb(),
          "private_unknown_collection",
          "private-document",
        ),
      ),
    );
  });

  test("PÓS-B2A5: usuário comum não lê coleção desconhecida", async () => {
    await seedDocuments([
      userEntry("user-active", "user", true),
      ["private_unknown_collection/private-document", { value: "synthetic" }],
    ]);
    await assertFails(
      getDoc(
        doc(
          authenticatedDb("user-active"),
          "private_unknown_collection",
          "private-document",
        ),
      ),
    );
  });

  test("PÓS-B2A5: admin não lê coleção desconhecida sem match explícito", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["private_unknown_collection/private-document", { value: "synthetic" }],
    ]);
    await assertFails(
      getDoc(
        doc(
          authenticatedDb("admin-active"),
          "private_unknown_collection",
          "private-document",
        ),
      ),
    );
  });
});

describe("CMS establishments C1 V2 — shell e leitura pública legada", () => {
  test("admin cria somente shell draft exato e consegue lê-lo", async () => {
    await seedDocuments([userEntry("admin-v2", "admin", true)]);
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "shell-v2");
    await assertSucceeds(setDoc(target, {
      id: "shell-v2", slug: "shell-v2", status: "draft",
      createdAt: serverTimestamp(), createdBy: "admin-v2",
      updatedAt: serverTimestamp(), updatedBy: "admin-v2",
      schemaVersion: 2, validatedGroups: {}, revision: 0,
    }));
    await assertSucceeds(getDoc(target));
    await assertFails(getDoc(doc(anonymousDb(), "cms_establishments", "shell-v2")));
  });

  for (const [name, change] of [
    ["status published", { status: "published" }],
    ["campo extra", { name: "Não permitido" }],
    ["revision inválida", { revision: 1 }],
    ["slug diferente do documentId", { slug: "outro" }],
  ]) {
    test(`nega shell inválido: ${name}`, async () => {
      await seedDocuments([userEntry("admin-v2", "admin", true)]);
      await assertFails(setDoc(
        doc(authenticatedDb("admin-v2"), "cms_establishments", `shell-invalid-${name.replaceAll(" ", "-")}`),
        {
          id: `shell-invalid-${name.replaceAll(" ", "-")}`,
          slug: `shell-invalid-${name.replaceAll(" ", "-")}`,
          status: "draft", createdAt: serverTimestamp(), createdBy: "admin-v2",
          updatedAt: serverTimestamp(), updatedBy: "admin-v2",
          schemaVersion: 2, validatedGroups: {}, revision: 0, ...change,
        },
      ));
    });
  }

  test("full create legado é negado pelo allowlist barato", async () => {
    await seedDocuments([userEntry("admin-v2", "admin", true)]);
    const full = establishmentFixture();
    full.id = "full-old-create";
    full.slug = "full-old-create";
    full.createdAt = serverTimestamp();
    full.updatedAt = serverTimestamp();
    await assertFails(setDoc(doc(authenticatedDb("admin-v2"), "cms_establishments", "full-old-create"), full));
  });

  test("query pública published não retorna shell draft", async () => {
    await seedDocuments([
      ["cms_establishments/shell-query", {
        id: "shell-query", slug: "shell-query", status: "draft",
        createdAt: new Date(), createdBy: "admin-v2", updatedAt: new Date(), updatedBy: "admin-v2",
        schemaVersion: 2, validatedGroups: {}, revision: 0,
      }],
      ["cms_establishments/legacy-published", { ...establishmentFixture("published"), id: "legacy-published", slug: "legacy-published" }],
    ]);
    const result = await assertSucceeds(getDocs(query(
      collection(anonymousDb(), "cms_establishments"),
      where("status", "==", "published"),
    )));
    assert.deepEqual(result.docs.map((item) => item.id), ["legacy-published"]);
  });

  test("published legado sem metadata V2 preserva get/query público e leitura admin", async () => {
    const legacy = { ...establishmentFixture("published"), id: "legacy-public", slug: "legacy-public" };
    await seedDocuments([
      userEntry("admin-v2", "admin", true),
      ["cms_establishments/legacy-public", legacy],
    ]);
    await assertSucceeds(getDoc(doc(anonymousDb(), "cms_establishments", "legacy-public")));
    await assertSucceeds(getDocs(query(
      collection(anonymousDb(), "cms_establishments"),
      where("status", "==", "published"),
    )));
    await assertSucceeds(getDoc(doc(authenticatedDb("admin-v2"), "cms_establishments", "legacy-public")));
  });
});

describe("CMS establishments C1 V2 — contrato de delete e editSession", () => {
  test("ORDINARY_DRAFT_DELETE_BEHAVIOR_PRESERVED", async () => {
    await seedDocuments([
      userEntry("admin-v2", "admin", true),
      ["cms_establishments/delete-draft", { status: "draft" }],
    ]);
    await assertSucceeds(deleteDoc(
      doc(authenticatedDb("admin-v2"), "cms_establishments", "delete-draft"),
    ));
  });

  test("ACTIVE_EDIT_SESSION_DELETE_DENIED_RULE", async () => {
    await seedDocuments([
      userEntry("admin-v2", "admin", true),
      ["cms_establishments/delete-session", {
        status: "draft",
        editSession: {
          resumeStatus: "published",
          startedAt: new Date("2026-08-25T20:00:00Z"),
          startedBy: "admin-v2",
        },
      }],
    ]);
    await assertFails(deleteDoc(
      doc(authenticatedDb("admin-v2"), "cms_establishments", "delete-session"),
    ));
  });

  test("FORGED_EDIT_SESSION_DELETE_DENIED_RULE", async () => {
    await seedDocuments([
      userEntry("admin-v2", "admin", true),
      ["cms_establishments/delete-forged-session", {
        status: "draft",
        editSession: { resumeStatus: "forged", trusted: true },
      }],
    ]);
    await assertFails(deleteDoc(
      doc(authenticatedDb("admin-v2"), "cms_establishments", "delete-forged-session"),
    ));
  });

  test("PUBLISHED_DELETE_BEHAVIOR_PRESERVED", async () => {
    await seedDocuments([
      userEntry("admin-v2", "admin", true),
      ["cms_establishments/delete-published", { status: "published" }],
    ]);
    await assertFails(deleteDoc(
      doc(authenticatedDb("admin-v2"), "cms_establishments", "delete-published"),
    ));
  });

  test("ARCHIVED_DELETE_BEHAVIOR_PRESERVED", async () => {
    await seedDocuments([
      userEntry("admin-v2", "admin", true),
      ["cms_establishments/delete-archived", { status: "archived" }],
    ]);
    await assertSucceeds(deleteDoc(
      doc(authenticatedDb("admin-v2"), "cms_establishments", "delete-archived"),
    ));
  });

  test("NON_ADMIN_DELETE_BEHAVIOR_PRESERVED", async () => {
    await seedDocuments([
      userEntry("user-v2", "user", true),
      ["cms_establishments/delete-user", { status: "draft" }],
    ]);
    await assertFails(deleteDoc(
      doc(authenticatedDb("user-v2"), "cms_establishments", "delete-user"),
    ));
  });

  test("INACTIVE_ADMIN_DELETE_BEHAVIOR_PRESERVED", async () => {
    await seedDocuments([
      userEntry("admin-inactive-v2", "admin", false),
      ["cms_establishments/delete-inactive-admin", { status: "draft" }],
    ]);
    await assertFails(deleteDoc(
      doc(authenticatedDb("admin-inactive-v2"), "cms_establishments", "delete-inactive-admin"),
    ));
  });
});

describe("CMS establishments C1 V2 — partição e writes de grupo", () => {
  test("partição é completa e disjunta no orquestrador", async () => {
    const source = await readFile(new URL("../js/admin/modules/empreendimentos.js", import.meta.url), "utf8");
    const sandbox = {
      console,
      document: { getElementById: () => null },
      window: {
        firebase: { firestore: { FieldValue: {
          serverTimestamp: () => new Date("2026-08-25T20:00:00Z"),
          delete: () => ({ __deleteField: true }),
        } } },
      },
    };
    runInNewContext(source, sandbox);
    const module = sandbox.window.AdminEstablishmentsModule;
    const envelope = [
      "id", "createdAt", "createdBy", "updatedAt", "updatedBy",
      "schemaVersion", "validatedGroups", "revision",
    ];
    const expectedEditorial = [
      "slug", "name", "categoryId", "categoryLabel", "content", "contact", "location",
      "media", "relationships.routeIds", "relationships.legacyRoute", "relationships.legacyRouteName",
      "relationships.relatedPlaceIds", "relationships.relatedEventIds",
      "display", "seo", "review", "source", "status", "publishing",
    ];
    const flattened = module._GROUP_ORDER.flatMap((group) => module._GROUP_FIELDS[group]);
    assert.deepEqual([...flattened].sort(), [...expectedEditorial].sort());
    assert.equal(new Set(flattened).size, flattened.length);
    assert.equal(envelope.some((field) => flattened.includes(field)), false);
  });

  for (const group of ESTABLISHMENT_GROUPS) {
    test(`${group}: valid ALLOW`, async () => {
      const base = establishmentFixture();
      await seedDocuments([
        userEntry("admin-v2", "admin", true),
        ["cms_establishments/est-v2", base],
      ]);
      await assertSucceeds(writeGroup(
        doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2"),
        group,
        validGroupMutation(group, base),
        1,
      ));
    });

    test(`${group}: invalid DENY`, async () => {
      const base = establishmentFixture();
      await seedDocuments([
        userEntry("admin-v2", "admin", true),
        ["cms_establishments/est-v2", base],
      ]);
      await assertFails(writeGroup(
        doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2"),
        group,
        invalidGroupMutation(group, base),
        1,
      ));
    });

    test(`${group}: affected-key expansion DENY`, async () => {
      const base = establishmentFixture();
      await seedDocuments([
        userEntry("admin-v2", "admin", true),
        ["cms_establishments/est-v2", base],
      ]);
      await assertFails(writeGroup(
        doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2"),
        group,
        { ...validGroupMutation(group, base), foreignField: true },
        1,
      ));
    });
  }
});

describe("CMS establishments C1 V2 — markers e bootstrap legado", () => {
  test("marker forjado com validator inválido é negado", async () => {
    const base = establishmentFixture();
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    await assertFails(writeGroup(
      doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2"),
      "content", invalidGroupMutation("content", base), 1,
    ));
  });

  test("dois markers, marker desconhecido e marker de versão errada são negados", async () => {
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    const base = establishmentFixture();
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    await assertFails(updateDoc(target, {
      ...validGroupMutation("content", base), schemaVersion: 2,
      validatedGroups: { content: 2, contact: 2 }, revision: 1,
      updatedAt: serverTimestamp(), updatedBy: "admin-v2",
    }));
    await assertFails(updateDoc(target, {
      ...validGroupMutation("content", base), schemaVersion: 2,
      validatedGroups: { content: 2, unknown: 2 }, revision: 1,
      updatedAt: serverTimestamp(), updatedBy: "admin-v2",
    }));
    await assertFails(updateDoc(target, {
      ...validGroupMutation("content", base), schemaVersion: 2,
      validatedGroups: { content: 1 }, revision: 1,
      updatedAt: serverTimestamp(), updatedBy: "admin-v2",
    }));
  });

  test("marker A junto de group B é negado", async () => {
    const base = establishmentFixture();
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    await assertFails(updateDoc(doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2"), {
      ...validGroupMutation("content", base), schemaVersion: 2,
      validatedGroups: { contact: 2 }, revision: 1,
      updatedAt: serverTimestamp(), updatedBy: "admin-v2",
    }));
  });

  test("grupo já marcado exige revalidation e aceita nova versão válida", async () => {
    const markers = { content: 2 };
    const base = v2Fixture("draft", markers, 3);
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    await assertSucceeds(writeGroup(
      doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2"),
      "content", validGroupMutation("content", base), 4, markers,
    ));
  });

  test("bootstrap metadata isolado e schemaVersion não-2 são negados", async () => {
    const base = establishmentFixture();
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    await assertFails(updateDoc(target, {
      schemaVersion: 2, validatedGroups: {}, revision: 1,
      updatedAt: serverTimestamp(), updatedBy: "admin-v2",
    }));
    await assertFails(updateDoc(target, {
      ...validGroupMutation("content", base), schemaVersion: 3,
      validatedGroups: { content: 3 }, revision: 1,
      updatedAt: serverTimestamp(), updatedBy: "admin-v2",
    }));
  });

  test("normalização de grupo semanticamente inalterado cria marker com validator", async () => {
    const base = establishmentFixture();
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    await assertSucceeds(writeGroup(
      doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2"),
      "content", { content: base.content }, 1,
    ));
  });

  test("normalização integral legada em um write é negada", async () => {
    const base = establishmentFixture();
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    await assertFails(updateDoc(doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2"), {
      schemaVersion: 2, validatedGroups: allMarkers(), revision: 1,
      updatedAt: serverTimestamp(), updatedBy: "admin-v2",
    }));
  });
});

describe("CMS establishments C1 V2 — publication, lifecycle e UX completo", () => {
  test("P1 published in-place geral é negado; relationship narrow atual continua permitido", async () => {
    const base = v2Fixture("published");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    await assertFails(writeGroup(target, "core", validGroupMutation("core", base), 12, allMarkers()));
    await assertSucceeds(updateDoc(target, {
      relationships: { ...base.relationships, routeIds: ["rota-erva-mate"] },
      updatedAt: serverTimestamp(), updatedBy: "admin-v2",
    }));
  });

  test("P2 published -> draft -> patch -> republish é permitido", async () => {
    const base = v2Fixture("published", allMarkers(), 20);
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    await assertSucceeds(writeGroup(target, "lifecycle", {
      status: "draft",
      publishing: { ...base.publishing, publishedAt: null, publishedBy: "" },
    }, 21, allMarkers()));
    await assertSucceeds(writeGroup(target, "content", validGroupMutation("content", base), 22, allMarkers()));
    await assertSucceeds(writeGroup(target, "lifecycle", {
      status: "published",
      publishing: {
        publishedAt: serverTimestamp(), publishedBy: "admin-v2",
        archivedAt: null, archivedBy: "", archiveReason: "",
      },
    }, 23, allMarkers()));
  });

  test("falha de grupo após retirar publicação mantém o documento draft", async () => {
    const base = v2Fixture("published", allMarkers(), 24);
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    await assertSucceeds(writeGroup(target, "lifecycle", {
      status: "draft",
      publishing: { ...base.publishing, publishedAt: null, publishedBy: "" },
    }, 25, allMarkers()));
    await assertFails(writeGroup(target, "content", invalidGroupMutation("content", base), 26, allMarkers()));
    const snapshot = await assertSucceeds(getDoc(target));
    assert.equal(snapshot.data().status, "draft");
    assert.equal(snapshot.data().revision, 25);
  });

  test("published legado normaliza grupo a grupo e só republica com todos markers", async () => {
    const legacy = establishmentFixture("published");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", legacy]]);
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    const markers = {};
    let revision = 1;
    await assertSucceeds(writeGroup(target, "lifecycle", {
      status: "draft",
      publishing: { ...legacy.publishing, publishedAt: null, publishedBy: "" },
    }, revision, markers));
    markers.lifecycle = 2;
    await assertFails(writeGroup(target, "lifecycle", {
      status: "published",
      publishing: { publishedAt: serverTimestamp(), publishedBy: "admin-v2", archivedAt: null, archivedBy: "", archiveReason: "" },
    }, revision + 1, markers));
    for (const group of ESTABLISHMENT_GROUPS.filter((name) => name !== "lifecycle")) {
      revision += 1;
      let mutationSource = legacy;
      if (group === "relationshipsRelatedPlaceIds" || group === "relationshipsRelatedEventIds") {
        const current = (await getDoc(target)).data();
        mutationSource = { ...legacy, relationships: current.relationships };
      }
      await assertSucceeds(writeGroup(target, group, validGroupMutation(group, mutationSource), revision, markers));
      markers[group] = 2;
    }
    revision += 1;
    await assertSucceeds(writeGroup(target, "lifecycle", {
      status: "published",
      publishing: { publishedAt: serverTimestamp(), publishedBy: "admin-v2", archivedAt: null, archivedBy: "", archiveReason: "" },
    }, revision, markers));
  });

  test("publish sem marker, marker extra e metadata de publicação inválida são negados", async () => {
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    const missing = { ...allMarkers() };
    delete missing.media;
    const base = v2Fixture("draft", missing, 30);
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    await assertFails(writeGroup(target, "lifecycle", {
      status: "published",
      publishing: { publishedAt: serverTimestamp(), publishedBy: "admin-v2", archivedAt: null, archivedBy: "", archiveReason: "" },
    }, 31, missing));
    await assertFails(updateDoc(target, {
      status: "published",
      publishing: { publishedAt: null, publishedBy: "", archivedAt: null, archivedBy: "", archiveReason: "" },
      validatedGroups: { ...allMarkers(), lifecycle: 2 }, revision: 31,
      updatedAt: serverTimestamp(), updatedBy: "admin-v2",
    }));
  });

  test("archive e restore preservam lifecycle controlado", async () => {
    const base = v2Fixture("draft", allMarkers(), 40);
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    await assertSucceeds(writeGroup(target, "lifecycle", {
      status: "archived",
      publishing: { ...base.publishing, archivedAt: serverTimestamp(), archivedBy: "admin-v2", archiveReason: "Teste" },
    }, 41, allMarkers()));
    await assertSucceeds(writeGroup(target, "lifecycle", {
      status: "draft",
      publishing: { ...base.publishing, archivedAt: null, archivedBy: "", archiveReason: "" },
    }, 42, allMarkers()));
  });

  test("CREATE UX shell + 13 grupos chega ao payload canônico em 14 requests", async () => {
    await seedDocuments([userEntry("admin-v2", "admin", true)]);
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    await assertSucceeds(setDoc(target, {
      id: "est-v2", slug: "est-v2", status: "draft",
      createdAt: serverTimestamp(), createdBy: "admin-v2",
      updatedAt: serverTimestamp(), updatedBy: "admin-v2",
      schemaVersion: 2, validatedGroups: {}, revision: 0,
    }));
    const desired = establishmentFixture();
    const markers = {};
    let revision = 0;
    for (const group of ESTABLISHMENT_GROUPS) {
      revision += 1;
      let mutationSource = desired;
      if (group === "relationshipsRelatedPlaceIds" || group === "relationshipsRelatedEventIds") {
        const current = (await getDoc(target)).data();
        mutationSource = { ...desired, relationships: current.relationships };
      }
      try {
        await assertSucceeds(writeGroup(target, group, validGroupMutation(group, mutationSource), revision, markers));
      } catch (error) {
        error.message = `${group}: ${error.message}`;
        throw error;
      }
      markers[group] = 2;
    }
    const finalSnapshot = await assertSucceeds(getDoc(target));
    assert.equal(finalSnapshot.data().revision, 13);
    assert.deepEqual(finalSnapshot.data().validatedGroups, allMarkers());
    assert.equal(finalSnapshot.data().name, "Nome atualizado");
    assert.equal(finalSnapshot.data().content.summary, "Resumo atualizado");
  });
});

describe("CMS establishments C1 V2 — tipos de listas e números finitos", () => {
  const maxStringList = (prefix) => Array.from({ length: 50 }, (_, index) => `${prefix}-${index}`);

  test("STRING_LIST_NUMERIC_ELEMENT_DENIED", async () => {
    const base = establishmentFixture();
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "string-list-number");
    await seedDocuments([
      userEntry("admin-v2", "admin", true),
      ["cms_establishments/string-list-number", { ...base, id: "string-list-number" }],
    ]);
    await assertFails(writeGroup(target, "relationshipsRouteIds", {
      relationships: { ...base.relationships, routeIds: [1] },
    }, 1));
  });

  test("STRING_LIST_MIXED_ELEMENTS_DENIED", async () => {
    const cases = [
      ["route-string-number", "relationshipsRouteIds", { relationships: { ...establishmentFixture().relationships, routeIds: ["rota-a", 1] } }],
      ["route-number-string", "relationshipsRouteIds", { relationships: { ...establishmentFixture().relationships, routeIds: [1, "rota-a"] } }],
      ["related-place", "relationshipsRelatedPlaceIds", { relationships: { ...establishmentFixture().relationships, relatedPlaceIds: ["place-a", 1] } }],
      ["related-event", "relationshipsRelatedEventIds", { relationships: { ...establishmentFixture().relationships, relatedEventIds: ["event-a", 1] } }],
      ["content-tags", "content", { content: { ...establishmentFixture().content, tags: ["tag-a", 1] } }],
      ["source-legacy", "source", { source: { ...establishmentFixture().source, legacyIds: ["legacy-a", 1] } }],
    ];
    await seedDocuments([userEntry("admin-v2", "admin", true)]);
    for (const [id, group, mutation] of cases) {
      const base = { ...establishmentFixture(), id };
      await seedDocuments([[`cms_establishments/${id}`, base]]);
      await assertFails(writeGroup(
        doc(authenticatedDb("admin-v2"), "cms_establishments", id),
        group,
        mutation,
        1,
      ));
    }
  });

  for (const [name, group, field, prefix] of [
    ["REL_ROUTE_IDS_LAST_NONSTRING_DENIED", "relationshipsRouteIds", "routeIds", "rota"],
    ["REL_RELATED_PLACE_IDS_LAST_NONSTRING_DENIED", "relationshipsRelatedPlaceIds", "relatedPlaceIds", "place"],
    ["REL_RELATED_EVENT_IDS_LAST_NONSTRING_DENIED", "relationshipsRelatedEventIds", "relatedEventIds", "event"],
  ]) {
    test(name, async () => {
      const base = establishmentFixture();
      const values = maxStringList(prefix);
      values[49] = 49;
      const id = `last-${field}`;
      const target = doc(authenticatedDb("admin-v2"), "cms_establishments", id);
      await seedDocuments([userEntry("admin-v2", "admin", true), [`cms_establishments/${id}`, { ...base, id }]]);
      await assertFails(writeGroup(target, group, {
        relationships: { ...base.relationships, [field]: values },
      }, 1));
    });
  }

  for (const [name, group, field, prefix] of [
    ["REL_ROUTE_IDS_MAX_50_VALID", "relationshipsRouteIds", "routeIds", "rota"],
    ["REL_RELATED_PLACE_IDS_MAX_50_VALID", "relationshipsRelatedPlaceIds", "relatedPlaceIds", "place"],
    ["REL_RELATED_EVENT_IDS_MAX_50_VALID", "relationshipsRelatedEventIds", "relatedEventIds", "event"],
  ]) {
    test(name, async () => {
      const base = establishmentFixture();
      const id = `max-${field}`;
      const target = doc(authenticatedDb("admin-v2"), "cms_establishments", id);
      await seedDocuments([userEntry("admin-v2", "admin", true), [`cms_establishments/${id}`, { ...base, id }]]);
      await assertSucceeds(writeGroup(target, group, {
        relationships: { ...base.relationships, [field]: maxStringList(prefix) },
      }, 1));
    });
  }

  test("REL_THREE_LISTS_SINGLE_WRITE_DENIED_CHEAPLY", async () => {
    const base = establishmentFixture();
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "three-lists-single");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/three-lists-single", { ...base, id: "three-lists-single" }]]);
    await assertFails(writeGroup(target, "relationshipsRouteIds", {
      relationships: {
        ...base.relationships,
        routeIds: maxStringList("rota"),
        relatedPlaceIds: maxStringList("place"),
        relatedEventIds: maxStringList("event"),
      },
    }, 1));
  });

  test("REL_THREE_LISTS_THREE_WRITES_PASS", async () => {
    const base = establishmentFixture();
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "three-lists-three-writes");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/three-lists-three-writes", { ...base, id: "three-lists-three-writes" }]]);
    const markers = {};
    for (const [group, field, prefix, revision] of [
      ["relationshipsRouteIds", "routeIds", "rota", 1],
      ["relationshipsRelatedPlaceIds", "relatedPlaceIds", "place", 2],
      ["relationshipsRelatedEventIds", "relatedEventIds", "event", 3],
    ]) {
      const current = (await getDoc(target)).data();
      await assertSucceeds(writeGroup(target, group, {
        relationships: { ...current.relationships, [field]: maxStringList(prefix) },
      }, revision, markers));
      markers[group] = 2;
    }
    const result = (await getDoc(target)).data();
    assert.equal(result.relationships.routeIds.length, 50);
    assert.equal(result.relationships.relatedPlaceIds.length, 50);
    assert.equal(result.relationships.relatedEventIds.length, 50);
  });

  for (const [name, group] of [
    ["REL_MARKER_ROUTE_IDS_ONLY", "relationshipsRouteIds"],
    ["REL_MARKER_RELATED_PLACE_IDS_ONLY", "relationshipsRelatedPlaceIds"],
    ["REL_MARKER_RELATED_EVENT_IDS_ONLY", "relationshipsRelatedEventIds"],
  ]) {
    test(name, async () => {
      const base = establishmentFixture();
      const id = `marker-${group}`;
      const target = doc(authenticatedDb("admin-v2"), "cms_establishments", id);
      await seedDocuments([userEntry("admin-v2", "admin", true), [`cms_establishments/${id}`, { ...base, id }]]);
      await assertSucceeds(writeGroup(target, group, { relationships: { ...base.relationships } }, 1));
      const result = (await getDoc(target)).data();
      assert.deepEqual(result.validatedGroups, { [group]: 2 });
    });
  }

  test("CONTENT_TAGS_MAX_50_VALID", async () => {
    const base = establishmentFixture();
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "max-content-tags");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/max-content-tags", { ...base, id: "max-content-tags" }]]);
    await assertSucceeds(writeGroup(target, "content", { content: { ...base.content, tags: maxStringList("tag") } }, 1));
  });

  test("SOURCE_LEGACY_IDS_MAX_50_VALID", async () => {
    const base = establishmentFixture();
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "max-source-legacy");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/max-source-legacy", { ...base, id: "max-source-legacy" }]]);
    await assertSucceeds(writeGroup(target, "source", { source: { ...base.source, legacyIds: maxStringList("legacy") } }, 1));
  });

  test("MARKER_WITH_INVALID_STRING_LIST_DENIED", async () => {
    const base = establishmentFixture();
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "invalid-marker-list");
    await seedDocuments([
      userEntry("admin-v2", "admin", true),
      ["cms_establishments/invalid-marker-list", { ...base, id: "invalid-marker-list" }],
    ]);
    await assertFails(writeGroup(target, "content", {
      content: { ...base.content, tags: ["válida", 2] },
    }, 1));
  });

  test("ROUTE_IDS_EMPTY_LIST_BEHAVIOR_PRESERVED", async () => {
    const base = establishmentFixture();
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "empty-route-list");
    await seedDocuments([
      userEntry("admin-v2", "admin", true),
      ["cms_establishments/empty-route-list", { ...base, id: "empty-route-list" }],
    ]);
    await assertSucceeds(writeGroup(target, "relationshipsRouteIds", {
      relationships: { ...base.relationships, routeIds: [] },
    }, 1));
  });

  test("ROTAS_NARROW_WRITER_INVALID_STRING_LIST_DENIED", async () => {
    const base = v2Fixture("draft", allMarkers(), 7);
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "rotas-invalid-list");
    await seedDocuments([
      userEntry("admin-v2", "admin", true),
      ["cms_establishments/rotas-invalid-list", { ...base, id: "rotas-invalid-list" }],
    ]);
    await assertFails(updateDoc(target, {
      relationships: { ...base.relationships, routeIds: [1] },
      updatedAt: serverTimestamp(),
      updatedBy: "admin-v2",
    }));
  });

  test("ROTAS_NARROW_ROUTE_IDS_50_STRINGS_PASS", async () => {
    const base = v2Fixture("draft", allMarkers(), 7);
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "rotas-max-list");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/rotas-max-list", { ...base, id: "rotas-max-list" }]]);
    await assertSucceeds(updateDoc(target, {
      relationships: { ...base.relationships, routeIds: maxStringList("rota") },
      updatedAt: serverTimestamp(),
      updatedBy: "admin-v2",
    }));
    const result = (await getDoc(target)).data();
    assert.equal(result.relationships.routeIds.length, 50);
    assert.equal(result.validatedGroups.relationshipsRouteIds, 2);
    assert.equal(result.revision, 7);
  });

  test("RULES_NONFINITE_COORDINATES_DENIED", async () => {
    await seedDocuments([userEntry("admin-v2", "admin", true)]);
    for (const [label, coordinates] of [
      ["nan-lat", { lat: Number.NaN, lng: -50 }],
      ["infinity-lng", { lat: -25, lng: Number.POSITIVE_INFINITY }],
      ["negative-infinity-lat", { lat: Number.NEGATIVE_INFINITY, lng: -50 }],
    ]) {
      const base = { ...establishmentFixture(), id: label };
      await seedDocuments([[`cms_establishments/${label}`, base]]);
      await assertFails(writeGroup(
        doc(authenticatedDb("admin-v2"), "cms_establishments", label),
        "location",
        { location: { ...base.location, coordinates } },
        1,
      ));
    }
  });
});

describe("CMS establishments C1 V2 — concorrência e side effects do orquestrador", () => {
  async function loadAdminModule(options = {}) {
    const source = await readFile(new URL("../js/admin/modules/empreendimentos.js", import.meta.url), "utf8");
    const sandbox = {
      console,
      document: { getElementById: () => null },
      window: {
        crypto: Object.hasOwn(options, "crypto") ? options.crypto : globalThis.crypto,
        firebase: { firestore: { FieldValue: {
          serverTimestamp: () => new Date("2026-08-25T20:00:00Z"),
          delete: () => ({ __deleteField: true }),
        } } },
      },
    };
    runInNewContext(source, sandbox);
    return { module: sandbox.window.AdminEstablishmentsModule, source };
  }

  function fakeTransactionDb(raw) {
    return {
      raw,
      runTransaction(callback) {
        const transaction = {
          get: async () => ({ exists: true, id: "est-v2", data: () => this.raw }),
          update: (_ref, patch) => { this.raw = { ...this.raw, ...patch }; },
        };
        return callback(transaction);
      },
    };
  }

  async function loadDeleteGuardModule(options = {}) {
    const source = await readFile(new URL("../js/admin/modules/empreendimentos.js", import.meta.url), "utf8");
    const calls = {
      confirm: 0,
      firestoreDelete: 0,
      messages: [],
      prompt: 0,
      storageDelete: 0,
    };
    const db = {
      collection: () => ({
        doc: () => ({
          delete: async () => { calls.firestoreDelete += 1; },
          get: async () => {
            if (options.remoteGetError) throw options.remoteGetError;
            return {
              exists: options.remoteExists !== false,
              id: "est-v2",
              data: () => Object.hasOwn(options, "remoteRaw")
                ? options.remoteRaw
                : v2Fixture("draft", allMarkers(), 180),
            };
          },
        }),
      }),
    };
    const storage = {
      ref: () => ({
        delete: async () => { calls.storageDelete += 1; },
      }),
    };
    const sandbox = {
      console,
      document: { getElementById: () => null },
      window: {
        AdminContext: { db, storage, currentUser: { uid: "admin-v2" } },
        AdminUI: { showToast: (message) => { calls.messages.push(message); } },
        confirm: () => { calls.confirm += 1; return true; },
        firebase: { firestore: { FieldValue: {
          serverTimestamp: () => new Date("2026-08-25T20:00:00Z"),
          delete: () => ({ __deleteField: true }),
        } } },
        prompt: () => { calls.prompt += 1; return "est-v2"; },
      },
    };
    runInNewContext(source, sandbox);
    const module = sandbox.window.AdminEstablishmentsModule;
    const activeSessionDraft = module._normalizeDoc({
      ...v2Fixture("draft", allMarkers(), 180),
      editSession: {
        resumeStatus: "published",
        startedAt: new Date("2026-08-25T20:00:00Z"),
        startedBy: "admin-v2",
      },
    }, "est-v2");
    module._state.items = [options.cachedItem || activeSessionDraft];
    return { activeSessionDraft, calls, module };
  }

  test("revision e base de grupo divergentes geram conflito sem write", async () => {
    const { module } = await loadAdminModule();
    const base = v2Fixture("draft", allMarkers(), 8);
    const desired = { ...base, content: { ...base.content, summary: "Novo" } };
    const saga = module._buildSaga({ id: "est-v2" }, desired, base, "admin-v2", ["content"]);
    const changedRevision = fakeTransactionDb({ ...base, revision: 9 });
    await assert.rejects(module._runGroupTransaction(changedRevision, saga, "content"), { code: "establishment-conflict" });
    const changedGroup = fakeTransactionDb({ ...base, content: { ...base.content, summary: "Concorrente" } });
    await assert.rejects(module._runGroupTransaction(changedGroup, saga, "content"), { code: "establishment-conflict" });
  });

  test("patch próprio avança revision exatamente +1 para o grupo seguinte", async () => {
    const { module } = await loadAdminModule();
    const base = v2Fixture("draft", allMarkers(), 8);
    const desired = {
      ...base,
      content: { ...base.content, summary: "Novo" },
      contact: { ...base.contact, phone: "42" },
    };
    const saga = module._buildSaga({ id: "est-v2" }, desired, base, "admin-v2", ["content", "contact"]);
    const db = fakeTransactionDb({ ...base });
    const first = await module._runGroupTransaction(db, saga, "content");
    saga.expectedRevision = first.revision;
    saga.baseGroups.content = first.groupValue;
    const second = await module._runGroupTransaction(db, saga, "contact");
    assert.equal(first.revision, 9);
    assert.equal(second.revision, 10);
    saga.expectedRevision = 8;
    await assert.rejects(module._runGroupTransaction(db, saga, "contact"), { code: "establishment-conflict" });
  });

  test("transaction callback não contém upload, DOM, toast, analytics ou mutação de progresso", async () => {
    const { source } = await loadAdminModule();
    const callbackSource = source.slice(
      source.indexOf("function runGroupTransaction"),
      source.indexOf("function reconcilePendingGroup"),
    );
    for (const forbidden of ["uploadImage", "deleteUploadedFiles", "document.", "toast(", "analytics", "setSaveProgress"]) {
      assert.equal(callbackSource.includes(forbidden), false, forbidden);
    }
  });

  test("UPLOAD_IDENTITY DISTINCT_FILE_OBJECTS_SAME_METADATA_REMAIN_DISTINCT", async () => {
    const { module } = await loadAdminModule();
    const refPaths = [];
    const putCalls = [];
    const storage = {
      ref(path) {
        refPaths.push(path);
        return {
          put: async (file) => { putCalls.push({ file, path }); },
          getDownloadURL: async () => `https://example.test/${path}`,
        };
      },
    };
    const metadata = { type: "image/jpeg", lastModified: 10 };
    const fileA = new File(["same"], "mesmos-metadados.jpg", metadata);
    const fileB = new File(["same"], "mesmos-metadados.jpg", metadata);
    const payload = { id: "est-v2", media: { mainImage: establishmentFixture().media.mainImage, gallery: [] } };
    assert.notEqual(fileA, fileB);
    await module._prepareUploads(storage, "admin-v2", payload, null, [fileA, fileB]);
    const planA = module._state.uploadCache.get(fileA).get("admin-v2|est-v2|gallery|gallery-0");
    const planB = module._state.uploadCache.get(fileB).get("admin-v2|est-v2|gallery|gallery-1");
    assert.notEqual(planA, planB);
    assert.notEqual(planA.uploadId, planB.uploadId);
    assert.notEqual(planA.path, planB.path);
    assert.equal(new Set(refPaths).size, 2);
    assert.equal(putCalls[0].file, fileA);
    assert.equal(putCalls[0].path, planA.path);
    assert.equal(putCalls[1].file, fileB);
    assert.equal(putCalls[1].path, planB.path);
  });

  test("DISTINCT_FILES_SAME_METADATA_GALLERY_HAS_TWO", async () => {
    const { module } = await loadAdminModule();
    const storage = {
      ref(path) {
        return {
          put: async () => {},
          getDownloadURL: async () => `https://example.test/${path}`,
        };
      },
    };
    const metadata = { type: "image/jpeg", lastModified: 11 };
    const fileA = new File(["same"], "conteudo-igual.jpg", metadata);
    const fileB = new File(["same"], "conteudo-igual.jpg", metadata);
    const payload = { id: "est-v2", media: { mainImage: establishmentFixture().media.mainImage, gallery: [] } };
    await module._prepareUploads(storage, "admin-v2", payload, null, [fileA, fileB]);
    assert.equal(payload.media.gallery.length, 2);
    assert.equal(new Set(payload.media.gallery.map((image) => image.path)).size, 2);
  });

  test("UPLOAD_IDENTITY SAME_DESCRIPTOR_RETRY_REUSES_UPLOAD_ID", async () => {
    const { module } = await loadAdminModule();
    let puts = 0;
    const storage = {
      ref(path) {
        return {
          put: async () => { puts += 1; },
          getDownloadURL: async () => `https://example.test/${path}`,
        };
      },
    };
    const file = { name: "foto.jpg", size: 100, lastModified: 1, type: "image/jpeg" };
    const payload = { id: "est-v2", media: { mainImage: establishmentFixture().media.mainImage, gallery: [] } };
    await module._prepareUploads(storage, "admin-v2", payload, null, [file]);
    const plan = module._state.uploadCache.get(file).get("admin-v2|est-v2|gallery|gallery-0");
    const initialUploadId = plan.uploadId;
    const initialPath = plan.path;
    await module._prepareUploads(storage, "admin-v2", payload, null, [file]);
    assert.equal(puts, 1);
    assert.equal(plan.uploadId, initialUploadId);
    assert.equal(plan.path, initialPath);
    assert.equal(payload.media.gallery.length, 1);
  });

  test("UPLOAD_IDENTITY URL_FAILURE_REUSES_UPLOAD_ID_AND_PATH", async () => {
    const { module } = await loadAdminModule();
    const paths = [];
    let puts = 0;
    let urlCalls = 0;
    const storage = {
      ref(path) {
        paths.push(path);
        return {
          put: async () => { puts += 1; },
          getDownloadURL: async () => {
            urlCalls += 1;
            if (urlCalls === 1) throw new Error("simulated-url-failure");
            return `https://example.test/${path}`;
          },
        };
      },
    };
    const file = { name: "url-failure.jpg", size: 100, lastModified: 2, type: "image/jpeg" };
    const payload = { id: "est-v2", media: { mainImage: establishmentFixture().media.mainImage, gallery: [] } };
    await assert.rejects(module._prepareUploads(storage, "admin-v2", payload, null, [file]), /simulated-url-failure/);
    const plan = module._state.uploadCache.get(file).get("admin-v2|est-v2|gallery|gallery-0");
    const initialUploadId = plan.uploadId;
    const initialPath = plan.path;
    await module._prepareUploads(storage, "admin-v2", payload, null, [file]);
    assert.equal(new Set(paths).size, 1);
    assert.equal(plan.uploadId, initialUploadId);
    assert.equal(plan.path, initialPath);
    assert.equal(puts, 1);
    assert.equal(urlCalls, 2);
    assert.equal(payload.media.gallery.length, 1);
  });

  test("UPLOAD_IDENTITY AMBIGUOUS_PUT_REUSES_UPLOAD_ID_AND_PATH", async () => {
    const { module } = await loadAdminModule();
    const refPaths = [];
    const putPaths = [];
    let puts = 0;
    const storage = {
      ref(path) {
        refPaths.push(path);
        return {
          put: async () => {
            puts += 1;
            putPaths.push(path);
            if (puts === 1) throw new Error("simulated-ambiguous-put");
          },
          getDownloadURL: async () => `https://example.test/${path}`,
        };
      },
    };
    const file = { name: "ambiguous.jpg", size: 100, lastModified: 3, type: "image/jpeg" };
    const payload = { id: "est-v2", media: { mainImage: establishmentFixture().media.mainImage, gallery: [] } };
    await assert.rejects(module._prepareUploads(storage, "admin-v2", payload, null, [file]), /simulated-ambiguous-put/);
    const plan = module._state.uploadCache.get(file).get("admin-v2|est-v2|gallery|gallery-0");
    const initialUploadId = plan.uploadId;
    const initialPath = plan.path;
    await module._prepareUploads(storage, "admin-v2", payload, null, [file]);
    assert.equal(refPaths.length, 1);
    assert.equal(new Set(putPaths).size, 1);
    assert.equal(plan.uploadId, initialUploadId);
    assert.equal(plan.path, initialPath);
    assert.equal(puts, 2);
    assert.equal(payload.media.gallery.length, 1);
  });

  test("UPLOAD_IDENTITY CROSS_INSTANCE_SAME_TIMESTAMP_SAME_METADATA_DISTINCT_PATHS", async () => {
    const uuidA = "11111111-1111-4111-8111-111111111111";
    const uuidB = "22222222-2222-4222-8222-222222222222";
    const [{ module: moduleA }, { module: moduleB }] = await Promise.all([
      loadAdminModule({ crypto: { randomUUID: () => uuidA } }),
      loadAdminModule({ crypto: { randomUUID: () => uuidB } }),
    ]);
    moduleA._state.uploadPlanSequence = 0;
    moduleB._state.uploadPlanSequence = 0;
    const pathsA = [];
    const pathsB = [];
    const storageFor = (paths) => ({
      ref(path) {
        paths.push(path);
        return {
          put: async () => {},
          getDownloadURL: async () => `https://example.test/${path}`,
        };
      },
    });
    const metadata = { name: "igual.jpg", size: 100, type: "image/jpeg", lastModified: 10 };
    const fileA = { ...metadata };
    const fileB = { ...metadata };
    const payloadA = { id: "est-v2", media: { mainImage: establishmentFixture().media.mainImage, gallery: [] } };
    const payloadB = { id: "est-v2", media: { mainImage: establishmentFixture().media.mainImage, gallery: [] } };
    const originalNow = Date.now;
    Date.now = () => 1787698800000;
    try {
      await moduleA._prepareUploads(storageFor(pathsA), "admin-v2", payloadA, null, [fileA]);
      await moduleB._prepareUploads(storageFor(pathsB), "admin-v2", payloadB, null, [fileB]);
    } finally {
      Date.now = originalNow;
    }
    const planA = moduleA._state.uploadCache.get(fileA).get("admin-v2|est-v2|gallery|gallery-0");
    const planB = moduleB._state.uploadCache.get(fileB).get("admin-v2|est-v2|gallery|gallery-0");
    assert.equal(planA.uploadId, uuidA);
    assert.equal(planB.uploadId, uuidB);
    assert.notEqual(planA.path, planB.path);
    assert.notEqual(pathsA[0], pathsB[0]);
  });

  test("UPLOAD_IDENTITY CROSS_INSTANCE_DISTINCT_UPLOAD_IDS", async () => {
    const [{ module: moduleA }, { module: moduleB }] = await Promise.all([
      loadAdminModule({ crypto: { randomUUID: () => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" } }),
      loadAdminModule({ crypto: { randomUUID: () => "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" } }),
    ]);
    const storage = { ref: (path) => ({ put: async () => {}, getDownloadURL: async () => path }) };
    const fileA = { name: "igual.jpg", size: 100, type: "image/jpeg", lastModified: 10 };
    const fileB = { name: "igual.jpg", size: 100, type: "image/jpeg", lastModified: 10 };
    const payloadA = { id: "est-v2", media: { mainImage: establishmentFixture().media.mainImage, gallery: [] } };
    const payloadB = { id: "est-v2", media: { mainImage: establishmentFixture().media.mainImage, gallery: [] } };
    await moduleA._prepareUploads(storage, "admin-v2", payloadA, null, [fileA]);
    await moduleB._prepareUploads(storage, "admin-v2", payloadB, null, [fileB]);
    const planA = moduleA._state.uploadCache.get(fileA).get("admin-v2|est-v2|gallery|gallery-0");
    const planB = moduleB._state.uploadCache.get(fileB).get("admin-v2|est-v2|gallery|gallery-0");
    assert.notEqual(planA.uploadId, planB.uploadId);
  });

  test("UPLOAD_IDENTITY NO_SECURE_RANDOM_SOURCE_FAILS_CLOSED", async () => {
    const { module } = await loadAdminModule({ crypto: undefined });
    let refs = 0;
    let puts = 0;
    const storage = {
      ref() {
        refs += 1;
        return { put: async () => { puts += 1; }, getDownloadURL: async () => "unexpected" };
      },
    };
    const file = { name: "foto.jpg", size: 100, type: "image/jpeg", lastModified: 10 };
    const payload = { id: "est-v2", media: { mainImage: establishmentFixture().media.mainImage, gallery: [] } };
    await assert.rejects(
      module._prepareUploads(storage, "admin-v2", payload, null, [file]),
      { code: "secure-random-unavailable" },
    );
    assert.equal(refs, 0);
    assert.equal(puts, 0);
    assert.equal(module._state.uploadCache.get(file).size, 0);
  });

  test("planner gera 1 write para 1 grupo, 3 para 3 grupos e no máximo 13 grupos", async () => {
    const { module } = await loadAdminModule();
    const base = v2Fixture("draft", allMarkers(), 1);
    const one = { ...base, content: { ...base.content, summary: "1" } };
    assert.deepEqual([...module._groupsToWrite(base, one)], ["content"]);
    const three = {
      ...one,
      contact: { ...base.contact, phone: "42" },
      seo: { ...base.seo, title: "SEO" },
    };
    assert.deepEqual([...module._groupsToWrite(base, three)], ["content", "contact", "seo"]);
    const shellLike = { ...base, validatedGroups: {} };
    assert.equal(module._groupsToWrite(shellLike, three).length, 13);
  });

  test("normalização de DRAFT_IN_PROGRESS tolera campos editoriais ausentes", async () => {
    const { module } = await loadAdminModule();
    const shell = module._normalizeDoc({
      id: "shell", slug: "shell", status: "draft",
      createdAt: new Date(), createdBy: "admin-v2", updatedAt: new Date(), updatedBy: "admin-v2",
      schemaVersion: 2, validatedGroups: {}, revision: 0,
    }, "shell");
    assert.equal(shell.name, "");
    assert.equal(shell.content.summary, "");
    assert.deepEqual([...shell.relationships.routeIds], []);
    assert.equal(shell.revision, 0);
  });

  test("ACTIVE_EDIT_SESSION_DELETE_BLOCKED_UI", async () => {
    const { activeSessionDraft, calls, module } = await loadDeleteGuardModule();
    assert.match(module._deleteButton(activeSessionDraft, "est-v2"), /disabled/);
    module.remove("est-v2");
    assert.equal(calls.firestoreDelete, 0);
    assert.equal(calls.prompt, 0);
    assert.equal(calls.confirm, 0);
    assert.equal(calls.messages.some((message) => /edicao publicada interrompida/i.test(message)), true);
  });

  test("ACTIVE_EDIT_SESSION_ZERO_STORAGE_DELETE", async () => {
    const { calls, module } = await loadDeleteGuardModule();
    module.remove("est-v2");
    assert.equal(calls.firestoreDelete, 0);
    assert.equal(calls.storageDelete, 0);
  });

  test("ACTIVE_EDIT_SESSION_DELETE_BLOCKED_STALE_UI", async () => {
    const cachedDraft = v2Fixture("draft", allMarkers(), 180);
    const remoteSessionDraft = {
      ...cachedDraft,
      editSession: {
        resumeStatus: "published",
        startedAt: new Date("2026-08-25T20:00:00Z"),
        startedBy: "admin-v2",
      },
    };
    const { calls, module } = await loadDeleteGuardModule({
      cachedItem: { ...cachedDraft, __id: "est-v2" },
      remoteRaw: remoteSessionDraft,
    });
    await module.remove("est-v2");
    assert.equal(calls.prompt, 0);
    assert.equal(calls.confirm, 0);
    assert.equal(calls.firestoreDelete, 0);
  });

  test("REMOTE_MALFORMED_EDIT_SESSION_DELETE_GUARD bloqueia toda presença da chave", async () => {
    const validSession = {
      resumeStatus: "published",
      startedAt: new Date("2026-08-25T20:00:00Z"),
      startedBy: "admin-v2",
    };
    for (const editSession of [null, "invalid", 1, false, [], {}, { unexpected: true }, validSession]) {
      const cachedDraft = v2Fixture("draft", allMarkers(), 180);
      const { calls, module } = await loadDeleteGuardModule({
        cachedItem: { ...cachedDraft, __id: "est-v2" },
        remoteRaw: { ...cachedDraft, editSession },
      });
      await module.remove("est-v2");
      assert.equal(calls.prompt, 0);
      assert.equal(calls.confirm, 0);
      assert.equal(calls.firestoreDelete, 0);
      assert.equal(calls.storageDelete, 0);
    }
  });

  test("REMOTE_READ_FAILURE_DELETE_GUARD falha fechado sem side effects", async () => {
    const cachedDraft = v2Fixture("draft", allMarkers(), 180);
    for (const options of [
      { remoteGetError: Object.assign(new Error("permission-denied"), { code: "permission-denied" }) },
      { remoteGetError: new Error("offline") },
      { remoteExists: false },
      { remoteRaw: null },
    ]) {
      const { calls, module } = await loadDeleteGuardModule({
        cachedItem: { ...cachedDraft, __id: "est-v2" },
        ...options,
      });
      await module.remove("est-v2");
      assert.equal(calls.prompt, 0);
      assert.equal(calls.confirm, 0);
      assert.equal(calls.firestoreDelete, 0);
      assert.equal(calls.storageDelete, 0);
    }
  });

  test("REMOTE_STALE_PUBLISHED_DELETE_GUARD usa o estado remoto como autoridade", async () => {
    const cachedDraft = v2Fixture("draft", allMarkers(), 180);
    const { calls, module } = await loadDeleteGuardModule({
      cachedItem: { ...cachedDraft, __id: "est-v2" },
      remoteRaw: v2Fixture("published", allMarkers(), 181),
    });
    await module.remove("est-v2");
    assert.equal(calls.prompt, 0);
    assert.equal(calls.confirm, 0);
    assert.equal(calls.firestoreDelete, 0);
    assert.equal(calls.storageDelete, 0);
  });

  test("TEMPORAL_CANONICALIZATION compara Date e Timestamp por milissegundos", async () => {
    const { module } = await loadAdminModule();
    const timestamp = (millis) => ({ toMillis: () => millis });
    assert.equal(module._semanticEqual(new Date(0), new Date(0)), true);
    assert.equal(module._semanticEqual(new Date(0), new Date(1)), false);
    assert.equal(module._semanticEqual(timestamp(0), timestamp(0)), true);
    assert.equal(module._semanticEqual(timestamp(0), timestamp(1)), false);
    assert.equal(module._semanticEqual(new Date(0), timestamp(0)), true);
    assert.equal(module._semanticEqual(new Date(Number.NaN), new Date(Number.NaN)), false);
    for (const group of ["lifecycle", "review", "source", "editSession"]) {
      assert.equal(module._semanticEqual({ [group]: { at: new Date(0) } }, { [group]: { at: timestamp(0) } }), true);
      assert.equal(module._semanticEqual({ [group]: { at: new Date(0) } }, { [group]: { at: new Date(1) } }), false);
    }
  });

  test("INVALID_DATE_RECONCILIATION_FAILS_CLOSED", async () => {
    const { module } = await loadAdminModule();
    const base = v2Fixture("draft", allMarkers(), 8);
    const desired = { ...base, review: { ...base.review, lastAppliedAt: new Date(Number.NaN) } };
    const raw = { ...base, review: desired.review, revision: 9 };
    const ref = { id: "est-v2", get: async () => ({ exists: true, id: "est-v2", data: () => raw }) };
    const saga = module._buildSaga(ref, desired, base, "admin-a", ["review"]);
    await assert.rejects(module._reconcilePendingGroup(saga, "review"), { code: "establishment-conflict" });
    assert.equal(saga.expectedRevision, 8);
  });

  test("NONFINITE_NAN_VS_NULL_REJECTED", async () => {
    const { module } = await loadAdminModule();
    assert.equal(module._semanticEqual(Number.NaN, null), false);
    assert.equal(module._semanticEqual(Number.NaN, Number.NaN), false);
  });

  test("NONFINITE_INFINITY_VS_NULL_REJECTED", async () => {
    const { module } = await loadAdminModule();
    assert.equal(module._semanticEqual(Number.POSITIVE_INFINITY, null), false);
  });

  test("NONFINITE_NEGATIVE_INFINITY_REJECTED", async () => {
    const { module } = await loadAdminModule();
    assert.equal(module._semanticEqual(Number.NEGATIVE_INFINITY, null), false);
  });

  test("NONFINITE_NESTED_NUMBER_REJECTED", async () => {
    const { module } = await loadAdminModule();
    for (const [left, right] of [
      [{ location: { coordinates: { lat: Number.NaN, lng: -50 } } }, { location: { coordinates: { lat: null, lng: -50 } } }],
      [{ location: { coordinates: { lat: -25, lng: Number.POSITIVE_INFINITY } } }, { location: { coordinates: { lat: -25, lng: null } } }],
      [{ display: { priority: Number.NEGATIVE_INFINITY } }, { display: { priority: null } }],
      [{ media: { gallery: [{ position: Number.NaN }] } }, { media: { gallery: [{ position: null }] } }],
    ]) {
      assert.equal(module._semanticEqual(left, right), false);
    }
  });

  test("FINITE_NUMBER_EQUALITY_PRESERVED", async () => {
    const { module } = await loadAdminModule();
    assert.equal(module._semanticEqual(0, 0), true);
    assert.equal(module._semanticEqual(1, 1), true);
    assert.equal(module._semanticEqual(1, 2), false);
    assert.equal(module._semanticEqual(0, -0), true);
  });

  test("NUMERIC_AND_STRING_ARRAY_ELEMENTS_DISTINCT", async () => {
    const { module } = await loadAdminModule();
    assert.equal(module._semanticEqual([1], ["1"]), false);
    const base = v2Fixture("draft", allMarkers(), 8);
    const desired = { ...base, relationships: { ...base.relationships, routeIds: ["1"] } };
    const raw = { ...base, relationships: { ...base.relationships, routeIds: [1] }, revision: 9 };
    const ref = { id: "est-v2", get: async () => ({ exists: true, id: "est-v2", data: () => raw }) };
    const saga = module._buildSaga(ref, desired, base, "admin-a", ["relationshipsRouteIds"]);
    await assert.rejects(module._reconcilePendingGroup(saga, "relationshipsRouteIds"), { code: "establishment-conflict" });
    assert.equal(saga.expectedRevision, 8);
  });

  test("SEMANTICALLY_IDENTICAL_CONCURRENT_GROUP_WRITE", async () => {
    const { module } = await loadAdminModule();
    const base = v2Fixture("draft", allMarkers(), 8);
    const desired = { ...base, content: { ...base.content, summary: "Mesmo estado" } };
    const raw = {
      ...base,
      content: desired.content,
      revision: 9,
      updatedAt: new Date("2026-08-25T21:00:00Z"),
      updatedBy: "admin-b",
    };
    const ref = { id: "est-v2", get: async () => ({ exists: true, id: "est-v2", data: () => raw }) };
    const saga = module._buildSaga(ref, desired, base, "admin-a", ["content"]);
    const accepted = await module._reconcilePendingGroup(saga, "content");
    assert.equal(accepted, true);
    assert.equal(module._RECONCILIATION_MODE, "SEMANTIC_IDEMPOTENT_EQUIVALENCE");
    assert.equal(saga.expectedRevision, 9);
    assert.equal(raw.content.summary, "Mesmo estado");
    assert.equal("authorshipProven" in saga, false);
  });

  test("SEMANTICALLY_DIFFERENT_CONCURRENT_GROUP_WRITE", async () => {
    const { module } = await loadAdminModule();
    const base = v2Fixture("draft", allMarkers(), 8);
    const desired = { ...base, content: { ...base.content, summary: "Estado A" } };
    const raw = { ...base, content: { ...base.content, summary: "Estado B" }, revision: 9 };
    const ref = { id: "est-v2", get: async () => ({ exists: true, id: "est-v2", data: () => raw }) };
    const saga = module._buildSaga(ref, desired, base, "admin-a", ["content"]);
    await assert.rejects(module._reconcilePendingGroup(saga, "content"), { code: "establishment-conflict" });
    assert.equal(raw.content.summary, "Estado B");
    assert.equal(saga.expectedRevision, 8);
  });

  test("SEMANTIC_RECONCILIATION_WRONG_MARKER", async () => {
    const { module } = await loadAdminModule();
    const base = v2Fixture("draft", allMarkers(), 8);
    const desired = { ...base, content: { ...base.content, summary: "Mesmo estado" } };
    const withoutContentMarker = { ...allMarkers() };
    delete withoutContentMarker.content;
    for (const raw of [
      { ...base, content: desired.content, validatedGroups: withoutContentMarker, revision: 9 },
      { ...base, content: desired.content, validatedGroups: { ...allMarkers(), content: 1 }, revision: 9 },
      { ...base, content: desired.content, schemaVersion: 3, revision: 9 },
    ]) {
      const ref = { id: "est-v2", get: async () => ({ exists: true, id: "est-v2", data: () => raw }) };
      const saga = module._buildSaga(ref, desired, base, "admin-a", ["content"]);
      await assert.rejects(module._reconcilePendingGroup(saga, "content"), { code: "establishment-conflict" });
      assert.equal(saga.expectedRevision, 8);
    }
  });

  test("SEMANTIC_RECONCILIATION_REVISION_GAP", async () => {
    const { module } = await loadAdminModule();
    const base = v2Fixture("draft", allMarkers(), 8);
    const desired = { ...base, content: { ...base.content, summary: "Mesmo estado" } };
    const raw = { ...base, content: desired.content, revision: 10 };
    const ref = { id: "est-v2", get: async () => ({ exists: true, id: "est-v2", data: () => raw }) };
    const saga = module._buildSaga(ref, desired, base, "admin-a", ["content"]);
    await assert.rejects(module._reconcilePendingGroup(saga, "content"), { code: "establishment-conflict" });
    assert.equal(saga.expectedRevision, 8);
  });

  test("SEMANTIC_RECONCILIATION_REVISION_BELOW_EXPECTED", async () => {
    const { module } = await loadAdminModule();
    const base = v2Fixture("draft", allMarkers(), 8);
    const desired = { ...base, content: { ...base.content, summary: "Mesmo estado" } };
    const raw = { ...base, content: desired.content, revision: 7 };
    const ref = { id: "est-v2", get: async () => ({ exists: true, id: "est-v2", data: () => raw }) };
    const saga = module._buildSaga(ref, desired, base, "admin-a", ["content"]);
    await assert.rejects(module._reconcilePendingGroup(saga, "content"), { code: "establishment-conflict" });
    assert.equal(saga.expectedRevision, 8);
    assert.equal(raw.content.summary, "Mesmo estado");
  });

  test("SEMANTIC_RECONCILIATION_AUDIT_ATTRIBUTION_PRESERVED", async () => {
    const { module } = await loadAdminModule();
    const base = v2Fixture("draft", allMarkers(), 8);
    const desired = { ...base, content: { ...base.content, summary: "Mesmo estado" } };
    const concurrentUpdatedAt = new Date("2026-08-25T21:30:00Z");
    const raw = {
      ...base,
      content: desired.content,
      revision: 9,
      updatedAt: concurrentUpdatedAt,
      updatedBy: "admin-b",
    };
    const ref = { id: "est-v2", get: async () => ({ exists: true, id: "est-v2", data: () => raw }) };
    const saga = module._buildSaga(ref, desired, base, "admin-a", ["content"]);
    await module._reconcilePendingGroup(saga, "content");
    assert.equal(raw.updatedBy, "admin-b");
    assert.equal(raw.updatedAt, concurrentUpdatedAt);
  });
});

describe("CMS establishments C1 V2 — contrato persistido de editSession", () => {
  function activeEditSession() {
    return {
      resumeStatus: "published",
      startedAt: new Date("2026-08-25T20:00:00Z"),
      startedBy: "admin-v2",
    };
  }

  async function beginPublishedEdit(target, base, revision) {
    return updateDoc(target, {
      status: "draft",
      publishing: {
        ...base.publishing,
        publishedAt: null,
        publishedBy: "",
      },
      editSession: {
        resumeStatus: "published",
        startedAt: serverTimestamp(),
        startedBy: "admin-v2",
      },
      schemaVersion: 2,
      validatedGroups: allMarkers(),
      revision,
      updatedAt: serverTimestamp(),
      updatedBy: "admin-v2",
    });
  }

  async function republishAndClearSession(target, revision) {
    return updateDoc(target, {
      status: "published",
      publishing: {
        publishedAt: serverTimestamp(),
        publishedBy: "admin-v2",
        archivedAt: null,
        archivedBy: "",
        archiveReason: "",
      },
      editSession: deleteField(),
      schemaVersion: 2,
      validatedGroups: allMarkers(),
      revision,
      updatedAt: serverTimestamp(),
      updatedBy: "admin-v2",
    });
  }

  test("novo shell com editSession é negado", async () => {
    await seedDocuments([userEntry("admin-v2", "admin", true)]);
    await assertFails(setDoc(doc(authenticatedDb("admin-v2"), "cms_establishments", "shell-session"), {
      id: "shell-session",
      slug: "shell-session",
      status: "draft",
      createdAt: serverTimestamp(),
      createdBy: "admin-v2",
      updatedAt: serverTimestamp(),
      updatedBy: "admin-v2",
      schemaVersion: 2,
      validatedGroups: {},
      revision: 0,
      editSession: {
        resumeStatus: "published",
        startedAt: serverTimestamp(),
        startedBy: "admin-v2",
      },
    }));
  });

  test("published -> draft aceita unpublish explícito sem editSession", async () => {
    const base = v2Fixture("published", allMarkers(), 60);
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    await assertSucceeds(writeGroup(target, "lifecycle", {
      status: "draft",
      publishing: { ...base.publishing, publishedAt: null, publishedBy: "" },
    }, 61, allMarkers()));
    const result = await getDoc(target);
    assert.equal("editSession" in result.data(), false);
  });

  test("published -> draft cria editSession exata e patches de grupo a preservam", async () => {
    const base = v2Fixture("published", allMarkers(), 70);
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    await assertSucceeds(beginPublishedEdit(target, base, 71));
    const started = (await getDoc(target)).data().editSession;
    assert.equal(started.resumeStatus, "published");
    assert.equal(started.startedBy, "admin-v2");
    await assertSucceeds(writeGroup(target, "content", validGroupMutation("content", base), 72, allMarkers()));
    await assertSucceeds(writeGroup(target, "contact", validGroupMutation("contact", base), 73, allMarkers()));
    const afterGroups = (await getDoc(target)).data();
    assert.deepEqual(afterGroups.editSession, started);
    assert.equal(afterGroups.status, "draft");
  });

  test("Rotas narrow writer preserva editSession exatamente", async () => {
    const session = activeEditSession();
    const base = { ...v2Fixture("draft", allMarkers(), 75), editSession: session };
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    await assertSucceeds(updateDoc(target, {
      relationships: { ...base.relationships, routeIds: ["rota-narrow"] },
      updatedAt: serverTimestamp(),
      updatedBy: "admin-v2",
    }));
    const result = (await getDoc(target)).data();
    assert.equal(result.editSession.resumeStatus, session.resumeStatus);
    assert.equal(result.editSession.startedAt.toMillis(), session.startedAt.getTime());
    assert.equal(result.editSession.startedBy, session.startedBy);
    assert.deepEqual(result.relationships.routeIds, ["rota-narrow"]);
    assert.equal(result.revision, 75);
  });

  test("PUBLISHED_EDIT_RELOAD_RESUME_FULL republica e remove editSession", async () => {
    const base = v2Fixture("published", allMarkers(), 80);
    const targetFirstSession = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    await assertSucceeds(beginPublishedEdit(targetFirstSession, base, 81));
    await assertSucceeds(writeGroup(targetFirstSession, "content", validGroupMutation("content", base), 82, allMarkers()));
    await assertSucceeds(writeGroup(targetFirstSession, "contact", validGroupMutation("contact", base), 83, allMarkers()));

    const targetReloadedSession = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    const persisted = (await getDoc(targetReloadedSession)).data();
    assert.equal(persisted.status, "draft");
    assert.equal(persisted.editSession.resumeStatus, "published");
    assert.equal(persisted.content.summary, "Resumo atualizado");
    assert.equal(persisted.contact.phone, "42 99999-0000");
    await assertSucceeds(republishAndClearSession(targetReloadedSession, 84));
    const completed = (await getDoc(targetReloadedSession)).data();
    assert.equal(completed.status, "published");
    assert.equal("editSession" in completed, false);
    assert.equal(completed.content.summary, "Resumo atualizado");
  });

  test("editSession forjada ou alterada fora da lifecycle permitida é negada", async () => {
    const ordinaryDraft = v2Fixture("draft", allMarkers(), 90);
    const draftTarget = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", ordinaryDraft]]);
    await assertFails(updateDoc(draftTarget, {
      ...validGroupMutation("content", ordinaryDraft),
      editSession: activeEditSession(),
      schemaVersion: 2,
      validatedGroups: allMarkers(),
      revision: 91,
      updatedAt: serverTimestamp(),
      updatedBy: "admin-v2",
    }));

    const withSession = { ...ordinaryDraft, editSession: activeEditSession() };
    await seedDocuments([["cms_establishments/with-session", withSession]]);
    const sessionTarget = doc(authenticatedDb("admin-v2"), "cms_establishments", "with-session");
    for (const editSession of [
      { ...activeEditSession(), resumeStatus: "draft" },
      { ...activeEditSession(), startedAt: new Date("2025-01-01T00:00:00Z") },
      { ...activeEditSession(), startedBy: "other-admin" },
      { ...activeEditSession(), extra: true },
    ]) {
      await assertFails(updateDoc(sessionTarget, {
        ...validGroupMutation("content", withSession),
        editSession,
        schemaVersion: 2,
        validatedGroups: allMarkers(),
        revision: 91,
        updatedAt: serverTimestamp(),
        updatedBy: "admin-v2",
      }));
    }
  });

  test("criação de editSession exige actor e request.time exatos", async () => {
    const base = v2Fixture("published", allMarkers(), 100);
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    for (const editSession of [
      { resumeStatus: "draft", startedAt: serverTimestamp(), startedBy: "admin-v2" },
      { resumeStatus: "published", startedAt: new Date("2025-01-01T00:00:00Z"), startedBy: "admin-v2" },
      { resumeStatus: "published", startedAt: serverTimestamp(), startedBy: "other-admin" },
      { resumeStatus: "published", startedAt: serverTimestamp(), startedBy: "admin-v2", extra: true },
    ]) {
      await assertFails(updateDoc(target, {
        status: "draft",
        publishing: { ...base.publishing, publishedAt: null, publishedBy: "" },
        editSession,
        schemaVersion: 2,
        validatedGroups: allMarkers(),
        revision: 101,
        updatedAt: serverTimestamp(),
        updatedBy: "admin-v2",
      }));
    }
  });

  test("published result mantendo editSession e archive/restore com sessão ativa são negados", async () => {
    const base = { ...v2Fixture("draft", allMarkers(), 110), editSession: activeEditSession() };
    const target = doc(authenticatedDb("admin-v2"), "cms_establishments", "est-v2");
    await seedDocuments([userEntry("admin-v2", "admin", true), ["cms_establishments/est-v2", base]]);
    await assertFails(writeGroup(target, "lifecycle", {
      status: "published",
      publishing: {
        publishedAt: serverTimestamp(), publishedBy: "admin-v2",
        archivedAt: null, archivedBy: "", archiveReason: "",
      },
    }, 111, allMarkers()));
    await assertFails(writeGroup(target, "lifecycle", {
      status: "archived",
      publishing: {
        ...base.publishing,
        archivedAt: serverTimestamp(), archivedBy: "admin-v2", archiveReason: "Teste",
      },
    }, 111, allMarkers()));

    const archivedWithSession = {
      ...v2Fixture("archived", allMarkers(), 112),
      editSession: activeEditSession(),
    };
    await seedDocuments([["cms_establishments/archived-session", archivedWithSession]]);
    await assertFails(writeGroup(
      doc(authenticatedDb("admin-v2"), "cms_establishments", "archived-session"),
      "lifecycle",
      {
        status: "draft",
        publishing: {
          ...archivedWithSession.publishing,
          archivedAt: null,
          archivedBy: "",
          archiveReason: "",
        },
      },
      113,
      allMarkers(),
    ));
  });
});

describe("CMS establishments C1 V2 — recovery do orquestrador e concorrência Rotas", () => {
  async function loadFreshAdminModule() {
    const source = await readFile(new URL("../js/admin/modules/empreendimentos.js", import.meta.url), "utf8");
    const sandbox = {
      console,
      document: { getElementById: () => null },
      window: {
        firebase: { firestore: { FieldValue: {
          serverTimestamp: () => new Date("2026-08-25T20:00:00Z"),
          delete: () => ({ __deleteField: true }),
        } } },
      },
    };
    runInNewContext(source, sandbox);
    return sandbox.window.AdminEstablishmentsModule;
  }

  function persistentTransactionDb(raw) {
    const db = {
      raw: { ...raw },
      failNextTransaction: false,
      runTransaction(callback) {
        if (this.failNextTransaction) {
          this.failNextTransaction = false;
          return Promise.reject(new Error("simulated-group-failure"));
        }
        const transaction = {
          get: async () => ({ exists: true, id: "est-v2", data: () => this.raw }),
          update: (_ref, patch) => {
            for (const [key, value] of Object.entries(patch)) {
              if (value && value.__deleteField === true) delete this.raw[key];
              else this.raw[key] = value;
            }
          },
        };
        return callback(transaction);
      },
    };
    const ref = {
      id: "est-v2",
      get: async () => ({ exists: true, id: "est-v2", data: () => db.raw }),
    };
    return { db, ref };
  }

  async function executeGroups(module, db, ref, base, desired, groups) {
    const saga = module._buildSaga(ref, desired, base, "admin-v2", groups);
    await module._executeSaga(db, saga);
    return module._normalizeDoc(db.raw, "est-v2");
  }

  test("PUBLISHED_EDIT_RELOAD_RESUME_FULL descarta estado JS e reconstrói pelo documento", async () => {
    const firstModule = await loadFreshAdminModule();
    const initial = v2Fixture("published", allMarkers(), 120);
    const { db, ref } = persistentTransactionDb(initial);
    let current = await executeGroups(
      firstModule, db, ref, initial,
      firstModule._lifecycleEditDraft(initial, "admin-v2"), ["lifecycle"],
    );
    let desired = {
      ...current,
      content: { ...current.content, summary: "Persistido antes do reload" },
      contact: { ...current.contact, phone: "42 99999-1111" },
    };
    current = await executeGroups(firstModule, db, ref, current, desired, ["content", "contact"]);

    const reloadedModule = await loadFreshAdminModule();
    const reopened = reloadedModule._normalizeDoc(db.raw, "est-v2");
    assert.equal(reloadedModule._state.pendingSaga, null);
    assert.equal(reloadedModule._hasResumeEditSession(reopened), true);
    assert.equal(db.raw.status, "draft");
    const reviewedDesired = {
      ...reopened,
      seo: { ...reopened.seo, title: "Revisado após reload" },
    };
    current = await executeGroups(
      reloadedModule, db, ref, reopened, reviewedDesired,
      reloadedModule._groupsToWrite(reopened, reviewedDesired),
    );
    await executeGroups(
      reloadedModule, db, ref, current,
      reloadedModule._lifecyclePublished(current, "admin-v2"), ["lifecycle"],
    );
    assert.equal(db.raw.status, "published");
    assert.equal("editSession" in db.raw, false);
    assert.equal(db.raw.content.summary, "Persistido antes do reload");
    assert.equal(db.raw.contact.phone, "42 99999-1111");
    assert.equal(db.raw.seo.title, "Revisado após reload");
  });

  test("reload imediato após unpublish exige novo Save explícito antes de republicar", async () => {
    const firstModule = await loadFreshAdminModule();
    const initial = v2Fixture("published", allMarkers(), 130);
    const { db, ref } = persistentTransactionDb(initial);
    await executeGroups(
      firstModule, db, ref, initial,
      firstModule._lifecycleEditDraft(initial, "admin-v2"), ["lifecycle"],
    );
    const reloadedModule = await loadFreshAdminModule();
    const reopened = reloadedModule._normalizeDoc(db.raw, "est-v2");
    assert.equal(reloadedModule._hasResumeEditSession(reopened), true);
    assert.equal(db.raw.status, "draft");
    assert.equal(db.raw.editSession.resumeStatus, "published");
    await executeGroups(
      reloadedModule, db, ref, reopened,
      reloadedModule._lifecyclePublished(reopened, "admin-v2"), ["lifecycle"],
    );
    assert.equal(db.raw.status, "published");
    assert.equal("editSession" in db.raw, false);
  });

  test("reload após falha de grupo preserva progresso e permite conclusão posterior", async () => {
    const firstModule = await loadFreshAdminModule();
    const initial = v2Fixture("published", allMarkers(), 140);
    const { db, ref } = persistentTransactionDb(initial);
    let current = await executeGroups(
      firstModule, db, ref, initial,
      firstModule._lifecycleEditDraft(initial, "admin-v2"), ["lifecycle"],
    );
    let desired = { ...current, content: { ...current.content, summary: "Grupo A persistido" } };
    current = await executeGroups(firstModule, db, ref, current, desired, ["content"]);
    const groupBDesired = { ...current, contact: { ...current.contact, phone: "42 99999-2222" } };
    db.failNextTransaction = true;
    await assert.rejects(
      executeGroups(firstModule, db, ref, current, groupBDesired, ["contact"]),
      /simulated-group-failure/,
    );
    assert.equal(db.raw.status, "draft");
    assert.equal(db.raw.editSession.resumeStatus, "published");
    assert.equal(db.raw.content.summary, "Grupo A persistido");
    assert.notEqual(db.raw.contact.phone, "42 99999-2222");

    const reloadedModule = await loadFreshAdminModule();
    const reopened = reloadedModule._normalizeDoc(db.raw, "est-v2");
    current = await executeGroups(reloadedModule, db, ref, reopened, groupBDesired, ["contact"]);
    await executeGroups(
      reloadedModule, db, ref, current,
      reloadedModule._lifecyclePublished(current, "admin-v2"), ["lifecycle"],
    );
    assert.equal(db.raw.status, "published");
    assert.equal("editSession" in db.raw, false);
    assert.equal(db.raw.contact.phone, "42 99999-2222");
  });

  test("ordinary draft sem editSession permanece draft após reload e Save", async () => {
    const firstModule = await loadFreshAdminModule();
    const initial = v2Fixture("draft", allMarkers(), 150);
    const { db, ref } = persistentTransactionDb(initial);
    const reloadedModule = await loadFreshAdminModule();
    const reopened = reloadedModule._normalizeDoc(db.raw, "est-v2");
    assert.equal(reloadedModule._hasResumeEditSession(reopened), false);
    const desired = { ...reopened, content: { ...reopened.content, summary: "Draft salvo" } };
    await executeGroups(reloadedModule, db, ref, reopened, desired, ["content"]);
    assert.equal(db.raw.status, "draft");
    assert.equal("editSession" in db.raw, false);
    assert.equal(firstModule._state.pendingSaga, null);
  });

  test("CONCURRENT_ROTAS_RELATIONSHIP_UPDATE_DURING_NON_RELATIONSHIP_CMS_SAVE", async () => {
    const module = await loadFreshAdminModule();
    const initial = v2Fixture("draft", allMarkers(), 160);
    const { db, ref } = persistentTransactionDb(initial);
    const desired = { ...initial, content: { ...initial.content, summary: "CMS content" } };
    const saga = module._buildSaga(ref, desired, initial, "admin-v2", ["content"]);
    db.raw.relationships = { ...initial.relationships, routeIds: ["rota-concorrente"] };
    await module._executeSaga(db, saga);
    assert.equal(db.raw.content.summary, "CMS content");
    assert.deepEqual(db.raw.relationships.routeIds, ["rota-concorrente"]);
    assert.equal(db.raw.revision, 161);
  });

  test("CMS routeIds conflita se Rotas alterar o mesmo subgrupo antes da transaction", async () => {
    const module = await loadFreshAdminModule();
    const initial = v2Fixture("draft", allMarkers(), 170);
    const { db, ref } = persistentTransactionDb(initial);
    const desired = {
      ...initial,
      relationships: { ...initial.relationships, routeIds: ["rota-cms"] },
    };
    const saga = module._buildSaga(ref, desired, initial, "admin-v2", ["relationshipsRouteIds"]);
    db.raw.relationships = { ...initial.relationships, routeIds: ["rota-rotas"] };
    await assert.rejects(module._executeSaga(db, saga), { code: "establishment-conflict" });
    assert.deepEqual(db.raw.relationships.routeIds, ["rota-rotas"]);
    assert.equal(db.raw.revision, 170);
  });

  test("CONCURRENT_ROTAS_ROUTEIDS_AND_CMS_RELATEDPLACES_NO_LOST_UPDATE", async () => {
    const module = await loadFreshAdminModule();
    const initial = v2Fixture("draft", allMarkers(), 180);
    const { db, ref } = persistentTransactionDb(initial);
    const desired = {
      ...initial,
      relationships: { ...initial.relationships, relatedPlaceIds: ["place-cms"] },
    };
    const saga = module._buildSaga(ref, desired, initial, "admin-v2", ["relationshipsRelatedPlaceIds"]);
    db.raw.relationships = { ...initial.relationships, routeIds: ["rota-concorrente"] };
    await module._executeSaga(db, saga);
    assert.deepEqual(db.raw.relationships.routeIds, ["rota-concorrente"]);
    assert.deepEqual(db.raw.relationships.relatedPlaceIds, ["place-cms"]);
    assert.equal(db.raw.revision, 181);
  });
});
