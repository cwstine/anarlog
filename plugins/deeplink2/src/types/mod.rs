mod auth_callback;

pub use auth_callback::*;

use serde::{Deserialize, Serialize};
use specta::Type;
use std::str::FromStr;

#[derive(Debug, Clone, serde::Serialize, specta::Type, tauri_specta::Event)]
pub struct DeepLinkEvent(pub DeepLink);

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "to", content = "search")]
pub enum DeepLink {
    #[serde(rename = "/auth/callback")]
    AuthCallback(AuthCallbackSearch),
}

impl DeepLink {
    pub fn path(&self) -> &'static str {
        match self {
            DeepLink::AuthCallback(_) => "/auth/callback",
        }
    }
}

impl FromStr for DeepLink {
    type Err = crate::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let parsed = url::Url::parse(s)?;

        let host = parsed.host_str().unwrap_or("");
        let path = parsed.path().trim_start_matches('/');
        let full_path = if path.is_empty() {
            host.to_string()
        } else {
            format!("{}/{}", host, path)
        };

        let query = parsed.query().unwrap_or("");

        if full_path != "auth/callback" {
            return Err(crate::Error::UnknownPath(full_path));
        }

        let search: AuthCallbackSearch = serde_qs::from_str(query)?;
        if search.code.trim().is_empty() {
            return Err(crate::Error::MissingAuthorizationCode);
        }

        Ok(DeepLink::AuthCallback(search))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_removed_account_product_paths() {
        for value in [
            "corola://billing/refresh",
            "corola://integration/callback?integration_id=example&status=success",
            "corola://onboarding-demo/complete",
            "corola://share/open?mode=account&share_id=ba5ca57a-8f88-44e8-ab92-f9e10c89425c",
            "corola://auth/callback?access_token=access&refresh_token=refresh",
        ] {
            assert!(
                DeepLink::from_str(value).is_err(),
                "removed account-product path was accepted: {value}"
            );
        }
    }

    #[test]
    fn parses_chatgpt_loopback_authorization_code() {
        let DeepLink::AuthCallback(search) =
            DeepLink::from_str("local://auth/callback?code=codex-code&state=s1&scope=openid")
                .unwrap();

        assert_eq!(search.code, "codex-code");
        assert_eq!(search.state.as_deref(), Some("s1"));
    }

    #[test]
    fn parses_subscription_auth_custom_scheme_deeplink() {
        let DeepLink::AuthCallback(search) =
            DeepLink::from_str("corola://auth/callback?code=ac_nf5hq&state=xYc5ZmNlqtWTu3BIbfbVQg")
                .unwrap();

        assert_eq!(search.code, "ac_nf5hq");
        assert_eq!(search.state.as_deref(), Some("xYc5ZmNlqtWTu3BIbfbVQg"));
    }
}
