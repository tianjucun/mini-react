import { markUpdateLaneFromFiberToRoot } from "./ReactFiberConcurrentUpdates";

export function initialUpdateQueue(fiber) {
  const queue = {
    shared: {
      // 初始化为 null, 代表待更新项
      // 对应一个循环链表
      pending: null
    }
  }
  fiber.updateQueue = queue;
}

export function createUpdate() {
  const update = {
    next: null
  };
  return update;
}

export function enqueueUpdate(fiber, update) {
  const sharedQueue = fiber.updateQueue.shared;
  const { pending } = sharedQueue;
  if(pending === null) {
    // 第一次添加, A -> A
    update.next = update;
  } else {
    // B -> A -> B
    // C -> A -> B -> C
    // D -> A -> B -> C -> D
    
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update

  return markUpdateLaneFromFiberToRoot(fiber);
}