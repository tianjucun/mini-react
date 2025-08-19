import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol';
import { Placement } from './ReactFiberFlags';
import { createFiberFromElement, createFiberFromText } from './ReactFiber';
import isArray from 'shared/array';

/**
 * 创建子调和器，这里的子可以理解为 ReactElement
 * 因为在最初 HostRoot 这个 Fiber 节点对应的 child 是 null 的
 * 是通过将 memoizedStaet.element 转为 fiber 节点才更新对应的 child
 *
 * 其实这个调和器的主要作用就是，通俗来说就是将 ReactElement 转为 Fiber节点
 * 但是其中可能需要考虑变化，比如说更新时，Fiber 节点已经存在，
 * 这个时候如果对应的 element 发生了变化，那么对应的 Fiber 也应该发生变化，
 * 这样页面上才能显示出正常的数据
 *
 * shouldTrackSideEffects 这个设计还是蛮有意思的
 * 他将 element 和 fiber 节点间的差异描述为副作用，我想应该是：
 * 如果没有副作用的话我们就是单纯创建一个 Fiber 节点吧，
 * 并且这个 Fiber 节点不会主动对页面上的 DOM 结构产生影响。
 *
 * 但是如果有副作用的话，但是后期会在一些阶段，分析这些副作用，
 * 并影响页面上的实际 DOM 展示。
 *
 * @param {*} shouldTrackSideEffects 是否追踪副作用
 * @returns
 */
function createChildReconciler(shouldTrackSideEffects) {
  /**
   * 设置副作用
   * @param {*} newFiber
   * @returns
   */
  function placeSingleChild(newFiber) {
    if (shouldTrackSideEffects) {
      // 为当前 Fiber 添加 '插入' 的副作用
      // 后期这个节点会被插入到上次父宿主节点中
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  /**
   * 协调单个 ReactElement 的转换
   * 将单个 ReactElement 转为 ReactFiber 节点
   * @param {*} returnFiber 父 Fiber 节点
   * @param {*} currentFirstFiber 老 Fiber 的第一个子 Fiber 节点
   * @param {*} element 对应需要转换的 ReactElement
   * @returns
   */
  function reconcileSingleElement(returnFiber, currentFirstFiber, element) {
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  /**
   * 设置副作用
   * @param {*} newFiber 新 Fiber 节点
   * @param {*} index 在父级 Fiber 对应的下标
   */
  function placeChild(newFiber, index) {
    newFiber.index = index;
    if (shouldTrackSideEffects) {
      newFiber.flags |= Placement;
    }
  }

  /**
   * 根据新的子节点创建 Fiber
   * @param {*} returnFilber
   * @param {*} element
   * @returns
   */
  function createChild(returnFilber, element) {
    // 处理 element 为字符串或数字的情况
    if (
      (typeof element === 'string' && element !== '') ||
      typeof element === 'number'
    ) {
      const created = createFiberFromText('' + element);
      created.return = returnFilber;
    }

    // 处理普通 element 转换的情况
    if (typeof element === 'object' && element !== null) {
      switch (element.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const created = createFiberFromElement(element);
          created.return = returnFilber;
          return created;
        default:
          break;
      }
    }
  }

  /**
   * 处理一组 ReactElement 转为 ReactFiber
   * @param {*} returnFiber 父 Fiber 节点
   * @param {*} currentFirstFiber 老 Fiber 对应的第一个子 Fiber
   * @param {*} newChildren 带协调的 一组 ReactElement 节点
   * @returns
   */
  function reconcileChildrenArray(returnFiber, currentFirstFiber, newChildren) {
    // 存储第一个 Fiber 子节点
    let resultingFirstChild = null;
    // 存储上一个Fiber 子节点, 用于维护与兄弟节点的 sibling 指向关系
    let previousNewFiber = null;

    for (let index = 0; index < newChildren.length; index++) {
      const newFiber = createChild(returnFiber, newChildren[index]);
      placeChild(newFiber, index);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }

    return resultingFirstChild;
  }

  /**
   * 核心协调器
   * 用于将 newChild(ReactElement) 转为 ReactFiber
   * @param {*} returnFiber 父级 Fiber 节点
   * @param {*} currentFirstFiber 老的Fiber对应的第一个子Fiber节点
   * @param {*} newChild 需要转化的 ReactElement
   * @returns 返回新的子 Fiber 或者 null
   */
  function reconcilerChildFibers(returnFiber, currentFirstFiber, newChild) {
    // 判断是否是对象
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFirstFiber, newChild)
          );
      }
    }

    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstFiber, newChild);
    }

    return null;
  }

  return reconcilerChildFibers;
}

/**
 * 初次挂载时，出 HostRoot.child 下的所有子 Fiber 节点都不需要添加副作用
 * 只需要给 HostRoot.child 对应的 Fiber 节点添加 '插入' 的副作用
 * 这样只要父插入了, 所有的子节点都就跟着插入就行了, 不需要有其他变化
 */
export const mountChildFibers = createChildReconciler(false);
/**
 * 主要关注的是更新场景
 */
export const reconcilerChildFibers = createChildReconciler(true);
