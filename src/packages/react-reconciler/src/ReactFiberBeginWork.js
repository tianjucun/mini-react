import { HostComponent, HostRoot, HostText } from './ReactWorkTag';
import { processUpdateQueue } from './ReactClassUpdateQueue';
import { mountChildFibers, reconcilerChildFibers } from './ReactChildFiber';

function reconcilerChildren(current, workInProgress, nextChildren) {
  if (current === null) {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    workInProgress.child = reconcilerChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }

  return workInProgress.child;
}

function updateHostComponent(current, workInProgress) {
  const nextProps = workInProgress.pendingProps;
  let nextChildren = nextProps.children;

  // 优化单个字符串子节点, 不创建 Fiber 节点
  if (typeof nextChildren === 'string' || typeof nextChildren === 'number') {
    nextChildren = null;
  }

  return reconcilerChildren(current, workInProgress, nextChildren);
}

function updateHostRoot(current, workInProgress) {
  // 消费队列中的状态数据, 并获取最新的 memoizedState
  processUpdateQueue(workInProgress);
  const nextState = workInProgress.memoizedState;
  const nextChildren = nextState.element;
  return reconcilerChildren(current, workInProgress, nextChildren);
}

export function beginWork(current, workInProgress) {
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
      // 到叶子节点了
      return null;
  }
}
