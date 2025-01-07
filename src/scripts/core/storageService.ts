export class StorageService {
    static set(key: string, value: any) {
        try {
            const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
            localStorage.setItem(key, valueToStore);
        } catch (error) {
            console.error('[STORAGE] Error storing data:', error);
            throw error;
        }
    }

    static get(key: string, parseJson: boolean = false) {
        try {
            const value = localStorage.getItem(key);
            if (!value) return null;
            
            return parseJson ? JSON.parse(value) : value;
        } catch (error) {
            console.error('[STORAGE] Error retrieving data:', error);
            return null;
        }
    }

    static remove(key: string) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('[STORAGE] Error removing data:', error);
            throw error;
        }
    }

    static clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('[STORAGE] Error clearing storage:', error);
            throw error;
        }
    }
} 