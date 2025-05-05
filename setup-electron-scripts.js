
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Define environment flag for electron builds
if (!packageJson.scripts.build) {
  console.error('Error: package.json is missing the "build" script which is required.');
  process.exit(1);
}

// Fix: Add ELECTRON_RUN environment variable to build script for Electron-specific optimizations
const electronBuildScript = packageJson.scripts.build.includes('ELECTRON_RUN=true') 
  ? packageJson.scripts.build 
  : `cross-env ELECTRON_RUN=true ${packageJson.scripts.build}`;

// Add the Electron-specific scripts
packageJson.scripts = {
  ...packageJson.scripts,
  "electron:dev": "concurrently -k \"cross-env BROWSER=none npm run dev\" \"npm run electron:start\"",
  "electron:start": "wait-on tcp:8080 && cross-env IS_DEV=true electron electron/main.js",
  "electron:build": `${electronBuildScript} && electron-builder build -c electron-builder.json`,
  "electron:build:win": `${electronBuildScript} && electron-builder build --win -c electron-builder.json`,
  "electron:build:mac": `${electronBuildScript} && electron-builder build --mac -c electron-builder.json`,
  "electron:build:linux": `${electronBuildScript} && electron-builder build --linux -c electron-builder.json`
};

// Write the updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Successfully added Electron scripts to package.json');
console.log('Run "npm run electron:dev" to start the development environment');
console.log('Run "npm run electron:build" to build for your current platform');
