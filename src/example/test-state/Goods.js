import React from 'react';
class Goods extends React.Component {
  state = {
    color: 'red',
    count: 0,
  };
  constructor(props) {
    super(props);
    setTimeout(() => {
      this.setState({
        color: 'blue',
      });
      console.log('change color success by set state', this.state.color);
    }, 1000);
  }
  handleClick = () => {
    this.setState({
      count: 2,
    });
    this.setState({
      count: 3,
    });
    this.setState({
      count: 4,
    });
    this.setState({
      // 这里的 state.count 获取的仍然是改变前的 count
      // 因为处理事件时，会开启属性的批量更新
      count: this.state.count + 1,
    });
  };
  handleClick2 = () => {
    this.setState((prevState) => {
      console.log('prevState: ', prevState);
      return {
        count: 2,
      };
    });
    this.setState((prevState) => {
      console.log('prevState: ', prevState);
      return {
        count: 3,
      };
    });
  };
  render() {
    console.log('render', Date.now());
    return (
      <h1 style={{ color: this.state.color, userSelect: 'none' }}>
        <span>Goods {this.props.name}</span>
        <span style={{ cursor: 'pointer' }} onClick={this.handleClick}>
          Count {this.state.count}
        </span>
      </h1>
    );
  }
}

export default Goods;
