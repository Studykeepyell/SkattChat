import { TaskbarService } from '../features/layout/TaskbarService';

class ExplorePage {
    private taskbarService: TaskbarService;

    constructor() {
        this.taskbarService = new TaskbarService();
        this.initialize();
    }

    private initialize(): void {
        this.taskbarService.initialize();
        this.setupEventListeners();
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