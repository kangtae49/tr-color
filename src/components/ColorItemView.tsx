import {FontAwesomeIcon as Icon} from "@fortawesome/react-fontawesome";
import {faCircleXmark} from "@fortawesome/free-solid-svg-icons";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {ColorItem} from "@/components/ColorView.tsx";

type Props = {
  color: ColorItem
  removeColorItem: (colorItem: ColorItem) => void
}
function ColorItemView({color, removeColorItem}: Props) {
  const sortable = useSortable({
    id: color.id,
  });
  const mergedProps = {
    ...sortable.attributes,
    ...sortable.listeners,
  };

  const style = {
    // Outputs `translate3d(x, y, 0)`
    transform: CSS.Translate.toString(sortable.transform),
  };

  return (
    <div className="color-item"
         ref={(node) => {
          sortable.setNodeRef(node);
         }}
         style={style}
    >
      <div className="color-bg" style={{backgroundColor: color.hex_color}} ></div>
      <div className="color-hex"
           {...mergedProps}
      >
        {color.hex_color}
      </div>
      <div className="color-name"
           {...mergedProps}
           title={color.name || ""}
      >
        {color.name || ""}
      </div>
      <div className="color-close" onClick={() => removeColorItem(color)}><Icon icon={faCircleXmark} /></div>
    </div>
  )
}

export default ColorItemView;

