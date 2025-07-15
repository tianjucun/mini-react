import { REACT_ELEMENT_TYPE } from './util';

function render(VNode, containerDOM) {
  mount(VNode, containerDOM);
}

function mount(VNode, containerDOM) {
  // 1. 将 VNode 转换为真实 DOM
  const dom = createDOM(VNode);
  // 2. 将真实 DOM 挂载到容器中
  if (dom) {
    containerDOM.appendChild(dom);
  }
}

function createDOM(VNode) {
  if (VNode.$$typeof !== REACT_ELEMENT_TYPE) {
    return null;
  }

  // 1. 根据 type 创建 DOM
  // 2. 处理子元素
  // 3. 处理元素的 attribute

  const { type, props } = VNode;
  const dom = document.createElement(type);
  const { children, ...attrs } = props;
  if (typeof children === 'object') {
    mount(children, dom);
  } else if (typeof children === 'string') {
    dom.appendChild(document.createTextNode(children));
  } else if (Array.isArray(children)) {
    mountArray(children, dom);
  }

  // 处理元素的 attribute
  for (let attr of Object.keys(attrs)) {
    dom.setAttribute(attr, attrs[attr]);
  }

  return dom;
}

function mountArray(children, dom) {
  for (let child of children) {
    if (typeof child === 'string') {
      dom.appendChild(document.createTextNode(children));
    } else {
      mount(child, dom);
    }
  }
}

const ReactDOM = {
  render,
};

export default ReactDOM;
