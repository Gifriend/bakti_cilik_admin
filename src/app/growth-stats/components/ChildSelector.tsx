"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Child } from "@/app/service/growth-api"

interface ChildSelectorProps {
  children: Child[]
  selectedChildId?: number
  onChildSelect: (childId: number) => void
}

export function ChildSelector({ children, selectedChildId, onChildSelect }: ChildSelectorProps) {
  return (
    <div className="w-full max-w-xs">
      <Select value={selectedChildId?.toString()} onValueChange={(value) => onChildSelect(Number.parseInt(value))}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih anak" />
        </SelectTrigger>
        <SelectContent>
          {children.map((child) => (
            <SelectItem key={child.id} value={child.id.toString()}>
              {child.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
