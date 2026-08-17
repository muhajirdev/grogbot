# Rooms plan (not v1)

Ship **a room is a bot’s office**. Do not build group rooms, `@mention` routing, or extra schema until 1:1 chat + computer work.

v1 code stays: one **office** thread per bot (`threads.kind = office`, unique `bot_id`), `thread_members` for humans, `threads.send({ botId })`. A poke opens a separate `kind = poke` thread between two bots.

## Poke — agent to agent, still one office each

No group rooms. A bot may **poke** another bot. That conversation lives in a pair thread (Maya ↔ Lookout). The caller’s office gets a note with **Open thread**. The specialist’s human office stays clean. The human keeps talking to one front door (usually CoS).

```
  You ---- CoS office ---- CoS --poke--> Maya ↔ Lookout thread
                            ^                      |
                            +----- note + Open ----+
```

- No group rooms. A poke is a **thread between two bots** (Maya ↔ Lookout), not Lookout’s human office.
- The human stays in CoS. Maya’s office gets a short note with **Open thread**. Lookout’s office stays clean.
- Same workspace, not self, not archived. Chain depth max 2.
- Nested run on the target actor (do not enqueue — that deadlocks the caller’s queue).
- Flue: `poke_teammate` tool. Scripted tests: `poke Lookout: …`.

## v1 — office

```
  Human ---- office thread ---- Bot actor ---- bound computer
                                               (default computer)
```

- Actor = the bot, never the room.
- Computer = a workspace primitive. Bots bind to one. Default computer is shared. New computer = isolated sandbox.
- GUI on a shared computer is one mouse (`control_holder`). Two bots on the default computer can think in parallel; they take turns clicking.
- Extra humans can wait: `thread_members` + message `actor_type` / `actor_id` already exist. No extra UX.

## Later A — two humans, one office

Same actor, same computer, same thread. Both humans send; both rings hit **one** queue so two people do not start two Pis.

Computer lease (`control_holder`) is on the **computer**, not the bot: who has the screen.

Realtime stays `threadId` (today the API keys off `botId` and looks up that thread).

## Later B — several bots, one room

This is a new product surface (not Discord in v1). **Schema already allows extra office threads per bot** (`bots.home_thread_id` is the sidebar shortcut; there is no unique office-per-bot index). v1 still creates one home office and does not open a second.

Product work then, not now:

- `thread_participants`: humans **and** bots (`owner` | `member`).
- `send({ threadId, text, targetBotId? })`.
- Default wake = the only bot, else the `owner` bot. Several bots and no target → **fail closed** (do not wake everyone).
- UI: `focusedBotId` for the computer pane.

```
  Human ---- group thread ---- Bot A actor ---- computer (default or private)
                         +---- Bot B actor ---- same default, or another computer
```

Two bots in one room **can** think in parallel (two actors). If they share the default computer, GUI is serialized. If they have two computers, two mice.

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
| Two bots, one room, same default computer | Brains yes. GUI no (one mouse). |
| Two bots, one room, two computers | **Yes.** Two actors, two VMs. |
| One bot, two rooms | **No** on one VM. Serial queue. Or spawn a child bot. |

The actor queue is the feature: it serializes one bot. Do not run two sandboxes for the same bot unless you have two computers (a child bot = new actor).

## Lock-in to avoid when we *do* build B

Do not forever treat `botId` as the only way to send. When adding group rooms, key chat on `threadId` and keep computer APIs on `botId`. Do not make the actor key a `threadId`.
