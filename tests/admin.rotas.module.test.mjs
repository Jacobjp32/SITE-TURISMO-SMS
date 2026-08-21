import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { test } from "node:test";

const [helpersSource, moduleSource] = await Promise.all([
  readFile(new URL("../js/admin/modules/rotas-helpers.js", import.meta.url), "utf8"),
  readFile(new URL("../js/admin/modules/rotas.js", import.meta.url), "utf8"),
]);

function createModuleHarness() {
  const elements = new Map();
  const modal = { title: "", html: "" };
  const element = () => ({ nodeType: 1, innerHTML: "", textContent: "", value: "" });
  ["section-rotas", "routesStatus", "routesSearch", "routes-list", "route_establishmentSearch", "routeEstablishmentList"].forEach((id) => elements.set(id, element()));
  const document = { getElementById: (id) => elements.get(id) || null };
  const window = {
    document,
    AdminRegistry: { register: () => {} },
    AdminUI: { escapeHtml: (value) => String(value ?? "") },
    AdminContentCMS: {
      openModal: (title, html) => { modal.title = title; modal.html = html; },
      closeModal: () => {},
    },
  };
  const context = vm.createContext({ window, document, console, setTimeout: () => {} });
  vm.runInContext(helpersSource, context);
  vm.runInContext(moduleSource, context);
  return { context, elements, modal, module: window.AdminRoutesModule };
}

test("Editar encaminha o ID da linha para o formulário e abre o modal", () => {
  const { context, elements, modal, module } = createModuleHarness();
  module._state.items = [{
    __id: "rota-sintetica", id: "rota-sintetica", slug: "rota-sintetica", name: "Rota sintética",
    category: "Teste", description: "Descrição sintética.", color: "#123abc", icon: "R",
    status: "draft", displayOrder: 1, tags: [], cover: { mediaId: "", url: "", path: "", alt: "" },
  }];
  module._state.establishments = [];

  module.render(elements.get("section-rotas"));
  assert.match(elements.get("routes-list").innerHTML, /AdminRoutesModule\.edit\('rota-sintetica'\)/);

  vm.runInContext("window.AdminRoutesModule.edit('rota-sintetica')", context);

  assert.equal(module._state.selectedId, "rota-sintetica");
  assert.equal(modal.title, "Editar rota");
  assert.match(modal.html, /name="mode" value="edit"/);
});

test("IDs em handlers inline permanecem codificados como conteúdo", () => {
  const { elements, module } = createModuleHarness();
  module._state.items = [{
    __id: 'rota" onclick="globalThis.pwned()', id: 'rota" onclick="globalThis.pwned()', slug: "rota-segura",
    name: "Rota sintética", category: "Teste", description: "Descrição sintética.", color: "#123abc", icon: "R",
    status: "draft", displayOrder: 1, tags: [], cover: { mediaId: "", url: "", path: "", alt: "" },
  }];
  module._state.establishments = [];

  module.render(elements.get("section-rotas"));

  assert.match(elements.get("routes-list").innerHTML, /AdminRoutesModule\.edit\('rota&quot; onclick=&quot;globalThis\.pwned\(\)'\)/);
});
