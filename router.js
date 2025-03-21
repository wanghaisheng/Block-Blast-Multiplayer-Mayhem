// Navigation management for multiple game pages
class Router {
  constructor() {
    this.pages = {
      'menu': document.getElementById('menu-page'),
      'game': document.getElementById('game-page'),
      'tutorial': document.getElementById('tutorial-page'),
      'settings': document.getElementById('settings-page'),
      'shop': document.getElementById('shop-page'),
      'statistics': document.getElementById('statistics-page'),
      'achievements': document.getElementById('achievements-page'),
      'room-selection': document.getElementById('room-selection-page'),
      'room-lobby': document.getElementById('room-lobby-page'),
      'game-results': document.getElementById('game-results-page')
    };
    
    this.currentPage = 'menu';
    this.pageShowCallbacks = {};
    
    // Set up navigation buttons
    this.setupNavigation();
    
    // Show the initial page (menu by default)
    this.navigateTo(this.currentPage);
  }
  
  setupNavigation() {
    // Handle menu navigation buttons
    document.querySelectorAll('[data-navigate]').forEach(button => {
      button.addEventListener('click', (e) => {
        const targetPage = e.currentTarget.getAttribute('data-navigate');
        this.navigateTo(targetPage);
      });
    });
    
    // Handle back buttons
    document.querySelectorAll('.back-button').forEach(button => {
      button.addEventListener('click', () => {
        this.navigateTo('menu');
      });
    });
  }
  
  navigateTo(page) {
    // Hide all pages
    Object.values(this.pages).forEach(pageElement => {
      if (pageElement) pageElement.classList.add('hidden');
    });
    
    // Show the target page
    if (this.pages[page]) {
      this.pages[page].classList.remove('hidden');
      this.currentPage = page;
      
      // Trigger page show callback if exists
      if (this.pageShowCallbacks[page]) {
        this.pageShowCallbacks[page].forEach(callback => callback());
      }
    }
  }
  
  onPageShown(page, callback) {
    if (!this.pageShowCallbacks[page]) {
      this.pageShowCallbacks[page] = [];
    }
    this.pageShowCallbacks[page].push(callback);
  }
}

export default Router;