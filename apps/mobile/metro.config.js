const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch source files in the monorepo root (but not node_modules)
config.watchFolders = [monorepoRoot];

// All package resolution must start from apps/mobile/node_modules.
// The monorepo root node_modules is only a fallback for non-expo tooling.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
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

  // Metro's virtual entry emits `./node_modules/<pkg>/entry` relative to the
  // monorepo root (because watchFolders includes it). When the origin is
  // outside apps/mobile, rewrite relative node_modules paths so they resolve
  // from apps/mobile/node_modules instead of the (empty) monorepo root.
  if (
    moduleName.startsWith('./node_modules/') &&
    !context.originModulePath.startsWith(projectRoot)
  ) {
    const pkgRelative = moduleName.slice('./node_modules/'.length); // e.g. "expo-router/entry"
    const absolute = path.resolve(projectRoot, 'node_modules', pkgRelative);
    return { filePath: absolute, type: 'sourceFile' };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
