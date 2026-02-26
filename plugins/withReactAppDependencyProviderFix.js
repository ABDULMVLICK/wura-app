/**
 * Fix: "no such module 'ReactAppDependencyProvider'" with use_frameworks! :linkage => :static
 *
 * React Native 0.76 auto-generates ReactAppDependencyProvider via Codegen.
 * When use_frameworks! :linkage => :static is enabled (required by Firebase),
 * the generated target is missing DEFINES_MODULE = YES, so Swift cannot import it.
 *
 * This plugin injects a post_install hook into the generated Podfile to fix this.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PODFILE_FIX = `
  # Fix: ReactAppDependencyProvider with use_frameworks! :linkage => :static (RN 0.76 + Firebase)
  # See: https://github.com/facebook/react-native/issues/47608
  installer.pods_project.targets.each do |target|
    if target.name == 'ReactAppDependencyProvider'
      target.build_configurations.each do |config|
        config.build_settings['DEFINES_MODULE'] = 'YES'
      end
    end
  end
`;

module.exports = function withReactAppDependencyProviderFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (!fs.existsSync(podfilePath)) return config;

      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (podfile.includes('ReactAppDependencyProvider')) {
        // Already patched
        return config;
      }

      // Inject fix at the top of the post_install block
      podfile = podfile.replace(
        /post_install do \|installer\|/,
        `post_install do |installer|${PODFILE_FIX}`
      );

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};
