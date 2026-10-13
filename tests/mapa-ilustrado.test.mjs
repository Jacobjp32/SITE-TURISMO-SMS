import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const PINS_SOURCE = readFileSync(new URL('../js/mapa-ilustrado.js', import.meta.url), 'utf8');
const MAP_SOURCE = readFileSync(new URL('../js/mapa-turistico.js', import.meta.url), 'utf8');
const PAGE_SOURCE = readFileSync(new URL('../mapa-turistico.html', import.meta.url), 'utf8');
const CSS_SOURCE = readFileSync(new URL('../css/mapa-ilustrado.css', import.meta.url), 'utf8');

function loadPins() {
    const window = { L: { divIcon: (options) => options } };
    vm.runInContext(PINS_SOURCE, vm.createContext({ window }), { filename: 'js/mapa-ilustrado.js' });
    return window.MAPA_ILUSTRADO;
}

const MI = loadPins();

test('família de pins tem as oito silhuetas e os cinco marcos desenhados', () => {
    assert.deepEqual([...Object.keys(MI.FAMILIES)].sort(), ['culture', 'events', 'gastronomy', 'history', 'lodging', 'mate', 'nature', 'services'].sort());
    assert.deepEqual([...MI.LANDMARK_IDS].sort(), ['casa-da-memoria', 'igreja-agua-branca', 'igreja-matriz', 'ponte-rio-iguacu', 'vapor-pery'].sort());
    for (const family of Object.keys(MI.FAMILIES)) {
        const svg = MI.pinSvg(family);
        assert.match(svg, /^<svg class="mi-pin-svg" viewBox="0 0 44 56"/);
        assert.match(svg, /aria-hidden="true"/);
    }
});

test('a âncora do ícone é a ponta do traço (coordenada exata)', () => {
    const pin = MI.createIcon({ id: 'x', nome: 'X', tipo: 'restaurante', categoriaMapa: 'gastronomy' }, {});
    assert.deepEqual([...pin.iconAnchor], [22, 52.2]);
    const landmark = MI.createIcon({ id: 'igreja-matriz', nome: 'Igreja Matriz São Mateus' }, {});
    assert.deepEqual([...landmark.iconAnchor], [32, 75.6]);
});

test('localização aproximada troca o ponto cheio da âncora por anel tracejado', () => {
    const item = { id: 'y', nome: 'Y', tipo: 'ponto', categoriaMapa: 'nature' };
    const exact = MI.createIcon(item, { approx: false }).html;
    const approx = MI.createIcon(item, { approx: true }).html;
    assert.doesNotMatch(exact, /stroke-dasharray="1.7 1.3"/);
    assert.match(approx, /stroke-dasharray="1.7 1.3"/);
    assert.match(approx, /is-approx/);
});

test('erva-mate vem do nome/categoria do lugar, não das tags de roteiro', () => {
    assert.equal(MI.familyFor({ id: 'a', nome: 'Ervateira Taquaral', tipo: 'ponto', categoriaMapa: 'culture' }), 'mate');
    assert.equal(MI.familyFor({ id: 'b', nome: 'BierHerr', tipo: 'ponto', categoriaMapa: 'culture', tags: ['Rota da Erva-Mate'] }), 'culture');
    assert.equal(MI.familyFor({ id: 'c', nome: 'Hotel', tipo: 'hospedagem' }), 'lodging');
});

test('roseta de grupo com marco mostra o desenho do marco, sem âncora de coordenada', () => {
    const markers = [{ options: { miFamily: 'history', miLandmark: 'igreja-matriz' } }, { options: { miFamily: 'gastronomy', miLandmark: '' } }];
    const icon = MI.clusterIcon({ getAllChildMarkers: () => markers });
    assert.match(icon.html, /is-emblem/);
    assert.doesNotMatch(icon.html, /cy="72.6"/);
    const routeIcon = MI.clusterIcon({ getAllChildMarkers: () => markers }, { routeColor: '#2980b9' });
    assert.doesNotMatch(routeIcon.html, /is-emblem/);
    assert.match(routeIcon.html, /--mi-route:#2980b9/);
});

test('correções geográficas citam fonte e só agem sobre o valor antigo', () => {
    assert.match(MAP_SOURCE, /OpenStreetMap way 93278826/);
    assert.match(MAP_SOURCE, /OpenStreetMap way 243982311/);
    assert.match(MAP_SOURCE, /OpenStreetMap node 5676214480/);
    assert.match(MAP_SOURCE, /OpenStreetMap way 973886282/);
    assert.match(MAP_SOURCE, /Plus Code 6MP4\+RX/);
    assert.match(MAP_SOURCE, /Math\.abs\(coordinates\.lat - fix\.from\[0\]\) < 1e-6/);
});

test('fichas não exibem notas internas do cadastro', () => {
    const match = MAP_SOURCE.match(/function publicText\(value\) \{[\s\S]*?\n  \}/);
    assert.ok(match, 'publicText ausente');
    const publicText = vm.runInNewContext('(' + match[0].replace('function publicText', 'function') + ')');
    assert.equal(publicText('Centro — São Mateus do Sul, PR (confirmar endereço)'), 'Centro — São Mateus do Sul, PR');
    assert.equal(publicText('Rua X (a confirmar)'), 'Rua X');
});

test('camada ilustrada degrada com segurança sem o agrupamento ou sem a biblioteca de pins', () => {
    assert.match(MAP_SOURCE, /typeof L\.markerClusterGroup === "function"/);
    assert.match(MAP_SOURCE, /classList\.remove\("mi-on"\)/);
    assert.match(PAGE_SOURCE, /<body class="[^"]*\bmi-on\b/);
    assert.match(PAGE_SOURCE, /leaflet\.markercluster\/1\.5\.3\/leaflet\.markercluster\.js/);
    assert.match(PAGE_SOURCE, /<footer class="footer" id="footer">/);
    assert.match(CSS_SOURCE, /\.mi-routes-toggle/);
});
