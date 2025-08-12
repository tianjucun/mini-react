export const REACT_ELEMENT_TYPE = Symbol.for('react.element');
export const REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
export const REACT_TEXT_TYPE = Symbol.for('react.text');

export function toVNode(VNode) {
  if (typeof VNode === 'string' || typeof VNode === 'number') {
    return {
      $$typeof: REACT_ELEMENT_TYPE,
      type: REACT_TEXT_TYPE,
      props: {
        text: VNode,
      },
    };
  }
  return VNode;
}

export const isClassComponent = (type) =>
  typeof type === 'function' && type.IS_CLASS_COMPONENT;
export const isFunctionComponent = (type) =>
  !isClassComponent(type) && typeof type === 'function';
export const isForwardRefComponent = (type) =>
  type.$$typeof === REACT_FORWARD_REF_TYPE;
export const isTextComponent = (type) => type === REACT_TEXT_TYPE;
export const isDOMComponent = (type) => typeof type === 'string';

// export const filterChildrenProps = (props) =>
//   Object.keys(props)
//     .filter((key) => key !== 'children')
//     .reduce((obj, key) => {
//       obj[key] = props[key];
//       return obj;
//     }, {});

export const filterChildrenProps = (props) =>
  Object.fromEntries(
    Object.entries(props).filter(([key]) => key !== 'children')
  );

const typeMap = {
  '[object Object]': 'object',
  '[object Array]': 'array',
  '[object Function]': 'function',
  '[object String]': 'string',
  '[object Number]': 'number',
  '[object Boolean]': 'boolean',
  '[object Symbol]': 'symbol',
  '[object Null]': 'null',
  '[object Undefined]': 'undefined',
  '[object Date]': 'date',
  '[object RegExp]': 'regExp',
  '[object Map]': 'map',
  '[object Set]': 'set',
  '[object WeakMap]': 'weakMap',
  '[object WeakSet]': 'weakSet',
};
const toString = Object.prototype.toString;
export function getType(obj) {
  return typeMap[toString.call(obj)];
}

// TODO: 待替换为 lodash 的 deepClone 函数
export function deepClone(obj, weakMap = new WeakMap()) {
  const type = getType(obj);
  if (type === 'null') {
    return obj;
  }

  // 处理 Date
  if (type === 'date') {
    return new Date(obj);
  }

  // 处理正则
  if (type === 'regExp') {
    return new RegExp(obj.source, obj.flags);
  }

  // 处理 Symbol
  if (type === 'symbol') {
    return Symbol(obj.description);
  }

  if (type === 'function') {
    return function () {
      return obj.apply(this, arguments);
    };
  }

  if (type !== 'object') {
    return obj;
  }

  // 处理 Map, Set, WeakMap, WeakSet
  if (type === 'map') {
    // 处理 Map 的深拷贝
    const map = new Map();
    obj.forEach((value, key) => {
      map.set(key, deepClone(value, weakMap));
    });
    return map;
  }
  if (type === 'set') {
    // 处理 Set 的深拷贝
    const set = new Set();
    obj.forEach((value) => {
      set.add(deepClone(value, weakMap));
    });
    return set;
  }
  if (type === 'weakMap') {
    // 处理 WeakMap 的深拷贝
    const weakMap = new WeakMap();
    obj.forEach((value, key) => {
      weakMap.set(key, deepClone(value, weakMap));
    });
    return weakMap;
  }
  if (type === 'weakSet') {
    // 处理 WeakSet 的深拷贝
    const weakSet = new WeakSet();
    obj.forEach((value) => {
      weakSet.add(deepClone(value, weakMap));
    });
    return weakSet;
  }

  // 处理循环引用
  if (weakMap.has(obj)) {
    return weakMap.get(obj);
  }

  // 处理对象间的复杂引用
  let cloneObj = Array.isArray(obj) ? [] : {};

  // 缓存当前对象，用于处理循环引用
  weakMap.set(obj, cloneObj);

  // Reflect.ownKeys 可以获取到对象的所有属性，
  // 包括 Symbol 类型的属性 和 不可枚举的属性
  Reflect.ownKeys(obj).forEach((key) => {
    cloneObj[key] = deepClone(obj[key], weakMap);
  });

  return cloneObj;
}

// 参考 React 官方实现
export function shallowEqual(o1, o2) {
  if (Object.is(o1, o2)) {
    return true;
  }

  if (
    typeof o1 !== 'object' ||
    o1 === null ||
    typeof o2 !== 'object' ||
    o2 === null
  ) {
    return false;
  }

  const o1Keys = Object.keys(o1);
  const o2Keys = Object.keys(o2);
  if (o1Keys.length !== o2Keys.length) {
    return false;
  }

  for (let i = 0; i < o1Keys.length; i++) {
    const key = o1Keys[i];
    if (!o2.hasOwnProperty(key) || !Object.is(o1[key], o2[key])) {
      return false;
    }
  }

  return true;
}
