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
        
        console.log('[HTTP] Using token:', cleanToken ? `${cleanToken.substring(0, 20)}...` : 'no token');
        
        const headers: Record<string, string> = {};
        
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        if (cleanToken) {
            headers['Authorization'] = cleanToken.startsWith('Bearer ') ? cleanToken : `Bearer ${cleanToken}`;
            console.log('[HTTP] Authorization header set:', headers['Authorization'].substring(0, 30) + '...');
        }
        
        return headers;
    }

    static async get(endpoint: string) {
        try {
            console.log(`[HTTP] Making GET request to: ${endpoint}`);
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return this.handleResponse(response);
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
                body: JSON.stringify(data)
            });
            return this.handleResponse(response);
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
                body: data ? JSON.stringify(data) : undefined
            });
            return await this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    static async upload(endpoint: string, formData: FormData) {
        try {
            console.log(`[HTTP] Making upload request to: ${endpoint}`);
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(true), // Pass true for FormData
                body: formData
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('[HTTP] Upload request failed:', error);
            throw error;
        }
    }

    private static async handleResponse(response: Response) {
        const responseText = await response.text();
        console.log('[HTTP] Response status:', response.status);
        console.log('[HTTP] Response body:', responseText);

        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                console.error('[HTTP] Authentication failed. Token:', 
                    localStorage.getItem(Constants.STORAGE_KEYS.AUTH_TOKEN)?.substring(0, 20) + '...');
                // Clear all auth data
                localStorage.removeItem(Constants.STORAGE_KEYS.AUTH_TOKEN);
                localStorage.removeItem(Constants.STORAGE_KEYS.USER_ID);
                localStorage.removeItem(Constants.STORAGE_KEYS.USER_PROFILE);
                // Force reload to login page using relative path
                window.location.href = '../pages/login.html';
                // Stop execution
                throw new Error('Authentication failed - redirecting to login');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        try {
            return responseText ? JSON.parse(responseText) : {};
        } catch (e) {
            console.error('[HTTP] Failed to parse response:', e);
            return {};
        }
    }

    private static handleError(error: any) {
        console.error('API Error:', error);
        throw error;
    }
} 