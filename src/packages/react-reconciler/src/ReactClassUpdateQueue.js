import { markUpdateLaneFromFiberToRoot } from './ReactFiberConcurrentUpdates';
import assign from 'shared/assign';

export const UpdateState = 0;

export function initialUpdateQueue(fiber) {
  const queue = {
    shared: {
      // 初始化为 null, 代表待更新项
      // 对应一个循环链表
      pending: null,
    },
  };
  fiber.updateQueue = queue;
}

export function createUpdate() {
  const update = {
    next: null,
    tag: UpdateState,
  };
  return update;
}

export function enqueueUpdate(fiber, update) {
  const sharedQueue = fiber.updateQueue.shared;
  const { pending } = sharedQueue;
  if (pending === null) {
    // 第一次添加, A -> A
    update.next = update;
  } else {
    // B -> A -> B
    // C -> A -> B -> C
    // D -> A -> B -> C -> D

    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;

  return markUpdateLaneFromFiberToRoot(fiber);
}

/**
 * 处理更新队列, 获取新状态
 * 并更新 memoizedState
 * @param {*} fiber
 */
export function processUpdateQueue(fiber) {
  const sharedQueue = fiber.updateQueue.shared;
  const { pending } = sharedQueue;

  if (pending !== null) {
    sharedQueue.pending = null;
    const lastPendingUpdate = pending;
    const firstPendingUpdate = lastPendingUpdate.next;

    // TODO: 暂时取出循环链表的循环性
    lastPendingUpdate.next = null;
    let newState = fiber.memoizedState;
    let update = firstPendingUpdate;

    while (update !== null) {
      newState = getStateFromUpdate(update, newState);
      update = update.next;
    }

    fiber.memoizedState = newState;
  }
}

function getStateFromUpdate(update, prevState) {
  switch (update.tag) {
    case UpdateState:
      const { payload } = update;
      return assign({}, prevState, payload);
    default:
      return newState;
  }
}
