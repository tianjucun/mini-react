import React from 'react';
import ReactDOM from 'react-dom';

// 在控制台打印彩色日志，标明当前使用的是哪个版本的 React 和 ReactDOM
const reactVersion = process.env.REACT_APP_REACT_VERSION;
console.log(
  '%c React Version %c %s',
  'color: #61dafb; background: #20232a; padding: 2px 8px; border-radius: 4px;',
  'color: #61dafb;',
  reactVersion
);

export { React, ReactDOM };
