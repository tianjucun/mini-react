import React, { useEffect, useState, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';

function observe(targetNode) {
  // 观察器的配置（需要观察什么变动）
  const config = { characterData: true };

  // 当观察到变动时执行的回调函数
  const callback = function (mutationsList, observer) {
    // Use traditional 'for loops' for IE 11
    const characterDataMutaion = mutationsList[0];
    console.log(
      'The text count was modified',
      characterDataMutaion.target.textContent
    );
  };

  // 创建一个观察器实例并传入回调函数
  const observer = new MutationObserver(callback);

  // 以上述配置开始观察目标节点
  observer.observe(targetNode, config);

  return () => {
    // 之后，可停止观察
    observer.disconnect();
  };
}

function App() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    console.log('render effect', count);
    const parentNode = document.getElementsByTagName('h1')[0];
    const textNode = parentNode.childNodes[1];

    // 观察对应的执行顺序
    // destroy layout effect 1
    // update layout effect 2 textContent:  Hello React Hooks 2
    // The text count was modified 2
    // update effect 2 textContent:  Hello React Hooks 2

    // 可以看出 layout effect 是在 页面渲染 前执行的
    // 而 effect 是在 页面渲染后执行的
    const destroy = observe(textNode);
    return () => {
      destroy();
    };
  }, []);

  useLayoutEffect(() => {
    console.log('mount1 effect', count);
  }, []);
  useLayoutEffect(() => {
    console.log('mount2 effect', count);
  }, []);
  useLayoutEffect(() => {
    console.log('mount3 effect', count);
  }, []);
  useEffect(() => {
    const textContent = document.getElementsByTagName('h1')[0].textContent;
    console.log('update effect', count, 'textContent: ', textContent);
  }, [count]);
  useLayoutEffect(() => {
    const textContent = document.getElementsByTagName('h1')[0].textContent;
    console.log('update layout effect', count, 'textContent: ', textContent);
    return () => {
      console.log('destroy layout effect', count);
    };
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
