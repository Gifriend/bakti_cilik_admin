"use client"

import { useEffect, useState } from "react"
import { getCompleteGrowthRecords } from "@/lib/firestore"
import type { GrowthRecord } from "@/lib/firestore"
import { Button } from "./ui/button"
import { TrendingUp } from "lucide-react"

interface ChildGrowthListProps {
  childId: string
}

export default function ChildGrowthList({ childId }: ChildGrowthListProps) {
  const [records, setRecords] = useState<GrowthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
const [showForm, setShowForm] = useState(false)

const handleAdd = (month: number) => {
  setSelectedMonth(month)
  setShowForm(true)
}

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const data = await getCompleteGrowthRecords(childId)
      setRecords(data)
      setLoading(false)
    }
    fetchData()
  }, [childId])

  if (loading) return <p>Loading...</p>

  return (
  <div className="space-y-2">
    <div className="text-sm font-medium text-gray-700">
      <TrendingUp className="inline h-4 w-4 mr-1" />
      Growth Records (1-60 months)
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {records.map((record) => (
        <div key={record.month} className="bg-white border rounded-lg p-3 text-sm">
          <div className="font-medium">Month {record.month}</div>
          {record.height ? (
            <>
              <div className="text-gray-700">Height: {record.height} cm</div>
              <div className="text-xs text-gray-500">{record.recordAt.toLocaleDateString()}</div>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 text-xs"
              onClick={() => handleAdd(record.month)}
            >
              + Add
            </Button>
          )}
        </div>
      ))}
    </div>
  </div>
)

}
