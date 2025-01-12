export class MenuService {
    constructor() {}

    public initialize(): void {
        this.setupHamburgerMenu();
    }

    private setupHamburgerMenu(): void {
        const hamburgerMenu = document.getElementById('hamburger-menu');
        const bubbleMenu = document.getElementById('bubble-menu');

        hamburgerMenu?.addEventListener('click', (event) => {
            event.stopPropagation();
            bubbleMenu?.classList.toggle('active');
        });

        document.addEventListener('click', (event) => {
            if (!hamburgerMenu?.contains(event.target as Node) && !bubbleMenu?.contains(event.target as Node)) {
                bubbleMenu?.classList.remove('active');
            }
        });
    }
} 