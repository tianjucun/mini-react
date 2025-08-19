import React from 'react-dom';
import { createRoot } from 'react-dom/client';
import ReactDOM from 'react-dom';

import './version';

console.log(ReactDOM);

const root = createRoot(document.getElementById('root'));
console.log('root: ', root);

function NullComponent() {
  return null;
}

function Title({ color }) {
  return (
    <h1
      onClick={(e) => {
        e.stopPropagation();
        console.log('click title');
      }}
      className='aaa'
      style={{ color, fontSize: '50px' }}
    >
      Hello React Fiber
      <NullComponent />
    </h1>
  );
}

function App() {
  const element = (
    <div
      onClick={() => {
        console.log('click app');
      }}
    >
      <Title color='red' />
      <ul>
        <li name='zhangsan' style={{ color: 'blue' }} data-src='123'>
          1. 可中断与恢复
        </li>
        <li style={{ color: 'blue' }}>2. 根据不同的优先级在合适时机执行</li>
        <li style={{ color: 'blue' }}>3. 复用之前已经完成的工作</li>
      </ul>
    </div>
  );
  return element;
}

// console.log(element);

root.render(<App />);
