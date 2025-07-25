import { addEvent } from './event';
import {
  REACT_ELEMENT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_TEXT_TYPE,
} from './util';

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
  if (!VNode || VNode.$$typeof !== REACT_ELEMENT_TYPE) {
    return null;
  }

  if (
    typeof VNode.type === 'object' &&
    VNode.type.$$typeof === REACT_FORWARD_REF_TYPE
  ) {
    return getDOMFromForwardRef(VNode);
  }

  if (typeof VNode.type === 'function' && VNode.type.IS_CLASS_COMPONENT) {
    return getDOMFromClassComponent(VNode);
  }

  if (typeof VNode.type === 'function') {
    // 处理函数组件
    return getDOMFromFunctionComponent(VNode);
  }

  // 处理文本节点
  if (VNode.type === REACT_TEXT_TYPE) {
    const textDOMNode = document.createTextNode(VNode.props.text);
    VNode.dom = textDOMNode;
    return textDOMNode;
  }

  // 1. 根据 type 创建 DOM
  // 2. 处理子元素
  // 3. 处理元素的 attribute

  const { type, props, ref } = VNode;
  const dom = document.createElement(type);
  const { children, ...attrs } = props;
  if (Array.isArray(children)) {
    mountArray(children, dom);
  } else if (typeof children === 'object') {
    mount(children, dom);
  }

  // 处理元素的 attribute
  setPropsForDOM(dom, attrs);

  VNode.dom = dom;

  // 处理普通元素的 ref
  updateRef(ref, dom);

  return dom;
}

function updateRef(ref, dom) {
  // 其他情况会抛出错误
  // ref 默认是 null, 静默失败
  if (ref === null) return;

  if (typeof ref === 'function') {
    ref(dom);
  } else {
    ref.current = dom;
  }
}

function getDOMFromForwardRef(VNode) {
  const { ref, type, props } = VNode;
  const { render } = type;
  if (typeof render !== 'function') {
    return null;
  }
  const renderVNode = render(props, ref);
  if (!renderVNode) {
    return null;
  }
  return createDOM(renderVNode);
}

/**
 * 处理函数组件
 * 函数组件本质就是通过函数获取到对应的 jsx elements(VNode)
 * 然后将对应的 VNode 转换为真实的 DOM
 * @param {*} VNode
 * @returns
 */
function getDOMFromFunctionComponent(VNode) {
  console.log('getDOMFromFunctionComponent VNode: ', VNode);
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
  const { type, props, ref } = VNode;
  const instance = new type(props);

  // 处理类组件的 ref
  updateRef(ref, instance);

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
    mount(child, dom);
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
    } else if (/^on[A-Z].*/.test(key)) {
      // 处理事件
      const nativeEventName = key.toLowerCase();
      addEvent(dom, nativeEventName, propValue);
    } else {
      dom.setAttribute(key, propValue);
    }
  });
}

export function findDomByVNode(VNode) {
  if (!VNode) return;
  if (VNode.dom) return VNode.dom;
}

export function updateDOMTree(oldVNode, newVNode) {
  // if (!oldVNode) return;
  if (!newVNode || !newVNode) return;
  const parentDOM = oldVNode.dom.parentNode;

  const DOM_DIFF_TYPE_MAP = {
    // 新的虚拟DOM和旧的虚拟DOM都不存在，什么也不处理
    RETURN: !newVNode && !oldVNode,
    // 新的虚拟DOM存在，旧的虚拟DOM不存在，新增
    ADD: newVNode && !oldVNode,
    // 新的虚拟DOM不存在，旧的虚拟DOM存在，删除
    DELETE: !newVNode && oldVNode,
    // 新的虚拟DOM存在，旧的虚拟DOM存在，但是节点类型不同, 替换
    REPLACE: newVNode && oldVNode && newVNode.type !== oldVNode.type,
    // 新的虚拟DOM存在，旧的虚拟DOM存在，节点类型也相同，比对
    COMPARE: newVNode && oldVNode && newVNode.type === oldVNode.type,
  };

  const DIFF_TYPE = Object.keys(DOM_DIFF_TYPE_MAP).find((key) =>
    Boolean(DOM_DIFF_TYPE_MAP[key])
  );

  console.log('updateDOMTree DIFF_TYPE: ', DIFF_TYPE, oldVNode, newVNode);

  switch (DIFF_TYPE) {
    case 'ADD':
      parentDOM.appendChild(createDOM(newVNode));
      break;
    case 'DELETE':
      const oldDOM = findDomByVNode(oldVNode);
      oldDOM && oldDOM.remove();
      break;
    case 'REPLACE':
      parentDOM.replaceChild(createDOM(newVNode), oldVNode.dom);
      break;
    case 'COMPARE':
      compare(oldVNode, newVNode);
      break;
    case 'RETURN':
      break;
    default:
      return;
  }
}

function compare(oldVNode, newVNode) {
  // TODO: 先做替换
  const parentDOM = oldVNode.dom.parentNode;
  parentDOM.replaceChild(createDOM(newVNode), oldVNode.dom);
}

const ReactDOM = {
  render,
};

export default ReactDOM;
