(function () {
  "use strict";

  window.SITE_META = window.SITE_META || {
    version: "Turismo SMS 2.0",
    updatedAt: "2026-10-13T16:04:01-03:00",
    environment: "production"
  };

  // V2.1: versão interna do sistema e data de publicação são metadados de bastidor e não
  // descrevem o estado do conteúdo para o visitante. Continuam disponíveis em
  // window.SITE_META (Admin e scripts), mas não são mais exibidos nas páginas públicas.
  // Marcação legada eventualmente presente no rodapé é removida.
  function renderSiteMeta() {
    document.querySelectorAll(".footer-system-status").forEach(function (status) {
      if (status.parentNode) status.parentNode.removeChild(status);
    });
  }

  window.renderSiteMeta = renderSiteMeta;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderSiteMeta);
  } else {
    renderSiteMeta();
  }

})();
