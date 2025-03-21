import config from './config.js';
import GridLogic from './gridLogic.js';
import MultiplayerManager from './multiplayerManager.js';
import Router from './router.js';
import RoomManager from './roomManager.js';
import SoundManager from './soundManager.js';
import AchievementManager from './achievements.js';
import StatisticsManager from './statistics.js';
import SettingsManager from './settingsManager.js';

class BlockBlast {
  constructor() {
    this.gridLogic = null;
    this.multiplayerManager = null;
    this.roomManager = null;
    this.soundManager = null;
    this.achievementManager = null;
    this.statisticsManager = null;
    this.settingsManager = null;
    
    // Game elements
    this.mainGrid = document.getElementById('main-grid');
    this.opponentsGrids = document.getElementById('opponents-grids');
    this.opponentsArea = document.getElementById('opponents-area');
    this.leaderboardEntries = document.getElementById('leaderboard-entries');
    this.nextBlockDisplay = document.getElementById('next-block');
    this.scoreDisplay = document.getElementById('player-score');
    this.timerDisplay = document.getElementById('timer');
    this.startGameButton = document.getElementById('start-game');
    this.usernameDisplay = document.getElementById('username-display');
    this.avatarDisplay = document.getElementById('avatar-display');
    this.rotateBlockBtn = document.getElementById('rotate-block-button');
    
    // Game state
    this.playerScore = 0;
    this.grid = Array(config.gridSize).fill().map(() => Array(config.gridSize).fill(0));
    this.blockBag = [];
    this.currentBlock = null;
    this.gameActive = false;
    this.timeRemaining = config.gameTime;
    this.timerInterval = null;
    this.scoreMultiplier = 1;
    this.config = config;
    this.currentRoom = null;
    this.totalLinesCleared = 0;
    this.blocksPlaced = 0;
    this.gameStartTime = 0;
    
    // Room for multiplayer
    this.room = null;
    
    // Initialize additional managers
    this.initManagers();
  }
  
  initManagers() {
    // Initialize statistics manager first (needed by other managers)
    this.statisticsManager = new StatisticsManager();
    
    // Initialize sound manager
    this.soundManager = new SoundManager();
    
    // Initialize achievement manager
    this.achievementManager = new AchievementManager(this);
  }
  
  resetGame() {
    // Reset game state
    this.playerScore = 0;
    this.scoreDisplay.textContent = '0';
    this.grid = Array(this.config.gridSize).fill().map(() => Array(this.config.gridSize).fill(0));
    this.gameActive = true;
    this.timeRemaining = this.config.gameTime;
    this.updateTimerDisplay();
    this.scoreMultiplier = 1;
    this.totalLinesCleared = 0;
    this.blocksPlaced = 0;
    this.gameStartTime = Date.now();
    
    // Clear grid and regenerate blocks
    if (this.gridLogic) {
      this.gridLogic.renderGrid();
      this.createBlock();
    }
    
    // Update presence
    if (this.room) {
      this.room.updatePresence({
        score: 0,
        grid: this.grid,
        ready: false
      });
    }
    
    // Start game music
    if (this.soundManager) {
      this.soundManager.play('background');
    }
    
    // Unlock first game achievement
    if (this.achievementManager) {
      this.achievementManager.unlockAchievement("firstGame");
    }
  }
  
  startTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();
      
      // Check for special events
      if (this.config.enableSpecialEvents && Math.random() < this.config.specialEventProbability) {
        this.triggerRandomSpecialEvent();
      }
      
      if (this.timeRemaining <= 0) {
        this.endGame();
      }
    }, 1000);
  }
  
  updateTimerDisplay() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    this.timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    // Add warning animation when time is almost up
    if (this.timeRemaining <= 10) {
      this.timerDisplay.classList.add('time-warning');
    } else {
      this.timerDisplay.classList.remove('time-warning');
    }
  }
  
  endGame() {
    clearInterval(this.timerInterval);
    this.gameActive = false;
    
    // Stop game music
    if (this.soundManager) {
      this.soundManager.stop('background');
      this.soundManager.play('gameOver');
    }
    
    // Calculate time played
    const timePlayed = (Date.now() - this.gameStartTime) / 1000;
    
    // Check for win condition
    let won = false;
    if (this.room && this.room.presence) {
      const playerScores = Object.entries(this.room.presence)
        .map(([clientId, data]) => ({ clientId, score: data.score || 0 }))
        .sort((a, b) => b.score - a.score);
      
      // Check if this player has the highest score
      won = playerScores.length > 0 && playerScores[0].clientId === this.room.clientId;
      
      // Unlock achievement if won
      if (won && this.achievementManager) {
        this.achievementManager.unlockAchievement("winGame");
      }
    }
    
    // Record game statistics
    if (this.statisticsManager) {
      this.statisticsManager.recordGamePlayed(
        this.playerScore,
        won,
        this.totalLinesCleared,
        this.blocksPlaced,
        timePlayed
      );
    }
    
    // Check score achievements
    if (this.achievementManager) {
      this.achievementManager.checkGameProgress();
    }
    
    // Update room state to reflect game ended
    if (this.room && this.roomManager && this.roomManager.isHost) {
      this.room.updateRoomState({
        gameActive: false,
        gameEnded: true
      });
    }
  }
  
  updateScore(points, linesCleared) {
    this.playerScore += points;
    this.scoreDisplay.textContent = this.playerScore;
    this.totalLinesCleared += linesCleared;
    
    // Show score popup
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${points}`;
    popup.style.left = `${Math.random() * 50 + 25}%`;
    popup.style.top = `${Math.random() * 50 + 25}%`;
    this.mainGrid.appendChild(popup);
    
    setTimeout(() => {
      popup.remove();
    }, 1000);
    
    // Update presence with new score
    if (this.room) {
      this.room.updatePresence({
        score: this.playerScore
      });
    }
    
    // Check achievements
    if (this.achievementManager) {
      if (this.playerScore >= 100) {
        this.achievementManager.unlockAchievement("scoreHundred");
      }
      
      if (this.playerScore >= 1000) {
        this.achievementManager.unlockAchievement("scoreThousand");
      }
      
      if (this.totalLinesCleared >= 10) {
        this.achievementManager.unlockAchievement("clearTenLines");
      }
    }
  }
  
  createBlock() {
    // Check if we need to refill the bag
    if (this.blockBag.length === 0) {
      // Create a new bag with one of each block type
      this.config.blockTypes.forEach(blockType => {
        this.blockBag.push({
          name: blockType.name,
          color: blockType.color,
          shape: JSON.parse(JSON.stringify(blockType.shape)) // Deep copy
        });
      });
      
      // Shuffle the bag
      for (let i = this.blockBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.blockBag[i], this.blockBag[j]] = [this.blockBag[j], this.blockBag[i]];
      }
    }
    
    // Get the next block from the bag
    this.currentBlock = this.blockBag.pop();
    
    // Display the block in the next block area
    this.displayNextBlock();
  }
  
  displayNextBlock() {
    // Clear previous block
    this.nextBlockDisplay.innerHTML = '';
    
    if (!this.currentBlock) return;
    
    const blockSize = 20; // Size in pixels
    const shape = this.currentBlock.shape;
    
    // Calculate block dimensions
    const blockWidth = shape[0].length;
    const blockHeight = shape.length;
    
    // Calculate container dimensions
    const containerWidth = blockWidth * blockSize;
    const containerHeight = blockHeight * blockSize;
    
    // Center the block in the container
    const leftOffset = (100 - containerWidth) / 2;
    const topOffset = (100 - containerHeight) / 2;
    
    // Create the block elements
    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const block = document.createElement('div');
          block.className = `block block-${this.currentBlock.color}`;
          
          // Apply current block style if settings are available
          if (this.settingsManager && this.settingsManager.settings.blockStyle !== 'default') {
            block.classList.add(`style-${this.settingsManager.settings.blockStyle}`);
          }
          
          block.style.width = `${blockSize}px`;
          block.style.height = `${blockSize}px`;
          block.style.left = `${leftOffset + x * blockSize}px`;
          block.style.top = `${topOffset + y * blockSize}px`;
          this.nextBlockDisplay.appendChild(block);
        }
      });
    });
    
    // Make the block draggable
    this.nextBlockDisplay.setAttribute('draggable', 'true');
    
    this.nextBlockDisplay.addEventListener('dragstart', (e) => {
      if (this.gameActive) {
        e.dataTransfer.setData('text/plain', 'dragging-block');
      } else {
        e.preventDefault();
      }
    });
  }
  
  triggerRandomSpecialEvent() {
    // Don't trigger events if disabled
    if (!this.config.enableSpecialEvents) return;
    
    // Get all enabled special events
    const enabledEvents = Object.entries(this.config.specialEvents)
      .filter(([_, config]) => config.enabled)
      .map(([type, _]) => type);
    
    if (enabledEvents.length === 0) return;
    
    // Pick a random event type
    const eventType = enabledEvents[Math.floor(Math.random() * enabledEvents.length)];
    
    // Create event object
    const event = {
      type: eventType,
      ...this.config.specialEvents[eventType]
    };
    
    // Trigger the event
    this.handleSpecialEvent(event);
    
    // If in multiplayer, broadcast the event
    if (this.room && this.roomManager && this.roomManager.isHost) {
      this.room.updateRoomState({
        specialEvent: event
      });
    }
  }
  
  handleSpecialEvent(event) {
    // Handle different types of special events
    switch (event.type) {
      case 'scoreMultiplier':
        this.applyScoreMultiplier(event.multiplier, event.duration);
        break;
      case 'gridShuffle':
        this.shuffleGrid();
        break;
      case 'blockSwap':
        this.handleBlockSwap();
        break;
      case 'extraTime':
        this.addExtraTime(event.time);
        break;
      case 'rainbowBlock':
        this.createRainbowBlock();
        break;
    }
  }
  
  applyScoreMultiplier(multiplier, duration) {
    this.scoreMultiplier = multiplier;
    
    // Visual indicator
    const multiplierDisplay = document.createElement('div');
    multiplierDisplay.className = 'multiplier-display';
    multiplierDisplay.textContent = `${multiplier}x Score!`;
    document.body.appendChild(multiplierDisplay);
    
    // Play sound effect
    if (this.soundManager) {
      this.soundManager.play('score');
    }
    
    setTimeout(() => {
      this.scoreMultiplier = 1;
      multiplierDisplay.remove();
    }, duration * 1000);
  }
  
  shuffleGrid() {
    // Get all occupied positions
    const occupied = [];
    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[y].length; x++) {
        if (this.grid[y][x]) {
          occupied.push({
            x,
            y,
            color: this.grid[y][x].color
          });
        }
      }
    }
    
    // Clear the grid
    this.grid = Array(this.config.gridSize).fill().map(() => Array(this.config.gridSize).fill(0));
    
    // Randomly place occupied positions
    while (occupied.length > 0) {
      const index = Math.floor(Math.random() * occupied.length);
      const block = occupied.splice(index, 1)[0];
      
      // Find a new random position
      let newX, newY;
      do {
        newX = Math.floor(Math.random() * this.config.gridSize);
        newY = Math.floor(Math.random() * this.config.gridSize);
      } while (this.grid[newY][newX]);
      
      // Place the block
      this.grid[newY][newX] = { color: block.color };
    }
    
    // Update grid display
    if (this.gridLogic) {
      this.gridLogic.renderGrid();
    }
    
    // Play sound effect
    if (this.soundManager) {
      this.soundManager.play('clear');
    }
    
    // Show notification
    this.showEventNotification('Grid Shuffled!', '🔄');
    
    // Update presence with new grid
    if (this.room) {
      this.room.updatePresence({
        grid: this.grid
      });
    }
  }
  
  handleBlockSwap() {
    // If not in multiplayer, just get a new block
    if (!this.room) {
      this.createBlock();
      return;
    }
    
    // Find another player to swap with
    const otherPlayers = Object.keys(this.room.presence).filter(id => id !== this.room.clientId);
    
    if (otherPlayers.length === 0) {
      this.createBlock();
      return;
    }
    
    // Pick a random player
    const targetPlayerId = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
    
    // Request a block swap
    this.room.requestPresenceUpdate(targetPlayerId, {
      type: 'blockSwap',
      block: this.currentBlock
    });
    
    // Show notification
    this.showEventNotification('Block Swapped!', '🔄');
    
    // Play sound effect
    if (this.soundManager) {
      this.soundManager.play('place');
    }
  }
  
  addExtraTime(seconds) {
    this.timeRemaining += seconds;
    this.updateTimerDisplay();
    
    // Show notification
    this.showEventNotification(`+${seconds} Seconds!`, '⏱️');
    
    // Play sound effect
    if (this.soundManager) {
      this.soundManager.play('score');
    }
    
    // Update room state if host
    if (this.room && this.roomManager && this.roomManager.isHost) {
      this.room.updateRoomState({
        timeRemaining: this.timeRemaining
      });
    }
  }
  
  createRainbowBlock() {
    // Replace current block with a rainbow block
    this.currentBlock = {
      name: 'Rainbow',
      color: 'rainbow',
      shape: [[1]],
      isRainbow: true
    };
    
    // Display the block
    this.displayNextBlock();
    
    // Show notification
    this.showEventNotification('Rainbow Block!', '🌈');
    
    // Play sound effect
    if (this.soundManager) {
      this.soundManager.play('score');
    }
  }
  
  showEventNotification(text, emoji) {
    const notification = document.createElement('div');
    notification.className = 'event-notification';
    notification.innerHTML = `
      <div class="event-emoji">${emoji}</div>
      <div class="event-text">${text}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 2500);
  }
}

// Initializing the game and its components
document.addEventListener('DOMContentLoaded', () => {
  // Initialize router for page navigation
  const router = new Router();
  
  // Initialize game
  const game = new BlockBlast();
  
  // Initialize room manager for all pages
  const roomManager = new RoomManager(game, router);
  game.roomManager = roomManager;
  
  // Initialize settings manager
  game.settingsManager = new SettingsManager(game);
  
  // Only initialize game components when on the game page
  if (document.getElementById('main-grid')) {
    const gridLogic = new GridLogic(game);
    const multiplayerManager = new MultiplayerManager(game);
    
    // Attach the component instances to the main game for cross-references
    game.gridLogic = gridLogic;
    game.multiplayerManager = multiplayerManager;
    
    // Initialize components
    gridLogic.initGrid();
    
    // Set up rotate block button
    const rotateBlockBtn = document.getElementById('rotate-block-button');
    if (rotateBlockBtn) {
      rotateBlockBtn.addEventListener('click', () => {
        if (game.gameActive && game.gridLogic) {
          game.gridLogic.rotateCurrentBlock();
        }
      });
    }
    
    // Set up start game button
    const startGameButton = document.getElementById('start-game');
    if (startGameButton) {
      startGameButton.addEventListener('click', () => {
        if (!game.gameActive && game.roomManager && game.roomManager.isHost) {
          // Only the host can start the game
          game.room.updateRoomState({
            gameActive: true,
            gameEnded: false,
            timeRemaining: game.config.gameTime
          });
        }
      });
    }
  }
  
  // Set up statistics page
  const statsPage = document.getElementById('statistics-page');
  if (statsPage) {
    // Add function to update stats display
    game.updateStatsDisplay = () => {
      const stats = game.statisticsManager.getStats();
      document.getElementById('stats-games-played').textContent = stats.gamesPlayed;
      document.getElementById('stats-games-won').textContent = stats.gamesWon;
      document.getElementById('stats-win-rate').textContent = stats.gamesPlayed > 0 ? 
        `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%` : '0%';
      document.getElementById('stats-high-score').textContent = stats.highScore;
      document.getElementById('stats-average-score').textContent = stats.averageScore;
      document.getElementById('stats-total-lines').textContent = stats.totalLinesCleared;
      document.getElementById('stats-total-blocks').textContent = stats.totalBlocksPlaced;
      
      // Format play time (convert seconds to hours:minutes)
      const hours = Math.floor(stats.playTime / 3600);
      const minutes = Math.floor((stats.playTime % 3600) / 60);
      document.getElementById('stats-play-time').textContent = `${hours}h ${minutes}m`;
    };
    
    // Update stats when page is shown
    router.onPageShown('statistics', () => {
      game.updateStatsDisplay();
    });
    
    // Set up reset stats button
    const resetStatsBtn = document.getElementById('reset-stats-button');
    if (resetStatsBtn) {
      resetStatsBtn.addEventListener('click', () => {
        // Show confirmation dialog
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
          game.statisticsManager.resetStats();
          game.updateStatsDisplay();
        }
      });
    }
  }
  
  // Set up achievements page
  const achievementsPage = document.getElementById('achievements-page');
  if (achievementsPage) {
    // Add function to update achievements display
    game.updateAchievementsDisplay = () => {
      const achievementsList = document.getElementById('achievements-list');
      if (!achievementsList) return;
      
      achievementsList.innerHTML = '';
      
      Object.values(game.achievementManager.achievements).forEach(achievement => {
        const achievementEl = document.createElement('div');
        achievementEl.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        
        achievementEl.innerHTML = `
          <div class="achievement-icon">${achievement.icon}</div>
          <div class="achievement-details">
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-description">${achievement.description}</div>
          </div>
          <div class="achievement-status">${achievement.unlocked ? '✓' : '🔒'}</div>
        `;
        
        achievementsList.appendChild(achievementEl);
      });
    };
    
    // Update achievements when page is shown
    router.onPageShown('achievements', () => {
      game.updateAchievementsDisplay();
    });
  }
  
  // Set up shop page handlers
  const shopPage = document.getElementById('shop-page');
  if (shopPage) {
    // Add shop category switching
    const categories = document.querySelectorAll('.shop-category');
    categories.forEach(category => {
      category.addEventListener('click', () => {
        // Remove active class from all categories
        categories.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked category
        category.classList.add('active');
        
        // Show corresponding items
        const categoryName = category.getAttribute('data-category');
        document.querySelectorAll('.shop-items-container').forEach(container => {
          container.classList.add('hidden');
        });
        document.getElementById(`${categoryName}-items`).classList.remove('hidden');
      });
    });
    
    // Add buy button handlers
    document.querySelectorAll('.buy-button:not(.owned)').forEach(button => {
      button.addEventListener('click', () => {
        const itemId = button.getAttribute('data-item-id');
        const itemPrice = parseInt(button.getAttribute('data-price'));
        const itemType = button.getAttribute('data-type');
        
        // Check if player has enough currency
        const currentCurrency = parseInt(document.querySelector('.currency-amount').textContent.replace(/,/g, ''));
        
        if (currentCurrency >= itemPrice) {
          // Process purchase
          const newCurrency = currentCurrency - itemPrice;
          document.querySelector('.currency-amount').textContent = newCurrency.toLocaleString();
          
          // Mark as owned
          button.classList.add('owned');
          button.textContent = 'Owned';
          button.disabled = true;
          
          // Save purchase to localStorage
          const ownedItems = JSON.parse(localStorage.getItem('block-blast-owned-items') || '{}');
          ownedItems[itemId] = true;
          localStorage.setItem('block-blast-owned-items', JSON.stringify(ownedItems));
          
          // Apply item if it's a settings type
          if (itemType === 'blockStyle' || itemType === 'gridBackground') {
            game.settingsManager.setSetting(itemType, itemId);
          }
          
          // Play purchase sound
          if (game.soundManager) {
            game.soundManager.play('score');
          }
        } else {
          // Not enough currency
          alert('Not enough coins to purchase this item!');
          
          // Play invalid sound
          if (game.soundManager) {
            game.soundManager.play('invalid');
          }
        }
      });
    });
  }
});

export default BlockBlast;