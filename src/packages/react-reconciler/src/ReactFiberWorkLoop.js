import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { scheduleCallback } from 'scheduler';
import { completeWork } from './ReactFiberCompleteWork';
import { MutationMask, NoFlags, Passive } from './ReactFiberFlags';
import {
  commitMutationEffectsOnFiber,
  commitPassiveMountEffects,
  commitPassiveUnmountEffects,
  commitLayoutEffects,
} from './ReactFiberCommitWork';
import { finishQueueingConcurrentUpdates } from './ReactFiberConcurrentUpdates';

// 跟踪 React 协调过程中正在处理的 Fiber 节点
let workInProgress = null;
let rootDoesHavePassiveEffects = false;
let rootWithPendingPassiveEffects = null;

function flushPassiveEffects() {
  if (rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects;
    commitPassiveUnmountEffects(root.current);
    commitPassiveMountEffects(root, root.current);
  }
}

export function scheduleUpdateOnFiber(root) {
  ensureRootIsScheduled(root);
}

/**
 * 确保 Root 被添加到调度中, 后面会在合适时机异步执行
 * @param {*} root
 */
function ensureRootIsScheduled(root) {
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}

function performConcurrentWorkOnRoot(root) {
  renderRootSync(root);
  // 获取到已完成转换的 fiber 根节点
  const finishedWork = root.current.alternate;
  // 在 fiberRoot 上更新 finishedWork
  root.finishedWork = finishedWork;
  commitRoot(root);
}

function renderRootSync(root) {
  prepareFreshStack(root);
  try {
    workLoopSync();
  } catch (thrownValue) {
    console.error('renderRootSync error', thrownValue);
  }
}

function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null);
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
  const next = beginWork(current, unitOfWork);
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
}

function commitRoot(root) {
  // console.log('commitRoot', root);
  // const container = root.containerInfo;
  // const rootFiber = root.finishedWork;
  // container.appendChild(rootFiber.child.stateNode);

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
      scheduleCallback(flushPassiveEffects);
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
