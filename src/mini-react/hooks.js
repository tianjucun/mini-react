import { emitUpdateForHooks } from './react-dom';

const states = [];
let hookIndex = 0;

export function resetHookIndex() {
  // 保证每次调用 hook 时, index 的顺序一致
  hookIndex = 0;
}

export function useState(initialState) {
  states[hookIndex] = states[hookIndex] || initialState;
  const currentIndex = hookIndex;
  function setState(newState) {
    // 通过闭包，将当前的 hookIndex 绑定到 setState 函数上
    states[currentIndex] = newState;
    emitUpdateForHooks();
  }
  return [states[hookIndex++], setState];
}

// useReducer 会根据 dispatch 函数的调用
// 自动调用 reducer 函数计算新的 state, 并更新 state
export function useReducer(reducer, initialState) {
  // 基于 useState 实现 useReducer
  const [state, setState] = useState(initialState);
  function dispatch(action) {
    // 通过 reducer 计算新的 state
    const newState = reducer(state, action);
    setState(newState);
  }
  return [state, dispatch];
}

// deps 依赖项必须是响应式的 state 状态
// 这样当 state 发生变化时, 会重新执行 useEffect,
// 可以通过 deps 和 闭包中的 oldDeps 比对, 来判断是否需要调用 effect 函数
export function useEffect(effect, deps) {
  // destructor
  // deps 改变需要调用 effect 函数
  // 需要比对老的 deps 和 新的 deps

  const currentIndex = hookIndex;
  const [destructor, oldDeps] = states[hookIndex] || [null, null];
  if (
    !states[hookIndex] ||
    deps.some((item, index) => !Object.is(item, oldDeps[index]))
  ) {
    // 异步执行
    setTimeout(() => {
      // TODO: 假如 deps 是一个空数组, 应该在组件卸载时调用 destructor 函数
      destructor && destructor();
      states[currentIndex] = [effect(), deps];
    });
  }
  hookIndex++;
}

export function useLayoutEffect(effect, deps) {
  const currentIndex = hookIndex;
  const [destructor, oldDeps] = states[hookIndex] || [null, null];
  if (
    !states[hookIndex] ||
    deps.some((item, index) => !Object.is(item, oldDeps[index]))
  ) {
    // 异步执行
    queueMicrotask(() => {
      destructor && destructor();
      states[currentIndex] = [effect(), deps];
    });
  }
  hookIndex++;
}

export function useRef(initialValue) {
  states[hookIndex] = states[hookIndex] || { current: initialValue };
  return states[hookIndex++];
}

export function useImperativeHandle(ref, init, deps) {
  const [oldDeps] = states[hookIndex] || [null];
  if (
    !states[hookIndex] ||
    deps.some((item, index) => !Object.is(item, oldDeps[index]))
  ) {
    ref.current = init();
    states[hookIndex] = [deps];
  }
  hookIndex++;
}
