"use client"

import { useState, useEffect } from "react"
import { ChildInfo, growthApi, type GrowthChartData, type GrowthStats } from "@/app/service/growth-api"
import { GrowthChart } from "./GrowthChart"
import { GrowthStatsCard } from "./GrowthStatsCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, TrendingUp, RefreshCw, UserX, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserMenu } from "@/components/UserMenu"
import { Button } from "@/components/ui/button"

export default function GrowthStatsPage() {
  const [growthData, setGrowthData] = useState<GrowthChartData | null>(null)
  const [growthStats, setGrowthStats] = useState<GrowthStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noChildFound, setNoChildFound] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  // Since we don't have /my-child endpoint, we'll try with a default childId
  // In a real scenario, this should come from user profile or a separate endpoint
  const tryFetchData = async (retryChildId?: number) => {
    try {
      setLoading(true)
      setError(null)
      setNoChildFound(false)
      setAccessDenied(false)

      // Try to fetch data with childId (you might need to get this from user context)
      // For now, we'll try with childId = 1, but this should be dynamic
      const childId = retryChildId || 1

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
    } catch (err: any) {
      console.error("Error fetching data:", err)

      // Handle different types of errors
      if (err.response?.status === 404) {
        setNoChildFound(true)
      } else if (err.response?.status === 403) {
        setAccessDenied(true)
      } else {
        setError("Gagal memuat data. Silakan coba lagi.")
      }

      setGrowthData(null)
      setGrowthStats(null)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    tryFetchData()
  }, [])

  const handleRetry = () => {
    tryFetchData()
  }

  const latestRecord = growthData?.records?.[growthData.records.length - 1]

  // // Show loading on initial load
  // if (loading) {
  //   return (
  //     <AuthGuard>
  //       <div className="flex items-center justify-center min-h-screen">
  //         <Loader2 className="h-8 w-8 animate-spin" />
  //         <span className="ml-2">Memuat data pertumbuhan...</span>
  //       </div>
  //     </AuthGuard>
  //   )
  // }

  return (
    // <AuthGuard>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Statistik Pertumbuhan Anak</h1>
              <p className="text-muted-foreground mt-1">Pantau perkembangan pertumbuhan anak Anda</p>
            </div>
            <UserMenu />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
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
          <Card className="text-center py-12">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl">Akses Ditolak</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Anda tidak memiliki akses untuk melihat data pertumbuhan ini. Pastikan Anda sudah login dengan akun yang
                benar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Child Found State */}
        {noChildFound && (
          <Card className="text-center py-12">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <UserX className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl">Data Anak Belum Tersedia</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Data anak Anda belum ditambahkan ke dalam sistem. Silakan hubungi admin atau petugas kesehatan untuk
                mendaftarkan data anak Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto mb-4">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Langkah Selanjutnya:</span>
                </div>
                <ul className="text-sm text-blue-600 text-left space-y-1">
                  <li>• Hubungi petugas kesehatan di puskesmas</li>
                  <li>• Minta untuk didaftarkan dalam sistem</li>
                  <li>• Lakukan pengukuran pertumbuhan pertama</li>
                  <li>• Data akan muncul setelah didaftarkan</li>
                </ul>
              </div>
              <Button onClick={handleRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Periksa Lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content - Only show if we have data */}
        {growthData && !noChildFound && !accessDenied && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <GrowthStatsCard childName="Anak Anda" stats={growthStats || undefined} latestRecord={latestRecord} />

            {/* Charts - Only show if there's data */}
            {growthData.records.length > 0 ? (
              <Tabs defaultValue="height" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="height">Grafik Tinggi Badan</TabsTrigger>
                  <TabsTrigger value="weight">Grafik Berat Badan</TabsTrigger>
                </TabsList>
                <TabsContent value="height" className="space-y-4">
                  <GrowthChart data={growthData} childName="Anak Anda" chartType="height" />
                </TabsContent>
                <TabsContent value="weight" className="space-y-4">
                  <GrowthChart data={growthData} childName="Anak Anda" chartType="weight" />
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Belum Ada Data Pengukuran
                  </CardTitle>
                  <CardDescription>
                    Data pengukuran pertumbuhan belum tersedia. Silakan hubungi petugas kesehatan untuk melakukan
                    pengukuran pertama.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Informasi:</span>
                    </div>
                    <p className="text-sm text-yellow-600">
                      Anak Anda sudah terdaftar dalam sistem, namun belum ada data pengukuran. Kunjungi puskesmas untuk
                      melakukan pengukuran pertumbuhan.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Records Table */}
            {growthData.records.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Pengukuran</CardTitle>
                  <CardDescription>Data pengukuran pertumbuhan anak Anda</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left">Tanggal</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Usia (bulan)</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Tinggi (cm)</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Berat (kg)</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Z-Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {growthData.records.map((record, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2">
                              {new Date(record.date).toLocaleDateString("id-ID")}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">{record.ageInMonthsAtRecord}</td>
                            <td className="border border-gray-200 px-4 py-2">{record.height}</td>
                            <td className="border border-gray-200 px-4 py-2">{record.weight}</td>
                            <td className="border border-gray-200 px-4 py-2">
                              {record.heightZScore !== null ? (
                                <span
                                  className={`font-medium ${
                                    record.heightZScore >= -2 && record.heightZScore <= 2
                                      ? "text-green-600"
                                      : record.heightZScore < -2
                                        ? "text-red-600"
                                        : "text-yellow-600"
                                  }`}
                                >
                                  {record.heightZScore.toFixed(2)}
                                </span>
                              ) : (
                                "N/A"
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
          </div>
        )}
      </div>
    // </AuthGuard>
  )
}
