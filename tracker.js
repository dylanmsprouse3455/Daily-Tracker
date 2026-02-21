function toggleState(name) {
  if (activeStates[name]) {
    delete activeStates[name];
  } else {
    activeStates[name] = true;
  }
}