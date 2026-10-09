import { clearRoomSession, readRoomSession } from "../room-ui.js";
import { iniciarSecaoCriar } from "./criar.js";
import { iniciarSecaoEntrar } from "./entrar.js";
import { abrirLobby, fecharLobby } from "./lobby.js";

const sections = {
  criar: document.getElementById("secao-criar"),
  entrar: document.getElementById("secao-entrar"),
  lobby: document.getElementById("secao-lobby"),
};

let currentSection = null;

function setLostRoomNotice() {
  sessionStorage.setItem("lig4-aviso", "sala-perdida");
}

function redirectToPlay({ notify = false } = {}) {
  fecharLobby();
  clearRoomSession();
  if (notify) setLostRoomNotice();
  window.location.assign("./t05-jogar.html");
}

export async function mostrarSecao(name) {
  if (!Object.hasOwn(sections, name)) return;
  if (currentSection === "lobby" && name !== "lobby") fecharLobby();

  for (const [sectionName, section] of Object.entries(sections)) {
    section.hidden = sectionName !== name;
  }
  currentSection = name;

  if (name === "lobby") {
    await abrirLobby({ onLost: redirectToPlay });
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