import { API_CONFIG } from '../../core/api.config.js';
import { HttpService } from '../../core/httpService.js';
import { EventBus } from '../../core/eventBus.js';
import { Constants } from '../../core/constants.js';
import { ErrorHandler } from '../../core/errorHandler.js';
import { StorageService } from '../../core/storageService.js';

export interface LoginResponse {
    success: boolean;
    userId: string;
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
            const response = await HttpService.post(
                API_CONFIG.ENDPOINTS.AUTH.LOGIN,
                { username, password }
            );

            if (response.success) {
                this.setAuthData(response);
                EventBus.publish(Constants.EVENTS.AUTH_CHANGE, { isAuthenticated: true });
                return response;
            }
            throw new Error(response.message || 'Login failed');
        } catch (error) {
            ErrorHandler.handle(error);
            throw error;
        }
    }

    async register(username: string, password: string): Promise<RegisterResponse> {
        try {
            const response = await HttpService.post(
                API_CONFIG.ENDPOINTS.AUTH.REGISTER,
                { username, password }
            );

            if (response.success) {
                this.setAuthData(response);
                EventBus.publish(Constants.EVENTS.AUTH_CHANGE, { isAuthenticated: true });
                return response;
            }
            throw new Error(response.message || 'Registration failed');
        } catch (error) {
            ErrorHandler.handle(error);
            throw error;
        }
    }

    logout() {
        try {
            StorageService.remove(Constants.STORAGE_KEYS.AUTH_TOKEN);
            StorageService.remove(Constants.STORAGE_KEYS.USER_ID);
            StorageService.remove(Constants.STORAGE_KEYS.USER_PROFILE);
            EventBus.publish(Constants.EVENTS.AUTH_CHANGE, { isAuthenticated: false });
        } catch (error) {
            ErrorHandler.handle(error);
        }
    }

    private setAuthData(data: LoginResponse | RegisterResponse) {
        StorageService.set(Constants.STORAGE_KEYS.AUTH_TOKEN, data.token);
        StorageService.set(Constants.STORAGE_KEYS.USER_ID, data.userId);
    }

    isAuthenticated(): boolean {
        return !!StorageService.get(Constants.STORAGE_KEYS.AUTH_TOKEN);
    }
} 