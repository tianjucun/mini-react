import {
  createContainer,
  updateContainer,
} from 'react-reconciler/src/ReactFiberReconciler';
import { listenToAllSupportedEvents } from 'react-dom-bindings/events/DOMPluginEventSystem';

function ReactDOMRoot(root) {
  this._internalRoot = root;
}

ReactDOMRoot.prototype.render = function (element) {
  const root = this._internalRoot;
  updateContainer(element, root);
};

export function createRoot(container) {
  const root = createContainer(container);
  listenToAllSupportedEvents(container);
  return new ReactDOMRoot(root);
}
