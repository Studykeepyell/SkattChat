import { ErrorHandler } from '../../core/errorHandler.js';
import { EventBus } from '../../core/eventBus.js';
import { Constants } from '../../core/constants.js';
import { AuthService } from './authService.js';

export class AuthUIService {
    private authService: AuthService;
    private form: HTMLFormElement | null;
    private errorDisplay: HTMLElement | null;

    constructor(formId: string) {
        this.authService = new AuthService();
        this.form = document.getElementById(formId) as HTMLFormElement;
        this.errorDisplay = document.getElementById('error-message');
        this.setupEventListeners();
    }

    private setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }

    private async handleSubmit(event: Event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(this.form as HTMLFormElement);
            const username = formData.get('username') as string;
            const password = formData.get('password') as string;

            if (!username || !password) {
                throw new Error('Username and password are required');
            }

            const isLoginForm = this.form?.id === 'login-form';
            const response = isLoginForm 
                ? await this.authService.login(username, password)
                : await this.authService.register(username, password);

            if (response.success) {
                window.location.href = '/chat.html';
            } else {
                this.showError(response.message || 'Authentication failed');
            }
        } catch (error) {
            ErrorHandler.handle(error);
            this.showError(error instanceof Error ? error.message : 'An error occurred');
        }
    }

    private showError(message: string) {
        if (this.errorDisplay) {
            this.errorDisplay.textContent = message;
            this.errorDisplay.style.display = 'block';
        }
    }
} 