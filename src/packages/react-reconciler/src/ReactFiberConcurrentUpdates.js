import { HostRoot } from './ReactWorkTag';

// 并发队列
let concurrentQueues = [];

let concurrentQueuesIndex = 0;

function enqueueUpdate(fiber, queue, update) {
  concurrentQueues[concurrentQueuesIndex++] = fiber;
  concurrentQueues[concurrentQueuesIndex++] = queue;
  concurrentQueues[concurrentQueuesIndex++] = update;
}

export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  // 主要用来记录上一个节点
  // 如果下一个阶段为 null, 那么 node 指向的就是根节点
  let node = sourceFiber;
  let parent = sourceFiber.return;
  while (parent !== null) {
    node = parent;
    parent = parent.return;
  }

  if (node.tag === HostRoot) {
    return node.stateNode;
  }

  return null;
}

export function enqueueConcurrentHookUpdate(fiber, queue, update) {
  enqueueUpdate(fiber, queue, update);
  return markUpdateLaneFromFiberToRoot(fiber);
}

export function finishQueueingConcurrentUpdates() {
  const endIndex = concurrentQueuesIndex;
  let i = (concurrentQueuesIndex = 0);
  while (i < endIndex) {
    const fiber = concurrentQueues[i++];
    const queue = concurrentQueues[i++];
    const update = concurrentQueues[i++];

    let pending = queue.pending;
    if (pending === null) {
      // A -> A
      update.next = update;
    } else {
      // A -> A
      // B -> A -> B
      update.next = pending.next;
      pending.next = update;
    }
    queue.pending = update;
  }
}
