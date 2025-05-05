
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

createRoot(document.getElementById("root")!).render(<App />);
