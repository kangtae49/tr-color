use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, skip_serializing_none};
use specta::Type;
use windows::Win32::Foundation::{POINT};
use windows::Win32::Graphics::Gdi::{BitBlt, CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject, GetDC, GetDIBits, GetPixel, ReleaseDC, SelectObject, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, HGDIOBJ, SRCCOPY};
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
pub struct Rect {
    x: i32,
    y: i32,
    w: i32,
    h: i32,
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

pub fn get_colors(pos: Pos) -> Result<Vec<Rgb>> {
    let rect = Rect {
        x: pos.x-10,
        y: pos.y-10,
        w: 21,
        h: 21,
    };
    
    let hwnd = unsafe { GetDesktopWindow() };
    let hdc = unsafe { GetDC(Option::from(hwnd)) };

    let mem_dc = unsafe { CreateCompatibleDC(Option::from(hdc)) };
    let bmp = unsafe { CreateCompatibleBitmap(hdc, rect.w, rect.h) };
    unsafe { SelectObject(mem_dc, HGDIOBJ(bmp.0)) };

    unsafe { BitBlt(mem_dc, rect.x, rect.y, rect.w, rect.h, Option::from(hdc), rect.x, rect.y, SRCCOPY) }?;

    let mut bmi = BITMAPINFO {
        bmiHeader: BITMAPINFOHEADER {
            biSize: size_of::<BITMAPINFOHEADER>() as u32,
            biWidth: rect.w,
            biHeight: -rect.h,
            biPlanes: 1,
            biBitCount: 24,
            biCompression: BI_RGB.0,
            ..Default::default()
        },
        ..Default::default()
    };

    let row_bytes = ((rect.w * 24 + 31) / 32) * 4;
    let buf_size = (row_bytes * rect.h) as usize;
    let mut pixels_bgr = vec![0u8; buf_size];

    unsafe {
        GetDIBits(
            mem_dc,
            bmp,
            0,
            rect.h as u32,
            Some(pixels_bgr.as_mut_ptr() as *mut _),
            &mut bmi,
            DIB_RGB_COLORS,
        )
    };

    let _ = unsafe { DeleteObject(HGDIOBJ(bmp.0)) };
    let _ = unsafe { DeleteDC(mem_dc) };
    unsafe { ReleaseDC(Option::from(hwnd), hdc) };

    let mut rgb_vec = Vec::with_capacity((rect.w * rect.h) as usize);
    for row in 0..rect.h {
        let offset = (row * row_bytes) as usize;
        for col in 0..rect.w {
            let i = offset + (col * 3) as usize;
            let b = pixels_bgr[i];
            let g = pixels_bgr[i + 1];
            let r = pixels_bgr[i + 2];
            rgb_vec.push(Rgb { r, g, b });
        }
    }

    Ok(rgb_vec)
}

pub fn read_colors() -> Result<ColorsJson> {
    let resource_path = get_resource_path()?;
    let json_path = resource_path.join("colors.json");
    let json_str = std::fs::read_to_string(json_path)?;
    let color_json: ColorsJson = serde_json::from_str(&json_str)?;
    Ok(color_json)
}

pub fn write_colors(mut colors_json: ColorsJson) -> Result<()> {
    colors_json.schema = Some("./colors.schema.json".to_string());
    let resource_path = get_resource_path()?;
    if !resource_path.exists() {
        std::fs::create_dir_all(&resource_path)?;
    }
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
