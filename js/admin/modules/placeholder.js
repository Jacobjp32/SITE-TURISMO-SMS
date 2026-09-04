/**
 * Compatibilidade da antiga factory provisória.
 * Nenhuma seção visível é registrada ou renderizada por este arquivo.
 */
(function () {
    "use strict";

    if (window.AdminPlaceholderModule) return;

    window.AdminPlaceholderModule = {
        create: function () { return null; },
        register: function () { return null; },
        renderAll: function () {},
        list: function () { return []; }
    };
})();
