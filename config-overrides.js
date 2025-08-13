const path = require('path');

const resolvePath = (config) =>
  Object.fromEntries(
    Object.entries(config).map(([key, value]) => [
      key,
      path.resolve(__dirname, value),
    ])
  );

const miniReactPathAliasConfig = resolvePath({
  react: 'src/packages/react',
  'react-dom': 'src/packages/react-dom',
  'react-dom-bindings': 'src/packages/react-dom-bindings',
  'react-reconciler': 'src/packages/react-reconciler',
  scheduler: 'src/packages/scheduler',
  shared: 'src/packages/shared',
});

const reactPathAliasConfig = {
  react: 'react',
  'react-dom': 'react-dom',
  'react-dom-bindings': 'react-dom-bindings',
  'react-reconciler': 'react-reconciler',
  scheduler: 'scheduler',
  shared: 'shared',
};

const reactVersion = process.env.REACT_APP_REACT_VERSION;

const RealReactPathAlias =
  reactVersion === 'react18' ? reactPathAliasConfig : miniReactPathAliasConfig;

module.exports = function override(config, env) {
  // 配置别名
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'), // 配置 @ 指向 src 目录
    ...RealReactPathAlias, // 配置 react 相关的别名
  };
  return config;
};
