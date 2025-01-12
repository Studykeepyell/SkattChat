import { API_CONFIG } from '../../core/api.config';
import { HttpService } from '../../core/httpService';
import { EventBus } from '../../core/eventBus';
import { Constants } from '../../core/constants';
import { ErrorHandler } from '../../core/errorHandler';
import { StorageService } from '../../core/storageService';

export interface LoginResponse {
    success: boolean;
    userId: string;
    username: string;
    token: string;
    message?: string;
}

export interface RegisterResponse {
    success: boolean;
    userId: string;
    token: string;
    message: string;
}

export class AuthService {
    async login(username: string, password: string): Promise<LoginResponse> {
        try {
            console.log('[AUTH] Attempting login for:', username);
            
            const response = await HttpService.post(
                API_CONFIG.ENDPOINTS.AUTH.LOGIN,
                { username, password }
            );

            console.log('[AUTH] Login response success:', response.success);
            console.log('[AUTH] Login response username:', response.username);

            if (response.success) {
                this.setAuthData(response);
                EventBus.publish(Constants.EVENTS.AUTH_CHANGE, { 
                    isAuthenticated: true,
                    user: {
                        id: response.userId,
                        username: response.username,
                        token: response.token
                    }
                });
                return response;
            }
            throw new Error(response.message || 'Login failed');
        } catch (error) {
            console.error('[AUTH] Login error:', error);
            ErrorHandler.handle(error);
            throw error;
        }
    }

    async register(username: string, password: string): Promise<RegisterResponse> {
        try {
            console.log('[AUTH] Attempting registration for:', username);
            
            const response = await HttpService.post(
                API_CONFIG.ENDPOINTS.AUTH.REGISTER,
                { username, password }
            );

            console.log('[AUTH] Registration response success:', response.success);

            if (response.success) {
                this.setAuthData(response);
                EventBus.publish(Constants.EVENTS.AUTH_CHANGE, { 
                    isAuthenticated: true,
                    user: {
                        id: response.userId,
                        token: response.token
                    }
                });
                return response;
            }
            throw new Error(response.message || 'Registration failed');
        } catch (error) {
            console.error('[AUTH] Registration error:', error);
            ErrorHandler.handle(error);
            throw error;
        }
    }

    logout() {
        try {
            console.log('[AUTH] Logging out...');
            
            // Clear all auth-related data
            StorageService.remove('authData');
            StorageService.remove('token');
            StorageService.remove('userId');
            StorageService.remove('username');
            StorageService.remove('profileImageURL');
            StorageService.remove(Constants.STORAGE_KEYS.AUTH_TOKEN);
            StorageService.remove(Constants.STORAGE_KEYS.USER_ID);
            StorageService.remove(Constants.STORAGE_KEYS.USER_PROFILE);
            StorageService.remove('currentRoom');

            // Clear session storage as well
            sessionStorage.clear();
            
            // Notify about auth change
            EventBus.publish(Constants.EVENTS.AUTH_CHANGE, { 
                isAuthenticated: false,
                userId: null,
                token: null
            });

            console.log('[AUTH] Logout complete');
        } catch (error) {
            console.error('[AUTH] Logout error:', error);
            ErrorHandler.handle(error);
        }
    }

    private setAuthData(data: any) {
        console.log('[AUTH] Setting auth data:', data);
        
        // Store full auth data
        StorageService.set('authData', JSON.stringify({
            userId: data.userId,
            token: data.token,
            username: data.username,
            user: {
                _id: data.userId,
                username: data.username
            }
        }));

        // Store individual pieces for easy access
        StorageService.set('token', data.token);
        StorageService.set('userId', data.userId);
        StorageService.set('username', data.username);
        StorageService.set(Constants.STORAGE_KEYS.AUTH_TOKEN, data.token);
        StorageService.set(Constants.STORAGE_KEYS.USER_ID, data.userId);

        EventBus.publish(Constants.EVENTS.AUTH_CHANGE, {
            isAuthenticated: true,
            userId: data.userId,
            username: data.username,
            token: data.token
        });
    }

    isAuthenticated(): boolean {
        const token = StorageService.get(Constants.STORAGE_KEYS.AUTH_TOKEN);
        const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
        return !!(token && userId);
    }
} 