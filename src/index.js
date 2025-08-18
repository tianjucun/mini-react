import React from 'react-dom';
import { createRoot } from 'react-dom/client'
import ReactDOM from 'react-dom';

import './version';
 
console.log(ReactDOM);


const root = createRoot(document.getElementById('root'));
console.log('root: ', root);

const element = <h1>Hello React Source Code!</h1>
console.log(element);

root.render(element);