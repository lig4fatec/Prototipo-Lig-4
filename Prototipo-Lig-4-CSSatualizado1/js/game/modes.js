// Os modos definem as regras; o tabuleiro visual é escolhido pelo dono no lobby.
export const GAME_MODES = Object.freeze([
  { id: "classico", name: "Clássico", boardId: "board-classico" },
  { id: "caos", name: "Caos", boardId: "board-classico" },
]);
export function getGameMode(id) {
  return GAME_MODES.find(mode => mode.id === id) || GAME_MODES[0];
}
export function isValidGameMode(id) {
  return GAME_MODES.some(mode => mode.id === id);
}
