import { hasOwnProperty } from 'shared/hasOwnProperty';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbol';

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};

function hasValidKey(config) {
  return config.key !== undefined;
}

function hasValidRef(config) {
  return config.ref !== undefined;
}

const ReactElement = function (type, key, ref, self, source, owner, props) {
  return {
    // 标识为 react 元素
    $$typeof: REACT_ELEMENT_TYPE,

    // 元素的内置属性
    type,
    key,
    ref,
    props,

    // 记录负责创建此元素的组件
    _owner: owner,

    // 处理测试相关
    _self: self,
    _source: source,
  };
};

export function jsxDEV(type, config, maybekey, source, self) {
  let propName;

  const props = {};

  let key = null;
  let ref = null;

  if (maybekey !== undefined) {
    key = '' + maybekey;
  }

  // 处理 config.key
  if (hasValidKey(config)) {
    key = '' + config.key;
  }

  // 校验 ref
  if (hasValidRef(config)) {
    ref = config.ref;
  }

  // 自身属性并且不是保留属性再进行复制
  for (propName in config) {
    if (
      hasOwnProperty(config, propName) &&
      !hasOwnProperty(RESERVED_PROPS, propName)
    ) {
      props[propName] = config[[propName]];
    }
  }

  // 处理默认为的 props
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  // TODO: 目前 source 暂时处理为 null
  return ReactElement(type, key, ref, self, source, null, props);
}
