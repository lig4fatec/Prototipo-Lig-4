import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, joinRoom, getRoom, setPlayerReady, startMatch, setPlayerColor, setRoomBoard } from '../js/services/rooms.js';

function storage() {
  const map = new Map();
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key) };
}
test('prontidão obrigatória, cor indisponível e tabuleiro possuído', async () => {
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
  const { pin } = await createRoom({ mode: 'caos' });
  const ownerSession = storage();
  for (const key of ['lig4.room.pin', 'lig4.room.role', 'lig4.room.clientId']) ownerSession.setItem(key, globalThis.sessionStorage.getItem(key));
  const joined = await joinRoom({ pin });
  assert.equal(joined.role, 'guest');
  const guestSession = globalThis.sessionStorage;
  let room = await getRoom(pin);
  assert.notEqual(room.players.owner.color, room.players.guest.color);
  await assert.rejects(startMatch({ pin }), error => error.code === 'SEM_PERMISSAO');
  await setPlayerReady({ pin, role: 'guest', ready: true });
  globalThis.sessionStorage = ownerSession;
  await assert.rejects(startMatch({ pin }), error => error.code === 'SALA_NAO_PRONTA');
  await setRoomBoard({ pin, role: 'owner', boardId: 'board-classico' });
  await setPlayerReady({ pin, role: 'owner', ready: true });
  globalThis.sessionStorage = guestSession;
  await setPlayerColor({ pin, role: 'guest', color: 'green' });
  room = await getRoom(pin);
  assert.equal(room.ready.owner, false);
  assert.equal(room.ready.guest, false);
  await setPlayerReady({ pin, role: 'guest', ready: true });
  globalThis.sessionStorage = ownerSession;
  await setPlayerReady({ pin, role: 'owner', ready: true });
  await startMatch({ pin });
  assert.equal((await getRoom(pin)).phase, 'playing');
});
