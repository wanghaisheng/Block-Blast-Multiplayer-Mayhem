// Multiplayer functionality extracted from game.js
class MultiplayerManager {
  constructor(game) {
    this.game = game;
  }

  async initRoom() {
    this.game.room = new WebsimSocket();
    await this.game.room.initialize();
    
    // Listen for presence updates (player info, scores, etc.)
    this.game.room.subscribePresence((presence) => {
      this.updatePlayersUI();
    });
    
    // Listen for room state updates (game state, special events, etc.)
    this.game.room.subscribeRoomState((roomState) => {
      if (roomState.gameActive !== undefined && roomState.gameActive !== this.game.gameActive) {
        this.game.gameActive = roomState.gameActive;
        if (this.game.gameActive) {
          this.game.resetGame();
          this.game.startTimer();
        } else {
          this.game.endGame();
        }
      }
      
      if (roomState.timeRemaining !== undefined) {
        this.game.timeRemaining = roomState.timeRemaining;
        this.game.updateTimerDisplay();
      }
      
      if (roomState.specialEvent) {
        this.game.handleSpecialEvent(roomState.specialEvent);
      }
    });
    
    // Handle presence update requests (damage, etc.)
    this.game.room.subscribePresenceUpdateRequests((updateRequest, fromClientId) => {
      // For example, if we implement block swaps
      if (updateRequest.type === 'blockSwap') {
        const currentBlockData = this.game.room.presence[this.game.room.clientId].currentBlock;
        this.game.room.updatePresence({
          currentBlock: updateRequest.block
        });
        // Send the requesting player our block
        this.game.room.requestPresenceUpdate(fromClientId, {
          type: 'blockSwap',
          block: currentBlockData
        });
      }
    });
    
    // Initialize player presence
    this.game.room.updatePresence({
      score: 0,
      grid: [],
      currentBlock: null
    });
    
    // Update UI with player info
    const { username, avatarUrl } = this.game.room.peers[this.game.room.clientId];
    this.game.usernameDisplay.textContent = username;
    this.game.avatarDisplay.src = avatarUrl;
    
    this.updatePlayersUI();
  }
  
  updatePlayersUI() {
    // Clear current displays
    this.game.leaderboardEntries.innerHTML = '';
    this.game.opponentsGrids.innerHTML = '';
    
    // Get all players and sort by score
    const players = Object.keys(this.game.room.presence).map(clientId => {
      return {
        id: clientId,
        score: this.game.room.presence[clientId].score || 0,
        username: this.game.room.peers[clientId]?.username || 'Player',
        avatarUrl: this.game.room.peers[clientId]?.avatarUrl || '',
        grid: this.game.room.presence[clientId].grid || []
      };
    }).sort((a, b) => b.score - a.score);
    
    // Update leaderboard
    players.forEach((player, index) => {
      const entry = document.createElement('div');
      entry.className = 'leaderboard-entry';
      entry.innerHTML = `
        <span class="player-rank">${index + 1}.</span>
        <img src="${player.avatarUrl}" alt="">
        <span class="player-name">${player.username}</span>
        <span class="player-score">${player.score}</span>
      `;
      this.game.leaderboardEntries.appendChild(entry);
    });
    
    // Update opponents area (exclude current player)
    players.forEach(player => {
      if (player.id !== this.game.room.clientId) {
        const opponentContainer = document.createElement('div');
        opponentContainer.className = 'opponent-container';
        
        const opponentInfo = document.createElement('div');
        opponentInfo.className = 'opponent-info';
        opponentInfo.innerHTML = `
          <img src="${player.avatarUrl}" alt="">
          <span class="opponent-name">${player.username}</span>
          <span class="opponent-score">${player.score}</span>
        `;
        
        const opponentGrid = document.createElement('div');
        opponentGrid.className = 'opponent-grid';
        
        // Render opponent's grid in miniature
        if (player.grid && player.grid.length > 0) {
          this.renderOpponentGrid(opponentGrid, player.grid);
        }
        
        opponentContainer.appendChild(opponentInfo);
        opponentContainer.appendChild(opponentGrid);
        this.game.opponentsGrids.appendChild(opponentContainer);
      }
    });
  }
  
  renderOpponentGrid(container, gridData) {
    // Mini version of the grid for opponents
    const cellSize = 100 / this.game.config.gridSize; // percentage
    
    gridData.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const block = document.createElement('div');
          block.className = `block block-${cell.color}`;
          block.style.width = `${cellSize}%`;
          block.style.height = `${cellSize}%`;
          block.style.left = `${x * cellSize}%`;
          block.style.top = `${y * cellSize}%`;
          container.appendChild(block);
        }
      });
    });
  }
}

export default MultiplayerManager;