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
  'react-dom-bindings$': 'src/packages/react-dom-bindings',
  'react-dom-bindings*': 'src/packages/react-dom-bindings/src*',
  'react-dom$': 'src/packages/react-dom',
  'react-dom*': 'src/packages/react-dom/src*',
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

function excludeJsFile(config) {
  // 定义要排除的文件夹路径：src/example
  const excludePath = /src\/example/;
  // 处理所有模块规则，排除目标文件夹
  config.module.rules.forEach((rule) => {
    // 对于有test属性的规则（处理特定文件类型的规则）
    if (rule.test) {
      // 如果已有exclude，在其基础上添加；否则创建exclude数组
      if (rule.exclude) {
        rule.exclude = Array.isArray(rule.exclude)
          ? rule.exclude
          : [rule.exclude];
        // 避免重复添加
        if (
          !rule.exclude.some(
            (item) => item.toString() === excludePath.toString()
          )
        ) {
          rule.exclude.push(excludePath);
        }
      } else {
        rule.exclude = [excludePath];
      }
    }
  });
}

module.exports = function override(config, env) {
  excludeJsFile(config);

  // 配置别名
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'), // 配置 @ 指向 src 目录
    ...RealReactPathAlias, // 配置 react 相关的别名
  };
  return config;
};
