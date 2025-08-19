import assign from 'shared/assign';

function functionThatReturnsFalse() {
  return false;
}

function functionThatReturnsTrue() {
  return true;
}

const MouseEventInterface = {
  clientX: 0,
  clientY: 0,
};

function createSyntheticEvent(Interface) {
  function SyntheticBaseEvent(
    reactName,
    reactEventType,
    targetInstance,
    nativeEvent,
    nativeEventTarget
  ) {
    this._reactName = reactName;
    this.type = reactEventType;
    this._targetInstance = targetInstance;
    this.nativeEvent = nativeEvent;
    this.target = nativeEventTarget;

    for (const propName in Interface) {
      if (!Interface.hasOwnProperty(propName)) {
        continue;
      }
      this[propName] = nativeEvent[propName];
    }

    this.isDefaultPrevented = functionThatReturnsFalse;
    this.isPropagationStopped = functionThatReturnsFalse;
    return this;
  }

  assign(SyntheticBaseEvent.prototype, {
    preventDefault() {
      const event = this.nativeEvent;
      if (event.preventDefault) {
        event.preventDefault();
      } else {
        event.returnValue = false;
      }
      this.isDefaultPrevented = functionThatReturnsTrue;
    },
    stopPropagation() {
      const event = this.nativeEvent;
      if (event.stopPropagation) {
        event.stopPropagation();
      } else {
        event.cancelBubble = true;
      }
      this.isPropagationStopped = functionThatReturnsTrue;
    },
  });

  return SyntheticBaseEvent;
}

export const SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface);
