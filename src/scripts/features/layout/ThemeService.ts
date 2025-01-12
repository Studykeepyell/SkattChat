export class ThemeService {
    constructor() {}

    public initialize(): void {
        this.loadSavedTheme();
        this.setupDarkMode();
    }

    private loadSavedTheme(): void {
        try {
            const isDarkMode = JSON.parse(localStorage.getItem('darkMode') || 'false');
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
            }
        } catch (error) {
            console.error('Error loading theme settings:', error);
        }
    }

    private setupDarkMode(): void {
        const darkModeButton = document.getElementById('darkModeButton');
        darkModeButton?.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
        });
    }
} 