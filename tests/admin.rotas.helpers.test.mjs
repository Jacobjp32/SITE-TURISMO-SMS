import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { test } from "node:test";

const source = await readFile(new URL("../js/admin/modules/rotas-helpers.js", import.meta.url), "utf8");
const context = { globalThis: {} }; vm.createContext(context); vm.runInContext(source, context);
const H = context.globalThis.AdminRoutesHelpers;
function route(overrides = {}) { return { id: "rota-teste", slug: "rota-teste", name: "Rota teste", category: "Cultura", description: "Descrição sintética.", color: "#123abc", icon: "R", status: "draft", displayOrder: 10, cover: { mediaId: "", url: "images/test.webp", path: "", alt: "Capa sintética" }, tags: ["teste"], ...overrides }; }

test("slugify e validação mantêm o contrato básico", () => { assert.equal(H.slugify("Rota da Erva-Mate"), "rota-da-erva-mate"); assert.equal(H.validateRoute(route()).valid, true); assert.equal(H.validateRoute(route({ slug: "Inválido" })).errors.slug.includes("inválido"), true); });
test("bloqueia slug depois da primeira publicação", () => { assert.ok(H.validateRoute(route({ slug: "novo" }), { slugLocked: true, originalSlug: "rota-teste" }).errors.slug); });
test("valida campos de publicação e serializa cover mínima", () => { assert.ok(H.validateRoute(route({ status: "published", cover: { mediaId: "", url: "", path: "", alt: "" } })).errors.cover); assert.equal(JSON.stringify(H.normalizeCover({ mediaId: " m ", url: " u " })), JSON.stringify({ mediaId: "m", url: "u", path: "", alt: "" })); });
test("diff N:N e merge preservam relações secundárias", () => { const diff = H.associationDiff(["rota-a", "rota-b"], ["rota-b", "rota-c"]); assert.deepEqual(diff.addedEstablishmentIds, ["rota-c"]); assert.deepEqual(diff.removedEstablishmentIds, ["rota-a"]); assert.deepEqual(H.mergeRouteId(["outra", "rota-a"], "rota-a", false), ["outra"]); assert.deepEqual(H.mergeRouteId(["outra"], "rota-a", true), ["outra", "rota-a"]); });
test("detecção de uso cobre mediaId, path e URL", () => { assert.equal(H.mediaMatchesCover({ id: "m1" }, { mediaId: "m1" }), true); assert.equal(H.mediaMatchesCover({ storagePath: "cms-media/a.webp" }, { path: "cms-media/a.webp" }), true); assert.equal(H.mediaMatchesCover({ url: "images/a.webp" }, { url: "images/a.webp" }), true); });
test("ações, ordenação e filtro respeitam o ciclo editorial", () => { assert.equal(JSON.stringify(H.actionSet({ status: "archived" })), JSON.stringify(["preview"])); assert.equal(JSON.stringify(H.sortAndFilter([route({ id: "b", name: "B", displayOrder: 20 }), route({ id: "a", name: "A", displayOrder: 10 })], "draft", "").map((item) => item.id)), JSON.stringify(["a", "b"])); });
