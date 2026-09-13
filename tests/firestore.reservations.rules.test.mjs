import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { after, before, beforeEach, describe, test } from "node:test";
import { runInNewContext } from "node:vm";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

const PROJECT_ID = "demo-turismo-sms-rules-test";
const PREPATCH_MODE = process.env.RESERVATION_RULES_EXPECTATION === "prepatch";

const EXPERIENCES = [
  [1, "Passeio de Barco pelo Rio Iguaçu", ["09:00", "14:00", "16:00"], 80, 12],
  [2, "Tour Rota da Erva-Mate", ["08:30", "13:30"], 120, 15],
  [3, "Experiência Gastronômica Polonesa", ["10:00", "15:00"], 150, 8],
  [4, "Roteiro de Turismo Religioso", ["08:00", "13:00"], 100, 20],
  [5, "Trilha Ecológica do Iguaçu", ["07:00", "15:00"], 60, 10],
  [6, "City Tour São Mateus do Sul", ["09:00", "14:00"], 70, 25],
];

let testEnv;
let reservationSource;
let reservationRulesSource;

function anonymousDb() {
  return testEnv.unauthenticatedContext().firestore();
}

function validReservation(overrides = {}) {
  return {
    experienciaId: 1,
    experienciaNome: "Passeio de Barco pelo Rio Iguaçu",
    data: "2099-12-20",
    horario: "09:00",
    pessoas: 2,
    nome: "Pessoa Teste",
    email: "teste@example.invalid",
    telefone: "(42) 99999-9999",
    observacoes: "Fixture sintética.",
    valorTotal: 160,
    status: "pendente",
    criadaEm: new Date().toISOString(),
    criadoEm: serverTimestamp(),
    ...overrides,
  };
}

function withoutField(field) {
  const payload = validReservation();
  delete payload[field];
  return payload;
}

async function writeReservation(id, payload) {
  return setDoc(doc(anonymousDb(), "reservas", id), payload);
}

async function loadRuntimeReservations() {
  const window = {};
  runInNewContext(reservationSource, {
    window,
    document: { addEventListener() {} },
    localStorage: { removeItem() {} },
    Date,
    console,
    encodeURIComponent,
    setTimeout,
    clearTimeout,
  }, { filename: "js/reservas.js" });

  return window.Reservas.experiencias.map((experiencia) => ({
    ...window.Reservas.construirReserva({
      experienciaId: experiencia.id,
      data: "2099-12-20",
      horario: experiencia.horarios[0],
      pessoas: experiencia.vagasPorHorario,
      nome: "João Łucja Teste",
      email: "joao.teste@example.invalid",
      telefone: "+55 (42) 99999-9999",
      observacoes: "Sem lactose; chegada às 9h30.",
    }),
    criadoEm: serverTimestamp(),
  }));
}

before(async () => {
  const [rules, source] = await Promise.all([
    readFile(new URL("../firestore.rules", import.meta.url), "utf8"),
    readFile(new URL("../js/reservas.js", import.meta.url), "utf8"),
  ]);
  reservationRulesSource = rules;
  reservationSource = source;
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv?.cleanup();
});

describe("Reservas públicas legítimas", () => {
  test("payload mínimo legítimo sem observações é aceito", async () => {
    await assertSucceeds(writeReservation("valid-minimal", {
      ...withoutField("observacoes"),
      data: new Date().toISOString().slice(0, 10),
    }));
  });

  test("payload completo preserva caracteres brasileiros, pontuação e telefone formatado", async () => {
    await assertSucceeds(writeReservation("valid-brazilian", validReservation({
      nome: "João Łucja da Silva",
      email: "joao.silva@example.invalid",
      telefone: "+55 (42) 99999-9999",
      observacoes: "Criança, 5 anos; atenção a pão, pierogi e chá. <script> é texto livre.",
    })));
  });

  test("catálogo completo produzido pelo builder atual de js/reservas.js é aceito", async () => {
    const payloads = await loadRuntimeReservations();
    assert.equal(payloads.length, 6);
    for (const [index, payload] of payloads.entries()) {
      await assertSucceeds(writeReservation(`valid-runtime-${index + 1}`, payload));
    }
  });

  for (const [id, name, times, price, capacity] of EXPERIENCES) {
    test(`experiência ${id} aceita a capacidade legítima no horário publicado`, async () => {
      await assertSucceeds(writeReservation(`valid-experience-${id}`, validReservation({
        experienciaId: id,
        experienciaNome: name,
        horario: times[0],
        pessoas: capacity,
        valorTotal: price * capacity,
        ...(id === 1 ? { observacoes: "" } : {}),
      })));
    });
  }

  test("limites máximos de texto são aceitos", async () => {
    await assertSucceeds(writeReservation("valid-text-limits", validReservation({
      data: "2027-04-30",
      nome: "Á".repeat(160),
      email: `${"a".repeat(200)}@${"b".repeat(49)}.com`,
      telefone: `+${"5".repeat(31)}`,
      observacoes: "ç".repeat(2000),
    })));
  });

  test("29 de fevereiro é aceito em ano bissexto", async () => {
    await assertSucceeds(writeReservation("valid-leap-day", validReservation({
      data: "2028-02-29",
    })));
  });
});

const invalidCases = [
  ["A_EXTRA_UNKNOWN_FIELD", false, () => validReservation({ campoInvisivel: true })],
  ["B_WRONG_TYPE_NAME", true, () => validReservation({ nome: 42 })],
  ["C_WRONG_TYPE_EMAIL", true, () => validReservation({ email: ["teste@example.invalid"] })],
  ["D_WRONG_TYPE_PHONE", true, () => validReservation({ telefone: { numero: "42999999999" } })],
  ["E_WRONG_TYPE_PEOPLE_COUNT", true, () => validReservation({ pessoas: "2" })],
  ["F_NEGATIVE_PEOPLE_COUNT", true, () => validReservation({ pessoas: -1, valorTotal: -80 })],
  ["G_ABSURD_PEOPLE_COUNT", true, () => validReservation({ pessoas: 1000000, valorTotal: 80000000 })],
  ["H_OVERLONG_NAME", true, () => validReservation({ nome: "A".repeat(161) })],
  ["I_OVERLONG_EMAIL", true, () => validReservation({ email: `${"a".repeat(201)}@${"b".repeat(49)}.com` })],
  ["J_OVERLONG_PHONE", true, () => validReservation({ telefone: "+".repeat(33) })],
  ["K_OVERLONG_OBSERVATIONS", true, () => validReservation({ observacoes: "A".repeat(2001) })],
  ["L_INVALID_STATUS", false, () => validReservation({ status: "confirmada" })],
  ["M_CLIENT_FORGED_SERVER_FIELDS", true, () => validReservation({ firestoreId: "forjado" })],
  ["N_INVALID_DATE_TYPE", true, () => validReservation({ data: new Date("2099-12-20T00:00:00Z") })],
  ["O_INVALID_EXPERIENCE_ID_TYPE", true, () => validReservation({ experienciaId: "1" })],
  ["P_MISSING_REQUIRED_FIELD", true, () => withoutField("nome")],
  ["Q_UNEXPECTED_NESTED_OBJECT", true, () => validReservation({ observacoes: { texto: "objeto" } })],
  ["WRONG_TYPE_EXPERIENCE_NAME", true, () => validReservation({ experienciaNome: ["Passeio"] })],
  ["WRONG_TYPE_TIME", true, () => validReservation({ horario: 900 })],
  ["WRONG_TYPE_TOTAL", true, () => validReservation({ valorTotal: "160" })],
  ["WRONG_TYPE_STATUS", false, () => validReservation({ status: 1 })],
  ["WRONG_TYPE_CLIENT_TIMESTAMP", true, () => validReservation({ criadaEm: 0 })],
  ["WRONG_TYPE_SERVER_TIMESTAMP", true, () => validReservation({ criadoEm: "agora" })],
  ["FLOAT_PEOPLE_COUNT", true, () => validReservation({ pessoas: 1.5, valorTotal: 120 })],
  ["EMPTY_NAME", true, () => validReservation({ nome: "" })],
  ["INVALID_EMAIL_STRUCTURE", true, () => validReservation({ email: "email-sem-arroba" })],
  ["TOO_SHORT_PHONE", true, () => validReservation({ telefone: "1234567" })],
  ["INVALID_DATE_FORMAT", true, () => validReservation({ data: "20/12/2099" })],
  ["INVALID_NON_LEAP_DAY", true, () => validReservation({ data: "2099-02-29" })],
  ["INVALID_FEBRUARY_DAY", true, () => validReservation({ data: "2099-02-31" })],
  ["INVALID_APRIL_DAY", true, () => validReservation({ data: "2099-04-31" })],
  ["PAST_DATE", true, () => validReservation({ data: "2020-01-01" })],
  ["INVALID_TIME", true, () => validReservation({ horario: "23:59" })],
  ["UNKNOWN_EXPERIENCE", true, () => validReservation({ experienciaId: 999 })],
  ["FORGED_EXPERIENCE_NAME", true, () => validReservation({ experienciaNome: "Nome forjado" })],
  ["FORGED_TOTAL", true, () => validReservation({ valorTotal: 1 })],
  ["FORGED_CREATED_TIMESTAMP", true, () => validReservation({ criadoEm: new Date("2020-01-01T00:00:00Z") })],
  ["INVALID_CLIENT_TIMESTAMP", true, () => validReservation({ criadaEm: "ontem" })],
  ["FORGED_CLIENT_TIMESTAMP_DATE", true, () => validReservation({ criadaEm: "2000-01-01T00:00:00.000Z" })],
  ["INVALID_CLIENT_TIMESTAMP_TIME", true, () => validReservation({ criadaEm: "9999-12-31T99:99:99.999Z" })],
  ["FORGED_DOCUMENT_ID_FIELD", true, () => validReservation({ id: "forjado" })],
  ["ADMINISTRATIVE_FIELD", false, () => validReservation({ approvedBy: "cliente" })],
];

describe(PREPATCH_MODE ? "Reprodução do gap nas Rules anteriores" : "Reservas públicas inválidas", () => {
  for (const [name, oldRulesAllowed, payload] of invalidCases) {
    test(`${name}: ${PREPATCH_MODE ? `Rules antigas ${oldRulesAllowed ? "ALLOW" : "DENY"}` : "DENY"}`, async () => {
      const operation = writeReservation(`invalid-${name.toLowerCase().replaceAll("_", "-")}`, payload());
      if (PREPATCH_MODE && oldRulesAllowed) {
        await assertSucceeds(operation);
      } else {
        await assertFails(operation);
      }
    });
  }
});

test("matriz A-Q mantém classificação explícita das Rules anteriores", () => {
  assert.deepEqual(
    invalidCases.slice(0, 17).map(([name, oldRulesAllowed]) => [name, oldRulesAllowed ? "ALLOW" : "DENY"]),
    [
      ["A_EXTRA_UNKNOWN_FIELD", "DENY"],
      ["B_WRONG_TYPE_NAME", "ALLOW"],
      ["C_WRONG_TYPE_EMAIL", "ALLOW"],
      ["D_WRONG_TYPE_PHONE", "ALLOW"],
      ["E_WRONG_TYPE_PEOPLE_COUNT", "ALLOW"],
      ["F_NEGATIVE_PEOPLE_COUNT", "ALLOW"],
      ["G_ABSURD_PEOPLE_COUNT", "ALLOW"],
      ["H_OVERLONG_NAME", "ALLOW"],
      ["I_OVERLONG_EMAIL", "ALLOW"],
      ["J_OVERLONG_PHONE", "ALLOW"],
      ["K_OVERLONG_OBSERVATIONS", "ALLOW"],
      ["L_INVALID_STATUS", "DENY"],
      ["M_CLIENT_FORGED_SERVER_FIELDS", "ALLOW"],
      ["N_INVALID_DATE_TYPE", "ALLOW"],
      ["O_INVALID_EXPERIENCE_ID_TYPE", "ALLOW"],
      ["P_MISSING_REQUIRED_FIELD", "ALLOW"],
      ["Q_UNEXPECTED_NESTED_OBJECT", "ALLOW"],
    ],
  );

  const calendarPatternMatch = reservationRulesSource.match(
    /function validReservationCalendarDate\(value\) \{[\s\S]*?value\.matches\(\s*'([^']+)'\s*\)/,
  );
  assert.ok(calendarPatternMatch, "validador gregoriano deve permanecer explícito nas Rules");
  const calendarPattern = new RegExp(calendarPatternMatch[1]);
  assert.deepEqual(
    ["2026-02-29", "2028-02-29", "2026-04-31", "2026-04-30", "2026-13-01"]
      .map((date) => [date, calendarPattern.test(date)]),
    [
      ["2026-02-29", false],
      ["2028-02-29", true],
      ["2026-04-31", false],
      ["2026-04-30", true],
      ["2026-13-01", false],
    ],
  );
});
