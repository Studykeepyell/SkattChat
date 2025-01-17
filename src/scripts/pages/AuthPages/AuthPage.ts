import { AuthModule } from '../../features/auth/index';
import { ErrorHandler } from '../../core/errorHandler';
import { Constants } from '../../core/constants';
import { StorageService } from '../../core/storageService';

export class AuthPage {
    protected authModule: AuthModule = {} as AuthModule;

    constructor(formId: string, isRegistration: boolean = false) {
        try {
            this.authModule = new AuthModule(formId, isRegistration);
            this.setupErrorHandling();
            
            // Only check auth status on login page
            if (!isRegistration && window.location.pathname.includes('login.html')) {
                this.checkAuthStatus();
            }
        } catch (error) {
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