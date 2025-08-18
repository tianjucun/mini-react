// FiberTag: 函数组件
export const FunctionComponent = 0;
// FiberTag: 类型组件
export const ClassComponent = 1;
// FiberTag: 未知组件, 由于在初始化前不能得知是函数组件还是类组件, 默认为未知组件
export const IndeterminateComponent = 2;
// FiberTag: 宿主环境下 Fiber 树的根节点
export const HostRoot = 3;
// FiberTag: 宿主环境下的常规节点, 比如浏览器环境下为 DOM 节点
export const HostComponent = 4;
// FiberTag: 宿主环境下的文本节点
export const HostText = 5;