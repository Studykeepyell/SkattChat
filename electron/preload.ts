import { contextBridge, ipcRenderer } from 'electron';

interface IpcRenderer {
    send(channel: string, data: any): void;
    on(channel: string, func: (...args: any[]) => void): void;
}

interface Api {
    request(endpoint: string, options?: RequestInit): Promise<any>;
}

interface ElectronAPI {
    ipcRenderer: IpcRenderer;
    api: Api;
}

const isDev = process.env.NODE_ENV === 'development';
const API_BASE = isDev ? 'http://localhost:3000/api/v1' : 'https://skattchat.online/api/v1';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'electronAPI',
    {
        ipcRenderer: {
            send: (channel: string, data: any) => {
                ipcRenderer.send(channel, data);
            },
            on: (channel: string, func: (...args: any[]) => void) => {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
        api: {
            async request(endpoint: string, options: RequestInit = {}) {
                const response = await fetch(`${API_BASE}${endpoint}`, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers,
                    },
                });
                return response.json();
            }
        }
    } as ElectronAPI
); 