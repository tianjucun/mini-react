import { push, peek, pop } from './SchedulerMinHeap';
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
} from './SchedulerPriorities';

function getCurrentTime() {
  return performance.now();
}

var maxSigned31BitInt = 1073741823;
var IMMEDIATE_PRIORITY_TIMEOUT = -1; // 只要不执行就超时
var USER_BLOCKING_PRIORITY_TIMEOUT = 250; // 0.25s
var NORMAL_PRIORITY_TIMEOUT = 5000; // 5s
var LOW_PRIORITY_TIMEOUT = 10000; // 10s
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

let taskIdCounter = 1;
const taskQueue = [];

const messageChannel = new MessageChannel();
const port1 = messageChannel.port1;
const port2 = messageChannel.port2;
port1.onmessage = performWorkUntilDeadline;

let scheduleHostCallback = null;
let startTime = -1;
let frameInterval = 5;

function scheduleCallback(priorityLevel, callback) {
  const currentTime = getCurrentTime();
  const startTime = currentTime;
  let timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT;
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT;
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }

  // 到期时间 = 当前时间 + 允许超时时间
  const expirationTime = startTime + timeout;
  const newTask = {
    id: taskIdCounter++,
    sortIndex: expirationTime, // 默认排序规则按照到期时间进行排序
    callback,
    priorityLevel,
    startTime,
    expirationTime,
  };
  push(taskQueue, newTask);
  requestHookCallback(workLoop);
  return newTask;
}

function shouldYieldToHost() {
  // 已过去的时间 = 当前时间 - 开始时间
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    return false;
  }
  return true;
}

function workLoop(startTime) {
  let currentTime = startTime;
  let currentTask = peek(taskQueue);

  while (currentTask !== null) {
    // 虽然当前任务可能某种原因，在执行的时候已经超时，
    // 会给当前队列中的任务 5ms 的
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break;
    }

    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      currentTask.callback = null;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback;
        return true;
      }
      if (currentTask === peek(taskQueue)) {
        pop(taskQueue);
      }
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
  if (currentTask !== null) {
    return true;
  }
  return false;
}

function requestHookCallback(workLoop) {
  scheduleHostCallback = workLoop;
  schedulePerformWorkUntilDeadline();
}

function schedulePerformWorkUntilDeadline() {
  port2.postMessage(null);
}

function performWorkUntilDeadline() {
  if (scheduleHostCallback) {
    startTime = getCurrentTime();
    let hasMoreWork = true;
    try {
      hasMoreWork = scheduleHostCallback(startTime);
    } catch (err) {
      hasMoreWork = false;
      console.error('performWorkUntilDeadline', err);
    } finally {
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline();
      } else {
        scheduleHostCallback = null;
      }
    }
  }
}

export {
  scheduleCallback,
  shouldYieldToHost,
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
};
