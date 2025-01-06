import { AuthPage } from './AuthPage.js';

export class RegisterPage extends AuthPage {
    constructor() {
        super('register-form');
        this.setupAdditionalListeners();
    }

    private setupAdditionalListeners() {
        // Add any register-specific listeners here
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('register-form');
            if (form) {
                form.setAttribute('data-auth-type', 'register');
            }
        });
    }
}

// Initialize register page
new RegisterPage(); 