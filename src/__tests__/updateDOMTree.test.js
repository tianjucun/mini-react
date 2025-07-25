import ReactDOM, { updateDOMTree } from '../mini-react/react-dom';
import React from '../mini-react/react';

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
});
