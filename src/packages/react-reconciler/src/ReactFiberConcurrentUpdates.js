import { HostRoot } from "./ReactWorkTag";

export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  // 主要用来记录上一个节点
  // 如果下一个阶段为 null, 那么 node 指向的就是根节点
  let node = sourceFiber;
  let parent = sourceFiber.return;
  while(parent !== null) {
    node = parent;
    parent = parent.return;
  }

  if (node.tag === HostRoot) {
    return node.stateNode;
  }

  return null;
}