import { AuthModule } from '../../features/auth/index.js';
import { ErrorHandler } from '../../core/errorHandler.js';

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
            });
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private setupErrorHandling() {
        const errorDisplay = document.getElementById('error-message');
        if (errorDisplay) {
            // Setup error display handling
            errorDisplay.style.display = 'none';
        }
    }
} 