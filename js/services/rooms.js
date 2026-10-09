// MOCK DESCARTÁVEL. Persistência em localStorage apenas para desenvolvimento. Será removida quando o miolo for substituído pelo Firebase, mantendo as assinaturas.

export const CORES_VALIDAS = Object.freeze([
  "blue",
  "red",
  "purple",
  "green",
  "orange",
  "yellow",
  "brown",
]);

const ROOMS_STORAGE_KEY = "lig4-mock-rooms";
const roomWatchers = new Map();
const SESSION_KEYS = Object.freeze({
  pin: "lig4.room.pin",
  role: "lig4.room.role",
  clientId: "lig4.room.clientId",
});

function roomError(code) {
  return { code };
}

function getRoomStorage() {
  try {
    if (globalThis.localStorage) return globalThis.localStorage;
    // Node tests may lack localStorage; browser pages always use localStorage.
    if (typeof window === "undefined" && globalThis.sessionStorage) {
      return globalThis.sessionStorage;
    }
  } catch {
    throw roomError("SEM_PERMISSAO");
  }
  throw roomError("SEM_PERMISSAO");
}

function readRooms() {
  const storage = getRoomStorage();
  let serialized;
  try {
    serialized = storage.getItem(ROOMS_STORAGE_KEY);
  } catch {
    throw roomError("SEM_PERMISSAO");
  }

  if (!serialized) return new Map();

  try {
    const entries = JSON.parse(serialized);
    if (!Array.isArray(entries)) return new Map();
    return new Map(entries.filter(entry => (
      Array.isArray(entry)
      && typeof entry[0] === "string"
      && entry[1]
      && typeof entry[1] === "object"
    )));
  } catch {
    return new Map();
  }
}

function writeRooms(rooms) {
  try {
    getRoomStorage().setItem(ROOMS_STORAGE_KEY, JSON.stringify([...rooms.entries()]));
  } catch {
    throw roomError("SEM_PERMISSAO");
  }
}

function emptyGameState() {
  return {
    board: Array.from({ length: 6 }, () => Array(7).fill(0)),
    turn: 1,
    moveCount: 0,
  };
}

function isValidBoard(board) {
  return Array.isArray(board)
    && board.length === 6
    && board.every(row => (
      Array.isArray(row)
      && row.length === 7
      && row.every(cell => cell === 0 || cell === 1 || cell === 2)
    ));
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
    game: room.game
      ? {
        board: room.game.board.map(row => row.slice()),
        turn: room.game.turn,
        moveCount: room.game.moveCount,
      }
      : null,
    result: room.result ? { ...room.result } : null,
    rematchRequested: [...(room.rematchRequested || [])],
  };
}

function notifyRoom(pin) {
  const watchers = roomWatchers.get(pin);
  if (!watchers) return;

  const room = readRooms().get(pin);
  const snapshot = room ? getRoomSnapshot(room) : null;
  for (const callback of watchers) {
    callback(snapshot);
  }
}

function generatePin(rooms) {
  let pin;
  do {
    pin = String(Math.floor(100000 + Math.random() * 900000));
  } while (rooms.has(pin));
  return pin;
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("storage", event => {
    if (event.key !== null && event.key !== ROOMS_STORAGE_KEY) return;
    for (const pin of [...roomWatchers.keys()]) notifyRoom(pin);
  });
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

  const rooms = readRooms();
  const pin = generatePin(rooms);
  saveSession(pin, "owner");
  rooms.set(pin, {
    pin,
    series,
    players: { owner: { color }, guest: null },
    phase: "waiting",
    game: null,
    result: null,
    rematchRequested: [],
  });
  writeRooms(rooms);
  notifyRoom(pin);
  return { pin };
}

export async function joinRoom(options = {}) {
  await yieldMock();
  const pin = options?.pin;
  const color = options?.color;
  validatePin(pin);
  validateColor(color);

  const rooms = readRooms();
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
  writeRooms(rooms);
  notifyRoom(pin);
  return { pin, role: "guest" };
}

export async function getRoom(pin) {
  await yieldMock();
  validatePin(pin);
  const room = readRooms().get(pin);
  if (!room) throw roomError("PIN_NAO_ENCONTRADO");
  return getRoomSnapshot(room);
}

export function watchRoom(pin, callback) {
  validatePin(pin);
  const room = readRooms().get(pin);
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

  const rooms = readRooms();
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
  writeRooms(rooms);
  notifyRoom(pin);
}

export async function startMatch(options = {}) {
  await yieldMock();
  const pin = options?.pin;
  validatePin(pin);
  assertSession(pin, "owner");

  const rooms = readRooms();
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
  room.game = emptyGameState();
  room.result = null;
  room.rematchRequested = [];
  writeRooms(rooms);
  notifyRoom(pin);
}

export async function publishState({ pin, role, board, turn, moveCount } = {}) {
  await yieldMock();
  validatePin(pin);
  const rooms = readRooms();
  const room = rooms.get(pin);
  if (!room) throw roomError("PIN_NAO_ENCONTRADO");
  if (room.phase !== "playing") throw roomError("FASE_INVALIDA");
  if (!isValidBoard(board)) throw roomError("TABULEIRO_INVALIDO");

  assertSession(pin, role);
  const currentRole = room.game?.turn === 1 ? "owner" : room.game?.turn === 2 ? "guest" : null;
  if (role !== currentRole || (turn !== 1 && turn !== 2)) {
    throw roomError("SEM_PERMISSAO");
  }

  // O turno salvo autoriza a jogada; o turno recebido é o próximo a agir.
  // Vitória e legalidade da queda pertencem a js/game/, não a este serviço.
  room.game = {
    board: board.map(row => row.slice()),
    turn,
    moveCount,
  };
  writeRooms(rooms);
  notifyRoom(pin);
  return { pin, turn, moveCount };
}

export async function publishResult({ pin, role, result } = {}) {
  await yieldMock();
  validatePin(pin);
  const rooms = readRooms();
  const room = rooms.get(pin);
  if (!room) throw roomError("PIN_NAO_ENCONTRADO");

  const validWin = result?.draw === false && (result.winner === 1 || result.winner === 2);
  const validDraw = result?.draw === true && result.winner === null;
  if (!validWin && !validDraw) throw roomError("RESULTADO_INVALIDO");

  assertSession(pin, role);
  if (room.result) {
    if (room.result.winner !== result.winner || room.result.draw !== result.draw) {
      throw roomError("RESULTADO_INVALIDO");
    }
    return { pin, phase: room.phase };
  }
  if (room.phase !== "playing") throw roomError("FASE_INVALIDA");

  room.phase = "finished";
  room.result = { winner: result.winner, draw: result.draw };
  room.rematchRequested = [];
  writeRooms(rooms);
  notifyRoom(pin);
  return { pin, phase: room.phase };
}

export async function requestRematch({ pin, role } = {}) {
  await yieldMock();
  validatePin(pin);
  const rooms = readRooms();
  const room = rooms.get(pin);
  if (!room) throw roomError("PIN_NAO_ENCONTRADO");
  if (room.phase !== "finished") throw roomError("FASE_INVALIDA");
  assertSession(pin, role);

  const requests = new Set(room.rematchRequested || []);
  requests.add(role);
  room.rematchRequested = [...requests];

  if (requests.has("owner") && requests.has("guest")) {
    room.phase = "playing";
    room.game = emptyGameState();
    room.result = null;
    room.rematchRequested = [];
  }

  writeRooms(rooms);
  notifyRoom(pin);
  return { pin, phase: room.phase };
}

export async function leaveRoom(options = {}) {
  await yieldMock();
  const pin = options?.pin;
  const role = options?.role;
  validatePin(pin);
  assertSession(pin, role);

  const rooms = readRooms();
  const room = rooms.get(pin);
  if (!room) throw roomError("PIN_NAO_ENCONTRADO");

  if (role === "owner") {
    rooms.delete(pin);
  } else {
    if (!room.players.guest) throw roomError("SEM_PERMISSAO");
    room.players.guest = null;
    room.phase = "waiting";
  }

  writeRooms(rooms);
  clearSession(pin, role);
  notifyRoom(pin);
}