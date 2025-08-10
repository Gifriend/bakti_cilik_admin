"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar, Ruler, Weight, AlertTriangle } from 'lucide-react'
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

export function GrowthStatsCard({ childName, stats, latestRecord }: GrowthStatsCardProps) {
  const getZScoreStatus = (zScore: number | null | undefined) => {
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

  const getStatusIcon = (zScore: number | null | undefined) => {
    if (zScore === null || zScore === undefined) return <Minus className="h-3 w-3" />

    if (zScore >= -2 && zScore <= 2) {
      return <Minus className="h-3 w-3" />
    } else if (zScore < -2) {
      return <TrendingDown className="h-3 w-3" />
    } else if (zScore > 2) {
      return <TrendingUp className="h-3 w-3" />
    }

    return <Minus className="h-3 w-3" />
  }

  const formatZScore = (zScore: number | null | undefined): string => {
    if (zScore === null || zScore === undefined) return "N/A"
    return zScore.toFixed(2)
  }

  const heightStatus = getZScoreStatus(latestRecord?.heightZScore)

  // If no data at all, show empty state
  if (!latestRecord && (!stats || stats._count._all === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Belum Ada Data - {childName}
          </CardTitle>
          <CardDescription>Belum ada data pengukuran yang tersedia untuk ditampilkan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <BarChart3 className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-500">Data akan muncul setelah pengukuran pertama dilakukan</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Current Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Data Terkini - {childName}
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {latestRecord?.date
              ? `Pengukuran terakhir: ${new Date(latestRecord.date).toLocaleDateString("id-ID")}`
              : "Belum ada data pengukuran"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Height Stats */}
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Tinggi Badan</span>
                </div>
                <Badge className={heightStatus.color}>
                  {getStatusIcon(latestRecord?.heightZScore)}
                  {heightStatus.status}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {latestRecord?.height ? `${latestRecord.height} cm` : "N/A"}
              </div>
              {latestRecord?.heightZScore !== null && latestRecord?.heightZScore !== undefined && (
                <div className="text-sm text-blue-600">Z-Score: {formatZScore(latestRecord.heightZScore)}</div>
              )}
            </div>

            {/* Weight Stats */}
            <div className="space-y-2 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Berat Badan</span>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <Minus className="h-3 w-3" />
                  Data
                </Badge>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {latestRecord?.weight ? `${latestRecord.weight} kg` : "N/A"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aggregate Stats Card */}
      {stats && stats._count._all > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Statistik Keseluruhan
            </CardTitle>
            <CardDescription>Ringkasan dari {stats._count._all} pengukuran</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="font-medium text-purple-600 mb-1">Rata-rata Tinggi</div>
                <div className="text-lg font-semibold text-purple-700">
                  {stats._avg?.height ? `${stats._avg.height.toFixed(1)} cm` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <div className="font-medium text-indigo-600 mb-1">Rata-rata Berat</div>
                <div className="text-lg font-semibold text-indigo-700">
                  {stats._avg?.weight ? `${stats._avg.weight.toFixed(1)} kg` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-600 mb-1">Tinggi Min/Max</div>
                <div className="text-sm font-medium">
                  {stats._min?.height && stats._max?.height ? `${stats._min.height} - ${stats._max.height} cm` : "N/A"}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-600 mb-1">Berat Min/Max</div>
                <div className="text-sm font-medium">
                  {stats._min?.weight && stats._max?.weight ? `${stats._min.weight} - ${stats._max.weight} kg` : "N/A"}
                </div>
              </div>
              <div className="col-span-2 p-3 bg-yellow-50 rounded-lg">
                <div className="font-medium text-yellow-700 mb-1">Rata-rata Z-Score Tinggi</div>
                <div className="text-lg font-semibold text-yellow-800">
                  {formatZScore(stats._avg?.heightZScore)}
                  <span className="text-sm font-normal ml-2">({getZScoreStatus(stats._avg?.heightZScore).status})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
