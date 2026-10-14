// Seed de DEMONSTRAÇÃO do painel administrativo — somente Firebase Emulator.
// Recusa qualquer projeto que não seja demo-* e exige os três emuladores.
// Empreendimentos vêm do próprio repositório (export de cms-establishments-seed);
// todo registro sintético é marcado com "[Demo]" ou domínio example.invalid.
//
// Uso (com emuladores rodando):
//   node scripts/cms-establishments-seed.mjs --export-json <tmp>/cms-seed.json
//   GCLOUD_PROJECT=demo-turismo-sms-admin-finalization \
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
//   node scripts/admin-painel-demo-seed.mjs <tmp>/cms-seed.json
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

const projectId = process.env.GCLOUD_PROJECT;
if (!projectId?.startsWith("demo-") || !process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  throw new Error("Seed de demonstração exige projeto demo-* e Auth/Firestore Emulator.");
}
const seedFile = process.argv[2];
if (!seedFile) throw new Error("Informe o JSON exportado por cms-establishments-seed.mjs.");

const requireFromFunctions = createRequire(new URL("../functions/package.json", import.meta.url));
const { initializeApp, deleteApp } = requireFromFunctions("firebase-admin/app");
const { getAuth } = requireFromFunctions("firebase-admin/auth");
const { getFirestore, Timestamp } = requireFromFunctions("firebase-admin/firestore");

const app = initializeApp({ projectId }, `admin-painel-demo-${Date.now()}`);
const auth = getAuth(app);
const db = getFirestore(app);

const PASSWORD = "AdminLocal-2026!";
const day = 24 * 60 * 60 * 1000;
const at = (offsetDays) => Timestamp.fromMillis(Date.now() + offsetDays * day);
const iso = (offsetDays) => new Date(Date.now() + offsetDays * day).toISOString().slice(0, 10);

async function ensureUser(uid, email, nome, role, ativo = true) {
  try {
    await auth.getUser(uid);
    await auth.updateUser(uid, { email, password: PASSWORD, displayName: nome });
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    await auth.createUser({ uid, email, password: PASSWORD, displayName: nome, emailVerified: true });
  }
  await db.collection("usuarios").doc(uid).set({ nome, email, role, tipo: role, ativo, createdAt: at(-40) });
}

try {
  const users = [
    ["demo-admin", "admin.demo@example.invalid", "Admin Demo", "admin"],
    ["demo-emp-1", "empreendedor1.demo@example.invalid", "Empreendedor Demo 1", "user"],
    ["demo-emp-2", "empreendedor2.demo@example.invalid", "Empreendedor Demo 2", "user"],
    ["demo-turista", "turista.demo@example.invalid", "Turista Demo", "user"],
  ];
  for (const [uid, email, nome, role] of users) await ensureUser(uid, email, nome, role);
  await ensureUser("demo-inativo", "inativo.demo@example.invalid", "Usuário Inativo Demo", "user", false);

  // Mesmo marcador de grupos validados usado pelo seed E2E oficial: sem ele as Rules
  // (corretamente) recusam as gravações por grupo feitas pelo editor.
  const GROUPS = ["core", "content", "contact", "location", "media",
    "relationshipsRouteIds", "relationshipsRelatedPlaceIds", "relationshipsRelatedEventIds",
    "display", "seo", "review", "source", "lifecycle"];
  const validatedGroups = Object.fromEntries(GROUPS.map((group) => [group, 2]));

  // Empreendimentos reais do repositório: metade publicada, o resto em rascunho/arquivado.
  const exported = JSON.parse(await readFile(seedFile, "utf8"));
  const records = exported.records || [];
  let i = 0;
  for (const record of records) {
    const status = i % 5 === 4 ? "draft" : (i % 11 === 10 ? "archived" : "published");
    const doc = { ...record, status, schemaVersion: 2, validatedGroups, revision: 1, createdAt: at(-60), updatedAt: at(-(i % 30)), createdBy: "demo-admin", updatedBy: "demo-admin" };
    if (doc.publishing) doc.publishing = { ...doc.publishing, publishedAt: status === "published" ? at(-30) : null, publishedBy: status === "published" ? "demo-admin" : "" };
    await db.collection("cms_establishments").doc(record.id).set(doc);
    i += 1;
  }

  // Eventos pendentes sintéticos (enviados pelo Portal do Usuário).
  const pendingEvents = [
    { id: "demo-evt-pend-1", title: "[Demo] Feira de artesanato na praça", categoria: "Cultura", dataInicio: iso(9), time: "09:00", local: "Praça central (exemplo)", ownerName: "Empreendedor Demo 1", ownerEmail: "empreendedor1.demo@example.invalid", status: "pendente", submittedAt: at(-1), descricao: "Evento sintético para demonstração do fluxo de moderação." },
    { id: "demo-evt-pend-2", title: "[Demo] Noite de música polonesa", categoria: "Música", dataInicio: iso(16), time: "20:00", local: "Local fictício de demonstração", ownerName: "Empreendedor Demo 2", ownerEmail: "empreendedor2.demo@example.invalid", status: "pendente", submittedAt: at(-3), descricao: "Evento sintético para demonstração." },
    { id: "demo-evt-pend-3", title: "[Demo] Passeio de bicicleta rural", categoria: "Esporte", dataInicio: iso(4), local: "", ownerName: "Turista Demo", ownerEmail: "turista.demo@example.invalid", status: "pendente", submittedAt: at(-6), descricao: "Sem local nem horário — exemplo de envio incompleto." },
  ];
  for (const e of pendingEvents) await db.collection("eventos_pendentes").doc(e.id).set(e);

  const approvedEvents = [
    { id: "demo-evt-ok-1", title: "[Demo] Festival gastronômico de outono", categoria: "Gastronomia", dataInicio: iso(20), time: "11:00", local: "Local de demonstração", status: "aprovado", publicado: true, destaque: true, approvedAt: at(-10) },
    { id: "demo-evt-ok-2", title: "[Demo] Encontro de corais", categoria: "Música", dataInicio: iso(-12), time: "19:00", local: "Local de demonstração", status: "aprovado", publicado: true, approvedAt: at(-30) },
    { id: "demo-evt-ok-3", title: "[Demo] Oficina de cuia (despublicada)", categoria: "Cultura", dataInicio: iso(35), local: "Local de demonstração", status: "aprovado", publicado: false, approvedAt: at(-2) },
  ];
  for (const e of approvedEvents) await db.collection("eventos_aprovados").doc(e.id).set(e);

  // Notícias: publicadas e rascunhos.
  const news = [
    { id: "demo-news-1", titulo: "[Demo] Temporada de inverno: roteiros recomendados", slug: "demo-temporada-inverno", resumo: "Notícia sintética publicada.", conteudo: "Texto de demonstração.", categoria: "Turismo", imagem: "images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg", publicado: true, status: "publicado", destaque: true, publishedAt: iso(-5), data: iso(-5), updatedAt: at(-5), updatedBy: "demo-admin" },
    { id: "demo-news-2", titulo: "[Demo] Rota da Erva-Mate ganha nova sinalização", slug: "demo-rota-erva-mate", resumo: "Rascunho aguardando revisão.", conteudo: "", categoria: "Turismo", imagem: "", publicado: false, status: "rascunho", publishedAt: iso(0), data: iso(0), updatedAt: at(-1), updatedBy: "demo-admin" },
    { id: "demo-news-3", titulo: "[Demo] Igreja Matriz recebe visitas guiadas", slug: "demo-matriz-visitas", resumo: "Rascunho com imagem.", conteudo: "Texto.", categoria: "Cultura", imagem: "images/IGREJA_MATRIZ_FRONTAL.jpg", publicado: false, status: "rascunho", publishedAt: iso(0), data: iso(0), updatedAt: at(-8), updatedBy: "demo-admin" },
  ];
  for (const n of news) await db.collection("noticias").doc(n.id).set(n);

  // Biblioteca de mídia: imagens do acervo local (autorizadas para o portal).
  const media = [
    ["FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg", "Vista geral da cidade", "Paisagem"],
    ["IGREJA_MATRIZ_FRONTAL.jpg", "Igreja Matriz — fachada", "Patrimônio"],
    ["IGREJA_AGUA_BRANCA.jpg", "Igreja de Água Branca", "Patrimônio"],
    ["IGREJA_AGUA_BRANCA_2.jpg", "Igreja de Água Branca — interior", "Patrimônio"],
    ["PARQUE_EXPOSICOES_1.jpg", "Parque de Exposições", "Eventos"],
    ["PARQUE_EXPOSICOES_3.jpg", "Parque de Exposições — pavilhão", "Eventos"],
    ["GINASIO_POLACAO.JPG", "Ginásio Polacão", "Esporte"],
    ["MORANGO_1.jpg", "Colheita de morango", "Gastronomia"],
    ["CASA_DA_MEMORIA.png", "Casa da Memória", "Patrimônio"],
    ["IMG_2295.jpg", "", "Imagem"],
  ];
  let m = 0;
  for (const [file, title, category] of media) {
    const id = `demo-media-${++m}`;
    await db.collection("media_library").doc(id).set({ id, title: title || file, url: `images/${file}`, category, alt: title, storagePath: "", contentType: file.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg", size: 0, createdAt: at(-m), updatedAt: at(-m), updatedBy: "demo-admin" });
  }

  // Solicitações de vínculo e de atualização (fluxo do Portal do Usuário).
  const firstTwo = records.slice(0, 2);
  if (firstTwo[0]) {
    await db.collection("establishment_claims").doc("demo-claim-1").set({
      id: "demo-claim-1", userId: "demo-emp-1", userEmail: "empreendedor1.demo@example.invalid", userName: "Empreendedor Demo 1",
      contactPhone: "", establishmentId: firstTwo[0].id, establishmentName: firstTwo[0].name, establishmentCategory: firstTwo[0].categoryLabel || "",
      establishmentSource: "cms", requestedRole: "owner", status: "pending", message: "[Demo] Sou responsável por este empreendimento.",
      createdAt: at(-2), updatedAt: at(-2), reviewedAt: null, reviewedBy: null, reviewNotes: "", rejectionReason: "", source: "portal_usuario",
    });
  }
  if (firstTwo[1]) {
    await db.collection("establishment_managers").doc("demo-mgr-1").set({
      id: "demo-mgr-1", userId: "demo-emp-2", userEmail: "empreendedor2.demo@example.invalid", userName: "Empreendedor Demo 2",
      establishmentId: firstTwo[1].id, establishmentName: firstTwo[1].name, role: "owner", active: true, createdAt: at(-20), updatedAt: at(-20),
    });
    await db.collection("establishment_update_requests").doc("demo-upd-1").set({
      id: "demo-upd-1", managerId: "demo-mgr-1", ownerUid: "demo-emp-2", ownerEmail: "empreendedor2.demo@example.invalid", ownerName: "Empreendedor Demo 2",
      establishmentId: firstTwo[1].id, establishmentName: firstTwo[1].name, establishmentCategory: firstTwo[1].categoryLabel || "", establishmentSource: "cms",
      currentSnapshot: { openingHours: firstTwo[1].content?.openingHours || "" }, requestedChanges: { openingHours: "[Demo] Novo horário sugerido" },
      images: [], mainImage: null, imageCount: 0, status: "pending", source: "establishment_manager", createdAt: at(-1), updatedAt: at(-1), submittedAt: at(-1), reviewedAt: null,
    });
  }

  await db.collection("estabelecimentos_pendentes").doc("demo-est-pend-1").set({
    id: "demo-est-pend-1", nome: "[Demo] Café colonial (cadastro novo)", categoria: "Gastronomia", status: "pendente",
    ownerUid: "demo-emp-1", ownerEmail: "empreendedor1.demo@example.invalid", ownerName: "Empreendedor Demo 1", createdAt: at(-4), submittedAt: at(-4),
  });

  console.log(JSON.stringify({ projectId, users: users.length + 1, establishments: records.length, pendingEvents: pendingEvents.length, approvedEvents: approvedEvents.length, news: news.length, media: media.length }));
} finally {
  await deleteApp(app);
}
