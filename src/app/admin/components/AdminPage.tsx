"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Activity, Search, BarChart3, Baby, TrendingUp, Shield, Eye } from "lucide-react"
import { UserMenu } from "@/components/UserMenu"
import { AddChildForm } from "./AddChildForm"
import { AddGrowthRecordModal } from "./AddGrowthRecordModal"
import { growthApi } from "@/app/service/growth-api"
import { PWAStatus } from "@/components/PWAStatus"

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
}

interface AdminStats {
  totalChildren: number
  totalRecords: number
  totalParents: number
  recentActivity: number
}

export default function AdminPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalChildren: 0,
    totalRecords: 0,
    totalParents: 0,
    recentActivity: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddChild, setShowAddChild] = useState(false)
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Check user role
  useEffect(() => {
    const role = localStorage.getItem("userRole") || "ORANG_TUA"
    setUserRole(role)
  }, [])

  const isAdmin = userRole && ["ADMIN", "PEGAWAI", "DOKTER"].includes(userRole)

  useEffect(() => {
    if (isAdmin) {
      loadAdminData()
    }
  }, [isAdmin])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load children data using the existing API
      const childrenData = await growthApi.getMyChildren()

      // Transform the data to match our interface
      const transformedChildren: Child[] = childrenData.map((child) => ({
        id: child.id,
        name: child.name,
        dob: child.dob,
        gender: child.gender,
        parentName: "Parent Name", // You'll need to get this from your API
        parentEmail: "parent@email.com", // You'll need to get this from your API
        recordsCount: 0, // You'll need to get this from your API
        lastRecord: undefined, // You'll need to get this from your API
        userId: child.userId || 0,
      }))

      setChildren(transformedChildren)

      // Calculate basic stats
      setStats({
        totalChildren: transformedChildren.length,
        totalRecords: transformedChildren.reduce((sum, child) => sum + child.recordsCount, 0),
        totalParents: new Set(transformedChildren.map((child) => child.userId)).size,
        recentActivity: 0, // You can calculate this based on recent records
      })
    } catch (error) {
      console.error("Error loading admin data:", error)
      setError("Gagal memuat data admin")
    } finally {
      setLoading(false)
    }
  }

  const handleChildAdded = () => {
    setShowAddChild(false)
    loadAdminData()
  }

  const handleRecordAdded = () => {
    setShowAddRecord(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data admin...</p>
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

        {/* Stats Cards */}
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
                {/* Search */}
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Cari anak, orang tua, atau email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
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
                                    // Navigate to child's growth stats page
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
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Rekam Pertumbuhan</h3>
                  <p className="text-gray-500">Fitur ini akan menampilkan semua rekam pertumbuhan dari semua anak</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showAddChild && (
        <AddChildForm
          onSuccess={handleChildAdded}
          onCancel={() => setShowAddChild(false)}
          adminId={localStorage.getItem("userId") || ""}
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

      {/* PWA Status */}
      <PWAStatus />
    </div>
  )
}
