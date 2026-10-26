import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  createRoom,
  getRoom,
  joinRoom,
  publishResult,
  publishState,
  requestRematch,
  startMatch,
} from "../js/services/rooms.js";

const localValues = new Map();
const sessionValues = new Map();

globalThis.localStorage = {
  getItem: key => localValues.get(key) ?? null,
  setItem: (key, value) => localValues.set(key, value),
  removeItem: key => localValues.delete(key),
  clear: () => localValues.clear(),
};

globalThis.sessionStorage = {
  getItem: key => sessionValues.get(key) ?? null,
  setItem: (key, value) => sessionValues.set(key, value),
  removeItem: key => sessionValues.delete(key),
  clear: () => sessionValues.clear(),
};

function setRole(pin, role) {
  sessionValues.set("lig4.room.pin", pin);
  sessionValues.set("lig4.room.role", role);
  sessionValues.set("lig4.room.clientId", "partida-test-client");
}

async function createPlayingRoom() {
  const { pin } = await createRoom({ series: 3, color: "blue" });
  await joinRoom({ pin, color: "red" });
  setRole(pin, "owner");
  await startMatch({ pin });
  return pin;
}

beforeEach(() => {
  localValues.clear();
  sessionValues.clear();
});

test("publishState rejeita fora da vez e aceita o jogador da vez", async () => {
  const pin = await createPlayingRoom();
  const board = Array.from({ length: 6 }, () => Array(7).fill(0));
  board[5][3] = 1;

  setRole(pin, "guest");
  await assert.rejects(
    publishState({ pin, role: "guest", board, turn: 1, moveCount: 1 }),
    { code: "SEM_PERMISSAO" },
  );

  setRole(pin, "owner");
  assert.deepEqual(
    await publishState({ pin, role: "owner", board, turn: 2, moveCount: 1 }),
    { pin, turn: 2, moveCount: 1 },
  );
  assert.deepEqual((await getRoom(pin)).game, { board, turn: 2, moveCount: 1 });
});

test("publishState rejeita matriz malformada", async () => {
  const pin = await createPlayingRoom();
  const malformedBoard = Array.from({ length: 6 }, () => Array(7).fill(0));
  malformedBoard[4][2] = 4;

  await assert.rejects(
    publishState({ pin, role: "owner", board: malformedBoard, turn: 2, moveCount: 1 }),
    { code: "TABULEIRO_INVALIDO" },
  );
});

test("publishResult fecha a partida", async () => {
  const pin = await createPlayingRoom();
  const result = { winner: 1, draw: false };

  assert.deepEqual(await publishResult({ pin, role: "owner", result }), { pin, phase: "finished" });
  assert.equal((await getRoom(pin)).phase, "finished");
  assert.deepEqual((await getRoom(pin)).result, result);
});

test("publishResult aceita repetição idêntica sem notificar e rejeita divergência", async () => {
  const pin = await createPlayingRoom();
  const result = { winner: 1, draw: false };
  const updates = [];
  const cancel = (await import("../js/services/rooms.js")).watchRoom(pin, room => updates.push(room));

  await publishResult({ pin, role: "owner", result });
  assert.equal(updates.length, 2);

  setRole(pin, "guest");
  assert.deepEqual(await publishResult({ pin, role: "guest", result: { ...result } }), { pin, phase: "finished" });
  assert.equal(updates.length, 2);

  await assert.rejects(
    publishResult({ pin, role: "guest", result: { winner: 2, draw: false } }),
    { code: "RESULTADO_INVALIDO" },
  );
  assert.deepEqual((await getRoom(pin)).result, result);
  assert.equal(updates.length, 2);
  cancel();
});

test("requestRematch só reinicia depois dos dois pedidos", async () => {
  const pin = await createPlayingRoom();
  await publishResult({ pin, role: "owner", result: { winner: 1, draw: false } });

  assert.deepEqual(await requestRematch({ pin, role: "owner" }), { pin, phase: "finished" });
  assert.deepEqual((await getRoom(pin)).rematchRequested, ["owner"]);

  setRole(pin, "guest");
  assert.deepEqual(await requestRematch({ pin, role: "guest" }), { pin, phase: "playing" });
  assert.deepEqual((await getRoom(pin)).game, {
    board: Array.from({ length: 6 }, () => Array(7).fill(0)),
    turn: 1,
    moveCount: 0,
  });
});
test("o modo escolhido pelo dono fica registrado na sala", async () => {
  const { pin } = await createRoom({ series: 1, color: "blue", mode: "inverno" });
  assert.equal((await getRoom(pin)).mode, "inverno");
});
test("modo inválido não cria sala", async () => {
  await assert.rejects(createRoom({ series: 1, color: "blue", mode: "inexistente" }), { code: "MODO_INVALIDO" });
});
