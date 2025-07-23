import React17 from 'react';
import React17DOM from 'react-dom';

import MiniReact from './react';
import MiniReactDOM from './react-dom';

let React = MiniReact,
  ReactDOM = MiniReactDOM;

//·这里的·REACT_APP_REACT_VERSION·是在·package.json·中通过·cross-env·配置的
// Create·React·App·(CRA)·会将以·REACT_APP_·开头的环境变量注入到浏览器环境
const reactVersion = process.env.REACT_APP_REACT_VERSION;

if (reactVersion === 'react17') {
  console.log('use react17');
  React = React17;
  ReactDOM = React17DOM;
} else {
  console.log('use mini react');
  React = MiniReact;
  ReactDOM = MiniReactDOM;
}

export { React, ReactDOM };
