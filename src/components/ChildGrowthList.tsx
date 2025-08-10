"use client"

import { useEffect, useState } from "react"
import { growthApi, type GrowthRecord } from "@/app/service/growth-api"
import { ChevronDown, ChevronRight, TrendingUp, Calendar, Ruler, Weight, Activity } from "lucide-react"
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
      return { status: "N/A", color: "bg-gray-100 text-gray-800 border-gray-200" }
    }
    if (zScore >= -2 && zScore <= 2) {
      return { status: "Normal", color: "bg-green-100 text-green-800 border-green-200" }
    } else if (zScore < -3) {
      return { status: "Sangat Pendek", color: "bg-red-100 text-red-800 border-red-200" }
    } else if (zScore < -2) {
      return { status: "Pendek", color: "bg-orange-100 text-orange-800 border-orange-200" }
    } else if (zScore > 3) {
      return { status: "Sangat Tinggi", color: "bg-purple-100 text-purple-800 border-purple-200" }
    } else if (zScore > 2) {
      return { status: "Tinggi", color: "bg-blue-100 text-blue-800 border-blue-200" }
    }
    return { status: "N/A", color: "bg-gray-100 text-gray-800 border-gray-200" }
  }

  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
      {/* Header dengan dropdown toggle */}
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 transition-colors p-4 sm:p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
        onClick={() => setExpanded(!expanded)}
      >
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2 font-medium">
            <Activity className="h-5 w-5" />
            <span className="text-lg sm:text-xl">Riwayat Pengukuran</span>
          </div>
          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                {records.length} data
              </Badge>
            )}
            {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </div>
        </CardTitle>
        <p className="text-indigo-100 text-sm mt-1">Data pengukuran pertumbuhan untuk {childName}</p>
      </CardHeader>

      {/* Konten yang muncul saat di-expand */}
      {expanded && (
        <CardContent className="pt-0 p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="text-left p-4 font-semibold text-gray-700">Tanggal</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Usia (bulan)</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Tinggi (cm)</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Berat (kg)</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Status Tinggi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => {
                      const heightStatus = getZScoreStatus(record.heightZScore)
                      return (
                        <tr key={index} className="border-b hover:bg-gray-50 transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{new Date(record.date).toLocaleDateString("id-ID")}</span>
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
                              <Badge className={`${heightStatus.color} text-xs border`}>{heightStatus.status}</Badge>
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

              {/* Records Cards - Mobile */}
              <div className="sm:hidden space-y-4">
                {records.map((record, index) => {
                  const heightStatus = getZScoreStatus(record.heightZScore)
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
                        <Badge className={`${heightStatus.color} text-xs border`}>{heightStatus.status}</Badge>
                      </div>

                      {/* Decorative line */}
                      <div className="h-px bg-gradient-to-r from-blue-200 via-purple-200 to-transparent mb-4"></div>

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

              {/* Summary info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Ringkasan Data</span>
                </div>
                <div className="h-px bg-gradient-to-r from-blue-300 to-transparent mb-3"></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-blue-700">
                  <div className="bg-white/50 rounded-lg p-2">
                    <strong>Total pengukuran:</strong> {records.length} kali
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <strong>Periode:</strong>{" "}
                    {records.length > 0
                      ? `${Math.min(...records.map((r) => r.ageInMonthsAtRecord))} - ${Math.max(...records.map((r) => r.ageInMonthsAtRecord))} bulan`
                      : "N/A"}
                  </div>
                  <div className="bg-white/50 rounded-lg p-2">
                    <strong>Data dikelola oleh:</strong> Petugas kesehatan
                  </div>
                </div>
              </div>

              {/* Info box for users */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600 mt-0.5 text-lg">ℹ️</div>
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
