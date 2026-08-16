import type { ThreadMessage } from "@grogbot/contracts";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { dayKey, formatDaySep } from "../lib/time";
import { cn } from "../ui";
import { ComputerCard } from "./ComputerCard";

export type ThreadComputerCard = {
  title: string;
  status: string;
  done: boolean;
  preview?: string;
};

type ThreadContext = {
  messages: ThreadMessage[];
  empty: boolean;
  computer: ThreadComputerCard | null;
  onOpenComputer: () => void;
};

function messageText(message: ThreadMessage): string {
  return message.blocks
    .filter((block) => block.kind === "text")
    .map((block) => block.text)
    .join("\n");
}

function Header() {
  return <div className="h-2" aria-hidden />;
}

function Footer({ context }: { context: ThreadContext }) {
  return (
    <div className="flex flex-col gap-2.5 px-7 pt-2.5 pb-6">
      {context.computer ? (
        <ComputerCard
          title={context.computer.title}
          status={context.computer.status}
          done={context.computer.done}
          preview={context.computer.preview}
          onOpen={context.onOpenComputer}
        />
      ) : null}
      {context.empty ? (
        <p className="mb-6 text-base leading-normal text-muted">
          First message is a real task. A good handoff has an outcome, sources,
          and when to stop.
        </p>
      ) : null}
    </div>
  );
}

const components = { Header, Footer };

function itemContent(
  index: number,
  message: ThreadMessage,
  context: ThreadContext,
) {
  const prev = context.messages[index - 1];
  const showDay =
    !prev || dayKey(prev.createdAt) !== dayKey(message.createdAt);
  const text = messageText(message);
  const human = message.actorType === "human";
  if (!text && !showDay) return <div className="h-0" />;
  return (
    <div className="px-7 pb-2.5">
      {showDay ? (
        <div className="my-2.5 mb-1 text-center text-xs text-muted">
          {formatDaySep(message.createdAt)}
        </div>
      ) : null}
      {text ? (
        <div
          className={cn(
            "max-w-[72%] rounded-[18px] px-3.5 py-2.5 text-[15px] leading-snug whitespace-pre-wrap",
            human
              ? "ml-auto border border-[#2a2a2a] bg-[#1a1a1a] light:border-line light:bg-white"
              : "mr-auto bg-[#141414] light:bg-[#ececec]",
          )}
        >
          {text}
        </div>
      ) : null}
    </div>
  );
}

function itemKey(_index: number, message: ThreadMessage) {
  return message.id;
}

function followOutput(atBottom: boolean) {
  return atBottom ? "auto" : false;
}

export function ThreadList(props: {
  botId: string;
  messages: ThreadMessage[];
  empty: boolean;
  computer: ThreadComputerCard | null;
  working: string;
  onOpenComputer: () => void;
}) {
  const listRef = useRef<VirtuosoHandle>(null);
  const atBottomRef = useRef(true);
  const visible = useMemo(
    () => props.messages.filter((message) => messageText(message).length > 0),
    [props.messages],
  );
  const context = useMemo<ThreadContext>(
    () => ({
      messages: visible,
      empty: props.empty,
      computer: props.computer,
      onOpenComputer: props.onOpenComputer,
    }),
    [visible, props.empty, props.computer, props.onOpenComputer],
  );

  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useLayoutEffect(() => {
    if (!props.botId) return;
    atBottomRef.current = true;
    const last = visibleRef.current.length - 1;
    if (last < 0) return;
    listRef.current?.scrollToIndex({
      index: last,
      align: "end",
      behavior: "auto",
    });
  }, [props.botId]);

  useLayoutEffect(() => {
    if (!atBottomRef.current) return;
    void props.working;
    void props.computer;
    listRef.current?.autoscrollToBottom();
  }, [props.working, props.computer]);

  return (
    <Virtuoso
      ref={listRef}
      className="h-full"
      data={visible}
      context={context}
      alignToBottom
      followOutput={followOutput}
      atBottomThreshold={80}
      atBottomStateChange={(atBottom) => {
        atBottomRef.current = atBottom;
      }}
      increaseViewportBy={240}
      defaultItemHeight={56}
      initialTopMostItemIndex={
        visible.length > 0 ? { index: visible.length - 1, align: "end" } : 0
      }
      computeItemKey={itemKey}
      itemContent={itemContent}
      components={components}
    />
  );
}
