
export default {
  packagerConfig: {
    asar: true,
    icon: './public/app-icon', // no file extension required
    ignore: [
      '\\.git',
      '/node_modules/(@electron/node-gyp|node-gyp|native-.*)',
      'forge\\.config\\.js',
      '/\\.git/',
      '/node_modules/\\.bin/',
      '/src/',
      '/public/(?!app-icon|favicon)',
      '\\.md$',
      '\\.txt$'
    ]
  },
  rebuildConfig: {
    // Completely disable ALL rebuilding to avoid ANY native dependency issues
    force: false,
    onlyModules: [],
    buildDependenciesFromSource: false,
    // Explicitly disable node-gyp
    npmSkipOptional: true,
    prebuildify: false
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: './public/app-icon.png',
        // An array of strings which are .exe files to sign
        certificateFile: undefined,
        certificatePassword: undefined,
        // Skip native rebuilding
        skipUpdateIcon: true
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    }
  ],
  // Add hooks to prevent native compilation
  hooks: {
    packageAfterCopy: async (config, buildPath) => {
      // Remove any node-gyp references
      console.log('Skipping native module compilation...');
    }
  }
};
