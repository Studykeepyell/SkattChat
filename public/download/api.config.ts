interface ApiConfig {
    BASE_URL: string;
    ENDPOINTS: {
        DOWNLOADS: {
            WINDOWS: string;
            MAC: string;
            LINUX: string;
            VERIFY: (platform: string) => string;
        }
    };
    FILENAMES: {
        WINDOWS: string;
        MAC: string;
        LINUX: string;
    };
}

declare global {
    interface Window {
        apiConfig: ApiConfig;
    }
}

const API_CONFIG: ApiConfig = {
    BASE_URL: window.location.origin,
    ENDPOINTS: {
        DOWNLOADS: {
            WINDOWS: '/dist/releases/SkattChat-Setup-1.0.0.exe',
            MAC: '/dist/releases/SkattChat-1.0.0.dmg',
            LINUX: '/dist/releases/SkattChat-1.0.0.AppImage',
            VERIFY: (platform: string) => `/api/downloads/verify/${platform}`
        }
    },
    FILENAMES: {
        WINDOWS: 'SkattChat Setup 1.0.0.exe',
        MAC: 'SkattChat-1.0.0.dmg',
        LINUX: 'SkattChat-1.0.0.AppImage'
    }
};

// Export for webpack
export default API_CONFIG;