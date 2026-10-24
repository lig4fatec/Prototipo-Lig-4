import { getRoom, leaveRoom, setPlayerColor, startMatch, watchRoom } from "../services/rooms.js";
import {
  clearRoomSession,
  COLOR_NAMES,
  getRoomErrorMessage,
  readRoomSession,
  renderColorPicker,
} from "../room-ui.js";

const pinElement = document.querySelector("[data-lobby-pin]");
const status = document.querySelector("[data-lobby-status]");
const colorError = document.querySelector('[data-lobby-error="color"]');
const startButton = document.querySelector("[data-lobby-start]");
const leaveButton = document.querySelector("[data-lobby-leave]");
let room = null;
let cancelRoomWatch = null;
let onRoomLost = () => {};
let leaving = false;

function stopWatching() {
  if (cancelRoomWatch) cancelRoomWatch();
  cancelRoomWatch = null;
}

function setPlayer(roleName, player) {
  const roleElement = document.querySelector(`[data-player-role="${roleName}"]`);
  const colorElement = document.querySelector(`[data-player-color="${roleName}"]`);
  const swatch = document.querySelector(`[data-player-swatch="${roleName}"]`);
  const preview = document.querySelector(`[data-player-swatch-preview="${roleName}"]`);

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

function updateLobby(nextRoom) {
  if (!nextRoom) {
    room = null;
    stopWatching();
    onRoomLost({ notify: true });
    return;
  }

  room = nextRoom;
  pinElement.textContent = room.pin;
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
  const colorsDiffer = room.players.guest
    && room.players.owner.color !== room.players.guest.color;
  startButton.disabled = role !== "owner"
    || !room.players.guest
    || !colorsDiffer
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