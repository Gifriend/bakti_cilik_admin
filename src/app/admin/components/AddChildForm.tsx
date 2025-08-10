"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { adminApi, type CreateChildRequest, type Parent, type GenderEnum } from "@/app/service/admin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Loader2,
  UserPlus,
  Calendar,
  User,
  Baby,
  Search,
  AlertCircle,
  CreditCard,
  CheckCircle,
  Bug,
  Info,
  Users,
} from "lucide-react"

interface AddChildFormProps {
  onSuccess: () => void
  onCancel: () => void
  adminId: string
  // Add prop to pass parents data from admin page
  existingParents?: Parent[]
}

interface FormData {
  name: string
  gender: GenderEnum | ""
  dob: string
  nik: string
  parentId: string
}

interface NIKValidation {
  isValidating: boolean
  isValid: boolean | null
  message: string
}

export function AddChildForm({ onSuccess, onCancel, adminId, existingParents }: AddChildFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    gender: "",
    dob: "",
    nik: "",
    parentId: "",
  })
  const [parents, setParents] = useState<Parent[]>([])
  const [allParents, setAllParents] = useState<Parent[]>([]) // Store all parents for consistent counting
  const [parentSearch, setParentSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingParents, setLoadingParents] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [debugMode, setDebugMode] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [nikValidation, setNikValidation] = useState<NIKValidation>({
    isValidating: false,
    isValid: null,
    message: "",
  })

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const nikValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Add debug log function
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setDebugInfo((prev) => [...prev.slice(-4), logMessage]) // Keep last 5 logs
  }

  // Test API connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        addDebugLog("Testing API connection...")
        await adminApi.testConnection()
        addDebugLog("✅ API connection successful")
      } catch (error) {
        addDebugLog(`❌ API connection failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
    testConnection()
  }, [])

  // Load all parents first (for consistent counting), then filter for display
  const loadAllParents = async () => {
    try {
      setLoadingParents(true)
      setError("")
      addDebugLog("Loading all parents for consistent counting...")

      // If existingParents is provided from admin page, use it
      if (existingParents && existingParents.length > 0) {
        addDebugLog(`✅ Using existing parents data: ${existingParents.length} parents`)
        setAllParents(existingParents)
        setParents(existingParents) // Show all initially
        return
      }

      // Otherwise, load from API with high limit to get all parents
      const allParentsData = await adminApi.getParents({
        q: "", // No search query to get all
        limit: 1000, // High limit to get all parents
      })

      setAllParents(allParentsData)
      setParents(allParentsData) // Show all initially
      addDebugLog(`✅ Loaded all ${allParentsData.length} parents`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memuat data orang tua"
      console.error("Error loading all parents:", error)
      addDebugLog(`❌ Failed to load all parents: ${errorMessage}`)
      setError(errorMessage)
      setAllParents([])
      setParents([])
    } finally {
      setLoadingParents(false)
    }
  }

  // Filter parents based on search query (client-side filtering for consistency)
  const filterParents = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setParents(allParents)
      addDebugLog(`Showing all ${allParents.length} parents`)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = allParents.filter(
      (parent) => parent.name.toLowerCase().includes(query) || parent.email.toLowerCase().includes(query),
    )

    setParents(filtered)
    addDebugLog(`Filtered to ${filtered.length} parents from ${allParents.length} total`)
  }

  // Handle search with debouncing (now uses client-side filtering)
  const handleSearchChange = (value: string) => {
    setParentSearch(value)
    addDebugLog(`Search changed to: "${value}"`)

    // Clear selected parent if search changes and parent is not in filtered results
    if (formData.parentId) {
      const selectedParentStillVisible = allParents.some(
        (parent) =>
          parent.id.toString() === formData.parentId &&
          (parent.name.toLowerCase().includes(value.toLowerCase()) ||
            parent.email.toLowerCase().includes(value.toLowerCase()) ||
            !value.trim()),
      )

      if (!selectedParentStillVisible) {
        setFormData((prev) => ({ ...prev, parentId: "" }))
        addDebugLog("Cleared selected parent as it's not visible in search results")
      }
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce the filtering
    searchTimeoutRef.current = setTimeout(() => {
      filterParents(value)
    }, 150) // Shorter debounce for client-side filtering
  }

  // Validate NIK with debouncing
  const validateNIK = async (nik: string) => {
    if (!nik || nik.length !== 16) {
      setNikValidation({
        isValidating: false,
        isValid: false,
        message: "NIK harus berupa 16 digit angka",
      })
      return
    }

    // Client-side format validation
    if (!/^\d{16}$/.test(nik)) {
      setNikValidation({
        isValidating: false,
        isValid: false,
        message: "NIK harus berupa angka saja",
      })
      return
    }

    setNikValidation({
      isValidating: true,
      isValid: null,
      message: "Memvalidasi NIK...",
    })
    addDebugLog(`Validating NIK: ${nik}`)

    try {
      const result = await adminApi.validateNIK(nik)
      setNikValidation({
        isValidating: false,
        isValid: result.available,
        message: result.available ? "NIK tersedia" : result.message,
      })
      addDebugLog(`NIK validation result: ${result.available ? "Available" : "Not available"} - ${result.message}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memvalidasi NIK"
      addDebugLog(`❌ NIK validation failed: ${errorMessage}`)
      setNikValidation({
        isValidating: false,
        isValid: true, // Assume available if validation fails
        message: "Tidak dapat memvalidasi NIK, diasumsikan tersedia",
      })
    }
  }

  // Handle NIK change with validation
  const handleNIKChange = (value: string) => {
    // Only allow numbers and limit to 16 characters
    const cleanValue = value.replace(/\D/g, "").slice(0, 16)
    handleInputChange("nik", cleanValue)
    addDebugLog(`NIK changed to: ${cleanValue} (length: ${cleanValue.length})`)

    // Clear previous validation timeout
    if (nikValidationTimeoutRef.current) {
      clearTimeout(nikValidationTimeoutRef.current)
    }

    // Reset validation state
    setNikValidation({
      isValidating: false,
      isValid: null,
      message: "",
    })

    // Validate NIK after user stops typing
    if (cleanValue.length === 16) {
      nikValidationTimeoutRef.current = setTimeout(() => {
        validateNIK(cleanValue)
      }, 500) // 500ms debounce for NIK validation
    } else if (cleanValue.length > 0) {
      setNikValidation({
        isValidating: false,
        isValid: false,
        message: `NIK harus 16 digit (saat ini: ${cleanValue.length} digit)`,
      })
    }
  }

  // Load initial data on component mount
  useEffect(() => {
    loadAllParents()

    // Cleanup timeouts on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (nikValidationTimeoutRef.current) {
        clearTimeout(nikValidationTimeoutRef.current)
      }
    }
  }, [existingParents])

  // NIK validation function
  const isNIKFormatValid = (nik: string): boolean => {
    const nikRegex = /^\d{16}$/
    return nikRegex.test(nik)
  }

  // Update the handleSubmit function to include date validation and logging
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    addDebugLog("🚀 Starting form submission...")

    try {
      // Enhanced validation with detailed logging
      if (!formData.name.trim()) {
        addDebugLog("❌ Validation failed: Name is empty")
        throw new Error("Nama anak harus diisi")
      }
      addDebugLog(`✅ Name validation passed: "${formData.name.trim()}"`)

      if (!formData.gender) {
        addDebugLog("❌ Validation failed: Gender not selected")
        throw new Error("Jenis kelamin harus dipilih")
      }
      addDebugLog(`✅ Gender validation passed: "${formData.gender}"`)

      if (!formData.dob) {
        addDebugLog("❌ Validation failed: DOB is empty")
        throw new Error("Tanggal lahir harus diisi")
      }

      // Validate date format and value
      const dobDate = new Date(formData.dob)
      if (isNaN(dobDate.getTime())) {
        addDebugLog(`❌ Validation failed: DOB is invalid date - "${formData.dob}"`)
        throw new Error("Format tanggal lahir tidak valid")
      }

      // Check if date is not in the future
      const today = new Date()
      if (dobDate > today) {
        addDebugLog(`❌ Validation failed: DOB is in the future - "${formData.dob}"`)
        throw new Error("Tanggal lahir tidak boleh di masa depan")
      }

      // Check if date is reasonable (not too old)
      const hundredYearsAgo = new Date()
      hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100)
      if (dobDate < hundredYearsAgo) {
        addDebugLog(`❌ Validation failed: DOB is too old - "${formData.dob}"`)
        throw new Error("Tanggal lahir tidak valid (terlalu lama)")
      }
      addDebugLog(`✅ DOB validation passed: "${formData.dob}" -> ${dobDate.toISOString()}`)

      if (!formData.nik.trim()) {
        addDebugLog("❌ Validation failed: NIK is empty")
        throw new Error("NIK harus diisi")
      }
      addDebugLog(`✅ NIK presence validation passed: "${formData.nik.trim()}"`)

      if (!isNIKFormatValid(formData.nik.trim())) {
        addDebugLog(`❌ Validation failed: NIK format invalid (length: ${formData.nik.trim().length})`)
        throw new Error("NIK harus berupa 16 digit angka")
      }
      addDebugLog(`✅ NIK format validation passed: "${formData.nik.trim()}" (16 digits)`)

      if (nikValidation.isValid === false) {
        addDebugLog(`❌ Validation failed: NIK not available - ${nikValidation.message}`)
        throw new Error(nikValidation.message || "NIK tidak valid")
      }
      addDebugLog(`✅ NIK availability validation passed`)

      if (!formData.parentId) {
        addDebugLog("❌ Validation failed: Parent not selected")
        throw new Error("Orang tua harus dipilih")
      }
      addDebugLog(`✅ Parent validation passed: ID ${formData.parentId}`)

      addDebugLog("✅ All form validations passed")

      // Create child request with explicit field validation
      const childRequest: CreateChildRequest = {
        name: formData.name.trim(),
        dob: formData.dob, // Keep as date string, API will convert to ISO
        nik: formData.nik.trim(),
        gender: formData.gender as GenderEnum, // Cast to GenderEnum
        userId: Number.parseInt(formData.parentId),
      }

      // Log the exact data being sent
      addDebugLog(`📤 Submitting child data:`)
      addDebugLog(`  - name: "${childRequest.name}" (type: ${typeof childRequest.name})`)
      addDebugLog(`  - dob: "${childRequest.dob}" (type: ${typeof childRequest.dob})`)
      addDebugLog(`  - dob as Date: ${new Date(childRequest.dob).toISOString()}`)
      addDebugLog(
        `  - nik: "${childRequest.nik}" (type: ${typeof childRequest.nik}, length: ${childRequest.nik.length})`,
      )
      addDebugLog(`  - gender: "${childRequest.gender}" (type: ${typeof childRequest.gender})`)
      addDebugLog(`  - userId: ${childRequest.userId} (type: ${typeof childRequest.userId})`)

      const response = await adminApi.addChild(childRequest)
      addDebugLog("✅ Child added successfully")
      setSuccess("Data anak berhasil ditambahkan!")

      // Reset form
      setFormData({
        name: "",
        gender: "",
        dob: "",
        nik: "",
        parentId: "",
      })
      setParentSearch("")
      setNikValidation({
        isValidating: false,
        isValid: null,
        message: "",
      })

      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menambahkan data anak"
      addDebugLog(`❌ Form submission failed: ${errorMessage}`)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const selectedParent = allParents.find((parent) => parent.id.toString() === formData.parentId)

  // Check if form is valid for submission
  const isFormValid = () => {
    const valid =
      formData.name.trim() &&
      formData.gender &&
      formData.dob &&
      formData.nik.trim() &&
      isNIKFormatValid(formData.nik.trim()) &&
      (nikValidation.isValid === true || nikValidation.isValid === null) && // Allow null for when validation endpoint is not available
      formData.parentId &&
      !loadingParents &&
      !nikValidation.isValidating

    if (debugMode) {
      addDebugLog(`Form validity check: ${valid ? "VALID" : "INVALID"}`)
      addDebugLog(`  - name: ${!!formData.name.trim()}`)
      addDebugLog(`  - gender: ${!!formData.gender}`)
      addDebugLog(`  - dob: ${!!formData.dob}`)
      addDebugLog(`  - nik: ${!!formData.nik.trim()} (format: ${isNIKFormatValid(formData.nik.trim())})`)
      addDebugLog(`  - nikValidation: ${nikValidation.isValid}`)
      addDebugLog(`  - parentId: ${!!formData.parentId}`)
      addDebugLog(`  - loadingParents: ${loadingParents}`)
      addDebugLog(`  - nikValidating: ${nikValidation.isValidating}`)
    }

    return valid
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-green-600" />
            </div>
            Tambah Data Anak Baru
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDebugMode(!debugMode)}
              className="ml-auto"
            >
              <Bug className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Debug Panel */}
        {debugMode && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs font-mono">
            <div className="font-semibold mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Debug Log:
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {debugInfo.map((log, index) => (
                <div key={index} className="text-gray-700">
                  {log}
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-300">
              <div className="text-xs text-gray-600">
                <strong>Parent Data Stats:</strong>
              </div>
              <div className="text-xs text-gray-600">
                Total Parents: {allParents.length} | Filtered: {parents.length} | Selected:{" "}
                {formData.parentId || "None"}
              </div>
              <div className="text-xs text-gray-600">
                <strong>Current Form State:</strong>
              </div>
              <div className="text-xs text-gray-600">
                Name: "{formData.name}" | Gender: "{formData.gender}" | DOB: "{formData.dob}" | NIK: "{formData.nik}" (
                {formData.nik.length}/16) | Parent: "{formData.parentId}"
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                <div>{error}</div>
                {debugMode && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">Debug Details</summary>
                    <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                      {JSON.stringify(
                        {
                          formData,
                          nikValidation,
                          totalParents: allParents.length,
                          filteredParents: parents.length,
                          isFormValid: isFormValid(),
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* Parent Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b pb-2">
              <User className="h-5 w-5 text-purple-600" />
              Pilih Orang Tua
              <div className="ml-auto flex items-center gap-2 text-sm font-normal text-gray-600">
                <Users className="h-4 w-4" />
                <span>{allParents.length} total orang tua</span>
              </div>
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
                  <span className="text-sm text-gray-500">Memuat data orang tua...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">
                      Pilih dari daftar: ({parents.length} dari {allParents.length} orang tua)
                    </Label>
                    {parentSearch && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setParentSearch("")
                          filterParents("")
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Tampilkan Semua
                      </Button>
                    )}
                  </div>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {parents.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {parentSearch ? (
                          <div>
                            <div>Tidak ada orang tua yang cocok dengan pencarian "{parentSearch}"</div>
                            <div className="text-xs mt-1">Total {allParents.length} orang tua tersedia</div>
                          </div>
                        ) : (
                          "Tidak ada data orang tua"
                        )}
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
                  onValueChange={(value) => handleInputChange("gender", value as GenderEnum)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Laki-laki</SelectItem>
                    <SelectItem value="FEMALE">Perempuan</SelectItem>
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
                    onChange={(e) => handleNIKChange(e.target.value)}
                    required
                    disabled={loading}
                    className={`h-11 pl-10 pr-10 ${
                      nikValidation.isValid === true
                        ? "border-green-500 focus:border-green-500"
                        : nikValidation.isValid === false
                          ? "border-red-500 focus:border-red-500"
                          : ""
                    }`}
                    maxLength={16}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {nikValidation.isValidating ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : nikValidation.isValid === true ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : nikValidation.isValid === false ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {nikValidation.message && (
                    <span
                      className={
                        nikValidation.isValid === true
                          ? "text-green-600"
                          : nikValidation.isValid === false
                            ? "text-red-600"
                            : "text-gray-500"
                      }
                    >
                      {nikValidation.message}
                    </span>
                  )}
                  {!nikValidation.message && <span className="text-gray-500">NIK harus berupa 16 digit angka</span>}
                </div>
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
              disabled={loading || !isFormValid()}
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
