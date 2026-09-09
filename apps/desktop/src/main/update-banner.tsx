export type UpdateBannerStatus =
  | "available"
  | "downloading"
  | "ready"
  | "failed";

export type DesktopUpdateControl = {
  status: UpdateBannerStatus | null;
  version: string | null;
  progress: number | null;
  errorMessage: string | null;
  downloadStarting: boolean;
  installing: boolean;
  downloadUpdate: () => void;
  installUpdate: () => void;
};

// MinutesWise intentionally ships without an updater until it owns both an update
// endpoint and a signing key. Keeping the neutral control shape lets the toast
// surface stay decoupled from that future distribution decision.
const DISABLED_UPDATE_CONTROL: DesktopUpdateControl = {
  status: null,
  version: null,
  progress: null,
  errorMessage: null,
  downloadStarting: false,
  installing: false,
  downloadUpdate: () => undefined,
  installUpdate: () => undefined,
};

export function useDesktopUpdateControl(): DesktopUpdateControl {
  return DISABLED_UPDATE_CONTROL;
}
