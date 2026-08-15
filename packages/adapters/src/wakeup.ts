import { randomUUID } from "node:crypto";
import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import type { WakeupDriver, WakeupJob } from "@rekan/adapter-kit";
import { type Database, jobs } from "@rekan/db";

const POLL_MS = 500;

export class PostgresWakeupDriver implements WakeupDriver {
  private timer: NodeJS.Timeout | undefined;
  private handlers: Record<string, (payload: Record<string, unknown>) => Promise<void>> = {};
  private workerId = `worker-${process.pid}-${randomUUID().slice(0, 8)}`;

  constructor(private readonly db: Database) {}

  async enqueue(job: WakeupJob): Promise<void> {
    const id = randomUUID();
    if (job.jobKey) {
      await this.db
        .insert(jobs)
        .values({
          id,
          name: job.name,
          payload: job.payload,
          runAt: job.runAt ?? new Date(),
          jobKey: job.jobKey,
        })
        .onConflictDoUpdate({
          target: jobs.jobKey,
          set: {
            name: job.name,
            payload: job.payload,
            runAt: job.runAt ?? new Date(),
            lockedAt: null,
            lockedBy: null,
            lastError: null,
          },
        });
      return;
    }
    await this.db.insert(jobs).values({
      id,
      name: job.name,
      payload: job.payload,
      runAt: job.runAt ?? new Date(),
    });
  }

  async start(
    handlers: Record<string, (payload: Record<string, unknown>) => Promise<void>>,
  ): Promise<void> {
    this.handlers = handlers;
    const tick = async () => {
      try {
        await this.claimAndRun();
      } catch (error) {
        console.error("wakeup tick", error);
      }
    };
    this.timer = setInterval(() => void tick(), POLL_MS);
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  private async claimAndRun(): Promise<void> {
    const claimed = await this.db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(jobs)
        .where(
          and(
            lte(jobs.runAt, new Date()),
            or(isNull(jobs.lockedAt), lte(jobs.lockedAt, new Date(Date.now() - 5 * 60_000))),
          ),
        )
        .limit(1)
        .for("update", { skipLocked: true });
      const row = rows[0];
      if (!row) return null;
      await tx
        .update(jobs)
        .set({
          lockedAt: new Date(),
          lockedBy: this.workerId,
          attempts: sql`${jobs.attempts} + 1`,
        })
        .where(eq(jobs.id, row.id));
      return row;
    });
    if (!claimed) return;
    const handler = this.handlers[claimed.name];
    if (!handler) {
      await this.db.delete(jobs).where(eq(jobs.id, claimed.id));
      return;
    }
    try {
      await handler(claimed.payload);
      await this.db.delete(jobs).where(eq(jobs.id, claimed.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.db
        .update(jobs)
        .set({ lastError: message, lockedAt: null, lockedBy: null })
        .where(eq(jobs.id, claimed.id));
    }
  }
}

export class InMemoryWakeupDriver implements WakeupDriver {
  private handlers: Record<string, (payload: Record<string, unknown>) => Promise<void>> = {};
  private timers: NodeJS.Timeout[] = [];
  private keyed = new Map<string, NodeJS.Timeout>();

  async enqueue(job: WakeupJob): Promise<void> {
    const delay = job.runAt ? Math.max(0, job.runAt.getTime() - Date.now()) : 0;
    if (job.jobKey) {
      const existing = this.keyed.get(job.jobKey);
      if (existing) {
        clearTimeout(existing);
        this.timers = this.timers.filter((t) => t !== existing);
      }
    }
    const timer = setTimeout(() => {
      if (job.jobKey) this.keyed.delete(job.jobKey);
      void this.handlers[job.name]?.(job.payload);
    }, delay);
    this.timers.push(timer);
    if (job.jobKey) this.keyed.set(job.jobKey, timer);
  }

  async start(
    handlers: Record<string, (payload: Record<string, unknown>) => Promise<void>>,
  ): Promise<void> {
    this.handlers = handlers;
  }

  async stop(): Promise<void> {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
    this.keyed.clear();
  }
}
