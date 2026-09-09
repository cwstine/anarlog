import { getIdentifier } from "@tauri-apps/api/app";

// export * from "../shared/config/configure-pro-settings";
// export * from "~/sidebar/timeline/utils";
// export * from "~/stt/segment";

export const id = () => crypto.randomUUID() as string;

export type DesktopScheme =
  | "minuteswise"
  | "minuteswise-staging"
  | "minuteswise-dev";

export const getScheme = async (): Promise<DesktopScheme> => {
  const id = await getIdentifier();
  const schemes: Record<string, DesktopScheme> = {
    "com.minuteswise.desktop": "minuteswise",
    "com.minuteswise.staging": "minuteswise-staging",
    "com.minuteswise.dev": "minuteswise-dev",
    "com.corola.desktop": "minuteswise",
    "com.corola.staging": "minuteswise-staging",
    "com.corola.dev": "minuteswise-dev",
    "com.hyprnote.stable": "minuteswise",
    "com.hyprnote.Hyprnote": "minuteswise",
    "com.hyprnote.staging": "minuteswise-staging",
    "com.hyprnote.dev": "minuteswise-dev",
    "so.anarlog.Anarlog": "minuteswise",
    "so.anarlog.Corola": "minuteswise",
    "com.anarlog.stable": "minuteswise",
    "com.anarlog.staging": "minuteswise-staging",
    "com.anarlog.dev": "minuteswise-dev",
  };
  return schemes[id] ?? "minuteswise";
};

// https://www.rfc-editor.org/rfc/rfc4122#section-4.1.7
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

export const LEGACY_ANALYTICS_FIRST_OPEN_KEY = "corola:analytics:first-opened";
