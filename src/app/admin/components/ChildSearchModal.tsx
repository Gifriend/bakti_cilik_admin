"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Baby, Calendar, User, Activity } from "lucide-react"
import { growthApi, type ChildInfo } from "@/app/service/growth-api"

interface ChildSearchModalProps {
  open: boolean
  onClose: () => void
  onSelectChild: (child: ChildInfo) => void
  title?: string
  description?: string
}

export function ChildSearchModal({
  open,
  onClose,
  onSelectChild,
  title = "Pilih Anak",
  description = "Cari dan pilih anak untuk menambahkan data pertumbuhan",
}: ChildSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ChildInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Load initial data when modal opens
  useEffect(() => {
    if (open) {
      loadChildren()
    }
  }, [open])

  // Search when query changes
  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        searchChildren()
      }, 300) // Debounce search

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, open])

  const loadChildren = async () => {
    setLoading(true)
    setError("")
    try {
      const children = await growthApi.searchChildren("", 50, 1)
      setSearchResults(children)
    } catch (err: any) {
      console.error("Error loading children:", err)
      setError("Gagal memuat data anak")
    } finally {
      setLoading(false)
    }
  }

  const searchChildren = async () => {
    setLoading(true)
    setError("")
    try {
      const children = await growthApi.searchChildren(searchQuery, 50, 1)
      setSearchResults(children)
    } catch (err: any) {
      console.error("Error searching children:", err)
      setError("Gagal mencari data anak")
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dob: string) => {
    const birth = new Date(dob)
    const now = new Date()
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    return months
  }

  const handleSelectChild = (child: ChildInfo) => {
    onSelectChild(child)
    onClose()
  }

  const handleClose = () => {
    setSearchQuery("")
    setSearchResults([])
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Search className="h-4 w-4 text-blue-600" />
            </div>
            {title}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium text-gray-700">
              Cari berdasarkan nama atau NIK
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                type="text"
                placeholder="Masukkan nama anak atau NIK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {error && (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-red-600 text-sm">{error}</p>
                <Button variant="outline" size="sm" onClick={loadChildren} className="mt-2 bg-transparent">
                  Coba Lagi
                </Button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                <span className="text-gray-600">Mencari data anak...</span>
              </div>
            ) : searchResults.length === 0 && !error ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <Baby className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchQuery ? "Tidak Ada Hasil" : "Belum Ada Data Anak"}
                </h3>
                <p className="text-sm text-gray-500">
                  {searchQuery
                    ? `Tidak ditemukan anak dengan kata kunci "${searchQuery}"`
                    : "Belum ada data anak yang terdaftar dalam sistem"}
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-3 pr-2" style={{ maxHeight: "400px" }}>
                {searchResults.map((child) => (
                  <div
                    key={child.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleSelectChild(child)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            child.gender === "MALE" ? "bg-blue-100" : "bg-pink-100"
                          }`}
                        >
                          <Baby className={`h-6 w-6 ${child.gender === "MALE" ? "text-blue-600" : "text-pink-600"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{child.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <User className="h-3 w-3" />
                            <span>NIK: {child.nik}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Lahir: {new Date(child.dob).toLocaleDateString("id-ID")}({calculateAge(child.dob)} bulan)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant="secondary"
                          className={
                            child.gender === "MALE" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                          }
                        >
                          {child.gender === "MALE" ? "Laki-laki" : "Perempuan"}
                        </Badge>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Activity className="h-4 w-4 mr-1" />
                          Pilih
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 h-11 bg-transparent">
              Batal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
