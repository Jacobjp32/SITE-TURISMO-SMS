(function () {
  "use strict";

  window.SITE_META = window.SITE_META || {
    version: "Turismo SMS 1.0",
    updatedAt: "2026-06-08T15:06:58-03:00",
    environment: "production"
  };

  function getLang() {
    var lang = document.documentElement.getAttribute("lang") || "";
    try {
      lang = localStorage.getItem("sms-lang") || lang;
    } catch (_) {}
    return String(lang || "pt-BR").toLowerCase();
  }

  function formatUpdatedAt(value) {
    if (!value) return "";
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    var lang = getLang();
    var day = String(date.getDate()).padStart(2, "0");
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var year = date.getFullYear();
    var hour = String(date.getHours()).padStart(2, "0");
    var minute = String(date.getMinutes()).padStart(2, "0");

    if (lang.indexOf("en") === 0) {
      try {
        var monthName = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
        return monthName + " " + Number(day) + ", " + year + " " + hour + ":" + minute;
      } catch (_) {
        return String(value);
      }
    }

    return day + "/" + month + "/" + year + " " + hour + ":" + minute;
  }

  function getMetaText() {
    var meta = window.SITE_META || {};
    var version = meta.version || "Turismo SMS 1.0";
    var updatedAt = formatUpdatedAt(meta.updatedAt);
    return {
      versionLabel: "Versão do Sistema: " + version,
      updatedLabel: updatedAt ? "Portal atualizado em: " + updatedAt : ""
    };
  }

  function ensureFooter() {
    var footer = document.querySelector("footer");
    if (footer) return footer;

    footer = document.createElement("footer");
    footer.className = "footer site-meta-footer";
    footer.id = "footer";
    footer.style.textAlign = "center";
    footer.style.padding = "1.25rem";
    footer.style.background = "#0a3d2e";
    footer.style.color = "rgba(255,255,255,0.78)";
    document.body.appendChild(footer);
    return footer;
  }

  function ensureSystemStatus(footer) {
    var status = footer.querySelector(".footer-system-status");
    if (status) return status;

    status = document.createElement("div");
    status.className = "footer-system-status";
    status.setAttribute("aria-label", "Informações do sistema");
    status.style.marginTop = "1rem";
    status.style.fontSize = "0.75rem";
    status.style.opacity = "0.75";
    status.style.display = "flex";
    status.style.flexWrap = "wrap";
    status.style.justifyContent = "center";
    status.style.gap = "0.5rem 1rem";
    footer.appendChild(status);
    return status;
  }

  function renderSiteMeta() {
    var text = getMetaText();
    var footer = ensureFooter();
    var status = ensureSystemStatus(footer);

    if (!status.querySelector("[data-site-meta-version]")) {
      var version = document.createElement("span");
      version.setAttribute("data-site-meta-version", "");
      status.appendChild(version);
    }

    if (!status.querySelector("[data-site-meta-updated]") && text.updatedLabel) {
      var updated = document.createElement("span");
      updated.setAttribute("data-site-meta-updated", "");
      status.appendChild(updated);
    }

    document.querySelectorAll("[data-site-meta-version]").forEach(function (element) {
      element.textContent = text.versionLabel;
    });
    document.querySelectorAll("[data-site-meta-updated]").forEach(function (element) {
      element.textContent = text.updatedLabel;
    });
  }

  window.renderSiteMeta = renderSiteMeta;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderSiteMeta);
  } else {
    renderSiteMeta();
  }

  window.setTimeout(renderSiteMeta, 500);
  window.setTimeout(renderSiteMeta, 1500);
})();
