import React, { useReducer, useState } from 'react';

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

  // useEffect(() => {
  //   setCount(1);
  // }, []);

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
    </div>
  );
}

export default TestHooks;
