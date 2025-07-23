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

/**
 * 根据传入的虚拟 DOM 创建真实 DOM
 * 1. 处理函数组件
 * 2. 处理普通的元素
 *  2.1 根据 type 创建 DOM
 *  2.2 处理子元素
 *  2.3 处理元素的 attribute
 * @param {*} VNode
 * @returns
 */
function createDOM(VNode) {
  if (VNode.$$typeof !== REACT_ELEMENT_TYPE) {
    return null;
  }

  if (typeof VNode.type === 'function' && VNode.type.IS_CLASS_COMPONENT) {
    return getDOMFromClassComponent(VNode);
  }

  if (typeof VNode.type === 'function') {
    // 处理函数组件
    return getDOMFromFunctionComponent(VNode);
  }

  // 1. 根据 type 创建 DOM
  // 2. 处理子元素
  // 3. 处理元素的 attribute

  const { type, props } = VNode;
  const dom = document.createElement(type);
  const { children, ...attrs } = props;
  if (Array.isArray(children)) {
    mountArray(children, dom);
  } else if (typeof children === 'object') {
    mount(children, dom);
  } else if (typeof children === 'string') {
    dom.appendChild(document.createTextNode(children));
  }

  // 处理元素的 attribute
  setPropsForDOM(dom, attrs);

  VNode.dom = dom;

  return dom;
}

/**
 * 处理函数组件
 * 函数组件本质就是通过函数获取到对应的 jsx elements(VNode)
 * 然后将对应的 VNode 转换为真实的 DOM
 * @param {*} VNode
 * @returns
 */
function getDOMFromFunctionComponent(VNode) {
  const { type, props } = VNode;
  const renderVNode = type(props);
  if (!renderVNode) {
    return null;
  }
  return createDOM(renderVNode);
}

/**
 * 处理类组件
 * @param {*} VNode
 * @returns
 */
function getDOMFromClassComponent(VNode) {
  const { type, props } = VNode;
  const instance = new type(props);
  const renderVNode = instance.render();
  instance.oldVNode = renderVNode;
  if (!renderVNode) {
    return null;
  }
  return createDOM(renderVNode);
}

/**
 * 处理子节点挂载
 * @param {*} children
 * @param {*} dom
 */
function mountArray(children, dom) {
  for (let child of children) {
    if (typeof child === 'string') {
      dom.appendChild(document.createTextNode(child));
    } else {
      mount(child, dom);
    }
  }
}

/**
 * 处理元素的 props
 * 1. 特殊处理 style 样式
 * @param {*} dom
 * @param {*} props
 */
function setPropsForDOM(dom, props) {
  Object.keys(props).forEach((key) => {
    const propValue = props[key];
    if (key === 'style') {
      if (typeof propValue === 'string') {
        dom.style = propValue;
      } else {
        Object.keys(propValue).forEach((styleKey) => {
          dom.style[styleKey] = propValue[styleKey];
        });
      }
    } else {
      dom.setAttribute(key, propValue);
    }
  });
}

export function findDomByVNode(VNode) {
  if (!VNode) return;
  if (VNode.dom) return VNode.dom;
}

export function updateDOMTree(oldDOM, newVNode) {
  // if (!oldVNode) return;
  if (!newVNode) return;
  const parentDOM = oldDOM.parentNode;
  const newDOM = createDOM(newVNode);
  parentDOM.replaceChild(newDOM, oldDOM);
}

const ReactDOM = {
  render,
};

export default ReactDOM;
