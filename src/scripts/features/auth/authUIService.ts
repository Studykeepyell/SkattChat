import { ErrorHandler } from '../../core/errorHandler';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';
import { AuthService } from './authService';

export class AuthUIService {
    private authService: AuthService;
    private form: HTMLFormElement | null;
    private errorDisplay: HTMLElement | null;
    private usernameInput: HTMLInputElement | null;
    private passwordInput: HTMLInputElement | null;
    private isRegistration: boolean;

    constructor(formId: string, isRegistration: boolean) {
        this.authService = new AuthService();
        this.form = document.getElementById(formId) as HTMLFormElement;
        this.errorDisplay = document.getElementById('error-message');
        this.usernameInput = document.getElementById('username') as HTMLInputElement;
        this.passwordInput = document.getElementById('password') as HTMLInputElement;
        this.isRegistration = isRegistration;
        this.setupEventListeners();
    }

    private setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }

    private async handleSubmit(event: Event) {
        event.preventDefault();
        
        const username = this.usernameInput?.value;
        const password = this.passwordInput?.value;
        
        if (!username || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            if (this.isRegistration) {
                const success = await this.authService.register(username, password);
                if (success) {
                    window.location.href = '/dist/pages/chat.html';
                }
            } else {
                const response = await this.authService.login(username, password);
                if (response.success) {
                    window.location.href = '/dist/pages/chat.html';
                }
            }
        } catch (error: any) {
            // Display user-friendly error message
            if (error.message === 'Username already exists') {
                alert('This username is already taken. Please choose a different one.');
            } else if (error.message.includes('Username') || error.message.includes('Password')) {
                alert(error.message);
            } else {
                alert('An error occurred. Please try again later.');
            }
            console.error('Auth error:', error);
        }
    }

    private showError(message: string) {
        if (this.errorDisplay) {
            this.errorDisplay.textContent = message;
            this.errorDisplay.style.display = 'block';
        }
    }
} 