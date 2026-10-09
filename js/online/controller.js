import { clearRoomSession, readRoomSession } from "../room-ui.js";
import { watchRoom } from "../services/rooms.js";
import { iniciarSecaoCriar } from "./criar.js";
import { iniciarSecaoEntrar } from "./entrar.js";
import { abrirLobby, fecharLobby } from "./lobby.js";
import { abrirPartida, fecharPartida } from "./partida.js";

const sections = {
  criar: document.getElementById("secao-criar"),
  entrar: document.getElementById("secao-entrar"),
  lobby: document.getElementById("secao-lobby"),
  partida: document.getElementById("secao-partida"),
};

let currentSection = null;
let cancelLobbyPhaseWatch = null;
let redirecting = false;

function setLostRoomNotice() {
  sessionStorage.setItem("lig4-aviso", "sala-perdida");
}

function redirectToPlay({ notify = false } = {}) {
  if (redirecting) return;
  redirecting = true;
  if (cancelLobbyPhaseWatch) cancelLobbyPhaseWatch();
  cancelLobbyPhaseWatch = null;
  fecharLobby();
  fecharPartida();
  clearRoomSession();
  if (notify) setLostRoomNotice();
  window.location.assign("./t05-jogar.html");
}

export async function mostrarSecao(name) {
  if (!Object.hasOwn(sections, name)) return;
  if (currentSection === "lobby" && name !== "lobby") {
    fecharLobby();
    if (cancelLobbyPhaseWatch) cancelLobbyPhaseWatch();
    cancelLobbyPhaseWatch = null;
  }
  if (currentSection === "partida" && name !== "partida") fecharPartida();

  for (const [sectionName, section] of Object.entries(sections)) {
    section.hidden = sectionName !== name;
  }
  currentSection = name;
  document.body.dataset.currentSection = name;

  if (name === "lobby") {
    await abrirLobby({ onLost: redirectToPlay });
    if (redirecting || currentSection !== "lobby") return;
    const { pin } = readRoomSession();
    if (!pin) return redirectToPlay({ notify: true });

    try {
      cancelLobbyPhaseWatch = watchRoom(pin, room => {
        if (!room) {
          redirectToPlay({ notify: true });
          return;
        }
        if ((room.phase === "playing" || room.phase === "finished") && currentSection === "lobby") {
          queueMicrotask(() => {
            if (currentSection === "lobby") void mostrarSecao("partida");
          });
        }
      });
    } catch (error) {
      if (error.code === "PIN_NAO_ENCONTRADO") redirectToPlay({ notify: true });
    }
  }

  if (name === "partida") {
    if (cancelLobbyPhaseWatch) cancelLobbyPhaseWatch();
    cancelLobbyPhaseWatch = null;
    await abrirPartida({
      onRoomLost: () => redirectToPlay({ notify: true }),
      onLeave: () => redirectToPlay(),
    });
  }
}

iniciarSecaoCriar(() => mostrarSecao("lobby"));
iniciarSecaoEntrar(() => mostrarSecao("lobby"));

async function initializeOnline() {
  const { pin, role } = readRoomSession();
  if (pin || role) {
    if (!pin || !["owner", "guest"].includes(role)) {
      redirectToPlay({ notify: true });
      return;
    }
    await mostrarSecao("lobby");
    return;
  }

  const initialSection = window.location.hash.slice(1);
  if (initialSection === "criar" || initialSection === "entrar") {
    await mostrarSecao(initialSection);
    return;
  }

  redirectToPlay();
}

initializeOnline();

window.addEventListener("pagehide", () => {
  if (cancelLobbyPhaseWatch) cancelLobbyPhaseWatch();
  cancelLobbyPhaseWatch = null;
  fecharLobby();
  fecharPartida();
});