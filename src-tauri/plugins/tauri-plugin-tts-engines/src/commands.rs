use tauri::{command, AppHandle, Runtime};
#[cfg(target_os = "android")]
use tauri::Manager;

#[cfg(target_os = "android")]
use crate::models::ListEnginesResponse;
#[cfg(target_os = "android")]
use crate::TtsEngines;
use crate::{Result, TtsEngineInfo};

#[command]
pub async fn list_tts_engines<R: Runtime>(app: AppHandle<R>) -> Result<Vec<TtsEngineInfo>> {
    #[cfg(target_os = "android")]
    {
        let tts = app.state::<TtsEngines<R>>();
        let raw: ListEnginesResponse = tts.0.run_mobile_plugin("listEngines", ())?;
        Ok(raw.engines)
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = app;
        Ok(vec![])
    }
}
