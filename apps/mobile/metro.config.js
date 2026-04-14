const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// All packages live in apps/mobile/node_modules — no monorepo hoisting.
// Do NOT add watchFolders for the monorepo root; doing so causes Metro's
// virtual entry to use the wrong originModulePath and fail to resolve
// expo-router/entry.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

const expoModulesCoreRoot = path.resolve(
  projectRoot,
  'node_modules/expo-modules-core',
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // expo-modules-core: redirect to TS source so Metro bundles the JS impl
  if (moduleName === 'expo-modules-core') {
    return {
      filePath: path.join(expoModulesCoreRoot, 'src/index.ts'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
