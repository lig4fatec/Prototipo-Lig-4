// Premissa de gravidade: a peça pousa na primeira casa livre de baixo para cima.
// passos são dados de apresentação; este módulo não temporiza a animação.
import { linhaDeQueda } from "./board.js";

export function planejarQueda(board, coluna, jogador) {
  const linhaFinal = linhaDeQueda(board, coluna);
  if (linhaFinal === -1) return { linhaFinal, passos: [] };

  const passos = Array.from({ length: linhaFinal + 1 }, (_, linha) => linha);
  return { linhaFinal, passos };
}