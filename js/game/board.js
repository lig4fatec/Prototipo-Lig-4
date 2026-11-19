// Premissas do tabuleiro: 6 linhas por 7 colunas; 0 vazio, 1 jogador 1 e 2 jogador 2.
const ROWS = 6;
const COLUMNS = 7;

export function criarTabuleiro() {
  return Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
}

export function copiarTabuleiro(board) {
  return board.map(row => row.slice());
}

export function linhaDeQueda(board, coluna) {
  if (!Number.isInteger(coluna) || coluna < 0 || coluna >= COLUMNS) return -1;

  for (let linha = ROWS - 1; linha >= 0; linha--) {
    if (board[linha][coluna] === 0) return linha;
  }

  return -1;
}