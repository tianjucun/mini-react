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

  launchUpdate() {
    const { ClassComponentInstance, pendingStates } = this;
    if (pendingStates.length === 0) return;
    const mergedState = this.pendingStates.reduce((prev, curr) => {
      if (typeof curr === 'function') {
        curr = curr(prev);
      }
      return { ...prev, ...curr };
    }, ClassComponentInstance.state);
    this.pendingStates.length = 0;
    ClassComponentInstance.state = mergedState;
    ClassComponentInstance.update();

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

  update() {
    // 1. 获取旧的虚拟 DOM
    const oldVNode = this.oldVNode;
    const oldDOM = findDomByVNode(oldVNode);
    // 2. 获取新的虚拟 DOM
    const newVNode = this.render();
    // 3. 更新真实 DOM
    updateDOMTree(oldVNode, newVNode);
    this.oldVNode = newVNode;
  }
}

export default Component;
