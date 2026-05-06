/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && .\\gradlew.bat assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
  },
  devices: {
    'android.emulator': {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7',
      },
    },
  },
  configurations: {
    'android.emu.debug': {
      device: 'android.emulator',
      app: 'android.debug',
    },
  },
};
