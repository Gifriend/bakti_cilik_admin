"use client"

import { useState, useEffect } from "react"
import { getCompleteGrowthRecords, type GrowthRecord } from "@/lib/firestore"
import { TrendingUp, ChevronDown, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GrowthRecordsListProps {
  childId: string
  childName: string
  onAddRecord: (month: number) => void // <- untuk aksi 
}

export default function GrowthRecordsList({ childId, childName, onAddRecord }: GrowthRecordsListProps) {
  const [records, setRecords] = useState<GrowthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (expanded) loadGrowthRecords()
  }, [childId, expanded])

  const loadGrowthRecords = async () => {
    try {
      const recordsData = await getCompleteGrowthRecords(childId)
      setRecords(recordsData)
    } catch (error) {
      console.error("Error loading growth records:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 font-medium text-gray-800">
          <TrendingUp className="h-4 w-4" />
          Growth Records for {childName}
        </div>
        {expanded ? <ChevronDown /> : <ChevronRight />}
      </div>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {loading ? (
            <p className="text-gray-500 col-span-full">Loading...</p>
          ) : (
            records.map((record) => (
              <div key={record.month} className="bg-white rounded p-2 border">
                <div className="font-semibold">Month {record.month}</div>
                <div className="text-gray-600">
                  {record.height ? `Height: ${record.height} cm` : <em className="text-red-400">Tidak ada data</em>}
                </div>
                {record.height === "" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 text-xs"
                    onClick={() => onAddRecord(record.month)}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
