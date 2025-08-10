"use client"

import { useEffect, useState } from "react"
import { growthApi, type GrowthRecord } from "@/app/service/growth-api"
import { ChevronDown, ChevronRight, TrendingUp } from "lucide-react"

interface ChildGrowthListProps {
  childId: number
  childName: string
}

export default function ChildGrowthList({ childId, childName }: ChildGrowthListProps) {
  const [records, setRecords] = useState<GrowthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (expanded) {
      loadRecords()
    }
  }, [expanded, childId])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const data = await growthApi.getGrowthRecords(childId)
      setRecords(data)
    } catch (error) {
      console.error("Error loading growth records:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      {/* Header dengan dropdown toggle */}
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2 font-medium text-gray-800">
          <TrendingUp className="h-4 w-4" />
          Riwayat Pengukuran - {childName}
        </div>
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </div>

      {/* Konten yang muncul saat di-expand */}
      {expanded && (
        <div className="mt-3">
          {loading ? (
            <p className="text-sm text-gray-500">Memuat data...</p>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-2">Belum ada data pengukuran</p>
              <p className="text-xs text-gray-400">Hubungi petugas kesehatan untuk melakukan pengukuran pertumbuhan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 font-medium">Tanggal</th>
                      <th className="text-left p-2 font-medium">Usia (bulan)</th>
                      <th className="text-left p-2 font-medium">Tinggi (cm)</th>
                      <th className="text-left p-2 font-medium">Berat (kg)</th>
                      <th className="text-left p-2 font-medium">Z-Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{new Date(record.date).toLocaleDateString("id-ID")}</td>
                        <td className="p-2 font-medium">{record.ageInMonthsAtRecord}</td>
                        <td className="p-2">{record.height}</td>
                        <td className="p-2">{record.weight}</td>
                        <td className="p-2">
                          {record.heightZScore !== null ? (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary info */}
              <div className="text-center pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Total {records.length} pengukuran • Data dikelola oleh petugas kesehatan
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
