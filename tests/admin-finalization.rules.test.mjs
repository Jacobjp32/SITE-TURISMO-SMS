import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";

const PROJECT_ID = "demo-turismo-sms-admin-finalization-rules";
let env;

const gallery = (published = true) => ({
  url: "https://example.invalid/image.jpg", mediaType: "image", category: "patrimonio",
  displayOrder: 1, published, caption: "Imagem", alt: "Descrição",
  createdAt: serverTimestamp(), createdBy: "admin-active", updatedAt: serverTimestamp(),
  updatedBy: "admin-active", schemaVersion: 1
});

before(async () => {
  env = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules: await readFile(new URL("../firestore.rules", import.meta.url), "utf8") } });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await Promise.all([
      ["user", "user", true], ["moderator", "moderator", true], ["admin-active", "admin", true], ["admin-inactive", "admin", false]
    ].map(([uid, role, ativo]) => setDoc(doc(ctx.firestore(), "usuarios", uid), { role, ativo })));
    await setDoc(doc(ctx.firestore(), "gallery_items", "published"), { ...gallery(true), createdAt: new Date(), updatedAt: new Date() });
    await setDoc(doc(ctx.firestore(), "gallery_items", "draft"), { ...gallery(false), createdAt: new Date(), updatedAt: new Date() });
    await setDoc(doc(ctx.firestore(), "audit_logs", "evt"), { eventId: "evt", timestamp: new Date() });
  });
});

const db = (uid) => uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();

test("gallery role matrix e schema", async () => {
  await assertSucceeds(getDoc(doc(db(), "gallery_items", "published")));
  await assertFails(getDoc(doc(db(), "gallery_items", "draft")));
  await assertSucceeds(getDocs(query(collection(db(), "gallery_items"), where("published", "==", true))));
  for (const uid of [undefined, "user", "moderator", "admin-inactive"]) await assertFails(setDoc(doc(db(uid), "gallery_items", `new-${uid || "anon"}`), gallery()));
  await assertSucceeds(setDoc(doc(db("admin-active"), "gallery_items", "new"), gallery()));
  await assertFails(setDoc(doc(db("admin-active"), "gallery_items", "video"), { ...gallery(), mediaType: "video" }));
  await assertSucceeds(updateDoc(doc(db("admin-active"), "gallery_items", "published"), { caption: "Atualizada", updatedAt: serverTimestamp(), updatedBy: "admin-active" }));
  await assertFails(deleteDoc(doc(db("admin-active"), "gallery_items", "published")));
});

test("site_config permite somente get público dos dois IDs e escrita de admin ativo", async () => {
  await assertSucceeds(getDoc(doc(db(), "site_config", "seasonal")));
  await assertSucceeds(getDoc(doc(db(), "site_config", "mascot")));
  await assertFails(getDocs(collection(db(), "site_config")));
  await assertFails(getDoc(doc(db(), "site_config", "general")));
  const seasonal = { enabled: true, mode: "AUTO", seasonOverride: null, updatedAt: serverTimestamp(), updatedBy: "admin-active", schemaVersion: 1 };
  for (const uid of [undefined, "user", "moderator", "admin-inactive"]) await assertFails(setDoc(doc(db(uid), "site_config", "seasonal"), seasonal));
  await assertSucceeds(setDoc(doc(db("admin-active"), "site_config", "seasonal"), seasonal));
  await assertSucceeds(setDoc(doc(db("admin-active"), "site_config", "mascot"), { enabled: true, updatedAt: serverTimestamp(), updatedBy: "admin-active", schemaVersion: 1 }));
  await assertFails(setDoc(doc(db("admin-active"), "site_config", "general"), seasonal));
  await assertFails(setDoc(doc(db("admin-active"), "site_config", "seasonal"), { ...seasonal, mode: "MANUAL", seasonOverride: "invalid" }));
  await assertFails(deleteDoc(doc(db("admin-active"), "site_config", "seasonal")));
});

test("audit_logs é read-only para admin ativo e negado aos demais", async () => {
  for (const uid of [undefined, "user", "moderator", "admin-inactive"]) await assertFails(getDoc(doc(db(uid), "audit_logs", "evt")));
  await assertSucceeds(getDoc(doc(db("admin-active"), "audit_logs", "evt")));
  for (const uid of ["user", "moderator", "admin-active", "admin-inactive"]) {
    await assertFails(setDoc(doc(db(uid), "audit_logs", `create-${uid}`), { eventId: uid }));
    await assertFails(updateDoc(doc(db(uid), "audit_logs", "evt"), { action: "tamper" }));
    await assertFails(deleteDoc(doc(db(uid), "audit_logs", "evt")));
  }
  assert.ok(true);
});
