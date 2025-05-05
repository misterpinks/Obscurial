
import { createRoot } from 'react-dom/client'
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

// Create a container for debug info during initialization
if (isElectron) {
  const debugElement = document.createElement('div');
  debugElement.id = 'electron-debug-info';
  debugElement.style.position = 'fixed';
  debugElement.style.top = '0';
  debugElement.style.left = '0';
  debugElement.style.padding = '10px';
  debugElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
  debugElement.style.color = 'white';
  debugElement.style.zIndex = '9999';
  debugElement.innerText = 'Electron App Loading...';
  document.body.appendChild(debugElement);
}

// Log before attempting to render
console.log('About to render React app to root element');
const rootElement = document.getElementById("root");
console.log('Root element found:', rootElement !== null);

if (rootElement) {
  try {
    // Create a fallback UI in case React fails to render
    const fallbackContent = document.createElement('div');
    fallbackContent.id = 'fallback-content';
    fallbackContent.style.display = 'none';
    fallbackContent.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Loading Application...</h2>
        <p>If this message persists, there may be an issue with the application.</p>
      </div>
    `;
    rootElement.appendChild(fallbackContent);
    
    // Show fallback after a timeout if React doesn't render
    const fallbackTimeout = setTimeout(() => {
      if (document.getElementById('fallback-content')) {
        document.getElementById('fallback-content').style.display = 'block';
        console.warn('Showing fallback UI - React may have failed to render');
      }
    }, 3000);
    
    createRoot(rootElement).render(<App />);
    console.log('React render completed');
    
    // Clear fallback timeout since React rendered successfully
    clearTimeout(fallbackTimeout);
    const fallbackElement = document.getElementById('fallback-content');
    if (fallbackElement && fallbackElement.parentNode) {
      fallbackElement.parentNode.removeChild(fallbackElement);
    }
    
    // Update debug element if in Electron
    if (isElectron) {
      const debugElement = document.getElementById('electron-debug-info');
      if (debugElement) {
        debugElement.innerText = 'React App Rendered';
        // Hide the debug element after 5 seconds
        setTimeout(() => {
          if (debugElement && debugElement.parentNode) {
            debugElement.parentNode.removeChild(debugElement);
          }
        }, 5000);
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
