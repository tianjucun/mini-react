import ReactDOM, { updateDOMTree } from '../mini-react/react-dom';
import React from '../mini-react/react';
import { toVNode } from '../mini-react/util';

// 辅助函数：创建父节点并添加子节点
function setupParentWithChild(childVNode) {
  const parent = document.createElement('div');
  ReactDOM.render(childVNode, parent);
  return parent;
}

describe('updateDOMTree', () => {
  beforeEach(() => {
    // 每个测试前重置文档
    document.body.innerHTML = '';
    console.log = jest.fn(); // 静默控制台输出
  });

  test('should add new node when oldVNode does not exist', () => {
    // 准备数据
    const oldVNode = null;
    const newVNode = React.createElement('div', { id: 'new' }, 'Hello');
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    // 手动设置新节点的父节点（因为旧节点不存在）
    newVNode._parent = parent;

    // 执行测试
    updateDOMTree(oldVNode, newVNode);

    // 验证结果
    expect(parent.querySelector('#new')).not.toBeNull();
    expect(parent.textContent).toContain('Hello');
  });

  test('should delete node when newVNode does not exist', () => {
    // 准备数据
    const oldVNode = <div id='old'>Old content</div>;
    const newVNode = null;
    const parent = setupParentWithChild(oldVNode);

    // 执行测试
    updateDOMTree(oldVNode, newVNode);

    // 验证结果
    expect(parent.querySelector('#old')).toBeNull();
  });

  test('should replace node when types are different', () => {
    // 准备数据
    const oldVNode = <div id='old'>Old content</div>;
    const newVNode = React.createElement('span', { class: 'new' }, 'New');
    const parent = setupParentWithChild(oldVNode);

    // 执行测试
    updateDOMTree(oldVNode, newVNode);

    // 验证结果
    expect(parent.querySelector('#old')).toBeNull(); // 旧节点已删除
    expect(parent.querySelector('span.new')).not.toBeNull(); // 新节点已添加
    expect(parent.textContent).toBe('New');
  });

  test('should update class component', () => {
    class Data extends React.Component {
      render() {
        return <div id='comp'>{this.props.text}</div>;
      }
    }
    const oldVNode = <Data text='Old' />;
    const newVNode = <Data text='New' />;
    const parent = setupParentWithChild(oldVNode);
    updateDOMTree(oldVNode, newVNode);
    expect(parent.querySelector('#comp').textContent).toBe('New');
  });

  test('should update function component', () => {
    function Data(props) {
      return <div id='comp'>{props.text}</div>;
    }
    const oldVNode = <Data text='Old' />;
    const newVNode = <Data text='New' />;
    const parent = setupParentWithChild(oldVNode);
    updateDOMTree(oldVNode, newVNode);
    expect(parent.querySelector('#comp').textContent).toBe('New');
  });

  test('should update text node', () => {
    const oldVNode = toVNode('Old');
    const newVNode = toVNode('New');
    const parent = setupParentWithChild(oldVNode);
    updateDOMTree(oldVNode, newVNode);
    expect(parent.textContent).toBe('New');
  });

  test('should diff children and update accordingly', () => {
    const oldVNode = (
      <ul>
        <li id='A' key='A'>
          A
        </li>
        <li id='B' key='B'>
          B
        </li>
        <li id='C' key='C'>
          C
        </li>
        <li id='D' key='D'>
          D
        </li>
        <li id='E' key='E'>
          E
        </li>
      </ul>
    );
    const newVNode = (
      <ul>
        <li id='C' key='C'>
          C
        </li>
        <li id='E' key='E'>
          E
        </li>
        <li id='F' key='F'>
          F
        </li>
        <li id='D' key='D'>
          D
        </li>
        <li id='A' key='A'>
          A
        </li>
      </ul>
    );
    const parent = setupParentWithChild(oldVNode);
    const oldDOMS = parent.querySelectorAll('li');
    updateDOMTree(oldVNode, newVNode);
    const children = parent.querySelectorAll('li');
    expect(children.length).toBe(5);
    expect(children[0].textContent).toBe('C');
    expect(children[1].textContent).toBe('E');
    expect(children[2].textContent).toBe('F');
    expect(children[3].textContent).toBe('D');
    expect(children[4].textContent).toBe('A');

    [0, 2, 3, 4].forEach((oldIndex) => {
      const oldDOM = oldDOMS[oldIndex];
      const id = oldDOM.id;
      const newDOM = parent.querySelector(`#${id}`);
      // 测试对应 DOM 节点是否被复用
      expect(oldDOM).toBe(newDOM);
    });

    // 查看 B 是否被删除
    expect(parent.querySelector('#B')).toBeNull();
  });

  // test('should properly handle event listener updates', () => {
  //   const handleClickOld = jest.fn();
  //   const handleClickNew = jest.fn();
  //   const oldVNode = <button onClick={handleClickOld}>Click</button>;
  //   const newVNode = <button onClick={handleClickNew}>Click</button>;
  //   ReactDOM.render(oldVNode, document);
  //   const button = parent.querySelector('button');
  // TODO: 目前事件是绑定到 document 上了
  // });

  test('should update forwardRef component correctly', () => {
    const RefComponent = React.forwardRef((props, ref) => (
      <div ref={ref}>{props.text}</div>
    ));
    const ref = React.createRef();
    const oldVNode = <RefComponent text='Old' ref={ref} />;
    const newVNode = <RefComponent text='New' ref={ref} />;
    const parent = setupParentWithChild(oldVNode);
    updateDOMTree(oldVNode, newVNode);
    expect(ref.current.textContent).toBe('New');
  });

  test('should handle null and undefined children properly', () => {
    const oldVNode = <div>Old Content</div>;
    const newVNode = <div>{null}</div>;
    const parent = setupParentWithChild(oldVNode);
    updateDOMTree(oldVNode, newVNode);
    expect(parent.firstChild.textContent).toBe('');

    // 测试 undefined 子节点
    const undefinedVNode = <div>{undefined}</div>;
    updateDOMTree(newVNode, undefinedVNode);
    expect(parent.firstChild.textContent).toBe('');
  });

  test('should correctly update nested components', () => {
    const Grandchild = ({ text }) => <span>{text}</span>;
    const Child = ({ text }) => <Grandchild text={text} />;
    const Parent = ({ text }) => <Child text={text} />;

    const oldVNode = <Parent text='Old' />;
    const newVNode = <Parent text='New' />;
    const parent = setupParentWithChild(oldVNode);
    updateDOMTree(oldVNode, newVNode);
    expect(parent.querySelector('span').textContent).toBe('New');
  });
});
