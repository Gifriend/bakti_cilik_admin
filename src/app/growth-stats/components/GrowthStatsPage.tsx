"use client"

import { useState, useEffect } from "react"
import { ChildInfo, growthApi, type GrowthChartData, type GrowthStats } from "@/app/service/growth-api"
import { GrowthChart } from "./GrowthChart"
import { GrowthStatsCard } from "./GrowthStatsCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, TrendingUp, RefreshCw, UserX, Clock, Baby } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserMenu } from "@/components/UserMenu"
import { Button } from "@/components/ui/button"
import { Select, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SelectContent } from "@radix-ui/react-select"
import { Label } from "@/components/ui/label"

export default function GrowthStatsPage() {
  const [children, setChildren] = useState<ChildInfo[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)
  const [growthData, setGrowthData] = useState<GrowthChartData | null>(null)
  const [growthStats, setGrowthStats] = useState<GrowthStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noChildFound, setNoChildFound] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  // Load user's children on component mount
  const loadChildren = async () => {
    try {
      setLoading(true)
      setError(null)
      setNoChildFound(false)
      setAccessDenied(false)

      const childrenData = await growthApi.getMyChildren()

      if (childrenData.length === 0) {
        setNoChildFound(true)
        setChildren([])
        setSelectedChildId(null)
      } else {
        setChildren(childrenData)
        // Auto-select first child
        const firstChild = childrenData[0]
        setSelectedChildId(firstChild.id)
        // Load data for first child
        await loadChildData(firstChild.id)
      }
    } catch (error) {
      console.error("Error loading children:", error)
      const errorMessage = error instanceof Error ? error.message : "Gagal memuat data anak"

      if (errorMessage.includes("tidak ditemukan")) {
        setNoChildFound(true)
      } else if (errorMessage.includes("akses") || errorMessage.includes("login")) {
        setAccessDenied(true)
      } else {
        setError(errorMessage)
      }

      setChildren([])
      setSelectedChildId(null)
    } finally {
      setLoading(false)
    }
  }

  // Load growth data for selected child
  const loadChildData = async (childId: number) => {
    try {
      setLoadingData(true)
      setError(null)

      const [chartData, statsData] = await Promise.allSettled([
        growthApi.getGrowthChart(childId),
        growthApi.getGrowthStats(childId),
      ])

      // Handle chart data
      if (chartData.status === "fulfilled") {
        setGrowthData(chartData.value)
      } else {
        console.error("Error fetching chart data:", chartData.reason)
        setGrowthData({ records: [], whoCurves: [] })
      }

      // Handle stats data
      if (statsData.status === "fulfilled") {
        setGrowthStats(statsData.value)
      } else {
        console.error("Error fetching stats data:", statsData.reason)
        setGrowthStats(null)
      }
    } catch (error) {
      console.error("Error loading child data:", error)
      const errorMessage = error instanceof Error ? error.message : "Gagal memuat data pertumbuhan"
      setError(errorMessage)
      setGrowthData(null)
      setGrowthStats(null)
    } finally {
      setLoadingData(false)
    }
  }

  // Handle child selection change
  const handleChildChange = async (childIdStr: string) => {
    const childId = Number.parseInt(childIdStr)
    setSelectedChildId(childId)
    await loadChildData(childId)
  }

  // Fetch data on component mount
  useEffect(() => {
    loadChildren()
  }, [])

  const handleRetry = () => {
    if (selectedChildId) {
      loadChildData(selectedChildId)
    } else {
      loadChildren()
    }
  }

  const selectedChild = children.find((child) => child.id === selectedChildId)
  const latestRecord = growthData?.records?.[growthData.records.length - 1]

  // Show loading on initial load
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Memuat data anak...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Statistik Pertumbuhan Anak</h1>
                <p className="text-gray-600">Pantau perkembangan pertumbuhan anak Anda</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="shadow-lg border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4 bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Access Denied State */}
        {accessDenied && (
          <Card className="text-center py-16 shadow-xl border-0 bg-gradient-to-br from-red-50 to-pink-50">
            <CardHeader>
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-800">Akses Ditolak</CardTitle>
              <CardDescription className="max-w-md mx-auto text-red-600">
                Anda tidak memiliki akses untuk melihat data pertumbuhan ini. Pastikan Anda sudah login dengan akun yang
                benar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRetry} variant="outline" className="shadow-lg bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Child Found State */}
        {noChildFound && (
          <Card className="text-center py-16 shadow-xl border-0 bg-gradient-to-br from-orange-50 to-yellow-50">
            <CardHeader>
              <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <UserX className="h-10 w-10 text-orange-600" />
              </div>
              <CardTitle className="text-2xl text-orange-800">Data Anak Belum Tersedia</CardTitle>
              <CardDescription className="max-w-lg mx-auto text-orange-700">
                Data anak Anda belum ditambahkan ke dalam sistem. Silakan hubungi admin atau petugas kesehatan untuk
                mendaftarkan data anak Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-xl max-w-md mx-auto border border-blue-200">
                <div className="flex items-center gap-3 text-blue-700 mb-4">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Langkah Selanjutnya:</span>
                </div>
                <ul className="text-sm text-blue-600 text-left space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                    Hubungi petugas kesehatan di puskesmas
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                    Minta untuk didaftarkan dalam sistem
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                    Lakukan pengukuran pertumbuhan pertama
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                    Data akan muncul setelah didaftarkan
                  </li>
                </ul>
              </div>
              <Button onClick={handleRetry} variant="outline" className="shadow-lg bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Periksa Lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Child Selection */}
        {children.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5 text-blue-600" />
                Pilih Anak
              </CardTitle>
              <CardDescription>Pilih anak untuk melihat data pertumbuhannya</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="childSelect" className="text-sm font-medium">
                  Anak yang dipilih:
                </Label>
                <Select value={selectedChildId?.toString() || ""} onValueChange={handleChildChange}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Pilih anak..." />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Baby className={`h-4 w-4 ${child.gender === "L" ? "text-blue-500" : "text-pink-500"}`} />
                          <span>{child.name}</span>
                          <span className="text-sm text-gray-500">
                            ({child.gender === "L" ? "Laki-laki" : "Perempuan"})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content - Only show if we have selected child */}
        {selectedChild && (
          <div className="space-y-8">
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                <span className="text-gray-600">Memuat data pertumbuhan...</span>
              </div>
            ) : (
              <>
                {/* Stats Overview */}
                <GrowthStatsCard
                  childName={selectedChild.name}
                  stats={growthStats || undefined}
                  latestRecord={latestRecord}
                />

                {/* Charts - Only show if there's data */}
                {growthData && growthData.records.length > 0 ? (
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Grafik Pertumbuhan - {selectedChild.name}
                      </CardTitle>
                      <CardDescription className="text-blue-100">
                        Visualisasi perkembangan pertumbuhan dengan kurva WHO
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Tabs defaultValue="height" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                          <TabsTrigger
                            value="height"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                          >
                            Grafik Tinggi Badan
                          </TabsTrigger>
                          <TabsTrigger
                            value="weight"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                          >
                            Grafik Berat Badan
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="height" className="space-y-4">
                          <GrowthChart data={growthData} childName={selectedChild.name} chartType="height" />
                        </TabsContent>
                        <TabsContent value="weight" className="space-y-4">
                          <GrowthChart data={growthData} childName={selectedChild.name} chartType="weight" />
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="text-center py-16 shadow-xl border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
                    <CardHeader>
                      <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                        <TrendingUp className="h-10 w-10 text-yellow-600" />
                      </div>
                      <CardTitle className="text-2xl text-yellow-800">Belum Ada Data Pengukuran</CardTitle>
                      <CardDescription className="max-w-lg mx-auto text-yellow-700">
                        Data pengukuran pertumbuhan untuk {selectedChild.name} belum tersedia. Silakan hubungi petugas
                        kesehatan untuk melakukan pengukuran pertama.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-yellow-100 p-6 rounded-xl max-w-md mx-auto border border-yellow-200">
                        <div className="flex items-center gap-3 text-yellow-700 mb-3">
                          <Clock className="h-5 w-5" />
                          <span className="font-semibold">Informasi:</span>
                        </div>
                        <p className="text-sm text-yellow-600">
                          {selectedChild.name} sudah terdaftar dalam sistem, namun belum ada data pengukuran. Kunjungi
                          puskesmas untuk melakukan pengukuran pertumbuhan.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Records Table */}
                {growthData && growthData.records.length > 0 && (
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                      <CardTitle>Riwayat Pengukuran - {selectedChild.name}</CardTitle>
                      <CardDescription className="text-purple-100">
                        Data pengukuran pertumbuhan {selectedChild.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                Tanggal
                              </th>
                              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                Usia (bulan)
                              </th>
                              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                Tinggi (cm)
                              </th>
                              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                Berat (kg)
                              </th>
                              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">
                                Z-Score
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {growthData.records.map((record, index) => (
                              <tr key={index} className="hover:bg-blue-50 transition-colors">
                                <td className="border border-gray-200 px-4 py-3">
                                  {new Date(record.date).toLocaleDateString("id-ID")}
                                </td>
                                <td className="border border-gray-200 px-4 py-3 font-medium">
                                  {record.ageInMonthsAtRecord}
                                </td>
                                <td className="border border-gray-200 px-4 py-3 font-medium">{record.height}</td>
                                <td className="border border-gray-200 px-4 py-3 font-medium">{record.weight}</td>
                                <td className="border border-gray-200 px-4 py-3">
                                  {record.heightZScore !== null ? (
                                    <span
                                      className={`font-semibold px-2 py-1 rounded-full text-xs ${
                                        record.heightZScore >= -2 && record.heightZScore <= 2
                                          ? "bg-green-100 text-green-700"
                                          : record.heightZScore < -2
                                            ? "bg-red-100 text-red-700"
                                            : "bg-yellow-100 text-yellow-700"
                                      }`}
                                    >
                                      {record.heightZScore.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 font-medium">N/A</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
