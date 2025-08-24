/* eslint-disable */

import { allowConcurrentByDefault } from 'shared/ReactFeatureFlags';

export const TotalLanes = 31;

// prettier-ignore
export const NoLanes                      = 0b0000_0000_0000_0000_0000_0000_0000_000;

// prettier-ignore
export const NoLane                       = 0b0000_0000_0000_0000_0000_0000_0000_000;

// prettier-ignore
export const SyncLane                     = 0b0000_0000_0000_0000_0000_0000_0000_001;

// prettier-ignore
export const InputContinuousHydrationLane = 0b0000_0000_0000_0000_0000_0000_0000_010;

// prettier-ignore
export const InputContinuousLane          = 0b0000_0000_0000_0000_0000_0000_0000_100;

// prettier-ignore
export const DefaultHydrationLane         = 0b0000_0000_0000_0000_0000_0000_0001_000;

// prettier-ignore
export const DefaultLane                  = 0b0000_0000_0000_0000_0000_0000_0010_000;

// prettier-ignore
export const SelectiveHydrationLane       = 0b0001_0000_0000_0000_0000_0000_0000_000;

// prettier-ignore
export const IdleHydrationLane            = 0b0010_0000_0000_0000_0000_0000_0000_000;

// prettier-ignore
export const IdleLane                     = 0b0100_0000_0000_0000_0000_0000_0000_000;

// prettier-ignore
export const OffscreenLane                = 0b1000_0000_0000_0000_0000_0000_0000_000;

// prettier-ignore
export const NonIdleLanes                 = 0b0001_1111_1111_1111_1111_1111_1111_111;

export function markRootUpdated(root, updateLane) {
  root.pendingLanes |= updateLane;
}

export function getNextLanes(root, wipLanes) {
  const pendingLanes = root.pendingLanes;
  if (pendingLanes == NoLanes) {
    return NoLanes;
  }
  const nextLanes = getHighestPriorityLanes(pendingLanes);

  // TODO: 待实现 wipLanes 的相关逻辑

  return nextLanes;
}

export function getHighestPriorityLanes(lanes) {
  return getHighestPriorityLane(lanes);
}

export function getHighestPriorityLane(lanes) {
  return lanes & -lanes;
}

export function includesNonIdleWork(lanes) {
  return (lanes & NonIdleLanes) !== NoLanes;
}

export function isSubsetOfLanes(set, subset) {
  return (set & subset) === subset;
}

export function mergeLanes(a, b) {
  return a | b;
}

export function includesBlockingLane(root, lanes) {
  if (allowConcurrentByDefault) {
    return false;
  }
  const SyncDefaultLanes = InputContinuousLane | DefaultLane;
  return (lanes & SyncDefaultLanes) !== NoLane;
}
