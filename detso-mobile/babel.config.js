module.exports = function (api) {
  api.cache.using(() => `${process.env.NODE_ENV}|${process.env.BABEL_ENV}`);

  const plugins = [];
  if (process.env.NODE_ENV === 'production' || process.env.BABEL_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }
  plugins.push('react-native-reanimated/plugin'); // HARUS TERAKHIR

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
        },
      ],
    ],
    plugins,
  };
};
