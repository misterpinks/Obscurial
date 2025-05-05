
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Add the Electron-specific scripts
packageJson.scripts = {
  ...packageJson.scripts,
  "electron:dev": "concurrently -k \"cross-env BROWSER=none npm run dev\" \"npm run electron:start\"",
  "electron:start": "wait-on tcp:8080 && cross-env IS_DEV=true electron electron/main.js",
  "electron:build": "npm run build && electron-builder build -c electron-builder.json",
  "electron:build:win": "npm run build && electron-builder build --win -c electron-builder.json",
  "electron:build:mac": "npm run build && electron-builder build --mac -c electron-builder.json",
  "electron:build:linux": "npm run build && electron-builder build --linux -c electron-builder.json"
};

// Write the updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Successfully added Electron scripts to package.json');
