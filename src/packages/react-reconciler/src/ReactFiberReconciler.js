import { createFiberRoot } from './ReactFiberRoot';
import { createUpdate, enqueueUpdate } from './ReactFiberClassUpdateQueue';
import { scheduleUpdateOnFiber, requestUpdateLane } from './ReactFiberWorkLoop';

export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo);
}

export function updateContainer(element, container) {
  const current = container.current;
  // 获取当前上下文的事件优先级
  const lane = requestUpdateLane(current);
  // 基于优先级初始化待变更的对象
  const update = createUpdate(lane);
  update.payload = { element };
  const root = enqueueUpdate(current, update, lane);
  scheduleUpdateOnFiber(root, current, lane);
}
