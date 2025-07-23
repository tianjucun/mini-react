import { flushUpdaterQueue, updaterQueue } from './Component';

export function addEvent(dom, eventName, handler) {
  // 在源DOM上添加事件映射
  dom.attach = dom.attach || {};
  dom.attach[eventName] = handler.bind(dom);

  // 将事件绑定到 document 上
  document[eventName] = dispatchEvent;
}

function dispatchEvent(nativeEvent) {
  // 属性更新开启批量更新
  updaterQueue.isBatch = true;

  // 根据 nativeEvent 获取对应的合成事件
  const syntheticEvent = createSyntheticEvent(nativeEvent);

  let target = syntheticEvent.target;
  while (target) {
    // 更新 currentTarget
    target.currentTarget = target;

    // 尝试获取 dom 上的事件并触发
    const eventName = `on${nativeEvent.type}`;
    // 如果目标 DOM 上没有通过 React 注册过事件
    // 对应的 DOM 上将没有 attach 属性
    const handler = target.attach?.[eventName];
    if (typeof handler === 'function') {
      handler(syntheticEvent);
    }

    // 如果事件冒泡被阻止了, 则直接跳出循环
    if (syntheticEvent.isPropagationStopped) {
      break;
    }

    // 向上冒泡
    target = target.parentNode;
  }

  // 批量更新结束, 执行批量更新
  flushUpdaterQueue();
}

function createSyntheticEvent(nativeEvent) {
  // 将 nativeEvent 上所有的属性 copy 到新的对象上
  let sytheticEvent = {};
  // 由于 event 上继承了很多属性, 所以要通过 for in 来进行获取
  // 不可以通过 Object.keys 的方式
  for (const key in nativeEvent) {
    const eventValue = nativeEvent[key];
    sytheticEvent[key] =
      typeof eventValue === 'function'
        ? eventValue.bind(sytheticEvent)
        : eventValue;
  }

  // 在合成事件上创建相关磨平浏览器差异的属性

  Object.assign(sytheticEvent, {
    nativeEvent,
    isDefaultPrevented: false, // 是否阻止默认事件
    isPropagationStopped: false, // 是否阻止冒泡
    preventDefault() {
      this.isDefaultPrevented = true;
      if (this.nativeEvent.preventDefault) {
        this.nativeEvent.preventDefault();
      } else {
        // 磨平浏览器差异
        this.nativeEvent.returnValue = false;
      }
    },
    stopPropagation() {
      this.isPropagationStopped = true;
      if (this.nativeEvent.stopPropagation) {
        this.nativeEvent.stopPropagation();
      } else {
        // 磨平浏览器差异
        this.nativeEvent.cancelBubble = true;
      }
    },
  });

  return sytheticEvent;
}
