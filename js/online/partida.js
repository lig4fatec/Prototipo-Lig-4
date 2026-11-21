import { getGameMode } from "../game/modes.js";
import {
  getRoom,
  leaveRoom,
  publishResult,
  publishState,
  requestRematch,
  sendEmote,
  usarCongelarColuna,  
  usarPecaExtra,
  usarQueimarPeca,
  desistirPartida,
  proporEmpate,
  responderEmpate,
  watchRoom,
} from "../services/rooms.js";
import {
  findItem,
  getEquippedItems,
  getInventory,
} from "../services/store.js";
import { applyBoardTheme, createAvatarImage, createEmoteImage } from "../player-style.js";
import { criarTabuleiro } from "../game/board.js";
import { colunaBloqueada, jogar, proximoTurno, contarEspacosLivres } from "../game/rules.js";
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
const INITIAL_CLOCK_MS = 300000;
const CLOCK_REFRESH_MS = 250;
const boardWrap = document.querySelector(".online-game-board-wrap");
const boardElement = document.querySelector("[data-game-board]");
const columnsElement = document.querySelector("[data-game-columns]");
const pinElement = document.querySelector("[data-game-pin]");
const turnElement = document.querySelector("[data-game-turn]");
const playerCards = [
  document.querySelector('[data-score-player="1"]'),
  document.querySelector('[data-score-player="2"]'),
];
const clockElements = [
  document.querySelector('[data-game-clock="1"]'),
  document.querySelector('[data-game-clock="2"]'),
];
const powerElements = [
  document.querySelector('[data-game-powers="1"]'),
  document.querySelector('[data-game-powers="2"]'),
];
const statusElement = document.querySelector("[data-game-status]");
const resultPanel = document.querySelector("[data-game-result-panel]");
const resultElement = document.querySelector("[data-game-result]");
const rematchStatus = document.querySelector("[data-game-rematch-status]");
const rematchButton = document.querySelector("[data-game-rematch]");
const leaveButton = document.querySelector("[data-game-leave]");
const drawButton = document.querySelector("[data-game-draw]");

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
let pendingPower = null;
let clockStorageKey = null;
let clockInterval = null;
let clockStorageHandler = null;
let onRoomLost = () => {};
let onLeave = () => {};
let moveInProgress = false;
let leaveInProgress = false;
let ownAvatarId = null;
let lastEmoteSeen = null;
let emoteCooldown = false;
const emoteTimers = new Map();
let empatePopup = null;
let empateRecusadoTimer = null;
let empateRecusadoAvisado = false;

const gameErrorMessages = {
  COLUNA_INVALIDA: "Selecione uma coluna válida.",
  COLUNA_CHEIA: "Esta coluna está cheia.",
  COLUNA_BLOQUEADA: "Esta coluna está congelada para você.",
  NAO_EH_SEU_TURNO: "Aguarde a sua vez.",
  JOGADOR_INVALIDO: "Jogador inválido.",
  PARTIDA_ENCERRADA: "Esta partida já terminou.",
  PODER_JA_USADO: "Você já usou este poder nesta partida.",
  PODER_INDISPONIVEL: "Este poder só está disponível no modo Caos.",
  SEM_PECA_ADVERSARIA: "Não há peça do adversário nesta coluna.",
  SEM_ESPACO_SUFICIENTE: "Restam poucos espaços para usar este poder.",
};

function playerNumberForRole(playerRole) {
  return playerRole === "owner" ? 1 : playerRole === "guest" ? 2 : null;
}

function readClockState() {
  if (!clockStorageKey) return null;
  const serialized = localStorage.getItem(clockStorageKey);
  if (!serialized) return null;
  
  try {
    const state = JSON.parse(serialized);
    if (
      !Number.isFinite(state.restante1) || state.restante1 < 0
      || !Number.isFinite(state.restante2) || state.restante2 < 0
      || ![1, 2].includes(state.vez)
      || !(state.inicioVez === null || Number.isFinite(state.inicioVez))
    ) return null;
    
    return {
      restante1: state.restante1,
      restante2: state.restante2,
      vez: state.vez,
      inicioVez: state.inicioVez,
    };
  } catch {
    return null;
  }
}

function sameClockState(left, right) {
  return Boolean(left && right)
  && left.restante1 === right.restante1
  && left.restante2 === right.restante2
  && left.vez === right.vez
  && left.inicioVez === right.inicioVez;
}

function storeClockState(nextState, expectedState = null) {
  if (!clockStorageKey) return null;
  const currentState = readClockState();
  if (expectedState ? !sameClockState(currentState, expectedState) : currentState) {
    return currentState;
  }
  if (sameClockState(currentState, nextState)) return currentState;
  
  localStorage.setItem(clockStorageKey, JSON.stringify(nextState));
  return nextState;
}

function remainingClockTime(state, playerNumber, now = Date.now()) {
  const remaining = state[`restante${playerNumber}`];
  if (state.vez !== playerNumber || state.inicioVez === null) return remaining;
  const elapsed = Math.max(0, now - state.inicioVez);
  return Math.max(0, remaining - elapsed);
}

function formatClock(milliseconds) {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function redrawClocks({ stopAtZero = true } = {}) {
  let state = readClockState();
  if (!state) return;
  
  if (stopAtZero && state.inicioVez !== null && remainingClockTime(state, state.vez) === 0) {
    const stoppedState = storeClockState({
      ...state,
      [`restante${state.vez}`]: 0,
      inicioVez: null,
    }, state);
    state = stoppedState || readClockState();
  }
  
  if (!state) return;
  const now = Date.now();
  for (let index = 0; index < clockElements.length; index++) {
    const element = clockElements[index];
    if (element) element.textContent = formatClock(remainingClockTime(state, index + 1, now));
  }
}

function reconcileClock(nextRoom) {
  const turn = nextRoom.game?.turn;
  if (![1, 2].includes(turn)) return;
  
  const playing = nextRoom.phase === "playing";
  const now = Date.now();
  const currentState = readClockState();
  if (!currentState) {
    storeClockState({
      restante1: INITIAL_CLOCK_MS,
      restante2: INITIAL_CLOCK_MS,
      vez: turn,
      inicioVez: playing ? now : null,
    });
    return;
  }
  
  const nextState = { ...currentState };
  if (currentState.vez !== turn) {
    if (currentState.inicioVez !== null) {
      nextState[`restante${currentState.vez}`] = remainingClockTime(currentState, currentState.vez, now);
    }
    nextState.vez = turn;
    nextState.inicioVez = playing && nextState[`restante${turn}`] > 0 ? now : null;
  } else if (playing && currentState.inicioVez === null) {
    if (currentState[`restante${turn}`] > 0) nextState.inicioVez = now;
  } else if (!playing && currentState.inicioVez !== null) {
    nextState[`restante${turn}`] = remainingClockTime(currentState, turn, now);
    nextState.inicioVez = null;
  }
  
  if (!sameClockState(currentState, nextState)) storeClockState(nextState, currentState);
}

function renderPlayerColors(nextRoom) {
  for (const [index, playerRole] of ["owner", "guest"].entries()) {
    const card = playerCards[index];
    if (!card) continue;
    
    const color = nextRoom.players?.[playerRole]?.color;
    const variable = color ? `--game-color-${color}` : "";
    const value = variable ? getComputedStyle(card).getPropertyValue(variable).trim() : "";
    if (value) card.style.setProperty("--player-color", `var(${variable})`);
    else card.style.removeProperty("--player-color");
  }
}

function renderActivePlayer(nextRoom) {
  for (const [index, card] of playerCards.entries()) {
    card?.classList.toggle(
      "is-active",
      nextRoom.phase === "playing" && nextRoom.game?.turn === index + 1,
    );
  }
}

function startClockUpdates() {
  clockStorageHandler = event => {
    if (event.key === clockStorageKey) redrawClocks({ stopAtZero: false });
  };
  window.addEventListener("storage", clockStorageHandler);
  clockInterval = window.setInterval(() => redrawClocks(), CLOCK_REFRESH_MS);
}

function stopClockUpdates() {
  if (clockInterval !== null) window.clearInterval(clockInterval);
  if (clockStorageHandler) window.removeEventListener("storage", clockStorageHandler);
  clockInterval = null;
  clockStorageHandler = null;
  clockStorageKey = null;
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
      
      const bloqueiosAtivos = room?.game?.bloqueios || [];
      const frozen = room?.phase === "playing"
      && colunaBloqueada(bloqueiosAtivos, column, room?.game?.turn);
      cell.dataset.frozen = frozen && player === 0 ? "true" : "false";
      
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
  const bloqueiosAtivos = room?.game?.bloqueios || [];
  const playerNumberAtual = room?.game?.turn;
  columnsElement.querySelectorAll("button").forEach(button => {
    const coluna = Number(button.dataset.column);
    const congelada = room?.phase === "playing"
    && colunaBloqueada(bloqueiosAtivos, coluna, playerNumberAtual);
    button.dataset.frozen = congelada ? "true" : "false";
  });
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

function renderPowerButtons() {
  const powers = [
    { id: "congelar-coluna", label: "Congelar coluna" },
    { id: "queimar-peca", label: "Queimar peça" },
    { id: "peca-extra", label: "Peça extra" },
  ];
  
  for (const [index, container] of powerElements.entries()) {
    if (!container) continue;
    if (room?.mode !== "caos") {
      container.replaceChildren();
      continue;
    }
    
    const playerNumber = index + 1;
    const isLocalPlayer = playerNumberForRole(role) === playerNumber;
    const isTurn = room.phase === "playing" && room.game?.turn === playerNumber;
    const extraPhase2 = room.game?.pecaExtra?.etapa === 2;
    const notPlaying = room.phase !== "playing";
    
    const poucosEspacos = contarEspacosLivres(room.game?.board || []) < 2;
    
    const buttons = powers.map(power => {
      const used = (room.game?.poderesUsados?.[playerNumber] || []).includes(power.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button button-secondary";
      button.textContent = power.label;
      // button.disabled = used || !isLocalPlayer || !isTurn || moveInProgress || extraPhase2 || notPlaying;
      button.disabled = used || !isLocalPlayer || !isTurn || moveInProgress
      || (power.id === "peca-extra" && poucosEspacos)
      || room.game?.pecaExtra?.etapa === 2;
      
      if (power.id === "peca-extra") {
        button.setAttribute("aria-pressed", "false");
      } else {
        button.setAttribute("aria-pressed", String(pendingPower === power.id && isLocalPlayer));
      }
      if (used) button.classList.add("is-used");
      if (power.id === "peca-extra") {
        button.addEventListener("click", async () => {
          if (!room || room.phase !== "playing" || moveInProgress) return;
          try {
            await usarPecaExtra({ pin: room.pin, role });
            statusElement.textContent = "Jogue sua segunda peça.";
          } catch (error) {
            statusElement.textContent = gameErrorMessages[error.code] || getRoomErrorMessage(error.code);
          }
          renderPowerButtons();
        });
      } else {
        button.addEventListener("click", () => {
          if (!room || room.phase !== "playing" || moveInProgress) return;
          pendingPower = pendingPower === power.id ? null : power.id;
          statusElement.textContent = pendingPower
          ? "Clique em uma coluna para usar o poder."
          : "";
          renderPowerButtons();
        });
      }
      return button;
    });
    container.replaceChildren(...buttons);
  }
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

function confirmarModal(mensagem) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0, 0, 0, 0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "1000";

    const box = document.createElement("div");
    box.style.background = "#ffffff";
    box.style.padding = "1.5rem 2rem";
    box.style.borderRadius = "8px";
    box.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
    box.style.minWidth = "260px";
    box.style.textAlign = "center";

    const mensagemEl = document.createElement("p");
    mensagemEl.textContent = mensagem;
    mensagemEl.style.margin = "0 0 1rem";

    const botoes = document.createElement("div");
    botoes.style.display = "flex";
    botoes.style.gap = "0.5rem";
    botoes.style.justifyContent = "center";

    const confirmar = document.createElement("button");
    confirmar.type = "button";
    confirmar.textContent = "Confirmar";
    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.textContent = "Cancelar";

    const fechar = () => overlay.remove();
    confirmar.addEventListener("click", () => { fechar(); resolve(true); });
    cancelar.addEventListener("click", () => { fechar(); resolve(false); });

    botoes.append(confirmar, cancelar);
    box.append(mensagemEl, botoes);
    overlay.append(box);
    document.body.append(overlay);
  });
}

async function handleResign() {
  if (!room) return;
  const confirmado = await confirmarModal("Deseja mesmo desistir da partida?");
  if (!confirmado) return;
  try {
    await desistirPartida({ pin: room.pin, role });
  } catch (error) {
    statusElement.textContent = getRoomErrorMessage(error.code);
  }
}

function removerEmpatePopup() {
  if (empatePopup) {
    empatePopup.remove();
    empatePopup = null;
  }
}

function renderEmpateUI() {
  removerEmpatePopup();

  const jogo = room?.game;
  const empate = room?.empate;
  const jogador = playerNumberForRole(role);
  const jaProposto = Boolean(jogo?.empatesPropostos?.[jogador]);
  const pendente = Boolean(empate && empate.status === "pendente");

  if (drawButton) {
    drawButton.disabled = !(
      room?.phase === "playing" && Boolean(jogador) && !jaProposto && !pendente
    );
  }

  const recusadoLocal = Boolean(
    empate && empate.status === "recusado" && empate.proponente === jogador
  );

  if (recusadoLocal) {
    if (!empateRecusadoAvisado) {
      empateRecusadoAvisado = true;
      statusElement.textContent = "O adversário recusou o empate.";
      if (empateRecusadoTimer) clearTimeout(empateRecusadoTimer);
      empateRecusadoTimer = setTimeout(() => {
        empateRecusadoTimer = null;
        empateRecusadoAvisado = false;
        if (statusElement.textContent === "O adversário recusou o empate.") {
          statusElement.textContent = "";
        }
      }, 5000);
    }
    return;
  }

  empateRecusadoAvisado = false;
  if (empateRecusadoTimer) {
    clearTimeout(empateRecusadoTimer);
    empateRecusadoTimer = null;
  }
  if (statusElement.textContent === "O adversário recusou o empate.") {
    statusElement.textContent = "";
  }

  if (!pendente) return;

  if (empate.proponente === jogador) {
    statusElement.textContent = "Aguardando resposta.";
    return;
  }

  const card = document.querySelector(`[data-score-player="${jogador}"]`);
  if (!card) return;
  const playerName = card.querySelector(".player-name");
  if (!playerName) return;

  const box = document.createElement("div");
  box.dataset.empatePopup = "true";

  const label = document.createElement("span");
  label.textContent = "Empate?";

  const aceitar = document.createElement("button");
  aceitar.type = "button";
  aceitar.className = "button button-secondary";
  aceitar.textContent = "Aceitar";

  const recusar = document.createElement("button");
  recusar.type = "button";
  recusar.className = "button button-danger";
  recusar.textContent = "Recusar";

  box.append(label, aceitar, recusar);
  playerName.after(box);
  empatePopup = box;

  aceitar.addEventListener("click", async () => {
    if (!room) return;
    try {
      await responderEmpate({ pin: room.pin, role, aceitar: true });
    } catch (error) {
      statusElement.textContent =
        gameErrorMessages[error.code] || getRoomErrorMessage(error.code);
    }
  });

  recusar.addEventListener("click", async () => {
    if (!room) return;
    try {
      await responderEmpate({ pin: room.pin, role, aceitar: false });
    } catch (error) {
      statusElement.textContent =
        gameErrorMessages[error.code] || getRoomErrorMessage(error.code);
    }
  });
}

function renderRoom(nextRoom) {
  if (!nextRoom) {
    room = null;
    pendingPower = null;
    stopRoomWatch();
    stopClockUpdates();
    removerEmpatePopup();
    if (empateRecusadoTimer) {
      clearTimeout(empateRecusadoTimer);
      empateRecusadoTimer = null;
    }
    empateRecusadoAvisado = false;
    onRoomLost();
    return;
  }
  
  if (
    pendingPower
    && (nextRoom.phase !== "playing" || nextRoom.game?.turn !== playerNumberForRole(role))
  ) pendingPower = null;
  room = nextRoom;
  renderPlayerColors(room);
  renderActivePlayer(room);
  reconcileClock(room);
  redrawClocks();
  renderPowerButtons();
  const mode = getGameMode(room.mode);
  modeLabel.textContent = mode.name;
  applyBoardTheme(boardWrap, findItem(room.boardId || "board-classico"));
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
    if (room.result.draw) {
      resultElement.textContent = "Empate.";
    } else if (room.result.motivo === "desistencia") {
      const perdedor = room.result.winner === 1 ? 2 : 1;
      resultElement.textContent = `${perdedor === 1 ? "Jogador 1 · Dono" : "Jogador 2 · Convidado"} desistiu. ${room.result.winner === 1 ? "Jogador 1 · Dono" : "Jogador 2 · Convidado"} venceu.`;
    } else {
      resultElement.textContent = `${room.result.winner === 1 ? "Jogador 1 · Dono" : "Jogador 2 · Convidado"} venceu.`;
    }
    const requested = room.rematchRequested || [];
    rematchButton.disabled = requested.includes(role);
    rematchStatus.textContent = requested.length
    ? "Aguardando o outro jogador."
    : "";
  } else {
    rematchStatus.textContent = "";
    rematchButton.disabled = true;
  }

  const podeDesistir = room.phase === "playing" && Boolean(playerNumberForRole(role));
  const btnDesistir = document.querySelector("[data-game-resign]");
  if (btnDesistir) btnDesistir.disabled = !podeDesistir;

  renderBoard();
  renderEmpateUI();
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
  if (pendingPower === "congelar-coluna") {
    try {
      await usarCongelarColuna({ pin: room.pin, role, coluna: column });
      pendingPower = null;
      statusElement.textContent = "Coluna congelada para o adversário.";
    } catch (error) {
      statusElement.textContent = gameErrorMessages[error.code] || getRoomErrorMessage(error.code);
    }
    renderPowerButtons();
    return;
  }
  
  if (pendingPower === "queimar-peca") {
    try {
      await usarQueimarPeca({ pin: room.pin, role, coluna: column });
      pendingPower = null;
      statusElement.textContent = "Peça adversária removida.";
    } catch (error) {
      statusElement.textContent = gameErrorMessages[error.code] || getRoomErrorMessage(error.code);
    }
    renderPowerButtons();
    return;
  }
  
  if (colunaBloqueada(room.game?.bloqueios || [], column, player)) {
    statusElement.textContent = gameErrorMessages.COLUNA_BLOQUEADA;
    return;
  }
  
  const game = room.game;
  const result = jogar(game.board, column, player, game.turn, false);
  if (!result.ok) {
    statusElement.textContent = gameErrorMessages[result.code] || "Jogada inválida.";
    return;
  }
  
  moveInProgress = true;
  renderPowerButtons();
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
  stopClockUpdates();
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
    clockStorageKey = `lig4-relogio:${session.pin}`;
    // Emotes anteriores à entrada na partida não devem reaparecer.
    lastEmoteSeen = initialRoom.lastEmote?.id ?? null;
    emoteStatus.textContent = "";
    renderRoom(initialRoom);
    startClockUpdates();
    cancelRoomWatch = watchRoom(session.pin, renderRoom);
  } catch (error) {
    if (error.code === "PIN_NAO_ENCONTRADO") onRoomLost();
    else statusElement.textContent = getRoomErrorMessage(error.code);
  }
}

export function fecharPartida() {
  stopRoomWatch();
  stopClockUpdates();
  moveInProgress = false;
  removerEmpatePopup();
  if (empateRecusadoTimer) {
    clearTimeout(empateRecusadoTimer);
    empateRecusadoTimer = null;
  }
  empateRecusadoAvisado = false;
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

document.querySelector("[data-game-resign]").addEventListener("click", async () => {
  await handleResign();
});

drawButton.addEventListener("click", async () => {
  if (!room || room.phase !== "playing") return;
  const jogador = playerNumberForRole(role);
  if (!jogador) return;
  if (Boolean(room.game?.empatesPropostos?.[jogador])) return;
  if (room.empate?.status === "pendente") return;
  try {
    await proporEmpate({ pin: room.pin, role });
  } catch (error) {
    statusElement.textContent =
      gameErrorMessages[error.code] || getRoomErrorMessage(error.code);
  }
});

// Atualiza avatar e emotes locais; o tabuleiro é sempre definido pelo modo da sala.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && room) applyPersonalization();
});
window.addEventListener("pageshow", () => { if (room) applyPersonalization(); });
window.addEventListener("pagehide", fecharPartida);

createColumnButtons();
