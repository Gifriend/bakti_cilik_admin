"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  Calendar,
  Ruler,
  Weight,
  Activity,
  Baby,
  TrendingUp,
  Users,
  Search,
  Loader2,
  AlertCircle,
  Eye,
  Filter,
} from "lucide-react"
import { growthApi, type GrowthRecord, type ChildInfo, type GrowthStats } from "@/app/service/growth-api"
import { GrowthStatsCard } from "../../growth-stats/components/GrowthStatsCard"
import { GrowthChart } from "../../growth-stats/components/GrowthChart"

interface AdminGrowthRecordsProps {
  children: ChildInfo[]
}

interface ChildWithRecords extends ChildInfo {
  records: GrowthRecord[]
  stats: GrowthStats | null
  latestRecord: GrowthRecord | null
}

export function AdminGrowthRecords({ children }: AdminGrowthRecordsProps) {
  const [selectedView, setSelectedView] = useState<"all" | "individual">("all")
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)
  const [childrenWithData, setChildrenWithData] = useState<ChildWithRecords[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "age" | "records" | "lastRecord">("name")

  // Load all children data
  useEffect(() => {
    loadAllChildrenData()
  }, [children])

  const loadAllChildrenData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("🚀 Loading growth data for all children...")

      const childrenWithRecords: ChildWithRecords[] = []

      for (const child of children) {
        try {
          console.log(`📊 Loading data for ${child.name} (ID: ${child.id})`)

          // Load records and stats in parallel
          const [recordsResult, statsResult] = await Promise.allSettled([
            growthApi.getGrowthRecords(child.id),
            growthApi.getGrowthStats(child.id),
          ])

          const records = recordsResult.status === "fulfilled" ? recordsResult.value : []
          const stats = statsResult.status === "fulfilled" ? statsResult.value : null
          const latestRecord = records.length > 0 ? records[records.length - 1] : null

          childrenWithRecords.push({
            ...child,
            records,
            stats,
            latestRecord,
          })

          console.log(`✅ Data loaded for ${child.name}: ${records.length} records`)
        } catch (error) {
          console.error(`❌ Error loading data for child ${child.id}:`, error)

          // Add child with empty data
          childrenWithRecords.push({
            ...child,
            records: [],
            stats: null,
            latestRecord: null,
          })
        }
      }

      setChildrenWithData(childrenWithRecords)
      console.log("✅ All children data loaded")
    } catch (error) {
      console.error("❌ Error loading children data:", error)
      setError("Gagal memuat data pertumbuhan anak")
    } finally {
      setLoading(false)
    }
  }

  // Calculate age in months
  const calculateAge = (dob: string) => {
    const birth = new Date(dob)
    const now = new Date()
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    return months
  }

  // Get WHO status for height Z-score
  const getWHOHeightStatus = (zScore: number | null | undefined) => {
    if (zScore === null || zScore === undefined) {
      return { status: "N/A", color: "bg-gray-100 text-gray-800 border-gray-200" }
    }
    if (zScore < -3) {
      return { status: "Sangat Pendek", color: "bg-red-100 text-red-800 border-red-200" }
    } else if (zScore < -2) {
      return { status: "Pendek", color: "bg-orange-100 text-orange-800 border-orange-200" }
    } else if (zScore <= 2) {
      return { status: "Normal", color: "bg-green-100 text-green-800 border-green-200" }
    } else if (zScore <= 3) {
      return { status: "Tinggi", color: "bg-blue-100 text-blue-800 border-blue-200" }
    } else {
      return { status: "Sangat Tinggi", color: "bg-purple-100 text-purple-800 border-purple-200" }
    }
  }

  // Filter and sort children
  const filteredAndSortedChildren = childrenWithData
    .filter((child) => child.name.toLowerCase().includes(searchTerm.toLowerCase()) || child.nik.includes(searchTerm))
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "age":
          return calculateAge(b.dob) - calculateAge(a.dob)
        case "records":
          return b.records.length - a.records.length
        case "lastRecord":
          if (!a.latestRecord && !b.latestRecord) return 0
          if (!a.latestRecord) return 1
          if (!b.latestRecord) return -1
          return new Date(b.latestRecord.date).getTime() - new Date(a.latestRecord.date).getTime()
        default:
          return 0
      }
    })

  // Calculate overall statistics
  const overallStats = {
    totalChildren: childrenWithData.length,
    totalRecords: childrenWithData.reduce((sum, child) => sum + child.records.length, 0),
    childrenWithData: childrenWithData.filter((child) => child.records.length > 0).length,
    averageRecordsPerChild:
      childrenWithData.length > 0
        ? (childrenWithData.reduce((sum, child) => sum + child.records.length, 0) / childrenWithData.length).toFixed(1)
        : "0",
  }

  // Get selected child data
  const selectedChild = selectedChildId ? childrenWithData.find((child) => child.id === selectedChildId) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
        <span className="text-gray-600">Memuat data rekam pertumbuhan...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadAllChildrenData} variant="outline" className="bg-transparent">
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <BarChart3 className="h-5 w-5" />
            Statistik Keseluruhan Rekam Pertumbuhan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="text-sm font-medium text-blue-700 mb-2">Total Anak</div>
              <div className="text-2xl font-bold text-blue-800">{overallStats.totalChildren}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-700 mb-2">Total Rekam</div>
              <div className="text-2xl font-bold text-green-800">{overallStats.totalRecords}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-700 mb-2">Anak dengan Data</div>
              <div className="text-2xl font-bold text-orange-800">{overallStats.childrenWithData}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="text-sm font-medium text-purple-700 mb-2">Rata-rata Rekam</div>
              <div className="text-2xl font-bold text-purple-800">{overallStats.averageRecordsPerChild}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Selection */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            Tampilan Data Rekam Pertumbuhan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as "all" | "individual")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Semua Anak
              </TabsTrigger>
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <Baby className="h-4 w-4" />
                Per Anak
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari berdasarkan nama atau NIK..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Urutkan berdasarkan..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nama</SelectItem>
                      <SelectItem value="age">Usia</SelectItem>
                      <SelectItem value="records">Jumlah Rekam</SelectItem>
                      <SelectItem value="lastRecord">Rekam Terakhir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* All Children Records */}
              <div className="space-y-4">
                {filteredAndSortedChildren.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Baby className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        {searchTerm ? "Tidak Ada Hasil" : "Belum Ada Data"}
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm
                          ? `Tidak ditemukan anak dengan kata kunci "${searchTerm}"`
                          : "Belum ada data rekam pertumbuhan yang tersedia"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredAndSortedChildren.map((child) => {
                    const heightStatus = getWHOHeightStatus(child.latestRecord?.heightZScore)

                    return (
                      <Card key={child.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
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
                                  NIK: {child.nik} • Lahir: {new Date(child.dob).toLocaleDateString("id-ID")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="text-sm">
                                {child.records.length} rekam
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedChildId(child.id)
                                  setSelectedView("individual")
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Detail
                              </Button>
                            </div>
                          </div>

                          {child.latestRecord ? (
                            <div className="space-y-4">
                              {/* Latest Record */}
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Calendar className="h-4 w-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700">
                                    Data Terakhir: {new Date(child.latestRecord.date).toLocaleDateString("id-ID")}
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="text-center bg-blue-50 rounded-lg p-3 border border-blue-200">
                                    <Ruler className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                                    <div className="text-xs text-blue-600 font-medium">Tinggi</div>
                                    <div className="font-bold text-blue-800">{child.latestRecord.height} cm</div>
                                  </div>
                                  <div className="text-center bg-green-50 rounded-lg p-3 border border-green-200">
                                    <Weight className="h-4 w-4 text-green-600 mx-auto mb-1" />
                                    <div className="text-xs text-green-600 font-medium">Berat</div>
                                    <div className="font-bold text-green-800">{child.latestRecord.weight} kg</div>
                                  </div>
                                  <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
                                    <TrendingUp className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                                    <div className="text-xs text-gray-600 font-medium">Status</div>
                                    <Badge className={`${heightStatus.color} text-xs border mt-1`}>
                                      {heightStatus.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Quick Stats */}
                              {child.stats && (
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                    <div className="text-purple-700 font-medium">Rata-rata Tinggi</div>
                                    <div className="text-purple-800 font-bold">
                                      {child.stats._avg?.height ? `${child.stats._avg.height.toFixed(1)} cm` : "N/A"}
                                    </div>
                                  </div>
                                  <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                                    <div className="text-indigo-700 font-medium">Rata-rata Berat</div>
                                    <div className="text-indigo-800 font-bold">
                                      {child.stats._avg?.weight ? `${child.stats._avg.weight.toFixed(1)} kg` : "N/A"}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">Belum ada data pengukuran</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="individual" className="space-y-6">
              {/* Child Selection */}
              <div className="space-y-2">
                <Label htmlFor="childSelect" className="text-sm font-medium">
                  Pilih Anak:
                </Label>
                <Select
                  value={selectedChildId?.toString() || ""}
                  onValueChange={(value) => setSelectedChildId(Number(value))}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Pilih anak untuk melihat detail..." />
                  </SelectTrigger>
                  <SelectContent>
                    {childrenWithData.map((child) => (
                      <SelectItem key={child.id} value={child.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Baby className={`h-4 w-4 ${child.gender === "MALE" ? "text-blue-500" : "text-pink-500"}`} />
                          <span>{child.name}</span>
                          <span className="text-sm text-gray-500">({child.records.length} rekam)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Individual Child Data */}
              {selectedChild ? (
                <div className="space-y-6">
                  {/* Growth Stats Card */}
                  <GrowthStatsCard
                    childName={selectedChild.name}
                    stats={selectedChild.stats}
                    latestRecord={selectedChild.latestRecord}
                  />

                  {/* Growth Records Table */}
                  {selectedChild.records.length > 0 ? (
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                          <Activity className="h-5 w-5" />
                          Riwayat Pengukuran - {selectedChild.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                                <th className="text-left p-4 font-semibold text-gray-700">Tanggal</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Usia (bulan)</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Tinggi (cm)</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Berat (kg)</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Status Tinggi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedChild.records.map((record, index) => {
                                const heightStatus = getWHOHeightStatus(record.heightZScore)
                                return (
                                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">
                                          {new Date(record.date).toLocaleDateString("id-ID")}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        {record.ageInMonthsAtRecord} bulan
                                      </span>
                                    </td>
                                    <td className="p-4">
                                      <div className="flex items-center gap-2">
                                        <Ruler className="h-4 w-4 text-green-600" />
                                        <span className="font-semibold">{record.height} cm</span>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <div className="flex items-center gap-2">
                                        <Weight className="h-4 w-4 text-orange-600" />
                                        <span className="font-semibold">{record.weight} kg</span>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <div className="space-y-2">
                                        <Badge className={`${heightStatus.color} text-xs border`}>
                                          {heightStatus.status}
                                        </Badge>
                                        {record.heightZScore !== null && (
                                          <div className="text-xs text-gray-500 font-mono">
                                            Z-Score: {record.heightZScore.toFixed(2)}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="sm:hidden space-y-4">
                          {selectedChild.records.map((record, index) => {
                            const heightStatus = getWHOHeightStatus(record.heightZScore)
                            return (
                              <div
                                key={index}
                                className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border-2 border-gray-200 shadow-sm"
                              >
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm font-semibold">
                                      {new Date(record.date).toLocaleDateString("id-ID")}
                                    </span>
                                  </div>
                                  <Badge className={`${heightStatus.color} text-xs border`}>
                                    {heightStatus.status}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div className="text-center bg-blue-50 rounded-lg p-3 border border-blue-200">
                                    <div className="text-xs text-blue-600 font-medium mb-1">Usia</div>
                                    <div className="font-bold text-blue-800">{record.ageInMonthsAtRecord} bln</div>
                                  </div>
                                  <div className="text-center bg-green-50 rounded-lg p-3 border border-green-200">
                                    <div className="text-xs text-green-600 font-medium mb-1">Tinggi</div>
                                    <div className="font-bold text-green-800">{record.height} cm</div>
                                  </div>
                                  <div className="text-center bg-orange-50 rounded-lg p-3 border border-orange-200">
                                    <div className="text-xs text-orange-600 font-medium mb-1">Berat</div>
                                    <div className="font-bold text-orange-800">{record.weight} kg</div>
                                  </div>
                                </div>

                                {record.heightZScore !== null && (
                                  <div className="mt-4 pt-3 border-t border-gray-200">
                                    <div className="text-xs text-gray-600 text-center">
                                      Z-Score Tinggi:{" "}
                                      <span className="font-bold font-mono">{record.heightZScore.toFixed(2)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="text-center py-16 shadow-xl border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
                      <CardHeader>
                        <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                          <TrendingUp className="h-10 w-10 text-yellow-600" />
                        </div>
                        <CardTitle className="text-2xl text-yellow-800">Belum Ada Data Pengukuran</CardTitle>
                      </CardHeader>
                    </Card>
                  )}

                  {/* Growth Charts */}
                  {selectedChild.records.length > 0 && (
                    <div className="space-y-6">
                      {/* Load chart data and display charts */}
                      <GrowthChartsSection childId={selectedChild.id} childName={selectedChild.name} />
                    </div>
                  )}
                </div>
              ) : (
                <Card className="text-center py-16">
                  <CardContent>
                    <Baby className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Pilih Anak</h3>
                    <p className="text-gray-500">
                      Pilih anak dari dropdown di atas untuk melihat detail rekam pertumbuhan
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Separate component for growth charts to avoid loading issues
function GrowthChartsSection({ childId, childName }: { childId: number; childName: string }) {
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadChartData = async () => {
      try {
        const data = await growthApi.getGrowthChart(childId)
        setChartData(data)
      } catch (error) {
        console.error("Error loading chart data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadChartData()
  }, [childId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Memuat grafik...</span>
      </div>
    )
  }

  if (!chartData) {
    return null
  }

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <TrendingUp className="h-5 w-5" />
          Grafik Pertumbuhan - {childName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Tabs defaultValue="height" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="height">Tinggi Badan</TabsTrigger>
            <TabsTrigger value="weight">Berat Badan</TabsTrigger>
          </TabsList>
          <TabsContent value="height">
            <GrowthChart data={chartData} childName={childName} chartType="height" />
          </TabsContent>
          <TabsContent value="weight">
            <GrowthChart data={chartData} childName={childName} chartType="weight" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
