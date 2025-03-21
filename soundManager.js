class SoundManager {
  constructor() {
    this.sounds = {};
    this.musicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    
    // Load settings from localStorage
    this.loadSettings();
    
    this.initSounds();
  }
  
  loadSettings() {
    const settings = localStorage.getItem('block-blast-sound-settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.musicVolume = parsed.musicVolume ?? this.musicVolume;
      this.sfxVolume = parsed.sfxVolume ?? this.sfxVolume;
      this.musicEnabled = parsed.musicEnabled ?? this.musicEnabled;
      this.sfxEnabled = parsed.sfxEnabled ?? this.sfxEnabled;
    }
  }
  
  saveSettings() {
    const settings = {
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      musicEnabled: this.musicEnabled,
      sfxEnabled: this.sfxEnabled
    };
    localStorage.setItem('block-blast-sound-settings', JSON.stringify(settings));
  }
  
  initSounds() {
    // Create audio elements for each sound
    this.registerSound('background', 'https://assets.codepen.io/21542/howler-demo-bg-music.mp3', true);
    this.registerSound('place', 'https://assets.codepen.io/21542/howler-demo-sprite-1.mp3');
    this.registerSound('clear', 'https://assets.codepen.io/21542/howler-demo-sprite-2.mp3');
    this.registerSound('score', 'https://assets.codepen.io/21542/howler-demo-sprite-3.mp3');
    this.registerSound('invalid', 'https://assets.codepen.io/21542/howler-demo-sprite-4.mp3');
    this.registerSound('gameOver', 'https://assets.codepen.io/21542/howler-demo-sprite-5.mp3');
    this.registerSound('achievement', 'https://assets.codepen.io/21542/howler-demo-sprite-6.mp3');
  }
  
  registerSound(id, url, isMusic = false) {
    this.sounds[id] = {
      element: new Audio(url),
      isMusic: isMusic
    };
    
    const sound = this.sounds[id];
    
    if (isMusic) {
      sound.element.loop = true;
      sound.element.volume = this.musicVolume;
    } else {
      sound.element.volume = this.sfxVolume;
    }
    
    sound.element.load();
  }
  
  play(id) {
    if (!this.sounds[id]) return;
    
    const sound = this.sounds[id];
    
    // Check if sound should play based on settings
    if ((sound.isMusic && !this.musicEnabled) || (!sound.isMusic && !this.sfxEnabled)) {
      return;
    }
    
    // Reset sound to beginning if it's already playing
    sound.element.currentTime = 0;
    sound.element.play().catch(e => console.log("Audio playback failed:", e));
  }
  
  stop(id) {
    if (!this.sounds[id]) return;
    
    this.sounds[id].element.pause();
    this.sounds[id].element.currentTime = 0;
  }
  
  setMusicVolume(volume) {
    this.musicVolume = volume;
    
    // Update all music elements
    Object.values(this.sounds)
      .filter(sound => sound.isMusic)
      .forEach(sound => {
        sound.element.volume = volume;
      });
    
    this.saveSettings();
  }
  
  setSfxVolume(volume) {
    this.sfxVolume = volume;
    
    // Update all SFX elements
    Object.values(this.sounds)
      .filter(sound => !sound.isMusic)
      .forEach(sound => {
        sound.element.volume = volume;
      });
    
    this.saveSettings();
  }
  
  toggleMusic(enabled) {
    this.musicEnabled = enabled;
    
    // Stop all music if disabled
    if (!enabled) {
      Object.entries(this.sounds)
        .filter(([_, sound]) => sound.isMusic)
        .forEach(([id, _]) => {
          this.stop(id);
        });
    } else {
      // Resume background music
      this.play('background');
    }
    
    this.saveSettings();
  }
  
  toggleSfx(enabled) {
    this.sfxEnabled = enabled;
    this.saveSettings();
  }
}

export default SoundManager;