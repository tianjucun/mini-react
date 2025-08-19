import { setInitialDOMProperties } from './ReactDOMComponent';
import { precacheFiberNode, updateFiberProps } from './ReactDOMComponentTree';

export function appendInitialChild(parent, child) {
  parent.appendChild(child);
}

export function createInstance(type, props, internalInstanceHandle) {
  const domElement = document.createElement(type);
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
}

export function createTextInstance(content) {
  const textElement = document.createTextNode(content);
  return textElement;
}

export function finalizeInitialChildren(domElement, type, props) {
  setInitialDOMProperties(domElement, type, props);
}

export function insertBefore(parentNode, node, beforeChild) {
  parentNode.insertBefore(node, beforeChild);
}

export function appendChild(parentNode, child) {
  parentNode.appendChild(child);
}
