
module.exports = {
  packagerConfig: {
    asar: true,
    icon: './src/assets/icon' // no file extension required
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // The ICO file to use as the icon for the generated Setup.exe
        setupIcon: './src/assets/icon.ico',
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
