export class StorageService {
    static set(key: string, value: any) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
        } catch (error) {
            console.error('Error storing data:', error);
        }
    }

    static get(key: string) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error retrieving data:', error);
            return null;
        }
    }

    static remove(key: string) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing data:', error);
        }
    }

    static clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
} 