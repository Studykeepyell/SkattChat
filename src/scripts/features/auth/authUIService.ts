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
        
        // Force isRegistration based on form ID
        this.isRegistration = formId === 'register-form';
        console.log('[AUTH] isRegistration set to:', this.isRegistration, 'based on formId:', formId);
        
        if (this.form) {
            // Set form attribute and verify it was set
            this.form.setAttribute('data-auth-type', this.isRegistration ? 'register' : 'login');
            console.log('[AUTH] Form attribute set to:', this.form.getAttribute('data-auth-type'));
            this.setupEventListeners();
        } else {
            console.error('[AUTH] Form not found:', formId);
        }
    }

    private setupEventListeners() {
        if (!this.form) return;
        
        console.log('[AUTH] Setting up event listeners. Current form type:', this.form.getAttribute('data-auth-type'));
        
        // Store the form type before cloning
        const isRegister = this.form.getAttribute('data-auth-type') === 'register';
        
        // Remove any existing submit listeners to prevent duplicates
        const newForm = this.form.cloneNode(true) as HTMLFormElement;
        
        // Re-set the form type after cloning
        newForm.setAttribute('data-auth-type', isRegister ? 'register' : 'login');
        
        // Replace the old form and update our reference
        this.form.parentNode?.replaceChild(newForm, this.form);
        this.form = newForm;
        
        // Re-get input references after form replacement
        this.usernameInput = this.form.querySelector('#username') as HTMLInputElement;
        this.passwordInput = this.form.querySelector('#password') as HTMLInputElement;
        
        // Add the submit listener
        this.form.addEventListener('submit', (event: Event) => {
            event.preventDefault();
            console.log('[AUTH] Form submitted. Type:', this.form?.getAttribute('data-auth-type'));
            this.handleSubmit(event);
        });
        
        console.log('[AUTH] Event listeners set up. Form type is now:', this.form.getAttribute('data-auth-type'));
    }

    private async handleSubmit(event: Event) {
        event.preventDefault();
        
        const formType = this.form?.getAttribute('data-auth-type');
        console.log('[AUTH] Handling form submission. Form type:', formType);
        
        const username = this.usernameInput?.value;
        const password = this.passwordInput?.value;
        
        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        try {
            if (formType === 'register') {
                console.log('[AUTH] Processing registration for:', username);
                const success = await this.authService.register(username, password);
                console.log('[AUTH] Registration result:', success);
                if (success) {
                    window.location.href = '/dist/pages/chat.html';
                } else {
                    this.showError('Registration failed. Please try again.');
                }
            } else {
                console.log('[AUTH] Processing login for:', username);
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