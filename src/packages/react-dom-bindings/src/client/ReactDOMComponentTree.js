const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = `__reactFiber$` + randomKey;
const internalPropsKey = `__reactProps$` + randomKey;

export function precacheFiberNode(hostInstance, node) {
  node[internalInstanceKey] = hostInstance;
}

export function updateFiberProps(node, props) {
  node[internalPropsKey] = props;
}

export function getClosesInstanceFromNode(targetNode) {
  const targetInstance = targetNode[internalInstanceKey];
  return targetInstance;
}

export function getFiberCurrentPropsFromNode(node) {
  return node[internalPropsKey] || null;
}
