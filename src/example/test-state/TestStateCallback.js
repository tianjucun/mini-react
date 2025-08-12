import React from 'react';
class TestStateCallback extends React.Component {
  state = { count: 0 };

  constructor(props) {
    super(props);
    this.countDivRef = React.createRef();
  }

  handleClick = () => {
    // 批量更新场景（React 合成事件中）
    this.setState({ count: this.state.count + 1 }, () =>
      console.log(
        '回调1：',
        this.state.count,
        this.countDivRef.current.textContent
      )
    );
    this.setState({ count: this.state.count + 1 }, () =>
      console.log(
        '回调2：',
        this.state.count,
        this.countDivRef.current.textContent
      )
    );
    this.setState({ count: this.state.count + 1 }, () =>
      console.log(
        '回调3：',
        this.state.count,
        this.countDivRef.current.textContent
      )
    );
  };

  render() {
    return (
      <div>
        <div ref={this.countDivRef}>{this.state.count}</div>
        <button onClick={this.handleClick}>更新</button>
      </div>
    );
  }
}

export default TestStateCallback;
