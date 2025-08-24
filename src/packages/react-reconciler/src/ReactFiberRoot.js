import { createHostRootFiber } from './ReactFiber';
import { initialUpdateQueue } from './ReactFiberClassUpdateQueue';
import { NoLanes } from './ReactFiberLane';

/**
 * FiberRoot 并不是 Fiber 节点
 * FiberRoot 是「幕后管理者」，负责全局状态和渲染调度；
 * 负责不涉及具体组件逻辑的宏观控制（如树的切换、容器关联、调度优先级）
 * @param {*} containerInfo
 */
function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo;
  this.pendingLanes = NoLanes;
}

/**
 * 基于宿主容器信息初始化创建 React 应用的根节点以及与 Fiber 树的关联。
 * 初始化 rootFiber 的待更新队列，为根组件对应的虚拟DOM更新提供存储结构。
 *
 * @param { Object } containerInfo 用户提供的渲染容器信息，React 后续的渲染会在这个容器下进行，浏览器环境下可能为 div#root 类似这样的 DOM 容器
 * @returns 返回初始化后的根节点，方便实现后续虚拟DOM的渲染与更新
 */
export function createFiberRoot(containerInfo) {
  const root = new FiberRootNode(containerInfo);
  const uninitializeFiber = createHostRootFiber();
  // 通过 current 指向 HostRootFiber
  root.current = uninitializeFiber;
  uninitializeFiber.stateNode = root;
  initialUpdateQueue(uninitializeFiber);
  return root;
}
