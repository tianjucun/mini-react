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

## completeWork 基础逻辑实现

1. 在 packages/react-reconciler/src 下创建 ReactFiberCompleteWork 文件
2. 创建 completeWork 方法
3. 不同的 Fiber 节点在处理 completeWork 时有所不同
4. 但是都需要做一个优化操作: 属性冒泡, 将子节点的 flags 和 subtreeFlags 对应的副作用标识收集上来, 方便后面优化(如果当前节点对应subtreeFlags 是 NoFlag, 就代表所有子节点都没有副作用)
5. 对于 HostComponent:
   1. 根据 Fiber 的 type 属性创建一个宿主节点
   2. 并调用 appendAllChildren 方法将这个 Fiber 下所对应的所有子宿主节点全部进行 宿主 关系绑定(将子DOM放到父DOM里)
   3. 根据 pendingProps 为宿主节点更新相关宿主属性
6. 对于 HostText
   1. 根据 Fiber 的 type 属性创建一个宿主文本节点
   2. pendingProps 对应的就是文本内容

## appendAllChildren 基础逻辑实现

1. 这个函数的核心作用就是将当前 Fiber 节点下所有宿主类型的 Fiber 节点收集上来, 并添加到父 DOM 中
2. 由于 Fiber 节点类型比较多, 所以在查找子宿主类型节点时稍微有点复杂:
   1. 优先判断当前节点的子节点是不是宿主节点
   2. 其次判断当前节点的子节点是否还有子节点(链表自上向下遍历), 有子节点直接 continue
   3. 判断当前节点是否是 workInProgress (到当前正在处理 Fiber 节点了, 说明遍历该结束了)
   4. 判断当前节点是否有兄弟节点, 有兄弟节点, 直接遍历兄弟节点(链表自左向右遍历)
   5. 没有兄弟节点, 向上回朔到父节点(链表自下向上遍历)
3. 整体的思想就是：
   1. 是宿主节点链表的遍历方向就是 (从左到右)
   2. 不是宿主节点但是有子节点遍历方向就是 (从上到下)
   3. 不是宿主节点并且没有子节点遍历方向就是 (从左到右)
   4. 不是宿主节点, 没有子节点并且没有兄弟节点, 遍历方向就是 (从下往上)

## 初始化 react-dom-bindings 模块

1. react-dom-bindings 主要是 辅助 react-dom 包完成浏览器的相关 DOM 操作
2. 在这个模块有一个核心方法需要关注一下, 那就是 setInitialDOMProperties
3. 这个方法主要根据 props 更新 DOM 上的属性
   1. 如果是 style 的话, 由于 style 在 JSX 中是传递一个对象, 那么需要循环将 style 属性赋值到 style 上.
   2. 如果是 children 的话, 对于字符串 children, 会直接更新对应的 textContent