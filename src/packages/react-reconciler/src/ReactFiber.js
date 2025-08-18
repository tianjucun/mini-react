import { HostRoot } from './ReactWorkTag'
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
  this.flag = NoFlags;
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