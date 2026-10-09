// Mock em memória para salas; Firebase substituirá o miolo mantendo estas assinaturas.

export const CORES_VALIDAS = Object.freeze([
  "blue",
  "red",
  "purple",
  "green",
  "orange",
  "yellow",
  "brown",
]);

const rooms = new Map();
const roomWatchers = new Map();
const SESSION_KEYS = Object.freeze({
  pin: "lig4.room.pin",
  role: "lig4.room.role",
  clientId: "lig4.room.clientId",
});

function roomError(code) {
  return { code };
}

function validatePin(pin) {
  if (typeof pin !== "string" || !/^\d{6}$/.test(pin)) {
    throw roomError("PIN_INVALIDO");
  }
}

function validateColor(color) {
  if (!CORES_VALIDAS.includes(color)) {
    throw roomError("COR_INVALIDA");
  }
}

function getRoomSnapshot(room) {
  return {
    pin: room.pin,
    series: room.series,
    players: {
      owner: { ...room.players.owner },
      guest: room.players.guest ? { ...room.players.guest } : null,
    },
    phase: room.phase,
  };
}

function notifyRoom(pin) {
  const watchers = roomWatchers.get(pin);
  if (!watchers) return;

  const room = rooms.get(pin);
  const snapshot = room ? getRoomSnapshot(room) : null;
  for (const callback of watchers) {
    callback(snapshot);
  }
}

function generatePin() {
  let pin;
  do {
    pin = String(Math.floor(100000 + Math.random() * 900000));
  } while (rooms.has(pin));
  return pin;
}

function getSessionStorage() {
  try {
    return globalThis.sessionStorage;
  } catch {
    throw roomError("SEM_PERMISSAO");
  }
}

function saveSession(pin, role) {
  try {
    const storage = getSessionStorage();
    const clientId = storage.getItem(SESSION_KEYS.clientId)
      || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    storage.setItem(SESSION_KEYS.pin, pin);
    storage.setItem(SESSION_KEYS.role, role);
    storage.setItem(SESSION_KEYS.clientId, clientId);
  } catch {
    throw roomError("SEM_PERMISSAO");
  }
}

function clearSession(pin, role) {
  try {
    const storage = getSessionStorage();
    if (
      storage.getItem(SESSION_KEYS.pin) !== pin
      || storage.getItem(SESSION_KEYS.role) !== role
    ) {
      throw roomError("SEM_PERMISSAO");
    }
    storage.removeItem(SESSION_KEYS.pin);
    storage.removeItem(SESSION_KEYS.role);
    storage.removeItem(SESSION_KEYS.clientId);
  } catch (error) {
    if (error?.code === "SEM_PERMISSAO") throw error;
    throw roomError("SEM_PERMISSAO");
  }
}

function assertSession(pin, role) {
  if (role !== "owner" && role !== "guest") {
    throw roomError("SEM_PERMISSAO");
  }

  try {
    const storage = getSessionStorage();
    if (
      storage.getItem(SESSION_KEYS.pin) !== pin
      || storage.getItem(SESSION_KEYS.role) !== role
    ) {
      throw roomError("SEM_PERMISSAO");
    }
  } catch (error) {
    if (error?.code === "SEM_PERMISSAO") throw error;
    throw roomError("SEM_PERMISSAO");
  }
}

async function yieldMock() {
  await Promise.resolve();
}

export async function createRoom(options = {}) {
  await yieldMock();
  const series = options?.series === undefined ? 1 : options.series;
  const color = options?.color;

  if (![1, 3, 5].includes(series)) throw roomError("SERIE_INVALIDA");
  validateColor(color);

  const pin = generatePin();
  saveSession(pin, "owner");
  rooms.set(pin, {
    pin,
    series,
    players: { owner: { color }, guest: null },
    phase: "waiting",
  });
  notifyRoom(pin);
  return { pin };
}

export async function joinRoom(options = {}) {
  await yieldMock();
  const pin = options?.pin;
  const color = options?.color;
  validatePin(pin);
  validateColor(color);

  const room = rooms.get(pin);
  if (!room) throw roomError("PIN_NAO_ENCONTRADO");
  if (room.phase !== "waiting" || room.players.guest) {
    throw roomError("SALA_CHEIA");
  }
  if (room.players.owner.color === color) {
    throw roomError("COR_JA_ESCOLHIDA");
  }

  saveSession(pin, "guest");
  room.players.guest = { color };
  notifyRoom(pin);
  return { pin, role: "guest" };
}

export async function getRoom(pin) {
  await yieldMock();
  validatePin(pin);
  const room = rooms.get(pin);
  if (!room) throw roomError("PIN_NAO_ENCONTRADO");
  return getRoomSnapshot(room);
}

export function watchRoom(pin, callback) {
  validatePin(pin);
  const room = rooms.get(pin);
  if (!room) throw roomError("PIN_NAO_ENCONTRADO");

  let watchers = roomWatchers.get(pin);
  if (!watchers) {
    watchers = new Set();
    roomWatchers.set(pin, watchers);
  }
  watchers.add(callback);
  callback(getRoomSnapshot(room));

  return () => {
    watchers.delete(callback);
    if (watchers.size === 0) roomWatchers.delete(pin);
  };
}

export async function setPlayerColor(options = {}) {
  await yieldMock();
  const pin = options?.pin;
  const role = options?.role;
  const color = options?.color;
  validatePin(pin);
  validateColor(color);
  assertSession(pin, role);

  const room = rooms.get(pin);
  if (!room) throw roomError("PIN_NAO_ENCONTRADO");
  if (room.phase !== "waiting" || !room.players[role]) {
    throw roomError("SEM_PERMISSAO");
  }

  const otherRole = role === "owner" ? "guest" : "owner";
  if (room.players[otherRole]?.color === color) {
    throw roomError("COR_JA_ESCOLHIDA");
  }

  room.players[role].color = color;
  notifyRoom(pin);
}

export async function startMatch(options = {}) {
  await yieldMock();
  const pin = options?.pin;
  validatePin(pin);
  assertSession(pin, "owner");

  const room = rooms.get(pin);
  if (!room) throw roomError("PIN_NAO_ENCONTRADO");
  if (
    room.phase !== "waiting"
    || !room.players.owner
    || !room.players.guest
    || room.players.owner.color === room.players.guest.color
  ) {
    throw roomError("SALA_NAO_PRONTA");
  }

  room.phase = "playing";
  notifyRoom(pin);
}

export async function leaveRoom(options = {}) {
  await yieldMock();
  const pin = options?.pin;
  const role = options?.role;
  validatePin(pin);
  assertSession(pin, role);

  const room = rooms.get(pin);
  if (!room) throw roomError("PIN_NAO_ENCONTRADO");

  if (role === "owner") {
    rooms.delete(pin);
  } else {
    if (!room.players.guest) throw roomError("SEM_PERMISSAO");
    room.players.guest = null;
    room.phase = "waiting";
  }

  clearSession(pin, role);
  notifyRoom(pin);
}