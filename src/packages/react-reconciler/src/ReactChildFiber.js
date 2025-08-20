import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol';
import { Placement, ChildDeletion } from './ReactFiberFlags';
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
} from './ReactFiber';
import isArray from 'shared/array';
import { HostText } from './ReactWorkTag';

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

  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) {
      return;
    }

    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      deletions.push(childToDelete);
    }
  }

  /**
   * 从当前 Fiber 节点(包括当前节点)开始向右删除(标记删除)所有兄弟节点
   * @param {*} returnFiber
   * @param {*} currentFirstFiber
   * @returns
   */
  function deleteRemainingChildren(returnFiber, currentFirstFiber) {
    if (!shouldTrackSideEffects) {
      return;
    }

    let childToDelete = currentFirstFiber;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
  }

  /**
   * 基于目标 fiber 创建一个新的 Fiber节点
   * @param {*} fiber
   * @param {*} pendingProps
   * @returns
   */
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
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
    if (currentFirstFiber !== null) {
      let oldFiberChild = currentFirstFiber;

      // 检查老 Fiber 中是否存在与 element key 相等的 Fiber
      while (oldFiberChild.key !== element.key) {
        deleteChild(returnFiber, oldFiberChild);
        oldFiberChild = oldFiberChild.sibling;
      }

      if (oldFiberChild.type === element.type) {
        // 复用老Fiber, 并删除其余 Fiber
        const existing = useFiber(oldFiberChild, element.props);
        existing.return = returnFiber;
        deleteRemainingChildren(returnFiber, oldFiberChild.sibling);
        return existing;
      }

      if (oldFiberChild !== null) {
        // key 和 type 都不相等删除所有老 Fiber
        deleteRemainingChildren(returnFiber, oldFiberChild);
      }
    }

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
    if (newFiber === null) {
      return;
    }

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
      return created;
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

    return null;
  }

  /**
   * 基于旧的 Fiber 节点更新元素为新的 Fiber 节点
   * 1. 如果旧的 Fiber 节点与新的 Fiber 节点元素类型相同, 则复用
   * 2. 否则重新创建新的 Fiber 节点
   *
   * 在调用这个函数前, 默认会认为 key 是相等的
   * @param {*} returnFiber 父Fiber节点
   * @param {*} current 老Fiber节点
   * @param {*} element ReactElement
   * @returns 新的 Fiber 节点
   */
  function updateElement(returnFiber, current, element) {
    const elementType = element.type;
    if (current !== null) {
      if (current.type === elementType) {
        const existing = useFiber(current, element.props);
        existing.return = returnFiber;
        return existing;
      }
    }
    const newFiber = createFiberFromElement(element);
    newFiber.return = returnFiber;
    return newFiber;
  }

  /**
   * 基于旧的Fiber节点更新一个 slot
   * slot 目前只处理了 ReactElement 元素情况
   * @param {*} returnFiber
   * @param {*} oldFiber
   * @param {*} newChild
   * @returns
   */
  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null;
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (newChild.key === key) {
            return updateElement(returnFiber, oldFiber, newChild);
          }

        default:
          return null;
      }
    }
    return null;
  }

  /**
   * 实现差异化算法的关键
   * 通过 lastPalcedIndex 来记录最后一个不需要移动元素的下标，
   * 这个下标主要用来跟老Fiber的下标对比同 key 下新Fiber的位置是否发生变动。
   *
   * 举例：A(0) -> B(1) -> C(2)
   *      B(0) -> A(1) -> C(2)
   *
   * 比对过程:
   *      初始化: lastPlacedIndex = 0;
   *      1. B(1) > lastPlacedIndex(0); lastPlacedIndex = 1
   *      2. A(0) < lastPlacedIndex(1); lastPlacedIndx  = 1
   *      3. C(2) > lastPlacedIndex(1); lastPalcedIndex = 2
   *
   * 观察:
   *      新的 Fiber 节点在老的中存在, 只是个别位置发生变动.
   *      1. 第一个 B 元素, 则以 B 位置为参考点, 对比后续出现元素的位置
   *      2. 第二个 A 元素, A 小于 lastPlacedIndex, 说明 A 从原来在 B 前面的位置挪到了后面,
   *      标记 Placed, 后面会 commitWork 阶段处理 A 的插入, 会将 A 插入到非 Placed 后面兄弟节点前面, 也就是 C 节点前面
   *      3. 第三个 C 元素, C 大于 lastPlacedIndex, 说明 C 相对 B的位置, 没有发生变动,
   *      并更新 最后一个不需要元素的下标为 2
   *
   * @param {*} newFiber
   * @param {*} lastPlacedIndex
   * @param {*} newIndex
   * @returns
   */
  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex;

    if (!shouldTrackSideEffects) {
      return;
    }

    const current = newFiber.alternate;
    const oldIndex = current.index;
    if (newFiber.alternate === null || oldIndex < lastPlacedIndex) {
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    } else {
      return oldIndex;
    }
  }

  /**
   * 通过 key 记录 currentFirstChild Fiber 及兄弟节点
   * 方便在 domdiff 时, 根据元素的 key 查看是否存在可复用的老Fiber节点
   * @param {*} returnFiber
   * @param {*} currentFirstChild
   * @returns
   */
  function mapRemainingChildren(returnFiber, currentFirstChild) {
    const existingChildren = new Map();
    let existingChild = currentFirstChild;
    while (child !== null) {
      const childKey = child.key !== null ? child.key : child.index;
      existingChildren.set(childKey, child);
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  }

  /**
   * 基于老 Fiber current 创建新的 HostText Fiber 节点
   * 1.老 Fiber 不是 HostText 节点, 则创建新的
   * 2. 否则复用老的
   * @param {*} returnFiber
   * @param {*} current
   * @param {*} textContent
   * @returns
   */
  function updateTextNode(returnFiber, current, textContent) {
    if (current === null || current.tag !== HostText) {
      const created = createFiberFromText(textContent);
      created.return = returnFiber;
      return created;
    }

    const existing = useFiber(current, textContent);
    existing.return = returnFiber;
    return existing;
  }

  /**
   * 根据元素匹配已经存在 Fiber 节点表
   * 通过匹配的结果更新 Fiber 节点(创建一个新的 Fiber 节点)
   * @param {*} existingChildren
   * @param {*} returnFiber
   * @param {*} newIndex
   * @param {*} newChild
   * @returns
   */
  function updateFromMap(existingChildren, returnFiber, newIndex, newChild) {
    if (
      (typeof newChild === 'string' && newChild !== '') ||
      typeof newChild === 'number'
    ) {
      const matchedFiber = existingChildren.get(newIndex) || null;
      return updateTextNode(returnFiber, matchedFiber, '' + newChild);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const matchedFiber = existingChildren.get(
            newChild.key === null ? newIndex : newChild.key
          );
          return updateElement(returnFiber, matchedFiber, newChild);

        default:
          break;
      }
    }

    return null;
  }

  /**
   * Fiber Diff
   *
   *    主要做了两件事:
   *      1. 找到第一个 key 不相等的 Fiber 节点
   *      2. 排查这个节点是否可以复用
   *
   *    首先要知道的是，我们判断 Fiber 节点是否可以复用的标志是
   *      1. key 相等
   *      2. type 相等
   *
   *    核心处理
   *
   *      1. 我们要找到第一个 key 不相等的, 可以尝试按照顺序进行比较,
   *    因为这是最快的可以找到第一个 key 不相等的 fiber 节点位置了.
   *        1.1 在比较过程中, 如果 key 相等, 但是 type 不相等 我们会创建新的节点
   *        1.2 如果 key 和 type 都相等, 我们会通过 clone fiber 节点的方式创建一个新的节点
   *        1.3 在此过程中, 如果发现不可复用, 我们会在老的 Fiber 节点上添加删除标记
   *
   *     2. 第一轮检查结束后, 大概结束循环有三种原因
   *        2.1 老的 Fiber 已经遍历完, 新的元素没有遍历完, 说明 key 全部相等
   *        2.2 老的 Fiber 没有遍历完, 新的元素遍历完了, 说明剩下的老的都需要删除
   *        2.3 老的 Fiber 中存在不相等的key, 提前退出了
   *
   *     3. 关于上面的三种情况, 处理情况
   *        3.1 后续新的元素全部转为新的 Fiber 节点, 并添加插入标记
   *        3.2 剩下老的Fiber节点全部添加删除标记
   *        3.3 将同序比对, 提升为 key 查找, 进一步确认是否可以复用
   *
   *     4. 将同序比对, 提升为 key 查找, 进一步确认是否可以复用
   *        4.1 将剩下老的 Fiber 节点全部放到放到一个映射表里
   *        4.2 查找时先从映射表中查找，查找不到，则代表不能复用需要创建
   *        4.3 否则直接复用就可以
   *
   *    在进行比对的过程中，需要实时更新 lastPlacedIndex, 才能最大程度的复用节点.
   *    lastPlacedIndex 主要是记录最后一个不需要移动的老 Fiber 节点下标
   *
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

    let newIndex = 0;

    let oldFiber = currentFirstFiber;

    for (; oldFiber !== null && newIndex < newChildren.length; newIndex++) {
      const newChild = newChildren[newIndex];
      const newFiber = updateSlot(returnFiber, oldFiber, newChild);
      if (newFiber === null) {
        break;
      }

      if (shouldTrackSideEffects) {
        if (newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }

      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);

      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;

      oldFiber = oldFiber.sibling;
    }

    if (newIndex === newChildren.length) {
      if (shouldTrackSideEffects) {
        deleteRemainingChildren(returnFiber, oldFiber);
      }
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      for (; newIndex < newChildren.length; newIndex++) {
        const newFiber = createChild(returnFiber, newChildren[newIndex]);
        placeChild(newFiber, newIndex);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultingFirstChild;
    }

    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    for (; newIndex < newChildren.length; newIndex++) {
      const newChild = newChildren[newIndex];
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIndex,
        newChild
      );

      if (
        shouldTrackSideEffects &&
        newFiber !== null &&
        newFiber.alternate !== null
      ) {
        existingChildren.delete(
          newChild.key === null ? newIndex : newChild.key
        );
      }

      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);

      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }

      previousNewFiber = newFiber;
    }

    if (shouldTrackSideEffects) {
      existingChildren.forEach((child) => deleteChild(returnFiber, child));
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
