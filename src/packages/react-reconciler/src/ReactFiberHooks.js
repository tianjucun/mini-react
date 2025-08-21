import ReactSharedInternals from 'shared/ReactSharedInternals';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates';

const { ReactCurrentDispatcher } = ReactSharedInternals;

// 当前正在渲染的 Fiber
let currentlyRenderingFiber = null;

// 当前正在处理的 Hook
let workInProgressHook = null;

// 已经处理好的 Hook 信息
// 这个 Hook 信息对应的是 workInProgressHook 之前的 Hook 信息
// 因为 Hook 的 update 阶段需要消费上一次用户调用完 dispatch 产生的待更新数据
let currentHook = null;

export const HookDispatcherOnMount = {
  useReducer: mountReducer,
};

export const HookDispatcherOnUpdate = {
  useReducer: updateReducer,
};

function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    queue: null,
    next: null,
  };

  if (workInProgressHook === null) {
    // 首次 Hook 挂载, 当前渲染 Fiber 的缓存 第一个被调用的Hook 状态
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 在 Hook 链表后追加新的 Hook
    workInProgressHook = workInProgressHook.next = hook;
  }

  return workInProgressHook;
}

function dispatchReducerAction(fiber, queue, action) {
  const update = {
    action,
    next: null,
  };

  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root);
}

function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialArg;
  const queue = {
    pending: null,
  };
  hook.queue = queue;

  // 通过 bind 创建闭包环境, 缓存当前渲染的 Fiber 和 待处理的更新信息
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));

  return [hook.memoizedState, dispatch];
}

function updateWorkInProgressHook() {
  if (currentHook === null) {
    const currentFiber = currentlyRenderingFiber.alternate;
    currentHook = currentFiber.memoizedState;
  } else {
    currentHook = currentHook.next;
  }

  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null,
  };

  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }

  return workInProgressHook;
}

function updateReducer(reducer) {
  const hook = updateWorkInProgressHook();
  let newState = hook.memoizedState;
  const currentQueue = hook.queue;
  const pendingUpdates = currentQueue.pending;
  if (pendingUpdates !== null) {
    // 清空 Hook 对应的相关数据
    currentQueue.pending = null;

    // 循环链表, 获取第一个待更新的数据
    let firstUpdate = pendingUpdates.next;
    let update = firstUpdate;
    do {
      newState = reducer(newState, update.action);
      update = update.next;
    } while (update !== null && update !== firstUpdate);
  }
  hook.memoizedState = newState;
  return [hook.memoizedState, currentQueue.dispatch];
}

export function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress;

  if (current !== null && current.memoizedState !== null) {
    ReactCurrentDispatcher.current = HookDispatcherOnUpdate;
  } else {
    ReactCurrentDispatcher.current = HookDispatcherOnMount;
  }

  const element = Component(props);

  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;

  return element;
}
