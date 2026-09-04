import { Trans, useLingui } from "@lingui/react/macro";
import { CircleNotch, DownloadSimple } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { open as selectFiles } from "@tauri-apps/plugin-dialog";
import { type ReactNode, useEffect } from "react";

import { commands as importerCommands } from "@anlg/plugin-importer";
import { Button } from "@anlg/ui/components/ui/button";
import { cn } from "@anlg/utils";

import { detectImportSources } from "./detection";
import { providerIconOpticalClass, providerIconSrc } from "./icons";
import type {
  DetectedMeetingImportProvider,
  MeetingImportProvider,
} from "./providers";
import {
  EMPTY_MEETING_IMPORT_HISTORY,
  importMeetingFiles,
  useMeetingImportHistory,
} from "./queries";
import { pauseCompetingApplicationTermination } from "./termination-pause";

import { useMountEffect } from "~/shared/hooks/useMountEffect";

const IMPORT_EXTENSIONS = [
  "csv",
  "json",
  "md",
  "markdown",
  "srt",
  "txt",
  "vtt",
];

function ProviderIcon({
  provider,
}: {
  provider: DetectedMeetingImportProvider;
}) {
  const src = providerIconSrc(provider);
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn([
          "size-8 object-contain object-center",
          providerIconOpticalClass(provider),
        ])}
      />
    );
  }

  return (
    <span
      className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-lg text-xs font-semibold"
      aria-hidden="true"
    >
      {provider.name.charAt(0)}
    </span>
  );
}

export function MeetingImportScreen({
  compact = false,
  onContinue,
  onNoSourcesDetected,
  secondaryAction,
}: {
  compact?: boolean;
  onContinue?: () => void;
  onNoSourcesDetected?: () => void;
  secondaryAction?: ReactNode;
}) {
  const { t } = useLingui();
  const detectionQuery = useQuery({
    queryKey: ["meeting-import-sources"],
    queryFn: detectImportSources,
    refetchOnMount: "always",
  });
  useMountEffect(pauseCompetingApplicationTermination);
  const historyQuery = useMeetingImportHistory();
  const history = historyQuery.data ?? EMPTY_MEETING_IMPORT_HISTORY;
  const displayedProviders = [...(detectionQuery.data ?? [])].sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  const detectionSettled = !detectionQuery.isLoading && !detectionQuery.error;

  useEffect(() => {
    if (
      detectionQuery.isFetching ||
      detectionQuery.error ||
      detectionQuery.data?.length !== 0
    ) {
      return;
    }
    onNoSourcesDetected?.();
  }, [
    detectionQuery.data,
    detectionQuery.error,
    detectionQuery.isFetching,
    onNoSourcesDetected,
  ]);

  const fileImportMutation = useMutation({
    mutationFn: async (provider: MeetingImportProvider) => {
      const selection = await selectFiles({
        title: t`Choose ${provider.name} export files`,
        multiple: true,
        directory: false,
        filters: [
          {
            name: t`Meeting exports`,
            extensions: IMPORT_EXTENSIONS,
          },
        ],
      });
      const paths = Array.isArray(selection)
        ? selection
        : selection
          ? [selection]
          : [];
      if (paths.length === 0) return null;

      const filesResult = await importerCommands.readTextFiles(paths);
      if (filesResult.status === "error") throw new Error(filesResult.error);
      return importMeetingFiles(provider.id, filesResult.data);
    },
  });
  const latestResult = fileImportMutation.data ?? null;

  return (
    <div className={cn(["flex flex-col gap-4", compact && "max-w-3xl"])}>
      {detectionQuery.isLoading ? (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <CircleNotch className="size-3.5 animate-spin" />
          <Trans>Checking installed meeting assistants…</Trans>
        </p>
      ) : detectionQuery.error ? (
        <p className="text-destructive text-xs">
          {detectionQuery.error.message}
        </p>
      ) : null}

      {fileImportMutation.error ? (
        <p className="text-destructive text-sm">
          {fileImportMutation.error.message}
        </p>
      ) : null}
      {latestResult ? (
        <div className="border-border bg-card rounded-xl border px-4 py-3 text-sm">
          {latestResult.imported > 0 ? (
            <Trans>
              Brought in {latestResult.imported} new meetings.{" "}
              {latestResult.matched} were already here.
            </Trans>
          ) : latestResult.errors > 0 || latestResult.conflicts > 0 ? (
            <Trans>
              Nothing new was imported. {latestResult.conflicts} meetings need
              review and {latestResult.errors} could not be imported.
            </Trans>
          ) : (
            <Trans>Everything is already here.</Trans>
          )}
        </div>
      ) : null}

      {displayedProviders.length > 0 || detectionSettled ? (
        <div className="border-border bg-card overflow-hidden rounded-2xl border">
          <div
            className={cn([
              "divide-border divide-y",
              compact && "max-h-80 overflow-y-auto",
            ])}
          >
            {displayedProviders.length === 0 ? (
              <p className="text-muted-foreground px-4 py-6 text-center text-sm">
                <Trans>No apps found.</Trans>
              </p>
            ) : (
              displayedProviders.map((provider) => {
                const importing =
                  fileImportMutation.isPending &&
                  fileImportMutation.variables.id === provider.id;
                const lastRun = history.find(
                  (run) => run.providerId === provider.id,
                );

                return (
                  <div
                    key={provider.id}
                    className="flex min-h-16 items-center gap-3 px-4 py-3"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center">
                      <ProviderIcon provider={provider} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {provider.name}
                      </span>
                      {lastRun ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          <Trans>
                            Last import: {lastRun.imported} added,{" "}
                            {lastRun.matched} unchanged
                          </Trans>
                        </p>
                      ) : (
                        <p className="text-muted-foreground mt-1 text-xs">
                          <Trans>Choose files exported from this app.</Trans>
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={fileImportMutation.isPending}
                      onClick={() => fileImportMutation.mutate(provider)}
                    >
                      {importing ? (
                        <CircleNotch className="size-3.5 animate-spin" />
                      ) : (
                        <DownloadSimple className="size-3.5" />
                      )}
                      <Trans>Choose files</Trans>
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      {secondaryAction || (onContinue && latestResult) ? (
        <div className="flex items-center gap-3">
          {onContinue && latestResult ? (
            <Button
              type="button"
              className="w-fit rounded-full"
              onClick={onContinue}
            >
              <Trans>Continue</Trans>
            </Button>
          ) : null}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
