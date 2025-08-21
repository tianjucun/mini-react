import ReactCurrentDispatcher from './ReactCurrentDispatcher';

function resolveDispatcher() {
  return ReactCurrentDispatcher.current;
}

export function useReducer(reducer, initialArg) {
  return resolveDispatcher().useReducer(reducer, initialArg);
}

export function useState(initialArg) {
  return resolveDispatcher().useState(initialArg);
}

export function useEffect(create, deps) {
  return resolveDispatcher().useEffect(create, deps);
}
