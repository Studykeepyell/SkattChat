// Access the exposed APIs from preload.js
const { ipcRenderer } = window.electronAPI;

// Example: Log a message to confirm the renderer process is running
console.log('Renderer process started.');

// Initialize your UI components here
// ...your code...

// If you need to communicate with the main process
ipcRenderer.on('message', (data) => {
  // ...handle incoming messages...
});

// Send messages to the main process
ipcRenderer.send('message', 'Hello from renderer');