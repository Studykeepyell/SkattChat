const API_CONFIG = {
    BASE_URL: window.location.origin,
    ENDPOINTS: {
        DOWNLOADS: {
            WINDOWS: '/downloads/latest/windows',
            MAC: '/downloads/latest/mac',
            LINUX: '/downloads/latest/linux',
            VERIFY: (platform: string) => `/downloads/latest/${platform}/verify`
        }
    },
    FILENAMES: {
        WINDOWS: 'SkattChat Setup 1.0.0',
        MAC: 'SkattChat.dmg',
        LINUX: 'SkattChat.AppImage'
    }
};

export default API_CONFIG;