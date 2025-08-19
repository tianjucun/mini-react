import getAlias from 'react-dom-bindings/shared/getAttributeAlias';

export function setValueForProperty(node, propKey, propValue) {
  if (propValue === null) {
    node.removeAttribute(propKey);
  } else {
    const realPropKey = getAlias(propKey);
    node.setAttribute(realPropKey, propValue);
  }
}
