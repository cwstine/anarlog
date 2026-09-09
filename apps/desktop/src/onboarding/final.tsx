import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { CircleNotch } from "@phosphor-icons/react";
import { useRef, useState } from "react";

import { commands as analyticsCommands } from "@anlg/plugin-analytics";
import { commands as sfxCommands } from "@anlg/plugin-sfx";

import { OnboardingButton } from "./shared";
import {
  getOrCreateWelcomeSession,
  setPendingWelcomeSession,
} from "./welcome-note";

import { createSession } from "~/session/queries";
import { flushAutomaticRelaunch } from "~/shared/relaunch";
import { commands } from "~/types/tauri.gen";

export function FinalDescription() {
  return <Trans>Everything is ready. Your notes stay on this device.</Trans>;
}

export function FinalSection({
  onContinue,
}: {
  onContinue: (sessionId: string) => void;
}) {
  const { i18n } = useLingui();
  const translate = i18n._.bind(i18n);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const finishPromiseRef = useRef<Promise<void> | null>(null);
  const welcomeSessionRef = useRef<string | null>(null);

  const handleContinue = async () => {
    if (finishPromiseRef.current) return;

    setStatus("loading");
    const finishPromise = finishOnboarding(onContinue, welcomeSessionRef);
    finishPromiseRef.current = finishPromise;
    try {
      await finishPromise;
    } catch (error) {
      console.error("Failed to finish onboarding", error);
      setStatus("error");
    } finally {
      finishPromiseRef.current = null;
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <OnboardingButton
        className="px-6 py-2 text-sm disabled:cursor-wait disabled:opacity-70"
        disabled={status === "loading"}
        onClick={() => void handleContinue()}
      >
        {status === "loading" ? (
          <span className="flex items-center gap-2">
            <CircleNotch className="size-4 animate-spin" />
            <Trans>Open MinutesWise</Trans>
          </span>
        ) : (
          <Trans>Open MinutesWise</Trans>
        )}
      </OnboardingButton>
      {status === "error" && (
        <p className="text-sm text-red-500" role="alert">
          {translate({
            id: "onboarding.finish-error",
            message: "Couldn't open MinutesWise. Please try again.",
          })}
        </p>
      )}
    </div>
  );
}

export async function finishOnboarding(
  onContinue?: (sessionId: string) => void,
  welcomeSessionRef?: { current: string | null },
) {
  await sfxCommands.stop("BGM").catch(console.error);
  const welcomeSessionId =
    welcomeSessionRef?.current ??
    (await getOrCreateWelcomeSession().catch((error) => {
      console.error("Failed to create welcome note", error);
      return createSession();
    }));
  if (welcomeSessionRef) {
    welcomeSessionRef.current = welcomeSessionId;
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
  const result = await commands.setOnboardingNeeded(false);
  if (result.status === "error") {
    throw new Error(result.error);
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
  void analyticsCommands
    .event({ event: "onboarding_completed" })
    .catch(console.error);
  setPendingWelcomeSession(welcomeSessionId);
  if (await flushAutomaticRelaunch()) {
    return;
  }
  setPendingWelcomeSession(null);
  onContinue?.(welcomeSessionId);
}
