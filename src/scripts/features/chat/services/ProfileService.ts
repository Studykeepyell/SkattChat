import { StorageService } from '../../../core/storageService';
import { Constants } from '../../../core/constants';
import { ErrorHandler } from '../../../core/errorHandler';
import { UserProfile } from './ChatAuthService';

export class ProfileService {
    constructor(private currentUser: UserProfile | null) {}

    public async loadUserProfile(): Promise<void> {
        try {
            if (!this.currentUser?.id) {
                console.log('No user ID found');
                return;
            }

            await this.updateProfileImage();
            this.updateUsername();
        } catch (error) {
            console.error('Error loading user profile:', error);
            ErrorHandler.handle(error);
        }
    }

    private async updateProfileImage(): Promise<void> {
        const profileImg = document.getElementById("taskbar-profile-img") as HTMLImageElement;
        if (profileImg && this.currentUser?.id) {
            profileImg.src = `/api/users/${this.currentUser.id}/profile-image?${Date.now()}`;
            profileImg.onerror = () => {
                profileImg.src = '/assets/images/default-avatar.svg';
            };
        }
    }

    private updateUsername(): void {
        const usernameElement = document.getElementById("username-display");
        if (usernameElement && this.currentUser?.profile?.username) {
            usernameElement.textContent = this.currentUser.profile.username;
        }
    }

    public handleProfileUpdate(profile: any): void {
        if (this.currentUser) {
            this.currentUser.profile = profile;
            StorageService.set(Constants.STORAGE_KEYS.USER_PROFILE, profile);
            this.loadUserProfile();
        }
    }
} 