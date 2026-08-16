import { isOfflineAgentRuntime } from "@grogbot/adapters";
import { appContract, labelForModel } from "@grogbot/contracts";
import {
  encryptionSecret,
  getBotComputer,
  listEventsAfter,
  loadModelSettings,
  ModelSettingsError,
  saveModelSettings,
  sleep,
  toBotDto,
  userHasModelCredentials,
} from "@grogbot/core";
import { guestConnectors, userModelCredentials } from "@grogbot/db";
import { implement, ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import {
  createBot,
  createRoutine,
  getBotThread,
  getComputer,
  listBots,
  listComputers,
  listRoutines,
  sendMessage,
  setComputerControl,
  stopBotRuns,
  updateBot,
} from "./bots.js";
import type { RpcContext } from "./context.js";
import { agentRuntimeSource } from "./env.js";
import {
  connectorOnline,
  disableGuest,
  enableGuest,
  guestStatus,
  rotateGuest,
} from "./guests.js";
import { healthPayload } from "./health.js";
import { requireActor } from "./session.js";

const os = implement(appContract).$context<RpcContext>();

export const appRouter = os.router({
  health: os.health.handler(async ({ context }) => healthPayload(context.env)),
  me: os.me.handler(async ({ context }) => {
    const actor = await requireActor(context);
    const source = agentRuntimeSource(context.env);
    const secret = encryptionSecret(
      {
        ENCRYPTION_KEY: context.env.encryptionKey,
        BETTER_AUTH_SECRET: context.env.authSecret,
      },
      context.env.production,
    );
    const settings = await loadModelSettings(context.db, actor, source, secret);
    const creds = await context.db
      .select()
      .from(userModelCredentials)
      .where(eq(userModelCredentials.workspaceId, actor.workspaceId))
      .limit(1);
    return {
      userId: actor.userId,
      email: actor.email,
      name: actor.name,
      workspaceId: actor.workspaceId,
      isDeploymentOwner: actor.isDeploymentOwner,
      needsModel:
        !isOfflineAgentRuntime(context.env.agentRuntime) &&
        !userHasModelCredentials(creds.length),
      defaultModel: settings.defaultModelId,
      defaultModelLabel: labelForModel(settings.defaultModelId),
      modelWarning: settings.warning,
    };
  }),
  models: {
    get: os.models.get.handler(async ({ context }) => {
      const actor = await requireActor(context);
      return loadModelSettings(
        context.db,
        actor,
        agentRuntimeSource(context.env),
        encryptionSecret(
          {
            ENCRYPTION_KEY: context.env.encryptionKey,
            BETTER_AUTH_SECRET: context.env.authSecret,
          },
          context.env.production,
        ),
      );
    }),
    save: os.models.save.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      try {
        return await saveModelSettings(
          context.db,
          actor,
          input,
          encryptionSecret(
            {
              ENCRYPTION_KEY: context.env.encryptionKey,
              BETTER_AUTH_SECRET: context.env.authSecret,
            },
            context.env.production,
          ),
          agentRuntimeSource(context.env),
        );
      } catch (caught) {
        if (caught instanceof ModelSettingsError) {
          throw new ORPCError("BAD_REQUEST", { message: caught.message });
        }
        throw caught;
      }
    }),
  },
  bots: {
    list: os.bots.list.handler(async ({ context }) => {
      const actor = await requireActor(context);
      return listBots(context, actor);
    }),
    get: os.bots.get.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      const { bot, thread } = await getBotThread(context, actor, input.botId);
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
      return createBot(context, actor, input);
    }),
    update: os.bots.update.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      return updateBot(context, actor, input);
    }),
  },
  threads: {
    subscribe: os.threads.subscribe.handler(async function* ({
      context,
      input,
      signal,
    }) {
      const actor = await requireActor(context);
      const { thread } = await getBotThread(context, actor, input.botId);
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
    list: os.routines.list.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      return listRoutines(context, actor, input.botId);
    }),
    create: os.routines.create.handler(async ({ context, input }) => {
      const actor = await requireActor(context);
      return createRoutine(context, actor, input);
    }),
  },
});

export type AppRouter = typeof appRouter;
