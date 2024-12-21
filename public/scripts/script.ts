// animations.js
const colors = ["#3CC157", "#2AA7FF", "#1B1B1B", "#FCBC0F", "#F85F36"];

export type Language = 'en' | 'zh' | 'fr' | 'ar';

export function initializeAnimations() {
    const numBalls = 50;
    const balls = [];
    // ... rest of animation code ...
}

// translations.js
type Translations = Record<string, string>;

const translations: Record<Language, Translations> = {
    en: {
        'brand-name': 'Skychatt',
        'Download': 'Download',
        // ... rest of English translations
    },
    zh: {
        'brand-name': 'Skychatt (中文)',
        'Download': '下载',
        // ... rest of Chinese translations
    },
    fr: {
        'brand-name': 'Skychatt (Français)',
        'Download': 'Télécharger',
        // ... rest of French translations
    },
    ar: {
        'brand-name': 'Skychatt (عربى)',
        'Download': 'تحميل',
        // ... rest of Arabic translations
    }
};

export function changeLanguage(language: Language) {
    const elementsToTranslate = document.querySelectorAll('[data-translate]');
    
    elementsToTranslate.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (key && translations[language]?.[key]) {
            (element as HTMLElement).innerText = translations[language][key];
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeAnimations();
    changeLanguage('en');
    
    document.getElementById('language-selector')?.addEventListener('change', function() {
        changeLanguage((this as HTMLSelectElement).value as Language);
    });
});
