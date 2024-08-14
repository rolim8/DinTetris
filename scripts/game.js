// game.js
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

  // High score (posição abaixo do score)
  ctx.fillText(`High Score: ${highScore}`, 10, 60);
}

function updateScore(linesCleared) {
  // Adiciona 25 pontos por peça que cai
  score += 25;

  // Adiciona pontos baseados no número de linhas limpas
  if (linesCleared > 0) {
    score += linesCleared * 100;
    if (linesCleared > 1) {
      score += (linesCleared - 1) * 100; // Adiciona pontos adicionais para múltiplas linhas
    }
  }

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
}

function merge() {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        board[piece.y + row][piece.x + col] = piece.color;
      }
    }
  }
  removeLines();
}

function removeLines() {
  let linesCleared = 0;

  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every((cell) => cell)) {
      board.splice(row, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
      row++;
    }
  }

  // Atualiza a pontuação com base nas linhas limpas
  updateScore(linesCleared);
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
        ctx.strokeStyle = "#000";
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
  alert("Game Over!");
  board.forEach((row) => row.fill(0));
  score = 0;
  piece = getRandomPiece();
}

document.getElementById("pauseButton").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("pauseButton").textContent = isPaused
    ? "▶️ Resume"
    : "⏸️ Pause";
});

document.getElementById("restartButton").addEventListener("click", () => {
  board.forEach((row) => row.fill(0));
  score = 0;
  piece = getRandomPiece();
  drawScore(); // Atualiza o score na tela
});

document.addEventListener("keydown", (event) => {
  if (isPaused) return;

  switch (event.key) {
    case "ArrowLeft":
      piece.move(-1, 0);
      break;
    case "ArrowRight":
      piece.move(1, 0);
      break;
    case "ArrowDown":
      piece.move(0, 1);
      break;
    case "ArrowUp":
      piece.rotate();
      break;
  }
});

function addMobileControls() {
  const leftButton = document.getElementById("leftButton");
  const rightButton = document.getElementById("rightButton");
  const downButton = document.getElementById("downButton");
  const rotateButton = document.getElementById("rotateButton");

  leftButton.addEventListener("click", () => piece.move(-1, 0));
  rightButton.addEventListener("click", () => piece.move(1, 0));
  downButton.addEventListener("click", () => piece.move(0, 1));
  rotateButton.addEventListener("click", () => piece.rotate());
}

addMobileControls();
update();
