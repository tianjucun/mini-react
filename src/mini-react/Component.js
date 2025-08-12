import { findDomByVNode, updateDOMTree } from './react-dom';

export const updaterQueue = {
  isBatch: false, // 是否支持批量更新
  updaters: new Set(), // 待更新的组件
};

export function flushUpdaterQueue() {
  updaterQueue.isBatch = false;
  updaterQueue.updaters.forEach((updater) => {
    updater.launchUpdate();
  });
  updaterQueue.updaters.clear();
}

class Updater {
  constructor(ClassComponentInstance) {
    this.pendingStates = [];
    this.pendingCallbacks = [];
    this.ClassComponentInstance = ClassComponentInstance;
  }

  addState(partialState, callback) {
    this.pendingStates.push(partialState);
    this.pendingCallbacks.push(callback);

    // 这里应该是要延迟执行, 才能达到批处理的目的
    this.preHandleForUpdate();
  }

  preHandleForUpdate() {
    if (updaterQueue.isBatch) {
      updaterQueue.updaters.add(this);
    } else {
      this.launchUpdate();
    }
  }

  // TODO: 待处理 nextProps 的默认值
  launchUpdate(nextProps = this.ClassComponentInstance.props) {
    if (this.pendingStates.length === 0 && !nextProps) {
      return;
    }

    const { ClassComponentInstance, pendingStates } = this;
    const prevProps = ClassComponentInstance.props;
    const prevState = ClassComponentInstance.state;
    let isShouldUpdate = true;

    // 计算新的 state
    let nextState = pendingStates.reduce((prev, curr) => {
      if (typeof curr === 'function') {
        curr = curr(prev);
      }
      return { ...prev, ...curr };
    }, ClassComponentInstance.state);

    pendingStates.length = 0;

    // TODO: 目前只会在更新的时候调用 getDerivedStateFromProps
    // 处理生命周期函数: getDerivedStateFromProps
    if (this.ClassComponentInstance.constructor.getDerivedStateFromProps) {
      let direvedState =
        this.ClassComponentInstance.constructor.getDerivedStateFromProps(
          nextProps,
          prevState
        );
      if (direvedState) {
        nextState = { ...nextState, ...direvedState };
      }
    }

    // update props
    if (nextProps) {
      ClassComponentInstance.props = nextProps;
    }

    // update state
    ClassComponentInstance.state = nextState;

    // 处理生命周期函数: shouldComponentUpdate
    if (ClassComponentInstance.shouldComponentUpdate) {
      isShouldUpdate = ClassComponentInstance.shouldComponentUpdate(
        nextProps,
        nextState
      );
    }

    // handle update
    if (isShouldUpdate) {
      ClassComponentInstance.update(prevProps, prevState);
    }

    // 执行回调
    this.pendingCallbacks.forEach((callback) => {
      if (typeof callback === 'function') {
        callback();
      }
    });

    this.pendingCallbacks.length = 0;
  }
}

class Component {
  static IS_CLASS_COMPONENT = true;
  constructor(props) {
    this.props = props;
    this.updater = new Updater(this);
  }

  setState(partialState, callback) {
    // 1. 兼容批量更新
    // 2. 执行 update 更新 DOM
    this.updater.addState(partialState, callback);
  }

  // TODO: 待处理 forceUpdate 的特性
  update(prevProps, prevState) {
    // 1. 获取旧的虚拟 DOM
    const oldVNode = this.oldVNode;
    const oldDOM = findDomByVNode(oldVNode);
    // 2. 获取新的虚拟 DOM
    const newVNode = this.render();
    // 3. 更新真实 DOM
    updateDOMTree(oldVNode, newVNode);
    this.oldVNode = newVNode;

    // 实现类组件的更新生命周期
    if (this.componentDidUpdate) {
      this.componentDidUpdate(prevProps, prevState);
    }
  }
}

export default Component;
