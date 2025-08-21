export const allNativeEvents = new Set();

export let registrationNameDependencies = {};

export function registerTwoPhaseEvent(registrationName, dependencies) {
  registerDirectEvent(registrationName, dependencies);
  registerDirectEvent(`${registrationName}Capture`, dependencies);
}

function registerDirectEvent(registrationName, dependencies) {
  registrationNameDependencies[registrationName] = dependencies;
  for (let i = 0; i < dependencies.length; i++) {
    allNativeEvents.add(dependencies[i]);
  }
}
