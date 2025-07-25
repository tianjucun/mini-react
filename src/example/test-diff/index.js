import { React } from '@/react-interface';

class TestNormalDiff extends React.Component {
  state = {
    showTitle: true,
    title: 'Test Normal Diff Component',
  };

  handleToggleShow = () => {
    this.setState({
      showTitle: !this.state.showTitle,
    });
  };

  handleClickUpdate = (title) => {
    this.setState({
      title,
    });
  };

  render() {
    // 分别写出旧的虚拟DOM和新的虚拟DOM比对的多装情况的验证案例
    return (
      <div>
        <div>
          <button onClick={this.handleToggleShow}>隐藏</button>
          <button onClick={this.handleToggleShow}>展示</button>
          <button onClick={() => this.handleClickUpdate('hello react')}>
            修改为 hello react
          </button>
        </div>
        {this.state.showTitle ? <h1>{this.state.title}</h1> : null}
      </div>
    );
  }
}

export default TestNormalDiff;
