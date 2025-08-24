import assign from 'shared/assign';
import { enqueueConcurrentClassUpdate } from './ReactFiberConcurrentUpdates';
import { isSubsetOfLanes, mergeLanes, NoLane, NoLanes } from './ReactFiberLane';

export const UpdateState = 0;

export function initialUpdateQueue(fiber) {
  const queue = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null,
    },
  };
  fiber.updateQueue = queue;
}

export function createUpdate(lane) {
  const update = {
    tag: UpdateState,
    lane,
    next: null,
  };
  return update;
}

export function enqueueUpdate(fiber, update, lane) {
  if (fiber.updateQueue === null) {
    return;
  }

  const updateQueue = fiber.updateQueue;
  const sharedQueue = updateQueue.shared;
  return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
}

export function processUpdateQueue(workInProgress, nextProps, renderLanes) {
  const queue = workInProgress.updateQueue;
  let { firstBaseUpdate, lastBaseUpdate, shared } = queue;
  const { pending: pendingQueue } = shared;
  if (pendingQueue !== null) {
    shared.pending = null;
    const lastPendingUpdate = pendingQueue;
    const firstPendingUpdate = lastPendingUpdate.next;
    lastPendingUpdate.next = null;
    if (lastBaseUpdate === null) {
      firstBaseUpdate = firstPendingUpdate;
    } else {
      lastBaseUpdate.next = firstPendingUpdate;
    }
    lastBaseUpdate = lastPendingUpdate;
  }

  if (firstBaseUpdate !== null) {
    let newState = queue.baseState;
    let newLanes = NoLanes;
    let newBaseState = null;
    let newFirstBaseUpdate = null;
    let newLastBaseUpdate = null;
    let update = firstBaseUpdate;

    do {
      const { lane: updateLane, id, payload } = update;
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        const clone = {
          id,
          payload,
          lane: updateLane,
        };

        if (newLastBaseUpdate === null) {
          newFirstBaseUpdate = newLastBaseUpdate = clone;
          newBaseState = newState;
        } else {
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }

        newLanes = mergeLanes(newLanes, updateLane);
      } else {
        if (newLastBaseUpdate !== null) {
          const clone = {
            id,
            payload,
            lane: NoLane,
          };
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        newState = getStateFromUpdate(update, newState);
      }
      update = update.next;
    } while (update);

    if (!newLastBaseUpdate) {
      newBaseState = newState;
    }

    queue.baseState = newBaseState;
    queue.firstBaseUpdate = newFirstBaseUpdate;
    queue.lastBaseUpdate = newLastBaseUpdate;
    workInProgress.lanes = newLanes;
    workInProgress.memoizedState = newState;
  }
}

export function getStateFromUpdate(update, prevState, nextProps) {
  switch (update.tag) {
    case UpdateState:
      const { payload } = update;
      let partialState;
      if (typeof payload === 'function') {
        partialState = payload.call(null, prevState, nextProps);
      } else {
        partialState = payload;
      }
      return assign({}, prevState, partialState);
    default:
      return null;
  }
}

export function cloneUpdateQueue(current, workInProgress) {
  const workInProgressQueue = workInProgress.udpateQueue;
  const currentQueue = current.updateQueue;
  if (currentQueue === workInProgressQueue) {
    const { baseState, firstBaseUpdate, lastBaseUpdate, shared } = currentQueue;
    const clone = {
      baseState,
      firstBaseUpdate,
      lastBaseUpdate,
      shared,
    };
    workInProgress.updateQueue = clone;
  }
}
