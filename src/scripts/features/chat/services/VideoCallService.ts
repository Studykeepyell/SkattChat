import { EventBus } from '../../../core/eventBus';
import { Constants } from '../../../core/constants';

export class VideoCallService {
    private localStream: MediaStream | null = null;
    private peerConnection: RTCPeerConnection | null = null;
    private roomId: string | null = null;

    constructor(private socket: any) {
        this.initializeSocketHandlers();
    }

    private initializeSocketHandlers(): void {
        this.socket.on('offer', async (data: { offer: RTCSessionDescriptionInit, roomId: string }) => {
            this.roomId = data.roomId;
            await this.handleOffer(data.offer);
        });

        this.socket.on('answer', async (answer: RTCSessionDescriptionInit) => {
            await this.handleAnswer(answer);
        });

        this.socket.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
            await this.handleNewICECandidate(candidate);
        });
    }

    public async startCall(roomId: string): Promise<void> {
        try {
            this.roomId = roomId;
            await this.initializeLocalStream();
            await this.createPeerConnection();
            
            // Create and send offer
            const offer = await this.peerConnection!.createOffer();
            await this.peerConnection!.setLocalDescription(offer);
            
            this.socket.emit('offer', { offer, roomId });
        } catch (error) {
            console.error('Error starting call:', error);
            throw error;
        }
    }

    private async initializeLocalStream(): Promise<void> {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            const localVideo = document.getElementById('localVideo') as HTMLVideoElement;
            if (localVideo) {
                localVideo.srcObject = this.localStream;
            }

            EventBus.publish(Constants.EVENTS.LOCAL_STREAM_READY, { stream: this.localStream });
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error;
        }
    }

    private async createPeerConnection(): Promise<void> {
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };

        this.peerConnection = new RTCPeerConnection(configuration);

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    roomId: this.roomId
                });
            }
        };

        this.peerConnection.ontrack = (event) => {
            const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement;
            if (remoteVideo && event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            }
        };

        // Add local tracks to the peer connection
        this.localStream?.getTracks().forEach(track => {
            this.peerConnection?.addTrack(track, this.localStream!);
        });
    }

    private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        try {
            await this.initializeLocalStream();
            await this.createPeerConnection();
            
            await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.peerConnection!.createAnswer();
            await this.peerConnection!.setLocalDescription(answer);
            
            this.socket.emit('answer', { answer, roomId: this.roomId });
        } catch (error) {
            console.error('Error handling offer:', error);
            throw error;
        }
    }

    private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        try {
            await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('Error handling answer:', error);
            throw error;
        }
    }

    private async handleNewICECandidate(candidate: RTCIceCandidateInit): Promise<void> {
        try {
            await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
            throw error;
        }
    }

    public toggleMicrophone(): void {
        const audioTrack = this.localStream?.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            EventBus.publish(Constants.EVENTS.MIC_TOGGLE, { enabled: audioTrack.enabled });
        }
    }

    public toggleVideo(): void {
        const videoTrack = this.localStream?.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            EventBus.publish(Constants.EVENTS.VIDEO_TOGGLE, { enabled: videoTrack.enabled });
        }
    }

    public async endCall(): Promise<void> {
        this.localStream?.getTracks().forEach(track => track.stop());
        await this.peerConnection?.close();
        this.socket.emit('end-call', { roomId: this.roomId });
        window.close();
    }
} 