"use client"

import { useState, useEffect } from "react"
import { addGrowthRecord } from "@/lib/firestore"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface AddGrowthRecordModalProps {
  open: boolean
  onClose: () => void
  childId: string
  childName: string
  adminId: string
  initialMonth?: number
  onSuccess: () => void
}

export default function AddGrowthRecordModal({
  open,
  onClose,
  childId,
  childName,
  adminId,
  initialMonth,
  onSuccess,
}: AddGrowthRecordModalProps) {
  const [month, setMonth] = useState(initialMonth?.toString() ?? "")
  const [height, setHeight] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialMonth) setMonth(initialMonth.toString())
  }, [initialMonth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const monthNum = parseInt(month)
      if (isNaN(monthNum)) throw new Error("Invalid month")

      await addGrowthRecord(childId, {
        height,
        month: monthNum,
        inputBy: adminId,
      })

      setSuccess("Growth record added successfully!")
      setHeight("")

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1200)
    } catch (err: any) {
      setError(err.message || "Failed to add growth record")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Growth Record - {childName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Age (months) *</Label>
              <Input
                id="month"
                type="number"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={loading || !!initialMonth}
                min={1}
                max={60}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm) *</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                step="0.1"
                min={0}
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : "Add Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
