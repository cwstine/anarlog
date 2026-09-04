import { Trans } from "@lingui/react/macro";
import { platform } from "@tauri-apps/plugin-os";
import { useState } from "react";

import { OnboardingButton } from "./shared";

import { useAppleCalendarSelection } from "~/calendar/components/apple/calendar-selection";
import { TroubleShootingLink } from "~/calendar/components/apple/permission";
import {
  type CalendarGroup,
  CalendarSelection,
} from "~/calendar/components/calendar-selection";
import { SyncProvider, useSync } from "~/calendar/components/context";
import { useEnabledCalendars } from "~/calendar/hooks";
import { useMountEffect } from "~/shared/hooks/useMountEffect";
import { usePermission } from "~/shared/hooks/usePermissions";

function getCalendarSelectionKey(groups: CalendarGroup[]) {
  return groups.length === 0
    ? "empty"
    : groups
        .map((group) => `${group.sourceName}:${group.calendars.length}`)
        .join("|");
}

function AppleCalendarList() {
  const { scheduleSync } = useSync();
  const { groups, handleRefresh, handleToggle, isLoading } =
    useAppleCalendarSelection();

  useMountEffect(() => {
    scheduleSync();
  });

  return (
    <CalendarSelection
      key={getCalendarSelectionKey(groups)}
      groups={groups}
      onToggle={handleToggle}
      onRefresh={handleRefresh}
      isLoading={isLoading}
      disableHoverTone
      className="border-border/45 bg-card/28 rounded-xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_24px_-20px_rgba(87,83,78,0.35)] backdrop-blur-md backdrop-saturate-150"
    />
  );
}

function CalendarSectionContent({ onContinue }: { onContinue: () => void }) {
  const isMacos = platform() === "macos";
  const calendar = usePermission("calendar");
  const isAuthorized = calendar.status === "authorized";
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const enabledCalendars = useEnabledCalendars();

  if (!isMacos) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          <Trans>Local calendar access is currently available on macOS.</Trans>
        </p>
        <OnboardingButton onClick={onContinue}>
          <Trans>Continue</Trans>
        </OnboardingButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {isAuthorized && <AppleCalendarList />}

      <OnboardingButton
        onClick={() => {
          if (isAuthorized) {
            calendar.open();
            return;
          }

          setShowTroubleshooting(true);
          calendar.request();
        }}
        disabled={calendar.isPending}
        className="border-border bg-card text-foreground hover:bg-accent flex items-center justify-center gap-3 border px-6"
      >
        <img
          src="/assets/apple-calendar.png"
          alt=""
          aria-hidden="true"
          className="size-6 rounded-[4px] object-cover"
        />
        <Trans>Connect Apple Calendar</Trans>
      </OnboardingButton>

      {enabledCalendars.length > 0 && (
        <OnboardingButton onClick={onContinue}>
          <Trans>Continue</Trans>
        </OnboardingButton>
      )}

      {showTroubleshooting && !isAuthorized && (
        <TroubleShootingLink
          onRequest={calendar.request}
          onReset={calendar.reset}
          onOpen={calendar.open}
          isPending={calendar.isPending}
          className="text-muted-foreground text-sm"
        />
      )}
    </div>
  );
}

export function CalendarSection({
  onContinue,
}: {
  onContinue: () => void;
}) {
  return (
    <SyncProvider>
      <CalendarSectionContent onContinue={onContinue} />
    </SyncProvider>
  );
}
