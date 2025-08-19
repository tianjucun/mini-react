import {
  registerSimpleEvents,
  topLevelEventsToReactNames,
} from '../DOMEventProperties';
import { accumulateSinglePhaseListeners } from '../DOMPluginEventSystem';
import { IS_CAPTURE_PHASE } from '../EventSystemFlags';
import { SyntheticMouseEvent } from '../SyntheticEvent';

function extraEvents(
  dispatchQueue,
  domEventName,
  targetInstance,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer
) {
  let reactName = topLevelEventsToReactNames.get(domEventName);
  let SyntheticEventCtor;
  switch (domEventName) {
    case 'click':
      SyntheticEventCtor = SyntheticMouseEvent;
      break;
    default:
      break;
  }

  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  const listeners = accumulateSinglePhaseListeners(
    targetInstance,
    reactName,
    nativeEvent.type,
    isCapturePhase
  );

  if (listeners.length > 0) {
    const event = new SyntheticEventCtor(
      reactName,
      domEventName,
      null,
      nativeEvent,
      nativeEventTarget
    );
    dispatchQueue.push({ event, listeners });
  }
}

export { registerSimpleEvents as registerEvents, extraEvents };
