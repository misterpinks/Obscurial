
export default {
  packagerConfig: {
    asar: true,
    icon: './public/app-icon', // no file extension required
    ignore: [
      '\\.git',
      '/node_modules/(@electron/node-gyp|node-gyp)',
      'forge\\.config\\.js',
      '/\\.git/',
      '/node_modules/\\.bin/',
      '/src/',
      '/public/(?!app-icon|favicon)',
      '\\.md$',
      '\\.txt$'
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: './public/app-icon.png',
        // An array of strings which are .exe files to sign
        certificateFile: undefined,
        certificatePassword: undefined
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    }
  ],
};
