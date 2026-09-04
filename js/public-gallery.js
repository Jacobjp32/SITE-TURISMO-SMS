(function () {
    "use strict";

    var CATEGORY_META = {
        patrimonio: { id: "patrimonio", title: "🏛️ Patrimônio Histórico" },
        gastronomia: { id: "gastronomia-g", title: "🍽️ Gastronomia e Produtos Locais" },
        "arte-historia": { id: "arte", title: "🎨 Arte & História" },
        mascotes: { id: "mascotes", title: "🦊 Mascotes de São Mateus do Sul" }
    };

    function useLocalEmulator() {
        return (location.hostname === "localhost" || location.hostname === "127.0.0.1") && new URLSearchParams(location.search).get("emulator") === "1";
    }

    function getFirestore() {
        if (!useLocalEmulator()) {
            if (!window.firebase.apps.length) window.firebase.initializeApp(window.CONFIG.firebase);
            return window.firebase.firestore();
        }
        var config = Object.assign({}, window.CONFIG.firebase, {
            projectId: "demo-turismo-sms-admin-finalization",
            authDomain: "demo-turismo-sms-admin-finalization.firebaseapp.com",
            storageBucket: "demo-turismo-sms-admin-finalization.appspot.com"
        });
        if (!window.firebase.apps.length) window.firebase.initializeApp(config);
        var db = window.firebase.firestore();
        if (!window.__smsPublicCompatFirestoreEmulatorConnected) {
            db.settings({ host: "127.0.0.1:8080", ssl: false, experimentalForceLongPolling: true });
            window.__smsPublicCompatFirestoreEmulatorConnected = true;
        }
        return db;
    }

    function normalize(items) {
        return (Array.isArray(items) ? items : []).filter(function (item) {
            return item && item.published === true && item.mediaType === "image" && typeof item.url === "string" && item.url;
        }).sort(function (a, b) {
            return Number(a.displayOrder || 0) - Number(b.displayOrder || 0) || String(a.id || "").localeCompare(String(b.id || ""));
        });
    }

    function render(items) {
        var normalized = normalize(items);
        var firstStatic = document.querySelector("section.sec");
        if (!normalized.length || !firstStatic) return false;
        var root = document.createElement("div");
        root.id = "dynamic-gallery";
        Object.keys(CATEGORY_META).forEach(function (category) {
            var categoryItems = normalized.filter(function (item) { return item.category === category; });
            if (!categoryItems.length) return;
            var meta = CATEGORY_META[category];
            var section = document.createElement("section");
            section.className = "sec";
            section.id = meta.id;
            var title = document.createElement("h2");
            title.className = "sec-title";
            title.textContent = meta.title;
            var grid = document.createElement("div");
            grid.className = "grid";
            categoryItems.forEach(function (item) {
                var card = document.createElement("article");
                card.className = "card";
                card.tabIndex = 0;
                var image = document.createElement("img");
                image.src = item.url;
                image.alt = item.alt || item.caption || "";
                image.loading = "lazy";
                var heading = document.createElement("h3");
                heading.textContent = item.caption || item.alt || "Imagem da galeria";
                card.appendChild(image);
                card.appendChild(heading);
                var open = function () { if (typeof window.lbOpen === "function") window.lbOpen([{ src: item.url, title: heading.textContent, desc: "" }], 0); };
                card.addEventListener("click", open);
                card.addEventListener("keydown", function (event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
                grid.appendChild(card);
            });
            section.appendChild(title);
            section.appendChild(grid);
            root.appendChild(section);
        });
        if (!root.children.length) return false;
        firstStatic.parentNode.insertBefore(root, firstStatic);
        document.querySelectorAll("section.sec").forEach(function (section) { if (!root.contains(section)) section.hidden = true; });
        return true;
    }

    async function load() {
        try {
            if (!window.CONFIG || !window.CONFIG.firebase || !window.firebase || !window.firebase.firestore) return false;
            var snapshot = await getFirestore().collection("gallery_items").where("published", "==", true).get();
            return render(snapshot.docs.map(function (doc) { return Object.assign({ id: doc.id }, doc.data()); }));
        } catch (error) {
            return false;
        }
    }

    window.SMSPublicGallery = { normalize: normalize, render: render, load: load };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load, { once: true });
    else load();
})();
