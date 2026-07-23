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

describe("Baseline atual de noticias", () => {
  test("BASELINE ATUAL: anônimo lê notícia publicada — leitura pública e comportamento deverá mudar no B2A3", async () => {
    await seedNews();
    const snapshot = await assertSucceeds(
      getDoc(doc(anonymousDb(), "noticias", "news-published")),
    );
    assert.equal(snapshot.exists(), true);
  });

  test("BASELINE ATUAL: anônimo lê draft de noticias — risco P0 confirmado e comportamento deverá mudar no B2A3", async () => {
    await seedNews();
    const snapshot = await assertSucceeds(
      getDoc(doc(anonymousDb(), "noticias", "news-draft")),
    );
    assert.equal(snapshot.exists(), true);
  });

  test("BASELINE ATUAL: anônimo lista toda a coleção noticias — risco P0 confirmado e comportamento deverá mudar no B2A3", async () => {
    await seedNews();
    const snapshot = await assertSucceeds(
      getDocs(collection(anonymousDb(), "noticias")),
    );
    assert.equal(snapshot.size, 3);
  });

  test("BASELINE ATUAL: anônimo consulta noticias com publicado == true — leitura pública e comportamento deverá mudar no B2A3", async () => {
    await seedNews();
    const publicQuery = query(
      collection(anonymousDb(), "noticias"),
      where("publicado", "==", true),
    );
    const snapshot = await assertSucceeds(getDocs(publicQuery));
    assert.equal(snapshot.size, 1);
  });

  test("BASELINE ATUAL: usuário comum lê draft de noticias — risco P0 confirmado e comportamento deverá mudar no B2A3", async () => {
    await seedDocuments([
      userEntry("user-active", "user", true),
      ["noticias/news-draft", NEWS_DRAFT],
    ]);
    await assertSucceeds(
      getDoc(doc(authenticatedDb("user-active"), "noticias", "news-draft")),
    );
  });

  test("BASELINE ATUAL: moderator lê draft pela permissão pública — risco P0 confirmado e comportamento deverá mudar no B2A3", async () => {
    await seedDocuments([
      userEntry("moderator-active", "moderator", true),
      ["noticias/news-draft", NEWS_DRAFT],
    ]);
    await assertSucceeds(
      getDoc(
        doc(authenticatedDb("moderator-active"), "noticias", "news-draft"),
      ),
    );
  });

  test("BASELINE ATUAL: admin ativo lê draft de noticias — leitura administrativa preservada no B2A3", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["noticias/news-draft", NEWS_DRAFT],
    ]);
    await assertSucceeds(
      getDoc(doc(authenticatedDb("admin-active"), "noticias", "news-draft")),
    );
  });

  test("BASELINE ATUAL: anônimo não cria noticia — escrita permanece administrativa no B2A3", async () => {
    await assertFails(
      setDoc(
        doc(anonymousDb(), "noticias", "news-draft"),
        NEWS_DRAFT,
      ),
    );
  });

  test("BASELINE ATUAL: usuário comum não cria noticia — escrita permanece administrativa no B2A3", async () => {
    await seedDocuments([userEntry("user-active", "user", true)]);
    await assertFails(
      setDoc(
        doc(authenticatedDb("user-active"), "noticias", "news-draft"),
        NEWS_DRAFT,
      ),
    );
  });

  test("BASELINE ATUAL: moderator não cria noticia — escrita permanece exclusiva de admin no B2A3", async () => {
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

  test("BASELINE ATUAL: admin ativo cria noticia — escrita administrativa preservada no B2A3", async () => {
    await seedDocuments([userEntry("admin-active", "admin", true)]);
    await assertSucceeds(
      setDoc(
        doc(authenticatedDb("admin-active"), "noticias", "news-draft"),
        NEWS_DRAFT,
      ),
    );
  });

  test("BASELINE ATUAL: admin inativo não cria noticia — contrato ativo deverá ser reavaliado somente no B2A5", async () => {
    await seedDocuments([userEntry("admin-inactive", "admin", false)]);
    await assertFails(
      setDoc(
        doc(authenticatedDb("admin-inactive"), "noticias", "news-draft"),
        NEWS_DRAFT,
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
