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
const FIRESTORE_DATABASE = '(default)';
const FIRESTORE_TOKEN_ENV_KEYS = [
  'FIRESTORE_REST_TOKEN',
  'GOOGLE_OAUTH_ACCESS_TOKEN',
  'FIREBASE_AUTH_TOKEN'
];
const SAFE_UPDATE_FIELDS = [
  'source.sourceFile',
  'source.originalId',
  'source.originalCategory',
  'source.legacyIds',
  'source.seededAt',
  'source.sourceUpdatedAt'
];
const PROTECTED_FIELDS = [
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
  'review.lastAppliedBy',
  'createdAt',
  'createdBy'
];
const IGNORED_DIFF_FIELDS = [
  'createdAt',
  'updatedAt',
  'source.seededAt'
];

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
    liveDiff: false,
    exportJson: '',
    apply: false,
    confirm: false,
    projectId: '',
    authToken: '',
    actorUid: '',
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--live-diff') args.liveDiff = true;
    else if (arg === '--export-json') {
      args.exportJson = argv[i + 1] || '';
      i += 1;
    } else if (arg.startsWith('--export-json=')) {
      args.exportJson = arg.slice('--export-json='.length);
    } else if (arg === '--apply') args.apply = true;
    else if (arg === '--confirm-cms-establishments-seed') args.confirm = true;
    else if (arg === '--project-id') {
      args.projectId = argv[i + 1] || '';
      i += 1;
    } else if (arg.startsWith('--project-id=')) {
      args.projectId = arg.slice('--project-id='.length);
    } else if (arg === '--auth-token') {
      args.authToken = argv[i + 1] || '';
      i += 1;
    } else if (arg.startsWith('--auth-token=')) {
      args.authToken = arg.slice('--auth-token='.length);
    } else if (arg === '--actor-uid') {
      args.actorUid = argv[i + 1] || '';
      i += 1;
    } else if (arg.startsWith('--actor-uid=')) {
      args.actorUid = arg.slice('--actor-uid='.length);
    } else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Argumento desconhecido: ${arg}`);
  }

  if (!args.apply && !args.exportJson && !args.liveDiff) args.dryRun = true;
  return args;
}

function printHelp() {
  console.log(`Uso:
  node scripts/cms-establishments-seed.mjs --dry-run
  node scripts/cms-establishments-seed.mjs --live-diff
  node scripts/cms-establishments-seed.mjs --export-json docs/cms-establishments-seed-preview.json
  node scripts/cms-establishments-seed.mjs --apply --confirm-cms-establishments-seed

Credenciais Firestore:
  --project-id turismo-sms ou FIREBASE_PROJECT_ID
  --auth-token <token> ou FIRESTORE_REST_TOKEN/GOOGLE_OAUTH_ACCESS_TOKEN/FIREBASE_AUTH_TOKEN
  --actor-uid <uid admin> ou CMS_SEED_ACTOR_UID

Observacao: --apply exige confirmacao explicita, credencial, actor uid e diff live antes de gravar.`);
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
    source: /^https?:\/\//i.test(url) ? 'external' : 'static'
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
      mainImage: images[0] ? imageObject(images[0]) : imageObject(''),
      gallery: images.map((url, index) => ({
        ...imageObject(url),
        position: index + 1
      })).filter(image => image.url),
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

function envValue(keys) {
  for (const key of ensureArray(keys)) {
    const value = clean(process.env[key]);
    if (value) return value;
  }
  return '';
}

function readProjectIdFromConfig() {
  try {
    const source = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
    const match = source.match(/projectId:\s*['"]([^'"]+)['"]/);
    return match ? match[1] : '';
  } catch (_) {
    return '';
  }
}

function firestoreOptions(args) {
  const projectId = clean(args.projectId || process.env.FIREBASE_PROJECT_ID || readProjectIdFromConfig());
  const authToken = clean(args.authToken || envValue(FIRESTORE_TOKEN_ENV_KEYS));
  const actorUid = clean(args.actorUid || process.env.CMS_SEED_ACTOR_UID || process.env.FIREBASE_SEED_ACTOR_UID);
  return { projectId, authToken, actorUid };
}

function requireFirestoreOptions(options, needsActor = false) {
  if (!options.projectId) {
    throw new Error('Project ID ausente. Use --project-id ou FIREBASE_PROJECT_ID.');
  }
  if (!options.authToken) {
    throw new Error('Token Firestore ausente. Use --auth-token ou FIRESTORE_REST_TOKEN/GOOGLE_OAUTH_ACCESS_TOKEN/FIREBASE_AUTH_TOKEN.');
  }
  if (needsActor && !options.actorUid) {
    throw new Error('Actor UID ausente. Use --actor-uid ou CMS_SEED_ACTOR_UID para preencher createdBy/updatedBy no apply.');
  }
  if (typeof fetch !== 'function') {
    throw new Error('Este Node nao possui fetch global. Use Node 18+ para --live-diff/--apply.');
  }
}

function firestoreCollectionUrl(projectId) {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${FIRESTORE_DATABASE}/documents/${TARGET_COLLECTION}`;
}

async function fetchFirestoreJson(url, options) {
  const headers = {
    Authorization: `Bearer ${options.authToken}`
  };
  if (options.body) headers['Content-Type'] = 'application/json';
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = data && data.error && data.error.message ? data.error.message : text;
    throw new Error(`Firestore REST ${response.status}: ${message}`);
  }
  return data;
}

function documentIdFromName(name) {
  return decodeURIComponent(String(name || '').split('/').pop() || '');
}

async function readLiveCollection(options) {
  requireFirestoreOptions(options);
  const docs = new Map();
  let pageToken = '';
  do {
    const url = new URL(firestoreCollectionUrl(options.projectId));
    url.searchParams.set('pageSize', '300');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const data = await fetchFirestoreJson(url.toString(), options);
    ensureArray(data.documents).forEach(document => {
      const id = documentIdFromName(document.name);
      if (id) docs.set(id, decodeFirestoreFields(document.fields || {}));
    });
    pageToken = clean(data.nextPageToken);
  } while (pageToken);
  return docs;
}

function decodeFirestoreFields(fields) {
  const result = {};
  Object.entries(fields || {}).forEach(([key, value]) => {
    result[key] = decodeFirestoreValue(value);
  });
  return result;
}

function decodeFirestoreValue(value) {
  if (!value || typeof value !== 'object') return null;
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('booleanValue' in value) return value.booleanValue === true;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('arrayValue' in value) return ensureArray(value.arrayValue.values).map(decodeFirestoreValue);
  if ('mapValue' in value) return decodeFirestoreFields(value.mapValue.fields || {});
  if ('referenceValue' in value) return value.referenceValue;
  if ('bytesValue' in value) return value.bytesValue;
  if ('geoPointValue' in value) return value.geoPointValue;
  return null;
}

function isTimestampField(pathName) {
  return [
    'createdAt',
    'updatedAt',
    'source.seededAt',
    'source.sourceUpdatedAt',
    'publishing.publishedAt',
    'publishing.archivedAt',
    'review.lastAppliedAt'
  ].includes(pathName);
}

function encodeFirestoreFields(object, prefix = '') {
  const fields = {};
  Object.entries(object || {}).forEach(([key, value]) => {
    const pathName = prefix ? `${prefix}.${key}` : key;
    fields[key] = encodeFirestoreValue(value, pathName);
  });
  return fields;
}

function encodeFirestoreValue(value, pathName = '') {
  if (value == null) return { nullValue: null };
  if (isTimestampField(pathName) && typeof value === 'string' && value) {
    return { timestampValue: value };
  }
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(item => encodeFirestoreValue(item, pathName)) } };
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: encodeFirestoreFields(value, pathName) } };
  }
  return { stringValue: clean(value) };
}

function firestoreDocumentBody(doc) {
  return { fields: encodeFirestoreFields(doc) };
}

function getPath(object, pathName) {
  return String(pathName).split('.').reduce((current, key) => (
    current && Object.prototype.hasOwnProperty.call(current, key) ? current[key] : undefined
  ), object);
}

function setPath(object, pathName, value) {
  const keys = String(pathName).split('.');
  let current = object;
  keys.slice(0, -1).forEach(key => {
    if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) current[key] = {};
    current = current[key];
  });
  current[keys[keys.length - 1]] = value;
}

function valuesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isPathListed(pathName, list) {
  return list.some(item => pathName === item || pathName.startsWith(`${item}.`));
}

function diffValues(candidate, live, prefix = '') {
  const changes = [];
  const keys = new Set([
    ...Object.keys(candidate || {}),
    ...Object.keys(live || {})
  ]);
  keys.forEach(key => {
    const pathName = prefix ? `${prefix}.${key}` : key;
    if (isPathListed(pathName, IGNORED_DIFF_FIELDS)) return;
    const nextValue = candidate ? candidate[key] : undefined;
    const liveValue = live ? live[key] : undefined;
    if (
      nextValue &&
      liveValue &&
      typeof nextValue === 'object' &&
      typeof liveValue === 'object' &&
      !Array.isArray(nextValue) &&
      !Array.isArray(liveValue)
    ) {
      changes.push(...diffValues(nextValue, liveValue, pathName));
      return;
    }
    if (!valuesEqual(nextValue, liveValue)) {
      changes.push({ field: pathName, from: liveValue, to: nextValue });
    }
  });
  return changes;
}

function normalizeForWrite(doc, nowIso, actorUid) {
  const payload = structuredClone(doc);
  payload.createdAt = nowIso;
  payload.createdBy = actorUid;
  payload.updatedAt = nowIso;
  payload.updatedBy = actorUid;
  payload.source.seededAt = nowIso;
  payload.source.sourceUpdatedAt = payload.source.sourceUpdatedAt || null;
  return payload;
}

function buildSafePatch(candidate, live, nowIso, actorUid) {
  const patch = {};
  SAFE_UPDATE_FIELDS.forEach(field => {
    const nextValue = field === 'source.seededAt' && getPath(live, field) ? getPath(live, field) : getPath(candidate, field);
    if (nextValue !== undefined && !valuesEqual(nextValue, getPath(live, field))) {
      setPath(patch, field, nextValue);
    }
  });
  if (Object.keys(patch).length) {
    patch.updatedAt = nowIso;
    patch.updatedBy = actorUid;
  }
  return patch;
}

function buildLiveDiff(preview, liveDocs) {
  const liveIds = Array.from(liveDocs.keys()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const candidateIds = new Set(preview.records.map(doc => doc.id));
  const wouldCreate = [];
  const wouldUpdate = [];
  const skippedExisting = [];
  const missingFromSeed = liveIds.filter(id => !candidateIds.has(id));
  const details = [];

  preview.records.forEach(doc => {
    const live = liveDocs.get(doc.id);
    if (!live) {
      wouldCreate.push(doc.id);
      return;
    }
    const changes = diffValues(doc, live);
    const protectedChanges = changes.filter(change => isPathListed(change.field, PROTECTED_FIELDS));
    const safeChanges = changes.filter(change => isPathListed(change.field, SAFE_UPDATE_FIELDS));
    const reviewChanges = changes.filter(change => (
      !isPathListed(change.field, PROTECTED_FIELDS) &&
      !isPathListed(change.field, SAFE_UPDATE_FIELDS)
    ));

    if (safeChanges.length) wouldUpdate.push(doc.id);
    if (protectedChanges.length || reviewChanges.length || (!safeChanges.length && changes.length)) {
      skippedExisting.push(doc.id);
    }
    if (changes.length) {
      details.push({
        id: doc.id,
        safeFields: safeChanges.map(change => change.field),
        protectedFields: protectedChanges.map(change => change.field),
        reviewFields: reviewChanges.map(change => change.field)
      });
    }
  });

  preview.metadata.liveDiff = {
    enabled: true,
    readAt: new Date().toISOString(),
    liveDocuments: liveIds.length
  };
  preview.totals.liveDocuments = liveIds.length;
  preview.totals.wouldCreate = wouldCreate.length;
  preview.totals.wouldUpdate = wouldUpdate.length;
  preview.totals.skippedExisting = skippedExisting.length;
  preview.totals.missingFromSeed = missingFromSeed.length;
  preview.diff.note = 'Diff live calculado contra Firestore. Apply cria docs ausentes e atualiza somente metadados seguros; campos editoriais existentes ficam para revisao manual.';
  preview.diff.wouldCreate = wouldCreate;
  preview.diff.wouldUpdate = wouldUpdate;
  preview.diff.skippedExisting = skippedExisting;
  preview.diff.missingFromSeed = missingFromSeed;
  preview.diff.safeUpdateFields = SAFE_UPDATE_FIELDS;
  preview.diff.protectedFields = PROTECTED_FIELDS;
  preview.diff.liveDetails = details;
  return preview;
}

function collectLeafPaths(object, prefix = '') {
  const paths = [];
  Object.entries(object || {}).forEach(([key, value]) => {
    const pathName = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...collectLeafPaths(value, pathName));
      return;
    }
    paths.push(pathName);
  });
  return paths;
}

async function patchFirestoreDoc(id, patch, options) {
  const url = new URL(`${firestoreCollectionUrl(options.projectId)}/${encodeURIComponent(id)}`);
  collectLeafPaths(patch).forEach(fieldPath => {
    url.searchParams.append('updateMask.fieldPaths', fieldPath);
  });
  url.searchParams.set('currentDocument.exists', 'true');
  return fetchFirestoreJson(url.toString(), {
    ...options,
    method: 'PATCH',
    body: firestoreDocumentBody(patch)
  });
}

async function createFirestoreDoc(id, doc, options) {
  const url = new URL(`${firestoreCollectionUrl(options.projectId)}/${encodeURIComponent(id)}`);
  url.searchParams.set('currentDocument.exists', 'false');
  return fetchFirestoreJson(url.toString(), {
    ...options,
    method: 'PATCH',
    body: firestoreDocumentBody(doc)
  });
}

async function applySeed(preview, liveDocs, options) {
  requireFirestoreOptions(options, true);
  const nowIso = new Date().toISOString();
  const result = {
    created: [],
    updated: [],
    skippedExisting: [],
    failed: []
  };

  for (const doc of preview.records) {
    const live = liveDocs.get(doc.id);
    try {
      if (!live) {
        await createFirestoreDoc(doc.id, normalizeForWrite(doc, nowIso, options.actorUid), options);
        result.created.push(doc.id);
        continue;
      }
      const patch = buildSafePatch(doc, live, nowIso, options.actorUid);
      if (Object.keys(patch).length) {
        await patchFirestoreDoc(doc.id, patch, options);
        result.updated.push(doc.id);
      } else {
        result.skippedExisting.push(doc.id);
      }
    } catch (error) {
      result.failed.push({ id: doc.id, message: error.message });
    }
  }

  return result;
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
      dryRunOnly: false,
      liveDiffImplemented: true,
      applyImplemented: true,
      applyRequiresConfirmation: true,
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
      protectedFields: PROTECTED_FIELDS
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
  console.log('CMS establishments seed/diff dry-run');
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

function printLiveDiff(preview) {
  const live = preview.metadata.liveDiff || {};
  console.log('CMS establishments live diff');
  console.log(`Target collection: ${preview.metadata.targetCollection}`);
  console.log(`Projeto Firebase: ${live.projectId || '(nao informado no relatorio)'}`);
  console.log(`Docs normalizados: ${preview.totals.normalizedRecords}`);
  console.log(`Docs live lidos: ${preview.totals.liveDocuments}`);
  console.log(`Would create: ${preview.totals.wouldCreate}`);
  console.log(`Would update seguro: ${preview.totals.wouldUpdate}`);
  console.log(`Existentes com revisao/protecao: ${preview.totals.skippedExisting}`);
  console.log(`Docs live fora do seed: ${preview.totals.missingFromSeed}`);
  console.log('');
  console.log('Criaria:');
  preview.diff.wouldCreate.slice(0, 30).forEach(id => console.log(`- ${id}`));
  if (preview.diff.wouldCreate.length > 30) console.log(`- ... ${preview.diff.wouldCreate.length - 30} outros`);
  console.log('');
  console.log('Atualizacao segura limitada a:');
  SAFE_UPDATE_FIELDS.forEach(field => console.log(`- ${field}`));
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
  return false;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }
  if (args.apply) {
    if (refuseApply(args) !== false) return;
  }
  const preview = buildPreview();
  let output = preview;
  const options = firestoreOptions(args);
  if (args.liveDiff || args.apply) {
    requireFirestoreOptions(options, args.apply);
    const liveDocs = await readLiveCollection(options);
    output = buildLiveDiff(preview, liveDocs);
    output.metadata.liveDiff.projectId = options.projectId;
    printLiveDiff(output);
    if (args.apply) {
      const applyResult = await applySeed(output, liveDocs, options);
      output.applyResult = applyResult;
      console.log('');
      console.log('Apply controlado concluido:');
      console.log(`- criados: ${applyResult.created.length}`);
      console.log(`- atualizados com campos seguros: ${applyResult.updated.length}`);
      console.log(`- existentes preservados: ${applyResult.skippedExisting.length}`);
      console.log(`- falhas: ${applyResult.failed.length}`);
      if (applyResult.failed.length) {
        applyResult.failed.slice(0, 10).forEach(item => console.log(`  - ${item.id}: ${item.message}`));
        process.exitCode = 1;
      }
    }
  } else if (args.dryRun || !args.exportJson) {
    printDryRun(output);
  }
  if (args.exportJson) exportJson(output, args.exportJson);
}

try {
  await main();
} catch (error) {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
}
