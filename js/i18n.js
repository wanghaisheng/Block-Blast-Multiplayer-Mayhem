/**
 * Internationalization (i18n) handler for the landing page
 * Loads JSON language files and applies translations based on data-i18n attributes
 */
class I18n {
    constructor() {
        this.currentLanguage = localStorage.getItem('blockBlastLanguage') || 'en';
        this.translations = {};
        this.languageSelect = document.getElementById('language-select');
        
        this.init();
    }
    
    async init() {
        // Set the language select to the current language
        if (this.languageSelect) {
            this.languageSelect.value = this.currentLanguage;
            this.languageSelect.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }
        
        // Load the current language
        await this.loadLanguage(this.currentLanguage);
        
        // Apply translations
        this.applyTranslations();
    }
    
    async loadLanguage(lang) {
        try {
            const response = await fetch(`locale/${lang}.json`);
            if (!response.ok) {
                console.error(`Failed to load language file for ${lang}`);
                // Fall back to English if the requested language file doesn't exist
                if (lang !== 'en') {
                    return this.loadLanguage('en');
                }
                return;
            }
            
            this.translations = await response.json();
        } catch (error) {
            console.error('Error loading language file:', error);
            // Fall back to English on error
            if (lang !== 'en') {
                return this.loadLanguage('en');
            }
        }
    }
    
    applyTranslations() {
        // Apply translations to all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            
            // Check if this is an attribute translation (format: [attr]key)
            if (key.startsWith('[') && key.includes(']')) {
                const matches = key.match(/\[(.*?)\](.*)/);
                if (matches && matches.length === 3) {
                    const attr = matches[1];
                    const translationKey = matches[2];
                    const translation = this.getNestedTranslation(translationKey);
                    
                    if (translation) {
                        el.setAttribute(attr, translation);
                    }
                }
            } else {
                // Regular text content translation
                const translation = this.getNestedTranslation(key);
                
                if (translation) {
                    el.textContent = translation;
                }
            }
        });
    }
    
    getNestedTranslation(key) {
        // Handle nested keys like 'hero.headline'
        return key.split('.').reduce((obj, i) => obj && obj[i], this.translations);
    }
    
    async changeLanguage(lang) {
        // Save the selected language
        localStorage.setItem('blockBlastLanguage', lang);
        this.currentLanguage = lang;
        
        // Load the new language and apply translations
        await this.loadLanguage(lang);
        this.applyTranslations();
    }
}

// Initialize i18n when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18n();
});