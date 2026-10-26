// Modos selecionados pelo dono da sala; independentes de compras na loja.
export const GAME_MODES = Object.freeze([
  { id: "classico", name: "Clássico", boardId: "board-classico" },
  { id: "caos", name: "Caos", boardId: "board-classico" }, // arte/regras específicas pendentes
  { id: "inverno", name: "Inverno", boardId: "board-inverno" },
  { id: "floresta", name: "Floresta", boardId: "board-floresta" },
  { id: "praia", name: "Praia", boardId: "board-praia" },
  { id: "espacial", name: "Espacial", boardId: "board-espacial" },
  { id: "medieval", name: "Medieval", boardId: "board-medieval" },
]);
export function getGameMode(id) {
  return GAME_MODES.find(mode => mode.id === id) || GAME_MODES[0];
}
export function isValidGameMode(id) {
  return GAME_MODES.some(mode => mode.id === id);
}
