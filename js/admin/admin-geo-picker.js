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

    function decimals(input) {
        var raw = String(input && input.value || "").trim();
        var dot = raw.indexOf(".");
        return dot === -1 ? 0 : raw.length - dot - 1;
    }

    function formatKm(km) {
        return km < 1 ? Math.round(km * 1000) + " m" : km.toFixed(1).replace(".", ",") + " km";
    }

    /**
     * Valida o par lat/lng do formulário.
     * errors   → impedem salvar (campo recebe setCustomValidity)
     * warnings → não impedem, mas aparecem em destaque
     */
    function validatePoint(fields, reference, neighbors) {
        var result = { errors: [], warnings: [], swap: null, point: null };
        var latIn = fields.lat;
        var lngIn = fields.lng;
        var latBad = latIn && latIn.validity && latIn.validity.badInput;
        var lngBad = lngIn && lngIn.validity && lngIn.validity.badInput;
        var lat = readNumber(latIn);
        var lng = readNumber(lngIn);
        if (latBad || lngBad) {
            result.errors.push("Use somente números com ponto decimal, por exemplo -25.874123.");
            return result;
        }
        if (lat == null && lng == null) return result;
        if (lat == null || lng == null) {
            result.errors.push("Preencha latitude e longitude juntas (ou deixe as duas vazias).");
            return result;
        }
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            result.errors.push("Fora dos limites possíveis: latitude vai de -90 a 90 e longitude de -180 a 180.");
            return result;
        }
        if (lat === 0 && lng === 0) {
            result.errors.push("0, 0 não é uma localização real (fica no oceano Atlântico).");
            return result;
        }
        var radius = reference.raioKm || 45;
        var point = { lat: lat, lng: lng };
        var km = distanceKm(reference, point);
        if (km > radius) {
            var swapped = { lat: lng, lng: lat };
            var flipped = { lat: -Math.abs(lat), lng: -Math.abs(lng) };
            if (Math.abs(lng) <= 90 && distanceKm(reference, swapped) <= radius) {
                result.errors.push("Latitude e longitude parecem invertidas.");
                result.swap = swapped;
                return result;
            }
            if ((lat > 0 || lng > 0) && distanceKm(reference, flipped) <= radius) {
                result.errors.push("Falta o sinal de menos: em São Mateus do Sul latitude e longitude são negativas.");
                result.swap = flipped;
                return result;
            }
            result.warnings.push("Fora da região do município (" + formatKm(km) + " do centro). Confira se o endereço é mesmo aqui.");
        }
        result.point = point;
        var precision = Math.min(decimals(latIn), decimals(lngIn));
        if (precision < 4) {
            result.warnings.push("Pouca precisão (" + precision + " casa" + (precision === 1 ? "" : "s") + " decimal" + (precision === 1 ? "" : "is") + " ≈ " +
                (precision <= 2 ? "1 km" : "100 m") + " de erro). Use ao menos 5 casas ou ajuste o pin no mapa.");
        }
        if (distanceKm(DEFAULT_CENTER, point) < 0.03) {
            result.warnings.push("Ponto igual ao centro da cidade — costuma ser um valor provisório.");
        }
        (neighbors || []).some(function (other) {
            if (distanceKm(other, point) <= 0.015) {
                result.warnings.push("Mesmo ponto de “" + other.name + "”. Confira se a coordenada não foi copiada de outro cadastro.");
                return true;
            }
            return false;
        });
        return result;
    }

    function isVerifiedStatus(value) {
        var status = String(value || "").trim().toLowerCase();
        return status === "ok" || status === "verified" || status === "verificada";
    }

    function askConfirm(options) {
        if (window.AdminFeedback && typeof window.AdminFeedback.confirm === "function") return window.AdminFeedback.confirm(options);
        return Promise.resolve(window.confirm(options.title + "\n\n" + options.message));
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
            '</div>' +
            '<div class="geo-issues" data-geo-issues aria-live="polite"></div>';
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

        var issuesEl = q("[data-geo-issues]");
        var verifyBtn = q('[data-geo="verify"]');
        var neighbors = (fields.neighbors || []).filter(function (item) {
            return item && Number.isFinite(item.lat) && Number.isFinite(item.lng);
        });
        var lastCheck = { errors: [], warnings: [] };
        var demotedNotice = false;

        function renderIssues(check) {
            var items = check.errors.map(function (text) { return { tone: "bad", text: text }; })
                .concat(check.warnings.map(function (text) { return { tone: "warn", text: text }; }));
            if (demotedNotice) {
                items.push({ tone: "info", text: "O ponto foi movido, então a marcação “verificada” foi retirada. Confira no satélite e marque de novo se estiver certo." });
            }
            var html = items.length
                ? '<ul class="geo-issue-list">' + items.map(function (item) {
                    return '<li data-tone="' + item.tone + '">' + esc(item.text) + "</li>";
                }).join("") + "</ul>" +
                (check.swap ? '<button type="button" class="btn-secondary geo-fix-btn" data-geo="fix">Corrigir para ' +
                    esc(round6(check.swap.lat) + ", " + round6(check.swap.lng)) + "</button>" : "")
                : "";
            // Redesenhar só quando muda: o blur do campo dispara "change" no meio
            // do clique e trocaria o botão "Corrigir" antes de o clique chegar.
            if (issuesEl.getAttribute("data-html") === html) return;
            issuesEl.setAttribute("data-html", html);
            issuesEl.innerHTML = html;
        }

        function describe() {
            var check = validatePoint(fields, reference, neighbors);
            lastCheck = check;
            var message = check.errors[0] || "";
            if (fields.lat && typeof fields.lat.setCustomValidity === "function") fields.lat.setCustomValidity(message);
            if (fields.lng && typeof fields.lng.setCustomValidity === "function") fields.lng.setCustomValidity(message ? " " : "");
            [fields.lat, fields.lng].forEach(function (input) { if (input) input.setAttribute("aria-invalid", message ? "true" : "false"); });

            var point = current();
            var status = String(fields.coordStatus ? fields.coordStatus.value : "").trim().toLowerCase();
            if (check.errors.length) {
                statusEl.dataset.tone = "bad";
                statusEl.textContent = "Coordenadas inválidas";
                detailEl.textContent = "Corrija antes de salvar.";
            } else if (!point) {
                statusEl.dataset.tone = "bad";
                statusEl.textContent = "Sem coordenadas";
                detailEl.textContent = "Clique no mapa para posicionar o empreendimento.";
            } else {
                var km = distanceKm(reference, point);
                if (km > (reference.raioKm || 45)) {
                    statusEl.dataset.tone = "bad";
                    statusEl.textContent = "Fora da região do município";
                } else if (isVerifiedStatus(status)) {
                    statusEl.dataset.tone = "ok";
                    statusEl.textContent = "Verificada";
                } else if (status === "aproximada") {
                    statusEl.dataset.tone = "warn";
                    statusEl.textContent = "Aproximada";
                } else {
                    statusEl.dataset.tone = "neutral";
                    statusEl.textContent = "Não verificada";
                }
                detailEl.textContent = point.lat.toFixed(6) + ", " + point.lng.toFixed(6) + " · " + formatKm(km) + " do centro";
            }
            if (verifyBtn) {
                var canVerify = Boolean(point) && !check.errors.length && distanceKm(reference, point) <= (reference.raioKm || 45);
                verifyBtn.disabled = !canVerify || isVerifiedStatus(status);
                verifyBtn.textContent = isVerifiedStatus(status) ? "Verificada" : "Marcar como verificada";
            }
            renderIssues(check);
            markChanged();
        }

        // Mover o ponto nunca mantém o selo “verificada”: a conferência precisa
        // ser refeita por uma pessoa (botão “Marcar como verificada”).
        function demoteIfMoved() {
            if (!fields.coordStatus) return;
            var moved = (fields.lat && fields.lat.value !== original.lat) || (fields.lng && fields.lng.value !== original.lng);
            if (!moved && demotedNotice) {
                // Voltou exatamente ao ponto conferido: devolve o status original.
                setInput(fields.coordStatus, original.status);
                demotedNotice = false;
                return;
            }
            if (!moved || !isVerifiedStatus(fields.coordStatus.value)) return;
            setInput(fields.coordStatus, "");
            demotedNotice = true;
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
            demoteIfMoved();
            placeMarker(point, pan);
            describe();
        }

        function onFieldEdit(event) {
            demoteIfMoved();
            var check = validatePoint(fields, reference, neighbors);
            if (event && event.type === "change") placeMarker(check.errors.length ? null : current(), true);
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
            } else if (action === "fix" && lastCheck.swap) {
                writePoint(lastCheck.swap, true);
            } else if (action === "verify") {
                var target = current();
                if (!target || lastCheck.errors.length) {
                    detailEl.textContent = "Posicione um ponto válido antes de marcá-lo como verificado.";
                    return;
                }
                askConfirm({
                    title: "Marcar localização como verificada?",
                    message: "Confirme somente se você conferiu o ponto (de preferência na imagem de satélite) e ele está na entrada do local.",
                    details: lastCheck.warnings.length ? lastCheck.warnings : ["Coordenada: " + target.lat.toFixed(6) + ", " + target.lng.toFixed(6)],
                    confirmLabel: "Sim, conferi o ponto",
                    cancelLabel: "Ainda não"
                }).then(function (confirmed) {
                    if (!confirmed || destroyed) return;
                    setInput(fields.coordStatus, "ok");
                    demotedNotice = false;
                    describe();
                });
            } else if (action === "undo") {
                setInput(fields.lat, original.lat);
                setInput(fields.lng, original.lng);
                setInput(fields.coordStatus, original.status);
                demotedNotice = false;
                placeMarker(current(), true);
                describe();
            }
        }

        host.addEventListener("click", onTool);
        [fields.lat, fields.lng].forEach(function (input) {
            if (!input) return;
            input.addEventListener("change", onFieldEdit);
            input.addEventListener("input", onFieldEdit);
        });
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
                [fields.lat, fields.lng].forEach(function (input) {
                    if (!input) return;
                    input.removeEventListener("change", onFieldEdit);
                    input.removeEventListener("input", onFieldEdit);
                    if (typeof input.setCustomValidity === "function") input.setCustomValidity("");
                });
                if (fields.coordStatus) fields.coordStatus.removeEventListener("input", describe);
                if (map) { map.remove(); map = null; }
            }
        };
        return active;
    }

    window.AdminGeoPicker = {
        mount: mount,
        parseMapsUrl: parseMapsUrl,
        validatePoint: validatePoint,
        _distanceKm: distanceKm
    };
})();
