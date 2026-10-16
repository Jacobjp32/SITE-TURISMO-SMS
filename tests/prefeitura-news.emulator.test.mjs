// Importação das notícias reais da Prefeitura (cópia data/noticias-prefeitura.json)
// no Firestore Emulator, com as Rules reais do projeto e um admin ativo.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { after, before } from "node:test";
import { assertFails, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch } from "firebase/firestore";

const PROJECT_ID = "demo-turismo-sms-admin-finalization";
const root = new URL("../", import.meta.url);
await import(new URL("js/admin/prefeitura-news.js", root).href);
const P = globalThis.PrefeituraNews;

const snapshot = JSON.parse(await readFile(new URL("data/noticias-prefeitura.json", root), "utf8"));
snapshot.items.forEach((item) => { item.classificacao = P.classify(item); });

let env;
let adminDb;

async function existingNews() {
  const snap = await getDocs(collection(adminDb, "noticias"));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

// Mesmo fluxo do painel: plano contra o CMS e gravação em lote só do que mudou.
async function runImport(items, { overwrite = false } = {}) {
  const existing = await existingNews();
  const byId = Object.fromEntries(existing.map((d) => [d.id, d]));
  const plan = P.planImport(items, existing);
  const batch = writeBatch(adminDb);
  const counts = { created: 0, updated: 0, skipped: 0 };
  for (const row of plan) {
    const ref = doc(adminDb, "noticias", row.docId);
    if (row.state === "nova") { batch.set(ref, P.buildNewDoc(row.item, { updatedBy: "admin-1" })); counts.created += 1; }
    else if (row.state === "atualizada" || (row.state === "conflito" && overwrite)) { batch.set(ref, P.buildUpdate(row.item, { updatedBy: "admin-1" }, byId[row.docId] || null), { merge: true }); counts.updated += 1; }
    else counts.skipped += 1;
  }
  if (counts.created + counts.updated) await batch.commit();
  return { plan, counts };
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: await readFile(new URL("firestore.rules", root), "utf8") }
  });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "usuarios", "admin-1"), { role: "admin", ativo: true, nome: "Admin demo" });
    // Notícia manual já existente que aponta para uma publicação da Prefeitura.
    await setDoc(doc(ctx.firestore(), "noticias", "noticia_manual_1"), {
      titulo: "Matéria escrita pela equipe", publicado: true, status: "publicado",
      linkOrigem: snapshot.items.find((i) => i.classificacao.decision === "elegivel").link + "/"
    });
  });
  adminDb = env.authenticatedContext("admin-1").firestore();
});

after(async () => { if (env) await env.cleanup(); });

test("cópia real tem notícias das três classes", () => {
  const by = (d) => snapshot.items.filter((i) => i.classificacao.decision === d).length;
  assert.ok(snapshot.items.length >= 50, "mais de 50 notícias reais");
  assert.ok(by("elegivel") >= 20 && by("descartada") >= 20 && by("revisao") >= 1);
});

test("importa só as elegíveis, como rascunho, e não toca a notícia manual", async () => {
  const eligible = snapshot.items.filter((i) => i.classificacao.decision === "elegivel");
  const { counts, plan } = await runImport(eligible);
  assert.equal(plan.filter((r) => r.state === "vinculada").length, 1);
  assert.equal(counts.created, eligible.length - 1);
  const all = await existingNews();
  const imported = all.filter((d) => d.origemTipo === "prefeitura");
  assert.equal(imported.length, eligible.length - 1);
  assert.ok(imported.every((d) => d.publicado === false && d.status === "rascunho"));
  assert.ok(imported.every((d) => d.origemClassificacao === "elegivel"));
  const manual = all.find((d) => d.id === "noticia_manual_1");
  assert.equal(manual.titulo, "Matéria escrita pela equipe");
  const discardedIds = new Set(snapshot.items.filter((i) => i.classificacao.decision !== "elegivel").map(P.docIdFor));
  assert.equal(all.filter((d) => discardedIds.has(d.id)).length, 0, "nenhuma notícia de outra área entrou");
});

test("repetir a importação não cria duplicatas", async () => {
  const before = (await existingNews()).length;
  const { counts } = await runImport(snapshot.items.filter((i) => i.classificacao.decision === "elegivel"));
  assert.equal(counts.created, 0);
  assert.equal(counts.updated, 0);
  assert.equal((await existingNews()).length, before);
});

test("mudança na Prefeitura: rascunho atualiza; notícia no ar nunca muda sem revisão", async () => {
  const [a, b] = snapshot.items.filter((i) => i.classificacao.decision === "elegivel").slice(1, 3);
  // b foi editada pela equipe no CMS e publicada.
  await updateDoc(doc(adminDb, "noticias", P.docIdFor(b)), { resumo: "Resumo revisado pela equipe.", publicado: true, status: "publicado" });
  const changedA = { ...a, conteudo: a.conteudo + "\n\nAtualização publicada pela Prefeitura." };
  const changedB = { ...b, titulo: b.titulo + " (atualizado)" };

  const first = await runImport([changedA, changedB]);
  assert.deepEqual(first.plan.map((r) => r.state), ["atualizada", "conflito"]);
  assert.equal(first.counts.updated, 1);
  const docB = (await getDoc(doc(adminDb, "noticias", P.docIdFor(b)))).data();
  assert.equal(docB.resumo, "Resumo revisado pela equipe.", "edição preservada sem confirmação");
  assert.equal(docB.publicado, true);

  // Mesmo confirmando a sobrescrita, a notícia publicada não muda no ar:
  // a versão nova fica guardada para revisão.
  const liveBefore = (await getDoc(doc(adminDb, "noticias", P.docIdFor(b)))).data();
  await runImport([changedB], { overwrite: true });
  const afterOverwrite = (await getDoc(doc(adminDb, "noticias", P.docIdFor(b)))).data();
  assert.equal(afterOverwrite.titulo, liveBefore.titulo, "título no ar não mudou");
  assert.equal(afterOverwrite.resumo, "Resumo revisado pela equipe.", "texto no ar não mudou");
  assert.equal(afterOverwrite.publicado, true, "publicação continua como estava");
  assert.equal(afterOverwrite.atualizacaoPendente, true);
  assert.equal(afterOverwrite.atualizacaoOrigem.titulo, changedB.titulo, "versão nova guardada para revisão");

  // O que o público lê também não mudou.
  const anon = env.unauthenticatedContext().firestore();
  const publicView = (await getDoc(doc(anon, "noticias", P.docIdFor(b)))).data();
  assert.equal(publicView.titulo, liveBefore.titulo);

  // Repetir a importação reconhece a pendência e não grava de novo.
  const again = await runImport([changedB], { overwrite: true });
  assert.equal(again.plan[0].state, "pendente");
  assert.equal(again.counts.updated, 0);

  // Rascunho importado (a) recebe o texto novo, continua fora do ar.
  const docA = (await getDoc(doc(adminDb, "noticias", P.docIdFor(a)))).data();
  assert.equal(docA.conteudo, changedA.conteudo);
  assert.equal(docA.publicado, false);
  assert.equal(docA.atualizacaoPendente, false);
});

test("rascunhos importados não são públicos", async () => {
  const anon = env.unauthenticatedContext().firestore();
  const draft = snapshot.items.find((i) => i.classificacao.decision === "elegivel" && P.docIdFor(i) !== "noticia_manual_1");
  const imported = (await existingNews()).find((d) => d.origemTipo === "prefeitura" && d.publicado === false);
  assert.ok(draft && imported);
  await assertFails(getDoc(doc(anon, "noticias", imported.id)));
});
