"use client"

import { useState, useEffect } from "react"
import { getChildrenByMother, type Child } from "@/lib/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Baby } from "lucide-react"
import AddGrowthRecordForm from "./add-growth-record-form"
import GrowthRecordsList from "./growth-records-list"

interface ChildrenListProps {
  motherId: string
  adminId: string
}

export default function ChildrenList({ motherId, adminId }: ChildrenListProps) {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
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

  const refreshGrowthRecords = () => {
    setShowAddGrowth(false)
    setSelectedChild(null)
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

      {children.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <div className="text-center text-gray-500">
              <Baby className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No children found</p>
              <p className="text-sm">Add a child to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        children.map((child) => (
          <Card key={child.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Baby className="h-5 w-5 text-blue-600" />
                    {child.name}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>Gender: {child.gender}</span>
                    <span>Added: {child.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedChild(child)
                    setShowAddGrowth(true)
                  }}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Growth
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <GrowthRecordsList childId={child.id!} />
            </CardContent>
          </Card>
        ))
      )}

      {showAddGrowth && selectedChild && (
        <AddGrowthRecordForm
          childId={selectedChild.id!}
          childName={selectedChild.name}
          adminId={adminId}
          onSuccess={refreshGrowthRecords}
          onCancel={() => {
            setShowAddGrowth(false)
            setSelectedChild(null)
          }}
        />
      )}
    </div>
  )
}
