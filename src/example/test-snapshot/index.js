import React from 'react';

class ScrollingList extends React.Component {
  listRef = React.createRef();
  state = { items: [] };

  // 模拟加载更多数据
  loadMore = () => {
    this.setState((prev) => ({
      items: [...prev.items, `新条目 ${prev.items.length + 1}`],
    }));
  };

  // DOM 更新前捕获滚动位置
  getSnapshotBeforeUpdate(prevProps, prevState) {
    // 如果列表项数量增加了，说明有新内容加入
    if (prevState.items.length < this.state.items.length) {
      const list = this.listRef.current;
      // 返回更新前的滚动位置（相对于列表底部的距离）
      return list.scrollHeight - list.scrollTop;
    }
    return null;
  }

  // DOM 更新后恢复滚动位置
  componentDidUpdate(prevProps, prevState, snapshot) {
    // snapshot 是 getSnapshotBeforeUpdate 的返回值
    if (snapshot !== null) {
      const list = this.listRef.current;
      // 保持滚动位置在底部（新内容加入后，滚动到之前的相对位置）
      list.scrollTop = list.scrollHeight - snapshot;
    }
  }

  render() {
    return (
      <div>
        <button onClick={this.loadMore}>加载更多</button>
        <div ref={this.listRef} style={{ height: '200px', overflow: 'auto' }}>
          {this.state.items.map((item, i) => (
            <div key={i} style={{ height: '50px' }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default ScrollingList;
