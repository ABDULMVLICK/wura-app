const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const path = require('path');

config.resolver.extraNodeModules = {
    crypto: require.resolve('react-native-quick-crypto'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('@craftzdog/react-native-buffer'),
    vm: require.resolve('vm-browserify'),
    process: require.resolve('process/browser.js'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'axios') {
        return {
            filePath: path.resolve(__dirname, 'node_modules/axios/dist/browser/axios.cjs'),
            type: 'sourceFile',
        };
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
