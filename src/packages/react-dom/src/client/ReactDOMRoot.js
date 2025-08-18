import { createContainer, updateContainer  } from 'react-reconciler/src/ReactFiberReconciler'

function ReactDOMRoot(root) {
  this._internalRoot = root;
}

ReactDOMRoot.prototype.render = function(element) {
  const root = this._internalRoot;
  updateContainer(element, root);
}

export function createRoot(container) {
  const root = createContainer(container);
  return new ReactDOMRoot(root);
}