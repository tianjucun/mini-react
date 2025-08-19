import { getEventTarget } from './getEventTarget';
import { getClosesInstanceFromNode } from 'react-dom-bindings/client/ReactDOMComponentTree';
import { dispatchEventForPluginEventSystem } from './DOMPluginEventSystem';

export function createEventListenerWrapperWithPriority(
  targetContainer,
  domEventName,
  eventSystemFlags
) {
  const listenerWrapper = dispatchDiscreteEvent;
  return listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer
  );
}

function dispatchDiscreteEvent(
  domEventName,
  eventSystemFlags,
  targtContainer,
  nativeEvent
) {
  console.log(
    'dispatchDiscreteEvent',
    domEventName,
    eventSystemFlags,
    targtContainer,
    nativeEvent
  );

  dispatchEvent(domEventName, eventSystemFlags, targtContainer, nativeEvent);
}

export function dispatchEvent(
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent
) {
  const nativeEventTarget = getEventTarget(nativeEvent);
  const targetInstance = getClosesInstanceFromNode(nativeEventTarget);
  dispatchEventForPluginEventSystem(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInstance,
    targetContainer
  );
}
