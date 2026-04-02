use tauri::{command, AppHandle, Runtime};
#[cfg(target_os = "android")]
use tauri::Manager;

#[cfg(target_os = "android")]
use crate::models::ListEnginesResponse;
#[cfg(target_os = "android")]
use crate::models::SpeakPayload;
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

#[command]
pub async fn speak<R: Runtime>(
    app: AppHandle<R>,
    text: String,
    engine: Option<String>,
) -> Result<()> {
    #[cfg(target_os = "android")]
    {
        let tts = app.state::<TtsEngines<R>>();
        tts.0.run_mobile_plugin(
            "speak",
            SpeakPayload { text, engine },
        )?;
        Ok(())
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = (app, text, engine);
        Ok(())
    }
}

#[command]
pub async fn stop_speak<R: Runtime>(app: AppHandle<R>) -> Result<()> {
    #[cfg(target_os = "android")]
    {
        let tts = app.state::<TtsEngines<R>>();
        tts.0.run_mobile_plugin("stopSpeak", ())?;
        Ok(())
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = app;
        Ok(())
    }
}
