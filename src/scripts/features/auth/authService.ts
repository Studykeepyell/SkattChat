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

            console.log('[AUTH] Login response:', { success: response.success, username: response.username });

            if (response.success && response.token) {
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
            throw error;
        }
    }

    public async register(username: string, password: string): Promise<boolean> {
        try {
            console.log('[AUTH] Attempting registration for:', username);
            const response = await HttpService.post('/api/auth/register', { username, password });
            console.log('[AUTH] Registration response:', response);

            if (response.success) {
                // Store username since it's not included in the response
                StorageService.set('username', username);
                
                // Set auth data with the username we just used for registration
                this.setAuthData({
                    userId: response.userId,
                    username: username,
                    token: response.token,
                    refreshToken: response.refreshToken
                });

                // Notify about successful registration
                EventBus.publish(Constants.EVENTS.AUTH_CHANGE, { 
                    isAuthenticated: true,
                    user: {
                        id: response.userId,
                        username: username,
                        token: response.token
                    }
                });

                return true;
            }

            // If the response indicates failure, throw the error message
            if (response.message) {
                throw new Error(response.message);
            }
            return false;
        } catch (error) {
            console.error('[AUTH] Registration failed:', error);
            // Rethrow the error to be handled by the UI
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

    private setAuthData(data: { 
        userId?: string, 
        username?: string, 
        token?: string, 
        refreshToken?: string 
    }) {
        try {
            console.log('[AUTH] Setting auth data:', {
                userId: data.userId,
                username: data.username,
                hasToken: !!data.token,
                hasRefreshToken: !!data.refreshToken
            });

            if (!data.token || !data.userId || !data.username) {
                console.log('[AUTH] Missing required auth data:', {
                    hasToken: !!data.token,
                    hasUserId: !!data.userId,
                    hasUsername: !!data.username
                });
                throw new Error('Invalid authentication data received');
            }

            // Set the auth token in HttpService
            HttpService.setAuthToken(data.token);

            // Store auth data
            StorageService.set(Constants.STORAGE_KEYS.AUTH_TOKEN, data.token);
            StorageService.set(Constants.STORAGE_KEYS.USER_ID, data.userId);
            StorageService.set('username', data.username);

            if (data.refreshToken) {
                StorageService.set(Constants.STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
            }

            // Store initial user profile
            StorageService.set('userProfile', JSON.stringify({
                id: data.userId,
                username: data.username
            }));

            return true;
        } catch (error) {
            console.error('[AUTH] Error setting auth data:', error);
            throw error;
        }
    }

    isAuthenticated(): boolean {
        const token = StorageService.get(Constants.STORAGE_KEYS.AUTH_TOKEN);
        const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
        return !!(token && userId);
    }
} 