
const fs = require('fs');
const path = require('path');

// Script to clean out any native module references before building
function cleanNativeModules() {
  console.log('Starting aggressive native module cleanup...');
  
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  
  // Directories to remove if they exist
  const nativeModulePaths = [
    path.join(nodeModulesPath, '@electron', 'node-gyp'),
    path.join(nodeModulesPath, 'node-gyp'),
    path.join(nodeModulesPath, '.bin', 'node-gyp'),
    path.join(nodeModulesPath, '.bin', 'node-gyp.cmd'),
    path.join(nodeModulesPath, '.bin', 'node-gyp.ps1'),
    path.join(nodeModulesPath, 'rebuild'),
    path.join(nodeModulesPath, '.bin', 'rebuild'),
    path.join(nodeModulesPath, '@electron')
  ];
  
  nativeModulePaths.forEach(modulePath => {
    if (fs.existsSync(modulePath)) {
      console.log(`Removing native module: ${modulePath}`);
      try {
        fs.rmSync(modulePath, { recursive: true, force: true });
        console.log(`Successfully removed: ${modulePath}`);
      } catch (err) {
        console.warn(`Could not remove ${modulePath}:`, err.message);
      }
    }
  });
  
  // Also clean up any package.json files that might reference node-gyp
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      // Remove any references to node-gyp or @electron/node-gyp
      ['dependencies', 'devDependencies', 'optionalDependencies'].forEach(depType => {
        if (packageJson[depType]) {
          if (packageJson[depType]['@electron/node-gyp']) {
            delete packageJson[depType]['@electron/node-gyp'];
            console.log(`Removed @electron/node-gyp from ${depType}`);
          }
          if (packageJson[depType]['node-gyp']) {
            delete packageJson[depType]['node-gyp'];
            console.log(`Removed node-gyp from ${depType}`);
          }
        }
      });
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } catch (err) {
      console.warn('Could not clean package.json:', err.message);
    }
  }
  
  console.log('Aggressive native module cleanup completed');
}

// Run immediately
cleanNativeModules();

// Export for use as a module
module.exports = cleanNativeModules;
