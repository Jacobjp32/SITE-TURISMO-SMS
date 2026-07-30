import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  DocumentReference,
  Firestore,
  GeoPoint,
  Timestamp,
} from '@google-cloud/firestore';
import {
  ALLOWED_COLLECTION,
  ALLOWED_DATABASE_ID,
  ATIVO_CATEGORIES,
  EMULATOR_PROJECT_FINGERPRINT,
  EMULATOR_PROJECT_ID,
  EXIT_CODES,
  InventoryToolError,
  MATRIX_ROWS,
  REMOTE_PROJECT_FINGERPRINT,
  ROLE_CATEGORIES,
  SCHEMA_VERSION,
  accumulateDocument,
  assertSanitizedOutput,
  classifyAtivo,
  classifyRole,
  createEmptyInventory,
  createFirestoreReadAdapter,
  formatInventorySummary,
  loadFirestoreModule,
  main,
  parseCliArgs,
  runInventory,
  sanitizeErrorCategory,
  serializeError,
  serializeSuccess,
  sha256Utf8,
  validateInventory,
  validateMaxDocuments,
  validateTarget,
} from './admin-b2a5-inventory.mjs';

if (process.env.FIRESTORE_EMULATOR_HOST !== undefined) {
  process.env.METADATA_SERVER_DETECTION = 'none';
}

class FakeTimestamp {}
class FakeDocumentReference {}
class FakeGeoPoint {}
class FakeFirestore {}
class CustomValue {}

const FAKE_FIRESTORE_TYPES = {
  Timestamp: FakeTimestamp,
  DocumentReference: FakeDocumentReference,
  GeoPoint: FakeGeoPoint,
};

const FAKE_FIRESTORE_MODULE = {
  Firestore: FakeFirestore,
  ...FAKE_FIRESTORE_TYPES,
};

const BASE_CLI = [
  '--database-id',
  ALLOWED_DATABASE_ID,
  '--collection',
  ALLOWED_COLLECTION,
  '--max-docs',
  '100',
  '--expected-project-sha256',
  EMULATOR_PROJECT_FINGERPRINT,
  '--emulator',
];

const BASE_EMULATOR_OPTIONS = {
  databaseId: ALLOWED_DATABASE_ID,
  collection: ALLOWED_COLLECTION,
  maxDocuments: 100,
  expectedProjectSha256: EMULATOR_PROJECT_FINGERPRINT,
  emulator: true,
};

const ROLE_FIXTURES = [
  ['admin', 'admin', true],
  ['moderator', 'moderator', true],
  ['user', 'user', true],
  ['otherString', 'auditor-synthetic', true],
  ['absent', undefined, false],
  ['null', null, true],
  ['nonString', 17, true],
];

const UNIT_ATIVO_FIXTURES = [
  ['booleanTrue', true, true],
  ['booleanFalse', false, true],
  ['absent', undefined, false],
  ['null', null, true],
  ['string', 'synthetic-string', true],
  ['number', 17, true],
  ['array', ['synthetic-array'], true],
  ['map', { synthetic: true }, true],
  ['timestamp', new FakeTimestamp(), true],
  ['reference', new FakeDocumentReference(), true],
  ['geopoint', new FakeGeoPoint(), true],
  ['other', Buffer.from([1, 2, 3]), true],
];

function assertSyncCategory(action, category) {
  assert.throws(
    action,
    (error) =>
      error instanceof InventoryToolError && error.category === category,
  );
}

async function assertAsyncCategory(action, category) {
  await assert.rejects(
    action,
    (error) =>
      error instanceof InventoryToolError && error.category === category,
  );
}

function accumulateUnitMatrix() {
  const inventory = createEmptyInventory();
  for (const [, role, rolePresent] of ROLE_FIXTURES) {
    for (const [, ativo, ativoPresent] of UNIT_ATIVO_FIXTURES) {
      accumulateDocument(
        inventory,
        { role, rolePresent, ativo, ativoPresent },
        FAKE_FIRESTORE_TYPES,
      );
    }
  }
  return inventory;
}

function validEmptySummary() {
  const inventory = createEmptyInventory();
  const validation = validateInventory(inventory, 0);
  return formatInventorySummary({
    target: {
      projectIdSha256: EMULATOR_PROJECT_FINGERPRINT,
      databaseId: ALLOWED_DATABASE_ID,
      collection: ALLOWED_COLLECTION,
      mode: 'emulator',
    },
    startedAtUtc: '2026-07-30T12:00:00.000Z',
    endedAtUtc: '2026-07-30T12:00:01.000Z',
    maxDocuments: 100,
    countBeforeScan: 0,
    scanDocuments: 0,
    inventory,
    validation,
  });
}

function makeRunDependencies({
  count = 0,
  documents = [],
  countError,
  scanError,
  sensitiveValues = [],
} = {}) {
  let nowCall = 0;
  const calls = { client: 0, count: 0, scan: 0 };
  return {
    calls,
    dependencies: {
      env: { FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' },
      now: () => {
        nowCall += 1;
        return nowCall === 1
          ? new Date('2026-07-30T12:00:00.000Z')
          : new Date('2026-07-30T12:00:01.000Z');
      },
      loadFirestoreModule: async () => FAKE_FIRESTORE_MODULE,
      createClient: () => {
        calls.client += 1;
        return {};
      },
      createAdapter: () => ({
        async countDocuments() {
          calls.count += 1;
          if (countError !== undefined) {
            throw countError;
          }
          return count;
        },
        async scanProjected() {
          calls.scan += 1;
          if (scanError !== undefined) {
            throw scanError;
          }
          return documents;
        },
      }),
      sensitiveValues,
    },
  };
}

for (const [category, value, present] of UNIT_ATIVO_FIXTURES) {
  test(`ativo: classifica ${category}`, () => {
    assert.equal(
      classifyAtivo(value, present, FAKE_FIRESTORE_TYPES),
      category,
    );
  });
}

test('ativo: ausência prevalece sobre valor presente', () => {
  assert.equal(classifyAtivo(true, false, FAKE_FIRESTORE_TYPES), 'absent');
});

test('ativo: Date não é capturada como mapa', () => {
  assert.equal(classifyAtivo(new Date(), true, FAKE_FIRESTORE_TYPES), 'other');
});

test('ativo: classe customizada não é capturada como mapa', () => {
  assert.equal(
    classifyAtivo(new CustomValue(), true, FAKE_FIRESTORE_TYPES),
    'other',
  );
});

test('ativo: objeto sem prototype é mapa simples', () => {
  assert.equal(
    classifyAtivo(Object.create(null), true, FAKE_FIRESTORE_TYPES),
    'map',
  );
});

for (const [category, value, present] of ROLE_FIXTURES) {
  test(`role: classifica ${category}`, () => {
    assert.equal(classifyRole(value, present), category);
  });
}

test('role: não aplica trim', () => {
  assert.equal(classifyRole(' admin ', true), 'otherString');
});

test('role: comparação diferencia maiúsculas', () => {
  assert.equal(classifyRole('ADMIN', true), 'otherString');
});

test('role: ausência prevalece sobre string conhecida', () => {
  assert.equal(classifyRole('admin', false), 'absent');
});

test('CLI: aceita contrato completo do Emulator', () => {
  assert.deepEqual(parseCliArgs(BASE_CLI), BASE_EMULATOR_OPTIONS);
});

test('CLI: aceita forma remota sem flag e sem default implícito', () => {
  const parsed = parseCliArgs(BASE_CLI.slice(0, -1));
  assert.equal(parsed.emulator, false);
  assert.equal(parsed.maxDocuments, 100);
});

test('CLI: rejeita sintaxe key=value', () => {
  assertSyncCategory(
    () => parseCliArgs(['--database-id=(default)']),
    'invalid-arguments',
  );
});

test('CLI: rejeita argumento desconhecido e projectId', () => {
  assertSyncCategory(
    () => parseCliArgs([...BASE_CLI, '--project-id', 'synthetic']),
    'invalid-arguments',
  );
  assertSyncCategory(
    () => parseCliArgs([...BASE_CLI, '--unknown']),
    'invalid-arguments',
  );
});

test('CLI: rejeita argumento duplicado', () => {
  assertSyncCategory(
    () => parseCliArgs([...BASE_CLI, '--collection', ALLOWED_COLLECTION]),
    'invalid-arguments',
  );
});

test('CLI: rejeita argumento posicional', () => {
  assertSyncCategory(
    () => parseCliArgs([...BASE_CLI, 'positional']),
    'invalid-arguments',
  );
});

test('CLI: rejeita valor ausente ou vazio', () => {
  assertSyncCategory(
    () => parseCliArgs(['--database-id']),
    'invalid-arguments',
  );
  const emptyValue = [...BASE_CLI];
  emptyValue[1] = '';
  assertSyncCategory(() => parseCliArgs(emptyValue), 'invalid-arguments');
});

test('CLI: rejeita ausência de argumento obrigatório', () => {
  assertSyncCategory(
    () => parseCliArgs(BASE_CLI.slice(2)),
    'invalid-arguments',
  );
});

test('max-docs: aceita decimal positivo explícito', () => {
  assert.equal(validateMaxDocuments('10000'), 10000);
});

test('max-docs: rejeita zero', () => {
  assertSyncCategory(() => validateMaxDocuments('0'), 'invalid-arguments');
});

test('max-docs: rejeita sinal', () => {
  assertSyncCategory(() => validateMaxDocuments('+1'), 'invalid-arguments');
  assertSyncCategory(() => validateMaxDocuments('-1'), 'invalid-arguments');
});

test('max-docs: rejeita decimal e notação exponencial', () => {
  assertSyncCategory(() => validateMaxDocuments('1.5'), 'invalid-arguments');
  assertSyncCategory(() => validateMaxDocuments('1e3'), 'invalid-arguments');
});

test('max-docs: rejeita unsafe integer e limite sem T mais um seguro', () => {
  assertSyncCategory(
    () => validateMaxDocuments('9007199254740992'),
    'invalid-arguments',
  );
  assertSyncCategory(
    () => validateMaxDocuments('9007199254740991'),
    'invalid-arguments',
  );
});

test('SHA-256: calcula UTF-8 hexadecimal minúsculo', () => {
  const value = 'São Miguel das Missões';
  const expected = createHash('sha256').update(value, 'utf8').digest('hex');
  assert.equal(sha256Utf8(value), expected);
  assert.match(expected, /^[0-9a-f]{64}$/);
});

test('SHA-256: rejeita valor não textual', () => {
  assertSyncCategory(() => sha256Utf8(17), 'invalid-arguments');
});

test('alvo: rejeita database e coleção divergentes', () => {
  assertSyncCategory(
    () =>
      validateTarget(
        { ...BASE_EMULATOR_OPTIONS, databaseId: 'other' },
        { FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' },
      ),
    'target-mismatch',
  );
  assertSyncCategory(
    () =>
      validateTarget(
        { ...BASE_EMULATOR_OPTIONS, collection: 'other' },
        { FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' },
      ),
    'target-mismatch',
  );
});

test('alvo: rejeita fingerprint curta ou fora de lowercase', () => {
  for (const fingerprint of ['abc', EMULATOR_PROJECT_FINGERPRINT.toUpperCase()]) {
    assertSyncCategory(
      () =>
        validateTarget(
          {
            ...BASE_EMULATOR_OPTIONS,
            expectedProjectSha256: fingerprint,
          },
          { FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' },
        ),
      'target-mismatch',
    );
  }
});

test('alvo: aceita Emulator em 127.0.0.1', () => {
  const target = validateTarget(BASE_EMULATOR_OPTIONS, {
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  });
  assert.equal(target.projectId, EMULATOR_PROJECT_ID);
  assert.equal(target.mode, 'emulator');
});

test('alvo: aceita localhost e ignora variável remota no Emulator', () => {
  const target = validateTarget(BASE_EMULATOR_OPTIONS, {
    FIRESTORE_EMULATOR_HOST: 'localhost:8080',
    ADMIN_B2A5_PROJECT_ID: 'synthetic-secret-project',
  });
  assert.equal(target.projectId, EMULATOR_PROJECT_ID);
});

test('alvo: rejeita flag Emulator sem host', () => {
  assertSyncCategory(
    () => validateTarget(BASE_EMULATOR_OPTIONS, {}),
    'emulator-misconfigured',
  );
});

test('alvo: rejeita host não loopback', () => {
  assertSyncCategory(
    () =>
      validateTarget(BASE_EMULATOR_OPTIONS, {
        FIRESTORE_EMULATOR_HOST: '192.0.2.1:8080',
      }),
    'emulator-misconfigured',
  );
});

test('alvo: rejeita porta inválida', () => {
  for (const host of ['127.0.0.1:0', 'localhost:65536', 'localhost:not-port']) {
    assertSyncCategory(
      () =>
        validateTarget(BASE_EMULATOR_OPTIONS, {
          FIRESTORE_EMULATOR_HOST: host,
        }),
      'emulator-misconfigured',
    );
  }
});

test('alvo: rejeita fingerprint remota no Emulator', () => {
  assertSyncCategory(
    () =>
      validateTarget(
        {
          ...BASE_EMULATOR_OPTIONS,
          expectedProjectSha256: REMOTE_PROJECT_FINGERPRINT,
        },
        { FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' },
      ),
    'target-mismatch',
  );
});

test('alvo: modo remoto nega host do Emulator', () => {
  assertSyncCategory(
    () =>
      validateTarget(
        { ...BASE_EMULATOR_OPTIONS, emulator: false },
        {
          FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
          ADMIN_B2A5_PROJECT_ID: 'synthetic',
        },
      ),
    'emulator-misconfigured',
  );
});

test('alvo: modo remoto exige variável e fingerprint aprovadas', () => {
  assertSyncCategory(
    () =>
      validateTarget(
        {
          ...BASE_EMULATOR_OPTIONS,
          emulator: false,
          expectedProjectSha256: REMOTE_PROJECT_FINGERPRINT,
        },
        {},
      ),
    'target-mismatch',
  );
  assertSyncCategory(
    () =>
      validateTarget(
        {
          ...BASE_EMULATOR_OPTIONS,
          emulator: false,
          expectedProjectSha256: REMOTE_PROJECT_FINGERPRINT,
        },
        { ADMIN_B2A5_PROJECT_ID: 'synthetic-nonmatching-project' },
      ),
    'target-mismatch',
  );
});

test('agregação: cria inventário completo zerado', () => {
  const inventory = createEmptyInventory();
  assert.deepEqual(Reflect.ownKeys(inventory.ativo), ATIVO_CATEGORIES);
  assert.deepEqual(Reflect.ownKeys(inventory.role), ROLE_CATEGORIES);
  assert.deepEqual(Reflect.ownKeys(inventory.roleByAtivo), MATRIX_ROWS);
});

test('agregação: separa admin ativo true', () => {
  const inventory = createEmptyInventory();
  accumulateDocument(
    inventory,
    { role: 'admin', rolePresent: true, ativo: true, ativoPresent: true },
    FAKE_FIRESTORE_TYPES,
  );
  assert.equal(inventory.administrativeProfiles.adminAtivoTrue, 1);
  assert.equal(
    inventory.administrativeProfiles.administrativeProfilesRequiringEvaluation,
    0,
  );
});

test('agregação: separa admin ativo não true', () => {
  const inventory = createEmptyInventory();
  accumulateDocument(
    inventory,
    { role: 'admin', rolePresent: true, ativo: false, ativoPresent: true },
    FAKE_FIRESTORE_TYPES,
  );
  assert.equal(inventory.administrativeProfiles.adminAtivoNotTrue, 1);
  assert.equal(
    inventory.administrativeProfiles.administrativeProfilesRequiringEvaluation,
    1,
  );
});

test('agregação: contabiliza moderator sempre para avaliação', () => {
  const inventory = createEmptyInventory();
  accumulateDocument(
    inventory,
    { role: 'moderator', rolePresent: true, ativo: true, ativoPresent: true },
    FAKE_FIRESTORE_TYPES,
  );
  assert.equal(inventory.administrativeProfiles.moderatorAtivoTrue, 1);
  assert.equal(
    inventory.administrativeProfiles.administrativeProfilesRequiringEvaluation,
    1,
  );
});

test('agregação: mapeia role inválida à linha invalidOrAbsent', () => {
  const inventory = createEmptyInventory();
  const result = accumulateDocument(
    inventory,
    {
      role: 'synthetic-other-role',
      rolePresent: true,
      ativo: true,
      ativoPresent: true,
    },
    FAKE_FIRESTORE_TYPES,
  );
  assert.equal(result.row, 'invalidOrAbsent');
  assert.equal(inventory.roleByAtivo.invalidOrAbsent.booleanTrue, 1);
});

test('agregação: usuário comum inativo não vira perfil administrativo', () => {
  const inventory = createEmptyInventory();
  accumulateDocument(
    inventory,
    { role: 'user', rolePresent: true, ativo: false, ativoPresent: true },
    FAKE_FIRESTORE_TYPES,
  );
  assert.equal(
    inventory.administrativeProfiles.administrativeProfilesRequiringEvaluation,
    0,
  );
});

test('agregação: deduplica condição de tipo inválido por documento', () => {
  const inventory = createEmptyInventory();
  accumulateDocument(
    inventory,
    { role: 17, rolePresent: true, ativo: 'invalid', ativoPresent: true },
    FAKE_FIRESTORE_TYPES,
  );
  assert.equal(inventory.quality.invalidTypeDocuments, 1);
});

test('agregação: deduplica revisão de qualidade por documento', () => {
  const inventory = createEmptyInventory();
  accumulateDocument(
    inventory,
    { role: null, rolePresent: true, ativo: null, ativoPresent: true },
    FAKE_FIRESTORE_TYPES,
  );
  assert.equal(inventory.quality.dataQualityDocumentsRequiringReview, 1);
});

test('agregação: matriz cartesiana de 84 produz métricas normativas', () => {
  const inventory = accumulateUnitMatrix();
  const validation = validateInventory(inventory, 84);
  assert.equal(inventory.role.admin, 12);
  assert.equal(inventory.role.moderator, 12);
  assert.equal(inventory.role.user, 12);
  assert.equal(
    inventory.administrativeProfiles.administrativeProfilesRequiringEvaluation,
    71,
  );
  assert.equal(inventory.quality.invalidTypeDocuments, 60);
  assert.equal(inventory.quality.dataQualityDocumentsRequiringReview, 78);
  assert.equal(validation.classificationDerivedFromSingleQuerySnapshot, true);
});

test('agregação: retorna somente categorias e linha derivadas', () => {
  const inventory = createEmptyInventory();
  const result = accumulateDocument(
    inventory,
    {
      role: 'synthetic-unknown-secret',
      rolePresent: true,
      ativo: Buffer.from([4]),
      ativoPresent: true,
    },
    FAKE_FIRESTORE_TYPES,
  );
  assert.deepEqual(result, {
    ativoCategory: 'other',
    roleCategory: 'otherString',
    row: 'invalidOrAbsent',
  });
  assert.equal(JSON.stringify(inventory).includes('synthetic-unknown-secret'), false);
});

test('invariantes: aceita matriz completa de 84', () => {
  const validation = validateInventory(accumulateUnitMatrix(), 84);
  assert.equal(
    Reflect.ownKeys(validation).every((key) => validation[key] === true),
    true,
  );
});

test('invariantes: rejeita total de scan inválido', () => {
  assertSyncCategory(
    () => validateInventory(createEmptyInventory(), -1),
    'invariant-failed',
  );
});

test('invariantes: rejeita soma de ativo divergente', () => {
  const inventory = accumulateUnitMatrix();
  inventory.ativo.booleanTrue += 1;
  assertSyncCategory(() => validateInventory(inventory, 84), 'invariant-failed');
});

test('invariantes: rejeita soma de role divergente', () => {
  const inventory = accumulateUnitMatrix();
  inventory.role.admin += 1;
  assertSyncCategory(() => validateInventory(inventory, 84), 'invariant-failed');
});

test('invariantes: rejeita soma da matriz divergente', () => {
  const inventory = accumulateUnitMatrix();
  inventory.roleByAtivo.admin.booleanTrue += 1;
  assertSyncCategory(() => validateInventory(inventory, 84), 'invariant-failed');
});

test('invariantes: rejeita split de admin divergente', () => {
  const inventory = accumulateUnitMatrix();
  inventory.administrativeProfiles.adminAtivoTrue += 1;
  inventory.administrativeProfiles.adminAtivoNotTrue -= 1;
  assertSyncCategory(() => validateInventory(inventory, 84), 'invariant-failed');
});

test('invariantes: rejeita split de moderator divergente', () => {
  const inventory = accumulateUnitMatrix();
  inventory.administrativeProfiles.moderatorAtivoTrue += 1;
  inventory.administrativeProfiles.moderatorAtivoNotTrue -= 1;
  assertSyncCategory(() => validateInventory(inventory, 84), 'invariant-failed');
});

test('invariantes: rejeita linha user divergente', () => {
  const inventory = accumulateUnitMatrix();
  inventory.role.user -= 1;
  inventory.role.otherString += 1;
  assertSyncCategory(() => validateInventory(inventory, 84), 'invariant-failed');
});

test('invariantes: rejeita linha invalidOrAbsent divergente', () => {
  const inventory = accumulateUnitMatrix();
  inventory.role.otherString -= 1;
  inventory.role.user += 1;
  assertSyncCategory(() => validateInventory(inventory, 84), 'invariant-failed');
});

test('invariantes: rejeita contador negativo', () => {
  const inventory = createEmptyInventory();
  inventory.ativo.booleanTrue = -1;
  assertSyncCategory(() => validateInventory(inventory, 0), 'invariant-failed');
});

test('invariantes: rejeita contador fracionário', () => {
  const inventory = createEmptyInventory();
  inventory.role.admin = 0.5;
  assertSyncCategory(() => validateInventory(inventory, 0), 'invariant-failed');
});

test('invariantes: rejeita categoria, linha ou célula ausente', () => {
  const missingCategory = createEmptyInventory();
  delete missingCategory.ativo.other;
  assertSyncCategory(
    () => validateInventory(missingCategory, 0),
    'invariant-failed',
  );

  const missingRow = createEmptyInventory();
  delete missingRow.roleByAtivo.user;
  assertSyncCategory(
    () => validateInventory(missingRow, 0),
    'invariant-failed',
  );

  const missingCell = createEmptyInventory();
  delete missingCell.roleByAtivo.admin.other;
  assertSyncCategory(
    () => validateInventory(missingCell, 0),
    'invariant-failed',
  );
});

test('invariantes: rejeita categoria desconhecida ou chamadas divergentes', () => {
  const unknown = createEmptyInventory();
  unknown.role.unknown = 0;
  assertSyncCategory(() => validateInventory(unknown, 0), 'invariant-failed');

  const calls = createEmptyInventory();
  calls.accumulationCalls = 1;
  assertSyncCategory(() => validateInventory(calls, 0), 'invariant-failed');
});

test('saída: constrói allowlist estrutural determinística', () => {
  const summary = validEmptySummary();
  assert.deepEqual(Reflect.ownKeys(summary), [
    'ok',
    'schemaVersion',
    'target',
    'window',
    'volumeGate',
    'ativo',
    'role',
    'roleByAtivo',
    'administrativeProfiles',
    'quality',
    'validation',
  ]);
  assert.equal(summary.schemaVersion, SCHEMA_VERSION);
});

test('saída: serializa sucesso compacto em uma linha com newline', () => {
  const serialized = serializeSuccess(validEmptySummary());
  assert.equal(serialized.endsWith('\n'), true);
  assert.equal(serialized.slice(0, -1).includes('\n'), false);
  assert.equal(JSON.parse(serialized).ok, true);
});

test('saída: bloqueia paths de documentos e projetos', () => {
  for (const value of [
    { leak: '/documents/synthetic' },
    { leak: 'projects/synthetic' },
    { leak: 'usuarios/synthetic' },
  ]) {
    assertSyncCategory(
      () => assertSanitizedOutput(value),
      'output-sanitization-failed',
    );
  }
});

test('saída: bloqueia headers e bearer', () => {
  for (const value of [{ leak: 'Bearer secret' }, { leak: 'Authorization' }]) {
    assertSyncCategory(
      () => assertSanitizedOutput(value),
      'output-sanitization-failed',
    );
  }
});

test('saída: bloqueia valores sensíveis injetados sem imprimi-los', () => {
  assertSyncCategory(
    () =>
      assertSanitizedOutput(
        { leak: 'synthetic-secret-fixture-id' },
        ['synthetic-secret-fixture-id'],
      ),
    'output-sanitization-failed',
  );
});

test('erros: preserva somente categoria conhecida', () => {
  const error = new InventoryToolError('volume-limit');
  assert.equal(sanitizeErrorCategory(error), 'volume-limit');
  assert.equal(error.exitCode, EXIT_CODES['volume-limit']);
});

test('erros: converte códigos de autenticação sem conteúdo bruto', () => {
  assert.equal(sanitizeErrorCategory({ code: 7 }), 'auth-denied');
  assert.equal(
    sanitizeErrorCategory({ code: 'UNAUTHENTICATED' }),
    'auth-denied',
  );
});

test('erros: serialização inesperada não contém mensagem nem stack', () => {
  const serialized = serializeError(new Error('synthetic-sensitive-message'));
  assert.deepEqual(JSON.parse(serialized), {
    ok: false,
    schemaVersion: 1,
    error: { category: 'unexpected-error' },
  });
  assert.equal(serialized.includes('synthetic-sensitive-message'), false);
});

test('main: argumento inválido usa somente stderr e não cria cliente', async () => {
  let stdout = '';
  let stderr = '';
  let clientCreated = false;
  const exitCode = await main({
    argv: [],
    env: {},
    io: {
      writeStdout: (value) => {
        stdout += value;
      },
      writeStderr: (value) => {
        stderr += value;
      },
    },
    dependencies: {
      createClient: () => {
        clientCreated = true;
      },
    },
  });
  assert.equal(exitCode, EXIT_CODES['invalid-arguments']);
  assert.equal(stdout, '');
  assert.equal(JSON.parse(stderr).error.category, 'invalid-arguments');
  assert.equal(clientCreated, false);
});

test('entry point: importar módulo não produz saída nem executa main', () => {
  const modulePath = fileURLToPath(
    new URL('./admin-b2a5-inventory.mjs', import.meta.url),
  );
  const script = `await import(${JSON.stringify(
    new URL('./admin-b2a5-inventory.mjs', import.meta.url).href,
  )})`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: fileURLToPath(new URL('.', import.meta.url)),
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
    },
  });
  assert.equal(modulePath.endsWith('admin-b2a5-inventory.mjs'), true);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

test('adaptador: aceita módulo Firestore completo por import dinâmico', async () => {
  const loaded = await loadFirestoreModule(async () => FAKE_FIRESTORE_MODULE);
  assert.equal(loaded, FAKE_FIRESTORE_MODULE);
});

test('adaptador: falha de import ou contrato vira dependency-error', async () => {
  await assertAsyncCategory(
    () => loadFirestoreModule(async () => {
      throw new Error('synthetic-import-path');
    }),
    'dependency-error',
  );
  await assertAsyncCategory(
    () => loadFirestoreModule(async () => ({ Firestore: FakeFirestore })),
    'dependency-error',
  );
});

test('adaptador: count usa somente usuarios count get', async () => {
  const calls = [];
  const firestore = {
    collection(name) {
      calls.push(['collection', name]);
      return {
        count() {
          calls.push(['count']);
          return {
            async get() {
              calls.push(['get']);
              return { data: () => ({ count: 3 }) };
            },
          };
        },
      };
    },
  };
  const adapter = createFirestoreReadAdapter(firestore);
  assert.equal(await adapter.countDocuments(), 3);
  assert.deepEqual(calls, [
    ['collection', 'usuarios'],
    ['count'],
    ['get'],
  ]);
});

test('adaptador: scan projeta dois campos, limita T mais um e remove metadata', async () => {
  const calls = [];
  const firestore = {
    collection(name) {
      calls.push(['collection', name]);
      return {
        select(...fields) {
          calls.push(['select', ...fields]);
          return {
            limit(value) {
              calls.push(['limit', value]);
              return {
                async get() {
                  calls.push(['get']);
                  return {
                    docs: [
                      {
                        id: 'synthetic-secret-id',
                        path: 'usuarios/synthetic-secret-id',
                        data: () => ({ ativo: true, role: 'admin', extra: 'x' }),
                      },
                    ],
                  };
                },
              };
            },
          };
        },
      };
    },
  };
  const documents = await createFirestoreReadAdapter(firestore).scanProjected(10);
  assert.deepEqual(calls, [
    ['collection', 'usuarios'],
    ['select', 'ativo', 'role'],
    ['limit', 11],
    ['get'],
  ]);
  assert.deepEqual(documents, [
    {
      ativoPresent: true,
      ativo: true,
      rolePresent: true,
      role: 'admin',
    },
  ]);
  assert.equal(JSON.stringify(documents).includes('synthetic-secret-id'), false);
});

test('orquestração: sucesso usa count, snapshot único e horários determinísticos', async () => {
  const documents = [
    { ativo: true, ativoPresent: true, role: 'admin', rolePresent: true },
  ];
  const setup = makeRunDependencies({ count: 1, documents });
  const summary = await runInventory(BASE_EMULATOR_OPTIONS, setup.dependencies);
  assert.deepEqual(setup.calls, { client: 1, count: 1, scan: 1 });
  assert.equal(summary.volumeGate.countBeforeScan, 1);
  assert.equal(summary.volumeGate.scanDocuments, 1);
  assert.equal(summary.volumeGate.countMismatchDetected, false);
  assert.equal(summary.window.startedAtUtc, '2026-07-30T12:00:00.000Z');
  assert.equal(summary.window.endedAtUtc, '2026-07-30T12:00:01.000Z');
});

test('orquestração: count acima do teto bloqueia antes do scan', async () => {
  const setup = makeRunDependencies({ count: 101 });
  await assertAsyncCategory(
    () => runInventory(BASE_EMULATOR_OPTIONS, setup.dependencies),
    'volume-limit',
  );
  assert.deepEqual(setup.calls, { client: 1, count: 1, scan: 0 });
});

test('orquestração: T mais um detecta volume excedido', async () => {
  const documents = Array.from({ length: 101 }, () => ({
    ativo: true,
    ativoPresent: true,
    role: 'user',
    rolePresent: true,
  }));
  const setup = makeRunDependencies({ count: 100, documents });
  await assertAsyncCategory(
    () => runInventory(BASE_EMULATOR_OPTIONS, setup.dependencies),
    'volume-limit',
  );
});

test('orquestração: mismatch, falha de query e auth são sanitizados sem retry', async () => {
  const mismatch = makeRunDependencies({ count: 1, documents: [] });
  await assertAsyncCategory(
    () => runInventory(BASE_EMULATOR_OPTIONS, mismatch.dependencies),
    'count-mismatch',
  );

  const query = makeRunDependencies({
    countError: new Error('synthetic-query-sensitive'),
  });
  await assertAsyncCategory(
    () => runInventory(BASE_EMULATOR_OPTIONS, query.dependencies),
    'query-failed',
  );
  assert.equal(query.calls.count, 1);

  const auth = makeRunDependencies({ countError: { code: 7 } });
  await assertAsyncCategory(
    () => runInventory(BASE_EMULATOR_OPTIONS, auth.dependencies),
    'auth-denied',
  );
  assert.equal(auth.calls.count, 1);
});

let emulatorFirestore;
let emulatorSummary;
let emulatorFixtureIds = [];

function assertLocalEmulatorEnvironment() {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  assert.equal(typeof host, 'string');
  assert.match(host, /^(127\.0\.0\.1|localhost):[0-9]+$/);
  assert.equal(process.env.GOOGLE_APPLICATION_CREDENTIALS, undefined);
  return host;
}

async function clearEmulatorFixtures() {
  const snapshot = await emulatorFirestore.collection(ALLOWED_COLLECTION).get();
  if (snapshot.empty) {
    return;
  }
  const batch = emulatorFirestore.batch();
  for (const document of snapshot.docs) {
    batch.delete(document.ref);
  }
  await batch.commit();
}

function emulatorAtivoFixtures(database) {
  return [
    ['booleanTrue', true, true],
    ['booleanFalse', false, true],
    ['absent', undefined, false],
    ['null', null, true],
    ['string', 'synthetic-string', true],
    ['number', 17, true],
    ['array', ['synthetic-array'], true],
    ['map', { synthetic: true }, true],
    ['timestamp', Timestamp.fromMillis(1700000000000), true],
    ['reference', database.doc('synthetic-references/target'), true],
    ['geopoint', new GeoPoint(-28.55, -54.55), true],
    ['other', Buffer.from([1, 2, 3, 4]), true],
  ];
}

async function seedEmulatorMatrix() {
  await clearEmulatorFixtures();
  emulatorFixtureIds = [];
  const batch = emulatorFirestore.batch();
  const ativos = emulatorAtivoFixtures(emulatorFirestore);

  for (let roleIndex = 0; roleIndex < ROLE_FIXTURES.length; roleIndex += 1) {
    const [, role, rolePresent] = ROLE_FIXTURES[roleIndex];
    for (let ativoIndex = 0; ativoIndex < ativos.length; ativoIndex += 1) {
      const [, ativo, ativoPresent] = ativos[ativoIndex];
      const fixtureId = `synthetic-fixture-${roleIndex}-${ativoIndex}`;
      emulatorFixtureIds.push(fixtureId);
      const data = {};
      if (rolePresent) {
        data.role = role;
      }
      if (ativoPresent) {
        data.ativo = ativo;
      }
      batch.set(
        emulatorFirestore.collection(ALLOWED_COLLECTION).doc(fixtureId),
        data,
      );
    }
  }
  await batch.commit();
}

test('EMULATOR: valida ambiente local e semeia 84 fixtures sintéticas', {
  skip: process.env.FIRESTORE_EMULATOR_HOST === undefined,
}, async () => {
  assertLocalEmulatorEnvironment();
  emulatorFirestore = new Firestore({
    projectId: EMULATOR_PROJECT_ID,
    databaseId: ALLOWED_DATABASE_ID,
  });
  await seedEmulatorMatrix();
  const countSnapshot = await emulatorFirestore
    .collection(ALLOWED_COLLECTION)
    .count()
    .get();
  assert.equal(countSnapshot.data().count, 84);
  assert.equal(emulatorFixtureIds.length, 84);
});

test('EMULATOR: adaptador lê uma única projeção limitada de 84 documentos', {
  skip: process.env.FIRESTORE_EMULATOR_HOST === undefined,
}, async () => {
  const documents = await createFirestoreReadAdapter(
    emulatorFirestore,
  ).scanProjected(84);
  assert.equal(documents.length, 84);
  assert.equal(
    documents.every(
      (document) =>
        Reflect.ownKeys(document).length === 4 &&
        hasOwnForTest(document, 'ativoPresent') &&
        hasOwnForTest(document, 'rolePresent'),
    ),
    true,
  );
});

test('EMULATOR: ferramenta executa inventário agregado completo', {
  skip: process.env.FIRESTORE_EMULATOR_HOST === undefined,
}, async () => {
  emulatorSummary = await runInventory(
    {
      ...BASE_EMULATOR_OPTIONS,
      maxDocuments: 84,
    },
    {
      env: {
        FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
      },
    },
  );
  assert.equal(emulatorSummary.volumeGate.countBeforeScan, 84);
  assert.equal(emulatorSummary.volumeGate.scanDocuments, 84);
});

test('EMULATOR: matriz completa contém 12 por role e uma por célula', {
  skip: process.env.FIRESTORE_EMULATOR_HOST === undefined,
}, () => {
  assert.equal(emulatorSummary.role.admin, 12);
  assert.equal(emulatorSummary.role.moderator, 12);
  assert.equal(emulatorSummary.role.user, 12);
  assert.equal(
    emulatorSummary.roleByAtivo.invalidOrAbsent.booleanTrue,
    4,
  );
  for (const row of MATRIX_ROWS) {
    for (const category of ATIVO_CATEGORIES) {
      const expected = row === 'invalidOrAbsent' ? 4 : 1;
      assert.equal(emulatorSummary.roleByAtivo[row][category], expected);
    }
  }
});

test('EMULATOR: cada categoria de ativo contém sete documentos', {
  skip: process.env.FIRESTORE_EMULATOR_HOST === undefined,
}, () => {
  for (const category of ATIVO_CATEGORIES) {
    assert.equal(emulatorSummary.ativo[category], 7);
  }
});

test('EMULATOR: métricas administrativas correspondem à matriz normativa', {
  skip: process.env.FIRESTORE_EMULATOR_HOST === undefined,
}, () => {
  assert.deepEqual(emulatorSummary.administrativeProfiles, {
    adminAtivoTrue: 1,
    adminAtivoNotTrue: 11,
    moderatorAtivoTrue: 1,
    moderatorAtivoNotTrue: 11,
    administrativeProfilesRequiringEvaluation: 71,
  });
});

test('EMULATOR: métricas de qualidade correspondem às uniões deduplicadas', {
  skip: process.env.FIRESTORE_EMULATOR_HOST === undefined,
}, () => {
  assert.deepEqual(emulatorSummary.quality, {
    invalidTypeDocuments: 60,
    dataQualityDocumentsRequiringReview: 78,
  });
});

test('EMULATOR: bytes fazem round-trip real na categoria other', {
  skip: process.env.FIRESTORE_EMULATOR_HOST === undefined,
}, async () => {
  const snapshot = await emulatorFirestore
    .collection(ALLOWED_COLLECTION)
    .doc('synthetic-fixture-0-11')
    .get();
  const value = snapshot.data().ativo;
  assert.equal(Buffer.isBuffer(value) || value instanceof Uint8Array, true);
  assert.equal(
    classifyAtivo(value, true, {
      Timestamp,
      DocumentReference,
      GeoPoint,
    }),
    'other',
  );
});

test('EMULATOR: gate de volume bloqueia 84 documentos com teto 83', {
  skip: process.env.FIRESTORE_EMULATOR_HOST === undefined,
}, async () => {
  await assertAsyncCategory(
    () =>
      runInventory(
        {
          ...BASE_EMULATOR_OPTIONS,
          maxDocuments: 83,
        },
        {
          env: {
            FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
          },
        },
      ),
    'volume-limit',
  );
});

test('EMULATOR: saída não contém IDs e limpeza remove as fixtures', {
  skip: process.env.FIRESTORE_EMULATOR_HOST === undefined,
}, async () => {
  const serialized = serializeSuccess(emulatorSummary, emulatorFixtureIds);
  for (const fixtureId of emulatorFixtureIds) {
    assert.equal(serialized.includes(fixtureId), false);
  }
  await clearEmulatorFixtures();
  const countSnapshot = await emulatorFirestore
    .collection(ALLOWED_COLLECTION)
    .count()
    .get();
  assert.equal(countSnapshot.data().count, 0);
  await emulatorFirestore.terminate();
});

function hasOwnForTest(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}
