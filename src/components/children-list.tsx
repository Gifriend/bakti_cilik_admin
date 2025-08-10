"use client"

import { useState, useEffect } from "react"
import { getChildrenByMother, type Child } from "@/lib/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Baby } from "lucide-react"
import GrowthRecordsList from "./growth-records-list"
import AddGrowthRecordModal from "../app/admin/components/AddGrowthRecordModal" 

interface ChildrenListProps {
  motherId: string
  adminId: string
}

export default function ChildrenList({ motherId, adminId }: ChildrenListProps) {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [showAddGrowth, setShowAddGrowth] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChildren()
  }, [motherId])

  const loadChildren = async () => {
    try {
      const childrenData = await getChildrenByMother(motherId)
      setChildren(childrenData)
    } catch (error) {
      console.error("Error loading children:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddGrowth = (child: Child, month?: number) => {
    setSelectedChild(child)
    setSelectedMonth(month ?? null)
    setShowAddGrowth(true)
  }

  const handleCloseModal = () => {
    setShowAddGrowth(false)
    setSelectedChild(null)
    setSelectedMonth(null)
  }

  const handleSuccess = () => {
    handleCloseModal()
    loadChildren()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading children...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-blue-600" />
            Children ({children.length})
          </CardTitle>
        </CardHeader>
      </Card>

      {children.map((child) => (
        <Card key={child.id} className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Baby className="h-5 w-5 text-blue-600" />
                  {child.name}
                </CardTitle>
              </div>
              <Button
                size="sm"
                onClick={() => handleOpenAddGrowth(child)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Growth
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <GrowthRecordsList
              childId={child.id!}
              childName={child.name}
              onAddRecord={(month) => handleOpenAddGrowth(child, month)}
            />
          </CardContent>
        </Card>
      ))}

      {showAddGrowth && selectedChild && (
        <AddGrowthRecordModal
          open={showAddGrowth}
          onClose={handleCloseModal}
          childId={selectedChild.id!}
          childName={selectedChild.name}
          adminId={adminId}
          initialMonth={selectedMonth ?? undefined}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
