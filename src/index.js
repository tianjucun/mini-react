import React from './core/react';
// import React from 'react';
import ReactDOM from 'react-dom';

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <h1>Hello React</h1>
// );

ReactDOM.render(<h1>Hello React</h1>, document.getElementById('root'));

console.log(
  <h1 id='content' data-name='react'>
    Hello React<span className='text'>123</span>
  </h1>
);
