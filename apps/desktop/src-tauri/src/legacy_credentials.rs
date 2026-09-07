use std::path::{Path, PathBuf};

use tauri::Manager;

const LEGACY_APP_IDENTIFIERS: &[&str] = &[
    "com.hyprnote.Hyprnote",
    "com.hyprnote.stable",
    "com.hyprnote.staging",
    "com.hyprnote.dev",
    "com.hyprnote.nightly",
    "com.anarlog.stable",
    "com.anarlog.staging",
    "com.anarlog.dev",
    "com.anarlog.nightly",
];

fn legacy_auth_bases(
    data_dir: &Path,
    local_data_dir: &Path,
    current_app_local_data_dir: &Path,
) -> Vec<PathBuf> {
    let mut bases = vec![
        current_app_local_data_dir.to_path_buf(),
        data_dir.join("corola"),
        data_dir.join("anarlog"),
        data_dir.join("hyprnote"),
    ];

    for identifier in LEGACY_APP_IDENTIFIERS {
        bases.push(data_dir.join(identifier));
        bases.push(local_data_dir.join(identifier));
    }

    bases.sort();
    bases.dedup();
    bases
}

fn clear_legacy_auth_paths(bases: &[PathBuf]) -> Vec<String> {
    let mut failures = Vec::new();

    for base in bases {
        for filename in ["auth.json", "auth.cli.json", "auth.dpapi"] {
            let path = base.join(filename);
            if let Err(error) = securely_remove_file(&path) {
                failures.push(format!("{}: {error}", path.display()));
            }
        }

        let store_path = base.join("store.json");
        if let Err(error) = remove_auth_from_store(&store_path) {
            failures.push(format!("{}: {error}", store_path.display()));
        }
    }

    failures
}

fn securely_remove_file(path: &Path) -> std::io::Result<()> {
    let metadata = match std::fs::symlink_metadata(path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(error) => return Err(error),
    };

    if !metadata.file_type().is_file() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "credential path is not a regular file",
        ));
    }

    let file = std::fs::OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(path)?;
    file.sync_all()?;
    std::fs::remove_file(path)
}

fn remove_auth_from_store(path: &Path) -> std::io::Result<()> {
    let metadata = match std::fs::symlink_metadata(path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(error) => return Err(error),
    };

    if !metadata.file_type().is_file() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "legacy store path is not a regular file",
        ));
    }

    let contents = std::fs::read_to_string(path)?;
    let mut store: serde_json::Map<String, serde_json::Value> =
        serde_json::from_str(&contents).map_err(invalid_data)?;
    if store.remove("auth").is_none() {
        return Ok(());
    }

    let sanitized = serde_json::to_string(&store).map_err(invalid_data)?;
    anlg_storage::fs::atomic_write(path, &sanitized)
}

fn invalid_data(error: impl std::fmt::Display) -> std::io::Error {
    std::io::Error::new(std::io::ErrorKind::InvalidData, error.to_string())
}

pub(crate) fn clear_obsolete_account_credentials<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    if let Some(data_dir) = dirs::data_dir() {
        let local_data_dir = dirs::data_local_dir().unwrap_or_else(|| data_dir.clone());
        let current_app_local_data_dir = match app.path().app_local_data_dir() {
            Ok(path) => path,
            Err(error) => {
                tracing::warn!(%error, "could not resolve app data directory for credential cleanup");
                data_dir.join(&app.config().identifier)
            }
        };

        let bases = legacy_auth_bases(&data_dir, &local_data_dir, &current_app_local_data_dir);
        for failure in clear_legacy_auth_paths(&bases) {
            tracing::warn!(%failure, "failed to remove obsolete account credential");
        }
    } else {
        tracing::warn!("could not resolve data directory for legacy credential cleanup");
    }

    #[cfg(target_os = "linux")]
    if let Err(error) = tauri_plugin_store2::delete_secret_blocking(app, "auth", "supabase-storage")
    {
        tracing::warn!(%error, "failed to remove obsolete account keyring credential");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn legacy_auth_bases_cover_global_and_bundle_specific_locations() {
        let bases = legacy_auth_bases(
            Path::new("/data"),
            Path::new("/local-data"),
            Path::new("/current-app"),
        );

        assert!(bases.contains(&PathBuf::from("/current-app")));
        assert!(bases.contains(&PathBuf::from("/data/anarlog")));
        assert!(bases.contains(&PathBuf::from("/data/hyprnote")));
        for identifier in LEGACY_APP_IDENTIFIERS {
            assert!(bases.contains(&PathBuf::from("/data").join(identifier)));
            assert!(bases.contains(&PathBuf::from("/local-data").join(identifier)));
        }
    }

    #[test]
    fn cleanup_removes_auth_files_and_only_the_auth_store_entry() {
        let temp = tempfile::tempdir().unwrap();
        let base = temp.path().join("legacy");
        std::fs::create_dir_all(&base).unwrap();
        for filename in ["auth.json", "auth.cli.json", "auth.dpapi"] {
            std::fs::write(base.join(filename), b"secret-token").unwrap();
        }
        std::fs::write(
            base.join("store.json"),
            r#"{"auth":"{\"access_token\":\"secret-token\"}","theme":"dark"}"#,
        )
        .unwrap();

        let failures = clear_legacy_auth_paths(std::slice::from_ref(&base));

        assert!(failures.is_empty(), "{failures:?}");
        for filename in ["auth.json", "auth.cli.json", "auth.dpapi"] {
            assert!(!base.join(filename).exists());
        }
        let store: serde_json::Value =
            serde_json::from_str(&std::fs::read_to_string(base.join("store.json")).unwrap())
                .unwrap();
        assert!(store.get("auth").is_none());
        assert_eq!(store.get("theme"), Some(&serde_json::json!("dark")));
    }

    #[test]
    fn cleanup_is_best_effort_across_locations() {
        let temp = tempfile::tempdir().unwrap();
        let broken = temp.path().join("broken");
        let valid = temp.path().join("valid");
        std::fs::create_dir_all(broken.join("auth.json")).unwrap();
        std::fs::create_dir_all(&valid).unwrap();
        std::fs::write(valid.join("auth.json"), b"another-secret").unwrap();

        let failures = clear_legacy_auth_paths(&[broken, valid.clone()]);

        assert!(!failures.is_empty());
        assert!(!valid.join("auth.json").exists());
    }
}
