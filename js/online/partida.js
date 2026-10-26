import { getGameMode } from "../game/modes.js";
import {
  getRoom,
  leaveRoom,
  publishResult,
  publishState,
  requestRematch,
  sendEmote,
  watchRoom,
} from "../services/rooms.js";
import {
  findItem,
  getEquippedItems,
  getInventory,
} from "../services/store.js";
import { applyBoardTheme, createAvatarImage, createEmoteImage } from "../player-style.js";
import { criarTabuleiro } from "../game/board.js";
import { jogar, proximoTurno } from "../game/rules.js";
import { planejarQueda } from "../game/drop.js";
import {
  clearRoomSession,
  COLOR_NAMES,
  getRoomErrorMessage,
  readRoomSession,
} from "../room-ui.js";

const ROWS = 6;
const COLUMNS = 7;
const FALL_STEP_MS = 80;
const EMOTE_COOLDOWN_MS = 1500;
const EMOTE_VISIBLE_MS = 2600;
const boardWrap = document.querySelector(".online-game-board-wrap");
const boardElement = document.querySelector("[data-game-board]");
const columnsElement = document.querySelector("[data-game-columns]");
const pinElement = document.querySelector("[data-game-pin]");
const turnElement = document.querySelector("[data-game-turn]");
const statusElement = document.querySelector("[data-game-status]");
const resultPanel = document.querySelector("[data-game-result-panel]");
const resultElement = document.querySelector("[data-game-result]");
const rematchStatus = document.querySelector("[data-game-rematch-status]");
const rematchButton = document.querySelector("[data-game-rematch]");
const leaveButton = document.querySelector("[data-game-leave]");
const emotesElement = document.querySelector("[data-game-emotes]");
const emoteToggle = document.querySelector("[data-game-emote-toggle]");
function closeEmoteMenu() {
  emotesElement.hidden = true;
  emoteToggle.setAttribute("aria-expanded", "false");
}
emoteToggle.addEventListener("click", () => {
  const shouldOpen = emotesElement.hidden;
  emotesElement.hidden = !shouldOpen;
  emoteToggle.setAttribute("aria-expanded", String(shouldOpen));
});
document.addEventListener("pointerdown", event => {
  if (!event.target.closest(".online-game-emote-menu")) closeEmoteMenu();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !emotesElement.hidden) {
    closeEmoteMenu();
    emoteToggle.focus();
  }
});
const emoteStatus = document.querySelector("[data-game-emote-status]");
const modeLabel = document.querySelector("[data-game-mode-name]");
const themePanel = document.querySelector("[data-game-theme-panel]");
const themeCurrent = document.querySelector("[data-game-theme-current]");
const themeStatus = document.querySelector("[data-game-theme-status]");
let room = null;
let role = null;
let cancelRoomWatch = null;
let onRoomLost = () => {};
let onLeave = () => {};
let moveInProgress = false;
let leaveInProgress = false;
let ownAvatarId = null;
let lastEmoteSeen = null;
let emoteCooldown = false;
const emoteTimers = new Map();

const gameErrorMessages = {
  COLUNA_INVALIDA: "Selecione uma coluna válida.",
  COLUNA_CHEIA: "Esta coluna está cheia.",
  NAO_EH_SEU_TURNO: "Aguarde a sua vez.",
  JOGADOR_INVALIDO: "Jogador inválido.",
  PARTIDA_ENCERRADA: "Esta partida já terminou.",
};

function playerNumberForRole(playerRole) {
  return playerRole === "owner" ? 1 : playerRole === "guest" ? 2 : null;
}

function stopRoomWatch() {
  if (cancelRoomWatch) cancelRoomWatch();
  cancelRoomWatch = null;
}

function createColumnButtons() {
  const buttons = Array.from({ length: COLUMNS }, (_, column) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(column + 1);
    button.setAttribute("aria-label", `Soltar peça na coluna ${column + 1}`);
    button.dataset.column = String(column);
    button.addEventListener("click", () => dropInColumn(column));
    return button;
  });
  columnsElement.replaceChildren(...buttons);
}

function renderBoard() {
  const board = room?.game?.board || criarTabuleiro();
  const ownerColor = room?.players.owner.color || "blue";
  const guestColor = room?.players.guest?.color || "red";
  const cells = [];

  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) {
      const cell = document.createElement("div");
      const player = board[row][column];
      cell.className = "online-game-cell";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute(
        "aria-label",
        player === 0
          ? `Linha ${row + 1}, coluna ${column + 1}, vazia`
          : `Linha ${row + 1}, coluna ${column + 1}, ${player === 1 ? "Jogador 1" : "Jogador 2"}`,
      );
      cell.dataset.row = String(row);
      cell.dataset.column = String(column);
      cell.dataset.player = String(player);
      // Futuras imagens de fichas serão escolhidas pelo modo e pelo papel.
      if (player !== 0) cell.dataset.discRole = player === 1 ? "owner" : "guest";
      cell.style.setProperty("--row", String(row));
      cell.style.setProperty("--col", String(column));
      if (player !== 0) cell.dataset.color = player === 1 ? ownerColor : guestColor;
      cells.push(cell);
    }
  }
  boardElement.replaceChildren(...cells);

  const playerNumber = playerNumberForRole(role);
  const mayMove = room?.phase === "playing"
    && playerNumber === room.game?.turn
    && !moveInProgress;
  columnsElement.querySelectorAll("button").forEach(button => {
    button.disabled = !mayMove;
  });
}

function renderAvatars() {
  for (const [playerNumber, roleName] of [[1, "owner"], [2, "guest"]]) {
    const card = document.querySelector(`[data-score-player="${playerNumber}"]`);
    if (!card) continue;
    const avatarId = roleName === role ? ownAvatarId : room?.players[roleName]?.avatar;
    const image = createAvatarImage(avatarId);
    const current = card.querySelector(".player-avatar");
    if (current?.dataset.avatar === image.dataset.avatar) continue;
    if (current) current.replaceWith(image);
    else card.prepend(image);
  }
}

function showEmote(lastEmote) {
  const emote = findItem(lastEmote.emoteId);
  const playerNumber = playerNumberForRole(lastEmote.role);
  const card = playerNumber && document.querySelector(`[data-score-player="${playerNumber}"]`);
  if (emote?.category !== "emote" || !card) return;

  card.querySelector(".emote-bubble")?.remove();
  clearTimeout(emoteTimers.get(playerNumber));
  const bubble = document.createElement("div");
  bubble.className = "emote-bubble";
  bubble.setAttribute("aria-hidden", "true");
  bubble.append(createEmoteImage(emote.id));
  card.append(bubble);
  emoteTimers.set(playerNumber, setTimeout(() => bubble.remove(), EMOTE_VISIBLE_MS));

  const sender = lastEmote.role === "owner" ? "Jogador 1" : "Jogador 2";
  emoteStatus.textContent = `${sender} enviou ${emote.name}.`;
}

function updateEmoteButtons() {
  const mayEmote = Boolean(room) && (room.phase === "playing" || room.phase === "finished");
  emotesElement.querySelectorAll("button").forEach(button => {
    button.disabled = !mayEmote || emoteCooldown;
  });
}

function renderEmoteBar(ownedEmotes) {
  // Todos os emotes adquiridos são utilizáveis; não existe emote equipado.
  const ordered = [...ownedEmotes];
  emotesElement.replaceChildren(...ordered.map(emote => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "online-game-emote";
    button.dataset.emote = emote.id;
    button.setAttribute("aria-label", `Enviar emote ${emote.name}`);
    button.title = emote.name;
    button.append(createEmoteImage(emote.id));
    button.addEventListener("click", () => sendOwnEmote(emote.id));
    return button;
  }));
  updateEmoteButtons();
}

async function sendOwnEmote(emoteId) {
  if (!room || emoteCooldown) return;
  emoteCooldown = true;
  updateEmoteButtons();
  try {
    // Só emotes do inventário do jogador atual podem ser enviados.
    const { byCategory } = await getInventory();
    if (!byCategory.emote.some(emote => emote.id === emoteId)) {
      statusElement.textContent = "Você não possui este emote.";
      return;
    }
    await sendEmote({ pin: room.pin, role, emoteId });
    closeEmoteMenu();
  } catch (error) {
    statusElement.textContent = getRoomErrorMessage(error.code);
  } finally {
    setTimeout(() => {
      emoteCooldown = false;
      updateEmoteButtons();
    }, EMOTE_COOLDOWN_MS);
  }
}

async function applyPersonalization() {
  try {
    const [equippedItems, inventory] = await Promise.all([getEquippedItems(), getInventory()]);
    ownAvatarId = equippedItems.avatar.id;

    renderEmoteBar(inventory.byCategory.emote);

  } catch {
    // A personalização é opcional: se falhar, a partida segue com o visual padrão.

  }
}

function renderRoom(nextRoom) {
  if (!nextRoom) {
    room = null;
    stopRoomWatch();
    onRoomLost();
    return;
  }

  room = nextRoom;
  const mode = getGameMode(room.mode);
  modeLabel.textContent = mode.name;
  applyBoardTheme(boardWrap, findItem(mode.boardId));
  boardWrap.dataset.gameMode = mode.id;
  pinElement.textContent = room.pin;
  renderAvatars();
  updateEmoteButtons();
  if (room.lastEmote && room.lastEmote.id !== lastEmoteSeen) {
    lastEmoteSeen = room.lastEmote.id;
    showEmote(room.lastEmote);
  }
  const turn = room.game?.turn;
  const rolePlayer = playerNumberForRole(role);
  if (room.phase === "playing") {
    const currentName = turn === 1 ? "Jogador 1 · Dono" : "Jogador 2 · Convidado";
    turnElement.textContent = turn === rolePlayer ? `Sua vez · ${currentName}` : `Vez de ${currentName}`;
  } else {
    turnElement.textContent = "Partida encerrada";
  }

  const winner = room.result?.winner;
  document.querySelector('[data-game-score="1"]').textContent = winner === 1 ? "1" : "0";
  document.querySelector('[data-game-score="2"]').textContent = winner === 2 ? "1" : "0";

  const finished = room.phase === "finished" && Boolean(room.result);
  resultPanel.hidden = !finished;
  if (finished) {
    resultElement.textContent = room.result.draw
      ? "Empate."
      : `${room.result.winner === 1 ? "Jogador 1 · Dono" : "Jogador 2 · Convidado"} venceu.`;
    const requested = room.rematchRequested || [];
    rematchButton.disabled = requested.includes(role);
    rematchStatus.textContent = requested.length
      ? "Aguardando o outro jogador."
      : "";
  } else {
    rematchStatus.textContent = "";
    rematchButton.disabled = true;
  }

  renderBoard();
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function animateDrop(column, steps, player) {
  const color = player === 1 ? room.players.owner.color : room.players.guest.color;
  for (const row of steps) {
    const cell = boardElement.querySelector(`[data-row="${row}"][data-column="${column}"]`);
    if (!cell) continue;
    cell.dataset.color = color;
    cell.dataset.falling = "true";
    await delay(FALL_STEP_MS);
    delete cell.dataset.falling;
    delete cell.dataset.color;
  }
}

async function dropInColumn(column) {
  if (!room || room.phase !== "playing" || moveInProgress) return;

  const player = playerNumberForRole(role);
  const game = room.game;
  const result = jogar(game.board, column, player, game.turn, false);
  if (!result.ok) {
    statusElement.textContent = gameErrorMessages[result.code] || "Jogada inválida.";
    return;
  }

  moveInProgress = true;
  statusElement.textContent = "";
  renderBoard();
  const fall = planejarQueda(game.board, column, player);

  try {
    await animateDrop(column, fall.passos, player);
    const moveCount = game.moveCount + 1;
    await publishState({
      pin: room.pin,
      role,
      board: result.board,
      turn: proximoTurno(player),
      moveCount,
    });

    if (result.vitoria || result.empate) {
      await publishResult({
        pin: room.pin,
        role,
        result: {
          winner: result.vitoria ? player : null,
          draw: result.empate,
        },
      });
    }
  } catch (error) {
    statusElement.textContent = getRoomErrorMessage(error.code);
  } finally {
    moveInProgress = false;
    if (room) renderRoom(room);
  }
}

export async function abrirPartida({ onRoomLost, onLeave } = {}) {
  stopRoomWatch();
  onRoomLost ||= () => {};
  onLeave ||= () => {};
  const session = readRoomSession();
  role = session.role;
  if (!session.pin || !["owner", "guest"].includes(role)) {
    onRoomLost();
    return;
  }

  try {
    await applyPersonalization();
    const initialRoom = await getRoom(session.pin);
    room = initialRoom;
    // Emotes anteriores à entrada na partida não devem reaparecer.
    lastEmoteSeen = initialRoom.lastEmote?.id ?? null;
    emoteStatus.textContent = "";
    renderRoom(initialRoom);
    cancelRoomWatch = watchRoom(session.pin, renderRoom);
  } catch (error) {
    if (error.code === "PIN_NAO_ENCONTRADO") onRoomLost();
    else statusElement.textContent = getRoomErrorMessage(error.code);
  }
}

export function fecharPartida() {
  stopRoomWatch();
  moveInProgress = false;
}

rematchButton.addEventListener("click", async () => {
  if (!room || room.phase !== "finished") return;
  rematchButton.disabled = true;
  rematchStatus.textContent = "";
  try {
    const result = await requestRematch({ pin: room.pin, role });
    if (result.phase === "finished") rematchStatus.textContent = "Aguardando o outro jogador.";
  } catch (error) {
    rematchStatus.textContent = getRoomErrorMessage(error.code);
    rematchButton.disabled = false;
  }
});

leaveButton.addEventListener("click", async () => {
  if (leaveInProgress) return;
  leaveInProgress = true;
  leaveButton.disabled = true;
  stopRoomWatch();
  const session = readRoomSession();
  try {
    if (session.pin && session.role) await leaveRoom({ pin: session.pin, role: session.role });
  } catch (error) {
    statusElement.textContent = getRoomErrorMessage(error.code);
  } finally {
    clearRoomSession();
    onLeave();
  }
});

// Atualiza avatar e emotes locais; o tabuleiro é sempre definido pelo modo da sala.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && room) applyPersonalization();
});
window.addEventListener("pageshow", () => { if (room) applyPersonalization(); });
window.addEventListener("pagehide", fecharPartida);

createColumnButtons();