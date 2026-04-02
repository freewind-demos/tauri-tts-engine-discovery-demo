use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TtsEngineInfo {
    /// Engine package name (e.g. com.iflytek ...)
    pub name: String,
    /// User-visible label from the engine app
    pub label: String,
}

#[derive(Debug, Deserialize)]
#[cfg_attr(not(target_os = "android"), allow(dead_code))]
pub(crate) struct ListEnginesResponse {
    pub engines: Vec<TtsEngineInfo>,
}

#[derive(Debug, Serialize)]
#[cfg_attr(not(target_os = "android"), allow(dead_code))]
pub(crate) struct SpeakPayload {
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub engine: Option<String>,
}
