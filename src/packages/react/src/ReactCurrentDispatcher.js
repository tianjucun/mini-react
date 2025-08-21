/**
 * 当前的调度器
 * react 会根据不同的阶段挂载不同的调度器,
 * 在一定程度上实现了阶段之间的操作隔离。
 *
 * 对于挂载阶段，react 会将用户在函数组件内部调用的 hooks
 * 按照一定顺序并结合相关的关键数据串成一个链（链表），存储到当前 Fiber 节点
 * 对应的 memoizedState 中。后期用户在触发更新时，相当于给对应的调度员（Hook）
 * 发送了一个信号，调度员（Hook）会将对应的要更新的数据存储到更新队列中，
 * 并在下一轮更新时，会将这些更新队列里的数据进行，处理为一个个链表(单向循环链表)，
 * 用于在更新阶段进行数据消费，以及计算出最新的数据。
 *
 * 对于更新阶段，react 会根据 alternate 获取上一次提交的 Fiber 对象，
 * 通过 alternate.memoizedState 获取到待处理的 Hook 链，并按照顺序依次
 * 处理 hook 上待处理的数据，并计算为新的数据，返回给用户，然后用户的组件
 * 会通过新数据计算出新的 ReactElement 节点。
 *
 * 后续通过差异化算法完成新的一轮 Fiber 节点更新以及宿主节点更新。
 *
 * 通过上面可以看出 Hook 其实是 React 暴露给开发者除手动调用 render 外
 * 另一个推动渲染一种方式。
 * 而 Hook 就像是 React 这个世界中的一个调度员，开发者不用关系何时渲染，
 * 以及内部如何处理，只需要通过调用 dispatch 方法告诉调度员我要以什么样的方式
 * 更新或者消费数据。Hook 内部就会根据你调用的 Hook 帮你分配更新，并在何时的
 * 时候推动 React 自动进行更新。
 */
const ReactCurrentDispatcher = {
  current: null,
};

export default ReactCurrentDispatcher;
