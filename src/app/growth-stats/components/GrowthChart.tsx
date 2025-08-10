"use client"

import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Info } from "lucide-react"
import type { GrowthChartData } from "@/app/service/growth-api"

interface GrowthChartProps {
  data: GrowthChartData
  childName: string
  chartType: "height" | "weight"
}

interface ChartPoint {
  ageInMonths: number
  actualValue?: number
  z0?: number
  "z-2"?: number
  z2?: number
  "z-3"?: number
  z3?: number
  "z-1"?: number
  z1?: number
}

// WHO Growth Indicators
const getGrowthIndicator = (chartType: "height" | "weight") => {
  return chartType === "height" ? "Tinggi Badan menurut Umur (TB/U)" : "Berat Badan menurut Umur (BB/U)"
}

const getWHOInterpretation = (chartType: "height" | "weight") => {
  if (chartType === "height") {
    return {
      title: "Interpretasi Status Gizi (TB/U)",
      ranges: [
        { range: "< -3 SD", status: "Sangat Pendek (Severely Stunted)", color: "text-red-600" },
        { range: "-3 SD s/d < -2 SD", status: "Pendek (Stunted)", color: "text-orange-600" },
        { range: "-2 SD s/d +2 SD", status: "Normal", color: "text-green-600" },
        { range: "> +2 SD", status: "Tinggi", color: "text-blue-600" },
      ],
    }
  } else {
    return {
      title: "Interpretasi Status Gizi (BB/U)",
      ranges: [
        { range: "< -3 SD", status: "Berat Badan Sangat Kurang", color: "text-red-600" },
        { range: "-3 SD s/d < -2 SD", status: "Berat Badan Kurang", color: "text-orange-600" },
        { range: "-2 SD s/d +1 SD", status: "Berat Badan Normal", color: "text-green-600" },
        { range: "> +1 SD", status: "Risiko Berat Badan Lebih", color: "text-yellow-600" },
      ],
    }
  }
}

export function GrowthChart({ data, childName, chartType }: GrowthChartProps) {
  // Transform WHO curves data to match the chart format
  const transformWHOCurves = (): ChartPoint[] => {
    const ageMonthsSet = new Set<number>()

    // Collect all age months from WHO curves
    data.whoCurves.forEach((curve) => {
      curve.points.forEach((point) => {
        ageMonthsSet.add(point.ageInMonths)
      })
    })

    // Sort age months
    const sortedAgeMonths = Array.from(ageMonthsSet).sort((a, b) => a - b)

    // Create chart data structure
    return sortedAgeMonths.map((ageInMonths) => {
      const chartPoint: ChartPoint = { ageInMonths }

      // Add WHO curve values for each z-score
      data.whoCurves.forEach((curve) => {
        const point = curve.points.find((p) => p.ageInMonths === ageInMonths)
        if (point) {
          const key = `z${curve.z}` as keyof ChartPoint
          chartPoint[key] = point.value
        }
      })

      // Add actual child data if available
      const record = data.records.find((r) => Math.abs(r.ageInMonthsAtRecord - ageInMonths) < 0.5)
      if (record) {
        chartPoint.actualValue = chartType === "height" ? record.height : record.weight
      }

      return chartPoint
    })
  }

  const chartData = transformWHOCurves()
  const growthIndicator = getGrowthIndicator(chartType)
  const whoInterpretation = getWHOInterpretation(chartType)

  const chartConfig = {
    actualValue: {
      label: `${chartType === "height" ? "Tinggi Badan" : "Berat Badan"} Aktual`,
      color: "hsl(var(--chart-1))",
    },
    z0: {
      label: "Median WHO (Z=0)",
      color: "hsl(var(--chart-2))",
    },
    "z-2": {
      label: "Z=-2 SD",
      color: "hsl(var(--chart-3))",
    },
    z2: {
      label: "Z=+2 SD",
      color: "hsl(var(--chart-4))",
    },
    "z-3": {
      label: "Z=-3 SD",
      color: "hsl(var(--chart-5))",
    },
    z3: {
      label: "Z=+3 SD",
      color: "hsl(var(--chart-5))",
    },
    "z-1": {
      label: "Z=-1 SD",
      color: "hsl(var(--chart-6))",
    },
    z1: {
      label: "Z=+1 SD",
      color: "hsl(var(--chart-7))",
    },
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Chart Card */}
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <TrendingUp className="h-5 w-5" />
            <span className="truncate">
              Grafik {chartType === "height" ? "Tinggi Badan" : "Berat Badan"} - {childName}
            </span>
          </CardTitle>
          <CardDescription className="text-blue-100 text-sm">
            {growthIndicator} - Perbandingan dengan kurva pertumbuhan WHO
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <ChartContainer config={chartConfig} className="min-h-[300px] sm:min-h-[400px]">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <XAxis
                  dataKey="ageInMonths"
                  type="number"
                  scale="linear"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(value) => `${value} bln`}
                  fontSize={12}
                />
                <YAxis
                  domain={["dataMin - 5", "dataMax + 5"]}
                  tickFormatter={(value) => `${value}${chartType === "height" ? " cm" : " kg"}`}
                  fontSize={12}
                />

                {/* WHO Reference Lines */}
                <Line
                  type="monotone"
                  dataKey="z-3"
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls={false}
                  name="Z=-3 SD"
                />
                <Line
                  type="monotone"
                  dataKey="z-2"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  connectNulls={false}
                  name="Z=-2 SD"
                />
                <Line
                  type="monotone"
                  dataKey="z-1"
                  stroke="#eab308"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                  connectNulls={false}
                  name="Z=-1 SD"
                />
                <Line
                  type="monotone"
                  dataKey="z0"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  name="Median (Z=0)"
                />
                <Line
                  type="monotone"
                  dataKey="z1"
                  stroke="#3b82f6"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                  connectNulls={false}
                  name="Z=+1 SD"
                />
                <Line
                  type="monotone"
                  dataKey="z2"
                  stroke="#8b5cf6"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  connectNulls={false}
                  name="Z=+2 SD"
                />
                <Line
                  type="monotone"
                  dataKey="z3"
                  stroke="#ec4899"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls={false}
                  name="Z=+3 SD"
                />

                {/* Actual child data */}
                <Line
                  type="monotone"
                  dataKey="actualValue"
                  stroke="#dc2626"
                  strokeWidth={3}
                  dot={{ fill: "#dc2626", strokeWidth: 2, r: 5 }}
                  connectNulls={false}
                  name={`${childName} (Aktual)`}
                />

                {/* Reference lines for critical zones */}
                <ReferenceLine y={0} stroke="#666" strokeDasharray="1 1" />

                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} iconType="line" />

                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [`${value}${chartType === "height" ? " cm" : " kg"}`, name]}
                      labelFormatter={(value) => `Usia: ${value} bulan`}
                    />
                  }
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* WHO Interpretation Card */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Info className="h-5 w-5" />
            {whoInterpretation.title}
          </CardTitle>
          <CardDescription className="text-green-100 text-sm">
            Standar WHO untuk interpretasi status gizi anak
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3">
            {whoInterpretation.ranges.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {item.range}
                  </Badge>
                  <span className={`font-medium text-sm ${item.color}`}>{item.status}</span>
                </div>
                <div className="h-px flex-1 mx-4 bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Catatan Penting:</p>
                <p className="text-xs leading-relaxed">
                  Grafik ini menggunakan standar pertumbuhan WHO yang berlaku internasional. Konsultasikan dengan tenaga
                  kesehatan untuk interpretasi yang lebih mendalam dan tindakan yang diperlukan.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
