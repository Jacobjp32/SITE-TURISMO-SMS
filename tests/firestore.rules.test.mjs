import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, describe, test } from "node:test";

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

before(async () => {
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
  }
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
