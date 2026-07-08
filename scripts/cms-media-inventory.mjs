import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const remote = args.has("--remote");
const help = args.has("--help") || args.has("-h");
const token = process.env.FIREBASE_AUTH_TOKEN || process.env.GOOGLE_OAUTH_ACCESS_TOKEN || "";

const contract = {
  mode: remote ? "remote-read-only" : "local-contract-only",
  dryRun: true,
  mutatesFirestore: false,
  mutatesStorage: false,
  writesFiles: false,
  credentials: {
    requiredForRemote: true,
    env: ["FIREBASE_AUTH_TOKEN", "GOOGLE_OAUTH_ACCESS_TOKEN"],
    note: "Use variavel de ambiente. O token nao e salvo nem impresso."
  },
  firestoreCollections: {
    catalog: "cms_establishments",
    requests: "establishment_update_requests"
  },
  storagePrefixes: {
    catalogMedia: "cms-media/",
    submissionEvidence: "submissions/establishment-updates/"
  },
  officialReferences: [
    "cms_establishments.media.mainImage.path",
    "cms_establishments.media.gallery[].path",
    "establishment_update_requests.images[].path",
    "establishment_update_requests.appliedMedia[].path",
    "establishment_update_requests.appliedMedia[].sourceImagePath"
  ],
  logicalRemovalFields: [
    "cms_establishments.media.gallery[].status == removed",
    "cms_establishments.media.gallery[].removedAt",
    "cms_establishments.media.gallery[].removedBy"
  ],
  categories: {
    A: "Referenciadas no catalogo ativo",
    B: "Removidas logicamente",
    C: "Aplicadas a partir de solicitacoes",
    D: "Originais de submissions preservados como evidencia",
    E: "Possiveis orfas em cms-media sem referencia no catalogo nem em appliedMedia",
    F: "Possiveis referencias quebradas apontando para path inexistente no Storage"
  }
};

if (help) {
  console.log([
    "Uso:",
    "  node scripts/cms-media-inventory.mjs",
    "  node scripts/cms-media-inventory.mjs --remote",
    "",
    "Padrao: dry-run local, sem Firebase real.",
    "Remoto: somente leitura; exige FIREBASE_AUTH_TOKEN ou GOOGLE_OAUTH_ACCESS_TOKEN.",
    "O script nao apaga, nao grava Firestore, nao altera Storage e nao escreve arquivos."
  ].join("\n"));
  process.exit(0);
}

function cleanPath(value) {
  let text = String(value || "").trim();
  if (!text) return "";
  if (/^gs:\/\//i.test(text)) {
    text = text.replace(/^gs:\/\/[^/]+\//i, "");
  }
  if (/^https?:\/\//i.test(text)) {
    try {
      const parsed = new URL(text);
      const marker = "/o/";
      const index = parsed.pathname.indexOf(marker);
      if (index !== -1) text = parsed.pathname.slice(index + marker.length);
      else return "";
    } catch (_) {
      return "";
    }
  }
  text = text.split(/[?#]/)[0];
  try {
    text = decodeURIComponent(text);
  } catch (_) {
    // Keep malformed paths untouched.
  }
  return text.replace(/^\/+/, "");
}

function isRemovedImage(image) {
  return image && (image.status === "removed" || !!image.removedAt);
}

function pushRef(target, pathValue, data) {
  const storagePath = cleanPath(pathValue);
  if (!storagePath) return;
  target.push({ path: storagePath, ...data });
}

function addToSet(set, pathValue) {
  const storagePath = cleanPath(pathValue);
  if (storagePath) set.add(storagePath);
}

function uniqueByPath(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = [item.group || "", item.path || "", item.docId || "", item.field || ""].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectFirestoreReferences(establishments, requests) {
  const activeCatalog = [];
  const logicallyRemoved = [];
  const appliedFromRequests = [];
  const submissionOriginals = [];
  const firestorePaths = [];
  const catalogMediaPaths = new Set();
  const appliedMediaPaths = new Set();

  for (const doc of establishments) {
    const data = doc.data || {};
    const media = data.media || {};
    const mainImage = media.mainImage || {};
    const gallery = Array.isArray(media.gallery) ? media.gallery : [];

    if (mainImage.path) {
      const target = isRemovedImage(mainImage) ? logicallyRemoved : activeCatalog;
      pushRef(target, mainImage.path, {
        group: isRemovedImage(mainImage) ? "B" : "A",
        collection: "cms_establishments",
        docId: doc.id,
        field: "media.mainImage.path",
        status: mainImage.status || "active",
        source: mainImage.source || ""
      });
      addToSet(catalogMediaPaths, mainImage.path);
      addToSet(firestorePaths, mainImage.path);
    }

    gallery.forEach((image, index) => {
      const removed = isRemovedImage(image);
      pushRef(removed ? logicallyRemoved : activeCatalog, image && image.path, {
        group: removed ? "B" : "A",
        collection: "cms_establishments",
        docId: doc.id,
        field: `media.gallery[${index}].path`,
        status: image && image.status ? image.status : "active",
        removedAt: image && image.removedAt ? image.removedAt : "",
        source: image && image.source ? image.source : ""
      });
      addToSet(catalogMediaPaths, image && image.path);
      addToSet(firestorePaths, image && image.path);
    });
  }

  for (const doc of requests) {
    const data = doc.data || {};
    const images = Array.isArray(data.images) ? data.images : [];
    const appliedMedia = Array.isArray(data.appliedMedia) ? data.appliedMedia : [];

    images.forEach((image, index) => {
      pushRef(submissionOriginals, image && image.path, {
        group: "D",
        collection: "establishment_update_requests",
        docId: doc.id,
        field: `images[${index}].path`,
        evidence: true
      });
      addToSet(firestorePaths, image && image.path);
    });

    appliedMedia.forEach((image, index) => {
      pushRef(appliedFromRequests, image && image.path, {
        group: "C",
        collection: "establishment_update_requests",
        docId: doc.id,
        field: `appliedMedia[${index}].path`,
        destination: image && image.destination ? image.destination : "",
        establishmentId: image && image.establishmentId ? image.establishmentId : ""
      });
      addToSet(appliedMediaPaths, image && image.path);
      addToSet(firestorePaths, image && image.path);

      pushRef(submissionOriginals, image && image.sourceImagePath, {
        group: "D",
        collection: "establishment_update_requests",
        docId: doc.id,
        field: `appliedMedia[${index}].sourceImagePath`,
        evidence: true
      });
      addToSet(firestorePaths, image && image.sourceImagePath);
    });
  }

  return {
    activeCatalog: uniqueByPath(activeCatalog),
    logicallyRemoved: uniqueByPath(logicallyRemoved),
    appliedFromRequests: uniqueByPath(appliedFromRequests),
    submissionOriginals: uniqueByPath(submissionOriginals),
    firestorePathSet: firestorePaths,
    catalogMediaPaths,
    appliedMediaPaths
  };
}

function classifyStorageObjects(objects, references) {
  const storagePaths = new Set(objects.map((item) => item.name));
  const referencedCms = new Set([...references.catalogMediaPaths, ...references.appliedMediaPaths]);
  const possibleOrphanCmsMedia = objects
    .filter((item) => item.name.startsWith(contract.storagePrefixes.catalogMedia))
    .filter((item) => !referencedCms.has(item.name))
    .map((item) => ({
      group: "E",
      path: item.name,
      size: item.size || "",
      updated: item.updated || "",
      contentType: item.contentType || ""
    }));

  const possibleBrokenReferences = [...references.firestorePathSet]
    .filter((item) => item && !storagePaths.has(item))
    .map((item) => ({ group: "F", path: item }));

  return {
    possibleOrphanCmsMedia,
    possibleBrokenReferences
  };
}

function parseFirestoreValue(value) {
  if (!value || typeof value !== "object") return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(parseFirestoreValue);
  if ("mapValue" in value) return parseFirestoreFields(value.mapValue.fields || {});
  return null;
}

function parseFirestoreFields(fields) {
  return Object.fromEntries(Object.entries(fields || {}).map(([key, value]) => [key, parseFirestoreValue(value)]));
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha HTTP ${response.status} em ${url}: ${text.slice(0, 300)}`);
  }
  return response.json();
}

async function listFirestoreCollection(projectId, collection) {
  const docs = [];
  let pageToken = "";
  do {
    const url = new URL(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const data = await fetchJson(url);
    for (const doc of data.documents || []) {
      docs.push({
        id: String(doc.name || "").split("/").pop(),
        data: parseFirestoreFields(doc.fields || {})
      });
    }
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return docs;
}

async function listStorageObjects(bucket, prefix) {
  const objects = [];
  let pageToken = "";
  do {
    const url = new URL(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o`);
    url.searchParams.set("prefix", prefix);
    url.searchParams.set("fields", "items(name,size,contentType,updated,timeCreated),nextPageToken");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const data = await fetchJson(url);
    objects.push(...(data.items || []));
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return objects;
}

async function readFirebaseConfig() {
  const file = path.join(root, "config.js");
  const text = await fs.readFile(file, "utf8");
  const projectId = (text.match(/projectId:\s*['"]([^'"]+)['"]/i) || [])[1] || "turismo-sms";
  const storageBucket = (text.match(/storageBucket:\s*['"]([^'"]+)['"]/i) || [])[1] || "turismo-sms.firebasestorage.app";
  return { projectId, storageBucket };
}

async function buildLocalReport() {
  return {
    contract,
    remoteInventory: {
      executed: false,
      reason: "Sem --remote. Inventario real de Firestore/Storage ficou pendente.",
      safeNextCommand: "$env:FIREBASE_AUTH_TOKEN='<token>'; node scripts/cms-media-inventory.mjs --remote"
    }
  };
}

async function buildRemoteReport() {
  if (!token) {
    const error = new Error("Modo --remote exige FIREBASE_AUTH_TOKEN ou GOOGLE_OAUTH_ACCESS_TOKEN.");
    error.code = "missing-token";
    throw error;
  }

  const { projectId, storageBucket } = await readFirebaseConfig();
  const [establishments, requests, cmsMediaObjects, submissionObjects] = await Promise.all([
    listFirestoreCollection(projectId, contract.firestoreCollections.catalog),
    listFirestoreCollection(projectId, contract.firestoreCollections.requests),
    listStorageObjects(storageBucket, contract.storagePrefixes.catalogMedia),
    listStorageObjects(storageBucket, contract.storagePrefixes.submissionEvidence)
  ]);
  const references = collectFirestoreReferences(establishments, requests);
  const storageObjects = cmsMediaObjects.concat(submissionObjects);
  const storageClassifications = classifyStorageObjects(storageObjects, references);

  return {
    contract,
    firebase: {
      projectId,
      storageBucket
    },
    remoteInventory: {
      executed: true,
      readOnly: true,
      collections: {
        cms_establishments: establishments.length,
        establishment_update_requests: requests.length
      },
      storageObjects: {
        cmsMedia: cmsMediaObjects.length,
        submissionEvidence: submissionObjects.length
      },
      groups: {
        A_activeCatalog: references.activeCatalog,
        B_logicallyRemoved: references.logicallyRemoved,
        C_appliedFromRequests: references.appliedFromRequests,
        D_submissionOriginals: references.submissionOriginals,
        E_possibleOrphanCmsMedia: storageClassifications.possibleOrphanCmsMedia,
        F_possibleBrokenReferences: storageClassifications.possibleBrokenReferences
      },
      notes: [
        "Submissions sao evidencia de solicitacao e nao devem ser tratadas como orfas automaticamente.",
        "Possiveis orfas em cms-media exigem revisao manual e checagem de outras colecoes antes de qualquer delete.",
        "Este script nao executa delete, update, set, move, copy ou escrita local."
      ]
    }
  };
}

try {
  const report = remote ? await buildRemoteReport() : await buildLocalReport();
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  const safeError = {
    ok: false,
    dryRun: true,
    code: error.code || "inventory-error",
    message: error.message || "Falha ao montar inventario."
  };
  console.error(JSON.stringify(safeError, null, 2));
  process.exitCode = error.code === "missing-token" ? 2 : 1;
}
