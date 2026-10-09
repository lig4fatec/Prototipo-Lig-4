import { CORES_VALIDAS } from "./services/rooms.js";

export const ROOM_SESSION_KEYS = Object.freeze({
  pin: "lig4.room.pin",
  role: "lig4.room.role",
});

export const COLOR_NAMES = Object.freeze({
  blue: "Azul",
  red: "Vermelho",
  purple: "Roxo",
  green: "Verde",
  orange: "Laranja",
  yellow: "Amarelo",
  brown: "Marrom",
});

const ERROR_MESSAGES = Object.freeze({
  PIN_INVALIDO: "O PIN deve conter exatamente 6 números.",
  PIN_NAO_ENCONTRADO: "Sala não encontrada.",
  SALA_CHEIA: "Esta sala já está cheia.",
  COR_INVALIDA: "Selecione uma cor válida.",
  COR_JA_ESCOLHIDA: "Esta cor já foi escolhida pelo outro jogador.",
  SERIE_INVALIDA: "Selecione uma série válida.",
  SEM_PERMISSAO: "Você não tem permissão para esta ação.",
  SALA_NAO_PRONTA: "A sala precisa de dois jogadores com cores diferentes.",
});

export function getRoomErrorMessage(code) {
  return ERROR_MESSAGES[code] || "Não foi possível concluir a ação. Tente novamente.";
}

export function saveRoomSession(pin, role) {
  sessionStorage.setItem(ROOM_SESSION_KEYS.pin, pin);
  sessionStorage.setItem(ROOM_SESSION_KEYS.role, role);
}

export function readRoomSession() {
  return {
    pin: sessionStorage.getItem(ROOM_SESSION_KEYS.pin),
    role: sessionStorage.getItem(ROOM_SESSION_KEYS.role),
  };
}

export function clearRoomSession() {
  sessionStorage.removeItem(ROOM_SESSION_KEYS.pin);
  sessionStorage.removeItem(ROOM_SESSION_KEYS.role);
}

export function renderColorPicker(container, groupName, selectedColor, onChange) {
  container.replaceChildren(...CORES_VALIDAS.map(color => {
    const label = document.createElement("label");
    label.className = "color-picker__option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = groupName;
    input.value = color;
    input.checked = color === selectedColor;
    input.setAttribute("aria-label", COLOR_NAMES[color]);
    input.addEventListener("change", () => onChange(color));

    const swatch = document.createElement("span");
    swatch.className = "color-picker__swatch";
    swatch.dataset.color = color;
    swatch.setAttribute("aria-hidden", "true");

    const name = document.createElement("span");
    name.textContent = COLOR_NAMES[color];

    label.append(input, swatch, name);
    return label;
  }));
}