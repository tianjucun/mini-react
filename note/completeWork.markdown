# completeWork 的实现

## 初步了解 completeWork

1. completeWork 对应渲染阶段中的创建宿主节点阶段
2. 怎么理解呢? beginWork 会将 ReactElement 转为 Fiber 节点, 那假如说这个节点转换为,
   并且它没有子节点了, 就需要根据对应的 fiber 节点 type 等相关属性创建这个宿主节点。
   比如我们的 jsx 结构是这样 div>h1>"Hello React!". 
   1. h1 创建完对应的 Fiber 节点后, 对于单个字符串, React 会优化, 不会将单个字符串转为 Fiber 节点
   2. 那就说明 h1 没有子节点需要调和了, 那对于 h1 的 beginWork 阶段就结束了
   3. 紧接着就是该执行它的 complteWork 阶段了, 简单来说,这个阶段主要做的事情就是更新 h1 的 fiber 节点的 stateNode 属性, 也就是创建一个 h1 标签挂载到 h1 的 fiber.stateNode 上.
   4. h1 完成 completeWork 阶段后, 由于没有兄弟元素, 需要再回溯到父节点 div, 完成 div Fiber 节点的 completeWork
3. 对于 React Fiber 树来说 beginWork 和 completeWork 是交替执行的, completeWork 执行的标志的是
   没有子节点了(到叶子节点了), completeWork 执行完会尝试检查兄弟节点, 有兄弟节点会执行兄弟节点的 beginWork，没有兄弟节点，回溯到父节点, 执行对应的 completeWork. 就这么交替执行, 直到根节点,
   因为 根节点的 return(父节点) 是 null

## completeUnitOfWork 的交替执行实现

1. 在 packages/react-reconciler/src/ReactFiberWorkLoop 下创建 completeUnitOfWork 方法
2. 内部会当前 workInProgress 节点开始遍历链表
3. 遍历逻辑是:
   1. 首先当前节点调用 completeWork 方法, 当前节点完成宿主节点的创建和关联
   2. 检查当前节点是否有兄弟节点, 如果有兄弟节点, 更新全局 workInProgress 为兄弟节点, 停止遍历,
   workLoopSync 会去检测, 然后处理兄弟节点的 beginWork
   3. 如果是最后一个子节点, 代表所有子节点都完成 completeWork 了, 那就向上回溯到父节点, 父节点去完成 completeWork

## 