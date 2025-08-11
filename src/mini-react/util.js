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
