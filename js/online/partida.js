import {
  getRoom,
  leaveRoom,
  publishResult,
  publishState,
  requestRematch,
  watchRoom,
} from "../services/rooms.js";
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
let room = null;
let role = null;
let cancelRoomWatch = null;
let onRoomLost = () => {};
let onLeave = () => {};
let moveInProgress = false;
let leaveInProgress = false;

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

function renderRoom(nextRoom) {
  if (!nextRoom) {
    room = null;
    stopRoomWatch();
    onRoomLost();
    return;
  }

  room = nextRoom;
  pinElement.textContent = room.pin;
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
    const initialRoom = await getRoom(session.pin);
    room = initialRoom;
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

window.addEventListener("pagehide", fecharPartida);

createColumnButtons();