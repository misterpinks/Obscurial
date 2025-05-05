
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import url from 'url';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

function createWindow() {
  console.log('Creating Electron window');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // Changed for security
      contextIsolation: true, // Enable context isolation
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Check if we're in development or production
  const isDev = process.env.IS_DEV === 'true';
  console.log('Running in', isDev ? 'development' : 'production', 'mode');

  // Load the app
  if (isDev) {
    // In development, use the Vite dev server
    const startUrl = 'http://localhost:8080';
    console.log('Loading URL:', startUrl);
    
    // Set Content-Security-Policy to ensure scripts load correctly
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ["script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://cdn.gpteng.co"]
        }
      });
    });
    
    mainWindow.loadURL(startUrl);
    // Open the DevTools automatically
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading file:', indexPath);
    console.log('File exists:', fs.existsSync(indexPath));
    
    mainWindow.loadURL(url.format({
      pathname: indexPath,
      protocol: 'file:',
      slashes: true
    }));
  }

  // Event handler for when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Log loading events
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
    // Do a health check a little later to ensure everything rendered
    setTimeout(() => {
      mainWindow.webContents.executeJavaScript(`
        console.log('==== ELECTRON APP HEALTH CHECK ====');
        console.log('Document ready state:', document.readyState);
        console.log('Root element exists:', document.getElementById('root') !== null);
        if (document.getElementById('root')) {
          console.log('Root content length:', document.getElementById('root').innerHTML.length);
          console.log('Root children count:', document.getElementById('root').childNodes.length);
        }
        document.body.innerHTML.length;
      `).then((contentLength) => {
        console.log('Body content length:', contentLength);
        console.log('App should be visible now');
      }).catch(err => {
        console.error('Error in health check:', err);
      });
    }, 1500);
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(() => {
  console.log('Electron app is ready');
  createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it is common for applications to stay open until the user quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window when the dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for any application-specific functionality can go here
