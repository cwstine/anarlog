import { useLingui } from "@lingui/react/macro";
import {
  CaretRight,
  CircleNotch,
  DotsThree,
  Plus,
} from "@phosphor-icons/react";
import { platform } from "@tauri-apps/plugin-os";
import { useCallback, useMemo, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTriggerPrimitive,
} from "@anlg/ui/components/ui/accordion";
import { cn } from "@anlg/utils";

import { AppleCalendarSelection } from "./apple/calendar-selection";
import {
  AppleCalendarPermissionDialog,
  TroubleShootingLink,
} from "./apple/permission";
import { type CalendarProvider, PROVIDERS } from "./shared";

import {
  allowReconnectedCalendarConnections,
  removeDisconnectedCalendarConnection,
  syncCalendarEvents,
} from "~/services/calendar";
import {
  type MenuItemDef,
  useNativeContextMenu,
} from "~/shared/hooks/useNativeContextMenu";
import { usePermission } from "~/shared/hooks/usePermissions";

function ProviderIcon({ provider }: { provider: CalendarProvider }) {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center">
      {provider.icon}
    </span>
  );
}

export function CalendarSidebarContent({
  returnTo: _returnTo = "calendar",
}: {
  returnTo?: string;
}) {
  const calendar = usePermission("calendar");
  const visibleProviders =
    platform() === "macos"
      ? PROVIDERS
      : PROVIDERS.filter((provider) => provider.platform === "all");

  return (
    <Accordion type="multiple" defaultValue={["apple"]}>
      {visibleProviders.map((provider) => (
        <ProviderAccordionItem
          key={provider.id}
          provider={provider}
          calendar={calendar}
        />
      ))}
    </Accordion>
  );
}

function ProviderAccordionItem({
  provider,
  calendar,
}: {
  provider: CalendarProvider;
  calendar: ReturnType<typeof usePermission>;
}) {
  const { t } = useLingui();
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const needsPermission = calendar.status !== "authorized";

  const handleConnect = useCallback(() => {
    if (calendar.isPending) return;
    allowReconnectedCalendarConnections("apple");
    if (calendar.status === "denied") {
      setIsPermissionDialogOpen(true);
    } else {
      calendar.request();
    }
  }, [calendar]);

  const handleDisconnect = useCallback(() => {
    void removeDisconnectedCalendarConnection("apple", "apple")
      .then(() => calendar.reset())
      .catch((error) => {
        console.error(
          "[calendar] failed to remove disconnected calendar data",
          error,
        );
      })
      .then(() => syncCalendarEvents())
      .catch((error) => {
        console.error("[calendar] failed to sync after disconnect", error);
      });
  }, [calendar]);

  const menuItems = useMemo(
    (): MenuItemDef[] =>
      needsPermission
        ? []
        : [
            {
              id: "reconnect-apple-calendar",
              text: t`Reconnect`,
              action: handleConnect,
              disabled: calendar.isPending,
            },
            {
              id: "disconnect-apple-calendar",
              text: t`Disconnect`,
              action: handleDisconnect,
              disabled: calendar.isPending,
            },
          ],
    [calendar.isPending, handleConnect, handleDisconnect, needsPermission, t],
  );
  const showMenu = useNativeContextMenu(menuItems);

  return (
    <AccordionItem value={provider.id} className="group/provider border-none">
      <div className="group/row hover:bg-accent relative -mx-2 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1 rounded-full px-2">
        <AccordionHeader className="min-w-0">
          <AccordionTriggerPrimitive
            className="flex w-full min-w-0 items-center py-3 text-left text-sm font-medium transition-all hover:no-underline"
            onClick={(event) => {
              if (!needsPermission) return;
              event.preventDefault();
              handleConnect();
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <ProviderIcon provider={provider} />
              <span className="truncate text-sm font-medium">
                {provider.displayName}
              </span>
            </div>
          </AccordionTriggerPrimitive>
        </AccordionHeader>

        {needsPermission ? (
          <button
            type="button"
            onClick={handleConnect}
            disabled={calendar.isPending}
            className="text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 rounded-full p-1 transition-colors disabled:opacity-50"
            aria-label={t`Connect ${provider.displayName}`}
          >
            {calendar.isPending ? (
              <CircleNotch className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={showMenu}
            className={cn([
              "text-muted-foreground shrink-0 rounded-full p-1 transition-colors",
              "pointer-events-none opacity-0 group-hover/row:pointer-events-auto group-hover/row:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100",
              "hover:bg-accent hover:text-muted-foreground",
            ])}
            aria-label={t`Open calendar account actions`}
          >
            <DotsThree className="size-4" />
          </button>
        )}

        {!needsPermission ? (
          <CaretRight className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/provider:rotate-90" />
        ) : null}
      </div>

      {!needsPermission ? (
        <AccordionContent className="pb-3">
          <AppleCalendarSelection
            leftAction={
              <TroubleShootingLink
                isPending={calendar.isPending}
                onOpen={calendar.open}
                onRequest={calendar.request}
                onReset={calendar.reset}
              />
            }
          />
        </AccordionContent>
      ) : null}

      <AppleCalendarPermissionDialog
        open={isPermissionDialogOpen}
        onOpenChange={setIsPermissionDialogOpen}
        onOpenSettings={() => void calendar.open()}
      />
    </AccordionItem>
  );
}
