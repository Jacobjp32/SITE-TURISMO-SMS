(function (root) {
    'use strict';

    var document = root.document;

    function api() {
        return root.AgroSamasContract || null;
    }

    function all(selector) {
        return document ? Array.prototype.slice.call(document.querySelectorAll(selector)) : [];
    }

    function one(selector) {
        return document ? document.querySelector(selector) : null;
    }

    function setText(selector, value) {
        all(selector).forEach(function (element) { element.textContent = value; });
    }

    function renderContractBasics() {
        var contractApi = api();
        if (!contractApi || !document) return false;
        all('[data-hub-edition-link]').forEach(function (link) {
            link.setAttribute('href', contractApi.contract.edition.route);
        });
        return true;
    }

    function temporalCopy(state, edition) {
        if (state === 'POSTPONED') {
            return {
                kicker: 'EVENTO ADIADO',
                copy: edition.postponement.reason + ' ' + edition.postponement.update,
                primary: 'Entenda o adiamento',
                editionCta: 'Ver informações da edição adiada',
                archive: edition.name + ' · adiado'
            };
        }
        if (state === 'EVENT_LIVE') {
            return {
                kicker: 'Acontecendo agora',
                copy: edition.name + ' está acontecendo em São Mateus do Sul. A edição reúne informações confirmadas e atalhos para a visita.',
                primary: 'Acessar AgroSamas agora',
                editionCta: 'Ver programação e informações',
                archive: edition.name + ' · acontecendo'
            };
        }
        if (state === 'POST_EVENT') {
            return {
                kicker: 'Arquivo em destaque',
                copy: edition.name + ' entrou para a história e continua acessível como arquivo permanente da série.',
                primary: 'Rever a edição 2026',
                editionCta: 'Abrir arquivo da edição',
                archive: edition.name + ' · arquivo permanente'
            };
        }
        return {
            kicker: 'Edição vigente · vem aí',
            copy: 'A edição vigente reúne as informações confirmadas e o planejamento da visita. Novas atrações serão divulgadas em breve.',
            primary: 'Conhecer o ' + edition.name,
            editionCta: 'Explorar a edição 2026',
            archive: edition.name + ' · edição vigente'
        };
    }

    function renderTemporalState(reference) {
        var contractApi = api();
        if (!contractApi || !document) return 'UNKNOWN';
        var state = contractApi.resolveTemporalState(reference);
        var edition = contractApi.contract.edition;
        var content = temporalCopy(state, edition);
        if (document.body) document.body.setAttribute('data-agro-temporal-state', state);
        setText('[data-hub-temporal-kicker]', content.kicker);
        setText('[data-hub-temporal-copy]', content.copy);
        setText('[data-hub-primary-action]', content.primary);
        setText('[data-hub-edition-cta]', content.editionCta);
        setText('[data-hub-archive-label]', content.archive);
        return state;
    }

    function setupReveals() {
        if (!document || !document.body) return;
        var reduceMotion = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var revealItems = all('[data-reveal]');
        if (reduceMotion || !root.IntersectionObserver) {
            revealItems.forEach(function (item) { item.classList.add('is-visible'); });
            return;
        }
        document.body.classList.add('agro-motion-ready');
        var observer = new root.IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        revealItems.forEach(function (item) { observer.observe(item); });
    }

    function setupLocalNavigation() {
        var slot = one('[data-local-nav-slot]');
        var localNav = one('[data-local-nav]');
        var scheduled = false;

        function updateFixedPosition() {
            scheduled = false;
            if (!slot || !localNav) return;
            var globalOffset = root.innerWidth <= 768 ? 164 : 180;
            localNav.classList.toggle('is-fixed', slot.getBoundingClientRect().top <= globalOffset);
        }

        function schedulePositionUpdate() {
            if (scheduled || !root.requestAnimationFrame) return;
            scheduled = true;
            root.requestAnimationFrame(updateFixedPosition);
        }

        if (slot && localNav && root.requestAnimationFrame) {
            root.addEventListener('scroll', schedulePositionUpdate, { passive: true });
            root.addEventListener('resize', schedulePositionUpdate);
            updateFixedPosition();
        }
        if (!root.IntersectionObserver) return;
        var links = all('.agro-local-nav a[href^="#"]');
        var sections = links.map(function (link) { return one(link.getAttribute('href')); }).filter(Boolean);
        if (!sections.length) return;
        var observer = new root.IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function (link) {
                    var active = link.getAttribute('href') === '#' + entry.target.id;
                    if (active) link.setAttribute('aria-current', 'location');
                    else link.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '-42% 0px -50% 0px', threshold: 0 });
        sections.forEach(function (section) { observer.observe(section); });
    }

    function init() {
        if (!renderContractBasics()) return;
        renderTemporalState(new Date());
        setupReveals();
        setupLocalNavigation();
    }

    var hubApi = Object.freeze({
        renderContractBasics: renderContractBasics,
        renderTemporalState: renderTemporalState
    });

    if ('AgroSamasHubPage' in root) throw new Error('[AgroSamasHubPage] global namespace already registered');
    Object.defineProperty(root, 'AgroSamasHubPage', {
        value: hubApi,
        writable: false,
        configurable: false,
        enumerable: false
    });

    if (document) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
        else init();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);
