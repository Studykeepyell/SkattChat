import { API_CONFIG } from "./api.config";
import { Constants } from "./constants";

// Base HTTP service for making API calls
export class HttpService {
    private static authToken: string | null = null;

    static setAuthToken(token: string) {
        if (!token) return;
        const cleanToken = token.replace(/['"]+/g, '').trim();
        this.authToken = cleanToken.startsWith('Bearer ') ? cleanToken : `Bearer ${cleanToken}`;
        localStorage.setItem(Constants.STORAGE_KEYS.AUTH_TOKEN, this.authToken);
        console.log('[HTTP] Token set:', this.authToken.substring(0, 20) + '...');
    }

    private static getHeaders(isFormData = false) {
        const token = this.authToken || localStorage.getItem(Constants.STORAGE_KEYS.AUTH_TOKEN);
        const cleanToken = token?.replace(/['"]+/g, '').trim();
        
        const headers: Record<string, string> = {
            'Accept': 'application/json'
        };
        
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        if (cleanToken) {
            headers['Authorization'] = cleanToken.startsWith('Bearer ') ? cleanToken : `Bearer ${cleanToken}`;
        }
        
        return headers;
    }

    static async get(endpoint: string) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders(),
                credentials: 'include',
                mode: 'cors'
            });
            return this.handleResponse(response, endpoint);
        } catch (error) {
            console.error('[HTTP] GET request failed:', error);
            throw error;
        }
    }

    static async post(endpoint: string, data: any) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
                credentials: 'include',
                mode: 'cors'
            });
            return this.handleResponse(response, endpoint);
        } catch (error) {
            console.error('[HTTP] POST request failed:', error);
            throw error;
        }
    }

    static async put(endpoint: string, data?: any) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: data ? JSON.stringify(data) : undefined,
                credentials: 'include',
                mode: 'cors'
            });
            return await this.handleResponse(response, endpoint);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    static async upload(endpoint: string, formData: FormData) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: formData,
                credentials: 'include',
                mode: 'cors'
            });
            return this.handleResponse(response, endpoint);
        } catch (error) {
            console.error('[HTTP] Upload request failed:', error);
            throw error;
        }
    }

    private static async handleResponse(response: Response, endpoint?: string) {
        try {
            const responseText = await response.text();
            const data = responseText ? JSON.parse(responseText) : {};

            if (!response.ok) {
                if ((response.status === 403 || response.status === 401) && 
                    !endpoint?.includes('/register') && 
                    !endpoint?.includes('/login')) {
                    // Only clear auth and redirect for non-auth endpoints
                    localStorage.removeItem(Constants.STORAGE_KEYS.AUTH_TOKEN);
                    localStorage.removeItem(Constants.STORAGE_KEYS.USER_ID);
                    localStorage.removeItem(Constants.STORAGE_KEYS.USER_PROFILE);
                    
                    window.location.href = '/pages/login.html';
                    throw new Error('Authentication failed');
                }

                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (e) {
            if (e instanceof SyntaxError) {
                console.error('[HTTP] Failed to parse response:', e);
                return {};
            }
            throw e;
        }
    }

    private static handleError(error: any) {
        console.error('API Error:', error);
        throw error;
    }
} 