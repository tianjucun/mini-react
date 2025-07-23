import { REACT_ELEMENT_TYPE } from './util';
import Component from './Component';

function createElement(type, props, ...children) {
  console.log('createElement: ', arguments);
  const { key = null, ref = null, __self, __source, ...elementProps } = props;
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    props: {
      ...elementProps,
      children: children.length === 1 ? children[0] : children,
    },
    key,
    ref,
    // _self: __self,
    // _source: __source,
    dom: null,
  };
}

export default {
  createElement,
  Component,
};
