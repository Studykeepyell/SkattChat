import { StorageService } from '../../../core/storageService';
import { Constants } from '../../../core/constants';
import { EventBus } from '../../../core/eventBus';
import { ErrorHandler } from '../../../core/errorHandler';

export interface UserProfile {
    id: string;
    token: string;
    profile?: any;
}

export class ChatAuthService {
    private currentUser: UserProfile | null = null;

    constructor() {}

    public async checkAuthentication(): Promise<boolean> {
        try {
            const token = StorageService.get(Constants.STORAGE_KEYS.AUTH_TOKEN);
            const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
            
            console.log('Auth check - Token exists:', !!token);
            console.log('Auth check - UserID exists:', !!userId);

            if (!token || !userId) {
                return false;
            }

            this.currentUser = {
                id: userId,
                token: token,
                profile: StorageService.get(Constants.STORAGE_KEYS.USER_PROFILE)
            };

            return true;
        } catch (error) {
            console.error('Error during authentication check:', error);
            return false;
        }
    }

    public getCurrentUser(): UserProfile | null {
        return this.currentUser;
    }

    public handleAuthChange({ isAuthenticated, user }: { isAuthenticated: boolean, user?: any }): void {
        if (!isAuthenticated) {
            window.location.href = '../pages/login.html';
            return;
        }

        if (user) {
            this.currentUser = user;
        }
    }
} 