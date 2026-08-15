# Rooms plan (not v1)

Ship **a room is a bot’s office**. Do not build group rooms, `@mention` routing, or extra schema until 1:1 chat + computer work.

v1 code stays: one thread per bot (`threads.bot_id` unique), `thread_members` for humans, `threads.send({ botId })`.

## v1 — office

```
  Human ---- office thread ---- Bot actor ---- one computer
```

- Actor = the bot, never the room.
- Computer = on the bot, never on the room.
- Extra humans can wait: `thread_members` + message `actor_type` / `actor_id` already exist. No extra UX.

## Later A — two humans, one office

Same actor, same computer, same thread. Both humans send; both rings hit **one** queue so two people do not start two Pis.

Computer lease (`control_holder`) is still on the bot: who has the screen.

Realtime stays `threadId` (today the API keys off `botId` and looks up that thread).

## Later B — several bots, one room

This is a new product surface (not Discord in v1). Schema work then, not now:

- Drop unique `threads.bot_id`.
- `bots.home_thread_id` = office shortcut.
- `thread_participants`: humans **and** bots (`owner` | `member`).
- `send({ threadId, text, targetBotId? })`.
- Default wake = the only bot, else the `owner` bot. Several bots and no target → **fail closed** (do not wake everyone).
- UI: `focusedBotId` for the computer pane.

```
  Human ---- group thread ---- Bot A actor ---- computer A
                         +---- Bot B actor ---- computer B
```

Two bots in one room **can** run in parallel: two actors, two computers, two Pis. Messages interleave in one transcript. That is the point of per-bot actors.

## Can one actor run two rooms in parallel?

**No — not on one computer.** One bot = one body = one VM.

```
  Room 1  --\                     serial queue
  Room 2  --+-->  Bot A actor  -->  one Pi, one computer
```

If the same bot is later in two rooms, **enqueue on the same actor**. Runs take turns. That is correct: two conversations, one pair of hands.

True parallel for “the same teammate in two rooms” would mean a **second computer** (fork / child bot = new actor). That is a new bot, not one actor with two threads of Pi.

| Situation | Parallel? |
|---|---|
| Two humans, one office | No. One queue. |
| Two bots, one room | **Yes.** Two actors, two computers. |
| One bot, two rooms | **No** on one VM. Serial queue. Or spawn a child bot. |

Rivet’s actor queue is the feature: it serializes one bot. Do not run two agentOS/E2B sessions for the same bot unless you have two sandboxes.

## Lock-in to avoid when we *do* build B

Do not forever treat `botId` as the only way to send. When adding group rooms, key chat on `threadId` and keep computer APIs on `botId`. Do not make the Rivet actor key a `threadId`.
