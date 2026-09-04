use anlg_calendar_interface::{
    CalendarEvent, CalendarListItem, CalendarProviderType, CreateEventInput, EventFilter,
};
#[cfg(feature = "account-auth")]
use tauri::Manager;
#[cfg(feature = "account-auth")]
use tauri_plugin_auth::AuthPluginExt;
use tauri_plugin_permissions::PermissionsPluginExt;

use crate::error::Error;

#[tauri::command]
#[specta::specta]
pub fn available_providers() -> Vec<CalendarProviderType> {
    anlg_calendar::available_providers()
}

#[tauri::command]
#[specta::specta]
pub async fn is_provider_enabled<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    provider: CalendarProviderType,
) -> Result<bool, Error> {
    #[cfg(feature = "account-auth")]
    let api_base_url = app.state::<crate::PluginConfig>().api_base_url.clone();
    #[cfg(not(feature = "account-auth"))]
    let api_base_url = String::new();
    let token = match provider {
        CalendarProviderType::Apple => None,
        _ => access_token(&app)?,
    };
    let apple = is_apple_authorized(&app).await?;
    anlg_calendar::is_provider_enabled(&api_base_url, token.as_deref(), apple, provider)
        .await
        .map_err(Into::into)
}

#[tauri::command]
#[specta::specta]
pub async fn list_connection_ids<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
) -> Result<Vec<anlg_calendar::ProviderConnectionIds>, Error> {
    #[cfg(feature = "account-auth")]
    let api_base_url = app.state::<crate::PluginConfig>().api_base_url.clone();
    #[cfg(not(feature = "account-auth"))]
    let api_base_url = String::new();
    let token = access_token(&app)?;
    let apple = is_apple_authorized(&app).await?;
    anlg_calendar::list_connection_ids(&api_base_url, token.as_deref(), apple)
        .await
        .map_err(Into::into)
}

#[tauri::command]
#[specta::specta]
pub async fn list_calendars<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    provider: CalendarProviderType,
    connection_id: String,
) -> Result<Vec<CalendarListItem>, Error> {
    #[cfg(feature = "account-auth")]
    let api_base_url = app.state::<crate::PluginConfig>().api_base_url.clone();
    #[cfg(not(feature = "account-auth"))]
    let api_base_url = String::new();
    let token = match provider {
        CalendarProviderType::Apple => String::new(),
        _ => require_access_token(&app)?,
    };
    anlg_calendar::list_calendars(&api_base_url, &token, provider, &connection_id)
        .await
        .map_err(Into::into)
}

#[tauri::command]
#[specta::specta]
pub async fn list_events<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    provider: CalendarProviderType,
    connection_id: String,
    filter: EventFilter,
) -> Result<Vec<CalendarEvent>, Error> {
    #[cfg(feature = "account-auth")]
    let api_base_url = app.state::<crate::PluginConfig>().api_base_url.clone();
    #[cfg(not(feature = "account-auth"))]
    let api_base_url = String::new();
    let token = match provider {
        CalendarProviderType::Apple => String::new(),
        _ => require_access_token(&app)?,
    };
    anlg_calendar::list_events(&api_base_url, &token, provider, &connection_id, filter)
        .await
        .map_err(Into::into)
}

#[tauri::command]
#[specta::specta]
pub fn open_calendar<R: tauri::Runtime>(
    _app: tauri::AppHandle<R>,
    provider: CalendarProviderType,
) -> Result<(), Error> {
    anlg_calendar::open_calendar(provider).map_err(Into::into)
}

#[tauri::command]
#[specta::specta]
pub fn create_event<R: tauri::Runtime>(
    _app: tauri::AppHandle<R>,
    provider: CalendarProviderType,
    input: CreateEventInput,
) -> Result<String, Error> {
    anlg_calendar::create_event(provider, input).map_err(Into::into)
}

fn access_token<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<Option<String>, Error> {
    #[cfg(not(feature = "account-auth"))]
    {
        let _ = app;
        return Ok(None);
    }

    #[cfg(feature = "account-auth")]
    app.access_token()
        .map(|token| token.filter(|token| !token.is_empty()))
        .map_err(|error| Error::Auth(error.to_string()))
}

fn require_access_token<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<String, Error> {
    let token = access_token(app)?;
    match token {
        Some(t) if !t.is_empty() => Ok(t),
        _ => Err(anlg_calendar::Error::NotAuthenticated.into()),
    }
}

async fn is_apple_authorized<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<bool, Error> {
    #[cfg(target_os = "macos")]
    {
        let status = app
            .permissions()
            .check(tauri_plugin_permissions::Permission::Calendar)
            .await
            .map_err(|e| anlg_calendar::Error::Api(e.to_string()))?;
        Ok(matches!(
            status,
            tauri_plugin_permissions::PermissionStatus::Authorized
        ))
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        Ok(false)
    }
}
