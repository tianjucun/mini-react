import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import { scheduleCallback } from 'scheduler';

// 跟踪 React 协调过程中正在处理的 Fiber 节点
let workInProgress = null;

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

  // TODO: beginWork 未实现, 防止死循环
  // workInProgress = null;
}

function completeUnitOfWork(unitOfWork) {
  let completedUnitOfWork = unitOfWork;
  while (completedUnitOfWork !== null) {
    console.log('completedUnitOfWork', completedUnitOfWork);

    if (completedUnitOfWork.sibling) {
      workInProgress = completedUnitOfWork.sibling;
      return;
    }

    completedUnitOfWork = completedUnitOfWork.return;
    workInProgress = completedUnitOfWork;
  }
}
