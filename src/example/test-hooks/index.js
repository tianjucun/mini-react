import React, { useEffect, useReducer, useState, useLayoutEffect } from 'react';

function incrementAnimalCountReducer(state, action) {
  switch (action.type) {
    case 'dog':
      return { ...state, dogCount: state.dogCount + 1 };
    case 'cat':
      return { ...state, catCount: state.catCount + 1 };
    case 'rabbit':
      return { ...state, rabbitCount: state.rabbitCount + 1 };
    default:
      return state;
  }
}

function TestHooks() {
  const [count, setCount] = useState(0);
  const [animalCount, dispatch] = useReducer(incrementAnimalCountReducer, {
    dogCount: 0,
    catCount: 0,
    rabbitCount: 0,
  });
  useEffect(() => {
    setCount(100);
  }, []);

  useEffect(() => {
    console.log('useEffect 执行', count);
    return () => {
      console.log('useEffect 清理', count);
    };
  }, [count]);

  useLayoutEffect(() => {
    if (count > 105) {
      const box = document.getElementById('box');
      box.style.width = '100px';
      box.style.height = '100px';
      box.style.backgroundColor = 'red';
    } else {
      const box = document.getElementById('box');
      box.style.width = 'auto';

      box.style.height = 'auto';
      box.style.backgroundColor = 'transparent';
    }
    return () => {
      if (count > 105) {
        setCount(100);
      }
      console.log('useLayoutEffect 清理');
    };
  }, [count]);

  const handleClick = () => {
    setCount(count + 2);
  };

  const renderAnimalCount = () => {
    const { dogCount, catCount, rabbitCount } = animalCount;
    return (
      <ul>
        <li onClick={() => dispatch({ type: 'dog' })}>狗：{dogCount}</li>
        <li onClick={() => dispatch({ type: 'cat' })}>猫：{catCount}</li>
        <li onClick={() => dispatch({ type: 'rabbit' })}>兔：{rabbitCount}</li>
      </ul>
    );
  };

  return (
    <div>
      <div onClick={handleClick}>点击我：{count}</div>
      <div>{renderAnimalCount()}</div>
      <div id='box'>Box</div>
    </div>
  );
}

export default TestHooks;
