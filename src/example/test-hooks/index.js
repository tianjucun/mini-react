import React, { useState } from 'react';

function TestHooks() {
  const [count, setCount] = useState(0);

  // useEffect(() => {
  //   setCount(1);
  // }, []);

  const handleClick = () => {
    setCount(count + 2);
  };

  return (
    <div style={{ cursor: 'pointer' }} onClick={handleClick}>
      点击我：{count}
    </div>
  );
}

export default TestHooks;
