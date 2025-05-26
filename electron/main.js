'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

// Improve path resolution for production
function resolveAppPath(relativePath) {
  return path.join(process.env.NODE_ENV === 'development' 
    ? process.cwd()
    : path.dirname(app.getAppPath()), relativePath);
}

function createWindow() {
  console.log('Creating Electron window');
  console.log('App path:', app.getAppPath());
  console.log('App directory:', __dirname);
  
  // Copy Background.png to the app directory if it doesn't exist
  const backgroundSrc = resolveAppPath('src/components/ui/Background.png');
  const backgroundDest = resolveAppPath('public/Background.png');
  
  try {
    // Only copy if source exists and destination doesn't
    if (fs.existsSync(backgroundSrc) && !fs.existsSync(backgroundDest)) {
      fs.copyFileSync(backgroundSrc, backgroundDest);
      console.log('Background image copied to public folder');
    }
  } catch (err) {
    console.error('Error copying background image:', err);
  }
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Obscurial",
    icon: resolveAppPath('public/app-icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
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
    // Open the DevTools automatically in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    try {
      const indexPath = path.join(__dirname, '../dist/index.html');
      console.log('Loading file:', indexPath);
      console.log('File exists:', fs.existsSync(indexPath));
      
      // Using file protocol with loadURL to ensure proper path resolution
      const fileUrl = url.format({
        pathname: indexPath,
        protocol: 'file:',
        slashes: true
      });
      
      console.log('Loading app with URL:', fileUrl);
      mainWindow.loadURL(fileUrl);
    } catch (err) {
      console.error('Error loading app:', err);
    }
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
    // Update window title again after load to make sure it sticks
    mainWindow.setTitle("Obscurial");
    
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

  // Handle beforeunload event properly to avoid deprecation warnings
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Handle keyboard shortcuts or other input events if needed
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

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Prevent new window creation (security)
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

// IPC handlers for any application-specific functionality can go here
