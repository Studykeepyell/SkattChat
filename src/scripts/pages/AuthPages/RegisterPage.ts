import { AuthPage } from './AuthPage';

export class RegisterPage extends AuthPage {
    constructor() {
        console.log('[REGISTER PAGE] Initializing...');
        // Initialize with registration flag explicitly set to true
        super('register-form', true);
        console.log('[REGISTER PAGE] Initialized');
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