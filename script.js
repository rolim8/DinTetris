const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // Tamanho do bloco
const GAP_SIZE = 2; // Separação entre os blocos

canvas.width = COLS * (BLOCK_SIZE + GAP_SIZE) - GAP_SIZE;
canvas.height = ROWS * (BLOCK_SIZE + GAP_SIZE) - GAP_SIZE;

const colors = ["red", "blue", "green", "yellow", "purple", "cyan", "orange"];

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

class Piece {
  constructor(shape, color) {
    this.shape = shape;
    this.color = color;
    this.x = Math.floor(COLS / 2) - Math.floor(this.shape[0].length / 2);
    this.y = 0;
    this.rotation = 0;
  }

  draw(offsetX = 0, offsetY = 0, shadow = false) {
    for (let row = 0; row < this.shape.length; row++) {
      for (let col = 0; col < this.shape[row].length; col++) {
        if (this.shape[row][col]) {
          ctx.fillStyle = shadow ? "rgba(128, 128, 128, 0.5)" : this.color;
          ctx.fillRect(
            (this.x + col + offsetX) * (BLOCK_SIZE + GAP_SIZE),
            (this.y + row + offsetY) * (BLOCK_SIZE + GAP_SIZE),
            BLOCK_SIZE,
            BLOCK_SIZE
          );
          ctx.strokeStyle = "#000"; // Cor da borda
          ctx.strokeRect(
            (this.x + col + offsetX) * (BLOCK_SIZE + GAP_SIZE),
            (this.y + row + offsetY) * (BLOCK_SIZE + GAP_SIZE),
            BLOCK_SIZE,
            BLOCK_SIZE
          );
        }
      }
    }
  }

  drawShadow() {
    let offsetY = 0;
    while (!this.collides(0, offsetY + 1)) {
      offsetY++;
    }
    this.draw(0, offsetY, true);
  }

  collides(offsetX, offsetY) {
    for (let row = 0; row < this.shape.length; row++) {
      for (let col = 0; col < this.shape[row].length; col++) {
        if (this.shape[row][col]) {
          const newX = this.x + col + offsetX;
          const newY = this.y + row + offsetY;

          if (newX < 0 || newX >= COLS || newY >= ROWS || board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  move(offsetX, offsetY) {
    if (!this.collides(offsetX, offsetY)) {
      this.x += offsetX;
      this.y += offsetY;
      return true;
    }
    return false;
  }

  rotate() {
    const originalShape = this.shape;
    const rotatedShape = this.shape[0]
      .map((_, i) => this.shape.map((row) => row[i]))
      .reverse();

    this.shape = rotatedShape;
    if (this.collides(0, 0)) {
      this.shape = originalShape;
    }
  }
}

const board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let piece = getRandomPiece();
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPaused = false;
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;

function update(time = 0) {
  if (isPaused) {
    requestAnimationFrame(update);
    return;
  }

  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    if (!piece.move(0, 1)) {
      merge();
      piece = getRandomPiece();
      if (piece.collides(0, 0)) {
        endGame();
      }
      // Adiciona 25 pontos por peça que cai
      updateScore(0); // `0` aqui porque já estamos adicionando 25 pontos na função `updateScore`
    }
    dropCounter = 0;
  }

  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  piece.drawShadow();
  piece.draw();
  drawScore();
}

function drawScore() {
  ctx.font = "bold 20px Arial";
  ctx.fillStyle = "white";

  // Pontuação atual
  ctx.fillText(`Score: ${score}`, 10, 30);

  // High score
  ctx.fillText(`High Score: ${highScore}`, 10, 60);
}

function updateScore(linesCleared) {
  let scoreIncrement = 25;

  if (linesCleared > 0) {
    scoreIncrement += linesCleared * 100;
  }

  score += scoreIncrement;
  console.log(`Score Atualizado: ${score}, Incremento: ${scoreIncrement}`);
}

function merge() {
  let linesCleared = 0;
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        board[piece.y + row][piece.x + col] = piece.color;
      }
    }
  }
  linesCleared = clearLines();
  if (linesCleared > 0) {
    updateScore(linesCleared);
  }
}

function clearLines() {
  let linesCleared = 0;
  outer: for (let row = ROWS - 1; row >= 0; row--) {
    for (let col = 0; col < COLS; col++) {
      if (!board[row][col]) {
        continue outer;
      }
    }
    board.splice(row, 1);
    board.unshift(Array(COLS).fill(0));
    linesCleared++;
  }
  return linesCleared;
}

function drawBoard() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col]) {
        ctx.fillStyle = board[row][col];
        ctx.fillRect(
          col * (BLOCK_SIZE + GAP_SIZE),
          row * (BLOCK_SIZE + GAP_SIZE),
          BLOCK_SIZE,
          BLOCK_SIZE
        );
        ctx.strokeStyle = "#000"; // Cor da borda
        ctx.strokeRect(
          col * (BLOCK_SIZE + GAP_SIZE),
          row * (BLOCK_SIZE + GAP_SIZE),
          BLOCK_SIZE,
          BLOCK_SIZE
        );
      }
    }
  }
}

function endGame() {
  // Atualiza o high score se o score atual for maior
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
  resetGame();
}

function resetGame() {
  board.forEach((row) => row.fill(0));
  piece = getRandomPiece();
  score = 0; // Reinicia o score
}

function togglePause() {
  isPaused = !isPaused;
  document.getElementById("pauseButton").textContent = isPaused
    ? "▶️ Resume"
    : "⏸️ Pause";
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    piece.move(-1, 0);
  } else if (event.key === "ArrowRight") {
    piece.move(1, 0);
  } else if (event.key === "ArrowDown") {
    piece.move(0, 1);
  } else if (event.key === "ArrowUp") {
    piece.rotate();
  } else if (event.key === "p") {
    togglePause();
  }
});

document.getElementById("pauseButton").addEventListener("click", togglePause);
document.getElementById("restartButton").addEventListener("click", resetGame);

update();
