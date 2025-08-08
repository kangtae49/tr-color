use serde::{Deserialize, Serialize};
use specta::Type;
use thiserror::Error;

pub type Result<T> = std::result::Result<T, ApiError>;
#[derive(Type, Serialize, Deserialize, Error, Debug)]
pub enum ApiError {
    #[error("Api error: {0}")]
    Error(String),

    #[error("Tauri error: {0}")]
    TauriError(String),

    #[error("IO error: {0}")]
    Io(String),

    #[error("JSON error: {0}")]
    JsonError(String),

    #[error("Win32 error: {0}")]
    Win32Error(String),
}

impl From<tauri::Error> for ApiError {
    fn from(e: tauri::Error) -> Self {
        ApiError::TauriError(e.to_string())
    }
}

impl From<std::io::Error> for ApiError {
    fn from(e: std::io::Error) -> Self {
        ApiError::Io(e.to_string())
    }
}

impl From<serde_json::error::Error> for ApiError {
    fn from(e: serde_json::error::Error) -> Self {
        ApiError::JsonError(e.to_string())
    }
}

impl From<std::string::FromUtf8Error> for ApiError {
    fn from(e: std::string::FromUtf8Error) -> Self {
        ApiError::Io(e.to_string())
    }
}

impl From<windows::core::Error> for ApiError {
    fn from(e: windows::core::Error) -> Self {
        ApiError::Win32Error(e.to_string())
    }
}

