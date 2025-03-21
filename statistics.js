class StatisticsManager {
  constructor() {
    this.stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      highScore: 0,
      totalScore: 0,
      totalLinesCleared: 0,
      totalBlocksPlaced: 0,
      averageScore: 0,
      playTime: 0 // in seconds
    };
    
    this.loadStats();
  }
  
  loadStats() {
    const savedStats = localStorage.getItem('block-blast-statistics');
    if (savedStats) {
      this.stats = JSON.parse(savedStats);
    }
  }
  
  saveStats() {
    localStorage.setItem('block-blast-statistics', JSON.stringify(this.stats));
  }
  
  recordGamePlayed(score, won = false, linesCleared = 0, blocksPlaced = 0, timePlayed = 0) {
    this.stats.gamesPlayed++;
    this.stats.totalScore += score;
    this.stats.totalLinesCleared += linesCleared;
    this.stats.totalBlocksPlaced += blocksPlaced;
    this.stats.playTime += timePlayed;
    
    // Update high score if necessary
    if (score > this.stats.highScore) {
      this.stats.highScore = score;
    }
    
    // Update win count if won
    if (won) {
      this.stats.gamesWon++;
    }
    
    // Calculate average score
    this.stats.averageScore = Math.round(this.stats.totalScore / this.stats.gamesPlayed);
    
    this.saveStats();
  }
  
  getStats() {
    return { ...this.stats };
  }
  
  resetStats() {
    this.stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      highScore: 0,
      totalScore: 0,
      totalLinesCleared: 0,
      totalBlocksPlaced: 0,
      averageScore: 0,
      playTime: 0
    };
    this.saveStats();
  }
}

export default StatisticsManager;