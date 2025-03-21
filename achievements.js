class AchievementManager {
  constructor(game) {
    this.game = game;
    this.achievements = {
      "firstGame": { name: "First Steps", description: "Play your first game", unlocked: false, icon: "🎮" },
      "scoreHundred": { name: "Century", description: "Score 100 points in a single game", unlocked: false, icon: "💯" },
      "scoreThousand": { name: "High Roller", description: "Score 1000 points in a single game", unlocked: false, icon: "🎯" },
      "clearTenLines": { name: "Line Master", description: "Clear 10 lines in a single game", unlocked: false, icon: "📏" },
      "winGame": { name: "Champion", description: "Win a multiplayer game", unlocked: false, icon: "🏆" },
      "hostGame": { name: "Party Host", description: "Host a multiplayer game", unlocked: false, icon: "🎪" }
    };
    
    // Load saved achievements
    this.loadAchievements();
    
    // Add notification area to DOM if it doesn't exist
    if (!document.getElementById('achievement-notification')) {
      const notificationArea = document.createElement('div');
      notificationArea.id = 'achievement-notification';
      document.body.appendChild(notificationArea);
    }
  }
  
  loadAchievements() {
    const savedAchievements = localStorage.getItem('block-blast-achievements');
    if (savedAchievements) {
      const parsed = JSON.parse(savedAchievements);
      // Update unlocked status while preserving the achievement definitions
      Object.keys(parsed).forEach(key => {
        if (this.achievements[key]) {
          this.achievements[key].unlocked = parsed[key].unlocked;
        }
      });
    }
  }
  
  saveAchievements() {
    localStorage.setItem('block-blast-achievements', JSON.stringify(this.achievements));
  }
  
  unlockAchievement(id) {
    if (this.achievements[id] && !this.achievements[id].unlocked) {
      this.achievements[id].unlocked = true;
      this.saveAchievements();
      this.showNotification(this.achievements[id]);
      return true;
    }
    return false;
  }
  
  showNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-text">
        <div class="achievement-title">Achievement Unlocked!</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-desc">${achievement.description}</div>
      </div>
    `;
    
    const notificationArea = document.getElementById('achievement-notification');
    notificationArea.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 4500);
  }
  
  checkGameProgress() {
    // Check for first game
    this.unlockAchievement("firstGame");
    
    // Check score achievements
    if (this.game.playerScore >= 100) {
      this.unlockAchievement("scoreHundred");
    }
    
    if (this.game.playerScore >= 1000) {
      this.unlockAchievement("scoreThousand");
    }
    
    // Host achievement checked in roomManager
  }
}

export default AchievementManager;