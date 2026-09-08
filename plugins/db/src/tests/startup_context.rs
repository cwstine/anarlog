#[test]
fn plugin_runtime_can_start_from_a_synchronous_tauri_setup_thread() {
    let tokio_runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap();
    let db = tokio_runtime
        .block_on(anlg_db_core::Db::connect_memory_plain())
        .unwrap();

    let plugin_runtime = crate::runtime::PluginDbRuntime::new(std::sync::Arc::new(db));

    drop(plugin_runtime);
}
