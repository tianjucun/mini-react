import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [count, setCount] = useState(1);
  console.log('App render count', Date.now(), count);
  const handleClick = () => {
    console.log('App click count', count);
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  };
  return (
    <div>
      <h1 onClick={handleClick}>多子节点 count: {count}</h1>
      <h1 onClick={handleClick}>
        单子节点 count: <span>{count}</span>
      </h1>
      <p>试试点击数组，加到 11 ！</p>
      <p>{count > 5 ? 'hello' : 'hi'}</p>
      <p>
        {count > 10 ? (
          <div>大于 10 了（目前不支持自动删除！）</div>
        ) : (
          <p>小于 10 哦</p>
        )}
      </p>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
