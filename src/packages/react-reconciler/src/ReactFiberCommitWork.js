import { MutationMask, Placement, Update, Passive } from './ReactFiberFlags';
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive,
} from './ReactHookEffectTags';
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from './ReactWorkTag';
import {
  insertBefore,
  appendChild,
  commitUpdate,
  commitTextUpdate,
} from 'react-dom-bindings/client/ReactDOMHostConfig';

function recursivelyTraverseMutationEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & MutationMask) {
    let { child } = parentFiber;
    while (child !== null) {
      commitMutaionEffectsOnFiber(child, root);
      child = child.sibling;
    }
  }
}

function inserOrAppendPlacementNode(node, before, parent) {
  const { tag } = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    const { stateNode } = node;
    if (before) {
      insertBefore(parent, stateNode, before);
    } else {
      appendChild(parent, stateNode);
    }
  } else {
    const { child } = node;
    if (child !== null) {
      inserOrAppendPlacementNode(child, before, parent);
      let { sibling } = child;
      while (sibling !== null) {
        inserOrAppendPlacementNode(sibling, before, parent);
        sibling = siblingFiber;
      }
    }
  }
}

function isHostParent(fiber) {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

function getHostSibling(fiber) {
  let node = fiber;
  sibling: while (true) {
    // 查找方向: "自下向上"
    // 这个逻辑本身不是实现查找, 而是一种回溯的逻辑
    // 当前线没有找到, 需要向上回朔, 并尝试跳到下一条线
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node)) {
        return null;
      }
      node = node.return;
    }

    // 查找方向: "自左向右"
    node = node.sibling;

    // 查找方向: "自上向下"
    while (node.tag !== HostComponent || node.tag !== HostText) {
      if (node.flags & Placement) {
        // 如果说你当前的节点时插入节点
        // 就不往下找了, 因为我们要找的是非插入节点
        continue sibling;
      } else {
        node = node.child;
      }
    }

    // 非插入节点使我们要找的
    if (!(node.flags & Placement)) {
      return node;
    }
  }
}

function getHostParentFiber(fiber) {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
}

function commitPlacement(finishedWork) {
  const parentFiber = getHostParentFiber(finishedWork);
  switch (parentFiber.tag) {
    case HostRoot: {
      const fiberRoot = parentFiber.stateNode;
      const parent = fiberRoot.containerInfo;
      const before = getHostSibling(finishedWork);
      inserOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
    case HostComponent: {
      const parent = parentFiber.stateNode;
      const before = getHostSibling(finishedWork);
      inserOrAppendPlacementNode(finishedWork, before, parent);
    }
    default:
      break;
  }
}

function commitReconcilationEffects(finishedWork) {
  const { flags } = finishedWork;
  if (flags & Placement) {
    commitPlacement(finishedWork);
    // 清除 finishedWork.flags 中的 Placement 标记，而不影响其他位
    finishedWork.flags &= ~Placement;
  }
}

export function commitMutaionEffectsOnFiber(finishedWork, root) {
  const flags = finishedWork.flags;
  const current = finishedWork.alternate;
  switch (finishedWork.tag) {
    case HostText:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconcilationEffects(finishedWork);

      if (flags & Update) {
        const textInstance = finishedWork.stateNode;
        if (textInstance !== null) {
          const newText = finishedWork.pendingProps;
          const oldText =
            current === null ? newText : finishedWork.alternate.memoizedProps;

          commitTextUpdate(textInstance, oldText, newText);
        }
      }
      break;
    case HostRoot:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconcilationEffects(finishedWork);
      break;

    case FunctionComponent:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconcilationEffects(finishedWork);
      break;

    case HostComponent:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconcilationEffects(finishedWork);

      if (flags & Update) {
        const instance = finishedWork.stateNode;
        if (instance !== null) {
          const newProps = finishedWork.memoizedProps;
          const oldProps = current === null ? newProps : current.memoizedProps;
          const type = finishedWork.type;
          const udpatePayload = finishedWork.updateQueue;
          finishedWork.updateQueue = null;
          if (udpatePayload) {
            commitUpdate(
              instance,
              udpatePayload,
              type,
              oldProps,
              newProps,
              finishedWork
            );
          }
        }
      }

      break;

    default:
      break;
  }
}

export function commitPassiveUnmountEffects(finishedWork) {
  commitPassiveUnmountOnFiber(finishedWork);
}

function commitPassiveUnmountOnFiber(finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot:
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      break;
    case FunctionComponent:
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      if (flags & Passive) {
        commitHookPassiveUnmountEffects(
          finishedWork,
          HookHasEffect | HookPassive
        );
      }
      break;
    default:
      break;
  }
}

function recursivelyTraversePassiveUnmountEffects(parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child;
    while (child !== null) {
      commitPassiveUnmountOnFiber(child);
      child = child.sibling;
    }
  }
}

export function commitHookPassiveUnmountEffects(finishedWork, hookFlags) {
  commitHookEffectListUnmount(hookFlags, finishedWork);
}

function commitHookEffectListUnmount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & flags) === flags) {
        const destroy = effect.destroy;
        if (destroy !== undefined) {
          destroy();
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

export function commitPassiveMountEffects(root, finishedWork) {
  commitPassiveMountOnFiber(root, finishedWork);
}

function commitPassiveMountOnFiber(finishedRoot, finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot:
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);
      break;
    case FunctionComponent:
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);
      if (flags & Passive) {
        commitHookPassiveMountEffects(
          finishedWork,
          HookHasEffect | HookPassive
        );
      }
      break;
  }
}

function recursivelyTraversePassiveMountEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child;
    while (child !== null) {
      commitPassiveMountOnFiber(root, child);
      child = child.sibling;
    }
  }
}

function commitHookPassiveMountEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork);
}

function commitHookEffectListMount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if (effect.tag & (flags === flags)) {
        effect.destroy = effect.create();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
