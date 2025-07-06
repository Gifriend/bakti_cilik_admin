"use client"

import { useState, useEffect } from "react"
import { getGrowthRecords, type GrowthRecord } from "@/lib/firestore"
import { TrendingUp } from "lucide-react"

interface GrowthRecordsListProps {
  childId: string
}

export default function GrowthRecordsList({ childId }: GrowthRecordsListProps) {
  const [records, setRecords] = useState<GrowthRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGrowthRecords()
  }, [childId])

  const loadGrowthRecords = async () => {
    try {
      const recordsData = await getGrowthRecords(childId)
      setRecords(recordsData)
    } catch (error) {
      console.error("Error loading growth records:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading growth records...</div>
  }

  if (records.length === 0) {
    return (
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        No growth records yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <TrendingUp className="h-4 w-4" />
        Growth Records ({records.length})
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {records.map((record) => (
          <div key={record.id} className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="font-medium">Month {record.month}</div>
            <div className="text-gray-600">Height: {record.height} cm</div>
            <div className="text-xs text-gray-500">{record.recordAt.toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
