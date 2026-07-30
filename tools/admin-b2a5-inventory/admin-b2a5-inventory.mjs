import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SCHEMA_VERSION = 1;
export const ALLOWED_COLLECTION = 'usuarios';
export const ALLOWED_DATABASE_ID = '(default)';
export const EMULATOR_PROJECT_ID = 'demo-turismo-sms-rules-test';
export const REMOTE_PROJECT_FINGERPRINT =
  '68cf9cf1208055a962c614232e75b8a0b4f4f7564865e77e2a84382a87bd8c60';
export const EMULATOR_PROJECT_FINGERPRINT =
  'b2d2fda672cd3134c50b1afd30579947fb89c8aace85bb35852f6ed4c935e7b9';

export const ATIVO_CATEGORIES = Object.freeze([
  'booleanTrue',
  'booleanFalse',
  'absent',
  'null',
  'string',
  'number',
  'array',
  'map',
  'timestamp',
  'reference',
  'geopoint',
  'other',
]);

export const ROLE_CATEGORIES = Object.freeze([
  'admin',
  'moderator',
  'user',
  'otherString',
  'absent',
  'null',
  'nonString',
]);

export const MATRIX_ROWS = Object.freeze([
  'admin',
  'moderator',
  'user',
  'invalidOrAbsent',
]);

export const EXIT_CODES = Object.freeze({
  success: 0,
  'invalid-arguments': 2,
  'target-mismatch': 3,
  'emulator-misconfigured': 4,
  'auth-denied': 5,
  'dependency-error': 6,
  'volume-limit': 7,
  'count-mismatch': 8,
  'query-failed': 9,
  'invariant-failed': 10,
  'output-sanitization-failed': 11,
  'unexpected-error': 12,
});

const CLI_VALUE_FLAGS = new Map([
  ['--database-id', 'databaseId'],
  ['--collection', 'collection'],
  ['--max-docs', 'maxDocuments'],
  ['--expected-project-sha256', 'expectedProjectSha256'],
]);

const INVALID_ATIVO_TYPES = new Set([
  'string',
  'number',
  'array',
  'map',
  'timestamp',
  'reference',
  'geopoint',
  'other',
]);

const REVIEW_ATIVO_TYPES = new Set([
  'absent',
  'null',
  ...INVALID_ATIVO_TYPES,
]);

const INVALID_ROLE_CATEGORIES = new Set([
  'otherString',
  'absent',
  'null',
  'nonString',
]);

export class InventoryToolError extends Error {
  constructor(category) {
    super(category);
    this.name = 'InventoryToolError';
    this.category = EXIT_CODES[category] === undefined ? 'unexpected-error' : category;
    this.exitCode = EXIT_CODES[this.category];
  }
}

function fail(category) {
  throw new InventoryToolError(category);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function assertExactOwnProperties(value, allowed, category = 'invariant-failed') {
  if (value === null || typeof value !== 'object') {
    fail(category);
  }

  const actual = Reflect.ownKeys(value);
  if (
    actual.length !== allowed.length ||
    actual.some((key) => typeof key !== 'string' || !allowed.includes(key))
  ) {
    fail(category);
  }
}

function assertCounter(value) {
  if (!Number.isInteger(value) || value < 0) {
    fail('invariant-failed');
  }
}

function copyCounters(source, categories) {
  const result = {};
  for (const category of categories) {
    result[category] = source[category];
  }
  return result;
}

function createCounters(categories) {
  const result = {};
  for (const category of categories) {
    result[category] = 0;
  }
  return result;
}

function isConstructorInstance(value, constructor) {
  return typeof constructor === 'function' && value instanceof constructor;
}

function isPlainMap(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeRunMaxDocuments(value) {
  if (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    Number.isSafeInteger(value + 1)
  ) {
    return value;
  }
  return validateMaxDocuments(value);
}

function validateFingerprint(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/.test(value)) {
    fail('target-mismatch');
  }
}

function validateLoopbackHost(value) {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) {
    fail('emulator-misconfigured');
  }
  const match = /^(127\.0\.0\.1|localhost):([0-9]+)$/.exec(value);
  if (match === null) {
    fail('emulator-misconfigured');
  }
  const port = Number(match[2]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    fail('emulator-misconfigured');
  }
}

function matrixRowForRole(roleCategory) {
  return MATRIX_ROWS.includes(roleCategory) ? roleCategory : 'invalidOrAbsent';
}

function toIsoUtc(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    fail('invariant-failed');
  }
  return date.toISOString();
}

function validateFirestoreModule(module) {
  if (
    module === null ||
    typeof module !== 'object' ||
    typeof module.Firestore !== 'function' ||
    typeof module.Timestamp !== 'function' ||
    typeof module.DocumentReference !== 'function' ||
    typeof module.GeoPoint !== 'function'
  ) {
    fail('dependency-error');
  }
  return module;
}

function normalizeQueryError(error) {
  const category = sanitizeErrorCategory(error);
  if (category === 'auth-denied') {
    fail(category);
  }
  fail('query-failed');
}

export function parseCliArgs(args) {
  if (!Array.isArray(args)) {
    fail('invalid-arguments');
  }

  const parsed = {};
  const seen = new Set();

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (typeof token !== 'string' || !token.startsWith('--') || token.includes('=')) {
      fail('invalid-arguments');
    }
    if (seen.has(token)) {
      fail('invalid-arguments');
    }
    seen.add(token);

    if (token === '--emulator') {
      parsed.emulator = true;
      continue;
    }

    const property = CLI_VALUE_FLAGS.get(token);
    if (property === undefined) {
      fail('invalid-arguments');
    }
    const value = args[index + 1];
    if (
      typeof value !== 'string' ||
      value.length === 0 ||
      value.startsWith('--')
    ) {
      fail('invalid-arguments');
    }
    parsed[property] = value;
    index += 1;
  }

  for (const property of CLI_VALUE_FLAGS.values()) {
    if (!hasOwn(parsed, property)) {
      fail('invalid-arguments');
    }
  }

  parsed.maxDocuments = validateMaxDocuments(parsed.maxDocuments);
  parsed.emulator = parsed.emulator === true;
  return parsed;
}

export function validateMaxDocuments(value) {
  if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) {
    fail('invalid-arguments');
  }
  const parsed = Number(value);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed <= 0 ||
    !Number.isSafeInteger(parsed + 1)
  ) {
    fail('invalid-arguments');
  }
  return parsed;
}

export function validateTarget(options, env = process.env) {
  if (options === null || typeof options !== 'object') {
    fail('target-mismatch');
  }
  if (options.databaseId !== ALLOWED_DATABASE_ID) {
    fail('target-mismatch');
  }
  if (options.collection !== ALLOWED_COLLECTION) {
    fail('target-mismatch');
  }

  validateFingerprint(options.expectedProjectSha256);
  const emulatorHost = env.FIRESTORE_EMULATOR_HOST;

  if (options.emulator === true) {
    if (emulatorHost === undefined || emulatorHost === '') {
      fail('emulator-misconfigured');
    }
    validateLoopbackHost(emulatorHost);
    if (options.expectedProjectSha256 !== EMULATOR_PROJECT_FINGERPRINT) {
      fail('target-mismatch');
    }
    return {
      projectId: EMULATOR_PROJECT_ID,
      projectIdSha256: EMULATOR_PROJECT_FINGERPRINT,
      databaseId: ALLOWED_DATABASE_ID,
      collection: ALLOWED_COLLECTION,
      mode: 'emulator',
    };
  }

  if (emulatorHost !== undefined && emulatorHost !== '') {
    fail('emulator-misconfigured');
  }

  const projectId = env.ADMIN_B2A5_PROJECT_ID;
  if (
    typeof projectId !== 'string' ||
    projectId.length === 0 ||
    projectId.trim() !== projectId
  ) {
    fail('target-mismatch');
  }
  if (
    options.expectedProjectSha256 !== REMOTE_PROJECT_FINGERPRINT ||
    sha256Utf8(projectId) !== REMOTE_PROJECT_FINGERPRINT
  ) {
    fail('target-mismatch');
  }

  return {
    projectId,
    projectIdSha256: REMOTE_PROJECT_FINGERPRINT,
    databaseId: ALLOWED_DATABASE_ID,
    collection: ALLOWED_COLLECTION,
    mode: 'remote',
  };
}

export function sha256Utf8(value) {
  if (typeof value !== 'string') {
    fail('invalid-arguments');
  }
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function classifyAtivo(value, fieldPresent, firestoreTypes = {}) {
  if (fieldPresent !== true) {
    return 'absent';
  }
  if (value === null) {
    return 'null';
  }
  if (value === true) {
    return 'booleanTrue';
  }
  if (value === false) {
    return 'booleanFalse';
  }
  if (typeof value === 'string') {
    return 'string';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (isConstructorInstance(value, firestoreTypes.Timestamp)) {
    return 'timestamp';
  }
  if (isConstructorInstance(value, firestoreTypes.DocumentReference)) {
    return 'reference';
  }
  if (isConstructorInstance(value, firestoreTypes.GeoPoint)) {
    return 'geopoint';
  }
  if (isPlainMap(value)) {
    return 'map';
  }
  return 'other';
}

export function classifyRole(value, fieldPresent) {
  if (fieldPresent !== true) {
    return 'absent';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value !== 'string') {
    return 'nonString';
  }
  if (value === 'admin' || value === 'moderator' || value === 'user') {
    return value;
  }
  return 'otherString';
}

export function createEmptyInventory() {
  const roleByAtivo = {};
  for (const row of MATRIX_ROWS) {
    roleByAtivo[row] = createCounters(ATIVO_CATEGORIES);
  }

  return {
    ativo: createCounters(ATIVO_CATEGORIES),
    role: createCounters(ROLE_CATEGORIES),
    roleByAtivo,
    administrativeProfiles: {
      adminAtivoTrue: 0,
      adminAtivoNotTrue: 0,
      moderatorAtivoTrue: 0,
      moderatorAtivoNotTrue: 0,
      administrativeProfilesRequiringEvaluation: 0,
    },
    quality: {
      invalidTypeDocuments: 0,
      dataQualityDocumentsRequiringReview: 0,
    },
    accumulationCalls: 0,
  };
}

export function accumulateDocument(inventory, document, firestoreTypes = {}) {
  const ativoCategory = classifyAtivo(
    document.ativo,
    document.ativoPresent,
    firestoreTypes,
  );
  const roleCategory = classifyRole(document.role, document.rolePresent);
  const row = matrixRowForRole(roleCategory);

  inventory.ativo[ativoCategory] += 1;
  inventory.role[roleCategory] += 1;
  inventory.roleByAtivo[row][ativoCategory] += 1;
  inventory.accumulationCalls += 1;

  if (roleCategory === 'admin') {
    if (ativoCategory === 'booleanTrue') {
      inventory.administrativeProfiles.adminAtivoTrue += 1;
    } else {
      inventory.administrativeProfiles.adminAtivoNotTrue += 1;
    }
  }

  if (roleCategory === 'moderator') {
    if (ativoCategory === 'booleanTrue') {
      inventory.administrativeProfiles.moderatorAtivoTrue += 1;
    } else {
      inventory.administrativeProfiles.moderatorAtivoNotTrue += 1;
    }
  }

  const requiresAdministrativeEvaluation =
    (roleCategory === 'admin' && ativoCategory !== 'booleanTrue') ||
    roleCategory === 'moderator' ||
    INVALID_ROLE_CATEGORIES.has(roleCategory);
  if (requiresAdministrativeEvaluation) {
    inventory.administrativeProfiles.administrativeProfilesRequiringEvaluation += 1;
  }

  const invalidType =
    INVALID_ATIVO_TYPES.has(ativoCategory) || roleCategory === 'nonString';
  if (invalidType) {
    inventory.quality.invalidTypeDocuments += 1;
  }

  const requiresDataQualityReview =
    REVIEW_ATIVO_TYPES.has(ativoCategory) ||
    INVALID_ROLE_CATEGORIES.has(roleCategory);
  if (requiresDataQualityReview) {
    inventory.quality.dataQualityDocumentsRequiringReview += 1;
  }

  return { ativoCategory, roleCategory, row };
}

export function validateInventory(inventory, scanDocuments) {
  if (!Number.isInteger(scanDocuments) || scanDocuments < 0) {
    fail('invariant-failed');
  }

  assertExactOwnProperties(inventory.ativo, ATIVO_CATEGORIES);
  assertExactOwnProperties(inventory.role, ROLE_CATEGORIES);
  assertExactOwnProperties(inventory.roleByAtivo, MATRIX_ROWS);

  let ativoSum = 0;
  for (const category of ATIVO_CATEGORIES) {
    assertCounter(inventory.ativo[category]);
    ativoSum += inventory.ativo[category];
  }

  let roleSum = 0;
  for (const category of ROLE_CATEGORIES) {
    assertCounter(inventory.role[category]);
    roleSum += inventory.role[category];
  }

  let crossTabSum = 0;
  const rowSums = {};
  for (const row of MATRIX_ROWS) {
    assertExactOwnProperties(inventory.roleByAtivo[row], ATIVO_CATEGORIES);
    rowSums[row] = 0;
    for (const category of ATIVO_CATEGORIES) {
      const value = inventory.roleByAtivo[row][category];
      assertCounter(value);
      rowSums[row] += value;
      crossTabSum += value;
    }
  }

  assertExactOwnProperties(inventory.administrativeProfiles, [
    'adminAtivoTrue',
    'adminAtivoNotTrue',
    'moderatorAtivoTrue',
    'moderatorAtivoNotTrue',
    'administrativeProfilesRequiringEvaluation',
  ]);
  assertExactOwnProperties(inventory.quality, [
    'invalidTypeDocuments',
    'dataQualityDocumentsRequiringReview',
  ]);

  for (const value of Reflect.ownKeys(inventory.administrativeProfiles)) {
    assertCounter(inventory.administrativeProfiles[value]);
  }
  for (const value of Reflect.ownKeys(inventory.quality)) {
    assertCounter(inventory.quality[value]);
  }
  assertCounter(inventory.accumulationCalls);

  const validation = {
    ativoSumMatchesTotal: ativoSum === scanDocuments,
    roleSumMatchesTotal: roleSum === scanDocuments,
    crossTabMatchesTotal: crossTabSum === scanDocuments,
    adminSplitMatches:
      rowSums.admin === inventory.role.admin &&
      inventory.administrativeProfiles.adminAtivoTrue ===
        inventory.roleByAtivo.admin.booleanTrue &&
      inventory.administrativeProfiles.adminAtivoTrue +
        inventory.administrativeProfiles.adminAtivoNotTrue ===
        inventory.role.admin,
    moderatorSplitMatches:
      rowSums.moderator === inventory.role.moderator &&
      inventory.administrativeProfiles.moderatorAtivoTrue ===
        inventory.roleByAtivo.moderator.booleanTrue &&
      inventory.administrativeProfiles.moderatorAtivoTrue +
        inventory.administrativeProfiles.moderatorAtivoNotTrue ===
        inventory.role.moderator,
    userSplitMatches: rowSums.user === inventory.role.user,
    invalidOrAbsentSplitMatches:
      rowSums.invalidOrAbsent ===
      inventory.role.otherString +
        inventory.role.absent +
        inventory.role.null +
        inventory.role.nonString,
    nonNegative: true,
    integersOnly: true,
    classificationDerivedFromSingleQuerySnapshot: true,
  };

  if (
    inventory.accumulationCalls !== scanDocuments ||
    Reflect.ownKeys(validation).some((key) => validation[key] !== true)
  ) {
    fail('invariant-failed');
  }
  return validation;
}

export function formatInventorySummary({
  target,
  startedAtUtc,
  endedAtUtc,
  maxDocuments,
  countBeforeScan,
  scanDocuments,
  inventory,
  validation,
}) {
  return {
    ok: true,
    schemaVersion: SCHEMA_VERSION,
    target: {
      projectIdSha256: target.projectIdSha256,
      databaseId: target.databaseId,
      collection: target.collection,
      mode: target.mode,
    },
    window: {
      startedAtUtc,
      endedAtUtc,
    },
    volumeGate: {
      maxDocuments,
      countBeforeScan,
      scanDocuments,
      countMismatchDetected: false,
    },
    ativo: copyCounters(inventory.ativo, ATIVO_CATEGORIES),
    role: copyCounters(inventory.role, ROLE_CATEGORIES),
    roleByAtivo: {
      admin: copyCounters(inventory.roleByAtivo.admin, ATIVO_CATEGORIES),
      moderator: copyCounters(inventory.roleByAtivo.moderator, ATIVO_CATEGORIES),
      user: copyCounters(inventory.roleByAtivo.user, ATIVO_CATEGORIES),
      invalidOrAbsent: copyCounters(
        inventory.roleByAtivo.invalidOrAbsent,
        ATIVO_CATEGORIES,
      ),
    },
    administrativeProfiles: {
      adminAtivoTrue: inventory.administrativeProfiles.adminAtivoTrue,
      adminAtivoNotTrue: inventory.administrativeProfiles.adminAtivoNotTrue,
      moderatorAtivoTrue: inventory.administrativeProfiles.moderatorAtivoTrue,
      moderatorAtivoNotTrue:
        inventory.administrativeProfiles.moderatorAtivoNotTrue,
      administrativeProfilesRequiringEvaluation:
        inventory.administrativeProfiles
          .administrativeProfilesRequiringEvaluation,
    },
    quality: {
      invalidTypeDocuments: inventory.quality.invalidTypeDocuments,
      dataQualityDocumentsRequiringReview:
        inventory.quality.dataQualityDocumentsRequiringReview,
    },
    validation: {
      ativoSumMatchesTotal: validation.ativoSumMatchesTotal,
      roleSumMatchesTotal: validation.roleSumMatchesTotal,
      crossTabMatchesTotal: validation.crossTabMatchesTotal,
      adminSplitMatches: validation.adminSplitMatches,
      moderatorSplitMatches: validation.moderatorSplitMatches,
      userSplitMatches: validation.userSplitMatches,
      invalidOrAbsentSplitMatches: validation.invalidOrAbsentSplitMatches,
      nonNegative: validation.nonNegative,
      integersOnly: validation.integersOnly,
      classificationDerivedFromSingleQuerySnapshot:
        validation.classificationDerivedFromSingleQuerySnapshot,
    },
  };
}

export function assertSanitizedOutput(value, sensitiveValues = []) {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  const forbidden = [
    '/documents/',
    'projects/',
    'usuarios/',
    'Bearer',
    'Authorization',
    ...sensitiveValues,
  ];

  for (const candidate of forbidden) {
    if (
      typeof candidate === 'string' &&
      candidate.length > 0 &&
      serialized.includes(candidate)
    ) {
      fail('output-sanitization-failed');
    }
  }
  return serialized;
}

export function sanitizeErrorCategory(error) {
  if (
    error instanceof InventoryToolError &&
    EXIT_CODES[error.category] !== undefined
  ) {
    return error.category;
  }
  if (
    error !== null &&
    typeof error === 'object' &&
    (error.code === 7 ||
      error.code === 16 ||
      error.code === 'PERMISSION_DENIED' ||
      error.code === 'UNAUTHENTICATED')
  ) {
    return 'auth-denied';
  }
  return 'unexpected-error';
}

export function serializeSuccess(summary, sensitiveValues = []) {
  return `${assertSanitizedOutput(summary, sensitiveValues)}\n`;
}

export function serializeError(error) {
  const category = sanitizeErrorCategory(error);
  return `${JSON.stringify({
    ok: false,
    schemaVersion: SCHEMA_VERSION,
    error: { category },
  })}\n`;
}

export async function loadFirestoreModule(
  importer = () => import('@google-cloud/firestore'),
) {
  try {
    return validateFirestoreModule(await importer());
  } catch {
    fail('dependency-error');
  }
}

export function createFirestoreReadAdapter(firestore) {
  if (
    firestore === null ||
    typeof firestore !== 'object' ||
    typeof firestore.collection !== 'function'
  ) {
    fail('dependency-error');
  }

  return {
    async countDocuments() {
      const snapshot = await firestore
        .collection(ALLOWED_COLLECTION)
        .count()
        .get();
      const data = snapshot.data();
      return data.count;
    },

    async scanProjected(maxDocuments) {
      const snapshot = await firestore
        .collection(ALLOWED_COLLECTION)
        .select('ativo', 'role')
        .limit(maxDocuments + 1)
        .get();

      return snapshot.docs.map((documentSnapshot) => {
        const data = documentSnapshot.data();
        return {
          ativoPresent: hasOwn(data, 'ativo'),
          ativo: data.ativo,
          rolePresent: hasOwn(data, 'role'),
          role: data.role,
        };
      });
    },
  };
}

export async function runInventory(options, dependencies = {}) {
  const maxDocuments = normalizeRunMaxDocuments(options?.maxDocuments);
  const target = validateTarget(
    {
      ...options,
      maxDocuments,
    },
    dependencies.env ?? process.env,
  );

  if (
    target.mode === 'emulator' &&
    dependencies.createClient === undefined
  ) {
    process.env.METADATA_SERVER_DETECTION = 'none';
  }

  const now = dependencies.now ?? (() => new Date());
  const startedAtUtc = toIsoUtc(now());
  const moduleLoader = dependencies.loadFirestoreModule ?? loadFirestoreModule;
  const firestoreModule = validateFirestoreModule(await moduleLoader());

  let firestore;
  try {
    const createClient =
      dependencies.createClient ??
      ((settings) => new firestoreModule.Firestore(settings));
    firestore = createClient({
      projectId: target.projectId,
      databaseId: target.databaseId,
    });
  } catch {
    fail('dependency-error');
  }

  const adapterFactory =
    dependencies.createAdapter ?? createFirestoreReadAdapter;
  const adapter = adapterFactory(firestore);

  let countBeforeScan;
  try {
    countBeforeScan = await adapter.countDocuments();
  } catch (error) {
    normalizeQueryError(error);
  }

  if (!Number.isInteger(countBeforeScan) || countBeforeScan < 0) {
    fail('invariant-failed');
  }
  if (countBeforeScan > maxDocuments) {
    fail('volume-limit');
  }

  let documents;
  try {
    documents = await adapter.scanProjected(maxDocuments);
  } catch (error) {
    normalizeQueryError(error);
  }

  if (!Array.isArray(documents)) {
    fail('query-failed');
  }
  if (documents.length > maxDocuments) {
    fail('volume-limit');
  }
  if (countBeforeScan !== documents.length) {
    fail('count-mismatch');
  }

  const inventory = createEmptyInventory();
  const firestoreTypes = {
    Timestamp: firestoreModule.Timestamp,
    DocumentReference: firestoreModule.DocumentReference,
    GeoPoint: firestoreModule.GeoPoint,
  };
  for (const document of documents) {
    accumulateDocument(inventory, document, firestoreTypes);
  }

  const validation = validateInventory(inventory, documents.length);
  const endedAtUtc = toIsoUtc(now());
  const summary = formatInventorySummary({
    target,
    startedAtUtc,
    endedAtUtc,
    maxDocuments,
    countBeforeScan,
    scanDocuments: documents.length,
    inventory,
    validation,
  });

  assertSanitizedOutput(summary, [
    target.projectId,
    ...(dependencies.sensitiveValues ?? []),
  ]);
  return summary;
}

export async function main({
  argv = process.argv.slice(2),
  env = process.env,
  io = {
    writeStdout: (value) => process.stdout.write(value),
    writeStderr: (value) => process.stderr.write(value),
  },
  dependencies = {},
} = {}) {
  try {
    const options = parseCliArgs(argv);
    const summary = await runInventory(options, {
      ...dependencies,
      env,
    });
    io.writeStdout(
      serializeSuccess(summary, [
        env.ADMIN_B2A5_PROJECT_ID,
        ...(dependencies.sensitiveValues ?? []),
      ]),
    );
    return EXIT_CODES.success;
  } catch (error) {
    const category = sanitizeErrorCategory(error);
    io.writeStderr(serializeError(new InventoryToolError(category)));
    return EXIT_CODES[category];
  }
}

function isEntryPoint() {
  if (typeof process.argv[1] !== 'string' || process.argv[1].length === 0) {
    return false;
  }
  try {
    const moduleUrl = pathToFileURL(
      realpathSync(fileURLToPath(import.meta.url)),
    ).href;
    const entryUrl = pathToFileURL(realpathSync(resolve(process.argv[1]))).href;
    return moduleUrl === entryUrl;
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  process.exitCode = await main();
}
