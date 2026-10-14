/**
 * admin-geo-picker.js — verificador de localização do editor de empreendimentos
 * ---------------------------------------------------------------------------
 * Mostra o ponto atual em um mapa (base de ruas ou satélite) e permite ajustá-lo
 * arrastando o marcador ou clicando no mapa.
 *
 * Segurança dos dados: este componente SÓ preenche os campos do formulário
 * (latitude, longitude e status da coordenada). Nada é gravado aqui — a
 * gravação continua passando pelo fluxo de salvamento do módulo de
 * empreendimentos, com suas validações. “Desfazer” restaura os valores
 * carregados do documento.
 *
 * Leaflet é carregado sob demanda do cdnjs (já permitido pela CSP do painel).
 * IIFE, sem build step.
 */
(function () {
    "use strict";

    if (window.AdminGeoPicker) return;

    var LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    var DEFAULT_CENTER = { lat: -25.874, lng: -50.383 };
    var leafletPromise = null;
    var active = null;

    function loadLeaflet() {
        if (window.L && typeof window.L.map === "function") return Promise.resolve(window.L);
        if (leafletPromise) return leafletPromise;
        leafletPromise = new Promise(function (resolve, reject) {
            var script = document.createElement("script");
            script.src = LEAFLET_JS;
            script.async = true;
            script.onload = function () { window.L ? resolve(window.L) : reject(new Error("Leaflet indisponível.")); };
            script.onerror = function () { leafletPromise = null; reject(new Error("Falha ao carregar o mapa.")); };
            document.head.appendChild(script);
        });
        return leafletPromise;
    }

    function esc(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    function readNumber(input) {
        if (!input) return null;
        var raw = String(input.value || "").trim().replace(",", ".");
        if (!raw) return null;
        var n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }

    function round6(n) { return Math.round(n * 1e6) / 1e6; }

    function distanceKm(a, b) {
        var toRad = Math.PI / 180;
        var dLat = (b.lat - a.lat) * toRad;
        var dLng = (b.lng - a.lng) * toRad;
        var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * 6371 * Math.asin(Math.sqrt(x));
    }

    /**
     * Extrai coordenadas de links completos do Google Maps:
     *   …/@-25.87,-50.38,17z   …?q=-25.87,-50.38   …!3d-25.87!4d-50.38   …?ll=-25.87,-50.38
     * Links curtos (maps.app.goo.gl) não trazem coordenadas no texto.
     */
    function parseMapsUrl(url) {
        var text = String(url || "");
        try { text = decodeURIComponent(text); } catch (error) {}
        var patterns = [
            /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,
            /@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/,
            /[?&](?:q|query|ll|destination)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/
        ];
        for (var i = 0; i < patterns.length; i += 1) {
            var match = text.match(patterns[i]);
            if (match) {
                var lat = Number(match[1]);
                var lng = Number(match[2]);
                if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat: lat, lng: lng };
            }
        }
        return null;
    }

    function setInput(input, value) {
        if (!input) return;
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function template() {
        return '' +
            '<div class="geo-picker-head">' +
                '<span class="geo-picker-title"><svg class="ico" aria-hidden="true"><use href="#i-pin"/></svg>Verificar ponto no mapa</span>' +
                '<div class="geo-picker-tools" role="group" aria-label="Ferramentas do mapa">' +
                    '<button type="button" class="btn-secondary" data-geo="layer" aria-pressed="false">Satélite</button>' +
                    '<button type="button" class="btn-secondary" data-geo="maps">Usar link do Google Maps</button>' +
                    '<button type="button" class="btn-secondary" data-geo="center">Centralizar no ponto</button>' +
                    '<button type="button" class="btn-secondary" data-geo="verify">Marcar como verificada</button>' +
                    '<button type="button" class="btn-secondary" data-geo="undo" hidden>Desfazer ajuste</button>' +
                '</div>' +
            '</div>' +
            '<div class="geo-picker-map" data-geo-map role="application" aria-label="Mapa: clique ou arraste o marcador para ajustar a localização"></div>' +
            '<div class="geo-picker-foot">' +
                '<span class="geo-status" data-geo-status data-tone="neutral">Carregando mapa…</span>' +
                '<span data-geo-detail></span>' +
                '<span class="geo-picker-changed" data-geo-changed hidden>Ponto alterado — salve o empreendimento para aplicar.</span>' +
            '</div>';
    }

    function mount(host, fields) {
        if (!host) return null;
        if (active && typeof active.destroy === "function") active.destroy();
        host.hidden = false;
        host.innerHTML = template();

        var reference = (fields && fields.reference) || { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, raioKm: 45 };
        var original = {
            lat: fields.lat ? fields.lat.value : "",
            lng: fields.lng ? fields.lng.value : "",
            status: fields.coordStatus ? fields.coordStatus.value : ""
        };
        var q = function (selector) { return host.querySelector(selector); };
        var statusEl = q("[data-geo-status]");
        var detailEl = q("[data-geo-detail]");
        var changedEl = q("[data-geo-changed]");
        var undoBtn = q('[data-geo="undo"]');
        var layerBtn = q('[data-geo="layer"]');
        var map = null;
        var marker = null;
        var layers = {};
        var satellite = false;
        var destroyed = false;

        function current() {
            var lat = readNumber(fields.lat);
            var lng = readNumber(fields.lng);
            return lat == null || lng == null ? null : { lat: lat, lng: lng };
        }

        function markChanged() {
            var changed = (fields.lat && fields.lat.value !== original.lat) ||
                (fields.lng && fields.lng.value !== original.lng) ||
                (fields.coordStatus && fields.coordStatus.value !== original.status);
            changedEl.hidden = !changed;
            undoBtn.hidden = !changed;
        }

        function describe() {
            var point = current();
            var status = String(fields.coordStatus ? fields.coordStatus.value : "").trim().toLowerCase();
            if (!point) {
                statusEl.dataset.tone = "bad";
                statusEl.textContent = "Sem coordenadas";
                detailEl.textContent = "Clique no mapa para posicionar o empreendimento.";
            } else {
                var km = distanceKm(reference, point);
                var far = km > (reference.raioKm || 45);
                if (far) {
                    statusEl.dataset.tone = "bad";
                    statusEl.textContent = "Fora da região do município";
                } else if (status === "ok" || status === "verified" || status === "verificada") {
                    statusEl.dataset.tone = "ok";
                    statusEl.textContent = "Verificada";
                } else if (status === "aproximada") {
                    statusEl.dataset.tone = "warn";
                    statusEl.textContent = "Aproximada";
                } else {
                    statusEl.dataset.tone = "neutral";
                    statusEl.textContent = "Não verificada";
                }
                detailEl.textContent = point.lat.toFixed(6) + ", " + point.lng.toFixed(6) +
                    " · " + (km < 1 ? Math.round(km * 1000) + " m" : km.toFixed(1).replace(".", ",") + " km") + " do centro";
            }
            markChanged();
        }

        function placeMarker(point, pan) {
            if (!map || !window.L) return;
            if (!point) {
                if (marker) { map.removeLayer(marker); marker = null; }
                return;
            }
            if (!marker) {
                marker = window.L.marker([point.lat, point.lng], { draggable: true, keyboard: true, title: "Arraste para ajustar" }).addTo(map);
                marker.on("dragend", function () {
                    var p = marker.getLatLng();
                    writePoint({ lat: p.lat, lng: p.lng }, false);
                });
            } else {
                marker.setLatLng([point.lat, point.lng]);
            }
            if (pan) map.setView([point.lat, point.lng], Math.max(map.getZoom(), 16));
        }

        function writePoint(point, pan) {
            setInput(fields.lat, String(round6(point.lat)));
            setInput(fields.lng, String(round6(point.lng)));
            placeMarker(point, pan);
            describe();
        }

        function onFieldEdit() {
            placeMarker(current(), true);
            describe();
        }

        function onTool(event) {
            var button = event.target.closest("[data-geo]");
            if (!button) return;
            var action = button.getAttribute("data-geo");
            if (action === "layer" && map) {
                satellite = !satellite;
                map.removeLayer(satellite ? layers.streets : layers.satellite);
                (satellite ? layers.satellite : layers.streets).addTo(map);
                button.setAttribute("aria-pressed", satellite ? "true" : "false");
                button.textContent = satellite ? "Mapa de ruas" : "Satélite";
            } else if (action === "maps") {
                var parsed = parseMapsUrl(fields.mapsUrl ? fields.mapsUrl.value : "");
                if (parsed) {
                    writePoint(parsed, true);
                    detailEl.textContent += " · coordenadas lidas do link do Google Maps";
                } else {
                    detailEl.textContent = "O link não contém coordenadas (links curtos como maps.app.goo.gl não as expõem). Abra o link, copie a URL completa da barra de endereço e cole no campo Google Maps URL.";
                }
            } else if (action === "center") {
                var point = current();
                if (map) map.setView(point ? [point.lat, point.lng] : [reference.lat, reference.lng], point ? 17 : 12);
            } else if (action === "verify") {
                if (!current()) {
                    detailEl.textContent = "Posicione o ponto antes de marcá-lo como verificado.";
                    return;
                }
                setInput(fields.coordStatus, "ok");
                describe();
            } else if (action === "undo") {
                setInput(fields.lat, original.lat);
                setInput(fields.lng, original.lng);
                setInput(fields.coordStatus, original.status);
                placeMarker(current(), true);
                describe();
            }
        }

        host.addEventListener("click", onTool);
        [fields.lat, fields.lng].forEach(function (input) { if (input) input.addEventListener("change", onFieldEdit); });
        if (fields.coordStatus) fields.coordStatus.addEventListener("input", describe);

        loadLeaflet().then(function (L) {
            if (destroyed) return;
            var point = current();
            map = L.map(q("[data-geo-map]"), { scrollWheelZoom: false, zoomControl: true })
                .setView(point ? [point.lat, point.lng] : [reference.lat, reference.lng], point ? 16 : 12);
            layers.streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: "&copy; colaboradores do OpenStreetMap"
            }).addTo(map);
            layers.satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                maxZoom: 19,
                attribution: "Imagens &copy; Esri, Maxar, Earthstar Geographics"
            });
            L.circle([reference.lat, reference.lng], {
                radius: (reference.raioKm || 45) * 1000,
                color: "#135c43", weight: 1, opacity: 0.35, fill: false, dashArray: "4 6", interactive: false
            }).addTo(map);
            map.on("click", function (e) { writePoint({ lat: e.latlng.lat, lng: e.latlng.lng }, false); });
            placeMarker(point, false);
            describe();
            // O editor costuma abrir com rolagem animada; recalcula o tamanho depois.
            window.setTimeout(function () { if (map) map.invalidateSize(); }, 350);
        }).catch(function (error) {
            console.warn("[admin-geo-picker] mapa indisponível.", error);
            statusEl.dataset.tone = "neutral";
            statusEl.textContent = "Mapa indisponível";
            detailEl.textContent = "Os campos de latitude e longitude continuam editáveis normalmente.";
            q("[data-geo-map]").hidden = true;
        });

        active = {
            destroy: function () {
                destroyed = true;
                host.removeEventListener("click", onTool);
                [fields.lat, fields.lng].forEach(function (input) { if (input) input.removeEventListener("change", onFieldEdit); });
                if (fields.coordStatus) fields.coordStatus.removeEventListener("input", describe);
                if (map) { map.remove(); map = null; }
            }
        };
        return active;
    }

    window.AdminGeoPicker = {
        mount: mount,
        parseMapsUrl: parseMapsUrl,
        _distanceKm: distanceKm
    };
})();
