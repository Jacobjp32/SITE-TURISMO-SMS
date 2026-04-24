/**
 * Small shared helpers for rendering user-controlled data safely.
 * Keep this file dependency-free so legacy inline scripts can use it.
 */
(function(window) {
    'use strict';

    var HTML_MAP = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };

    function valueOrFallback(value, fallback) {
        if (fallback === undefined) fallback = '';
        if (value === null || value === undefined) return fallback;
        var str = String(value);
        return str.trim() === '' ? fallback : str;
    }

    function escapeHTML(value, fallback) {
        return valueOrFallback(value, fallback).replace(/[&<>"']/g, function(ch) {
            return HTML_MAP[ch];
        });
    }

    function escapeAttr(value, fallback) {
        return escapeHTML(value, fallback).replace(/`/g, '&#96;');
    }

    function escapeJSString(value, fallback) {
        return valueOrFallback(value, fallback)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n')
            .replace(/</g, '\\x3c')
            .replace(/>/g, '\\x3e');
    }

    function safeURL(value, fallback) {
        fallback = fallback || '';
        var raw = valueOrFallback(value, fallback);
        if (!raw) return fallback;
        if (/['"()\\<>]/.test(raw)) return fallback;

        try {
            var url = new URL(raw, window.location.origin);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                return escapeAttr(raw);
            }
        } catch (err) {
            // Relative asset paths such as images/foo.jpg are allowed below.
        }

        if (/^(images|videos|docs|css|js)\//i.test(raw) || raw.charAt(0) === '/') {
            return escapeAttr(raw);
        }

        return fallback;
    }

    window.SMSecurity = {
        value: valueOrFallback,
        html: escapeHTML,
        attr: escapeAttr,
        js: escapeJSString,
        url: safeURL
    };
})(window);
