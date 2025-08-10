"use client"

import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
        if (point && chartType === "height") {
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
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Grafik {chartType === "height" ? "Tinggi Badan" : "Berat Badan"} - {childName}
        </CardTitle>
        <CardDescription>Perbandingan dengan kurva pertumbuhan WHO</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[400px]">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <XAxis
                dataKey="ageInMonths"
                type="number"
                scale="linear"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(value) => `${value} bln`}
              />
              <YAxis
                domain={["dataMin - 5", "dataMax + 5"]}
                tickFormatter={(value) => `${value}${chartType === "height" ? " cm" : " kg"}`}
              />

              {/* WHO Reference Lines - Only show for height charts */}
              {chartType === "height" && (
                <>
                  <Line
                    type="monotone"
                    dataKey="z-3"
                    stroke="var(--color-z-3)"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="z-2"
                    stroke="var(--color-z-2)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="z0"
                    stroke="var(--color-z0)"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="z2"
                    stroke="var(--color-z2)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="z3"
                    stroke="var(--color-z3)"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls={false}
                  />
                </>
              )}

              {/* Actual child data */}
              <Line
                type="monotone"
                dataKey="actualValue"
                stroke="var(--color-actualValue)"
                strokeWidth={3}
                dot={{ fill: "var(--color-actualValue)", strokeWidth: 2, r: 4 }}
                connectNulls={false}
              />

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
  )
}
