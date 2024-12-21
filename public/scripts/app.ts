import '../styles/index.css';

// Main application entry point

// Main application logic
console.log('App initialized');

// Your app initialization code here
document.addEventListener('DOMContentLoaded', () => {
    // DOM-ready code here

    const openIcon = document.querySelector('.btn--open');
    const closeIcon = document.querySelector('.btn--close');
    const navMenu = document.querySelector('.nav__menu');
    const bodyEl = document.body;

    const openMenu = () => {
        if (!navMenu) return;
        navMenu.classList.add('nav__menu--active');
        bodyEl.style.overflow = "hidden";
        addBackdrop();
    }

    const closeMenu = () => {
        if (!navMenu) return;
        navMenu.classList.remove('nav__menu--active');
        bodyEl.style.overflow = "";
        removeBackdrop();
    }

    const addBackdrop = () => {
        const backdrop = document.createElement('div');
        const navEl = document.querySelector('.nav');
        backdrop.classList.add('nav__backdrop');

        if (navEl) {
            navEl.insertBefore(backdrop, navMenu);
        }
    }

    const removeBackdrop = () => {
        const backdrop = document.querySelector('.nav__backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    }

    const closeMenuOutside = (e: any) => {
        if(e.target.classList.contains('nav__backdrop')){
            closeMenu();
        }
    }

    if (openIcon) {
        openIcon.addEventListener('click', openMenu);
    }
    if (closeIcon) {
        closeIcon.addEventListener('click', closeMenu);
    }
    if (window) {
        window.addEventListener('click', closeMenuOutside);
    }
});