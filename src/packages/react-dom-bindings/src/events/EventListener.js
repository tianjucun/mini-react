export function addEventBubbleListener(target, domEventName, listener) {
  target.addEventListener(domEventName, listener, false);

  return listener;
}

export function addEventCaptureListener(target, domEventName, listener) {
  target.addEventListener(domEventName, listener, true);

  return listener;
}
