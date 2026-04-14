const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// expo-modules-core/index.js exports null (JSI stub for native builds).
// For Expo Go (which can't use JSI-only modules), redirect to the full
// TypeScript source so Metro bundles the actual JS implementation.
const expoModulesCoreRoot = path.resolve(
  projectRoot,
  'node_modules/expo-modules-core',
);
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-modules-core') {
    return {
      filePath: path.join(expoModulesCoreRoot, 'src/index.ts'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
