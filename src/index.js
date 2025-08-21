import React, { useReducer } from 'react';
import { createRoot } from 'react-dom/client';

function reducer(state, action) {
  if (action === 'inc') {
    return {
      ...state,
      count: state.count + 1,
    };
  }
  return {
    ...state,
  };
}

function App() {
  const [state, dispatch] = useReducer(reducer, {
    count: 0,
  });

  console.log('App render', Date.now, state.count);

  function handleClick() {
    dispatch('inc');
    console.log('Click state', Date.now, state.count);
  }

  return (
    <div>
      <h1>{state.count}</h1>
      <button onClick={handleClick}>Click me!</button>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
