"use client"

import { useState } from "react"
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableOverlay,
} from "./sortable"

const defaultItems = [
  { id: "1", title: "Item 1" },
  { id: "2", title: "Item 2" },
  { id: "3", title: "Item 3" },
  { id: "4", title: "Item 4" },
]

export function SortablePreview() {
  const [items, setItems] = useState(defaultItems)

  return (
    <Sortable
      value={items}
      onValueChange={setItems}
      getItemValue={(item) => item.id}
    >
      <SortableContent className="flex flex-col gap-2">
        {items.map((item) => (
          <SortableItem
            key={item.id}
            value={item.id}
            asHandle
            className="flex items-center gap-2 rounded-md border bg-background p-3"
          >
            <span className="text-sm">{item.title}</span>
          </SortableItem>
        ))}
      </SortableContent>
      <SortableOverlay>
        {({ value }) => {
          const item = items.find((i) => i.id === value)
          return item ? (
            <div className="flex items-center gap-2 rounded-md border bg-background p-3 shadow-lg">
              <span className="text-sm">{item.title}</span>
            </div>
          ) : null
        }}
      </SortableOverlay>
    </Sortable>
  )
}
