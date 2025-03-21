class SettingsManager {
  constructor(game) {
    this.game = game;
    this.settings = {
      showOpponentGrids: true,
      vibration: true,
      notifications: true,
      privacy: true,
      blockStyle: 'default',
      gridBackground: 'default',
      theme: 'dark' // 'dark' or 'light'
    };
    
    this.loadSettings();
    this.applySettings();
    this.setupSettingsListeners();
  }
  
  loadSettings() {
    const savedSettings = localStorage.getItem('block-blast-user-settings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }
  }
  
  saveSettings() {
    localStorage.setItem('block-blast-user-settings', JSON.stringify(this.settings));
  }
  
  setSetting(key, value) {
    if (key in this.settings) {
      this.settings[key] = value;
      this.saveSettings();
      this.applySettings();
    }
  }
  
  applySettings() {
    // Apply theme
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${this.settings.theme}`);
    
    // Apply opponent grids visibility
    if (this.game.opponentsArea) {
      this.game.opponentsArea.style.display = this.settings.showOpponentGrids ? 'flex' : 'none';
    }
    
    // Apply block style
    document.querySelectorAll('.block').forEach(block => {
      // Remove any existing style classes
      block.classList.forEach(className => {
        if (className.startsWith('style-') && className !== `style-${this.settings.blockStyle}`) {
          block.classList.remove(className);
        }
      });
      
      // Add current style class
      if (this.settings.blockStyle !== 'default') {
        block.classList.add(`style-${this.settings.blockStyle}`);
      }
    });
    
    // Apply grid background
    const gridElements = [
      document.getElementById('main-grid'),
      ...Array.from(document.querySelectorAll('.opponent-grid'))
    ];
    
    gridElements.forEach(grid => {
      if (!grid) return;
      
      // Remove any existing background classes
      grid.classList.forEach(className => {
        if (className.startsWith('bg-') && className !== `bg-${this.settings.gridBackground}`) {
          grid.classList.remove(className);
        }
      });
      
      // Add current background class
      if (this.settings.gridBackground !== 'default') {
        grid.classList.add(`bg-${this.settings.gridBackground}`);
      }
    });
  }
  
  setupSettingsListeners() {
    // Toggle switches in settings page
    document.querySelectorAll('#settings-page .toggle-switch input').forEach(toggle => {
      const setting = toggle.getAttribute('data-setting');
      if (setting && setting in this.settings) {
        // Set initial state
        toggle.checked = this.settings[setting];
        
        // Add change listener
        toggle.addEventListener('change', (e) => {
          this.setSetting(setting, e.target.checked);
        });
      }
    });
    
    // Volume controls
    const musicVolume = document.getElementById('music-volume');
    const sfxVolume = document.getElementById('sfx-volume');
    
    if (musicVolume && this.game.soundManager) {
      musicVolume.value = this.game.soundManager.musicVolume * 100;
      musicVolume.addEventListener('input', (e) => {
        this.game.soundManager.setMusicVolume(e.target.value / 100);
      });
    }
    
    if (sfxVolume && this.game.soundManager) {
      sfxVolume.value = this.game.soundManager.sfxVolume * 100;
      sfxVolume.addEventListener('input', (e) => {
        this.game.soundManager.setSfxVolume(e.target.value / 100);
      });
    }
    
    // Theme selector
    const themeSelector = document.getElementById('theme-select');
    if (themeSelector) {
      themeSelector.value = this.settings.theme;
      themeSelector.addEventListener('change', (e) => {
        this.setSetting('theme', e.target.value);
      });
    }
  }
}

export default SettingsManager;