import { getGameMode } from "../game/modes.js";
import { getRoom, leaveRoom, setPlayerColor, setPlayerReady, watchRoom } from "../services/rooms.js";
import { equipItem, getInventory, getItemImageUrl } from "../services/store.js";
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
let ultimaFase = null;

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
  const nomeElement = document.querySelector(`[data-player-card="${roleName}"] [data-player-name]`);
  setPlayerAvatar(roleName, player);

  if (!player) {
    roleElement.textContent = "Aguardando jogador";
    colorElement.textContent = "—";
    swatch.dataset.color = "empty";
    preview.dataset.color = "empty";
    if (nomeElement) nomeElement.textContent = "";
    return;
  }

  roleElement.textContent = roleName === "owner" ? "Dono" : "Convidado";
  colorElement.textContent = COLOR_NAMES[player.color] || "—";
  swatch.dataset.color = player.color;
  preview.dataset.color = player.color;
  if (nomeElement) nomeElement.textContent = player.nome || "";
}

async function renderBoardChoices() {
  const inventory = await getInventory();
  const boards = (inventory.byCategory.board || []).filter(item => item.owned);
  const podeTrocar = room?.phase === "waiting";
  
  const cards = boards.map(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lobby-board-choice";
    button.dataset.boardId = item.id;
    button.setAttribute("aria-pressed", String(item.equipped));
    button.disabled = !podeTrocar || item.equipped;
    button.title = item.equipped
    ? `Tabuleiro ${item.name} (em uso)`
    : `Usar tabuleiro ${item.name}`;
    
    const image = document.createElement("img");
    image.src = getItemImageUrl(item);
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    
    const name = document.createElement("span");
    name.textContent = item.name;
    button.append(image, name);
    button.addEventListener("click", async () => {
      boardError.textContent = "";
      cardsDisabled(true);
      try {
        await equipItem({ category: "board", itemId: item.id });
      } catch (error) {
        boardError.textContent = "Não foi possível escolher este tabuleiro.";
      } finally {
        await renderBoardChoices();
      }
    });
    return button;
  });

  boardChoices.replaceChildren(...cards);
  boardChoices.setAttribute("aria-readonly", String(!podeTrocar));
  boardChoices.title = podeTrocar
  ? "Escolha o seu tabuleiro. Ele aparece só para você."
  : "A escolha do tabuleiro só pode ser feita antes da partida.";
}

function cardsDisabled(disabled) {
  boardChoices.querySelectorAll("button").forEach(button => {
    button.disabled = disabled;
  });
}

function updateLobby(nextRoom) {
  if (!nextRoom) {
    room = null;
    stopWatching();
    onRoomLost({ notify: true });
    return;
  }

  room = nextRoom;
  if (room.phase !== ultimaFase) {
    ultimaFase = room.phase;
    renderBoardChoices().catch(() => {
      boardError.textContent = "Não foi possível carregar seus tabuleiros.";
    });
  }
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
  startButton.disabled = true;
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
    ultimaFase = null;
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