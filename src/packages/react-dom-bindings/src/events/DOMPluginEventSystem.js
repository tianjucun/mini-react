import { allNativeEvents } from './EventRegistry';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin';

import { IS_CAPTURE_PHASE } from './EventSystemFlags';
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener';
import {
  addEventBubbleListener,
  addEventCaptureListener,
} from './EventListener';
import { getEventTarget } from './getEventTarget';
import { HostComponent } from 'react-reconciler/src/ReactWorkTag';
import getListener from './getListener';

SimpleEventPlugin.registerEvents();

const listeningMarker = `_reactListening` + Math.random().toString(36).slice(2);

export function listenToAllSupportedEvents(rootContainerElement) {
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = true;
    for (const domEventName of allNativeEvents) {
      listenToNativeEvent(domEventName, true, rootContainerElement);
      listenToNativeEvent(domEventName, false, rootContainerElement);
    }
  }
}

function listenToNativeEvent(
  domEventName,
  isCapturePhaseListener,
  targetContainer
) {
  let eventSystemFlags = 0;
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }

  addTrappedEventListener(
    targetContainer,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener
  );
}

function addTrappedEventListener(
  targetContainer,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener
) {
  const listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags
  );

  if (isCapturePhaseListener) {
    addEventCaptureListener(targetContainer, domEventName, listener);
  } else {
    addEventBubbleListener(targetContainer, domEventName, listener);
  }
}

export function dispatchEventForPluginEventSystem(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInstance,
  targetContainer
) {
  dispatchEventForPlugins(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInstance,
    targetContainer
  );
}

function dispatchEventForPlugins(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInstance,
  targetContainer
) {
  const nativeEventTarget = getEventTarget(nativeEvent);
  const dispatchQueue = [];
  extraEvents(
    dispatchQueue,
    domEventName,
    targetInstance,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  );

  processDispatchQueue(dispatchQueue, eventSystemFlags);
}

function processDispatchQueue(dispatchQueue, eventSystemFlags) {
  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  for (let i = 0; i < dispatchQueue.length; i++) {
    const { event, listeners } = dispatchQueue[i];
    processDispatchQueueItemsInOrder(event, listeners, isCapturePhase);
  }
}

function executeDispatch(event, listener, currentTarget) {
  event.currentTarget = currentTarget;
  listener(event);
}

function processDispatchQueueItemsInOrder(
  event,
  dispatchListeners,
  isCapturePhase
) {
  if (isCapturePhase) {
    for (let i = dispatchListeners.length - 1; i >= 0; i--) {
      const { listener, currentTarget } = dispatchListeners[i];
      if (event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
    }
  } else {
    for (let i = 0; i < dispatchListeners.length; i++) {
      const { listener, currentTarget } = dispatchListeners[i];
      if (event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
    }
  }
}

function extraEvents(
  dispatchQueue,
  domEventName,
  targetInstance,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer
) {
  SimpleEventPlugin.extraEvents(
    dispatchQueue,
    domEventName,
    targetInstance,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  );
}

export function accumulateSinglePhaseListeners(
  targetFiber,
  reactName,
  nativeEventType,
  isCapturePhase
) {
  const capatureName = `${reactName}Capature`;
  const reactEventName = isCapturePhase ? capatureName : reactName;
  const listeners = [];
  let instance = targetFiber;
  while (instance !== null) {
    const { stateNode, tag } = instance;
    if (tag === HostComponent && stateNode !== null) {
      const listener = getListener(instance, reactEventName);
      if (listener) {
        listeners.push(createDispatchListener(instance, listener, stateNode));
      }
    }
    instance = instance.return;
  }

  return listeners;
}

function createDispatchListener(instance, listener, currentTarget) {
  return { instance, listener, currentTarget };
}
