import './types';

// Helper to check if scripts are loaded



function checkScriptsLoaded(): boolean {
    if (!window.apiConfig) {
        console.error('API_CONFIG not loaded');
        return false;
    }
    if (!window.downloadHandler) {
        console.error('downloadHandler not loaded');
        return false;
    }
    if (typeof window.downloadHandler.downloadApp !== 'function') {
        console.error('downloadApp method not found');
        return false;
    }
    console.log('All scripts loaded successfully');
    return true;
}

// Global error handler for script loading
window.addEventListener('error', function(e) {
    if (e.target && (e.target as HTMLElement).tagName === 'SCRIPT' || (e.target as HTMLElement).tagName === 'LINK') {
        console.error('Resource loading error:', (e.target as HTMLScriptElement).src || (e.target as HTMLLinkElement).href);
    } else {
        console.error('Script error:', e);
    }
}, true);

// Initialize modules after scripts are loaded
window.addEventListener('load', function() {
    // Set up API config
    if (window.apiConfig_bundle) {
        window.apiConfig = window.apiConfig_bundle.default;
    }
    
    // Set up download handler
    if (window.downloadHandler_bundle) {
        window.downloadHandler = window.downloadHandler_bundle.default;
    }
    
    setTimeout(checkScriptsLoaded, 500);
}); 