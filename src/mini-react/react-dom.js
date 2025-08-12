import { addEvent } from './event';
import {
  isClassComponent,
  isForwardRefComponent,
  isFunctionComponent,
  isTextComponent,
  REACT_ELEMENT_TYPE,
  isDOMComponent,
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

  if (isForwardRefComponent(VNode.type)) {
    return getDOMFromForwardRef(VNode);
  }

  if (isClassComponent(VNode.type)) {
    return getDOMFromClassComponent(VNode);
  }

  if (isFunctionComponent(VNode.type)) {
    // 处理函数组件
    return getDOMFromFunctionComponent(VNode);
  }

  // 处理文本节点
  if (isTextComponent(VNode.type)) {
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
  VNode.oldRenderVNode = renderVNode;
  const dom = createDOM(renderVNode);
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
  console.log('getDOMFromFunctionComponent VNode: ', VNode);
  const { type, props } = VNode;
  const renderVNode = type(props);
  if (!renderVNode) {
    return null;
  }
  VNode.oldRenderVNode = renderVNode;
  const dom = createDOM(renderVNode);
  VNode.dom = dom;
  return dom;
}

/**
 * 处理类组件
 * @param {*} VNode
 * @returns
 */
function getDOMFromClassComponent(VNode) {
  const { type, props, ref } = VNode;
  const instance = new type(props);
  // 挂载类组件实例
  VNode.classInstance = instance;

  // 处理类组件的 ref
  updateRef(ref, instance);

  const renderVNode = instance.render();
  renderVNode.instance = instance;
  instance.oldVNode = renderVNode;
  if (!renderVNode) {
    return null;
  }
  const dom = createDOM(renderVNode);

  VNode.dom = dom;

  // TODO: 类组件的挂载生命周期,
  // 目前是在虚拟DOM转换为真实DOM后调用的, 并不是在对应的真实DOM挂载完成后调用的
  if (instance?.componentDidMount) {
    instance.componentDidMount();
  }
  return dom;
}

/**
 * 处理子节点挂载
 * @param {*} children
 * @param {*} dom
 */
function mountArray(children, dom) {
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    child.index = i;
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

export function removeDOM(oldVNode) {
  const dom = findDomByVNode(oldVNode);
  if (dom) {
    // TODO: 待优化递归调用
    // 生命周期调用顺序: 子节点的 componentWillUnmount -> 父节点的 componentWillUnmount
    // 处理 oldVNode 以及 oldVNode 下所有的孩子节点的生命周期调用
    if (oldVNode.props.children) {
      const children = Array.isArray(oldVNode.props.children)
        ? oldVNode.props.children
        : [oldVNode.props.children];
      children.forEach((child) => {
        removeDOM(child);
      });
    }

    // 检查是否有对应的类组件实例
    if (oldVNode.classInstance?.componentWillUnmount) {
      // 调用类组件的 componentWillUnmount 方法
      oldVNode.classInstance.componentWillUnmount();
    }

    dom.remove();

    // 清空旧的虚拟DOM的引用
    oldVNode.dom = null;
  }
}

export function updateDOMTree(oldVNode, newVNode, oldDOM) {
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

  oldDOM = oldDOM || findDomByVNode(oldVNode);

  console.log('updateDOMTree DIFF_TYPE: ', DIFF_TYPE, oldVNode, newVNode);

  switch (DIFF_TYPE) {
    case 'ADD':
      // TODO: 跑通测试，待优化 newVNode._parent
      const parentNode = oldDOM?.parentNode || newVNode._parent;
      parentNode.appendChild(createDOM(newVNode));
      break;
    case 'DELETE':
      removeDOM(oldVNode);
      break;
    case 'REPLACE':
      oldDOM.parentNode.replaceChild(createDOM(newVNode), oldVNode.dom);
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
  if (!oldVNode || !newVNode) return;
  // TODO: 先做替换
  // const parentDOM = oldVNode.dom.parentNode;
  // parentDOM.replaceChild(createDOM(newVNode), oldVNode.dom);

  const type = newVNode.type;
  const diffVNodeType = {
    // 原生元素节点
    ELEMENT: isDOMComponent(type),
    // 类组件
    CLASS_COMPONENT: isClassComponent(type),
    // 函数组件
    FUNCTION_COMPONENT: isFunctionComponent(type),
    // 文本节点
    TEXT: isTextComponent(type),
    // 转发组件
    FORWARD_REF: isForwardRefComponent(type),
  };

  const newVNodeType = Object.keys(diffVNodeType).find(
    (key) => diffVNodeType[key]
  );
  switch (newVNodeType) {
    case 'ELEMENT':
      const dom = (newVNode.dom = findDomByVNode(oldVNode));
      setPropsForDOM(dom, newVNode.props);
      updateChildren(oldVNode.props.children, newVNode.props.children, dom);
      break;
    case 'FUNCTION_COMPONENT':
      updateFunctionComponent(oldVNode, newVNode);
      break;
    case 'CLASS_COMPONENT':
      updateClassComponent(oldVNode, newVNode);
      break;
    case 'TEXT':
      const textDOM = (newVNode.dom = findDomByVNode(oldVNode));
      if (newVNode.props.text !== oldVNode.props.text) {
        textDOM.textContent = newVNode.props.text;
      }
      break;
    case 'FORWARD_REF':
      updateForwardRefComponent(oldVNode, newVNode);
      break;
    default:
      break;
  }
}

function updateForwardRefComponent(oldVNode, newVNode) {
  const oldDOM = findDomByVNode(oldVNode.oldRenderVNode);
  if (!oldDOM) {
    console.warn('updateFunctionComponent oldDOM not found');
    return;
  }
  const { type, props, ref } = newVNode;
  const { render } = type;
  const newRenderVNode = render(props, ref);
  updateDOMTree(oldVNode.oldRenderVNode, newRenderVNode, oldDOM);
  newVNode.oldRenderVNode = newRenderVNode;
}

function updateFunctionComponent(oldVNode, newVNode) {
  const oldDOM = findDomByVNode(oldVNode.oldRenderVNode);
  if (!oldDOM) {
    console.warn('updateFunctionComponent oldDOM not found');
    return;
  }
  const { type, props } = newVNode;
  const newRenderVNode = type(props);
  updateDOMTree(oldVNode.oldRenderVNode, newRenderVNode, oldDOM);
  newVNode.oldRenderVNode = newRenderVNode;
}

function updateClassComponent(oldVNode, newVNode) {
  // 通过 oldVNode 获取到旧的类组件实例
  // 然后根据新的 props 更新类组件实例
  const classInstance = (newVNode.classInstance = oldVNode.classInstance);
  // classInstance.updater.launchUpdate(newVNode.props);
  classInstance.props = newVNode.props;
  classInstance.update();
}

function updateChildren(oldVNodeChildren, newVNodeChildren, parentDOM) {
  oldVNodeChildren = (
    Array.isArray(oldVNodeChildren) ? oldVNodeChildren : [oldVNodeChildren]
  ).filter(Boolean);
  newVNodeChildren = (
    Array.isArray(newVNodeChildren) ? newVNodeChildren : [newVNodeChildren]
  ).filter(Boolean);

  if (!oldVNodeChildren?.length && !newVNodeChildren?.length) {
    return;
  }

  // 老的子节点没有, 新的子节点有, 创建
  if (!oldVNodeChildren.length && newVNodeChildren.length) {
    newVNodeChildren.forEach((newVNode) => {
      const childDOM = createDOM(newVNode);
      if (childDOM) {
        parentDOM.appendChild(childDOM);
      }
    });
    return;
  }

  // 老的子节点有, 新的子节点没有, 删除
  if (oldVNodeChildren.length && !newVNodeChildren.length) {
    oldVNodeChildren.forEach((oldVNode) => {
      removeDOM(oldVNode);
    });
    return;
  }

  // 新老子节点都存在, 一一比对
  const oldChildKeyMap = oldVNodeChildren.reduce(
    (oldChildKeyMap, oldVNode, index) => {
      const key = oldVNode?.key ?? index;
      oldChildKeyMap[key] = oldVNode;
      return oldChildKeyMap;
    },
    {}
  );

  // 记录上一个没有变化的节点索引(key 相同)
  let lastNotChangedIndex = -1;
  const actions = [];
  for (let index = 0; index < newVNodeChildren.length; index++) {
    const newVNode = newVNodeChildren[index];
    const key = newVNode?.key ?? index;
    const oldVNode = oldChildKeyMap[key];
    if (oldVNode) {
      // 存在对应key的VNode

      // 深度遍历对应的 oldVNode 节点
      updateDOMTree(oldVNode, newVNode, findDomByVNode(oldVNode));
      // 老的子节点中对应的位置
      const oldVNodeIndex = oldVNode.index;
      if (oldVNodeIndex < lastNotChangedIndex) {
        // 小于, 说明在老的相对位置中, oldVNode 应该是在 lastNotChangedElement 的前面的
        // 但是新的节点里, 它跑到了后面, 所以需要移动
        actions.push({
          type: 'MOVE',
          newVNode,
          oldVNode,
          index,
        });
      }

      // 删除 Map 中对应的 key
      // 最后剩余的 key 就是新节点中没有, 老节点中有的节点
      // 需要删除
      delete oldChildKeyMap[key];
      lastNotChangedIndex = Math.max(lastNotChangedIndex, oldVNodeIndex);
    } else {
      // 不存在对应key的VNode
      actions.push({
        type: 'CREATE',
        newVNode,
        oldVNode,
        index,
      });
    }
  }

  // 需要根据 oldChildKeyMap 来获取需要删除的元素
  // 需要移动的元素对应的原节点也需要删除, 方便后续的插入
  const deleteToVNode = Object.keys(oldChildKeyMap).map(
    (key) => oldChildKeyMap[key]
  );
  const moveToVNode = actions
    .filter((action) => action.type === 'MOVE')
    .map((action) => action.oldVNode);
  const deleteToNodeLength = deleteToVNode.length;
  [...deleteToVNode, ...moveToVNode].forEach((oldVNode, index) => {
    if (index < deleteToNodeLength) {
      removeDOM(oldVNode);
      return;
    }

    const oldDOM = findDomByVNode(oldVNode);
    if (oldDOM) {
      oldDOM.remove();
    }
  });

  const getDomForInsert = (type, newVNode, oldVNode) => {
    if (type === 'CREATE') {
      // 根据新的 VNode, 创建一个新的节点
      return createDOM(newVNode);
    }
    if (type === 'MOVE') {
      // 需要move的节点, 直接根据老节点获取对应的DOM
      return findDomByVNode(oldVNode);
    }
  };

  // 根据 actions 去做具体的操作
  actions.forEach((action) => {
    const { newVNode, oldVNode, index, type } = action;
    const childNodes = parentDOM.childNodes;
    const childNode = childNodes[index];

    const newDOM = getDomForInsert(type, newVNode, oldVNode);

    if (childNode) {
      // 在 childNode 前插入
      parentDOM.insertBefore(newDOM, childNode);
    } else {
      // create
      parentDOM.appendChild(newDOM);
    }
  });
}

const ReactDOM = {
  render,
};

export default ReactDOM;
