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
        
        // Set isRegistration based on either the passed flag or form attribute
        this.isRegistration = isRegistration || this.form?.getAttribute('data-auth-type') === 'register';
        console.log('[AUTH] Form type:', this.isRegistration ? 'Registration' : 'Login', 
                    'Flag:', isRegistration, 
                    'Form attr:', this.form?.getAttribute('data-auth-type'));
        
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
            this.showError('Please fill in all fields');
            return;
        }

        try {
            console.log('[AUTH] Handling form submission for:', this.isRegistration ? 'Registration' : 'Login');
            
            if (this.isRegistration) {
                const success = await this.authService.register(username, password);
                if (success) {
                    window.location.href = '/dist/pages/chat.html';
                } else {
                    this.showError('Registration failed. Please try again.');
                }
            } else {
                const response = await this.authService.login(username, password);
                if (response.success) {
                    window.location.href = '/dist/pages/chat.html';
                } else {
                    this.showError('Login failed. Please check your credentials.');
                }
            }
        } catch (error: any) {
            // Display user-friendly error message
            if (error.message === 'Username already exists') {
                this.showError('This username is already taken. Please choose a different one.');
            } else if (error.message.includes('Username') || error.message.includes('Password')) {
                this.showError(error.message);
            } else {
                this.showError('An error occurred. Please try again later.');
            }
            console.error('Auth error:', error);
        }
    }

    private showError(message: string) {
        if (this.errorDisplay) {
            this.errorDisplay.textContent = message;
            this.errorDisplay.style.display = 'block';
        } else {
            alert(message);
        }
    }
} 