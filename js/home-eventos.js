/**
 * home-eventos.js
 * Grade "Acontece em breve" da home.
 * JSON estático primeiro; Firebase somente como enriquecimento opcional.
 * Extraído no R1 sem alteração de comportamento.
 */
(function () {
    function requireEventOccurrenceAdapter() {
        const adapter = window.EventOccurrenceAdapter;
        const runtimeSources = adapter && adapter.RUNTIME_SOURCES;
        if (
            !adapter ||
            typeof adapter.normalizeEventOccurrence !== 'function' ||
            !runtimeSources ||
            typeof runtimeSources.ANNUAL_STATIC !== 'string' ||
            typeof runtimeSources.FIRESTORE_APPROVED !== 'string'
        ) {
            throw new Error('[home-eventos] EventOccurrenceAdapter ausente ou inválido');
        }
        return adapter;
    }

    // Função para carregar próximos eventos (Firebase + JSON estático)
    async function carregarProximosEventos() {
        const container = document.getElementById('proximosEventosHome');
        if (!container) return;

        let eventAdapter;
        try {
            eventAdapter = requireEventOccurrenceAdapter();
        } catch (dependencyError) {
            console.error(dependencyError.message);
            renderFallback();
            return;
        }

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const meses = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        function esc(value) {
            return String(value || '').replace(/[&<>"']/g, function(ch) {
                return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch];
            });
        }

        function normalizarEventoHome(rawEvent, runtimeSource, sourceId) {
            const normalized = eventAdapter.normalizeEventOccurrence(rawEvent, { runtimeSource, sourceId });
            if (!normalized) return null;
            return Object.assign(normalized, {
                category: normalized.category || (
                    runtimeSource === eventAdapter.RUNTIME_SOURCES.FIRESTORE_APPROVED ? 'cultural' : ''
                ),
                recurrence: runtimeSource === eventAdapter.RUNTIME_SOURCES.FIRESTORE_APPROVED
                    ? false
                    : normalized.recurrence,
                mapUrl: rawEvent.mapUrl || rawEvent.mapaUrl || '',
                url: runtimeSource === eventAdapter.RUNTIME_SOURCES.ANNUAL_STATIC ? rawEvent.url || '' : ''
            });
        }

        function deduplicarEventos(eventos) {
            const identidades = new Set();
            const assinaturas = new Set();
            return (eventos || []).filter(evento => {
                const identidade = evento.runtimeId;
                const assinatura = evento.metadata && evento.metadata.exactSignature;
                if (identidade && identidades.has(identidade)) return false;
                if (assinatura && assinaturas.has(assinatura)) return false;
                if (identidade) identidades.add(identidade);
                if (assinatura) assinaturas.add(assinatura);
                return true;
            });
        }

        function obterDataEvento(evento) {
            const dataStr = evento && evento.date || '';
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) return null;
            const data = new Date(dataStr + 'T12:00:00');
            return Number.isNaN(data.getTime()) ? null : data;
        }

        function eventoComVinculo(evento) {
            return Boolean(evento && evento.locationBinding && (
                evento.locationBinding.type === 'CANONICAL_REFERENCE' ||
                evento.metadata && evento.metadata.legacyReferenceCandidate
            ));
        }

        function renderFallback() {
            container.innerHTML = `
                <div class="home-events-fallback">
                    <strong data-lang-key="home-events-fallback-title">Consulte as experiências recorrentes</strong>
                    <p data-lang-key="home-events-fallback-desc">Não há eventos futuros com data segura para destacar agora. Veja as feiras e experiências conhecidas abaixo ou abra o calendário completo.</p>
                    <a href="/eventos" data-lang-key="btn-ver-calendario">Ver calendário completo</a>
                </div>
            `;
            if (window.applyTranslations) {
                window.applyTranslations(localStorage.getItem('sms-lang') || 'pt');
            }
        }

        function renderEventos(eventos) {
            const ordenarPorData = (a, b) => {
                const diff = a._dataObj - b._dataObj;
                if (diff !== 0) return diff;
                return Number(eventoComVinculo(b)) - Number(eventoComVinculo(a));
            };

            const base = deduplicarEventos(eventos)
                .map(evento => Object.assign({}, evento, { _dataObj: obterDataEvento(evento) }))
                .filter(evento => evento._dataObj && evento._dataObj >= hoje && evento.publication === true)
                .sort(ordenarPorData);

            // Prioriza eventos únicos; recorrentes só preenchem vagas restantes
            const unicos = base.filter(evento => evento.recurrence !== true);
            const recorrentes = base.filter(evento => evento.recurrence === true);
            const filtrados = [...unicos, ...recorrentes]
                .slice(0, 4)
                .sort(ordenarPorData);

            if (!filtrados.length) {
                renderFallback();
                return;
            }

            container.innerHTML = filtrados.map(evento => {
                const titulo = esc(evento.title || 'Evento');
                const data = evento._dataObj;
                const dia = data.getDate();
                const mes = meses[data.getMonth() + 1];
                const diaSemana = diasSemana[data.getDay()];
                const categoria = esc(evento.category || 'Evento');
                const horario = esc(evento.time || '');
                const local = esc(evento.rawLocationText || '');
                const identidade = esc(evento.runtimeId);
                const mapUrl = evento.mapUrl || evento.mapaUrl || '';
                const detalheUrl = mapUrl || evento.url || '/eventos';
                const cta = mapUrl ? 'Abrir no mapa' : 'Ver detalhes';

                return `
                    <article class="home-event-card" data-event-id="${identidade}">
                        <div class="home-event-date" aria-label="${dia} de ${mes}">
                            <strong>${dia}</strong>
                            <span>${mes}</span>
                        </div>
                        <div class="home-event-body">
                            <span class="home-event-badge">${categoria}</span>
                            <h3>${titulo}</h3>
                            <p>${esc(diaSemana)}${horario ? ' · ' + horario : ''}</p>
                            ${local ? '<p class="home-event-place">' + local + '</p>' : ''}
                            <a href="${esc(detalheUrl)}" class="home-event-link">${esc(cta)}</a>
                        </div>
                    </article>
                `;
            }).join('');
        }

        try {
            // 1. Carregar JSON estático primeiro (rápido)
            const jsonRes = await fetch('eventos-2026.json');
            const jsonEventos = (await jsonRes.json())
                .map(evento => normalizarEventoHome(
                    evento,
                    eventAdapter && eventAdapter.RUNTIME_SOURCES.ANNUAL_STATIC,
                    evento.id
                ))
                .filter(Boolean);
            renderEventos(jsonEventos); // exibe imediatamente

            // 2. Tentar enriquecer com Firebase
            try {
                const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
                const { getFirestore, collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                const { initModularAppCheck } = await import('./firebase-app-check.js');
                const firebaseConfig = window.CONFIG && window.CONFIG.firebase;
                if (!firebaseConfig) throw new Error('CONFIG.firebase ausente');
                const existingApp = getApps().find(a => a.name === 'home-eventos');
                const app = existingApp || initializeApp(firebaseConfig, 'home-eventos');
                await initModularAppCheck(app);
                const db = getFirestore(app);
                const snap = await getDocs(collection(db, 'eventos_aprovados'));
                if (!snap.empty) {
                    const fbEventos = snap.docs.map((d) => {
                        const e = d.data();
                        const documentId = String(d.id);
                        return normalizarEventoHome(
                            e,
                            eventAdapter.RUNTIME_SOURCES.FIRESTORE_APPROVED,
                            documentId
                        );
                    }).filter(evento => evento && evento.publication === true);
                    renderEventos([...jsonEventos, ...fbEventos]); // re-renderiza com Firebase
                    console.log(`✅ Home: ${fbEventos.length} eventos do Firebase mesclados`);
                }
            } catch (fbErr) {
                console.warn('Firebase indisponível na home:', fbErr.message);
            }
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
            renderFallback();
        }
    }

    document.addEventListener('DOMContentLoaded', carregarProximosEventos);
})();
