import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Get the root element
const container = document.getElementById('root');

// Ensure the container exists
if (!container) {
    throw new Error('Root element not found in the document');
}

// Create a root
const root = createRoot(container);

// Render the app
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
); 