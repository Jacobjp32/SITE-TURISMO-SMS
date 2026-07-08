(function (window, document) {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    var element = byId(id);
    if (element) element.textContent = value;
  }

  function stringify(value) {
    return JSON.stringify(value, null, 2);
  }

  function renderResult(result) {
    result = result || {};
    setText("cmsDebugSource", result.source || "-");
    setText("cmsDebugCount", String(result.count || 0));
    setText("cmsDebugStatus", result.error ? "Fallback" : "Leitura concluida");
    setText("cmsDebugError", result.error ? stringify(result.error) : "Nenhum erro retornado.");
    setText("cmsDebugSample", stringify((result.items || []).slice(0, 5)));
  }

  function setBusy(isBusy) {
    var button = byId("cmsDebugRun");
    if (!button) return;
    button.disabled = isBusy;
    button.textContent = isBusy ? "Testando..." : "Testar leitura CMS";
  }

  async function runTest() {
    if (!window.CMSPublicEstablishmentsAdapter) {
      renderResult({
        source: "fallback",
        count: 0,
        error: {
          code: "adapter-missing",
          message: "Adapter nao carregado."
        }
      });
      return;
    }

    setBusy(true);
    setText("cmsDebugStatus", "Consultando cms_establishments...");

    try {
      var result = await window.CMSPublicEstablishmentsAdapter.readPublished({
        debug: true,
        force: true,
        timeoutMs: 8000
      });
      renderResult(result);
    } catch (error) {
      renderResult(window.CMSPublicEstablishmentsAdapter.makeFallback(error));
    } finally {
      setBusy(false);
    }
  }

  function bind() {
    var button = byId("cmsDebugRun");
    if (button) button.addEventListener("click", runTest);
    setText("cmsDebugStatus", "Pronto para teste manual.");
    setText("cmsDebugSource", "-");
    setText("cmsDebugCount", "0");
    setText("cmsDebugError", "Nenhum teste executado.");
    setText("cmsDebugSample", "[]");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})(window, document);
