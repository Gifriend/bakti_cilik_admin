"use client"

import { useEffect, useState } from "react"
import { getCompleteGrowthRecords, type GrowthRecord } from "@/lib/firestore"
import { Button } from "./ui/button"
import { ChevronDown, ChevronRight, TrendingUp } from "lucide-react"

interface ChildGrowthListProps {
  childId: string
  childName: string
  onAddRecord: (month: number) => void // Tambahkan prop ini
}

export default function ChildGrowthList({ childId, childName, onAddRecord }: ChildGrowthListProps) {
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
      const data = await getCompleteGrowthRecords(childId)
      setRecords(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      {/* Header dengan dropdown toggle */}
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

      {/* Konten yang muncul saat di-expand */}
      {expanded && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {loading ? (
            <p className="text-sm text-gray-500 col-span-full">Loading...</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-gray-500 col-span-full">No records found</p>
          ) : (
            records.map((record) => (
              <div 
                key={record.month} 
                className={`bg-white rounded-lg p-3 text-sm cursor-pointer hover:bg-gray-50 ${
                  record.height ? '' : 'border-2 border-dashed border-orange-300'
                }`}
                onClick={() => !record.height && onAddRecord(record.month)}
              >
                <div className="font-medium">Month {record.month}</div>
                {record.height ? (
                  <>
                    <div className="text-gray-700">Height: {record.height} cm</div>
                    <div className="text-xs text-gray-500">
                      {record.recordAt.toLocaleDateString()}
                    </div>
                  </>
                ) : (
                  <div className="mt-2 text-orange-600 text-xs font-medium">
                    Click to add data
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}