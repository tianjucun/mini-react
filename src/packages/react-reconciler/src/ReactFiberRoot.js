import { createHostRootFiber } from './ReactFiber'
import { initialUpdateQueue } from './ReactClassUpdateQueue.js'

function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo
}


export function createFiberRoot(containerInfo) {
  const root = new FiberRootNode(containerInfo);
  const uninitializeFiber = createHostRootFiber();
  root.current = uninitializeFiber;
  uninitializeFiber.stateNode = root;
  initialUpdateQueue(uninitializeFiber)
  return root;
}