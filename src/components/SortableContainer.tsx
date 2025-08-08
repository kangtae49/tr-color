import {useDroppable} from "@dnd-kit/core";
import React from "react";

type Prop = {
  id: string,
  children: React.ReactNode
}
function SortableContainer({id, children}: Prop) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div className="color-list-con" ref={setNodeRef} >
      {children}
    </div>
  )
}

export default SortableContainer;
