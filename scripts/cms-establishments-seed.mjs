#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TARGET_COLLECTION = 'cms_establishments';
const SEED_BY = 'cms-2c-seed-script';
const DEFAULT_STATUS = 'draft';

const STATIC_FILES = [
  'js/locais-data.js',
  'js/data/restaurantes.js',
  'js/data/hospedagens.js',
  'js/data/pontos-turisticos.js',
  'js/data/rotas.js',
  'js/data/informacoes-essenciais.js',
  'js/data/eventos.js',
  'js/rotas-data.js'
];

const SEED_SOURCES = [
  {
    key: 'restaurantes',
    file: 'js/data/restaurantes.js',
    label: 'Gastronomia',
    priority: 90,
    getItems: win => ensureArray(win.TURISMO_RESTAURANTES),
    defaultCategoryId: 'gastronomia',
    claimable: true
  },
  {
    key: 'hospedagens',
    file: 'js/data/hospedagens.js',
    label: 'Hospedagem',
    priority: 88,
    getItems: win => ensureArray(win.TURISMO_HOSPEDAGENS),
    defaultCategoryId: 'hospedagem',
    claimable: true
  },
  {
    key: 'locaisData',
    file: 'js/locais-data.js',
    label: 'Locais dedicados',
    priority: 84,
    getItems: win => Object.values(win.locaisData || {}),
    defaultCategoryId: 'ponto_turistico',
    claimable: false
  },
  {
    key: 'pontos',
    file: 'js/data/pontos-turisticos.js',
    label: 'Pontos turisticos',
    priority: 80,
    getItems: win => ensureArray(win.TURISMO_PONTOS),
    defaultCategoryId: 'ponto_turistico',
    claimable: false
  },
  {
    key: 'rotasLegado',
    file: 'js/rotas-data.js',
    label: 'Empreendimentos das rotas legadas',
    priority: 65,
    getItems: win => ensureArray(win.ROTAS_LEGADO_ESTABLISHMENTS),
    defaultCategoryId: 'experiencia_turistica',
    claimable: true
  }
];

const IGNORED_SOURCES = [
  {
    key: 'rotas',
    file: 'js/data/rotas.js',
    reason: 'rotas tematicas pertencem a modulo proprio, nao ao catalogo de empreendimentos',
    getItems: win => ensureArray(win.TURISMO_ROTAS)
  },
  {
    key: 'informacoesEssenciais',
    file: 'js/data/informacoes-essenciais.js',
    reason: 'cards informativos/servicos de navegacao, nao registros de empreendimento',
    getItems: win => ensureArray(win.TURISMO_INFORMACOES_ESSENCIAIS)
  },
  {
    key: 'eventos',
    file: 'js/data/eventos.js',
    reason: 'eventos usam fluxo e collection proprios',
    getItems: win => ensureArray(win.TURISMO_EVENTOS)
  }
];

const ROUTE_ID_BY_KEY = {
  sabores: 'sabores-memorias',
  mate: 'rota-erva-mate',
  erva: 'rota-erva-mate',
  'erva-mate': 'rota-erva-mate',
  polonesa: 'rota-polonesa',
  aguas: 'rota-das-aguas',
  água: 'rota-das-aguas',
  agua: 'rota-das-aguas',
  terra: 'rota-da-terra',
  rural: 'rota-da-terra',
  fluviop: 'caminhos-de-fluviopolis',
  fluviopolis: 'caminhos-de-fluviopolis'
};

const KNOWN_FIELDS = new Set([
  'id', 'nome', 'name', 'title', 'categoria', 'subtitulo', 'subtitle', 'badge',
  'descricao', 'descricaoLonga', 'desc', 'historia', 'imagem', 'image', 'galeria',
  'images', 'url', 'telefone', 'phone', 'whatsapp', 'site', 'website',
  'instagram', 'social', 'facebook', 'email', 'localizacao', 'location',
  'local', 'endereco', 'address', 'horario', 'hours', 'periodo', 'coordenadas',
  'coordinates', 'lat', 'lng', 'mapsUrl', 'tags', 'rota', 'route', 'routes',
  'acessibilidade', 'coordStatus', 'coordNote', 'videoUrl'
]);

function parseArgs(argv) {
  const args = {
    dryRun: false,
    exportJson: '',
    apply: false,
    confirm: false,
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--export-json') {
      args.exportJson = argv[i + 1] || '';
      i += 1;
    } else if (arg.startsWith('--export-json=')) {
      args.exportJson = arg.slice('--export-json='.length);
    } else if (arg === '--apply') args.apply = true;
    else if (arg === '--confirm-cms-establishments-seed') args.confirm = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Argumento desconhecido: ${arg}`);
  }

  if (!args.apply && !args.exportJson) args.dryRun = true;
  return args;
}

function printHelp() {
  console.log(`Uso:
  node scripts/cms-establishments-seed.mjs --dry-run
  node scripts/cms-establishments-seed.mjs --export-json docs/cms-establishments-seed-preview.json
  node scripts/cms-establishments-seed.mjs --apply --confirm-cms-establishments-seed

Observacao: o modo apply recusa escrita neste bloco CMS-2C. Use dry-run/export-json para revisar o diff.`);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value) {
  return String(value == null ? '' : value)
    .replace(/\u0000/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function longText(value) {
  return String(value == null ? '' : value)
    .replace(/\u0000/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function limit(value, max) {
  const text = clean(value);
  return text.length > max ? text.slice(0, max) : text;
}

function normalizeText(value) {
  return clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function slugify(value, fallback = 'empreendimento') {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || fallback;
}

function first(values) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return '';
}

function firstLong(values) {
  for (const value of values) {
    const text = longText(value);
    if (text) return text;
  }
  return '';
}

function uniqueList(values) {
  const seen = new Set();
  const result = [];
  ensureArray(values).flatMap(value => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(/[,;\n]+/);
    return [value];
  }).forEach(value => {
    const text = clean(value);
    const key = normalizeText(text);
    if (text && !seen.has(key)) {
      seen.add(key);
      result.push(text);
    }
  });
  return result;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function getCoordinates(item) {
  if (item && item.coordenadas && isFiniteNumber(item.coordenadas.lat) && isFiniteNumber(item.coordenadas.lng)) {
    return { lat: item.coordenadas.lat, lng: item.coordenadas.lng };
  }
  if (item && item.coordinates && isFiniteNumber(item.coordinates.lat) && isFiniteNumber(item.coordinates.lng)) {
    return { lat: item.coordinates.lat, lng: item.coordinates.lng };
  }
  if (item && isFiniteNumber(item.lat) && isFiniteNumber(item.lng)) {
    return { lat: item.lat, lng: item.lng };
  }
  return { lat: null, lng: null };
}

function normalizeWebsite(value) {
  const text = clean(value);
  if (!text || text.startsWith('@')) return '';
  if (/^https?:\/\//i.test(text)) return text;
  if (/^www\./i.test(text)) return `https://${text}`;
  return '';
}

function normalizeInstagram(value) {
  const text = clean(value);
  if (!text) return '';
  if (text.startsWith('@')) return text;
  if (/instagram\.com\//i.test(text)) return text;
  return '';
}

function splitSocial(item) {
  const values = [item.instagram, item.social, item.site, item.website, item.facebook].map(clean).filter(Boolean);
  return {
    instagram: first(values.map(normalizeInstagram)),
    website: first(values.map(normalizeWebsite)),
    facebook: first(values.filter(value => /facebook\.com/i.test(value)))
  };
}

function classifyCategory(rawCategory, sourceConfig, item) {
  const rawText = normalizeText(rawCategory);
  if (/hosped|hotel|pousada/.test(rawText)) return { id: 'hospedagem', label: 'Hospedagem' };
  if (/gastronom|restaurante|cafe|cafe|feira|sabores|churrasc|panific|doce|queijo|almoco|almoço/.test(rawText)) {
    return { id: 'gastronomia', label: 'Gastronomia' };
  }
  if (/institucional|prefeitura|secretaria|departamento/.test(rawText)) return { id: 'institucional', label: 'Institucional' };
  if (/servic|mapa|clima|informac/.test(rawText)) return { id: 'servico', label: 'Servico' };
  if (/rural|terra|propriedade|sitio|sítio|viveiro/.test(rawText)) return { id: 'turismo_rural', label: 'Turismo rural' };
  if (/natureza|lazer|rio|aguas|águas|ponte|parque|cartao|cartão/.test(rawText)) return { id: 'natureza_lazer', label: 'Natureza e lazer' };
  if (/cultur|histori|patrim|memoria|polones|erva|igreja|fé|fe|esporte|museu/.test(rawText)) {
    return { id: 'experiencia_cultural', label: 'Experiencia cultural' };
  }

  const text = normalizeText([
    item && item.nome,
    item && item.name,
    item && item.descricao,
    item && item.desc,
    item && item.rota,
    item && item.route,
    ensureArray(item && item.tags).join(' ')
  ].join(' '));

  if (/hosped|hotel|pousada/.test(text)) return { id: 'hospedagem', label: 'Hospedagem' };
  if (/gastronom|restaurante|cafe|cafe|feira|sabores|churrasc|panific|doce|queijo|almoco|almoço/.test(text)) {
    return { id: 'gastronomia', label: 'Gastronomia' };
  }
  if (/institucional|prefeitura|secretaria|departamento/.test(text)) return { id: 'institucional', label: 'Institucional' };
  if (/servic|mapa|clima|informac/.test(text)) return { id: 'servico', label: 'Servico' };
  if (/rural|terra|propriedade|sitio|sítio|viveiro/.test(text)) return { id: 'turismo_rural', label: 'Turismo rural' };
  if (/natureza|lazer|rio|aguas|águas|ponte|parque|nautic|pesca/.test(text)) return { id: 'natureza_lazer', label: 'Natureza e lazer' };
  if (/cultur|histori|patrim|memoria|polones|erva|igreja|fé|fe/.test(text)) {
    return { id: 'experiencia_cultural', label: 'Experiencia cultural' };
  }
  if (sourceConfig.defaultCategoryId === 'experiencia_turistica') {
    return { id: 'experiencia_turistica', label: 'Experiencia turistica' };
  }
  return { id: sourceConfig.defaultCategoryId, label: sourceConfig.label };
}

function getRouteIds(item) {
  const rawValues = []
    .concat(ensureArray(item.routes))
    .concat([item.route, item.rota])
    .filter(Boolean);
  const routeIds = [];
  rawValues.forEach(value => {
    const raw = clean(value);
    const normalized = slugify(raw, '');
    const compact = normalizeText(raw);
    const mapped = ROUTE_ID_BY_KEY[raw] || ROUTE_ID_BY_KEY[normalized] || ROUTE_ID_BY_KEY[compact];
    if (mapped) routeIds.push(mapped);
    else if (normalized) routeIds.push(normalized);
  });
  return uniqueList(routeIds);
}

function buildImageList(item) {
  const images = []
    .concat(ensureArray(item.galeria))
    .concat(ensureArray(item.images))
    .map(clean)
    .filter(Boolean);
  const mainImage = first([item.imagem, item.image, item.mainImage, images[0]]);
  if (mainImage && !images.includes(mainImage)) images.unshift(mainImage);
  return uniqueList(images);
}

function imageObject(url, index = 1) {
  return {
    url,
    path: '',
    alt: '',
    caption: '',
    credit: '',
    source: /^https?:\/\//i.test(url) ? 'external' : 'static',
    position: index
  };
}

function localAssetExists(url) {
  const text = clean(url);
  if (!text || /^https?:\/\//i.test(text) || text.startsWith('data:')) return true;
  const withoutQuery = text.replace(/[?#].*$/, '').replace(/^\/+/, '');
  return fs.existsSync(path.join(ROOT, withoutQuery));
}

function sourceKey(sourceConfig, item) {
  return `${sourceConfig.key}:${clean(item.id || item.nome || item.name)}`;
}

function normalizeItem(item, sourceConfig, seededAt) {
  const rawName = first([item.nome, item.name, item.title]);
  const rawId = first([item.id, rawName]);
  const id = slugify(rawId || rawName);
  const rawCategory = first([item.categoria, sourceConfig.label]);
  const category = classifyCategory(rawCategory, sourceConfig, item);
  const social = splitSocial(item);
  const coordinates = getCoordinates(item);
  const images = buildImageList(item);
  const summary = firstLong([item.descricao, item.desc, item.subtitulo, item.subtitle, item.historia]);
  const description = firstLong([item.descricaoLonga, item.descricao, item.desc, item.historia, item.subtitle]);
  const longDescription = firstLong([item.historia, item.descricaoLonga, item.subtitle]);
  const routeIds = getRouteIds(item);

  const doc = {
    id,
    slug: id,
    name: limit(rawName, 160),
    categoryId: category.id,
    categoryLabel: category.label,
    status: DEFAULT_STATUS,
    content: {
      summary: limit(summary, 500),
      description: limit(description, 4000),
      longDescription: limit(longDescription, 8000),
      accessibility: limit(item.acessibilidade, 1000),
      openingHours: limit(first([item.horario, item.hours, item.periodo]), 500),
      tags: uniqueList([item.tags, rawCategory, item.badge, item.rota, item.route, item.subtitle, item.subtitulo]).slice(0, 30),
      notesInternal: ''
    },
    contact: {
      phone: limit(first([item.telefone, item.phone]), 120),
      whatsapp: limit(item.whatsapp, 120),
      email: limit(item.email, 160),
      website: limit(first([item.website, social.website]), 240),
      instagram: limit(first([item.instagram, social.instagram]), 160),
      facebook: limit(first([item.facebook, social.facebook]), 160)
    },
    location: {
      address: limit(first([item.localizacao, item.location, item.endereco, item.local, item.address]), 240),
      neighborhood: '',
      city: 'Sao Mateus do Sul',
      state: 'PR',
      postalCode: '',
      coordinates,
      mapsUrl: limit(item.mapsUrl, 600),
      coordStatus: limit(item.coordStatus, 80),
      coordNote: limit(item.coordNote, 500)
    },
    media: {
      mainImage: images[0] ? imageObject(images[0], 1) : imageObject('', 1),
      gallery: images.map((url, index) => imageObject(url, index + 1)).filter(image => image.url),
      videoUrl: limit(item.videoUrl, 600),
      sourceCredits: ''
    },
    relationships: {
      routeIds,
      relatedPlaceIds: [],
      relatedEventIds: [],
      legacyRoute: limit(first([item.route, item.rota]), 120),
      legacyRouteName: limit(first([item.legacyRouteName, item.rota, item.route]), 160)
    },
    display: {
      featured: false,
      priority: 0,
      mapVisible: true,
      claimable: sourceConfig.claimable === true
    },
    seo: {
      title: '',
      description: '',
      canonicalPath: limit(/^\/local|^local/i.test(clean(item.url)) ? item.url : '', 240)
    },
    publishing: {
      publishedAt: null,
      publishedBy: '',
      archivedAt: null,
      archivedBy: '',
      archiveReason: ''
    },
    review: {
      lastAppliedRequestId: '',
      lastAppliedAt: null,
      lastAppliedBy: '',
      lastReviewNotes: ''
    },
    source: {
      origin: 'static_seed',
      sourceFile: sourceConfig.file,
      originalId: clean(rawId),
      originalCategory: rawCategory,
      legacyIds: [sourceKey(sourceConfig, item)],
      seededAt,
      sourceUpdatedAt: null
    },
    createdAt: null,
    createdBy: SEED_BY,
    updatedAt: null,
    updatedBy: SEED_BY
  };

  return doc;
}

function loadStaticContext() {
  const context = {
    window: {},
    console: { log() {}, warn() {}, error() {} }
  };
  context.window.window = context.window;
  vm.createContext(context);

  const loaded = [];
  STATIC_FILES.forEach(file => {
    const abs = path.join(ROOT, file);
    const source = fs.readFileSync(abs, 'utf8');
    vm.runInContext(source, context, { filename: file });
    loaded.push({ file, bytes: Buffer.byteLength(source) });
  });
  return { window: context.window, loaded };
}

function collectFieldInventory(items) {
  const counts = {};
  items.forEach(item => {
    Object.keys(item || {}).forEach(key => {
      counts[key] = (counts[key] || 0) + 1;
    });
  });
  return counts;
}

function mergeDocs(primary, duplicate, conflict) {
  const merged = structuredClone(primary);
  merged.source.legacyIds = uniqueList([primary.source.legacyIds, duplicate.source.legacyIds]);
  if (!merged.source.sourceFile.includes(duplicate.source.sourceFile)) {
    merged.source.sourceFile = `${merged.source.sourceFile}; ${duplicate.source.sourceFile}`;
  }
  if (!merged.source.originalCategory && duplicate.source.originalCategory) {
    merged.source.originalCategory = duplicate.source.originalCategory;
  }
  ['summary', 'description', 'longDescription', 'openingHours', 'accessibility'].forEach(field => {
    if (!merged.content[field] && duplicate.content[field]) merged.content[field] = duplicate.content[field];
  });
  ['phone', 'whatsapp', 'email', 'website', 'instagram', 'facebook'].forEach(field => {
    if (!merged.contact[field] && duplicate.contact[field]) merged.contact[field] = duplicate.contact[field];
  });
  if (!merged.location.address && duplicate.location.address) merged.location.address = duplicate.location.address;
  if (merged.location.coordinates.lat == null && duplicate.location.coordinates.lat != null) {
    merged.location.coordinates = duplicate.location.coordinates;
  }
  if (!merged.location.mapsUrl && duplicate.location.mapsUrl) merged.location.mapsUrl = duplicate.location.mapsUrl;
  merged.content.tags = uniqueList([merged.content.tags, duplicate.content.tags]).slice(0, 30);
  merged.relationships.routeIds = uniqueList([merged.relationships.routeIds, duplicate.relationships.routeIds]);
  merged.media.gallery = mergeGallery(merged.media.gallery, duplicate.media.gallery);
  if (!merged.media.mainImage.url && duplicate.media.mainImage.url) merged.media.mainImage = duplicate.media.mainImage;
  conflict.action = 'merged_by_id_preserving_primary_source';
  return merged;
}

function mergeGallery(a, b) {
  const urls = new Set();
  return ensureArray(a).concat(ensureArray(b)).filter(image => {
    if (!image || !image.url || urls.has(image.url)) return false;
    urls.add(image.url);
    return true;
  }).map((image, index) => ({ ...image, position: index + 1 }));
}

function analyzeDocs(docs, rawCandidates, ignoredRecords, sourceSummaries) {
  const conflicts = [];
  const missingFields = [];
  const typeWarnings = [];
  const imageProblems = [];
  const unmappedFields = [];

  rawCandidates.forEach(candidate => {
    Object.keys(candidate.item || {}).forEach(field => {
      if (!KNOWN_FIELDS.has(field)) {
        unmappedFields.push({
          source: candidate.source.key,
          id: clean(candidate.item.id || candidate.item.nome || candidate.item.name),
          field,
          action: 'preserved only through source/original data reference if needed'
        });
      }
    });
  });

  docs.forEach(doc => {
    const missing = [];
    if (!doc.name) missing.push('name');
    if (!doc.content.summary) missing.push('content.summary');
    if (!doc.location.address) missing.push('location.address');
    if (doc.location.coordinates.lat == null || doc.location.coordinates.lng == null) missing.push('location.coordinates');
    if (!doc.media.mainImage.url) missing.push('media.mainImage.url');
    if (missing.length) missingFields.push({ id: doc.id, name: doc.name, missing });

    if ((doc.location.coordinates.lat == null) !== (doc.location.coordinates.lng == null)) {
      typeWarnings.push({ id: doc.id, field: 'location.coordinates', issue: 'lat/lng incompletos' });
    }

    ensureArray(doc.media.gallery).forEach(image => {
      if (!image.url) return;
      if (/\.(heic|dng)$/i.test(image.url)) {
        imageProblems.push({ id: doc.id, url: image.url, issue: 'formato nao recomendado para web/CMS' });
      }
      if (!localAssetExists(image.url)) {
        imageProblems.push({ id: doc.id, url: image.url, issue: 'arquivo local nao encontrado' });
      }
    });
  });

  const byName = new Map();
  docs.forEach(doc => {
    const key = normalizeText(doc.name);
    if (!key) return;
    const list = byName.get(key) || [];
    list.push(doc.id);
    byName.set(key, list);
  });
  byName.forEach((ids, nameKey) => {
    if (ids.length > 1) {
      conflicts.push({ type: 'duplicate_name', nameKey, ids, action: 'review_before_apply' });
    }
  });

  const byCoordinates = new Map();
  docs.forEach(doc => {
    const { lat, lng } = doc.location.coordinates;
    if (lat == null || lng == null) return;
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const list = byCoordinates.get(key) || [];
    list.push(doc.id);
    byCoordinates.set(key, list);
  });
  byCoordinates.forEach((ids, key) => {
    if (ids.length > 1) {
      conflicts.push({ type: 'near_coordinate_match', coordinateKey: key, ids, action: 'review_before_apply' });
    }
  });

  return {
    sourceSummaries,
    conflicts,
    missingFields,
    typeWarnings,
    imageProblems,
    unmappedFields,
    ignoredRecords
  };
}

function buildPreview() {
  const seededAt = new Date().toISOString();
  const { window, loaded } = loadStaticContext();
  const sourceSummaries = [];
  const rawCandidates = [];
  const ignoredRecords = [];

  SEED_SOURCES.forEach(source => {
    const items = source.getItems(window);
    sourceSummaries.push({
      key: source.key,
      file: source.file,
      total: items.length,
      action: 'seed_candidate',
      fields: collectFieldInventory(items)
    });
    items.forEach((item, index) => rawCandidates.push({ source, item, index }));
  });

  IGNORED_SOURCES.forEach(source => {
    const items = source.getItems(window);
    sourceSummaries.push({
      key: source.key,
      file: source.file,
      total: items.length,
      action: 'ignored',
      reason: source.reason,
      fields: collectFieldInventory(items)
    });
    items.forEach(item => {
      ignoredRecords.push({
        source: source.key,
        sourceFile: source.file,
        id: clean(item.id || item.nome || item.name),
        name: clean(item.nome || item.name),
        reason: source.reason
      });
    });
  });

  const byId = new Map();
  const idConflicts = [];
  rawCandidates.forEach(candidate => {
    const doc = normalizeItem(candidate.item, candidate.source, seededAt);
    const existing = byId.get(doc.id);
    if (!existing) {
      byId.set(doc.id, { doc, priority: candidate.source.priority });
      return;
    }
    const conflict = {
      type: 'duplicate_id',
      id: doc.id,
      sources: [existing.doc.source.sourceFile, doc.source.sourceFile],
      legacyIds: uniqueList([existing.doc.source.legacyIds, doc.source.legacyIds])
    };
    if (candidate.source.priority > existing.priority) {
      const merged = mergeDocs(doc, existing.doc, conflict);
      byId.set(doc.id, { doc: merged, priority: candidate.source.priority });
    } else {
      existing.doc = mergeDocs(existing.doc, doc, conflict);
      byId.set(doc.id, existing);
    }
    idConflicts.push(conflict);
  });

  const records = Array.from(byId.values())
    .map(entry => entry.doc)
    .sort((a, b) => a.id.localeCompare(b.id, 'pt-BR'));

  const analysis = analyzeDocs(records, rawCandidates, ignoredRecords, sourceSummaries);
  analysis.conflicts.unshift(...idConflicts);

  const totalRaw = sourceSummaries.reduce((sum, item) => sum + item.total, 0);
  const candidateCount = rawCandidates.length;

  return {
    metadata: {
      generatedAt: seededAt,
      script: 'scripts/cms-establishments-seed.mjs',
      targetCollection: TARGET_COLLECTION,
      defaultStatus: DEFAULT_STATUS,
      seededBy: SEED_BY,
      dryRunOnly: true,
      applyImplemented: false,
      loadedFiles: loaded
    },
    totals: {
      rawRecordsFound: totalRaw,
      seedCandidates: candidateCount,
      ignoredRecords: ignoredRecords.length,
      normalizedRecords: records.length,
      wouldCreate: records.length,
      wouldUpdate: 0,
      conflicts: analysis.conflicts.length,
      missingFieldGroups: analysis.missingFields.length,
      typeWarnings: analysis.typeWarnings.length,
      imageProblems: analysis.imageProblems.length,
      unmappedFields: analysis.unmappedFields.length
    },
    diff: {
      note: 'Sem leitura do Firestore neste bloco; todos os docs normalizados aparecem como wouldCreate para revisao local. O apply real deve fazer diff live antes de gravar.',
      wouldCreate: records.map(doc => doc.id),
      wouldUpdate: [],
      skipped: ignoredRecords,
      protectedFields: [
        'content.description',
        'media.gallery',
        'display.featured',
        'display.priority',
        'status',
        'publishing.publishedAt',
        'publishing.publishedBy',
        'publishing.archivedAt',
        'publishing.archivedBy',
        'review.lastAppliedRequestId',
        'review.lastAppliedAt',
        'review.lastAppliedBy'
      ]
    },
    records,
    warnings: {
      sourceSummaries: analysis.sourceSummaries,
      conflicts: analysis.conflicts,
      missingFields: analysis.missingFields,
      typeWarnings: analysis.typeWarnings,
      imageProblems: analysis.imageProblems,
      unmappedFields: analysis.unmappedFields
    }
  };
}

function printDryRun(preview) {
  console.log('CMS-2C seed/diff dry-run');
  console.log(`Target collection: ${preview.metadata.targetCollection}`);
  console.log(`Status padrao: ${preview.metadata.defaultStatus}`);
  console.log(`Registros brutos lidos: ${preview.totals.rawRecordsFound}`);
  console.log(`Candidatos a seed: ${preview.totals.seedCandidates}`);
  console.log(`Ignorados: ${preview.totals.ignoredRecords}`);
  console.log(`Normalizados: ${preview.totals.normalizedRecords}`);
  console.log(`Would create: ${preview.totals.wouldCreate}`);
  console.log(`Would update: ${preview.totals.wouldUpdate}`);
  console.log(`Conflitos/duplicidades: ${preview.totals.conflicts}`);
  console.log(`Campos ausentes: ${preview.totals.missingFieldGroups}`);
  console.log(`Problemas de imagem: ${preview.totals.imageProblems}`);
  console.log('');
  console.log('Fontes:');
  preview.warnings.sourceSummaries.forEach(source => {
    const suffix = source.action === 'ignored' ? ` (ignorado: ${source.reason})` : '';
    console.log(`- ${source.key}: ${source.total}${suffix}`);
  });
  console.log('');
  console.log('Primeiros documentos normalizados:');
  preview.records.slice(0, 20).forEach(doc => {
    console.log(`- ${doc.id} | ${doc.name || '(sem nome)'} | ${doc.categoryId} | ${doc.source.sourceFile}`);
  });
  if (preview.records.length > 20) {
    console.log(`- ... ${preview.records.length - 20} outros`);
  }
}

function exportJson(preview, outputPath) {
  if (!outputPath) throw new Error('Informe o caminho apos --export-json.');
  const absolute = path.resolve(ROOT, outputPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  console.log(`Preview JSON gerado em ${path.relative(ROOT, absolute)}`);
}

function refuseApply(args) {
  if (!args.confirm) {
    console.error('Apply recusado: use --apply --confirm-cms-establishments-seed para confirmar explicitamente.');
    process.exitCode = 2;
    return;
  }
  console.error([
    'Apply nao implementado no CMS-2C.',
    'Motivo: este bloco e de diff/dry-run; nao ha Firebase Admin SDK/credenciais configuradas localmente e escrita real exigiria diff live antes de gravar.',
    'Use --dry-run e --export-json para revisar o payload. Implementar escrita controlada em CMS-2D.'
  ].join('\n'));
  process.exitCode = 2;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }
  if (args.apply) {
    refuseApply(args);
    return;
  }
  const preview = buildPreview();
  if (args.dryRun || !args.exportJson) printDryRun(preview);
  if (args.exportJson) exportJson(preview, args.exportJson);
}

try {
  main();
} catch (error) {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
}
