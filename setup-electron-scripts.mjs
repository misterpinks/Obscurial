
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Fix: Ensure dependencies and devDependencies are initialized
if (!packageJson.dependencies) {
  packageJson.dependencies = {};
}

if (!packageJson.devDependencies) {
  packageJson.devDependencies = {};
}

// Ensure electron is properly specified in devDependencies (specific npm version)
packageJson.devDependencies.electron = "^36.1.0";

// Explicitly remove any git repository references
if (packageJson.dependencies['@electron/node-gyp']) {
  delete packageJson.dependencies['@electron/node-gyp'];
}

// Move electron and electron-builder to devDependencies if they exist in dependencies
if (packageJson.dependencies.electron) {
  delete packageJson.dependencies.electron;
}

if (packageJson.dependencies['electron-builder']) {
  packageJson.devDependencies['electron-builder'] = packageJson.dependencies['electron-builder'];
  delete packageJson.dependencies['electron-builder'];
}

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
  "electron:build": `${electronBuildScript} && electron-builder build -c electron-builder.json --no-rebuild`,
  "electron:build:win": `${electronBuildScript} && electron-builder build --win -c electron-builder.json --no-rebuild`,
  "electron:build:mac": `${electronBuildScript} && electron-builder build --mac -c electron-builder.json --no-rebuild`,
  "electron:build:linux": `${electronBuildScript} && electron-builder build --linux -c electron-builder.json --no-rebuild`
};

// Add basic package information if missing
if (!packageJson.description) {
  packageJson.description = "Obscurial - Facial Privacy Editor";
}

if (!packageJson.author) {
  packageJson.author = {
    "name": "Obscurial Team",
    "email": "info@obscurial.app"
  };
}

// Add explicit engines to help with compatibility
packageJson.engines = {
  "node": ">=18.0.0",
  "npm": ">=7.0.0"
};

// Explicitly set type to CommonJS to avoid ES module errors in Electron
packageJson.type = "commonjs";

// Write the updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Successfully updated package.json for Electron build');
console.log('Run "npm run electron:dev" to start the development environment');
console.log('Run "npm run electron:build" to build for your current platform');
