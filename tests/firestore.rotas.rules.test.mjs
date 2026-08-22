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
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const PROJECT_ID = "demo-turismo-sms-rules-test";
const FIXED_TIME = Timestamp.fromMillis(1_700_000_000_000);
let testEnv;

function anonymousDb() {
  return testEnv.unauthenticatedContext().firestore();
}

function authenticatedDb(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

function userEntry(uid, role, ativo = true) {
  const data = { role };
  if (ativo !== undefined) data.ativo = ativo;
  return [`usuarios/${uid}`, data];
}

async function seedDocuments(entries) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all(entries.map(([documentPath, data]) =>
      setDoc(doc(db, documentPath), data)));
  });
}

function routeDocument(id, status = "draft") {
  const published = status === "published";
  const archived = status === "archived";
  return {
    id,
    slug: id,
    name: `Synthetic route ${id}`,
    category: "Synthetic category",
    description: "Synthetic description for local Emulator validation.",
    color: "#123abc",
    icon: "R",
    status,
    displayOrder: 10,
    cover: {
      mediaId: "",
      url: "images/synthetic-route.webp",
      path: "",
      alt: "Synthetic route cover",
    },
    tags: ["synthetic", "route"],
    createdAt: FIXED_TIME,
    createdBy: "synthetic-creator",
    updatedAt: FIXED_TIME,
    updatedBy: "synthetic-creator",
    publishedAt: published ? FIXED_TIME : null,
    publishedBy: published ? "synthetic-publisher" : "",
    archivedAt: archived ? FIXED_TIME : null,
    archivedBy: archived ? "synthetic-archiver" : "",
  };
}

function routeCreateDocument(id, overrides = {}) {
  return {
    ...routeDocument(id),
    createdAt: serverTimestamp(),
    createdBy: "admin-active",
    updatedAt: serverTimestamp(),
    updatedBy: "admin-active",
    ...overrides,
  };
}

function auditedUpdate(fields = {}, uid = "admin-active") {
  return {
    ...fields,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };
}

async function seedRoutes() {
  await seedDocuments([
    ["rotas/synthetic-published", routeDocument("synthetic-published", "published")],
    ["rotas/synthetic-draft", routeDocument("synthetic-draft", "draft")],
    ["rotas/synthetic-archived", routeDocument("synthetic-archived", "archived")],
  ]);
}

before(async () => {
  const rules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv?.cleanup();
});

describe("Rotas V1.1 — leitura pública e administrativa", () => {
  test("anônimo lê rota published", async () => {
    await seedRoutes();
    const snapshot = await assertSucceeds(getDoc(doc(anonymousDb(), "rotas", "synthetic-published")));
    assert.equal(snapshot.exists(), true);
  });

  test("anônimo não lê rota draft", async () => {
    await seedRoutes();
    await assertFails(getDoc(doc(anonymousDb(), "rotas", "synthetic-draft")));
  });

  test("anônimo não lê rota archived", async () => {
    await seedRoutes();
    await assertFails(getDoc(doc(anonymousDb(), "rotas", "synthetic-archived")));
  });

  test("anônimo consulta somente status published", async () => {
    await seedRoutes();
    const snapshot = await assertSucceeds(getDocs(query(
      collection(anonymousDb(), "rotas"),
      where("status", "==", "published"),
    )));
    assert.equal(snapshot.size, 1);
  });

  test("anônimo não lista coleção ampla", async () => {
    await seedRoutes();
    await assertFails(getDocs(collection(anonymousDb(), "rotas")));
  });

  for (const { uid, role } of [
    { uid: "user-active", role: "user" },
    { uid: "moderator-active", role: "moderator" },
  ]) {
    test(`${role} lê published pelo ramo público`, async () => {
      await seedDocuments([
        userEntry(uid, role, true),
        ["rotas/synthetic-published", routeDocument("synthetic-published", "published")],
      ]);
      await assertSucceeds(getDoc(doc(authenticatedDb(uid), "rotas", "synthetic-published")));
    });
  }

  for (const status of ["draft", "published", "archived"]) {
    test(`admin ativo lê ${status}`, async () => {
      const id = `synthetic-${status}`;
      await seedDocuments([
        userEntry("admin-active", "admin", true),
        [`rotas/${id}`, routeDocument(id, status)],
      ]);
      await assertSucceeds(getDoc(doc(authenticatedDb("admin-active"), "rotas", id)));
    });
  }

  test("admin ativo lista todos os status", async () => {
    await seedDocuments([userEntry("admin-active", "admin", true)]);
    await seedRoutes();
    const snapshot = await assertSucceeds(getDocs(collection(authenticatedDb("admin-active"), "rotas")));
    assert.equal(snapshot.size, 3);
  });

  for (const { name, ativo } of [
    { name: "false", ativo: false },
    { name: "null", ativo: null },
  ]) {
    test(`admin com ativo ${name} não lê draft`, async () => {
      const uid = `admin-${name}`;
      await seedDocuments([
        userEntry(uid, "admin", ativo),
        ["rotas/synthetic-draft", routeDocument("synthetic-draft")],
      ]);
      await assertFails(getDoc(doc(authenticatedDb(uid), "rotas", "synthetic-draft")));
    });
  }
});

describe("Rotas V1.1 — create", () => {
  test("admin ativo cria draft válido", async () => {
    await seedDocuments([userEntry("admin-active", "admin", true)]);
    await assertSucceeds(setDoc(
      doc(authenticatedDb("admin-active"), "rotas", "synthetic-new"),
      routeCreateDocument("synthetic-new"),
    ));
  });

  for (const status of ["published", "archived"]) {
    test(`admin não cria diretamente ${status}`, async () => {
      await seedDocuments([userEntry("admin-active", "admin", true)]);
      const lifecycle = status === "published"
        ? { publishedAt: serverTimestamp(), publishedBy: "admin-active" }
        : { archivedAt: serverTimestamp(), archivedBy: "admin-active" };
      await assertFails(setDoc(
        doc(authenticatedDb("admin-active"), "rotas", `synthetic-${status}`),
        routeCreateDocument(`synthetic-${status}`, { status, ...lifecycle }),
      ));
    });
  }

  for (const { label, uid, role } of [
    { label: "moderator", uid: "moderator-active", role: "moderator" },
    { label: "user", uid: "user-active", role: "user" },
  ]) {
    test(`${label} não cria rota`, async () => {
      await seedDocuments([userEntry(uid, role, true)]);
      await assertFails(setDoc(
        doc(authenticatedDb(uid), "rotas", "synthetic-new"),
        routeCreateDocument("synthetic-new", {
          createdBy: uid,
          updatedBy: uid,
        }),
      ));
    });
  }

  test("anônimo não cria rota", async () => {
    await assertFails(setDoc(doc(anonymousDb(), "rotas", "synthetic-new"), routeCreateDocument("synthetic-new")));
  });

  const invalidCases = [
    ["id diferente do document id", (data) => ({ ...data, id: "different-id" })],
    ["campo obrigatório ausente", (data) => { const copy = { ...data }; delete copy.description; return copy; }],
    ["campo desconhecido", (data) => ({ ...data, unknown: true })],
    ["status inválido", (data) => ({ ...data, status: "invalid" })],
    ["displayOrder com tipo incorreto", (data) => ({ ...data, displayOrder: "10" })],
    ["audit malformado", (data) => ({ ...data, createdBy: null })],
    ["cover malformada", (data) => ({ ...data, cover: { url: "images/test.webp" } })],
    ["slug inválido", (data) => ({ ...data, slug: "Slug Inválido" })],
  ];

  for (const [label, mutate] of invalidCases) {
    test(`nega create com ${label}`, async () => {
      await seedDocuments([userEntry("admin-active", "admin", true)]);
      const data = mutate(routeCreateDocument("synthetic-invalid"));
      await assertFails(setDoc(doc(authenticatedDb("admin-active"), "rotas", "synthetic-invalid"), data));
    });
  }
});

describe("Rotas V1.1 — update e lifecycle", () => {
  test("admin edita draft válido", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["rotas/synthetic-draft", routeDocument("synthetic-draft")],
    ]);
    await assertSucceeds(updateDoc(
      doc(authenticatedDb("admin-active"), "rotas", "synthetic-draft"),
      auditedUpdate({ name: "Synthetic edited route" }),
    ));
  });

  test("admin muda slug antes da primeira publicação", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["rotas/synthetic-draft", routeDocument("synthetic-draft")],
    ]);
    await assertSucceeds(updateDoc(
      doc(authenticatedDb("admin-active"), "rotas", "synthetic-draft"),
      auditedUpdate({ slug: "synthetic-draft-edited" }),
    ));
  });

  test("admin publica draft registrando primeira publicação", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["rotas/synthetic-draft", routeDocument("synthetic-draft")],
    ]);
    await assertSucceeds(updateDoc(
      doc(authenticatedDb("admin-active"), "rotas", "synthetic-draft"),
      auditedUpdate({
        status: "published",
        publishedAt: serverTimestamp(),
        publishedBy: "admin-active",
      }),
    ));
  });

  test("primeira publicação sem audit de publicação é negada", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["rotas/synthetic-draft", routeDocument("synthetic-draft")],
    ]);
    await assertFails(updateDoc(
      doc(authenticatedDb("admin-active"), "rotas", "synthetic-draft"),
      auditedUpdate({ status: "published" }),
    ));
  });

  test("admin não muda slug depois da primeira publicação", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["rotas/synthetic-published", routeDocument("synthetic-published", "published")],
    ]);
    await assertFails(updateDoc(
      doc(authenticatedDb("admin-active"), "rotas", "synthetic-published"),
      auditedUpdate({ slug: "changed-after-publish" }),
    ));
  });

  test("published volta a draft preservando histórico", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["rotas/synthetic-published", routeDocument("synthetic-published", "published")],
    ]);
    await assertSucceeds(updateDoc(
      doc(authenticatedDb("admin-active"), "rotas", "synthetic-published"),
      auditedUpdate({ status: "draft" }),
    ));
  });

  test("published vira archived com audit", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["rotas/synthetic-published", routeDocument("synthetic-published", "published")],
    ]);
    await assertSucceeds(updateDoc(
      doc(authenticatedDb("admin-active"), "rotas", "synthetic-published"),
      auditedUpdate({
        status: "archived",
        archivedAt: serverTimestamp(),
        archivedBy: "admin-active",
      }),
    ));
  });

  test("draft vira archived com audit", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["rotas/synthetic-draft", routeDocument("synthetic-draft")],
    ]);
    await assertSucceeds(updateDoc(
      doc(authenticatedDb("admin-active"), "rotas", "synthetic-draft"),
      auditedUpdate({
        status: "archived",
        archivedAt: serverTimestamp(),
        archivedBy: "admin-active",
      }),
    ));
  });

  for (const target of ["draft", "published"]) {
    test(`archived não volta a ${target}`, async () => {
      await seedDocuments([
        userEntry("admin-active", "admin", true),
        ["rotas/synthetic-archived", routeDocument("synthetic-archived", "archived")],
      ]);
      const publication = target === "published"
        ? { publishedAt: serverTimestamp(), publishedBy: "admin-active" }
        : {};
      await assertFails(updateDoc(
        doc(authenticatedDb("admin-active"), "rotas", "synthetic-archived"),
        auditedUpdate({ status: target, ...publication }),
      ));
    });
  }

  const immutableCases = [
    ["id", { id: "different-id" }],
    ["createdAt", { createdAt: Timestamp.fromMillis(1) }],
    ["createdBy", { createdBy: "different-creator" }],
  ];
  for (const [label, fields] of immutableCases) {
    test(`nega mudança de ${label}`, async () => {
      await seedDocuments([
        userEntry("admin-active", "admin", true),
        ["rotas/synthetic-draft", routeDocument("synthetic-draft")],
      ]);
      await assertFails(updateDoc(
        doc(authenticatedDb("admin-active"), "rotas", "synthetic-draft"),
        auditedUpdate(fields),
      ));
    });
  }

  test("nega apagar publishedAt histórico", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["rotas/synthetic-published", routeDocument("synthetic-published", "published")],
    ]);
    await assertFails(updateDoc(
      doc(authenticatedDb("admin-active"), "rotas", "synthetic-published"),
      auditedUpdate({ status: "draft", publishedAt: deleteField() }),
    ));
  });

  test("nega alterar publishedBy histórico", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["rotas/synthetic-published", routeDocument("synthetic-published", "published")],
    ]);
    await assertFails(updateDoc(
      doc(authenticatedDb("admin-active"), "rotas", "synthetic-published"),
      auditedUpdate({ publishedBy: "different-publisher" }),
    ));
  });

  for (const [label, fields] of [
    ["campo desconhecido", { unknown: true }],
    ["tipo malformado", { description: 123 }],
  ]) {
    test(`nega update com ${label}`, async () => {
      await seedDocuments([
        userEntry("admin-active", "admin", true),
        ["rotas/synthetic-draft", routeDocument("synthetic-draft")],
      ]);
      await assertFails(updateDoc(
        doc(authenticatedDb("admin-active"), "rotas", "synthetic-draft"),
        auditedUpdate(fields),
      ));
    });
  }

  for (const { uid, role } of [
    { uid: "moderator-active", role: "moderator" },
    { uid: "user-active", role: "user" },
  ]) {
    test(`${role} não atualiza rota`, async () => {
      await seedDocuments([
        userEntry(uid, role, true),
        ["rotas/synthetic-draft", routeDocument("synthetic-draft")],
      ]);
      await assertFails(updateDoc(
        doc(authenticatedDb(uid), "rotas", "synthetic-draft"),
        auditedUpdate({ name: "Unauthorized update" }, uid),
      ));
    });
  }
});

describe("Rotas V1.1 — hard delete", () => {
  for (const { label, uid, role } of [
    { label: "admin", uid: "admin-active", role: "admin" },
    { label: "moderator", uid: "moderator-active", role: "moderator" },
    { label: "user", uid: "user-active", role: "user" },
  ]) {
    test(`${label} não exclui rota`, async () => {
      await seedDocuments([
        userEntry(uid, role, true),
        ["rotas/synthetic-draft", routeDocument("synthetic-draft")],
      ]);
      await assertFails(deleteDoc(doc(authenticatedDb(uid), "rotas", "synthetic-draft")));
    });
  }

  test("anônimo não exclui rota", async () => {
    await seedDocuments([["rotas/synthetic-draft", routeDocument("synthetic-draft")]]);
    await assertFails(deleteDoc(doc(anonymousDb(), "rotas", "synthetic-draft")));
  });
});

describe("Rotas V1.1 — relationships.routeIds[] em cms_establishments", () => {
  const establishmentPath = "cms_establishments/synthetic-establishment";

  function existingEstablishment(routeIds = []) {
    return {
      id: "synthetic-establishment",
      relationships: {
        routeIds,
        relatedPlaceIds: [],
        relatedEventIds: [],
        legacyRoute: "",
        legacyRouteName: "",
      },
      createdAt: FIXED_TIME,
      createdBy: "synthetic-creator",
      updatedAt: FIXED_TIME,
      updatedBy: "synthetic-creator",
    };
  }

  async function expectRelationshipUpdate(routeIds, expectation) {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      [establishmentPath, existingEstablishment()],
    ]);
    await expectation(updateDoc(
      doc(authenticatedDb("admin-active"), establishmentPath),
      {
        "relationships.routeIds": routeIds,
        updatedAt: serverTimestamp(),
        updatedBy: "admin-active",
      },
    ));
  }

  test("aceita array vazio", async () => expectRelationshipUpdate([], assertSucceeds));
  test("aceita uma rota", async () => expectRelationshipUpdate(["synthetic-route-a"], assertSucceeds));
  test("aceita duas rotas e preserva N:N", async () => expectRelationshipUpdate(
    ["synthetic-route-a", "synthetic-route-b"],
    assertSucceeds,
  ));
  test("aceita duplicatas no shape atual", async () => expectRelationshipUpdate(
    ["synthetic-route-a", "synthetic-route-a"],
    assertSucceeds,
  ));
  test("nega routeIds não-list", async () => expectRelationshipUpdate("synthetic-route", assertFails));
  test("nega routeIds null", async () => expectRelationshipUpdate(null, assertFails));
  test("nega routeIds ausente", async () => expectRelationshipUpdate(deleteField(), assertFails));
  test("aceita unknown routeId sem lookup dinâmico em Rules", async () => expectRelationshipUpdate(
    ["unknown-synthetic-route"],
    assertSucceeds,
  ));

  test("admin ativo salva a rota e adiciona associação N:N em uma transação", async () => {
    const routeA = routeDocument("qa-route-a");
    const routeB = routeDocument("qa-route-b");
    const nnEstablishment = existingEstablishment(["qa-route-b"]);
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["rotas/qa-route-a", routeA],
      ["rotas/qa-route-b", routeB],
      [establishmentPath, nnEstablishment],
    ]);

    const db = authenticatedDb("admin-active");
    await assertSucceeds(runTransaction(db, async (transaction) => {
      transaction.set(doc(db, "rotas", "qa-route-a"), {
        ...routeA,
        name: "Synthetic Route A updated",
        updatedAt: serverTimestamp(),
        updatedBy: "admin-active",
      });
      transaction.update(doc(db, establishmentPath), {
        "relationships.routeIds": ["qa-route-b", "qa-route-a"],
        updatedAt: serverTimestamp(),
        updatedBy: "admin-active",
      });
    }));

    const snapshot = await assertSucceeds(getDoc(doc(db, establishmentPath)));
    assert.deepEqual(snapshot.data().relationships.routeIds, ["qa-route-b", "qa-route-a"]);
  });

  test("nega fechado a transação quando a rota existente não tem id persistido", async () => {
    const routeA = routeDocument("qa-route-a");
    const malformedStoredRouteA = { ...routeA };
    delete malformedStoredRouteA.id;
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      ["rotas/qa-route-a", malformedStoredRouteA],
      ["rotas/qa-route-b", routeDocument("qa-route-b")],
      [establishmentPath, existingEstablishment(["qa-route-b"])],
    ]);

    const db = authenticatedDb("admin-active");
    await assertFails(runTransaction(db, async (transaction) => {
      transaction.set(doc(db, "rotas", "qa-route-a"), {
        ...routeA,
        updatedAt: serverTimestamp(),
        updatedBy: "admin-active",
      });
      transaction.update(doc(db, establishmentPath), {
        "relationships.routeIds": ["qa-route-b", "qa-route-a"],
        updatedAt: serverTimestamp(),
        updatedBy: "admin-active",
      });
    }));
  });

  test("remove A e preserva a relação secundária B", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      [establishmentPath, existingEstablishment(["qa-route-b", "qa-route-a"])],
    ]);
    const db = authenticatedDb("admin-active");
    await assertSucceeds(updateDoc(doc(db, establishmentPath), {
      "relationships.routeIds": ["qa-route-b"],
      updatedAt: serverTimestamp(),
      updatedBy: "admin-active",
    }));
    const snapshot = await assertSucceeds(getDoc(doc(db, establishmentPath)));
    assert.deepEqual(snapshot.data().relationships.routeIds, ["qa-route-b"]);
  });

  for (const { label, uid, role, ativo } of [
    { label: "user", uid: "user-active", role: "user", ativo: true },
    { label: "moderator", uid: "moderator-active", role: "moderator", ativo: true },
    { label: "admin inativo", uid: "admin-inactive", role: "admin", ativo: false },
  ]) {
    test(`${label} não altera routeIds`, async () => {
      await seedDocuments([
        userEntry(uid, role, ativo),
        [establishmentPath, existingEstablishment(["qa-route-b"])],
      ]);
      await assertFails(updateDoc(doc(authenticatedDb(uid), establishmentPath), {
        "relationships.routeIds": ["qa-route-b", "qa-route-a"],
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      }));
    });
  }

  test("nega caminho relacional com campo adicional", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      [establishmentPath, existingEstablishment(["qa-route-b"])],
    ]);
    await assertFails(updateDoc(doc(authenticatedDb("admin-active"), establishmentPath), {
      "relationships.routeIds": ["qa-route-b", "qa-route-a"],
      name: "Alteração fora do caminho relacional",
      updatedAt: serverTimestamp(),
      updatedBy: "admin-active",
    }));
  });

  test("nega relationships malformado e routeIds com tipo inválido", async () => {
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      [establishmentPath, existingEstablishment(["qa-route-b"])],
    ]);
    const db = authenticatedDb("admin-active");
    await assertFails(updateDoc(doc(db, establishmentPath), {
      relationships: { routeIds: "qa-route-a" },
      updatedAt: serverTimestamp(),
      updatedBy: "admin-active",
    }));
  });

  test("documento sem id no empreendimento falha fechado no caminho relacional", async () => {
    const malformedEstablishment = existingEstablishment(["qa-route-b"]);
    delete malformedEstablishment.id;
    await seedDocuments([
      userEntry("admin-active", "admin", true),
      [establishmentPath, malformedEstablishment],
    ]);
    await assertFails(updateDoc(doc(authenticatedDb("admin-active"), establishmentPath), {
      "relationships.routeIds": ["qa-route-b", "qa-route-a"],
      updatedAt: serverTimestamp(),
      updatedBy: "admin-active",
    }));
  });

});
