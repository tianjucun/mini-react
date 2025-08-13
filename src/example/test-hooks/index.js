import React, {
  useEffect,
  useReducer,
  useState,
  useLayoutEffect,
  useRef,
  useImperativeHandle,
} from 'react';

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

const Data = React.forwardRef((props, ref) => {
  const [data, setData] = useState([1, 2, 3, 4, 5]);
  useImperativeHandle(
    ref,
    () => ({
      getData() {
        return data;
      },
      updateData(newData) {
        setData(newData);
      },
    }),
    [data, setData]
  );
  return (
    <div>
      <div>数据：{data.join(',')}</div>
    </div>
  );
});

function TestHooks() {
  const [count, setCount] = useState(0);
  const [animalCount, dispatch] = useReducer(incrementAnimalCountReducer, {
    dogCount: 0,
    catCount: 0,
    rabbitCount: 0,
  });
  const boxRef = useRef(null);
  const dataRef = useRef(null);

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
      const box = boxRef.current;

      box.style.width = '100px';
      box.style.height = '100px';
      box.style.backgroundColor = 'red';
    } else {
      const box = boxRef.current;
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
      <div ref={boxRef} id='box'>
        Box
      </div>
      <div>
        <Data ref={dataRef} />
        <button onClick={() => console.log(dataRef.current.getData())}>
          点击打印数据
        </button>
        <button
          onClick={() => dataRef.current.updateData([100, 200, 300, 400, 500])}
        >
          设置数据为：[100, 200, 300, 400, 500]
        </button>
      </div>
    </div>
  );
}

export default TestHooks;
