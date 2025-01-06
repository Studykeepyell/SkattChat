import { AuthPage } from './AuthPage.js';

export class LoginPage extends AuthPage {
    constructor() {
        super('login-form');
        this.setupAdditionalListeners();
    }

    private setupAdditionalListeners() {
        // Add any login-specific listeners here
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('login-form');
            if (form) {
                form.setAttribute('data-auth-type', 'login');
            }
        });
    }
}

// Initialize login page
new LoginPage(); 