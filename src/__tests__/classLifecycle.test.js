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
    jest.useFakeTimers();
  });

  test('should call componentDidMount', () => {
    // 模拟类组件
    class TestComponent extends React.Component {
      componentDidMount() {
        console.log('componentDidMount');
      }
      render() {
        return React.createElement('div', { id: 'new' }, 'Hello');
      }
    }
    const vNode = toVNode(React.createElement(TestComponent));
    const parent = setupParentWithChild(vNode);
    expect(console.log).toHaveBeenCalledWith('componentDidMount');
  });

  test('should call componentDidUpdate', () => {
    // 模拟类组件
    class TestComponent extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          count: 0,
        };
      }
      componentDidMount() {
        console.log('componentDidMount');
        setTimeout(() => {
          this.setState({
            count: 1,
          });
        }, 1);
      }
      componentDidUpdate() {
        console.log('componentDidUpdate');
      }
      render() {
        return React.createElement(
          'div',
          { id: 'new' },
          'Hello' + this.state.count
        );
      }
    }
    const vNode = toVNode(React.createElement(TestComponent));
    const parent = setupParentWithChild(vNode);
    const div = parent.querySelector('#new');
    expect(div.textContent).toBe('Hello0');
    // 等待 setState 异步更新
    jest.advanceTimersByTime(1);
    expect(div.textContent).toBe('Hello1');
    expect(console.log).toHaveBeenCalledWith('componentDidUpdate');
  });

  test('should call componentWillUnmount', () => {
    const test = jest.fn();
    // 模拟类组件
    class TestComponent extends React.Component {
      componentWillUnmount() {
        test('componentWillUnmount');
      }
      render() {
        return React.createElement('div', { id: 'new' }, 'Hello');
      }
    }
    class TestComponent2 extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          show: true,
        };
      }
      componentDidMount() {
        console.log('componentDidMount');
        this.setState({
          show: false,
        });
      }
      render() {
        return this.state.show ? <TestComponent /> : null;
      }
    }

    const vNode = toVNode(React.createElement(TestComponent2));
    const parent = setupParentWithChild(vNode);
    jest.advanceTimersByTime(1);
    expect(test).toHaveBeenCalledWith('componentWillUnmount');
  });
  test('should call componentWillUnmount when dom diff', () => {
    // 模拟类组件
    class TestComponent extends React.Component {
      static isCalled = false;

      componentWillUnmount() {
        TestComponent.isCalled = true;
      }
      render() {
        return React.createElement('div', { id: 'new' }, 'Hello');
      }
    }

    class TestComponent2 extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          type: 'Test',
        };
        setTimeout(() => {
          this.setState({
            type: 'Null',
          });
        }, 1);
      }
      renderList(type) {
        if (type === 'A') {
          return (
            <ul>
              <li key='A'>A</li>
            </ul>
          );
        }
        if (type === 'Test') {
          return (
            <ul>
              <li key='A'>
                <TestComponent />
              </li>
            </ul>
          );
        }
        if (type === 'Null') {
          return <ul></ul>;
        }
        return null;
      }
      render() {
        return this.renderList(this.state.type);
      }
    }

    const vNode = toVNode(React.createElement(TestComponent2));
    const parent = setupParentWithChild(vNode);
    jest.advanceTimersByTime(1);
    expect(TestComponent.isCalled).toBe(true);
    expect(parent.querySelector('#new')).toBeNull();
  });

  test('should call shouldComponentUpdate', () => {
    const test = jest.fn();
    const test2 = jest.fn();

    // 模拟类组件
    class TestComponent extends React.Component {
      static isShouldUpdate = false;
      static testInstance = null;
      constructor(props) {
        super(props);
        TestComponent.testInstance = this;
      }
      shouldComponentUpdate() {
        test('shouldComponentUpdate');
        return TestComponent.isShouldUpdate;
      }
      componentDidUpdate() {
        test2('componentDidUpdate');
      }
      render() {
        return React.createElement('div', { id: 'new' }, this.props.count);
      }
    }
    class ParentComponent extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          count: 0,
        };
        setTimeout(() => {
          this.setState({
            count: 1,
          });
        }, 1);
      }
      render() {
        return <TestComponent count={this.state.count} />;
      }
    }

    const vNode = toVNode(React.createElement(ParentComponent));
    const parent = setupParentWithChild(vNode);
    jest.advanceTimersByTime(1);
    expect(test).toHaveBeenCalledWith('shouldComponentUpdate');
    expect(test2).not.toHaveBeenCalledWith('componentDidUpdate');
    TestComponent.isShouldUpdate = true;
    TestComponent.testInstance.setState({
      count: 2,
    });
    expect(test2).toHaveBeenCalledWith('componentDidUpdate');
  });
});
