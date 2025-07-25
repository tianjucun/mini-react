import React from '../mini-react/react';
import { REACT_ELEMENT_TYPE, REACT_FORWARD_REF_TYPE } from '../mini-react/util';

describe('createElement', () => {
  it('should create an element with the correct structure', () => {
    const type = 'div';
    const props = { id: 'test' };
    const element = React.createElement(type, props, 'Hello');

    // 验证基本结构
    expect(element.$$typeof).toBe(REACT_ELEMENT_TYPE);
    expect(element.type).toBe(type);
    expect(element.key).toBeNull();
    expect(element.ref).toBeNull();
    expect(element.dom).toBeNull();

    // 验证属性和子节点
    expect(element.props.id).toBe('test');
    expect(element.props.children.props.text).toBe('Hello');
  });

  it('should handle key and ref props separately', () => {
    const key = 'key123';
    const ref = React.createRef();
    const element = React.createElement('span', {
      key,
      ref,
      className: 'test',
    });

    // key 和 ref 应该作为顶级属性，而不是在 props 中
    expect(element.key).toBe(key);
    expect(element.ref).toBe(ref);
    expect(element.props.key).toBeUndefined();
    expect(element.props.ref).toBeUndefined();
    expect(element.props.className).toBe('test');
  });

  it('should handle multiple children correctly', () => {
    const child1 = 'Hello';
    const child2 = React.createElement('span', null, 'World');
    const element = React.createElement('div', null, child1, child2);

    // 多个子节点应该以数组形式存在
    expect(Array.isArray(element.props.children)).toBe(true);
    expect(element.props.children.length).toBe(2);
    expect(element.props.children[0].props.text).toBe(child1);
    expect(element.props.children[1]).toBe(child2);
  });

  it('should handle single child as a direct value (not array)', () => {
    const child = React.createElement('span', null, 'Single child');
    const element = React.createElement('div', null, child);

    // 单个子节点应该直接作为值，而不是数组
    expect(Array.isArray(element.props.children)).toBe(false);
    expect(element.props.children).toBe(child);
  });

  it('should handle different types of children', () => {
    const stringChild = 'Text node';
    const numberChild = 123;
    const booleanChild = false; // 应该被忽略
    const nullChild = null; // 应该被忽略

    const element = React.createElement(
      'div',
      null,
      stringChild,
      numberChild,
      booleanChild,
      nullChild
    );

    // 验证有效子节点被正确处理
    expect(element.props.children.length).toBe(2);
    expect(element.props.children[0].props.text).toBe(stringChild);
    expect(element.props.children[1].props.text).toBe(numberChild);
    // 添加验证无效子节点被忽略
    expect(element.props.children[2]).toBeUndefined();
    expect(element.props.children[3]).toBeUndefined();
  });

  it('should create elements with component types', () => {
    function MyComponent() {
      return React.createElement('div');
    }

    const element = React.createElement(MyComponent, { prop1: 'value1' });

    expect(element.type).toBe(MyComponent);
    expect(element.props.prop1).toBe('value1');
  });

  it('should handle forwardRef correctly', () => {
    const render = (props, ref) => React.createElement('input', { ref });
    const ForwardRefComponent = React.forwardRef(render);

    expect(ForwardRefComponent.$$typeof).toBe(REACT_FORWARD_REF_TYPE);
    expect(ForwardRefComponent.render).toBe(render);

    // 测试使用 forwardRef 组件创建元素
    const ref = React.createRef();
    const element = React.createElement(ForwardRefComponent, { ref });

    expect(element.$$typeof).toBe(REACT_ELEMENT_TYPE);
    expect(element.type).toBe(ForwardRefComponent);
    expect(element.ref).toBe(ref);
  });

  it('should create ref objects with current property', () => {
    const ref = React.createRef();

    expect(ref).toEqual({ current: null });
    expect(Object.isSealed(ref)).toBe(true); // 验证 ref 被密封

    // 测试能否修改 current 属性
    ref.current = 'test';
    expect(ref.current).toBe('test');
  });
});
