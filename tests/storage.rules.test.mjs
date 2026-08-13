import { readFile } from "node:fs/promises";
import { after, before, beforeEach, describe, test } from "node:test";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";

const PROJECT_ID = "demo-turismo-sms-rules-test";
const IMAGE_CONTENT = "synthetic-image-content";
const IMAGE_METADATA = { contentType: "image/png" };

let testEnv;

function storageFor(uid) {
  return uid
    ? testEnv.authenticatedContext(uid).storage()
    : testEnv.unauthenticatedContext().storage();
}

function profileData(role, ativo = true) {
  const data = { role };
  if (ativo !== undefined) {
    data.ativo = ativo;
  }
  return data;
}

async function seedProfiles(entries) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all(
      entries.map(([uid, data]) => db.doc(`usuarios/${uid}`).set(data)),
    );
  });
}

async function seedStorageObject(path) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context
      .storage()
      .ref(path)
      .putString(IMAGE_CONTENT, "raw", IMAGE_METADATA);
  });
}

function uploadImage(uid, path) {
  return storageFor(uid)
    .ref(path)
    .putString(IMAGE_CONTENT, "raw", IMAGE_METADATA);
}

before(async () => {
  const [firestoreRules, storageRules] = await Promise.all([
    readFile(new URL("../firestore.rules", import.meta.url), "utf8"),
    readFile(new URL("../storage.rules", import.meta.url), "utf8"),
  ]);

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: firestoreRules },
    storage: { rules: storageRules },
  });
});

beforeEach(async () => {
  await Promise.all([testEnv.clearFirestore(), testEnv.clearStorage()]);
});

after(async () => {
  await testEnv?.cleanup();
});

describe("Autorização administrativa de Storage pós-B2A5", () => {
  test("admin ativo true envia imagem para cms-media", async () => {
    await seedProfiles([["admin-active", profileData("admin", true)]]);
    await assertSucceeds(
      uploadImage("admin-active", "cms-media/admin-active/admin-image.png"),
    );
  });

  for (const { name, ativo } of [
    { name: "false", ativo: false },
    { name: "null", ativo: null },
    { name: "string", ativo: "true" },
    { name: "number", ativo: 1 },
    { name: "array", ativo: [] },
    { name: "map", ativo: {} },
    { name: "ausente", ativo: undefined },
  ]) {
    test(`admin com ativo ${name} não envia imagem para cms-media`, async () => {
      const uid = `admin-active-${name}`;
      await seedProfiles([
        [
          uid,
          ativo === undefined ? { role: "admin" } : profileData("admin", ativo),
        ],
      ]);
      await assertFails(
        uploadImage(uid, `cms-media/${uid}/admin-image.png`),
      );
    });
  }

  for (const { name, profile } of [
    { name: "ausente", profile: { ativo: true } },
    { name: "inválida", profile: { role: "owner", ativo: true } },
  ]) {
    test(`perfil administrativo com role ${name} não envia imagem para cms-media`, async () => {
      const uid = `admin-role-${name}`;
      await seedProfiles([[uid, profile]]);
      await assertFails(
        uploadImage(uid, `cms-media/${uid}/admin-image.png`),
      );
    });
  }
});

describe("Semântica staff e ownership de Storage pós-B2A5", () => {
  test("moderator ativo lê submission privada de outro uid", async () => {
    await seedProfiles([
      ["moderator-active", profileData("moderator", true)],
    ]);
    await seedStorageObject(
      "submissions/events/submission-owner/event-1/image.png",
    );
    await assertSucceeds(
      storageFor("moderator-active")
        .ref("submissions/events/submission-owner/event-1/image.png")
        .getMetadata(),
    );
  });

  for (const { name, ativo } of [
    { name: "false", ativo: false },
    { name: "null", ativo: null },
    { name: "string", ativo: "true" },
    { name: "number", ativo: 1 },
    { name: "array", ativo: [] },
    { name: "map", ativo: {} },
    { name: "ausente", ativo: undefined },
  ]) {
    test(`moderator com ativo ${name} não lê submission privada de outro uid`, async () => {
      const uid = `moderator-active-${name}`;
      await seedProfiles([
        [
          uid,
          ativo === undefined
            ? { role: "moderator" }
            : profileData("moderator", ativo),
        ],
      ]);
      await seedStorageObject(
        "submissions/events/submission-owner/event-1/image.png",
      );
      await assertFails(
        storageFor(uid)
          .ref("submissions/events/submission-owner/event-1/image.png")
          .getMetadata(),
      );
    });
  }

  test("usuário comum não envia imagem para cms-media", async () => {
    await seedProfiles([["user-active", profileData("user", true)]]);
    await assertFails(
      uploadImage("user-active", "cms-media/user-active/user-image.png"),
    );
  });

  test("owner autenticado mantém upload legítimo em submissions", async () => {
    await assertSucceeds(
      uploadImage(
        "submission-owner",
        "submissions/establishments/submission-owner/submission-1/image.png",
      ),
    );
  });

  test("usuário comum não lê submission privada de outro uid", async () => {
    await seedProfiles([["user-active", profileData("user", true)]]);
    await seedStorageObject(
      "submissions/establishments/submission-owner/submission-1/image.png",
    );
    await assertFails(
      storageFor("user-active")
        .ref(
          "submissions/establishments/submission-owner/submission-1/image.png",
        )
        .getMetadata(),
    );
  });

  test("leitura pública existente de cms-media permanece permitida", async () => {
    await seedStorageObject("cms-media/admin-active/public-image.png");
    await assertSucceeds(
      storageFor()
        .ref("cms-media/admin-active/public-image.png")
        .getMetadata(),
    );
  });

  test("fallback nega leitura de path desconhecido", async () => {
    await seedProfiles([["admin-active", profileData("admin", true)]]);
    await seedStorageObject("private-unknown/file.png");
    await assertFails(
      storageFor("admin-active")
        .ref("private-unknown/file.png")
        .getMetadata(),
    );
  });

  test("fallback nega escrita em path desconhecido", async () => {
    await seedProfiles([["admin-active", profileData("admin", true)]]);
    await assertFails(
      uploadImage("admin-active", "private-unknown/file.png"),
    );
  });
});
