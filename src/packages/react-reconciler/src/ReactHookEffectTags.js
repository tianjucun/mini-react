export const NoFlags = 0b0000;
// FiberHook tag: 依赖发生改变，存在副作用
export const HasEffect = 0b0001;
// FiberHook tag: 当前 Hook 为 effect Hook
export const Passive = 0b1000;
