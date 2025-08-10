"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Activity, Ruler, Weight, Calendar, User } from "lucide-react"

interface CreateGrowthRecordData {
  date: string
  height: number
  weight: number
  headCircumference?: number
  ageInMonths: number
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
    ageInMonths: initialMonth?.toString() || "",
    height: "",
    weight: "",
    headCircumference: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (initialMonth) {
      setFormData((prev) => ({ ...prev, ageInMonths: initialMonth.toString() }))
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
        ageInMonths: Number.parseInt(formData.ageInMonths),
        ...(formData.headCircumference && { headCircumference: Number.parseFloat(formData.headCircumference) }),
      }

      // Call the growth API to add record
      // Note: You'll need to create this endpoint in your backend
      // await growthApi.addGrowthRecord(childId, recordData)

      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSuccess("Data pertumbuhan berhasil ditambahkan!")

      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        ageInMonths: "",
        height: "",
        weight: "",
        headCircumference: "",
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

            {/* Age in Months */}
            <div className="space-y-2">
              <Label htmlFor="ageInMonths" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-purple-600" />
                Usia (bulan) *
              </Label>
              <Input
                id="ageInMonths"
                type="number"
                placeholder="Masukkan usia dalam bulan"
                value={formData.ageInMonths}
                onChange={(e) => handleInputChange("ageInMonths", e.target.value)}
                required
                disabled={loading || !!initialMonth}
                min={0}
                max={60}
                className="h-11"
              />
              <p className="text-xs text-gray-500">Usia anak saat pengukuran (0-60 bulan)</p>
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

            {/* Head Circumference (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="headCircumference" className="text-sm font-medium text-gray-700">
                Lingkar Kepala (cm) - Opsional
              </Label>
              <Input
                id="headCircumference"
                type="number"
                placeholder="0.0"
                value={formData.headCircumference}
                onChange={(e) => handleInputChange("headCircumference", e.target.value)}
                step="0.1"
                min={0}
                max={100}
                disabled={loading}
                className="h-11"
              />
              <p className="text-xs text-gray-500">Lingkar kepala anak (opsional)</p>
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
              disabled={loading || !formData.date || !formData.ageInMonths || !formData.height || !formData.weight}
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
