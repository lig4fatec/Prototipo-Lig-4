// Premissas testadas: tabuleiro 6x7, turno alternado, quatro em linha e queda sem temporização.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  copiarTabuleiro,
  criarTabuleiro,
  linhaDeQueda,
} from "../js/game/board.js";
import { planejarQueda } from "../js/game/drop.js";
import {
  encontrarLinhaVencedora,
  jogar,
  proximoTurno,
  tabuleiroCheio,
} from "../js/game/rules.js";

function drawPattern() {
  return Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 7 }, (_, column) => ((row + 2 * column) % 4 < 2 ? 1 : 2)),
  );
}

test("cria matriz nova 6x7 e copia sem compartilhar linhas", () => {
  const board = criarTabuleiro();
  const copy = copiarTabuleiro(board);

  assert.equal(board.length, 6);
  assert.equal(board.every(row => row.length === 7 && row.every(cell => cell === 0)), true);
  assert.notEqual(copy, board);
  assert.notEqual(copy[0], board[0]);
  copy[0][0] = 1;
  assert.equal(board[0][0], 0);
});

test("linhaDeQueda retorna fundo, próxima casa e -1 para cheia ou fora do intervalo", () => {
  const board = criarTabuleiro();
  assert.equal(linhaDeQueda(board, 3), 5);
  board[5][3] = 1;
  assert.equal(linhaDeQueda(board, 3), 4);
  for (let row = 0; row < 6; row++) board[row][3] = 1;
  assert.equal(linhaDeQueda(board, 3), -1);
  assert.equal(linhaDeQueda(board, -1), -1);
  assert.equal(linhaDeQueda(board, 7), -1);
});

test("jogar rejeita coluna inválida, cheia, jogador inválido, turno errado e partida encerrada", () => {
  const board = criarTabuleiro();
  assert.deepEqual(jogar(board, -1, 1, 1, false), { ok: false, code: "COLUNA_INVALIDA" });
  assert.deepEqual(jogar(board, 7, 1, 1, false), { ok: false, code: "COLUNA_INVALIDA" });
  assert.deepEqual(jogar(board, 2, 3, 3, false), { ok: false, code: "JOGADOR_INVALIDO" });
  assert.deepEqual(jogar(board, 2, 2, 1, false), { ok: false, code: "NAO_EH_SEU_TURNO" });
  assert.deepEqual(jogar(board, 2, 1, 1, true), { ok: false, code: "PARTIDA_ENCERRADA" });

  const fullColumn = criarTabuleiro();
  for (let row = 0; row < 6; row++) fullColumn[row][2] = row % 2 + 1;
  assert.deepEqual(jogar(fullColumn, 2, 1, 1, false), { ok: false, code: "COLUNA_CHEIA" });
});

test("jogar aplica alternância e não muta o tabuleiro original", () => {
  const board = criarTabuleiro();
  const original = copiarTabuleiro(board);
  const result = jogar(board, 4, 1, 1, false);

  assert.equal(result.ok, true);
  assert.equal(result.linha, 5);
  assert.equal(result.board[5][4], 1);
  assert.deepEqual(board, original);
  assert.equal(proximoTurno(1), 2);
  assert.equal(proximoTurno(2), 1);
});

test("encontra vitória horizontal e não declara vitória com três", () => {
  const board = criarTabuleiro();
  board[5][0] = 1;
  board[5][1] = 1;
  board[5][2] = 1;
  assert.deepEqual(encontrarLinhaVencedora(board, 5, 2, 1), null);

  const result = jogar(board, 3, 1, 1, false);
  assert.equal(result.vitoria, true);
  assert.deepEqual(encontrarLinhaVencedora(result.board, 5, 3, 1), [[5, 0], [5, 1], [5, 2], [5, 3]]);
});

test("encontra vitória vertical", () => {
  const board = criarTabuleiro();
  board[5][4] = 2;
  board[4][4] = 2;
  board[3][4] = 2;
  board[2][4] = 2;

  assert.deepEqual(encontrarLinhaVencedora(board, 2, 4, 2), [[2, 4], [3, 4], [4, 4], [5, 4]]);
});

test("encontra vitórias nas duas diagonais", () => {
  const rising = criarTabuleiro();
  rising[5][0] = 1;
  rising[4][1] = 1;
  rising[3][2] = 1;
  rising[2][3] = 1;
  assert.deepEqual(encontrarLinhaVencedora(rising, 2, 3, 1), [[2, 3], [3, 2], [4, 1], [5, 0]]);

  const falling = criarTabuleiro();
  falling[2][0] = 2;
  falling[3][1] = 2;
  falling[4][2] = 2;
  falling[5][3] = 2;
  assert.deepEqual(encontrarLinhaVencedora(falling, 5, 3, 2), [[2, 0], [3, 1], [4, 2], [5, 3]]);
});

test("tabuleiro cheio sem quatro em linha empata; vitória não empata", () => {
  const fullBoard = drawPattern();
  assert.equal(tabuleiroCheio(fullBoard), true);
  for (let row = 0; row < 6; row++) {
    for (let column = 0; column < 7; column++) {
      assert.equal(encontrarLinhaVencedora(fullBoard, row, column, fullBoard[row][column]), null);
    }
  }
  fullBoard[5][0] = 0;
  const draw = jogar(fullBoard, 0, 1, 1, false);
  assert.equal(draw.vitoria, false);
  assert.equal(draw.empate, true);

  const winningBoard = drawPattern();
  winningBoard[5][3] = 1;
  winningBoard[5][4] = 1;
  winningBoard[5][5] = 1;
  winningBoard[5][6] = 0;
  const win = jogar(winningBoard, 6, 1, 1, false);
  assert.equal(tabuleiroCheio(win.board), true);
  assert.equal(win.vitoria, true);
  assert.equal(win.empate, false);
});

test("planejarQueda retorna as linhas de 0 até a linha final, em ordem", () => {
  const board = criarTabuleiro();
  board[5][2] = 2;
  board[4][2] = 1;
  const plan = planejarQueda(board, 2, 1);

  assert.equal(plan.linhaFinal, 3);
  assert.deepEqual(plan.passos, [0, 1, 2, 3]);
  assert.deepEqual(planejarQueda(board, 7, 1), { linhaFinal: -1, passos: [] });
});