import { appContract } from "@grogbot/contracts";
import {
  getBotComputer,
  listEventsAfter,
  sleep,
  toBotDto,
} from "@grogbot/core";
import { guestConnectors, userModelCredentials } from "@grogbot/db";
import { implement } from "@orpc/server";
import { eq } from "drizzle-orm";
import type { RpcContext } from "./context.js";
import {
  connectorOnline,
  disableGuest,
  enableGuest,
  guestStatus,
  rotateGuest,
} from "./guests.js";
import { healthPayload } from "./health.js";
import {
  createOfficeBot,
  getComputer,
  getOffice,
  listBots,
  listComputers,
  sendMessage,
  setComputerControl,
  stopBotRuns,
  updateOfficeBot,
} from "./office.js";
import { requireActor } from "./session.js";

const os = implement(appContract).$context<RpcContext>();

export const appRouter = os.router({
  health: os.health.handler(async ({ context }) => healthPayload(context.env)),
  me: os.me.handler(async ({ context }) => {
    const actor = await requireActor(context);
    const creds = await context.db
      .select()
      .from(userModelCredentials)
      .where(eq(userModelCredentials.userId, actor.userId))
      .limit(1);
    return {
      userId: actor.userId,
      email: actor.email,
      name: actor.name,
      workspaceId: actor.workspaceId,
      isDeploymentOwner: actor.isDeploymentOwner,
      needsModel: context.env.agentRuntime !== "scripted" && creds.length === 0,
    };
  }),
  bots: {
    list: os.bots.list.handler(async ({ context }) => {
      const actor = await requireActor(context);
      return listBots(context, actor);
    }),
    get: os.bots.get.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      const { bot, thread } = await getOffice(context, actor, input.botId);
      const [connector] = await context.db
        .select()
        .from(guestConnectors)
        .where(eq(guestConnectors.botId, bot.id))
        .limit(1);
      const desk = await getBotComputer(context.db, bot);
      return toBotDto(bot, thread.id, {
        online: connector ? connectorOnline(connector) : false,
        computerName: desk?.name,
      });
    }),
    create: os.bots.create.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      return createOfficeBot(context, actor, input);
    }),
    update: os.bots.update.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      return updateOfficeBot(context, actor, input);
    }),
  },
  threads: {
    subscribe: os.threads.subscribe.handler(async function* ({
      context,
      input,
      signal,
    }) {
      const actor = await requireActor(context);
      const { thread } = await getOffice(context, actor, input.botId);
      let cursor = input.cursor;
      while (!signal?.aborted) {
        const batch = await listEventsAfter(context.db, thread.id, cursor);
        if (batch.length === 0) {
          await sleep(200, signal);
          continue;
        }
        for (const event of batch) {
          cursor = event.seq;
          yield event;
        }
      }
    }),
    send: os.threads.send.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      return sendMessage(context, actor, input.botId, input.text);
    }),
    stop: os.threads.stop.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      await stopBotRuns(context, actor, input.botId);
      return { ok: true as const };
    }),
  },
  computers: {
    list: os.computers.list.handler(async ({ context }) => {
      const actor = await requireActor(context);
      return listComputers(context, actor);
    }),
  },
  computer: {
    status: os.computer.status.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      return getComputer(context, actor, input.botId);
    }),
    takeover: os.computer.takeover.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      return setComputerControl(context, actor, input.botId, "user");
    }),
    release: os.computer.release.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      return setComputerControl(context, actor, input.botId, "bot");
    }),
  },
  guests: {
    status: os.guests.status.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      return guestStatus(context, actor, input.botId);
    }),
    enable: os.guests.enable.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      return enableGuest(context, actor, input.botId, input.kind);
    }),
    rotate: os.guests.rotate.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      return rotateGuest(context, actor, input.botId);
    }),
    disable: os.guests.disable.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      return disableGuest(context, actor, input.botId);
    }),
  },
  memory: {
    list: os.memory.list.handler(async ({ context }) => {
      await requireActor(context);
      return [];
    }),
  },
  routines: {
    list: os.routines.list.handler(async ({ context }) => {
      await requireActor(context);
      return [];
    }),
  },
});

export type AppRouter = typeof appRouter;
