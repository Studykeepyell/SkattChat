import { TaskbarService } from '../features/layout/TaskbarService';
import { MenuService } from '../features/layout/MenuService';
import { StorageService } from '../core/storageService';
import { Constants } from '../core/constants';
import { API_CONFIG } from '../core/api.config';
import { EventBus } from '../core/eventBus';

class ExplorePage {
    private taskbarService: TaskbarService = new TaskbarService();
    private menuService: MenuService = new MenuService();

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        // Initialize services
        this.taskbarService.initialize();
        this.menuService.initialize();
        this.setupEventListeners();
        this.loadProfileImage();
        this.setupProfileUpdateListener();
    }

    private loadProfileImage(): void {
        const userId = StorageService.get(Constants.STORAGE_KEYS.USER_ID);
        if (userId) {
            const taskbarProfileImg = document.getElementById('taskbar-profile-img') as HTMLImageElement;
            if (taskbarProfileImg) {
                taskbarProfileImg.src = `${API_CONFIG.BASE_URL}/api/users/${userId}/profile-image?${Date.now()}`;
                taskbarProfileImg.onerror = () => {
                    // Fallback to default avatar if image fails to load
                    taskbarProfileImg.src = '/dist/assets/images/default-avatar.svg';
                };
            }
        }
    }

    private setupProfileUpdateListener(): void {
        // Listen for profile updates from other components
        EventBus.subscribe(Constants.EVENTS.PROFILE_UPDATE, (profile: any) => {
            const taskbarProfileImg = document.getElementById('taskbar-profile-img') as HTMLImageElement;
            if (taskbarProfileImg && profile.profileImage) {
                taskbarProfileImg.src = profile.profileImage;
            }
        });
    }

    private setupEventListeners(): void {
        // Add any specific event listeners for the explore page
        document.querySelectorAll('.card-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const target = (e.currentTarget as HTMLElement).getAttribute('data-target');
                if (target) {
                    window.location.href = target;
                }
            });
        });
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    new ExplorePage();
}); 