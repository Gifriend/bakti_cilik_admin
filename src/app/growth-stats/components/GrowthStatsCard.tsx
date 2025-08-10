"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface GrowthStatsProps {
  childName: string
  latestHeight?: number
  latestWeight?: number
  heightPercentile?: number
  weightPercentile?: number
  heightStatus?: string
  weightStatus?: string
  lastMeasurementDate?: string
}

export function GrowthStatsCard({
  childName,
  latestHeight,
  latestWeight,
  heightPercentile,
  weightPercentile,
  heightStatus,
  weightStatus,
  lastMeasurementDate,
}: GrowthStatsProps) {
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "normal":
        return "bg-green-100 text-green-800"
      case "stunted":
      case "underweight":
        return "bg-red-100 text-red-800"
      case "tall":
      case "overweight":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "normal":
        return <Minus className="h-3 w-3" />
      case "tall":
      case "overweight":
        return <TrendingUp className="h-3 w-3" />
      case "stunted":
      case "underweight":
        return <TrendingDown className="h-3 w-3" />
      default:
        return <Minus className="h-3 w-3" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistik Pertumbuhan - {childName}</CardTitle>
        <CardDescription>
          {lastMeasurementDate && `Pengukuran terakhir: ${new Date(lastMeasurementDate).toLocaleDateString("id-ID")}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Height Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tinggi Badan</span>
              <Badge className={getStatusColor(heightStatus)}>
                {getStatusIcon(heightStatus)}
                {heightStatus || "N/A"}
              </Badge>
            </div>
            <div className="text-2xl font-bold">{latestHeight ? `${latestHeight} cm` : "N/A"}</div>
            {heightPercentile && <div className="text-sm text-muted-foreground">Persentil: {heightPercentile}%</div>}
          </div>

          {/* Weight Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Berat Badan</span>
              <Badge className={getStatusColor(weightStatus)}>
                {getStatusIcon(weightStatus)}
                {weightStatus || "N/A"}
              </Badge>
            </div>
            <div className="text-2xl font-bold">{latestWeight ? `${latestWeight} kg` : "N/A"}</div>
            {weightPercentile && <div className="text-sm text-muted-foreground">Persentil: {weightPercentile}%</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
