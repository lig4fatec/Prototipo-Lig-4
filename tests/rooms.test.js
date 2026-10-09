import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CORES_VALIDAS,
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  setPlayerColor,
  startMatch,
  watchRoom,
} from "../js/services/rooms.js";

const session = new Map();
globalThis.sessionStorage = {
  getItem: key => session.get(key) ?? null,
  setItem: (key, value) => session.set(key, value),
  removeItem: key => session.delete(key),
};

const sessionKeys = {
  pin: "lig4.room.pin",
  role: "lig4.room.role",
  clientId: "lig4.room.clientId",
};

function setSession(pin, role) {
  session.set(sessionKeys.pin, pin);
  session.set(sessionKeys.role, role);
  session.set(sessionKeys.clientId, "test-client");
}

async function createWaitingRoom() {
  const { pin } = await createRoom({ color: CORES_VALIDAS[0] });
  return pin;
}

test("cria sala com série padrão 1", async () => {
  const pin = await createWaitingRoom();
  const room = await getRoom(pin);

  assert.match(pin, /^\d{6}$/);
  assert.equal(room.series, 1);
  assert.equal(room.phase, "waiting");
  assert.equal(room.players.owner.color, "blue");
  assert.equal(room.players.guest, null);
  assert.equal(session.get(sessionKeys.pin), pin);
  assert.equal(session.get(sessionKeys.role), "owner");
});

test("rejeita PIN com letras ou tamanho incorreto", async () => {
  for (const pin of ["12a456", "12345", "1234567"]) {
    await assert.rejects(joinRoom({ pin, color: "red" }), { code: "PIN_INVALIDO" });
  }
});

test("rejeita cor repetida ao entrar na sala", async () => {
  const pin = await createWaitingRoom();

  await assert.rejects(joinRoom({ pin, color: "blue" }), { code: "COR_JA_ESCOLHIDA" });
  assert.deepEqual(await joinRoom({ pin, color: "red" }), { pin, role: "guest" });
});

test("rejeita início sem dois jogadores", async () => {
  const pin = await createWaitingRoom();

  await assert.rejects(startMatch({ pin }), { code: "SALA_NAO_PRONTA" });
  assert.equal((await getRoom(pin)).phase, "waiting");
});

test("somente o dono inicia e sala pronta muda para playing", async () => {
  const pin = await createWaitingRoom();
  await joinRoom({ pin, color: "red" });

  await assert.rejects(startMatch({ pin }), { code: "SEM_PERMISSAO" });
  setSession(pin, "owner");
  await startMatch({ pin });
  assert.equal((await getRoom(pin)).phase, "playing");
});

test("watchRoom notifica ao assinar e a cada mudança", async () => {
  const pin = await createWaitingRoom();
  const updates = [];
  const cancel = watchRoom(pin, room => updates.push(room));

  await setPlayerColor({ pin, role: "owner", color: "green" });
  assert.equal(updates.length, 2);
  assert.equal(updates[0].players.owner.color, "blue");
  assert.equal(updates[1].players.owner.color, "green");

  cancel();
  await setPlayerColor({ pin, role: "owner", color: "yellow" });
  assert.equal(updates.length, 2);
});

test("convidado sai e dono encerra a sala", async () => {
  const pin = await createWaitingRoom();
  await joinRoom({ pin, color: "red" });
  await leaveRoom({ pin, role: "guest" });

  assert.equal((await getRoom(pin)).players.guest, null);
  assert.equal((await getRoom(pin)).phase, "waiting");

  setSession(pin, "owner");
  await leaveRoom({ pin, role: "owner" });
  await assert.rejects(getRoom(pin), { code: "PIN_NAO_ENCONTRADO" });
});