import React from './core/react';
// import React from 'react';
import ReactDOM from './core/react-dom';

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <h1>Hello React</h1>
// );

ReactDOM.render(
  <h1 id='content' data-name='react' style={{ color: 'red' }}>
    Hello React<span className='text'>123</span>
  </h1>,
  document.getElementById('root')
);

// console.log(
//   <h1 id='content' data-name='react' style='color: red'>
//     Hello React<span className='text'>123</span>
//   </h1>
// );
