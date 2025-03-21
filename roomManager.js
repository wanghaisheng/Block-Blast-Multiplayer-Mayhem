// Room management functionality
class RoomManager {
  constructor(game, router) {
    this.game = game;
    this.router = router;
    this.isHost = false;
    this.currentRoomId = null;
    
    // Initialize the WebsimSocket
    this.initSocket();
    
    // DOM Elements
    this.roomList = document.getElementById('room-list');
    this.createRoomButton = document.getElementById('create-room-button');
    this.roomNameInput = document.getElementById('room-name-input');
    this.lobbyRoomName = document.getElementById('lobby-room-name');
    this.lobbyPlayersList = document.getElementById('lobby-players-list');
    this.readyButton = document.getElementById('ready-button');
    this.gameStatus = document.getElementById('game-status');
    this.gameTimeSelect = document.getElementById('game-time-select');
    this.playerCountSelect = document.getElementById('player-count-select');
    this.winnerAvatar = document.getElementById('winner-avatar-img');
    this.winnerName = document.getElementById('winner-name');
    this.winnerScore = document.getElementById('winner-score');
    this.finalScoresList = document.getElementById('final-scores-list');
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  async initSocket() {
    this.game.room = new WebsimSocket();
    await this.game.room.initialize();
    
    // Set up event listeners for multiplayer communication
    this.setupRoomListeners();
    
    // Update menu button to navigate to room selection instead of directly to game
    const playButton = document.querySelector('[data-navigate="game"]');
    if (playButton) {
      playButton.setAttribute('data-navigate', 'room-selection');
    }
  }
  
  setupRoomListeners() {
    // Listen for room state updates
    this.game.room.subscribeRoomState((roomState) => {
      // If we're in the room selection page
      if (this.router.currentPage === 'room-selection') {
        this.updateRoomList(roomState.rooms || {});
      }
      
      // If we're in a lobby
      if (this.router.currentPage === 'room-lobby') {
        this.updateLobbyState(roomState);
      }
      
      // If we're in the game
      if (this.router.currentPage === 'game') {
        if (roomState.gameActive !== undefined) {
          this.handleGameStateChange(roomState);
        }
        
        if (roomState.gameEnded) {
          this.showGameResults();
        }
      }
      
      // If we're in the results page
      if (this.router.currentPage === 'game-results') {
        this.updateGameResults(roomState);
      }
    });
    
    // Listen for presence updates
    this.game.room.subscribePresence((presence) => {
      // Update lobby players if we're in a lobby
      if (this.router.currentPage === 'room-lobby' && this.currentRoomId) {
        this.updateLobbyPlayers();
      }
      
      // Update game UI if we're in a game
      if (this.router.currentPage === 'game') {
        if (this.game.multiplayerManager) {
          this.game.multiplayerManager.updatePlayersUI();
        }
      }
    });
  }
  
  setupEventListeners() {
    // Create room button
    if (this.createRoomButton) {
      this.createRoomButton.addEventListener('click', () => {
        this.createRoom();
      });
    }
    
    // Room name input - create on enter
    if (this.roomNameInput) {
      this.roomNameInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          this.createRoom();
        }
      });
    }
    
    // Ready button
    if (this.readyButton) {
      this.readyButton.addEventListener('click', () => {
        this.toggleReady();
      });
    }
    
    // Game time select
    if (this.gameTimeSelect) {
      this.gameTimeSelect.addEventListener('change', () => {
        this.updateRoomConfig();
      });
    }
    
    // Player count select
    if (this.playerCountSelect) {
      this.playerCountSelect.addEventListener('change', () => {
        this.updateRoomConfig();
      });
    }
    
    // Back buttons
    document.querySelectorAll('.back-button').forEach(button => {
      button.addEventListener('click', () => {
        if (this.router.currentPage === 'room-lobby') {
          this.leaveRoom();
          this.router.navigateTo('room-selection');
        } else if (this.router.currentPage === 'room-selection') {
          this.router.navigateTo('menu');
        } else if (this.router.currentPage === 'game-results') {
          this.router.navigateTo('room-selection');
        }
      });
    });
  }
  
  updateRoomList(rooms) {
    if (!this.roomList) return;
    
    this.roomList.innerHTML = '';
    
    if (Object.keys(rooms).length === 0) {
      const noRoomsMsg = document.createElement('div');
      noRoomsMsg.className = 'no-rooms-message';
      noRoomsMsg.textContent = 'No rooms available. Create a new one!';
      this.roomList.appendChild(noRoomsMsg);
      return;
    }
    
    Object.entries(rooms).forEach(([roomId, roomData]) => {
      const roomEl = document.createElement('div');
      roomEl.className = 'room-item';
      
      const roomInfo = document.createElement('div');
      roomInfo.className = 'room-info';
      
      const roomName = document.createElement('div');
      roomName.className = 'room-name';
      roomName.textContent = roomData.name;
      
      const playerCount = Object.keys(roomData.players || {}).length;
      const maxPlayers = roomData.gameConfig?.playerCount || 2;
      const roomPlayers = document.createElement('div');
      roomPlayers.className = 'room-players';
      roomPlayers.textContent = `${playerCount}/${maxPlayers} players`;
      
      roomInfo.appendChild(roomName);
      roomInfo.appendChild(roomPlayers);
      
      const joinBtn = document.createElement('button');
      joinBtn.className = 'room-join-btn';
      joinBtn.textContent = 'Join';
      joinBtn.addEventListener('click', () => {
        this.joinRoom(roomId, roomData.name);
      });
      
      roomEl.appendChild(roomInfo);
      roomEl.appendChild(joinBtn);
      this.roomList.appendChild(roomEl);
    });
  }
  
  createRoom() {
    if (!this.roomNameInput || !this.game.room) return;
    
    const roomName = this.roomNameInput.value.trim();
    if (!roomName) {
      alert('Please enter a room name');
      return;
    }
    
    const roomId = `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const playerCount = this.playerCountSelect ? parseInt(this.playerCountSelect.value) : 2;
    
    // Update room state with new room
    const currentRooms = this.game.room.roomState.rooms || {};
    this.game.room.updateRoomState({
      rooms: {
        ...currentRooms,
        [roomId]: {
          name: roomName,
          host: this.game.room.clientId,
          players: {
            [this.game.room.clientId]: {
              ready: false
            }
          },
          gameConfig: {
            timeLimit: parseInt(this.gameTimeSelect?.value || '120'),
            playerCount: playerCount
          }
        }
      }
    });
    
    // Join the room we just created
    this.joinRoom(roomId, roomName, true);
  }
  
  joinRoom(roomId, roomName, isCreator = false) {
    if (!this.game.room) return;
    
    // Update room state to add this player
    const currentRoomData = this.game.room.roomState.rooms?.[roomId];
    if (!currentRoomData) return;
    
    const updatedPlayers = {
      ...currentRoomData.players,
      [this.game.room.clientId]: {
        ready: false
      }
    };
    
    this.game.room.updateRoomState({
      rooms: {
        ...this.game.room.roomState.rooms,
        [roomId]: {
          ...currentRoomData,
          players: updatedPlayers
        }
      }
    });
    
    // Set this client's room-related state
    this.currentRoomId = roomId;
    this.isHost = isCreator || currentRoomData.host === this.game.room.clientId;
    
    // Update client presence to indicate they're in a room
    this.game.room.updatePresence({
      currentRoomId: roomId,
      ready: false,
      score: 0,
      grid: []
    });
    
    // Navigate to the lobby
    if (this.lobbyRoomName) {
      this.lobbyRoomName.textContent = roomName;
    }
    
    this.router.navigateTo('room-lobby');
    this.updateLobbyPlayers();
    
    // Update UI elements based on host status
    this.updateLobbyUI();
  }
  
  leaveRoom() {
    if (!this.game.room || !this.currentRoomId) return;
    
    const currentRoomData = this.game.room.roomState.rooms?.[this.currentRoomId];
    if (!currentRoomData) return;
    
    // Remove this player from the room
    const updatedPlayers = { ...currentRoomData.players };
    delete updatedPlayers[this.game.room.clientId];
    
    // If this was the last player, remove the room entirely
    if (Object.keys(updatedPlayers).length === 0) {
      const updatedRooms = { ...this.game.room.roomState.rooms };
      delete updatedRooms[this.currentRoomId];
      
      this.game.room.updateRoomState({
        rooms: updatedRooms
      });
    } else {
      // Otherwise just update the players list
      // If this was the host, assign a new host
      let newHost = currentRoomData.host;
      if (newHost === this.game.room.clientId) {
        // Assign the first remaining player as host
        newHost = Object.keys(updatedPlayers)[0];
      }
      
      this.game.room.updateRoomState({
        rooms: {
          ...this.game.room.roomState.rooms,
          [this.currentRoomId]: {
            ...currentRoomData,
            players: updatedPlayers,
            host: newHost
          }
        }
      });
    }
    
    // Update client presence to indicate they're no longer in a room
    this.game.room.updatePresence({
      currentRoomId: null,
      ready: false
    });
    
    this.currentRoomId = null;
    this.isHost = false;
  }
  
  updateLobbyPlayers() {
    if (!this.lobbyPlayersList || !this.currentRoomId || !this.game.room) return;
    
    const currentRoomData = this.game.room.roomState.rooms?.[this.currentRoomId];
    if (!currentRoomData) return;
    
    this.lobbyPlayersList.innerHTML = '';
    
    // Get all players in this room
    const playerIds = Object.keys(currentRoomData.players || {});
    
    playerIds.forEach(playerId => {
      const playerData = currentRoomData.players[playerId];
      const peerData = this.game.room.peers[playerId];
      
      if (!peerData) return;
      
      const playerEl = document.createElement('div');
      playerEl.className = 'lobby-player';
      
      const playerImg = document.createElement('img');
      playerImg.src = peerData.avatarUrl;
      playerImg.alt = 'Player Avatar';
      
      const playerName = document.createElement('div');
      playerName.className = 'lobby-player-name';
      playerName.textContent = peerData.username;
      
      if (playerId === currentRoomData.host) {
        playerName.textContent += ' (Host)';
      }
      
      const playerStatus = document.createElement('div');
      playerStatus.className = `lobby-player-status ${playerData.ready ? 'status-ready' : 'status-waiting'}`;
      playerStatus.textContent = playerData.ready ? 'Ready' : 'Waiting';
      
      playerEl.appendChild(playerImg);
      playerEl.appendChild(playerName);
      playerEl.appendChild(playerStatus);
      
      this.lobbyPlayersList.appendChild(playerEl);
    });
    
    // Check if all players are ready
    this.checkAllPlayersReady();
  }
  
  toggleReady() {
    if (!this.game.room || !this.currentRoomId) return;
    
    const currentRoomData = this.game.room.roomState.rooms?.[this.currentRoomId];
    if (!currentRoomData) return;
    
    const myPlayerData = currentRoomData.players[this.game.room.clientId];
    const newReadyState = !myPlayerData.ready;
    
    // Update room state with new ready status
    this.game.room.updateRoomState({
      rooms: {
        ...this.game.room.roomState.rooms,
        [this.currentRoomId]: {
          ...currentRoomData,
          players: {
            ...currentRoomData.players,
            [this.game.room.clientId]: {
              ...myPlayerData,
              ready: newReadyState
            }
          }
        }
      }
    });
    
    // Update client presence
    this.game.room.updatePresence({
      ready: newReadyState
    });
    
    // Update button text
    if (this.readyButton) {
      this.readyButton.textContent = newReadyState ? 'Not Ready' : 'Ready';
    }
  }
  
  checkAllPlayersReady() {
    if (!this.game.room || !this.currentRoomId) return;
    
    const currentRoomData = this.game.room.roomState.rooms?.[this.currentRoomId];
    if (!currentRoomData) return;
    
    const players = Object.values(currentRoomData.players || {});
    const playerCount = currentRoomData.gameConfig?.playerCount || 2;
    
    // Allow starting with fewer players if all are ready
    // OR if enough players are ready to meet the playerCount threshold
    const canStart = this.isHost && 
                    (players.every(player => player.ready) || 
                    (players.filter(player => player.ready).length >= playerCount));
    
    if (this.gameStatus) {
      if (canStart) {
        this.gameStatus.textContent = 'All players ready! Starting soon...';
      } else if (players.length < playerCount) {
        this.gameStatus.textContent = `Waiting for more players... (${players.length}/${playerCount})`;
      } else {
        this.gameStatus.textContent = 'Waiting for players to ready up...';
      }
    }
    
    // If conditions are met and this client is the host, start the game soon
    if (canStart) {
      setTimeout(() => {
        // Double-check all still ready before starting
        const updatedRoomData = this.game.room?.roomState.rooms?.[this.currentRoomId];
        if (updatedRoomData) {
          const updatedPlayers = Object.values(updatedRoomData.players || {});
          const updatedPlayerCount = updatedRoomData.gameConfig?.playerCount || 2;
          const stillCanStart = updatedPlayers.every(player => player.ready) || 
                              (updatedPlayers.filter(player => player.ready).length >= updatedPlayerCount);
          
          if (stillCanStart) {
            // Start the game
            this.startGame();
          }
        }
      }, 3000); // 3 second countdown
    }
  }
  
  startGame() {
    if (!this.game.room || !this.currentRoomId || !this.isHost) return;
    
    const currentRoomData = this.game.room.roomState.rooms?.[this.currentRoomId];
    if (!currentRoomData) return;
    
    // Get the chosen time limit
    const timeLimit = currentRoomData.gameConfig?.timeLimit || 120;
    
    // Update room state to indicate game is active
    this.game.room.updateRoomState({
      rooms: {
        ...this.game.room.roomState.rooms,
        [this.currentRoomId]: {
          ...currentRoomData,
          gameActive: true,
          gameEnded: false,
          timeRemaining: timeLimit
        }
      },
      gameActive: true,
      timeRemaining: timeLimit
    });
    
    // Update game config with the chosen time limit
    this.game.config.gameTime = timeLimit;
    
    // Navigate all clients to the game page
    this.router.navigateTo('game');
    
    // Start the game
    this.game.resetGame();
    this.game.startTimer();
  }
  
  updateLobbyState(roomState) {
    if (!this.currentRoomId) return;
    
    const currentRoomData = roomState.rooms?.[this.currentRoomId];
    if (!currentRoomData) return;
    
    // If the game has started, navigate to the game page
    if (currentRoomData.gameActive) {
      if (this.router.currentPage === 'room-lobby') {
        this.router.navigateTo('game');
        
        // Update game config with the room's time limit
        this.game.config.gameTime = currentRoomData.gameConfig?.timeLimit || 120;
        
        // Start the game
        this.game.resetGame();
        this.game.startTimer();
      }
    }
  }
  
  updateLobbyUI() {
    // Enable/disable the game time select based on host status
    if (this.gameTimeSelect) {
      this.gameTimeSelect.disabled = !this.isHost;
    }
    
    // Add player count selector if we're the host
    if (this.playerCountSelect) {
      this.playerCountSelect.disabled = !this.isHost;
    }
  }
  
  updateRoomConfig() {
    if (!this.game.room || !this.currentRoomId || !this.isHost) return;
    
    const currentRoomData = this.game.room.roomState.rooms?.[this.currentRoomId];
    if (!currentRoomData) return;
    
    // Update room config with selected time limit and player count
    const timeLimit = parseInt(this.gameTimeSelect?.value || '120');
    const playerCount = parseInt(this.playerCountSelect?.value || '2');
    
    this.game.room.updateRoomState({
      rooms: {
        ...this.game.room.roomState.rooms,
        [this.currentRoomId]: {
          ...currentRoomData,
          gameConfig: {
            ...currentRoomData.gameConfig,
            timeLimit,
            playerCount
          }
        }
      }
    });
  }
  
  handleGameStateChange(roomState) {
    if (roomState.gameActive && !this.game.gameActive) {
      // Game just activated
      this.game.gameActive = true;
      this.game.resetGame();
      this.game.startTimer();
    } else if (!roomState.gameActive && this.game.gameActive) {
      // Game just ended
      this.game.endGame();
    }
    
    if (roomState.timeRemaining !== undefined) {
      this.game.timeRemaining = roomState.timeRemaining;
      this.game.updateTimerDisplay();
    }
  }
  
  showGameResults() {
    // Navigate to results page
    this.router.navigateTo('game-results');
    this.updateGameResults();
  }
  
  updateGameResults() {
    if (!this.finalScoresList || !this.game.room) return;
    
    // Get all players and sort by score
    const players = Object.keys(this.game.room.presence).map(clientId => {
      return {
        id: clientId,
        score: this.game.room.presence[clientId].score || 0,
        username: this.game.room.peers[clientId]?.username || 'Player',
        avatarUrl: this.game.room.peers[clientId]?.avatarUrl || ''
      };
    }).sort((a, b) => b.score - a.score);
    
    // Update winner display
    if (players.length > 0) {
      const winner = players[0];
      
      if (this.winnerAvatar) this.winnerAvatar.src = winner.avatarUrl;
      if (this.winnerName) this.winnerName.textContent = winner.username;
      if (this.winnerScore) this.winnerScore.textContent = `Score: ${winner.score}`;
    }
    
    // Update final scores list
    if (this.finalScoresList) {
      this.finalScoresList.innerHTML = '';
      
      players.forEach((player, index) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = `final-score-item ${index === 0 ? 'winner' : ''}`;
        
        const rank = document.createElement('div');
        rank.className = `final-score-rank ${index === 0 ? 'winner' : ''}`;
        rank.textContent = (index + 1).toString();
        
        const avatar = document.createElement('img');
        avatar.src = player.avatarUrl;
        avatar.alt = 'Player Avatar';
        
        const name = document.createElement('div');
        name.className = 'final-score-name';
        name.textContent = player.username;
        
        const score = document.createElement('div');
        score.className = 'final-score-points';
        score.textContent = player.score.toString();
        
        scoreItem.appendChild(rank);
        scoreItem.appendChild(avatar);
        scoreItem.appendChild(name);
        scoreItem.appendChild(score);
        
        this.finalScoresList.appendChild(scoreItem);
      });
    }
  }
}

export default RoomManager;