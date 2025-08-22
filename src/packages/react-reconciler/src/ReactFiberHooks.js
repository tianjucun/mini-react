import ReactSharedInternals from 'shared/ReactSharedInternals';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates';
import objectIs from 'shared/objectIs';
import { Passive } from './ReactFiberFlags';
import { HasEffect, Passive as HookPassive } from './ReactHookEffectTags';

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
  useEffect: mountEffect,
};

export const HookDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
  useEffect: updateEffect,
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
 * 创建 hook 并在当前渲染的 Fiber 节点上添加 "被动的" 标记。
 * 被动的这个标记, 有一种被动调用的意思, 并非主动调用, 而是
 * 在某个阶段需要被调用，被处理的一种标记。在这里指，当前 Fiber
 * 节点下存在待处理的 effect hook。
 *
 * @param {*} fiberFlags
 * @param {*} hookFlags
 * @param {*} create
 * @param {*} deps
 */
function mountEffect(create, deps) {
  return mountEffectImpl(Passive, HookPassive, create, deps);
}

function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = mountWorkInProgressHook();
  let nextDeps = deps === undefined ? null : deps;
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(
    HasEffect | hookFlags,
    create,
    undefined,
    nextDeps
  );
}

/**
 * 创建函数组件的 updateQueue
 * 函数组件的 updateQueue 的特点，主要用来存储 effect 相关 Hook 信息
 *
 * effect hook 相对 state hook ，不存在一串待更新的数据，
 * 所以单个 effect 不需要类似 queue 的结构。
 * 但是需要在一定时机去消费当前 Fiber 下对应的 effect hook。
 * 目前 fiber 结构上存储 hook 信息只有 memoizedState，
 * memoizedState 对应的是当前 fiber 下的所有 Hook 调用链。
 * 并不满足单纯的 effect Hook 使用要求，所以需要在 Fiber 结构
 * 上利用现有的 udpateQueue 存储对应的 effectHook 调用链，
 * 方便后期进行消费，处理和优化。
 *
 * 上面的 fiber 特指：FunctionComponent Fiber 节点
 * 因为 Hook 只能在函数组件下只用，而上面无论说的 memoizedState
 * 还是 updateQueue 都是跟 Hook 相关的调用相关信息的存储。
 *
 * 可以理解为 updateQueue 在这个场景下只关注当前函数组件下
 * 所有的 effect 的调用，lastEffect 对应的是一个单向循环链表，
 * 既：lastEffect -> effect1 -> effect2 -> effect1 -> ...
 *
 * @returns
 */
function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: null,
    stores: null,
  };
}

function updateEffect(create, deps) {
  return updateEffectImpl(Passive, HookPassive, create, deps);
}

/**
 * 检查依赖是否发生变更，并创建新的 effect
 * 重新组织 effect 链表
 * @param {*} fiberFlags
 * @param {*} hookFlags
 * @param {*} create
 * @param {*} deps
 * @returns
 */
function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy;
  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      if (areHookInputEqual(nextDeps, prevDeps)) {
        // 无依赖变更，收集 Passive effect
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
        return;
      }
    }
  }

  // 存在依赖变更，fiber 上添加对应的 Passive 标记
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(
    // 添加依赖表更标记 HasEffect
    HasEffect | hookFlags,
    create,
    destroy,
    nextDeps
  );
}

function areHookInputEqual(nextDeps, prevDeps) {
  const minLength = Math.min(nextDeps.length, prevDeps.length);
  for (let i = 0; i < minLength; i++) {
    if (objectIs(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}

/**
 * 创建一个新的 effect，并指定对应的 tag
 * 不同的 tag 对应着后期在不同的阶段进行处理
 *
 * 这里会将 effect 相关信息以一种链表的结构
 * 存储到当前 Fiber 对应的 updateQueue 中。
 *
 * 这种链表存储与其他 state Hooks 是独立的两套存储。
 * 但是都存储在 hook 的 memoizedState 中
 * @param {*} tag
 * @param {*} create
 * @param {*} destroy
 * @param {*} deps
 * @returns
 */
function pushEffect(tag, create, destroy, deps) {
  const effect = {
    tag,
    create,
    destroy,
    deps,
    next: null,
  };
  const updateQueue = currentlyRenderingFiber.updateQueue;
  if (updateQueue === null) {
    currentlyRenderingFiber.updateQueue = createFunctionComponentUpdateQueue();
    effect.next = effect;
  } else {
    const lastEffect = updateQueue.lastEffect;
    if (lastEffect === null) {
      // Circular
      effect.next = effect;
    } else {
      effect.next = lastEffect.next;
      lastEffect.next = effect;
    }
  }
  currentlyRenderingFiber.updateQueue.lastEffect = effect;

  return effect;
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
  // 在函数组件场景下
  // currentlyRenderingFiber 对应的是当前正在处理渲染的 Fiber
  // 数据在处理用户的函数组件时，保留了一种环境上下文信息
  // 以便我们在 Hook 处理时可以有效的知道当前正在处理渲染 的 Fiber
  // 放到全局可能也是考虑到程序内存的一种优化，不需要来回传递参数，
  // 也不需要通过各种嵌套的闭包进行数据的访问
  // 而是在进入渲染前，对于当前渲染环境的一种重置
  currentlyRenderingFiber = workInProgress;

  // 清空函数组件下所有类型 Hook 的调用信息
  // 内部可以灵活的根据自己的情况重新创建 Hook
  // 而不需要过重的关注老 Hook 的更新
  workInProgress.memoizedState = null;

  // 在函数组件场景下清空之前的 Hook 调用信息
  // 因为有一些 Hook 在更新阶段对应的依赖并没有发生改变
  // 此时我们要做的是重新创建 effect，因为 tag 不同了
  // 有依赖变化的 tag 关注的可能是： HasEffect | Passive
  // 无依赖变化的 tag 关注的是：Passive，只做收集
  // updateQueue 不可以在 Component 调用完就清除
  // 因为 updateQueue 可能会在 commit 阶段结束后异步被消费的
  workInProgress.updateQueue = null;

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
