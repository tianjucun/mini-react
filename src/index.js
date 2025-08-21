import React, { useReducer } from 'react';
import { createRoot } from 'react-dom/client';

function reducer(count, action) {
  if (action === 'inc') {
    return count + 1;
  }
  return count;
}

function App() {
  const [count, setCount] = useReducer(reducer, 1);
  const handleClick = () => {
    console.log('App click count', count);
    setCount('inc');
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
