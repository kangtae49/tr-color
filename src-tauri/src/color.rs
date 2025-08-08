use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, skip_serializing_none};
use specta::Type;
use windows::Win32::Foundation::{POINT};
use windows::Win32::Graphics::Gdi::{GetDC, GetPixel, ReleaseDC};
use windows::Win32::UI::WindowsAndMessaging::{GetCursorPos, GetDesktopWindow};

use crate::err::ApiError;
use crate::utils::get_resource_path;

pub type Result<T> = std::result::Result<T, ApiError>;

#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug)]
pub struct Pos {
    x: i32,
    y: i32
}

#[serde_as]
#[derive(Type, Serialize, Deserialize, Clone, Debug)]
pub struct Rgb {
    r: u8,
    g: u8,
    b: u8,
}

#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, JsonSchema, Clone, Debug)]
pub struct Color {
    hex_color: String,
    name: Option<String>,
}

#[skip_serializing_none]
#[serde_as]
#[derive(Type, Serialize, Deserialize, JsonSchema, Clone, Debug)]
pub struct ColorsJson {
    #[serde(rename = "$schema")]
    schema: Option<String>,
    colors: Vec<Color>,
}

pub fn get_mouse_pos() -> Result<Pos> {
    let mut pt = POINT::default();
    match unsafe {GetCursorPos(&mut pt)} {
        Ok(_) => Ok(Pos {x: pt.x, y: pt.y}),
        Err(e) => Err(ApiError::Error(format!("{:?}", e)))
    }
}

pub fn get_color(pos: Pos) -> Result<Rgb> {
    let hwnd = unsafe { GetDesktopWindow() };
    let hdc = unsafe { GetDC(Option::from(hwnd)) };

    let color = unsafe { GetPixel(hdc, pos.x, pos.y) };
    unsafe { ReleaseDC(Option::from(hwnd), hdc) };

    if color.0 == 0xFFFFFFFF {
        return Err(ApiError::Error("Err GetPixel".to_string()));
    }

    let r = (color.0 & 0xFF) as u8;
    let g = ((color.0 >> 8) & 0xFF) as u8;
    let b = ((color.0 >> 16) & 0xFF) as u8;
    let color = Rgb {r, g, b};
    Ok(color)
}

pub fn read_colors() -> Result<ColorsJson> {
    let resource_path = get_resource_path()?;
    if !resource_path.exists() {
        std::fs::create_dir_all(&resource_path)?;
    }
    let json_path = resource_path.join("colors.json");
    let json_str = std::fs::read_to_string(json_path)?;
    let color_json: ColorsJson = serde_json::from_str(&json_str)?;
    Ok(color_json)
}

pub fn write_colors(mut colors_json: ColorsJson) -> Result<()> {
    colors_json.schema = Some("./colors.schema.json".to_string());
    let resource_path = get_resource_path()?;
    let json_path = resource_path.join("colors.json");
    let json_str = serde_json::to_string_pretty(&colors_json)?;
    std::fs::write(json_path, json_str)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_mouse_pos() {
        let pos = get_mouse_pos();
        println!("pos: {:?}", pos);
        assert!(pos.is_ok());
    }

    #[test]
    fn test_get_color() {
        let color = get_color(Pos {x: 0, y: 0});
        println!("color: {:?}", color);
        assert!(color.is_ok());
    }
}
