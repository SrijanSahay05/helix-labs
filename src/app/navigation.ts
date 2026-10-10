/** Lets non-React code (agent engine, toasts) navigate. Set once by <NavigationBridge />. */
let nav: ((to: string) => void) | null = null;

export function setNavigator(fn: (to: string) => void) {
  nav = fn;
}

export function navigateTo(to: string) {
  if (nav) nav(to);
  else window.location.assign(to);
}
