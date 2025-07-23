import { React, ReactDOM } from './core/react-interface';

import Goods from './Goods';

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
      Hello React
      <span className='text' style='color: blue'>
        123
      </span>
    </h1>
  );
}

ReactDOM.render(<Goods name='苹果' />, document.getElementById('root'));

// console.log(
//   <h1 id='content' data-name='react' style='color: red'>
//     Hello React<span className='text'>123</span>
//   </h1>
// );
