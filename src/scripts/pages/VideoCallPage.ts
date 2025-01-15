import { VideoCallService } from '../features/chat/services/VideoCallService';
import { EventBus } from '../core/eventBus';
import { Constants } from '../core/constants';
import { io } from 'socket.io-client';

export class VideoCallPage {
    private static instance: VideoCallPage;
    private videoCallService: VideoCallService;
    private socket: any;

    private constructor() {
        // Initialize socket connection
        this.socket = io(Constants.API_URL, {
            withCredentials: true
        });

        this.videoCallService = new VideoCallService(this.socket);
        this.initializeEventListeners();
    }

    public static async init(): Promise<VideoCallPage> {
        if (!VideoCallPage.instance) {
            VideoCallPage.instance = new VideoCallPage();
            await VideoCallPage.instance.initialize();
        }
        return VideoCallPage.instance;
    }

    private async initialize(): Promise<void> {
        try {
            // Get roomId from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get('roomId');

            if (!roomId) {
                throw new Error('Room ID is required');
            }

            // Start the call
            await this.videoCallService.startCall(roomId);
        } catch (error) {
            console.error('Error initializing video call:', error);
            alert('Failed to initialize video call. Please try again.');
            window.close();
        }
    }

    private initializeEventListeners(): void {
        // Mic toggle button
        const toggleMicBtn = document.getElementById('toggleMic');
        toggleMicBtn?.addEventListener('click', () => {
            this.videoCallService.toggleMicrophone();
            toggleMicBtn.classList.toggle('active');
        });

        // Video toggle button
        const toggleVideoBtn = document.getElementById('toggleVideo');
        toggleVideoBtn?.addEventListener('click', () => {
            this.videoCallService.toggleVideo();
            toggleVideoBtn.classList.toggle('active');
        });

        // End call button
        const endCallBtn = document.getElementById('endCall');
        endCallBtn?.addEventListener('click', async () => {
            await this.videoCallService.endCall();
        });

        // Handle events from VideoCallService
        EventBus.subscribe(Constants.EVENTS.MIC_TOGGLE, (event: { enabled: boolean }) => {
            toggleMicBtn?.classList.toggle('active', event.enabled);
        });

        EventBus.subscribe(Constants.EVENTS.VIDEO_TOGGLE, (event: { enabled: boolean }) => {
            toggleVideoBtn?.classList.toggle('active', event.enabled);
        });
    }
}

// Initialize the application when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        VideoCallPage.init().catch(error => {
            console.error('Failed to initialize video call page:', error);
        });
    });
} else {
    VideoCallPage.init().catch(error => {
        console.error('Failed to initialize video call page:', error);
    });
}

// Make this file a module
export {}; 