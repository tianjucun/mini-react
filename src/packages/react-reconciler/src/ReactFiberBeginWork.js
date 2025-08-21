import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
  IndeterminateComponent,
} from './ReactWorkTag';
import { processUpdateQueue } from './ReactClassUpdateQueue';
import { mountChildFibers, reconcilerChildFibers } from './ReactChildFiber';
import { renderWithHooks } from './ReactFiberHooks';

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

function mountIndeterminateComponent(current, workInProgress, type) {
  const props = workInProgress.pendingProps;
  const value = renderWithHooks(current, workInProgress, type, props);
  workInProgress.tag = FunctionComponent;
  return reconcilerChildren(current, workInProgress, value);
}

function updateFunctionComponent(current, workInProgress, type) {
  const props = workInProgress.pendingProps;
  const nextChldren = renderWithHooks(current, workInProgress, type, props);
  return reconcilerChildren(current, workInProgress, nextChldren);
}

export function beginWork(current, workInProgress) {
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      return mountIndeterminateComponent(
        current,
        workInProgress,
        workInProgress.type
      );
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case FunctionComponent:
      return updateFunctionComponent(
        current,
        workInProgress,
        workInProgress.type
      );
    case HostText:
      // 到叶子节点了
      return null;
  }
}
