import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";

const [adminCmsSource, portalSource, establishmentsSource] = await Promise.all([
  readFile(new URL("../js/admin-content-cms.js", import.meta.url), "utf8"),
  readFile(new URL("../portal-usuario.html", import.meta.url), "utf8"),
  readFile(new URL("../js/admin/modules/empreendimentos.js", import.meta.url), "utf8"),
]);

function usageEntry(overrides = {}) {
  return {
    total: 0,
    eventCount: 0,
    newsCount: 0,
    routeCount: 0,
    eventTitles: [],
    newsTitles: [],
    routeTitles: [],
    ...overrides,
  };
}

function createAdminCmsHarness({ usageMap = {}, loadError = null } = {}) {
  const calls = {
    confirmations: 0,
    firestoreDeletes: 0,
    storageDeletes: 0,
    storageRefs: 0,
  };
  const alerts = [];
  const db = {
    collection(name) {
      assert.equal(name, "media_library");
      return {
        doc(id) {
          assert.equal(id, "media-1");
          return {
            async delete() {
              calls.firestoreDeletes += 1;
            },
          };
        },
      };
    },
  };
  const storage = {
    ref() {
      calls.storageRefs += 1;
      return {
        async delete() {
          calls.storageDeletes += 1;
        },
      };
    },
  };
  const document = {
    body: { appendChild() {}, removeChild() {} },
    createElement() {
      return { select() {} };
    },
    execCommand() {},
    getElementById() {
      return null;
    },
  };
  const window = {
    currentUser: { uid: "admin-active" },
    document,
    firebase: { storage: () => storage },
    firebaseDB: { db },
  };
  const context = vm.createContext({
    alert(message) {
      alerts.push(String(message));
    },
    confirm() {
      calls.confirmations += 1;
      return true;
    },
    console: { error() {}, log() {}, warn() {} },
    document,
    navigator: {},
    window,
  });

  vm.runInContext(adminCmsSource, context);
  const module = window.AdminContentCMS;
  module.media = [{
    id: "media-1",
    storagePath: "cms-media/admin-active/library/image.png",
    url: "https://example.test/image.png",
  }];
  module.mediaUsageMap = usageMap;
  module.loadMedia = async () => {
    if (loadError) throw loadError;
  };

  return { alerts, calls, module };
}

const referenceScenarios = [
  {
    name: "Rota",
    usageMap: {
      "id:media-1": usageEntry({
        total: 1,
        routeCount: 1,
        routeTitles: ["Rota sintética"],
      }),
    },
  },
  {
    name: "Evento",
    usageMap: {
      "id:media-1": usageEntry({
        total: 1,
        eventCount: 1,
        eventTitles: ["Evento sintético"],
      }),
    },
  },
  {
    name: "Notícia",
    usageMap: {
      "id:media-1": usageEntry({
        total: 1,
        newsCount: 1,
        newsTitles: ["Notícia sintética"],
      }),
    },
  },
  {
    name: "Banner desconhecido pelo mapa parcial",
    usageMap: {
      "id:media-1": { bannerTitles: ["Banner sintético"] },
    },
  },
  {
    name: "Empreendimento desconhecido pelo mapa parcial",
    usageMap: {
      "id:media-1": { establishmentTitles: ["Empreendimento sintético"] },
    },
  },
  {
    name: "mídia aparentemente sem referência",
    usageMap: {},
  },
];

for (const scenario of referenceScenarios) {
  test(`${scenario.name}: remoção da biblioteca executa zero Storage.delete`, async () => {
    const { calls, module } = createAdminCmsHarness({
      usageMap: scenario.usageMap,
    });

    await module.deleteMedia("media-1");

    assert.equal(calls.storageRefs, 0);
    assert.equal(calls.storageDeletes, 0);
  });
}

test("unlink da biblioteca remove somente o documento Firestore", async () => {
  const { alerts, calls, module } = createAdminCmsHarness();

  await module.deleteMedia("media-1");

  assert.equal(calls.firestoreDeletes, 1);
  assert.equal(calls.storageDeletes, 0);
  assert.ok(alerts.some((message) => message.includes("arquivo físico foi preservado")));
});

test("falha ao recarregar referências continua com zero Storage.delete", async () => {
  const { calls, module } = createAdminCmsHarness({
    loadError: new Error("synthetic-reference-load-failure"),
  });

  await module.deleteMedia("media-1");

  assert.equal(calls.firestoreDeletes, 1);
  assert.equal(calls.storageRefs, 0);
  assert.equal(calls.storageDeletes, 0);
});

test("Portal preserva upload parcial e resultado ambíguo sem cleanup destrutivo", () => {
  assert.doesNotMatch(portalSource, /deleteUploadedFiles/);
  assert.doesNotMatch(portalSource, /\.delete\s*\(/);
  assert.doesNotMatch(portalSource, /deleteObject\s*\(/);
  assert.match(portalSource, /preservedUploadCount:\s*uploaded\.length/);
  assert.match(portalSource, /physicalCleanup:\s*'denied'/);
  assert.match(portalSource, /portalPreservedUploads\s*=\s*uploaded\.slice\(\)/);
  assert.match(portalSource, /nenhum rollback no Storage foi executado/);
});

test("Portal registra o objeto assim que o put conclui, mesmo se a URL falhar", async () => {
  const functionStart = portalSource.indexOf("async function uploadSubmissionImages");
  const functionEnd = portalSource.indexOf("function getPreservedUploadsNotice", functionStart);
  assert.ok(functionStart >= 0 && functionEnd > functionStart);
  const functionSource = portalSource.slice(functionStart, functionEnd);
  const preservedError = new Error("synthetic-download-url-failure");
  const context = vm.createContext({
    Array,
    Date,
    console: { error() {} },
    currentUser: { uid: "portal-owner" },
    getPortalStorage() {
      return {
        ref() {
          return {
            async put() {
              return {
                ref: {
                  async getDownloadURL() {
                    throw preservedError;
                  },
                },
              };
            },
          };
        },
      };
    },
    getUploadConfig() {
      return { pathRoot: "events" };
    },
    normalizeUploadContentType() {
      return "image/png";
    },
    portalUploads: {
      event: [{ file: { name: "image.png", size: 128, type: "image/png" } }],
    },
    PORTAL_ALLOWED_IMAGE_TYPES: { "image/png": "png" },
    sanitizeStorageFileName(value) {
      return `${value}.png`;
    },
    sanitizeStorageSegment(value) {
      return value;
    },
  });
  vm.runInContext(functionSource, context);

  await assert.rejects(
    context.uploadSubmissionImages("event", "submission-1", { uid: "portal-owner" }),
    (error) => {
      assert.equal(error, preservedError);
      assert.equal(error.portalPreservedUploads.length, 1);
      assert.equal(
        error.portalPreservedUploads[0].path,
        "submissions/events/portal-owner/submission-1/image-01.png",
      );
      assert.equal(error.portalPreservedUploads[0].url, "");
      return true;
    },
  );
});

test("source do Admin e Empreendimentos não reintroduz sink físico", () => {
  assert.doesNotMatch(
    adminCmsSource,
    /this\.storage\.ref\([^)]*\)\.delete\s*\(/,
  );
  assert.match(
    adminCmsSource,
    /collection\("media_library"\)\.doc\(mediaId\)\.delete\s*\(/,
  );
  assert.doesNotMatch(establishmentsSource, /deleteUploadedFiles/);
  assert.doesNotMatch(
    establishmentsSource,
    /storage\.ref\([^)]*\)\.delete\s*\(/,
  );
});
