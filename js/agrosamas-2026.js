(function (root) {
    'use strict';

    var document = root.document;
    var countdownTimer = null;
    var currentNow = new Date();
    var currentTemporalState = 'UNKNOWN';

    function api() {
        return root.AgroSamasContract || null;
    }

    function one(selector) {
        return document ? document.querySelector(selector) : null;
    }

    function all(selector) {
        return document ? Array.prototype.slice.call(document.querySelectorAll(selector)) : [];
    }

    function setText(selector, value) {
        all(selector).forEach(function (element) {
            element.textContent = value;
        });
    }

    function pad(value, size) {
        return String(Math.max(0, value)).padStart(size || 2, '0');
    }

    function toUtcNoon(dateKey) {
        return new Date(String(dateKey) + 'T12:00:00Z');
    }

    function editionDates(edition) {
        if (edition.status === 'POSTPONED' || !edition.startDate || !edition.endDate) return [];
        var start = toUtcNoon(edition.startDate);
        var end = toUtcNoon(edition.endDate);
        var dates = [];
        var cursor = start.getTime();
        while (cursor <= end.getTime() && dates.length < 31) {
            dates.push(new Date(cursor).toISOString().slice(0, 10));
            cursor += 86400000;
        }
        return dates;
    }

    function dateDay(dateKey) {
        return pad(toUtcNoon(dateKey).getUTCDate(), 2);
    }

    function dateWeekday(dateKey) {
        return new Intl.DateTimeFormat('pt-BR', {
            weekday: 'long',
            timeZone: 'UTC'
        }).format(toUtcNoon(dateKey));
    }

    // Concise visual weekday for narrow tab strips (SEX, SÁB, DOM, SEG).
    function dateWeekdayShort(dateKey) {
        return new Intl.DateTimeFormat('pt-BR', {
            weekday: 'short',
            timeZone: 'UTC'
        }).format(toUtcNoon(dateKey)).replace(/\.$/, '');
    }

    function localDateKey(value, timeZone) {
        try {
            return new Intl.DateTimeFormat('en-CA', {
                timeZone: timeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(value);
        } catch (_) {
            return '';
        }
    }

    function renderSchema(edition) {
        var schema = one('#agrosamas-event-schema');
        if (!schema) return;
        if (edition.status === 'POSTPONED') {
            schema.remove();
            return;
        }
        var contractApi = api();
        var publicProgramming = contractApi.getPublicProgramming(edition.programming);
        var endExclusive = Date.parse(edition.temporal.liveEndExclusiveAt);
        var eventSchema = {
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: edition.name,
            description: 'Evento que reúne agro, gastronomia, música, empreendedores e produção regional em São Mateus do Sul.',
            startDate: new Date(Date.parse(edition.temporal.liveStartAt)).toISOString(),
            endDate: new Date(endExclusive - 1000).toISOString(),
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            eventStatus: 'https://schema.org/EventScheduled',
            url: edition.canonicalUrl,
            sameAs: edition.officialUrl,
            image: [
                'https://turismo.saomateusdosul.pr.gov.br' + edition.brand.publicPath,
                'https://turismo.saomateusdosul.pr.gov.br/images/RUA_DO_MATHE.jpg'
            ],
            location: {
                '@type': 'Place',
                name: edition.location.scope,
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: edition.location.city,
                    addressRegion: edition.location.state,
                    addressCountry: edition.location.country
                }
            }
        };
        if (publicProgramming.items.length) {
            eventSchema.performer = publicProgramming.items.map(function (item) {
                return { '@type': 'PerformingGroup', name: item.title };
            });
        }
        schema.textContent = JSON.stringify(eventSchema);
    }

    function renderContractBasics() {
        var contractApi = api();
        if (!contractApi || !document) return false;
        var edition = contractApi.contract.edition;
        var pageTitle = edition.status === 'POSTPONED'
            ? edition.name + ' adiado | São Mateus do Sul'
            : edition.name + ' ' + edition.year + ' | São Mateus do Sul';
        document.title = pageTitle;
        all('meta[property="og:title"], meta[name="twitter:title"]').forEach(function (meta) {
            meta.setAttribute('content', pageTitle);
        });
        if (edition.startDate && edition.endDate) {
            setText('[data-agro-start-day]', dateDay(edition.startDate));
            setText('[data-agro-end-day]', dateDay(edition.endDate));
        }
        setText('[data-agro-location-scope]', edition.location.scope);
        setText('[data-agro-city-state]', edition.location.city + ' — ' + edition.location.state);
        all('[data-agro-location-link]').forEach(function (link) {
            link.setAttribute('href', edition.location.route);
        });
        renderSchema(edition);
        if (root.AgroSamasContractBindings) root.AgroSamasContractBindings.bind('pt');
        return true;
    }

    function temporalCopy(state, edition, now) {
        if (state === 'POSTPONED') {
            return {
                kicker: 'EVENTO ADIADO',
                lead: edition.postponement.reason + ' ' + edition.postponement.update,
                status: edition.name + ' adiado · nova data ainda não definida',
                action: 'Entenda o adiamento',
                actionTarget: '#programacao'
            };
        }
        var timeZone = edition.temporal.timezone;
        var today = localDateKey(now, timeZone);
        if (state === 'EVENT_LIVE') {
            var currentDay = today ? new Intl.DateTimeFormat('pt-BR', {
                day: 'numeric',
                month: 'long',
                timeZone: 'UTC'
            }).format(toUtcNoon(today)) : '';
            return {
                kicker: 'Acontecendo agora',
                lead: currentDay ? 'Hoje, ' + currentDay + '. Consulte as informações confirmadas e viva o AgroSamas em São Mateus do Sul.' : 'Consulte as informações confirmadas e viva o AgroSamas em São Mateus do Sul.',
                status: 'AgroSamas está acontecendo',
                action: 'AgroSamas agora',
                actionTarget: '#programacao'
            };
        }
        if (state === 'POST_EVENT') {
            return {
                kicker: 'Uma edição para a história',
                lead: 'A edição permanece como arquivo da cidade e abre espaço para notícias, registros e resultados confirmados.',
                status: 'O ' + edition.name + ' entrou para a história',
                action: 'Descobrir o destino',
                actionTarget: '#planeje'
            };
        }
        if (state === 'PRE_EVENT') {
            return {
                kicker: 'Vem aí',
                lead: 'Campo, sabores, negócios e encontros ocupam a cidade em uma experiência feita para viver São Mateus do Sul.',
                status: 'Vem aí o ' + edition.name,
                action: 'Ver programação',
                actionTarget: '#programacao'
            };
        }
        return {
            kicker: 'Edição 2026',
            lead: 'Consulte as informações confirmadas e planeje sua experiência em São Mateus do Sul.',
            status: edition.name + ' · informações da edição',
            action: 'Ver programação',
            actionTarget: '#programacao'
        };
    }

    function stopCountdown() {
        if (countdownTimer) {
            root.clearInterval(countdownTimer);
            countdownTimer = null;
        }
    }

    function updateCountdown(now) {
        var contractApi = api();
        var countdown = one('[data-countdown]');
        if (!contractApi || !countdown) return;
        var start = Date.parse(contractApi.contract.edition.temporal.liveStartAt);
        var reference = now instanceof Date ? now.getTime() : Date.parse(now);
        var difference = start - reference;
        if (!Number.isFinite(difference) || difference <= 0) {
            countdown.hidden = true;
            stopCountdown();
            return;
        }
        var totalMinutes = Math.floor(difference / 60000);
        var days = Math.floor(totalMinutes / 1440);
        var hours = Math.floor((totalMinutes % 1440) / 60);
        var minutes = totalMinutes % 60;
        setText('[data-countdown-days]', pad(days, 3));
        setText('[data-countdown-hours]', pad(hours));
        setText('[data-countdown-minutes]', pad(minutes));
        setText('[data-countdown-accessible]', 'Faltam ' + days + ' dias, ' + hours + ' horas e ' + minutes + ' minutos para o início do evento.');
        var values = one('[data-countdown-values]');
        if (values) values.setAttribute('aria-label', 'Faltam ' + days + ' dias, ' + hours + ' horas e ' + minutes + ' minutos');
    }

    function startCountdown(now) {
        var countdown = one('[data-countdown]');
        if (!countdown) return;
        countdown.hidden = false;
        updateCountdown(now);
        stopCountdown();
        countdownTimer = root.setInterval(function () {
            updateCountdown(new Date());
        }, 60000);
    }

    function renderTemporalState(now) {
        var contractApi = api();
        if (!contractApi || !document) return 'UNKNOWN';
        var reference = now instanceof Date ? now : new Date(now);
        var state = contractApi.resolveTemporalState(reference);
        var edition = contractApi.contract.edition;
        var copy = temporalCopy(state, edition, reference);
        currentNow = reference;
        currentTemporalState = state;
        document.body.setAttribute('data-agro-temporal-state', state);
        setText('[data-temporal-hero-kicker]', copy.kicker);
        setText('[data-temporal-hero-lead]', copy.lead);
        setText('[data-temporal-status]', copy.status);
        all('[data-temporal-primary-action]').forEach(function (link) {
            link.textContent = copy.action;
            link.setAttribute('href', copy.actionTarget);
        });
        if (state === contractApi.TEMPORAL_STATE.PRE_EVENT) startCountdown(reference);
        else {
            stopCountdown();
            var countdown = one('[data-countdown]');
            if (countdown) countdown.hidden = true;
        }
        return state;
    }

    function element(tagName, className, text) {
        var node = document.createElement(tagName);
        if (className) node.className = className;
        if (typeof text === 'string') node.textContent = text;
        return node;
    }

    function fallbackProgramming(content, edition) {
        var wrapper = element('div', 'agro-program__fallback');
        var copy = element('div');
        copy.appendChild(element('p', 'agro-kicker', 'Acompanhe as novidades'));
        copy.appendChild(element('h3', '', 'Novas atrações serão divulgadas em breve.'));
        copy.appendChild(element('p', '', 'A programação será divulgada quando houver confirmação oficial.'));
        var link = element('a', 'agro-button agro-button--dark', 'Visitar site oficial');
        link.setAttribute('href', edition.officialUrl);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        wrapper.appendChild(copy);
        wrapper.appendChild(link);
        content.replaceChildren(wrapper);
    }

    function noProgrammingForDay(content) {
        var wrapper = element('div', 'agro-program__fallback');
        var copy = element('div');
        copy.appendChild(element('p', 'agro-kicker', 'Programação sendo divulgada'));
        copy.appendChild(element('h3', '', 'Novas atrações serão divulgadas em breve.'));
        copy.appendChild(element('p', '', 'Acompanhe os próximos anúncios desta edição.'));
        wrapper.appendChild(copy);
        content.replaceChildren(wrapper);
    }

    function renderProgramItems(content, items) {
        if (!items.length) {
            noProgrammingForDay(content);
            return;
        }
        var list = element('ol', 'agro-program-list');
        items.forEach(function (item) {
            var listItem = element('li', 'agro-program-item');
            if (item.featured) {
                listItem.classList.add('is-featured');
                listItem.classList.add('agro-program-item--spotlight');
            }
            var time = element('time', '', item.time || dateDay(item.date) + ' SET');
            time.setAttribute('datetime', item.time ? item.date + 'T' + item.time : item.date);
            var copy = element('div');
            copy.appendChild(element('h3', '', item.title));
            if (item.venue) copy.appendChild(element('p', '', item.venue));
            var category = element('span', '', item.category);
            listItem.appendChild(time);
            listItem.appendChild(copy);
            listItem.appendChild(category);
            list.appendChild(listItem);
        });
        var updateNote = element('p', 'agro-program__update-note', 'Novas atrações serão divulgadas em breve.');
        content.replaceChildren(list, updateNote);
    }

    function selectProgramDay(dateKey, tabs, content, programming) {
        tabs.forEach(function (tab) {
            var active = tab.getAttribute('data-program-date') === dateKey;
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
        });
        renderProgramItems(content, programming.items.filter(function (item) {
            return item.date === dateKey;
        }));
    }

    function renderProgramming(programmingInput) {
        var contractApi = api();
        var dayContainer = one('[data-program-days]');
        var content = one('[data-program-content]');
        if (!contractApi || !dayContainer || !content) return null;
        var edition = contractApi.contract.edition;
        var programming = contractApi.getPublicProgramming(programmingInput || edition.programming);
        if (edition.status === 'POSTPONED') {
            var postponedSection = one('#programacao');
            if (postponedSection) postponedSection.setAttribute('data-programming-status', 'POSTPONED');
            setText('[data-program-availability]', 'Evento adiado');
            dayContainer.replaceChildren();
            content.replaceChildren(
                element('h3', '', 'Programação será atualizada após a definição da nova data.'),
                element('p', '', edition.postponement.update)
            );
            return programming;
        }
        var dates = editionDates(edition);
        var labels = {
            UNAVAILABLE: 'Novidades em breve',
            PARTIAL: 'Anúncios em andamento',
            COMPLETE: 'Programação publicada'
        };
        setText('[data-program-availability]', labels[programming.availability] || 'Em atualização');
        var programSection = one('#programacao');
        if (programSection) programSection.setAttribute('data-programming-status', programming.availability);
        dayContainer.replaceChildren();
        var tabs = dates.map(function (dateKey, index) {
            var tab = element('button', 'agro-day-tab');
            tab.type = 'button';
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-controls', 'agro-program-panel');
            tab.setAttribute('aria-selected', String(index === 0));
            tab.setAttribute('data-program-date', dateKey);
            tab.tabIndex = index === 0 ? 0 : -1;
            var weekdayFull = dateWeekday(dateKey);
            var weekdayShort = dateWeekdayShort(dateKey);
            // Full weekday stays available to assistive tech even when the
            // narrow layout shows only the concise visual label.
            tab.setAttribute('aria-label', dateDay(dateKey) + ' de setembro, ' + weekdayFull);
            tab.appendChild(element('strong', '', dateDay(dateKey)));
            var weekdaySpan = element('span', '', 'SET · ');
            weekdaySpan.appendChild(element('span', 'agro-day-tab__full', weekdayFull));
            weekdaySpan.appendChild(element('span', 'agro-day-tab__short', weekdayShort));
            tab.appendChild(weekdaySpan);
            dayContainer.appendChild(tab);
            return tab;
        });
        content.id = 'agro-program-panel';
        content.setAttribute('role', 'tabpanel');
        if (programming.availability === contractApi.PROGRAMMING_AVAILABILITY.UNAVAILABLE) {
            tabs.forEach(function (tab) {
                tab.disabled = true;
                tab.setAttribute('aria-disabled', 'true');
            });
            fallbackProgramming(content, edition);
            return programming;
        }
        var today = currentTemporalState === contractApi.TEMPORAL_STATE.EVENT_LIVE
            ? localDateKey(currentNow, edition.temporal.timezone)
            : '';
        var announcedItem = programming.items.find(function (item) { return item.featured; }) || programming.items[0];
        var announcedDate = announcedItem && announcedItem.date;
        var initialDate = dates.includes(today) ? today : (dates.includes(announcedDate) ? announcedDate : dates[0]);
        tabs.forEach(function (tab, index) {
            tab.addEventListener('click', function () {
                selectProgramDay(tab.getAttribute('data-program-date'), tabs, content, programming);
            });
            tab.addEventListener('keydown', function (event) {
                var nextIndex = index;
                if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
                else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
                else if (event.key === 'Home') nextIndex = 0;
                else if (event.key === 'End') nextIndex = tabs.length - 1;
                else return;
                event.preventDefault();
                tabs[nextIndex].focus();
                tabs[nextIndex].click();
            });
        });
        selectProgramDay(initialDate, tabs, content, programming);
        return programming;
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

        function globalHeaderOffset() {
            var bodyPadding = root.getComputedStyle(document.body).paddingTop;
            var measuredOffset = Number.parseFloat(bodyPadding);
            return Number.isFinite(measuredOffset) ? measuredOffset : 0;
        }

        function updateLocalNavHeight() {
            if (!localNav) return;
            document.documentElement.style.setProperty(
                '--agro-local-nav-height',
                localNav.getBoundingClientRect().height + 'px'
            );
        }

        function updateFixedPosition() {
            scheduled = false;
            if (!slot || !localNav) return;
            var globalOffset = globalHeaderOffset();
            updateLocalNavHeight();
            localNav.classList.toggle('is-fixed', slot.getBoundingClientRect().top <= globalOffset);
        }

        function schedulePositionUpdate() {
            if (scheduled) return;
            scheduled = true;
            root.requestAnimationFrame(updateFixedPosition);
        }

        if (slot && localNav && root.requestAnimationFrame) {
            root.addEventListener('scroll', schedulePositionUpdate, { passive: true });
            root.addEventListener('resize', schedulePositionUpdate);
            updateFixedPosition();
            if (root.ResizeObserver) {
                var localNavObserver = new root.ResizeObserver(function () {
                    updateLocalNavHeight();
                    schedulePositionUpdate();
                });
                localNavObserver.observe(localNav);
            }
        }
        if (!root.IntersectionObserver) return;
        var links = all('.agro-local-nav a[href^="#"]');
        var sections = links.map(function (link) {
            return one(link.getAttribute('href'));
        }).filter(Boolean);
        if (!sections.length) return;

        // The active section is the last one whose top has passed the sticky
        // bars. A scroll-driven computation keeps the highlight in sync with
        // the visual position, which a narrow IntersectionObserver band
        // cannot do: after an anchor click the section sits above the band,
        // so the previous item stayed highlighted.
        function stickyOffset() {
            var nav = one('[data-local-nav]');
            var navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
            var a11y = one('[class*="acessibilidade"], [class*="a11y"]');
            var a11yBottom = a11y ? a11y.getBoundingClientRect().bottom : 0;
            return Math.max(navBottom, a11yBottom, 0);
        }

        function updateActiveSection() {
            var offset = stickyOffset();
            // The anchor scroll leaves the section top just below the sticky
            // bars (scroll-padding-top). Treat that landing zone as "reached"
            // so the clicked item becomes active instead of the previous one.
            var tolerance = 8;
            var current = sections[0];
            sections.forEach(function (section) {
                if (section.getBoundingClientRect().top - offset <= tolerance) current = section;
            });
            // The last section may be too short to reach the top of the
            // viewport; when the page is scrolled to the end, it is active.
            var atBottom = root.innerHeight + root.scrollY >= document.documentElement.scrollHeight - 2;
            if (atBottom) current = sections[sections.length - 1];
            links.forEach(function (link) {
                var active = link.getAttribute('href') === '#' + current.id;
                if (active) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
        }

        var activeScheduled = false;
        function scheduleActiveUpdate() {
            if (activeScheduled) return;
            activeScheduled = true;
            root.requestAnimationFrame(function () {
                activeScheduled = false;
                updateActiveSection();
            });
        }

        root.addEventListener('scroll', scheduleActiveUpdate, { passive: true });
        root.addEventListener('resize', scheduleActiveUpdate);
        // Re-evaluate after an anchor click settles the smooth scroll.
        links.forEach(function (link) {
            link.addEventListener('click', function () {
                root.setTimeout(updateActiveSection, 60);
                root.setTimeout(updateActiveSection, 320);
                root.setTimeout(updateActiveSection, 700);
            });
        });
        updateActiveSection();
    }

    function init() {
        if (!renderContractBasics()) return;
        renderTemporalState(new Date());
        renderProgramming();
        setupReveals();
        setupLocalNavigation();
    }

    var pageApi = Object.freeze({
        renderContractBasics: renderContractBasics,
        renderTemporalState: renderTemporalState,
        renderProgramming: renderProgramming,
        editionDates: function () {
            var contractApi = api();
            return contractApi ? Object.freeze(editionDates(contractApi.contract.edition).slice()) : Object.freeze([]);
        }
    });

    if ('AgroSamas2026Page' in root) {
        throw new Error('[AgroSamas2026Page] global namespace already registered');
    }
    Object.defineProperty(root, 'AgroSamas2026Page', {
        value: pageApi,
        writable: false,
        configurable: false,
        enumerable: false
    });

    if (document) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
        else init();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);
