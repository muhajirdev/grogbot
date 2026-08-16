import type { ThreadMessage } from "@grogbot/contracts";
import { createCollection, localOnlyCollectionOptions } from "@tanstack/react-db";

export type CachedMessage = ThreadMessage & { botId: string };

export type ThreadMeta = {
  botId: string;
  cursor: number;
  working: string;
  error: string;
};

export const messagesCollection = createCollection(
  localOnlyCollectionOptions<CachedMessage>({
    id: "thread-messages",
    getKey: (item) => item.id,
  }),
);

export const threadMetaCollection = createCollection(
  localOnlyCollectionOptions<ThreadMeta>({
    id: "thread-meta",
    getKey: (item) => item.botId,
  }),
);

export function clearThreadStore(): void {
  const messageKeys = [...messagesCollection.keys()];
  if (messageKeys.length > 0) messagesCollection.delete(messageKeys);
  const metaKeys = [...threadMetaCollection.keys()];
  if (metaKeys.length > 0) threadMetaCollection.delete(metaKeys);
}
