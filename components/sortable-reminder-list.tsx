"use client"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Reminder } from "@/app/page"
import ReminderCard from "./reminder-card"
import { GripVertical } from "lucide-react"

interface SortableItemProps {
  reminder: Reminder
  onToggle: (id: string) => void
  onPostpone: (id: string) => void
  onClear: (id: string) => void
  onComplete: (id: string) => void
  onPin: (id: string) => void
}

function SortableItem({
  reminder,
  onToggle,
  onPostpone,
  onClear,
  onComplete,
  onPin,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: reminder.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 cursor-grab active:cursor-grabbing z-10 opacity-40 hover:opacity-100 transition-opacity">
        <GripVertical className="w-5 h-5 text-slate-400" {...attributes} {...listeners} />
      </div>
      <ReminderCard
        reminder={reminder}
        onToggle={onToggle}
        onPostpone={onPostpone}
        onClear={onClear}
        onComplete={onComplete}
        onPin={onPin}
      />
    </div>
  )
}

interface SortableReminderListProps {
  items: Reminder[]
  onToggle: (id: string) => void
  onPostpone: (id: string) => void
  onClear: (id: string) => void
  onComplete: (id: string) => void
  onPin: (id: string) => void
  onReorder: (newOrder: Reminder[]) => void
}

export default function SortableReminderList({
  items,
  onToggle,
  onPostpone,
  onClear,
  onComplete,
  onPin,
  onReorder,
}: SortableReminderListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      // Separate pinned and unpinned items
      const pinned = items.filter((r) => r.pinned)
      const unpinned = items.filter((r) => !r.pinned)

      // Check if we're moving within pinned or unpinned sections
      const activeItem = items[oldIndex]
      const overItem = items[newIndex]

      // If trying to drag pinned item into unpinned section or vice versa, don't allow
      if (activeItem.pinned !== overItem.pinned) {
        return
      }

      // Reorder within the same section
      const newOrder = arrayMove(items, oldIndex, newIndex)
      onReorder(newOrder)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="grid gap-4">
          {items.map((reminder) => (
            <SortableItem
              key={reminder.id}
              reminder={reminder}
              onToggle={onToggle}
              onPostpone={onPostpone}
              onClear={onClear}
              onComplete={onComplete}
              onPin={onPin}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

