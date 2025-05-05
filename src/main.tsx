
import { createRoot } from 'react-dom/client'
import React from 'react' // Ensure React is explicitly imported
import App from './App.tsx'
import './index.css'

// Check if the app is running in Electron
const isElectron = window.navigator.userAgent.toLowerCase().indexOf('electron') > -1;

// Add a class to the body when running in Electron
if (isElectron) {
  document.body.classList.add('electron-app');
  console.log('Running in Electron environment');
} else {
  console.log('Running in browser environment');
}

// Log before attempting to render
console.log('About to render React app to root element');
const rootElement = document.getElementById("root");
console.log('Root element found:', rootElement !== null);

if (rootElement) {
  try {
    createRoot(rootElement).render(<App />);
    console.log('React render completed');
    
    // Update debug element if in Electron
    if (isElectron) {
      const debugElement = document.getElementById('electron-debug-info');
      if (debugElement) {
        debugElement.innerText = 'React App Rendered';
        // Hide the debug element after 3 seconds
        setTimeout(() => {
          if (debugElement && debugElement.parentNode) {
            debugElement.parentNode.removeChild(debugElement);
          }
        }, 3000);
      }
    }
  } catch (error) {
    console.error('Error rendering React app:', error);
    // Display error in the UI for easier debugging
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; color: red; text-align: center;">
          <h2>Error Rendering Application</h2>
          <pre>${error instanceof Error ? error.message : String(error)}</pre>
        </div>
      `;
    }
  }
} else {
  console.error('Root element not found in the DOM');
}
