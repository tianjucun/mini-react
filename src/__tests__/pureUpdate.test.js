import ReactDOM from '../mini-react/react-dom';
import React from '../mini-react/react';
import { toVNode } from '../mini-react/util';

// 辅助函数：创建父节点并添加子节点
function setupParentWithChild(childVNode) {
  const parent = document.createElement('div');
  ReactDOM.render(childVNode, parent);
  return parent;
}

describe('pureUpdate', () => {
  beforeEach(() => {
    // 每个测试前重置文档
    document.body.innerHTML = '';
    console.log = jest.fn(); // 静默控制台输出
    jest.useFakeTimers();
  });

  test('use pure component should call shouldComponentUpdate', () => {
    class TestComponent extends React.PureComponent {
      static callRenderCount = 0;
      render() {
        TestComponent.callRenderCount++;
        return React.createElement('div', { id: 'new' }, this.props.count);
      }
    }
    class ParentComponent extends React.Component {
      static testInstance = null;
      constructor(props) {
        super(props);
        this.state = {
          count: 0,
          name: 'test',
        };
        ParentComponent.testInstance = this;
      }
      render() {
        return (
          <div>
            <span>name: {this.state.name}</span>
            <TestComponent count={this.state.count} />
          </div>
        );
      }
    }

    const vNode = toVNode(React.createElement(ParentComponent));
    const parent = setupParentWithChild(vNode);
    expect(parent.querySelector('#new').textContent).toBe('0');
    expect(TestComponent.callRenderCount).toBe(1);
    ParentComponent.testInstance.setState({ count: 1 });
    jest.advanceTimersByTime(1);
    expect(parent.querySelector('#new').textContent).toBe('1');
    expect(TestComponent.callRenderCount).toBe(2);
    ParentComponent.testInstance.setState({ name: 'lisi' });
    jest.advanceTimersByTime(1);
    expect(TestComponent.callRenderCount).toBe(2);
  });
});
