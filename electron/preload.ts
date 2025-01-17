const { contextBridge, ipcRenderer } = require('electron');

// Define allowed IPC channels
const validChannels = ['auth:login', 'auth:register', 'chat:message', 'video:call', 'download'] as const;
type ValidChannel = typeof validChannels[number];

interface IpcRenderer {
    send(channel: ValidChannel, data: unknown): void;
    on(channel: ValidChannel, func: (...args: unknown[]) => void): void;
}

interface Api {
    request(endpoint: string, options?: RequestInit): Promise<unknown>;
    download(url: string, filename: string): Promise<void>;
}

interface ElectronAPI {
    ipcRenderer: IpcRenderer;
    api: Api;
}

const isDev = process.env.NODE_ENV === 'development';
const API_BASE = isDev ? 'http://localhost:3000/api/v1' : 'https://skattchat.online/api/v1';

try {
    // Expose protected methods that allow the renderer process to use
    // the ipcRenderer without exposing the entire object
    contextBridge.exposeInMainWorld(
        'electronAPI',
        {
            ipcRenderer: {
                send: (channel: ValidChannel, data: unknown) => {
                    if (validChannels.includes(channel)) {
                        ipcRenderer.send(channel, data);
                    }
                },
                on: (channel: ValidChannel, func: (...args: unknown[]) => void) => {
                    if (validChannels.includes(channel)) {
                        ipcRenderer.on(channel, (event, ...args) => func(...args));
                    }
                }
            },
            api: {
                async request(endpoint: string, options: RequestInit = {}) {
                    try {
                        const response = await fetch(`${API_BASE}${endpoint}`, {
                            ...options,
                            headers: {
                                'Content-Type': 'application/json',
                                ...options.headers,
                            },
                        });
                        return response.json();
                    } catch (error) {
                        console.error('API request failed:', error);
                        throw error;
                    }
                },
                async download(url: string, filename: string) {
                    try {
                        ipcRenderer.send('download', { url, filename });
                    } catch (error) {
                        console.error('Download failed:', error);
                        throw error;
                    }
                }
            }
        } as ElectronAPI
    );
} catch (error) {
    console.error('Failed to load preload script:', error);
} 