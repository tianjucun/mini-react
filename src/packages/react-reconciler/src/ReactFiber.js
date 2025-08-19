import {
  HostComponent,
  HostRoot,
  HostText,
  IndeterminateComponent,
} from './ReactWorkTag';
import { NoFlags } from './ReactFiberFlags';

function FiberNode(tag, pendingProps, key) {
  // 实例相关属性

  // 标记 Fiber 类型
  this.tag = tag;
  // 对应 ReactElement 中的 type
  this.type = null;
  // 对应 ReactElement 中的 key
  this.key = key;
  // 关联的实际DOM节点或组件实例
  // HostRootFiber 对应的 stateNode 是 FiberRootNode
  this.stateNode = null;

  // 树结构相关属性

  // 对应子 Fiber 节点。
  // 假如这个 ReactElement 下有一组 ReactElement（chidlren），
  // 那么这个 ReactElement 转换为 Fiber 后，
  // 它的 child 指向它的第一个孩子节点对应的 Fiber 节点。
  this.child = null;

  // 对应同级 Fiber 节点。
  // 假如我们把当前 ReactElement 下的一组 ReactElement（chidlren）放到链表里，
  // 那么他们之间的关系就是 第一个子 Fiber 节点指向第二个字Fiber节点，
  // 第二个指向第三个，以此类推。
  // 最后一个子 Fiber 节点的 sibling 属性指向 null。有点类似于链表中的 next 指针。
  this.sibling = null;

  // 对应父级 Fiber 节点。
  // 主要是指当前 Fiber 所对应的任务单元处理完后需要返回到的 目标Fiber节点。
  // 有点像堆栈中的栈帧。
  this.return = null;

  // 在父节点子列表中的索引
  this.index = 0;

  // 属性与状态相关

  // 待处理属性。一个 Fiber 的 pendingProps 在执行开始时时设置。可以理解为新的 Props
  this.pendingProps = pendingProps;
  // 记忆化属性 。一个 Fiber 的 memoizedProps 在执行结束时设置。
  // 可以理解为老的 Props。当传入的 pendingProps 与 memoizedProps 相等时。
  // 这表明该 Fiber 之前的输出可以重用，从而避免不必要的工作。
  this.memoizedProps = null;
  // 状态更新队列
  this.updateQueue = null;
  // 上一次渲染的状态
  this.memoizedState = null;
  // 依赖项（如 context，事件等）
  this.dependencies = null;

  // 模式与优先级

  // 渲染模式（如严格模式、并发模式等）
  this.mode = null;
  // 优先级相关的车道标记，用于调度
  this.lanes = null;

  // 副作用相关

  // 当前节点的副作用标记（如需要更新、删除等）
  this.flags = NoFlags;
  // 子树的副作用标记
  this.subtreeFlags = NoFlags;
  // 需要删除的子节点列表
  this.deletions = null;

  // 双缓存相关

  // 指向另一个 Fiber 树中的对应节点（用于双缓存机制，实现 DOM 的高效更新）
  this.alternate = null;
}

export function createFiber(tag, pendingProps, key) {
  return new FiberNode(tag, pendingProps, key);
}

export function createHostRootFiber() {
  return createFiber(HostRoot, null, null);
}

/**
 * 基于旧的 Fiber 节点和新的 props 初始化根 Fiber 节点
 * @param {*} current
 * @param {*} pendingProps
 * @returns
 */
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    // 实现双缓冲的关键
    // A ---alternate---> workInProgress
    // workInProgress ---alternate---> A
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
  }

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;

  return workInProgress;
}

/**
 * 根据 type 和 props 创建 fiber 节点
 * 这里的设计挺有意思的, 由于 createFiber 需要的参数是 tag,props,key
 * 而我们又不知道具体的 tag 是什么, 需要通过 type 动态计算
 * 就可以通过 createFiberFromTypeAndProps 这个方法实现根据 type 创建 Fiber 节点
 *
 * 为什么 createFiber 不提供 type 参数呢
 * 我想应该是因为 type 对于 Fiber 而言并不是核心参数,
 * 而 tag 才是 Fiber 的类型标识, type 只是 Fiber 对应的 element 的一种类型标识
 * @param {*} type
 * @param {*} pendingProps
 * @param {*} key
 * @returns
 */
export function createFiberFromTypeAndProps(type, pendingProps, key) {
  let tag = IndeterminateComponent;
  if (typeof type === 'string') {
    tag = HostComponent;
  }
  const newFiber = createFiber(tag, pendingProps, key);
  newFiber.type = type;
  return newFiber;
}

/**
 * 根据 ReactElement 创建 Fiber 节点
 * @param {*} element
 * @returns
 */
export function createFiberFromElement(element) {
  const { type, key, props: pendingProps } = element;
  return createFiberFromTypeAndProps(type, pendingProps, key);
}

export function createFiberFromText(text) {
  return createFiber(HostText, text, null);
}
