
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// Import the main process file
require('./electron/main.js');

// Log startup information
console.log('Electron application starting...');
console.log('App path:', app.getAppPath());
console.log('App directory:', __dirname);
