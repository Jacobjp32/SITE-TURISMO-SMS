(function (root) {
    'use strict';

    function currentLanguage(explicitLanguage) {
        const htmlLanguage = explicitLanguage || (root.document && root.document.documentElement
            ? root.document.documentElement.lang
            : 'pt');
        return String(htmlLanguage || 'pt').toLowerCase().split('-')[0];
    }

    function bind(language) {
        const api = root.AgroSamasContract;
        const document = root.document;
        if (!api || !document) return false;
        const edition = api.contract.edition;
        const languageCode = currentLanguage(language);
        const durationSuffix = {
            pt: 'dias',
            en: 'days',
            es: 'días',
            pl: 'dni'
        }[languageCode] || 'dias';
        const facts = edition.facts || {};
        const confirmedStatus = api.CONTENT_STATUS.CONFIRMED;
        const programming = api.getPublicProgramming(edition.programming);
        const featuredProgramItem = programming.items.find(function (item) { return item.featured; }) || programming.items[0] || null;
        const locale = {
            pt: 'pt-BR',
            en: 'en-US',
            es: 'es-ES',
            pl: 'pl-PL'
        }[languageCode] || 'pt-BR';
        const values = {
            'series-name': api.contract.series.name,
            name: edition.name,
            'date-range': api.formatDateRange(languageCode),
            'date-range-short': api.formatDateRange(languageCode, { short: true }),
            location: edition.location.name,
            'duration-days': edition.status === 'POSTPONED'
                ? api.formatDateRange(languageCode)
                : edition.durationDays + ' ' + durationSuffix,
            month: api.formatStartMonth(languageCode),
            year: String(edition.year)
        };
        if (featuredProgramItem) {
            values['featured-program-title'] = featuredProgramItem.title;
            var featuredDateParts = new Intl.DateTimeFormat(locale, {
                day: '2-digit',
                month: 'short',
                timeZone: 'UTC'
            }).formatToParts(new Date(featuredProgramItem.date + 'T12:00:00Z'));
            var featuredDay = featuredDateParts.find(function (part) { return part.type === 'day'; });
            var featuredMonth = featuredDateParts.find(function (part) { return part.type === 'month'; });
            values['featured-program-date'] = [featuredDay && featuredDay.value, featuredMonth && featuredMonth.value]
                .filter(Boolean)
                .join(' ')
                .replace('.', '')
                .toLocaleUpperCase(locale);
        }
        if (facts.missDate && facts.missDate.status === confirmedStatus) {
            values['miss-date'] = new Intl.DateTimeFormat(locale, {
                day: 'numeric',
                month: 'long',
                timeZone: 'UTC'
            }).format(new Date(facts.missDate.value + 'T12:00:00Z'));
        }
        if (facts.anniversaryIntegration && facts.anniversaryIntegration.status === confirmedStatus) {
            values['anniversary-years'] = String(facts.anniversaryIntegration.value.years);
        }
        document.querySelectorAll('[data-agrosamas-bind]').forEach(function (element) {
            const key = element.getAttribute('data-agrosamas-bind');
            if (Object.prototype.hasOwnProperty.call(values, key)) element.textContent = values[key];
        });
        document.querySelectorAll('[data-agrosamas-official-url]').forEach(function (element) {
            element.setAttribute('href', edition.officialUrl);
        });
        document.querySelectorAll('[data-agrosamas-logo]').forEach(function (element) {
            element.setAttribute('src', edition.brand.publicPath);
            element.setAttribute('width', String(edition.brand.width));
            element.setAttribute('height', String(edition.brand.height));
        });
        document.querySelectorAll('[data-agrosamas-featured-program]').forEach(function (element) {
            element.hidden = !featuredProgramItem;
        });
        document.querySelectorAll('[data-agrosamas-confirmed-fact]').forEach(function (element) {
            const fact = facts[element.getAttribute('data-agrosamas-confirmed-fact')];
            element.hidden = !(fact && fact.status === confirmedStatus);
        });
        return true;
    }

    if (root.document) {
        root.document.addEventListener('translationsApplied', function (event) {
            bind(event && event.detail && event.detail.lang);
        });
        root.document.addEventListener('DOMContentLoaded', function () { bind(); });
    }

    if ('AgroSamasContractBindings' in root) {
        throw new Error('[AgroSamasContractBindings] global namespace already registered');
    }
    Object.defineProperty(root, 'AgroSamasContractBindings', {
        value: Object.freeze({ bind }),
        writable: false,
        configurable: false,
        enumerable: false
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
