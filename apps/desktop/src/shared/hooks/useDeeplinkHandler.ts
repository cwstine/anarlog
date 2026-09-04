import { isTauri } from "@tauri-apps/api/core";

import {
  type DeepLink,
  commands as deeplink2Commands,
  events as deeplink2Events,
} from "@anlg/plugin-deeplink2";
import { stopActiveWelcomeDemo } from "~/onboarding/welcome-note";
import { subscribeThenDrainDeepLinks } from "~/shared/deeplink";
import { useMountEffect } from "~/shared/hooks/useMountEffect";

export function useDeeplinkHandler() {
  useMountEffect(() => {
    if (!isTauri()) {
      return;
    }

    const handleDeepLink = (payload: DeepLink) => {
      if (payload.to === "/onboarding-demo/complete") {
        void stopActiveWelcomeDemo().catch((error) => {
          console.error("[onboarding] failed to complete welcome demo", error);
        });
      }
    };
    const deepLinkSubscription = subscribeThenDrainDeepLinks({
      listen: (handler) =>
        deeplink2Events.deepLinkEvent.listen(({ payload }) => {
          handler(payload);
        }),
      takePendingDeepLinks: deeplink2Commands.takePendingDeepLinks,
      handle: handleDeepLink,
    });
    return () => {
      void deepLinkSubscription.then((fn) => fn()).catch(() => {});
    };
  });
}
