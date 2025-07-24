import { REACT_ELEMENT_TYPE, REACT_FORWARD_REF_TYPE } from './util';
import Component from './Component';

function createElement(type, props, ...children) {
  // console.log('createElement: ', arguments);
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

function createRef() {
  const ref = {
    current: null,
  };

  // 防止外界修改 current 属性的名字或者新增其他属性
  Object.seal(ref);

  return ref;
}

/**
 * 由于函数组件没有实例，默认情况下无法接收 ref 属性
 * 可通过 forwardRef 将 ref 属性转发给对应的函数组件
 * forwardRef返回一个可以在JSX中呈现的React组件。
 * 与定义为普通函数的React组件不同，由forwardRef返回的组件也能够接收一个ref prop。
 * @param {*} render
 * @returns
 */
function forwardRef(render) {
  return {
    // 标记为 forwardRef 类型
    $$typeof: REACT_FORWARD_REF_TYPE,
    render,
  };
}

export default {
  createElement,
  Component,
  createRef,
  forwardRef,
};
