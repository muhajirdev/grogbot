import { flushSync } from "react-dom";

const SETTLED = "vt-ready";

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function markSettled() {
  document.documentElement.classList.add(SETTLED);
}

let installed = false;

/** Keep gate enter animations from replaying after a view transition ends. */
export function installViewTransitionGuard() {
  if (installed) return;
  const start = document.startViewTransition;
  if (typeof start !== "function") return;
  installed = true;
  document.startViewTransition = ((callback?: unknown) => {
    markSettled();
    return start.call(document, callback as never);
  }) as typeof document.startViewTransition;
}

export function runGateTransition(update: () => void) {
  if (
    typeof document === "undefined" ||
    typeof document.startViewTransition !== "function" ||
    prefersReducedMotion()
  ) {
    update();
    return;
  }
  markSettled();
  document.startViewTransition(() => {
    flushSync(update);
  });
}
