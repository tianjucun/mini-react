import React from './core/react';
// import React from 'react';
import ReactDOM from './core/react-dom';

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <h1>Hello React</h1>
// );

function App(props) {
  return (
    <h1
      msg={props.msg}
      sign='functional'
      id='content'
      data-name='react'
      style={{ color: 'red' }}
    >
      Hello React<span className='text'>123</span>
    </h1>
  );
}

ReactDOM.render(<App msg='hello react' />, document.getElementById('root'));

// console.log(
//   <h1 id='content' data-name='react' style='color: red'>
//     Hello React<span className='text'>123</span>
//   </h1>
// );
