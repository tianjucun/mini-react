export function renderWithHooks(current, workInProgress, Component, props) {
  const element = Component(props);
  return element;
}
