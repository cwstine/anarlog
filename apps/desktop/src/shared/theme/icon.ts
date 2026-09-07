import type { ThemePreference } from "./resolve";

export type AppIconPreference =
  | "default"
  | "stable"
  | "anagram"
  | "dev"
  | "staging"
  | "journal"
  | "notepad"
  | "stone"
  | "typewriter-key"
  | "walnut";

export function normalizeAppIconPreference(
  _value: string | null | undefined,
): AppIconPreference {
  return "default";
}

export function resolveAppIconName(
  icon: AppIconPreference,
  appIdentifier: string,
): Exclude<AppIconPreference, "default"> {
  void icon;
  if (appIdentifier.endsWith(".dev")) {
    return "dev";
  }
  if (appIdentifier.endsWith(".staging")) {
    return "staging";
  }
  return "stable";
}

/** `systemIsDark` is the Dock's appearance, used when the theme follows the system. */
export function resolveDockIconName(
  icon: AppIconPreference,
  theme: ThemePreference,
  systemIsDark: boolean,
  appIdentifier: string,
): string {
  void theme;
  void systemIsDark;
  return resolveAppIconName(icon, appIdentifier);
}
