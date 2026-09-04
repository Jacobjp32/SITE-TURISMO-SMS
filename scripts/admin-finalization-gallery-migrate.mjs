import crypto from "node:crypto";
import fs from "node:fs/promises";
import { createRequire } from "node:module";

const EXPECTED_FINGERPRINT = "0bd0057e7a4d240f1025a05e4344028ca658687d881b2a39dba71dd3cbefe68d";
const MIGRATION_ACTOR = "admin-finalization-migration";
const args = new Set(process.argv.slice(2));
const mode = args.has("--emulator") ? "emulator" : args.has("--production") ? "production" : args.has("--dry-run") ? "dry-run" : "";

if (!mode || [...["--dry-run", "--emulator", "--production"]].filter((arg) => args.has(arg)).length !== 1) {
  throw new Error("Use exatamente um modo: --dry-run, --emulator ou --production.");
}

const manifest = JSON.parse(await fs.readFile(new URL("../docs/admin-finalization/gallery-migration-manifest.json", import.meta.url), "utf8"));
const fingerprint = crypto.createHash("sha256").update(JSON.stringify(manifest.items)).digest("hex");
if (manifest.manifestFingerprint !== EXPECTED_FINGERPRINT || fingerprint !== EXPECTED_FINGERPRINT) throw new Error("Fingerprint do manifesto divergente.");
if (manifest.items.length !== 28 || manifest.items.some((item) => item.target.mediaType !== "image" || item.operation !== "CREATE_IF_ABSENT")) throw new Error("Manifesto fora do contrato V1.");

const summary = {
  mode,
  galleryMigrationManifestFingerprint: fingerprint,
  galleryCreatesPlanned: manifest.items.length,
  galleryUpdatesPlanned: 0,
  galleryDeletesPlanned: 0,
  siteConfigCreatesPlanned: 2
};

if (mode === "dry-run") {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

let projectId;
if (mode === "emulator") {
  projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG_PROJECT_ID || "demo-turismo-sms-admin-finalization";
  if (!process.env.FIRESTORE_EMULATOR_HOST || !projectId.startsWith("demo-")) throw new Error("--emulator exige FIRESTORE_EMULATOR_HOST e projectId demo-*.");
} else {
  projectId = process.env.GCLOUD_PROJECT;
  const confirmation = process.argv.find((arg) => arg.startsWith("--confirm-production="));
  if (projectId !== "turismo-sms" || confirmation !== `--confirm-production=turismo-sms:${EXPECTED_FINGERPRINT}`) {
    throw new Error("Produção exige GCLOUD_PROJECT=turismo-sms e confirmação literal vinculada ao fingerprint.");
  }
}

const requireFromFunctions = createRequire(new URL("../functions/package.json", import.meta.url));
const { initializeApp, deleteApp } = requireFromFunctions("firebase-admin/app");
const { getFirestore, Timestamp } = requireFromFunctions("firebase-admin/firestore");
const app = initializeApp({ projectId }, `admin-finalization-${mode}-${Date.now()}`);
const db = getFirestore(app);
let creates = 0;

function comparable(data) {
  return {
    url: data.url, mediaType: data.mediaType, category: data.category,
    displayOrder: data.displayOrder, published: data.published,
    caption: data.caption, alt: data.alt, schemaVersion: data.schemaVersion
  };
}

try {
  for (const item of manifest.items) {
    const ref = db.collection("gallery_items").doc(item.itemId);
    const existing = await ref.get();
    const expected = comparable(item.target);
    if (existing.exists) {
      if (JSON.stringify(comparable(existing.data())) !== JSON.stringify(expected)) throw new Error(`Documento existente divergente: ${item.itemId}`);
      continue;
    }
    const now = Timestamp.now();
    await ref.create({ ...expected, createdAt: now, createdBy: MIGRATION_ACTOR, updatedAt: now, updatedBy: MIGRATION_ACTOR });
    creates += 1;
  }

  const defaults = {
    seasonal: { enabled: true, mode: "AUTO", seasonOverride: null, schemaVersion: 1 },
    mascot: { enabled: true, schemaVersion: 1 }
  };
  let siteConfigCreates = 0;
  for (const [id, value] of Object.entries(defaults)) {
    const ref = db.collection("site_config").doc(id);
    const existing = await ref.get();
    if (existing.exists) {
      if (JSON.stringify({ ...existing.data(), updatedAt: undefined, updatedBy: undefined }) !== JSON.stringify({ ...value, updatedAt: undefined, updatedBy: undefined })) throw new Error(`Config existente divergente: ${id}`);
      continue;
    }
    await ref.create({ ...value, updatedAt: Timestamp.now(), updatedBy: MIGRATION_ACTOR });
    siteConfigCreates += 1;
  }

  const readBack = await db.collection("gallery_items").get();
  const ids = new Set(readBack.docs.map((doc) => doc.id));
  const readBackMatches = readBack.size === 28 && readBack.docs.every((doc) => {
    const item = manifest.items.find((candidate) => candidate.itemId === doc.id);
    return item && JSON.stringify(comparable(doc.data())) === JSON.stringify(comparable(item.target));
  });
  const configs = await Promise.all(["seasonal", "mascot"].map((id) => db.collection("site_config").doc(id).get()));
  console.log(JSON.stringify({
    ...summary,
    galleryEmulatorCreates: mode === "emulator" ? creates : undefined,
    galleryEmulatorReadBackCount: readBack.size,
    galleryEmulatorUniqueIds: ids.size,
    galleryEmulatorFingerprintMatches: readBackMatches,
    galleryEmulatorDeletes: 0,
    siteConfigCreates,
    siteConfigReadBackCount: configs.filter((snap) => snap.exists).length
  }, null, 2));
  if (!readBackMatches || ids.size !== 28 || configs.some((snap) => !snap.exists)) process.exitCode = 2;
} finally {
  await deleteApp(app);
}
