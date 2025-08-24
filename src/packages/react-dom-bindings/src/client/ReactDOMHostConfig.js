import { DefaultEventPriority } from 'react-reconciler/src/ReactEventPriorities';
import {
  setInitialDOMProperties,
  diffProperties,
  updateProperties,
} from './ReactDOMComponent';
import { precacheFiberNode, updateFiberProps } from './ReactDOMComponentTree';
import { getEventPriority } from 'react-dom-bindings/events/ReactDOMEventListener';

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

export function prepareUpdate(domElement, type, oldProps, newProps) {
  return diffProperties(domElement, type, oldProps, newProps);
}

export function commitUpdate(
  domElement,
  updatePayload,
  type,
  oldProps,
  newProps
) {
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
  updateFiberProps(domElement, newProps);
}

export function commitTextUpdate(textNode, oldText, newText) {
  if (oldText !== newText) {
    textNode.textContent = newText;
  }
}

export function getCurrentEventPriority() {
  // window.event 是一个由微软 IE 引入的属性，
  // 只有当 DOM 事件处理程序被调用的时候会被用到。它的值是当前正在处理的事件对象。
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type);
}
