"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  UserPlus,
  Activity,
  Search,
  BarChart3,
  Baby,
  TrendingUp,
  Shield,
  Eye,
  AlertCircle,
  Loader2,
  Plus,
} from "lucide-react"
import { UserMenu } from "@/components/UserMenu"
import { AddChildForm } from "./AddChildForm"
import { AddGrowthRecordModal } from "./AddGrowthRecordModal"
import { AdminGrowthRecords } from "./AdminGrowthRecord"
import { growthApi, type ChildInfo } from "@/app/service/growth-api"
import { adminApi, type Parent } from "@/app/service/admin-api"
import { PWAStatus } from "@/components/PWAStatus"
import { getCookieValue } from "@/app/service/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Child {
  id: number
  name: string
  dob: string
  gender: "MALE" | "FEMALE"
  parentName: string
  parentEmail: string
  recordsCount: number
  lastRecord?: string
  userId: number
  nik?: string
}

interface AdminStats {
  totalChildren: number
  totalRecords: number
  totalParents: number
  recentActivity: number
}

export default function AdminPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [childrenInfo, setChildrenInfo] = useState<ChildInfo[]>([]) // For AdminGrowthRecords
  const [parents, setParents] = useState<Parent[]>([]) // Add parents state for consistent counting
  const [stats, setStats] = useState<AdminStats>({
    totalChildren: 0,
    totalRecords: 0,
    totalParents: 0,
    recentActivity: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddChild, setShowAddChild] = useState(false)
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [showAddRecordWithSearch, setShowAddRecordWithSearch] = useState(false)
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Tambahkan state baru setelah state yang sudah ada
  const [searchNIK, setSearchNIK] = useState("")
  const [searchResult, setSearchResult] = useState<Child | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Check user role
  useEffect(() => {
    const role = localStorage.getItem("userRole") || "USER"
    const token = localStorage.getItem("authToken") || getCookieValue("access_token")

    console.log("Current role:", role, "Token:", token ? "exists" : "missing")

    setUserRole(role)

    // Jika tidak ada token, redirect ke login
    if (!token) {
      window.location.href = "/login"
      return
    }
  }, [])

  const isAdmin = userRole && ["ADMIN", "PEGAWAI", "DOKTER"].includes(userRole)

  console.log("Admin check - userRole:", userRole, "isAdmin:", isAdmin)

  useEffect(() => {
    if (isAdmin) {
      loadAdminData()
    } else if (userRole && userRole !== "USER") {
      // Jika role sudah di-set tapi bukan admin, tunggu sebentar
      setTimeout(() => {
        if (!["ADMIN", "PEGAWAI", "DOKTER"].includes(userRole)) {
          console.log("Access denied for role:", userRole)
        }
      }, 1000)
    }
  }, [isAdmin, userRole])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🚀 Loading admin data...")

      // Load children and parents data in parallel for consistency
      const [childrenData, parentsData] = await Promise.allSettled([
        growthApi.getMyChildrenAdmin(),
        adminApi.getParents({ limit: 1000 }), // Get all parents for consistent counting
      ])

      // Handle children data
      let processedChildren: ChildInfo[] = []
      if (childrenData.status === "fulfilled") {
        processedChildren = childrenData.value
        console.log("✅ Children data loaded:", processedChildren.length, "children")
      } else {
        console.error("❌ Failed to load children:", childrenData.reason)
      }

      // Handle parents data
      let processedParents: Parent[] = []
      if (parentsData.status === "fulfilled") {
        processedParents = parentsData.value
        console.log("✅ Parents data loaded:", processedParents.length, "parents")
      } else {
        console.error("❌ Failed to load parents:", parentsData.reason)
        // Set empty array but don't fail the entire load
        processedParents = []
      }

      // Set children info for AdminGrowthRecords component
      setChildrenInfo(processedChildren)
      setParents(processedParents) // Store parents for consistent counting

      // Transform the data to match our interface for backward compatibility
      const transformedChildren: Child[] = processedChildren.map((child) => ({
        id: child.id,
        name: child.name,
        dob: child.dob,
        gender: child.gender,
        parentName: "Parent Name", // You'll need to get this from your API
        parentEmail: "parent@email.com", // You'll need to get this from your API
        recordsCount: 0, // This will be calculated by AdminGrowthRecords
        lastRecord: undefined, // This will be calculated by AdminGrowthRecords
        userId: child.userId || 0,
        nik: child.nik,
      }))

      setChildren(transformedChildren)

      // Calculate stats with consistent parent count
      setStats({
        totalChildren: transformedChildren.length,
        totalRecords: 0, // Will be calculated by AdminGrowthRecords
        totalParents: processedParents.length, // Use actual loaded parents count
        recentActivity: 0, // Will be calculated by AdminGrowthRecords
      })

      console.log("✅ Admin data loaded successfully")
      console.log(`📊 Stats: ${transformedChildren.length} children, ${processedParents.length} parents`)
    } catch (error) {
      console.error("Error loading admin data:", error)
      setError("Gagal memuat data admin")
    } finally {
      setLoading(false)
    }
  }

  // Tambahkan fungsi ini setelah loadAdminData
  const searchChildByNIK = async (nik: string) => {
    if (!nik || nik.length !== 16) {
      setSearchError("NIK harus berupa 16 digit angka")
      return
    }

    try {
      setSearchLoading(true)
      setSearchError(null)
      setSearchResult(null)

      // Cari di data children yang sudah ada
      const foundChild = children.find((child) => child.nik === nik)

      if (foundChild) {
        setSearchResult(foundChild)
      } else {
        // Jika tidak ditemukan di data lokal, coba dari API
        const allChildren = await growthApi.getMyChildrenAdmin()
        const foundInAPI = allChildren.find((child) => child.nik === nik)

        if (foundInAPI) {
          const transformedChild: Child = {
            id: foundInAPI.id,
            name: foundInAPI.name,
            dob: foundInAPI.dob,
            gender: foundInAPI.gender,
            nik: foundInAPI.nik,
            parentName: "Parent Name",
            parentEmail: "parent@email.com",
            recordsCount: 0,
            lastRecord: undefined,
            userId: foundInAPI.userId || 0,
          }
          setSearchResult(transformedChild)
        } else {
          setSearchError("Anak dengan NIK tersebut tidak ditemukan")
        }
      }
    } catch (error) {
      console.error("Error searching child by NIK:", error)
      setSearchError("Gagal mencari data anak")
    } finally {
      setSearchLoading(false)
    }
  }

  const handleChildAdded = () => {
    setShowAddChild(false)
    loadAdminData() // Reload both children and parents data
  }

  const handleRecordAdded = () => {
    setShowAddRecord(false)
    setShowAddRecordWithSearch(false)
    setSelectedChild(null)
    loadAdminData()
  }

  const filteredChildren = children.filter(
    (child) =>
      child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.parentEmail.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const calculateAge = (dob: string) => {
    const birth = new Date(dob)
    const now = new Date()
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    return months
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-800">Akses Ditolak</CardTitle>
            <CardDescription className="text-red-600">
              Halaman ini hanya dapat diakses oleh admin atau petugas kesehatan.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (loading || !userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data admin...</p>
          <p className="text-xs text-gray-400 mt-2">Role: {userRole || "Loading..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm sm:text-base text-gray-600">Kelola data pertumbuhan anak</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                onClick={() => setShowAddChild(true)}
                className="bg-green-600 hover:bg-green-700 shadow-lg text-sm sm:text-base px-3 sm:px-4"
              >
                <UserPlus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Tambah Anak</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
              <Button
                onClick={() => setShowAddRecordWithSearch(true)}
                className="bg-orange-600 hover:bg-orange-700 shadow-lg text-sm sm:text-base px-3 sm:px-4"
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Tambah Data</span>
                <span className="sm:hidden">Data</span>
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Error Alert */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards - Now shows consistent parent count */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Anak</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stats.totalChildren}</p>
                </div>
                <Baby className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs sm:text-sm font-medium">Total Rekam</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stats.totalRecords}</p>
                </div>
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs sm:text-sm font-medium">Total Orang Tua</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stats.totalParents}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs sm:text-sm font-medium">Aktivitas Terbaru</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stats.recentActivity}</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Manajemen Data Anak
            </CardTitle>
            <CardDescription>Kelola data anak dan rekam pertumbuhan</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="children" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="children">Daftar Anak</TabsTrigger>
                <TabsTrigger value="records">Rekam Pertumbuhan</TabsTrigger>
              </TabsList>

              <TabsContent value="children" className="space-y-6">
                {/* Search by NIK */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Cari berdasarkan nama, orang tua, atau email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* NIK Search Section */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="h-5 w-5 text-blue-600" />
                        Pencarian Cepat dengan NIK
                      </CardTitle>
                      <CardDescription>Masukkan NIK (16 digit) untuk mencari data anak secara langsung</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Input
                            placeholder="Masukkan NIK (16 digit)"
                            value={searchNIK}
                            onChange={(e) => {
                              setSearchNIK(e.target.value)
                              if (searchError) setSearchError(null)
                              if (searchResult) setSearchResult(null)
                            }}
                            maxLength={16}
                            className="bg-white"
                          />
                        </div>
                        <Button
                          onClick={() => searchChildByNIK(searchNIK)}
                          disabled={searchLoading || !searchNIK}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {searchLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Search Error */}
                      {searchError && (
                        <Alert variant="destructive" className="mt-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{searchError}</AlertDescription>
                        </Alert>
                      )}

                      {/* Search Result */}
                      {searchResult && (
                        <Card className="mt-3 bg-white border-green-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    searchResult.gender === "MALE" ? "bg-blue-100" : "bg-pink-100"
                                  }`}
                                >
                                  <Baby
                                    className={`h-5 w-5 ${
                                      searchResult.gender === "MALE" ? "text-blue-600" : "text-pink-600"
                                    }`}
                                  />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-green-800">{searchResult.name}</h4>
                                  <p className="text-sm text-green-600">
                                    NIK: {searchResult.nik} •{" "}
                                    {searchResult.gender === "MALE" ? "Laki-laki" : "Perempuan"}
                                  </p>
                                  <p className="text-xs text-green-500">
                                    Lahir: {new Date(searchResult.dob).toLocaleDateString("id-ID")} • Usia:{" "}
                                    {calculateAge(searchResult.dob)} bulan
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedChild(searchResult)
                                    setShowAddRecord(true)
                                  }}
                                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                                >
                                  <Activity className="h-4 w-4 mr-1" />
                                  Tambah Data
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    window.location.href = `/growth-stats?childId=${searchResult.id}`
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Children List */}
                <div className="space-y-4">
                  {filteredChildren.length === 0 ? (
                    <Card className="text-center py-12">
                      <CardContent>
                        <Baby className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">Belum Ada Data Anak</h3>
                        <p className="text-gray-500 mb-4">
                          {searchTerm
                            ? "Tidak ada anak yang cocok dengan pencarian"
                            : "Mulai dengan menambahkan data anak pertama"}
                        </p>
                        {!searchTerm && (
                          <Button onClick={() => setShowAddChild(true)} className="bg-green-600 hover:bg-green-700">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Tambah Anak Pertama
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    filteredChildren.map((child) => (
                      <Card key={child.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  child.gender === "MALE" ? "bg-blue-100" : "bg-pink-100"
                                }`}
                              >
                                <Baby
                                  className={`h-6 w-6 ${child.gender === "MALE" ? "text-blue-600" : "text-pink-600"}`}
                                />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{child.name}</h3>
                                <p className="text-gray-600">
                                  {child.gender === "MALE" ? "Laki-laki" : "Perempuan"} • {calculateAge(child.dob)}{" "}
                                  bulan
                                </p>
                                <p className="text-sm text-gray-500">
                                  Lahir: {new Date(child.dob).toLocaleDateString("id-ID")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <Badge variant="secondary" className="mb-2">
                                  {child.recordsCount} rekam
                                </Badge>
                                {child.lastRecord && (
                                  <p className="text-xs text-gray-500">
                                    Terakhir: {new Date(child.lastRecord).toLocaleDateString("id-ID")}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedChild(child)
                                    setShowAddRecord(true)
                                  }}
                                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                                >
                                  <Activity className="h-4 w-4 mr-1" />
                                  Tambah Data
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    window.location.href = `/growth-stats?childId=${child.id}`
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="records" className="space-y-6">
                {/* Use the new AdminGrowthRecords component */}
                <AdminGrowthRecords children={childrenInfo} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Modals - Pass parents data to AddChildForm for consistency */}
      {showAddChild && (
        <AddChildForm
          onSuccess={handleChildAdded}
          onCancel={() => setShowAddChild(false)}
          adminId={localStorage.getItem("userId") || ""}
          existingParents={parents} // Pass parents data for consistent counting
        />
      )}

      {showAddRecord && selectedChild && (
        <AddGrowthRecordModal
          open={showAddRecord}
          onClose={() => {
            setShowAddRecord(false)
            setSelectedChild(null)
          }}
          onSuccess={handleRecordAdded}
          childId={selectedChild.id}
          childName={selectedChild.name}
          adminId={localStorage.getItem("userId") || ""}
        />
      )}

      {showAddRecordWithSearch && (
        <AddGrowthRecordModal
          open={showAddRecordWithSearch}
          onClose={() => setShowAddRecordWithSearch(false)}
          onSuccess={handleRecordAdded}
          allowChildSelection={true}
          adminId={localStorage.getItem("userId") || ""}
        />
      )}

      {/* PWA Status */}
      <PWAStatus />
    </div>
  )
}
