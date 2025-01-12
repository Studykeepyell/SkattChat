export class TaskbarService {
    constructor() {}

    public initialize(): void {
        this.setupTaskbarNavigation();
    }

    private setupTaskbarNavigation(): void {
        document.querySelectorAll(".taskbar button[data-target]").forEach(button => {
            button.addEventListener("click", () => {
                const targetPage = button.getAttribute("data-target");
                if (targetPage) {
                    window.location.href = targetPage;
                }
            });
        });
    }
} 