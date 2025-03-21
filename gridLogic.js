// Grid manipulation logic extracted from game.js
import config from './config.js';

class GridLogic {
  constructor(game) {
    this.game = game;
    this.mainGrid = document.getElementById('main-grid');
    this.config = config;
  }
  
  initGrid() {
    if (!this.mainGrid) {
      console.error('Main grid element not found');
      return;
    }
    
    const cellSize = 100 / this.config.gridSize; // percentage
    
    // Create cells
    for (let y = 0; y < this.config.gridSize; y++) {
      for (let x = 0; x < this.config.gridSize; x++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.style.width = `${cellSize}%`;
        cell.style.height = `${cellSize}%`;
        cell.style.left = `${x * cellSize}%`;
        cell.style.top = `${y * cellSize}%`;
        this.mainGrid.appendChild(cell);
      }
    }
    
    // Set up drag and drop for the grid
    this.mainGrid.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.game.gameActive && this.game.currentBlock) {
        const rect = this.mainGrid.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / (rect.width / this.config.gridSize));
        const y = Math.floor((e.clientY - rect.top) / (rect.height / this.config.gridSize));
        
        this.updateBlockPlaceholder(x, y);
      }
    });
    
    this.mainGrid.addEventListener('drop', (e) => {
      e.preventDefault();
      if (this.game.gameActive && this.game.currentBlock) {
        const rect = this.mainGrid.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / (rect.width / this.config.gridSize));
        const y = Math.floor((e.clientY - rect.top) / (rect.height / this.config.gridSize));
        
        if (this.placeBlock(x, y)) {
          // Play sound effect
          if (this.game.soundManager) {
            this.game.soundManager.play('place');
          }
          
          // Trigger vibration if enabled
          if (this.game.settingsManager && this.game.settingsManager.settings.vibration) {
            if (navigator.vibrate) {
              navigator.vibrate(50);
            }
          }
          
          // Track statistics
          if (this.game.statisticsManager) {
            this.game.statisticsManager.stats.totalBlocksPlaced++;
            this.game.statisticsManager.saveStats();
          }
        } else if (this.game.soundManager) {
          this.game.soundManager.play('invalid');
        }
      }
    });
    
    // Remove placeholders when drag leaves
    this.mainGrid.addEventListener('dragleave', () => {
      if (this.game.gameActive) {
        this.clearPlaceholders();
      }
    });
    
    // Double-click to rotate block
    this.mainGrid.addEventListener('dblclick', (e) => {
      if (this.game.gameActive && this.game.currentBlock) {
        this.rotateCurrentBlock();
        
        // Update placeholder after rotation
        const rect = this.mainGrid.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / (rect.width / this.config.gridSize));
        const y = Math.floor((e.clientY - rect.top) / (rect.height / this.config.gridSize));
        
        this.updateBlockPlaceholder(x, y);
      }
    });
  }
  
  updateBlockPlaceholder(gridX, gridY) {
    this.clearPlaceholders();
    
    if (!this.game.currentBlock) return;
    
    const shape = this.game.currentBlock.shape;
    const isValid = this.isValidPlacement(gridX, gridY, shape);
    
    const cellSize = 100 / this.config.gridSize; // percentage
    
    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const posX = gridX + x;
          const posY = gridY + y;
          
          if (posX >= 0 && posX < this.config.gridSize && posY >= 0 && posY < this.config.gridSize) {
            const placeholder = document.createElement('div');
            placeholder.className = `block block-${this.game.currentBlock.color} block-placeholder ${isValid ? 'block-valid' : 'block-invalid'}`;
            placeholder.style.width = `${cellSize}%`;
            placeholder.style.height = `${cellSize}%`;
            placeholder.style.left = `${posX * cellSize}%`;
            placeholder.style.top = `${posY * cellSize}%`;
            this.mainGrid.appendChild(placeholder);
          }
        }
      });
    });
  }
  
  clearPlaceholders() {
    const placeholders = this.mainGrid.querySelectorAll('.block-placeholder');
    placeholders.forEach(p => p.remove());
  }
  
  isValidPlacement(gridX, gridY, shape) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const posX = gridX + x;
          const posY = gridY + y;
          
          // Check bounds
          if (posX < 0 || posX >= this.config.gridSize || posY < 0 || posY >= this.config.gridSize) {
            return false;
          }
          
          // Check if cell is already occupied
          if (this.game.grid[posY][posX]) {
            return false;
          }
        }
      }
    }
    return true;
  }
  
  placeBlock(gridX, gridY) {
    if (!this.game.currentBlock) return false;
    
    const shape = this.game.currentBlock.shape;
    
    if (this.isValidPlacement(gridX, gridY, shape)) {
      // Place the block on the grid
      shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const posX = gridX + x;
            const posY = gridY + y;
            
            this.game.grid[posY][posX] = {
              color: this.game.currentBlock.color
            };
          }
        });
      });
      
      // Update the grid display
      this.renderGrid();
      
      // Check for completed lines
      this.checkCompletedLines();
      
      // Get next block
      this.game.createBlock();
      
      // Update presence with new grid
      this.game.room.updatePresence({
        grid: this.game.grid
      });
      
      return true;
    }
    
    return false;
  }
  
  renderGrid() {
    // Remove all existing blocks
    const blocks = this.mainGrid.querySelectorAll('.block:not(.block-placeholder)');
    blocks.forEach(b => b.remove());
    
    // Add blocks based on grid state
    const cellSize = 100 / this.config.gridSize; // percentage
    
    for (let y = 0; y < this.game.grid.length; y++) {
      for (let x = 0; x < this.game.grid[y].length; x++) {
        if (this.game.grid[y][x]) {
          const block = document.createElement('div');
          block.className = `block block-${this.game.grid[y][x].color}`;
          block.style.width = `${cellSize}%`;
          block.style.height = `${cellSize}%`;
          block.style.left = `${x * cellSize}%`;
          block.style.top = `${y * cellSize}%`;
          this.mainGrid.appendChild(block);
        }
      }
    }
  }
  
  checkCompletedLines() {
    const completedRows = [];
    const completedCols = [];
    
    // Check rows
    for (let y = 0; y < this.config.gridSize; y++) {
      let rowComplete = true;
      for (let x = 0; x < this.config.gridSize; x++) {
        if (!this.game.grid[y][x]) {
          rowComplete = false;
          break;
        }
      }
      if (rowComplete) {
        completedRows.push(y);
      }
    }
    
    // Check columns
    for (let x = 0; x < this.config.gridSize; x++) {
      let colComplete = true;
      for (let y = 0; y < this.config.gridSize; y++) {
        if (!this.game.grid[y][x]) {
          colComplete = false;
          break;
        }
      }
      if (colComplete) {
        completedCols.push(x);
      }
    }
    
    const totalCompleted = completedRows.length + completedCols.length;
    
    if (totalCompleted > 0) {
      // Show the animation for completed lines
      this.animateLineClears(completedRows, completedCols);
      
      // Calculate score
      let scoreToAdd = 0;
      
      if (totalCompleted === 1) {
        scoreToAdd = this.config.scoring.oneLine;
      } else if (totalCompleted === 2) {
        scoreToAdd = this.config.scoring.twoLines;
      } else if (totalCompleted === 3) {
        scoreToAdd = this.config.scoring.threeLines;
      } else {
        scoreToAdd = this.config.scoring.fourPlusLines + (totalCompleted - 4) * this.config.scoring.additionalLine;
      }
      
      // Apply score multiplier if active
      scoreToAdd *= this.game.scoreMultiplier;
      
      // Update score
      this.game.updateScore(scoreToAdd, totalCompleted);
      
      // Play sound effect
      if (this.game.soundManager) {
        this.game.soundManager.play('clear');
        
        // Play special sound for high-value clears
        if (totalCompleted >= 3) {
          this.game.soundManager.play('score');
        }
      }
      
      // Track statistics
      if (this.game.statisticsManager) {
        this.game.statisticsManager.stats.totalLinesCleared += totalCompleted;
        this.game.statisticsManager.saveStats();
      }
      
      // After animation, clear the lines
      setTimeout(() => {
        this.clearLines(completedRows, completedCols);
      }, 300);
      
      return totalCompleted;
    }
    
    return 0;
  }
  
  animateLineClears(rows, cols) {
    const cellSize = 100 / this.config.gridSize;
    
    // Animate rows
    rows.forEach(y => {
      for (let x = 0; x < this.config.gridSize; x++) {
        const block = document.createElement('div');
        block.className = 'block line-clear';
        block.style.width = `${cellSize}%`;
        block.style.height = `${cellSize}%`;
        block.style.left = `${x * cellSize}%`;
        block.style.top = `${y * cellSize}%`;
        this.mainGrid.appendChild(block);
      }
    });
    
    // Animate columns
    cols.forEach(x => {
      for (let y = 0; y < this.config.gridSize; y++) {
        const block = document.createElement('div');
        block.className = 'block line-clear';
        block.style.width = `${cellSize}%`;
        block.style.height = `${cellSize}%`;
        block.style.left = `${x * cellSize}%`;
        block.style.top = `${y * cellSize}%`;
        this.mainGrid.appendChild(block);
      }
    });
  }
  
  clearLines(rows, cols) {
    // Clear rows
    rows.forEach(y => {
      for (let x = 0; x < this.config.gridSize; x++) {
        this.game.grid[y][x] = 0;
      }
    });
    
    // Clear columns
    cols.forEach(x => {
      for (let y = 0; y < this.config.gridSize; y++) {
        this.game.grid[y][x] = 0;
      }
    });
    
    // Update grid display
    this.renderGrid();
    
    // Update presence with new grid
    this.game.room.updatePresence({
      grid: this.game.grid
    });
  }
  
  rotateCurrentBlock() {
    if (!this.game.currentBlock) return;
    
    // Get current shape
    const shape = this.game.currentBlock.shape;
    
    // Calculate dimensions of current shape
    const rows = shape.length;
    const cols = shape[0].length;
    
    // Create new rotated shape
    const rotatedShape = [];
    for (let i = 0; i < cols; i++) {
      rotatedShape[i] = [];
      for (let j = 0; j < rows; j++) {
        rotatedShape[i][j] = shape[rows - j - 1][i];
      }
    }
    
    // Update the current block's shape
    this.game.currentBlock.shape = rotatedShape;
    
    // Re-render the block in the next block display
    this.game.displayNextBlock();
    
    // Play rotation sound
    if (this.game.soundManager) {
      this.game.soundManager.play('place');
    }
  }

}

export default GridLogic;