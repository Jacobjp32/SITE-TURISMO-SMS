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
const OVERSIZED_IMAGE_CONTENT = "x".repeat(5 * 1024 * 1024 + 1);

const SUBMISSION_PATHS = [
  {
    name: "estabelecimentos",
    path: "submissions/establishments/submission-owner/retention-establishment/image.png",
  },
  {
    name: "eventos",
    path: "submissions/events/submission-owner/retention-event/image.png",
  },
  {
    name: "atualizações de empreendimento",
    path: "submissions/establishment-updates/submission-owner/retention-update/image.png",
  },
];

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

async function seedApprovedDocument(collection, id) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc(`${collection}/${id}`).set({ status: "aprovado" });
  });
}

async function seedDocumentsForStorage(entries) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await Promise.all(entries.map(([path, data]) => context.firestore().doc(path).set(data)));
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

function uploadImage(
  uid,
  path,
  content = IMAGE_CONTENT,
  metadata = IMAGE_METADATA,
) {
  return storageFor(uid)
    .ref(path)
    .putString(content, "raw", metadata);
}

function deleteImage(uid, path) {
  return storageFor(uid).ref(path).delete();
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

describe("Retenção create-only de originals em submissions", () => {
  for (const submission of SUBMISSION_PATHS) {
    test(`owner cria e lê original válido de ${submission.name}`, async () => {
      await assertSucceeds(uploadImage("submission-owner", submission.path));
      await assertSucceeds(
        storageFor("submission-owner").ref(submission.path).getMetadata(),
      );
    });

    test(`owner não atualiza original existente de ${submission.name}`, async () => {
      await seedStorageObject(submission.path);
      await assertFails(
        uploadImage(
          "submission-owner",
          submission.path,
          "replacement-image-content",
        ),
      );
    });

    test(`owner não exclui original existente de ${submission.name}`, async () => {
      await seedStorageObject(submission.path);
      await assertFails(deleteImage("submission-owner", submission.path));
    });

    for (const role of ["admin", "moderator"]) {
      const uid = `${role}-active`;

      test(`${role} ativo lê, mas não atualiza nem exclui original de ${submission.name}`, async () => {
        await seedProfiles([[uid, profileData(role, true)]]);
        await seedStorageObject(submission.path);

        await assertSucceeds(
          storageFor(uid).ref(submission.path).getMetadata(),
        );
        await assertFails(
          uploadImage(uid, submission.path, "staff-replacement-content"),
        );
        await assertFails(deleteImage(uid, submission.path));
      });
    }

    test(`outro usuário não cria, atualiza nem exclui original de ${submission.name}`, async () => {
      await assertFails(uploadImage("other-user", submission.path));
      await seedStorageObject(submission.path);
      await assertFails(
        uploadImage("other-user", submission.path, "other-user-replacement"),
      );
      await assertFails(deleteImage("other-user", submission.path));
    });

    test(`anônimo não cria, atualiza nem exclui original de ${submission.name}`, async () => {
      await assertFails(uploadImage(null, submission.path));
      await seedStorageObject(submission.path);
      await assertFails(
        uploadImage(null, submission.path, "anonymous-replacement"),
      );
      await assertFails(deleteImage(null, submission.path));
    });
  }

  test("owner não cria submission com tipo inválido", async () => {
    await assertFails(
      uploadImage(
        "submission-owner",
        SUBMISSION_PATHS[0].path,
        IMAGE_CONTENT,
        { contentType: "application/pdf" },
      ),
    );
  });

  test("owner não cria submission acima de 5 MB", async () => {
    await assertFails(
      uploadImage(
        "submission-owner",
        SUBMISSION_PATHS[0].path,
        OVERSIZED_IMAGE_CONTENT,
      ),
    );
  });
});

describe("Retenção create-only de cms-media", () => {
  const ownPath = "cms-media/admin-active/library/image.png";
  const otherAdminPath = "cms-media/other-admin/library/image.png";

  test("admin ativo cria imagem válida no próprio UID", async () => {
    await seedProfiles([["admin-active", profileData("admin", true)]]);
    await assertSucceeds(uploadImage("admin-active", ownPath));
  });

  test("admin ativo não cria imagem sob UID de outro admin", async () => {
    await seedProfiles([["admin-active", profileData("admin", true)]]);
    await assertFails(uploadImage("admin-active", otherAdminPath));
  });

  test("admin ativo não atualiza objeto próprio existente", async () => {
    await seedProfiles([["admin-active", profileData("admin", true)]]);
    await seedStorageObject(ownPath);
    await assertFails(
      uploadImage("admin-active", ownPath, "replacement-image-content"),
    );
  });

  test("admin ativo não exclui objeto próprio nem de outro UID", async () => {
    await seedProfiles([["admin-active", profileData("admin", true)]]);
    await Promise.all([
      seedStorageObject(ownPath),
      seedStorageObject(otherAdminPath),
    ]);

    await assertFails(deleteImage("admin-active", ownPath));
    await assertFails(deleteImage("admin-active", otherAdminPath));
  });

  for (const actor of [
    { uid: "moderator-active", profile: profileData("moderator", true) },
    { uid: "user-active", profile: profileData("user", true) },
    { uid: null, profile: null },
  ]) {
    const label = actor.uid || "anônimo";

    test(`${label} não cria nem exclui objeto em cms-media`, async () => {
      if (actor.profile) {
        await seedProfiles([[actor.uid, actor.profile]]);
      }
      await assertFails(
        uploadImage(actor.uid, `cms-media/${actor.uid || "anonymous"}/image.png`),
      );
      await seedStorageObject(ownPath);
      await assertFails(deleteImage(actor.uid, ownPath));
    });
  }

  test("admin ativo não cria cms-media com tipo inválido", async () => {
    await seedProfiles([["admin-active", profileData("admin", true)]]);
    await assertFails(
      uploadImage(
        "admin-active",
        ownPath,
        IMAGE_CONTENT,
        { contentType: "application/pdf" },
      ),
    );
  });

  test("admin ativo não cria cms-media acima de 5 MB", async () => {
    await seedProfiles([["admin-active", profileData("admin", true)]]);
    await assertFails(
      uploadImage("admin-active", ownPath, OVERSIZED_IMAGE_CONTENT),
    );
  });

  test("leitura pública de cms-media permanece permitida", async () => {
    await seedStorageObject(ownPath);
    await assertSucceeds(storageFor().ref(ownPath).getMetadata());
  });
});

describe("Mídia aprovada em namespace público neutro", () => {
  const eventPath = "approved-media/events/evt-public/image.png";
  const legacyEstablishmentPath = "approved-media/establishments/est-public/image.png";
  const cmsEstablishmentPath = "approved-media/cms-establishments/est-public/image.png";

  test("admin ativo cria mídia aprovada de evento e empreendimento", async () => {
    const uid = "admin-approved-media";
    await seedProfiles([[uid, profileData("admin", true)]]);
    await assertSucceeds(uploadImage(uid, "approved-media/events/evt-admin/image.png"));
    await assertSucceeds(uploadImage(uid, "approved-media/cms-establishments/est-admin/image.png"));
    await assertFails(uploadImage(uid, "approved-media/establishments/est-admin/image.png"));
  });

  test("moderator ativo preserva eventos, mas não pré-semeia mídia de empreendimento", async () => {
    const uid = "moderator-approved-media";
    await seedProfiles([[uid, profileData("moderator", true)]]);
    await assertSucceeds(uploadImage(uid, "approved-media/events/evt-moderator/image.png"));
    await assertFails(uploadImage(uid, "approved-media/cms-establishments/est-moderator/image.png"));
    await assertFails(uploadImage(uid, "approved-media/establishments/est-moderator/image.png"));
  });

  test("usuário comum e anônimo não criam mídia aprovada", async () => {
    await seedProfiles([["user-approved-media", profileData("user", true)]]);
    await assertFails(uploadImage("user-approved-media", eventPath));
    await assertFails(uploadImage(null, eventPath));
  });

  test("objeto órfão não é legível anonimamente antes do documento público", async () => {
    await seedStorageObject(eventPath);
    await assertFails(storageFor().ref(eventPath).getMetadata());
  });

  test("mídia de evento é pública somente após existir evento aprovado", async () => {
    await seedStorageObject(eventPath);
    await seedApprovedDocument("eventos_aprovados", "evt-public");
    await assertSucceeds(storageFor().ref(eventPath).getMetadata());
  });

  test("compatibilidade legada mantém mídia pública após aprovação histórica", async () => {
    await seedStorageObject(legacyEstablishmentPath);
    await seedApprovedDocument("estabelecimentos_aprovados", "est-public");
    await assertSucceeds(storageFor().ref(legacyEstablishmentPath).getMetadata());
  });

  test("draft CMS mantém mídia privada e publish explícito a torna pública", async () => {
    await seedStorageObject(cmsEstablishmentPath);
    await seedDocumentsForStorage([
      ["cms_establishments/est-public", { status: "draft" }],
    ]);
    await assertFails(storageFor().ref(cmsEstablishmentPath).getMetadata());
    await seedDocumentsForStorage([
      ["cms_establishments/est-public", {
        status: "published",
        media: { publicPaths: [cmsEstablishmentPath] },
      }],
    ]);
    await assertSucceeds(storageFor().ref(cmsEstablishmentPath).getMetadata());
  });

  test("publish não libera objeto órfão fora da projeção de paths", async () => {
    const orphanPath = "approved-media/cms-establishments/est-public/orphan.png";
    await Promise.all([seedStorageObject(cmsEstablishmentPath), seedStorageObject(orphanPath)]);
    await seedDocumentsForStorage([["cms_establishments/est-public", {
      status: "published",
      media: { publicPaths: [cmsEstablishmentPath] },
    }]]);
    await assertSucceeds(storageFor().ref(cmsEstablishmentPath).getMetadata());
    await assertFails(storageFor().ref(orphanPath).getMetadata());
  });

  test("PUBLIC_PATH_OTHER_ESTABLISHMENT_DENY", async () => {
    const otherPath = "approved-media/cms-establishments/other-establishment/image.png";
    await seedStorageObject(otherPath);
    await seedDocumentsForStorage([["cms_establishments/est-public", {
      status: "published",
      media: { publicPaths: [otherPath] },
    }]]);
    await assertFails(storageFor().ref(otherPath).getMetadata());
  });

  test("PUBLIC_PATH_SUBMISSIONS_DENY", async () => {
    const privateSubmissionPath = "submissions/establishments/private-owner/private-submission/image.png";
    await seedStorageObject(privateSubmissionPath);
    await assertFails(storageFor().ref(privateSubmissionPath).getMetadata());
  });

  test("documento legado não libera mídia do namespace CMS", async () => {
    await seedStorageObject(cmsEstablishmentPath);
    await seedApprovedDocument("estabelecimentos_aprovados", "est-public");
    await seedDocumentsForStorage([["cms_establishments/est-public", { status: "draft" }]]);
    await assertFails(storageFor().ref(cmsEstablishmentPath).getMetadata());
  });

  test("empreendimento archived não libera mídia anonimamente", async () => {
    await seedStorageObject(cmsEstablishmentPath);
    await seedDocumentsForStorage([
      ["cms_establishments/est-public", { status: "archived" }],
    ]);
    await assertFails(storageFor().ref(cmsEstablishmentPath).getMetadata());
  });

  test("mídia aprovada permanece create-only", async () => {
    await seedProfiles([["moderator-approved-media", profileData("moderator", true)]]);
    await seedStorageObject(eventPath);
    await assertFails(uploadImage("moderator-approved-media", eventPath, "replacement"));
    await assertFails(deleteImage("moderator-approved-media", eventPath));
  });

  test("mídia aprovada rejeita tipo inválido e tamanho excessivo", async () => {
    await seedProfiles([["moderator-approved-media", profileData("moderator", true)]]);
    await assertFails(uploadImage(
      "moderator-approved-media",
      eventPath,
      IMAGE_CONTENT,
      { contentType: "application/pdf" },
    ));
    await assertFails(uploadImage(
      "moderator-approved-media",
      eventPath,
      OVERSIZED_IMAGE_CONTENT,
    ));
  });
});
