const ObjectHasOwnProperty = Object.prototype.hasOwnProperty;
export function hasOwnProperty(obj, propName) {
  return ObjectHasOwnProperty.call(obj, propName);
}
