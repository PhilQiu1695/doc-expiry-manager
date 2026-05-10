const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// lucide-react-native's ESM build imports `react-native-svg` from `dist/esm/`;
// Metro sometimes fails to resolve that peer from nested paths without an explicit mapping.
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  'react-native-svg': path.dirname(require.resolve('react-native-svg/package.json')),
};

module.exports = config;
