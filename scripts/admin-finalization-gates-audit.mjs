import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";

const PROJECT_ID = "turismo-sms";
const DATABASE_ID = "(default)";
const PUBLIC_ORIGIN = "https://turismo.saomateusdosul.pr.gov.br";
const SCHEMA_VERSION = 1;
const ENUM_FIELDS = [
  "status", "publicado", "role", "ativo", "type", "schemaVersion",
  "createdAt", "updatedAt", "createdBy", "updatedBy",
];
const MEDIA_FIELDS = [
  "url", "storagePath", "path", "title", "alt", "type", "mimeType",
  "createdAt", "updatedAt", "createdBy", "updatedBy",
];
const RELEVANT_COLLECTIONS = [
  "usuarios",
  "eventos_pendentes",
  "estabelecimentos_pendentes",
  "eventos_aprovados",
  "estabelecimentos_aprovados",
  "establishment_claims",
  "establishment_managers",
  "establishment_update_requests",
  "cms_establishments",
  "rotas",
  "noticias",
  "media_library",
  "banners",
  "gallery_items",
  "site_config",
  "audit_logs",
];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "docs", "admin-finalization");
const galleryHtmlPath = path.join(root, "galeria.html");
const readDocumentNames = new Set();
let firestoreDocumentReadOperations = 0;
let firestoreDocumentResponsesRead = 0;

function attrs(node) {
  return Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
}

function children(node) {
  return node.childNodes || [];
}

function walk(node, visit) {
  visit(node);
  for (const child of children(node)) walk(child, visit);
}

function findAll(node, predicate) {
  const found = [];
  walk(node, (candidate) => {
    if (predicate(candidate)) found.push(candidate);
  });
  return found;
}

function findFirst(node, predicate) {
  let found = null;
  walk(node, (candidate) => {
    if (!found && predicate(candidate)) found = candidate;
  });
  return found;
}

function hasClass(node, className) {
  return String(attrs(node).class || "").split(/\s+/).includes(className);
}

function textContent(node) {
  if (!node) return "";
  if (node.nodeName === "#text") return node.value || "";
  return children(node).map(textContent).join("").replace(/\s+/g, " ").trim();
}

function normalizeSource(value) {
  return String(value || "").trim().replace(/\\/g, "/").replace(/^\.\//, "");
}

function publicUrl(source) {
  const normalized = normalizeSource(source);
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return new URL(normalized.replace(/^\/+/, ""), `${PUBLIC_ORIGIN}/`).href;
}

function canonicalUrl(value) {
  try {
    const url = new URL(String(value || ""), `${PUBLIC_ORIGIN}/`);
    url.hash = "";
    return url.href;
  } catch {
    return "";
  }
}

function slug(value) {
  return String(value || "item")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "item";
}

function fingerprint(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableItemId(item) {
  const identity = [item.category, item.mediaType, canonicalUrl(item.publicUrl)].join("\n");
  const basename = path.posix.basename(new URL(item.publicUrl).pathname).replace(/\.[^.]+$/, "");
  return `${slug(basename)}-${fingerprint(identity).slice(0, 12)}`;
}

async function localSourceState(source) {
  if (/^https?:\/\//i.test(source)) return "REMOTE_NOT_FETCHED";
  try {
    await access(path.join(root, normalizeSource(source)));
    return "PRESENT";
  } catch {
    return "MISSING";
  }
}

function cardText(card, tagName, className) {
  const node = findFirst(card, (candidate) => candidate.tagName === tagName && (!className || hasClass(candidate, className)));
  return textContent(node);
}

async function extractGalleryInventory() {
  const html = await readFile(galleryHtmlPath, "utf8");
  const document = parse(html);
  const categoryIds = ["patrimonio", "natureza", "gastronomia-g", "eventos-g", "arte", "mascotes", "videos"];
  const categoryNames = {
    patrimonio: "patrimonio",
    natureza: "natureza",
    "gastronomia-g": "gastronomia",
    "eventos-g": "eventos",
    arte: "arte-historia",
    mascotes: "mascotes",
    videos: "videos",
  };
  const items = [];

  for (const sectionId of categoryIds) {
    const section = findFirst(document, (node) => node.tagName === "section" && attrs(node).id === sectionId);
    if (!section) continue;
    const category = categoryNames[sectionId];

    if (sectionId !== "videos") {
      const cards = findAll(section, (node) => node.tagName === "div" && hasClass(node, "card"));
      for (const card of cards) {
        const setData = findFirst(card, (node) => node.tagName === "div" && hasClass(node, "gallery-set-data"));
        if (setData) {
          const entries = findAll(setData, (node) => node.tagName === "span" && attrs(node)["data-src"]);
          for (const entry of entries) {
            const data = attrs(entry);
            items.push({
              sourcePath: normalizeSource(data["data-src"]),
              publicUrl: publicUrl(data["data-src"]),
              mediaType: "image",
              category,
              caption: data["data-title"] || "",
              description: data["data-desc"] || "",
              alt: data["data-title"] || "",
            });
          }
          continue;
        }

        const image = findFirst(card, (node) => node.tagName === "img" && attrs(node).src);
        if (!image) continue;
        const imageAttrs = attrs(image);
        items.push({
          sourcePath: normalizeSource(imageAttrs.src),
          publicUrl: publicUrl(imageAttrs.src),
          mediaType: "image",
          category,
          caption: cardText(card, "h3"),
          description: cardText(card, "p"),
          alt: imageAttrs.alt || "",
        });
      }
      continue;
    }

    const videoCards = findAll(section, (node) => node.tagName === "div" && hasClass(node, "vcard"));
    for (const card of videoCards) {
      const sourceNode = findFirst(card, (node) => node.tagName === "source" && attrs(node).src);
      const iframeNode = findFirst(card, (node) => node.tagName === "iframe" && attrs(node).src);
      const mediaNode = sourceNode || iframeNode;
      if (!mediaNode) continue;
      const source = attrs(mediaNode).src;
      items.push({
        sourcePath: normalizeSource(source),
        publicUrl: publicUrl(source),
        mediaType: "video",
        category,
        caption: cardText(card, "h3", "vtitle"),
        description: cardText(card, "p", "vdesc"),
        alt: attrs(iframeNode || {}).title || "",
      });
    }
  }

  for (let index = 0; index < items.length; index += 1) {
    items[index].currentOrder = index + 1;
    items[index].itemId = stableItemId(items[index]);
    items[index].sourceState = await localSourceState(items[index].sourcePath);
  }
  return items;
}

function firestoreValueType(value) {
  if (!value || typeof value !== "object") return "unknown";
  if ("nullValue" in value) return "null";
  if ("booleanValue" in value) return "boolean";
  if ("integerValue" in value) return "integer";
  if ("doubleValue" in value) return "double";
  if ("timestampValue" in value) return "timestamp";
  if ("stringValue" in value) return "string";
  if ("bytesValue" in value) return "bytes";
  if ("referenceValue" in value) return "reference";
  if ("geoPointValue" in value) return "geopoint";
  if ("arrayValue" in value) {
    const types = [...new Set((value.arrayValue.values || []).map(firestoreValueType))].sort();
    return `array<${types.join("|") || "empty"}>`;
  }
  if ("mapValue" in value) return "map";
  return "unknown";
}

function firestorePrimitive(value) {
  if (!value || typeof value !== "object") return undefined;
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("stringValue" in value) return value.stringValue;
  return undefined;
}

function fieldShape(fields = {}) {
  return Object.fromEntries(Object.entries(fields).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => {
    const type = firestoreValueType(value);
    if (type === "map") return [key, { type, fields: fieldShape(value.mapValue.fields || {}) }];
    return [key, type];
  }));
}

function fieldObject(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, firestorePrimitive(value)]));
}

function basenameFromUrl(value) {
  try {
    return decodeURIComponent(path.posix.basename(new URL(value, `${PUBLIC_ORIGIN}/`).pathname)).toLowerCase();
  } catch {
    return "";
  }
}

function mediaRecord(document) {
  const fields = fieldObject(document.fields || {});
  return {
    mediaId: String(document.name || "").split("/").pop(),
    url: typeof fields.url === "string" ? fields.url : "",
    storagePath: typeof fields.storagePath === "string" ? fields.storagePath : (typeof fields.path === "string" ? fields.path : ""),
    filename: basenameFromUrl(fields.storagePath || fields.path || fields.url || ""),
  };
}

function matchGalleryItem(item, mediaRecords) {
  if (item.sourceState === "MISSING") return { status: "INVALID", reason: "LOCAL_SOURCE_MISSING" };
  const sourcePath = normalizeSource(item.sourcePath).toLowerCase();
  const exactPath = mediaRecords.filter((media) => normalizeSource(media.storagePath).toLowerCase() === sourcePath && sourcePath);
  if (exactPath.length === 1) return { status: "EXACT_MEDIA_MATCH", basis: "storagePath", media: exactPath[0] };
  if (exactPath.length > 1) return { status: "AMBIGUOUS", basis: "storagePath", candidates: exactPath.map((media) => media.mediaId) };

  const canonical = canonicalUrl(item.publicUrl);
  const exactUrl = mediaRecords.filter((media) => canonicalUrl(media.url) === canonical && canonical);
  if (exactUrl.length === 1) return { status: "EXACT_MEDIA_MATCH", basis: "canonicalUrl", media: exactUrl[0] };
  if (exactUrl.length > 1) return { status: "AMBIGUOUS", basis: "canonicalUrl", candidates: exactUrl.map((media) => media.mediaId) };

  const filename = basenameFromUrl(item.publicUrl);
  const exactFilename = mediaRecords.filter((media) => media.filename === filename && filename);
  if (exactFilename.length === 1) return { status: "EXACT_MEDIA_MATCH", basis: "uniqueFilename", media: exactFilename[0] };
  if (exactFilename.length > 1) return { status: "AMBIGUOUS", basis: "filename", candidates: exactFilename.map((media) => media.mediaId) };
  return { status: "STATIC_ASSET_NO_LIBRARY_MATCH", basis: "none" };
}

async function firebaseAccessToken() {
  const require = createRequire(import.meta.url);
  const auth = require(path.join(root, "node_modules", "firebase-tools", "lib", "auth.js"));
  const apiv2 = require(path.join(root, "node_modules", "firebase-tools", "lib", "apiv2.js"));
  const account = auth.getProjectDefaultAccount(root) || auth.getGlobalDefaultAccount();
  if (!account) throw new Error("FIREBASE_AUTH_SESSION_UNAVAILABLE");
  auth.setActiveAccount({}, account);
  return apiv2.getAccessToken();
}

async function apiJson(url, { token, method = "GET", body, optional = false } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const error = new Error(`HTTP_${response.status}`);
    error.status = response.status;
    if (optional) return { __error: error.message };
    throw error;
  }
  return response.json();
}

function firestoreBase() {
  return `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${encodeURIComponent(DATABASE_ID)}`;
}

async function listCollectionIds(token) {
  firestoreDocumentReadOperations += 1;
  const result = await apiJson(`${firestoreBase()}/documents:listCollectionIds`, {
    token,
    method: "POST",
    body: { pageSize: 300 },
  });
  return result.collectionIds || [];
}

async function aggregateCount(token, collectionId) {
  firestoreDocumentReadOperations += 1;
  const result = await apiJson(`${firestoreBase()}/documents:runAggregationQuery`, {
    token,
    method: "POST",
    body: {
      structuredAggregationQuery: {
        aggregations: [{ alias: "total", count: {} }],
        structuredQuery: { from: [{ collectionId }] },
      },
    },
  });
  const first = Array.isArray(result) ? result[0] : result;
  return Number(first?.result?.aggregateFields?.total?.integerValue || 0);
}

async function listDocuments(token, collectionId, { pageSize = 1, mask = [], allPages = false } = {}) {
  const documents = [];
  let pageToken = "";
  do {
    const url = new URL(`${firestoreBase()}/documents/${encodeURIComponent(collectionId)}`);
    url.searchParams.set("pageSize", String(pageSize));
    url.searchParams.set("showMissing", "false");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    for (const field of mask) url.searchParams.append("mask.fieldPaths", field);
    firestoreDocumentReadOperations += 1;
    const page = await apiJson(url.href, { token });
    for (const document of page.documents || []) {
      documents.push(document);
      readDocumentNames.add(document.name);
      firestoreDocumentResponsesRead += 1;
    }
    pageToken = allPages ? (page.nextPageToken || "") : "";
  } while (pageToken);
  return documents;
}

async function getDocument(token, documentPath) {
  firestoreDocumentReadOperations += 1;
  const result = await apiJson(`${firestoreBase()}/documents/${documentPath}`, { token, optional: true });
  if (!result.__error && result.name) {
    readDocumentNames.add(result.name);
    firestoreDocumentResponsesRead += 1;
  }
  return result;
}

async function auditRemoteSchema(token) {
  const remoteIds = await listCollectionIds(token);
  const matrix = {};
  let mediaDocuments = [];

  for (const collectionId of RELEVANT_COLLECTIONS) {
    const count = await aggregateCount(token, collectionId);
    const exists = remoteIds.includes(collectionId) || count > 0;
    if (!exists) {
      matrix[collectionId] = {
        exists: false,
        documentCount: 0,
        sampleShape: null,
        observedValues: {},
      };
      continue;
    }

    const sample = await listDocuments(token, collectionId, { pageSize: 1 });
    const observed = await listDocuments(token, collectionId, { pageSize: 25, mask: ENUM_FIELDS });
    const observedValues = {};
    for (const field of ["status", "publicado", "role", "ativo", "type", "schemaVersion"]) {
      const values = [...new Set(observed.map((doc) => firestorePrimitive(doc.fields?.[field])).filter((value) => value !== undefined))];
      if (values.length) observedValues[field] = values.sort();
    }
    matrix[collectionId] = {
      exists: true,
      documentCount: count,
      sampleShape: sample[0] ? fieldShape(sample[0].fields || {}) : null,
      observedValues,
    };

    if (collectionId === "media_library") {
      mediaDocuments = await listDocuments(token, collectionId, { pageSize: 300, mask: MEDIA_FIELDS, allPages: true });
    }
  }

  const seasonal = await getDocument(token, "site_config/seasonal");
  const mascot = await getDocument(token, "site_config/mascot");
  return {
    remoteCollectionIds: remoteIds.filter((id) => RELEVANT_COLLECTIONS.includes(id)).sort(),
    matrix,
    mediaRecords: mediaDocuments.map(mediaRecord),
    seasonalRemoteState: seasonal.__error === "HTTP_404" ? "ABSENT_PLANNED_CREATE" : (seasonal.__error ? `UNVERIFIED_${seasonal.__error}` : "PRESENT"),
    mascotRemoteState: mascot.__error === "HTTP_404" ? "ABSENT_PLANNED_CREATE" : (mascot.__error ? `UNVERIFIED_${mascot.__error}` : "PRESENT"),
  };
}

async function cloudReadiness(token) {
  const database = await apiJson(`${firestoreBase()}`, { token, optional: true });
  const firebaseProject = await apiJson(`https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}`, { token, optional: true });
  const billing = await apiJson(`https://cloudbilling.googleapis.com/v1/projects/${PROJECT_ID}/billingInfo`, { token, optional: true });
  const cloudProject = await apiJson(`https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT_ID}`, { token, optional: true });
  const functionsApi = await apiJson(`https://cloudfunctions.googleapis.com/v2/projects/${PROJECT_ID}/locations/-/functions?pageSize=1`, { token, optional: true });
  const projectNumber = firebaseProject?.resources?.projectNumber || cloudProject?.projectNumber || "";
  let enabledServices = [];
  let serviceUsageState = "UNVERIFIED";
  if (projectNumber) {
    const services = await apiJson(`https://serviceusage.googleapis.com/v1/projects/${projectNumber}/services?filter=state%3AENABLED&pageSize=200`, { token, optional: true });
    if (!services.__error) {
      enabledServices = (services.services || []).map((service) => String(service.name || "").split("/").pop()).sort();
      serviceUsageState = "VERIFIED";
    } else {
      serviceUsageState = services.__error;
    }
  }
  const requiredServices = [
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudfunctions.googleapis.com",
    "eventarc.googleapis.com",
    "firestore.googleapis.com",
    "logging.googleapis.com",
    "pubsub.googleapis.com",
    "run.googleapis.com",
  ];
  const serviceStates = Object.fromEntries(requiredServices.map((service) => [
    service,
    serviceUsageState === "VERIFIED" ? (enabledServices.includes(service) ? "ENABLED" : "NOT_OBSERVED_ENABLED") : "UNVERIFIED",
  ]));
  const missingRequiredServices = Object.values(serviceStates).some((state) => state === "NOT_OBSERVED_ENABLED");
  const location = database.locationId || "UNVERIFIED";
  const functionsRegionRecommended = location === "southamerica-east1" ? "southamerica-east1"
    : location === "nam5" ? "us-central1"
      : location === "eur3" ? "europe-west1"
        : location === "UNVERIFIED" ? "UNVERIFIED" : location;
  return {
    firebaseProjectId: firebaseProject.projectId || PROJECT_ID,
    firestoreRegion: location,
    functionsRegionRecommended,
    firebaseBillingPlan: billing.__error ? "UNVERIFIED" : (billing.billingEnabled === true ? "BLAZE_COMPATIBLE_BILLING_ENABLED" : "SPARK_OR_BILLING_DISABLED"),
    billingVerification: billing.__error || "VERIFIED",
    cloudFunctionsProductionDeployPossible: billing.__error
      ? "UNVERIFIED"
      : (billing.billingEnabled !== true
          ? "BLAZE_UPGRADE_REQUIRED"
          : (missingRequiredServices ? "PREREQUISITE_APIS_ENABLEMENT_REQUIRED" : "READINESS_PASS")),
    cloudFunctionsApiState: functionsApi.__error || "ENABLED_AND_READABLE",
    serviceUsageState,
    requiredServiceStates: serviceStates,
  };
}

function compatibilityClassification(collectionId, remote) {
  if (!remote.exists) {
    if (["gallery_items", "site_config", "audit_logs"].includes(collectionId)) return "MIGRATION_REQUIRED";
    return "UNKNOWN";
  }
  if (collectionId === "cms_establishments") {
    return remote.sampleShape?.schemaVersion ? "MATCH" : "COMPATIBLE_LEGACY";
  }
  if (collectionId === "establishment_managers") return "COMPATIBLE_LEGACY";
  if (collectionId === "rotas") return "MATCH";
  return "COMPATIBLE_SUPERSET";
}

function buildManifest(inventory, matchMatrix, baseHead) {
  const matchesById = new Map(matchMatrix.map((entry) => [entry.itemId, entry]));
  const items = inventory.filter((item) => item.mediaType === "image").map((item) => {
    const match = matchesById.get(item.itemId);
    const record = {
      itemId: item.itemId,
      sourceIdentity: {
        sourcePath: item.sourcePath,
        publicUrl: item.publicUrl,
        fingerprint: fingerprint([item.category, item.mediaType, canonicalUrl(item.publicUrl)].join("\n")),
      },
      target: {
        url: match?.media?.url || item.publicUrl,
        mediaType: "image",
        category: item.category,
        displayOrder: item.currentOrder,
        published: true,
        caption: item.caption || "",
        alt: item.alt || item.caption || "",
        createdAt: "__SERVER_TIMESTAMP__",
        createdBy: "__MIGRATION_ACTOR_PRINCIPAL__",
        updatedAt: "__SERVER_TIMESTAMP__",
        updatedBy: "__MIGRATION_ACTOR_PRINCIPAL__",
        schemaVersion: SCHEMA_VERSION,
      },
      operation: "CREATE_IF_ABSENT",
    };
    if (match?.media?.mediaId) record.target.mediaId = match.media.mediaId;
    if (match?.media?.storagePath) record.target.storagePath = match.media.storagePath;
    return record;
  });
  const manifestFingerprint = fingerprint(JSON.stringify(items));
  return {
    manifestVersion: 1,
    sourceCommit: baseHead,
    sourceFile: "galeria.html",
    targetCollection: "gallery_items",
    idAlgorithm: "slug(basename-without-extension, max 48) + '-' + first 12 hex of SHA-256(category + newline + mediaType + newline + canonicalPublicUrl)",
    targetSchemaVersion: SCHEMA_VERSION,
    deterministicFingerprintAlgorithm: "SHA-256 over compact JSON serialization of items in current public order",
    manifestFingerprint,
    policy: {
      writeMode: "CREATE_IF_ABSENT",
      updatesPlanned: 0,
      deletesPlanned: 0,
      videoMigration: false,
      staticFallbackRetained: true,
      remoteWriteExecuted: false,
    },
    items,
  };
}

async function gitHead() {
  const { execFileSync } = await import("node:child_process");
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
}

async function main() {
  const baseHead = await gitHead();
  const cloudOnly = process.argv.includes("--cloud-only");
  if (cloudOnly) {
    const token = await firebaseAccessToken();
    const cloud = await cloudReadiness(token);
    const reportPath = path.join(outputDir, "gates-resolution-report.json");
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    report.cloudFunctionsReadiness = cloud;
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ cloudFunctionsReadiness: cloud }, null, 2));
    return;
  }
  const inventory = await extractGalleryInventory();
  const token = await firebaseAccessToken();
  const remote = await auditRemoteSchema(token);
  const cloud = await cloudReadiness(token);
  const matchMatrix = inventory.map((item) => {
    const match = matchGalleryItem(item, remote.mediaRecords);
    return {
      itemId: item.itemId,
      sourcePath: item.sourcePath,
      publicUrl: item.publicUrl,
      mediaType: item.mediaType,
      category: item.category,
      currentOrder: item.currentOrder,
      matchStatus: match.status,
      matchBasis: match.basis || null,
      mediaId: match.media?.mediaId || null,
      storagePath: match.media?.storagePath || null,
      migrationEligible: item.mediaType === "image",
      excludedReason: item.mediaType === "video" ? "VIDEO_NOT_ALLOWED_IN_GALLERY_V1" : null,
      candidateCount: match.candidates?.length || 0,
    };
  });
  const manifest = buildManifest(inventory, matchMatrix, baseHead);
  const compatibility = Object.fromEntries(RELEVANT_COLLECTIONS.map((collectionId) => [
    collectionId,
    {
      classification: compatibilityClassification(collectionId, remote.matrix[collectionId]),
      ...remote.matrix[collectionId],
    },
  ]));
  const summary = {
    auditVersion: 1,
    sourceCommit: baseHead,
    firestoreOperationalReadOperations: firestoreDocumentReadOperations,
    firestoreOperationalDocumentsRead: firestoreDocumentResponsesRead,
    firestoreOperationalUniqueDocumentsRead: readDocumentNames.size,
    firestoreWrites: 0,
    remoteCollectionsObserved: remote.remoteCollectionIds,
    remoteSchemaCompatibilityMatrix: compatibility,
    seasonalRemoteState: remote.seasonalRemoteState,
    mascotRemoteState: remote.mascotRemoteState,
    gallery: {
      sourceItems: inventory.length,
      sourceImages: inventory.filter((item) => item.mediaType === "image").length,
      sourceVideosRetainedInStaticFallback: inventory.filter((item) => item.mediaType === "video").length,
      exactMediaMatches: matchMatrix.filter((item) => item.matchStatus === "EXACT_MEDIA_MATCH").length,
      staticOnlyItems: matchMatrix.filter((item) => item.matchStatus === "STATIC_ASSET_NO_LIBRARY_MATCH").length,
      ambiguousItems: matchMatrix.filter((item) => item.matchStatus === "AMBIGUOUS").length,
      invalidItems: matchMatrix.filter((item) => item.matchStatus === "INVALID").length,
      createsPlanned: manifest.items.length,
      updatesPlanned: 0,
      deletesPlanned: 0,
      manifestFingerprint: manifest.manifestFingerprint,
      manifestReady: matchMatrix.every((item) => item.matchStatus !== "AMBIGUOUS" && item.matchStatus !== "INVALID"),
      migrationWriteExecuted: false,
    },
    galleryInventory: inventory,
    galleryMediaMatchMatrix: matchMatrix,
    cloudFunctionsReadiness: cloud,
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "gallery-migration-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputDir, "gates-resolution-report.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(JSON.stringify({
    remoteCollectionsObserved: summary.remoteCollectionsObserved,
    firestoreOperationalReadOperations: summary.firestoreOperationalReadOperations,
    firestoreOperationalDocumentsRead: summary.firestoreOperationalDocumentsRead,
    gallery: summary.gallery,
    cloudFunctionsReadiness: summary.cloudFunctionsReadiness,
    artifacts: [
      "docs/admin-finalization/gallery-migration-manifest.json",
      "docs/admin-finalization/gates-resolution-report.json",
    ],
  }, null, 2));
}

main().catch((error) => {
  console.error(`ADMIN_FINALIZATION_GATES_AUDIT_FAILED=${error.message}`);
  process.exitCode = 1;
});
