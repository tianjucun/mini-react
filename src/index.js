import React from 'react-dom';
import { createRoot } from 'react-dom/client';
import ReactDOM from 'react-dom';

import './version';

console.log(ReactDOM);

const root = createRoot(document.getElementById('root'));
console.log('root: ', root);

const element = (
  <div>
    <h1>Hello React Fiber</h1>
    <ul>
      <li>1. 可中断与恢复</li>
      <li>2. 根据不同的优先级在合适时机执行</li>
      <li>3. 复用之前已经完成的工作</li>
    </ul>
  </div>
);
console.log(element);

root.render(element);
