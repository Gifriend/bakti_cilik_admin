"use client"

import { useEffect, useState } from "react"
import { growthApi, type GrowthRecord } from "@/app/service/growth-api"
import { ChevronDown, ChevronRight, TrendingUp, Calendar, Ruler, Weight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ChildGrowthListProps {
  childId: number
  childName: string
}

export default function ChildGrowthList({ childId, childName }: ChildGrowthListProps) {
  const [records, setRecords] = useState<GrowthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (expanded) {
      loadRecords()
    }
  }, [expanded, childId])

  const loadRecords = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await growthApi.getGrowthRecords(childId)
      setRecords(data)
    } catch (error) {
      console.error("Error loading growth records:", error)
      setError("Gagal memuat riwayat pengukuran")
    } finally {
      setLoading(false)
    }
  }

  const getZScoreStatus = (zScore: number | null) => {
    if (zScore === null || zScore === undefined) {
      return { status: "N/A", color: "bg-gray-100 text-gray-800" }
    }
    if (zScore >= -2 && zScore <= 2) {
      return { status: "Normal", color: "bg-green-100 text-green-800" }
    } else if (zScore < -3) {
      return { status: "Severely Stunted", color: "bg-red-100 text-red-800" }
    } else if (zScore < -2) {
      return { status: "Stunted", color: "bg-orange-100 text-orange-800" }
    } else if (zScore > 3) {
      return { status: "Very Tall", color: "bg-blue-100 text-blue-800" }
    } else if (zScore > 2) {
      return { status: "Tall", color: "bg-yellow-100 text-yellow-800" }
    }
    return { status: "N/A", color: "bg-gray-100 text-gray-800" }
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      {/* Header dengan dropdown toggle */}
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 transition-colors p-4 sm:p-6"
        onClick={() => setExpanded(!expanded)}
      >
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2 font-medium text-gray-800">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <span className="text-lg sm:text-xl">Riwayat Pengukuran</span>
          </div>
          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {records.length} data
              </Badge>
            )}
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">Data pengukuran pertumbuhan untuk {childName}</p>
      </CardHeader>

      {/* Konten yang muncul saat di-expand */}
      {expanded && (
        <CardContent className="pt-0 p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Memuat data...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <TrendingUp className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Belum Ada Data Pengukuran</h3>
              <p className="text-sm text-gray-500 mb-2">Belum ada data pengukuran yang tersedia untuk anak ini</p>
              <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto border border-blue-200">
                <p className="text-xs text-blue-600">
                  💡 <strong>Info:</strong> Data pengukuran akan ditambahkan oleh petugas kesehatan saat kunjungan ke
                  puskesmas atau posyandu.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Records Table - Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-3 font-medium text-gray-700">Tanggal</th>
                      <th className="text-left p-3 font-medium text-gray-700">Usia (bulan)</th>
                      <th className="text-left p-3 font-medium text-gray-700">Tinggi (cm)</th>
                      <th className="text-left p-3 font-medium text-gray-700">Berat (kg)</th>
                      <th className="text-left p-3 font-medium text-gray-700">Status Tinggi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => {
                      const heightStatus = getZScoreStatus(record.heightZScore)
                      return (
                        <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {new Date(record.date).toLocaleDateString("id-ID")}
                            </div>
                          </td>
                          <td className="p-3 font-medium text-blue-600">{record.ageInMonthsAtRecord} bulan</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Ruler className="h-4 w-4 text-green-600" />
                              {record.height} cm
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Weight className="h-4 w-4 text-orange-600" />
                              {record.weight} kg
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              <Badge className={`${heightStatus.color} text-xs`}>{heightStatus.status}</Badge>
                              {record.heightZScore !== null && (
                                <div className="text-xs text-gray-500">Z-Score: {record.heightZScore.toFixed(2)}</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Records Cards - Mobile */}
              <div className="sm:hidden space-y-3">
                {records.map((record, index) => {
                  const heightStatus = getZScoreStatus(record.heightZScore)
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {new Date(record.date).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                        <Badge className={`${heightStatus.color} text-xs`}>{heightStatus.status}</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Usia</div>
                          <div className="font-medium text-blue-600">{record.ageInMonthsAtRecord} bln</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Tinggi</div>
                          <div className="font-medium text-green-600">{record.height} cm</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Berat</div>
                          <div className="font-medium text-orange-600">{record.weight} kg</div>
                        </div>
                      </div>

                      {record.heightZScore !== null && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            Z-Score Tinggi: <span className="font-medium">{record.heightZScore.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Summary info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Ringkasan Data</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-blue-700">
                  <div>
                    <strong>Total pengukuran:</strong> {records.length} kali
                  </div>
                  <div>
                    <strong>Periode:</strong>{" "}
                    {records.length > 0
                      ? `${Math.min(...records.map((r) => r.ageInMonthsAtRecord))} - ${Math.max(...records.map((r) => r.ageInMonthsAtRecord))} bulan`
                      : "N/A"}
                  </div>
                  <div>
                    <strong>Data dikelola oleh:</strong> Petugas kesehatan
                  </div>
                </div>
              </div>

              {/* Info box for users */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-start gap-2">
                  <div className="text-yellow-600 mt-0.5">ℹ️</div>
                  <div className="text-sm text-yellow-800">
                    <strong>Catatan:</strong> Data pengukuran hanya dapat ditambahkan oleh petugas kesehatan yang
                    berwenang. Untuk menambah data baru, silakan kunjungi puskesmas atau posyandu terdekat.
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
