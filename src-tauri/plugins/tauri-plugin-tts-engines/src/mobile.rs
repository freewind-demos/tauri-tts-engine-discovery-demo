use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, Runtime};

use crate::Error;

const ANDROID_PLUGIN_ID: &str = "com.pengli.plugin.tts_engines";

pub struct TtsEngines<R: Runtime>(pub tauri::plugin::PluginHandle<R>);

pub fn register<R: Runtime, C: DeserializeOwned>(
    api: PluginApi<R, C>,
) -> Result<TtsEngines<R>, Error> {
    let handle = api.register_android_plugin(ANDROID_PLUGIN_ID, "TtsEnginesPlugin")?;
    Ok(TtsEngines(handle))
}
