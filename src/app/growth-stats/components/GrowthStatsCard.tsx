"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Calendar,
  Ruler,
  Weight,
  AlertTriangle,
  Activity,
} from "lucide-react"
import type { GrowthStats } from "@/app/service/growth-api"

interface GrowthStatsCardProps {
  childName: string
  stats?: GrowthStats | null
  latestRecord?: {
    date: string
    height: number
    weight: number
    heightZScore: number | null
  } | null
}

// WHO Growth Standards Interpretation
const getWHOHeightStatus = (zScore: number | null | undefined) => {
  if (zScore === null || zScore === undefined) {
    return {
      status: "Data Tidak Tersedia",
      color: "bg-gray-100 text-gray-800 border-gray-200",
      description: "Z-score tidak dapat dihitung",
      severity: "unknown" as const,
    }
  }

  if (zScore < -3) {
    return {
      status: "Sangat Pendek (Severely Stunted)",
      color: "bg-red-100 text-red-800 border-red-200",
      description: "Tinggi badan sangat di bawah normal untuk usianya",
      severity: "critical" as const,
    }
  } else if (zScore < -2) {
    return {
      status: "Pendek (Stunted)",
      color: "bg-orange-100 text-orange-800 border-orange-200",
      description: "Tinggi badan di bawah normal untuk usianya",
      severity: "warning" as const,
    }
  } else if (zScore <= 2) {
    return {
      status: "Normal",
      color: "bg-green-100 text-green-800 border-green-200",
      description: "Tinggi badan sesuai dengan usianya",
      severity: "normal" as const,
    }
  } else if (zScore <= 3) {
    return {
      status: "Tinggi",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      description: "Tinggi badan di atas rata-rata untuk usianya",
      severity: "above" as const,
    }
  } else {
    return {
      status: "Sangat Tinggi",
      color: "bg-purple-100 text-purple-800 border-purple-200",
      description: "Tinggi badan sangat di atas rata-rata untuk usianya",
      severity: "high" as const,
    }
  }
}

const getStatusIcon = (severity: string) => {
  switch (severity) {
    case "critical":
      return <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
    case "warning":
      return <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
    case "normal":
      return <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
    case "above":
      return <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
    case "high":
      return <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
    default:
      return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
  }
}

const formatZScore = (zScore: number | null | undefined): string => {
  if (zScore === null || zScore === undefined) return "N/A"
  return zScore.toFixed(2)
}

const getZScoreProgress = (zScore: number | null | undefined): number => {
  if (zScore === null || zScore === undefined) return 0
  // Convert Z-score to percentage (0-100) for progress bar
  // Z-score range typically -4 to +4, so we map it to 0-100
  const normalized = Math.max(0, Math.min(100, ((zScore + 4) / 8) * 100))
  return normalized
}

export function GrowthStatsCard({ childName, stats, latestRecord }: GrowthStatsCardProps) {
  const heightStatus = getWHOHeightStatus(latestRecord?.heightZScore)

  // If no data at all, show empty state
  if (!latestRecord && (!stats || stats._count._all === 0)) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span className="truncate">Belum Ada Data - {childName}</span>
          </CardTitle>
          <CardDescription>Belum ada data pengukuran yang tersedia untuk ditampilkan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <BarChart3 className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-500 text-sm sm:text-base">Data akan muncul setelah pengukuran pertama dilakukan</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Stats Card */}
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <BarChart3 className="h-5 w-5" />
            <span className="truncate">Data Terkini - {childName}</span>
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-blue-100 text-sm">
            <Calendar className="h-4 w-4" />
            {latestRecord?.date
              ? `Terakhir: ${new Date(latestRecord.date).toLocaleDateString("id-ID")}`
              : "Belum ada data"}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Current Measurements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Height Card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Ruler className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-blue-900">Tinggi Badan</span>
                  </div>
                  <Badge className={`${heightStatus.color} text-xs border`}>
                    {getStatusIcon(heightStatus.severity)}
                    <span className="ml-1 hidden sm:inline">{heightStatus.status.split(" ")[0]}</span>
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-800">
                    {latestRecord?.height ? `${latestRecord.height} cm` : "N/A"}
                  </div>

                  {latestRecord?.heightZScore !== null && latestRecord?.heightZScore !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-blue-700">
                        <span>Z-Score: {formatZScore(latestRecord.heightZScore)}</span>
                        <span className="font-medium">{heightStatus.severity !== "unknown" ? "WHO Standard" : ""}</span>
                      </div>
                      <Progress value={getZScoreProgress(latestRecord.heightZScore)} className="h-2 bg-blue-200" />
                    </div>
                  )}
                </div>
              </div>

              {/* Decorative line */}
              <div className="absolute -bottom-2 left-4 right-4 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-30"></div>
            </div>

            {/* Weight Card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <Weight className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-green-900">Berat Badan</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    <Activity className="h-3 w-3" />
                    <span className="ml-1">Data</span>
                  </Badge>
                </div>

                <div className="text-2xl sm:text-3xl font-bold text-green-800">
                  {latestRecord?.weight ? `${latestRecord.weight} kg` : "N/A"}
                </div>
              </div>

              {/* Decorative line */}
              <div className="absolute -bottom-2 left-4 right-4 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-30"></div>
            </div>
          </div>

          {/* WHO Status Interpretation */}
          {latestRecord?.heightZScore !== null && latestRecord?.heightZScore !== undefined && (
            <div className="space-y-4">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

              <div
                className={`rounded-xl p-4 border-2 ${heightStatus.color.replace("bg-", "bg-").replace("text-", "text-").replace("border-", "border-")}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{getStatusIcon(heightStatus.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base mb-1">
                      Status Pertumbuhan: {heightStatus.status}
                    </h4>
                    <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{heightStatus.description}</p>

                    {/* Z-Score Details */}
                    <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-medium">Z-Score:</span>
                          <div className="font-bold text-lg">{formatZScore(latestRecord.heightZScore)}</div>
                        </div>
                        <div>
                          <span className="font-medium">Kategori WHO:</span>
                          <div className="font-bold">{heightStatus.status.split(" ")[0]}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aggregate Stats Card - Only show if there's data */}
      {stats && stats._count._all > 0 && (
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <BarChart3 className="h-5 w-5" />
              Statistik Keseluruhan
            </CardTitle>
            <CardDescription className="text-purple-100 text-sm">
              Ringkasan dari {stats._count._all} pengukuran
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <div className="space-y-6">
              {/* Average Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="text-sm font-medium text-purple-700 mb-2">Rata-rata Tinggi</div>
                    <div className="text-xl sm:text-2xl font-bold text-purple-800">
                      {stats._avg?.height ? `${stats._avg.height.toFixed(1)} cm` : "N/A"}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-2 right-2 h-0.5 bg-purple-400 rounded-full opacity-40"></div>
                </div>

                <div className="relative">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                    <div className="text-sm font-medium text-indigo-700 mb-2">Rata-rata Berat</div>
                    <div className="text-xl sm:text-2xl font-bold text-indigo-800">
                      {stats._avg?.weight ? `${stats._avg.weight.toFixed(1)} kg` : "N/A"}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-2 right-2 h-0.5 bg-indigo-400 rounded-full opacity-40"></div>
                </div>
              </div>

              {/* Divider Line */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

              {/* Min/Max Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-medium text-gray-600 mb-1">Tinggi Min/Max</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {stats._min?.height && stats._max?.height
                      ? `${stats._min.height} - ${stats._max.height} cm`
                      : "N/A"}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-medium text-gray-600 mb-1">Berat Min/Max</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {stats._min?.weight && stats._max?.weight
                      ? `${stats._min.weight} - ${stats._max.weight} kg`
                      : "N/A"}
                  </div>
                </div>
              </div>

              {/* Z-Score Summary */}
              {stats._avg?.heightZScore !== null && stats._avg?.heightZScore !== undefined && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-yellow-800 mb-1">Rata-rata Z-Score Tinggi Badan</div>
                      <div className="flex items-center gap-4">
                        <div className="text-xl font-bold text-yellow-900">{formatZScore(stats._avg.heightZScore)}</div>
                        <Badge className={`${getWHOHeightStatus(stats._avg.heightZScore).color} text-xs border`}>
                          {getWHOHeightStatus(stats._avg.heightZScore).status.split(" ")[0]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
