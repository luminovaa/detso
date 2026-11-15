const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

if (process.env.EXPO_METRO_MAX_WORKERS) {
  const maxWorkers = Number(process.env.EXPO_METRO_MAX_WORKERS);
  if (Number.isFinite(maxWorkers) && maxWorkers > 0) {
    config.maxWorkers = maxWorkers;
  }
}

module.exports = withNativeWind(config, { input: "./global.css" });
