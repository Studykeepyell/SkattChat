import API_CONFIG from './api.config';

interface DownloadHandler {
    downloadApp(platform: 'windows' | 'mac' | 'linux'): void;
}

declare global {
    interface Window {
        downloadHandler: DownloadHandler;
        apiConfig: typeof API_CONFIG;
    }
}

class DownloadHandlerImpl implements DownloadHandler {
    constructor() {
        console.log('DownloadHandler initialized');
    }

    downloadApp(platform: 'windows' | 'mac' | 'linux'): void {
        console.log(`Attempting to download for ${platform}`);
        try {
            const config = window.apiConfig || API_CONFIG;
            let downloadUrl: string;

            switch (platform) {
                case 'windows':
                    downloadUrl = config.ENDPOINTS.DOWNLOADS.WINDOWS;
                    break;
                case 'mac':
                    downloadUrl = config.ENDPOINTS.DOWNLOADS.MAC;
                    break;
                case 'linux':
                    downloadUrl = config.ENDPOINTS.DOWNLOADS.LINUX;
                    break;
                default:
                    throw new Error(`Unsupported platform: ${platform}`);
            }

            if (platform === 'windows') {
                console.log(`Downloading from: ${downloadUrl}`);
                window.location.href = downloadUrl;
            } else {
                alert(`Downloads for ${platform} are coming soon!`);
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('Download failed. Please try again later.');
        }
    }
}

// Create the handler instance
const handler = new DownloadHandlerImpl();

// Export for webpack to expose to window
export default handler;