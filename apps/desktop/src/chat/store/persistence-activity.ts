import type { ChatTransport, UIMessage } from "ai";

export type GuardedChatPreflight = {
  run: (
    trackCompletion: (completion: Promise<unknown>) => void,
  ) => void | Promise<void>;
  persistOnCancel: boolean;
};

export function createChatPersistenceController() {
  const pending = new Set<Promise<unknown>>();
  let disposed = false;

  const track = (completion: Promise<unknown>) => {
    const tracked = Promise.resolve(completion)
      .catch(() => undefined)
      .finally(() => pending.delete(tracked));
    pending.add(tracked);
  };

  const start = async (
    _logicalKey: string,
    {
      preflight,
      isCancelled = () => false,
    }: {
      preflight?: GuardedChatPreflight;
      isCancelled?: () => boolean;
    } = {},
  ) => {
    if (disposed) return null;
    if (preflight && (preflight.persistOnCancel || !isCancelled())) {
      await preflight.run(track);
    }
    if (disposed || isCancelled()) return null;
    return { finish: () => {}, trackCompletion: track };
  };

  const run = <T>(_logicalKey: string, operation: () => T | Promise<T>) =>
    Promise.resolve().then(operation);

  const dispose = async (completion?: Promise<unknown>) => {
    disposed = true;
    if (completion) track(completion);
    await Promise.allSettled([...pending]);
  };

  const resume = () => {
    disposed = false;
  };

  return { start, finish: (_logicalKey: string) => {}, run, dispose, resume };
}

export type ChatPersistenceController = ReturnType<
  typeof createChatPersistenceController
>;

export function toChatTransportError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" ? error : String(error));
}

export function guardChatTransport<UI_MESSAGE extends UIMessage>(
  transport: ChatTransport<UI_MESSAGE>,
  activity: ChatPersistenceController,
  {
    beforeSend,
  }: {
    beforeSend?: (logicalKey: string) => GuardedChatPreflight | undefined;
  } = {},
): ChatTransport<UI_MESSAGE> {
  return {
    sendMessages: async (options) => {
      const userMessage = options.messages.findLast(
        (message) => message.role === "user",
      );
      if (!userMessage) {
        throw new Error("Cannot start chat activity without a user message");
      }

      const preflight = beforeSend?.(userMessage.id);
      try {
        const attempt = await activity.start(userMessage.id, {
          preflight,
          isCancelled: () => Boolean(options.abortSignal?.aborted),
        });
        if (!attempt) {
          const error = new Error("Chat request aborted");
          error.name = "AbortError";
          throw error;
        }
        return await transport.sendMessages(options);
      } catch (error) {
        throw toChatTransportError(error);
      }
    },
    reconnectToStream: (options) => transport.reconnectToStream(options),
  };
}
