import * as React from "react";

/**
 * Keeps the game playable if the 3D board chunk fails to load (flaky network,
 * "Importing a module script failed") or WebGL dies on the device.
 * Falls back to the 2.5D board instead of blanking the whole app.
 */
export class BoardBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.warn("3D board unavailable, using the flat board instead:", error);
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Dynamic import with one retry (cache-busted) before giving up. */
export function retryImport<T>(load: () => Promise<T>): Promise<T> {
  return load().catch(() => load());
}
