// Aplicação visual dos itens equipados (avatar, tabuleiro, emote) fora da loja.
import { findItem, getBoardFrameUrl, getItemImageUrl } from "./services/store.js";

export const DEFAULT_AVATAR_ID = "avatar-padrao";

function resolveItem(itemId, category, fallbackId) {
  const item = itemId ? findItem(itemId) : null;
  return item?.category === category ? item : findItem(fallbackId);
}

export function resolveAvatar(avatarId) {
  return resolveItem(avatarId, "avatar", DEFAULT_AVATAR_ID);
}

export function createAvatarImage(avatarId, className = "player-avatar") {
  const avatar = resolveAvatar(avatarId);
  const image = document.createElement("img");
  image.className = className;
  image.src = getItemImageUrl(avatar);
  image.alt = "";
  image.decoding = "async";
  image.dataset.avatar = avatar.id;
  return image;
}

export function createEmoteImage(emoteId, className = "emote-image") {
  const emote = findItem(emoteId);
  if (emote?.category !== "emote") return null;
  const image = document.createElement("img");
  image.className = className;
  image.src = getItemImageUrl(emote);
  image.alt = emote.name;
  image.decoding = "async";
  return image;
}

// Tabuleiros com "frame" substituem o desenho do tabuleiro; o Clássico mantém o visual original do jogo.
export function applyBoardTheme(wrapElement, boardItem) {
  const frame = boardItem?.frame;
  const properties = [
    "--board-frame", "--board-aspect", "--board-x0", "--board-y0", "--board-dx", "--board-dy",
    "--board-cell", "--board-cell-y", "--board-empty",
  ];
  if (!frame) {
    delete wrapElement.dataset.boardTheme;
    properties.forEach(property => wrapElement.style.removeProperty(property));
    return;
  }

  // Os discos ficam um pouco maiores que o furo para encaixar sob a moldura, sem frestas.
  const cell = (frame.radius + 3) * 2;
  wrapElement.dataset.boardTheme = boardItem.id.replace(/^board-/, "");
  wrapElement.style.setProperty("--board-frame", `url("${getBoardFrameUrl(boardItem)}")`);
  wrapElement.style.setProperty("--board-aspect", String(frame.width / frame.height));
  wrapElement.style.setProperty("--board-x0", String(frame.x0 / frame.width));
  wrapElement.style.setProperty("--board-y0", String(frame.y0 / frame.height));
  wrapElement.style.setProperty("--board-dx", String(frame.dx / frame.width));
  wrapElement.style.setProperty("--board-dy", String(frame.dy / frame.height));
  wrapElement.style.setProperty("--board-cell", String(cell / frame.width));
  wrapElement.style.setProperty("--board-cell-y", String(cell / frame.height));
  wrapElement.style.setProperty("--board-empty", frame.empty);
}
