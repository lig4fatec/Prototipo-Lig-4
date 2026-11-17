import { getGameMode } from "../game/modes.js";
import { getRoom, leaveRoom, setPlayerColor, setRoomBoard, setPlayerReady, startMatch, watchRoom } from "../services/rooms.js";
import { findItem, getInventory, getItemImageUrl } from "../services/store.js";
import {
  clearRoomSession,
  COLOR_NAMES,
  getRoomErrorMessage,
  readRoomSession,
  renderColorPicker,
} from "../room-ui.js";
import { createAvatarImage } from "../player-style.js";

const pinElement = document.querySelector("[data-lobby-pin]");
const status = document.querySelector("[data-lobby-status]");
const colorError = document.querySelector('[data-lobby-error="color"]');
const startButton = document.querySelector("[data-lobby-start]");
const leaveButton = document.querySelector("[data-lobby-leave]");
const readyButton = document.querySelector("[data-lobby-ready]");
const readyStatus = document.querySelector("[data-lobby-ready-status]");
const boardChoices = document.querySelector("[data-lobby-board-choices]");
const boardError = document.querySelector('[data-lobby-error="board"]');
let room = null;
let cancelRoomWatch = null;
let onRoomLost = () => {};
let leaving = false;

function stopWatching() {
  if (cancelRoomWatch) cancelRoomWatch();
  cancelRoomWatch = null;
}

function setPlayerAvatar(roleName, player) {
  const card = document.querySelector(`[data-player-card="${roleName}"]`);
  const avatarId = player ? player.avatar || "avatar-padrao" : null;
  const current = card.querySelector(".player-avatar");
  if (!avatarId) {
    current?.remove();
    return;
  }
  if (current?.dataset.avatar === avatarId) return;
  const image = createAvatarImage(avatarId, "player-avatar lobby-player__avatar");
  if (current) current.replaceWith(image);
  else card.prepend(image);
}

function setPlayer(roleName, player) {
  const roleElement = document.querySelector(`[data-player-role="${roleName}"]`);
  const colorElement = document.querySelector(`[data-player-color="${roleName}"]`);
  const swatch = document.querySelector(`[data-player-swatch="${roleName}"]`);
  const preview = document.querySelector(`[data-player-swatch-preview="${roleName}"]`);
  setPlayerAvatar(roleName, player);

  if (!player) {
    roleElement.textContent = "Aguardando jogador";
    colorElement.textContent = "—";
    swatch.dataset.color = "empty";
    preview.dataset.color = "empty";
    return;
  }

  roleElement.textContent = roleName === "owner" ? "Dono" : "Convidado";
  colorElement.textContent = COLOR_NAMES[player.color] || "—";
  swatch.dataset.color = player.color;
  preview.dataset.color = player.color;
}

async function renderBoardChoices() {
  const { role } = readRoomSession();
  const inventory = await getInventory();
  const boards = inventory.byCategory.board || [];
  const available = boards.filter(item => item.owned);
  const selected = room?.boardId || "board-classico";
  const visibleItems = role === "owner"
    ? available
    : [findItem(selected)].filter(Boolean);

  const cards = visibleItems.map(item => {
    const button = document.createElement("button");
    const isSelected = item.id === selected;
    button.type = "button";
    button.className = "lobby-board-choice";
    button.dataset.boardId = item.id;
    button.setAttribute("aria-pressed", String(isSelected));
    button.disabled = role !== "owner" || room?.phase !== "waiting" || isSelected;
    button.title = role === "owner"
      ? `Selecionar tabuleiro ${item.name}`
      : `Tabuleiro escolhido pelo criador: ${item.name}`;

    const image = document.createElement("img");
    image.src = getItemImageUrl(item);
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";

    const name = document.createElement("span");
    name.textContent = item.name;
    button.append(image, name);
    return button;
  });

  boardChoices.replaceChildren(...cards);
  boardChoices.dataset.role = role;
  boardChoices.setAttribute("aria-readonly", String(role !== "owner"));
  boardChoices.title = role === "owner"
    ? "Escolha o tabuleiro que os dois jogadores verão."
    : "Somente o criador da sala pode escolher o tabuleiro.";
}

function updateLobby(nextRoom) {
  if (!nextRoom) {
    room = null;
    stopWatching();
    onRoomLost({ notify: true });
    return;
  }

  room = nextRoom;
  void renderBoardChoices().catch(() => { boardError.textContent = "Não foi possível carregar seus tabuleiros."; });
  pinElement.textContent = room.pin;
  document.querySelector("[data-lobby-mode]").textContent = getGameMode(room.mode).name;
  setPlayer("owner", room.players.owner);
  setPlayer("guest", room.players.guest);

  const { role } = readRoomSession();
  const ownPlayer = room.players[role];
  const selectedColor = ownPlayer?.color || (role === "guest" ? "red" : "blue");
  renderColorPicker(
    document.querySelector("[data-lobby-colors]"),
    "lobby-color",
    selectedColor,
    async color => {
      colorError.textContent = "";
      try {
        await setPlayerColor({ pin: room.pin, role, color });
      } catch (error) {
        colorError.textContent = getRoomErrorMessage(error.code);
      }
    },
  );

  document.querySelectorAll("[data-lobby-colors] input").forEach(input => {
    input.disabled = room.phase !== "waiting";
  });
  const otherPlayer = room.players[role === "owner" ? "guest" : "owner"];
  document.querySelectorAll("[data-lobby-colors] input").forEach(input => {
    const unavailable = Boolean(otherPlayer && input.value === otherPlayer.color);
    input.disabled = room.phase !== "waiting" || unavailable;
    if (unavailable) input.setAttribute("aria-label", `${COLOR_NAMES[input.value]} (já escolhida)`);
    else input.setAttribute("aria-label", COLOR_NAMES[input.value]);
  });
  const colorsDiffer = room.players.guest
    && room.players.owner.color !== room.players.guest.color;
  const ready = room.ready || { owner: false, guest: false };
  const bothReady = Boolean(ready.owner && ready.guest);
  readyStatus.textContent = !room.players.guest
    ? "Aguardando o convidado entrar."
    : `Prontidão — Criador: ${ready.owner ? "pronto" : "aguardando"} · Convidado: ${ready.guest ? "pronto" : "aguardando"}.`;
  readyButton.disabled = !room.players.guest || room.phase !== "waiting";
  readyButton.textContent = ready[role] ? "Cancelar prontidão" : "Estou pronto";
  startButton.disabled = role !== "owner"
    || !room.players.guest
    || !colorsDiffer
    || !bothReady
    || room.phase !== "waiting";
}

export async function abrirLobby({ onLost }) {
  stopWatching();
  onRoomLost = onLost;
  const { pin, role } = readRoomSession();
  if (!pin || !["owner", "guest"].includes(role)) {
    onRoomLost({ notify: Boolean(pin || role) });
    return;
  }

  try {
    const initialRoom = await getRoom(pin);
    updateLobby(initialRoom);
    cancelRoomWatch = watchRoom(pin, updateLobby);
  } catch (error) {
    if (error.code === "PIN_NAO_ENCONTRADO") {
      onRoomLost({ notify: true });
      return;
    }
    status.textContent = getRoomErrorMessage(error.code);
    startButton.disabled = true;
  }
}

export function fecharLobby() {
  stopWatching();
}

boardChoices.addEventListener("click", async event => {
  const choice = event.target.closest("[data-board-id]");
  if (!choice || !room || choice.disabled) return;
  boardError.textContent = "";
  const previousBoardId = room.boardId || "board-classico";
  boardChoices.querySelectorAll("[data-board-id]").forEach(button => {
    button.disabled = true;
  });
  try {
    const { pin, role } = readRoomSession();
    await setRoomBoard({ pin, role, boardId: choice.dataset.boardId });
  } catch (error) {
    boardError.textContent = getRoomErrorMessage(error.code);
    // Restaura a seleção visual se a alteração for recusada.
    boardChoices.querySelectorAll("[data-board-id]").forEach(button => {
      const selected = button.dataset.boardId === previousBoardId;
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = selected || readRoomSession().role !== "owner" || room?.phase !== "waiting";
    });
  }
});

readyButton.addEventListener("click", async () => {
  if (!room) return;
  readyButton.disabled = true;
  status.textContent = "";
  const { pin, role } = readRoomSession();
  try {
    await setPlayerReady({ pin, role, ready: !room.ready?.[role] });
  } catch (error) {
    status.textContent = getRoomErrorMessage(error.code);
  } finally {
    if (room) updateLobby(room);
  }
});

startButton.addEventListener("click", async () => {
  startButton.disabled = true;
  status.textContent = "";
  const { pin } = readRoomSession();
  try {
    await startMatch({ pin });
    // TODO: T09
  } catch (error) {
    status.textContent = getRoomErrorMessage(error.code);
    if (room) updateLobby(room);
  }
});

leaveButton.addEventListener("click", async () => {
  leaveButton.disabled = true;
  const { pin, role } = readRoomSession();
  stopWatching();
  try {
    if (pin && role) await leaveRoom({ pin, role });
  } catch (error) {
    status.textContent = getRoomErrorMessage(error.code);
  } finally {
    clearRoomSession();
    window.location.assign("./t05-jogar.html");
  }
});

window.addEventListener("pagehide", stopWatching);