import type { RealtimeFanout } from "@grogbot/adapter-kit";

export class InProcessFanout implements RealtimeFanout {
  private listeners = new Map<string, Set<(payload: string) => void>>();

  async publish(threadId: string, payload: string): Promise<void> {
    for (const fn of this.listeners.get(threadId) ?? []) fn(payload);
  }

  async subscribe(threadId: string, onMessage: (payload: string) => void): Promise<() => Promise<void>> {
    let set = this.listeners.get(threadId);
    if (!set) {
      set = new Set();
      this.listeners.set(threadId, set);
    }
    set.add(onMessage);
    return async () => {
      set.delete(onMessage);
    };
  }
}
