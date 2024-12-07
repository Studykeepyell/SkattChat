const API_CONFIG = {
    BASE_URL: window.location.origin,
    ENDPOINTS: {
        DOWNLOADS: {
            WINDOWS: '/downloads/latest/windows',
            MAC: '/downloads/latest/mac',
            LINUX: '/downloads/latest/linux',
            VERIFY: (platform) => `/downloads/latest/${platform}/verify`
        }
    },
    FILENAMES: {
        WINDOWS: 'Skychat-Setup.exe',
        MAC: 'Skychat.dmg',
        LINUX: 'Skychat.AppImage'
    }
};