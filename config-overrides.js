const path = require('path');

module.exports = function override(config, env) {
  // 配置别名
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'), // 配置 @ 指向 src 目录
    // 根据环境变量设置React别名
    react:
      process.env.REACT_APP_REACT_VERSION === 'react17'
        ? 'react'
        : path.resolve(__dirname, 'src/mini-react/react.js'),

    'react-dom':
      process.env.REACT_APP_REACT_VERSION === 'react17'
        ? 'react-dom'
        : path.resolve(__dirname, 'src/mini-react/react-dom.js'),
  };
  return config;
};
