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

export function colunaBloqueada(bloqueios, coluna, jogador) {
  if (!Array.isArray(bloqueios)) return false;
  return bloqueios.some(bloqueio => (
    bloqueio.coluna === coluna
    && bloqueio.jogador === jogador
    && bloqueio.lances > 0
  ));
}

export function aplicarCongelar(estado, coluna, jogador) {
  const bloqueio = {
    coluna,
    jogador: proximoTurno(jogador),
    lances: 3,
  };
  return {
    ...estado,
    bloqueios: [...(estado.bloqueios || []), bloqueio],
  };
}

export function consumirBloqueio(bloqueios, jogador) {
  return (bloqueios || [])
    .map(bloqueio => bloqueio.jogador === jogador
      ? { ...bloqueio, lances: Math.max(0, bloqueio.lances - 1) }
      : bloqueio)
    .filter(bloqueio => bloqueio.lances > 0);
}

export function passarVezSeBloqueado(estado) {
  let nextState = {
    ...estado,
    bloqueios: (estado.bloqueios || []).map(bloqueio => ({ ...bloqueio })),
  };

  for (let skips = 0; skips < 2; skips++) {
    const openColumns = Array.from({ length: COLUMNS }, (_, coluna) => coluna)
      .filter(coluna => linhaDeQueda(nextState.board, coluna) !== -1);
    if (openColumns.length === 0) break;

    const playableColumns = openColumns.filter(coluna => (
      !colunaBloqueada(nextState.bloqueios, coluna, nextState.turn)
    ));
    if (playableColumns.length > 0) break;

    nextState = {
      ...nextState,
      turn: proximoTurno(nextState.turn),
      bloqueios: consumirBloqueio(nextState.bloqueios, nextState.turn),
    };
  }

  return nextState;
}

export function contarEspacosLivres(board) {
  let count = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      if (board[row][col] === 0) count++;
    }
  }
  return count;
}

export function temColunaJogavel(board, bloqueios, jogador) {
  for (let col = 0; col < COLUMNS; col++) {
    if (linhaDeQueda(board, col) !== -1 && !colunaBloqueada(bloqueios, col, jogador)) {
      return true;
    }
  }
  return false;
}

export function removerPecaAdversaria(board, coluna, jogador) {
  if (!Number.isInteger(coluna) || coluna < 0 || coluna >= COLUMNS) {
    return { ok: false, code: "COLUNA_INVALIDA" };
  }
  if (jogador !== 1 && jogador !== 2) {
    return { ok: false, code: "JOGADOR_INVALIDO" };
  }

  const adversario = proximoTurno(jogador);
  const novoTabuleiro = copiarTabuleiro(board);

  for (let row = 0; row < ROWS; row++) {
    if (novoTabuleiro[row][coluna] === adversario) {
      novoTabuleiro[row][coluna] = 0;
      return { ok: true, board: novoTabuleiro };
    }
  }

  return { ok: false, code: "SEM_PECA_ADVERSARIA" };
}
