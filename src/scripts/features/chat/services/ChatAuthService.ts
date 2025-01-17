import { StorageService } from '../../../core/storageService';
import { Constants } from '../../../core/constants';
import { EventBus } from '../../../core/eventBus';
import { ErrorHandler } from '../../../core/errorHandler';
import { HttpService } from '../../../core/httpService';

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
            const username = StorageService.get(Constants.STORAGE_KEYS.USERNAME);
            
            console.log('[CHAT AUTH] Authentication check:', {
                hasToken: !!token,
                hasUserId: !!userId,
                hasUsername: !!username,
                tokenPrefix: token ? token.substring(0, 20) : null
            });

            if (!token || !userId) {
                console.error('[CHAT AUTH] Missing required auth data');
                // Redirect to login if auth data is missing
                window.location.href = '../pages/login.html';
                return false;
            }

            // Ensure token has Bearer prefix
            const tokenWithBearer = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            
            // Update HttpService with the current token
            HttpService.setAuthToken(tokenWithBearer);

            this.currentUser = {
                id: userId,
                token: tokenWithBearer,
                profile: StorageService.get(Constants.STORAGE_KEYS.USER_PROFILE, true)
            };

            console.log('[CHAT AUTH] Authentication successful');
            return true;
        } catch (error) {
            console.error('[CHAT AUTH] Error during authentication check:', error);
            // Redirect to login on error
            window.location.href = '../pages/login.html';
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