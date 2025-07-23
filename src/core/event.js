export function addEvent(dom, eventName, handler) {
  // 在源DOM上添加事件映射
  dom.attach = dom.attach || {};
  dom.attach[eventName] = handler.bind(dom);

  // 将事件绑定到 document 上
  document[eventName] = dispatchEvent;
}

function dispatchEvent(nativeEvent) {
  // 根据 nativeEvent 获取对应的合成事件
  const syntheticEvent = createSyntheticEvent(nativeEvent);
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
