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

describe("Baseline atual de media_library", () => {
  test("BASELINE ATUAL: anônimo lê media_library — risco P1 confirmado e comportamento será alterado somente no B2A4", async () => {
    await seedMedia();
    const snapshot = await assertSucceeds(
      getDoc(
        doc(anonymousDb(), "media_library", "media-public-baseline"),
      ),
    );
    assert.equal(snapshot.exists(), true);
  });

  test("BASELINE ATUAL: anônimo lista media_library — risco P1 confirmado e comportamento será alterado somente no B2A4", async () => {
    await seedMedia();
    const snapshot = await assertSucceeds(
      getDocs(collection(anonymousDb(), "media_library")),
    );
    assert.equal(snapshot.size, 1);
  });

  test("BASELINE ATUAL: usuário comum lê media_library — risco P1 confirmado e comportamento será alterado somente no B2A4", async () => {
    await seedDocuments([
      userEntry("user-active", "user", true),
      ["media_library/media-public-baseline", MEDIA_BASELINE],
    ]);
    await assertSucceeds(
      getDoc(
        doc(
          authenticatedDb("user-active"),
          "media_library",
          "media-public-baseline",
        ),
      ),
    );
  });

  test("BASELINE ATUAL: moderator lê media_library — risco P1 confirmado e comportamento será alterado somente no B2A4", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      ["media_library/media-public-baseline", MEDIA_BASELINE],
    ]);
    await assertSucceeds(
      getDoc(
        doc(
          authenticatedDb("moderator-active"),
          "media_library",
          "media-public-baseline",
        ),
      ),
    );
  });

  test("BASELINE ATUAL: admin ativo lê media_library — leitura administrativa preservada no B2A4", async () => {
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

  test("BASELINE ATUAL: anônimo não cria media_library — escrita permanece administrativa no B2A4", async () => {
    await assertFails(
      setDoc(
        doc(anonymousDb(), "media_library", "media-public-baseline"),
        MEDIA_BASELINE,
      ),
    );
  });

  test("BASELINE ATUAL: usuário comum não cria media_library — escrita permanece administrativa no B2A4", async () => {
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

  test("BASELINE ATUAL: moderator não cria media_library — escrita permanece exclusiva de admin no B2A4", async () => {
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

  test("BASELINE ATUAL: admin ativo cria media_library — escrita administrativa preservada no B2A4", async () => {
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

  test("BASELINE ATUAL: admin inativo não cria media_library — contrato ativo deverá ser reavaliado somente no B2A5", async () => {
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
});

describe("Baseline atual do campo ativo em isAdmin", () => {
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
      name: "ativo null permite por null != false",
      uid: "admin-null",
      profile: { role: "admin", ativo: null },
      expectation: assertSucceeds,
    },
    {
      name: "ativo string true permite por tipo diferente de false",
      uid: "admin-string",
      profile: { role: "admin", ativo: "true" },
      expectation: assertSucceeds,
    },
    {
      name: "ativo numérico 1 permite por tipo diferente de false",
      uid: "admin-number",
      profile: { role: "admin", ativo: 1 },
      expectation: assertSucceeds,
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
    test(`BASELINE ATUAL: ${name} na criação administrativa de noticia — sem correção antes do B2A5`, async () => {
      await seedDocuments([[`usuarios/${uid}`, profile]]);
      await expectation(
        setDoc(
          doc(authenticatedDb(uid), "noticias", `news-${uid}`),
          NEWS_DRAFT,
        ),
      );
    });
  }

  test("BASELINE ATUAL: documento usuarios ausente nega criação administrativa de noticia — sem correção antes do B2A5", async () => {
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

describe("Baseline atual de moderator", () => {
  test("BASELINE ATUAL: moderator ativo lê eventos_pendentes — contrato isModerator preservado até o B2A5", async () => {
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

  test("BASELINE ATUAL: moderator ativo atualiza eventos_pendentes — contrato isModerator preservado até o B2A5", async () => {
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

  test("BASELINE ATUAL: moderator ativo exclui eventos_pendentes — contrato isModerator preservado até o B2A5", async () => {
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

  test("BASELINE ATUAL: moderator inativo recebe DENY em eventos_pendentes — contrato ativo preservado até o B2A5", async () => {
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

  test("BASELINE ATUAL: moderator não cria noticia — escrita exclusiva de admin preservada até o B2A5", async () => {
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

  test("BASELINE ATUAL: moderator não cria media_library — escrita exclusiva de admin preservada até o B2A5", async () => {
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

  test("BASELINE ATUAL: moderator não lista usuarios — limite administrativo preservado até o B2A5", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      userEntry("user-active", "user", true),
    ]);
    await assertFails(
      getDocs(collection(authenticatedDb("moderator-active"), "usuarios")),
    );
  });

  test("BASELINE ATUAL: moderator lê o próprio documento usuario — acesso próprio preservado até o B2A5", async () => {
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

  test("BASELINE ATUAL: moderator não administra cms_establishments draft — limite exclusivo de admin preservado até o B2A5", async () => {
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

  test("BASELINE ATUAL: moderator escreve eventos_aprovados conforme Rule atual — contrato isModerator preservado até o B2A5", async () => {
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

describe("Baseline atual do fallback deny", () => {
  test("BASELINE ATUAL: anônimo não lê coleção desconhecida — fallback global DENY confirmado", async () => {
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

  test("BASELINE ATUAL: usuário comum não lê coleção desconhecida — fallback global DENY confirmado", async () => {
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

  test("BASELINE ATUAL: admin não lê coleção desconhecida sem match explícito — fallback global DENY confirmado", async () => {
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
