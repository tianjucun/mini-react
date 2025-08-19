# 实现 beginWork

## 初步了解 beginWork

1. beginWork 的主要职责是: 将每一个节点 ReactElement 转为 ReactFiber 节点
2. 由于 ReactFiber 节点相对于 ReactElement 元素之间的关系组织是不同的
   1. ReactElement 构成的虚拟 DOM 树, 可能需要关注 parent 和 children
   parent 指向父节点, children 指向子节点, 多个子节点用数组存储
   2. ReactFiber 节点构成的 fiber 链表, 需要关注 renturn, child, sibling 这个三个核心指针, return 指向当前 Fiber 的父节点, child 指向第一个子节点, sibling 的指向的是当前节点的兄弟节点. 即便当前节点有多个节点, 也不会有类似数组的结构来存储, 而是通过 child + sibling 完成对所有子节点的访问和维护.

## 大概脉络梳理

1. 由于 Fiber 节点有不同的 tag, 所以在处理ReactElement 节点转为 Fiber 节点时
   处理也有所不同, 不同的 tag 有不同的处理策略
2. 首先处理的肯定是 HostRoot 节点, 应该他处于链表的最开端, 同时也是树的根节点
3. 处理 HostRoot 节点, 不同于其他节点, 因为他需要找到目前需要处理的 element
4. 我们最开始在 upadteContainer 的时候创建了一个 udpate 对象, 并将 element 绑定到 payload 上, 进行入队, 而我们现在需要通过出队的方式获取到对应的 update 对象, 并更新 memoizedState
5. 调用 reconcilerChildren 将 memoizedState 上对应的 element 转为 Fiber 节点, 并更新 workInProgress 上的 child 指针为新的 子Fiber 节点
6. ReactChildFiber 文件中的 createChildReconciler 负责将 element 转为 Fiber 节点

## 处理更新队列, 更新 memoizedState

1. 在 packages/reconciler/src/ReactFiberClassUpdateQueue 中创建 processUpdateQueue 方法
2. processUpdateQueue 主要用来消费 updateQueue 的
3. 从头遍历 updateQueue.shared.pending 的循环链表
4. 将每个节点对应的 update 基于老状态转为新状态(类似 reduce 的一个过程)
5. 更新 memoizedState

## 初始化 createChildReconciler

1. 在 packages/reconciler/src/ 下创建 ReactChildFiber 文件
2. ReactChildFiber 中有一个 createChildReconciler 方法, 主要作用就是将 element 转为 ReactFiber 节点, 并维护对应的 return, child, sibling 等关系.
3. createChildReconciler 负责管理后面跟 fiber 节点转换遍历等相关操作
4. 里面有一个核心参数 shouldTrackSideEffects 是否追踪副作用
5. 这个 shouldTrackSideEffects 主要跟 fiber 节点上的 flags 或者 subtreeFlags 有关，比如你创建一个新的 fiber 节点，后面是要插入呢还是要更新呢，还是什么都不需要做呢。
6. ReactChildFiber 文件会通过闭包的方式暴露两个方法, mountChildFibers 和 reconcilerChildFibers 这两个核心方法. 主要区别就是前者不会追踪副总用, 后者会追踪副作用。通过前者创建的 fiber 节点本身没有副作用，具体的插入还是其他什么操作取决于它的父级 fiber 节点。而后者则相反，本身根据情况标注相关携带的副作用（插入/更新等）
7. createChildReconciler 内部有一个关键的方法 reconcilerChildFibers , 他的主要作用就是转化 Fiber 节点以及维护副作用。
8. reconcilerChildFibers 会关注两大种情况，第一种是 ReactElement 对象，还有一种是 ReactElement 数组
9. 不过处理其实是差不多的，都是基于 ReactElement 的 type，props，key 这些属性创建新的 Fiber 节点。但是数组的情况，可能需要考虑维护sibling，也就是创建完第一个子Fiber节点后，与下一个子节点的关系通过 sibling 指针来关联，并在返回的时候返回第一个子节点对应的 Fiber 节点即可