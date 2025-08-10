"use client"

import { useState, useEffect } from "react"
import { addGrowthRecord } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface AddGrowthRecordModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  childId: string
  childName: string
  adminId: string
  initialMonth?: number
}

export default function AddGrowthRecordModal({
  open,
  onClose,
  onSuccess,
  childId,
  childName,
  adminId,
  initialMonth,
}: AddGrowthRecordModalProps) {
  const [height, setHeight] = useState("")
  const [month, setMonth] = useState(initialMonth?.toString() || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

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
        setSuccess("")
        onSuccess()
        onClose()
      }, 1000)
    } catch (err: any) {
      setError(err.message || "Failed to add growth record")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add Growth Record for {childName}</DialogTitle>
          </DialogHeader>

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

          <div className="space-y-2">
            <Label htmlFor="month">Age (months)</Label>
            <Input
              id="month"
              type="number"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
              disabled={loading || !!initialMonth}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
