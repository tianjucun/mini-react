# 实现 mini-react 学习笔记记录

## 第一步: 初始化 ReactDOMRoot

### 创建 createRoot

  1. 在 packages/react-dom/src 下创建 ReactDOMRoot.js
  2. ReactDOMRoot 实现 createRoot 方法
  3. createRoot 调用 createContainer 创建一个容器, 并基于这个容器创建一个 ReactDOMRoot 对象
  4. 通过 _internalRoot 指向对应的 container
  5. 在 ReactDOMRoot 的原型上挂载 render 方法

### 实现 createContainer

  1. 在 packages/react-reconciler/src/ 下创建 ReactFiberReconciler.js
  2. ReactFiberReconciler 实现 createContainer 和 updateContainer 方法
  3. createContainer 内部会通过调用 createFiberRoot 创建一个 FiberRootNode 并返回
  4. 在 packages/react-reconciler/src/ 下创建 ReactFiberRoot.js
  5. ReactFiberRoot 实现 createFiberRoot
  6. FiberRootNode 可以理解为一个背后管理角色，用来管理后面创建的 Fiber 链表, 
   通过 current 指向 HostRootFiber
  7. createFiberRoot 基于 containerInfo 创建一个 FiberRootNode 的实例
  8. 内部会调用 createHostRootFiber 创建一个 FiberNode 节点, 这个是这个 Fiber链表的根节点(头节点), 它的 return 父节点是指向 null 的
  9. FiberRootNode 和 FiberNode(HostFiberNode) 之间的关系是:
     1. FiberRootNode 可以通过 current 关联到 FiberNode;
     2. 而 FiberNode(HostFiberNode) 可以通过 stateNode 可以关联到 FiberRootNode
  10. 在  packages/react-reconciler/src/ 下创建 ReactFiber.js
  11. 分别实现 createHostRootFiber、createFiber 两个方法
  12. createFiber 基于 tag，pendingProps，key 来初始化 FiberNode 实例

### 初始化更新队列

  1. 在 packages/react-reconciler/src/ 下创建 ReactFiberClassUpdateQueue.js
  2. ReactFiberClassUpdateQueue 实现 initialUpdateQueue 方法
  3. initialUpdateQueue 初始化创建一个 queue, 对应的 shared.pending 是 null