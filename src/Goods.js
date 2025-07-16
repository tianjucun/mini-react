import React from './core/react';

class Goods extends React.Component {
  render() {
    return <h1 style='color: red'>Goods {this.props.msg}</h1>;
  }
}

export default Goods;
