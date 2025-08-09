import {useCallback, useEffect, useRef, useState} from "react";
import {Rgb, commands, Color, ColorsJson} from "../bindings.ts";
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome'
import {faArrowsRotate, faSquarePlus} from '@fortawesome/free-solid-svg-icons'
import SortableContainer from "@/components/SortableContainer.tsx";
import {arrayMove, horizontalListSortingStrategy, SortableContext} from "@dnd-kit/sortable";
import {DndContext, DragEndEvent, DragStartEvent} from "@dnd-kit/core";
import ColorItemView from "@/components/ColorItemView.tsx";
import ColorCurItemView from "@/components/ColorCurItemView.tsx";
import {useColorNameStore} from "@/stores/colorNameStore.ts";
import {fromColor, fromHexColor, Hsl, hslToRgb, rgbToHsl} from "@/components/color.ts";


export type ColorItem = Color & {
  id: string
}

function ColorView() {
  const [inputColor, setInputColor] = useState<string>("#000000");
  const [inputColorRect, setInputColorRect] = useState<string[]>([]);
  const [inputHexString, setInputHexString] = useState<string>("#000000");
  const [inputR, setInputR] = useState<number>(0);
  const [inputG, setInputG] = useState<number>(0);
  const [inputB, setInputB] = useState<number>(0);
  const [inputH, setInputH] = useState<number>(0);
  const [inputS, setInputS] = useState<number>(0);
  const [inputL, setInputL] = useState<number>(0);
  const [inputX, setInputX] = useState<number>(0);
  const [inputY, setInputY] = useState<number>(0);
  const refInputX = useRef(inputX);
  const refInputY = useRef(inputY);
  const [colorsJson, setColorsJson] = useState<ColorsJson | undefined>(undefined);
  const [colorItems, setColorItems] = useState<ColorItem[] | undefined>(undefined);
  const [currentColorItem, setCurrentColorItem] = useState<ColorItem | undefined>(undefined);
  const colorName = useColorNameStore(state => state.colorName);
  const setColorName = useColorNameStore(state => state.setColorName);


  // const getPos = async () => {
  //   return commands.getMousePos().then((res) => {
  //     if (res.status === "ok") {
  //       return res.data;
  //     }
  //   });
  // }
  //
  // const getColor = async (pos: Pos) => {
  //   return commands.getColor(pos).then((res) => {
  //     if (res.status === "ok") {
  //       return res.data;
  //     }
  //   })
  // }

  const getMouseColor = () => {
    commands.getMousePos().then( (res) => {
      if (res.status == "error") {
        return;
      }
      const pos = res.data;
      setInputX(pos.x);
      setInputY(pos.y);
      commands.getColor(pos).then((res) => {
        if (res.status == "ok") {
          const color_capture = res.data;
          setInputColor(fromColor(color_capture.center_rgb));
          setInputColorRect(color_capture.rect_rgb.map(fromColor));
        }
      });
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
    const inputX = refInputX.current;
    const inputY = refInputY.current;
    if (inputX === undefined || inputY === undefined) {
      return;
    }
    commands.getColor({
      x: inputX,
      y: inputY
    }).then((res) => {
      if (res.status === "ok") {
        const color_capture = res.data;
        setInputColor(fromColor(color_capture.center_rgb));
        setInputColorRect(color_capture.rect_rgb.map(fromColor));
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

  const parseIntRange = (value: string, min: number, max: number): number => {
    if (value == undefined || value == "") return 0;
    let v = parseInt(value);
    v = Math.min(v, max);
    v = Math.max(v, min);
    return v;
  }

  const parseInteger = (value: string): number => {
    return parseInt(value) || 0;
  }

  const onChangeInputR = (r: string) => { setInputR(parseIntRange(r, 0, 255)) }
  const onChangeInputG = (g: string) => { setInputG(parseIntRange(g, 0, 255)) }
  const onChangeInputB = (b: string) => { setInputB(parseIntRange(b, 0, 255)) }
  const onChangeInputH = (h: string) => { setInputH(parseIntRange(h, 0, 360)) }
  const onChangeInputS = (s: string) => { setInputS(parseIntRange(s, 0, 100)) }
  const onChangeInputL = (l: string) => { setInputL(parseIntRange(l, 0, 100)) }
  const onChangeInputX = (x: string) => { setInputX(parseInteger(x)) }
  const onChangeInputY = (y: string) => { setInputY(parseInteger(y)) }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key == 'Control') {
      getMouseColor();
    } else if (e.key == 'Shift') {
      refreshPos();
    }
  }, [inputX, inputY])

  const readColors = () => {
    commands.readColors().then((res) => {
      if (res.status === "ok") {
        setColorsJson(res.data);
      } else {
        if (confirm("resources/ not found. create folder resources/ ?")) {
          setColorItems([]);
        }
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
    setColorItems(colorItems.filter((item: ColorItem) => item.id !== colorItem.id));
  }

  function handleDragStart(event: DragStartEvent) {
    if (event.active.id === "source") {
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

    if (activeId == "source" && currentColorItem !== undefined) {
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
    if (inputX == undefined || inputY == undefined) return;
    if (refInputX == undefined || refInputY == undefined) return;
    refInputX.current = inputX;
    refInputY.current = inputY;
  }, [inputX, inputY]);

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
      <div className="ctrl-pane">
        <div className="left-pane">
          <div className="info">Move Mouse & Press Ctrl</div>
          <div className="row">
            <div className="input color"><input type="color" value={inputColor} onChange={(e)=> onChangeInputColor(e.target.value)}/></div>
            <div className="input"><input type="text" value={inputHexString} onChange={(e) => onChangeInputHexString(e.target.value)}/></div>
            <div className="input">{inputHexString?.toUpperCase()}</div>
          </div>
          <div className="row">
            <div className="label-num">R:</div><div className="input"><input type="number" value={inputR ?? ""} min={0} max={255} onChange={(e) => onChangeInputR(e.target.value)} /></div>
            <div className="label-num">G:</div><div className="input"><input type="number" value={inputG ?? ""} min={0} max={255} onChange={(e) => onChangeInputG(e.target.value)}/></div>
            <div className="label-num">B:</div><div className="input"><input type="number" value={inputB ?? ""} min={0} max={255} onChange={(e) => onChangeInputB(e.target.value)}/></div>
            <div className="icon" onClick={() => refreshRgb()}><Icon icon={faArrowsRotate} /></div>
          </div>
          <div className="row">
            <div className="label-num">H:</div><div className="input"><input type="number" value={inputH ?? ""} min={0} max={360} onChange={(e) => onChangeInputH(e.target.value)} /></div>
            <div className="label-num">S:</div><div className="input"><input type="number" value={inputS ?? ""} min={0} max={100} onChange={(e) => onChangeInputS(e.target.value)}/></div>
            <div className="label-num">L:</div><div className="input"><input type="number" value={inputL ?? ""} min={0} max={100} onChange={(e) => onChangeInputL(e.target.value)}/></div>
            <div className="icon" onClick={() => refreshHls()}><Icon icon={faArrowsRotate} /></div>
          </div>
          <div className="row">
            <div className="label-num">X:</div><div className="input"><input type="number" value={inputX ?? ""} onChange={(e) => onChangeInputX(e.target.value)}/></div>
            <div className="label-num">Y:</div><div className="input"><input type="number" value={inputY ?? ""} onChange={(e) => onChangeInputY(e.target.value)}/></div>
            <div className="icon" onClick={() => refreshPos()} title="Press Shift"><Icon icon={faArrowsRotate} /></div>
          </div>

        </div>
        <div className="right-pane">
          <div className="grid-color">
            {inputColorRect?.map((hex_color, index) => {
              return (
                <div key={index} className="box"
                     style={{backgroundColor: hex_color}}
                     onClick={() => setInputColor(hex_color)}
                ></div>
              )
            })}
          </div>
        </div>
      </div>
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}>
          <SortableContainer id="target">
            {(inputColor != undefined && currentColorItem != undefined) && (
              <div className="current-color">
                <div className="icon" onClick={addColor}><Icon icon={faSquarePlus} /></div>
                <ColorCurItemView id="source"
                                  color={currentColorItem}
                />
              </div>
            )}
            <div className="color-list">
              {(colorItems != undefined) && (
              <SortableContext items={colorItems} strategy={horizontalListSortingStrategy}>
                {(colorItems).map((color, _index: number) => {
                  return (
                    <ColorItemView key={color.id} color={color} removeColorItem={removeColorItem} />
                  )
                })}
              </SortableContext>
              )}
            </div>
          </SortableContainer>
        </DndContext>
    </div>
  )
}

export default ColorView;