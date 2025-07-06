"use client"

import type React from "react"

import { useState } from "react"
import { addGrowthRecord } from "@/lib/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, X, TrendingUp } from "lucide-react"

interface AddGrowthRecordFormProps {
  childId: string
  childName: string
  adminId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function AddGrowthRecordForm({
  childId,
  childName,
  adminId,
  onSuccess,
  onCancel,
}: AddGrowthRecordFormProps) {
  const [height, setHeight] = useState("")
  const [month, setMonth] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      await addGrowthRecord(childId, {
        height,
        month: Number.parseInt(month),
        inputBy: adminId,
      })

      setSuccess("Growth record added successfully!")
      setHeight("")
      setMonth("")

      // Auto close after success
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (error: any) {
      setError(error.message || "Failed to add growth record")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-orange-200">
      <CardHeader className="bg-orange-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <TrendingUp className="h-5 w-5" />
            Add Growth Record - {childName}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
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
              <Label htmlFor="height">Height (cm) *</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 70.5"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Age (months) *</Label>
              <Input
                id="month"
                type="number"
                min="0"
                max="240"
                placeholder="e.g. 12"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Adding..." : "Add Record"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
