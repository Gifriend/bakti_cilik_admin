"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Activity, Ruler, Weight, Calendar, Baby, Search } from "lucide-react"
import { growthApi, type CreateGrowthRecordData, type ChildInfo } from "@/app/service/growth-api"
import { ChildSearchModal } from "./ChildSearchModal"

interface AddGrowthRecordModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  childId?: number
  childName?: string
  childNIK?: string
  adminId?: string
  initialMonth?: number
  allowChildSelection?: boolean // New prop to enable child selection
}

export function AddGrowthRecordModal({
  open,
  onClose,
  onSuccess,
  childId,
  childName,
  childNIK,
  adminId,
  initialMonth,
  allowChildSelection = false,
}: AddGrowthRecordModalProps) {
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null)
  const [showChildSearch, setShowChildSearch] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    height: "",
    weight: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        height: "",
        weight: "",
      })
      setError("")
      setSuccess("")

      // If childId is provided, don't show child selection
      if (childId && childName) {
        setSelectedChild({
          id: childId,
          name: childName,
          nik: childNIK || "",
          dob: "",
          gender: "MALE", // Default, will be updated if needed
        })
      } else if (allowChildSelection) {
        setSelectedChild(null)
      }
    }
  }, [open, childId, childName, childNIK, allowChildSelection])

  // Set initial date based on month if provided
  useEffect(() => {
    if (initialMonth && open) {
      // Calculate approximate date for the given month
      const today = new Date()
      const approximateDate = new Date(today.getFullYear(), today.getMonth() - (24 - initialMonth), 1)
      setFormData((prev) => ({
        ...prev,
        date: approximateDate.toISOString().split("T")[0],
      }))
    }
  }, [initialMonth, open])

  const handleChildSelect = (child: ChildInfo) => {
    setSelectedChild(child)
    setShowChildSearch(false)
  }

  const calculateAge = (dob: string) => {
    if (!dob) return 0
    const birth = new Date(dob)
    const now = new Date()
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    return months
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      // Validate child selection
      const targetChildId = selectedChild?.id || childId
      if (!targetChildId) {
        throw new Error("Silakan pilih anak terlebih dahulu")
      }

      // Validate input
      const height = Number.parseFloat(formData.height)
      const weight = Number.parseFloat(formData.weight)

      if (isNaN(height) || height <= 0 || height > 200) {
        throw new Error("Tinggi badan harus antara 0-200 cm")
      }

      if (isNaN(weight) || weight <= 0 || weight > 100) {
        throw new Error("Berat badan harus antara 0-100 kg")
      }

      // Validate date
      const selectedDate = new Date(formData.date)
      const today = new Date()
      if (selectedDate > today) {
        throw new Error("Tanggal pengukuran tidak boleh di masa depan")
      }

      const recordData: CreateGrowthRecordData = {
        date: formData.date,
        height: height,
        weight: weight,
      }

      // Call the API to add growth record
      await growthApi.addGrowthRecord(targetChildId, recordData)

      setSuccess("Data pertumbuhan berhasil ditambahkan!")

      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        height: "",
        weight: "",
      })

      // Close modal and refresh data after short delay
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (err: any) {
      console.error("Error adding growth record:", err)
      const errorMessage = err.message || "Gagal menambahkan data pertumbuhan"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid = formData.date && formData.height && formData.weight && (selectedChild?.id || childId)

  const displayChild =
    selectedChild || (childId && childName ? { id: childId, name: childName, nik: childNIK || "" } : null)

  return (
    <>
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
              {displayChild ? (
                <>
                  Menambahkan data untuk: <span className="font-semibold text-gray-800">{displayChild.name}</span>
                  {displayChild.nik && <span className="text-blue-600"> • NIK: {displayChild.nik}</span>}
                  {initialMonth && <span className="text-orange-600"> • Bulan ke-{initialMonth}</span>}
                </>
              ) : (
                "Pilih anak dan tambahkan data pertumbuhan"
              )}
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

            {/* Child Selection */}
            {allowChildSelection && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Pilih Anak *</Label>
                {displayChild ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Baby className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-blue-900">{displayChild.name}</div>
                          {displayChild.nik && <div className="text-xs text-blue-700">NIK: {displayChild.nik}</div>}
                          {selectedChild?.dob && (
                            <div className="text-xs text-blue-600">Usia: {calculateAge(selectedChild.dob)} bulan</div>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowChildSearch(true)}
                        className="bg-transparent"
                      >
                        Ganti
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowChildSearch(true)}
                    className="w-full h-11 bg-transparent border-dashed border-2"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Pilih Anak
                  </Button>
                )}
              </div>
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
                disabled={loading || !isFormValid}
                className="flex-1 h-11 bg-orange-600 hover:bg-orange-700"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Menyimpan..." : "Simpan Data"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Child Search Modal */}
      <ChildSearchModal
        open={showChildSearch}
        onClose={() => setShowChildSearch(false)}
        onSelectChild={handleChildSelect}
        title="Pilih Anak untuk Data Pertumbuhan"
        description="Cari dan pilih anak yang akan ditambahkan data pertumbuhan"
      />
    </>
  )
}
