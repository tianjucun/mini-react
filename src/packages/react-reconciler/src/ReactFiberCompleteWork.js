import { NoFlags } from './ReactFiberFlags';
import { HostComponent, HostRoot, HostText } from './ReactWorkTag';
import {
  createInstance,
  createTextInstance,
} from 'react-dom-bindings/client/ReactDOMHostConfig';
import { finalizeInitialChildren } from 'react-dom-bindings/client/ReactDOMHostConfig';
import { appendInitialChild } from 'react-dom-bindings/client/ReactDOMHostConfig';

export function completeWork(current, workInProgress) {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case HostRoot: {
      bubbleProperties(workInProgress);
      break;
    }
    case HostComponent: {
      const { type, pendingProps } = workInProgress;
      const instance = createInstance(type, pendingProps, workInProgress);
      appendAllChildren(instance, workInProgress);
      workInProgress.stateNode = instance;
      // 完成instance的宿主属性的初始化
      finalizeInitialChildren(instance, type, newProps);
      bubbleProperties(workInProgress);
      break;
    }
    case HostText: {
      const instance = createTextInstance(newProps);
      workInProgress.stateNode = instance;
      bubbleProperties(workInProgress);
      break;
    }
    default:
      break;
  }
}

/**
 * 属性冒泡
 * 将当前 Fiber 节点下的所有子节点的副作用收集起来
 * 方便后期通过父节点就可以清晰的知道子节点是否存在副作用
 * 属于一种优化
 * @param {*} workInProgress
 */
function bubbleProperties(workInProgress) {
  let flags = NoFlags;
  let child = workInProgress.child;
  while (child !== null) {
    flags |= child.flags;
    flags |= child.subtreeFlags;
    child = child.sibling;
  }

  workInProgress.subtreeFlags = flags;
}

/**
 * 1. 这个函数的核心作用就是将当前 Fiber 节点下所有宿主类型的 Fiber 节点收集上来, 并添加到父 DOM 中
   2. 由于 Fiber 节点类型比较多, 所以在查找子宿主类型节点时稍微有点复杂:
    1. 优先判断当前节点的子节点是不是宿主节点
    2. 其次判断当前节点的子节点是否还有子节点(链表自上向下遍历), 有子节点直接 continue
    3. 判断当前节点是否是 workInProgress (到当前正在处理 Fiber 节点了, 说明遍历该结束了)
    4. 判断当前节点是否有兄弟节点, 有兄弟节点, 直接遍历兄弟节点(链表自左向右遍历)
    5. 没有兄弟节点, 向上回朔到父节点(链表自下向上遍历)
  3. 整体的思想就是：
    1. 是宿主节点链表的遍历方向就是 (从左到右)
    2. 不是宿主节点但是有子节点遍历方向就是 (从上到下)
    3. 不是宿主节点并且没有子节点遍历方向就是 (从左到右)
    4. 不是宿主节点, 没有子节点并且没有兄弟节点, 遍历方向就是 (从下往上)
 * @param {*} parent 
 * @param {*} workInProgress 
 * @returns 
 */
function appendAllChildren(parent, workInProgress) {
  let child = workInProgress.child;
  while (child !== null) {
    if (child.tag === HostComponent || child.tag === HostText) {
      appendInitialChild(parent, child.stateNode);
    } else if (child.child !== null) {
      // 遍历方向从 "自左向右" 变为了 "自上向下"
      child = child.child;
      continue;
    }

    if (child === workInProgress) {
      return;
    }

    while (child.sibling === null) {
      if (child === null || child === workInProgress) {
        return;
      }

      // 遍历方向变为了 "自下向上"
      child = child.return;
    }

    // 遍历方向是 "自左向右"
    child = child.sibling;
  }
}
