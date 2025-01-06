import { AuthModule } from '../../features/auth/index';
import { ErrorHandler } from '../../core/errorHandler';
import { Constants } from '../../core/constants';
import { StorageService } from '../../core/storageService';

export class AuthPage {
    protected authModule: AuthModule;

    constructor(formId: string) {
        this.authModule = new AuthModule(formId);
        this.initialize();
    }

    protected initialize() {
        try {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupErrorHandling();
                this.checkAuthStatus();
            });
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private checkAuthStatus() {
        const token = StorageService.get(Constants.STORAGE_KEYS.AUTH_TOKEN);
        const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
        const userProfile = StorageService.get(Constants.STORAGE_KEYS.USER_PROFILE);

        if (token && userId) {
            // If already authenticated, redirect to chat
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