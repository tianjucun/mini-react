import React from 'react';

function App(props) {
  return (
    <h1
      msg={props.msg}
      sign='functional'
      id='content'
      data-name='react'
      style={{ color: 'red' }}
    >
      Hello React
      <span className='text' style='color: blue'>
        123
      </span>
    </h1>
  );
}

export default App;
