import React from 'react';

import Goods from '../test-state/Goods';

const { forwardRef } = React;
const TestForwadRef = forwardRef((props, ref) => {
  const handleClick = () => {
    ref.current.textContent = Number(ref.current.textContent) + 1;
  };
  console.log('forwardRef render', props, ref);
  return (
    <div style={props.style}>
      <span>forwardRef 测试：</span>
      <div>
        <span ref={ref}>1</span>
        &nbsp;&nbsp;
        <button onClick={handleClick}>+1</button>
      </div>
    </div>
  );
});

class TestRef extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.goodsRef = React.createRef();
    this.forwardRef = React.createRef();
    this.spanEl = null;

    this.boxStyle = {
      border: 'solid 1px #ccc',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
    };
  }
  handleClick = () => {
    console.log('ref: ', this.ref.current);
    this.ref.current.textContent = Number(this.ref.current.textContent) + 1;
  };
  handleClickChangeGoodsCount = () => {
    console.log('goodsRef: ', this.goodsRef.current);
    this.goodsRef.current.setState({
      count: 9999,
    });
  };

  updateSpanEl = (el) => {
    console.log('updateSpanEl: ', el);
    this.spanEl = el;
  };

  handleClickChangeSpan = () => {
    console.log('spanEl: ', this.spanEl);
    this.spanEl.textContent = Number(this.spanEl.textContent) + 1;
  };

  render() {
    return (
      <div>
        <div style={this.boxStyle}>
          <span>Ref 测试：</span>
          <div>
            <span ref={this.ref}>1</span>
            &nbsp;&nbsp;
            <button onClick={this.handleClick}>+1</button>
          </div>
        </div>
        <div style={this.boxStyle}>
          <span>classComponent 测试：</span>
          <button onClick={this.handleClickChangeGoodsCount}>
            点击修改 Goods 的 count 为 9999
          </button>
          <Goods ref={this.goodsRef} name='商品一' />
        </div>
        <TestForwadRef
          ref={this.forwardRef}
          defaultCount={100}
          style={this.boxStyle}
        />
        <div style={this.boxStyle}>
          <span>Ref 函数调用测试：</span>
          <div>
            <span ref={(el) => this.updateSpanEl(el)}>1</span>
            &nbsp;&nbsp;
            <button onClick={this.handleClickChangeSpan}>+1</button>
          </div>
        </div>
      </div>
    );
  }
}

export default TestRef;
