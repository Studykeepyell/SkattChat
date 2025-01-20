import { AuthPage } from './AuthPage';

export class RegisterPage extends AuthPage {
    private usernameInput: HTMLInputElement | null = null;
    private passwordInput: HTMLInputElement | null = null;
    private generateButton: HTMLButtonElement | null = null;
    private passwordRequirements: {[key: string]: HTMLElement} = {};

    constructor() {
        console.log('[REGISTER PAGE] Initializing...');
        // Initialize with registration flag explicitly set to true
        super('register-form', true);
        this.setupElements();
        this.setupEventListeners();
        console.log('[REGISTER PAGE] Initialized');
    }

    private setupElements() {
        this.usernameInput = document.getElementById('username') as HTMLInputElement;
        this.passwordInput = document.getElementById('password') as HTMLInputElement;
        this.generateButton = document.getElementById('generate-username') as HTMLButtonElement;
        
        // Get password requirement elements
        ['length', 'uppercase', 'lowercase', 'number', 'special'].forEach(req => {
            this.passwordRequirements[req] = document.getElementById(req) as HTMLElement;
        });
    }

    private setupEventListeners() {
        this.generateButton?.addEventListener('click', () => this.generateRandomUsername());
        this.passwordInput?.addEventListener('input', () => this.validatePassword());
    }

    private generateRandomUsername() {
        const adjectives = ['Happy', 'Lucky', 'Clever', 'Brave', 'Swift', 'Bright', 'Cool', 'Wild'];
        const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox', 'Wolf', 'Dragon', 'Phoenix'];
        const numbers = Math.floor(Math.random() * 1000);

        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        
        const username = `${randomAdjective}${randomNoun}${numbers}`;
        if (this.usernameInput) {
            this.usernameInput.value = username;
        }
    }

    private validatePassword() {
        if (!this.passwordInput) return;

        const password = this.passwordInput.value;
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        // Update requirement indicators
        Object.entries(requirements).forEach(([req, isValid]) => {
            const element = this.passwordRequirements[req];
            if (element) {
                element.classList.toggle('valid', isValid);
            }
        });

        // Return true if all requirements are met
        return Object.values(requirements).every(req => req);
    }

    static initialize() {
        console.log('[REGISTER PAGE] Starting initialization');
        // Wait for DOM to be loaded before creating the page instance
        if (document.readyState === 'loading') {
            console.log('[REGISTER PAGE] DOM still loading, adding event listener');
            document.addEventListener('DOMContentLoaded', () => {
                console.log('[REGISTER PAGE] DOM loaded, creating instance');
                new RegisterPage();
            });
        } else {
            console.log('[REGISTER PAGE] DOM already loaded, creating instance');
            new RegisterPage();
        }
    }
}

// Initialize register page
RegisterPage.initialize(); 