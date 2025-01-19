export class MenuService {
    private isInitialized: boolean = false;

    constructor() {
        console.log('[MenuService] Created');
    }

    public initialize(): void {
        if (this.isInitialized) {
            console.log('[MenuService] Already initialized, skipping');
            return;
        }
        console.log('[MenuService] Initializing...');
        this.setupHamburgerMenu();
        this.isInitialized = true;
    }

    private setupHamburgerMenu(): void {
        console.log('[MenuService] Setting up hamburger menu...');
        const hamburgerMenu = document.getElementById('hamburger-menu');
        const bubbleMenu = document.getElementById('bubble-menu');

        console.log('[MenuService] Found elements:', { 
            hamburgerMenu: !!hamburgerMenu, 
            bubbleMenu: !!bubbleMenu 
        });

        if (!hamburgerMenu || !bubbleMenu) {
            console.error('[MenuService] Required elements not found');
            return;
        }

        const handleClick = (event: Event) => {
            console.log('[MenuService] Hamburger clicked');
            event.preventDefault();
            event.stopPropagation();
            bubbleMenu.classList.toggle('active');
            console.log('[MenuService] Bubble menu active:', bubbleMenu.classList.contains('active'));
        };

        // Remove any existing click listeners
        hamburgerMenu.replaceWith(hamburgerMenu.cloneNode(true));
        const newHamburgerMenu = document.getElementById('hamburger-menu');
        if (!newHamburgerMenu) return;

        // Add the click listener
        newHamburgerMenu.addEventListener('click', handleClick);

        console.log('[MenuService] Setup complete');
    }
} 