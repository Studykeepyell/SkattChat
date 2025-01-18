import { AuthModule } from '../../features/auth/index';
import { ErrorHandler } from '../../core/errorHandler';
import { Constants } from '../../core/constants';
import { StorageService } from '../../core/storageService';

export class AuthPage {
    protected authModule: AuthModule = {} as AuthModule;

    constructor(formId: string, isRegistration: boolean = false) {
        try {
            console.log('[AUTH PAGE] Initializing with:', { formId, isRegistration });
            
            // Set the form type before initializing the auth module
            const form = document.getElementById(formId);
            if (form) {
                // Ensure the form type is set correctly
                form.setAttribute('data-auth-type', isRegistration ? 'register' : 'login');
                console.log('[AUTH PAGE] Set form type to:', form.getAttribute('data-auth-type'));
            } else {
                console.error('[AUTH PAGE] Form not found:', formId);
            }

            // Initialize auth module with explicit boolean
            this.authModule = new AuthModule(formId, Boolean(isRegistration));
            this.setupErrorHandling();
            
            // Only check auth status on login page
            if (!isRegistration && window.location.pathname.includes('login.html')) {
                this.checkAuthStatus();
            }
        } catch (error) {
            console.error('[AUTH PAGE] Initialization error:', error);
            ErrorHandler.handle(error);
        }
    }

    private checkAuthStatus() {
        const token = StorageService.get(Constants.STORAGE_KEYS.AUTH_TOKEN);
        const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);

        console.log('Auth check - Token exists:', token);
        console.log('Auth check - UserID exists:', userId);

        if (token && userId) {
            // If already authenticated, redirect to chat using relative path
            window.location.href = '../pages/chat.html';
        }
    }

    private setupErrorHandling() {
        const errorDisplay = document.getElementById('error-message');
        if (errorDisplay) {
            errorDisplay.style.display = 'none';
        }
    }
} 