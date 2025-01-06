import { API_CONFIG } from "./api.config.js";

// Base HTTP service for making API calls
export class HttpService {
    private static getHeaders(): Headers {
        const headers = new Headers(API_CONFIG.HEADERS.JSON);
        const token = localStorage.getItem('authToken');
        if (token) {
            headers.append('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    static async get(url: string) {
        try {
            const response = await fetch(url, {
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    static async post(url: string, data: any) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            return await this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    static async put(url: string, data?: any) {
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: data ? JSON.stringify(data) : undefined
            });
            return await this.handleResponse(response);
        } catch (error) {
            this.handleError(error);
        }
    }

    private static async handleResponse(response: Response) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    private static handleError(error: any) {
        console.error('API Error:', error);
        throw error;
    }
} 