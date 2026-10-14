/**
 * ============================================================
 * CAPIVARENSE — anfitriã digital do Portal de Turismo de São Mateus do Sul
 * (substitui o painel de atalhos + accordion do Bloco S12/S16)
 * ------------------------------------------------------------
 * NÃO é chatbot, NÃO usa IA, NÃO chama API externa paga.
 * É um guia contextual: lê a página em que o visitante está, oferece
 * uma sugestão curta, seis "intenções" de visita que levam a páginas
 * e filtros reais do mapa, e os próximos itens da agenda oficial
 * (eventos-2026.json, carregado só quando o guia é aberto).
 *
 * Não inventa dados: todo destino é uma página/filtro existente do portal
 * e a agenda vem do mesmo arquivo usado pela home e pela página de eventos.
 *
 * Contratos preservados do componente anterior:
 *  · raiz #sms-mascot e classes .sms-mascot-launcher / .sms-mascot-reopen
 *    (o cabeçalho Recortes posiciona a capivara no celular por elas);
 *  · window.SMSMascotConfig + documento site_config/mascot (liga/desliga);
 *  · preferência "sms-mascot-hidden" (visitante escondeu o guia);
 *  · inicialização em idle, sem competir com o LCP; falha em silêncio.
 * i18n: textos próprios em PT/EN/ES/PL, re-renderizados no evento
 * translationsApplied (não usa data-lang-key: applyTranslations troca
 * innerHTML e destruiria a marcação interna).
 * ============================================================ */
(function () {
    'use strict';

    if (window.__smsMascotLoaded || document.getElementById('sms-mascot')) return;
    window.__smsMascotLoaded = true;

    var STORAGE_HIDDEN = 'sms-mascot-hidden';
    var STORAGE_TEASER = 'sms-mascot-teaser';
    var MASCOT_IMG = '/images/mascotes/MASCOTE_CAPIVARA_PINHAO.webp';
    var EVENTS_URL = '/eventos-2026.json';
    var PHONE_HREF = 'tel:+554235324163';
    var PHONE_LABEL = '(42) 3532-4163';
    var MOBILE = window.matchMedia ? window.matchMedia('(max-width: 768px)') : { matches: false };
    var REDUCED = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

    // ── Liga/desliga pelo CMS (inalterado) ──
    function resolveMascotEnabled(config) {
        return !config || config.enabled !== false;
    }

    function useLocalEmulator() {
        return (location.hostname === 'localhost' || location.hostname === '127.0.0.1') && new URLSearchParams(location.search).get('emulator') === '1';
    }

    async function readMascotConfig() {
        if (!window.CONFIG || !window.CONFIG.firebase) return null;
        try {
            if (useLocalEmulator()) {
                var localResponse = await fetch('http://localhost:8080/v1/projects/demo-turismo-sms-admin-finalization/databases/(default)/documents/site_config/mascot');
                if (localResponse.status === 404) return null;
                if (!localResponse.ok) throw new Error('Firestore Emulator respondeu ' + localResponse.status + '.');
                var localFields = (await localResponse.json()).fields || {};
                return { enabled: localFields.enabled && localFields.enabled.booleanValue };
            }
            if (window.firebase && window.firebase.firestore) {
                if (!window.firebase.apps.length) window.firebase.initializeApp(window.CONFIG.firebase);
                var compatDb = window.firebase.firestore();
                var compatSnapshot = await compatDb.collection('site_config').doc('mascot').get();
                return compatSnapshot.exists ? compatSnapshot.data() : null;
            }
            var appModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            var firestoreModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            var app = appModule.getApps().find(function (candidate) { return candidate.name === 'sms-public-site-config'; }) || appModule.initializeApp(window.CONFIG.firebase, 'sms-public-site-config');
            var db = firestoreModule.getFirestore(app);
            var snapshot = await firestoreModule.getDoc(firestoreModule.doc(db, 'site_config', 'mascot'));
            return snapshot.exists() ? snapshot.data() : null;
        } catch (error) {
            return null;
        }
    }

    window.SMSMascotConfig = { resolveEnabled: resolveMascotEnabled };

    // ── Destinos reais do portal ──
    var URL = {
        mapa: '/mapa-turistico',
        atrativos: '/mapa-turistico?grupo=pontos-turisticos',
        natureza: '/mapa-turistico?categoria=natureza',
        historia: '/mapa-turistico?categoria=historia',
        comerMapa: '/mapa-turistico?categoria=gastronomia',
        dormirMapa: '/mapa-turistico?categoria=hospedagem',
        eventosMapa: '/mapa-turistico?categoria=eventos',
        roteiros: '/mapa-turistico?grupo=roteiros',
        sabores: '/sabores',
        feiras: '/sabores#feiras',
        polonesa: '/sabores#polonesa',
        ondeFicar: '/onde-ficar',
        agenda: '/eventos/',
        noticias: '/noticias',
        polones: '/mes-polones'
    };

    // ── Textos (a voz da Capivarense) ──
    var STR = {
        pt: {
            locale: 'pt-BR',
            name: 'Capivarense',
            role: 'sua anfitriã em São Mateus do Sul',
            open: 'Abrir a Capivarense, guia de turismo',
            reopen: 'Chamar a Capivarense de volta',
            close: 'Fechar a Capivarense',
            hide: 'Esconder a Capivarense',
            hello: { morning: 'Bom dia!', afternoon: 'Boa tarde!', evening: 'Boa noite!' },
            say: {
                home: 'Conheço os cantinhos da cidade. Por onde quer começar?',
                mapa: 'Toque num pin para abrir a ficha do lugar — ou escolha um roteiro pronto.',
                sabores: 'Aqui é terra de pierogi e chimarrão. Quer saber das feiras?',
                ondeficar: 'Compare as hospedagens no mapa e veja o que fica por perto.',
                eventos: 'Separei o que vem por aí nos próximos dias.',
                noticias: 'Além das notícias, a agenda mostra o que acontece nesta semana.',
                oquefazer: 'Os passeios agora moram no mapa. Eu te levo até eles.',
                local: 'Gostou deste lugar? Dá para ver o que há por perto no mapa.',
                polones: 'A herança polonesa está na mesa, na fé e nas festas da cidade.',
                'default': 'Posso te ajudar a explorar São Mateus do Sul.'
            },
            suggest: 'Sugestão',
            ask: 'O que você procura?',
            back: 'Voltar',
            week: 'Nos próximos dias',
            weekAll: 'Agenda completa',
            weekEmpty: 'Sem datas próximas nesta lista — a agenda completa tem o calendário do ano.',
            weekLoading: 'Conferindo a agenda…',
            today: 'Hoje',
            tomorrow: 'Amanhã',
            every: 'toda semana',
            time: { range: '{a} às {b}', from: 'a partir das {a}', at: '{a}', tbc: 'horário a confirmar', allDay: 'o dia todo' },
            search: 'Procurar no portal',
            call: 'Ligar para Cultura e Turismo',
            alone: 'Prefere explorar por conta própria?',
            peekTitle: 'Oi! Eu sou a Capivarense.',
            peekText: 'Quer uma dica para o seu passeio?',
            peekClose: 'Dispensar',
            ctx: {
                home: [['Abrir o mapa', URL.mapa], ['Roteiros prontos', URL.roteiros]],
                mapa: [['Roteiros prontos', URL.roteiros], ['Só onde comer', URL.comerMapa]],
                sabores: [['Feiras da semana', URL.feiras], ['Restaurantes no mapa', URL.comerMapa]],
                ondeficar: [['Hospedagens no mapa', URL.dormirMapa], ['O que ver por perto', URL.atrativos]],
                eventos: [['Eventos no mapa', URL.eventosMapa]],
                noticias: [['Ver a agenda', URL.agenda]],
                oquefazer: [['Atrativos no mapa', URL.atrativos], ['Roteiros prontos', URL.roteiros]],
                local: [['Voltar ao mapa', URL.mapa], ['Comer por perto', URL.comerMapa]],
                polones: [['Sabores poloneses', URL.polonesa], ['Ver a agenda', URL.agenda]],
                'default': [['Abrir o mapa', URL.mapa], ['Ver a agenda', URL.agenda]]
            },
            intents: {
                ver: { label: 'Atrações', say: 'Igrejas pintadas à mão, o Rio Iguaçu e a memória polonesa: cada pin do mapa tem ficha, foto e rota.', links: [['Atrativos no mapa', URL.atrativos], ['Natureza', URL.natureza], ['Herança polonesa', URL.polones]] },
                comer: { label: 'Onde comer', say: 'Pierogi, erva-mate e feira de rua. O caderno de sabores reúne receitas, feiras e restaurantes.', links: [['Sabores locais', URL.sabores], ['Feiras', URL.feiras], ['Restaurantes no mapa', URL.comerMapa]] },
                ficar: { label: 'Onde ficar', say: 'Hotéis no centro e pousadas rurais. Veja no mapa o que fica perto de cada uma.', links: [['Onde ficar', URL.ondeFicar], ['Hospedagens no mapa', URL.dormirMapa]] },
                rota: { label: 'Roteiros', say: 'Prefere um caminho pronto? A Rota Polonesa e outros percursos já estão traçados no mapa.', links: [['Ver roteiros', URL.roteiros]] },
                familia: { label: 'Em família', say: 'Para um dia leve: um passeio ao ar livre de manhã e uma feira no fim da tarde.', links: [['Natureza no mapa', URL.natureza], ['O que acontece', URL.agenda]] },
                agenda: { label: 'Agenda', say: 'Festas de comunidade, feiras e o calendário cultural, mantidos pela equipe de turismo.', links: [['Agenda completa', URL.agenda], ['Notícias', URL.noticias]] }
            }
        },
        en: {
            locale: 'en-US',
            name: 'Capivarense',
            role: 'your host in São Mateus do Sul',
            open: 'Open Capivarense, the tourism guide',
            reopen: 'Call Capivarense back',
            close: 'Close Capivarense',
            hide: 'Hide Capivarense',
            hello: { morning: 'Good morning!', afternoon: 'Good afternoon!', evening: 'Good evening!' },
            say: {
                home: 'I know every corner of town. Where would you like to start?',
                mapa: 'Tap a pin to open the place card — or pick a ready-made route.',
                sabores: 'This is pierogi and chimarrão country. Want to know about the markets?',
                ondeficar: 'Compare places to stay on the map and see what is nearby.',
                eventos: 'Here is what is coming up in the next few days.',
                noticias: 'Besides the news, the calendar shows what is on this week.',
                oquefazer: 'Activities now live on the map. Let me take you there.',
                local: 'Like this place? See what else is nearby on the map.',
                polones: 'The Polish heritage lives on the table, in the churches and at the festivals.',
                'default': 'I can help you explore São Mateus do Sul.'
            },
            suggest: 'Tip',
            ask: 'What are you looking for?',
            back: 'Back',
            week: 'Coming up',
            weekAll: 'Full calendar',
            weekEmpty: 'No upcoming dates in this list — the full calendar has the whole year.',
            weekLoading: 'Checking the calendar…',
            today: 'Today',
            tomorrow: 'Tomorrow',
            every: 'weekly',
            time: { range: '{a}–{b}', from: 'from {a}', at: '{a}', tbc: 'time TBC', allDay: 'all day' },
            search: 'Search the portal',
            call: 'Call Culture & Tourism',
            alone: 'Rather explore on your own?',
            peekTitle: 'Hi! I’m Capivarense.',
            peekText: 'Would you like a tip for your visit?',
            peekClose: 'Dismiss',
            ctx: {
                home: [['Open the map', URL.mapa], ['Ready-made routes', URL.roteiros]],
                mapa: [['Ready-made routes', URL.roteiros], ['Food only', URL.comerMapa]],
                sabores: [['This week’s markets', URL.feiras], ['Restaurants on the map', URL.comerMapa]],
                ondeficar: [['Stays on the map', URL.dormirMapa], ['What to see nearby', URL.atrativos]],
                eventos: [['Events on the map', URL.eventosMapa]],
                noticias: [['See the calendar', URL.agenda]],
                oquefazer: [['Attractions on the map', URL.atrativos], ['Ready-made routes', URL.roteiros]],
                local: [['Back to the map', URL.mapa], ['Eat nearby', URL.comerMapa]],
                polones: [['Polish flavors', URL.polonesa], ['See the calendar', URL.agenda]],
                'default': [['Open the map', URL.mapa], ['See the calendar', URL.agenda]]
            },
            intents: {
                ver: { label: 'Sights', say: 'Hand-painted churches, the Iguaçu River and Polish memory: every pin on the map has a card, photo and directions.', links: [['Attractions on the map', URL.atrativos], ['Nature', URL.natureza], ['Polish heritage', URL.polones]] },
                comer: { label: 'Where to eat', say: 'Pierogi, yerba mate and street markets. The flavors guide brings recipes, markets and restaurants together.', links: [['Local flavors', URL.sabores], ['Markets', URL.feiras], ['Restaurants on the map', URL.comerMapa]] },
                ficar: { label: 'Where to stay', say: 'Downtown hotels and rural inns. Check on the map what is close to each one.', links: [['Where to stay', URL.ondeFicar], ['Stays on the map', URL.dormirMapa]] },
                rota: { label: 'Routes', say: 'Prefer a ready-made path? The Polish Route and other trails are already drawn on the map.', links: [['See routes', URL.roteiros]] },
                familia: { label: 'With family', say: 'For an easy day: an outdoor walk in the morning and a market in the late afternoon.', links: [['Nature on the map', URL.natureza], ['What’s on', URL.agenda]] },
                agenda: { label: 'Calendar', say: 'Community festivals, markets and the cultural calendar, kept up to date by the tourism team.', links: [['Full calendar', URL.agenda], ['News', URL.noticias]] }
            }
        },
        es: {
            locale: 'es-ES',
            name: 'Capivarense',
            role: 'tu anfitriona en São Mateus do Sul',
            open: 'Abrir Capivarense, la guía de turismo',
            reopen: 'Llamar de nuevo a Capivarense',
            close: 'Cerrar Capivarense',
            hide: 'Ocultar a Capivarense',
            hello: { morning: '¡Buenos días!', afternoon: '¡Buenas tardes!', evening: '¡Buenas noches!' },
            say: {
                home: 'Conozco cada rincón de la ciudad. ¿Por dónde quieres empezar?',
                mapa: 'Toca un pin para abrir la ficha del lugar — o elige una ruta lista.',
                sabores: 'Esta es tierra de pierogi y chimarrão. ¿Quieres saber de las ferias?',
                ondeficar: 'Compara los alojamientos en el mapa y mira qué hay cerca.',
                eventos: 'Separé lo que viene en los próximos días.',
                noticias: 'Además de las noticias, la agenda muestra lo que pasa esta semana.',
                oquefazer: 'Los paseos ahora viven en el mapa. Te llevo hasta ellos.',
                local: '¿Te gustó este lugar? Mira qué hay cerca en el mapa.',
                polones: 'La herencia polaca está en la mesa, en la fe y en las fiestas de la ciudad.',
                'default': 'Puedo ayudarte a explorar São Mateus do Sul.'
            },
            suggest: 'Sugerencia',
            ask: '¿Qué estás buscando?',
            back: 'Volver',
            week: 'En los próximos días',
            weekAll: 'Agenda completa',
            weekEmpty: 'No hay fechas próximas en esta lista — la agenda completa tiene todo el año.',
            weekLoading: 'Revisando la agenda…',
            today: 'Hoy',
            tomorrow: 'Mañana',
            every: 'cada semana',
            time: { range: '{a}–{b}', from: 'desde las {a}', at: '{a}', tbc: 'hora por confirmar', allDay: 'todo el día' },
            search: 'Buscar en el portal',
            call: 'Llamar a Cultura y Turismo',
            alone: '¿Prefieres explorar por tu cuenta?',
            peekTitle: '¡Hola! Soy la Capivarense.',
            peekText: '¿Quieres un consejo para tu paseo?',
            peekClose: 'Descartar',
            ctx: {
                home: [['Abrir el mapa', URL.mapa], ['Rutas listas', URL.roteiros]],
                mapa: [['Rutas listas', URL.roteiros], ['Solo dónde comer', URL.comerMapa]],
                sabores: [['Ferias de la semana', URL.feiras], ['Restaurantes en el mapa', URL.comerMapa]],
                ondeficar: [['Alojamientos en el mapa', URL.dormirMapa], ['Qué ver cerca', URL.atrativos]],
                eventos: [['Eventos en el mapa', URL.eventosMapa]],
                noticias: [['Ver la agenda', URL.agenda]],
                oquefazer: [['Atractivos en el mapa', URL.atrativos], ['Rutas listas', URL.roteiros]],
                local: [['Volver al mapa', URL.mapa], ['Comer cerca', URL.comerMapa]],
                polones: [['Sabores polacos', URL.polonesa], ['Ver la agenda', URL.agenda]],
                'default': [['Abrir el mapa', URL.mapa], ['Ver la agenda', URL.agenda]]
            },
            intents: {
                ver: { label: 'Atractivos', say: 'Iglesias pintadas a mano, el río Iguaçu y la memoria polaca: cada pin del mapa tiene ficha, foto y ruta.', links: [['Atractivos en el mapa', URL.atrativos], ['Naturaleza', URL.natureza], ['Herencia polaca', URL.polones]] },
                comer: { label: 'Dónde comer', say: 'Pierogi, yerba mate y ferias callejeras. La guía de sabores reúne recetas, ferias y restaurantes.', links: [['Sabores locales', URL.sabores], ['Ferias', URL.feiras], ['Restaurantes en el mapa', URL.comerMapa]] },
                ficar: { label: 'Dónde alojarse', say: 'Hoteles en el centro y posadas rurales. Mira en el mapa qué queda cerca de cada una.', links: [['Dónde alojarse', URL.ondeFicar], ['Alojamientos en el mapa', URL.dormirMapa]] },
                rota: { label: 'Rutas', say: '¿Prefieres un camino listo? La Ruta Polaca y otros recorridos ya están trazados en el mapa.', links: [['Ver rutas', URL.roteiros]] },
                familia: { label: 'En familia', say: 'Para un día tranquilo: un paseo al aire libre por la mañana y una feria al final de la tarde.', links: [['Naturaleza en el mapa', URL.natureza], ['Qué está pasando', URL.agenda]] },
                agenda: { label: 'Agenda', say: 'Fiestas comunitarias, ferias y el calendario cultural, mantenidos por el equipo de turismo.', links: [['Agenda completa', URL.agenda], ['Noticias', URL.noticias]] }
            }
        },
        pl: {
            locale: 'pl-PL',
            name: 'Capivarense',
            role: 'Twoja gospodyni w São Mateus do Sul',
            open: 'Otwórz Capivarense, przewodnik turystyczny',
            reopen: 'Przywołaj Capivarense',
            close: 'Zamknij Capivarense',
            hide: 'Ukryj Capivarense',
            hello: { morning: 'Dzień dobry!', afternoon: 'Dzień dobry!', evening: 'Dobry wieczór!' },
            say: {
                home: 'Znam każdy zakątek miasta. Od czego chcesz zacząć?',
                mapa: 'Dotknij pinezki, aby otworzyć kartę miejsca — albo wybierz gotową trasę.',
                sabores: 'To kraina pierogów i chimarrão. Chcesz wiedzieć o targach?',
                ondeficar: 'Porównaj noclegi na mapie i zobacz, co jest w pobliżu.',
                eventos: 'Oto co dzieje się w najbliższych dniach.',
                noticias: 'Oprócz wiadomości kalendarz pokazuje, co dzieje się w tym tygodniu.',
                oquefazer: 'Atrakcje są teraz na mapie. Zaprowadzę Cię do nich.',
                local: 'Podoba Ci się to miejsce? Zobacz na mapie, co jest w pobliżu.',
                polones: 'Polskie dziedzictwo żyje na stole, w kościołach i na festynach.',
                'default': 'Mogę pomóc Ci zwiedzić São Mateus do Sul.'
            },
            suggest: 'Podpowiedź',
            ask: 'Czego szukasz?',
            back: 'Wróć',
            week: 'W najbliższych dniach',
            weekAll: 'Pełny kalendarz',
            weekEmpty: 'Brak najbliższych dat na tej liście — pełny kalendarz obejmuje cały rok.',
            weekLoading: 'Sprawdzam kalendarz…',
            today: 'Dziś',
            tomorrow: 'Jutro',
            every: 'co tydzień',
            time: { range: '{a}–{b}', from: 'od {a}', at: '{a}', tbc: 'godzina do potwierdzenia', allDay: 'cały dzień' },
            search: 'Szukaj w portalu',
            call: 'Zadzwoń: Kultura i Turystyka',
            alone: 'Wolisz zwiedzać samodzielnie?',
            peekTitle: 'Cześć! Jestem Capivarense.',
            peekText: 'Chcesz wskazówkę na wycieczkę?',
            peekClose: 'Odrzuć',
            ctx: {
                home: [['Otwórz mapę', URL.mapa], ['Gotowe trasy', URL.roteiros]],
                mapa: [['Gotowe trasy', URL.roteiros], ['Tylko jedzenie', URL.comerMapa]],
                sabores: [['Targi w tym tygodniu', URL.feiras], ['Restauracje na mapie', URL.comerMapa]],
                ondeficar: [['Noclegi na mapie', URL.dormirMapa], ['Co zobaczyć w pobliżu', URL.atrativos]],
                eventos: [['Wydarzenia na mapie', URL.eventosMapa]],
                noticias: [['Zobacz kalendarz', URL.agenda]],
                oquefazer: [['Atrakcje na mapie', URL.atrativos], ['Gotowe trasy', URL.roteiros]],
                local: [['Wróć do mapy', URL.mapa], ['Jedzenie w pobliżu', URL.comerMapa]],
                polones: [['Polskie smaki', URL.polonesa], ['Zobacz kalendarz', URL.agenda]],
                'default': [['Otwórz mapę', URL.mapa], ['Zobacz kalendarz', URL.agenda]]
            },
            intents: {
                ver: { label: 'Atrakcje', say: 'Ręcznie malowane kościoły, rzeka Iguaçu i polska pamięć: każda pinezka ma kartę, zdjęcie i trasę.', links: [['Atrakcje na mapie', URL.atrativos], ['Przyroda', URL.natureza], ['Polskie dziedzictwo', URL.polones]] },
                comer: { label: 'Gdzie zjeść', say: 'Pierogi, yerba mate i targi uliczne. Przewodnik smaków łączy przepisy, targi i restauracje.', links: [['Lokalne smaki', URL.sabores], ['Targi', URL.feiras], ['Restauracje na mapie', URL.comerMapa]] },
                ficar: { label: 'Gdzie spać', say: 'Hotele w centrum i wiejskie pensjonaty. Sprawdź na mapie, co jest blisko każdego z nich.', links: [['Gdzie spać', URL.ondeFicar], ['Noclegi na mapie', URL.dormirMapa]] },
                rota: { label: 'Trasy', say: 'Wolisz gotową drogę? Trasa Polska i inne szlaki są już wyznaczone na mapie.', links: [['Zobacz trasy', URL.roteiros]] },
                familia: { label: 'Z rodziną', say: 'Na spokojny dzień: spacer na świeżym powietrzu rano i targ późnym popołudniem.', links: [['Przyroda na mapie', URL.natureza], ['Co się dzieje', URL.agenda]] },
                agenda: { label: 'Kalendarz', say: 'Festyny parafialne, targi i kalendarz kulturalny, prowadzone przez zespół turystyki.', links: [['Pełny kalendarz', URL.agenda], ['Wiadomości', URL.noticias]] }
            }
        }
    };

    var INTENT_ORDER = ['ver', 'comer', 'ficar', 'rota', 'familia', 'agenda'];

    // Ícones de traço (sem emoji): mesma espessura e cantos arredondados em todos.
    var ICON = {
        ver: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>',
        comer: '<circle cx="13" cy="13" r="6.5"/><circle cx="13" cy="13" r="3.2"/><path d="M4 3v6.5M2.5 3v4.2a1.5 1.5 0 0 0 3 0V3M4 9.5V21"/>',
        ficar: '<path d="M3 19V7M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11.5" r="2"/>',
        rota: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/>',
        familia: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
        agenda: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h3"/>',
        search: '<circle cx="11" cy="11" r="6.5"/><path d="m20.5 20.5-4.8-4.8"/>',
        phone: '<path d="M5 3.5h3.2l1.6 4.2-2.1 1.3a11 11 0 0 0 5.3 5.3l1.3-2.1 4.2 1.6V17a2.5 2.5 0 0 1-2.7 2.5A15.5 15.5 0 0 1 2.5 6.2 2.5 2.5 0 0 1 5 3.5Z"/>',
        arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
        back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
        close: '<path d="M6 6l12 12M18 6 6 18"/>'
    };

    function icon(name, cls) {
        return '<svg class="' + (cls || 'cv-ico') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + ICON[name] + '</svg>';
    }

    // Roseta dos recortes poloneses (wycinanki), versão de 8 pétalas — ornamento, nunca textura.
    var ROSETTE = '<svg class="cv-rosette" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">' +
        '<g fill="var(--cv-red)">' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { return '<ellipse cx="0" cy="-40" rx="5" ry="9.5" transform="rotate(' + a + ')"/>'; }).join('') + '</g>' +
        '<g fill="var(--cv-mate)">' + [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(function (a) { return '<path d="M0,-33 C8,-26 8,-16 0,-12 C-8,-16 -8,-26 0,-33Z" transform="rotate(' + a + ')"/>'; }).join('') + '</g>' +
        '<circle r="11" fill="var(--cv-ochre)"/><circle r="5.5" fill="var(--cv-paper)"/></svg>';

    function getLang() {
        var lang = '';
        try { lang = localStorage.getItem('sms-lang') || ''; } catch (e) {}
        lang = (lang || document.documentElement.lang || 'pt').slice(0, 2).toLowerCase();
        return STR[lang] ? lang : 'pt';
    }

    function getContextKey() {
        var p = (window.location.pathname || '').toLowerCase();
        if (p.indexOf('mapa-turistico') !== -1) return 'mapa';
        if (p.indexOf('sabores') !== -1) return 'sabores';
        if (p.indexOf('o-que-fazer') !== -1) return 'oquefazer';
        if (p.indexOf('onde-ficar') !== -1) return 'ondeficar';
        if (p.indexOf('mes-polones') !== -1) return 'polones';
        if (p.indexOf('eventos') !== -1) return 'eventos';
        if (p.indexOf('noticia') !== -1) return 'noticias';
        if (p.indexOf('local') !== -1) return 'local';
        if (p === '/' || p === '' || p.indexOf('index') !== -1) return 'home';
        return 'default';
    }

    var CTX = getContextKey();

    function readPref(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
    function writePref(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
        });
    }

    function greeting(t) {
        var h = new Date().getHours();
        return h < 12 ? t.hello.morning : (h < 18 ? t.hello.afternoon : t.hello.evening);
    }

    function focusNoScroll(node) {
        if (!node) return;
        try { node.focus({ preventScroll: true }); } catch (e) { node.focus(); }
    }

    // ── Estado ──
    var state = { root: null, open: false, intent: null, events: null, eventsLoading: false, lastFocus: null };

    // ── Agenda: próximos itens da agenda oficial (sem inventar nada) ──
    function loadEvents() {
        if (state.events || state.eventsLoading) return;
        state.eventsLoading = true;
        fetch(EVENTS_URL, { cache: 'no-cache' })
            .then(function (res) { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
            .then(function (list) { state.events = pickUpcoming(Array.isArray(list) ? list : []); })
            .catch(function () { state.events = []; })
            .then(function () { state.eventsLoading = false; renderWeek(); });
    }

    function pickUpcoming(list) {
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var limit = new Date(today.getTime() + 21 * 864e5); // três semanas à frente
        var seenRecurring = {};
        var future = list.filter(function (ev) {
            return ev && ev.titulo && /^\d{4}-\d{2}-\d{2}$/.test(ev.data || '');
        }).map(function (ev) {
            return { ev: ev, date: new Date(ev.data + 'T12:00:00') };
        }).filter(function (x) {
            return x.date >= today && x.date <= limit;
        }).sort(function (a, b) { return a.date - b.date; });

        // Eventos únicos têm prioridade; feiras recorrentes entram uma vez cada, para completar.
        var unique = future.filter(function (x) { return !x.ev.recorrente; });
        var recurring = future.filter(function (x) {
            if (!x.ev.recorrente || seenRecurring[x.ev.titulo]) return false;
            seenRecurring[x.ev.titulo] = true;
            return true;
        });
        var picked = unique.slice(0, 2);
        recurring.forEach(function (x) { if (picked.length < 3) picked.push(x); });
        unique.slice(2).forEach(function (x) { if (picked.length < 3) picked.push(x); });
        return picked.sort(function (a, b) { return a.date - b.date; });
    }

    // Horários da agenda chegam em português ("17h às 22h", "A partir das 10h",
    // "A confirmar"). Converte os formatos conhecidos para o idioma do visitante;
    // formato desconhecido só é exibido em português (não inventa tradução).
    function clock(h, m, t) {
        if (getLang() === 'pt') return h + 'h' + (m ? m : '');
        try {
            return new Date(2026, 0, 1, Number(h), Number(m || 0))
                .toLocaleTimeString(t.locale, { hour: 'numeric', minute: '2-digit' });
        } catch (e) { return h + ':' + (m || '00'); }
    }

    function formatHorario(raw, t) {
        var text = String(raw || '').trim();
        if (!text) return '';
        var tm = t.time, m;
        if ((m = text.match(/^(\d{1,2})h(\d{2})?\s+às\s+(\d{1,2})h(\d{2})?$/i))) {
            return tm.range.replace('{a}', clock(m[1], m[2], t)).replace('{b}', clock(m[3], m[4], t));
        }
        if ((m = text.match(/^a partir das\s+(\d{1,2})h(\d{2})?$/i))) return tm.from.replace('{a}', clock(m[1], m[2], t));
        if ((m = text.match(/^(\d{1,2})h(\d{2})?$/i))) return tm.at.replace('{a}', clock(m[1], m[2], t));
        if (/^a confirmar$/i.test(text)) return tm.tbc;
        if (/^todo o dia$/i.test(text)) return tm.allDay;
        return getLang() === 'pt' ? text : '';
    }

    function dayLabel(date, t) {
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var diff = Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()) - today) / 864e5);
        if (diff === 0) return t.today;
        if (diff === 1) return t.tomorrow;
        try { return date.toLocaleDateString(t.locale, { weekday: 'short' }).replace('.', ''); } catch (e) { return ''; }
    }

    function renderWeek() {
        var root = state.root;
        if (!root) return;
        var box = root.querySelector('[data-cv-week]');
        if (!box) return;
        var t = STR[getLang()];
        if (state.events === null) {
            box.innerHTML = '<p class="cv-week-note">' + esc(t.weekLoading) + '</p>';
            return;
        }
        if (!state.events.length) {
            box.innerHTML = '<p class="cv-week-note">' + esc(t.weekEmpty) + '</p>';
            return;
        }
        box.innerHTML = '<ol class="cv-week-list">' + state.events.map(function (x) {
            var d = x.date;
            var month = '';
            try { month = d.toLocaleDateString(t.locale, { month: 'short' }).replace('.', ''); } catch (e) {}
            var hora = formatHorario(x.ev.horario, t);
            return '<li class="cv-week-item">' +
                '<span class="cv-date" aria-hidden="true"><span class="cv-date-day">' + d.getDate() + '</span><span class="cv-date-month">' + esc(month) + '</span></span>' +
                '<span class="cv-week-text">' +
                    '<span class="cv-week-when"><span class="cv-week-day">' + esc(dayLabel(d, t)) + '</span>' +
                        (hora ? ' · <span class="cv-week-time">' + esc(hora) + '</span>' : '') +
                        (x.ev.recorrente ? ' · ' + esc(t.every) : '') + '</span>' +
                    // Título e local são nomes próprios da agenda oficial (publicados em português).
                    '<span class="cv-week-title" lang="pt-BR">' + esc(x.ev.titulo) + '</span>' +
                    (x.ev.local ? '<span class="cv-week-where" lang="pt-BR">' + esc(x.ev.local) + '</span>' : '') +
                    '<span class="cv-sr">' + esc(d.toLocaleDateString(t.locale, { day: 'numeric', month: 'long' })) + '</span>' +
                '</span>' +
            '</li>';
        }).join('') + '</ol>';
    }

    // ── Construção ──
    function linkRow(pairs, cls) {
        return pairs.map(function (p) {
            return '<a class="' + cls + '" href="' + esc(p[1]) + '"><span>' + esc(p[0]) + '</span>' + icon('arrow', 'cv-ico cv-ico--arrow') + '</a>';
        }).join('');
    }

    function panelHTML(t) {
        var ctxLinks = t.ctx[CTX] || t.ctx['default'];
        return '' +
            '<div class="cv-sheet-grip" aria-hidden="true"></div>' +
            '<header class="cv-head">' +
                '<div class="cv-portrait" aria-hidden="true"><img src="' + MASCOT_IMG + '" alt="" width="120" height="120" decoding="async"></div>' +
                '<div class="cv-head-text">' +
                    '<h2 class="cv-name" id="cv-title" tabindex="-1">' + esc(t.name) + '</h2>' +
                    '<p class="cv-role">' + esc(t.role) + '</p>' +
                '</div>' +
                ROSETTE +
                '<button type="button" class="cv-close" data-cv-close aria-label="' + esc(t.close) + '">' + icon('close') + '</button>' +
            '</header>' +
            '<div class="cv-body">' +
                '<p class="cv-say"><strong>' + esc(greeting(t)) + '</strong> ' + esc(t.say[CTX] || t.say['default']) + '</p>' +
                '<div class="cv-suggest" role="group" aria-label="' + esc(t.suggest) + '">' + linkRow(ctxLinks, 'cv-pill') + '</div>' +
                '<section class="cv-block" aria-labelledby="cv-ask">' +
                    '<h3 class="cv-label" id="cv-ask">' + esc(t.ask) + '</h3>' +
                    '<div class="cv-intents" data-cv-intents>' + INTENT_ORDER.map(function (id) {
                        return '<button type="button" class="cv-intent" data-cv-intent="' + id + '" aria-expanded="false" aria-controls="cv-answer">' +
                            icon(id, 'cv-ico cv-ico--intent') + '<span>' + esc(t.intents[id].label) + '</span></button>';
                    }).join('') + '</div>' +
                    '<div class="cv-answer" id="cv-answer" data-cv-answer aria-live="polite" hidden></div>' +
                '</section>' +
                '<section class="cv-block cv-block--week" aria-labelledby="cv-week">' +
                    '<div class="cv-label-row"><h3 class="cv-label" id="cv-week">' + esc(t.week) + '</h3>' +
                    '<a class="cv-more" href="' + URL.agenda + '">' + esc(t.weekAll) + icon('arrow', 'cv-ico cv-ico--arrow') + '</a></div>' +
                    '<div data-cv-week></div>' +
                '</section>' +
                '<p class="cv-bye">' + esc(t.alone) + ' <button type="button" class="cv-hide" data-cv-hide>' + esc(t.hide) + '</button></p>' +
            '</div>' +
            '<footer class="cv-foot">' +
                '<button type="button" class="cv-foot-btn" data-cv-search>' + icon('search') + '<span>' + esc(t.search) + '</span></button>' +
                '<a class="cv-foot-btn" href="' + PHONE_HREF + '" aria-label="' + esc(t.call) + ' ' + PHONE_LABEL + '">' + icon('phone') + '<span>' + PHONE_LABEL + '</span></a>' +
            '</footer>';
    }

    function renderAnswer() {
        var root = state.root;
        if (!root) return;
        var t = STR[getLang()];
        var box = root.querySelector('[data-cv-answer]');
        root.querySelectorAll('[data-cv-intent]').forEach(function (b) {
            var on = b.getAttribute('data-cv-intent') === state.intent;
            b.setAttribute('aria-expanded', on ? 'true' : 'false');
            b.classList.toggle('is-active', on);
        });
        if (!box) return;
        if (!state.intent) { box.hidden = true; box.innerHTML = ''; return; }
        var it = t.intents[state.intent];
        box.innerHTML =
            '<p class="cv-answer-say">' + esc(it.say) + '</p>' +
            '<div class="cv-answer-links">' + linkRow(it.links, 'cv-link') + '</div>';
        // A "orelha" do bilhete aponta para a coluna do azulejo escolhido.
        var col = INTENT_ORDER.indexOf(state.intent) % 3;
        box.style.setProperty('--cv-ear', (16.66 + col * 33.33).toFixed(2) + '%');
        box.hidden = false;
    }

    function revealAnswer() {
        var box = state.root && state.root.querySelector('[data-cv-answer]');
        if (!box || box.hidden) return;
        try { box.scrollIntoView({ block: 'nearest', behavior: REDUCED.matches ? 'auto' : 'smooth' }); }
        catch (e) { box.scrollIntoView(false); }
    }

    function build() {
        var t = STR[getLang()];
        var root = document.createElement('div');
        root.id = 'sms-mascot';
        root.className = 'cv';
        root.setAttribute('data-cv-context', CTX);
        state.root = root;

        if (readPref(STORAGE_HIDDEN) === 'true') {
            root.classList.add('cv--hidden');
            root.innerHTML = '<button type="button" class="sms-mascot-reopen cv-reopen" aria-label="' + esc(t.reopen) + '" title="' + esc(t.reopen) + '">' +
                '<img src="' + MASCOT_IMG + '" alt="" width="40" height="40" decoding="async"></button>';
            document.body.appendChild(root);
            root.querySelector('.cv-reopen').addEventListener('click', function () {
                writePref(STORAGE_HIDDEN, 'false');
                root.remove();
                build();
                window.setTimeout(function () { openPanel(); }, 0);
            });
            return root;
        }

        root.innerHTML =
            '<button type="button" class="sms-mascot-launcher cv-launcher" id="sms-mascot-launcher" aria-haspopup="dialog" aria-expanded="false" aria-controls="cv-panel" aria-label="' + esc(t.open) + '">' +
                '<span class="cv-launcher-frame"><img src="' + MASCOT_IMG + '" alt="" width="96" height="96" decoding="async" onerror="this.style.visibility=\'hidden\'"></span>' +
                '<span class="cv-launcher-x" aria-hidden="true">' + icon('close') + '</span>' +
                '<span class="cv-launcher-tag" aria-hidden="true">' + esc(t.name) + '</span>' +
            '</button>' +
            '<div class="cv-peek" data-cv-peek hidden>' +
                '<button type="button" class="cv-peek-open" data-cv-peek-open><strong>' + esc(t.peekTitle) + '</strong><span>' + esc(t.peekText) + '</span></button>' +
                '<button type="button" class="cv-peek-close" data-cv-peek-close aria-label="' + esc(t.peekClose) + '">' + icon('close') + '</button>' +
            '</div>' +
            '<div class="cv-scrim" data-cv-scrim hidden></div>' +
            '<div class="cv-panel" id="cv-panel" role="dialog" aria-modal="false" aria-labelledby="cv-title" hidden>' + panelHTML(t) + '</div>';

        document.body.appendChild(root);
        bind(root);
        renderWeek();
        maybePeek();
        return root;
    }

    // Re-renderiza os textos ao trocar de idioma, preservando o estado aberto/intenção.
    function rerender() {
        var root = state.root;
        if (!root) return;
        var t = STR[getLang()];
        if (root.classList.contains('cv--hidden')) {
            var reopen = root.querySelector('.cv-reopen');
            if (reopen) { reopen.setAttribute('aria-label', t.reopen); reopen.setAttribute('title', t.reopen); }
            return;
        }
        var launcher = root.querySelector('.cv-launcher');
        if (launcher) launcher.setAttribute('aria-label', state.open ? t.close : t.open);
        var tag = root.querySelector('.cv-launcher-tag');
        if (tag) tag.textContent = t.name;
        var peek = root.querySelector('[data-cv-peek]');
        if (peek) {
            peek.querySelector('[data-cv-peek-open]').innerHTML = '<strong>' + esc(t.peekTitle) + '</strong><span>' + esc(t.peekText) + '</span>';
            peek.querySelector('[data-cv-peek-close]').setAttribute('aria-label', t.peekClose);
        }
        var panel = root.querySelector('.cv-panel');
        if (panel) panel.innerHTML = panelHTML(t);
        renderAnswer();
        renderWeek();
    }

    function bind(root) {
        var launcher = root.querySelector('.cv-launcher');
        var panel = root.querySelector('.cv-panel');
        launcher.addEventListener('click', function () {
            hidePeek(true);
            if (state.open) closePanel(true); else openPanel();
        });
        root.querySelector('[data-cv-peek-open]').addEventListener('click', function () { hidePeek(true); openPanel(); });
        root.querySelector('[data-cv-peek-close]').addEventListener('click', function () { hidePeek(true); focusNoScroll(launcher); });
        root.querySelector('[data-cv-scrim]').addEventListener('click', function () { closePanel(true); });

        // Delegação: o conteúdo do painel é re-renderizado na troca de idioma.
        panel.addEventListener('click', function (e) {
            var target = e.target.closest ? e.target : null;
            if (!target) return;
            if (target.closest('[data-cv-close]')) { closePanel(true); return; }
            if (target.closest('[data-cv-hide]')) { hideMascot(); return; }
            if (target.closest('[data-cv-search]')) { openSiteSearch(); return; }
            var intentBtn = target.closest('[data-cv-intent]');
            if (intentBtn) {
                var id = intentBtn.getAttribute('data-cv-intent');
                state.intent = state.intent === id ? null : id;
                renderAnswer();
                revealAnswer();
            }
        });
    }

    // Reaproveita a busca do portal (modal do nav-shared + search.js), sem duplicar índice.
    function openSiteSearch() {
        var trigger = document.querySelector('.nav-search-btn[data-search-open], [data-search-open]');
        closePanel(false);
        if (trigger) { trigger.click(); }
        else { window.location.href = '/mapa-turistico'; }
    }

    function isSheet() { return MOBILE.matches; }

    // No celular o guia vira folha modal: escurece o fundo e tira de cena os
    // flutuantes (VLibras, voltar ao topo) enquanto aberto, como faz o menu.
    function syncSheet() {
        var root = state.root;
        if (!root) return;
        var sheet = state.open && isSheet();
        var panel = root.querySelector('.cv-panel');
        var scrim = root.querySelector('[data-cv-scrim]');
        if (panel) panel.setAttribute('aria-modal', sheet ? 'true' : 'false');
        if (scrim) scrim.hidden = !sheet;
        document.body.classList.toggle('cv-sheet-open', sheet);
    }

    function openPanel() {
        var root = state.root;
        if (!root || root.classList.contains('cv--hidden')) return;
        var panel = root.querySelector('.cv-panel');
        var launcher = root.querySelector('.cv-launcher');
        state.lastFocus = document.activeElement;
        state.open = true;
        root.classList.add('is-open');
        panel.hidden = false;
        syncSheet();
        launcher.setAttribute('aria-expanded', 'true');
        launcher.setAttribute('aria-label', STR[getLang()].close);
        writePref(STORAGE_TEASER, 'true');
        loadEvents();
        focusNoScroll(panel.querySelector('#cv-title'));
    }

    function closePanel(returnFocus) {
        var root = state.root;
        if (!root || !state.open) return;
        state.open = false;
        root.classList.remove('is-open');
        var panel = root.querySelector('.cv-panel');
        if (panel) panel.hidden = true;
        syncSheet();
        var launcher = root.querySelector('.cv-launcher');
        if (launcher) {
            launcher.setAttribute('aria-expanded', 'false');
            launcher.setAttribute('aria-label', STR[getLang()].open);
            if (returnFocus) focusNoScroll(launcher);
        }
    }

    function hideMascot() {
        closePanel(false);
        writePref(STORAGE_HIDDEN, 'true');
        state.root.remove();
        state.intent = null;
        var fresh = build();
        focusNoScroll(fresh.querySelector('.cv-reopen'));
    }

    // ── Apresentação discreta (uma vez por visitante) ──
    // Desktop: um bilhete curto ao lado da capivara, só depois que o aviso de
    // cookies sai de cena, e some na primeira rolagem. Celular: nada cobre o
    // conteúdo — a capivara do cabeçalho apenas acena uma vez.
    var peekTimer = null;
    function cookieBannerVisible() {
        var b = document.getElementById('sms-cookie-banner') || document.querySelector('.sms-cookie-banner');
        if (!b) return false;
        var r = b.getBoundingClientRect();
        var cs = window.getComputedStyle(b);
        return r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && !b.hidden;
    }

    function maybePeek() {
        if (readPref(STORAGE_TEASER) === 'true') return;
        var started = Date.now();
        (function wait() {
            if (!state.root || state.open || readPref(STORAGE_TEASER) === 'true') return;
            if (cookieBannerVisible() && Date.now() - started < 90000) { peekTimer = window.setTimeout(wait, 1200); return; }
            peekTimer = window.setTimeout(showPeek, 2500);
        })();
    }

    function showPeek() {
        var root = state.root;
        if (!root || state.open || root.classList.contains('cv--hidden')) return;
        writePref(STORAGE_TEASER, 'true');
        if (isSheet()) {
            if (REDUCED.matches) return;
            root.classList.add('cv-wave');
            window.setTimeout(function () { root.classList.remove('cv-wave'); }, 2600);
            return;
        }
        var peek = root.querySelector('[data-cv-peek]');
        if (!peek) return;
        peek.hidden = false;
        root.classList.add('cv-peeking');
        var dismiss = function () { hidePeek(false); };
        window.addEventListener('scroll', dismiss, { passive: true, once: true });
        peekTimer = window.setTimeout(dismiss, 9000);
    }

    function hidePeek(markSeen) {
        if (peekTimer) { window.clearTimeout(peekTimer); peekTimer = null; }
        if (markSeen) writePref(STORAGE_TEASER, 'true');
        var root = state.root;
        if (!root) return;
        var peek = root.querySelector('[data-cv-peek]');
        if (peek) peek.hidden = true;
        root.classList.remove('cv-peeking');
    }

    // ── Listeners globais (uma vez) ──
    function setupGlobalListeners() {
        if (window.__smsMascotGlobalBound) return;
        window.__smsMascotGlobalBound = true;

        // Captura: com o guia aberto, o Esc fecha só o guia (sem acionar o menu do cabeçalho).
        document.addEventListener('keydown', function (e) {
            if (state.open && e.key === 'Escape') { e.stopImmediatePropagation(); closePanel(true); }
        }, true);

        document.addEventListener('keydown', function (e) {
            if (!state.open) return;
            // No celular o guia é uma folha modal: o Tab circula dentro dela.
            if (e.key === 'Tab' && isSheet()) {
                var panel = state.root.querySelector('.cv-panel');
                var items = Array.prototype.filter.call(panel.querySelectorAll('a[href], button:not([disabled])'), function (n) { return n.offsetParent !== null; });
                if (!items.length) return;
                var first = items[0], last = items[items.length - 1];
                var active = document.activeElement;
                var atStart = active === first || active === panel.querySelector('#cv-title') || !panel.contains(active);
                if (e.shiftKey && atStart) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && (active === last || !panel.contains(active))) { e.preventDefault(); first.focus(); }
            }
        });

        document.addEventListener('click', function (e) {
            if (!state.open || !document.contains(e.target)) return;
            if (state.root && !state.root.contains(e.target)) closePanel(false);
        });

        document.addEventListener('translationsApplied', rerender);

        var onMedia = function () { syncSheet(); };
        if (MOBILE.addEventListener) MOBILE.addEventListener('change', onMedia);
        else if (MOBILE.addListener) MOBILE.addListener(onMedia);
    }

    function init() {
        try { setupGlobalListeners(); build(); } catch (e) { /* falha em silêncio */ }
    }

    function schedule() {
        readMascotConfig().then(function (config) {
            if (!resolveMascotEnabled(config)) return;
            if ('requestIdleCallback' in window) window.requestIdleCallback(init, { timeout: 2500 });
            else window.setTimeout(init, 1200);
        });
    }

    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
})();
