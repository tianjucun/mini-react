import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
import { MutationMask, NoFlags, Passive } from './ReactFiberFlags';
import {
  commitMutationEffectsOnFiber,
  commitPassiveMountEffects,
  commitPassiveUnmountEffects,
  commitLayoutEffects,
} from './ReactFiberCommitWork';
import { finishQueueingConcurrentUpdates } from './ReactFiberConcurrentUpdates';
import {
  NormalPriority,
  ImmediatePriority,
  UserBlockingPriority,
  scheduleCallback,
  IdlePriority,
  shouldYield,
} from './Scheduler';
import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  getCurrentUpdatePriority,
  IdleEventPriority,
  lanesToEventPriority,
  setCurrentUpdatePriority,
} from './ReactEventPriorities';
import {
  getHighestPriorityLane,
  getNextLanes,
  includesBlockingLane,
  markRootUpdated,
  NoLanes,
  SyncLane,
} from './ReactFiberLane';
import { getCurrentEventPriority } from 'react-dom-bindings/client/ReactDOMHostConfig';
import {
  flushSyncCallbacks,
  scheduleSyncCallback,
} from './ReactFiberSyncTaskQueue';

// 跟踪 React 协调过程中正在处理的 Fiber 节点
let workInProgress = null;
let rootDoesHavePassiveEffects = false;
let rootWithPendingPassiveEffects = null;

let workInProgressRootRenderLanes = NoLanes;
let workInProgressRoot = null;

const RootInProgress = 0;
const RootCompleted = 5;
let workInProgressRootExitStatus = RootInProgress;

function flushPassiveEffects() {
  if (rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects;
    commitPassiveUnmountEffects(root.current);
    commitPassiveMountEffects(root, root.current);
  }
}

export function scheduleUpdateOnFiber(root, fiber, lane) {
  markRootUpdated(root, lane);
  ensureRootIsScheduled(root);
}

/**
 * 确保 Root 被添加到调度中, 后面会在合适时机异步执行
 * @param {*} root
 */
function ensureRootIsScheduled(root) {
  let nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  );

  if (nextLanes === NoLanes) {
    return;
  }

  let newCallbackPriority = getHighestPriorityLane(nextLanes);
  let newCallbackNode;
  if (newCallbackPriority === SyncLane) {
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    queueMicrotask(flushSyncCallbacks);
    newCallbackNode = null;
  } else {
    let schedulerPriorityLevel;
    switch (lanesToEventPriority(nextLanes)) {
      case DiscreteEventPriority:
        schedulerPriorityLevel = ImmediatePriority;
        break;
      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingPriority;
        break;
      case DefaultEventPriority:
        schedulerPriorityLevel = NormalPriority;
        break;
      case IdleEventPriority:
        schedulerPriorityLevel = IdlePriority;
        break;
      default:
        schedulerPriorityLevel = NormalPriority;
        break;
    }
    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }
  root.callbackNode = newCallbackNode;
}

function performSyncWorkOnRoot(root) {
  const lanes = getNextLanes(root);
  renderRootSync(root, lanes);
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
  return null;
}

function performConcurrentWorkOnRoot(root, didTimeout) {
  const originalCallbackNode = root.callbackNode;

  // TODO:
  if (originalCallbackNode === null) {
    return;
  }

  const lanes = getNextLanes(root, NoLanes);
  if (lanes === NoLanes) {
    return null;
  }

  const shouldTimeSlice = !includesBlockingLane(root, lanes) && !didTimeout;
  const existStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes);
  if (existStatus !== RootInProgress) {
    const finishedWork = root.current.alternate;
    root.finishedWork = finishedWork;
    commitRoot(root);
  }
  if (root.callbackNode === originalCallbackNode) {
    return performConcurrentWorkOnRoot.bind(null, root);
  }

  return null;
}

function renderRootConcurrent(root, lanes) {
  prepareFreshStack(root, lanes);
  workLoopConcurrent();
  if (workInProgress !== null) {
    return RootInProgress;
  }
  return workInProgressRootExitStatus;
}

function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}

function renderRootSync(root, renderLanes) {
  if (
    root !== workInProgressRoot ||
    workInProgressRootRenderLanes !== renderLanes
  ) {
    prepareFreshStack(root);
  }
  try {
    workLoopSync();
  } catch (thrownValue) {
    // TODO:
    console.error('renderRootSync error', thrownValue);
    throw thrownValue;
  }

  workInProgressRoot = null;
  workInProgressRootRenderLanes = NoLanes;
  return workInProgressRootExitStatus;
}

function prepareFreshStack(root, renderLanes) {
  if (
    root !== workInProgressRoot ||
    workInProgressRootRenderLanes !== renderLanes
  ) {
    // TODO:
    workInProgress = createWorkInProgress(root.current, null);
  }
  workInProgressRootRenderLanes = renderLanes;
  workInProgressRoot = root;
  finishQueueingConcurrentUpdates();
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

/**
 * 执行工作单元
 * 可以理解为对应一个 Fiber 节点的渲染阶段(beginWork + completeWork)
 * @param {*} unitOfWork
 */
function performUnitOfWork(unitOfWork) {
  // 获取到当前 Fiber 节点对应的旧节点
  const current = unitOfWork.alternate;
  const next = beginWork(current, unitOfWork, workInProgressRootRenderLanes);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    completeUnitOfWork(unitOfWork);
  } else {
    // 更新全局的 workInProgress
    workInProgress = next;
  }
}

function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  while (completedWork !== null) {
    // 老的 fiber 节点
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    completeWork(current, completedWork);

    // 处理兄弟节点
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }

    // 最后一个子节点了也完成DOM创建和关联了
    // 回溯到父节点
    completedWork = returnFiber;
    workInProgress = completedWork;
  }
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted;
  }
}

function commitRoot(root) {
  // console.log('commitRoot', root);
  // const container = root.containerInfo;
  // const rootFiber = root.finishedWork;
  // container.appendChild(rootFiber.child.stateNode);

  const previousUpdatePriority = getCurrentUpdatePriority();
  try {
    setCurrentUpdatePriority(DiscreteEventPriority);
    commitRootImpl(root);
  } finally {
    setCurrentUpdatePriority(previousUpdatePriority);
  }
}

function commitRootImpl(root) {
  workInProgressRoot = null;
  workInProgressRootRenderLanes = null;
  root.callbackNode = null;

  const { finishedWork } = root;

  if (
    (finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags
  ) {
    // 当前已完成的根节点（或者子节点）是否有待处理的 Effect
    // 默认没有，满足上面的条件后会将相关标识设置为 true
    // 防止重复调用
    if (!rootDoesHavePassiveEffects) {
      rootDoesHavePassiveEffects = true;
      // 异步刷新待处理的 Effect
      scheduleCallback(NormalPriority, flushPassiveEffects);
    }
  }

  const subtreeHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffects = (finishedWork.flags & MutationMask) !== NoFlags;

  if (subtreeHasEffects || rootHasEffects) {
    commitMutationEffectsOnFiber(finishedWork, root);
    commitLayoutEffects(finishedWork, root);

    if (rootDoesHavePassiveEffects) {
      rootDoesHavePassiveEffects = false;
      // commit 阶段结束后, 会标识当前存在待处理的 Effect 对应的根节点
      rootWithPendingPassiveEffects = root;
    }
  }

  // 更新 FiberRoot 的 rootFiber 指向
  root.current = finishedWork;
}

/**
 * 获取当前的事件优先级
 * 如果为无优先级的话，返回默认的事件优先级
 * @returns
 */
export function requestUpdateLane() {
  const updateLane = getCurrentUpdatePriority();
  if (updateLane !== NoLanes) {
    return updateLane;
  }
  //   const eventLane = getCurrentEventPriority();
  // return eventLane;
  return DefaultEventPriority;
}
