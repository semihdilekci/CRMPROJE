const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

let config = getDefaultConfig(__dirname);
const defaultResolve = config.resolver.resolveRequest;

// Monorepo fix: resolve expo-router/_ctx to our ctx with literal path (Metro requires static require.context)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-router/_ctx') {
    const ctxFile = platform === 'ios' ? 'ctx.ios.js' : 'ctx.android.js';
    return {
      filePath: path.resolve(__dirname, ctxFile),
      type: 'sourceFile',
    };
  }
  return defaultResolve ? defaultResolve(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

config = withNativeWind(config, { input: './global.css' });
module.exports = config;
