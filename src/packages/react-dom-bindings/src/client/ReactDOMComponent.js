import { hasOwnProperty } from 'shared/hasOwnProperty';
import { setValueForStyles } from './CSSPropertyOperations';
import { setTextContent } from './setTextContent';
import { setValueForProperty } from './DOMPropertyOperations';
import { registrationNameDependencies } from 'react-dom-bindings/events/EventRegistry';

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
      } else if (registrationNameDependencies.hasOwnProperty(propKey));
      else if (propValue !== null) {
        setValueForProperty(domElement, propKey, propValue);
      }
    }
  }
}

/**
 * 两个属性对象的深度比较
 * 1. oldProps 包含的属性，newProps 不包含，收集这些属性，对应数值收集为空
并在后面准备删除
 * 2. nextProps 包含的属性（lastProps 有与之对应的），收集发生变化的属性和值
 * @param {*} domElement 
 * @param {*} tag 
 * @param {*} oldProps 
 * @param {*} newProps 
 * @returns 
 */
export function diffProperties(domElement, tag, oldProps, newProps) {
  let updatePayload = null;
  let styleUpdates = null;
  let propKey;
  let styleName;

  // 收集需要删除的 props
  for (propKey in oldProps) {
    if (oldProps[propKey] === null) {
      continue;
    }

    if (
      hasOwnProperty(oldProps, propKey) &&
      !hasOwnProperty(newProps, propKey)
    ) {
      if (propKey === 'style') {
        const styleValue = oldProps[propKey];

        // 收集需要删除的 style props
        for (styleName in styleValue) {
          if (hasOwnProperty(styleValue, styleName)) {
            styleUpdates = styleUpdates || {};
            styleUpdates[styleName] = '';
          }
        }
      } else {
        updatePayload = updatePayload || [];
        updatePayload.push(propKey, null);
      }
    }
  }

  // 收集需要新增/修改的 props
  for (propKey in newProps) {
    if (hasOwnProperty(newProps, propKey)) {
      const oldValue = oldProps === null ? undefined : oldProps[propKey];
      const newValue = newProps[propKey];

      if (oldValue === newValue || (oldValue === null && newValue === null)) {
        continue;
      }

      if (propKey === 'style') {
        if (!oldValue) {
          styleUpdates = newValue[styleName];
          continue;
        }

        // 收集需要删除 style prop
        for (styleName in oldValue) {
          if (oldValue[styleName] === null) {
            continue;
          }

          if (
            hasOwnProperty(oldValue, styleName) &&
            !hasOwnProperty(newValue, styleName)
          ) {
            styleUpdates = styleUpdates || {};
            styleUpdates[styleName] = '';
          }
        }

        // 收集需要新增/修改的 style prop
        for (styleName in newValue) {
          if (
            hasOwnProperty(newValue, styleName) &&
            oldValue[styleName] !== newValue[styleName]
          ) {
            styleUpdates = styleUpdates || {};
            styleUpdates[styleName] = newValue[styleName];
          }
        }
      } else if (propKey === 'children') {
        if (typeof newValue === 'string' || typeof oldValue === 'number') {
          updatePayload = updatePayload || [];
          updatePayload.push(propKey, newValue);
        }
      } else {
        updatePayload = updatePayload || [];
        updatePayload.push(propKey, newValue);
      }
    }
  }

  // 合并需要有变化的 style
  if (styleUpdates) {
    updatePayload = updatePayload || [];
    updatePayload.push('style', styleUpdates);
  }

  return updatePayload;
}

export function updateProperties(domElement, updatePayload) {
  updateDOMProperties(domElement, updatePayload);
}

function updateDOMProperties(domElement, updatePayload) {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propKey === 'style') {
      setValueForStyles(domElement, propValue);
    } else if (propKey === 'children') {
      setTextContent(domElement, propValue);
    } else {
      setValueForProperty(domElement, propKey, propValue);
    }
  }
}
