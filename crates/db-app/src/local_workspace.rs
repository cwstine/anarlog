use sqlx::SqlitePool;

// Keep the historical setting key so existing databases retain their current
// local partition. In a local-only build this is just a stable storage key; no
// account, team, or network service reads it.
const WORKSPACE_BINDING_ID: &str = "cloudsync_workspace_binding";

pub(crate) async fn ensure_local_workspace_binding(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let workspace_id = uuid::Uuid::new_v4().to_string();
    let value_json = serde_json::json!({ "workspace_id": workspace_id }).to_string();

    sqlx::query("INSERT OR IGNORE INTO app_settings (id, value_json) VALUES (?, ?)")
        .bind(WORKSPACE_BINDING_ID)
        .bind(&value_json)
        .execute(pool)
        .await?;

    // A damaged legacy value must not make every local insert fail its
    // workspace_id constraint. Preserve any valid existing ID, otherwise
    // replace only the unusable binding with a new device-local ID.
    sqlx::query(
        "UPDATE app_settings
         SET value_json = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?
           AND (
             NOT json_valid(value_json)
             OR COALESCE(NULLIF(trim(json_extract(value_json, '$.workspace_id')), ''), '') = ''
           )",
    )
    .bind(value_json)
    .bind(WORKSPACE_BINDING_ID)
    .execute(pool)
    .await?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn creates_a_stable_device_local_workspace() {
        let db = anlg_db_core::Db::connect_memory_plain().await.unwrap();
        crate::prepare_schema(&db).await.unwrap();
        let first: String = sqlx::query_scalar(
            "SELECT json_extract(value_json, '$.workspace_id')
             FROM app_settings WHERE id = ?",
        )
        .bind(WORKSPACE_BINDING_ID)
        .fetch_one(db.pool())
        .await
        .unwrap();

        crate::prepare_schema(&db).await.unwrap();
        let second: String = sqlx::query_scalar(
            "SELECT json_extract(value_json, '$.workspace_id')
             FROM app_settings WHERE id = ?",
        )
        .bind(WORKSPACE_BINDING_ID)
        .fetch_one(db.pool())
        .await
        .unwrap();

        assert!(!first.is_empty());
        assert_eq!(first, second);
    }
}
