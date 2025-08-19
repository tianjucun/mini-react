import { setInitialDOMProperties } from './ReactDOMComponent';

export function appendInitialChild(parent, child) {
  parent.appendChild(child);
}

export function createInstance(type) {
  const domElement = document.createElement(type);
  return domElement;
}

export function createTextInstance(content) {
  const textElement = document.createTextNode(content);
  return textElement;
}

export function finalizeInitialChildren(domElement, type, props) {
  setInitialDOMProperties(domElement, type, props);
}
