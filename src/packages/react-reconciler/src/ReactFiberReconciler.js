
import { createFiberRoot } from './ReactFiberRoot';
import { createUpdate, enqueueUpdate } from './ReactClassUpdateQueue'
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop'

export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo);
}

export function updateContainer(element, container) {
  const fiber = container.current;
  const update = createUpdate();
  update.payload = { element };
  const root = enqueueUpdate(fiber, update);
  scheduleUpdateOnFiber(root);
}