mod color;
mod err;
mod utils;

use tauri_specta::{collect_commands, Builder};
use crate::color::{Rgb, Pos, ColorsJson};
use crate::err::Result;
use crate::utils::get_resource_path;
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[tauri::command]
#[specta::specta]
async fn get_mouse_pos() -> Result<Pos> {
    color::get_mouse_pos()
}

#[tauri::command]
#[specta::specta]
async fn get_color(pos: Pos) -> Result<Rgb> {
    color::get_color(pos)
}

#[tauri::command]
#[specta::specta]
async fn read_colors() -> Result<ColorsJson> {
    color::read_colors()
}

#[tauri::command]
#[specta::specta]
async fn write_colors(colors_json: ColorsJson) -> Result<()> {
    color::write_colors(colors_json)
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = Builder::<tauri::Wry>::new().commands(collect_commands![
        get_mouse_pos,
        get_color,
        read_colors,
        write_colors,
    ]);

    #[cfg(debug_assertions)]
    {
        use specta_typescript::BigIntExportBehavior;
        use specta_typescript::Typescript;
        use std::path::Path;
        // use specta::TypeCollection;
        // use std::fs::OpenOptions;
        // use std::io::Write;
        // use crate::tasks::shell_task::TaskNotify;

        let bindings_path = Path::new("../src/bindings.ts");

        let ts = Typescript::default().bigint(BigIntExportBehavior::Number);
        builder
            .export(ts.clone(), bindings_path)
            .expect("Failed to export typescript bindings");

        // let mut types = TypeCollection::default();
        // types.register::<TaskNotify>();
        // let task_notify_str = ts.clone().export(&types).unwrap();
        // let mut file = OpenOptions::new()
        //     .append(true)
        //     .create(true)
        //     .open(bindings_path)
        //     .unwrap();
        // file.write_all(task_notify_str.as_bytes()).unwrap();

        let schema = schemars::schema_for!(ColorsJson);
        let json_schema = serde_json::to_string_pretty(&schema).unwrap();
        let resource_path = get_resource_path().expect("err get_resource_path");
        let setting_path = resource_path.join("colors.schema.json");

        let old_json_schema = if setting_path.exists() {
            std::fs::read_to_string(&setting_path).unwrap()
        } else {
            "".to_string()
        };

        if json_schema != old_json_schema {
            let _ =
                std::fs::write(setting_path.clone(), json_schema).map_err(|e| println!("{:?}", e));
        }

    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(builder.invoke_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
