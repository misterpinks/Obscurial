
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Check if the app is running in Electron
const isElectron = window.navigator.userAgent.toLowerCase().indexOf('electron') > -1;

// Add a class to the body when running in Electron
if (isElectron) {
  document.body.classList.add('electron-app');
}

createRoot(document.getElementById("root")!).render(<App />);
