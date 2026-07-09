module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],
      // Reanimated 4 ships its Babel plugin from react-native-worklets.
      // It must be listed last.
      'react-native-worklets/plugin',
    ],
  };
};
