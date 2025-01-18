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
        console.log('[AUTH] Initializing AuthUIService with:', { formId, isRegistration });
        
        this.authService = new AuthService();
        this.form = document.getElementById(formId) as HTMLFormElement;
        this.errorDisplay = document.getElementById('error-message');
        this.usernameInput = document.getElementById('username') as HTMLInputElement;
        this.passwordInput = document.getElementById('password') as HTMLInputElement;
        
        // Ensure isRegistration is explicitly set as boolean
        this.isRegistration = Boolean(isRegistration);
        console.log('[AUTH] isRegistration set to:', this.isRegistration);
        
        if (this.form) {
            // Set form attribute and verify it was set
            this.form.setAttribute('data-auth-type', this.isRegistration ? 'register' : 'login');
            console.log('[AUTH] Form attribute set to:', this.form.getAttribute('data-auth-type'));
        } else {
            console.error('[AUTH] Form not found:', formId);
        }
        
        this.setupEventListeners();
    }

    private setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
            console.log('[AUTH] Form submit listener added');
        }
    }

    private async handleSubmit(event: Event) {
        event.preventDefault();
        console.log('[AUTH] Form submitted. isRegistration:', this.isRegistration);
        
        const username = this.usernameInput?.value;
        const password = this.passwordInput?.value;
        
        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        try {
            if (this.isRegistration) {
                console.log('[AUTH] Attempting registration for user:', username);
                const success = await this.authService.register(username, password);
                console.log('[AUTH] Registration result:', success);
                if (success) {
                    window.location.href = '/dist/pages/chat.html';
                } else {
                    this.showError('Registration failed. Please try again.');
                }
            } else {
                console.log('[AUTH] Attempting login for user:', username);
                const response = await this.authService.login(username, password);
                if (response.success) {
                    window.location.href = '/dist/pages/chat.html';
                } else {
                    this.showError('Login failed. Please check your credentials.');
                }
            }
        } catch (error: any) {
            console.error('[AUTH] Operation failed:', error);
            if (error.message === 'Username already exists') {
                this.showError('This username is already taken. Please choose a different one.');
            } else if (error.message.includes('Username') || error.message.includes('Password')) {
                this.showError(error.message);
            } else {
                this.showError('An error occurred. Please try again later.');
            }
        }
    }

    private showError(message: string) {
        console.log('[AUTH] Showing error:', message);
        if (this.errorDisplay) {
            this.errorDisplay.textContent = message;
            this.errorDisplay.style.display = 'block';
        } else {
            alert(message);
        }
    }
} 