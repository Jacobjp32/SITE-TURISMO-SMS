/**
 * home-eventos.js
 * Grade "Acontece em breve" da home.
 * JSON estático primeiro; Firebase somente como enriquecimento opcional.
 * Extraído no R1 sem alteração de comportamento.
 */
(function () {
    // Função para carregar próximos eventos (Firebase + JSON estático)
    async function carregarProximosEventos() {
        const container = document.getElementById('proximosEventosHome');
        if (!container) return;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const meses = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const statusBloqueados = new Set(['pendente', 'pending', 'rejeitado', 'rejected', 'rascunho', 'draft']);

        function esc(value) {
            return String(value || '').replace(/[&<>"']/g, function(ch) {
                return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch];
            });
        }

        function normalizarTexto(value) {
            return String(value || '').trim().toLowerCase();
        }

        function statusPublico(evento) {
            const status = normalizarTexto(evento && evento.status);
            if (statusBloqueados.has(status)) return false;
            return !status || status === 'aprovado' || status === 'approved' || evento.publicado === true || evento._fonte === 'static';
        }

        function normalizarData(value) {
            if (!value) return '';
            if (typeof value === 'object' && typeof value.toDate === 'function') {
                return value.toDate().toISOString().slice(0, 10);
            }
            if (typeof value === 'object' && typeof value.seconds === 'number') {
                return new Date(value.seconds * 1000).toISOString().slice(0, 10);
            }
            return String(value).slice(0, 10);
        }

        function obterDataEvento(evento) {
            const dataStr = normalizarData(evento && (evento.data || evento.dataInicio || evento.startDate || evento.inicio));
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) return null;
            const data = new Date(dataStr + 'T12:00:00');
            return Number.isNaN(data.getTime()) ? null : data;
        }

        function eventoComVinculo(evento) {
            return Boolean(evento && (
                evento.estabelecimentoId ||
                evento.empreendimentoId ||
                evento.localId ||
                evento.mapaId ||
                evento.placeId ||
                evento.businessId
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

            const base = (eventos || [])
                .map(evento => Object.assign({}, evento, { _dataObj: obterDataEvento(evento) }))
                .filter(evento => evento._dataObj && evento._dataObj >= hoje && statusPublico(evento))
                .sort(ordenarPorData);

            // Prioriza eventos únicos; recorrentes só preenchem vagas restantes
            const unicos = base.filter(evento => evento.recorrente !== true);
            const recorrentes = base.filter(evento => evento.recorrente === true);
            const filtrados = [...unicos, ...recorrentes]
                .slice(0, 4)
                .sort(ordenarPorData);

            if (!filtrados.length) {
                renderFallback();
                return;
            }

            container.innerHTML = filtrados.map(evento => {
                const titulo = esc(evento.titulo || evento.nome || 'Evento');
                const data = evento._dataObj;
                const dia = data.getDate();
                const mes = meses[data.getMonth() + 1];
                const diaSemana = diasSemana[data.getDay()];
                const categoria = esc(evento.categoria || 'Evento');
                const horario = esc(evento.horario || evento.hora || '');
                const local = esc(evento.local || evento.localNome || evento.venue || '');
                const mapUrl = evento.mapUrl || evento.mapaUrl || '';
                const detalheUrl = mapUrl || evento.url || '/eventos';
                const cta = mapUrl ? 'Abrir no mapa' : 'Ver detalhes';

                return `
                    <article class="home-event-card">
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
            const jsonEventos = (await jsonRes.json()).map(evento => Object.assign({ _fonte: 'static' }, evento));
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
                    const fbEventos = snap.docs.map((d, i) => {
                        const e = d.data();
                        return {
                            id: 90000 + i,
                            titulo: e.nome || e.titulo || 'Evento',
                            data: normalizarData(e.data || e.dataInicio || e.startDate || e.inicio),
                            horario: e.horario || e.hora || '',
                            local: e.local || e.localNome || e.venue || '',
                            categoria: e.categoria || 'cultural',
                            descricao: e.descricao || '',
                            destaque: e.destaque || false,
                            recorrente: false,
                            status: e.status,
                            publicado: e.publicado,
                            estabelecimentoId: e.estabelecimentoId,
                            empreendimentoId: e.empreendimentoId,
                            localId: e.localId,
                            mapaId: e.mapaId,
                            mapUrl: e.mapUrl || e.mapaUrl || '',
                            _fonte: 'firebase'
                        };
                    }).filter(statusPublico);
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
