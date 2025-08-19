import { hasOwnProperty } from 'shared/hasOwnProperty';
import { setValueForStyles } from './CSSPropertyOperations';
import { setTextContent } from './setTextContent';
import { setValueForProperty } from './DOMPropertyOperations';

export function setInitialDOMProperties(domElement, type, props) {
  for (const propKey in props) {
    if (hasOwnProperty(props, propKey)) {
      const propValue = props[propKey];
      if (propKey === 'style') {
        setValueForStyles(domElement, propValue);
      } else if (propKey === 'children') {
        if (typeof propValue === 'string' || typeof propValue === 'number') {
          // 对于 children 为字符串的情况直接通过 textContent 进行设置
          // 因为单个字符串不会转为 Fiber 节点
          setTextContent(domElement, '' + propValue);
        }
      } else if (propValue !== null) {
        setValueForProperty(domElement, propKey, propValue);
      }
    }
  }
}
