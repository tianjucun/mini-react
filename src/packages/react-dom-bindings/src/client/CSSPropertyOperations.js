import { hasOwnProperty } from 'shared/hasOwnProperty';

export function setValueForStyles(node, styleValue) {
  for (const styleKey in styleValue) {
    if (hasOwnProperty(styleValue, styleKey)) {
      node.style[styleKey] = styleValue;
    }
  }
}
