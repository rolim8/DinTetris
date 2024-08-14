// piece.js
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
