export default {
  // Game settings
  gridSize: 10,
  gameTime: 120, // in seconds (2 minutes)
  blockSize: 40, // Size of each block in pixels
  
  // Block types and colors
  blockTypes: [
    { name: 'I', color: 'blue', shape: [[1, 1, 1, 1]] },
    { name: 'O', color: 'yellow', shape: [[1, 1], [1, 1]] },
    { name: 'T', color: 'purple', shape: [[0, 1, 0], [1, 1, 1]] },
    { name: 'L', color: 'orange', shape: [[1, 0], [1, 0], [1, 1]] },
    { name: 'J', color: 'cyan', shape: [[0, 1], [0, 1], [1, 1]] },
    { name: 'S', color: 'green', shape: [[0, 1, 1], [1, 1, 0]] },
    { name: 'Z', color: 'red', shape: [[1, 1, 0], [0, 1, 1]] }
  ],
  
  // Scoring system
  scoring: {
    oneLine: 100,
    twoLines: 300,
    threeLines: 500,
    fourPlusLines: 800,
    additionalLine: 200, // for each line beyond 4
    blockPlacement: 10   // bonus points for each block placed
  },
  
  // Special blocks/events
  enableSpecialEvents: true,
  specialEventProbability: 0.05, // 5% chance every 30 seconds
  specialEvents: {
    scoreMultiplier: {
      multiplier: 2,
      duration: 10 // seconds
    },
    gridShuffle: {
      enabled: true
    },
    blockSwap: {
      enabled: true
    },
    // New special events
    extraTime: {
      enabled: true,
      time: 15 // seconds added
    },
    rainbowBlock: {
      enabled: true,
      description: "Clears entire row and column when placed"
    }
  },
  
  // Achievement thresholds
  achievements: {
    scoreThresholds: [100, 500, 1000, 2000, 5000],
    lineThresholds: [5, 10, 25, 50, 100],
    gamesPlayedThresholds: [1, 5, 10, 50, 100],
    gamesWonThresholds: [1, 5, 10, 25, 50]
  },
  
  // Block style options
  blockStyles: [
    { id: 'default', name: 'Classic' },
    { id: 'neon', name: 'Neon Glow' },
    { id: 'pixel', name: 'Pixel Art' },
    { id: 'gradient', name: 'Gradient' },
    { id: 'metallic', name: 'Metallic' }
  ],
  
  // Grid background options
  gridBackgrounds: [
    { id: 'default', name: 'Classic Dark' },
    { id: 'space', name: 'Deep Space' },
    { id: 'circuit', name: 'Circuit Board' },
    { id: 'abstract', name: 'Abstract Shapes' },
    { id: 'grid', name: 'Grid Lines' }
  ]
};