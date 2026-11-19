// Premissas: turnos alternados; vitória com quatro em linha; empate em tabuleiro cheio sem vitória.
// A semântica de "melhor de" continua a confirmar; este módulo não encerra séries.
import { copiarTabuleiro, linhaDeQueda } from "./board.js";

const ROWS = 6;
const COLUMNS = 7;
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export function encontrarLinhaVencedora(board, linha, coluna, jogador) {
  if (
    !Number.isInteger(linha)
    || !Number.isInteger(coluna)
    || linha < 0
    || linha >= ROWS
    || coluna < 0
    || coluna >= COLUMNS
    || (jogador !== 1 && jogador !== 2)
    || board[linha][coluna] !== jogador
  ) {
    return null;
  }

  for (const [deltaLinha, deltaColuna] of DIRECTIONS) {
    const line = [[linha, coluna]];

    for (const direction of [1, -1]) {
      let row = linha + deltaLinha * direction;
      let column = coluna + deltaColuna * direction;
      const cells = [];

      while (
        row >= 0 && row < ROWS
        && column >= 0 && column < COLUMNS
        && board[row][column] === jogador
      ) {
        cells.push([row, column]);
        row += deltaLinha * direction;
        column += deltaColuna * direction;
      }

      if (direction === 1) line.push(...cells);
      else line.unshift(...cells.reverse());
    }

    if (line.length >= 4) {
      const centerIndex = line.findIndex(([row, column]) => row === linha && column === coluna);
      const start = Math.max(0, Math.min(centerIndex - 3, line.length - 4));
      return line.slice(start, start + 4);
    }
  }

  return null;
}

export function tabuleiroCheio(board) {
  return board.every(row => row.every(cell => cell !== 0));
}

export function proximoTurno(jogadorAtual) {
  return jogadorAtual === 1 ? 2 : 1;
}

export function jogar(board, coluna, jogador, turnoAtual, partidaEncerrada) {
  if (partidaEncerrada) return { ok: false, code: "PARTIDA_ENCERRADA" };
  if (jogador !== 1 && jogador !== 2) return { ok: false, code: "JOGADOR_INVALIDO" };
  if (jogador !== turnoAtual) return { ok: false, code: "NAO_EH_SEU_TURNO" };
  if (!Number.isInteger(coluna) || coluna < 0 || coluna >= COLUMNS) {
    return { ok: false, code: "COLUNA_INVALIDA" };
  }

  const linha = linhaDeQueda(board, coluna);
  if (linha === -1) return { ok: false, code: "COLUNA_CHEIA" };

  const nextBoard = copiarTabuleiro(board);
  nextBoard[linha][coluna] = jogador;
  const vitoria = encontrarLinhaVencedora(nextBoard, linha, coluna, jogador) !== null;
  const empate = !vitoria && tabuleiroCheio(nextBoard);

  return { ok: true, board: nextBoard, linha, vitoria, empate };
}