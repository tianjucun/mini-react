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
