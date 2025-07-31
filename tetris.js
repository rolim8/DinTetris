// Tetris pieces (Tetrominoes) with Pokémon colors
const PIECES = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: "#ff6b35",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#ffcb05",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "#3b4cca",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "#4caf50",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "#f44336",
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "#9c27b0",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "#ff9800",
  },
};

const COLS = 10;
const ROWS = 20;

class TetrisGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.nextCanvas = document.getElementById("nextCanvas");
    this.nextCtx = this.nextCanvas.getContext("2d");

    // Add null checks
    if (!this.canvas || !this.ctx || !this.nextCanvas || !this.nextCtx) {
      console.error("Canvas elements not found");
      return;
    }

    // Initialize properties before resize
    this.BLOCK_SIZE = 30;
    this.board = Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(0));
    this.currentPiece = null;
    this.nextPiece = null;
    this.floatingTexts = [];
    this.shadowEnabled = true; // Add shadow toggle

    // Then resize
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    // Initialize game state
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = 1000;
    this.lastDropTime = 0;
    this.gameRunning = false;
    this.paused = false;
    this.speedIncreaseInterval = 500;
    this.speedIncrement = 0.15;
    this.baseDropInterval = 1000;

    this.initializeGame();
    this.setupEventListeners();

    // Load ranking on init
    this.loadRanking();
  }

  resizeCanvas() {
    if (!this.canvas || !this.ctx) return;

    const containerWidth = Math.min(300, window.innerWidth * 0.8);
    const containerHeight = Math.min(600, window.innerHeight * 0.8);

    // Maintain aspect ratio
    const aspectRatio = 10 / 20; // COLS / ROWS
    const calculatedHeight = containerWidth / aspectRatio;

    if (calculatedHeight <= containerHeight) {
      this.canvas.width = containerWidth;
      this.canvas.height = calculatedHeight;
    } else {
      this.canvas.height = containerHeight;
      this.canvas.width = containerHeight * aspectRatio;
    }

    this.BLOCK_SIZE = this.canvas.width / COLS;
    if (this.ctx) {
      this.draw();
    }
  }

  initializeGame() {
    this.generateNextPiece();
    this.spawnPiece();
    this.updateDisplay();
  }

  generateNextPiece() {
    const pieces = Object.keys(PIECES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    this.nextPiece = {
      shape: PIECES[randomPiece].shape,
      color: PIECES[randomPiece].color,
      x: 0,
      y: 0,
    };
  }

  spawnPiece() {
    if (!this.nextPiece) {
      this.generateNextPiece();
    }

    this.currentPiece = this.nextPiece;
    this.generateNextPiece();

    if (!this.currentPiece) return;

    this.currentPiece.x =
      Math.floor(COLS / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
    this.currentPiece.y = 0;

    if (this.checkCollision(this.currentPiece)) {
      this.gameOver();
    }
  }

  draw() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate block size based on canvas size
    const blockSize = this.canvas.width / COLS;

    // Draw board
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (this.board[y] && this.board[y][x]) {
          this.drawBlock(this.ctx, x, y, this.board[y][x], blockSize);
        }
      }
    }

    // Draw shadow
    if (this.currentPiece && this.gameRunning && this.shadowEnabled) {
      this.drawShadow();
    }

    // Draw current piece
    if (this.currentPiece) {
      this.drawPiece(this.currentPiece, blockSize);
    }

    // Draw grid
    this.drawGrid(blockSize);

    // Draw next piece
    this.drawNextPiece();

    this.drawFloatingTexts();
  }

  drawFloatingTexts() {
    const blockSize = this.canvas.width / COLS;
    const ctx = this.ctx;
    this.floatingTexts.forEach((ft, index) => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `${ft.size}px 'Press Start 2P'`;
      ctx.textAlign = "center";
      ctx.fillText(
        ft.text,
        ft.x * blockSize + blockSize / 2,
        ft.y * blockSize - ft.offset
      );
      ctx.restore();
    });
  }

  addFloatingText(x, y, text, color = "#ffcb05", size = 12) {
    this.floatingTexts.push({ x, y, text, color, size, offset: 0, alpha: 1 });
    const index = this.floatingTexts.length - 1;
    const animate = () => {
      this.floatingTexts[index].offset += 1;
      this.floatingTexts[index].alpha -= 0.02;
      if (this.floatingTexts[index].alpha <= 0) {
        this.floatingTexts.splice(index, 1);
      }
    };
    const interval = setInterval(animate, 30);
    setTimeout(() => clearInterval(interval), 1500);
  }

  drawBlock(ctx, x, y, color, size = this.BLOCK_SIZE) {
    ctx.fillStyle = color;
    ctx.fillRect(x * size, y * size, size, size);

    // Add pixel art style border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = Math.max(1, size * 0.02);
    ctx.strokeRect(x * size, y * size, size, size);

    // Add highlight
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = Math.max(1, size * 0.01);
    const offset = Math.max(1, size * 0.05);
    ctx.strokeRect(
      x * size + offset,
      y * size + offset,
      size - offset * 2,
      size - offset * 2
    );
  }

  drawPiece(piece, blockSize) {
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          this.drawBlock(
            this.ctx,
            piece.x + x,
            piece.y + y,
            piece.color,
            blockSize
          );
        }
      });
    });
  }

  drawNextPiece() {
    if (!this.nextCtx || !this.nextCanvas) return;

    this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

    const canvasSize = Math.min(this.nextCanvas.width, this.nextCanvas.height);
    const blockSize = Math.min(20, canvasSize / 6);

    if (!this.nextPiece) return;

    const offsetX =
      (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
    const offsetY =
      (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;

    this.nextPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          this.nextCtx.fillStyle = this.nextPiece.color;
          this.nextCtx.fillRect(
            offsetX + x * blockSize,
            offsetY + y * blockSize,
            blockSize,
            blockSize
          );

          this.nextCtx.strokeStyle = "#000";
          this.nextCtx.lineWidth = 1;
          this.nextCtx.strokeRect(
            offsetX + x * blockSize,
            offsetY + y * blockSize,
            blockSize,
            blockSize
          );
        }
      });
    });
  }

  drawGrid(blockSize) {
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= COLS; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * blockSize, 0);
      this.ctx.lineTo(x * blockSize, ROWS * blockSize);
      this.ctx.stroke();
    }

    for (let y = 0; y <= ROWS; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * blockSize);
      this.ctx.lineTo(COLS * blockSize, y * blockSize);
      this.ctx.stroke();
    }
  }

  checkCollision(piece, dx = 0, dy = 0) {
    if (!piece || !piece.shape) return true;

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + dx;
          const newY = piece.y + y + dy;

          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }

          if (newY >= 0 && this.board[newY] && this.board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  rotatePiece() {
    const rotated = this.currentPiece.shape[0].map((_, index) =>
      this.currentPiece.shape.map((row) => row[index]).reverse()
    );

    const previousShape = this.currentPiece.shape;
    this.currentPiece.shape = rotated;

    if (this.checkCollision(this.currentPiece)) {
      this.currentPiece.shape = previousShape;
    }
  }

  movePiece(dx, dy) {
    if (!this.checkCollision(this.currentPiece, dx, dy)) {
      this.currentPiece.x += dx;
      this.currentPiece.y += dy;
      return true;
    }
    return false;
  }

  dropPiece() {
    if (!this.movePiece(0, 1)) {
      this.lockPiece();
      const cleared = this.clearLines();
      this.spawnPiece();
      if (!cleared) {
        this.addFloatingText(
          this.currentPiece.x + 1,
          this.currentPiece.y - 1,
          "+2",
          "#cccccc"
        );
      }
    }
  }

  hardDrop() {
    while (this.movePiece(0, 1)) {
      this.score += 2;
    }
  }

  lockPiece() {
    if (!this.currentPiece) return;

    this.currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const boardX = this.currentPiece.x + x;
          const boardY = this.currentPiece.y + y;

          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            this.board[boardY][boardX] = this.currentPiece.color;
          }
        }
      });
    });
  }

  clearLines() {
    let linesCleared = 0;
    const clearedRows = [];
    for (let y = ROWS - 1; y >= 0; y--) {
      if (this.board[y] && this.board[y].every((cell) => cell !== 0)) {
        clearedRows.push(y);
        this.board.splice(y, 1);
        this.board.unshift(Array(COLS).fill(0));
        linesCleared++;
        y++;
      }
    }
    if (linesCleared > 0) {
      this.lines += linesCleared;
      const points = this.calculateScore(linesCleared);
      this.score += points;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(
        100,
        this.baseDropInterval - (this.level - 1) * 50
      );
      // show floating text
      const centerY = Math.min(...clearedRows);
      const centerX = COLS / 2;
      this.addFloatingText(centerX, centerY, `+${points}`, "#ffcb05");
      // Trigger line-clear animation
      this.animateLineClear(clearedRows);
      return true;
    }
    return false;
  }

  animateLineClear(rows) {
    const blockSize = this.canvas.width / COLS;
    const originalBoard = this.board.map((row) => [...row]);

    // Create a temporary overlay for the flashing effect
    const flashColor = "#ffffff";
    const flashDuration = 200; // ms
    const repeatCount = 3;

    let flash = 0;
    const animate = () => {
      this.ctx.save();

      // Draw the flashing rows
      rows.forEach((y) => {
        for (let x = 0; x < COLS; x++) {
          const alpha = flash % 2 === 0 ? 0.6 : 0;
          this.ctx.fillStyle =
            flashColor +
            Math.floor(alpha * 255)
              .toString(16)
              .padStart(2, "0");
          this.ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
        }
      });

      this.ctx.restore();

      flash++;
      if (flash < repeatCount * 2) {
        setTimeout(animate, flashDuration);
      }
    };

    animate();
  }

  calculateScore(lines) {
    const points = [0, 40, 100, 300, 1200];
    const newPoints = points[lines] * this.level;

    // Check if we should increase speed
    const oldCheckpoints = Math.floor(this.score / this.speedIncreaseInterval);
    this.score += newPoints;
    const newCheckpoints = Math.floor(this.score / this.speedIncreaseInterval);

    if (newCheckpoints > oldCheckpoints) {
      // Increase speed by 0.15 for every 500 points milestone
      const speedMultiplier = 1 + newCheckpoints * this.speedIncrement;
      this.dropInterval = Math.max(
        100,
        this.baseDropInterval / speedMultiplier
      );
    }

    return newPoints;
  }

  updateDisplay() {
    document.getElementById("score").textContent = this.score;
    document.getElementById("lines").textContent = this.lines;
    document.getElementById("level").textContent = this.level;
  }

  gameOver() {
    this.gameRunning = false;
    document.getElementById("finalScore").textContent = this.score;
    document.getElementById("gameOver").classList.remove("hidden");

    // Save score to ranking
    this.saveScore(this.score);
  }

  saveScore(score) {
    const scores = JSON.parse(localStorage.getItem("tetrisRanking") || "[]");
    scores.push({ score, date: new Date().toISOString() });
    scores.sort((a, b) => b.score - a.score);
    scores.splice(10); // Keep only top 10
    localStorage.setItem("tetrisRanking", JSON.stringify(scores));
    this.loadRanking();
  }

  loadRanking() {
    const scores = JSON.parse(localStorage.getItem("tetrisRanking") || "[]");
    const rankingList = document.getElementById("rankingList");

    if (scores.length === 0) {
      rankingList.innerHTML = "<p>No scores yet!</p>";
      return;
    }

    rankingList.innerHTML = scores
      .map(
        (entry, index) => `
                <div class="ranking-item">
                    <span>
                        <span class="ranking-rank">#${index + 1}</span>
                        <span class="ranking-score">${entry.score}</span>
                    </span>
                </div>
            `
      )
      .join("");
  }

  setupEventListeners() {
    // Add null checks for all elements
    const infoIcon = document.getElementById("infoIcon");
    const rankingIcon = document.getElementById("rankingIcon");
    const playPauseBtn = document.getElementById("playPauseBtn");
    const resetBtn = document.getElementById("resetBtn");
    const restartBtn = document.getElementById("restartBtn");

    document.addEventListener("keydown", (e) => {
      if (!this.gameRunning || this.paused) return;

      switch (e.code) {
        case "ArrowLeft":
          e.preventDefault();
          this.movePiece(-1, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          this.movePiece(1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          if (this.movePiece(0, 1)) {
            this.score += 1;
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          this.rotatePiece();
          break;
        case "Space":
          e.preventDefault();
          this.hardDrop();
          break;
        case "KeyP":
          e.preventDefault();
          this.togglePause();
          break;
        case "KeyG":
          e.preventDefault();
          this.toggleShadow();
          break;
      }
    });

    if (infoIcon) {
      infoIcon.addEventListener("click", () => {
        const popup = document.getElementById("infoPopup");
        const rankingPopup = document.getElementById("rankingPopup");
        if (popup) popup.classList.toggle("hidden");
        if (rankingPopup) rankingPopup.classList.add("hidden");
      });
    }

    if (rankingIcon) {
      rankingIcon.addEventListener("click", () => {
        const rankingPopup = document.getElementById("rankingPopup");
        const infoPopup = document.getElementById("infoPopup");
        if (rankingPopup) rankingPopup.classList.toggle("hidden");
        if (infoPopup) infoPopup.classList.add("hidden");
        this.loadRanking();
      });
    }

    if (playPauseBtn) {
      playPauseBtn.addEventListener("click", () => {
        if (!this.gameRunning) {
          this.startGame();
        } else {
          this.togglePause();
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetGame();
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        this.resetGame();
        const gameOverModal = document.getElementById("gameOver");
        if (gameOverModal) gameOverModal.classList.add("hidden");
      });
    }
  }

  toggleShadow() {
    this.shadowEnabled = !this.shadowEnabled;
    const btn = document.getElementById("toggleShadowBtn");
    btn.textContent = this.shadowEnabled ? "👻 Ghost: ON" : "👻 Ghost: OFF";
    this.draw();
  }

  startGame() {
    this.gameRunning = true;
    this.paused = false;
    document.getElementById("playPauseBtn").textContent = "Pause";
    this.gameLoop();
  }

  togglePause() {
    this.paused = !this.paused;
    document.getElementById("playPauseBtn").textContent = this.paused
      ? "Resume"
      : "Pause";
  }

  resetGame() {
    this.board = Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(0));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = 1000;
    this.lastDropTime = 0;
    this.gameRunning = false;
    this.paused = false;

    document.getElementById("gameOver").classList.add("hidden");
    document.getElementById("playPauseBtn").textContent = "Play";

    this.initializeGame();
    this.draw();
  }

  gameLoop() {
    if (!this.gameRunning) return;

    const now = Date.now();

    if (!this.paused && now - this.lastDropTime > this.dropInterval) {
      this.dropPiece();
      this.lastDropTime = now;
    }

    this.updateDisplay();
    this.draw();

    requestAnimationFrame(() => this.gameLoop());
  }

  drawShadow() {
    const shadowY = this.getShadowY();
    const blockSize = this.canvas.width / COLS;

    this.currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const drawX = (this.currentPiece.x + x) * blockSize;
          const drawY = (shadowY + y) * blockSize;

          // Draw shadow with transparency
          this.ctx.fillStyle = this.currentPiece.color + "40";
          this.ctx.fillRect(drawX, drawY, blockSize, blockSize);

          // Draw dotted outline
          this.ctx.strokeStyle = this.currentPiece.color + "80";
          this.ctx.lineWidth = 1;
          this.ctx.setLineDash([2, 2]);
          this.ctx.strokeRect(drawX, drawY, blockSize, blockSize);
          this.ctx.setLineDash([]);
        }
      });
    });
  }

  getShadowY() {
    let shadowY = this.currentPiece.y;
    while (
      !this.checkCollision(
        this.currentPiece,
        0,
        shadowY - this.currentPiece.y + 1
      )
    ) {
      shadowY++;
    }
    return shadowY;
  }
}

// Initialize the game
const game = new TetrisGame();
game.draw();
