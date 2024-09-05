// config.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // Tamanho do bloco
const GAP_SIZE = 2; // Separação entre os blocos

canvas.width = COLS * (BLOCK_SIZE + GAP_SIZE) - GAP_SIZE;
canvas.height = ROWS * (BLOCK_SIZE + GAP_SIZE) - GAP_SIZE;

const colors = ["violet", "blue", "cyan", "green", "yellow", "orange", "red"];

const tetrominoes = [
  // I
  [[1, 1, 1, 1]],
  // O
  [
    [1, 1],
    [1, 1],
  ],
  // T
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  // L
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  // J
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
  // S
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  // Z
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
];

function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomPiece() {
  const shape = tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
  const color = getRandomColor();
  return new Piece(shape, color);
}
