import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  startMatch,
} from "../js/services/rooms.js";

const session = new Map();
globalThis.sessionStorage = {
  getItem: key => session.get(key) ?? null,
  setItem: (key, value) => session.set(key, value),
  removeItem: key => session.delete(key),
};

function setRoomSession(pin, role) {
  session.set("lig4.room.pin", pin);
  session.set("lig4.room.role", role);
  session.set("lig4.room.clientId", "flow-test-client");
}

async function closeAsOwner(pin) {
  setRoomSession(pin, "owner");
  await leaveRoom({ pin, role: "owner" });
}

test("cria sala e permite entrar usando o PIN retornado", async () => {
  const { pin } = await createRoom({ series: 3, color: "blue" });
  assert.match(pin, /^\d{6}$/);
  assert.deepEqual(await joinRoom({ pin, color: "red" }), { pin, role: "guest" });
  const room = await getRoom(pin);
  assert.equal(room.players.guest.color, "red");
  await leaveRoom({ pin, role: "guest" });
  await closeAsOwner(pin);
});

test("cor igual à do dono falha ao entrar", async () => {
  const { pin } = await createRoom({ color: "blue" });
  await assert.rejects(joinRoom({ pin, color: "blue" }), { code: "COR_JA_ESCOLHIDA" });
  await closeAsOwner(pin);
});

test("startMatch exige convidado e depois inicia com cores diferentes", async () => {
  const { pin } = await createRoom({ color: "blue" });
  await assert.rejects(startMatch({ pin }), { code: "SALA_NAO_PRONTA" });

  await joinRoom({ pin, color: "red" });
  setRoomSession(pin, "owner");
  await startMatch({ pin });
  assert.equal((await getRoom(pin)).phase, "playing");
  await closeAsOwner(pin);
});

test("sair como convidado remove só o convidado", async () => {
  const { pin } = await createRoom({ color: "blue" });
  await joinRoom({ pin, color: "red" });
  await leaveRoom({ pin, role: "guest" });

  const room = await getRoom(pin);
  assert.deepEqual(room.players.owner, { color: "blue" });
  assert.equal(room.players.guest, null);
  assert.equal(room.phase, "waiting");
  await closeAsOwner(pin);
});