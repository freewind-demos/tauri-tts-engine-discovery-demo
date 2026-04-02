use tauri::{plugin::{Builder, TauriPlugin}, Runtime};
#[cfg(target_os = "android")]
use tauri::Manager;

mod commands;
mod error;
mod models;

#[cfg(target_os = "android")]
mod mobile;

pub use error::Error;
pub use error::Result;
pub use models::TtsEngineInfo;

#[cfg(target_os = "android")]
pub use mobile::TtsEngines;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("tts-engines")
        .invoke_handler(tauri::generate_handler![commands::list_tts_engines])
        .setup(|app, api| {
            #[cfg(target_os = "android")]
            {
                let tts = mobile::register(api)?;
                app.manage(tts);
            }
            #[cfg(not(target_os = "android"))]
            let _ = (app, api);
            Ok(())
        })
        .build()
}
