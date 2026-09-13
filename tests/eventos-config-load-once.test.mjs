import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const navSource = readFileSync(join(root, 'js', 'nav-shared.js'), 'utf8');
const configSource = readFileSync(join(root, 'config.js'), 'utf8');
const configPages = [
  ['EVENTOS', 'eventos.html'],
  ['GALERIA', 'galeria.html'],
  ['NOTICIA', 'noticia.html'],
];

function externalScriptSources(html) {
  return Array.from(html.matchAll(/<script\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1[^>]*>/gi), (match) => match[2]);
}

function normalizedPath(src) {
  return src.split('?')[0].replace(/^\.\//, '');
}

for (const [label, page] of configPages) {
  test(`${label}_CONFIG_LOADS_ONCE`, () => {
    const source = readFileSync(join(root, page), 'utf8');
    const normalizedScripts = externalScriptSources(source).map(normalizedPath);
    const configIndexes = normalizedScripts
      .map((src, index) => (src === 'config.js' ? index : -1))
      .filter((index) => index >= 0);
    const navIndex = normalizedScripts.indexOf('js/nav-shared.js');

    assert.equal(configIndexes.length, 1, `${page} must declare exactly one static config.js authority`);
    assert.ok(navIndex >= 0, `${page} must load the shared navigation`);
    assert.ok(
      configIndexes[0] < navIndex,
      `${page} must load config.js before nav-shared.js so the shared loader cannot inject a duplicate`,
    );
  });
}

test('SHARED_NAV_REUSES_THE_CONFIG_AUTHORITY', () => {
  const configDependencyCount = (navSource.match(/^[ \t]*['"]config\.js['"],[ \t]*$/gm) ?? []).length;
  assert.equal(configDependencyCount, 1, 'the shared loader must keep a single config.js dependency entry');
});

test('CONFIG_AUTHORITY_REMAINS_CONFIG_JS', () => {
  assert.equal((configSource.match(/\bconst\s+CONFIG\s*=/g) ?? []).length, 1);
  assert.equal((configSource.match(/\bwindow\.CONFIG\s*=\s*CONFIG\s*;/g) ?? []).length, 1);
  assert.doesNotMatch(configSource, /\b(?:let|var)\s+CONFIG\s*=/);
});
