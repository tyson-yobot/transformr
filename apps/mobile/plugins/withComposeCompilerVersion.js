/**
 * Expo config plugin that sets the Compose Compiler extension version
 * for all Android subprojects that have compose enabled.
 *
 * Required because Kotlin 1.9.25 needs Compose Compiler 1.5.14,
 * but some libraries (e.g. @stripe/stripe-react-native) don't set
 * composeOptions.kotlinCompilerExtensionVersion themselves.
 */
const { withProjectBuildGradle } = require("expo/config-plugins");

module.exports = function withComposeCompilerVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      const contents = config.modResults.contents;
      const snippet = `
// [withComposeCompilerVersion] Set Compose Compiler version for Kotlin 1.9.25 compatibility
subprojects { subproject ->
    subproject.afterEvaluate {
        if (subproject.plugins.hasPlugin("com.android.library") || subproject.plugins.hasPlugin("com.android.application")) {
            def android = subproject.extensions.findByName("android")
            if (android != null && android.buildFeatures.compose) {
                android.composeOptions {
                    kotlinCompilerExtensionVersion = "1.5.14"
                }
            }
        }
    }
}
`;
      if (!contents.includes("withComposeCompilerVersion")) {
        config.modResults.contents = contents + snippet;
      }
    }
    return config;
  });
};
