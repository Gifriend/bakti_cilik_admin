"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { adminApi, type CreateChildData, type Parent } from "@/app/service/admin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, UserPlus, Calendar, User, Baby, Search, AlertCircle, CreditCard } from "lucide-react"

interface AddChildFormProps {
  onSuccess: () => void
  onCancel: () => void
  adminId: string
}

interface FormData {
  name: string
  gender: "L" | "P" | ""
  dob: string
  nik: string // Added NIK field
  parentId: string
}

export function AddChildForm({ onSuccess, onCancel, adminId }: AddChildFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    gender: "",
    dob: "",
    nik: "", // Added NIK field
    parentId: "",
  })
  const [parents, setParents] = useState<Parent[]>([])
  const [parentSearch, setParentSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingParents, setLoadingParents] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load parents with optional search query
  const loadParents = async (searchQuery = "") => {
    try {
      setLoadingParents(true)
      setError("") // Clear any previous errors

      const parentsData = await adminApi.getParents({
        q: searchQuery,
        limit: 50, // Get more results for better search experience
      })

      setParents(parentsData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memuat data orang tua"
      console.error("Error loading parents:", error)
      setError(errorMessage)
      setParents([]) // Clear parents on error
    } finally {
      setLoadingParents(false)
    }
  }

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setParentSearch(value)

    // Clear selected parent if search changes
    if (formData.parentId) {
      setFormData((prev) => ({ ...prev, parentId: "" }))
    }

    // Debounce API calls to avoid too many requests
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadParents(value)
    }, 300) // 300ms debounce
  }

  // Load initial data on component mount
  useEffect(() => {
    loadParents() // Load initial data without search query

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // NIK validation function
  const validateNIK = (nik: string): boolean => {
    // NIK should be exactly 16 digits
    const nikRegex = /^\d{16}$/
    return nikRegex.test(nik)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error("Nama anak harus diisi")
      }
      if (!formData.gender) {
        throw new Error("Jenis kelamin harus dipilih")
      }
      if (!formData.dob) {
        throw new Error("Tanggal lahir harus diisi")
      }
      if (!formData.nik.trim()) {
        throw new Error("NIK harus diisi")
      }
      if (!validateNIK(formData.nik.trim())) {
        throw new Error("NIK harus berupa 16 digit angka")
      }
      if (!formData.parentId) {
        throw new Error("Orang tua harus dipilih")
      }

      const childData: CreateChildData = {
        name: formData.name.trim(),
        dob: formData.dob,
        nik: formData.nik.trim(), // Added NIK
        gender: formData.gender as "L" | "P",
        userId: Number.parseInt(formData.parentId),
      }

      const response = await adminApi.addChild(childData)
      setSuccess("Data anak berhasil ditambahkan!")

      // Reset form
      setFormData({
        name: "",
        gender: "",
        dob: "",
        nik: "", // Reset NIK
        parentId: "",
      })
      setParentSearch("")

      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menambahkan data anak"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const selectedParent = parents.find((parent) => parent.id.toString() === formData.parentId)

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-green-600" />
            </div>
            Tambah Data Anak Baru
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* Parent Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b pb-2">
              <User className="h-5 w-5 text-purple-600" />
              Pilih Orang Tua
            </div>

            <div className="space-y-3">
              <Label htmlFor="parentSearch" className="text-sm font-medium text-gray-700">
                Cari Orang Tua *
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="parentSearch"
                  type="text"
                  placeholder="Cari berdasarkan nama atau email..."
                  value={parentSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  disabled={loading}
                  className="h-11 pl-10"
                />
              </div>

              {loadingParents ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">Mencari data orang tua...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Pilih dari daftar:</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {parents.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {parentSearch ? "Tidak ada orang tua yang cocok dengan pencarian" : "Tidak ada data orang tua"}
                      </div>
                    ) : (
                      parents.map((parent) => (
                        <div
                          key={parent.id}
                          className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
                            formData.parentId === parent.id.toString() ? "bg-blue-50 border-blue-200" : ""
                          }`}
                          onClick={() => handleInputChange("parentId", parent.id.toString())}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{parent.name}</div>
                              <div className="text-sm text-gray-500">{parent.email}</div>
                            </div>
                            {formData.parentId === parent.id.toString() && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {selectedParent && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-800">Orang tua terpilih:</div>
                  <div className="text-sm text-blue-600">
                    {selectedParent.name} ({selectedParent.email})
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Child Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b pb-2">
              <Baby className="h-5 w-5 text-blue-600" />
              Informasi Anak
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nama Lengkap Anak *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Masukkan nama lengkap anak"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                  Jenis Kelamin *
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange("gender", value)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nik" className="text-sm font-medium text-gray-700">
                  NIK (Nomor Induk Kependudukan) *
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="nik"
                    type="text"
                    placeholder="Masukkan 16 digit NIK"
                    value={formData.nik}
                    onChange={(e) => {
                      // Only allow numbers and limit to 16 characters
                      const value = e.target.value.replace(/\D/g, "").slice(0, 16)
                      handleInputChange("nik", value)
                    }}
                    required
                    disabled={loading}
                    className="h-11 pl-10"
                    maxLength={16}
                  />
                </div>
                <p className="text-xs text-gray-500">NIK harus berupa 16 digit angka</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob" className="text-sm font-medium text-gray-700">
                  Tanggal Lahir *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleInputChange("dob", e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 pl-10"
                    max={new Date().toISOString().split("T")[0]} // Prevent future dates
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 h-11 bg-transparent"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.name.trim() ||
                !formData.gender ||
                !formData.dob ||
                !formData.nik.trim() ||
                !validateNIK(formData.nik.trim()) ||
                !formData.parentId ||
                loadingParents
              }
              className="flex-1 h-11 bg-green-600 hover:bg-green-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Menyimpan..." : "Tambah Anak"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
