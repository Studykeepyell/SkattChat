import { AuthPage } from './AuthPage';

export class RegisterPage extends AuthPage {
    constructor() {
        // Initialize with registration flag
        super('register-form', true);
    }

    static initialize() {
        // Wait for DOM to be loaded before creating the page instance
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                new RegisterPage();
            });
        } else {
            new RegisterPage();
        }
    }
}

// Initialize register page
RegisterPage.initialize(); 