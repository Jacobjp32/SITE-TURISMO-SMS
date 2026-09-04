import { createRequire } from "node:module";

const projectId = process.env.GCLOUD_PROJECT;
if (!projectId || !projectId.startsWith("demo-") || !process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  throw new Error("Seed exige projeto demo-* e Auth/Firestore Emulator comprovados.");
}

const requireFromFunctions = createRequire(new URL("../functions/package.json", import.meta.url));
const { initializeApp, deleteApp } = requireFromFunctions("firebase-admin/app");
const { getAuth } = requireFromFunctions("firebase-admin/auth");
const { getFirestore } = requireFromFunctions("firebase-admin/firestore");
const app = initializeApp({ projectId }, `admin-finalization-seed-${Date.now()}`);
const auth = getAuth(app);
const db = getFirestore(app);
const password = "AdminLocal-2026!";
const profiles = [
  { email: "admin.local@example.invalid", nome: "Admin Local", role: "admin", ativo: true },
  { email: "moderator.local@example.invalid", nome: "Moderador Local", role: "moderator", ativo: true },
  { email: "user.local@example.invalid", nome: "Usuário Local", role: "user", ativo: true },
  { email: "inactive-admin.local@example.invalid", nome: "Admin Inativo Local", role: "admin", ativo: false }
];

try {
  const seeded = [];
  for (const profile of profiles) {
    let user;
    try {
      user = await auth.getUserByEmail(profile.email);
      user = await auth.updateUser(user.uid, { password, displayName: profile.nome });
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
      user = await auth.createUser({ email: profile.email, password, displayName: profile.nome });
    }
    await db.collection("usuarios").doc(user.uid).set({ nome: profile.nome, email: profile.email, role: profile.role, ativo: profile.ativo, tipo: profile.role });
    seeded.push({ uid: user.uid, email: profile.email, role: profile.role, ativo: profile.ativo });
  }
  console.log(JSON.stringify({ projectId, syntheticProfilesCreated: seeded.length, profiles: seeded }, null, 2));
} finally {
  await deleteApp(app);
}
