export {};

declare global {
    interface Window {
        API_CONFIG: typeof API_CONFIG;
    }
}

const API_CONFIG = {
    BASE_URL: window.location.origin,
    ENDPOINTS: {
        DOWNLOADS: {
            WINDOWS: '/api/downloads/latest/windows',
            MAC: '/api/downloads/latest/mac',
            LINUX: '/api/downloads/latest/linux',
            VERIFY: (platform: string) => `/api/downloads/latest/${platform}/verify`
        }
    },
    FILENAMES: {
        WINDOWS: 'SkyChat-Setup.exe',
        MAC: 'SkyChat.dmg',
        LINUX: 'SkyChat.AppImage'
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
} else {
    window.API_CONFIG = API_CONFIG;
}