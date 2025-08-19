export function getEventTarget(nativeEvent) {
  return nativeEvent.target || nativeEvent.srcElement || window;
}
