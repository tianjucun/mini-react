import ReactSharedInternals from 'shared/ReactSharedInternals';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates';
import objectIs from 'shared/objectIs';

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
  useState: mountState,
};

export const HookDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
};

function baseReducer(state, action) {
  return typeof action === 'function' ? action(state) : action;
}

function mountState(initialState) {
  if (typeof initialState === 'function') {
    initialState = initialState();
  }

  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialState;
  const queue = {
    pending: null,
    lastRenderedReducer: baseReducer,
    lastRenderedState: initialState,
  };
  hook.queue = queue;

  const dispatch = (queue.dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  return [initialState, dispatch];
}

function dispatchSetState(fiber, queue, action) {
  const update = {
    action,
    eagerState: null,
    hasEagerState: false,
    next: null,
  };

  const root = enqueueConcurrentHookUpdate(fiber, queue, update);

  const currentState = queue.lastRenderedState;
  const lastRenderedReducer = queue.lastRenderedReducer;
  if (lastRenderedReducer !== null) {
    // 由于不依赖新的状态计算, 可以在 dispatch 阶段就计算出新状态
    const eagerState = lastRenderedReducer(currentState, action);
    update.eagerState = eagerState;
    update.hasEagerState = true;

    if (objectIs(currentState, eagerState)) {
      // setState 前后值相同不触发渲染
      return;
    }
  }

  scheduleUpdateOnFiber(root);
}

function updateState() {
  return updateReducer(baseReducer);
}

/**
 * 创建新的 hook 对象
 * 并挂载到 hook 链表中，更新当前渲染 Fiber 的相关缓存状态
 * @returns
 */
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

/**
 * 根据 action 创建一个更新对象
 * 并将更新对象入队，并安排下一次渲染
 * @param {*} fiber
 * @param {*} queue
 * @param {*} action
 */
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
    lastRenderReducer: reducer,
    lastRenderState: initialArg,
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

/**
 * 通过 fiber 获取到待更新的 Hook 链
 * 并基于当前的 hook 创建新的 Hook 状态对象
 * @returns
 */
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

/**
 * 处理 useReducer 的 dispatch 产生的更新数据
 * 根据待更新的数据（单向循环链表）计算出新的数据
 * @param {*} reducer
 * @returns
 */
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
      if (update.hasEagerState) {
        // 不依赖新的状态, 比如 setState 可以基于当前状态快速计算出状态
        newState = update.eagerState;
      } else {
        // reducer 是需要基于新的状态进行计算
        newState = reducer(newState, update.action);
      }
      update = update.next;
    } while (update !== null && update !== firstUpdate);
  }
  hook.memoizedState = newState;
  hook.lastRenderedState = newState;
  return [hook.memoizedState, currentQueue.dispatch];
}

/**
 * 调用 Component 获取 ReactElement
 * 通过识别当前的阶段（挂载/更新阶段）
 * 动态使用不同的调度器（一套 Hook 实现）实例
 * @param {*} current
 * @param {*} workInProgress
 * @param {*} Component
 * @param {*} props
 * @returns
 */
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
