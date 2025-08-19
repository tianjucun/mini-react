# render

## 和老架构(React16-)的核心区别

1. 老架构的 render 函数, 主要作用是:
   1. 将 ReactElement 转为虚拟DOM;
   2. 将虚拟 DOM 转为真实DOM;
   3. 将真实 DOM 挂载到页面上
2. Fiber 架构下的render 函数, 主要作用是:
   1. 将 ReactElement 转为 Fiber树
   2. 将 Fiber 树转为 真实DOM
   3. 将 真实DOM 挂载到页面上

其中 Fiber 可以简单理解为是对 虚拟DOM 的进一步抽象:

1. 既包含对原有 DOM 信息的抽象描述
2. 又包含对 Fiber 节点的关系描述
3. 以及相关优先级、副作用等增强设计

Fiber 下的 render 函数, 大概对应三个核心处理阶段

1. beginWork 阶段: 将每一个 ReactElement 转化为 Fiber 节点
2. completeWork 阶段: 为每一个 Fiber 节点创建一个 DOM 节点并维护绑定DOM之间的关系
3. commitWork 阶段: 将 Fiber 上对应的实际 DOM 节点挂载到页面容器中

更抽象的来看，也可以分为两个核心阶段:

1. 渲染阶段(beginWork 和 completeWork)
2. 提交阶段(commitWork)

## 实现 updateContainer

1. 找到 packages/react-reconciler/src/ReactFiberReconciler 文件
2. 获取当前的 rootFiber(HostRootFiber)
3. 调用 createUpdate 创建更新对象, 用于放入队列中, payload 为当前要更新的ReactElement
4. 调用 enqueueUpdate 将更新对象入队
5. 调用 scheduleUpdateOnFiber 将 fiberRoot 添加到调度中

## 完善更新队列

1. 找到 packages/react-reconciler/src/ReactClassUpdateQueue 文件
2. 实现 createUpdate 和 enqueueUpdate
3. createUpdate: 主要用来创建一个要更新的对象
4. enqueueUpdate 主要是将要更新的对象入队, 内部会维护一个单向循环链表
5. enqueueUpdate 需要调用 markUpdateLaneFromFiberToRoot
6. 在 packages/react-reconciler/src/ 下创建 ReactFiberConcurrentUpdates 文件
7. 实现 markUpdateLaneFromFiberToRoot
8. 主要的实现就是根据当前的 fiber 节点向上查找根节点 HostRootFiber,
   没有找到返回 null

## 初始化调度相关

1. 在 packages/react-reconciler/src/ 下创建 ReactFiberWorkLoop 文件
2. 实现 scheduleUpdateOnFiber 方法
3. 基于 HostRootFiber 调用 ensureRootIsScheduled 将当前 root 对应的更新队列添加到调用中, 确保后面可以被执行
4. ensureRootIsScheduled 内部会调用 scheduleCallback 方法, 对应的回调函数为
   performConcurrentWorkOnRoot
5. performConcurrentWorkOnRoot 主要作用就是处理上面的三个核心阶段，beginWork、completeWork、commitWork
6. 其中需要在 renderRootSync 中调用 prepareFreshStack 初始化 workInProgress, workInProgress 代表当前 ReactFiber 正在协调的 Fiber 节点或者是工作单元.
7. 在 workLoopSync 中实现渲染阶段的相关工作
8. workLoopSync 内部会建立一个循环, 持续判断 workInProgress 是否为 null, 不为 null 就会调用 performUnitOfWork 方法, 去执行一个工作单元.
9. performUnitOfWork 方法, 主要会通过 alternate 获取到当前 Fiber 节点对应的备份节点, 并通过调用 beiginWork 实现 ReactElement 转为 Fiber 节点
10. beginWork 执行完, 会将 memoizedProps 更新为 pendingProps
11. 检查 beginWork 是否返回 null, 返回 null 可能代表已经到达叶子节点了
12. 执行 completeWork 

## 简单调度实现

1. 在 packages/scheduler 下创建 index.js, 并导出 scheduleCallback 方法
2. scheduleCallback 简单通过 requestIdeCallback 进行实现

## 初始化 workInProgress

1. 在 packages/react-reconciler/src/ReactFiber 文件下
2. 创建 createWorkInProgress 方法, workInProgress 的初始化相关
3. 主要是基于旧的 Fiber 节点和新的属性创建一个新的 Fiber 节点
4. 通过 HostRootFiber 节点的 alternate 属性获取到备份 Fiber 节点