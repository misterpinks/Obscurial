
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
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // Plugin config
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'src/main.tsx',
            config: 'vite.config.ts',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.config.ts',
          },
        ],
      },
    },
  ],
};
