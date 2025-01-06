import { API_CONFIG } from './api.config';
import { HttpService } from './httpService';
import { Constants } from './constants';
import { EventBus } from './eventBus';

export class AuthService {
    static async login(username: string, password: string) {
        try {
            const response = await HttpService.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
                username,
                password
            });

            if (response.success) {
                this.setAuthData(response);
                EventBus.publish(Constants.EVENTS.AUTH_CHANGE, { isAuthenticated: true });
                return response;
            }
            throw new Error(response.message || 'Login failed');
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    static async register(username: string, password: string) {
        try {
            const response = await HttpService.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
                username,
                password
            });
            return response;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    static logout() {
        localStorage.removeItem(Constants.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(Constants.STORAGE_KEYS.USER_ID);
        localStorage.removeItem(Constants.STORAGE_KEYS.USER_PROFILE);
        EventBus.publish(Constants.EVENTS.AUTH_CHANGE, { isAuthenticated: false });
    }

    private static setAuthData(data: any) {
        localStorage.setItem(Constants.STORAGE_KEYS.AUTH_TOKEN, data.token);
        localStorage.setItem(Constants.STORAGE_KEYS.USER_ID, data.userId);
        if (data.profile) {
            localStorage.setItem(Constants.STORAGE_KEYS.USER_PROFILE, JSON.stringify(data.profile));
        }
    }

    static isAuthenticated(): boolean {
        return !!localStorage.getItem(Constants.STORAGE_KEYS.AUTH_TOKEN);
    }
} 