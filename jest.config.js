module.exports = {
  // 使用明确的 jest-environment-jsdom 环境而不是简写
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  // 处理 JSX 和自定义 createElement
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  // 确保正确识别模块文件扩展名
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  // 可选：如果有需要忽略的文件
  testPathIgnorePatterns: ['/node_modules/'],
};
