
const fs = require('fs');
const path = require('path');

// Script to clean out any native module references before building
function cleanNativeModules() {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  
  // Directories to remove if they exist
  const nativeModulePaths = [
    path.join(nodeModulesPath, '@electron', 'node-gyp'),
    path.join(nodeModulesPath, 'node-gyp'),
    path.join(nodeModulesPath, '.bin', 'node-gyp'),
    path.join(nodeModulesPath, '.bin', 'node-gyp.cmd')
  ];
  
  nativeModulePaths.forEach(modulePath => {
    if (fs.existsSync(modulePath)) {
      console.log(`Removing native module: ${modulePath}`);
      try {
        fs.rmSync(modulePath, { recursive: true, force: true });
      } catch (err) {
        console.warn(`Could not remove ${modulePath}:`, err.message);
      }
    }
  });
  
  console.log('Native module cleanup completed');
}

cleanNativeModules();
