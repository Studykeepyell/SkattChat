import { AuthService } from './authService';
import { AuthUIService } from './authUIService';

export class AuthModule {
    private authService: AuthService;
    private authUI: AuthUIService;

    constructor(formId: string, isRegistration: boolean = false) {
        this.authService = new AuthService();
        this.authUI = new AuthUIService(formId, isRegistration);
    }
} 