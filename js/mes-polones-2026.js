(function () {
  "use strict";

  var TIME_ZONE = "America/Sao_Paulo";

  function localDateKey(date) {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(date);
    } catch (_) {
      return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
    }
  }

  function updateEventStatuses() {
    var events = Array.prototype.slice.call(document.querySelectorAll("[data-event-start]"));
    if (!events.length) return;

    var now = new Date();
    var todayKey = localDateKey(now);
    var nextEvent = events.find(function (event) {
      var start = new Date(event.getAttribute("data-event-start"));
      return localDateKey(start) > todayKey;
    });

    events.forEach(function (event) {
      var start = new Date(event.getAttribute("data-event-start"));
      var eventKey = localDateKey(start);
      var status = "planned";
      var label = "Programado";

      if (eventKey < todayKey) {
        status = "done";
        label = "Realizado";
      } else if (eventKey === todayKey) {
        status = "today";
        label = "Acontece hoje";
      } else if (event === nextEvent) {
        status = "next";
        label = "Próximo evento";
      }

      event.setAttribute("data-event-status", status);
      var badge = event.querySelector(".mp-event-status");
      if (badge) badge.textContent = label;
    });
  }

  function setupLightbox() {
    var lightbox = document.querySelector("[data-program-lightbox]");
    var triggers = document.querySelectorAll("[data-program-poster-trigger]");
    if (!lightbox || !triggers.length) return;

    var closeButton = lightbox.querySelector("[data-program-lightbox-close]");
    var lightboxImage = lightbox.querySelector("[data-program-lightbox-image]");
    var previousFocus = null;

    function focusableElements() {
      return Array.prototype.slice.call(lightbox.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"));
    }

    function openLightbox(event) {
      event.preventDefault();
      previousFocus = event.currentTarget;
      if (lightboxImage && !lightboxImage.getAttribute("src")) {
        lightboxImage.setAttribute("src", lightboxImage.getAttribute("data-src"));
      }
      lightbox.hidden = false;
      document.body.classList.add("no-scroll");
      if (closeButton) closeButton.focus();
    }

    function closeLightbox() {
      lightbox.hidden = true;
      document.body.classList.remove("no-scroll");
      if (previousFocus) previousFocus.focus();
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", openLightbox);
    });

    if (closeButton) closeButton.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (event) {
      if (lightbox.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key !== "Tab") return;

      var focusable = focusableElements();
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function init() {
    updateEventStatuses();
    setupLightbox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
