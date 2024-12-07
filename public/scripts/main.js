// Initialize download handler globally
let downloadHandler;

async function initApp() {
    const { DownloadHandler } = await import('./download-handler.js');
    downloadHandler = new DownloadHandler();
    window.downloadHandler = downloadHandler;
    console.log('Application initialized');
}

// Initialize immediately
initApp().catch(console.error);