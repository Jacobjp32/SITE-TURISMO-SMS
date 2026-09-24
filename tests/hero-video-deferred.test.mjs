import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const HOME_SOURCE = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const INITIALIZER_URL = new URL('../js/home-hero-video.js', import.meta.url);
const INITIALIZER_EXISTS = existsSync(INITIALIZER_URL);
const INITIALIZER_SOURCE = INITIALIZER_EXISTS ? readFileSync(INITIALIZER_URL, 'utf8') : '';
const EXPECTED_VIDEO_PATH = 'videos/ROTA_DO_TURISMO.hero-720p-opt-v1.mp4';

function parseAttributes(source) {
    const attributes = new Map();
    const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

    for (const match of source.matchAll(pattern)) {
        attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
    }

    return attributes;
}

function readHeroMarkup() {
    const videoMatch = HOME_SOURCE.match(/<video\b([^>]*)class="[^"]*\bhero-video\b[^"]*"([^>]*)>([\s\S]*?)<\/video>/i);
    assert.ok(videoMatch, 'a home deve conter video.hero-video');

    const videoAttributes = parseAttributes(`${videoMatch[1]} ${videoMatch[2]}`);
    const sources = [...videoMatch[3].matchAll(/<source\b([^>]*)>/gi)]
        .map((match) => parseAttributes(match[1]));

    return { videoAttributes, sources };
}

function createRuntime({
    readyState = 'loading',
    reducedMotion = false,
    supportsIdleCallback = true,
    playRejects = false
} = {}) {
    const windowListeners = new Map();
    const idleCalls = [];
    const timeoutCalls = [];
    const sourceAttributes = new Map([['data-src', EXPECTED_VIDEO_PATH], ['type', 'video/mp4']]);
    const records = { load: 0, play: 0, playCatch: 0 };

    const source = {
        getAttribute(name) { return sourceAttributes.get(name) ?? null; },
        hasAttribute(name) { return sourceAttributes.has(name); },
        removeAttribute(name) { sourceAttributes.delete(name); },
        setAttribute(name, value) { sourceAttributes.set(name, String(value)); }
    };

    const video = {
        dataset: {},
        querySelector(selector) { return selector === 'source[data-src]' ? source : null; },
        load() { records.load += 1; },
        play() {
            records.play += 1;
            return {
                catch(handler) {
                    records.playCatch += 1;
                    if (playRejects) handler(new Error('autoplay blocked'));
                    return this;
                }
            };
        }
    };

    const window = {
        addEventListener(type, listener, options) {
            const listeners = windowListeners.get(type) || [];
            listeners.push({ listener, options });
            windowListeners.set(type, listeners);
        },
        matchMedia() { return { matches: reducedMotion }; },
        setTimeout(callback, delay) { timeoutCalls.push({ callback, delay }); return timeoutCalls.length; }
    };

    if (supportsIdleCallback) {
        window.requestIdleCallback = (callback, options) => {
            idleCalls.push({ callback, options });
            return idleCalls.length;
        };
    }

    const document = {
        readyState,
        querySelector(selector) { return selector === 'video.hero-video' ? video : null; }
    };

    return {
        context: vm.createContext({ document, window }),
        dispatchWindow(type) {
            for (const entry of windowListeners.get(type) || []) entry.listener.call(window, { type });
        },
        idleCalls,
        records,
        sourceAttributes,
        timeoutCalls,
        windowListeners
    };
}

test('hero poster and playback attributes remain while the MP4 is undiscoverable at parse time', () => {
    const { videoAttributes, sources } = readHeroMarkup();

    assert.equal(videoAttributes.get('poster'), 'images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg');
    assert.ok(videoAttributes.has('muted'));
    assert.ok(videoAttributes.has('loop'));
    assert.ok(videoAttributes.has('playsinline'));
    assert.equal(sources.length, 1);
    assert.ok(!sources[0].has('src'), 'the initial source must not expose a loadable URL');
    assert.equal(sources[0].get('data-src'), EXPECTED_VIDEO_PATH);
    assert.ok(!videoAttributes.has('autoplay'), 'autoplay must not control bootstrap playback');
    assert.equal(videoAttributes.get('preload'), 'none');
});

test('home loads the dedicated deferred hero initializer', () => {
    assert.ok(INITIALIZER_EXISTS, 'js/home-hero-video.js must exist');
    assert.match(HOME_SOURCE, /<script\b[^>]*src="js\/home-hero-video\.js\?v=[^"]+"[^>]*\bdefer\b[^>]*><\/script>/i);
});

test('initializer waits for window.load and then for an idle callback before loading once', { skip: !INITIALIZER_EXISTS }, () => {
    const runtime = createRuntime();
    vm.runInContext(INITIALIZER_SOURCE, runtime.context);

    assert.equal(runtime.sourceAttributes.has('src'), false);
    assert.equal(runtime.records.load, 0);
    assert.equal(runtime.records.play, 0);
    assert.equal(runtime.windowListeners.get('load')?.length, 1);
    assert.equal(runtime.windowListeners.get('load')[0].options?.once, true);

    runtime.dispatchWindow('load');
    assert.equal(runtime.sourceAttributes.has('src'), false);
    assert.equal(runtime.idleCalls.length, 1);
    assert.ok(runtime.idleCalls[0].options.timeout > 0);
    assert.ok(runtime.idleCalls[0].options.timeout <= 5000);

    runtime.idleCalls[0].callback();
    assert.equal(runtime.sourceAttributes.get('src'), EXPECTED_VIDEO_PATH);
    assert.equal(runtime.sourceAttributes.has('data-src'), false);
    assert.equal(runtime.records.load, 1);
    assert.equal(runtime.records.play, 1);
    assert.equal(runtime.records.playCatch, 1);

    runtime.dispatchWindow('load');
    runtime.idleCalls[0].callback();
    assert.equal(runtime.records.load, 1, 'initializer must be idempotent');
    assert.equal(runtime.records.play, 1, 'initializer must not duplicate playback requests');
});

test('initializer handles play rejection without throwing', { skip: !INITIALIZER_EXISTS }, () => {
    const runtime = createRuntime({ readyState: 'complete', playRejects: true });
    vm.runInContext(INITIALIZER_SOURCE, runtime.context);

    assert.equal(runtime.idleCalls.length, 1);
    assert.doesNotThrow(() => runtime.idleCalls[0].callback());
    assert.equal(runtime.records.playCatch, 1);
});

test('initializer uses a short timer fallback when requestIdleCallback is unavailable', { skip: !INITIALIZER_EXISTS }, () => {
    const runtime = createRuntime({ supportsIdleCallback: false });
    vm.runInContext(INITIALIZER_SOURCE, runtime.context);

    runtime.dispatchWindow('load');
    assert.equal(runtime.timeoutCalls.length, 1);
    assert.ok(runtime.timeoutCalls[0].delay >= 0);
    assert.ok(runtime.timeoutCalls[0].delay <= 250);
    assert.equal(runtime.sourceAttributes.has('src'), false);

    runtime.timeoutCalls[0].callback();
    assert.equal(runtime.sourceAttributes.get('src'), EXPECTED_VIDEO_PATH);
    assert.equal(runtime.records.load, 1);
    assert.equal(runtime.records.play, 1);
});

test('initializer preserves the existing reduced-motion no-autoplay policy', { skip: !INITIALIZER_EXISTS }, () => {
    const runtime = createRuntime({ reducedMotion: true });
    vm.runInContext(INITIALIZER_SOURCE, runtime.context);

    runtime.dispatchWindow('load');
    runtime.idleCalls[0].callback();
    assert.equal(runtime.sourceAttributes.has('src'), false);
    assert.equal(runtime.records.load, 0);
    assert.equal(runtime.records.play, 0);
});
