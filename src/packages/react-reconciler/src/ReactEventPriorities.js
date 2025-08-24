import {
  DefaultLane,
  getHighestPriorityLane,
  IdleLane,
  includesNonIdleWork,
  InputContinuousLane,
  NoLane,
  SyncLane,
} from './ReactFiberLane';

export const DiscreteEventPriority = SyncLane;

export const ContinuousEventPriority = InputContinuousLane;

export const DefaultEventPriority = DefaultLane;

export const IdleEventPriority = IdleLane;

let currentUpdatePriority = NoLane;

export function getCurrentUpdatePriority() {
  return currentUpdatePriority;
}

export function setCurrentUpdatePriority(priority) {
  currentUpdatePriority = priority;
}

export function isHigherEventPriority(eventPriority, lane) {
  return eventPriority !== NoLane && eventPriority < lane;
}

export function lanesToEventPriority(lanes) {
  let lane = getHighestPriorityLane(lanes);
  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority;
  }
  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority;
  }
  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority;
  }
  return IdleEventPriority;
}
