import React from 'react';
import ReactDOM from 'react-dom';
import Example from '@/example';

import './version';

ReactDOM.render(
  <Example componentName='test-snapshot' />,
  document.getElementById('root')
);
