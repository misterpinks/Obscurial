
'use strict';

// Use CommonJS require syntax
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// Log startup information to help with troubleshooting
console.log('Electron application starting...');
console.log('App path:', app.getAppPath());
console.log('App directory:', __dirname);
console.log('Is packaged:', app.isPackaged);
console.log('Available paths:');
console.log('  App path:', app.getAppPath());
console.log('  User data path:', app.getPath('userData'));
console.log('  Executable path:', app.getPath('exe'));
console.log('  Current working directory:', process.cwd());

// Check if critical files exist
try {
  const distPath = path.join(__dirname, 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  
  console.log('Checking for critical files:');
  console.log('  dist directory exists:', fs.existsSync(distPath));
  console.log('  index.html exists:', fs.existsSync(indexHtmlPath));
  
  // List files in dist directory to help diagnose issues
  if (fs.existsSync(distPath)) {
    console.log('Contents of dist directory:');
    fs.readdirSync(distPath).forEach(file => {
      console.log(`  - ${file}`);
    });
  }
} catch (err) {
  console.error('Error checking files:', err);
}

// Import the main process file using CommonJS syntax
require('./electron/main.js');
