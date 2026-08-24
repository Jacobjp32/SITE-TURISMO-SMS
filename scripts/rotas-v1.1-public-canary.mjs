import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { initializeApp, deleteApp } from "firebase/app";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";

const STATUS = "published";
const TIMEOUT_MS = 10_000;

function loadPublicFirebaseConfig(source) {
  const sandbox = {
    window: {},
    document: { addEventListener() {} },
    console: { log() {}, warn() {}, error() {} },
  };
  vm.runInNewContext(source, sandbox, { filename: "config.js" });
  const config = sandbox.window.CONFIG?.firebase;
  if (!config?.projectId) throw new Error("PUBLIC_FIREBASE_CONFIG_MISSING");
  return config;
}

function classifyError(error) {
  const raw = String(error?.code || error?.name || "unknown").toLowerCase();
  if (raw.includes("permission")) return "permission-denied";
  if (raw.includes("timeout")) return "timeout";
  if (raw.includes("network") || raw.includes("unavailable")) return "network-unavailable";
  if (raw.includes("app-check")) return "app-check-unavailable";
  return "technical-failure";
}

async function withTimeout(promise) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error("PUBLIC_CANARY_TIMEOUT"), { code: "timeout" })), TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function readPublished(db, collectionName) {
  try {
    const snapshot = await withTimeout(getDocs(query(
      collection(db, collectionName),
      where("status", "==", STATUS),
    )));
    return {
      count: snapshot.size,
      state: snapshot.empty ? "AUTHORITATIVE_EMPTY" : "SUCCESS",
      errorCategory: null,
    };
  } catch (error) {
    return { count: null, state: "TECHNICAL_FAILURE", errorCategory: classifyError(error) };
  }
}

const configSource = await readFile(new URL("../config.js", import.meta.url), "utf8");
const app = initializeApp(loadPublicFirebaseConfig(configSource), `rotas-public-canary-${Date.now()}`);

try {
  const db = getFirestore(app);
  const [routes, establishments] = await Promise.all([
    readPublished(db, "rotas"),
    readPublished(db, "cms_establishments"),
  ]);
  const report = {
    productionPublishedRoutes: routes.count,
    productionPublishedEstablishments: establishments.count,
    routesPublicQueryState: routes.state,
    establishmentsPublicQueryState: establishments.state,
    routesErrorCategory: routes.errorCategory,
    establishmentsErrorCategory: establishments.errorCategory,
    FirestoreQueries: 2,
    FirestoreWrites: 0,
    StorageWrites: 0,
    FirebaseAuthMutations: 0,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (routes.state === "TECHNICAL_FAILURE" || establishments.state === "TECHNICAL_FAILURE") process.exitCode = 1;
} finally {
  await deleteApp(app);
}
