import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [count, setCount] = useState(1);

  // useEffect(() => {
  //   console.log('render effect', count);
  // });

  useEffect(() => {
    console.log('mount1 effect', count);
  }, []);
  useEffect(() => {
    console.log('mount2 effect', count);
  }, []);
  useEffect(() => {
    console.log('mount3 effect', count);
  }, []);
  useEffect(() => {
    console.log('update effect', count);
  }, [count]);

  // useEffect(() => {
  //   console.log('update effect', count);
  //   return () => {
  //     console.log('destroy effect', count);
  //   };
  // }, [count]);
  return <h1 onClick={() => setCount(count + 1)}>Hello React Hooks {count}</h1>;
}

createRoot(document.getElementById('root')).render(<App />);
