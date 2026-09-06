import { t } from "@lingui/core/macro";

import { CliSettingsSections } from "./cli";
import { WebhooksSection } from "./webhooks";

import { SettingsPageTitle } from "~/settings/page-title";

export { buildMcpConfiguration, getCliInstallNotification } from "./cli";

export function SettingsDevelopers() {
  return (
    <div className="flex flex-col gap-8">
      <SettingsPageTitle title={t`Developers`} />
      <CliSettingsSections />
      <WebhooksSection />
    </div>
  );
}
