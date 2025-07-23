import React from './core/react';

class Goods extends React.Component {
  state = {
    color: 'red',
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
  render() {
    return <h1 style={{ color: this.state.color }}>Goods {this.props.msg}</h1>;
  }
}

export default Goods;
