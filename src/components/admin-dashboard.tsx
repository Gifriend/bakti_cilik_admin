"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getAllMothers, type User } from "@/lib/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus, Baby } from "lucide-react"
import AddChildForm from "./add-child-form"
import ChildrenList from "./children-list"

export default function AdminDashboard() {
  const [mothers, setMothers] = useState<User[]>([])
  const [selectedMother, setSelectedMother] = useState<User | null>(null)
  const [showAddChild, setShowAddChild] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadMothers()
  }, [])

  const loadMothers = async () => {
    try {
      const mothersData = await getAllMothers()
      setMothers(mothersData)
    } catch (error) {
      console.error("Error loading mothers:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage mothers and children data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mothers List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Mothers ({mothers.length})
                </CardTitle>
                <CardDescription>Select a mother to manage children</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {mothers.map((mother) => (
                  <div
                    key={mother.uid}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedMother?.uid === mother.uid ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedMother(mother)}
                  >
                    <div className="font-medium">{mother.name}</div>
                    <div className="text-sm text-gray-500">{mother.email}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Children Management */}
          <div className="lg:col-span-2">
            {selectedMother ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Baby className="h-5 w-5" />
                          Children of {selectedMother.name}
                        </CardTitle>
                        <CardDescription>Manage children and growth records</CardDescription>
                      </div>
                      <Button onClick={() => setShowAddChild(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Child
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {showAddChild && (
                  <AddChildForm
                    motherId={selectedMother.uid}
                    adminId={user?.uid || ""}
                    onSuccess={() => {
                      setShowAddChild(false)
                      // Refresh children list
                    }}
                    onCancel={() => setShowAddChild(false)}
                  />
                )}

                <ChildrenList motherId={selectedMother.uid} adminId={user?.uid || ""} />
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a mother to manage children</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}