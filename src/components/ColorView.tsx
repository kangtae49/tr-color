import {useEffect, useState} from "react";
import {Rgb, commands, Pos, Color, ColorsJson} from "../bindings.ts";
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome'
import {faArrowsRotate, faSquarePlus} from '@fortawesome/free-solid-svg-icons'
import SortableContainer from "@/components/SortableContainer.tsx";
import {arrayMove, horizontalListSortingStrategy, SortableContext} from "@dnd-kit/sortable";
import {DndContext, DragEndEvent, DragStartEvent} from "@dnd-kit/core";
import ColorItemView from "@/components/ColorItemView.tsx";
import ColorCurItemView from "@/components/ColorCurItemView.tsx";
import {useColorNameStore} from "@/stores/colorNameStore.ts";


function fromColor(rgb: Rgb): string {
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function fromHexColor(hex: string): Rgb | undefined {
  hex = hex.replace(/^#/, '');

  if (hex.length !== 6) {
    return undefined;
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return { r, g, b };
}

type Hsl = { h: number; s: number; l: number };

function rgbToHsl(rgb: Rgb): Hsl {
  let {r, g, b} = rgb;

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0));
        break;
      case g:
        h = ((b - r) / d + 2);
        break;
      case b:
        h = ((r - g) / d + 4);
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),    // Hue: 0~360
    s: Math.round(s * 100),    // Saturation: 0~100%
    l: Math.round(l * 100),    // Lightness: 0~100%
  };
}

function hslToRgb(hsl: Hsl): Rgb {
  let { h, s, l } = hsl;
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r, g, b;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export type ColorItem = Color & {
  id: string
}

function ColorView() {
  const [inputColor, setInputColor] = useState<string | undefined>("#000000");
  const [inputHexString, setInputHexString] = useState<string | undefined>("#000000");
  const [inputR, setInputR] = useState<number | undefined>(0);
  const [inputG, setInputG] = useState<number | undefined>(0);
  const [inputB, setInputB] = useState<number | undefined>(0);
  const [inputH, setInputH] = useState<number | undefined>(0);
  const [inputS, setInputS] = useState<number | undefined>(0);
  const [inputL, setInputL] = useState<number | undefined>(0);
  const [inputX, setInputX] = useState<number | undefined>(0);
  const [inputY, setInputY] = useState<number | undefined>(0);
  const [colorsJson, setColorsJson] = useState<ColorsJson | undefined>(undefined);
  const [colorItems, setColorItems] = useState<ColorItem[] | undefined>(undefined);
  const [currentColorItem, setCurrentColorItem] = useState<ColorItem | undefined>(undefined);
  const colorName = useColorNameStore(state => state.colorName);
  const setColorName = useColorNameStore(state => state.setColorName);


  const getPos = async () => {
    return commands.getMousePos().then((res) => {
      if (res.status === "ok") {
        return res.data;
      }
    });
  }

  const getColor = async (pos: Pos) => {
    return commands.getColor(pos).then((res) => {
      if (res.status === "ok") {
        return res.data;
      }
    })
  }

  const getMouseColor = () => {
    getPos().then((pos) => {
      if (pos) {
        setInputX(pos.x);
        setInputY(pos.y);
        getColor(pos).then((color) => {
          if (color === undefined) return;
          setInputColor(fromColor(color));
        });
      }
    });
  }

  const refreshRgb = () => {
    if (inputR === undefined || inputG === undefined || inputB === undefined) return;
    const rgb: Rgb = {r: inputR, g: inputG, b: inputB};
    setInputColor(fromColor(rgb))
  }

  const refreshHls = () => {
    if (inputH === undefined || inputS === undefined || inputL === undefined) return;
    const hsl: Hsl = {h: inputH, s: inputS, l: inputL};
    const rgb = hslToRgb(hsl);
    setInputColor(fromColor(rgb))
  }

  const refreshPos = () => {
    if (inputX === undefined || inputY === undefined) return;
    commands.getColor({
      x: inputX,
      y: inputY
    }).then((res) => {
      if (res.status === "ok") {
        const color = res.data;
        setInputColor(fromColor(color));
      }
    })
  }

  const onChangeInputColor = (hexColor: string) => {
    setInputColor(hexColor);
    const color = fromHexColor(hexColor);
    if (color === undefined) return;
    setInputR(color.r);
    setInputG(color.g);
    setInputB(color.b);
  }

  const onChangeInputHexString = (hexString: string) => {
    setInputHexString(hexString);
    if (hexString.startsWith('#') && hexString.length === 7) {
      setInputColor(hexString);
    }
  }

  const parseIntRange = (value: string | undefined, min: number, max: number): number | undefined => {
    if (value == undefined || value == "") return undefined;
    let v = parseInt(value);
    v = Math.min(v, max);
    v = Math.max(v, min);
    return v;
  }

  const parseInteger = (value: string | undefined): number | undefined => {
    if (value == undefined || value == "") return undefined;
    return parseInt(value);
  }

  const onChangeInputR = (r: string | undefined) => { setInputR(parseIntRange(r, 0, 255)) }
  const onChangeInputG = (g: string | undefined) => { setInputG(parseIntRange(g, 0, 255)) }
  const onChangeInputB = (b: string | undefined) => { setInputB(parseIntRange(b, 0, 255)) }
  const onChangeInputH = (h: string | undefined) => { setInputH(parseIntRange(h, 0, 360)) }
  const onChangeInputS = (s: string | undefined) => { setInputS(parseIntRange(s, 0, 100)) }
  const onChangeInputL = (l: string | undefined) => { setInputL(parseIntRange(l, 0, 100)) }
  const onChangeInputX = (x: string | undefined) => { setInputX(parseInteger(x)) }
  const onChangeInputY = (y: string | undefined) => { setInputY(parseInteger(y)) }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key == 'Alt') {
      getMouseColor();
    }
  }

  const readColors = () => {
    commands.readColors().then((res) => {
      if (res.status === "ok") {
        setColorsJson(res.data);
      }
    });
  }
  const addColor = () => {
    if (colorItems == undefined || currentColorItem === undefined) return;


    if (!colorItems.find((color) => color.id === currentColorItem.id)) {
      setColorItems([
        currentColorItem,
        ...colorItems,
      ])
    }
  }



  const removeColorItem = (colorItem: ColorItem) => {
    if (colorItems === undefined) return;
    console.log('remove color: ', colorItem);
    setColorItems(colorItems.filter((item: ColorItem) => item.id !== colorItem.id));
  }

  function handleDragStart(event: DragStartEvent) {
    console.log(event);
    if (event.active.id === "DRAGGABLE") {
      return;
    }

    const findItem = colorItems?.find((c) => c.id == event.active.id);
    if (findItem) {
      setInputColor(findItem.hex_color);
      setColorName(findItem.name || "");
    }

  }

  function handleDragEnd(event: DragEndEvent) {
    if (colorItems === undefined) return;
    const { active, over } = event;

    if (!over) {
      return;
    }

    let activeId = active.id.toString();
    let overId = over.id.toString();

    if (activeId == "DRAGGABLE" && currentColorItem !== undefined) {
      if (!colorItems.find((c) => c.id == getColorId(currentColorItem))) {
        colorItems.push(currentColorItem);
        // setColorItems(colorItems);
        activeId = getColorId(currentColorItem);
      }
    }
    if (overId == 'target') {
      const last = colorItems.slice(-1);
      if (last.length > 0) {
        overId = last[0].id;
      }
    }
    const activeIndex = colorItems.findIndex((item) => item.id === activeId);
    const overIndex = colorItems.findIndex((item) => item.id === overId);
    if (activeIndex !== -1 && overIndex !== -1) {
      const sortedItem = arrayMove<ColorItem>(colorItems || [], activeIndex, overIndex);
      setColorItems(sortedItem);
    }

  }

  function getColorId (color: ColorItem | Color) {
    if (color.name != undefined && color.name != "") {
      return `${color.hex_color}_${color.name}`;
    }
    return color.hex_color;
  }

  useEffect(() => {
    if (inputColor === undefined) return;
    setInputHexString(inputColor);
    const color = fromHexColor(inputColor);
    if (color === undefined) return;
    setInputR(color.r);
    setInputG(color.g);
    setInputB(color.b);
    const hsl = rgbToHsl(color);
    setInputH(hsl.h);
    setInputS(hsl.s);
    setInputL(hsl.l);

    let colorId;
    if (colorName == undefined || colorName == "") {
      colorId = inputColor;
    } else {
      colorId = `${inputColor}_${colorName}`;
    }
    setCurrentColorItem({
      id: colorId,
      hex_color: inputColor,
      name: colorName,
    });
  }, [inputColor, colorName])

  useEffect(() => {
    if (colorsJson?.colors === undefined) return;
    const colorItems: ColorItem[] = colorsJson.colors.map( (c: Color) => {
      let colorId = getColorId(c);

      return ({
        id: colorId,
        ...c
      })
    });
    setColorItems(colorItems)
  }, [colorsJson]);

  useEffect(() => {
    if (colorItems == undefined) return;
    commands.writeColors({
      colors: colorItems
    }).then((res) => {
      if (res.status == 'ok') {
        console.log('save color');
      }
    })
  }, [colorItems]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    getMouseColor();
    readColors();

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="color-pane">
      <div className="info">Move Mouse & Press Alt</div>
      <div className="row">
        <div className="input color"><input type="color" value={inputColor} onChange={(e)=> onChangeInputColor(e.target.value)}/></div>
        <div className="input"><input type="text" value={inputHexString} onChange={(e) => onChangeInputHexString(e.target.value)}/></div>
        <div className="input">{inputHexString?.toUpperCase()}</div>
      </div>
      <div className="row">
        <div className="label-num">R:</div><div className="input"><input type="number" value={inputR ?? ""} min={0} max={255} onChange={(e) => onChangeInputR(e.target.value)} /></div>
        <div className="label-num">G:</div><div className="input"><input type="number" value={inputG ?? ""} min={0} max={255} onChange={(e) => onChangeInputG(e.target.value)}/></div>
        <div className="label-num">B:</div><div className="input"><input type="number" value={inputB ?? ""} min={0} max={255} onChange={(e) => onChangeInputB(e.target.value)}/></div>
        <div className="icon" onClick={refreshRgb}><Icon icon={faArrowsRotate} /></div>
      </div>
      <div className="row">
        <div className="label-num">H:</div><div className="input"><input type="number" value={inputH ?? ""} min={0} max={360} onChange={(e) => onChangeInputH(e.target.value)} /></div>
        <div className="label-num">S:</div><div className="input"><input type="number" value={inputS ?? ""} min={0} max={100} onChange={(e) => onChangeInputS(e.target.value)}/></div>
        <div className="label-num">L:</div><div className="input"><input type="number" value={inputL ?? ""} min={0} max={100} onChange={(e) => onChangeInputL(e.target.value)}/></div>
        <div className="icon" onClick={refreshHls}><Icon icon={faArrowsRotate} /></div>
      </div>
      <div className="row">
        <div className="label-num">X:</div><div className="input"><input type="number" value={inputX ?? ""} onChange={(e) => onChangeInputX(e.target.value)}/></div>
        <div className="label-num">Y:</div><div className="input"><input type="number" value={inputY ?? ""} onChange={(e) => onChangeInputY(e.target.value)}/></div>
        <div className="icon" onClick={refreshPos}><Icon icon={faArrowsRotate} /></div>
      </div>
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}>
          {(inputColor != undefined && currentColorItem != undefined) && (
          <div className="row">
            <div className="icon" onClick={addColor}><Icon icon={faSquarePlus} /></div>
            <ColorCurItemView
              color={currentColorItem}
            />
          </div>
          )}
        { (colorItems != undefined) && (
          <SortableContainer id="target">
            <div className="color-list">
                <SortableContext items={colorItems} strategy={horizontalListSortingStrategy}>
                {(colorItems).map((color, _index: number) => {
                  return (
                    <ColorItemView key={color.id} color={color} removeColorItem={removeColorItem} />
                  )
                })}
                </SortableContext>
            </div>
          </SortableContainer>
        )}
        </DndContext>
    </div>
  )
}

export default ColorView;