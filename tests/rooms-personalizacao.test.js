import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createRoom, getRoom, joinRoom, sendEmote, startMatch } from "../js/services/rooms.js";

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
  sessionValues.set("lig4.room.clientId", "personalizacao-test-client");
}

beforeEach(() => {
  localValues.clear();
  sessionValues.clear();
});

test("a sala guarda o avatar equipado de cada jogador e ignora valores inválidos", async () => {
  const { pin } = await createRoom({ series: 1, color: "blue", avatar: "avatar-samurai" });
  await joinRoom({ pin, color: "red", avatar: "<script>" });

  const room = await getRoom(pin);
  assert.equal(room.players.owner.avatar, "avatar-samurai");
  assert.equal("avatar" in room.players.guest, false);
});

test("sala sem avatar mantém o formato anterior dos jogadores", async () => {
  const { pin } = await createRoom({ series: 1, color: "blue" });
  assert.deepEqual((await getRoom(pin)).players, { owner: { color: "blue" }, guest: null });
});

test("sendEmote publica o emote do jogador para a sala", async () => {
  const { pin } = await createRoom({ series: 1, color: "blue" });
  await joinRoom({ pin, color: "red" });
  setRole(pin, "owner");
  await startMatch({ pin });

  assert.equal("lastEmote" in await getRoom(pin), false);

  setRole(pin, "guest");
  const sent = await sendEmote({ pin, role: "guest", emoteId: "emote-aplauso" });
  const { lastEmote } = await getRoom(pin);
  assert.equal(lastEmote.id, sent.id);
  assert.equal(lastEmote.role, "guest");
  assert.equal(lastEmote.emoteId, "emote-aplauso");
});

test("sendEmote valida emote, sessão e fase da sala", async () => {
  const { pin } = await createRoom({ series: 1, color: "blue" });
  await joinRoom({ pin, color: "red" });
  setRole(pin, "owner");

  await assert.rejects(sendEmote({ pin, role: "owner", emoteId: "emote-aplauso" }), { code: "FASE_INVALIDA" });
  await startMatch({ pin });
  await assert.rejects(sendEmote({ pin, role: "owner", emoteId: "x; drop" }), { code: "EMOTE_INVALIDO" });
  await assert.rejects(sendEmote({ pin, role: "guest", emoteId: "emote-cool" }), { code: "SEM_PERMISSAO" });
});
