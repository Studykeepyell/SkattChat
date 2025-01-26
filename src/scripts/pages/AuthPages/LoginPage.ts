import { AuthPage } from './AuthPage';
import { AuthService } from '../../core/authService';

class LoginPage extends AuthPage {
    constructor() {
        super('login-form');
        this.setupAdditionalListeners();
    }

    private setupAdditionalListeners() {
        const form = document.getElementById('login-form');
        if (form) {
            form.setAttribute('data-auth-type', 'login');
        }
    }
}

// Initialize the application when the DOM is ready
function initializeLoginPage() {
    try {
        // Redirect already authenticated users
        if (AuthService.isAuthenticated()) {
            window.location.href = '/pages/chat.html';
            return;
        }
        
        new LoginPage();
    } catch (error) {
        console.error('Failed to initialize login page:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLoginPage);
} else {
    initializeLoginPage();
}

// Export the class for potential use elsewhere
export { LoginPage }; 