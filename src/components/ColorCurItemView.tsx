
import {CSS} from "@dnd-kit/utilities";
import {ColorItem} from "@/components/ColorView.tsx";
import {useDraggable} from "@dnd-kit/core";
import {useColorNameStore} from "@/stores/colorNameStore.ts";


type Props = {
  id: string,
  color: ColorItem
}
function ColorCurItemView({id, color}: Props) {
  const colorName = useColorNameStore(state => state.colorName);
  const setColorName = useColorNameStore(state => state.setColorName);

  const draggable = useDraggable({
    id
  });
  const mergedProps = {
    ...draggable.attributes,
    ...draggable.listeners,
  };

  const style = {
    // Outputs `translate3d(x, y, 0)`
    transform: CSS.Translate.toString(draggable.transform),
  };

  return (
    <div id={color.hex_color}
         ref={(node) => {
           draggable.setNodeRef(node);
         }}
         style={{
          ...style,
           width: "100%",
         }}
    >
      <div className="color-cur-item">
        <div className="color-bg"
             style={{backgroundColor: color.hex_color}}
             {...mergedProps}
        ></div>
        <div className="color-hex"
             {...mergedProps}
        >
          {color.hex_color}
        </div>
        <div className="color-name"
        >
          <input type="text"
                 value={colorName}
                 onChange={(e) => setColorName(e.target.value)} />
        </div>
      </div>
    </div>
  )
}

export default ColorCurItemView;

