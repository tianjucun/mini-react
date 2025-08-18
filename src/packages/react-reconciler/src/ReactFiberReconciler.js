
import { createFiberRoot } from './ReactFiberRoot';

export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo);
}

export function updateContainer(element, root) {
  console.log('updateContainer', element, root);
}