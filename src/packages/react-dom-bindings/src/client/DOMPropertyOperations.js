export function setValueForProperty(node, propKey, propValue) {
  if (propValue === null) {
    node.removeAttribute(propKey);
  } else {
    node.setAttribute(propKey, propValue);
  }
}
