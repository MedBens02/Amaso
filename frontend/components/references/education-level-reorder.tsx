"use client"

import React, { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GripVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EducationLevel {
  id: number
  name_ar: string
  name_en?: string
  sort_order: number
  is_active: boolean
}

interface EducationLevelReorderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  educationLevels: EducationLevel[]
  onReorderSuccess: () => void
}

function SortableItem({ id, item }: { id: string; item: EducationLevel }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="touch-none"
    >
      <Card className="p-4 mb-2">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-right">{item.name_ar}</div>
            {item.name_en && (
              <div className="text-sm text-gray-500 text-right">{item.name_en}</div>
            )}
          </div>
          <div className="text-sm text-gray-500">
            الترتيب: {item.sort_order}
          </div>
        </div>
      </Card>
    </div>
  )
}

export function EducationLevelReorder({
  open,
  onOpenChange,
  educationLevels,
  onReorderSuccess,
}: EducationLevelReorderProps) {
  const [items, setItems] = useState<EducationLevel[]>(
    [...educationLevels].sort((a, b) => a.sort_order - b.sort_order)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  React.useEffect(() => {
    if (open) {
      setItems([...educationLevels].sort((a, b) => a.sort_order - b.sort_order))
    }
  }, [open, educationLevels])

  function handleDragEnd(event: any) {
    const { active, over } = event

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id.toString() === active.id)
        const newIndex = items.findIndex((item) => item.id.toString() === over.id)
        
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Update sort_order based on new positions
        return newItems.map((item, index) => ({
          ...item,
          sort_order: index + 1
        }))
      })
    }
  }

  const handleSaveOrder = async () => {
    setIsSubmitting(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      // Send the new order to the backend
      const response = await fetch(`${baseUrl}/references/education-levels/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          items: items.map((item, index) => ({
            id: item.id,
            sort_order: index + 1
          }))
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث ترتيب المراحل التعليمية بنجاح",
      })
      
      onReorderSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving order:', error)
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ في حفظ الترتيب",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>إعادة ترتيب المراحل التعليمية</DialogTitle>
          <DialogDescription>
            اسحب العناصر لإعادة ترتيبها، ثم اضغط حفظ لتطبيق الترتيب الجديد
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map(item => item.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <SortableItem
                  key={item.id}
                  id={item.id.toString()}
                  item={item}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleSaveOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ الترتيب'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}