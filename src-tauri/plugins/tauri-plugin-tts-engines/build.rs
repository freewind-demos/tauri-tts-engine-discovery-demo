const COMMANDS: &[&str] = &["list_tts_engines"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .try_build()
        .expect("failed to compile tauri-plugin-tts-engines permissions");
}
