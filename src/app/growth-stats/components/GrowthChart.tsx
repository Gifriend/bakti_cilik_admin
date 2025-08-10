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

export function GrowthChart({ data, childName, chartType }: GrowthChartProps) {
  // Combine records and WHO curves data
  const chartData = data.whoCurves.map((curve) => {
    const record = data.records.find((r) => Math.abs(r.ageInMonths - curve.ageInMonths) < 0.5)
    return {
      ageInMonths: curve.ageInMonths,
      actualValue: record ? (chartType === "height" ? record.height : record.weight) : null,
      zMinus3: chartType === "height" ? curve.zMinus3 : null,
      zMinus2: chartType === "height" ? curve.zMinus2 : null,
      z0: chartType === "height" ? curve.z0 : null,
      z2: chartType === "height" ? curve.z2 : null,
      z3: chartType === "height" ? curve.z3 : null,
    }
  })

  const chartConfig = {
    actualValue: {
      label: `${chartType === "height" ? "Tinggi Badan" : "Berat Badan"} Aktual`,
      color: "hsl(var(--chart-1))",
    },
    z0: {
      label: "Median WHO",
      color: "hsl(var(--chart-2))",
    },
    zMinus2: {
      label: "-2 SD",
      color: "hsl(var(--chart-3))",
    },
    z2: {
      label: "+2 SD",
      color: "hsl(var(--chart-4))",
    },
    zMinus3: {
      label: "-3 SD",
      color: "hsl(var(--chart-5))",
    },
    z3: {
      label: "+3 SD",
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

              {/* WHO Reference Lines */}
              <Line
                type="monotone"
                dataKey="zMinus3"
                stroke="var(--color-zMinus3)"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="zMinus2"
                stroke="var(--color-zMinus2)"
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
