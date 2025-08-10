"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Activity, Ruler, Weight, Calendar } from "lucide-react"
import { growthApi } from "@/app/service/growth-api"

interface CreateGrowthRecordData {
  date: string
  height: number
  weight: number
  // Remove headCircumference and ageInMonths - backend calculates ageInMonths
}

interface AddGrowthRecordModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  childId: number
  childName: string
  adminId: string
  initialMonth?: number
}

export function AddGrowthRecordModal({
  open,
  onClose,
  onSuccess,
  childId,
  childName,
  adminId,
  initialMonth,
}: AddGrowthRecordModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    height: "",
    weight: "",
    // Remove ageInMonths and headCircumference
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (initialMonth) {
      // setFormData((prev) => ({ ...prev, ageInMonths: initialMonth.toString() }))
    }
  }, [initialMonth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const recordData: CreateGrowthRecordData = {
        date: formData.date,
        height: Number.parseFloat(formData.height),
        weight: Number.parseFloat(formData.weight),
        // Remove headCircumference and ageInMonths
      }

      // Call the actual API instead of simulation
      const response = await growthApi.addGrowthRecord(childId, recordData)

      setSuccess("Data pertumbuhan berhasil ditambahkan!")

      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        height: "",
        weight: "",
        // Remove ageInMonths and headCircumference
      })

      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Gagal menambahkan data pertumbuhan"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Activity className="h-4 w-4 text-orange-600" />
            </div>
            Tambah Data Pertumbuhan
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Menambahkan data untuk: <span className="font-semibold text-gray-800">{childName}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Tanggal Pengukuran *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
                disabled={loading}
                className="h-11"
                max={new Date().toISOString().split("T")[0]} // Prevent future dates
              />
            </div>

            {/* Height and Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-green-600" />
                  Tinggi (cm) *
                </Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="0.0"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  step="0.1"
                  min={0}
                  max={200}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Weight className="h-4 w-4 text-orange-600" />
                  Berat (kg) *
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="0.0"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  step="0.1"
                  min={0}
                  max={100}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11 bg-transparent"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.date || !formData.height || !formData.weight}
              className="flex-1 h-11 bg-orange-600 hover:bg-orange-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
