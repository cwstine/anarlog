import { getIdentifier } from "@tauri-apps/api/app";

// export * from "../shared/config/configure-pro-settings";
// export * from "~/sidebar/timeline/utils";
// export * from "~/stt/segment";

export const id = () => crypto.randomUUID() as string;

export type DesktopScheme = "corola" | "corola-staging" | "corola-dev";

export const getScheme = async (): Promise<DesktopScheme> => {
  const id = await getIdentifier();
  const schemes: Record<string, DesktopScheme> = {
    "com.corola.desktop": "corola",
    "com.corola.staging": "corola-staging",
    "com.corola.dev": "corola-dev",
    "com.hyprnote.stable": "corola",
    "com.hyprnote.Hyprnote": "corola",
    "com.hyprnote.staging": "corola-staging",
    "com.hyprnote.dev": "corola-dev",
    "so.anarlog.Anarlog": "corola",
    "com.anarlog.stable": "corola",
    "com.anarlog.staging": "corola-staging",
    "com.anarlog.dev": "corola-dev",
  };
  return schemes[id] ?? "corola";
};

// https://www.rfc-editor.org/rfc/rfc4122#section-4.1.7
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";
