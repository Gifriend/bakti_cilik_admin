"use client"

import { useState, useEffect } from "react"
import { growthApi, type Child, type GrowthChartData } from "@/app/service/growth-api"
import { GrowthChart } from "./GrowthChart"
import { GrowthStatsCard } from "./GrowthStatsCard"
import { ChildSelector } from "./ChildSelector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthGuard } from "@/contexts/auth-guard"
import { UserMenu } from "@/components/UserMenu"

export default function GrowthStatsPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number>()
  const [growthData, setGrowthData] = useState<GrowthChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch children list on component mount
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true)
        const childrenData = await growthApi.getChildren()
        setChildren(childrenData)

        // Auto-select first child if available
        if (childrenData.length > 0) {
          setSelectedChildId(childrenData[0].id)
        }
      } catch (err) {
        setError("Gagal memuat data anak")
        console.error("Error fetching children:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchChildren()
  }, [])

  // Fetch growth data when child is selected
  useEffect(() => {
    const fetchGrowthData = async () => {
      if (!selectedChildId) return

      try {
        setLoading(true)
        setError(null)
        const data = await growthApi.getGrowthChart(selectedChildId)
        setGrowthData(data)
      } catch (err) {
        setError("Gagal memuat data pertumbuhan")
        console.error("Error fetching growth data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchGrowthData()
  }, [selectedChildId])

  const selectedChild = children.find((child) => child.id === selectedChildId)
  const latestRecord = growthData?.records?.[growthData.records.length - 1]

  return (
    <AuthGuard>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Statistik Pertumbuhan Anak</h1>
            <UserMenu />
          </div>

          {children.length > 0 && (
            <ChildSelector children={children} selectedChildId={selectedChildId} onChildSelect={setSelectedChildId} />
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {children.length === 0 && !loading && (
          <Card>
            <CardHeader>
              <CardTitle>Tidak Ada Data</CardTitle>
              <CardDescription>
                Belum ada data anak yang tersedia. Silakan tambahkan data anak terlebih dahulu.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {selectedChild && growthData && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <GrowthStatsCard
              childName={selectedChild.name}
              latestHeight={latestRecord?.height}
              latestWeight={latestRecord?.weight}
              lastMeasurementDate={latestRecord?.date}
            />

            {/* Charts */}
            <Tabs defaultValue="height" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="height">Grafik Tinggi Badan</TabsTrigger>
                <TabsTrigger value="weight">Grafik Berat Badan</TabsTrigger>
              </TabsList>

              <TabsContent value="height" className="space-y-4">
                <GrowthChart data={growthData} childName={selectedChild.name} chartType="height" />
              </TabsContent>

              <TabsContent value="weight" className="space-y-4">
                <GrowthChart data={growthData} childName={selectedChild.name} chartType="weight" />
              </TabsContent>
            </Tabs>

            {/* Records Table */}
            {growthData.records.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Pengukuran</CardTitle>
                  <CardDescription>Data pengukuran pertumbuhan {selectedChild.name}</CardDescription>
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
                        </tr>
                      </thead>
                      <tbody>
                        {growthData.records.map((record) => (
                          <tr key={record.id}>
                            <td className="border border-gray-200 px-4 py-2">
                              {new Date(record.date).toLocaleDateString("id-ID")}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">{record.ageInMonths}</td>
                            <td className="border border-gray-200 px-4 py-2">{record.height}</td>
                            <td className="border border-gray-200 px-4 py-2">{record.weight}</td>
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

        {loading && selectedChildId && (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Memuat data pertumbuhan...</span>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
    