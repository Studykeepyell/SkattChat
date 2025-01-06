import { AuthService } from './authService.js';
import { AuthUIService } from './authUIService.js';

export class AuthModule {
    private authService: AuthService;
    private authUI: AuthUIService;

    constructor(formId: string) {
        this.authService = new AuthService();
        this.authUI = new AuthUIService(formId);
    }
} 